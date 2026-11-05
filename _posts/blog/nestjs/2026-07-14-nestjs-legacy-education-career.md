---
title: "[NestJS] TypeORM Data type \"Object\" not supported 에러 해결"
category: NestJS
tags:
  - nestjs
  - typeorm
  - typescript
  - reflect-metadata
  - legacy
last_modified_at: 2026-07-14
---

## 발단

어드민의 유저 상세 API에 학력/경력을 같이 내려주는 작업을 했다. 다른 서버에 이미 있는 로직을 NestJS로 옮겨오면 되는 일이었는데 두번 막혔다

1. 옛날에 가입한 유저는 <mark class="hltr-cyan">학력/경력이 전부 빈 배열</mark>
2. 레거시 테이블 엔티티를 추가하자 부팅하자마자 `Data type "Object" in "..." is not supported by "mysql" database`

첫번째는 데이터 모델을 잘못 읽은 문제였고 두번째는 TypeScript 타입이 런타임에 어떻게 넘어가는지에 대한 문제였다
두번째가 더 재밌어서 길게 적어본다

---

## 1. 이중 모델: 병합이 아니라 either-or

회원 데이터는 옛 계정 모델과 새 회원 모델로 나뉘어 있었고 학력/경력 테이블도 각각 따로 있었다

처음엔 참고할 코드로 학력/경력 CRUD API를 찾아서 새 모델 테이블만 붙였는데 그게 빈 배열의 원인이었다
쓰기 API는 이제 새 테이블에만 쓰기때문에 거기에는 레거시 쪽이 코드에 안보였던것이다(참고할 곳을 잘못 골랐다..)

실제로 화면에 보여주는 읽기 API를 따라가보니 로직이 달랐다

- 계정에 새 회원 모델이 연결돼 있으면 -> 새 학력/경력 테이블
- 없으면 -> 레거시 학력/경력 테이블

두 쪽을 합쳐서 보여주는게 아니라 <mark class="hltr-cyan">한쪽만 본다</mark>
새 모델이 생긴 계정은 새 쪽이 정본이고 레거시 데이터는 무시된다

```typescript
// 예시 코드
async getEducations(user: UserSummary): Promise<EducationDto[]> {
  if (user.memberId) {
    const rows = await this.memberEducationRepo.findBy({ memberId: user.memberId });
    return rows.map(toEducationDto);
  }
  const legacyRows = await this.legacyEducationRepo.findByUserId(user.id);
  return legacyRows.map(legacyToEducationDto);
}
```

만약 둘다 조회해서 합치면 되겠다고 생각햇으면 새 모델이 있는 유저는 옛날 학력과 새 학력이 같이 나왔을거다
마이그레이션 중인 이중 모델은 병합인지 either-or인지를 쓰기 코드가 아니라 읽기 코드에서 확인해야 한다는걸 배웠다

레거시 쪽은 다중 테이블 상속 구조였다
공통 베이스 테이블(유저, 기간, 학력인지 경력인지 구분값)에 학력 / 경력 자식 테이블이 1:1로 붙는 형태라서 같은 베이스 테이블을 엔티티 두개가 각각 조인해서 읽게 매핑했다
응답은 새 모델 기준으로 맞춰서 레거시의 정수 코드는 새 모델의 enum 이름으로 바꾸고 레거시에 없는 필드는 null로 내려주었다

---

## 2. Data type "Object" not supported

레거시 엔티티를 추가하고 서버를 띄우자 바로 터졌다

```typescript
// 예시 코드 (부팅 실패)
@Entity('legacy_education')
export class LegacyEducation {
  @Column({ name: 'school_id', nullable: true })
  schoolId: number | null;   // Data type "Object" in "LegacyEducation.schoolId" is not supported
}
```

`nullable: true`도 줬고 타입도 `number | null`로 정확하게 썼는데 왜 Object일까?

### TypeORM은 컬럼 타입을 어디서 알아내나

`@Column()`에 `type`을 안 적으면 TypeORM은 <mark class="hltr-cyan">TypeScript가 남겨준 타입 메타데이터</mark>를 보고 DB 타입을 정한다

그런데 TypeScript 타입은 컴파일하면 사라지고 JS에는 `number | null` 같은 정보가 없다
그래서 `emitDecoratorMetadata` 옵션을 켜면 컴파일러가 데코레이터가 붙은 프로퍼티에 한해 타입 정보를 런타임 값으로 남겨준다
실제 컴파일 결과를 보면 이렇다

```javascript
// 예시 코드 (tsc 출력 일부)
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id', nullable: true }),
    __metadata("design:type", Object)
], LegacyEducation.prototype, "schoolId", void 0);
```

`__metadata("design:type", ...)`가 `reflect-metadata`로 그 프로퍼티에 타입을 붙여두고 TypeORM은 `Reflect.getMetadata("design:type", target, "schoolId")`로 꺼내본다
여기에 `Number`가 들어있으면 int 계열로 `String`이면 varchar로 매핑하는 식이다

문제는 이 메타데이터가 <mark class="hltr-cyan">생성자 함수 하나</mark>로만 표현된다는것이다
`Number` `String` `Boolean` `Date` 클래스 같은것 하나라서 number 또는 null을 표현할 방법이 없다
그래서 컴파일러는 유니언 타입을 만나면 이렇게 처리한다고 한다

- 유니언의 구성 타입이 전부 같은 생성자로 줄어들면 그 생성자(`'a' | 'b'` -> `String`)
- 서로 다르면 포기하고 `Object`

여기서 `null`을 어떻게 보느냐가 `strictNullChecks`에 따라 달라진다

| tsconfig | `number \| null`의 design:type |
|---|---|
| `strictNullChecks: false` | `Number` (null, undefined를 유니언에서 그냥 빼고 본다) |
| `strictNullChecks: true` | `Object` (null도 별개의 타입으로 본다) |

이 프로젝트는 `strictNullChecks: true`였기때문에 `number | null`이 `Object`로 넘어갔고
TypeORM은 `Object`를 어떤 MySQL 타입으로 바꿔야 할지 몰라서 엔티티 메타데이터를 만드는 부팅 단계에서 에러를 낸것이다
같은 코드가 어떤 프로젝트에서는 되고 어떤 프로젝트에서는 안되는 이유가 이거였다

### 해결: 타입을 직접 적는다

메타데이터에 기대지 말고 컬럼 타입을 명시하면 된다

```typescript
// 예시 코드
@Column({ name: 'school_id', type: 'int', nullable: true })
schoolId: number | null;

@Column({ name: 'major', type: 'varchar', nullable: true })
major: string | null;

@Column({ name: 'graduated_at', type: 'datetime', nullable: true })
graduatedAt: Date | null;
```

`type`을 적으면 TypeORM은 design:type을 안본다
nullable 유니언 컬럼은 전부 이렇게 바꾸고 `tsc`까지 통과하는것을 확인했다

---

## 같이 알아두면 좋은 것

- `schoolId?: number`처럼 optional로만 선언하면 design:type은 `Number`로 나온다
	- `?`는 타입 노드가 아니라 프로퍼티 표시라서 그렇다
	- 다만 strict 모드에서는 null을 대입할 수 없어서 DB의 NULL을 표현하기엔 안맞다
- `Date | null`도 똑같이 `Object`가 된다(숫자만의 문제가 아님)
- TypeScript 5의 표준 데코레이터(`experimentalDecorators` 없이 쓰는 쪽)는 `emitDecoratorMetadata`를 지원하지 않는다고 한다
	- NestJS와 TypeORM이 legacy 데코레이터 설정(`experimentalDecorators` + `emitDecoratorMetadata`)을 요구하는 이유이기도 하다

메타데이터 추론은 tsconfig 한줄에 따라 결과가 바뀌니까 앞으로 엔티티 컬럼에는 <mark class="hltr-cyan">처음부터 `type`을 항상 적기로</mark> 했다
