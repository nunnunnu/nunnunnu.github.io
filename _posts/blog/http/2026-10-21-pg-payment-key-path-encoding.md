---
title: "[HTTP] 외부 식별자를 URL 경로에 문자열 치환으로 넣으면 안 되는 이유 - 경로 변수 인코딩"
category: HTTP
tags:
  - http
  - url-encoding
  - spring
  - payment
last_modified_at: 2026-10-21
---

## 발단

PG사에서 <mark class="hltr-cyan">결제키 포맷이 바뀐다</mark>는 공지가 와서 결제키를 다루는 코드가 새 포맷에서도 괜찮은지 점검하게 되었다

포맷이 바뀔때 깨지는 곳은 대략 정해져있어서 하나씩 확인해보았다

- 결제키를 파싱하거나 길이/정규식으로 검증하는 코드 -> 없음
- 결제키를 저장하는 컬럼 길이 -> varchar(255)로 여유있음
- 결제키를 URL 경로에 넣는 방식 -> ?

앞의 두개는 금방 끝났는데 마지막을 보다가 생각이 길어졌다
식별자를 URL 경로에 넣는 코드는 사실 이 값에는 특수문자가 없다는 가정에 기대고있는데 포맷이 바뀐다는건 그 가정도 바뀔 수 있다는 뜻이다

---

## URL의 구조와 예약 문자

URL은 문자 몇개로 구역을 나눈다

```text
// 예시 코드
https://api.example.com/v1/payments/{key}/cancel?lang=ko#top
\___/   \_____________/\___________________/ \_____/ \_/
scheme        host             path            query  fragment
```

- `/`: 경로 세그먼트를 나눈다
- `?`: 경로가 끝나고 쿼리가 시작된다
- `#`: fragment가 시작된다. fragment는 <mark class="hltr-cyan">서버로 아예 전송되지 않는다</mark>

이런 문자를 예약 문자라고 한다(RFC 3986)
값 안에 예약 문자가 들어가야하면 `%2F` `%3F` `%23`처럼 퍼센트 인코딩해서 이건 구분자가 아니라 값이라고 표시해줘야한다

---

## 문제의 코드

경로에 식별자를 넣는 코드는 이렇게 쓰는 경우가 많다

```kotlin
// 예시 코드
val cancelUrl = "$baseUrl/payments/{paymentKey}/cancel"
    .replace("{paymentKey}", paymentKey)
```

식별자에 예약 문자가 없는 동안은 잘 돈다. 그런데 키에 예약 문자가 하나라도 섞이면

```kotlin
// 예시 코드
val key = "abc/def?ghi#jkl"
val uri = URI("https://api.example.com/payments/{paymentKey}/cancel".replace("{paymentKey}", key))

println(uri.path)      // /payments/abc/def
println(uri.query)     // ghi
println(uri.fragment)  // jkl/cancel
```

- `/` 때문에 세그먼트가 하나 늘어서 `/payments/abc/def`가 되고
- `?` 뒤는 쿼리가 되고
- `#` 뒤는 fragment가 돼서 `/cancel`까지 같이 사라진다

결국 서버는 `/payments/abc/def?ghi`를 받는다. 취소 요청이 <mark class="hltr-cyan">엉뚱한 경로</mark>로 가는건데 운이 나쁘면 404가 아니라 다른 API에 매칭될 수도 있다

---

## 왜 이렇게 될까?

문자열 치환은 `{paymentKey}` 자리에 글자를 그대로 붙여넣을 뿐이고 그 글자가 URL에서 무슨 의미인지는 신경쓰지않는다
그 다음에 URL 파서가 문자열을 읽을때는 값과 구분자를 구별할 방법이 없어서 값 안의 `/`도 구분자로 읽어버린다

SQL에서 문자열을 이어붙여 쿼리를 만들면 안되는것과 같은 이유이다. 값은 구조와 분리해서 넣어야한다

---

## 해결: 경로 변수 인코딩

Spring이면 `UriComponentsBuilder`로 템플릿과 변수를 따로 넘기면 된다

```kotlin
// 예시 코드
fun cancelUri(paymentKey: String): URI =
    UriComponentsBuilder.fromUriString(baseUrl)
        .path("/payments/{paymentKey}/cancel")
        .encode()                    // 확장하기 "전"에 부른다
        .buildAndExpand(paymentKey)
        .toUri()
```

`encode()`를 `buildAndExpand()` <mark class="hltr-cyan">앞에</mark> 부르면 템플릿은 먼저 인코딩해두고 URI 변수는 확장할때 엄격하게 인코딩한다고 한다
엄격하게라는건 URI 안에서 특별한 의미가 있는 문자를 전부 인코딩한다는 뜻이라 변수 안의 `/` `?` `#`이 각각 `%2F` `%3F` `%23`이 된다

테스트로 고정해두었다

```kotlin
// 예시 코드
@Test
fun `결제키의 예약 문자는 경로 안에서 인코딩된다`() {
    val uri = cancelUri("abc/def?ghi#jkl")

    assertThat(uri.rawPath).isEqualTo("/payments/abc%2Fdef%3Fghi%23jkl/cancel")
    assertThat(uri.rawQuery).isNull()
    assertThat(uri.rawFragment).isNull()
}
```

### 순서가 바뀌면 `/`가 살아남는다

```kotlin
// 예시 코드
UriComponentsBuilder.fromUriString(baseUrl)
    .path("/payments/{paymentKey}/cancel")
    .buildAndExpand(paymentKey)
    .encode()        // 확장한 "다음"에 인코딩
    .toUri()
```

이렇게 하면 변수가 먼저 경로에 들어간 다음 경로 컴포넌트 규칙으로 인코딩된다. 경로에서 `/`는 원래 쓸 수 있는 문자라 인코딩되지않는다
`?`와 `#`은 인코딩되지만 `/`는 그대로 남아서 세그먼트가 늘어난다. 이름은 둘 다 encode인데 결과가 다르다..

### 반환 타입은 String 말고 URI

인코딩된 결과를 String으로 HTTP 클라이언트에 넘기면 클라이언트에 따라 그걸 다시 템플릿으로 보고 한번 더 인코딩한다
예를 들어 `RestTemplate`에 문자열 URL을 넘기면 기본 설정에서는 `%`까지 인코딩해서 `%2F`가 `%252F`가 되어버린다(이중 인코딩)
`URI` 객체로 넘기면 이미 인코딩된걸로 취급해서 그대로 보낸다

### 다른 언어에서는

자바스크립트라면 `encodeURIComponent`를 쓰면 된다. `encodeURI`는 URL 전체용이라 `/` `?` `#`을 인코딩하지 않는다

```javascript
// 예시 코드
`${baseUrl}/payments/${encodeURIComponent(paymentKey)}/cancel`
```

---

## 주의점: 받는 쪽이 `%2F`를 거부할 수도 있다

인코딩된 슬래시(`%2F`)는 서버나 프록시에 따라 보안상 이유로 거부되기도 한다. 톰캣은 기본 설정에서 경로의 `%2F`를 허용하지 않는다고 한다
그래도 경로가 조용히 바뀌어서 엉뚱한 곳으로 가는것보다는 <mark class="hltr-cyan">명확한 에러</mark>가 낫다고 생각한다. 인코딩을 안 해서 생기는 문제는 찾기 어렵지만 인코딩해서 생기는 문제는 바로 보이니까

---

다음에 포맷 변경 공지가 오면 파싱/길이 검증/정규식/컬럼 길이에 더해서 URL 조립하는 곳까지 같이 봐야겠다
