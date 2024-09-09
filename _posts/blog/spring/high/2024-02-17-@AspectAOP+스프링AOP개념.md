---
생성일: 2024-02-17
하위태그:
  - 스프링 핵심원리 - 고급
last_modified_at: 2024-02-17
category: Spring
tags:
  - spring
  - 김영한스프링핵심원리-고급
  - AOP
title: "[김영한 스프링 핵심원리 - 고급] @Aspect AOP + 스프링 AOP 개념"
---
빈 후처리기에서 프록시 생성시 빈으로 등록된 어드바이저를 모두 조회하여 적용대상여부를 판단한다고했는데

여기서 어드바이저를 편리하게 등록하려면?

@Aspect어노테이션을 사용하면됨

```java
package com.example.proxy.config.V6_aop.aspect;

import com.example.proxy.trace.TraceStatus;
import com.example.proxy.trace.logtrace.LogTrace;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;


@Slf4j
@Aspect
public class LogTraceAspect {
    private final LogTrace logTrace;

    public LogTraceAspect(LogTrace logTrace) {
        this.logTrace = logTrace;
    }

    //advice 로직이 구현됨
    @Around("execution(* com.example.proxy.app..*(..))")
    public Object execute(ProceedingJoinPoint joinPoint) throws Throwable {
        TraceStatus status = null;
        try {
            String message = joinPoint.getSignature().toShortString();
            status = logTrace.begin(message);
            //로직 호출
            Object result = joinPoint.proceed();
            logTrace.end(status);
            return result;
        } catch (Exception e) {
            logTrace.exception(status, e);
            throw e;
        }
    }
}
```

```java
package com.example.proxy.config.V6_aop;

import com.example.proxy.config.AppV1Config;
import com.example.proxy.config.AppV2Config;
import com.example.proxy.config.V6_aop.aspect.LogTraceAspect;
import com.example.proxy.trace.logtrace.LogTrace;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@Import({AppV1Config.class, AppV2Config.class})
public class AopConfig {
    @Bean
    public LogTraceAspect logTraceAspect(LogTrace logTrace) {
        return new LogTraceAspect(logTrace);
    }
}
```

```java
package com.example.proxy;

@Import(AopConfig.class)
@SpringBootApplication(scanBasePackages = "com.example.proxy.app")
public class ProxyApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProxyApplication.class, args);
    }

    @Bean
    public LogTrace logTrace() {
      return new ThreadLocalLogTrace();
    }
}
```

![images](/assets/images/high/IMG-20240909155646.png)

1. 실행 : 스프링 애플리케이션 로딩 시점에 자동 프록시 생성기 호출
2. 모든 @Aspect빈을 조회 : 스프링컨테이너에서 @Aspect가 붙은 스프링 빈을 모두 조회
3. 어드바이저 생성 : @Aspect 어드바이저 빌더를 통해 @Aspect 어노테이션 정보를 기반으로 어드바이저 생성
4. @Aspect 기반 어드바이저 저장 : 생성한 어드바이저를 @Aspect 어드바이저 빌더 내부에 저장

— @Aspect
BeanFactoryAspectJAdvisorsBuilder클래스. @Aspect의 정보를 기반으로 포인트컷, 어드바이스, 어드바이저를 생성, 보관
@Aspect 정보를 기반으로 어드바이저를 만들고 @Aspect 어드바이저 빌더 내부 저장소에 캐시. 캐시에 어드바이저가 이미 만들어져 있으면 저장된 어드바이저 반환

![images](/assets/images/high/IMG-20240909155646-1.png)

1. 빈 객체 생성
2. 전달
3. 어드바이저 조회
    1. 스프링컨테이너의 Advisor 빈조회
    2. @Aspect Advisor 조회 : @Aspect 어드바이저 빌더 내부에 저장된 어드바이저 모두 조회
4. 프록시 적용 대상 여부 체크
5. 프록시 생성
6. 빈 등록

---

지금까지 요구사항을 적용하기위해 프록시를 사용하여 처리를 했는데 이처럼

여러 메소드에서 공통으로 사용해야하는 부가 기능(해당객체가 제공하는 고유의 기능을 보조하기위한 기능)을 **<mark class="hltr-cyan">횡단관심사</mark>** 라고한다

스프링 AOP는 여기서 횡단 관심사를 전문으로 해결하는 기술이다=
1. 핵심 기능과 부가기능을 분리하여
2. 한번의 구현으로 원하는곳 모든 곳에 일괄로 부가기능을 적용
3. 애스팩트(관점)을 사용한 프로그래밍 = 관점지향프로그래밍(AOP)라고 함
4. 대표적인 기능으로는 [AspectJ 프레임워크](https://www.eclipse.org/aspectj/)가 있음. 스프링도 AOP를 지원하지만 Aspect의 문법을 차용하고 일부만 제공함
5. 적용방식은 크게 3가지가 있는데
    - 컴파일 시점 - 위빙
        - .java 소스 코드를 컴파일러를 사용해 .class를 만드는 시점에 부가기능 로직을 추가함. AspectJ가 제공하는 특별한 컴파일러를 사용해야하는데 .class를 디컴파일해보면 애스펙트 관련 호출하는 코드가 들어감  
            = 부가기능 코드가 핵심 기능이있는 컴파일된 코드 주변에 붙어버림  
            이렇게 원본로직이 부가기능이 추가되어버리는것을 위빙(Weaving)이라고 함  
            
        - 단점 : 특별한 컴파일러가 필요, 복잡
    - 클래스 로딩시점
        - 자바를 실행하면 자바언어는 .class파일을 JVM 내부의 클래스 로더에 보관. 이때 중간에서 .class파일을 조작한 다음 JVM에 올릴 수 있음. 자바 언어는 .class를 JVM에 저장하기 전에 조작할 수 있는 기능을 제공함(java instrumentation)  
            참고로 많은 모니터링 툴들이 이 방식을 사용함  
            
        - 클래스 로딩시점에 애스펙트를 적용하는 것을 로드타임 위빙이라함
        - 단점 : 자바를 실행할때 특별한 옵션(java -javaagent)를 통해 클래스 로더 조작기를 지정해야하는데 이 부분이 번거롭고 운영하기 어려움
    - **런타임시점(프록시)**
        - 컴파일도 끝나고 클래스로더에 클래스도 다 올라가서 이미 자바가 실행된 다음(자바 main메소드 실행 후) 자바언어가 제공하는 범위 안에서 부가기능을 적용
        - 스프링과같은 컨테이너의 도움을 받고 프록시와 DI, 빈 포스트 프로세서같은 개념을 총 동원해야한다. 최종적으로 프록시를 통해 스프링 빈에 부가기능을 적용할 수 있음
        - 지금까지 강의에서 학습한 것
        - 프록시를 사용하기때문에 AOP기능에 일부 제약이있으나 특별한 컴파일러나 복잡한 옵션없이 스프링만 있으면 AOP를 적용할 수 있음
- AOP 적용 위치
    - 적용 가능 지점(조인포인트) : 생성자, 필드 값 접근, static 메소드 접근, 메서드 실행
        - 이렇게 AOP를 적용할 수 있는 지점을 조인 포인트라고 함
    - AspectJ를 사용하여 컴파일 시점과 클래스 로딩 시점에 적용하는 AOP는 바이트 코드를 실제 조작하기 때문에 해당 기능을 모든 지점에 다 적용 가능
    - 프록시 방식을 사용하는 스프링 AOP는 메소드 실행 지점에서만 AOP를 적용
        - 프록시는 메소드 오버라이딩 개념으로 동작. 따라서 생성자, static메서드, 필드 값 접근에는 프록시 개념이 적용불가능함
        - <mark class="hltr-cyan">프록시를 사용하는 스프링 AOP의 조인포인트는 메서드 실행으로 제한됨</mark>
    - 프록시를 사용하는 스프링 AOP는 스프링 컨테이너가 관리할 수 있는 스프링 빈에만 AOP를 적용가능함
❗스프링은 AspectJ를 차용하는것이지 직접 사용하는것이 아님
❗그렇다면 조인포인트에 제한이있는 스프링 AOP보다는 Aspect를 직접 사용하는것이 좋은것이 아닌가? → 불필요하게 공부해야할 내용이 많고 어지간하면 스프링 AOP로도 대부분의 문제를 해결 가능하기때문에 굳이 AspectJ를 공부할 필요는 없음

— 용어 정리
- **포인트컷(Pointcut)**
    - 조인 포인트 중에서 어드바이스가 적용될 위치를 선별하는 기능
    - 주로 AspectJ 표현식을 사용해서 지정
    - 프록시를 사용하는 스프링 AOP는 메서드 실행 지점만 포인트컷으로 선별 가능
- **타켓(Target)**  
    어드바이스를 받는 객체, 포인트컷으로 결정  
- **어드바이스(Advice)**
    - 부가 기능
    - 특정 조인 포인트에서 Aspect에 의해 취해지는 조치
    - Around(주변), Before(전), After(후)와 같은 다양한 종류의 어드바이스가 있음
- **애스펙트(Aspect)**
    - 어드바이스 + 포인트컷을 모듈화 한 것
    - @Aspect를 생각하면 됨
    - 여러 어드바이스와 포인트 컷이 함께 존재
- **어드바이저(Advisor)**
    - 하나의 어드바이스와 하나의 포인트 컷으로 구성
    - 스프링 AOP에서만 사용되는 특별한 용어
- **위빙(Weaving)**
    - 포인트컷으로 결정한 타켓의 조인 포인트에 어드바이스를 적용하는 것
    - 위빙을 통해 핵심 기능 코드에 영향을 주지 않고 부가 기능을 추가 할 수 있음
    - AOP 적용을 위해 애스펙트를 객체에 연결한 상태
        - 컴파일 타임(AspectJ compiler)
        - 로드 타임
        - 런타임, 스프링 AOP는 런타임, 프록시 방식
- **AOP 프록시**
    - AOP 기능을 구현하기 위해 만든 프록시 객체, 스프링에서 AOP 프록시는 JDK 동적 프록시 또는CGLIB 프록시이다.