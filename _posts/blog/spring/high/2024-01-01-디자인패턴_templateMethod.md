---
생성일: 2024-01-01
하위태그:
  - 스프링 핵심원리 - 고급
last_modified_at: 2024-01-01
title: "[김영한 스프링 핵심원리 - 고급] 디자인 패턴 - templateMethod"
category: Spring
tags:
  - spring
  - 김영한스프링핵심원리-고급
---
그전 강의 챕터에서 비지니스로직을 구현할때마다 로그를 찍을때

```java
@GetMapping("/v2/request")
	public String request(String itemId) {
		TraceStatus status = null;
		try {
			 status = trace.begin("OrderController.requset()");
			orderService.orderItem(status.getTraceId(), itemId);
			trace.end(status);
			return "ok";
		} catch (Exception e) {
			trace.exception(status, e);
			throw e; //예외를 꼭 다시 던져줘야함
		}
	}
```

위처럼 중복 코드를 작성해주었는데
이것을 해결하기위해서는 디자인패턴중에 템플릿메소드패턴을 사용하면 좋음


```java
package com.hello.high.trace.template.code;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class AbstractTemplate {

	public void execute() {
		long startTime = System.currentTimeMillis();
		//비지니스로직 실행
		call(); //상속

		long endTime = System.currentTimeMillis();
		long resultTime = endTime - startTime;
		log.info("resultTime = {}", resultTime);
	}

	protected abstract void call();
}
```

추상클래스를 구현한 후, 실제 비지니스로직은 call로 호출함. call로 호출하는 실제 비지니스로직은

```java
package com.hello.high.trace.template.code;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class SubClassLogin1 extends AbstractTemplate {
	@Override
	protected void call() {
		log.info("비지니스로직2 실행");
	}
}
```

추상클래스를 상속받아 오버라이드해주면됨.

그러나 이렇게하면 불필요한 클래스가 계속 생성된다는 단점이있기때문에

```java
@Test
	void templateMethodV2() {
		AbstractTemplate template1 = new AbstractTemplate() {
			@Override
			protected void call() {
				log.info("비지니스로직1 실행");
			}
		};

		log.info("클래스이름1 = {}", template1.getClass());
		template1.execute();
		AbstractTemplate template2 = new AbstractTemplate() {
			@Override
			protected void call() {
				log.info("비지니스로직2 실행");
			}
		};
		log.info("클래스이름2 = {}", template2.getClass());
		template2.execute();
	}
```

이렇게 익명의 클래스를 오버라이드해주면 클래스 생성없이 비지니스로직을 구현가능함.
물론 전보다 코드가 길어지긴했지만 불필요한 클래스가 너무 증가하면 프로젝트가 너무 복잡해지고…힘들어요..

위 디자인패턴을 로그 어플리케이션에 적용하면

```java
package com.hello.high.trace.template;

import com.hello.high.trace.TraceStatus;
import com.hello.high.trace.logtrace.LogTrace;

public abstract class AbstractTemplate<T> {
	private final LogTrace trace;

	public AbstractTemplate(LogTrace trace) {
		this.trace = trace;
	}

	public T execute(String message) {
		TraceStatus status = null;
		try {
			status = trace.begin(message);
			T result = call();
			trace.end(status);
			return result;
		} catch (Exception e) {
			trace.exception(status, e);
			throw e;
		}
	}

	protected abstract T call();
}
```

```java
package com.hello.high.app.v4;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hello.high.trace.TraceStatus;
import com.hello.high.trace.logtrace.LogTrace;
import com.hello.high.trace.template.AbstractTemplate;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class OrderControllerV4 {
	private final OrderServiceV4 orderService;
	private final LogTrace trace;

	@GetMapping("/v4/request")
	public String request(String itemId) {
		AbstractTemplate<String> template = new AbstractTemplate<String>(trace) {
			@Override
			protected String call() {
				orderService.orderItem(itemId);
				return "ok";
			}
		};
		return template.execute("OrderController.request()");
	}

}
```

```java
package com.hello.high.app.v4;

import org.springframework.stereotype.Service;

import com.hello.high.trace.TraceStatus;
import com.hello.high.trace.logtrace.LogTrace;
import com.hello.high.trace.template.AbstractTemplate;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderServiceV4 {
	private final OrderRepositoryV4 orderRepository;

	public void orderItem(String itemId) {
		AbstractTemplate<String> template = new AbstractTemplate<String>(trace) {
			@Override
			protected String call() {
				orderRepository.save(itemId);
				return null;
			}
		};
		template.execute("OrderServiceV4.orderItem()");
	}
}
```

```java
package com.hello.high.app.v4;

import java.security.InvalidParameterException;

import org.springframework.stereotype.Repository;

import com.hello.high.trace.TraceStatus;
import com.hello.high.trace.logtrace.LogTrace;
import com.hello.high.trace.template.AbstractTemplate;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class OrderRepositoryV4 {
	public void save(String itemId) {
		AbstractTemplate<String> template = new AbstractTemplate<String>(trace) {
			@Override
			protected String call() {
				if (itemId.equals("ex")) {
					throw new InvalidParameterException("예외");
				}
				sleep(1000);
				return null;
			};
		};
		template.execute("OrderRepositoryV4.save()");
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

이렇게 중복 코드를 하나의 클래스로 관리가능.

그러나 템플릿메소드패턴을 사용하면 상속에서 오는 단점을 그대로 안고감. 자식클래스가 부모 클래스와 컴파일 시점에 강하게 결합된다는 문제가있음
자식입장에서는 부모의 기능을 사용하지않는데 강하게 의존(부모클리스의 코드가 자식클래스에 적혀있음)하는 상태가되서 부모클래스 수정 시 자식클래스에도 영향을 줄수있음
또한 상속구조때문에 별도의 클래스나 익명 내부 클래스를 만들어야하는 부분이 복잡함
⇒ 전략 패턴을 사용하면 이러한 단점을 해결 가능함