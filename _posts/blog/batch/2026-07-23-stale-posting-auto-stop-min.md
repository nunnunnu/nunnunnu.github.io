---
title: "[배치] 방치 판정 기준 시각은 MAX가 아니라 MIN - 새 이벤트가 타이머를 리셋하는 문제"
category: 배치
tags:
  - batch
  - sql
  - aggregation
  - design
last_modified_at: 2026-07-23
---

## 발단

지원은 계속 들어오는데 아무도 응답하지 않는 공고를 <mark class="hltr-cyan">자동으로 게시중단</mark>하는 배치를 설계했다
처음 판정 기준은 접수 상태 지원서 중 가장 최근 상태 변경 시각(MAX)이 56일 이전인 공고였다

그런데 같은 데이터를 보는 다른 배치와 같이 놓고 보니 이 기준은 거의 발동하지 않았고 발동하더라도 정작 잡아야 할 공고를 못잡는 구조였다

---

## 방치 판정 쿼리의 구조

이 공고가 방치됐나를 판정하는 쿼리는 세 부분으로 나눠볼 수 있다

1. 신호: 어떤 지원서를 응답 없음의 근거로 볼지(WHERE)
2. 기준 시각(clock): 신호 지원서 여러개 중 어떤 시각을 대표로 쓸지(MAX / MIN)
3. 하한(floor): clock이 이보다 앞서면 안되는 시각(재게시 유예 같은 것)

처음 쿼리는 이랬다

```sql
-- 예시 코드 (MySQL)
SELECT p.id
FROM posting p
JOIN application a ON a.posting_id = p.id
WHERE p.published = 1
  AND p.hiring = 1
  AND a.status = 'RECEIVED'                               -- 1. 신호
GROUP BY p.id
HAVING MAX(a.status_changed_at) <= NOW() - INTERVAL 56 DAY;  -- 2. clock
```

이번에 만난 문제 두개는 각각 1번과 2번에서 나왔다

---

## 문제 1. 다른 배치가 신호를 먼저 지운다

같은 지원서 테이블을 보는 배치가 하나 더 있었다

- 지원서 배치(A): 28일 동안 응답이 없으면 지원서를 접수 -> 채용중단으로 바꾼다
- 공고 배치(B): 접수 상태인 지원서만 보고 56일 판정

타임라인으로 그려보면 바로 보인다

| 지원 후 경과 | 지원서 상태 | B가 보는 신호 |
|---|---|---|
| 0일 | 접수 | 있음 |
| 28일 | A가 채용중단으로 변경 | 없음 |
| 56일 | 채용중단 | 없음 -> B 판정 불가 |

56일까지 접수로 버티는 지원서가 없으니 B의 필터에서 다 빠져서 평상시에 B는 사실상 안돈다


처음엔 A가 상태 변경 시각을 갱신해서 그런줄 알았는데 원인은 시각이 아니라 <mark class="hltr-cyan">status 필터</mark>였다
시각을 원본대로 둬도 상태가 바뀌는 순간 B의 WHERE에서 빠져버린다

>[!각자 맞는 로직이 합치면 틀린다]
>
>A와 B를 따로 보면 둘다 맞는데 A의 출력이 B의 입력을 지우고 있었다
>같은 테이블을 보는 배치가 여러개면 누가 먼저 이 행을 바꾸나를 타임라인으로 그려봐야 한다
>

### 신호를 현재 상태에서 분리하기

신호를 지금 접수 상태인가가 아니라 응답 없이 방치된 적이 있나로 다시 정의했다

- 아직 진행중 상태로 남은 지원서
- 시스템이 자동으로 중단시킨 지원서도 포함
- 기업이 직접 중단한 지원서는 제외

기업이 직접 처리했다면 방치가 아니지만 시스템이 대신 정리한 지원서는 응답이 없었다는 흔적 그대로이기때문이다

이걸 구분하려면 지원서에 시스템이 중단시켰다는 표시가 있어야 해서 컬럼을 추가했는데 boolean 대신 <mark class="hltr-cyan">timestamp</mark>를 골랐다

```sql
-- 예시 코드 (MySQL)
-- boolean: 시스템이 멈췄는지만 안다
ALTER TABLE application ADD COLUMN system_stopped BOOLEAN NOT NULL DEFAULT FALSE;

-- timestamp: 멈췄는지(NOT NULL) + 언제 멈췄는지
ALTER TABLE application ADD COLUMN system_stopped_at DATETIME NULL;
```

`IS NOT NULL`로 boolean과 똑같이 쓸 수 있고 언제 자동 중단됐는지를 화면 표시나 문의 대응에 바로 쓸 수 있다
나중에 시각이 필요해져서 boolean을 timestamp로 바꾸면 이미 쌓인 행의 시각은 복구할 방법이 없으니 처음부터 시각으로 남기는게 싸다

그리고 A가 지원서를 중단시킬때 상태 변경 시각은 원본 그대로 둔다(이전 글)
그래서 자동 중단된 지원서도 원래 언제부터 방치됐는지를 신호 시각으로 그대로 쓸 수 있다

---

## 문제 2. MAX는 새 이벤트가 타이머를 리셋한다

신호를 고치고 나니 두번째 문제가 보였다. clock을 MAX로 잡으면 <mark class="hltr-cyan">새 지원자가 들어올때마다 타이머가 리셋</mark>된다

예를 들어 어떤 공고에 지원이 80일 전 40일 전 10일 전 이렇게 세번 들어왔고 기업은 하나도 응답하지 않았다고 해보자

- MAX 기준: 가장 최근 지원 = 10일 전 -> 56일이 안됐으니 방치 아님
- MIN 기준: 가장 오래 기다린 지원 = 80일 전 -> 방치

MAX로 하면 지원이 꾸준히 들어오는 공고일수록 영영 안닫힌다. 응답은 없고 지원만 빨려 들어가는 블랙홀 공고..

### 어떤 이벤트가 타이머를 리셋할 자격이 있나

MAX와 MIN은 취향 문제가 아니라 묻는 질문이 다르다

- MAX: 마지막 활동 이후 얼마나 지났나(idle timeout). 세션 만료처럼 활동하는 쪽이 같은 주체일때 맞다
- MIN: 가장 오래 기다린 건이 얼마나 기다렸나(aging). 응답해야 하는 쪽과 이벤트를 만드는 쪽이 다를때 맞다

여기서 응답해야 하는 쪽은 기업인데 이벤트(지원)를 만드는 쪽은 지원자라서 지원자의 행동이 기업의 방치 타이머를 리셋하면 안된다
그래서 <mark class="hltr-cyan">이 타이머를 리셋할 자격이 있는 이벤트만 clock에 넣는다</mark>를 기준으로 MIN을 골랐다

### 재게시 유예와 GREATEST의 NULL 함정

기업이 공고를 다시 게시하면 그 시점부터 다시 기회를 주기로 해서(재게시 유예) clock이 게시 시작 시각보다 앞서지 않게 하한을 뒀다

```sql
-- 예시 코드 (MySQL)
HAVING GREATEST(MIN(s.status_changed_at), p.publish_start_at) <= NOW() - INTERVAL 56 DAY
```

깔끔해 보이지만 MySQL의 `GREATEST`는 <mark class="hltr-cyan">인자 중 하나라도 NULL이면 NULL을 돌려준다</mark>
게시 시작 시각이 비어 있는 공고는 clock이 NULL이 되고 `NULL <= ...`은 참이 아니니 영원히 대상에서 빠진다

그래서 조건을 풀어서 썼다

```sql
-- 예시 코드 (MySQL)
SELECT p.id
FROM posting p
JOIN application a ON a.posting_id = p.id
WHERE p.published = 1
  AND p.hiring = 1
  AND a.enabled = 1
  AND (
        a.status IN ('RECEIVED', 'DOC_PASSED', 'INTERVIEW_PASSED')
     OR (a.status = 'STOPPED' AND a.system_stopped_at IS NOT NULL)
  )
GROUP BY p.id
HAVING MIN(a.status_changed_at) <= :cutoff
   AND (MAX(p.publish_start_at) IS NULL OR MAX(p.publish_start_at) <= :cutoff);
```

`GREATEST(x, y) <= c`는 `x <= c AND y <= c`와 같아서 이렇게 풀면 y가 NULL일때의 처리를 직접 정할 수 있다
(GROUP BY 안에서 공고 컬럼을 쓰려고 `MAX()`로 감쌌는데 공고당 값이 하나라 결과는 같다)

재게시 유예가 실제로 걸리는지도 확인해보았다
즉시 게시 / 예약 게시 / 재활성화 세 경로 모두 게시 시작 시각을 갱신하고 있었다. 한 경로라도 갱신을 안하면 유예는 그 경로에서만 조용히 안걸리게 된다

---

## 트레이드오프와 주의점

### 활발한 공고도 닫힐 수 있다

MIN으로 바꾸면 지원이 활발한 공고라도 56일 넘게 방치된 지원서가 1건만 있어도 대상이 되는데 이건 감수하기로 했다
닫기 전에 경고 메일이 여러번 나가서 완충이 되고 기업이 그 지원서 하나만 처리하면 clock이 다음으로 오래된 지원서로 넘어가기때문이다

### 판정 쿼리와 경고 쿼리는 같은 clock

곧 닫힌다는 경고 메일 대상과 실제 중단 대상의 기준이 다르면 경고를 받았는데 안닫히거나 경고 없이 닫힌다
그래서 둘이 같은 clock 함수를 공유하고 경계값만 다르게 넘기게 했다

```kotlin
// 예시 코드 (QueryDSL)
private val oldestSignalAt = application.statusChangedAt.min()
private val publishStartAt = posting.publishStartAt.max()

// clock <= bound
private fun clockLoe(bound: LocalDateTime): BooleanExpression =
    oldestSignalAt.loe(bound)
        .and(publishStartAt.isNull.or(publishStartAt.loe(bound)))

// clock > bound
private fun clockGt(bound: LocalDateTime): BooleanExpression =
    oldestSignalAt.gt(bound).or(publishStartAt.gt(bound))

fun findStoppable(cutoff: LocalDateTime) =
    baseQuery().having(clockLoe(cutoff)).fetch()

fun findWarnable(windowStart: LocalDateTime, windowEnd: LocalDateTime) =
    baseQuery().having(clockGt(windowStart).and(clockLoe(windowEnd))).fetch()
```

덕분에 MAX -> MIN 전환도 헬퍼 한곳만 바꾸니 두 쿼리에 같이 적용됐다

---

처음엔 MAX냐 MIN이냐만 고민했는데 실제로는 옆 배치가 신호를 먼저 지우는게 더 큰 문제였다
같은 테이블을 보는 배치가 있으면 타임라인부터 그려봐야겠다
