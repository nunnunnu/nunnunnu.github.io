---
생성일: Invalid date
하위태그:
  - 스프링 핵심원리 - 고급
최종 편집 일시: Invalid date
---
@Bean이나 컴포넌트스캔으로 빈을 등록하면 스프링은 해당 객체를 생성하고 스프링컨테이너 내부에 빈저장소에 등록함. 이후에 등록한 스프링빈을 컨테이너에서 조회해 사용

  

만약 ==**스프링이 빈 저장소에 등록할 목적으로 생성한 객체를 저장하기 직전에 조작**==하고싶다면 사용하는것이 빈후처리기

1. 생성 - 빈 등록 대상 객체 생성
2. 전달 - 스프링이 빈 후처리기에 에 생성객체를 전달
3. 후처리작업 - 빈 후처리기가 생성된 객체를 받아서 조작 or 다른객체로 바꿔치기
4. 등록 - 빈 후처리기가 빈 저장소에 넘겨준 (조작or바꿔치기한)객체를 저장함(스프링이 빈후처리기에 전달한 원본객체는 빈 저장소에 저장되지않음)

⇒ 빈 등록할때 선언한 클래스와 다른 구조로 스프링빈이 등록됨

- 예제
    - 일반적인 빈 등록
        
        ```Java
        package com.example.proxy.postprocessor;
        
        import lombok.extern.slf4j.Slf4j;
        import org.junit.jupiter.api.Assertions;
        import org.junit.jupiter.api.Test;
        import org.springframework.beans.factory.NoSuchBeanDefinitionException;
        import org.springframework.context.ApplicationContext;
        import org.springframework.context.annotation.AnnotationConfigApplicationContext;
        import org.springframework.context.annotation.Bean;
        import org.springframework.context.annotation.Configuration;
        
        @Slf4j
        public class BasicTest {
        
            @Test
            void basicConfig() {
                ApplicationContext applicationContext = new AnnotationConfigApplicationContext(BasicConfig.class); //스프링 빈 등록
        
                //A는 스프링빈으로 등록해서 가능
                A a = applicationContext.getBean("beanA", A.class);
                a.helloA();
        
                //B는 스프링빈으로 등록하지않아서 에러
                Assertions.assertThrows(NoSuchBeanDefinitionException.class, () -> applicationContext.getBean(B.class));
            }
        
            @Configuration
            static class BasicConfig {
                @Bean(name = "beanA")
                public A a() {
                    return new A();
                }
            }
        
            static class A {
                public void helloA() {
                    log.info("helloA");
                }
            }
        
            static class B {
                public void helloB() {
                    log.info("helloB");
                }
            }
        }
        ```
        
    - 빈후처리기 적용 한 후
        
        ```Java
        package com.example.proxy.postprocessor;
        
        import lombok.extern.slf4j.Slf4j;
        import org.junit.jupiter.api.Assertions;
        import org.junit.jupiter.api.Test;
        import org.springframework.beans.BeansException;
        import org.springframework.beans.factory.NoSuchBeanDefinitionException;
        import org.springframework.beans.factory.config.BeanPostProcessor;
        import org.springframework.context.ApplicationContext;
        import org.springframework.context.annotation.AnnotationConfigApplicationContext;
        import org.springframework.context.annotation.Bean;
        import org.springframework.context.annotation.Configuration;
        
        @Slf4j
        public class BeanPostProcessorTest {
        
            @Test
            void basicConfig() {
                ApplicationContext applicationContext = new AnnotationConfigApplicationContext(BasicConfig.class); //스프링 빈 등록
        
                //A로 등록한 빈을 빈 후처리기에서 B로 변경했기때문에 가능
                B b = applicationContext.getBean("beanA", B.class);
                b.helloB();
        
                //A로 등록한 빈을 빈 후처리기에서 B로 변경했기때문에 불가능
                Assertions.assertThrows(NoSuchBeanDefinitionException.class, () -> applicationContext.getBean(A.class));
            }
        
            @Configuration
            static class BasicConfig {
                @Bean(name = "beanA")
                public A a() {
                    return new A();
                }
        
                @Bean
                public AToBPostProcessor helloPostProcessor() {
                    return new AToBPostProcessor();
                }
            }
        
            static class A {
                public void helloA() {
                    log.info("helloA");
                }
            }
        
            static class B {
                public void helloB() {
                    log.info("helloB");
                }
            }
        
            static class AToBPostProcessor implements BeanPostProcessor {
                @Override
                public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
                    log.info("beanName={}, bean={}", beanName, bean);
                    if(bean instanceof A) {
                        return new B();
                    }
                    return bean;
                }
            }
        }
        ```
        

> [!important]  
> @PostConstruct : 스프링 빈 생성 후 빈을 초기화하는 역할을 함근데 빈의 초기화 라는 것은 단순이 @PostConstruct 어노테이션이 붙은 초기화 메소드를 한번 호출만 하면됨 = 생성된 빈을 한번 조작그래서 빈을 조작하는 행위는 빈 후처리기만있어도됨스프링은 CommonAnnotationBeanPostProcessor이라는 빈 후처리기를 자동으로 등록하는데 여기서 @PostConstruct 어노테이션이 붙은 메소드를 호출함= 스프링 스스로도 스프링 내부기능을 확장하기위해 빈후처리기를 사용함  

- 적용

```Java
package com.example.proxy.config.v4_postprocessor.postprocessor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.Advisor;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;

@Slf4j
public class PackageLogTracePostProcessor implements BeanPostProcessor {
    private final String basePackage;
    private final Advisor advisor;

    public PackageLogTracePostProcessor(String basePackage, Advisor advisor) {
        this.basePackage = basePackage;
        this.advisor = advisor;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        log.info("param beanName={}, bean={}", beanName, bean.getClass());

        //프록시 대상여부 체크
        //프록시 대상이아니면 원본반환
        String packageName = bean.getClass().getPackageName();
        if(!packageName.startsWith(basePackage)) {
            return bean;
        }
        //프록시 대상이면 프록시 만들어서 반환
        ProxyFactory proxyFactory = new ProxyFactory(bean);
        proxyFactory.addAdvisor(advisor);

        Object proxy = proxyFactory.getProxy();
        log.info("create proxy: target={}, proxy={}", bean.getClass(), proxy.getClass());
        return proxy;
    }
}
```

```Java
package com.example.proxy.config.v4_postprocessor;

import com.example.proxy.config.AppV1Config;
import com.example.proxy.config.AppV2Config;
import com.example.proxy.config.v3_proxyfactory.advice.LogTraceAdvice;
import com.example.proxy.config.v4_postprocessor.postprocessor.PackageLogTracePostProcessor;
import com.example.proxy.trace.logtrace.LogTrace;
import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.Advisor;
import org.springframework.aop.support.DefaultPointcutAdvisor;
import org.springframework.aop.support.NameMatchMethodPointcut;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Slf4j
@Configuration
@Import({AppV1Config.class, AppV2Config.class})
//v3는 어노테이션써서 자동등록됨
public class BeanPostProcessorConfig {
    @Bean 
    public PackageLogTracePostProcessor logTracePostProcessor(LogTrace logTrace) {
        return new PackageLogTracePostProcessor("com.example.proxy.app", getAdvisor(logTrace));
    }

    private Advisor getAdvisor(LogTrace logTrace) {
        //pointcut
        NameMatchMethodPointcut pointcut = new NameMatchMethodPointcut();
        pointcut.setMappedNames("request*", "order*","save*");

        //advice
        LogTraceAdvice advice = new LogTraceAdvice(logTrace);
        return new DefaultPointcutAdvisor(pointcut, advice);
    }
}
```

```Java
package com.example.proxy;

@Import(BeanPostProcessorConfig.class)
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

이렇게 등록하면 컴포넌트스캔을 통해 저장하는 빈들도 모두 빈후처리기가 적용됨

적용 패키지는 꼭 지정해주는것이 좋음 - 스프링 부트가 기본으로 제공하는 빈 중에서 프록시 객체를 만들 수 없는 빈도 있기때문에 오류가 발생함

그러나 굳이 빈 후처리기를 이렇게 만들어줘야하나? 이미 만들어진것은 없나? → 있음

## 스프링이 제공하는 빈 후처리기

`implementation 'org.springframework.boot:spring-boot-starter-aop` 를 의존성 추가해주어야함

- AutoProxyCreator : 자동 프록시 생성기
    - AnnotationAwareAspectJAutoProxyCreator라는 빈 후처리기가 스프링 빈에 자동 등록됨
    - 스프링 빈으로 등록된 Advisor를 자동으로 찾아 프록시가 필요한곳에 자동으로 적용함
    - AnnotationAwareAspectJAutoProxyCreator는 @AspectJ와 관련된 기능도 자동으로 찾아서 처리해줌

![[assets/images/빈 후처리기 - BeanPostProcessor/IMG-20240909142414.png|IMG-20240909142414.png]]

1. 생성 : 스프링 빈 대상 객체 생성
2. 전달 : 생성객체 빈후처리기에 전달
3. 모든 Advisor빈 조회 : 자동 프록시 생성기 - 빈 후처리기가 모든 Advisor를 조회하여
4. 프록시 적용 대상 체크 : 조회한 Advisor에 있는 pointcut으로 해당 객체가 적용대상인지 확인함
5. 프록시 생성 : 만약 적용대상이였다면 프록시를 생성하여 반환함(아니면 받은 원본객체 그대로 반환함)
6. 빈 등록 : 반환된 객체는 스프링 빈으로 등록

⇒ 프록시는 내부에 어드바이저와 실제 호출해야할 대상 객체를 알고있음

- 적용

```Java
package com.example.proxy.config.v5_autoproxy;

import com.example.proxy.config.AppV1Config;
import com.example.proxy.config.AppV2Config;
import com.example.proxy.config.v3_proxyfactory.advice.LogTraceAdvice;
import com.example.proxy.trace.logtrace.LogTrace;
import org.springframework.aop.Advisor;
import org.springframework.aop.aspectj.AspectJExpressionPointcut;
import org.springframework.aop.support.DefaultPointcutAdvisor;
import org.springframework.aop.support.NameMatchMethodPointcut;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@Import({AppV1Config.class, AppV2Config.class})
public class AutoProxyConfig {
//    @Bean
//    public Advisor advisor1(LogTrace logTrace) {
//        //pointcut
//        NameMatchMethodPointcut pointcut = new NameMatchMethodPointcut();
//        pointcut.setMappedNames("request*", "order*","save*");
//
//        //advice
//        LogTraceAdvice advice = new LogTraceAdvice(logTrace);
//        return new DefaultPointcutAdvisor(pointcut, advice);
//    }

    //AspectExpressionPointcut 실무에서는 이것만 씀
//    @Bean
//    public Advisor advisor2(LogTrace logTrace) {
//        //pointcut
//        AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
//        //com.example.proxy.app패키지 아래 모든, 파라미터 상관없음
//        pointcut.setExpression("execution(* com.example.proxy.app..*(..))");
//
//        //advice
//        LogTraceAdvice advice = new LogTraceAdvice(logTrace);
//        return new DefaultPointcutAdvisor(pointcut, advice);
//    }

    //no log 메소드 제외
    @Bean
    public Advisor advisor3(LogTrace logTrace) {
        //pointcut
        AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
        //com.example.proxy.app패키지 아래 모든, 파라미터 상관없음 && no log 메소드는 제외
        pointcut.setExpression("execution(* com.example.proxy.app..*(..)) && !execution(* com.example.proxy.app..noLog(..))");

        //advice
        LogTraceAdvice advice = new LogTraceAdvice(logTrace);
        return new DefaultPointcutAdvisor(pointcut, advice);
    }
}
```

> [!important]  
> 결론적으로 포인트컷은1. 프록시 적용여부 판단(생성시) : 빈 등록시 해당 빈이 프록시 대상여부인지 판단2. 어드바이스 적용여부 판단(사용시) : 프록시 호출 시 부가기능인 어드바이스를 적용할지말지 포인트컷을 보고 판단함(적용대상이면 어드바이스먼저호출 → 타겟클래스 호출, 아니면 타겟클래스만 호출)2가지 경우에 사용됨  

그럼 여기서 빈 후처리기에서 advisor를 조회 후 프록시적용여부를 판단한다고했는데

advisor가 여러개일경우는?

프록시 1개를 생성한 후 프록시에 여러 어드바이저를 모두 적용함  
= 프록시 1개 - 어드바이저 N개 의 구조로 생성됨  

스프링 AOP도 같은 방식으로 동작함