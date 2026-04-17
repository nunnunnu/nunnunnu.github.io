---
title: "[Spring] 비동기 환불 설계 리뷰에서 잡은 Spring/JPA 함정들 - 자기 호출, rollback-only, JPQL LIMIT"
category: Spring
tags:
  - spring
  - transaction
  - jpa
  - kotlin
  - design-review
last_modified_at: 2026-04-17
---

## 발단

결제된 티켓 여러 건을 한번에 환불하는 기능을 비동기 구조로 설계했다
돈이 나가는 기능이라 구현에 들어가기 전에 설계 문서를 여러 차례 리뷰했는데 문서에 넣어둔 의사 코드 수준의 Kotlin 코드에서 Spring/JPA를 쓸때 흔히 밟는 함정이 꽤 나왔다
여기 적은건 전부 코드가 나가기 전 설계 문서 단계에서 잡아서 문서에 반영한 것들이다

설계 뼈대는 이렇다
- 요청이 오면 메인 서버가 <mark class="hltr-cyan">상태 변경 + 환불 task INSERT를 한 트랜잭션</mark>으로 처리하고 바로 응답
- 배치는 주기적으로 처리할 task를 찾아서 메인 서버의 내부 API를 호출만 함
- task 상태 전이(PENDING -> PROCESSING -> COMPLETED / FAILED)는 메인 서버 한곳에서만

메시지 큐 대신 DB 테이블을 큐로 쓴건 상태 변경과 task 생성을 한 트랜잭션에 묶을 수 있어서였다
메시지 큐를 쓰면 "DB는 커밋됐는데 발행은 실패"를 막으려고 outbox 테이블이 따로 필요하기때문
배치도 Spring Batch 없이 `@Scheduled`로 충분했다(작업 규모에 비해 메타 테이블이 과했음)

---

## 1. 자기 호출은 @Transactional을 지나가지 않는다

제일 큰건 이거였다. task 하나를 처리하는 `process()` 안에서 같은 클래스의 메서드를 `this`로 부르고 있었다

```kotlin
// 예시 코드 (문제 있는 설계)
@Service
class RefundWorker(private val repo: RefundTaskRepository) {

    fun process(taskId: Long) {
        if (!tryClaim(taskId)) return   // this.tryClaim()
        val result = executeRefund(taskId)
        markCompleted(taskId, result)   // this.markCompleted()
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun tryClaim(taskId: Long): Boolean = repo.claim(taskId, now()) == 1  // @Modifying UPDATE

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun markCompleted(taskId: Long, result: RefundResult) { /* 엔티티 상태 변경 */ }
}
```

의도는 claim/환불/완료 처리를 각각 별도 트랜잭션으로 나누는 것이었는데 이 코드에서는 `REQUIRES_NEW`가 하나도 동작하지 않는다

그럼 왜 안될까?
Spring은 `@Transactional`이 붙은 빈을 프록시로 감싸서 등록한다
다른 빈이 이 빈을 주입받으면 실제로 받는건 프록시고 메서드를 부르면 <mark class="hltr-cyan">프록시가 먼저 트랜잭션을 열고</mark> 진짜 객체의 메서드를 호출한다

```text
// 예시 코드
외부 빈 -> RefundWorker 프록시 -> (트랜잭션 처리) -> 진짜 RefundWorker.process()
진짜 RefundWorker.process() -> this.tryClaim()   // this는 프록시가 아니라 진짜 객체
```

`process()` 안에서 `this.tryClaim()`을 부르면 이미 프록시 안쪽이라 어노테이션이 붙어있어도 트랜잭션 처리가 통째로 빠진다. 에러도 경고도 없음;;

그러면 설계에서 기대한게 줄줄이 무너진다
- `process()` 자체엔 트랜잭션이 없으니 `tryClaim`의 `@Modifying` UPDATE는 트랜잭션 없이 실행된다
	- 리포지토리 인터페이스에 직접 선언한 쿼리 메서드에는 기본으로 트랜잭션이 안 붙어서 `TransactionRequiredException: Executing an update/delete query`
- `markCompleted`에서 엔티티 값을 바꿔도 flush 해줄 트랜잭션이 없어서 반영이 안됨
- "단계마다 별도 트랜잭션"이라는 전제 자체가 성립하지 않음

### 해결: 트랜잭션 경계를 별도 빈으로

상태 전이 메서드를 별도 빈으로 빼서 주입받게 했다. 이제 호출이 프록시를 거친다

```kotlin
// 예시 코드
@Component
class RefundStateWriter(private val repo: RefundTaskRepository) {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun tryClaim(taskId: Long, now: LocalDateTime): Boolean = repo.claim(taskId, now) == 1

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun markCompleted(taskId: Long, now: LocalDateTime) { /* ... */ }
}

@Service
class RefundWorker(private val stateWriter: RefundStateWriter) {
    fun process(taskId: Long) {
        if (!stateWriter.tryClaim(taskId, nowKst())) return  // 프록시를 거친다
        // ...
    }
}
```

`TransactionTemplate`으로 트랜잭션 범위를 코드로 직접 감싸거나 `@Lazy`로 자기 자신(프록시)을 주입받아서 `self.tryClaim()`으로 부르는 방법도 있는데
상태 전이만 모아둔 빈이 있으면 트랜잭션 경계가 어디인지 클래스 단위로 보여서 이쪽이 읽기 편했다

>[!Kotlin이면 하나 더]
>
>Kotlin 클래스와 메서드는 기본이 final이다. CGLIB 프록시는 상속으로 메서드를 덮어쓰는 방식이라 final이면 끼어들 수가 없다
>보통은 kotlin-spring(all-open) 플러그인이 `@Component`, `@Transactional` 같은 어노테이션이 붙은 클래스를 자동으로 open 해줘서 문제가 안되는데 이 플러그인이 없는 모듈이면 자기 호출이 아니어도 트랜잭션이 안 걸릴 수 있다
>

---

## 2. 예외를 catch해도 트랜잭션은 이미 rollback-only다

task를 만드는 쪽에는 "같은 구매 건에 활성 task가 이미 있으면 unique 제약에 걸릴테니 그 예외는 잡고 넘어가자"는 의도가 있었다

```kotlin
// 예시 코드 (문제 있는 설계)
@Transactional
fun cancelAndEnqueue(purchaseIds: List<Long>) {
    cancelTickets(purchaseIds)
    purchaseIds.forEach {
        try {
            taskRepo.save(RefundTask.of(it))
        } catch (e: DataIntegrityViolationException) {
            // 이미 있으면 skip
        }
    }
}
```

`taskRepo.save()`도 사실 `@Transactional`이 붙은 메서드라서(Spring Data의 기본 구현체에 붙어있음) 바깥에 트랜잭션이 있으면 새로 열지 않고 거기에 참여한다

참여한 메서드에서 런타임 예외가 밖으로 던져지면 Spring은 그 메서드가 트랜잭션 주인이 아니니까 직접 롤백은 못하고 대신 <mark class="hltr-cyan">공유 트랜잭션에 rollback-only 표시</mark>를 남긴다고 한다
바깥에서 catch해서 삼켜도 이 표시는 그대로라서 바깥 메서드가 정상 종료하고 커밋하려는 순간

```text
UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only
```

이 나면서 티켓 취소까지 전부 롤백된다

Hibernate 쪽 사정도 있다
영속성 컨텍스트에서 예외가 한번 나면 그 세션 상태는 믿을 수 없다. 실패한 엔티티가 컨텍스트에 남아있다가 다음 flush에서 문제를 일으킬 수 있어서 예외 이후에는 그 세션을 계속 쓰지 않는게 원칙이다

예외가 나는 시점도 애매하다
ID 생성 전략이 IDENTITY면 ID를 받으려고 save 시점에 INSERT가 바로 나가서 catch 블록에 걸리지만 다른 전략이면 INSERT가 flush나 커밋 시점까지 미뤄져서 try 블록 밖에서 터진다. 어느 쪽이든 catch로는 못 막는다

결국 "상태 변경과 task 생성은 같은 트랜잭션으로 원자성 보장"이랑 "중복이면 DB unique 에러를 삼키고 넘어감"은 같이 갈 수가 없어서 둘 중 하나로 정리했다
- 저장 전에 활성 task가 있는지 먼저 확인하고 그 사이에 경합이 나면 예외를 그대로 올려서 요청 자체를 실패시키기
- `INSERT IGNORE`나 `INSERT ... ON DUPLICATE KEY UPDATE` 같은 네이티브 쿼리로 DB에서 중복을 흡수하기
	- 예외가 안나니 rollback-only도 안 생긴다(단 IGNORE는 중복 말고 다른 에러도 경고로 바꾸니 주의)

---

## 3. JPQL에는 LIMIT이 없다

배치는 처리 대상을 한번에 N건씩 끊어서 읽으려고 했고 의사 코드는 이랬다

```kotlin
// 예시 코드 (문제 있는 설계)
@Query("""
    SELECT t.id FROM RefundTask t
    WHERE t.status = 'PENDING' AND (t.nextRetryAt IS NULL OR t.nextRetryAt <= :now)
    ORDER BY t.id
""")
fun findPendingIds(now: LocalDateTime, limit: Int): List<Long>
```

JPA 표준 JPQL 문법에는 <mark class="hltr-cyan">LIMIT이 없다</mark>(Hibernate 6부터 HQL 확장으로 limit 절을 지원하긴 하지만 표준은 아님)
그래서 쿼리 문자열에는 못 넣고 파라미터로 받았는데 Spring Data는 파라미터 이름이 limit이라고 해서 그걸 행 수 제한으로 알아듣지 않는다
limit 값이 실제 SQL에 반영될 길이 없는 시그니처였던 것

Spring Data가 행 수 제한으로 인식하는건 정해져 있다
- `Pageable` 파라미터
- `Limit` 파라미터 (Spring Data 3.2부터)
- `findTop100By..`, `findFirst10By..` 같은 메서드 이름

```kotlin
// 예시 코드
fun findPendingIds(now: LocalDateTime, pageable: Pageable): List<Long>

repo.findPendingIds(now, PageRequest.of(0, CHUNK_SIZE))
```

`Pageable`을 넘기면 Spring Data가 JPA 쿼리에 `setMaxResults`를 걸고 Hibernate가 DB 방언에 맞게 `LIMIT ?`로 바꿔서 보낸다

반환 타입이 `List`면 count 쿼리가 안 나가는데 `Page`로 받으면 전체 건수를 세는 쿼리가 하나 더 나가니까 배치에서는 `List`로 받았다
그리고 청크로 끊어 읽을때는 `ORDER BY`가 꼭 있어야한다. 정렬이 없으면 매번 어떤 행이 먼저 올지 보장이 없다

---

## 4. 멈춘 PROCESSING이 복구 대상으로 안 들어온다

`tryClaim`은 오래 PROCESSING에 멈춰있는 task(처리 중에 서버가 죽은 경우)를 다시 가져갈 수 있게 설계돼 있었다
그런데 배치가 처리 대상을 읽는 쿼리는 PENDING만 보고 있었다. 다시 가져갈 수는 있는데 아무도 다시 가져가라고 넘겨주지 않는 구조였던 것

그래서 조회 조건에 멈춘 PROCESSING을 추가했는데 여기서 NULL을 한번 더 챙겨야 했다

```sql
-- 예시 코드
SELECT id FROM refund_task
 WHERE (status = 'PENDING' AND (next_retry_at IS NULL OR next_retry_at <= :now))
    OR (status = 'PROCESSING' AND (processing_started_at IS NULL
                                   OR processing_started_at < :staleBefore))
 ORDER BY id;
```

`processing_started_at < :staleBefore`만 쓰면 이 컬럼이 NULL인 행은 영원히 안 잡힌다
SQL에서 NULL과의 비교는 참도 거짓도 아닌 UNKNOWN이고 WHERE는 참인 행만 남기기때문
PROCESSING인데 시작 시각이 비어있는건 정상 흐름에선 안 생기지만 수동 보정이나 버그로 한번 생기면 그 task는 어떤 복구 경로에도 안 걸리고 계속 멈춰있게 된다

복구 로직을 만들때는 복구할 수 있는지랑 복구 대상으로 들어오는지를 같이 봐야한다는걸 여기서 느꼈다

---

## 5. 같은 실행 안에서 재시도 횟수를 다 써버리는 루프

배치를 단순하게 바꾼 뒤 한번 더 리뷰하다가 찾은 것이다

배치는 한번 실행될때 처리 대상이 빌때까지 while 루프로 반복 조회했다
그런데 환불이 실패하면 retry 카운트를 올리고 <mark class="hltr-cyan">`next_retry_at`을 null로</mark> 두고 있었다

위 쿼리를 보면 `next_retry_at IS NULL`이면 바로 처리 대상이라 같은 while 루프의 다음 조회에서 방금 실패한 task가 또 나온다
결국 PG 쪽 일시 장애 한번에 같은 실행 안에서 최대 재시도 횟수를 순식간에 다 써버리고 영구 실패가 된다

```kotlin
// 예시 코드
fun handleFailure(task: RefundTask, error: String) {
    task.retryCount++
    if (task.retryCount >= MAX_RETRY) {
        task.fail(error)
    } else {
        task.nextRetryAt = nextBatchRunAt() // null이 아니라 다음 배치 실행 시각
    }
}
```

재시도 간격을 두려는 의도였다면 그 간격이 실제로 다음 실행까지 밀리는지 루프랑 같이 봐야한다

---

## 6. Kotlin 숫자의 `_`는 문자열 안에서는 그냥 문자다

1건당 환불 금액 상한을 상수로 두는 부분이 이렇게 돼 있었다

```kotlin
// 예시 코드
val MAX_REFUND_AMOUNT = BigDecimal("100_000_000") // NumberFormatException
```

`100_000_000`처럼 밑줄을 쓸 수 있는건 숫자 리터럴일때 얘기다. 컴파일러가 소스를 읽을때 밑줄을 무시해주는 문법이기때문
`BigDecimal(String)`은 런타임에 문자열을 자기 규칙(숫자/소수점/부호/지수)으로 파싱하니까 `_`를 만나면 바로 `NumberFormatException`이다

```kotlin
// 예시 코드
val MAX_REFUND_AMOUNT = BigDecimal.valueOf(100_000_000L) // 리터럴이니 밑줄 OK
```

금액 사고를 막으려고 둔 안전장치가 클래스 로딩 시점에 제일 먼저 터지는 코드였다는게 좀 웃펐다
같은 결의 함정으로 `BigDecimal(0.1)`도 있다. double의 근사값이 그대로 들어가서 `0.1000000000000000055..`가 되기때문에 문자열이나 `valueOf`로 만들어야한다

---

## 7. 그 외에 같이 잡은 것들

- `require`로 만든 차단 조건은 `IllegalArgumentException`을 던지는데 이게 재시도 로직에 잡혀서 즉시 차단이 아니라 몇번 재시도한 뒤에야 실패 처리되는 구조였다
	- 재시도해도 결과가 같은 예외는 바로 종료 상태로 보내는 분기 추가
- Kotlin `forEach` 안의 `return@forEach`는 루프를 멈추는게 아니라 다음 원소로 넘어가는 continue다
	- 중단하려던 곳은 `for` + `break`로 변경
- `LocalDateTime.now()`는 JVM 기본 타임존을 따라가서 "다음 배치 실행 시각" 같은 계산이 서버 설정에 따라 달라질 수 있다
	- 시각은 전부 타임존을 고정한 함수 하나로
- 루프 안에서 구매 건을 하나씩 조회하는 N+1
	- `findAllById` 한번으로


---

리뷰에서 나온 지적 중에는 따져보니 문제가 아닌 것도 있었다(어느 순서로 처리돼도 결과가 같은 쪽으로 수렴하는 이론적인 시나리오 같은 것들)
지적을 받는것만큼 근거를 확인해서 거르는것도 리뷰의 일이었고 코드 나가기 전에 이만큼 잡은게 다행이었다
