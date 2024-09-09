---
생성일: 2024-01-01
하위태그:
  - 스프링 핵심원리 - 고급
last_modified_at: 2024-01-01
category: Spring
tags:
  - spring
  - 김영한스프링핵심원리-고급
title: "[김영한 스프링 핵심원리 - 고급] ThreadLocal"
---
```java
package com.hello.high.trace.logtrace;

import org.springframework.stereotype.Component;

import com.hello.high.trace.TraceId;
import com.hello.high.trace.TraceStatus;

import lombok.extern.slf4j.Slf4j;

// @Component
@Slf4j
public class FieldLogTrace implements LogTrace {
	private static final String START_PREFIX = "--->";
	private static final String COMPLETE_PREFIX = "<---";
	private static final String EX_PREFIX = "<X-";

	private TraceId traceIdHolder; //traceId 동기화, 동시성 이슈 발생

	@Override
	public TraceStatus begin(String message) {
		syncTraceId();
		TraceId traceId = traceIdHolder;
		Long startTimeMs = System.currentTimeMillis();
		log.info("[{}] {}{}", traceId.getId(), addSpace(START_PREFIX, traceId.getLevel()), message);
		return new TraceStatus(traceId, startTimeMs, message);

	}

	private void syncTraceId() {
		if (traceIdHolder == null) {
			traceIdHolder = new TraceId();
		} else {
			traceIdHolder = traceIdHolder.createNextId();
		}
	}

	@Override
	public void end(TraceStatus status) {
		complete(status, null);
	}

	@Override
	public void exception(TraceStatus status, Exception e) {
		complete(status, e);
	}

	private void complete(TraceStatus status, Exception e) {
		Long stopTimeMs = System.currentTimeMillis();
		Long resultTimeMs = stopTimeMs - status.getStartTimeMs();
		TraceId traceId = status.getTraceId();

		if (e == null) {
			log.info("[{}] {}{} time={}ms", traceId.getId(), addSpace(COMPLETE_PREFIX, traceId.getLevel()), resultTimeMs);
		} else {
			log.info("[{}] {}{} time={}ms", traceId.getId(), addSpace(EX_PREFIX, traceId.getLevel()), resultTimeMs);
		}
		
		releaseTraceId();
	}

	private void releaseTraceId() {
		if (traceIdHolder.isFirstLevel()) {
			traceIdHolder = null;
		} else {
			traceIdHolder = traceIdHolder.createPreviousId();
		}
	}

	private static String addSpace(String prefix, int level) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < level; i++) {
			sb.append((i == level - 1) ? "|" + prefix : "|    ");
		}
		return sb.toString();
	}

	public TraceStatus beginSync(TraceId beforeTraceId, String message) {
		TraceId traceId = beforeTraceId.createNextId();
		Long startTimeMs = System.currentTimeMillis();
		log.info("[{}] {}{}", traceId.getId(), addSpace(START_PREFIX, traceId.getLevel()), message);
		return new TraceStatus(traceId, startTimeMs, message);
	}
}
```

위와같이 그 전의 메소드 호출 레벨을 받아서 로그를 찍는 클래스를 구현함

문제는

**`private TraceId traceIdHolder;`**

이부분
→ 다중 스레드의 환경에서 동시성 문제가 발생할 수 있음
위의 문제를 해결하기위해서는 ThreadLocal을 사용하면됨
여기서 말하는 ThreadLocal이란 각 스레드별로 별도의 저장공간을 의미함. 각 스레드가 처리할 정보를 ThreadLocal에 저장한 후 필요할때 꺼내쓰는 방법.

```java
package com.hello.high.trace.logtrace;

import com.hello.high.trace.TraceId;
import com.hello.high.trace.TraceStatus;

import lombok.extern.slf4j.Slf4j;

// @Component
@Slf4j
public class ThreadLocalLogTrace implements LogTrace {
	private static final String START_PREFIX = "--->";
	private static final String COMPLETE_PREFIX = "<---";
	private static final String EX_PREFIX = "<X-";

	private ThreadLocal<TraceId> traceIdHolder = new ThreadLocal<>();
	@Override
	public TraceStatus begin(String message) {
		syncTraceId();
		TraceId traceId = traceIdHolder.get();
		Long startTimeMs = System.currentTimeMillis();
		log.info("[{}] {}{}", traceId.getId(), addSpace(START_PREFIX, traceId.getLevel()), message);
		return new TraceStatus(traceId, startTimeMs, message);

	}

	private void syncTraceId() {
		TraceId traceId = traceIdHolder.get();
		if (traceId == null) {
			traceIdHolder.set(new TraceId());
		} else {
			traceIdHolder.set(traceId.createNextId());
		}
	}

	@Override
	public void end(TraceStatus status) {
		complete(status, null);
	}

	@Override
	public void exception(TraceStatus status, Exception e) {
		complete(status, e);
	}

	private void complete(TraceStatus status, Exception e) {
		Long stopTimeMs = System.currentTimeMillis();
		Long resultTimeMs = stopTimeMs - status.getStartTimeMs();
		TraceId traceId = status.getTraceId();

		if (e == null) {
			log.info("[{}] {}{} time={}ms", traceId.getId(), addSpace(COMPLETE_PREFIX, traceId.getLevel()), resultTimeMs);
		} else {
			log.info("[{}] {}{} time={}ms", traceId.getId(), addSpace(EX_PREFIX, traceId.getLevel()), resultTimeMs);
		}
		
		releaseTraceId();
	}

	private void releaseTraceId() {
		TraceId traceId = traceIdHolder.get();
		if (traceId.isFirstLevel()) {
			traceIdHolder.remove(); //ThreadLocal 초기화
		} else {
			traceIdHolder.set(traceId.createPreviousId());
		}
	}

	private static String addSpace(String prefix, int level) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < level; i++) {
			sb.append((i == level - 1) ? "|" + prefix : "|    ");
		}
		return sb.toString();
	}

	public TraceStatus beginSync(TraceId beforeTraceId, String message) {
		TraceId traceId = beforeTraceId.createNextId();
		Long startTimeMs = System.currentTimeMillis();
		log.info("[{}] {}{}", traceId.getId(), addSpace(START_PREFIX, traceId.getLevel()), message);
		return new TraceStatus(traceId, startTimeMs, message);
	}
}
```

적용하여 재구현한 로그 클래스

ThreadLocal에 TraceId를 타입지정해주는 방식으로 변경함
`private ThreadLocal<TraceId> traceIdHolder = new ThreadLocal<>();`
이렇게 사용하면 다중 스레드환경에서 traceIdHolder에 동시접근하여도 각각의 저장공간에 traceId를 저장하여 사용하기때문에 안전함
그러나 조심해야할 것이있는데 <mark class="hltr-cyan">요청을 종료할때 무조건 ThreadLocal을 초기화시켜줘야함.</mark>
`traceIdHolder.remove();` 으로 초기화하면됨
이유는 thread가 사용자의 정보를 저장하고 초기화 하지않은경우, 다른 사용자가 요청했을때 저장된 정보를 꺼내어 보여줄수있기때문임.

강의에서 사용된 주요 로직은 중복이 심해서 굳이 블로그에 옮기지는 않음. 다음 강의에서 공통 메소드로 구현될것으로 예상됨.