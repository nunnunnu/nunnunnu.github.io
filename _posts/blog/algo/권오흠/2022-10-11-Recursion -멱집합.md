---
생성일: 2022-10-11
최종 편집 일시: Invalid date
강사:
  - 권오흠
플랫폼: 인프런
title: "[권오흠 영리한 프로그래밍을 위한 알고리즘 강좌] Recursion의 응용 - 멱집합"
category: 알고리즘
tags:
  - 알고리즘
  - 권오흠알고리즘강좌
---
### 멱집합

: 모든 집합의 부분집합으로 이루어진 집합

- n개의 집합의 모든 부분 집합의 개수 : 2의 n승개

⭐ {a,b,c,d,e,f}의 부분집합

1. a를 제외한 {b,c,d,e,f}의 모든 부분집합 나열
2. {b,c,d,e,f}의 모든 부분 집합에 {a}를 추가한 집합들을 나열 : {c,d,e,f)의 모든 부분집합에 {a}를 추가한 집합을 나열한 후에 {c,d,e,f}의 모든 부분집합에 {a,b}를 추가한 집합을 나열함…..  
    - 여기서 {c,d,e,f}가 집합 S(K~마지막, 연속적임), {a,b}가 집합 P(처음~K-1번째, 원소 중 일부)  
    

— Design Recursion

powerSet(s) if s is an empty printing nothing; else let t be the first element of s;

<mark class="hltr-cyan">find all subsets of s-{t} by calling powerSet(s-{t})</mark>; print the subsets;

print the subsets with adding t;

→ 위대로 하면 멱집합을 return하는 코드(메모리에 저장하는 코드)가 됨, 출력하는 코드가 필요함(성능상 효율적)

그러나 출력한다면 print the subsets with adding t; 가 작동하지 않음. ==powerSet(s-{t})==를 return해주지 않기 때문임

⇒ powerSet(P, S) if s is an empty set print P. else let t be the first elements of S; powerSet(P, S-{t}); power{PU{t}, S-{t});

  

집합 S : data[k]~data[n-1]

집합 P : i=0~k-1, includ[i] = true

  

최종 코드