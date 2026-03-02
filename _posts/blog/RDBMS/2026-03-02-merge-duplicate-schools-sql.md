---
title: "[MySQL] 중복 마스터 데이터 SQL로 병합하기 - ROW_NUMBER, 매핑 테이블, 복합 PK 충돌"
category: RDBMS
tags:
  - mysql
  - sql
  - migration
  - data-cleanup
  - window-function
last_modified_at: 2026-03-02
---

## 발단

학력을 입력할때 학교를 검색해서 고르는데 목록에 없으면 직접 새로 등록할 수 있다
그런데 이미 있는 학교를 고르지 않고 새로 만든 경우가 계속 쌓여서 <mark class="hltr-cyan">이름과 유형이 똑같은 학교가 여러개</mark> 생겨 있었다

이걸 SQL 스크립트 하나로 합치기로 했다(앞으로 중복이 안 생기게 막는건 별도 작업으로 뺐음)

---

## 병합은 행을 지우는게 아니라 참조를 옮기는 일

처음엔 "하나 남기고 지우면 되겠지" 생각했는데 실제로 일이 많은 쪽은 <mark class="hltr-cyan">그 행을 가리키고 있는 다른 테이블</mark>이었다
학교를 바로 지우면 FK가 걸려있으면 에러가 나고 FK가 없으면 조용히 고아 데이터가 생긴다

그래서 순서를 이렇게 잡았다

1. 그룹마다 남길 대표를 고른다
2. "지울 id -> 남길 id" 매핑을 만든다
3. 참조하는 테이블을 전부 대표 id로 옮긴다
4. 사용 횟수 같은 집계 값은 대표에 합친다
5. 마지막에 중복 행을 지운다
6. 검증

병합 기준은 이름 + 학교 유형으로 잡았다. 이름이 같아도 유형이 다르면 다른 기관일 수 있어서 이름만으로 묶으면 안된다고 봤다
대표는 사용 횟수가 많은 것 -> 이미지가 등록된 것 -> id가 작은 것(먼저 만들어진 것) 순으로 골랐다

학교를 참조하는 테이블은 다섯개였고 키 구조에 따라 처리 방법이 달랐다

| 참조 테이블 | 키 구조 | 처리 |
|---|---|---|
| 학력 A | school_id NOT NULL | UPDATE |
| 학력 B | school_id NULL 허용 | UPDATE |
| 학교 태그 | school_id NOT NULL | UPDATE |
| 유저-학교 검색 매핑 | (user_id, school_id) 복합 PK | 충돌 행 DELETE 후 UPDATE |
| 학교 검색용 | school_id가 PK | DELETE만 |

---

## 1. 대표 고르기: ROW_NUMBER

```sql
-- 예시 코드
CREATE TEMPORARY TABLE school_primary (INDEX idx_name_type (name, type)) AS
SELECT name, type, id AS primary_id
FROM (
    SELECT id, name, type,
           ROW_NUMBER() OVER (
               PARTITION BY name, type
               ORDER BY usage_count DESC,
                        (image_url IS NOT NULL AND image_url <> '') DESC,
                        id ASC
           ) AS rn
    FROM school
) ranked
WHERE rn = 1;
```

- `PARTITION BY name, type`
	- 같은 이름+유형끼리 묶고 그 안에서 순위를 매긴다. GROUP BY와 달리 행이 줄어들지 않아서 id를 같이 꺼낼 수 있음
- `ROW_NUMBER`
	- 동점이어도 1, 2, 3.. 으로 번호를 겹치지 않게 준다. `RANK`를 쓰면 동점일때 1등이 두개 나와서 대표가 두개가 되어버림
- 마지막 `id ASC`
	- 결과를 고정하려고 넣었다. 정렬 기준이 전부 같으면 ROW_NUMBER는 그중 아무 행에나 1을 줄 수 있어서 실행할때마다 대표가 바뀔 수 있다

조건식을 그대로 정렬 기준으로 쓴 부분도 있는데 MySQL에서 비교식은 참이면 1 거짓이면 0이라 `DESC`면 이미지가 있는 쪽이 먼저 온다
`image_url <> ''`만 쓰면 image_url이 NULL인 행은 결과가 NULL이 되는데 앞에 `IS NOT NULL AND`를 붙이면 `FALSE AND NULL`은 FALSE라서 NULL과 빈 문자열이 둘다 깔끔하게 0이 된다

---

## 2. 매핑 테이블

```sql
-- 예시 코드
CREATE TEMPORARY TABLE school_merge_map (
    PRIMARY KEY (old_id),
    INDEX idx_new_id (new_id)
) AS
SELECT s.id AS old_id, p.primary_id AS new_id
FROM school s
JOIN school_primary p ON s.name = p.name AND s.type = p.type
WHERE s.id <> p.primary_id;
```

뒤에 나오는 모든 UPDATE와 DELETE는 이 테이블 하나만 보고 움직이게 했다
테이블마다 "대표가 누구지"를 다시 계산하면 그중 하나만 조건이 어긋나도 데이터가 엉뚱한 곳으로 가기때문

`old_id`를 PK로 둔 것도 이유가 있다
UPDATE JOIN은 한 행에 매칭되는 행이 여러개면 그중 아무거나 하나로 바꿔버리는데 old_id가 유일하다는걸 키로 보장해두면 그런 일이 구조적으로 안 생긴다
new_id 인덱스는 뒤에서 큰 참조 테이블과 JOIN 할때 쓰인다

인덱스를 `ALTER TABLE`로 따로 걸지 않고 CREATE 안에 같이 넣은 이유는 아래 주의점에서 설명

---

## 3. 참조 옮기기

단순한 테이블은 영향 건수를 먼저 세고 UPDATE JOIN으로 옮겼다

```sql
-- 예시 코드
SELECT COUNT(*) FROM education_a e
JOIN school_merge_map m ON e.school_id = m.old_id;

UPDATE education_a e
JOIN school_merge_map m ON e.school_id = m.old_id
SET e.school_id = m.new_id;
```

### 복합 PK 테이블은 그냥 UPDATE하면 터진다

유저-학교 검색 매핑은 `(user_id, school_id)`가 PK다
한 유저가 `(1, A)`(지울 학교)와 `(1, B)`(대표)를 둘다 갖고 있을때 A를 B로 바꾸는 순간 `(1, B)`가 두개가 되면서 <mark class="hltr-cyan">Duplicate entry 에러</mark>가 난다
InnoDB는 문장 하나가 에러나면 그 문장이 바꾼걸 전부 되돌리기때문에 충돌이 딱 한건만 있어도 UPDATE 전체가 실패한다

그래서 대표 학교를 이미 갖고 있는 행은 먼저 지우고 남은 행만 바꿔주었다

```sql
-- 예시 코드
-- 1) 같은 유저가 대표 학교를 이미 갖고 있으면 중복 학교 쪽 행은 삭제
DELETE us FROM user_school_index us
JOIN school_merge_map m ON us.school_id = m.old_id
JOIN user_school_index dup
  ON dup.user_id = us.user_id AND dup.school_id = m.new_id;

-- 2) 남은 행만 대표 학교로
UPDATE user_school_index us
JOIN school_merge_map m ON us.school_id = m.old_id
SET us.school_id = m.new_id;
```

처음엔 1번을 `WHERE EXISTS (SELECT 1 FROM user_school_index ...)`로 썼었는데
MySQL은 DELETE/UPDATE 대상 테이블을 같은 문장의 서브쿼리에서 다시 읽는걸 막는다고 한다 (`ERROR 1093: You can't specify target table ... for update in FROM clause`)
멀티 테이블 DELETE에서 셀프 조인으로 쓰면 이 제한에 안 걸리고 `DELETE us`로 지우는 쪽도 명확해진다

`UPDATE IGNORE`로 충돌나는 행만 건너뛰게 하는 방법도 있다
다만 IGNORE는 중복 키 말고 다른 에러(값 잘림 같은)까지 경고로 바꿔버려서 마이그레이션에서는 문제를 숨길까봐 안 썼다(건너뛴 행을 따로 지워야 하는것도 똑같고)

### PK가 곧 school_id인 테이블은 DELETE만

```sql
-- 예시 코드
DELETE ss FROM school_search ss
JOIN school_merge_map m ON ss.school_id = m.old_id;
```

대표 학교의 행은 이미 있으니 바꿀게 없다. 바꾸려고 하면 똑같이 PK 충돌이다

---

## 4. 사용 횟수 합치고 원본 지우기

```sql
-- 예시 코드
UPDATE school s
JOIN (
    SELECT m.new_id, SUM(old.usage_count) AS total
    FROM school_merge_map m
    JOIN school old ON old.id = m.old_id
    GROUP BY m.new_id
) agg ON s.id = agg.new_id
SET s.usage_count = s.usage_count + agg.total;

DELETE s FROM school s
JOIN school_merge_map m ON s.id = m.old_id;
```

그럼 여기서는 왜 1093이 안날까?
UPDATE 대상인 school을 파생 테이블 안에서 다시 읽는데도 괜찮은 이유는 GROUP BY가 있는 파생 테이블은 바깥 쿼리에 합쳐지지 않고 <mark class="hltr-cyan">먼저 임시 결과로 만들어진 다음(materialize)</mark> 쓰이기 때문이라고 한다. 1093을 피하는 흔한 우회법이기도 하다

순서도 중요한데 합산은 삭제 전에 해야한다(지우고 나면 지워진 행의 사용 횟수를 읽을 수가 없음)
삭제는 참조를 다 옮긴 다음에. 안그러면 FK 에러나 고아 데이터가 생긴다

---

## 주의: 트랜잭션으로 감쌌는데 롤백이 안 되는 경우

이런 스크립트는 `START TRANSACTION`으로 감싸서 돌리고 결과가 이상하면 ROLLBACK 하려고 한다
그런데 MySQL에는 <mark class="hltr-cyan">문장 자체가 트랜잭션을 커밋해버리는</mark> 경우(implicit commit)가 있다. DDL이 대표적이다

`CREATE TEMPORARY TABLE`과 `DROP TEMPORARY TABLE`은 예외로 커밋을 안하는데 임시 테이블이라도 `ALTER TABLE`이나 `CREATE INDEX`는 커밋을 일으킨다

```sql
-- 예시 코드 (이렇게 하면 안 된다)
START TRANSACTION;
CREATE TEMPORARY TABLE school_merge_map AS SELECT ...;      -- 커밋 안 함
ALTER TABLE school_merge_map ADD INDEX idx_old_id (old_id); -- 여기서 암묵적 커밋
UPDATE education_a ...;  -- autocommit=1이면 이 문장은 바로 커밋된다
ROLLBACK;                -- 되돌릴게 없다
```

암묵적 커밋이 일어나면 트랜잭션은 거기서 끝나고 뒤의 문장들은 autocommit 모드로 하나씩 바로 커밋되어서 마지막 ROLLBACK은 아무것도 못 되돌린다
에러도 경고도 없어서 "트랜잭션 안에서 돌렸으니 괜찮다"고 믿기 쉽다;;

그래서 트랜잭션으로 감싸서 돌릴 스크립트라면 인덱스는 `CREATE TEMPORARY TABLE ... (INDEX ...) AS SELECT`처럼 만들때 같이 선언해야한다. 위 예시 코드들이 그렇게 돼 있는 이유이다

하나 더 있는데 MySQL 임시 테이블은 한 쿼리 안에서 두번 참조할 수 없다 (`Can't reopen table`)
매핑 테이블을 셀프 조인하거나 서브쿼리에서 한번 더 읽으면 이 에러가 나서 위 쿼리들은 매핑 테이블을 문장마다 딱 한번씩만 쓰고 있다

>[!실행 전에 할 것]
>
>- 트랜잭션으로 감싸더라도 중간에 DDL이 끼어있지 않은지 확인. 그래도 백업은 따로
>- 복합 PK 테이블은 UPDATE 전에 충돌 행부터 DELETE
>- PK가 school_id인 테이블은 UPDATE 하지 말고 DELETE만
>- 검색 엔진 인덱스처럼 DB 밖에 있는 복사본은 SQL이 안 지워준다. 끝나면 재색인
>

---

## 검증

실행 전에 중복 그룹 수와 지워질 행 수를 뽑아두고 실행 후에는 이 두 쿼리가 0건인지 확인했다

```sql
-- 예시 코드
-- 1. 중복이 남아있지 않은지
SELECT name, type, COUNT(*) FROM school
GROUP BY name, type HAVING COUNT(*) > 1;

-- 2. 없는 학교를 가리키는 참조가 없는지
SELECT COUNT(*) FROM education_b e
LEFT JOIN school s ON e.school_id = s.id
WHERE e.school_id IS NOT NULL AND s.id IS NULL;
```

NULL을 허용하는 테이블은 2번에 `e.school_id IS NOT NULL`을 꼭 넣어야한다
빼먹으면 원래 학교가 비어있던 행도 LEFT JOIN 결과에서 `s.id IS NULL`이 되서 고아로 잡힌다

---

지우는것보다 참조를 옮기는게 훨씬 일이 많았고 특히 복합 PK랑 암묵적 커밋은 모르고 돌렸으면 꽤 위험했을것같다
