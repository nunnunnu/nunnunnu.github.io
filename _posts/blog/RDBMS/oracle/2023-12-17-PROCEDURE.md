---
title: "[Oracle] 프로시저 문법 정리"
last_modified_at: 2023-12-23
category: RDBMS
tags:
  - RDBMS
  - oracle
  - 프로시저
---
>[!프로시저]
>데이터베이스 내에서 특정 작업을 수행하는 코드블럭. 반환값을 내보낼 수 없음

### 기본 구조

```sql
-- 프로시저 생성
CREATE OR REPLACE PROCEDURE {프로시저 명}  
(  
	-- 매개변수 선언부
    {매개변수 명}    [IN||OUT||IN OUT] {TYPE}
)  
IS  
	-- 변수 선언부
	{변수명}  {TYPE}
	
BEGIN  
  -- 프로시저 본문
  -- 실행할 로직을 구현
	
	EXCEPTION   
		WHEN {조건} THEN
		-- 예외 발생 시 로직
  
END; -- 종료
```


#### 매개변수 선언부

```sql
CREATE OR REPLACE PROCEDURE TEST_PRC
(  
	-- 매개변수 선언부
    P_PARAM1    IN VARCHAR2(10), -- 입력용
    P_PARAM2    OUT VARCHAR2(10), -- 출력용
    P_PARAM3    IN OUT TABLE.COLUMN%TYPE -- 입/출력 둘다 가능, 선언 DB컬럼타입 적용
)  
```

- IN, OUT, IN OUT
	- IN: 외부에서 매개변수를 받음
	- OUT: 매개변수를 밖으로 내보냄 (데이터를 외부에 저장할 때)
	- IN OUT: IN, OUT 기능 모두 사용 가능

- 변수 타입: 스칼라 변수(VARCHAR2 등), 레퍼런스 변수(TABLE.COLUMN%TYPE) 모두 사용가능

#### 변수 선언부

```sql
IS  
	-- 변수 선언부
	V_VAL1 VARCHAR2(10);
	V_VAL2 TABLE_NAME.COLUMN_NAME%TYPE;
	V_VAL3 VARCHAR2(10) := '10'; -- 값 할당
BEGIN  
```

- 변수 타입: 스칼라 변수(VARCHAR2 등), 레퍼런스 변수(TABLE.COLUMN%TYPE) 모두 사용가능
- := 연산자로 값 할당 가능

#### 프로시저 본문
```sql
BEGIN  
  -- 프로시저 본문
  -- 실행할 로직을 구현함
	
	EXCEPTION  
		-- 예외처리
		-- 로직 수행 중 에러가 발생하였을때 처리할 방법
  
END; -- 종료
```

- select문으로 변수에 값 저장
	```sql
	CREATE OR REPLACE PROCEDURE TEST_PRC
	(  
	    P_PARAM  IN TABLE.COLUMN%TYPE
	)  
	IS
		V_VAL TABLE.COLUMN%TYPE;
	BEGIN
		SELECT 
			ORIGIN_COLUM1,
			ORIGIN_COLUM2 
			INTO 
			P_PARAM, 
			V_VAL -- 순서대로 저장됨
		FROM ORIGIN_TABLE;
	END
	```
	select 쿼리로 조회한 컬럼의 값을 INTO 로 프로시저 선언부에서 선언한 변수에 저장 가능.

- if문
	```sql
	CREATE OR REPLACE PROCEDURE TEST_PRC
	(  
		TYPE  IN VARCHAR2(10)
	)  
	IS
		V_VAL TABLE.COLUMN%TYPE;
	BEGIN
		IF TYPE = 'BOOK' THEN
		   SELECT 
			   BOOK_COLUMN INTO V_VAL
		   FROM 
			   PRODUCT
		   WHERE 
			   PRODUCT_TYPE = 'BOOK'
	   ELSE IF TYPE = 'FOOD' THEN 
		   SELECT 
			   FOOD_COLUMN INTO V_VAL
		   FROM 
			   PRODUCT
		   WHERE 
			   PRODUCT_TYPE = 'FOOD'
	   ELSE  
		   SELECT 
			   ETC_COLUMN INTO V_VAL
		   FROM PRODUCT
		   WHERE PRODUCT_TYPE NOT IN ('BOOK', 'FOOD')
	   END IF;
	END
	```
	if문을 사용해 조건에 따라 다른 작업을 수행 가능

- 반복문
	- LOOP
	```sql
		CREATE OR REPLACE PROCEDURE TEST_PRC()
		IS
			V_SEQ TABLE.COLUMN%TYPE;
		BEGIN
			DECLARE 
				V_SEQ NUMBER := 1; 
			BEGIN
				LOOP
				INSERT INTO BOOK_INFO (
						BOOK_SEQ,
						BOOK_NAME,
						BOOK_PRICE 
					)  
					VALUES (  
						V_SEQ,
						BOOK.PRODUCT_NAME,
						BOOK.PRODUCT_PRICE
					);  
					V_SEQ := V_SEQ + 1;
				EXIT WHEN V_SEQ > 10; -- V_SEQ 변수가 10보다 커지면 루프를 종료 
		END LOOP;
	```
	EXIT WHEN이 없으면 무한루프문이니 주의
	
	- WHILE LOOP
	```sql
		CREATE OR REPLACE PROCEDURE TEST_PRC()
		IS
			V_SEQ TABLE.COLUMN%TYPE;
		BEGIN
			DECLARE 
				V_SEQ NUMBER := 1; 
			WHILE V_SEQ < 10 LOOP
				INSERT INTO BOOK_INFO (
						BOOK_SEQ,
						BOOK_NAME,
						BOOK_PRICE 
					)  
					VALUES (  
						V_SEQ,
						BOOK.PRODUCT_NAME,
						BOOK.PRODUCT_PRICE
					);  
					V_SEQ := V_SEQ + 1;
			END LOOP;
	```
	
	- FOR LOOP
	```sql
		CREATE OR REPLACE PROCEDURE TEST_PRC()
		IS
			V_SEQ TABLE.COLUMN%TYPE;
		BEGIN
			DECLARE 
				V_SEQ NUMBER := 1; 
			FOR V_SEQ IN 1..10 LOOP
				INSERT INTO BOOK_INFO (
						BOOK_SEQ,
						BOOK_NAME,
						BOOK_PRICE 
					)  
					VALUES (  
						V_SEQ,
						BOOK.PRODUCT_NAME,
						BOOK.PRODUCT_PRICE
					);  
					V_SEQ := V_SEQ + 1;
			END LOOP;
	```
	
	- <mark class="hltr-cyan">CURSOR</mark>: DB에서 조회한 데이터로 반복문을 돌림
	```sql
		DECLARE  
			CURSOR BOOK_LIST IS  
				SELECT *
				FROM PRODUCT
				WHERE TYPE = 'BOOK'
			BEGIN  
				FOR BOOK IN BOOK_LIST LOOP   
					INSERT INTO BOOK_INFO (
						BOOK_NAME,
						BOOK_PRICE 
					)  
					VALUES (  
						BOOK.PRODUCT_NAME,
						BOOK.PRODUCT_PRICE
					);  
				END LOOP;
	```
	SELECT문을 통해 여러 행이 조회됐다면 각 행별로 반복문을 돌며 작업을 수행함

### 예외처리
```sql
EXCEPTION   
	WHEN ZERO_DIVIDE THEN
		DBMS_OUTPUT.PUT_LINE('0으로 나눌 수 없음');
		ROLLBACK; -- 데이터 롤백. 로직 구현부 중간에 COMMIT 명령어가 있었다면 COMMIT 명령어 이후 데이터만 롤백됨
	WHEN OTHERS THEN -- 기타 에러 처리
		DBMS_OUTPUT.PUT_LINE(SQLERRM); -- SQLERRM: 오류코드
		RETURN;
```

- 예외 관련 함수 

| **함수**  | **설명**                         |
| ------- | ------------------------------ |
| SQLCODE | 오류코드에 대한 숫자 값 반환               |
| SQLERRM | 오류번호와 연관된 메시지를 포함하는 문자 데이터를 반환 |

- 사용할 수 있는 예외 종류

| 에러코드                    | 설명                                                                              |
| ----------------------- | ------------------------------------------------------------------------------- |
| ACCESS_INTO_NULL        | 초기화하지 않은 객체 속성에 값을 할당하려고 할 경우                                                   |
| CASE_NOT_FOUND          | 어떤 CASE WHEN에도 해당하지 않고 ELSE도 작성하지 않았을 경우                                        |
| COLLECTION_IS_NULL      | 초기화하지 않은 nested table 혹은 varray 에 컬렉션 메소드를 적용하려고 하거나 요소(element)에 값을 할당하려고 할 경우 |
| CURSOR_ALREADY_OPEN     | 이미 열려있는 커서를 또 열려고 하는 경우                                                         |
| DUP_VAL_ON_INDEX        | 중복 금지(UNIQUE)인 컬럼에 중복값을 넣을 경우                                                   |
| INVALID_CURSOR          | 허용되지 않은 커서 작업 수행 시                                                              |
| INVALID_NUMBER          | 문자를 숫자로 변환 시 제대로 변환되지 않은 경우                                                     |
| LOGIN_DENIED            | 오라클에 틀린 아이디/패스워드로 로그인 시                                                         |
| NO_DATA_FOUND           | SELECT 시 조회결과가 없을 경우                                                            |
| NOT_LOGGED_ON           | 오라클에 접속하지 않고 PL/SQL 호출 시                                                        |
| PROGRAM_ERROR           | PL/SQL 내부적인 문제가 있을 시                                                            |
| ROWTYPE_MISMATCH        | 호스트 커서 변수, PL/SQL 커서 변수의 반환형이 호환이 되지 않을 경우                                      |
| SELF_IS_NULL            | 프로그램이 멤버 메소드 호출 시 객체 유형의 인스턴스가 초기화되지 않았을 경우                                     |
| STORAGE_ERROR           | PL/SQL 수행 시 메모리가 부족하거나 손상 시                                                     |
| SUBSCRIPT_BEYOND_COUNT  | nested table 혹은 varray 의 전체 인덱스보다 더 큰 값의 인덱스를 사용했을 경우                           |
| SUBSCRIPT_OUTSIDE_LIMIT | nested table 혹은 varray 에서 존재할 수 없는 인덱스를 사용한 경우(-1 같은.. 원래는 0부터 시작)              |
| SYS_INVALID_ROWID       | 문자열을 ROWID로 변환할 수 없을 경우                                                         |
| TIMEOUT_ON_RESOURCE     | 리소스 대기시간을 초과할 경우                                                                |
| TOO_MANY_ROWS           | SELECT INTO 시 2줄 이상을 INTO 해줄 경우                                                 |
| VALUE_ERROR             | 산술, 변환, 잘라내기, 크기 제한을 넘길 경우(컬럼 크기를 넘기거나, 숫자 컬럼에 문자를 넣는 등의..)                     |
| ZERO_DIVIDE             | 0으로 나누려 할 경우                                                                    |

### 프로시저 트랜젝션

- ROLLBACK: 변경사항 취소
- COMMIT : 변경사항 저장
	```sql
	CREATE OR REPLACE PROCEDURE TEST_PRC()
	IS
		V_SEQ TABLE.COLUMN%TYPE;
	BEGIN
		DECLARE  
			CURSOR BOOK_LIST IS  
				SELECT *
				FROM PRODUCT
				WHERE TYPE = 'BOOK'
			BEGIN  
				FOR BOOK IN BOOK_LIST LOOP   
					-- 책 데이터 적재
					INSERT INTO BOOK_INFO (
						BOOK_NAME,
						BOOK_PRICE 
					)  
					VALUES (  
						BOOK.PRODUCT_NAME,
						BOOK.PRODUCT_PRICE
					);  
				END LOOP;
		COMMIT; -- 변경 내용 반영

		-- 상품테이블에서 상품 삭제
		DELETE FROM PRODUCT WHERE TYPE = 'BOOK';

		EXCEPTION   
			WHEN OTHERS THEN -- 기타 에러 처리
				DBMS_OUTPUT.PUT_LINE(SQLERRM); -- SQLERRM: 오류코드
				ROLLBACK;

	END;
	```

	위와 같은 프로시저가있다고 가정할때, `DELETE FROM PRODUCT WHERE TYPE = 'BOOK';` 구문에서 에러가 발생한다면 
	
	BOOK_INFO 테이블에 적재한 데이터는 이미 COMMIT 되었기때문에 예외가 발생하여 ROLLBACK이 된다고해도 BOOK_INFO 테이블에 적재한 데이터는 롤백되지않음. 
	
- SAVEPOINT: SAVEPOINT로 지정한 지점으로 돌아감
	```sql
	CREATE OR REPLACE PROCEDURE TEST_PRC()
	IS
		V_SEQ TABLE.COLUMN%TYPE;
	BEGIN
		DECLARE 
				V_SEQ NUMBER := 1; 
			FOR V_SEQ IN 1..10 LOOP
				INSERT INTO BOOK_INFO (
						BOOK_SEQ,
						BOOK_NAME,
						BOOK_PRICE 
					)  
					VALUES (  
						V_SEQ,
						BOOK.PRODUCT_NAME,
						BOOK.PRODUCT_PRICE
					);  

					IF V_SEQ = 5 THEN
						SAVEPOINT SEQ_FIVE;
					END_IF;

					V_SEQ := V_SEQ + 1;	
			END LOOP;

		-- 상품테이블에서 상품 삭제
		DELETE FROM PRODUCT WHERE TYPE = 'BOOK';

		EXCEPTION   
			WHEN OTHERS THEN -- 기타 에러 처리
				DBMS_OUTPUT.PUT_LINE(SQLERRM); -- SQLERRM: 오류코드
				ROLLBACK TO SEQ_FIVE;

	END;
	```
	에러가 발생하여 EXCEPTION처리가된다면 SAVEPOINT 시점인 BOOK_INFO테이블에 BOOK_SEQ컬럼이 1~5 까지 적재된 상태로 프로시저가 종료됨

---

업무에서 프로시저를 사용하게 되어서 공부한 내용을 정리해보았다

프로시저에도 장단점이있지만 최근에는 단점이 더 부각되어 사용하고있지않은 추세인것같다

약 2주정도 사용했는데 체감한 단점으로는
- 변경 내역 버전관리가 되지않아 이력관리가 어렵다
- 프로시저 내에서 에러/데이터 정합성 문제 발생 시 추적하기 힘들다
- 동시에 여러 사람이 하나의 프로시저를 수정하면 마지막에 저장한 내역으로 덮어쓰기 되어버린다(열심히 수정했는데 다른 개발자가 띄어쓰기하고 저장하면 수정내역이 사라져있다.. 실화입니다..)

---

***참고한 블로그***

- [wakestand님의 오라클 PL/SQL 예외처리(Exception) 종류부터 사용방법 정리](https://wakestand.tistory.com/382)