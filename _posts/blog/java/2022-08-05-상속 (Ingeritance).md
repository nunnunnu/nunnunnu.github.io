---
date: 2022-08-05
last_modified_at시: 2022-08-13
categories: JAVA
tags:
  - java
  - 자바의정석
---
### 상속

~는 ~이다 (is - a) - ex.원(circle)은 점(point)다. (x)

class 자식클래스 extends 부모클래스

- 기존의 클래스로 새로운 클래스를 작성(코드 재사용)
- 두 클래스를 부모와 자식 관계로 이어줌
- 자손은 조상의 모든 멤버를 상속받는다 (생성자, 초기화 블럭 제외 (자식클래스에 멤버가 안적혀있어도 있는거임)
- 자손의 멤버 개수가 조상보다 적을 수는 없음.(같거나 많다.)
- 자손의 변경은 조상에게 영향을 미치지 않음.
- 부모 클래스의 변경은 자식 클래스에 영향을 미침.

```java
class point {
	int x, y;
}
class point3D extends point {
	int z;
}
```

- 상속을 받지않고 중복으로 멤버들을 지정해줘도 결과는 똑같음.

```java
class Tvclass {
	boolean power;//전원상태(on/off)
	int channel;
	
	void power() {power = !power;}
		void channelUp() {++channel;}
		void channelDown() {--channel;}
}

	class SmartTv extends Tvclass{ //SmartTv는 Tv에 캡션(자막)을 보여주는 기능을 지원
	boolean caption; //캡션상태 (on/off)
	void displayCapion(String text) {
		if(caption) { 
			//캡션의 상태가 on(true)일때만 text를 보여줌
			System.out.println(text);
		}
	}
}
public class Ex7_1 {

	public static void main(String[] args) {
		SmartTv stv = new SmartTv();
		stv.channel=10; //조상에게 상속받은 멤버
		stv.channelUp(); //조상에게 상속받은 멤버
		System.out.println(stv.channel);
		stv.displayCapion("ssssssssssss"); //자막 off상태
		stv.caption = true;
		System.out.println("ssssssssssssssssssssssss");
		
		
	}

}
```

### 포함(composite)

~은 ~을 가지고 있다. (has - a) - ex. 원(circle)은 점(point)를 가지고 있다.(o)

— 90%가 포함이라고 보면 됨

: 클래스의 멤버로 참조변수를 선언함

```java
class Point {
	int x; //원점의 x좌표
	int y; //원점의 y좌표
}
class circle {
	Point c =new Point(); //c가 또 객체를 만들어서 Point를 가르킴
	int r; //반지름
}
//class circle { int x; int y; int r;}과 같은 거임.
public class Ex7_1 {

	public static void main(String[] args) {
		circle c = new circle();
		c.c.x = 5;
		c.c.y = 10;
		c.r = 15;
		//x,y는 circle c의 point c를 불러야 사용가능
```

```java
class Point{
	int x, y;
}
class Circle extends Point{
	int r;
}
class Circle2{
	Point p = new Point();
	int r;
}
public class InheritanceTest {

	public static void main(String[] args) {
		Circle c = new Circle();
		c.x=1;
		c.y=2;
		c.r=3;
		System.out.println("c.x = "+c.x);
		System.out.println("c.y = "+c.y);
		System.out.println("c.r = "+c.r);
		
		System.out.println();
		
		Circle2 c2 = new Circle2();
		c2.p.x = 10;
		c2.p.y = 15;
		c2.r=20;
		System.out.println("c2.p.x = "+c2.p.x);
		System.out.println("c2.p.y = "+c2.p.y);
		System.out.println("c2.p.r = "+c2.r);
		
	}

}
```

### 단일상속(Single Inheritance)

자바는 단일 상속만을 허용함. (c++은 다중상속 허용) → 인터페이스를 이용하면 비슷한 기능을 쓸 수 있음

- 비중이 높은 클래스 하나만 상속으로 나머지는 포함으로 작성 가능

### Object class - 모든 클래스의 조상

- 부모가 없는 클래스는 자동적으로 object 클래스를 상속받게 됨.
- 모든 클래스는 object클래스에 정의된 11개의 메소드를 상속받음  
    toString(), equals(Object obj), hashCode() ……..등등(9장)  
    
- 상속계층도를 따라올라가면 맨 위에 Object가 있음

```java
class Point{
	int x, y;
}
class Circle extends Point{
	int r;
}

public class InheritanceTest {

	public static void main(String[] args) {
		Circle c = new Circle();
		System.out.println(c.toString()); //Circle@5ca881b5 클래스이름@객체주소값
		System.out.println(c); //Circle@5ca881b5 클래스이름@객체주소값
		Circle c2 = new Circle();
		System.out.println(c2.toString()); //Circle@24d46ca6 클래스이름@객체주소값
		System.out.println(c2); //Circle@24d46ca6 클래스이름@객체주소값
	}

}
```

println이 참조변수가 들어오면 내부적으로 toString을 호출

### 오버라이딩 (overriding)

상속받은 조상의 메소드를 자신에 맞게 변경하는 것.

- 조건
    - 선언부가 조상클래스의 메소드와 일치해야함
    - 접근 제어자(public, protect, defalt, private) 를 조상클래스의 메소드보다 좁은 범위로 변경불가
    - 예외는 조성 클래스의 메소드보다 많이 선언할 수 없다. (8장)

```java
class Point{
	int x, y;
String getLocation(){
	return "x : "+x+", y : "+y;
	}
}
class Point3D extends Point{
	int z;
	String getLocation() { //오버라이딩 (선언부 변경 불가 내용[ {} 구현부 ]만 변경가능)
		return "x : "+x+", y: "+y+", z : "+z;
		}
	}

public class InheritanceTest {

	public static void main(String[] args) {
		Point3D p = new Point3D();
		p.x = 3;
		p.y=5;
		p.z=7;
		System.out.println(p.getLocation()); //x : 3, y: 5, z : 7
	}
}
```

```java
class Point{
	int x, y;
	
	Point(int x, int y){
		this.x= x;
		this.y=y;
	}
	
	//object클래스의 toString()을 오버라이딩
	public String toString(){
	return "x : "+x+", y : "+y;
	}
}
public class InheritanceTest {

	public static void main(String[] args) {
		Point p = new Point(3,5);
		System.out.println(p.toString()); //x : 3, y : 5
		System.out.println(p); //x : 3, y : 5
	}
}
```

### 오버로딩 (overloading)

기존에 없는 새로운 (이름이 같은)메소드를 정의하는 것. 오버라이딩이랑은 관계없음.

```java
class Parent{
	void parentMethod() {
		
	}
	class child extends Parent{
		void parentMethod() {}
		void parentMethod(int i) {}
		
		void childMethod() {}
		void childMethod(int i) {}
		void childMethod() {}
		
	}
}
```

### 참조변수 super

<mark class="hltr-cyan">this와 비슷함</mark>

- 객체 자신을 가르치는 참조변수. 인스턴스 메소드(생성자)내에서만 존재
- 조상의 멤버를 자신의 멤버와 구분할 떄 사용

```java
class Parent{
	int x=10;
}
class child extends Parent{ //구성멤버 3개
	int x = 20;
	
	void method() { 
		System.out.println("x = "+x);  //가까이있는 x(20)
		System.out.println("this.x = "+this.x);//20
		System.out.println("super.x = "+super.x); //부모클래스의 x (10)
		
	}
}
public class InheritanceTest {

	public static void main(String[] args) {
		child c = new child();
		c.method();
	}
}
```

```java
class Parent{
	int x=10;
}
class child extends Parent{ //구성멤버 2개
	void method() { 
		System.out.println("x = "+x);  //가까이있는 x
		System.out.println("this.x = "+this.x);
		System.out.println("super.x = "+super.x); //부모클래스의 x
		//중복이 없으면 !! 조상멤버기도하지만 내꺼기도해서 this, super 모두 같은 x를 가르킴
	}
}
public class InheritanceTest {

	public static void main(String[] args) {
		child c = new child();
		c.method();
	}
}
```

### super() - 조상의 생성자

참조변수 super와 상관없음

- 조상의 생성자를 호출할 때
- 조상의 멤버는 조상의 생성자를 호출해서 초기화
- 생자와 초기화 블럭은 상속이 x

```java
class Point {
	int x,y;
	Point(int x, int y){
		this.x=x;
		this.y=y; //초기화
	}
}
class Point3D extends Point {
	int z;
	
	Point3D(int x, int y, int z) {
		super(x, y); //조상class에서 초기화
		this.z=z; //초기화
	}
}
```

- 생성자의 첫 줄에는 반드시 생성자(super(); or this();)를 호출해야 한다. 그렇지 않으면 컴파일러가 생성자의 첫 줄에 super();를 삽입함.

```java
class Point {
	int x,y;
	Point(){
		this(0,0);
	}
	Point(int x, int y){
		super();  //object(); 안넣어주면 컴파일러가 자동으로 넣어줌
		this.x=x;
		this.y=y;
```

_**에러 예시 중요!!**_

```java
class Point {
	int x, y;
	Point(int x, int y){
		super(); //컴파일러 자동 추가
		this.x=x;
		this.y=y;
	}
	String getLocation() {
		return "x : "+x+", y : "+y;
	}
}
class MyPoint3D extends Point{
	int z;
	
//	MyPoint3D(int x, int y, int z){
//	super();  //컴파일러 자동 추가 Point()를 호출 -> Point에 Point();가 없어서 에러남
//	this.x=x;
//	this.y=y;
//	this.z=z;
//	}
	
	MyPoint3D(int x, int y, int z){
		super(x,y);
		this.z=z;  
	}  //에러 없애는 방법 다른방법은 Pointclass에 Point();추가하기
	
	String getLocation() { //오버라이딩
		return "x : "+x+", y : "+y+", z : "+z;
	}
	
}
public class Ex_test {

	public static void main(String[] args) {
		MyPoint3D p3 = new MyPoint3D(1,2,3);
		
	}

}
```

### 패키지(package)

- 서로 연관된 class의 묶음
- 클래스는 클래스파일(*.class), 패키지는 폴더. 하위 패키지는 하위폴더
- 클래스의 실제 이름 (full name)은 패키지를 포함.(java.lang.String)
    
    rt.jar는 클래스들을 압축한 파일.(JDK설치경로\jre\lib에 위치) - 자바9부터 rt.jar는 없어짐
    
- 패키지 선언
    - 패키지는 소스파일의 첫 번째 문장으로 단 한번 선언
    - 같은 소스파일의 클래스들은 모두 같은 패키지에 속하게 된다.
    - 패키지 선언이 없으면 이름없는(unnamed)에 속하게 된다. - defaultpackage
- 클래스 패스(classpath)
    - 클래스 파일(*.class)의 위치를 알려주는 경로(path)
    - 환경변수 classpath로 관리하며, 경로간의 구분자는 ‘;’를 사용
    - classpath(환경변수)에 패키지의 루트를 등록해줘야 함

### import문

클래스를 사용할 때 패키지 이름을 생략할 수 있다.

- 컴파일러에게 클래스가 속한 패키지를 알려줌
- ctrl + shift + o ⇒ 자동으로 import문을 추가해줌.(import java.lang.*[모든클래스];) -
- java.lang 패키지(String, Object, System, Thread…)의 클래스는 import하지않고도 사용 가능함.
- 패키지문과 클래스선언 사이에 선언함.
- 이름이 같은 클래스가 속한 두 패키지를 import할 때는 클래스 앞에 패키지명을 붙여줘야 한다.
- static import문
    - static멤버를 사용할 떄 클래스 이름을 생략가능
    - import static java.lang.Math.random;  
        import static java.lang.System.  
        out;
        
        ⇒ out.println(random()); 가능함.
        
    - 코드가 길어져서 class이름도 거추장스러운순간이 옴. 코드를 짧게하려고 쓰는 방법. 꼭 필요할때만 사용할것. 헷갈릴수도

### 제어자(modifier)

클래스와 클래스의 멤버(멤버 변수, 메소드)에 부가적인 의미 부여 - 형용사

|        |                                                                      |          |
| ------ | -------------------------------------------------------------------- | -------- |
| 접근 제어자 | public, protecred, (default)[아무것도안붙임], private                       | 1개만 사용가능 |
| 그외     | static, final, abstract, transient, synchronized, volatile, strictfp |          |

- 하나의 대상에 여러 제어자를 같이 사용가능(접근 제어자는 하나만). 순서는 상관없으나 보통 접근제어자를 맨 왼쪽에 씀
- static - 클래스의, 공통적인
    
    |대상|의미|
    |---|---|
    |멤버변수|모든 인스턴스에 공통적으로 사용되는 클래스 변수가 된다  <br>클래스 변수는 인스턴스를 생성하지 않고도 사용 가능하다.  <br>클래스가 메모리에 로드될 때 생성된다.|
    |메소드|인스턴스를 생성하지 않고도 호출이 가능한 static메소드가 된다.  <br>static메소드 내에서는 인스턴스 멤버들을 직접 사용할 수 없다|
    
- final - 마지막의, 변경될 수 없는

|   |   |
|---|---|
|클래스|변경될 수 없는 클래스, 확장될 수 없는 클래스가 된다.  <br>그래서 final로 지정된 클래스는 다른 클래스의 조상이 될 수 없다|
|메소드|변경될 수 없는 메소드. final로 지정된 메소드는 오버라이딩을 통해 재정의 될 수 없다.|
|멤버변수  <br>지역변수|변수 앞에 final이 붙으면, 값을 변경할 수 없는 상수가 된다.|

```java
final class Finaltest{ //조상이 될 수 없는 클래스
	final int MAX_SIZE=10; //값을 변경할 수 없는 멤버변수(상수)
	
	final void getMaxsize() {  //오버라이딩 할 수 없는 메소드(변경불가)
		final int LV = MAX_SIZE; //값을 변경할 수 없는 지역변수(상수)
		return MAX_SIZE;
	}
}
```

- abstract - 추상의, 미완성의

|   |   |
|---|---|
|클래스|클래스 내에서 추상 메소드가 선언되어 있음을 의미한다|
|메소드|선언부만 작성하고 구현부는 작성하지 않은 추상 메소드임을 알린다.|

```java
abstract class abstracttest{ //추상 클래스(추상 메소드를 포함한 클래스
	abstract void move(); //추상 메소드(구현부가 없는 메소드)
}//미완성상태 - 미완성 설계도. 제품제작불가 = 인스턴스 생성 불가
public class Ex_test {

	public static void main(String[] args) {
		abstracttest a = new abstracttest();  //에러. 추상클래스의 인스턴스 생성 불가
	}
}
```

추상 클래스를 상속받아서 완전한 클래스를 만든 후에 객체생성가능

### 접근 제어자(access modifier) - 1개만 사용 가능

- private : 같은 클래스 내에서만 접근이 가능하다.
- (default) : 같은 패키지 내에서만 접근이 가능하다.
- protected : 같은 패키지 내에서, 그리고 다른 패키지의 자손 클래스에서 접근이 가능하다.
- public : 접근 제한이 전혀 없다.

|제어자|같은 클래스|같은 패키지|자손 클래스|전체|
|---|---|---|---|---|
|public|o|o|o|o|
|protected|o|o|o||
|(default)|o|o|||
|private|o||||

❗클래스 앞에는 public or (default)만 붙일 수 있다. (아무것도 안붙이면 default)

클래스 멤버들에게는 4가지 모두 붙일 수 있다.

```java
package pkg1;

class MyParent{
		private 	int prv; //같은 클래스
							int dft; //같은 패키지
	protected 	int prt; //같은 패키지, 자손(다른패키지)
		public 		int pub; //접근제한 없음
	
	public void printMembers(){
		System.out.println(prv);
		System.out.println(dft);
		System.out.println(prt);
		System.out.println(pub);
	}
}
public class MyParentTest {

	public static void main(String[] args) {
			MyParent p = new MyParent();
			System.out.println(p.prv); //에러. 다른 클래스라서
			System.out.println(p.dft);
			System.out.println(p.prt);
			System.out.println(p.pub);
	}
}
```

---

```java
package pkg1;

public class MyParentTest{  //접근 제어자 public
		private 	int prv; //같은 클래스
							int dft; //같은 패키지
	protected 	int prt; //같은 패키지, 자손(다른패키지)
		public 		int pub; //접근제한 없음
	
	public void printMembers(){
		System.out.println(prv);
		System.out.println(dft);
		System.out.println(prt);
		System.out.println(pub);
	}
}
class MyParent {  //접근 제어자 default

	public static void main(String[] args) {
			MyParentTest p = new MyParentTest();
//			System.out.println(p.prv); //에러. 다른 클래스라서
			System.out.println(p.dft);
			System.out.println(p.prt);
			System.out.println(p.pub);
	}
}
```

```java
package pkg2;

import pkg1.MyParentTest; //ctrl +shift + o

class MyChild extends MyParentTest{
	public void printMembers(){
//	System.out.println(prv); //에러. 다른 클래서
//	System.out.println(dft); //에러. 다른 패키지
		System.out.println(prt); //자손클래스라서 가능
		System.out.println(pub);
	}
}
public class MyParentTest2 {

	public static void main(String[] args) {
		MyParentTest p = new MyParentTest();
//	System.out.println(p.prv); //에러. 다른 클래스라서
//	System.out.println(p.dft); //에러. 다른 패키지
//	System.out.println(p.prt); //에러. 다른 패키지, 자손관계 없음
		System.out.println(p.pub);
	}

}
```

### 캡슐화와 접근 제어자

- 접근 제어자를 사용하는 이유
    - 외부로부터 데이터를 보호하기 위해(캡슐화)
        
        ```java
        public class Ex_test{
        	private int hour;  //접근 제어자를 private로 하여 외부에서 접근 못하도록 막음
        	private int minute;
        	private int second;
        	
        	public int gethour() {
        		return hour;
        	}
        	public void sethour(int hour) {
        		if(hour<0 || hour >23) return;
        		this.hour=hour;  //메소드를 통해서 지역변수에 간접접근하도록 만들어 놓음
        	}
        }
        class test {
        	public static void main(String[] args) {
        		Ex_test T=new Ex_test();
        		T.sethour(25);  //조건에 안맞아서 값이 바뀌지 않음. = 값이 보호됨
        		T.sethour(21);
        	}
        }
        ```
        

### 다형성(polymorphism)

여러가지 형태를 가질 수 있는 능력

- 조상 타입 참조변수로 자손 타입 객체를 다루는 것. - 타입 불일치.  
    Tv t = new SmartTv();  
    - 객체와 참조변수의 타입이 일치할 때와 일치하지 않을 때의 차이?  
        조상클래스의 참조변수는 자식 클래스의 멤버를 사용할 수 없다.  
        
    - 자손타입의 참조변수로 조상 타입의 객체를 가리킬 수 없다.  
          
        <mark class="hltr-cyan">SmartTv s = new Tv</mark> 불가능 - 없는 멤버를 호출해서 에러날 가능성 있음
- 참조변수의 형변환
    - 사용할 수 있는 멤버의 갯수를 조절하는 것. 멤버 갯수 외 요소는 바뀌지 않음
        <mark class="hltr-cyan">기본형 형변환 - (double)3.5 → (int)3</mark>
        
    - 조상 자손 관계의 참조변수는 서로 형변환 가능
        
        ```java
        class Car{
        	String Color;
        	int door;
        	
        	void drive() { //운전하는 기능
        		System.out.println("brrrrr...~~");
        	}
        	void stop() {
        		System.out.println("stop!!");
        	}
        }
        class FireEngine extends Car{
        	void water() {
        		System.out.println("water!!");
        	}
        }
        class Ambulance extends Car{
        	
        }
        public class Ex_test {
        	public static void main(String[] args) {
        		FireEngine f = new FireEngine();
        		Car c = (Car)f; //조상인 Car타입으로 형변환
        		FireEngine f2 = (FireEngine)c; //자손인 FireEngine타입으로 형변환(생략불가)
        	//Ambulance a = (FireEngine)f; //에러. 상속관계가 아닌 클래스간의 형변환 불가
        	}
        }
        ```
        
        Car c= (Car)f;경우 자손 클래스의 멤버를 조상클래스의 멤버가 사용할 수 없으니 c는 FireEngine의 모든 멤버를 사용할 수 없음(예시의 경우 c.water사용 불가능)
        
        FireEngine f2 = (FireEngine)c는 f→c→f로 변환되었으니 FireEngine의 모든 멤버를 사용할 수 있음.
        
        ![image](/assets/images/java/2022-08-05-상속(Ingeritance)/IMG-20240818213037.png)
        
        ```java
        class Car{
        	String Color;
        	int door;
        	
        	void drive() { //운전하는 기능
        		System.out.println("brrrrr...~~");
        	}
        	void stop() {
        		System.out.println("stop!!");
        	}
        }
        class FireEngine extends Car{
        	void water() {
        		System.out.println("water!!");
        	}
        }
        class Ambulance extends Car{
        	
        }
        public class Ex_test {
        	public static void main(String[] args) {
        		Car car = null;
        		FireEngine fe = new FireEngine();
        		FireEngine fe2 = null;
        		
        		fe.water();
        		car = fe; //car = (car)fe; 에서 형변환이 생략됨.
        //		car.water(); //에러
        		fe2=(FireEngine)car;  //자손타입<-조상타입. 생략불가
        		fe2.water();
        	}
        }
        ```
        
        ❗fe2=(FireEngine)car;의 경우 사용할 수 있는 멤버의 수가 증가해서 불안정함. 그래서 꼭! 형변환을 써줘야함. 생략불가능
        
        ![image](/assets/images/java/2022-08-05-상속(Ingeritance)/IMG-20240818213037-1.png|IMG-20240818213037-1.png)]
        
        ```java
        class Car{
        	String Color;
        	int door;
        	
        	void drive() { //운전하는 기능
        		System.out.println("brrrrr...~~");
        	}
        	void stop() {
        		System.out.println("stop!!");
        	}
        }
        class FireEngine extends Car{
        	void water() {
        		System.out.println("water!!");
        	}
        }
        class Ambulance extends Car{
        	
        }
        public class Ex_test {
        	public static void main(String[] args) {
        		Car car = null;
        		FireEngine fe = new FireEngine();
        		
        		FireEngine fe2= (FireEngine)car; //조상 -> 자손
        		Car car2 = (Car)fe2; // 자손 -> 조상
        		//객체가 없어도 형변환에는 문제없음.
        		//car2.drive(); //에러  NullPointerException발생. 객체가 없다는 뜻
        		//실제 인스턴스가 뭔지가 중요함.
        		
        		Car c2 = new Car();
        		FireEngine fe3 = (FireEngine)c2; // 형변환 실행 에러. java.lang.ClassCastException
        		fe3.water(); //컴파일 ok. 리모컨에는 water가 있음.
        		//객체를 Car로 만들어서 객체안에 water자체가 없음!! 그래서 에러나는거임!!
        	}
        }
        ```
        
- instanceof 연산자
    - 참조변수의 형변환 가능여부 확인에 사용. 가능하면 true 반환
    - 형변환 전에 반드시 instanceof로 확인해야 함
    - 인스턴스의 원래 기능을 모두 사용하려고 형변환을 함. 
        
        ```java
        class Car{
        	String Color;
        	int door;
        	
        	void drive() { //운전하는 기능
        		System.out.println("brrrrr...~~");
        	}
        	void stop() {
        		System.out.println("stop!!");
        	}
        }
        class FireEngine extends Car{
        	void water() {
        		System.out.println("water!!");
        	}
        }
        class Ambulance extends Car{
        	
        }
        public class Ex_test {
        	public static void main(String[] args) {
        		FireEngine fe = new FireEngine();
        		
        		System.out.println(fe instanceof Object); //true. FireEngine의 조상
        		System.out.println(fe instanceof Car); //true. FireEngine의 조상
        		System.out.println(fe instanceof FireEngine); //true
        		Object obg = (Object)fe;
        		Car c2 = (Car)fe;
        		FireEngine fe2 = (FireEngine)fe;
        		}
        	Car c = new Car();
        	void doWork(Car c) {
        		if(c instanceof FireEngine) {//형변환이 가능한지 확인
        			FireEngine fe = (FireEngine)c; //형변환
        			fe.water();
        		}
        		else if (c instanceof Ambulance) {
        			Ambulance a = (Ambulance)c;
        		}
        	}
        	
        }
        ```
        
- 다형성의 장점
    - 다형적 매개변수 - 매개변수의 다형성
        
        - 참조형 매개변수는 메소드 호출시, 자신과 같은 타입 또는 자손타입의 인스턴스를 넘겨줄 수 있다.
            
            ```java
            class Product{
            	int price; //제품가격
            	int bonusPoint; //포인트
            }
            class Tvvv extends Product{}
            class Computer extends Product{}
            class Audio extends Product{}
            
            class Buyer { //물건사는사람
            	int money = 10000; //소지금
            	int bonusPoint = 0; //누적 적립금
            	
            //	void buy(Tv t1) {
            //		money -= t1.price;
            //		bonusPoint += t1.bonusPoint;
            //	}
            //	void buy(Computer c) {
            //		money -= c.price;
            //		bonusPoint += c.bonusPoint;
            //	}
            //	void buy(Audio a) {
            //		money -= a.price;
            //		bonusPoint += a.bonusPoint;
            //	}
            	void buy(Product p){
            		money -= p.price;
            		bonusPoint += p.bonusPoint;
            	}
            }
            public class Ex_test {
            	public static void main(String[] args) {
            		Buyer b = new Buyer();
            		
            //		Tvvv tv = new Tvvv();
            //		tv.price=5000;
            //		tv.bonusPoint= (int) (tv.price*0.01);
            //		b.buy(tv);
            //		Computer com = new Computer();
            //		com.price=3000;
            //		com.bonusPoint= (int) (com.price*0.01);
            //		
            //		b.buy(com);
            		
            		Product p1= new Tvvv();
            		Product p2= new Computer();
            		Product p3= new Audio();
            		p1.price=5000;
            		p1.bonusPoint=(int) (5000*0.01);
            		b.buy(p1);
            		p2.price=3000;
            		p2.bonusPoint=(int)(p2.price*0.01);
            		b.buy(p2);
            		System.out.println(b.money);
            		System.out.println(b.bonusPoint);
            		
            	}
            	
            }
            ```
            
            ```java
            class Product{
            	int price; //제품가격
            	int bonusPoint; //포인트
            	Product(int price){
            		this.price=price;
            		bonusPoint = (int) (price/10.0);
            	}
            }
            class Tv extends Product{
            	Tv() {
            		//조상 클래스의 product(int price)를 호출
            		super(100); //100만원
            	}
            	//Object 클래스의 toString()을 오버라이딩
            	public String toString() {return "tv";}
            }
            class Computer extends Product{
            
            	Computer() {
            		super(200);
            	}
            	public String toString() {return "computer";}
            }
            class Audio extends Product{
            
            	Audio() {
            		super(50);
            	}
            	public String toString() {return "audio";}
            }
            
            class Buyer { //물건사는사람
            	int money = 1000; //소지금
            	int bonusPoint = 0; //누적 적립금
            	
            	void buy(Product p){ 
            		if(money<p.price) {
            			System.out.println("잔액이 부족하여 물건을 구매할 수 없습니다.");
            			return;
            		}
            	
            		money -= p.price;
            		bonusPoint += p.bonusPoint;
            		System.out.println(p+"을/를 구매하셨습니다.");  //여기서 p는 p.toString과 같음
            	}
            }
            public class Ex_test {
            	public static void main(String[] args) {
            		Buyer b = new Buyer();
            		
            		b.buy(new Tv()); //Product tv1 = new Product; b.buy(tv1)
            		//짧게 쓸 수 있으나 참조변수가 없어서 리모컨을 사용할 수 없음. b.buy에서 임시로 쓰는 것.
            		b.buy(new Computer()); //Product com1 = new Product; b.buy(com1)
            		
            		System.out.println("현재 남은 돈은 "+b.money+"만원입니다");
            		System.out.println("현재 보너스 점수는 "+b.bonusPoint+"점 입니다.");
            	}
            }
            ```
            
        
        ⇒장점 1.하나의 메소드로 여러타입의 객체를 받을 수 있음
        
    - 하나의 배열로 여러 종류의 객체를 다루기
        
        : 조상 타입의 배열에 자손들의 객체를 담을 수 있다. =
        
        장점2. 하나의 배열에 여러종류의 객체를 저장할 수 있음
        
        ```java
        // product p1 = new tv();
        // product p2 = new computer();
        // product p3 = new audio();
        
        Product p[] = new Product();
        p[0] = new tv();
        p[1] = new computer();
        p[2] = new audio();
        ```
        
        ![image](/assets/images/java/2022-08-05-상속(Ingeritance)/IMG-20240818213037-2.png|IMG-20240818213037-2.png)]
        
        ```java
        class Buyer { //물건사는사람
        	int money = 1000; //소지금
        	int bonusPoint = 0; //누적 적립금
        	
        	Product cart[] = new Product[10]; //구매한 물건을 담을 배열 (장바구니)
        	
        	int i = 0;
        	
        	void buy(Product p){
        		if(money<p.price) {
        			System.out.println("잔액이 부족하여 물건을 구매할 수 없습니다.");
        			return;
        		}
        	
        		money -= p.price;
        		bonusPoint += p.bonusPoint;
        		cart[i++] = p; //cart에 담고 배열+1해서 새 장바구니칸에 담고..
        		System.out.println(p+"을/를 구매하셨습니다.");  //여기서 p는 p.toString과 같음
        	}
        }
        ```
        
        ```java
        public class Vector extends AbstractList //Vector = 가변배열기능. object배열을 멤버로 가지고 있음.
        		implements List, Cloneable, java.io.serializable{
        	protected Object elementDate[];
        }
        ```
        
        ```java
        class Product{
        	int price; //제품가격
        	int bonusPoint; //포인트
        	Product(int price){
        		this.price=price;
        		bonusPoint = (int) (price/10.0);
        	}
        }
        class Tvvv extends Product{
        	Tvvv() {
        		super(100); //100만원
        	}
        	public String toString() {return "tv";}
        }
        class Computer extends Product{
        
        	Computer() {
        		super(200);
        	}
        	public String toString() {return "computer";}
        }
        class Audio extends Product{
        
        	Audio() {
        		super(50);
        	}
        	public String toString() {return "audio";}
        }
        
        class Buyer { //물건사는사람
        	int money = 1000; //소지금
        	int bonusPoint = 0; //누적 적립금
        	
        	Product cart[] = new Product[10]; //구매한 물건을 담을 배열 (장바구니)
        	
        	int i = 0;
        	
        	void buy(Product p){
        		if(money<p.price) {
        			System.out.println("잔액이 부족하여 물건을 구매할 수 없습니다.");
        			return;
        		}
        	
        		money -= p.price;
        		bonusPoint += p.bonusPoint;
        		cart[i++] = p; //cart에 담고 배열+1해서 새 장바구니칸에 담고..
        		System.out.println(p+"을/를 구매하셨습니다.");  //여기서 p는 p.toString과 같음
        	}
        	void summary() { //구매 물품 정보 요약표시
        		int sum = 0; //구입한 물품의 가격 합계
        		String itemList = ""; //구입한 물품 목록
        		
        		//반복문을 사용해 구입한 물품의 총 가격과 목록을 만든다.
        		for(int i=0; i<cart.length;i++) {
        			if(cart[i]==null) break;
        			sum+=cart[i].price;
        			itemList += cart[i]+", ";
        		}
        		System.out.println("구입하신 물건의 총 금액은 "+sum+"만원입니다.");
        		System.out.println("구입하신 제품은 "+itemList+"입니다.");
        	}
        }
        public class Ex_test {
        	public static void main(String[] args) {
        		Buyer b = new Buyer();
        		
        		b.buy(new Tvvv(  ));
        		b.buy(new Computer());
        		b.buy(new Audio());
        		
        		System.out.println("현재 남은 돈은 "+b.money+"만원입니다");
        		System.out.println("현재 보너스 점수는 "+b.bonusPoint+"점 입니다.");
        		b.summary();
        	}
        }
        ```
        

---

### 추상클래스(abstract calss)

: 미완성 설계도. 미완성 메소드 -구현부(몸통{})이 없는 메소드- 를 갖고 있는 클래스. 객체 생성 불가능. 일반클래스인데 미완성 메소드를 가지고 있는 것  
abstract 리턴타입 메소드 이름();  

```java
abstract class Player { //추상클래스(미완성 클래스)	
	abstract void play(int pos); //몸통{}이 없는 추상메소드
	abstract void stop(); //몸톰{}이 없는 추상메소드
}
	//추상클래스가 다른 클래스를 작성하는데 도움이 됨.
//추상클래스는 상속을 통해 완성해야 객체 생성가능
class AudioPlayer extends Player{
	void play(int pos) {
		System.out.println(pos+"위치부터 play합니다.");
		}//추상메소드 구현 = 몸통만들어줌.
	void stop() {
		System.out.println("재생을 멈춥니다.");
	}//추상메소드 구현=몸통 만들어줌
}
public class PlayerTest {

	public static void main(String[] args) {
//		Player p = new Player();  //에러. 추상클래스의 인스턴스화 불가
		AudioPlayer ap = new AudioPlayer(); //인스턴스 생성 가능.
		ap.play(100);
		ap.stop();
		Player p2 = new AudioPlayer(); //Player가 조상타입이라 가능함. 다형성
		p2.play(500);
		p2.stop();
		}
	}
```

```java
abstract class Player{
	boolean pause; //일시정지상태를 저장하기위한 변수
	int currentPos;//현재 play되고 있는 위치를 저장하기 위한 변수
	//플레이어의 종류마다 플레이 방식이나 멈추는 방식이 다르니 미리 만들어봤자 의미가 없음.
	//중요한건데 후에 상속을 만들 때 빠질까봐 강제하는 것임.
	Player(){  //추상클래스라도 생성자가 있어야함.
		pause = false;  
		currentPos = 0;
	}
	//지정된 위치(pos)에서 재생을 시작하는 기능이 수행하도록 작성되어야 한다.
	abstract void play(int pos); //추상메소드
	//재생을 즉시 멈추는 기능을 수행하도록 작성되어야한다.
	abstract void stop(); //추상메소드
	
	void play() { //인스턴스메소드
		play(currentPos); //추상메소드를 사용할 수 있다.. 메소드는 선언부만 알면 호출가능하므로 추상메소드도 호출가능함.
	//상속을 통해 자손이 완성될 예정이라 사용할 수 있다. (지금 호출은 안됨. 상속을 통해 완성된 다음 호출 가능)
	}
}
public class ex {

	public static void main(String[] args) {
		}
	}
```

- 꼭 필요하지만 자손마다 다르게 구현될 것으로 예상되는 경우
- 여러 클래스에 공통적으로 사용될 수 있는 추상클래스를 바로 작성하거나 기존 클래스의 공통 부분을 뽑아서 추상클래스를 만든다.
    
    ```java
    abstract class Unit{
    	int x,y;
    	abstract void move(int x, int y);
    	void stop() {
    		//현재 위치에 정지
    		};
    	}
    class Marine extends Unit { //보병
    	void move(int x, int y) {
    		//지정된 위치로 이동
    		System.out.println("marine [x = "+x+", y = "+y+"]");
    	}
    	void stimPack() {
    		//스팀팩 사용
    	}
    }
    class Tank extends Unit{
    	void move(int x, int y) {
    	System.out.println("Tank [x = "+x+", y = "+y+"]");
    	}
    	void changeMode() {}; //공격모드로 변경
    }
    class Dropship extends Unit {
    	void move(int x, int y) {
    	System.out.println("Dropship [x = "+x+", y = "+y+"]");
    	}
    	void load() {}// 선택된 대상 태우기
    	void unload() {}//선택대상 내리기
    }
    public class ex {
    
    	public static void main(String[] args) {
    //		Unit[] group = new Unit[3];
    //		group[0]=new Marine();
    //		group[1]=new Tank();
    //		group[2]=new Dropship();
    		Unit group[] = {new Marine(), new Tank(), new Dropship()};
    		
    		for(int i=0;i<group.length;i++) {
    			group[i].move(100, 200);
    			//group의 타입은 Unit[], group[0], group[1], group[2]
    		}
    		Object group2[] = {new Marine(), new Tank(), new Dropship()};
    		for(int i=0;i<group2.length;i++) {
    //			group2[i].move(100, 200);
    			//Object는 최상위 객체라서 구현은 가능하나 move를 멤버로 가지고있지 않아서 에러남
    		}
    	}
    }
    ```
    
- 추상화(불명확)←→구체화(명확)
    
    - 추상화된 코드는 구체화된 코드보다 유연함. 변경에 유리  
        구체적인 코드 - GregorianCalendar cal = new GregorianCalendar();  
        추상적인 코드 = Calendar cal = Calendar.getInstance : Calendar 자손 객체를 반환해 cal에 대입. ⇒ Calendar객체가 무엇을 반환할 지 불명확함.  
          
        
    
    ```java
    import java.util.Calendar;
    
    private static Calendar createCalendar(TimeZone. Locale aLocale) {
    	if(caltype != null) {
    		switch(caltype) {
    		case "buddhist": //불교력
    			cal = new BuddhistCalendar(zone, aLocale);
    			break;
    		case "japanese" : //일본력
    			cal = new JapanesImperialCalendar(zone, aLocale);
    			break;
    		case "gregory" : //서양력
    			cal = new GregorianCalendar(zone, aLocale);
    			break;
    		}
    	}
    }
    public class ex {
    
    	public static void main(String[] args) {
    //		GregorianCalendar cal = new GregorianCalender(); 구체적
    		Calendar cal = Calendar.getInstance();//추상적
    	}
    }
    ```
    

### 인터페이스(interface)

추상메소드의 집합<mark class="hltr-cyan">(프로그래밍관점)</mark>

- 구현된 것이 하나도 없는 설계도. 껍데기(모든 멤버가 public)
    
    interface 인터페이스이름{
    
    public static final 타입 상수이름 = 값;
    
    public abstract 메소드이름(매개변수목록); }
    
    ```java
    interface PlayingCard{
    	//상수
    	public static final int SPADE =4;
    	final int DIAMOND = 3; //public static 생략됨
    	static int HAEART = 2; //public final 생략됨
    	int CLOVER = 1; //public static final
    
    	//추상메소드
    	public abstract String getCardNumber();
    	String getCaedKind(); //public abstract생략됨.
    	//public static final은 예외없이 모두 적용이기때문에 적지않아도 자동으로 붙여줌
    	}
    public class ex {
    
    	public static void main(String[] args) {
    	}
    }
    ```
    

> [!important]  
> 추상클래스와 인터페이스의 차이점인터페이스는 인스턴스변수를 가질 수 없음!  

- 인터페이스의 조상은 인터페이스만 가능(Object가 최고 조상이 아님)
- 다중 상속 가능. (추상메소드는 구현부{}가 없어서 충돌해도 문제 없음) - 조상이 여러개여도 가능.
- 인터페이스는 지역변수를 가지지 못함(추상클래스는 가능)
- 인터페이스의 구현 : 인터페이스에 정의된 추상메소드를 완성하는 것.  
    class 클래스 이름 implements 인터페이스 이름{ 인터페이스에 정의된 모든 추상메소드를 구현해야 함. } - 일부만 구현하는 경우, 클래스앞에 abstract를 붙여야함.  
    = 추상클래스 완성과 동일  
    
    ```java
    interface Fightable{ //인터페이스
    	void move(int x, int y);
    	void attack(Unit u);
    }
    class Fighter implements Fightable{ //인터페이스 구현
    	public void move(int x, int y) {
    		System.out.println("x = "+x+", y = "+y);
    	}
    	public void	attack(Unit u) {
    		System.out.println("Unit = "+u);
    	}
    }
    abstract class Player{ //추상클래스
    	abstract void play(int pos);
    	abstract void stop();
    }
    class AudioPlayer extends Player{ //추상클래스 구현
    	void play(int pos) {
    		System.out.println(pos);
    	}
    	void stop() {
    		//내용
    	}
    }
    public class Ex_test {
    	public static void main(String[] args) {
    		
    	}
    }
    ```
    
- 인터페이스를 이용한 다형성
    
    - 인터페이스도 구현 클래스의 부모임
    - 인터페이스 타입 매개변수는 인터페이스 구현한 클래스의 객체만 가능
    - 인터페이스를 메소드의 리턴타입으로 지정가능.
    
    ```java
    import java.io.ObjectInputStream.GetField;
    
    abstract class Unit{
    	int x,y;
    	abstract void move(int x, int y);
    	void stop() {
    		System.out.println("멈춤");
    	};
    }
    interface Fightable{ //인터페이스
    	void move(int x, int y); //public abstract가 생략됨
    	void attack(Fightable f); //public abstract가 생략됨
    }
    class Fighter extends Unit implements Fightable { 
    	public void move(int x, int y) { //오버라이딩 규칙: 조상(public)보다 접근제어자가 좁으면 안됨.
    		System.out.println("["+x+", "+y+"]로 이동");
    	}
    	public void attack(Fightable f) //매개변수 타입이 인터페이스.= 이 인스턴스를 구현한 class의 객체만 가능
    	//attack메소드는 매개변수로 Fightable인터페이스를 구현한 class의 객체만 받음
    	{ 
    		System.out.println(f+"를 공격");
    	} 
    	//싸울 수 있는 상대 소환
    	Fightable getFightable(){
    		Fighter f = new Fighter(); 
    		return f;  //Fighter가 Fightable을 상속받고있어서 형변환이 가능하기때문에 f는 Fighter지만 사용 가능
    	}
    }
    public class Ex_test {
    	public static void main(String[] args) {
    		Fighter f = new Fighter();
    		Fightable ff = f.getFightable();
    		
    		f.move(100, 200);
    		f.attack(new Fighter()); //toString이 나옴
    		f.stop();
    		
    		System.out.println("-----------------");
    		Unit u = new Fighter();
    		u.move(100, 200);
    		u.stop();
    //		u.attack(new Fighter()); //에러, Unit에 attack이 없음
    		
    		System.out.println("-----------------");
    		Fightable f2 = new Fighter();
    		f2.move(100, 200);
    		f2.attack(new Fighter()); //toString이 나옴
    //		f2.stop(); //Fightable에 stop이 없음
    	}
    }
    ```
    
- 장점
    
    - 두 대상(객체)간의 ‘연결, 대화, 소통’을 돕는 ‘중간역할’을 한다
    - 선언과 구현을 분리시킬수 있게됨.(변경에 유리)
    - 개발시간 단축
    - 변경에 유리한 설계
    - 표준화 가능 (데이터베이스회사들이 JDBC에 맞춰 데이터베이스를 개발함. 자바개발자는 JDBC를 기준으로 개발 )
    - 서로 관계없는 클래스들의 관계를 맺어줄 수 있다. : 내가 원하는 클래스만 모아서 인터페이스로 묶을 수 있음
    - 인터페이스덕분에 한 클래스를 변경해도 다른 클래스는 안바꿔도 동작함(느슨한 결함)
    
    직접적 관계
    
    ```java
    class A {
    	public void method(C c){
    		c.methodC();
    	}
    }
    class B {
    	public void methodB(){
    		System.out.println("methodB()");
    	}
    }
    class C{
    	public void methodC(){
    		System.out.println("method() in C");
    	}
    }
    public class InterfaceTest {
    
    	public static void main(String[] args) {
    		A a = new A();
    		a.method(new C()); //A가 B에 의존
    	}
    
    }
    ```
    
    간접적 관계
    
    ```java
    class A {
    	public void method(I i){
    		i.method();
    	}
    }
    interface I { void method();}
     
    class B implements I{
    	public void method(){
    		System.out.println("methodB()");
    	}
    }
    class C implements I{
    	public void method(){
    		System.out.println("method() in C");
    	}
    }
    public class InterfaceTest {
    
    	public static void main(String[] args) {
    		A a = new A();
    		a.method(new B()); //A가 B에 
    	}
    }
    ```
    
- 디폴트 메소드
    - 인터페이스에 새로운 메소드(추상메소드)를 추가하기 어려움 - 한 인터페이스에 추상메소드가 추가되면 연관된 모든 클래스에 추가된 추상메소드 구현을 해주어야함 ⇒ 해결책:디폴트메소드(default method)
        
        interface MyInterface {
        
        void method();
        
        <mark class="hltr-cyan">default</mark> void newMethod();<mark class="hltr-cyan">{ }</mark> }
        
    - 디폴트메소드 = 인스턴스메소드 (인터페이스 원칙 위반 = 예외)
    - 디폴트메소드가 기존의 메소드와 충돌할때?
        1. 여러 인터페이스의 디폴트 메소드간의 충돌  
            — 인터페이스를 구현한 클래스에서 디폴트메소드를 오버라이딩한다  
            
        2. 디폴트메소드와 조상클래스의 메소드간의 충돌  
            — 조상클래스의 메소드가 우선되어 먼저 상속되고, 디폴트메소드는 무시된다.  
            
- static 메소드
- 내부클래스(inner class) : 클래스 안에 클래스
    
    - 객체생성없이도 상위클래스의 멤버에 접근가능
    - 코드의 복잡성을 줄일 수 있음. (캡슐화)
    
    ```java
    class AAA{ //BBB의 외부클래스
    	int i=100;
    	BBB b = new BBB();
    	class BBB{///AAA의 내부클래스
    		void method() {
    //			AAA a = new AAA();  //AAA의 내부클래스라 해줄필요없음
    			System.out.println(i); //객체생성없이 접근가능
    		}
    	}
    }
    class CCC{
    }
    public class ex {
    
    	public static void main(String[] args) {
    		AAA a = new AAA();
    		a.b.method();
    	}
    }
    ```
    
    - 내부클래스의 종류와 유효범위(scope)는 변수와 동일
        
        |내부클래스|특징|
        |---|---|
        |인스턴스 클래스  <br>(instance class)|외부 클래스의 멤버변수 선언위치에 선언하며, 외부 클래스의 인스턴스멤버처럼 다루어진다. 주로 외부클래스의 인스턴스 멤버들과 관련된 작업에 사용될 목적으로 선언된다.|
        |스태택 클래스  <br>(static class)|외부 클래스의 멤버변수 선언위치에 선언하며, 외부 클래스의 static멤버처럼 다루어진다. 주로 외부 클래스의 static멤버, 특히 static메소드에서 사용될 목적으로 선언된다.|
        |지역 클래스  <br>(local class)|외부클래스의 메소드나 초기화블럭 안에 선언하며, 선언된 영역 내부에서만 사용될 수 있다.|
        |익명 클래스  <br>(anonymosus class)|클래스의 선언과 객체의 생성을 동시에 하는 이름없는 클래스(일회용)|
        
        - 내부클래스의 제어자는 public, private, (default), protected 4가지 사용가능.
        
        ```java
        public class ex {
        
        	class InterfaceInner{
        		int iv = 100;
        //		static int cv = 100; //에러, static변수 선언불가
        		//static은 객체없이 생성할 수 있어야하는데 인스턴스안에 들어가있어서 객체를 만들어야 사용할 수 있게됨. 모순이라 에러표시
        		final static int CONST = 100; //final static은 상수이므로 허용
        	}
        	
        	static class staticInner{
        		int iv = 200;
        		static int cv = 200; //static클래스만 static멤버를 정의할 수 있다.
        	}
        	void mymethod() {
        		class LocalInner{
        			int iv = 300;
        //			static int cv = 300; //에러, static변수를 선언할 수 없다
        			final static int CONST = 300; //final static은 상수이므로 허용
        			//final뒤에 static이 오는 경우는 어떤 조건에서도 같은 값일 경우. 
        			//객체마다 값이 다를수도 있으면 final만 쓰면됨(ex.카드의 숫자와 무늬)
        		}
        		int i = LocalInner.CONST; //지역내부클래스의 static상수는 메소드 내에서만 사용가능
        	}
        	public static void main(String[] args) {
        		System.out.println(InterfaceInner.CONST);
        		System.out.println(staticInner.cv);
        //		System.out.println(LocalInner.CONST); //지역내부클래스의 static상수는 메소드 외에서는 사용 불가능
        	}
        }
        ```
        
        ```java
        public class ex {
        
        	class InstanceInner{}
        	static class StaticInner{}
        	
        	InstanceInner iv = new InstanceInner(); //인스턴스 멤버끼리는 직접 접근가능
        	static StaticInner cv = new StaticInner(); //static멤버끼리는 직접 접근가능
        //	static StaticInner cv2 = new InstanceInner(); //static멤버가 instance멤버 접근 불가능. 반대는 가능
        
        	static void staticmethod() { //static멤버는 인스턴스에 직접접근불가
        //	InstanceInner obj1 = new InstanceInner();
        		StaticInner obj2 = new StaticInner();
        		
        		//이렇게까지 쓰지는 않는데 일단 예시로
        		ex outer = new ex(); //인스턴스 클래스는 외부클래스를 먼저 생성해야 생성가능
        		InstanceInner obj1 = outer.new InstanceInner();
        	}
        	void instanceMethod() {//인스턴스메소드에서는 인스턴스멤버와 static멤버 모두 접근가능
        		InstanceInner obj1 = new InstanceInner();
        		StaticInner obj2 = new StaticInner();
        //		LocalInner lv = new LocalInner(); //지역 내부클래스는 외부에서 접근 불가
        	}
        	void myMethod() {
        		class LocalInner{}
        		LocalInner lv = new LocalInner();
        	}
        	public static void main(String[] args) {
        	}
        }
        ```
        
        ```java
        class Outer{
        	private int outerIv= 0;
        	private static 	int outerCv=0;
        	
        	class InstanceInner{
        		int iiv = outerIv;//외부클래스의 private멤버도 접근가능
        		int iiv2 = outerCv; 
        	}
        	static class StaticInner{
        //		int siv = outerIv; //static클래스는 외부클래스의 인스턴스멤버에 접근 불가
        		static int scv = outerCv;
        	}
        	void mymethod() {
        		int lv = 0;
        		final int LV = 0;  //final생략 가능
        		
        //		lv=3;//밑에 int liv3 = lv;에러내려고 적음. 값이 바뀌었으니 변수로 처리해서 에러남
        		class LocalInner{ //지역내부클래스를 감싸고있는 메소드의 상수만 사용가능
        			int liv = outerIv;
        			int liv2 = outerCv;
        			//내부클래스의 객체가 지역변수보다 더 오래 존재가능 
        			//외부클래스의 지역변수는 final이 붙은 변수(상수)만 접근 가능
        			//JDK1.8부터는 변수인데 값이 안바뀌는 것도 상수로 간주. (에러x)
        			int liv3 = lv;
        			int liv4 = LV; 
        			
        			void method() {
        				System.out.println(lv);
        			}
        			
        		}
        	}
        }
        public class ex {
        	public static void main(String[] args) {
        	}
        }
        ```
        
- 인스턴스 내부클래스를 사용하려면 외부클래스의 객체를 먼저 만들고 인스턴스내부클래스의 객체를 만들어야 함
    
    ```java
    class Outer {
    	class instanceInner {
    		int iv =100;
    	}
    	static class StaticInner {
    		int iv = 200;
    		static int cv = 300;
    	}
    	void myMethod() {
    		class LocalInner{
    			int iv = 400;
    		}
    	}
    }
    public class ex {
    	public static void main(String[] args) {
    		Outer oc  = new Outer(); //외부클래스의 인스턴스를 먼저 생성해야 인스턴스클래스의
    		Outer.instanceInner ii = oc.new instanceInner(); //인스턴스를 생성가능
    		
    		System.out.println("ii.iv : "+ii.iv);
    		System.out.println("Outer.StaticInner.cv : "+Outer.StaticInner.cv);
    		
    		//스태틱 내부클래스의 인스턴스는 외부클래스를 먼저 생성하지않아도 된다
    		Outer.StaticInner si = new Outer.StaticInner();
    		System.out.println("ii.iv : "+si.iv);
    		
    	}
    }
    ```
    
    ```java
    class Outer {
    	int value = 10; //Outer.this.value 외부클래스의 iv
    	
    	class Inner{
    		int value = 20; //this.value 내부클래스의 iv
    		
    		void method() {
    			int value = 30;
    			System.out.println("           value : "+value);
    			System.out.println("      this.value : "+this.value);
    			System.out.println("Outer.this.value : "+Outer.this.value);
    			
    		}
    	}
    	
    }
    public class ex {
    	public static void main(String[] args) {
    		Outer outer = new Outer();
    		Outer.Inner inner = outer.new Inner();
    		inner.method();
    		
    	}
    }
    ```
    
- 익명클래스(anonymous class)
    
    : 이름이 없는 일회용 클래스. 정의와 생성을 동시에 함(조상이름을 대신 씀)  
    new 조상클래스 이름(){ 멤버선언 } / new 구현인터페이스이름() { 멤버선언 }  
    
    ```java
    public class ex {
    	Object iv = new Object() {void method2(){}}; //익명클래스
    	static Object cv = new Object() {void method2(){}}; //익명클래스
    	
    	void Mymethod() {
    		Object lv = new Object() { void method2() {}}; //익명클래스
    	}
    
    	public static void main(String[] args) {
    	}
    }
    ```
    
    ```java
    import java.awt.*;
    import java.awt.event.*;  //awt : 자바의 윈도우 프로그래밍 도구. 
    
    public class ex {
    	public static void main(String[] args) {
    		Button b = new Button("start");
    //		b.addActionListener(new EventHandler()); //객체생성
    		b.addActionListener(new AcionListener/*조상 OR 인스턴스 이름*/() { //클래스의 정의와 객체생성을 동시에
    			public void actionPerformed(ActionEvent e) {
    				System.out.println("ActionEvent occurred!!!");
    			}
    		}); //객체생성
    		
    		//위랑 같아보이지만 다른 클래스임. 일회용클래스이기때문.
    		b.addActionListener(new AcionListener/*조상 OR 인스턴스 이름*/() { //클래스의 정의와 객체생성을 동시에
    			public void actionPerformed(ActionEvent e) {
    				System.out.println("ActionEvent occurred!!!");
    			}
    		}); //객체생성
    		
    		}
    	}
    //class EventHandler implements AcionListener{ //클래스 정의. 
    //	public void actionPerformed(ActionEvent e) {
    //		System.out.println("ActionEvent occurred!!!");
    //	}
    //}
    ```
