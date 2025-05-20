---
title: "[Spring boot&Kotlin] CaffeinCahe 사용해보기"
last_modified_at: 2025-04-13
category: Spring
tags:
  - spring
  - kotlin
  - cache
  - caffeineCache
---

## Cache

- Local Cache
	- 서버에 캐시를 저장
	- 다른서버의 캐시를 참조하기 어려움(서버를 2대이상 두는 경우 서버별로 데이터가 다르게 조회될 수 있어서 데이터 일원화를 위한 별도의 조치 필요)
	- 속도가 빠름
	- 서버에서 캐시를 가지고있기때문에 캐시 용량에 따라 서버에 부담이갈수도 있음. 용량 설정 필수
- Global Cache
	- 별도의 캐시서버를 이용(redis 등)
	- local cache보다는 느리다

나는 작은 프로젝트라 서버를 2대이상 둘 일이 없어서 카페인 캐시를 사용하기로 했다

서버가 구동할때 미리 캐시를 로드해두는 방식도 있지만, 
프로젝트가 그정도로 크지는 않고 하루에 접속을 안하는 유저가 많으니 미리 로딩해두는것은 낭비라고 판단했기에
사용자가 요청했을때만 캐시를 저장하는 방식으로 구현하였다

---

## 구현(코틀린)

- gradle 의존성 추가
```
//cache  
implementation 'org.springframework.boot:spring-boot-starter-cache'  
implementation 'com.github.ben-manes.caffeine:caffeine:3.1.2'
```

- 캐시 타입 별 유효기간, 용량 정의
	enum을 사용해 정의해주었다
```kotlin
@AllArgsConstructor  
@Getter  
enum class CacheType(var cacheName: String,  
                      var expiredTimeAsSec: Long,  
                      var maximumSize: Long) {  
  
	  USER_CACHE("userCache", 60 * 60 * 24, 1000)
  }
```
	
- cacheConfig 구현
```kotlin
@Configuration  
@EnableCaching  
public class CacheConfig {  
  
    @Bean  
    fun cacheManager(): CacheManager {  
        val cacheManager = SimpleCacheManager()  
        val caches = CacheType.entries.map { cacheType ->  
            CaffeineCache(  
                cacheType.cacheName,  
                buildCache(cacheType.expiredTimeAsSec, cacheType.maximumSize)  
            )  
        }  
        cacheManager.setCaches(caches)  
        return cacheManager  
    }  
  
	fun buildCache(expiredTimeAsSec: Long, maximumSize: Long): Cache<Any, Any> {  
        return Caffeine.newBuilder()  
            .recordStats()  
            .expireAfterWrite(expiredTimeAsSec, TimeUnit.SECONDS)  
            .maximumSize(maximumSize)  
            .build();  
	}
}
```
정의해둔 enum 타입을 순회하며 캐시별 용량과 유효기간을 설정해준다. 유효기간이 지난 캐시는 자동으로 삭제된다

- 메서드에 캐시 저장 지정(@Cacheable 어노테이션 사용)
```kotlin
@Cacheable(cacheNames = ["userCache"], key = "#userId")  
fun getUserByIdOrThrow(userId: String): User {  
    log.info("[유저 정보 조회] DB 조회")  
    return userRepo.findByUserId(userId).orElseThrow { IllegalArgumentException() }  
}
```
메서드에 파라미터로 들어온 'userId'를 기준으로 캐시를 저장한다
구조는 key-value 구조라서 userId를 기준으로 반환값인 User객체가 저장되는것이다

1. 처음 메서드를 실행했을때 저장된 캐시가없어서 db에서 값을 가져온다. 이때  "[유저 정보 조회] DB 조회" 라는 로그가 찍히고 조회 쿼리가 실행된다
2. 가져온 User 반환값은 메서드 종료시 카페인 캐시에 저장된다
3. 해당 메서드를 같은 userId로 재 호출했을경우 메서드를 실행하지않고 캐시에서 가져오기 때문에 "[유저 정보 조회] DB 조회" 로그는 실행되지않는다
4. 따라서 DB를 거치지않기때문에 빠르게 데이터를 조회 가능하다

- 서버 구동 후 api 처음 요청
	
	![image](/assets/images/spring/IMG-20250520150545.png)
- api 재요청
	
	![image](/assets/images/spring/IMG-20250520150545-1.png)
	
	DB조회 로그가 찍히지않고, SQL도 찍히지않는다

파라미터 변수명과 key에 지정한 변수명이 다르면 에러가 나니 조심하자(컴파일 수준에서 알수없는 런타임 에러가 발생하니 꼭 다시한번 확인해야한다..(경험담임)
```
IllegalArgumentException: Null key returned for cache operation [Builder[public domain.User userService.getUserByIdOrThrow(java.lang.String)] caches=[userCache] | key='#userId' | keyGenerator='' | cacheManager='' | cacheResolver='' | condition='' | unless='' | sync='false']. If you are using named parameters, ensure that the compiler uses the '-parameters' flag.
```
key에 null값이 들어가든 변수명을 잘못쓰든 같은 에러가 나오니..
값이있는데 키에 null이 왜 나오냐며 혼란스러워하지말자...

---
## 주의사항

### 객체 수정 시 캐시 초기화 - `@CacheEvict` 필수

위에서 설명한 동작 방식을 보면
3. 해당 메서드를 같은 userId로 재 호출했을경우 메서드를 실행하지않고 캐시에서 가져오기 때문에 "[유저 정보 조회] DB 조회" 로그는 실행되지않는다
4. 따라서 DB를 거치지않기때문에 빠르게 데이터를 조회 가능하다

DB를 들리지않고 조회하기때문에 조회속도가 빠르다고 되어있는데,
그렇기때문에 저장된 User객체를 사용자가 수정했을때 캐시는 이 객체가 변경되었는지 확인할 방법이없다

따라서 사용자가 User 객체가 변경될 여지가 있는 API를 호출했을 경우(회원정보 수정, 탈퇴 등)
꼭 @CacheEvict 어노테이션을 붙여서 갱신해주어야한다

```kotlin
@Transactional  
@CacheEvict(cacheNames = ["userCache"], key = "#userId")  
fun updateUser(userId: String, data: UserDto): UserDto {
	//로직 생략
}
```
파라미터로 들어온 userId에 저장되어있는 User객체를 초기화해준다

따라서 다시 User정보를 조회하면 DB조회라는 로그와함께 select 쿼리가 실행되고
변경된 정보로 조회가 된다.
객체 정보가 수정되는 모든 메서드에 @CacheEvict 설정을 해주지않으면
회원이 탈퇴했는데도 캐시 유효기간 내에 로그인을 시도하면 로그인이 된다던가..하는 대참사가 일어날수있으니 잘 확인해주어야한다

나는 사용하지않았지만 @CachePut같은 어노테이션을 사용해 수정하는것도 가능하다
단, 탈퇴같은 삭제로직은 @CacheEvict을 사용해주어야한다
### Spring AOP 문제

카페인 캐시는 Spring AOP로 동작한다.
따라서 AOP가 가지는 문제점을 그대로 답습한다는 의미이다
```kotlin
@Service
class UserService(private val userRepository: UserRepository) {
	@Cacheable(cacheNames = ["userCache"], key = "#userId")  
	private fun getUserByIdOrThrow(userId: String): User {  
	    log.info("[유저 정보 조회] DB 조회")  
	    return userRepo.findByUserId(userId).orElseThrow { IllegalArgumentException() }  
	}

	@Transaction(readOnly = true)
	fun getUser(userId: String): UserDto{
		val user = getUserByIdOrThrow(userId)

		return //userDto 변환 로직
	}
}
```

이런 구조로 구현을 한다고 가정한다면
아무리 getUser를 호출해도 user캐시를 동작하지않는다
spring AOP의 문제인 내부호출이 일어났기 때문이다
가급적 @Cacheable 어노테이션을 붙일 메서드는 class를 별도로 분리하는 것을 추천한다
물론 @Cache* 어노테이션들은 모두 같은 문제를 가지니 다른 @CacheEvict같은 어노테이션도 주의해서 사용해주어야한다
### JpaRepository에 @Cacheable 어노테이션
내부 호출 문제때문에 클래스를 분리하려다보면
그냥 Repository에 직접적으로 @Cacheable 어노테이션을 붙이면안되는건가?라는 생각을 할수도있는데(나임)
물론 가능은 하다 가능은 하나..
[스프링 공식 문서](https://docs.spring.io/spring-framework/reference/integration/cache/annotations.html)를 보면
![image](/assets/images/spring/IMG-20250520150545-2.png)
권장되는 사항은 아닌듯하다
실험해보았을때 캐시적용이 되긴하고, 오류도없긴하지만 정말 너무 소규모 프로젝트라서 계층분리를 시키는게 너무 복잡도를 가중시킨다거나 하는 상황이아니라면 굳이..? 스프링이 권장하지않는다는데 할필요는 없어보인다
### 서버 N개일때 데이터 이원화
각 서버에서 캐시를 가지고있기때문에, @CacheEvict 설정을 해주어도 실제로 수정 API를 수행한 서버만 캐시를 초기화할수있다(글로벌 캐시를 사용한다면 일어나지않은 문제다)

따라서 User에 수정이 일어났음을 API를 호출하지않은 서버에서도 알고 캐시를 초기화할수있는 방법이 필요하다

나는 과거 redis pub/sub 을 이용해 각 서버별로 채널을 구독한 후
객체의 수정이 일어났을떄 메세지를 pub하여 수신한 서버들이 캐시를 초기화해주는 로직을 구현하였다

### 캐시 유효기간 설정
캐시의 유효기간은 서비스의 트래픽 패턴과 데이터 변경 주기에 따라 신중히 설정되어야 한다. 
예를 들어, 트래픽이 많지 않은 소규모 서비스에서는 캐시 유효기간을 너무 짧게 설정하면, 오히려 캐시 적중률이 낮아져 효과가 미미해질것이다.

또한, 자주 갱신되는 데이터에 대해 캐시를 설정하면, 유효기간과 상관없이 갱신 시점마다 캐시가 무효화되므로 캐시의 이점을 제대로 누리기 어렵다

따라서 조회가 빈번하지만 변경이 드문 데이터에 캐시를 적용하고, 그 특성에 맞는 유효기간을 설정하는 것이 바람직하다

