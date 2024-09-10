---
생성일: 2022-10-06
최종 편집 일시: 2022-10-06
강사:
  - 권오흠
플랫폼: 인프런
last_modified_at: 2022-10-06
category: 알고리즘
tags:
  - 알고리즘
  - 권오흠알고리즘강좌
title: "[권오흠 영리한 프로그래밍을 위한 알고리즘 강좌] Recursion의 응용 - n queens problem"
---
### n queens problem

BackTracking 기법(되추적 기법)을 사용하여 문제풀이.

- 상태공간트리 : <mark class="hltr-cyan">찾는 해를 포함하는 트리</mark>. 즉, 해가 존재한다면 그것은 반드시 이 트리의 어떤 한 노드에 해당한다. 따라서 이 트리를 체계적으로 탐색하면 해를 구할 수 있다(모든 노드를 탐색 할 필요 없음)
- 되추적기법 : 상태공간 트리를 깊이 우선 방식으로 탐색 해 해를 찾는 방법

— Design Recursion

return type queens(agments) {

if non-promising report failure and return;

else if success report answer and return;

else visit children recursively;}

→ int []clos = new int[n+1];

boolean queens(int level){

if (!promising(level)) report failure and return;

else if(leve == n) report answer and return;

else for(int i=1;i<n;i++){

cols[i]=i;

if(queens(level+1) return true;}

return false;}

- Promising Test : 현재 level의 값이 4이면, 4개의 말이 이미 놓여져 있으며 놓여진 말들 간의 충돌이 없음이 보장 된 상태임. = 지금 놓을 말만 검사하면 됨
    
    → boolean promising(int level){
    
    for(int i=1;i<level);i++){
    
    if(cols[i] == cols[level]) return false;
    
    else if on the same diagonal return false;}
    
    return true;
    
    }
    
    → if on the same diagonal return? level - i == | cols[level] - cols[i] |
    

  

— 최종 코드

```java
package algorithm;

public class queens {
	static int n=8;
	static int cols[] = new int[n+1]; //전역변수(함수의 외부에서 선언된 변수). cols[1]=2 는 (1,2)을 뜻함. 
	
	static boolean queens(int level) {
		if(!promising(level)) return false; //꽝이면 밑까지 가볼필요없음
		else if(level==n) { //답일 경우
			for(int i=1;i<=n;i++) {
				System.out.println("("+i+", "+cols[i]+")");
			}
			return true;
		}
		//꽝도아니고 답도 아니라면 그 밑까지 가보고 답인지 판단함.
		for(int i=1;i<=n;i++) {
			cols[level+1]=i; //level+1번 말을 1~n번째 칸 중 어디에 놓을 것인지 결정.
			if(queens(level+1)) return true;
		}
		return false;
	}
	
	static boolean promising(int level) {
		for(int i=1;i<level;i++) {
			if(cols[i]==cols[level]) return false; //i행에 놓인 말과 level행에 놓인 말의 열이 같을 경우
			else if(level-i == Math.abs(cols[i]-cols[level])) return false; //i행에 놓은 말과 level행에 놓인 말이 같은 대각선상에 있을경우
		}
		return true;
	}

	public static void main(String[] args) {
		queens(0);

	}

}
```