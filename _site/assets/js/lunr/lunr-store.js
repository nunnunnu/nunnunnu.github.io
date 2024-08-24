var store = [{
        "title": "자바의 정석 강의 - 자바 시작하기 전",
        "excerpt":"자바 : 프로그래밍 언어. 컴퓨터 프로그램(애플리케이션)을 만드는데 사용 실행환경(JRE) + 개발도구(JDK) + 라이브러리(API) 라이브러리 : 프로그램을 만드는데 필요한 기능들을 미리 만들어놓은 것. ⇒ 쉽고 빠른 개발 가능 pc애플리케이션, 웹 애플리케이션, 모바일 애플리케이션(안드로이드), 빅 데이터, 게임(ex.마크), 과학, 소형기기 등 에 활용 가능 모던 프로그래밍 언어(객체지향 + 함수형) 특징 배우기쉬운 객체지향언어(프로그래밍언어+객체지향개념[c++,java,python]) 자동...","categories": ["JAVA"],
        "tags": ["java","자바의정석"],
        "url": "/java/%EC%9E%90%EB%B0%94-%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-%EC%A0%84/",
        "teaser": null
      },{
        "title": "자바의 정석 강의 - 변수(Variable)",
        "excerpt":"system.out.println(); 에서 print==ln==이 \\n이거라서 따로 \\n안해줘도 지금까지 줄바꿈이 됐던거임..! 충격! pintf도 있다..! public class Ex2_1 { public static void main(String[] args) { System.out.printf(\"hello\"); System.out.printf(\"hello\"); System.out.printf(\"hello\"); } } 이거는 줄바꿈 안되고 hellohellohello로 실행됨. print로 바꿔도 마찬가지 변수(variable) : 하나의 값을 저장할 수 있는 메모리 공간(RAM). 변경가능 — 변수 선언 이유 :...","categories": ["JAVA"],
        "tags": ["java","자바의정석"],
        "url": "/java/%EB%B3%80%EC%88%98(Variable)/",
        "teaser": null
      },{
        "title": "연산자(Operator)",
        "excerpt":"연산자 : 연산을 수행하는 기호 (+,-,*,/) 피연산자 : 연산자의 수행 대상(x+3에서 x와 3)       종류 연산자 설명 산술 연산자 + - * / % ==« »== 사칙연산과 나머지 연산 비교 연산자 &lt; &gt; ≥ ≤ == != 크고 작음과 같고 다름을 비교 논리 연산자 &amp;&amp; | !(not) and와 or으로...","categories": ["JAVA"],
        "tags": ["java","자바의정석"],
        "url": "/java/%EC%97%B0%EC%82%B0%EC%9E%90(Operator)/",
        "teaser": null
      },{
        "title": "제어문 (flow control statemt)",
        "excerpt":"조건문 if문 switch : 처리해야하는 경우의 수가 많을 때 씀(if-else if문보다 효율적) switch (조건식) { case 값1 : //... break; case 값2 : //... break; //... default : //....조건식의 결과와 일치하는 case문이 없을떄 //.... } 제약조건 - 조건식 결과가 정수 또는 문자열이여야함. - case문의 값은 정수 상수(문자포함), 문자열만 가능, 중복...","categories": ["JAVA"],
        "tags": ["java","자바의정석"],
        "url": "/java/%EC%A0%9C%EC%96%B4%EB%AC%B8-(flow-control-statemt)/",
        "teaser": null
      },{
        "title": "배열",
        "excerpt":"배열 : 같은 타입의 변수를 하나의 묶음으로 다루는 것. 선언 : 배열을 다루기 위한 참조변수의 선언 int[] score; / String[] name; - 자바스타일 int score[]; / String name[]; - c언어 스타일 둘다 가능은 함. 편한걸로 쓸것. int[] score; score = new int [5]; 배열은 한번 생성하면 실행하는 동안 그 길이를...","categories": ["JAVA"],
        "tags": ["java","자바의정석"],
        "url": "/java/%EB%B0%B0%EC%97%B4/",
        "teaser": null
      },{
        "title": "객체지향(oop)",
        "excerpt":"객체지향 언어 = 프로그래밍 언어 + 객체지향개점(규칙) 캡슐화 상속 추상화 다형성 class : 객체를 정의해 놓은 것, 객체를 생성하는데 사용함. (설계도) = 데이터 + 함수(method) (서로 관련있는 것 끼리 묶음. 데이터만 묶으면 구조체) 기본적으로 하나의 소스파일에 하나의 class를 작성하는것이 바람직하나, 여러 class를 작성할수도 있음. public class가 있는 경우, 소스파일의 이름은...","categories": ["JAVA"],
        "tags": ["java","자바의정석"],
        "url": "/java/%EA%B0%9D%EC%B2%B4%EC%A7%80%ED%96%A5(OOP)/",
        "teaser": null
      },{
        "title": "상속 (ingeritance)",
        "excerpt":"상속 ~는 ~이다 (is - a) - ex.원(circle)은 점(point)다. (x) class 자식클래스 extends 부모클래스 기존의 클래스로 새로운 클래스를 작성(코드 재사용) 두 클래스를 부모와 자식 관계로 이어줌 자손은 조상의 모든 멤버를 상속받는다 (생성자, 초기화 블럭 제외 (자식클래스에 멤버가 안적혀있어도 있는거임) 자손의 멤버 개수가 조상보다 적을 수는 없음.(같거나 많다.) 자손의 변경은 조상에게...","categories": ["JAVA"],
        "tags": ["java","자바의정석"],
        "url": "/java/%EC%83%81%EC%86%8D-(Ingeritance)/",
        "teaser": null
      },{
        "title": "예외처리",
        "excerpt":"프로그램 오류 system.out.println(args[0]); //컴파일 에러 System.out.println(args[0]); //런타임 에러 : 실행중 발생하는 에러. 매개변수로 받은 값이 없는데 실행해서 생김 논리적에러(logical error) : 작성 의도와 다르게 동작 컴파일러에러(compile-time error) : 컴파일 할 때 발생하는 에러번호 컴파일러 구문체크 번역 최적화 (ex. int i = 3+5를 8로 변경) 런타임에러(runtime error) : 실행할 때 발생하는...","categories": ["JAVA"],
        "tags": ["java","자바의정석"],
        "url": "/java/%EC%98%88%EC%99%B8%EC%B2%98%EB%A6%AC/",
        "teaser": null
      },{
        "title": "java.lang 패키지와 유용한 클래스",
        "excerpt":"Object 클래스 : 모든 클래스의 최고 조상. 오직 11개의 메소드만을 가지고 있다. nitity(), wait() 등은 쓰레드(13장)와 관련된 메소드이다 Object클래스의 메소드 설명 protected Object clone() 객체 자신의 복사본을 반환 public boolean equals(Object obj) 객체 자신과 객체 obj가 같은 객체인지 알려준다(같으면 true) protected public void finalize() 객체가 소멸될 때 가비지 컬렉터에 의해...","categories": ["JAVA"],
        "tags": ["java","자바의정석"],
        "url": "/java/java.lang%ED%8C%A8%ED%82%A4%EC%A7%80%EC%99%80_%EC%9C%A0%EC%9A%A9%ED%95%9C_%ED%81%B4%EB%9E%98%EC%8A%A4/",
        "teaser": null
      },{
        "title": "날짜와 시간 & 형식화",
        "excerpt":"날짜와 시간 java.util.Date : 날짜와 시간을 다룰 목적으로 만들어진 클래스(JDK1.0) date의 메소드는 거의 사용되지 않지만(deprecated), 여전히 쓰이고 잇다. java.util.Calendar :Date클래스를 개선한 새로운 클래스(JDK1.1), 여전히 단점이 있다 (실무에는 아직 쓰이는 곳이 많음 날짜와 시간을 같이 다루는 것이 단점 java.time 패키지 : Date와 Calendar의 단점을 개선한 새로운 클래스들을 제공(JDK1.8=JDK8) 날짜와 시간의 클래스를...","categories": ["JAVA"],
        "tags": ["java","자바의정석"],
        "url": "/java/%EB%82%A0%EC%A7%9C%EC%99%80-%EC%8B%9C%EA%B0%84-&-%ED%98%95%EC%8B%9D%ED%99%94/",
        "teaser": null
      }]
