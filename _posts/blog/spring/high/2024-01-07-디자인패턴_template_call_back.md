---
생성일: 2024-01-07
하위태그:
  - 스프링 핵심원리 - 고급
최종 편집 일시: 2024-01-07
title: "[김영한 스프링 핵심원리 - 고급] 디자인 패턴 - template call back"
category: Spring
tags:
  - spring
  - 김영한스프링핵심원리-고급
---
-전략패턴에서 구현한

```java
package com.hello.high.trace.strategy.code;

import com.hello.high.trace.strategy.code.strategy.Strategy;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ContextV2 {
	public void execute(Strategy strategy) {
		long startTime = System.currentTimeMillis();
		//비지니스로직 실행
		strategy.call(); //위임
		long endTime = System.currentTimeMillis();
		long resultTime = endTime - startTime;
		log.info("resultTime = {}", resultTime);
	}
}
```

ContextV2는 변하지 않는 템플릿을 의미함

변하는 부분은 파라미터로 넘어온 Strategy에서 처리함

이렇게 다른코드의 인스로서 넘겨주는 실행가능한 코드를 **콜백**이라고 부름

`context.execute(new StrategyLogic2());` -> 여기에서 `new StrategyLogic2()`

`context.execute(new Strategy() { @Override public void call() { *log*.info("비지니스로직3 실행"); }});` -> 여기에서 `new Strategy() { @Override public void call() { *log*.info("비지니스로직3 실행"); }}`

`context.execute(() -> *log*.info("비지니스로직3 실행"));` -> 여기에서 `() -> *log*.info("비지니스로직3 실행")`
부분을 말함
필요에따라 즉시실행하거나 나중에 실행가능함
즉 코드가 호출(call)되는데 실행은 코드를 넘겨준 곳의 뒤(back)에서 실행된다는 뜻

스프링에서는 ContextV2와 같은 전략패턴을 템플릿 콜백 패턴이라고 함(GOF패턴은 아니고 스프링에서만 이렇게 부름. 전략패턴에서 템플릿과 콜백이 강조된 패턴). 스트링에서 ~~template 라는 이름이있으면 템플릿 콜백 패턴임

```java
public interface Callback {
	void call();
}
```

```java
@Slf4j
public class TimeLogTemplate {
	public void execute(Callback callback) {
		long startTime = System.currentTimeMillis();
		//비지니스로직 실행
		callback.call(); //위임
		long endTime = System.currentTimeMillis();
		long resultTime = endTime - startTime;
		log.info("resultTime = {}", resultTime);
	}
}
```

전략패턴과 거의 동일함

```java
/*
	템플릿 콜백 패턴 - 익명내부클래스
	 */
	@Test
	void templateV1() {
		ContextV2  context = new ContextV2();

		log.info("strategyLogic1");
		context.execute(new Strategy() {
			@Override
			public void call() {
				log.info("비지니스로직3 실행");
			}
		});

		context.execute(new Strategy() {
			@Override
			public void call() {
				log.info("비지니스로직4 실행");
			}
		});
		TimeLogTemplate template = new TimeLogTemplate();
		template.execute(new Callback() {
			@Override
			public void call() {
				log.info("~~~");
			}
		});
		template.execute(new Callback() {
			@Override
			public void call() {
				log.info("!!!");
			}
		});
	}

	@Test
	void templateV2() {
		TimeLogTemplate template = new TimeLogTemplate();

		log.info("strategyLogic1");
		template.execute(new Callback() {
			@Override
			public void call() {
				log.info("비지니스로직3 실행");
			}
		});

		template.execute(new Callback() {
			@Override
			public void call() {
				log.info("비지니스로직4 실행");
			}
		});
	}

	@Test
	void templateV3() {
		TimeLogTemplate template = new TimeLogTemplate();

		template.execute(() -> log.info("비지니스로직3 실행"));
		template.execute(() -> log.info("비지니스로직4 실행"));

	}

	@Test
	void templateV4() {
		//인터페이스 내 메소드가 한개만있을때는 람다로 변경 가능
		TimeLogTemplate template = new TimeLogTemplate();
		template.execute(() -> log.info("비지니스로직3 실행"));

		template.execute(() -> log.info("비지니스로직4 실행"));
	}
```

위 패턴을 애플리케이션에 적용시킨다면

```java
package com.hello.high.trace.callback;

public interface TraceCallback<T> {
	T call();
}
```

```java
package com.hello.high.trace.callback;

import com.hello.high.trace.TraceStatus;
import com.hello.high.trace.logtrace.LogTrace;

public class TraceTemplate {
	private final LogTrace trace;

	public TraceTemplate(LogTrace trace) {
		this.trace = trace;
	}

	public <T> T execute(String message, TraceCallback<T> callback) {
		TraceStatus status = null;
		try {
			status = trace.begin(message);
			T result = callback.call();
			trace.end(status);
			return result;
		} catch (Exception e) {
			trace.exception(status, e);
			throw e;
		}
	}
}
```

```java
@RestController
public class OrderControllerV5 {
	private final OrderServiceV5 orderService;
	private final TraceTemplate template;

	public OrderControllerV5(OrderServiceV5 orderService, LogTrace trace) {
		this.orderService = orderService;
		this.template = new TraceTemplate(trace);
	}

	@GetMapping("/v5/request")
	public String request(String itemId) {
		return template.execute("OrderController.request()", new TraceCallback<String>() {
			@Override
			public String call() {
				orderService.orderItem(itemId);
				return "OK";
			}
		});
	}

}
```

```java
@Service
public class OrderServiceV5 {
	private final OrderRepositoryV5 orderRepository;
	private final TraceTemplate template;

	public OrderServiceV5(OrderRepositoryV5 orderRepository, LogTrace logTrace) {
		this.orderRepository = orderRepository;
		this.template = new TraceTemplate(logTrace);
	}

	public void orderItem(String itemId) {
		template.execute("OrderServiceV5.orderItem()", () -> {
			orderRepository.save(itemId);
			return null;
		});
	}
}
```

```java
@Repository
public class OrderRepositoryV5 {
	private final TraceTemplate template;

	public OrderRepositoryV5(LogTrace logTrace) {
		this.template = new TraceTemplate(logTrace);
	}

	public void save(String itemId) {
		template.execute("OrderRepositoryV5.save()", () -> {
			if (itemId.equals("ex")) {
				throw new InvalidParameterException("예외");
			}
			sleep(1000);
			return null;
		});
	}

	private void sleep(int millis) {
		try {
			Thread.sleep(millis);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
	}
}
```

`this.template = new TraceTemplate(trace);`

생성자 파라미터로 받은 logTrace를 이용해 의존관계 주입을 받으면서 필요한 TraceTemplate를 생성함. 참고로 TraceTemplate를 스프링 빈으로 등록해서 주입받아도됨

그러나 지금까지 사용한 템플릿메소드, 전략, 템플릿콜백패턴 모두 원본코드를 수정해야한다는 단점있음
원본코드를 손대지않고 로그추적기를 적용할 수 있는 방법을 찾기위해 프록시의 개념을 먼저 이해해야함