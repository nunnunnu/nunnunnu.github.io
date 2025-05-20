---
title: "[spring boot&Kotlin] WebSocket으로 실시간 통신 구현하기"
category: Spring
tags:
  - spring
  - kotlin
  - socket
  - websocket
last_modified_at: 2025-02-06
---

## 발단
진행중인 프로젝트에 쪽지함을 개발하면서, 안읽은 알람수를 프론트 화면에서 실시간으로 업데이트 해주고싶었다

새로운 쪽지가 도착했다는 서버의 event가 발생했을때 사용할 수 있는 방법은 4가지가있다

- polling
	- client가 요청을 보낼때만 server가 응답함
	- event가 발생할때마다 매번 새로고침을 하거나 주기적으로 API polling을 해야 실시간성이 보장됨.
	- 서버 부담 급증, 클라이언트에서도 실시간정도의 빠른응답은 기대하기 어려움
	- http 오버헤드 발생
	- 일정한 시간에 갱신되는 서버 데이터의 경우 유용하게 사용할 수 있음(1시간마다 갱신되는 차트 등)
- long polling
	- 서버측에서 접속을 열어두는 시간을 길게 가짐
	- 클라이언트는 응답이 올때까지 계속 기다리다가 서버측에서 event가 발생하면 응답을 전달하고 연결이 종료됨 -> 클라이언트에서 재요청을 날려 다음이벤트를 기다림
	- polling보단 서버의 부담이 덜함
	- 동시에 이벤트가 발생한다면 서버의 부담이 급증함
- WebSocket 방식
	- HTTP와는 다르게 WebSocket은 **클라이언트-서버 간 양방향 통신**이 가능한 프로토콜
	- 최초에는 HTTP 핸드셰이크를 통해 연결을 맺고(기존의 80, 443 포트로 접속해도 양방향 통신이 가능함, CORS나 인증 과정을 기존과 동일하게 사용 가능), 그 다음부터는 지속적인 소켓 연결을 통해 실시간 데이터를 주고받음
	- Spring에서는 **STOMP 프로토콜**과 함께 사용하는 경우가 많은데, 이는 메시지 전송 규격을 정해주는 일종의 상위 프로토콜임.
- SSE(Server Send Event)
	- 서버의 데이터를 실시간으로, 지속적으로 Streaminggksms rltnf
	- WebSocket의 역할을 하며 더 가벼움
	- WebSocket과 달리 양방향이 아닌 Server -> Client 로 message를 일방적으로 push하는 작업에 유용
	- HTTP API만으로 쉽게 구현 가능

이번 나의 상황에는 SSE가 더 적합했지만
추후에 개발할 투표 기능의 구조가 제대로 잡히지않은 상태였기에
투표기능에서는 webSocket을 적용하게 될수도있겠다고 판단했다(실시간 상호작용이 필요할 수도 있어서 양방향 통신이 가능해야할수도 있음)

확장가능성을 고려해 이번에는 WebSocket을 사용하여 구현하였다

---
## 구현

### gradle 의존성 추가

```
implementation 'org.springframework.boot:spring-boot-starter-websocket'
```
spring websocket의존성을 추가해준다

### webSocektConfig

```kotlin
import org.springframework.context.annotation.Configuration  
import org.springframework.messaging.simp.config.MessageBrokerRegistry  
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker  
import org.springframework.web.socket.config.annotation.StompEndpointRegistry  
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer  
  
@Configuration  
@EnableWebSocketMessageBroker  
class WebSocketConfig : WebSocketMessageBrokerConfigurer {  
  
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {  
        // 클라이언트가 연결할 수 있는 엔드포인트 설정  
        registry.addEndpoint("/ws")  
            .setAllowedOriginPatterns(
	            "http://localhost:8081",
				//중략
            )  
            .withSockJS() // SockJS 지원  
    }  
  
    override fun configureMessageBroker(registry: MessageBrokerRegistry) {  
        // 메시지 브로커 설정  
        registry.enableSimpleBroker("/alarm") //전송할 주소 설정
        // 개발단계에서는 simpleBroker, 추후 Redis Pub/Sub 등으로 확장 가능
  
    }  
}
```

### 로직 구현

```kotlin
@Service
class Service(private val messagingTemplate: SimpMessagingTemplate) {
	fun sendSocketAlarm(userSeq: Long): Long {  
	    log.info("[socket 채널 전송] start")  
	    val count = 1 //실제 값 구현 로직 생략
	    log.info("메시지 전송 중: ${userSeq}에게 $count 전송")  
	    messagingTemplate.convertAndSend("/alarm/$userSeq", count)  //DTO 등 전송 값 변환 가능
	    log.info("[socket 채널 전송] end")  
	    return count  
	}
}
```
alaram 채널에 userSeq를 넣어 회원간 채널을 별도로 생성하여 값을 전송하는 로직을 구현하였다
`/alarm/{userSeq}` 형태의 구독 경로는 topic 구독 방식으로, 사용자마다 개별 채널을 통해 실시간 데이터를 수신하게된다

### 프론트 수신 구현(vue.js)

```javascript

import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';


connectWebSocket() {
	const socket = new SockJS(BASE_URL + '/ws');
	this.stompClient = Stomp.over(socket)
	this.stompClient.connect(
		{}, () => {
		try {
			this.connected = true;
			this.stompClient.subscribe(`/alarm/${this.userSeq}`, (message) => {
				const data = JSON.parse(message.body);
				this.data = data;
			});
		} catch (error) {
			console.error("WebSocket 연결 처리 중 오류 발생:", error);
		}
	},
	(error) => {
		console.error("WebSocket 연결 실패:", error);
	});
	
	this.stompClient.activate();
}
```

![image](/assets/images/spring/IMG-20250520161627.png)

![image](/assets/images/spring/IMG-20250520161627.gif)


연결에 성공하고 소켓수신에따라 안읽은 쪽지수가 실시간으로 올라가는것을 확인할 수 있다

해당케이스는 user별로 소켓을 연결한것이라
로그아웃시 소켓연결 해제, 로그인시 소켓 연결같은 작업도 필요하여 구현해주었지만
프론트의 작업이기에 글로 정리하지는 않았다

