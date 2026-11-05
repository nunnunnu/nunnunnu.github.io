---
title: "[Spring boot&Kotlin] @RabbitListener 큐가 생성되지 않는 문제 해결"
category: Spring
tags:
  - spring
  - rabbitmq
  - spring-amqp
  - transaction
  - email
last_modified_at: 2026-07-16
---

## 발단

오래 처리되지 않은 지원서를 자동으로 정리하는 배치를 만들었는데 상태를 바꾼 다음 지원자에게 안내 메일도 보내야 했다(대상 선정 이야기는 다른 글에서)

문제는 <mark class="hltr-cyan">배치 서버에는 메일 발송 코드가 하나도 없다</mark>는것이었다. 메일 템플릿도 SES 발송 서비스도 전부 API 서버에만 있었다
그래서 배치는 MQ에 발행만 하고 API 서버의 리스너가 받아서 메일을 보내게 나눴다

- 배치: 대상 선정 -> 상태 변경 -> 메시지 발행
- RabbitMQ: fanout 익스체인지 -> 큐
- API: 리스너가 소비해서 메일 조립 + 발송

리스너까지 다 만들고 그럼 RabbitMQ에는 뭘 만들어야 하지?를 정리하다가 코드만 보면 다 있는데 실제로는 메일이 한통도 안나갈 뻔한걸 알았다


---

## 선언과 소비는 다른 일이다

RabbitMQ에서 메시지가 가는 길은 세 조각으로 되어있다

- 익스체인지: 발행자가 메시지를 보내는 곳
- 큐: 메시지가 쌓이는 곳. 컨슈머는 큐에서 꺼낸다
- 바인딩: 이 익스체인지로 온 메시지를 이 큐로 보내라는 연결

이 세개가 브로커에 미리 만들어져(선언돼) 있어야 메시지가 흐르는데 선언과 소비는 별개의 동작이다

Spring AMQP에서 선언은 `RabbitAdmin`이 한다
`Queue` `Exchange` `Binding` 타입의 빈이 등록돼 있으면 `RabbitAdmin`이 브로커에 처음 연결될때 그 빈들을 브로커에 선언해준다(Spring Boot는 `RabbitAdmin`을 자동으로 등록해줌)

```kotlin
// 예시 코드
//이렇게 빈으로 선언해야 RabbitAdmin이 브로커에 만들어준다
@Bean
fun noticeExchange() = FanoutExchange("sample.notice.fanout")

@Bean
fun noticeQueue() = Queue("sample.notice.q")

@Bean
fun noticeBinding(): Binding =
    BindingBuilder.bind(noticeQueue()).to(noticeExchange())
```

반면 `@RabbitListener(queues = ["sample.notice.q"])`는 <mark class="hltr-cyan">이미 있는 큐를 구독할 뿐</mark> 큐를 만들어주지 않는다
리스너 쪽에서 선언까지 하고 싶으면 `queuesToDeclare`나 `bindings` 속성을 써야 한다

```kotlin
// 예시 코드
@RabbitListener(
    bindings = [QueueBinding(
        value = Queue("sample.notice.q", durable = "true"),
        exchange = Exchange("sample.notice.fanout", type = ExchangeTypes.FANOUT),
    )]
)
fun handle(event: NoticeMailEvent) { /* ... */ }
```

이 프로젝트는 익스체인지 / 큐 / 바인딩을 코드에서 선언하지 않는 방식이라서 리스너 코드만 추가해서는 브로커에 아무것도 안생긴다

---

## 큐가 없으면 무슨 일이 생기나

양쪽 다 조용하다는게 문제다

- 발행하는 쪽
	- 익스체인지가 없으면 브로커가 채널을 닫으면서 `NOT_FOUND - no exchange ..` 에러를 보낸다. 그런데 발행은 비동기라 `RabbitTemplate.convertAndSend`는 예외 없이 정상 리턴하고 에러는 로그에만 남는다
	- 익스체인지는 있는데 바인딩된 큐가 없으면 더 조용하다. fanout 익스체인지는 받은 메시지를 보낼 큐가 없으면 <mark class="hltr-cyan">그냥 버린다</mark>(에러도 로그도 없음)
- 소비하는 쪽
	- 리스너 컨테이너가 구독할 큐를 못찾아서 시작에 실패하거나 재시도 로그를 남기며 대기한다. 설정에 따라 앱 기동 자체가 실패할 수도 있다

이걸 모르고 배포했으면 배치는 열심히 발행하고 상태 변경도 잘 되고 메일만 한통도 안나갔을거다
발행이 실제로 어딘가에 도착했는지 확인하고 싶으면 publisher confirm / return(`mandatory`) 설정을 켜서 라우팅 안된 메시지를 콜백으로 받거나 익스체인지에 alternate exchange를 걸어서 갈곳 없는 메시지를 따로 모으면 된다

---

## 왜 코드에서 선언하지 않았나

그럼 그냥 코드로 선언하면 되지 않나? 싶은데 편한 대신 단점도 있다

- durable 큐는 한번 만들어지면 코드를 되돌려도 브로커에 그대로 남아서 잘못 만든 큐는 브로커에서 손으로 지워야 한다
- 이미 있는 큐를 다른 인자(DLX, TTL 같은)로 다시 선언하면 `PRECONDITION_FAILED - inequivalent arg` 에러로 채널이 닫힌다. 코드의 선언과 브로커의 실제 상태가 어긋나면 배포 순간 리스너가 죽는다
- 앱 계정에 토폴로지를 바꿀 수 있는 권한(configure)이 있어야 한다

그래서 토폴로지는 사람이 관리하고 앱은 쓰기만 하는 방식도 충분히 합리적이라고 생각했고 이번에도 기존 방식대로 브로커 관리 콘솔에서 환경별로 직접 만들었다

- 순서는 익스체인지 -> 큐 -> 바인딩
- fanout은 routing key를 안보기때문에 비워둔다
- dev stage prod 전부. 하나라도 빠지면 그 환경에서만 조용히 메일이 안나간다

어느 방식이든 <mark class="hltr-cyan">누가 만드는지를 먼저 확인</mark>해야 한다. 리스너 코드가 있다고 큐가 있는게 아니었다

---

## 페이로드에는 ID만

메시지에는 메일 본문이나 이메일 주소를 넣지 않고 지원서 ID 리스트만 넣었다

```kotlin
// 예시 코드
data class NoticeMailEvent(
    val applicationIds: List<Long>,
)
```

리스너는 ID로 다시 조회해서 소비하는 시점의 최신 값으로 메일을 만든다
이러면 발행과 소비 사이에 데이터가 바뀌어도 최신 값 기준으로 나가고
배치는 메일 템플릿이나 수신자 언어 설정 같은걸 몰라도 돼서 메일에 관한 지식은 API 서버 한곳에만 있게 된다
이메일 주소 같은 개인정보도 브로커에 쌓이지 않아서 큐에 메시지가 남아있거나 DLQ로 빠져도 ID만 보인다(메시지가 작은건 덤)

대신 소비할때 조회가 한번 더 생기지만 메일 발송에 비하면 무시할만한 비용이다

---

## 수신자별로 실패를 격리한다

리스너 안에서 수신자를 루프로 돌면서 메일을 보내는데 처음 리뷰에 올린 리스너 중 하나는 루프에 try/catch가 없었다
한명 발송이 실패하면 예외가 리스너 밖으로 나가는데 이게 생각보다 큰 문제였다

Spring AMQP 리스너 컨테이너는 리스너가 예외를 던지면 기본으로 그 메시지를 <mark class="hltr-cyan">reject 하고 다시 큐에 넣는다(requeue)</mark>
그러면 같은 메시지가 다시 오고 루프가 처음부터 다시 돈다

- 실패한 수신자 앞쪽 사람들은 같은 메일을 또 받는다
- 실패 원인이 그 수신자에게 고정된 거면(주소가 잘못됐다든가) 계속 실패해서 무한 재전달
- 실패한 수신자 뒤쪽 사람들은 계속 못받는다

그래서 수신자별로 try/catch를 걸어서 한건의 실패가 나머지에 번지지 않게 했다

```kotlin
// 예시 코드
@RabbitListener(queues = ["sample.notice.q"])
fun handle(event: NoticeMailEvent) {
    event.applicationIds.forEach { id ->
        try {
            sendNoticeMail(id)
        } catch (e: Exception) {
            log.error("안내 메일 발송 실패 applicationId={}", id, e)
        }
    }
}
```

재시도는 넣지 않았다. 안내 메일이라 best-effort로 두고 실패는 에러 로그와 알림으로 보이게 했다
재시도가 필요한 메시지라면 횟수 제한이 없는 requeue에 기대지 말고 실패한 건만 따로 DLQ로 보내거나 재시도 횟수를 헤더에 들고 다니는 쪽이 낫다

---

## 메일 보내는 동안 트랜잭션을 잡지 않는다

두 리스너에 `@Transactional(readOnly = true)`가 붙어 있었다. 조회가 있으니까 습관처럼 붙인것이다

그런데 트랜잭션이 열려있는 동안 JPA는 <mark class="hltr-cyan">DB 커넥션을 트랜잭션이 끝날때까지</mark> 붙잡고 있다
이 리스너는 조회 몇번 하고 나면 나머지 시간은 전부 SES 네트워크 호출이라서 수신자가 많으면 메일을 다 보낼때까지 커넥션 하나가 아무일도 안하면서 묶여있게 된다
리스너가 동시에 여러개 돌면 그만큼 커넥션 풀이 비고 전혀 상관없는 API 요청이 커넥션을 못얻어서 느려진다

이 리스너는 스칼라 값 몇개만 읽어서 지연 로딩도 없었고 여러 조회를 한 스냅샷으로 묶어야 할 이유도 없어서 `@Transactional`을 뺐다
트랜잭션 없이 리포지토리를 부르면 조회 한번마다 커넥션을 잠깐 빌렸다가 바로 돌려준다

>[!외부 I/O와 트랜잭션]
>
>트랜잭션 안에서 외부 API나 메일이나 파일 업로드 같은 네트워크 호출을 하면 그 시간만큼 DB 커넥션(쓰기였다면 락까지)을 잡고 있게 된다
>필요한 데이터를 먼저 읽고 트랜잭션을 닫은 다음 외부 호출을 하는게 기본이다
>

---

리스너 코드만 짜면 끝일줄 알았는데 큐를 누가 만드는지부터 리스너 안의 예외랑 트랜잭션까지 챙길게 꽤 많았다
