---
title: "[외부API연동] 구글 API에 재시도를 붙일 때 401 핸들러를 덮어쓰지 말 것 - 그리고 batchUpdate로 원자적 쓰기"
category: 외부API연동
tags:
  - google-sheets
  - retry
  - backoff
  - batch
  - kotlin
last_modified_at: 2026-08-25
---

## 발단

집계 결과를 매일 구글 시트에 쓰는 배치가 이 에러로 실패했다

`503 Service Unavailable (backendError)`

구글 쪽 일시 장애였는데 하루에 한번 도는 배치라 한번 실패하면 결과가 하루 밀려버린다
그래서 재시도를 붙이기로 했는데 붙이면서 두가지를 알게됐다

- 재시도 핸들러를 그냥 끼우면 <mark class="hltr-cyan">토큰 갱신(401 처리)이 죽는다</mark>
- 재시도로는 중간에 끊긴 쓰기를 못 막는다

---

## 구글 API 클라이언트의 요청 처리 구조

자바용 구글 API 클라이언트(`google-http-client`)는 요청 하나(`HttpRequest`)에 이런 것들을 꽂아서 쓴다

- `HttpRequestInitializer`: 요청을 만들때마다 호출돼서 헤더/타임아웃/핸들러를 설정
- `HttpUnsuccessfulResponseHandler`: 응답이 실패(2xx가 아님)했을때 호출됨. `true`를 돌려주면 재시도한다
- `HttpIOExceptionHandler`: 네트워크 예외가 났을때 호출됨

여기서 중요한건 실패 응답 핸들러 자리가 <mark class="hltr-cyan">요청당 하나</mark>라는 것이다. `setUnsuccessfulResponseHandler`는 추가가 아니라 교체이다

그리고 서비스 계정 인증에 쓰는 `HttpCredentialsAdapter`는 `initialize()`에서 자기 자신을 이 자리에 심는다
401이 오면 토큰을 갱신하고 `true`를 돌려줘서 한번 더 요청하게 해주는게 이 핸들러의 역할이다

---

## 문제의 코드

재시도를 붙이려고 흔히 이렇게 쓴다

```kotlin
// 예시 코드
val initializer = HttpRequestInitializer { request ->
    HttpCredentialsAdapter(credentials).initialize(request)   // 여기서 401 핸들러가 심어지고
    request.setUnsuccessfulResponseHandler(                    // 여기서 덮어써진다
        HttpBackOffUnsuccessfulResponseHandler(ExponentialBackOff())
    )
}
```

평소엔 잘 돈다. 토큰이 살아있는 동안은 401이 안 나니까
그런데 액세스 토큰이 만료되는 순간 401이 오고 그걸 처리할 핸들러는 이미 백오프 핸들러로 바뀌어있다. 백오프 핸들러는 기본적으로 5xx만 재시도하기때문에 401은 그대로 실패한다
재시도를 붙였더니 인증이 죽는 상황..(그것도 토큰 만료 주기에 맞춰서 가끔 터진다)

---

## 해결 1. 기존 핸들러를 먼저 태우고 못 처리한 것만 백오프로

교체하지 말고 감싸주었다. 인증 어댑터가 심어둔 핸들러를 꺼내두고 그게 처리하지 못한 응답만 백오프로 넘기는 방식이다

```kotlin
// 예시 코드
fun retryingInitializer(credentials: GoogleCredentials): HttpRequestInitializer {
    val credentialsAdapter = HttpCredentialsAdapter(credentials)

    return HttpRequestInitializer { request ->
        credentialsAdapter.initialize(request)
        val authHandler = request.unsuccessfulResponseHandler   // 401 갱신 핸들러

        val backOffHandler = HttpBackOffUnsuccessfulResponseHandler(newBackOff())
            .setBackOffRequired { res -> res.statusCode == 429 || res.statusCode / 100 == 5 }

        request.setUnsuccessfulResponseHandler { req, res, supportsRetry ->
            // 401 갱신을 먼저 시도하고 못 처리한 것만 백오프
            (authHandler?.handleResponse(req, res, supportsRetry) == true) ||
                backOffHandler.handleResponse(req, res, supportsRetry)
        }
        request.setIOExceptionHandler(HttpBackOffIOExceptionHandler(newBackOff()))
        request.setNumberOfRetries(5)
        request.setConnectTimeout(20_000)
        request.setReadTimeout(60_000)
    }
}

private fun newBackOff(): ExponentialBackOff =
    ExponentialBackOff.Builder()
        .setInitialIntervalMillis(1_000)     // 1 -> 2 -> 4 -> 8 -> 16초
        .setMultiplier(2.0)
        .setMaxIntervalMillis(16_000)
        .setMaxElapsedTimeMillis(120_000)    // 요청 하나당 최대 2분
        .build()
```

백오프 대상은 5xx와 <mark class="hltr-cyan">429</mark>로 잡았다. 기본 조건(`ON_SERVER_ERROR`)은 5xx만 보기때문에 429는 따로 넣어줘야한다
네트워크 예외도 같은 백오프로 재시도하게 했고 타임아웃도 명시해주었다. 기본값에 기대면 응답 없는 요청 하나가 배치 전체를 붙잡고 있을수 있기때문

참고로 `ExponentialBackOff`는 기본으로 간격에 무작위 흔들림(randomization factor 0.5)이 들어간다고 한다. 위 숫자는 기준값이고 실제 간격은 조금씩 다르다

---

## 해결 2. 재시도로 못 막는 부분 쓰기

시트를 통째로 갱신하는 코드는 보통 여러번의 호출로 나뉜다

1. `values().clear`로 기존 값 비우기
2. 병합 해제
3. `values().update`로 새 값 쓰기
4. 서식 적용

재시도를 붙여도 각 호출이 따로따로 재시도될 뿐이라 1번이 성공하고 3번이 재시도 끝에 결국 실패하면 시트는 비워진 채로 남아버린다
일시 장애는 재시도로 해결하면 되지만 부분 쓰기는 원자성으로 풀어야하는 다른 문제였다

### spreadsheets.batchUpdate는 원자적이다

Sheets API의 `spreadsheets.batchUpdate`는 요청 여러개를 한번에 보내고 서버가 <mark class="hltr-cyan">전부 적용하거나 하나도 적용하지 않는다</mark>
그래서 비우기 + 쓰기 + 서식을 이 안에 넣으면 실패했을때 시트는 이전 상태 그대로 남는다

비우기는 따로 호출할 필요도 없었다. `UpdateCellsRequest`의 범위를 실제 데이터보다 넓게 잡으면 데이터가 안 채워진 나머지 셀은 `fields`에 지정한 항목 기준으로 비워진다

```kotlin
// 예시 코드
val requests = mutableListOf<Request>()

// 데이터가 시트 그리드보다 길면 행을 먼저 늘린다 (values().update의 자동 확장 대신)
if (rows.size > grid.rowCount) {
    requests += Request().setAppendDimension(
        AppendDimensionRequest().setSheetId(sheetId)
            .setDimension("ROWS").setLength(rows.size - grid.rowCount)
    )
}

requests += Request().setUnmergeCells(
    UnmergeCellsRequest().setRange(GridRange().setSheetId(sheetId))
)

// 범위를 시트 끝까지 잡아서 남는 셀은 비워지게
requests += Request().setUpdateCells(
    UpdateCellsRequest()
        .setRange(
            GridRange().setSheetId(sheetId)
                .setStartRowIndex(0).setEndRowIndex(maxOf(rows.size, grid.rowCount))
                .setStartColumnIndex(0).setEndColumnIndex(grid.columnCount)
        )
        .setRows(rows.map { it.toRowData() })
        .setFields("userEnteredValue,userEnteredFormat")
)

sheets.spreadsheets()
    .batchUpdate(spreadsheetId, BatchUpdateSpreadsheetRequest().setRequests(requests))
    .execute()
```

덤으로 탭 여러개를 갱신하는 데 드는 API 호출이 <mark class="hltr-cyan">9회 -> 3회</mark>로 줄었다. 호출 수가 줄면 503을 만날 확률도 같이 줄어든다


---

## 주의점

### 값은 타입을 명시해서 넣기

`values().update`를 `USER_ENTERED`로 쓰면 시트가 사람이 입력한 것처럼 값을 해석해서 문자열이 `=`로 시작하면 <mark class="hltr-cyan">수식으로 실행</mark>된다
사용자가 입력한 제목 같은 값을 그대로 넣으면 시트에서 외부 URL을 불러오는 함수 같은것도 실행될 수 있다(수식 주입)

그래서 `UpdateCellsRequest`에서는 `ExtendedValue`로 타입을 정해서 넣어주었다

```kotlin
// 예시 코드
fun cell(value: Any?): CellData = CellData().setUserEnteredValue(
    when (value) {
        is Number -> ExtendedValue().setNumberValue(value.toDouble())
        null -> ExtendedValue().setStringValue("")
        else -> ExtendedValue().setStringValue(value.toString())   // "=..."도 문자열 그대로
    }
)
```

대신 시트가 알아서 해주던 해석도 같이 사라진다

- 날짜 문자열은 날짜 셀이 아니라 문자열 셀이 된다. `yyyy-MM-dd HH:mm:ss` 형식이면 사전순 정렬이 곧 시간순이라 정렬은 문제없음
- 비율 같은 숫자는 문자열로 포맷하지 말고 숫자로 넣고 표시는 셀 서식(`0.00`)에 맡긴다

### 재시도는 멱등한 요청에만 안전하다

전체를 덮어쓰는 요청은 두번 적용돼도 결과가 같다
반면 `AppendDimension`처럼 늘리라는 요청은 서버에선 성공했는데 응답만 유실된 경우 재시도하면 두번 적용될 수 있다
위 코드는 범위를 `maxOf(rows, grid)`로 잡아서 행이 더 늘어나도 빈 행이 생길 뿐이지만 추가형 요청을 재시도할땐 이걸 한번 따져봐야한다

---

재시도만 붙이면 끝날줄 알았는데 401 핸들러랑 부분 쓰기까지 같이 보게 된 작업이었다
