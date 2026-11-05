---
title: "[Spring boot&Kotlin] LLM을 이용한 외부 채용 링크 유효성 판정 구현"
category: 외부API연동
tags:
  - llm
  - webclient
  - reactor-netty
  - kotlin
  - spring
  - batch
last_modified_at: 2026-05-07
---

## 발단

채용공고 중에는 지원을 외부 채용 페이지에서 받는 공고가 있다
외부 페이지는 우리가 관리하는게 아니라서 공고가 마감되거나 페이지가 사라져도 이쪽에서는 계속 살아있는 공고로 보인다
그래서 <mark class="hltr-cyan">외부 링크가 아직 유효한지 주기적으로 검사해서 아니면 자동 마감</mark>하는 배치를 만들었다

그런데 돌려보니 멀쩡한 공고를 죽었다고 판정하는 오탐이 계속 나왔다
원인을 따라가보니 절반은 LLM이 아니라 HTTP 클라이언트 설정 문제였다

---

## 구조와 판정 방향

1. 링크에 GET 요청
2. 명확한 마감 문구가 있으면 바로 무효(LLM 호출 아끼려고)
3. 나머지는 HTML을 LLM에 넘겨서 "지금 지원 가능한 공고인지"를 `{"isValid": .., "reason": ..}` JSON으로 받기

상태 코드만 보지 않은 이유는 마감된 공고도 200으로 "마감되었습니다" 페이지를 주는 경우가 많아서이다. 내용을 읽어야 판단이 된다

그리고 판정 방향을 먼저 정했다
이 배치가 틀리는 경우는 두가지인데 마감된 공고를 살아있다고 판정하면 마감이 조금 늦어지는 정도지만
살아있는 공고를 마감으로 판정하면 멀쩡한 공고가 내려가버린다

뒤쪽이 훨씬 비싸서 모든 단계에서 <mark class="hltr-cyan">애매하면 유효</mark>로 기울였다
아래 함정들도 결국 애매한 상황이 무효로 처리되는 경로를 하나씩 막는 작업이었다

---

## WebClient 함정 1. 리다이렉트를 안 따라간다

308 응답인데 무효 판정이 나왔다
LLM이 받은 HTML을 열어보니 리다이렉트 안내용 짧은 HTML이었고 이걸 보고 없는 페이지라고 판단한것이다

Reactor Netty의 `HttpClient`는 <mark class="hltr-cyan">기본으로 리다이렉트를 따라가지 않고</mark> 3xx 응답을 그대로 돌려준다고 한다
브라우저는 알아서 따라가니까 놓치기 쉬운데 curl도 `-L` 없이는 안 따라가는것과 같다

```kotlin
// 예시 코드
val httpClient = HttpClient.create()
    .followRedirect(true)

val webClient = WebClient.builder()
    .clientConnector(ReactorClientHttpConnector(httpClient))
    .build()
```

---

## WebClient 함정 2. retrieve()는 4xx/5xx를 예외로 바꾼다

몇달 뒤에 나온 케이스인데 응답 코드는 404인데 body는 정상 채용공고였고 지원 접수도 받고 있었다

`retrieve()`는 기본으로 4xx/5xx 응답을 `WebClientResponseException`으로 바꿔서 던진다
예외 안에 body가 들어있긴 하지만 정상 흐름(`toEntity`, `bodyToMono`)으로는 안 넘어오기때문에 코드가 자연스럽게 "에러 = 무효"로 짜여있었다

상태 코드가 에러여도 body를 받아서 판정에 넘기려면 `onStatus`에서 에러 변환을 꺼주면 된다

```kotlin
// 예시 코드
val response = webClient.get()
    .uri(url)
    .retrieve()
    .onStatus(HttpStatusCode::isError) { Mono.empty() } //에러로 바꾸지 않고 정상 응답처럼 통과
    .toEntity(String::class.java)
    .block()
```

`onStatus`의 함수가 빈 Mono를 돌려주면 그 상태 코드를 에러로 취급하지 않고 body까지 정상적으로 읽는다
이렇게 상태 코드와 body를 같이 받아서 에러 코드라도 HTML이 있으면 LLM 판정으로 넘기게 바꿨다

200인데 마감된 페이지도 있고 404인데 살아있는 페이지도 있어서 이 배치에서 상태 코드는 참고만 하기로 했다

---

## WebClient 함정 3. retryWhen은 에러를 가리지 않는다

일시적인 타임아웃 하나때문에 멀쩡한 공고가 마감되면 안되니까 GET에도 재시도를 넣었다
그런데 재시도는 무엇을 재시도할지를 잘 골라야 했다

```kotlin
// 예시 코드
webClient.get()
    .uri(url)
    .retrieve()
    .onStatus(HttpStatusCode::isError) { Mono.empty() }
    .toEntity(String::class.java)
    .timeout(Duration.ofSeconds(15))
    .retryWhen(
        Retry.backoff(2, Duration.ofSeconds(2))
            .maxBackoff(Duration.ofSeconds(5))
            .filter { it is WebClientRequestException || it is TimeoutException } //일시적인 것만
            .onRetryExhaustedThrow { _, signal -> signal.failure() }              //원래 예외 그대로
    )
    .block()
```

- filter
	- `Retry.backoff`에 `filter`가 없으면 <mark class="hltr-cyan">모든 에러 신호를 재시도</mark>한다
	- 4xx를 예외로 받는 설정이면 404도 재시도하고 아래 함정 5의 버퍼 초과처럼 몇번을 해도 똑같이 실패할 에러도 재시도해버린다
	- 연결 실패나 타임아웃처럼 다시 하면 될수도 있는것만 골라주었다
- onRetryExhaustedThrow
	- 재시도를 다 쓰면 Reactor는 마지막 예외를 그대로 던지지 않고 `IllegalStateException` 계열("Retries exhausted: 2/2")로 감싸서 던진다고 한다
	- catch에서 예외 타입으로 분기하고 있으면 엉뚱한 쪽으로 빠지기때문에 원래 예외를 꺼내주었다
- timeout 위치
	- `retryWhen` 앞에 두면 시도 한번마다 15초고 뒤에 두면 재시도를 다 합친 전체에 15초가 걸린다
	- retryWhen은 위쪽 체인을 다시 구독하는 방식이라 앞에 있는 연산자가 매번 새로 걸리기때문이다

---

## WebClient 함정 4. 응답 헤더가 크면 body를 보기도 전에 실패한다

어떤 채용 사이트는 응답 헤더가 커서 기본 설정으로는 받지 못했다
Netty의 HTTP 디코더는 응답 헤더 전체 크기를 기본 8KB로 제한하고 넘으면 디코딩 단계에서 실패한다

헤더 크기를 늘리는 방법을 찾아보면 `doOnConnected`에서 Netty 파이프라인의 `HttpClientCodec`을 새 코덱으로 replace 하는 코드가 많이 나오는데
내부 핸들러 이름과 파이프라인 구성에 기대는 방식이라 버전이 바뀌면 깨질 수 있고 커넥션이 맺어질때마다 교체가 반복된다
Reactor Netty에 같은 일을 하는 공식 설정이 있어서 그걸 썼다

```kotlin
// 예시 코드
HttpClient.create()
    .followRedirect(true)
    .httpResponseDecoder { spec -> spec.maxHeaderSize(MAX_HEADER_BYTES) }
```

---

## WebClient 함정 5. body는 기본 256KB까지만 메모리에 모은다

`bodyToMono(String::class.java)`나 `toEntity(String::class.java)`는 body 전체를 메모리에 모아서 문자열 하나로 만든다
이때 쓰는 코덱은 기본으로 256KB까지만 모으고 넘으면 `DataBufferLimitException`을 던진다
JSON API 응답이면 넉넉한 값인데 요즘 웹 페이지 HTML은 인라인 스크립트랑 스타일때문에 이걸 쉽게 넘는다

```kotlin
// 예시 코드
WebClient.builder()
    .clientConnector(ReactorClientHttpConnector(httpClient))
    .codecs { it.defaultCodecs().maxInMemorySize(MAX_HTML_BYTES) }
    .build()
```

이 한도는 메모리 보호 장치라서 큰 응답 여러개가 동시에 오면 힙이 터질 수 있으니 무제한(-1)으로 풀지 않고 용도에 맞는 값으로 잡았다
한도는 모아서 하나로 만들때만 걸리기때문에 `bodyToFlux<DataBuffer>`처럼 스트리밍으로 읽으면 상관없다
그리고 공용 WebClient 빈의 값을 올리기보다 큰 응답을 받는 용도만 따로 빌더로 만드는게 영향 범위가 작아서 따로 만들었다
(이 예외는 일시적인 에러가 아니라서 함정 3에서 재시도 대상을 골라야 했던 이유 중 하나이기도 하다)

---

## HTML을 읽는 쪽의 함정

### CSR 페이지는 빈 껍데기만 온다

200인데 LLM이 "콘텐츠가 없다"고 하거나 심지어 없는 마감 문구를 지어내서 무효를 주는 경우가 있었다
확인해보니 전부 클라이언트 사이드 렌더링(CSR) 페이지였다

SPA로 만든 페이지는 GET으로 받으면 JS 번들이랑 CSS랑 "JavaScript를 켜주세요" 정도만 들어있고 실제 내용은 브라우저에서 JS가 실행된 다음에 채워진다
WebClient는 JS를 실행하지 않으니 항상 빈 틀만 받는것이다

근본적으로는 헤드리스 브라우저가 필요한데 배치에서 링크마다 브라우저를 띄우기엔 너무 무거워서
<mark class="hltr-cyan">보이는 텍스트가 거의 없고 JS 프레임워크 코드만 있으면 판단 불가로 보고 유효 처리</mark>했다(틀린 마감보다 놓친 마감이 낫다)

### script 태그 안의 숨은 문구

키워드 필터에 걸려서 바로 무효가 된 공고 중 하나가 실제로는 멀쩡했다
HTML 소스를 열어보니 `<script>` 안의 조건 분기에 "해당 공고는 접근할 수 없습니다" 같은 문구가 들어있었는데
화면에는 절대 안나오는 문구지만 `html.contains()`는 소스 전체를 보니까 걸린것이다

그래서 키워드 체크는 script 태그를 지우고 태그도 벗긴 텍스트에서만 하도록 바꿨다

```kotlin
// 예시 코드
private val SCRIPT_TAG = Regex("<script[\\s\\S]*?</script>", RegexOption.IGNORE_CASE)
private val HTML_TAG = Regex("<[^>]+>")

fun findInvalidKeyword(html: String): String? {
    val visibleText = html.replace(SCRIPT_TAG, "").replace(HTML_TAG, "")
    return INVALID_KEYWORDS.find { visibleText.contains(it) }
}
```

정규식으로 HTML을 다루는건 근사치라서 더 정확하게 하려면 Jsoup으로 파싱해서 `text()`를 쓰면 된다
script와 style 안의 내용은 텍스트 노드가 아니라서 `text()` 결과에 안들어간다고 한다

---

## LLM이 너무 열심히 판단할때

배포 후에도 살아있는 공고를 무효로 본 케이스가 몇개 나왔는데 이번엔 LLM의 판단 자체가 과했다

- 로그인 필요 페이지: 공고 본문은 다 보이는데 지원하려면 로그인이 필요해 보인다는 이유로 무효
- 페이지 안 JSON 오독: HTML에 들어있는 내부 JSON 데이터의 부가 필드 하나만 보고 무효
- 날짜 비교: 오늘 날짜를 모르거나 접수 시작일이 미래인걸 마감으로 오해
- 번호를 날짜로: URL이나 본문의 공고 번호를 날짜로 해석

그래서 프롬프트의 판정 기준을 이렇게 바꿨다

- 지원 버튼이 활성화돼 있는지를 최우선으로
- 본문이 보이면 로그인 필요 여부를 추측해서 무효로 보지 말 것
- 페이지 안 JSON은 공고 상태를 직접 나타내는 필드만 근거로
- <mark class="hltr-cyan">오늘 날짜를 프롬프트에 직접 넣기</mark>(서버에서 `LocalDate.now()`로)
- 접수 시작일이 미래여도 공고가 존재하면 유효
- 일련번호를 날짜로 해석하지 말 것
- 확실하지 않으면 유효. 응답 JSON 파싱에 실패해도 유효

LLM은 오늘이 며칠인지 모르고 학습 데이터 어느 시점의 감각으로 답할 뿐이라
날짜로 판단해야 하는 일이면 날짜는 무조건 우리가 넣어줘야 한다는걸 이때 확실히 알았다

잘못 마감된 공고를 되돌릴때는 상태만 바꾸면 안됐다
공고 상태가 바뀔때 나가는 이벤트와 캐시 삭제까지 같이 타야 해서 재활성화 흐름을 테스트로 먼저 만들어서 확인했다


---

결국 오탐의 절반은 WebClient 기본값을 모르고 쓴 탓이었고 나머지 절반은 LLM한테 애매하면 유효라는 기준을 제대로 안 준 탓이었다
상태 코드는 참고만 하고 날짜는 꼭 넣어주자
