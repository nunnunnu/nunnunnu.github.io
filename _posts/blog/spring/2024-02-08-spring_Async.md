---
title: "[spring boot] @Async 어노테이션을 활용한 스프링 비동기 구현기"
last_modified_at: 2024-02-14
category: Spring
tags:
  - spring
  - 비동기
  - AOP
---
### 도입 배경

DB의 데이터에서 집계를 해 순위를 매기는 api의 응답시간이 길어져 개선방법을 찾기 시작했다

첫번째 해결방안으로 등장한 것이 파라미터의 제한을 두는 것. 프론트에서 너무 긴 기간을 입력하지 못하도록 막아 응답시간을 조정하는 방식이었다. 그러나 이것은 완벽한 해결방안이 아니기에 기각되었다

두번째 해결방안은 batch를 이용해 원테이블의 데이터를 집계테이블에 넣어 api 조회 시 집계테이블에서 데이터를 조회하는 방법이었다
그러나 애초에 제기된 요구사항의 조건으로 들어오는 파라미터가 너무 복잡해서 집계를 사용해도 성능 상 큰 변화가 없어 기각되었다

세번째 해결방안으로 나온 것이 비동기를 이용한 처리속도 향상 방법이었다.

### 비동기

비동기는 특정 코드가 실행완료되기 전에 다음코드를 실행하는 프로그래밍 패턴을 의미한다.
멀티 스레딩을 이용하여 작업을 분리하고 다음 작업을 실행하는 방법이다.

스프링에서 비동기 구현을 위해 @Async 어노테이션을 활용한다

### 구현
1. @EnableAsync 어노테이션
	```java
	@SpringBootApplication  
	@EnableAsync  
	public class TestApplication {  
	  
	    public static void main(String[] args) {  
	        SpringApplication.run(TestApplication.class, args);  
	    }  
	  
	}
	```
	추가적인 비동기 설정이 필요하지않아 Application 클래스에 @EnableAsync을 선언해주었으나 추가적인 설정이 필요하다면 Async Configuration 클래스를 구현해주어도 무방하다
	```java
	@Configuration
	@EnableAsync  
	public class AsyncConfiguration {  
	  //..(중략)
	}
	```
	스프링의 비동기 처리 기능을 활성화하며 @Async 어노테이션이 붙은 메소드들이 비동기로 실행가능하도록 한하는 어노테이션이다
2. 비동기로 실행할 메소드에 @Async 어노테이션을 선언한다
	```java
	@Service  
	@Slf4j  
	public class TestService {  
	    @Async  
	    public void asyncMethod() throws InterruptedException {  
	        log.info("test3");  
	        Thread.sleep(10000L);  
	        log.info("test4");  
	    }  
	}
	```
	```java
	@RestController  
	@RequiredArgsConstructor  
	@Slf4j  
	public class TestController {  
	    private final TestService testService;  
		
		@GetMapping("/test")  
		public LocalDateTime test() throws InterruptedException {  
		    log.info("test");  
		    testService.asyncMethod();  
		    log.info("test2");  
		    return LocalDateTime.now();  
		}
	}
	```
### 결과
![image](/assets/images/spring/IMG-20241003170301.png)
![image](/assets/images/spring/IMG-20241003170301-1.png)
api를 호출하면 log는 순서대로 test->test2->test3->test4가 실행된다
response 이미지를 보면 37분에 200 ok 응답을 받았으나
test4 로그는 21:38:09에 찍힌 것을 확인 가능하다

비동기를 사용하면 api의 모든 코드가 종료되기 전에 api응답을 받을 수 있으니 신중히 사용하야한다

- 쓰레드 prefix 변경 

	![image](/assets/images/spring/IMG-20241003170301-2.png)
	
	또한 로그의 이 부분이 작업을 처리한 쓰레드의 이름을 표기하는데
	```yml
	spring:  
	  task:  
	    execution:  
	      thread-name-prefix: "TheadName-"
	```
	yaml에 위와같이 쓰레드의 prefix를 설정해주면 
	
	![image](/assets/images/spring/IMG-20241003170302.png)
	
	로그에 찍히는 비동기로 동작하는 쓰레드의 명을 변경가능하다 

### 주의점 
#### 쓰레드 TastExecutor 설정
@Async 어노테이션을 사용하면, 별도의 설정이 없는 한 쓰레드 풀을 사용하지않고 SimpleAsyncTaskExecutor을 사용한다.
SimpleAsyncTaskExecutor는 매 요청마다 새로운 쓰레드를 생성하여 작업을 수행하기때문에 리소스 낭비로 이어지기 쉽다. 이것을 막기 위해서 아래와 같이 yml설정으로 TastExecutor을 설정가능하다
```java
spring:  
  task:  
	execution:  
	  pool:  
		core-size: {쓰레드 풀의 기본 쓰레드 개수}
		max-size: {쓰레드 풀의 최대 쓰래드 개수}
		queue-capacity: {사용가능한 쓰레드가 없을때 대기열 용량}
```
![image](/assets/images/spring/IMG-20241003170302-1.png)
쓰레드 명 뒤에 숫자는 n번째 쓰레드를 의미하는데 아래와 같이 max-size를 지정하면 지정한 갯수의 쓰레드만 한번에 동시 동작이 가능하다

프로젝트에 최대 8개를 max-size로 지정하고 api를 동시에 15번 호출해보면(스프링 부트의 구동 시 필요한 최소 쓰레드개수가 8개었다. 다른 케이스에서도 동일한지는 확인하지 못하였다)
![image](/assets/images/spring/IMG-20241003170302-2.png)
22:01:08 ThreadName-8 부터 ---쓰레드 시작--- 로그가 실행되지않다가 
22:01:15 ThreadName-1 ---쓰레드 종료--- 로그가 찍히자마자
ThreadName-1 이름으로 다시 비동기 쓰레드가 시작되는 것을 알 수 있다

쓰레드의 동시 실행 갯수가 8개이기때문에 8개의 쓰레드가 모두 실행중이면 작업이 종료될때까지 다음 작업을 실행하지않고 대기하는 것이다
또한 대기요청 수가 queue-capacity의 지정 수 보다 높다면 TaskRejectedException이 발생한다
적절한 쓰레드 수는 주기적인 모니터링으로 관찰 후 결정하는것이 좋다

#### 리턴 타입 제한
@Async 어노테이션이 붙은 메소드의 return 타입은 Future 나 void만 올 수 있다
그 외 다른 타입을 선언해준다면 에러가 발생한다
컴파일 시점에서 에러가 발생하지않기때문에 주의해주어야한다
```shell
Invalid return type for async method (only Future and void supported): class java.lang.String
```

#### 내부호출 문제
@EnableAsync 어노테이션을 통해 스프링이 비동기처리를 위한 프록시 객체를 생성하기때문에 스프링 AOP의 내부호출 문제가 동일적용된다
자세한 내용은 [[김영한 스프링 핵심원리 - 고급] 프록시 내부 호출](https://nunnunnu.github.io/posts/%ED%94%84%EB%A1%9D%EC%8B%9C%EB%82%B4%EB%B6%80%ED%98%B8%EC%B6%9C/)글에서 확인 가능하다
```java
@RestController  
@RequiredArgsConstructor  
@Slf4j  
public class TestController {  
	private final TestService testService;  
	
	@Async  
	public void innerAsyncMethod() throws InterruptedException {  
		log.info("---쓰레드 시작---");  
		Thread.sleep(10000L);  
		log.info("---쓰레드 종료---");  
	}  

	//내부 호출 CASE(비동기 작동 안됨)
	@GetMapping("/test")  
	public LocalDateTime test() throws InterruptedException {  
		innerAsyncMethod();  
		return LocalDateTime.now();  
	}  
}
```

#### 예외처리
api를 호출자는 비동기 메소드의 결과를 알 수 없기때문에 요구사항에 맞게 적절한 예외처리가 필요하다

exceptionHandler를 사용하여 에러를 캐치할 수는 있으나 사용자가 api의 성공여부를 알아야한다면 다른 방법이 필요하다

나는 spring batch를 통해 상태값을 수정하는것으로 사용자에게 성공여부를 알려주었지만 프로젝트 요구사항에따라 적절한 추가 로직을 구현해주어야한다
	