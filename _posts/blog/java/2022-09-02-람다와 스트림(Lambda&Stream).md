---
날짜: 2022-09-02
생성 일시: 2022-09-02
수업: 자바의 정석
last_modified_at시: 2022-09-11
title: 자바의 정석 강의 - 람다와 스트림(Lambda & Stream)
category: JAVA
tags:
  - java
  - 자바의정석
---
## 람다식(Lambda Experssion)

: 함수(메소드)를 간단한 식으로 표현하는 법 (ex. (a, b) → a > b ? a : b )

- 익명함수(이름이 없는 함수, anonymous function) : 반환타입, 이름을 지우고 사이에 →를 붙인다
- 함수와 메소드는 근본적으로 동일하나 함수는 일반적 용어, 메소드는 객체지향개념 용어. 함수는 클래스에 독립적(클래스 바깥에 있는것. 자바에서는 불가능), 메소드는 클래스에 종속적(클래스안에 있음)
- 작성 법
    1. 메소드의 이름과 반환타입 제거 후 ‘ →’를 블럭{}앞에 추가  
        ( ex. (int a, int b) → return a>b? a:b;)  
        
    2. 반환값이 있는 경우, 식이나 값만 적고 return문 생략 가능. 끝에 ; 안붙임  
        (ex. (int a, int b) → a>b? a:b)  
        
    3. 매개변수의 타입이 추론 가능하면, 생략 가능(대부분의 경우 생략가능)  
        (ex. (a, b) → a>b?a:b  
        
- 주의사항
    - 매개변수가 하나인 경우, 괄호() 생략가능(타입이 없을 때만)  
        (a) → a*a ⇒ a → a*a 가능, (int a) → a*a ⇒ int a → a*a 불가능.  
        
    - 블록안의 문장이 하나일 겅우 {}생략가능. 끝에 ; 안붙음. (return문은 생략안됨)  
        (int i) → { System.out.println(i);} ⇒ (int i) → System.out.println(i) 가능  
        

— 예시

1. int max(int a, int b){ retrun a>b?a:b;}  
    ⇒ (a, b) → a>b? a:b;  
    
2. int printVar(String name, int i){System.out.println(name+”=”+i);}  
    ⇒ (name, i) → System.out.println(name+”=”+i)  
    
3. int square(int x){return x * x; }  
    ⇒ x→ x*x  
    
4. int roll(){return (int)(Math.random()*6);  
    ⇒ () → (int)(Math.random()*6)  
    

- 익명 함수가 아니고 익명 객체임  
    new Object(){ int max(int a, int b){ return a>b? a:b;} 를 (a, b) → a>b? a:b;으로 쓴거라 객체임.  
    
- 람다식(익명 객체)를 다루기 위해 참조변수가 필요함.

```java
class  Main{
	public static void main(String[] args) throws Exception {
//	Object obj = (a,b) -> a>b?a:b;//람다식, 익명객체 에러남
		Object obj = new Object() {
			int max(int a, int b) {
				return a>b? a:b;
			}
		};
//		int value = obj.max(3,5); //에러, Object리모컨인 obj는 max를 호출할 수 없음
		//=> 함수형 인터페이스가 필요
	}
}
```

### 함수형 인터페이스

: 단 하나의 추상 메소드만 선언된 인터페이스

```java
@FunctionalInterface //붙이는게 좋음
interface MyFunction{ 
	public abstract int max(int a, int b);
}
class  Main{
	public static void main(String[] args) throws Exception {
		MyFunction f= new MyFunction(){
			public int max(int a, int b){ 
				return a>b? a:b; 
			}
		};
		int value = f.max(3, 5);//가능. MyFunction에 max()가 있음
		System.out.println(value);  
	}
}
```

- 함수형 인터페이스 타입의 참조변수로 람다식을 참고 가능 (단, 함수형 인터페이스의 메소드와 람다식의 매개변수 개수와 반환타입이 일치해야 함)  
    Myfunction f = (a,b) →a>b?a:b;  
    int value = f.max(3,5);  
    

```java
class  Main{
	public static void main(String[] args) throws Exception {
//	Object obj = (a,b) -> a>b?a:b;//람다식, 익명객체 에러남
//		Myfunction f = new Myfunction() {
//			public int max(int a, int b) { //오버라이딩 규칙, 접근제어자는 좁게 못바꿈
//				return a>b? a:b;
//			}
//		};
		//람다식을 다루기 위한 참조변수의 타입은 함수형 인터페이스로 한다
		Myfunction f = (a,b) -> a>b?a:b;//람다식, 익명객체
		//람다식을 사용하려면 이름이 있어야해서 이름을 붙여준거임(추상메소드와 연결)

		int value = f.max(3, 5);
		System.out.println("value : "+value);
	}
}
@FunctionalInterface //함수형 인터페이스는 단 하나의 추상메소드만 가질 수 있다.
interface Myfunction{
//	public abstract int max(int a, int b);
					int max(int a, int b); //public abstract 생략가능
}
```

— 예시

- 익명 객체를 람다식으로 대체
    
    ```java
    import java.util.*;
    
    class  Main{
    	public static void main(String[] args)  {
    		List<String> list = Arrays.asList("abc","aaa","bbb","ddd","aaa");
    		
    //		Collections.sort(list, new Comparator<String>() {
    //			public int compare(String s1, String s2) {
    //				return s2.compareTo(s1);
    //			}
    //		});
    		
    		Collections.sort(list, (s1,s2)->s2.compareTo(s1));
    		System.out.println(list);
    	}
    }
    @FunctionalInterface
    interface Comparator<T>{
    	int compare(T o1, T o2);
    }
    ```
    

- 함수형 인터페이스타입의 매개변수, 반환타입
    - 함수형 인터페이스타입의 매개변수
        
        @FunctionalInterface  
        interface MyFunction{  
        void myMethod(); }  
        void aMethod(MyFuction f) {  
        f.myMethod(); //람다식 호출  
        }  
        aMethod(()→System.out.println(”myMethod()”));  
        
- 함수형 인터페이스 타입의 반환타입
    
    MyFunction myMethod(){ //람다식 반환  
    return ()→{}; }  
    
    ```java
    import java.util.*;
    @FunctionalInterface
    interface MyFunction{
    	void run();
    }
    
    class  Main{
    	static void execute(MyFunction f) {//매개변수 타입이 MyFunction인 메소드
    		f.run();
    	}
    	static MyFunction getMyFunction() { //반환타입이 MyFunction인 메소드
    //		MyFunction f = () -> System.out.println("f3.run()");
    //		return f;
    		return ()->System.out.println("f3.run()");
    	}
    	public static void main(String[] args)  {
    		//람다식으로 MyFunction의 run()을 구현
    		MyFunction f1 = ()->System.out.println("f1.run()");
    		
    		MyFunction f2 = new MyFunction() {
    			public void run() {
    				System.out.println("f2.run()");
    			}
    		};
    		MyFunction f3 = getMyFunction();
    		
    		f1.run();
    		f2.run();
    		f3.run();
    		
    		execute(f1);
    		execute(()->System.out.println("run()"));
    	}
    }
    ```
    

### java.util.function패키지

- 자주 사용되는 다양한 함수형 인테페이스를 제공.
    
    ![images](/assets/images/java/IMG-20240902151633.png)
    
    Predicate<String> isEmptyStr = s→ s.length() == 0;  
    String s=””;  
    if(isEmptyStr.test(s) //if(s.length()==0)  
    Sysout(”This is an empty String”)  ![[assets/images/java/2022-09-02-람다와 스트림(Lambda&Stream) 1/IMG-20240902151633.png]]
    

— 예시

Supplier<Integer> f = ()→(int)(Math.random()*100)+1; (공급자)

Consumer<Integer> f = i→ System.out.print(i+””);

Predicate<Integer > f = i→ i%2==0;

Function<Integer> f = i→ i/10*10; //25를 넣으면 20으로 반환

- 매개변수가 두개인 함수형 인터페이스

![images](assets/images/java/IMG-20240902151633-1.png)

Bi가 2개를 의미

- 매개변수가 3개인경우엔 만들어서 쓸것.  
    @FunctionalInterface  
    interface TriFunction<T,U,V,R>{  
    R apply(T t, U u, V v); //매개변수 3개  
    }  
    
- 매개변수의 타입과 반환타입이 일치하는 함수형 인터페이스

![images](assets/images/java/IMG-20240902151633-2.png)

UnaryOperator : 단항 연산자  
BinaryOperator : 이항 연산자  
  
@FunctionalInterface  
public interface UnaryOperator<T> extends Function<T,T>{  
static<T> UnaryOperrator<T>  
identity(){  
return t→ t;} //입출력 타입 일치  
  
@FunctionalInterface  
public interface Function<T,R>{  
R apply(T t);}  

```java
import java.util.ArrayList;
import java.util.List;
import java.util.function.*;

class  Main{
	public static void main(String[] args)  {
		Supplier<Integer> s = () ->(int)(Math.random()*100)+1; //1~100사이 양수
		Consumer<Integer> c = i->System.out.print(i+", ");
		Predicate<Integer> p = i->i%2==0; //짝수인지 검사
		Function<Integer, Integer> f = i->i/10*10; //i의 일의 자리수 버림
		
		List<Integer> list = new ArrayList<>();
		makeRandomList(s, list); //s에서 값(랜덤값)을 꺼내 list를 채운다
		System.out.println(list);
		printEvenNum(p,c,list); //짝수 출력
		List<Integer> newList = doSomething(f,list); //새로운 list를 생성
		System.out.println(newList);
	}
	
	static<T> List<T> doSomething(Function<T,T> f, List<T> list){
		List<T> newList = new ArrayList<T>(list.size());
		
		for(T i : list) {
			newList.add(f.apply(i)); //list안의 값에서 1의 자리수를 버려 newlist 생성
		}
		return newList;
	}
	static<T> void printEvenNum(Predicate<T> p, Consumer<T> c, List<T> list) {
		System.out.print("[");
		for(T i:list) {
			if(p.test(i)) //짝수인지 검사
				c.accept(i); //짝수면,System.out.print(i+", ");로 화면에 i 출력
		}
		System.out.println("]");
	}
	static<T> void makeRandomList(Supplier<T> s, List<T> list) {
		for(int i=0;i<10;i++) {
			list.add(s.get()); //Supplier로 부터 1~100까지의 난수를 받아서 list에 10번 추가
		}
	}
}
```

**Predicate의 결합**

- and(), or(), negate()로 두 Predicate를 하나로 결합(default메소드)
    
    Predicate<Integer> p = i → i<100;  
    Predicate<Integer> q = i → i<200;  
    Predicate<Integer> r = i → i%2 ==0;  
      
    Predicate<Integer> notP = p.negate(); //i≥100  
    Predicate<Integer> all = notP.and(q).or(r); //100≤i && i<200 || i%2==0  
    Predicate<Integer> all2 = notP.and(q.or(r))//100≤i && (i<200 || i%2==0 )  
      
    System.out.println(all.test(2)); //true  
    System.out.println(all2.test(2)); //false  
    
- 등가비교를 위한 predicate의 작성에는 isEqual()를 사용(static메소드)  
    Predicate<String> [ =Predicate.isEqual(str1); //isEquals()은 static메소드  
    Boolean result = p.test(str2); //str1과 str2가 같은지 비교한 결과를 반환  
    ⇒ Boolean result = Predicate.isEqual(str1).test(str2);  
    

```java
import java.util.function.*;

class  Main{
	public static void main(String[] args)  {
	Function<String, Integer> f = (s)->Integer.parseInt(s,16); //문자열을 16진수로
	Function<Integer, String> g = (i)->Integer.toBinaryString(i); //2진수로
	
	//andThen : 두 function을 하나로 연결
	//f가 String입력, Integer출력. 출력된 Integer를 g에 입력, String출력하는 함수 h를 생성함
	Function<String, String> h = f.andThen(g); //f적용하고 g를 적용. String입력, String출력
	//compose : f가 뒤에오고 g가 앞에옴
	Function<Integer, Integer> h2 = f.compose(g); //Integer입력, Integer출력
	
	System.out.println(h.apply("FF")); //"FF" -> 255 -> "11111111"
	System.out.println(h2.apply(2)); //2 -> "10" -> 16
	
	Function<String, String> f2 = x->x; //항등함수(identity function)
	System.out.println(f2.apply("AAA")); //AAA가 그대로 출력됨
	
	Predicate<Integer> p = i -> i<100;
	Predicate<Integer> q = i -> i<200;
	Predicate<Integer> r = i -> i%2==0;
	Predicate<Integer> notP = p.negate(); //i>=100
	
	Predicate<Integer> all = notP.and(q.or(r)); //i>=100 && (i<200 || i%2==0)
	System.out.println(all.test(150)); //true
	System.out.println(all.test(149)); //true
	System.out.println(all.test(300)); //true
	System.out.println(all.test(10)); //false
	
	String str1 = "abc";
	String str2 = "abc";
	
	//str1과 str2가 같은지 비교
	Predicate<String> p2 = Predicate.isEqual(str1);
	boolean result = p2.test(str2);
	System.out.println(result); //true
	
	String str3 = new String("abc");
	
	//str1과 str2가 같은지 비교
//	Predicate<String> p3 = Predicate.isEqual(str2);
//	boolean result2 = str1.equals(str2);
	boolean result2 = Predicate.isEqual(str2).test(str3);
	System.out.println(result2); //true
	}
}
```

### 컬렉션 프레임웍과 함수형 인터페이스

- 함수형 인터페이스를 사용하는 컬렉션 프레임웍의 메소드(와일드카드 생략)

![images](assets/images/java/IMG-20240902151633-3.png)

forEach는 consumer임(입력값만 있음)

```java
import java.util.*;

class  Main{
	public static void main(String[] args)  {
		ArrayList<Integer> list = new ArrayList();
		for(int i=0;i<10;i++) {
			list.add(i);
		}
		
		//list의 모든 요소 출력
		
//		Iterator it = list.iterator();
//		while(it.hasNext()) {
//			System.out.print(it.next()+",");
//		}
//		System.out.println();
		//아래 한문장으로
		list.forEach(i-> System.out.print(i+", "));
		System.out.println();
		System.out.println(list); //이것도 되긴함
		
		
		//list에서 2또는 3의 배수를 제거
		list.removeIf(x->x%2==0 || x%3==0); 
		System.out.println(list);
		
		list.replaceAll(i->i*10);
		System.out.println(list);
		
		Map<String, String> map = new HashMap();
		map.put("1", "1");
		map.put("2", "2");
		map.put("3", "3");
		map.put("4", "4");
		
		//map의 모든 요소를 {k,v}형식으로 출력
//		Iterator it2 = map.entrySet().iterator();
//		while(it2.hasNext()) {
//			System.out.print("{"+it2.next()+"}");
//		}
//		System.out.println();
		//위에꺼 한문장으로
		map.forEach((k,v)->System.out.print("{"+k+", "+v+"}"));
		System.out.println();
	}
}
```

### 메소드 참조(method reference)

- 클래스이름 :: 메소드이름

: 하나의 메소드만 호출하는 람다식을 ‘메소드 참조’로 더 간단히 할 수 있다

|종류|람다|메소드 참조|
|---|---|---|
|static메소드 참조|(x) → ClassName.method(x)|ClassName::method|
|인스턴스 메소드 참조|(obj,x) → obj.method(x)|ClassName::method|
|특정 객체 인스턴스 메소드 참조|(x)→ obj.method(x)|obj::method|

```java
import java.util.function.Function;

class  Main{
	public static void main(String[] args)  {
//		Function<String, Integer> f = (String s) -> Integer.parseInt(s);
		Function<String, Integer> f = Integer::parseInt; //메소드 참조. 위랑 같음
		
		System.out.println(f.apply("100")+200); //f.apply("100")이 숫자로 바뀜
	}
}
```

- 생성자의 메소드 참조 - 클래스이름::new
- 배열과 메소드 참조 - 타입[]::new

```java
import java.util.function.*;

class  Main{
	public static void main(String[] args)  {
		//매개변수 없는 경우
//		Supplier<MyClass> s = ()->new MyClass(); //입력x, 출력o
		Supplier<MyClass> s = MyClass::new;
		
		MyClass mc = s.get(); //객체 값 반환
		System.out.println(mc); 
		System.out.println(s.get()); //위랑 다른 새로운 객체 생성
		
		//매개변수 있는 경우
//		Function <Integer, MyClass2> f = (i)->new MyClass2(i); //입력o, 출력o
		Function <Integer, MyClass2> f = MyClass2::new;
		
		MyClass2 mc2 = f.apply(100);
		System.out.println(mc2.iv); 
		System.out.println(f.apply(100).iv); 
		
//		Function<Integer, int[]> f2 = (i)->new int[i];
		Function<Integer, int[]> f2 = int[]::new;
		int[] arr = f2.apply(500);
		System.out.println(arr.length); //길이가 500인 배열
	}
}
class MyClass{}
class MyClass2{
	int iv;

	MyClass2(int iv){
		this.iv=iv;
	}
}
```

## 스트림(Stream)

: 다양한 데이터 소스를 표준화한 방법으로 다루기 위한 것

- 스트림이 제공하는 기능 - 중간 연산과 최종 연산

— 스트림 만들기 3단계

1. 스트림만들기
    
    - 컬렉션 - Collection인터페이스의 stream()으로 컬렉션을 스트림으로 변환  
        Stream<E> stream() //Collection인터페이스의 메소드  
        
    - 배열
        - 객체 배열로부터 스트림 생성하기  
            Stream<T> Stream.of(가변인자) or Stream<T> Arrays.stream(T[])  
            
        - 기본형 배열로부터 스트림 생성하기(Stream이 아니라 IntStream)  
            IntStream IntStream.of(int….value) or IntStream Arrays.Stream(int[])  
            
    - 임의의 수(난수)를 요소로 갖는 스트림 생성
        
        ```java
        import java.util.Random;
        import java.util.stream.IntStream;
        
        class  Main{
        	public static void main(String[] args)  {
        		
        		IntStream intStream = new Random().ints(); 
        		intStream.limit(5).forEach(System.out::println);
        		System.out.println();
        		IntStream intStream2 = new Random().ints(5); 
        		intStream2.forEach(System.out::println);
        		System.out.println();
        		IntStream intStream3 = new Random().ints(10,5,10); 
        		intStream3.forEach(System.out::println);
        	}
        }
        ```
        
    - 특정범위의 정수를 요소로 갖는 스트림 생성하기(IntStream, LongStream)  
        IntSream IntStream.range(int begin, int end)  
        
    - 람다식으로 스트림만들기  
        static <T> Stream<T> iterate(T seed, UnaryOperator<T> f) //이전요소에 종속적  
        static <T> Stream<T> generate(Supplier<T> s) //이전요소에 독립적  
        
        - iterate() : 이전요소를 seed로 해서 다음 요소를 계산  
            Stream<Integer> evenStream = Stream.iterate(0, n→n+2); //0,2,4,6,..  
            
        - generate() : seed를 사용하지 않음  
            Stream<Double> randomStream = Stream.generate(Math::random);  
            Stream<Integer> oneStream = Stream.generate(()→1); //1,1,1,1,…..  
            
        
        ```java
        import java.util.Random;
        import java.util.stream.IntStream;
        import java.util.stream.Stream;
        
        class  Main{
        	public static void main(String[] args)  {
        		//iterate(T seed, UnaryOperator f)  단항연산자
        		Stream<Integer> intStream = Stream.iterate(0, n->n+2);
        		intStream.limit(10).forEach(System.out::println);
        		System.out.println();
        		Stream<Integer> intStream2 = Stream.iterate(1, n->n+2);
        		intStream2.limit(10).forEach(System.out::println);
        		System.out.println();
        		//generate(Supplier s)  입력x, 출력o
        		Stream<Integer> oneStream = Stream.generate(()->1);
        		oneStream.limit(5).forEach(System.out::println);
        	}
        }
        ```
        
    - 파일을 소스로 하는 스트림생성  
        Stream<Path> Files.list(Path dir); //Path는 파일 또는 디렉토리  
        Stream<String> Files.lines(Path path)  
        Stream<String> Files.lines(Path path, Charset cs)  
        Stream<String> lines() //BufferedReader클래스의 메소드  
        
    - 비어있는 스트림 생성하기  
        Stream emptyStream = Stream.empty(); //empty()는 빈 스트림을 생성해서 반환  
        long count = emptyStream.count(); //count의 값은 0  
        
    
    ```java
    List<Integer> list =Arrays.asList(1,2,3,4,5);
    		Stream<Integer> intStream = list.stream(); //컬렉션
    		Stream<String> strStream = Stream.of(new String[] {"a","b","c"}); //배열
    		Stream<Integer> evenStream = Stream.iterate(0,n->n+2); //0,2,4,6...
    		Stream<Double> randomStream = Stream.generate(Math::random);//람다식
    		IntStream intStream2 = new Random().ints(5); //난수 스트림. 크기가 5
    
    //컬렉션으로 스트림 생성
    		intStream.forEach(System.out::print); //최종연산
    //	intStream.forEach(System.out::print); //최종연산을 해서 Stream이 닫힘
    		
    		intStream=list.stream();
    		intStream.forEach(System.out::print); //최종연산
    ```
    
    ```java
    import java.util.Arrays;
    import java.util.stream.IntStream;
    import java.util.stream.Stream;
    
    class  Main{
    	public static void main(String[] args)  {
    //		List<Integer> list =Arrays.asList(1,2,3,4,5);
    //		Stream<Integer> intStream = list.stream(); //list를 Stream으로 변환
    //		intStream.forEach(System.out::print); //최종연산
    ////		intStream.forEach(System.out::print); //최종연산을 해서 Stream이 닫힘
    //		
    //		intStream=list.stream();
    //		intStream.forEach(System.out::print); //최종연산
    		
    		Stream<String> strstream = Stream.of(new String[] {"a","b","c","d"});
    		strstream.forEach(System.out::println);
    		
    		//기본형
    		int[] intArr = {1,2,3,4,5};
    		IntStream intStream = Arrays.stream(intArr);
    //		intStream.forEach(System.out::println);
    //		System.out.println("count = "+intStream.count()); //최종연산
    //		System.out.println("sum = "+intStream.sum()); //최종연산
    		System.out.println("avg = "+intStream.average()); //최종연산
    		
    		//참조형
    //		Integer[] intArr = {1,2,3,4,5};
    //		Stream<Integer> intStream = Arrays.stream(intArr);
    //		intStream.forEach(System.out::println);
    //		System.out.println("count = "+intStream.count()); //count말고 다른건 안됨(sum, avg 등)
    		//Stream<T>는 숫자 외에도 여러타입의 스트림이 가능해서 숫자 스트림에서만 사용할 수 있는 sum(), average()는 뺌
    	}
    }
    ```
    
2. 중간연산(0~n번) : 연산결과가 스트림인 연산. 반복적으로 적용가능
    - 스트림 자르기 - skip(long n)[앞에서부터 n개 건너뛰기), limit()[잘라내기]
    - 스트림의 요소 걸러내기- filter()[조건에 맞는요소만 남김], distinct()[중복제거]
    - 스트림 정렬 - sorted()[정렬기준안주면 스트림요소의 기본정렬]
        
        ![images](assets/images/java/IMG-20240902151634.png)
        
        - Comparator의 comparing()으로 정렬기준을 제공  
            comparing(Function<T,U> keyExteactor)  
            comparing(Function<T,U> keyExteactor, Comparator<U>, keyComparetor)  
            
        - 추가정렬기준을 제공할 때는 thenComparing()사용  
            thenComparing(Function<T,U> keyExteactor)  
            thenComparing(Function<T,U> keyExteactor, Comparator<U>, keyComparetor)  
            
            ```java
            import java.util.Comparator;
            import java.util.stream.Stream;
            
            class  Main{
            	public static void main(String[] args)  {
            		Stream<Student> studentStream = Stream.of(
            				new Student("이자바",3,300),
            				new Student("김자바",1,200),
            				new Student("안자바",2,100),
            				new Student("박자바",2,150),
            				new Student("소자바",1,200),
            				new Student("나자바",3,290),
            				new Student("감자바",3,180));
            		
            		studentStream.sorted(Comparator.comparing(Student::getBan) //반별정렬
            				.thenComparing(Comparator.naturalOrder()))//기본정렬
            				.forEach(System.out::println);
            	}
            }
            
            class Student implements Comparable<Student>{
            	String name;
            	int ban;
            	int totalScore;
            	
            	Student(String name, int ban, int totalScore){
            		this.name = name;
            		this.ban = ban;
            		this.totalScore=totalScore;
            	}
            	public String toString() {
            		return String.format("[%s, %d, %d]",name,ban,totalScore);
            	}
            	
            	String getName() {return name;}
            	int getBan() {return ban;}
            	int getTotalScore() {return totalScore;}
            	
            	//총점 내림차순을 기본정렬로 한다
            	public int compareTo(Student s) {
            		return s.totalScore - this.totalScore;
            	}
            }
            ```
            
    - 스트림의 요소 변환 - map()
    - forEach(의 중간연산버전(스트림소비x : 반환타입 void) - peek() : 중간점검
        
        ```java
        import java.io.File;
        import java.util.stream.Stream;
        
        class  Main{
        	public static void main(String[] args)  {
        		File fileArr[] = { new File("Ex1.java"), new File("Ex1.bak"), new File("ex2.java"), new File("java"), new File("Ex1.txt")};
        		Stream<File> fileStream = Stream.of(fileArr);
        		//map()으로 Stream<File>을 Stream<String>으로 변환
        		Stream<String> filenameStream = fileStream.map(File::getName);
        		filenameStream.forEach(System.out::println); //모든 파일이름 출력
        		
        		fileStream = Stream.of(fileArr); //스트림 재생성
        		fileStream.map(File::getName)
        			.filter(s->s.indexOf('.')!=-1)///확장자가 없는 것 제외
        			.peek(s->System.out.printf("filename=%s%n",s))
        			.map(s->s.substring((s.indexOf('.')+1))) //확장자만 추출
        			.peek(s->System.out.printf("extension=%s%n",s))
        			.map(String::toUpperCase) //모두 대문자로 변환
        			.distinct() //중복제거
        			.forEach(System.out::print); //JAVABAKTXT
        		
        		System.out.println();
        		
        	}
        }
        ```
        
    - 스트림의 스트림을 스트림으로 변환 : 여러 스트림 배열을 하나의 스트림배열로 변환 - flatmap()
        
        ```java
        import java.io.File;
        import java.util.Arrays;
        import java.util.stream.Stream;
        
        class  Main{
        	public static void main(String[] args)  {
        		Stream<String[]> strArrStrm = Stream.of(
        				new String[] {"abc","def","jkl"},
        				new String[] {"ABC","GHI","JKL"}
        				);
        		
        //		Stream<Stream<String>> strStrmStrm = strArrStrm.map(Arrays::stream);
        //		strStrmStrm.forEach(System.out::println);
        //		System.out.println();
        		//두 스트림배열을 하나의 스트림배열로 합침
        		Stream<String> strStrm = strArrStrm.flatMap(Arrays::stream);
        		
        		strStrm.map(String::toLowerCase) //대문자->소문자
        		.distinct()
        		.sorted()
        		.forEach(System.out::println);
        		System.out.println();
        		
        		String lineArr[] = {
        				"Believe or not It is true",
        				"Do or not There is no try"
        		};
        		
        		Stream<String> lineStream = Arrays.stream(lineArr);
        		lineStream.flatMap(line -> Stream.of(line.split(" +")))
        		.map(String::toLowerCase)
        		.distinct()
        		.sorted()
        		.forEach(System.out::println);
        	}
        }
        ```
        
3. 최종연산(1번) : 연산결과가 스트림이 아닌 연산. 단 한번만 적용가능(스트림의 요소를 소모)
    
    - 스트림의 모든 요소에 지정된 작업을 수행 - forEach(), forEachOrdered()
        - sequential() : 직렬스트림(생략가능)
        - parallel() : 병렬 스트림 (순서보장x) - forEachOrdered를 써야 순서유지가 됨
    - 조건검사
        - allMatch() : 모든 요소가 조건을 만족시키면 true
        - anyMatch() : 한 요소라도 조건을 만족시키면 true
        - noneMatch() : 모든 요소가 조건을 만족시키지 않으면 true
        - findFirst() : 첫번째 요소를 반환, 순차 스트림에 사용(결과가 null일수도 있어 Optional사용)
        - findAny() : 아무거나 하나를 반환, 병렬 스트림에 이용(결과가 null일수도 있어 Optional사용)
    - reduce() : 스트림의 요소를 하나씩 줄여가며 누적연산 수행 (count, max, min, sum, collect는 reduce를 바탕으로 만든것). 전체 리듀싱
        - identity : 초기값(대부분 0)
        - accumulator : 이전연산결과와 스트림의 요소에 수행할 연산
    
    ```java
    import java.util.Optional;
    import java.util.OptionalInt;
    import java.util.stream.IntStream;
    import java.util.stream.Stream;
    
    class  Main{
    	public static void main(String[] args)  {
    		String strArr[] = {
    				"Ingeritance","Java","Lambda","stream","OptionalDouble",
    				"IntStream","count","sum",
    				};
    		Stream.of(strArr)
    		.parallel() //병렬정렬
    		.forEachOrdered(System.out::println); //순서유지
    		System.out.println("---------------------------");
    		
    		boolean noEmptyStr = Stream.of(strArr).noneMatch(s->s.length()==0); //문자열길이가 0인게 없으면 true
    //		Optional<String> sWord = Stream.of(strArr).parallel().filter(s->s.charAt(0)=='s').findAny(); //시작이 's'인 것 중 아무거나 가져옴 - 실행할때마다 값이 다름
    		Optional<String> sWord = Stream.of(strArr).filter(s->s.charAt(0)=='s').findFirst(); //시작이 's'인 것 중 첫번째 거만 가져옴
    		
    		System.out.println("noEmptyStr="+noEmptyStr);
    		System.out.println("-----------------");
    		System.out.println("sWord="+sWord.get());
    		System.out.println("---------------------------");
    		
    		//Stream<String>을 String<Integer>로 변환
    //		Stream<Integer> intStream = Stream.of(strArr).map(String::length);
    		
    		//Stream<String[]>을 IntStream으로 변환. 성능이 더 놓음
    		IntStream intStream1 = Stream.of(strArr).mapToInt(String::length);
    		IntStream intStream2 = Stream.of(strArr).mapToInt(String::length);
    		IntStream intStream3 = Stream.of(strArr).mapToInt(String::length);
    		IntStream intStream4 = Stream.of(strArr).mapToInt(String::length);
    	
    		
    		int count = intStream1.reduce(0,(a,b)->a+1);
    		int sum = intStream2.reduce(0,(a,b)->a+b); //단어길이 모두 더하기
    		
    		OptionalInt max = intStream3.reduce(Integer::max); //가장긴거
    		OptionalInt min = intStream4.reduce(Integer::min); //가장 짧은거
    		OptionalInt max2 = IntStream.empty().reduce(Integer::max); //가장긴거
    		System.out.println("count = "+count);
    		System.out.println("sum = "+sum);
    		System.out.println("max = "+max.getAsInt());
    		System.out.println("min = "+min.getAsInt());
    		System.out.println("max2 = "+max2.orElse(0)); //결과가 없으면 0을 반환
    		System.out.println("max2 = "+max2.orElseGet(()->0)); //결과가 없으면 0을 반환
    	}
    }
    ```
    
    - collect() : Collector(interface)를 매개변수로 하는 스트림의 최종 연산. 그룹별 리듀싱이 가능함
        
        - Collector : 수집(collect)에 필요한 메소드를 정의해 놓은 인터페이스, Collectors클래스에서 구현해놔서 다 할 필요 없음
        
        ```java
        interface Collector<T, A, R>{//T(요소)를 A에 누적한 다음, 결과를 R로 변환해서 반환
        	Supplier<A>				supplier(); //StringBuilder::new  누적할 곳 - A
        	BiConsumer<A, T>		accumulator();//(sb, s)->sb.appens(s) 누적방법
        	BinaryOperator<A>		combiner();//(sb1,sb2)->sb1.append(sb2) 결합방법(병렬)
        	Function<A, R> 			finisher();//sb->ab.toString() 최종변환
        	Set<Characteristics> 	characteristics();//컬렉터의 특성이 담긴 set을 반환 - R
        }
        ```
        
        - Collectors : 클래스. 다양한 기능의 컬렉터(Collector를 구현한 클래스)를 제공
            
            - 변환 - mapping(), toList(), toSet(), toCollection() 등
            - 통계 - counting(), summingInt(), averagingInt(), maxBy(), minBy(), summarizingInt() 등
            - 문자열 결합 - joining()
            - 리듀싱 - reducing() : 그룹별 리듀싱 가능
            - 그룹화와 분할 - groupingBy(), partitioningBy(), collectingAndThen()
            
            — 스트림을 컬렉션으로 변환 - toList(), toSet(), toMap(), toCollection()
            
            Collectors.toList() 이렇게 사용함
            
            — 스트림을 배열로 변환 - toArray()
            

ex) stream.distinct().limit(5).sorted().forEach(System.out::println)

```java
Stream<String> stream = Stream.of(strArr); //문자열배열이 소스인 스트림생성
		Stream<String> filteredStream = stream.filter(); //걸러내기(중간연산)
		Stream<String> distinctedStream = stream.distinct(); //중복 제거(중간연산)
		Stream<String> sortedStream = stream.sorted();//정렬(중간연산)
		Stream<String> limitedStream = stream.limit(5);//스트림자르기(중간연산);
		int total = stream.count(); //요소 개수 세기(최종연산)
```

- 스트림의 특징
    - 데이터소스로부터 데이터를 읽기만 할 뿐, 변경하지 않음(원본을 건들지 않음. read only)
    - Iterator처럼 일회용이다(필요하면 다시 스트림을 생성해야함) : 최종연산 후 스트림이 닫혀 사용할 수 없음
    - 최종연산 전까지 중간연산이 수행되지 않는다. - 지연된 연산
    - 작업을 내부 반복으로 처리한다.
    - 작업을 병렬로 처리 - stream.parallel() : 병렬스트림으로 전환(속성만 변경)
    - 기본형 스트림 - IntStream, LongStream, DoubleStream
        - 오토박싱&언박싱의 비효율이 제거(Stream<integer>대신 IntStream사용) - 데이터소스가 기본형일때 사용가능
        - 숫자와 관련된 유용한 메소드를 Stream<T>보다 더 많이 제공
- 스트림의 그룹화와 분할
    
    - partitioningBy()는 스트림을 2분할함(다중분할 가능)
        
        ```java
        import java.util.*;
        import java.util.function.*;
        import java.util.stream.*;
        import static java.util.stream.Collectors.*;
        import static java.util.Comparator.*;
        
        class Student{
        	String name;
        	boolean isMale; // 성별
        	int hak;        // 학년
        	int ban;        // 반
        	int score;
        
        	Student(String name, boolean isMale, int hak, int ban, int score) { 
        		this.name	= name;
        		this.isMale	= isMale;
        		this.hak	= hak;
        		this.ban	= ban;
        		this.score  = score;
        	}
        	String	getName()    { return name;	}
        	boolean  isMale()     { return isMale;	}
        	int      getHak()     { return hak;	}
        	int      getBan()     { return ban;	}
        	int      getScore()   { return score;}
        	
        	public String toString() {
        		return String.format("[%s, %s, %d학년 %d반, %3d점]",name, isMale ? "남":"여", hak, ban, score); 
        	}
        	
        	   // groupingBy()에서 사용
        		enum Level { HIGH, MID, LOW }  // 성적을 상, 중, 하 세 단계로 분류
        }
        class  Main{
        	public static void main(String[] args)  {
        		Student[] stuArr = {
        				new Student("나자바", true,  1, 1, 300),	
        				new Student("김지미", false, 1, 1, 250),	
        				new Student("김자바", true,  1, 1, 200),	
        				new Student("이지미", false, 1, 2, 150),	
        				new Student("남자바", true,  1, 2, 100),	
        				new Student("안지미", false, 1, 2,  50),	
        				new Student("황지미", false, 1, 3, 100),	
        				new Student("강지미", false, 1, 3, 150),	
        				new Student("이자바", true,  1, 3, 200),	
        				new Student("나자바", true,  2, 1, 300),	
        				new Student("김지미", false, 2, 1, 250),	
        				new Student("김자바", true,  2, 1, 200),	
        				new Student("이지미", false, 2, 2, 150),	
        				new Student("남자바", true,  2, 2, 100),	
        				new Student("안지미", false, 2, 2,  50),	
        				new Student("황지미", false, 2, 3, 100),	
        				new Student("강지미", false, 2, 3, 150),	
        				new Student("이자바", true,  2, 3, 200)	
        			};
        		System.out.printf("1. 단순분할(성별로 분할)%n");
        		Map<Boolean, List<Student>> stuBySex =  Stream.of(stuArr).collect(partitioningBy(Student::isMale));
        		
        		List<Student> maleStudent   = stuBySex.get(true);
        		List<Student> femaleStudent = stuBySex.get(false);
        		
        		for(Student s : maleStudent)   System.out.println(s);
        		for(Student s : femaleStudent) System.out.println(s);
        		
        		System.out.printf("%n2. 단순분할 + 통계(성별 학생수)%n");
        		Map<Boolean, Long> stuNumBySex = Stream.of(stuArr).collect(partitioningBy(Student::isMale, counting()));	
        
        		System.out.println("남학생 수 :"+ stuNumBySex.get(true));
        		System.out.println("여학생 수 :"+ stuNumBySex.get(false));
        		
        		System.out.printf("%n3. 단순분할 + 통계(성별 1등)%n");
        		Map<Boolean, Optional<Student>> topScoreBySex = Stream.of(stuArr).collect(partitioningBy(Student::isMale, maxBy(comparingInt(Student::getScore))));
        		System.out.println("남학생 1등 :"+ topScoreBySex.get(true));
        		System.out.println("여학생 1등 :"+ topScoreBySex.get(false));
        	
        		Map<Boolean, Student> topScoreBySex2 = Stream.of(stuArr).collect(partitioningBy(Student::isMale,collectingAndThen(maxBy(comparingInt(Student::getScore)), Optional::get)));
        		System.out.println("남학생 1등:"+topScoreBySex.get(true));
        		System.out.println("여학생 1등:"+topScoreBySex.get(false));
        		
        		System.out.printf("%n4.다중분할(성적 불합격자, 100점 이하)%n");
        		
        		Map<Boolean, Map<Boolean, List<Student>>> failedstuBySex = Stream.of(stuArr).collect(partitioningBy(Student::isMale,partitioningBy(s->s.getScore()<=100)));
        		
        		List<Student> failedMaleStu   = failedstuBySex.get(true).get(true);
        		List<Student> failedFemaleStu = failedstuBySex.get(false).get(true);
        		
        		for(Student s : failedMaleStu)   System.out.println(s);
        		for(Student s : failedFemaleStu) System.out.println(s);
        	
        	}
        }
        ```
        
    - groupingBy()는 스트림을 n분할함
    
    ```java
    import java.util.*;
    import java.util.function.*;
    import java.util.stream.*;
    import static java.util.stream.Collectors.*;
    import static java.util.Comparator.*;
    
    class Student3 {
    	String name;
    	boolean isMale; // 성별
    	int hak;        // 학년
    	int ban;        // 반
    	int score;
    
    	Student3(String name, boolean isMale, int hak, int ban, int score) { 
    		this.name	= name;
    		this.isMale	= isMale;
    		this.hak   	= hak;
    		this.ban	= ban;
    		this.score 	= score;
    	}
    
    	String	getName() 	 { return name;    }
    	boolean isMale()  	 { return isMale;  }
    	int		getHak()   	 { return hak;	   }
    	int		getBan()  	 { return ban;	   }
    	int		getScore()	 { return score;   }
    
    	public String toString() {
    		return String.format("[%s, %s, %d학년 %d반, %3d점]", name, isMale ? "남" : "여", hak, ban, score);
    	}
    
    	enum Level {
    		HIGH, MID, LOW
    	}
    }
    
    class Main {
    	public static void main(String[] args) {
    		Student3[] stuArr = {
    			new Student3("나자바", true,  1, 1, 300),	
    			new Student3("김지미", false, 1, 1, 250),	
    			new Student3("김자바", true,  1, 1, 200),	
    			new Student3("이지미", false, 1, 2, 150),	
    			new Student3("남자바", true,  1, 2, 100),	
    			new Student3("안지미", false, 1, 2,  50),	
    			new Student3("황지미", false, 1, 3, 100),	
    			new Student3("강지미", false, 1, 3, 150),	
    			new Student3("이자바", true,  1, 3, 200),	
    			new Student3("나자바", true,  2, 1, 300),	
    			new Student3("김지미", false, 2, 1, 250),	
    			new Student3("김자바", true,  2, 1, 200),	
    			new Student3("이지미", false, 2, 2, 150),	
    			new Student3("남자바", true,  2, 2, 100),	
    			new Student3("안지미", false, 2, 2,  50),	
    			new Student3("황지미", false, 2, 3, 100),	
    			new Student3("강지미", false, 2, 3, 150),	
    			new Student3("이자바", true,  2, 3, 200)	
    		};
    
    		System.out.printf("1. 단순그룹화(반별로 그룹화)%n");
    		Map<Integer, List<Student3>> stuByBan = Stream.of(stuArr)
    				.collect(groupingBy(Student3::getBan));
    
    		for(List<Student3> ban : stuByBan.values()) {
    			for(Student3 s : ban) {
    				System.out.println(s);
    			}
    		}
    
    		System.out.printf("%n2. 단순그룹화(성적별로 그룹화)%n");
    		Map<Student3.Level, List<Student3>> stuByLevel = Stream.of(stuArr)
    				.collect(groupingBy(s-> {
    						 if(s.getScore() >= 200) return Student3.Level.HIGH;
    					else if(s.getScore() >= 100) return Student3.Level.MID;
    					else                         return Student3.Level.LOW;
    				}));
    
    		TreeSet<Student3.Level> keySet = new TreeSet<>(stuByLevel.keySet());
    
    		for(Student3.Level key : keySet) {
    			System.out.println("["+key+"]");
    
    			for(Student3 s : stuByLevel.get(key))
    				System.out.println(s);
    			System.out.println();
    		}
    
    		System.out.printf("%n3. 단순그룹화 + 통계(성적별 학생수)%n");
    		Map<Student3.Level, Long> stuCntByLevel = Stream.of(stuArr)
    				.collect(groupingBy(s-> {
    					     if(s.getScore() >= 200) return Student3.Level.HIGH;
    					else if(s.getScore() >= 100) return Student3.Level.MID;
    					else                         return Student3.Level.LOW;
    				}, counting()));
    		for(Student3.Level key : stuCntByLevel.keySet())
    			System.out.printf("[%s] - %d명, ", key, stuCntByLevel.get(key));
    		System.out.println();
    /*
    		for(List<Student3> level : stuByLevel.values()) {
    			System.out.println();
    			for(Student3 s : level) {
    				System.out.println(s);
    			}
    		}
    */
    		System.out.printf("%n4. 다중그룹화(학년별, 반별)");
    		Map<Integer, Map<Integer, List<Student3>>> stuByHakAndBan =
              Stream.of(stuArr)
    				.collect(groupingBy(Student3::getHak,
    						 groupingBy(Student3::getBan)
    				));
    
    		for(Map<Integer, List<Student3>> hak : stuByHakAndBan.values()) {
    			for(List<Student3> ban : hak.values()) {
    				System.out.println();
    				for(Student3 s : ban)
    					System.out.println(s);
    			}
    		}
    
    		System.out.printf("%n5. 다중그룹화 + 통계(학년별, 반별 1등)%n");
    		Map<Integer, Map<Integer, Student3>> topStuByHakAndBan =
              Stream.of(stuArr)
    				.collect(groupingBy(Student3::getHak,
    						 groupingBy(Student3::getBan,
    						     collectingAndThen(
    						         maxBy(comparingInt(Student3::getScore))
    						         , Optional::get
    						     )
    						 )
    				));
    
    		for(Map<Integer, Student3> ban : topStuByHakAndBan.values())
    			for(Student3 s : ban.values())
    				System.out.println(s);
    
    		System.out.printf("%n6. 다중그룹화 + 통계(학년별, 반별 성적그룹)%n");
    		Map<String, Set<Student3.Level>> stuByScoreGroup = Stream.of(stuArr)
    			.collect(groupingBy(s-> s.getHak() + "-" + s.getBan(),
    					mapping(s-> {
    						 if(s.getScore() >= 200) return Student3.Level.HIGH;
    					else if(s.getScore() >= 100) return Student3.Level.MID;
    						 else                    return Student3.Level.LOW;
    					} , toSet())
    			));
    
    		Set<String> keySet2 = stuByScoreGroup.keySet();
    
    		for(String key : keySet2) {
    			System.out.println("["+key+"]" + stuByScoreGroup.get(key));
    		}
    	}  
    }
    ```
    

### Optional<T>

: T타입 객체의 래퍼클래스. null을 간접적으로 사용하기 위해 씀  
null을 Optional객체 안에 넣어서 사용. null값이 필요할떄 빈Optional<T>객체의 주소값을 받음  

- Optional객체의 값 가지고 오기 - get(), orElse(), orElseGet(), orElseThrow()
- isPresent() : Optional객체의 값이 null이면 false, 아니면 true - null이 아닐때만 작업 수행

— 사용이유

- null을 직접 다루는 것은 위험 - nullPointException 위험 → 간접적으로 null을 사용하기 위해 사용
- null체크는 if문 필수 : 코드가 지저분해짐 → 코드를 깔끔히 하기위해 사용

```java
import java.util.Optional;

class  Main{
	public static void main(String[] args)  {
//		int arr[] = null; //nullpointException발생
		int arr[] = new int[0];
		System.out.println("arr.length = "+arr.length);
		
//		Optional<String> opt = null; //가능한데 바람직하지않음
		Optional<String> opt = Optional.empty();
//		Optional<String> opt = Optional.of("abc");
		System.out.println("opt="+opt);
//		System.out.println("opt.get()="+opt.get()); //에러. 값이없어서. 이래서 잘 안씀
//		String str = "";
//		try {
//			str = opt.get(); 
//		} catch (Exception e) {
//			str = ""; //예외 발생시 빈문자열("")로 초기화
//		}
//		System.out.println();
		
		//Optional에 저장된 값이 null이면 ""반환
//		String str = opt.orElse("");
//		String str = opt.orElseGet(()->new String());
		String str = opt.orElseGet(String::new);
		System.out.println("str="+str);
	}
}
```

- 기본형을 감싸는 래퍼클래스 - OptionalInt, OptionalLong, OptionalDouble - Optional<T>를 써도 되지만 성능이 떨어짐
    
    |Optional클래스|값을 반환하는 메소드|
    |---|---|
    |Optional<T>|T get()|
    |OptionalInt|int gerAsInt()|
    |OptionalLong|long gerAsLong()|
    |OptionalDouble|double getAsDouble()|
    
    - 빈 Optional객체와의 비교 - OptionalInt.of(0)과 OptionalInt.empty() 구별에 isPresent()를 사용  
        OptionalInt.of(0)은 true, OptionalInt.empty()는 false. 두개 equals해도 false나옴  
        
    
    ```java
    import java.util.Optional;
    import java.util.OptionalInt;
    
    class  Main{
    	public static void main(String[] args)  {
    		Optional<String> optStr = Optional.of("abcde");
    		Optional<Integer> optInt = optStr.map(String::length);
    		System.out.println("optStr="+optStr.get());
    		System.out.println("optInt="+optInt.get());
    		
    		int result1 = Optional.of("123")
    				.filter(x->x.length() >0)
    				.map(Integer::parseInt).get();
    		
    		int result2 = Optional.of("")
    				.filter(x->x.length() >0) //false
    				.map(Integer::parseInt).orElse(-1); //값이 없으면 -1 반환
    		
    		System.out.println("result1 = "+result1);
    		System.out.println("result2 = "+result2);
    		
    		Optional.of("456").map(Integer::parseInt)
    		.ifPresent(x->System.out.printf("result3 = %d%n",x)); //ifPresent : 값이 있으면
    		
    		OptionalInt optInt1 = OptionalInt.of(0); //0을 저장
    		OptionalInt optInt2 = OptionalInt.empty(); //빈 객체 생성
    		
    		System.out.println(optInt1.isPresent()); //true
    		System.out.println(optInt2.isPresent()); //false
    		System.out.println("optInt1="+optInt1);
    		System.out.println("optInt2="+optInt2);
    		System.out.println("opt1.equals(optInt2)?"+optInt1.equals(optInt2));//false
    	}
    }
    ```
    

![images](/assets/images/java/IMG-20240902151634-1.png)