---
title: "[Spring boot&Kotlin] 취소 이벤트 누락 문제 해결(부수효과를 한 곳으로 모으기)"
category: Spring
tags:
  - spring
  - event
  - transactional-event-listener
  - refactoring
last_modified_at: 2026-08-26
---

## 발단

티켓을 취소하는 경로는 세 곳이었다

1. 게스트가 직접 취소
2. 주최자가 관리 화면에서 취소
3. 게스트의 취소 요청을 주최자가 승인

1번 2번으로 취소하면 빈 자리가 대기자에게 넘어가는데 3번으로 취소하면 <mark class="hltr-cyan">자리가 비어도 대기자에게 안 넘어가고</mark> 있었다
취소 자체는 정상이라 에러도 없었다

---

## 진입점과 choke point

이건 부수효과를 어디에 붙이냐의 문제였다. 일단 용어부터

- 진입점(entry point): 요청이 들어오는 곳. 컨트롤러/메시지 리스너/배치/관리자 API 같은 것
- choke point: 어떤 일이 일어날때 <mark class="hltr-cyan">모든 경로가 반드시 지나가는 지점</mark>. 보통 도메인 서비스의 메서드 하나

취소에 딸린 부수효과는 이런것들이었다

- 취소 이벤트 발행 -> 리스너가 대기열의 다음 사람을 승격
- 상태 변경 이벤트 발행 -> 리스너가 관련 데이터 갱신
- 목록 캐시 제거

이게 진입점에 붙어있으면 진입점 수만큼 복사돼야하고 choke point에 붙어있으면 한번만 있으면 된다

---

## 문제의 코드

1번 2번은 컨트롤러에서 취소를 부른 다음 후처리까지 직접 하고 있었다

```kotlin
// 예시 코드
// 진입점 1, 2: 컨트롤러가 후처리까지 한다
@PostMapping("/tickets/{id}/cancel")
fun cancel(@PathVariable id: Long) {
    val result = ticketCancelService.cancel(id)
    eventPublisher.publishEvent(TicketCanceledEvent(result.ticketId))
    eventPublisher.publishEvent(TicketStatusChangedEvent(result.eventId))
    cacheService.evictGuestList(result.eventId)
}
```

3번은 구조가 달라서 승인 서비스 안에서 취소를 바로 실행하고 있었다

```kotlin
// 예시 코드
// 진입점 3: 서비스 직행. 후처리가 하나도 없다
@Transactional
fun approveCancelRequest(requestId: Long) {
    val request = cancelRequestRepository.findById(requestId).orElseThrow()
    cancellationExecutor.execute(request.ticket)
    request.approve()
}
```

---

## 원인

부수효과는 취소라는 사건에 딸린건데 코드는 그걸 1번 2번 컨트롤러에 붙여두었다
그러면 새 경로가 생길때마다 <mark class="hltr-cyan">후처리도 복사해야한다는걸 누군가 기억해야</mark> 한다. 3번은 그걸 놓친 경로였다

이런 누락은 잘 안 보인다

- 취소는 정상이라 예외가 없고
- 리스너는 이벤트가 안 오면 그냥 안 돈다(안 왔다는 로그도 없음)
- 테스트도 보통 취소됐는지만 본다

---

## 해결: choke point로 옮기기

3번 컨트롤러에 1번 2번처럼 코드를 복사하는게 제일 쉬웠지만 서비스 메서드 안에 넣기로 했다
취소 요청 승인은 반드시 이 메서드를 지나가고 필요한 엔티티도 이미 여기서 로드돼있다. 나중에 이 승인을 배치나 관리자 API에서 불러도 후처리가 같이 따라온다

```kotlin
// 예시 코드
@Transactional
fun approveCancelRequest(requestId: Long) {
    val request = cancelRequestRepository.findById(requestId).orElseThrow()
    val ticket = request.ticket

    cancellationExecutor.execute(ticket)
    request.approve()

    // 다른 진입점들이 컨트롤러에서 하던 후처리를 choke point로
    eventPublisher.publishEvent(TicketCanceledEvent(ticket.id))
    eventPublisher.publishEvent(TicketStatusChangedEvent(ticket.eventId))
    cacheService.evictGuestList(ticket.eventId)
}
```

### 트랜잭션 안에서 발행해도 되나?

리스너가 `@TransactionalEventListener(phase = AFTER_COMMIT)`라서 괜찮다

```kotlin
// 예시 코드
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
fun onTicketCanceled(event: TicketCanceledEvent) {
    waitlistService.promoteNext(event.ticketId)
}
```

트랜잭션 안에서 `publishEvent`를 불러도 리스너는 <mark class="hltr-cyan">커밋이 끝난 뒤에</mark> 실행된다
승인이 중간에 실패해서 롤백되면 리스너는 아예 안 돌기때문에 취소되지도 않은 자리를 대기자에게 넘기는 일도 없다
그냥 `@EventListener`였다면 발행하는 순간 바로 실행돼서 롤백돼도 리스너는 이미 돈 뒤였을것이다

---

## 미리보기와 실행도 같은 판정 함수로

같은 시기에 취소 판정에 조건이 하나 추가됐다. 주최자 승인을 기다리는 중인 티켓을 게스트가 직접 취소하면 시점과 상관없이 전액 환불해주는 조건이다

취소에는 지금 취소하면 얼마 돌려받는지 보여주는 미리보기 API가 있는데 미리보기와 실제 취소가 각자 계산하면 조건이 추가될때마다 두군데를 고쳐야한다
하나만 고치면 화면에 보인 금액과 실제 환불 금액이 달라져버린다

그래서 판정 함수에 파라미터를 하나 추가하고 미리보기와 실제 취소 둘 다 이 함수에 같은 값을 넘기게 했다

```kotlin
// 예시 코드
fun decideCancel(
    policy: RefundPolicy,
    now: LocalDateTime,
    eventStartAt: LocalDateTime,
    awaitingHostApproval: Boolean,
): CancelDecision {
    if (awaitingHostApproval) return CancelDecision.fullRefund()
    return policy.decide(now, eventStartAt)
}

// 미리보기와 실제 취소가 같은 함수, 같은 입력
fun preview(ticket: GuestTicket) = decideCancel(
    policyOf(ticket), now(), ticket.eventStartAt,
    awaitingHostApproval = ticket.status == TicketStatus.PENDING,
)

fun cancel(ticket: GuestTicket) {
    val decision = decideCancel(
        policyOf(ticket), now(), ticket.eventStartAt,
        awaitingHostApproval = ticket.status == TicketStatus.PENDING,
    )
    refund(ticket, decision)
}
```

두 응답이 같은 함수를 지나니까 <mark class="hltr-cyan">구조적으로 어긋날 수가 없다</mark>
대기열에서 기다리는 티켓도 상태가 같은 PENDING이라 따로 손대지않아도 같이 커버됐다

생각해보면 후처리를 한 지점으로 모으는거랑 같은 질문(얼마 돌려받나)에 답하는 계산을 한 함수로 모으는건 결국 같은 얘기였다

---

## 대안과 주의점

### 서비스가 너무 많은걸 알게된다

choke point에 후처리를 몰아넣으면 서비스가 캐시나 이벤트 같은 인프라까지 알게된다
한 단계 더 가면 서비스는 도메인 이벤트 하나만 발행하고 캐시 제거나 대기열 승격은 전부 리스너가 맡게 할 수도 있다. 서비스 코드는 취소됐다는것만 말하고 그걸 듣고 뭘 할지는 리스너들이 정하는 구조

### 트랜잭션이 없으면 AFTER_COMMIT 리스너는 안 돈다

`@TransactionalEventListener`는 기본값(`fallbackExecution = false`)이면 <mark class="hltr-cyan">활성 트랜잭션이 없을때 발행된 이벤트를 무시한다</mark>고 한다
choke point 메서드에서 `@Transactional`이 빠지거나 트랜잭션 밖에서 이벤트를 발행하는 경로가 생기면 이번이랑 똑같이 조용히 누락된다
트랜잭션 없이도 받아야하는 이벤트라면 `fallbackExecution = true`를 명시해주면 된다

### 테스트는 부수효과까지

취소됐는지만 보는 테스트는 이번 같은 누락을 못 잡는다
진입점마다 이벤트가 발행됐는지까지 검증하거나 애초에 choke point 하나만 테스트하면 되는 구조로 만들어야한다

---

에러가 안 나는 누락이 제일 늦게 발견된다는걸 다시 느꼈다
