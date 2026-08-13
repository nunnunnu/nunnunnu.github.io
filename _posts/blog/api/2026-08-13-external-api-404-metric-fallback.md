---
title: "[외부API연동] 외부 API가 404를 주면 0으로 넣지 말 것 - 폴백과 GREATEST upsert"
category: 외부API연동
tags:
  - batch
  - external-api
  - mysql
  - upsert
last_modified_at: 2026-08-13
---

## 발단

메시지 캠페인의 발송 수/오픈 수/클릭 수를 매일 모아서 리포트 테이블에 쌓는 배치를 손보게 되었다
외부 메시지 서비스에서 오래된 메시지가 만료되면 통계 조회 API가 404를 주는데 그때마다 <mark class="hltr-cyan">발송 수가 0으로 덮어써지고</mark> 있었다

클릭 수는 멀쩡한데 발송 수만 0이 되니 클릭률(클릭 / 발송)이 깨져버렸다. 리포트에서 제일 중요한 숫자가 제일 이상하게 나오는 상황;;

---

## 출처가 섞인 지표

이 리포트의 숫자는 출처가 두군데이다

- 외부 서비스 통계 API
	- 발송 수와 오픈 수
	- 404나 타임아웃으로 실패할 수 있음
- 우리 DB의 클릭 로그
	- 클릭 수
	- 거의 실패하지않음

출처가 다르니 실패하는 방식도 다른데 한쪽만 실패해서 0이 되면 지표끼리 모순이 생긴다

- 발송 0 / 클릭 120 -> 클릭률 계산 불가
- 발송 0 / 오픈 120 -> 아무도 안 받았는데 120명이 열었다?

---

## 문제의 코드

```kotlin
// 예시 코드
val stats = try {
    messageClient.getStats(schedule.externalId)
} catch (e: NotFoundException) {
    MessageStats(sentCount = 0, openedCount = 0)   // 404면 0
}

reportRepository.upsert(campaignId, stats.sentCount, stats.openedCount, clickCount)
```

```sql
-- 예시 코드 (MySQL)
INSERT INTO message_report (campaign_id, sent_cnt, opened_cnt, click_cnt)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  sent_cnt   = VALUES(sent_cnt),
  opened_cnt = VALUES(opened_cnt),
  click_cnt  = VALUES(click_cnt);
```

어제까지 잘 쌓인 값이 있어도 오늘 404가 나면 upsert가 그걸 0으로 덮어버린다

---

## 원인

404가 의미하는건 발송이 0건이라는게 아니라 <mark class="hltr-cyan">"외부 서비스가 더 이상 그 데이터를 안 들고 있다"</mark>는 것이다. 그냥 모른다는 뜻
그런데 코드는 모름과 0을 같은 값으로 다뤘고 upsert는 그 0을 진짜 값으로 믿고 덮어써버렸다

그래서 두 단계로 나눠서 고치기로 했다

1. 조회할때 모르는 값을 다른 데서 채울 수 있는지 (폴백)
2. 저장할때 모르는 값이 기존의 맞는 값을 덮지 않게 할 수 있는지 (upsert 가드)

---

## 해결 1. 다른 출처로 폴백

찾아보니 우리 쪽에도 발송 수가 있었다. 발송이 끝났을때 완료 여부를 폴링하면서 전송 수를 저장해두고 있어서 404면 그 값으로 채우도록 했다

```kotlin
// 예시 코드
var sentCnt = 0
var openedCnt = 0
val missing = mutableListOf<Schedule>()

schedules.forEach { schedule ->
    val res = messageClient.getStatsOrNull(schedule.externalId)   // 404면 null
    if (res == null) {
        missing += schedule
        sentCnt += schedule.savedSentCount ?: 0   // 우리 쪽에 저장된 전송 수로 폴백
        // 오픈 수는 외부에만 있어서 복구 불가
    } else {
        sentCnt += res.sentCount      // 정상 응답이면 외부 값이 우선
        openedCnt += res.openedCount
    }
}

if (missing.isNotEmpty()) {
    alert("발송 수 폴백 ${missing.size}건, 오픈 수 과소집계")
}
```

정상 응답이면 외부 값을 우선으로 쓴다. 우리 쪽 값은 폴링 시점에 멈춘 스냅샷이라 낡았을 수 있기때문이다(이 우선순위는 테스트로 고정해두었다)

오픈 수는 외부에만 있어서 복구할 방법이 없었다. 대신 알림에 "과소집계"라고 적어서 숫자를 보는 사람이 알수있게 했다

그리고 404를 예외로 던지지않고 `null`로 돌려주는 메서드를 따로 둬서 호출하는 쪽이 "없음"을 값으로 다루게 해주었다

---

## 해결 2. 단조 증가 값은 GREATEST upsert

폴백을 해도 오픈 수는 그 회차에 0이 되고 발송 수도 폴백 값이 비어있으면 0이 된다
이건 저장 단계에서 막아야했다

발송 수와 오픈 수는 <mark class="hltr-cyan">단조 증가</mark>하는 값이다. 한번 받은 사람이 안 받은 사람이 되지않고 한번 연 사람이 안 연 사람이 되지도 않는다
그러니 새 값이 기존 값보다 작으면 새 값이 틀린거라고 봐도 된다

```sql
-- 예시 코드 (MySQL)
INSERT INTO message_report (campaign_id, sent_cnt, opened_cnt, click_cnt)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  sent_cnt   = GREATEST(COALESCE(sent_cnt, 0),   VALUES(sent_cnt)),
  opened_cnt = GREATEST(COALESCE(opened_cnt, 0), VALUES(opened_cnt)),
  click_cnt  = VALUES(click_cnt);
```

이렇게 하면 일시적으로 0이 들어와도 기존 값이 유지되고 외부 서비스가 복구되면 바로 다시 올라간다

발송 수와 오픈 수는 같은 규칙으로 묶어주었다. 오픈 수만 가드하면 "발송 0 / 오픈 120" 모순이 그대로 남기때문
클릭 수는 우리 DB 로그를 매번 처음부터 다시 세는 값이라 실패할 일이 거의 없어서 그대로 덮어쓴다

### 그럼 COALESCE는 왜 필요할까?

MySQL의 `GREATEST`는 <mark class="hltr-cyan">인자 중 하나라도 NULL이면 NULL을 돌려준다</mark>고 한다
기존 행 값이 NULL이면 `GREATEST(NULL, 120)`은 120이 아니라 NULL이 되고 그 다음날도 그 다음날도 계속 NULL이다. 한번 NULL이 되면 영원히 고착되는것..
그래서 `COALESCE(기존, 0)`으로 NULL을 0으로 바꿔놓고 비교해야한다

>[!VALUES() 함수는 deprecated]
>
>MySQL 8.0.20부터 `ON DUPLICATE KEY UPDATE` 안의 `VALUES(col)`은 deprecated다
>8.0.19 이상이면 행 별칭을 쓰는 방식으로 바꿀 수 있다
>`INSERT INTO t (a, b) VALUES (?, ?) AS new ON DUPLICATE KEY UPDATE b = GREATEST(COALESCE(t.b, 0), new.b)`
>

---

## 집계 실패 상태 컬럼은?

처음엔 집계가 실패한 회차를 표시하는 상태 컬럼을 두려고 했는데 따져보니 과했다

상태 컬럼이 캠페인 단위로 하나라면 메시지 하나가 실패해도 같은 캠페인에 묶인 다른 채널까지 실패로 표시되고 재시도 대상이 되어버린다
그리고 정작 숫자를 보는 사람은 DB 컬럼이 아니라 리포트를 보기때문에 컬럼에 적어도 아무도 안 본다

그래서 상태 컬럼 대신 값을 망가뜨리지 않는 upsert + 사람이 보는 알림 조합으로 갔다

---

## 주의점

`GREATEST` 가드는 값이 안 내려간다는게 장점이자 단점이다
외부 서비스가 중복을 걸러내서 값이 정당하게 줄어들어도 반영이 안되고 잘못 들어간 큰 값을 고치려면 수동으로 UPDATE 해줘야한다
그래서 절대 안 줄어든다고 확신할 수 있는 지표에만 써야한다

---

404를 0으로 바꾸는 순간 그게 진짜 값처럼 저장된다는걸 이번에 제대로 알게되었다
모르는 값은 모르는 채로 다루고 복구 못하는건 알림으로라도 드러내는게 맞는것 같다
