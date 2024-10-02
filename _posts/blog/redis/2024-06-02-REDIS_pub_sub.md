---
last_modified_at: 2024-06-15
title: "[REDIS] Spring boot - REDIS pub/sub 구현(서버 간 캐시 데이터 불일치 해결)"
category: Redis
tags:
  - redis
  - pub/sub
  - spring
  - jpa
---
### 발단
- 프로젝트 구조
![image](/assets/images/redis/IMG-20240929152147.png)
처음에는 단일서버로 개발을 시작하며 서버의 캐시 저장방식을 로컬 카페인 캐시로 결정해 개발을 진행중인 상태에서 
성능을 위해 서버가 늘어나면서 문제가 발생했다

api가 호출되어 캐싱해둔 데이터가 변경/삭제 가 일어났을 경우 1번 서버에서 요청을 처리했다면 
기존 구조로는 2번 서버에서 캐시를 업데이트 할 수 없는 상황이었다

서버간의 캐시 동기화를 위해 2가지 개선안이 나온 상태였다(redis 개설/설정은 이미 되어있는 상황)
1. redis를 사용하여 글로벌 캐시로 구조 변경
2. redis pub/sub을 이용하여 캐시 업데이트 신호 송/수신

이미 프로젝트 막바지라서 캐시구조를 글로벌캐시로 변경하는데 리소스가 많이 든다고 판단이되어 2번으로 결정이되었고 내가 pub/sub 구현을 담당하게되어 pub/sub 을 공부하기 시작했다

### Pub/Sub 이란?
Message Queue 통신 방법 중 하나로 발행자가 특정 채널로 메세지를 송신하면, 채널을 구독한 구독자가 메세지를 수신하는 방법이다.
따라서 pub/sub을 이해하기 위해서는 아래 3가지 개념을 알아야한다

- Publisher(발행자): 특정 메시지를 구독자에게 전송
- Subscriber(구독자): 구독한 채널이 받은 메세지를 수신함
- Channel(채널): 메세지가 전송되는 경로

>[!Redis Pub/Sub 주의점]
>
>Redis를 이용하여 Pub/Sub을 구현할 경우 구독자의 메세지 수신여부와 별개로 메세지를 소멸시킨다.
>구독자의 메세지 송신이 필수인경우는 Redis가 아닌 Kafaka 등의 서비스를 이용해야한다
>

![image](/assets/images/redis/IMG-20240929153847.png)
### Spring boot 구현
#### 1. Listener 구현

```java
public class RedisListener implements MessageListener {  
    private final RedisTemplate<String, String> redisTemplate;  
    private final CacheManager cacheManager;
    private final UserService userService;
  
    @Override  
    public void onMessage(Message message, byte[] pattern) {  
       String userId = redisTemplate.getStringSerializer().deserialize(message.getBody());  
	  
		CaffeineCache cache = (CaffeineCache)cacheManager.getCache("userCache"); //caffeine Cache를 저장할때 사용한 key

		UserDto userInfo = userService.findByUserId(userId);		
		cacheInfo.put(userId, userInfo);
    }  
}
```
MessageListener의 onMessage를 구현한다. 
예시는 사용자의 정보를 업데이트하기때문에 key를 사용자 ID로 잡았다. 
캐시된 정보의 key를 채널에 pub한다고 가정하고 Listener를 먼저 구현한다

만일 메세지를 객체로 받아야한다면 ObjectMapper 를 사용하여 객체로 변환하는 과정이 필요하다

다음으로 로컬 캐시를 update하는 로직을 구현한다. 예시로 작성한 간단한 로직이라 캐시 업데이트 Service로 분리하지않고 메세지 수신에 로직을 바로 구현하였다.

#### 2. Config에 Listener 설정 추가

```java
@Configuration  
public class RedisConfig {

//...중략...

@Bean  
public RedisMessageListenerContainer redisMessageListener(RedisConnectionFactory connectionFactory
	) {  
    RedisMessageListenerContainer container = new RedisMessageListenerContainer();  
    container.setConnectionFactory(connectionFactory);  
     
    container.addMessageListener(UserCacheMessageListener(redisTemplate), new ChannelTopic("cache_user")); //파라미터로 redis 발행할 채널명을 적어줌

    return container;  
}

@Bean  
MessageListenerAdapter UserCacheMessageListener(RedisTemplate<String, String> redisTemplate) {  
    return new MessageListenerAdapter(  
       new RedisListener(redisTemplate, refreshCacheService));  
}
```
Message Listener에 메세지를 수신할 채널을 매핑해준다

#### 3. Publisher 구현
```java
@Service 
public class RedisPublisher { 
	private final RedisTemplate<String, Object> redisTemplate; 
	
	public RedisPublisher(RedisTemplate<String, Object> redisTemplate) { 
		this.redisTemplate = redisTemplate; 
	}
	
	public void publish(ChannelTopic topic ,String data) { 
		redisTemplate.convertAndSend(topic.getTopic(), data); 
	} 
}
```

#### 4. 데이터 수정 시 메세지 발행

```java
@Service 
public class UserService {
	private final RedisPublisher pub;

	public userInfoUpdate(UserUpdateDto data) {
		String userId = data.getUserid();
		// ...유저 정보 수정 로직

		//메세지 publish
		pub.publish(new ChannelTopic("cache_user"), userId);
	}
}
```

유저 정보를 수정하면서 cache_user 채널에 메세지를 발행해주었다

수정 후 캐시갱신 로직을 구현해주지않아도 양쪽 서버의 Listener가 메세지를 수신한 후, 양쪽 서버 모두 캐시 갱신 로직이 실행되어 캐시 데이터 불일치 문제가 해결된다
