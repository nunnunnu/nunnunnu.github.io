---
last_modified_at: 2022-07-30
date: 2022-07-30
수업: 자바의 정석
categories: JAVA
tags:
  - java
  - 자바의정석
---
- 조건문
    - if문
    
	![image](/assets/images/Untitled_104.png)
    - switch : 처리해야하는 경우의 수가 많을 때 씀(if-else if문보다 효율적) 
```java
    switch (조건식) {
    	case 값1 : 
    			//...
    			break;
    	case 값2 : 
    			//...
    			break;
    	//...
    	default :
    		//....조건식의 결과와 일치하는 case문이 없을떄
    		//....
    }
```


- 제약조건	
        - 조건식 결과가 정수 또는 문자열이여야함.
        - case문의 값은 정수 상수(문자포함), 문자열만 가능, 중복 금지
        
```java
        import java.util.*;
        public class ScanfEx1 {
        
        	public static void main(String[] args) {
        	
        	System.out.println("현재 월을 입력하세요");
        	
        	Scanner scanner = new Scanner(System.in);
        	int month = scanner.nextInt();
        	
        	switch (month) {
        		case 3: case 4: case 5:
        			System.out.println("현재 계절은 봄입니다.");
        			break; 
        		case 6: case 7:case 8:
        			System.out.println("현재 계절은 여름입니다.");
        			break;
        		case 9: case 10:
        			System.out.println("현재 계절은 가을입니다.");
        			break;
        		case 11: case 12: case 1: case 2:
        			System.out.println("현재 계절은 겨울입니다.");
        			break;
        		default :
        			System.out.println("잘못 입력했습니다.");
        		}
        	}
        }
```        


— Math.random() : 0.0과 1.0사이의 임의의 double값을 반환

0.0 * 3 ≤ Math.random() < 1.0*3

- ex)원하는 값 1~3

1. 각변에 3을 곱한다
    
    0.0 * 3 ≤ Math.random() * 3 < 1.0 * 3
    
2. 각 변을 int형으로 변환한다
    
    (int)0.0 * 3 ≤ (int)(Math.random() * 3) < (int)1.0 * 3
    
    0 ≤ Math.random() * 3 < 3
    
3. 각 변에 1을 더한다
    
    0 + 1 ≤ (Math.random() * 3) +1 < 3 + 1
    
    1 ≤ (Math.random() * 3) +1 < 4
    
```java
    public class ex4_7 {
    	public static void main(String[] args) {
    		int num=0;
    		//1~10사이의 난수를 20개 출력할 것.
    		for(int i=0;i<=20;i++) {
    			System.out.println((int)(Math.random()*10)+1);
    		}
    		System.out.println("===============");
    
    			//-5~5사이의 난수를 20개 출력할 것.
    		for(int j=0;j<=20;j++) {
    			System.out.println((int)(Math.random()*11)-5); //0도 포함이라 값이 11개임
    		}
    	}
    }
```
    

- 반복문
	- for

```java
    public class ex4_8 {
    
    	public static void main(String[] args) {
    		for(int i=1, j=10;i<=10;i++,j--) {
    			System.out.println("i="+i+", j="+j);
    	}
    	
    	//구구단
    	for(int j = 2;j<=9;j++){
    		System.out.println(j+"단 시작!!!");
    		for(int k=1;k<=9;k++) {
    			System.out.println(j+" * " +k+" = "+j*k);
    			if(k==9)
    			System.out.println("===="+j+"단 종료====\n");
    		}
    	}
    	//별 찍기
    		for(int n=1;n<10;n++) {
    			for(int x=1;x<n;x++) {
    				System.out.print("★");
    			}
    			System.out.println();
    		}
     	}
    }
```

- while - 조건식을 만족시키는 동안 블럭을 반복. do while문을 사용.

```java
    public class ex4_13 {
    
    	public static void main(String[] args) {
    		int sum=0;
    		int i=0;
    		
    		while (sum<=100) {
    			System.out.printf("%d : %d%n",i,sum);
    			sum += ++i;
    		}
    	}
    
    }
```
    
```java
    import java.util.*;
    
    public class Ex4_14 {
    
    	public static void main(String[] args) {
    		int num=0, sum = 0;
    		System.out.println("숫자를 입력하세요.");
    		
    		Scanner scanner = new Scanner(System.in);
    		String tmp = scanner.nextLine();
    		num = Integer.parseInt(tmp);
    		
    		while (num != 0) {
    			sum += num%10;
    			System.out.printf("sum = %d num = %d%n",sum,num);
    			
    			num /= 10;
    		}
    		System.out.println("각 자리수의 합 : "+sum);
    		
    		int sum2 = 0;
    		for(num = Integer.parseInt(tmp);num>0;num = num / 10)
    		{
    			sum2 += num%10;
    			System.out.printf("sum = %d num = %d%n",sum2,num);
    		}
    		System.out.println("각 자리수의 합 : "+sum2);
    	}
    
    }
```
    
- do while : 반복횟수를 알거나 코드가 중복이면 do while문을 사용  
	do{조건식이 참일 때 수행 될 문장. 처음 한번든 무조건 실행}  
	while(조건식);  
        
    
```java
    import java.util.*;
    
    public class ex4_15 {
    
    	public static void main(String[] args) {
    		int input = 0 , answer = 0;
    		
    		answer = (int)(Math.random()*100)+1;
    		Scanner scanner = new Scanner(System.in);
    		
    		do {
    			System.out.println("1과 100사이의 정수를 입력하세요.>>");
    			input = scanner.nextInt();
    			
    			if (input > answer) {
    				System.out.println("더 작은 수로 다시 시도하세요.");
    			}
    			else if (input < answer) {
    				System.out.println("더 큰 수로 다시 시도하세요.");
    			}
    		} while (input != answer);
    			System.out.println("정답입니다!");
    		}
    	}
```
    
```java
    public class ex4_16 {
    
    	public static void main(String[] args) {
    		int i = 0, sum = 0;
    		
    		do {
    			++i;
    			sum += i;
    		} while(sum<100);
    		System.out.println("i="+i);
    		System.out.println("sum="+sum);
    	}
    
    }
```
    
```java
    public class ex4_16 {
    
    	public static void main(String[] args) {
    		int i = 0, sum = 0;
    		
    		while (true) {
    			if(sum>100)
    				break;
    			++i;
    			sum += i;
    		}
    		System.out.println("i="+i);
    		System.out.println("sum="+sum);
    	}
    
    }
```
    
- continue : 조건이 충족된다면 블록의 끝으로 이동, 다시 반복문 수행.

```java
public class ex4_17 {

	public static void main(String[] args) {
		for(int i=0;i<=10;i++) {
			if(i%2==0)
				continue;
			System.out.println(i);
		}
	}

}
```

- 이름붙은 반복문 : 반복문에 이름을 붙여서 break앞에 적어주면 하나이상의 반복문을 벗어날 수 있다

```java
Loop1 : for( ......
	for( ...........
				break Loop1;
```

```java
import java.util.*;

public class ex4_18 {

	public static void main(String[] args) {
		int menu = 0;
		int num = 0;
		
		Scanner scanner = new Scanner(System.in);
		
		outer : while (true) {
			System.out.println("(1) square");
			System.out.println("(2) square root");
			System.out.println("(3) log");
			System.out.println("원하는 메뉴를 입력하세요. (종료 : 0)");
			
			String tmp = scanner.nextLine();
			menu = Integer.parseInt(tmp);
			
			if(menu == 0) {
				System.out.println("프로그램을 종료합니다.");
				break;
			}
			else if (!(menu>=1 && menu<=3)) {
				System.out.println("메뉴를 잘못 선택하셨습니다. (종료는 0)");
				continue;
			}
			System.out.println("선택하신 메뉴는 "+menu+"번입니다.");
			
			for(;;) {
				System.out.println("계산할 값을 입력하세요.(계산종료 : 0, 전체종료 : 99)>>");
				tmp = scanner.nextLine();
				num = Integer.parseInt(tmp);
				
				if(num==0)
					break;
				if(num==99)
					break outer;
				
				switch(menu) {
					case 1:
						System.out.println("result="+num*num);
						break;
					case 2:
						System.out.println("result="+Math.sqrt(num)); //제곱근
						break;
					case 3:
						System.out.println("result="+Math.log(num)); //로그
						break;
				}
			}
		}
	}

}
```