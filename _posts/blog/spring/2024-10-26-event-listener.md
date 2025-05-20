---
title: "[Spring boot&Kotlin] Spring Event Listener로 이메일 전송 비동처리하기"
category: Spring
tags:
  - spring
  - kotlin
---
## 발단

회원가입 이메일 인증을 기능을 구현한 후 테스트를 해보았을때 api 응답속도가 3초정도 딜레이가 되는것을 확인했다.

고민 결과 다음과같은 결론을 도출했다
1. 애초에 회원 도메인에서 이메일 전송 업무를 전담하는것은 회원 도메인에 과도한 책임 부여
2. 메일 도메인과 회원 도메인간의 강한 결합도, 회원 도메인의 낮은 응집도를 가지고있음
3. 이메일 전송 완료 전에 api 응답을 받아도 상관없음(이메일 수신여부와 api응답 성공과 관계없음. 이메일 재 전송버튼을 만드는것이 더 사용성이좋음)

그리하여 spring의 event listener + 비동기를 사용하여 문제를 해결하고자 하였다

### Spring Event Listener 소개

Spring의 이벤트 시스템은 하나의 컴포넌트에서 발생한 동작(이벤트)을 다른 컴포넌트가 감지하고 처리할 수 있게 해주는 구조이다. 
이때 컴포넌트 간 직접적인 의존 없이 데이터를 전달할 수 있다는 점이 큰 장점.

이번 사례를 기준으로 설명하자면 회원이 인증메일 발송 버튼을 누르는 순간. 메일이 전송되게되는데
회원이 인증메일 발송 버튼을 눌러 api가 실행되는것이 트리거[<mark class="hltr-cyan">이벤트 발행(Publish)</mark>]. 메일 전송이 트리거로 인해 시작되는 동작[<mark class="hltr-cyan">이벤트 수신(listen</mark>)]이다

- 흐름
	1. 사용자가 api 요청
	2. Controller/Service에서 이벤트 객체 생성
	3. 어떤 비즈니스 로직이 실행되는 도중, ApplicationEventPublisher를 이용하여 이벤트를 발행시킨다
	4. Spring은 @EventListener 메서드를 찾아 자동으로 호출한다

여기서 이벤트 리스너가 활성화 될때 같은 쓰레드로 활성화되느냐 쓰레드 풀에서 가져온 다른 쓰레드로 활성화 되느냐에따라 동기/비동기로 나뉜다

이번에는 다른 쓰레드로 분리하기위해 비동기로 진행하였다

---
## 구현
### 이벤트를 전달할 객체 생성

```kotlin
data class EmailEvent(  
	val email: String,  
	val userId: String? = null) {    
}
```

### 이벤트 리스너 구현

```kotlin
@Component  
class EmailEventListener() {   
	@Async //비동기 설정
	@EventListener    
	fun codeSendPush(data: EmailEvent) {  
		//실행할 메소드 호출 or 구현
	}  
}
```

만약 비동기를 사용하지 않을거라면 @Async를 제거하면 된다

비동기를 사용할 것이라면 main Application class 에 @EnableAsync 어노테이션도 추가해주어야한다

```kotlin
@EnableAsync  
class MyApplication  

fun main(args: Array<String>) {  
	runApplication<MyApplication>(*args)  
}
```

### 기존 서비스에서 이벤트 publish

```kotlin
@Service
class EmailService(private val publisher: ApplicationEventPublisher) {  
fun sendEmail(email: String) {  
	/* 수행 로직 */
	
	val event = EmailEvent(email = email)  
	publisher.publishEvent(event)  
}
```


---

이번에는 api의 응답결과가 이메일 전송여부와 크게 상관이없어서(외부 서비스를 호출하기때문에 사용자에게 재 요청을 유도하는것이 낫다고 판단했음) 비동기로 사용하였다

그러나 DB 트랜잭션이 끝나기 전에 비동기 이벤트가 실행되면, 데이터 정합성 문제가 생길 수 있다
따라서 중요한 DB 작업 완료 후 실행되어야 한다면 `TransactionPhase.AFTER_COMMIT` 사용을 고려하거나 동기로 처리해야 하기때문에 상황에 따라 동기/비동기 방식을 선택해야한다

나는 이번 프로젝트에서

- 회원이 탈퇴하면서 작성한 글/댓글 등을 일괄 삭제할때 -> 동기.

- 회원의 게시글에 달린 댓글 알람을 보낼때(수신 여부 중요하지않음) -> 비동기

으로 개발할 예정이다