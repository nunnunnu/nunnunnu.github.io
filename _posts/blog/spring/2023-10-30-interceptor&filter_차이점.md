---
last_modified_at: 2023-10-30
title: interceptor와 filter의 차이
category: Spring
tags:
  - spring
  - interceptor
  - filter
---

>[!💡]
>공통적으로 처리해야하는 애플리케이션 공통 관심사를 중복 코드 없이 처리하는 방법.
공통 관심 사항을 처리하지만 적용되는 순서와 범위, 사용방법의 차이가 있다.

## 필터

서블릿이 지원하는 기능으로 서블릿에 요청이 전달되기 전/후에 url패턴에 맞는 모든 요청에 부가 작업을 처리할 수 있는 기능.

### 필터 흐름

<mark class="hltr-grey">HTTP 요청 → WAS → <font color="#c0504d">필터</font> → 서블릿 → 컨트롤러</mark>

순으로 작동한다. 필터는 스프링 범위 밖에서 처리된다.

필터는 체인으로 구성되어 

<mark class="hltr-grey">HTTP 요청 → WAS -> <font color="#c0504d">필터1</font> → <font color="#c0504d">필터2</font> → <font color="#c0504d">필터3</font> → 서블릿 → 컨트롤러</mark>

이런식으로 필터가 FilterChain을 사용하여 다음 필터로 요청을 넘길 수 있다.

만약 필터에서 적절하지 않은 요청이라고 판단한다면 서블릿이 호출되지않고 요청이 종료된다

<mark class="hltr-grey">HTTP 요청 → WAS → <font color="#c0504d">필터</font>(적절하지 않은 요청이라 판단, 서블릿 호출 없이 종료)</mark>

### 필터 인터페이스 구조

```java
public interface Filter {
    public default void init(FilterConfig filterConfig) throws ServletException {}

    public void doFilter(ServletRequest request, ServletResponse response,
            FilterChain chain) throws IOException, ServletException;

    public default void destroy() {}
}
```

- init() : 필터 초기화 메서드. 서블릿 컨테이너가 생성될때 호출된다.
- doFilter() : 요청이 올때마다 메서드가 호출된다. 필터 로직 구현부.
- destroy() : 필터 종료 메소드. 서블릿 컨테이너 종료 시 호출된다.

필터 인터페이스를 구현하고 등록하면 서블릿 컨테이너가 필터를 싱글톤 객체로 생성하고 관리한다.

### 구현

```java
public class LogFilter implements Filter {
	@Override
	public void init(FilterConfig filterConfig) throws ServletException {
		log.info("init");
	}

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws
		IOException,
		ServletException {
		log.info("doFilter");
		//HttpServletRequest의 부모인 ServletRequest에는 기능이 많이없어서 다운캐스팅해줌
		HttpServletRequest httpRequest = (HttpServletRequest) request;
		String requestURI = httpRequest.getRequestURI();
		String uuid = UUID.randomUUID().toString();

		try {
			log.info("request [{}][{}]", uuid, requestURI);
      **chain.doFilter(request, response); //중요**
		} catch (Exception e) {
			log.info("response [{}][{}]", uuid, requestURI);
		}
	}

	@Override
	public void destroy() {
		log.info("destroy");
	}
}
```

```java
@Configuration
public class WebConfig {
	@Bean
	public FilterRegistrationBean logFilter() {
		FilterRegistrationBean<Filter> filterFilterRegistrationBean = new FilterRegistrationBean<>();
		filterFilterRegistrationBean.setFilter(new LogFilter());
		filterFilterRegistrationBean.setOrder(1); //첫번째로 실행할 필터
		filterFilterRegistrationBean.addUrlPatterns("/*"); //모든 url에서

		return filterFilterRegistrationBean;
	}
}
```

**<mark class="hltr-cyan">chain.doFilter(request, response); 이 가장 중요하다.</mark>**

chain.doFilter(request, response); 이 있어야 다음 필터가 있으면 호출하고 없으면 서블릿이 호출된다. 만약 chain.doFilter를 호출하지 않는다면 서블릿이 호출이 되지않아 위 필터흐름이 중단되어 다음 단계로 진행이 되지않는다

<mark class="hltr-grey">HTTP 요청 → WAS → 필터(중단)</mark>

@ServletComponentScan @WebFilter(filterName = “logFilter”, urlPatterns = “/*”) 어노테이션을 사용하면 필터 등록이 가능하나 순서 조절이 되지않는다.

### URL 패턴 적용 법

```java
public class LoginCheck implements Filter {
	**private static final String[] whiteList = {"/","/member/add","/login","/logout","/css/*"};**
	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws
		IOException,
		ServletException {

		HttpServletRequest httpRequest = (HttpServletRequest)request;
		String requestUri = httpRequest.getRequestURI();

		HttpServletResponse httpResponse = (HttpServletResponse)response;

		try {
			if(**isLoginCheckPath(requestUri)**) {
				HttpSession session = httpRequest.getSession(false);
				if(session == null || session.getAttribute(SessionConst.LOGIN_MEMBER) == null) {
					httpResponse.sendRedirect("/login?redirectURL="+requestUri); //로그인했으면 다시 요청 페이지로 복귀
					return;
				}
			}

			chain.doFilter(request, response);
		} catch (Exception e) {
			throw e;
		} finally {
			log.info("인증 체크 종료");
		}

	}

	**private boolean isLoginCheckPath(String requestUri) {
		return !PatternMatchUtils.simpleMatch(whiteList, requestUri);
	}**
}
```

```java
@Bean
public FilterRegistrationBean loginCheckFilter() {
	FilterRegistrationBean<Filter> filterFilterRegistrationBean = new FilterRegistrationBean<>();
	filterFilterRegistrationBean.setFilter(new LogFilter());
	filterFilterRegistrationBean.setOrder(2); //두번째로 실행할 필터
	filterFilterRegistrationBean.addUrlPatterns("/*"); //모든 url에서

	return filterFilterRegistrationBean;
}
```

모든 요청에 로그인 체크를 진행하나 whiteList에 있는 URL은 필터를 종료시킴.

---

## 인터셉터

스프링이 제공하는 기능. 필터보다 더 다양한 기능을 지원한다.

### 인터셉터 흐름

<mark class="hltr-grey">HTTP 요청 → WAS → 필터 → 서블릿 → <font color="#c0504d">스프링 인터셉터</font> → 컨트롤러</mark>

스프링 MVC가 제공하는 기능이라서 디스패처 서블릿(스프링 MVC의 시작점) 이후에 등장한다.  

만약 적절하지 않은 요청이라고 판단하면 컨트롤러를 호출하지않고 요청이 종료된다.

<mark class="hltr-grey">HTTP 요청 → WAS → 필터 → 서블릿 → <font color="#c0504d">스프링 인터셉터</font>(적절하지 않은 요청이라 판단, 컨트롤러 호출 없이 종료)</mark>

필터처럼 체인 기능이 적용되어 인터셉터를 자유롭게 추가 가능하다

<mark class="hltr-grey">HTTP 요청 → WAS → 필터 → 서블릿 → <font color="#c0504d">스프링 인터셉터1</font> → <font color="#c0504d">스프링 인터셉터2</font> → <font color="#c0504d">스프링 인터셉터3</font> → 컨트롤러</mark>

### 인터셉터 인터페이스

```java
public interface HandlerInterceptor {
	default boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		return true;
	}

	default void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
			@Nullable ModelAndView modelAndView) throws Exception {
	}

	default void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
			@Nullable Exception ex) throws Exception {
	}
}
```

![image](/assets/images/spring/IMG-20240927162741.png)

- preHandle : 컨트롤러(핸들러어댑터) 호출 전 → 반환값이 true면 다음과정(다음 인터셉터 OR 핸들러어댑터)을 호출한다. → false면 2번에서 요청이 종료됨
- postHandle : 컨트롤러 호출 후에 호출된다. 만약 컨트롤러에서 예외가 발생하면 postHandle은 호출되지않는다.
- afterCompletion : 요청 완료 후. 과정에서 예외가 터지든말든 호출된다.

— 예외 발생 시

![image](/assets/images/spring/IMG-20240927162741-1.png)

⇒ 예외와 무관하게 실행되어야하는 로직은 afterCompletion에 구현해야한다.

인터셉터는 스프링 MVC구조에 특화된 필터 기능을 제공하기 때문에 스프링MVC 사용시 특별히 필터를 사용해야하는 상황이아니라면 인터셉터를 사용하는게 더 편하다.

### 인터셉터 구현

```java
public class LogInterceptor implements HandlerInterceptor {

	public static final String LOG_ID = "logId";

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws
		Exception {

		String requestURI = request.getRequestURI();
		String uuid = UUID.randomUUID().toString();

		request.setAttribute(LOG_ID, uuid);

		if(handler instanceof HandlerMethod) {
			HandlerMethod hm = (HandlerMethod)handler; //호출된 컨트롤러 메소드의 모든 정보 포함(requestParam, response 타입 등)
		}

		log.info("request [{}] [{}] [{}]", uuid, requestURI, handler);

		return true;
	}

	@Override
	public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
		ModelAndView modelAndView) throws Exception {
		log.info("postHandler [{}]", modelAndView);
	}

	@Override
	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
		Exception ex) throws Exception {
		String requestURI = request.getRequestURI();
		String uuid = (String)request.getAttribute(LOG_ID);
		log.info("request [{}] [{}] [{}]", uuid, requestURI, handler);

		if(ex != null) {
			log.error("afterCompletion error!!");
		}
	}
}
```

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new LogInterceptor())
			.order(1)
			.addPathPatterns("/*") //전체 허용
			.excludePathPatterns("/css/**","/*.ico","/error"); //그 중에서 이건 제외
	}
}
```

**if(handler instanceof HandlerMethod) {** 에서 핸들러 정보는 어떤 핸들러 매핑을 사용하냐에 따라 달라지는데 일반적으로 @Controller나 @RestController를 활용한 핸들러매핑을 사용한다. 이 경우 핸들러 정보로 HandlerMethod 가 넘어옴

만약 @Controller나 @RestController가 아닌 .resources/static과 같은 정적 리소스가 호출되면 ResourceHttpRequestHandler가 넘어오기때문에 타입에따른 처리가 필요함

그리고 스프링의 URL경로는 서블릿 기술이 제공하는 URL경로와는 다르다. 스프링의 URL을 더 세밀하게 설정 가능하다. [스프링의 Path 패턴은 공식문서에서 확인 가능하다](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/util/pattern/PathPattern.html)

```java
public class LoginCheckInterceptor implements HandlerInterceptor {
	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws
		Exception {
		String requestURI = request.getRequestURI();
		HttpSession session = request.getSession();

		if(session == null || session.getAttribute(SessionConst.LOGIN_MEMBER) == null) {
			response.sendRedirect("/login?redirectURL="+requestURI);
			return false;
		}
		return true;
	}
}
```

```java
@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new LogInterceptor())
			.order(1)
			.addPathPatterns("/*")
			.excludePathPatterns("/css/**","/*.ico","/error");

		registry.addInterceptor(new LoginCheckInterceptor())
			.order(2)
			.addPathPatterns("/*")
			.excludePathPatterns("/css/**","/*.ico","/error", "/","/members/add","/login","/logout");
	}
```

기본적으로 모든 경로에 인터셉터를 허용하되 특정 경로만 적용하지않을수있어서 서블릿 필터와 비교했을때 더 편리하다.

메서드가 분리되어있다는 장점을 가지고있고 필터의 chain.doFilter와는 다르게 반환타입만 작성해주면 돼서 개발할때 더 편리하다.