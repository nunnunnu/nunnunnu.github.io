---
title: "[스프링 부트와 AWS로 혼자 구현하는 웹 서비스] 2장 스프링 부트에서 테스트 코드를 작성하자"
category: Spring
tags:
  - spring
  - aws
  - 스프링부트와AWS로혼자구현하는웹서비스
last_modified_at: 2024-03-02
---
![images](/assets/images/alone/IMG-20240925142159.png)

---

- 레드 그린 사이클
![images](/assets/images/alone/IMG-20240925142159-1.png)
    1. 항상 실패하는 테스트를 먼저 작성(red)
    2. 테스트가 통과하하는 프로덕션 코드를 작성(green)
    3. 테스트가 통과하면 프로덕션 코드를 리팩토링(Refactor)

- 테스트 코드 작성 이유
1. 단위 테스트는 개발단계 초기에 문서를 발견하게 도와줌
2. 단위 테스트는 개발자가 나중에 코드를 리팩토링하거나 라이브러리 업그레이드 등에서 기존 기능이 올바르게 작동하는지 확인 가능 (ex. 회귀 테스트)
3. 단위 테스트는 기능에 대한 불확실성을 감소
4. 단위 테스트는 시스템에 대한 실제 문서를 제공(테스트 자체가 문서로 사용가능함)
5. 시간 절약. 
	System.out.println 등으로 콘솔에서 확인하는 시간을 줄여줌. 테스트가 개발자가 원하는대로 나오지 않으면 다시 톰캣을 재시작해야함.
6. 자동검증 가능. 
	단위테스트를 실행만 하면 더는 수동검증은 불필요함. 
    A 코드를 수정했을 때 B 코드에 영향을 준다면 B 코드의 테스트가 실패해 예상못한 이슈를 방지가능

### 단위 테스트 코드

```java
package jojoldu.webservice.controller;

import org.assertj.core.api.Assertions;
import org.hamcrest.core.Is;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.hamcrest.Matchers.is;

import jojoldu.webservice.controller.dto.HelloResponseDto;

@WebMvcTest(controllers = HelloController.class) //특정 컨트롤러를 대상으로 하는 단위 테스트를 작성할 때 사용. 
//선언 시 controllerAdvice 사용가능, service, repository, component 사용불가
class HelloControllerTest {
	@Autowired
	private MockMvc mvc;

	@Test
	public void hello가_리턴된다() throws Exception {
		String hello = "hello";

		mvc.perform(get("/api/hello"))
			.andExpect(status().isOk()) //응답코드가 200인지
			.andExpect(content().string(hello));
	}

	@Test
	public void 롬복기능_테스트() throws Exception {
		String name = "test";
		int amount = 1000;

		HelloResponseDto dto = new HelloResponseDto(name, amount);

		Assertions.assertThat(dto.getName()).isEqualTo(name);
		Assertions.assertThat(dto.getAmount()).isEqualTo(amount);

		mvc.perform(get("/api/hello/dto")
				.param("name", name)
				.param("amount", String.valueOf(amount)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name", is(name)))
			.andExpect(jsonPath("$.amount", is(amount)));
	}
}
```

- @WithMockUser : 컨트롤러 테스트 시 필요한 유저의 인증정보를 제공하는 어노테이션 ( ↔@WithAnonymousUser). 특정 권한 부여 시 @WithMockUser(roles=”ADMIN”)으로 사용
