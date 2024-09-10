---
생성일: 2022-09-29
last_modified_at: 2022-09-29
강사:
  - 권오흠
플랫폼: 인프런
title: "[권오흠 영리한 프로그래밍을 위한 알고리즘 강좌] Recursion의 기본 개념과 기본 예제"
category: 알고리즘
tags:
  - 알고리즘
  - 권오흠알고리즘강좌
---
## Recursion(순환, 재귀함수)

자기 자신을 호출하는 함수(메소드)

단순하고 알기 쉬우나, <mark class="hltr-cyan">오버해드(매개변수 전달, 엑티베이션 프레임 생성)</mark>가 있음

ex)

```java
void func(...){
	System.out.println("hello");
	func(...);
}
```

❗항상 무한 루프에 빠지는 것은 아님

ex)

```java
public static void main(String[] args){
	func(4);
	}
public static void func(int k){
	if(k<=0) return;
	else {
		System.out.println("hello");
		func(k-1);
	}
```

- Base case : 적어도 하나의 recursion에 빠지지 않는 경우가 존재해야 함
- Recursion case : recursion을 반복하다 보면 결국 base case로 수렴해야 함. (위의 예시에서 func(k+1)을 사용하면 에러남)

```java
class Main {
	public static void main(String[] args) {
		int result = func(4);
		System.out.println(result); //10출력. 4+3+2+1+0
	}
	public static int func(int n) {
		if(n<=0)
			return 0;
		else 
			return n+func(n-1);
	}
}
```

- 팩토리얼 사용 예시

```java
class Main {
	public static void main(String[] args) {
		int result = factorial(4);
		System.out.println(result); //24출력. 4*3*2*1*1=24
	}
	public static int factorial(int n) {
		if(n==0)
			return 1; //0!은 1이기 때문
		else 
			return n*factorial(n-1);
	}
}
```

- x의 n승 예시

```java
class Main {
	public static void main(String[] args) {
		double result = power(4,3);
		System.out.println(result); //64.0출력, 54+16+4=64
	}
	public static double power(double x,int n) {
		if(n==0)
			return 1; 
		else 
			return x*power(x,n-1);
	}
}
```

- 피보나치 수열 예시

```java
class Main {
	public static void main(String[] args) {
		System.out.println(fibonacci(4)); //5출력. 피보나치수열 4번째 자리가 5임
	}
	public static double fibonacci(int n) {
		if(n<2)
			return 1; 
		else 
			return fibonacci(n-1) + fibonacci(n-2);
	}
}
```

- 최대 공약수 예시

```java
class Main {
	public static void main(String[] args) {
		int result = gcd(30,20);
		System.out.println(result); //10출력
	}
//	public static int gcd(int m, int n) {
//		if(m<n) {
//			int tmp=m; m=n; n=tmp; //m과 n값 교환
//		}
//		if(m%n==0)
//			return n;
//		else return gcd(n, m%n);
	//단순한 버전
	public static int gcd(int p, int q) {
		if(q==0)
			return p;
		else return gcd(q,p%q);
	}
}
```

수학함수 외에도 다른 문제들도 해결할 수 있다.

### Recursive thinking

순환적으로 사고하기.

1. 문자열 길이 계산하기 : 첫번째 문자를 제외한 문자열 길이+1 
    
    ```java
    import java.util.*;
    
    public class Main {
    	public static int length(String str) {
    		if(str.equals("")) return 0;
    		else return 1+length(str.substring(1));
    	}
    
    	public static void main(String[] args) {
    		System.out.println(length("abcd"));
    		}
    	}
    ```
    
2. 문자열 출력하기
    
    ```java
    import java.util.*;
    
    public class Main {
    	public static void printChars(String str) {
    		if(str.length()==0) return ;
    		else {
    			System.out.print(str.charAt(0));
    			printChars(str.substring(1));
    		}
    	}
    
    	public static void main(String[] args) {
    		printChars("abcd");
    	}
    }
    ```
    
3. 문자열 뒤집기
    
    ```java
    import java.util.*;
    
    public class Main {
    	public static void printCharsReverse(String str) {
    		if(str.length()==0) return ;
    		else {
    			printCharsReverse(str.substring(1));
    			System.out.print(str.charAt(0));
    		}
    	}
    
    	public static void main(String[] args) {
    		printCharsReverse("abcd");
    	}
    }
    ```
    
4. 2진수로 변환하기
    
    ```java
    import java.util.*;
    
    public class Main {
    	public static void printBinary(int n) {
    		if(n<2) System.out.print(n);
    		else {
    			printBinary(n/2); 
    			System.out.print(n%2);
    		}
    	}
    
    	public static void main(String[] args) {
    		printBinary(10);
    		printBinary(12);
    	}
    }
    ```
    
5. 배열 합 구하기
    
    ```java
    import java.util.*;
    
    import javax.xml.crypto.Data;
    
    public class Main {
    	static int data[] = {1,2,3,4,5,6,7,8,9,10};
    	public static int sum(int n, int data[]) {
    		if(n<=0) return 0;
    		else return sum(n-1,data) + data[n-1];
    	}
    
    	public static void main(String[] args) {
    		System.out.println(sum(10,data));
    	}
    }
    ```
    
6. 데이터 파일로부터 n개의 정수 읽어오기
    
    ```java
    import java.util.*;
    
    import javax.xml.crypto.Data;
    
    public class Main {
    	static int data[] = new int[10];
    	static Scanner in  = new Scanner(System.in);
    	public static void readFrom(int n, int data[], Scanner in) {
    		if(n==0) return;
    		else {
    			readFrom(n-1,data,in);
    			data[n-1]=in.nextInt();
    		}
    	}
    
    	public static void main(String[] args) {
    		readFrom(10,data,in);
    		System.out.println(Arrays.toString(data));
    	}
    }
    ```
    

⭐모든 순환 함수는 반복문(iteration)으로 변경 가능하며 그 반대도 가능함

### Designing Recursion

순환 알고리즘의 설계

암시적(implicit) 매개변수를 **<mark class="hltr-cyan">명시적(explicit) 매개변수</mark>**로 바꾸어라

- 순차탐색
    - 암시적 매개변수ver
        
        ```java
        import java.util.*;
        
        public class Main {
        
        	public static int search(int data[], int n, int target) {
        		for(int i=0;i<n;i++) {
        			if(data[i]==target) return i;
        		}
        		return -1; // 값이 없으면 -1을 반환함
        	}
        	
        	public static void main(String[] args) {
        		int data[] = {1,2,3,4,5};
        		System.out.println(search(data,4,3));
        	}
        }
        ```
        
    - 명시적 매개변수ver(시작점, 끝점의 위치가 명시적임)
        
        ```java
        import java.util.*;
        
        public class Main {
        
        	public static int search(int data[], int begin, int end, int target) {
        		if(begin>end) return -1;
        		else if(target==data[begin]) return begin;
        		else return search(data, begin+1,end,target);
        	}
        	
        	public static void main(String[] args) {
        		int data[] = {1,2,3,4,5};
        		System.out.println(search(data,1,4,2));
        	}
        }
        ```
        
        ```java
        import java.util.*;
        
        public class Main {
        
        	public static int search(int data[], int begin, int end, int target) {
        		if(begin>end) return -1;
        		else if(target==data[begin]) return begin;
        		else return search(data, begin,end-1,target);
        	}
        	
        	public static void main(String[] args) {
        		int data[] = {1,2,3,4,5};
        		System.out.println(search(data,1,4,2));
        	}
        }
        ```
        
        ```java
        import java.util.*;
        
        public class Main {
        
        	public static int search(int data[], int begin, int end, int target) {
        		if(begin>end) return -1;
        		else {
        			int middle = (begin+end)/2;
        			if(data[middle] == target) return middle;
        			int index=search(data,begin,middle-1,target);
        			if(index!=-1) return index; //찾았을경우
        			else return search(data,middle+1,end,target);
        		}
        	}
        	
        	public static void main(String[] args) {
        		int data[] = {1,2,3,4,5};
        		System.out.println(search(data,0,4,2));
        	}
        }
        ```
        
- 최대값 찾기
    
    ```java
    import java.util.*;
    
    public class Main {
    
    	public static int findmax(int data[], int begin, int end) {
    		if(begin==end) return data[begin];
    		else return Math.max(data[begin], findmax(data,begin+1,end));
    	}
    	
    	public static void main(String[] args) {
    		int data[] = {1,6,4,5,7};
    		System.out.println(findmax(data,0,4));
    	}
    }
    ```
    
    ```java
    import java.util.*;
    
    public class Main {
    
    	public static int findmax(int data[], int begin, int end) {
    		if(begin==end) 
    			return data[begin];
    		else {
    			int middle = (begin+end)/2;
    			int max1=findmax(data,begin,middle);
    			int max2=findmax(data,middle+1,end);
    			return Math.max(max1, max2);
    		}
    	}
    	
    	public static void main(String[] args) {
    		int data[] = {1,6,4,5,7};
    		System.out.println(findmax(data,0,4));
    	}
    }
    ```
    
- 2진 검색

```java
import java.util.*;

public class Main {

	public static int binarySearch(String items[], String target, int begin, int end) {
		if(begin>end) return -1;
		else {
			int middle = (begin+end)/2;
			int compResult = target.compareTo(items[middle]); //맨 중간값을 비교
			if(compResult==0) return middle; 
			else if(compResult<0) return binarySearch(items, target,begin,middle-1); //중간 값이 target보다 작을 경우, 앞쪽에서 찾기
			else return binarySearch(items, target,middle+1,end);//중간값이 target보다 클 경우, 뒤쪽에서 찾기
		}
	}
	
	public static void main(String[] args) {
		String data[] = {"aaa","bbb","ccc","ddd","eee"};
		System.out.println(binarySearch(data,"ccc",0,data.length));
	}
}
```
