---
title: "[인증] JWT에 세션 붙이기 - rotation과 분리된 세션 엔티티, sid + Redis blocklist, 새 기기 판정"
category: Spring
tags:
  - spring-security
  - jwt
  - redis
  - session
  - auth
last_modified_at: 2026-05-18
---

## 발단

구글이나 애플 계정에 있는 "로그인 보안" 같은 기능을 만들게 됐다. 요구사항은 세가지였다

1. 새 기기에서 로그인하면 메일로 알려준다
2. 내가 로그인해 있는 세션 목록을 본다
3. 세션을 하나 또는 전부 원격 로그아웃 할 수 있고 거의 바로 반영된다

인증은 JWT access token + refresh token 구조였는데 막상 세션을 보여주려고 하니 세션이라고 부를만한게 없었다

---

## JWT는 왜 끊을 수가 없나

세션 방식은 서버가 세션 저장소를 들고 있다가 요청마다 이 세션이 아직 살아있는지 확인하기때문에 서버에서 지우면 그 순간 끝이다

JWT는 반대로 서버가 <mark class="hltr-cyan">서명과 만료 시각만 검증</mark>하고 따로 저장해둔게 없다
그래서 확장하기 편한 대신 한번 발급된 토큰은 만료될때까지 유효하고 서버가 이 토큰은 이제 무효라고 말할 방법이 기본으로는 없다

원격 로그아웃을 하려면 결국 어딘가에 상태를 다시 둬야 했고 선택지는 이 정도였다

| 방법 | 동작 | 특징 |
|---|---|---|
| access token 수명을 짧게 | 끊어도 금방 만료되길 기다림 | 상태 없음. 대신 바로 반영이 안된다 |
| 허용 목록 | 요청마다 세션 저장소에서 살아있는지 확인 | 확실하지만 사실상 세션 방식으로 돌아감 |
| 차단 목록(blocklist) | 끊은 것만 저장해두고 요청마다 확인 | 끊은 건만 들어가서 저장하는 양이 적다 |
| 사용자별 토큰 버전 | 버전을 올려서 이전 토큰 전부 무효 | 전부 로그아웃은 쉽지만 세션 하나만 끊기는 안된다 |

세션 하나만 골라서 끊어야 하고 거의 즉시 반영돼야 해서 blocklist로 결정했다
그럼 무엇을 차단할지 단위가 필요한데 그게 세션이다

---

## refresh token은 세션이 될 수 없다

처음엔 refresh token 행을 세션으로 쓰면 되지 않을까 생각했는데 refresh rotation을 하고 있었다
rotation은 refresh 할때마다 새 refresh token을 발급하고 이전 것은 폐기하는 방식으로 탈취된 refresh token이 오래 살아있지 못하게 하려는 것이다

이러면 refresh token 행은 갱신할때마다 새로 생기기때문에 이걸 세션으로 쓰면 새로고침 한번에 세션 식별자가 바뀐다
세션 목록에서 같은 기기가 계속 새 세션으로 보이고 끊으려고 고른 세션이 이미 없어져 있을 수도 있다

그래서 rotation과 상관없이 유지되는 <mark class="hltr-cyan">세션 엔티티를 따로</mark> 만들었다

- 세션: 세션 id, 유저, 기기 정보, 생성 시각, 마지막 갱신 시각, 종료 시각, 종료 사유
- refresh token은 세션을 가리키고 토큰을 회전해도 새 토큰은 같은 세션을 가리킨다

```text
// 예시 코드
세션 S1
  - refresh token R1 (폐기)
  - refresh token R2 (폐기)
  - refresh token R3 (현재)  //회전해도 세션 S1은 그대로
```

>[!기기 단위가 아니라 세션 단위인 이유]
>
>같은 기기라도 로그아웃했다가 다시 로그인하면 보안상 별개의 세션으로 보는게 맞다
>그래서 세션의 생명주기는 세션 엔티티가 따로 갖고 기기 정보는 세션의 속성으로만 둔다
>

---

## JWT에 sid를 넣고 blocklist로 끊기

- 로그인할때 세션을 만들고 access / refresh token에 `sid`(세션 id) claim을 넣는다
- 원격 로그아웃하면 그 `sid`를 Redis blocklist에 올린다
- 인증 필터는 서명을 검증한 다음 `sid`가 blocklist에 있으면 401

```kotlin
// 예시 코드
class JwtAuthFilter(
    private val tokenProvider: TokenProvider,
    private val blocklist: SessionBlocklist,
) : OncePerRequestFilter() {

    override fun doFilterInternal(req: HttpServletRequest, res: HttpServletResponse, chain: FilterChain) {
        val token = resolveToken(req)
        if (token != null && tokenProvider.validate(token)) {
            val sid = tokenProvider.getSessionId(token)
            if (blocklist.contains(sid)) {
                res.status = HttpServletResponse.SC_UNAUTHORIZED
                return
            }
            SecurityContextHolder.getContext().authentication = tokenProvider.getAuthentication(token)
        }
        chain.doFilter(req, res)
    }
}
```

그럼 왜 토큰 하나하나의 id(jti)가 아니라 세션 id로 막았을까?
jti로 막으면 지금 들고 있는 access token 하나만 막히는데 <mark class="hltr-cyan">sid로 막으면 그 세션에서 발급된 토큰이 전부</mark> 몇번을 갱신했든 한번에 막힌다

### blocklist는 access token 수명만큼만

원격 로그아웃을 하면 그 세션의 refresh token 행은 DB에서 지워서 더이상 새 access token을 못 받는다
남은건 이미 발급돼서 돌아다니는 access token뿐인데 이건 길어도 access token 수명 안에 자연 만료된다

그래서 blocklist 키의 TTL은 access token 수명과 같게 잡으면 된다
그 뒤에는 막을 토큰이 남아있지 않으니 키도 같이 사라져도 되고 blocklist가 끝없이 커지지도 않는다

원격 로그아웃 한번에 하는 일은
1. 세션에 종료 시각과 종료 사유 기록
2. 그 세션의 refresh token 행 전부 삭제
3. `sid`를 blocklist에 등록

그리고 그냥 로그아웃도 같은 경로를 타게 했다
로그아웃만 refresh token을 지우는 식으로 따로 놀면 세션 목록에는 살아있다고 보이는데 토큰은 없는 어긋난 상태가 생기기때문이다

요청마다 Redis 조회가 하나 더 붙긴 하지만 키 존재 여부 확인 한번이라 체감 비용은 낮다고 봤다

### 마지막 접속 시각은 refresh 때만

세션 목록에 마지막 사용 시각을 보여주려면 갱신이 필요한데 매 요청마다 UPDATE하면 읽기 요청이 전부 쓰기가 되어버린다
그래서 토큰을 refresh 할때만 갱신했다(정확도는 access token 수명 단위로 떨어지지만 세션 목록 용도로는 충분하다)
리뷰하면서 컬럼 이름도 "last seen"이 아니라 실제로 갱신되는 시점이 드러나게 "refreshed at"으로 바꿨다. 이름이 last seen이면 누군가는 정확한 마지막 요청 시각이라고 믿을테니까

### 현재 세션 표시

세션 목록의 "현재 기기" 표시는 인증 객체에 sid를 따로 실어두지 않고 목록 조회에서만 요청 토큰의 sid를 꺼내서 비교했다
한곳에서만 필요한 값을 모든 요청의 인증 객체에 들고 다닐 필요는 없었다

---

## 과도기: 이미 로그인해 있는 사용자

배포하는 순간 이미 발급된 토큰에는 sid가 없고 세션 행도 없다
기존 토큰을 한번에 무효화하면 전체 사용자가 강제 로그아웃되기때문에 갈아태우는 쪽으로 했다

- 기존 access token은 자연 만료되게 둔다
- refresh 할때 세션이 연결 안된 refresh token이면 그 자리에서 세션을 만들고 sid가 들어간 토큰으로 새로 발급한다

refresh 한번이면 자연스럽게 새 구조로 넘어오고 사용자는 아무것도 모른다

### 켜는 순서

한번에 다 켜지 않고 나눠서 켜기로 했다

1. 세션 적재만(메일이랑 blocklist는 꺼둔 채로)
2. blocklist 적용
3. 새 기기 알림 메일
4. 세션 목록 화면 공개

1번을 먼저 한 이유는 기능을 켜는 첫날엔 모든 사용자가 이전 세션 없음 상태라서 메일을 같이 켜면 <mark class="hltr-cyan">전원에게 새 기기 메일이 나가기</mark>때문이다
세션 기록을 먼저 쌓아두고 메일을 나중에 켜면 이 폭주를 피할 수 있다

---

## 새 기기 판정 기준

제일 많이 바뀐게 새 기기를 어떻게 판단하느냐였다

### 1안: User-Agent 해시 + IP 대역

처음 설계는 User-Agent 등을 해시한 fingerprint와 IPv4 /24 대역을 묶어서 최근 일정 기간 안에 같은 쌍의 세션이 없으면 새 기기로 보는 방식이었는데 리뷰에서 문제가 여럿 나왔다

- fingerprint 정의가 문서 안에서 서로 달랐다. 어떤 곳은 "User-Agent 주요 필드" 어떤 곳은 "User-Agent 전체"라서 이대로 구현하면 판정이 매번 엇갈린다
- IPv6는 대역을 어디까지 볼지 정해져 있지 않았다
- 애초에 IP는 계속 바뀌는 값이다
	- 모바일 네트워크는 이동하면 바뀌고 통신사 NAT 뒤에서는 남들과 같은 IP를 쓰고 IPv6는 개인정보 보호용 임시 주소를 주기적으로 바꾼다
	- 네트워크만 바뀌어도 새 기기 메일이 나가버림

### 2안: 기기 식별값 기반, IP 제외

그래서 IP를 기기 판정에서 빼고 기기 식별은 이미 있는 값을 썼다

- 앱은 앱이 발급해서 들고 있는 기기 식별값(앱을 재설치하면 새로 발급)
- 웹은 브라우저에 오래 유지되는 클라이언트 식별값

이 식별값을 중심으로 몇가지 기기 속성을 묶어서 해시하고 그걸로 이전 세션과 비교했다. 별도 fingerprint 라이브러리는 필요없었다

물론 한계도 있다. 브라우저 저장소를 지우거나 시크릿 모드거나 앱을 재설치하면 새 기기로 판정되고 같은 컴퓨터여도 브라우저가 다르면 다른 기기다
그런데 이건 모르는 기기라고 한번 더 알려주는 쪽의 오탐이라 보안 방향으로는 괜찮다고 판단했다
반대로 IP 기반은 오탐이 너무 잦아서 사용자가 메일을 무시하게 만드는게 더 위험하다

### 원격 로그아웃한 세션은 "아는 기기"에서 뺀다

리뷰에서 나온 것 중에 제일 중요했던 것
매칭 대상에 <mark class="hltr-cyan">내가 원격 로그아웃한 세션</mark>도 들어가 있어서 끊었던 기기에서 다시 로그인해도 아는 기기라고 메일이 안가는 구조였다

내가 직접 끊은 기기에서 또 들어왔다는건 반드시 알려줘야 하는 상황이라서 활성 세션이랑 본인 로그아웃 세션만 매칭 대상으로 두고 원격 로그아웃한 세션은 매칭에서 뺐다


---

## 그 외 붙인 곳들

- 로그인 진입점이 이메일과 소셜 여러개였는데 전부 토큰 발급 메서드 하나를 거치고 있어서 거기에 세션 생성과 sid 추가를 넣으니 한번에 적용됐다(대신 기기 정보를 파라미터로 넘겨줘야 했다)
- 새 기기 메일은 `@TransactionalEventListener(AFTER_COMMIT)`로 커밋 이후에 비동기로 보냈다. 로그인 트랜잭션이 롤백됐는데 메일만 나가는 일이 없게
- 오래 갱신되지 않은 세션은 배치로 만료 처리했다. 안그러면 세션 목록에 몇달 전 기기가 계속 활성으로 보인다

---

JWT에 상태를 다시 두는게 처음엔 좀 어색했는데 sid 하나랑 TTL 짧은 blocklist로 생각보다 가볍게 끝났다
새 기기 판정은 IP를 빼고 나서야 메일이 의미있는 알림이 되었다
