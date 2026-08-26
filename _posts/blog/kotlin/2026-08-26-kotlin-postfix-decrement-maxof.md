---
title: "[Kotlin] x = maxOf(x--, 0) 이 아무것도 안 하는 이유"
category: Kotlin
tags:
  - kotlin
  - operator
  - postfix
  - java
last_modified_at: 2026-08-26
---

## 발단

코드를 보다가 이런 줄을 발견했다(재현용으로 단순화함)

```kotlin
// 예시 코드
class Counter(var count: Int) {
    fun decrease() {
        this.count = maxOf(this.count--, 0)
    }
}
```

1을 줄이되 0 아래로는 안 내려가게 하려는 의도인것 같은데
이 메서드는 <mark class="hltr-cyan">아무것도 안 한다</mark>. 컴파일도 잘되고 예외도 안 난다

---

## 전위와 후위 증감 연산자

먼저 `--`의 두 모양부터 보면 둘 다 변수를 1 줄이는 부수효과는 같고 식의 <mark class="hltr-cyan">값</mark>이 다르다

| 식 | 변수에 쓰는 값 | 식의 값 |
|---|---|---|
| `--x` (전위) | x - 1 | 줄인 뒤의 값 (x - 1) |
| `x--` (후위) | x - 1 | 줄이기 전의 값 (x) |

Kotlin 문서에서는 후위 증감을 이렇게 설명한다

1. 원래 값을 임시 저장소에 담는다
2. 변수에 `dec()` 결과를 쓴다
3. 식의 값으로는 임시 저장소의 값을 돌려준다

단독 문장(`count--`)으로 쓰면 식의 값을 아무도 안 쓰니 차이가 없고 식의 값을 쓰는 자리에 넣었을때 문제가 생긴다

---

## 재현

```kotlin
// 예시 코드
fun main() {
    val counter = Counter(3)
    counter.decrease()
    counter.decrease()
    println(counter.count) // 3
}
```

몇번을 불러도 3이다

---

## 그럼 왜 제자리일까?

count가 3일때 `this.count = maxOf(this.count--, 0)`를 한 단계씩 따라가보면

1. 대입의 오른쪽부터 평가한다. `this.count--`는 후위 감소라서
	- 식의 값은 <mark class="hltr-cyan">줄이기 전 값 3</mark>
	- 부수효과로 count에 2를 쓴다
2. `maxOf(3, 0)` = 3
3. 바깥 대입 `this.count = 3`이 1번에서 쓴 2를 다시 덮어쓴다

3 -> 2 -> 3 결국 제자리이다

문서 설명대로 풀어쓰면 바로 보인다

```kotlin
// 예시 코드 (후위 감소를 풀어쓴 모양)
val tmp = this.count          // 3
this.count = tmp.dec()        // 2  (count-- 의 부수효과)
this.count = maxOf(tmp, 0)    // 3  (바깥 대입이 덮어씀)
```

변수에 두번 쓰는데 나중에 쓰는 바깥 대입이 <mark class="hltr-cyan">옛날 값</mark>을 들고있어서 감소가 사라져버린것이다

---

## 자바도 똑같다

자바의 유명한 퍼즐 `x = x++`도 같은 이유라고 한다

```java
// 예시 코드
int x = 3;
x = x--;
System.out.println(x); // 3
```

바이트코드로 보면 더 확실한데 지역 변수 `x = x--`는 대략 이렇게 컴파일된다

```text
// 예시 코드 (javap -c 결과를 단순화)
iload_1        // 스택에 x(3)를 올린다     <- 식의 값
iinc 1, -1     // 변수 x를 2로 줄인다       <- 부수효과
istore_1       // 스택의 3을 x에 저장한다   <- 바깥 대입
```

스택에 올라간 3이 마지막에 저장되니까 x는 3으로 돌아온다

C에서는 같은 변수를 한 식 안에서 순서 보장 없이 두번 수정하는게 <mark class="hltr-cyan">미정의 동작</mark>이라 결과가 컴파일러마다 다를 수도 있다고 한다
자바와 코틀린은 평가 순서가 정해져있어서 항상 아무것도 안 하는 쪽으로 동작한다(정해져있다고 의도대로 동작하는건 아니지만..)

---

## 해결

```kotlin
// 예시 코드
this.count = maxOf(this.count - 1, 0)

// 또는
this.count = (this.count - 1).coerceAtLeast(0)
```

증감 연산자 대신 `- 1`로 새 값을 계산하면 부수효과가 없어서 변수에 쓰는건 바깥 대입 한번뿐이다
`coerceAtLeast`는 이 값 아래로는 안 내려가게 한다는걸 이름으로 말해줘서 의도가 더 잘 보인다

---

## 대안과 주의점

### 전위로 바꾸면?

`maxOf(--this.count, 0)`으로 바꾸면 식의 값이 2가 되고 바깥 대입도 2를 쓰니 동작은 맞는다
count가 0일때도 `--count`가 -1이고 `maxOf(-1, 0)`이 0이라 괜찮다

그래도 추천하지는 않는다. 한 줄 안에서 부수효과와 대입이 같은 변수를 두번 건드리는 코드는 맞게 동작해도 읽는 사람이 한번 더 계산해야하고 이번처럼 한 글자 차이로 버그가 된다

### 값이 안 바뀌는 버그는 테스트가 없으면 안 보인다

예외가 안 나니 로그에도 안 남는다. 감소 메서드라면 부르고나서 값이 줄었는지 확인하는 테스트 하나면 바로 잡힌다

```kotlin
// 예시 코드
@Test
fun `decrease는 1 줄이고 0 아래로는 안 내려간다`() {
    val counter = Counter(1)
    counter.decrease()
    assertThat(counter.count).isEqualTo(0)
    counter.decrease()
    assertThat(counter.count).isEqualTo(0)
}
```

>[!대입이 있는 줄에서는 증감 연산자를 쓰지 않기]
>
>`x = x--`처럼 대입 대상과 같은 변수를 오른쪽에서 증감시키는 코드는 대부분 의도와 다르게 동작한다
>증감 연산자는 단독 문장(`count--`)으로만 쓰는게 안전하다
>

---

한 글자 차이인데 컴파일도 되고 예외도 없어서 테스트가 없었으면 계속 몰랐을것 같다
