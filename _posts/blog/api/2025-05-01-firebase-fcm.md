---
title: "[Spring boot&Kotlin] FCM을 사용한 모바일 push 알림 보내기"
category: 외부API연동
tags:
  - spring
  - kotlin
  - fcm
  - firebase
last_modified_at: 2025-05-10
---

## 발단

진행중인 프로젝트의 프론트를 앱에도 출시하게되면서 쪽지함의 알람기능을 안드로이드 앱의 모바일 push 알람으로도 구현하려 알아보기시작했다.

그러다가 발견한 것이 FCM이다
### FCM이란?
Firebase Cloud Messaging의 줄임말으로 구글의 firebase 플랫폼에서 지원하는 메세징 서비스이다. 서버에서 안드로이드 앱으로 메세지를 안정적으로 전달할 수 있다

백엔드 서버의 구현방법만 정리하였다

---
## 구현

1. Firebase 프로젝트 생성
	[Firebase](https://console.firebase.google.com/)접속하여 프로젝트를 생성해준다
	![image](/assets/images/api/IMG-20250520171504.png)
	![image](/assets/images/api/IMG-20250520171504-1.png)
	생성에는 다소 시간이 걸리며 완료되면 다음 단계로 넘어간다
2. 비공개 키 발급
	프로젝트 설정 -> 서비스 계정에서 새 비공개 키 생성 버튼을 눌러 비공개키를 다운로드 받아준다
	![image](/assets/images/api/IMG-20250520171505.png)
	![image](/assets/images/api/IMG-20250520171505-1.png)
3. 다운로드 받은 비공개키를 resources 폴더로 이동한다
	절대로 git에 올리면안된다 꼭 gitIgnore 처리를 먼저 해줘야한다!!!!(깜빡하고 올렸다가 재발급받은사람)
4. gradle 의존성을 추가한다
	```
	implementation 'com.google.firebase:firebase-admin:9.1.1'  
	implementation 'com.squareup.okhttp3:okhttp:4.11.0'
	```
5. 환경변수를 추가한다
	환경변수는 `.env`나 Run Configuration 중 사용하는 방식에 따라 추가하면 된다. 나는 Run Configuration을 사용했다
	![image](/assets/images/api/IMG-20250520171505-2.png)
	![image](/assets/images/api/IMG-20250520171505-3.png)
	추가한 환경변수는 3가지인데
	- FIRE_BASE_FILE:  비밀키 경로(필수)
	- FIRE_BASE_ID: firebase 프로젝트 아이디. firebase에서 조회되는 프로젝트 아이디와 동일하게 작성해준다(필수)
		![image](/assets/images/api/IMG-20250520171505-4.png)
	- TOPIC_MSG: topic 통신 시 사용하는 topic 이름(선택)
	변수명은 자유롭게 설정해주어도 괜찮다
6. 환경변수로 저장한 변수 명을 yaml에 선언해준다
	```
	fire_base:  
		file: ${FIRE_BASE}  
		fire_base_id: ${FIRE_BASE_ID}
	```
	현재는 topic 기능을 사용하지 않기 때문에 선언하지 않았다
7. 코드 구현
	```kotlin
	import com.google.auth.oauth2.GoogleCredentials  
	import com.google.firebase.FirebaseApp  
	import com.google.firebase.FirebaseOptions  
	import com.google.firebase.messaging.FirebaseMessaging  
	import com.google.firebase.messaging.FirebaseMessagingException  
	import com.google.firebase.messaging.Message  
	import com.google.firebase.messaging.Notification  
	import jakarta.annotation.PostConstruct  
	import org.springframework.beans.factory.annotation.Value  
	import org.springframework.stereotype.Service  
	import java.io.FileInputStream  
	  
	  
	@Service  
	class FcmService {  
	    @Value("\${fire_base.file}")  
	    private val filePath: String? = null  
	  
	    @Value("\${fire_base.fire_base_id}")  
	    private val projectId: String? = null  
	  
	  
	    @PostConstruct  
	    fun initialize() {  
	        //FireBaseOptions에 비공개키&정보 세팅  
	        val options = FirebaseOptions.builder()  
	            .setCredentials(GoogleCredentials.fromStream(FileInputStream(filePath!!)))  
	            .setProjectId(projectId)  
	            .build()  
	  
	  
	        //initialze  
	        FirebaseApp.initializeApp(options)  
	    }  
	  
	    // fcm 전송  
	    @Throws(FirebaseMessagingException::class)  
	    fun sendMessageByToken(title: String, body: String?, token: String) {  
	        FirebaseMessaging.getInstance().send(  
	            Message.builder()  
	                .setNotification(  
	                    Notification.builder()  
	                        .setTitle(title)  
	                        .setBody(body)  
	                        .build()  
	                )  
	                .setToken(token)  
	                .build()  
	        )  
	    }  
	}
	```
	FCM 전송기능만 사용할거라 해당 메서드만 구현햇다
8. 로직 구현
	나는 사용자에게 쪽지가 전송될때 모바일 알람도 전송할것이기 때문에
	모바일 알람을 담당하는 eventListener에 전송 로직을 추가해줄것이다.
	그전에, 먼저 사용자가 어플을 깔았는지, 디바이스의 정보를 먼저 알수있어야한다
	간단하게 프론트에서 모바일 어플에 접속했을때 서버로 전송해주는 fcm token을 api로 받아 user 정보에 추가해준다
	(프론트에서 api를 호출하는 과정은 생략하겠다)	
	```kotlin
	//controller
	@PostMapping("/fcm")  
	fun setUserToken(  
	    @AuthenticationPrincipal user: UserDetails,  
	    @RequestParam token: String  
	) {  
	    log.info("[fcm token update] start")  
	    userService.updateFcmToken(user.username, token)  
	}

	//service
	@Transactional  
	fun updateFcmToken(userId: String, token: String) {  
	    val user = userReader.getUserByIdOrThrow(userId)  
	    user.fcmToken = token  
	    userRepo.save(user)  
	    log.info("[fcm token update] end")  
	}
	```
	그리고 알람을 보낼때, fcmToken이 있는 유저만 가져와서 해당 유저에게만 메세지를 전송한다.
	```kotlin
	@Async  
	@EventListener  
	fun notifySend(data: NotifyInfo) {  
		//중략
	    val fcmTokens = userService.getUserFcmInfo(data.userSeqs)  
	    log.info("[NotifyEventListener] 알람 전송 시작 - 모바일 알람 ${fcmTokens.size}개")  
	    fcmTokens.forEach { fcmService.sendMessageByToken(title = data.title, body = data.message, token = it) }  
	  
	}
	```
	이것이 내가 구현한 알람 전용 이벤트 리스너인데, 하단에 위에서 구현한 FcmService의 sendMessageByToken메서드를 실행해 전송한다

이번 상황처럼 알림 수신 실패가 치명적이지 않다면 단순히 로그만 남겨도 무방하다.  
그러나 <mark class="hltr-cyan">알림이 반드시 전달되어야 하는 요구사항이라면 실패 상황에 대비한 에러 처리와 복구 전략이 필요</mark>하다.

