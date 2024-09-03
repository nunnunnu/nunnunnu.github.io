---
날짜: 2022-08-21
생성 일시: 2022-08-21
수업: 자바의 정석
last_modified_at: 2022-08-26
category: JAVA
tags:
  - java
  - 자바의정석
  - collection
title: 자바의 정석 강의 - 컬렉션 프레임웍(collections framework)
---
## 컬렉션 프레임웍(collections framework)

- 컬렉션(collection)
    
    : 여러 객체(데이터)를 모아놓은 것
    
- 프레임웍(framework)
    
    : 표준화, 정형화된 체계적인 프로그램 방식 (Spring)
    
- 컬렉션 프레임웍(collections framework)
    
    : 컬렉션(다수의 객체)를 다루기 위한 표준화된 프로그래밍 방식
    
    컬랙션을 쉽고 편리하게 다룰 수 있는 다양한 클래스 제공(객체 저장, 삭제, 검색, 정렬 등)
    
    java.util 패키지에 포함. JDK1.2부터 제공(그전엔 표준화가 안됨)
    
- 컬렉션 클래스(collections class)
    
    : 다수의 데이터를 저장할 수 있는 클래스(ex. Vector, ArrayList, HashSet)
    

❗❗**컬렉션 크레임웍의 핵심 인터페이스**

![images](/assets/images/java/IMG-20240902113145.png)
![images](assets/images/java/IMG-20240902113145.png)

Map구현 클래스 이름에 Map이 없는 것은 표준화되기 전 옛날에 생긴 것

— List와 Set의 공통부분 만 모아서 Collection이라는 인터페이스를 정의함. Map은 성격이 달라서 공통부분이 없음

- Collection인터페이스의 메소드 - 순서ox,중복ox(상관없음)

![images](assets/images/java/IMG-20240902113145-1.png)

- List인터페이스 - (저장)순서o, 중복o
    
    - ArrayList (배열기반):
        - 기존의 Vector를 개선한 것으로 구현원리와 기능적으로 동일  
            (Vector써도 되지만[동기화o] 가능하면 ArrayList[동기화x]쓸것.)  
            
        - List인터페이스를 구현하므로, 저장순서가 유지되고 중복을 허용
        - 데이터의 저장공간으로 배열을 사용(배열기반)
        - ArrayList의 메소드
            
            - 생성자
                - ArrayList() - 기본생성자
                - ArrayList(Collection) - 컬렉션들 끼리 변환할때 많이 씀
                - ArrayList(int initialCapacity) - 배열의 길이를 지정해주어야함(원래 배열은 길이를 조절못해서. 만들때 넉넉하게 만드는게 좋음)
            - 추가
                - boolean add(Object o) - 객체 추가. 성공하면 true, 실패하면 false
                - void add(int index, Object element) - 저장위치 지정(안하면 맨 뒤에 저장됨)
                - boolean addAll(Collection c) - 컬렉션이 가진 요소를 그대로 저장
                - boolean addAll(int index, Collection c) - 컬렉션의 저장위치지정
            - 삭제
                - boolean remove(Object o) - 삭제
                - Object remove(int index) - 특정위치 객체 삭제
                - boolean removeAll(Collection c) - 컬렉션에 있는 객체 삭제
                - void clear() - Array의 모든 객체 삭제
            - 검색
                - int indexOf(Object o) - 객체가 몇번째에 저장됐는지(못찾으면 -1)
                - int lastIndexOf(Object o) - 끝에서 부터 객체를 찾음
                - boolean contains(Object o) - 객체가 있는지(있으면 true, 없으면 false)
                - Object get(int index) - 객체 읽기
                - Object set(int index, Object element) - 특정 위치 객체를 다른 걸로 변경
            - 기타
                
                - List subList(int fromIndex, int toIndex) -from부터 to까지 객체를 뽑아서 새로운 List를 만듦
                - Object[] toArray() - ArrayList의 객체배열을 반환
                - Object[] toArray(Object[] a)
                - boolean isEmpty() - ArrayList가 비어있는지 확인
                - void trimToSize() - 빈공간 제거
                - int size() - 저장된 객체의 갯수
                
                ```java
                import java.util.*;
                
                public class  Main {
                	public static void main(String[] args) {
                		//기본길이(용량, capacity)가 10인 ArrayList를 생성
                		ArrayList list1 = new ArrayList(10);
                //		list1.add(new Integer(5));
                //		list1.add(new Integer(4));
                //		list1.add(new Integer(2));
                //		list1.add(new Integer(0));
                //		list1.add(new Integer(1));
                //		list1.add(new Integer(3));
                		//ArrayList는 객체만 저장되나 autoboxing에 의해 기본형이 참조형으로 자동변환되서 밑처럼 써도 됨
                		list1.add(5);
                		list1.add(4);
                		list1.add(2);
                		list1.add(0);
                		list1.add(1);
                		list1.add(3);
                		
                		//ArrayList(Collection c)
                //		List sub = list1.subList(1, 4);
                //		ArrayList list2 = new ArrayList(sub);
                		ArrayList list2 = new ArrayList(list1.subList(1, 4));
                		
                		print(list1, list2);
                		
                		//Collection은 인터페이스, Collections는 유틸클래스
                		Collections.sort(list1); //list1과 list2를 정렬한다
                		Collections.sort(list2); //Collections.sort(list1)
                		print(list1, list2);
                		
                		//list1이 list2의 모든 요소를 포함하고 있는가?
                		System.out.println("list1.conrainsAll(list2) : "+list1.containsAll(list2));
                		
                		list2.add("B");
                		list2.add("C");
                		list2.add(3,"A"); //기존 값은 삭제되니 신중히
                		print(list1, list2);
                		
                		list2.set(3, "AA");
                		print(list1, list2);
                		
                		list1.add(0,"1");
                		//list1에서 "1"이 어느 위치에 있는지 출력 
                		System.out.println("\"1\"의 index = "+list1.indexOf("1")); //0
                		System.out.println("1의 index = "+list1.indexOf(1)); //2
                		print(list1,list2);
                		list1.remove(0); //list1[0]자리의 값을 0으로(String이라)
                		print(list1, list2);
                		list1.remove(5); //list1[5]를 삭제
                		print(list1, list2);
                		
                		list1.remove(new Integer(1)); //값이 1인 것을 삭제
                		print(list1, list2);
                		
                		// list1에서 list2와 겹치는 부분만 남기고 나머지는 삭제
                		System.out.println("list1.retainAll(list2) : "+list1.retainAll(list2));
                		print(list1, list2);
                		
                		//list2에서 list1에 포함된 객체들을 삭제
                		for(int i = list2.size()-1;i>=0;i--) {
                			if(list1.contains(list2.get(i)))
                					list2.remove(i);
                		}
                		print(list1, list2);
                	}
                
                	private static void print(ArrayList list1, ArrayList list2) {
                		System.out.println("list1:"+list1);
                		System.out.println("list2:"+list2);
                		System.out.println();
                	}
                }
                ```
                
            
            - ArrayList에 저장된 객체의 삭제 과정
                
                1. 삭제할 데이터 아래의 데이터를 한 칸씩 위로 복사해서 삭제할 데이터 덮어쓰기(부담 많이감.)  
                    System.arraycopy(data, 3, data, 2, 2)  
                    data[3]에서 data[2]로 2개의 데이터를 복사함  
                    
                2. 데이터가 모두 한 칸씩 이동했으므로 마지막 데이터는 null로 변경  
                    data[size-1]=null;  
                    
                3. 데이터가 삭제되어 데이터의 개수가 줄었으므로 size의 값을 감소시킨다  
                    size--;  
                    
                4. 마지막데이터를 삭제하는 경우 1번은 안해도됨.
                
                — for문으로 모든 객체 지우기
                
                for(int i =list.size()-1;i>=0;i--) { list.remove(i); }  
                이렇게안하면 배열이 자꾸 위로 올라가서 다 안지워짐  
                
    - LinkedList : 배열의 단점을 보완 (연결기반)
        
        - 배열의 장단점
            - 배열의 장점 : 구조가 간단, 데이터를 읽는데 걸리는 시간이(접근시간, access time) 짧음
            - 배열의 단점
                - 크기 변경x : 변경 시 새로운 배열을 생성한 후 데이터를 복사해야함. 미리 넉넉하게 배열크기를 지정하면 메모리가 낭비됨
                    1. 더 큰 배열 생성
                    2. 복사
                    3. 참조 변경
                - 비순차적인 데이터의 추가, 삭제에 시간이 많이 걸림  
                    → 데이터를 추가하거나 삭제하기 위해, 다른 데이터를 옮겨야 함.  
                    그러나 순차적인 데이터 추가(끝에 추가)와 삭제(끝부터 삭제)는 빠름  
                    
            
        
        - 배열과 달리 LinkedList는 불연속적으로 존재하는 데이터를 연결
        - 데이터의 삭제 : 단 한번의 참조 변경만으로 가능
        - 데이터 추가 : 한번의 Node객체 생성과 두번의 참조 변경만으로 가능
        - 단점
            
            - 접근성이 나쁨. (불연속적이라서)  
                첫번째 배열에서 마지막 배열까지 가려면 모든 배열을 거쳐서 가야함  
                
            
            ⇒ 서큘러 링크드 리스트(이중 원형리스트, doubly circular linked list)[첫번째애서 마지막으로 이동이 편리) , 이중연결리스트(doubly linked list)[앞뒤 이동만 편해짐]로 , 접근성 향상
            
    
    > [!important]  
    > ArrayList vs Linked List데이터를 순차적 추가/삭제 - ArrayList데이터를 비순차적으로 추가/삭제 - LinkedList접근시간(access time) - ArrayList⇒ 읽기는 ArrayList, 추가/삭제는 LinkedList가 빠르다  
    

![images](assets/images/java/IMG-20240902113145-2.png)

Collection인터페이스의 메소드는 제외됨(자손이라 쓸 수 있음)

- Set인터페이스 - 순서x, 중복x (집합)
    - **HashSet** : Set인터페이스를 구현한 대표적인 컬렉션 클래스. 순서를 유지하려면 LInkedHashSet을 사용 (중복 방지를 위해 객체 저장 전에 기존에 같은 객체가 있는지 확인함)
        
        - 생성자
            - HashSet()
            - HashSet(Collection c) : 지정된 컬렉션에 모든 객체 저장
            - HashSet(int initialCapacity) : 초기용량 지정(보통 2배)
            - HashSet(int initialCapacity, float loadFactor) : 언제 용량을 늘릴건지(보통2배)
        - 추가/삭제
            - boolean add(Object o) : 추가 - 중복 확인을 위해 저장할 객체의 equals()와 hashCode()를 호출, equals()와 hashCode()가 오버라이딩 되어있어야함(equals()만 해도되나 hashCode()까지 오버라이딩 해주는 것이 정석임)
            - boolean addAll(Collection c) : 추가(합집합)
            - boolean remove(Object o) : 삭제
            - boolean removeAll(Collection c) : 삭제 (교집합)
            - boolean retainAll(Collection c) : Collection에 있는거만 남기고 삭제(조건부삭제, 차집합)
            - void clear() : 모두 삭제
        - 포함
            - boolean contains(Object o) : set이 객체를 포함했다면 true, 아니라면 false
            - boolean containsAll(Collection c) : Collection에 담긴 여러 객체가 모두 포함되어있는지
            - Iterator iterator() : 컬랙션의 요소를 읽어옴
        - 확인
            - boolean isEmpty() : 비었는지
            - int size() : 저장된 객체의 갯수
            - Object[] toArray() : set에 저장된 객체를 객체배열로 반환
            - Object[] toArray(Object[] a)
        
        ```java
        import java.util.*;
        
        public class  Main {
        	
        	public static void main(String[] args) {
        		Object [] objarr = {"1", new Integer(1),"2","2","3","3","4","4","4"};
        		Set set = new HashSet();
        		for(int i=0;i<objarr.length;i++) {
        			System.out.println(objarr[i]+"="+set.add(objarr[i])); //HashSet에 objarr의 모든 요소를 저장
        		}
        		//HashSet에 저장된 요소를 출력(set이라서 중복된 것 제외됨)
        		System.out.println();
        		System.out.println(set);
        		
        		//HashSet에 저장된 요소들을 출력(Iterator이용)
        		Iterator it = set.iterator();
        		
        		while(it.hasNext()) { //읽을 요소가 남아있는지 확인
        			System.out.println(it.next()); //요소 하나 꺼내오기
        		}// => 읽은 요소가 없을때까지 꺼내옴
        	}              
        }
        ```
        
        ```java
        import java.util.*;
        
        public class  Main {
        	
        	public static void main(String[] args) {
        		Set set = new HashSet();
        		
        		//set의 크기가 6보다 작은 동안 1~45사이의 난수를 저장
        		for(int i=0; set.size()<6 ;i++) {
        			int num = (int)(Math.random()*45+1);
        			set.add(num);
        		}
        		System.out.println(set);
        		//set은 정렬(순서유지) 안됨 -> LinkedList사용 
        		List list = new LinkedList(set); //LinkedList(Collection c)
        		Collections.sort(list);  //Collections.sort(List list)
        		System.out.println(list);
        	}              
        }
        ```
        
        ```java
        import java.util.*;
        
        public class  Main {
        	
        	public static void main(String[] args) {
        		HashSet set = new HashSet();
        		
        		set.add("abc");
        		set.add("abc");
        		set.add(new Person("Daivd",10));
        		set.add(new Person("Daivd",10));
        		
        		System.out.println(set);
        	}              
        }
        //equals와 hashCode를 오버라이딩 안해주면 david,10이 두번 다 저장됨
        class Person{
        	String name;
        	int age;
        	
        	Person(String name, int age){
        		this.name=name;
        		this.age = age;
        	}
        	
        	public String toString() {
        		return name+" : "+age;
        	}
        
        	public int hashCode() {
        		//int hash(Object... values);//가변인자
        		return Objects.hash(name,age);
        	}
        
        	public boolean equals(Object obj) {
        		if(!(obj instanceof Person)) return false;
        		
        		Person p =(Person)obj;
        		//나자신의 이름과 나이를 p와 비교
        		return this.name.equals(p.name) && this.age==p.age;
        	}
        }
        ```
        
        ```java
        import java.util.*;
        
        public class  Main {
        	
        	public static void main(String[] args) {
        		HashSet setA = new HashSet();
        		HashSet setB = new HashSet();
        		HashSet setHab = new HashSet();
        		HashSet setKyo = new HashSet();
        		HashSet setCha = new HashSet();
        		
        		setA.add("1"); setA.add("2"); setA.add("3"); setA.add("4"); setA.add("5");
        		System.out.println("A = "+setA);
        		
        		setB.add("4"); setB.add("5"); setB.add("6"); setB.add("7"); setB.add("8");
        		System.out.println("B = "+setB);
        		
        		//교집합
        		Iterator it = setB.iterator();
        		while(it.hasNext()) {
        			Object tmp = it.next();
        			if(setA.contains(tmp)) { //setB의 구성요소를 하나씩 빼서 setA에 있는지 확인
        				setKyo.add(tmp);
        			}
        		}
        		
        		//차집합
        		it = setA.iterator();
        		while(it.hasNext()) {
        			Object tmp = it.next();
        			if(!setB.contains(tmp)) {
        				setCha.add(tmp);
        			}
        		}
        		
        		//합집합
        		it = setA.iterator();
        		while(it.hasNext()) {
        			setHab.add(it.next());
        		}
        		it = setB.iterator();
        		while(it.hasNext()) {
        			setHab.add(it.next());
        		} //어차피 set은 중복 제거 돼서 중복제거안해줘도됨
        		
        		System.out.println("A ∩ B = "+setKyo);
        		System.out.println("A ∪ B = "+setHab);
        		System.out.println("A - B = "+setCha);
        		
        		//교집합(위에거 간단히)
        //		setA.retainAll(setB);
        //		System.out.println("A ∩ B = "+setA);
        		//합집합
        //		setA.addAll(setB);
        //		System.out.println("A ∪ B = "+setA);
        		//차집합
        //		setA.removeAll(setB);
        //		System.out.println("A - B = "+setA);
        	}
        }
        ```
        
    - TreeSet : 범위 검색과 정렬에 유리한 컬렉션 클래스. HashSet보다 데이터 추가, 삭제에 시간이 더 걸림. 이진 탐색 트리(binary search tree)로 구현.
        
        - 이진트리는 모든 노드(요소)가 최대 2개의 하위노드(요소)를 갖음. 각 요소가 나무 형태로 연결(LinkedList의 변형)
        - 이진 탐색 트리(binary search tree) : 부모보다 작은 값은 왼쪽에, 큰 값은 오른쪽에 저장(이진트리는 값의 크기랑은 상관없음). 데이터가 많이질 수록 추가, 삭제에 시간이 더 걸림(비교횟수 추가)
        - 데이터 저장 과정 : boolean add(Object o) - 중복이면 false반환, 저장안됨
        
        ![images](assets/images/java/IMG-20240902113146.png)
        
        Comparator : 비교기준
        ![images](assets/images/java/IMG-20240902113146-1.png)
        
        ```java
        import java.util.*;
        
        public class  Main {
        	
        	public static void main(String[] args) {
        		Set set = new TreeSet();
        		
        //		for(int i =0; set.size()<6;i++) {
        //			int num = (int)(Math.random()*45)+1;
        //			set.add(num); //set.add(new Integer(num));
        //		}
        //		System.out.println(set);
        		//TreeSet이라서 정렬안해도 해줌(Hashset은 정렬 필요)
        //		set.add(new Test()); 
        //		set.add(new Test()); 
        //		set.add(new Test()); 
        		set.add(new Test()); 
        		System.out.println(set); //[Test@77459877, Test@5b2133b1, Test@72ea2f77, Test@33c7353a]
        	}
        }
        
        
        //class TestComp implements Comparator{
        //
        //	@Override
        //	public int compare(Object o1, Object o2) {
        //		return -1; //같은 객체가 아님을 지정
        //	}
        //}
        class Test implements Comparable{//비교기준이 없다면 에러. 
        
        	@Override
        	public int compareTo(Object o) {
        		return -1;
        	} 
        	
        }
        //결론 : 	Set set = new TreeSet(new TestComp);, set.add(new Test()); 처럼 둘중에 하나는 비교기준을 지정해 줘야함
        ```
        
        ```java
        import java.util.*;
        
        public class  Main {
        	
        	public static void main(String[] args) {
        		TreeSet set = new TreeSet(); //범위검색에 유리
        		
        		String from = "b";
        		String to = "d";
        		
        		set.add("abc"); set.add("alien"); set.add("bat");
        		set.add("car"); set.add("Car"); set.add("disc");
        		set.add("dance"); set.add("dZZZZ"); set.add("dzzzz");
        		set.add("elephant"); set.add("elevator"); set.add("fan");
        		set.add("flower");
        		
        		System.out.println(set);
        		System.out.println("range search : from "+from + " to "+to);
        		System.out.println("result1 : "+set.subSet(from, to));
        		System.out.println("result2 : "+set.subSet(from, to+"zzz")); //"b"~~~zzz으로 끝나는 부분까지 출력
        		/* result1 : [bat, car]
        		result2 : [bat, car, dZZZZ, dance, disc] */
        	}
        }
        ```
        
        ```java
        import java.util.*;
        
        public class  Main {
        	
        	public static void main(String[] args) {
        		TreeSet set = new TreeSet(); 
        		int score[]= {80,95,50,35,45,65,10,100};
        		
        		for(int i=0;i<score.length;i++) {
        			set.add(new Integer(score[i]));
        		}
        		
        		System.out.println("50보다 작은 값 : "+set.headSet(50));
        		System.out.println("50보다 큰 값 : "+set.tailSet(50));
        		System.out.println("50보다 큰 값 : "+set.subSet(40,80));
        	}
        }
        ```
        
        — 트리 순회(tree traversal) : 이진트리의 모든 노드를 한번 씩 읽는 것
        
        - 전위순회 : 부모 먼저 읽음
        - 후위순위 : 자식 먼저 읽음
        - 중위순외 : (좌)자식-부모-(우)자식순으로 읽음 (오름차순 정렬됨)  
            ⇒ treeSet이 정렬에 유리한 이유  
            
        - 레벨순회 : 순서대로 위에서부터 좌우로 읽음
        
    - Set인터페이스의 메소드 == Collection인터페이스의 메소드
    - 집합과 관련된 메소드(Collection에 변화가 있으면 true, 아니면 false
        
        ![images](assets/images/java/IMG-20240902113146-2.png)
        
- Map인터페이스 - 순서x, 중복(키x,값o)
    
    - HashMap(동기화x) : Map인터페이스를 구현한 대표적인 클래스, 데이터를 키와 값의 쌍으로 저장, Hashtable의 신버전. Hashtable은 동기화가 됨.  
        해싱(hashing)기법으로 데이터를 저장. 데이터가 많아도 검색이 빠름  
        
        - LinkedHashMap : 순서 필요할때 사용
        - 해싱(hashing) : 해시함수를 이용해서 헤시테이블(hash table)에 데이터를 저장, 검색
            - 해시함수(hash function) : key를 넣으면 index를 반환 - 같은 키를 넣으면 항상 같은 값이 나옴
            - 해시테이블(hash table) : 배열과 LikedList가 조합된 형태
            - 해시테이블에 저장된 데이터를 가져오는 과정
                
                1. 키로 해시함수를 호출, 해시코드를 얻는다.
                2. 해시코드(해시함수의 반환값)에 대응하는 LikedList를 배열에서 찾는다.
                3. LikedList에서 키와 일치하는 데이터를 찾는다.
                
                — 해시함수는 같은 키에 대해 항상 같은 해시코드를 반환해야 한다. 서로 다른 키일지라도 같은 값의 해시코드를 반환할 수도 있다.
                
        - 주요 메소드
            - 생성자
                - HashMap()
                - HashMap(int initialCapacity) :
                - HashMap(int initalCapacity, float loadFactor)
                - HashMap(Map m) : 다른 Map을 HashMap으로 변경 가능
            - 저장/삭제/수정
                - Object put(Object key, Object value) : 데이터 저장
                - void putAll(Map m) : 지정된 Map을 모두 저장
                - Object remove(Object key, Object value) : 삭제
                - boolean replace(Object key, Object odlValue, Object newValue) : 기존 키를 새로운 키로 변경
            - 읽기
                - Set entrySet() : 키과 값으로 이루어진 set을 얻을 수 있음
                - Set keySet() : 키 값만 가져옴
                - Collection values() : 값만 가져옴
            - 기타
                - Object get(Object key) : 키를 넣으면 값이 반환됨
                - Object getOr Default(Object key, Object defaultValue) : 저장된 키가 없다면 지정된 값을 반환
                - boolean containsKey(Object key) : 지정된 키가 있는지. 있으면 t, 없으면 f
                - boolean containsValue(Object value) : 지정된 값이 있는지 있으면 t, 없으면 f
        
        ```java
        import java.util.*;
        
        public class  Main {
        	
        	public static void main(String[] args) {
        		HashMap map = new HashMap();
        		map.put("myId","1234");
        		map.put("asdf","1111"); 
        //		System.out.println(map);
        		map.put("asdf","1234");
        //		System.out.println(map);
        //		//마지막값으로 입력됨
        		
        		Scanner s = new Scanner(System.in);
        		
        		while(true) {
        			System.out.println("id와 password를 입력해주세요");
        			System.out.println("id : ");
        			String id = s.nextLine().trim();
        			
        			System.out.println("password : ");
        			String password = s.nextLine().trim();
        			System.out.println();
        			
        			if(!map.containsKey(id)) {
        				System.out.println("입력하신 아이디는 존재하지 않습니다. 다시 시도해주세요");
        				continue;
        			}
        			if(!(map.get(id).equals(password))) {
        				System.out.println("비밀번호가 일치하지 않습니다. 다시 시도해주세요");
        				continue;
        			}else {
        				System.out.println("로그인 되었습니다!");
        				break;
        			}
        		}
        	}
        }
        ```
        
        ```java
        import java.util.*;
        
        public class  Main {
        	
        	public static void main(String[] args) {
        		HashMap map = new HashMap();
        		map.put("김자바", new Integer(90));
        		map.put("김자바", new Integer(100));
        		map.put("이자바", new Integer(100));
        		map.put("강자바", new Integer(80));
        		map.put("안자바", new Integer(90));
        		
        		//entry는 map인터페이스의 내부 인터페이스
        		Set set = map.entrySet();
        		Iterator it = set.iterator();
        		
        		while(it.hasNext()) {
        			Map.Entry e = (Map.Entry)it.next();
        			System.out.println("이름 : "+e.getKey() + ", 점수 : "+e.getValue());
        		}
        		set = map.keySet();
        		System.out.println("참가자 명단 : "+set);
        		
        		Collection values = map.values();
        		it = values.iterator();
        		
        		int total=0;
        		
        		while(it.hasNext()) {
        			int i = (int)it.next();
        			total += i;
        		}
        		System.out.println("총점 : "+total);
        		System.out.println("평균 : "+(float)total/set.size());
        		System.out.println("최고 점수 : "+Collections.max(values));
        		System.out.println("최저 점수 : "+Collections.min(values));
        	}
        }
        ```
        
    - TreeMap : 이진탐색트리. 범위검색과 정렬에 유리하며, HashMap보다 데이터 추가, 삭제에 시간이 더 걸림
    
    ```java
    import java.util.*;
    
    public class  Main {
    	
    	public static void main(String[] args) {
    		String data[] = {"A","K","A","K","D","K","A","K","k","K","Z","D"};
    		HashMap map = new HashMap();
    		
    		for(int i=0;i<data.length;i++) {
    			if(map.containsKey(data[i])) {
    				int value = (int)map.get(data[i]); //map.get() 키를 넣으면 값이 반환
    				map.put(data[i], value+1);
    			} else {
    				map.put(data[i], 1);
    			}
    		}
    		Iterator it = map.entrySet().iterator();
    		
    		while(it.hasNext()) {
    			Map.Entry entry = (Map.Entry)it.next();
    			int value = (int)entry.getValue();
    			System.out.println(entry.getKey()+" : "+printBar('*',value)+" "+value);
    		}
    	}
    	public static String printBar(char ch, int value) {
    		char bar[] = new char[value];
    		for(int i=0;i<bar.length;i++) {
    			bar[i] = ch;
    		}
    		return new String(bar);
    	}
    }
    ```
    

![images](assets/images/java/IMG-20240902113146-3.png)

### 스택과 큐(Stack & Queue)

```java
import java.util.*;

public class  Main {
	public static void main(String[] args) {
		Stack st = new Stack();
		Queue q = new LinkedList(); //Queue인테페이스의 구현체인 LinkedList사용
		
		st.push("0");
		st.push("1");
		st.push("2");
		            
		q.offer("0");
		q.offer("1");
		q.offer("2");
		
		System.out.println("=====Stack=====");
		while(!st.empty()) {
			System.out.println(st.pop()); //스택요소 하나하나 꺼내기
		}
		System.out.println("=====Queue=====");
		while(!q.isEmpty()) {
			System.out.println(q.poll()); //스택요소 하나하나 꺼내기
		}
	}
}
```

- 스택 : LIFO(Last In First Out, 후입선출)구조. 저장(push), 추출(pop) — 배열이 효율적(순차적이라서)
    
    - 활용 예 : 수식계산, 수식괄호검사, 워드프로세서의 undo/redo, 웹브라우저의 뒤로/앞으로
    
    ```java
    import java.util.*;
    
    public class  Main {
    	public static void main(String[] args) {
    		if(args.length !=1) {
    			System.out.println("usage : java Ex11_3 \"EXPRESSIN\"");
    			System.out.println("Example : java Ex11_3 \"((2+3)*1)3\"");
    			System.exit(0);
    		}
    		
    		Stack st = new Stack();
    		String expression = args[0];
    		
    		System.out.println("expression : "+expression);
    		
    		try {
    			for(int i=0;i<expression.length();i++) {
    				//입력된 수식에서 하나씩 꺼내기
    				char ch = expression.charAt(i); 
    			
    			if(ch=='(') {
    				//여는괄호라면, 스택에 집어넣고
    				st.push(ch+"");
    				//닫는 괄호라면, 스택에서 꺼냄
    			}else if(ch==')') {
    				st.pop();
    			}
    		}
    			//스택이 비었다면?
    			if(st.isEmpty()) {
    				System.out.println("괄호가 일치합니다");
    			}else {
    				System.out.println("1.괄호가 일치하지 않습니다");
    			}
    		}catch (EmptyStackException e) {
    			//(2+3)*1)))) 이런식으로 꺼낼 괄호가 없는데 자꾸 추출하려해서 에러날떄
    			System.out.println("2.괄호가 일치하지 않습니다");
    		}
    }
    
    }
    ```
    
- 큐 : FIFO(First in First Out, 선입선출)구조, 저장(offer), 추출(poll) — 링크드리스트가 효율적(비순차적이라서) - 인터페이스라 객체생성안됨
    
    - 활용 예 : 최근사용문서(Recent Files), 인쇄작업 대기목록, 버퍼(buffer)
    - Queue를 직접 구현
        - Queue를 구현할 클래스를 사용(LinkeList 등 공식문서 참조)  
            ⇒ Queue q = new LinkedList();  
            
    
    ```java
    import java.util.*;
    
    public class  Main {
    	static Queue q = new LinkedList();
    	static final int MAX_SIZE = 5; //Queue에 최대 5개까지 저장됨(최근 5개의 명령어를 저장)
    	
    	public static void main(String[] args) {
    		System.out.println("help를 입력하면 도움말을 볼 수 있습니다.");
    		
    		while(true) {
    			System.out.println(">>");
    			try {
    				//화면으로부터 라인단위로 입력받음
    				Scanner s = new Scanner(System.in);
    				String input = s.nextLine().trim();
    				
    				if("".equals(input)) continue;
    				
    				if(input.equalsIgnoreCase("q")) {
    				System.out.println("프로그램 종료");
    				System.exit(0);
    				}
    				if(input.equalsIgnoreCase("help")) {
    					System.out.println("help - 도움말을 표시합니다");
    					System.out.println("q 또는 Q - 프로그램을 종료합니다");
    					System.out.println("history - 최근에 입력한 명령어를 "+MAX_SIZE+"개 보여줍니다");
    				}else if(input.equalsIgnoreCase("history")) {
    					save(input); //입력한 명령어 저장
    					
    					//LinkedList의 내용 표시
    					LinkedList list = (LinkedList)q;
    					
    					final int size = list.size();
    					for(int i = 0 ; i<size;i++)
    						System.out.println((i+1)+"."+list.get(i));
    				}else {
    					save(input);
    					System.out.println(input);
    				} //if(input.equalsIgnoreCase("q"))
    			}catch(Exception e) {
    				System.out.println("입력오류입니다");
    			}
    		}
    	}
    
    	private static void save(String input) {
    		//queue에 저장(빈문자열은 저장안함)
    		if(!"".equals(input)) {
    			q.offer(input);
    			
    			//queue의 최대크기를 넘으면 제일 처음 입력된 것을 삭제
    			if(q.size()>MAX_SIZE) //size()는 Collection인터페이스에 정의
    				q.remove(); // == q.pool();
    		}
    	}
    
    }
    ```
    

![images](assets/images/java/IMG-20240902113146-4.png)

![images](/assets/images/java/Untitled_8_17.png)

peek : 꺼내지 않고 맨 위에 있는 것을 보는 것
![images](assets/images/java/IMG-20240902113147-1.png)

밑에 세 개가 예외발생x, 중점으로 쓸것

### Iterator(새버전), ListIterator, Enumeration(구버전)

: 컬렉션에 저장된 데이터를 접근하는데 사용되는 인터페이스

- **Iterator** : 컬렉션에 저장된 요소들을 읽어오는 방법을 표준화한 것.  
    컬렉션에 iterator()를 호출해서 Iterator를 구현한 객체를 얻어서 사용  
    
    - boolean hasNext() : 읽어올 요소가 남아있는지 확인, 있으면 true, 없으면 false(확인)
    - Object next() : 다음 요소를 읽어온다. next()를 호출하기 전에 hasnext()를 호출해서 읽어 올 요소가 있는지 확인하는 것이 안전하다.(읽기)
    - Map에는 iterator()가 없다. keySet(), entrySet(), values()를 호출해야함  
        - Map map = new HashMap(); Iterator it =  
        map.entrySet().iterator();
    
    ```java
    import java.util.*;
    
    public class  Main {
    	
    	public static void main(String[] args) {
    		List list = new ArrayList(); //다른컬렉션으로 변경할때 이거만 수정하면 됨
    		Iterator it =list.iterator();
    		
    		while (it.hasNext()) { //boolean hasNext() 읽어올 요소가 있는지 확인
    			System.out.println(it.next()); //Object next() 다음요소 읽음
    		}
    	}
    }
    ```
    
    ```java
    import java.util.*;
    
    public class  Main {
    	
    	public static void main(String[] args) {
    		//Set은 Collection의 자손
    //		Collection c = new HashSet(); //for문의 get이 오류남
    		ArrayList list = new ArrayList();
    		list.add("1");
    		list.add("2");
    		list.add("3");
    		list.add("4");
    		list.add("5");
    		
    		//Iterator를 사용했다면 표준화되어있기때문에 List나 Set 둘다 작동함
    		Iterator it = list.iterator();
    		
    		while(it.hasNext()) {
    			Object obj = it.next();
    			System.out.println(obj);
    		}
    		
    		while(it.hasNext()) { //이미 한번 실행됐기때문에 false반환, 실행 안됨
    			Object obj = it.next();
    			System.out.println(obj);
    			//즉,Iterator는 1회용 코드임
    		}
    		System.out.println();
    		//새로운 iterator객체 얻어옴
    		it = list.iterator();
    		
    		while(it.hasNext()) {
    			Object obj = it.next();
    			System.out.println(obj);
    		}
    		System.out.println();
    		for(int i=0;i<list.size();i++) {
    			Object obj = list.get(i);
    			System.out.println(obj);
    		}
    	}
    }
    ```
    
- Enumeration
    - boolean hasMoreElements() : 읽어올 요소가 남아있는지 확인, 있으면 true, 없으면 false(확인)
    - Object nextElement() : 다음 요소를 읽어온다. nextElements()를 호출하기 전에 hasMoreElements()를 호출해서 읽어 올 요소가 있는지 확인하는 것이 안전하다.(읽기)
- Listiterator : Iterator의 접근성을 향상시킨 것. (단방향 → 양방향 : 이전요소도 읽어올 수 있음)

### Array

: 배열을 다루기 편한 메소드(static)을 제공

- 배열의 출력 -toString()
- 배열의 복사 - copyOf(), copyOfRange()
- 배열 채우기 - fill(), setAll()
- 배열의 정렬과 검색 - sort(), binarySearch()
    1. sort()로 배열 정렬
    2. binarySearch()로 위치 찾기
- 다차원 배열의 출력 - deepToString()
- 다차원 배열의 비교 - deepEquals()
- 배열을 List로 변환 - asList(Object…a)
- 람다와 스트임(14장)관련 - parallelXXX(). spliterator(), stream()

```java
import java.util.*;

public class  Main {
	
	public static void main(String[] args) {
		int arr[] = {0,1,2,3,4};
		int arr2D[][] = { {11,12,13},{21,22,23} };
		
		System.out.println("arr = "+Arrays.toString(arr));
		System.out.println("arr2D = "+Arrays.toString(arr2D)); //arr2D = [[I@6b884d57, [I@38af3868]
		System.out.println("arr2D = "+Arrays.deepToString(arr2D));
		        
		int arr2[] = Arrays.copyOf(arr, arr.length); //arr을 똑같이 복사
		int arr3[] = Arrays.copyOf(arr, 3);
		int arr4[] = Arrays.copyOf(arr, 7); //남는 공간에 0 채워넣음
		int arr5[] = Arrays.copyOfRange(arr, 2,4);
		int arr6[] = Arrays.copyOfRange(arr, 0,7);
		
		System.out.println("arr2 = "+Arrays.toString(arr2));
		System.out.println("arr3 = "+Arrays.toString(arr3));
		System.out.println("arr4 = "+Arrays.toString(arr4));
		System.out.println("arr5 = "+Arrays.toString(arr5));
		System.out.println("arr6 = "+Arrays.toString(arr6));
		
		int arr7[] = new int[5];
		Arrays.fill(arr7,9); //arr7 전부를 9로 채움 
		System.out.println("arr7 = "+Arrays.toString(arr7));
		
		Arrays.setAll(arr7,  i->(int)(Math.random()*6)+1);
		System.out.println("arr7 = "+Arrays.toString(arr7));
		
		//향상된 for문. arr7에서 한개씩 꺼내서 i에 집어넣음 
		for(int i : arr7) {
			char graph[] = new char[i];
			Arrays.fill(graph, '*');
			System.out.println(new String(graph)+i);
		}
		
		String str2D[][] = new String[][] { {"aaa","bbb"},{"AAA","BBB","CCC"} };
		String str2D2[][] = new String[][] { {"aaa","bbb"},{"AAA","BBB","CCC"} };
		
		System.out.println(Arrays.equals(str2D, str2D2)); //false
		System.out.println(Arrays.deepEquals(str2D, str2D2));
		
		char charr[] = {'A','D','C','B','E'};
		
		System.out.println("charr = "+Arrays.toString(charr));
		System.out.println("index of B = "+Arrays.binarySearch(charr, 'B')); //정렬 전이라 안나옴
		System.out.println("= After sorting = ");
		Arrays.sort(charr);
		System.out.println("charr = "+Arrays.toString(charr));
		System.out.println("index of B = "+Arrays.binarySearch(charr, 'B'));
	}              
}
```

— 순차 검색(탐색)과 이진 검색(탐색)

- 순차 검색 - 순차적으로 찾음
- 이진 검색 - 정렬 후 반씩 잘라서 특정지점만 찾기

### Comparator와 Comparable

: 객체 정렬에 필요한 메소드(정렬기준 제공)를 정의한 인터페이스

- Comparator : 기본 정렬기준을 구현, 두 객체를 비교
- Comparable : 기본 정렬기준 외에 다른 기준으로 정렬, 주어진 객체를 자신과 비교
- Compare()과 CompareTo()는 두 객체의 비교결과를 반환하도록 작성. 같으면 0, 오른쪽이 크면 음수, 오른쪽이 작으면 양수

```java
import java.util.*;

public class  Main {
	
	public static void main(String[] args) {
		String strArr[] = {"dog","cat","Tiger","lion"};
		System.out.println("strArrArray = "+Arrays.toString(strArr));
		
		Arrays.sort(strArr); //Comparable구현에 의해 정렬
		//원래 Arrays.sort(정렬대상, 정렬기준)인데 String자체에 기본정렬기준[사전순]이 있어[String 안에 comparable 구현돼있음]지정안해줌
		System.out.println("strArrArray = "+Arrays.toString(strArr));
		
		Arrays.sort(strArr, String.CASE_INSENSITIVE_ORDER); //대소문자 구분x
		System.out.println("strArr = "+Arrays.toString(strArr));
		
		Arrays.sort(strArr, new Descending());
		System.out.println("strArr = "+Arrays.toString(strArr));
	}              
}
class Descending implements Comparator{
	public int compare(Object o1, Object o2) {
		if(o1 instanceof Comparable && o2 instanceof Comparable) {
			Comparable c1 = (Comparable)o1;
			Comparable c2 = (Comparable)o2;
			return c1.compareTo(c2)*-1;
			//-1을 곱해서 기본정렬방식의 역순으로 변경. 
		}
		return -1;
	}
}
```

- Integer와 Comparable
    
    - 버블정렬(불변)
    
    ```java
    import java.util.*;
    
    public class  Main {
    	
    	public static void main(String[] args) {
    	}              
    static void sort(int [] intarr) {
    	for(int i=0;i<intarr.length-1;i++) {
    		for(int j=0;j<intarr.length-1-i;i++) {
    			int tmp = 0;
    			
    			if(intarr[j] > intarr[j+1]) {
    				tmp = intarr[j];
    				intarr[j] = intarr[j+1];
    				intarr[j+1]=tmp;
    			}
    		}
    	}
    }
    }
    ```
    

### Collections

: 컬렉션을 위한 메소드(static)을 제공

- 컬렉션 채우기, 복사, 정렬, 검색 - fill(), copy(), sort(), binarySearch() 등
- 컬렉션의 동기화 - synchronized-0~~~()  
    List syncList = Colloections.synchronizedList(new ArrayList(…));  
    ⇒ 동기화 안된 synchronizedList를 넣으면 동기화된 List(Vector와 똑같은 효과)인 syncList가 반환됨  
    
- 변경불가(readOnly)컬렉션 만들기 - unmodifiable~~~()
- 싱글톤 컬렉션 만들기 - singleton~~~() : 객체 1개만 저장하는 컬렉션
- 한종류의 객체만 저장하는 컬력션 만들기 - checked~~~() : 한가지 타입의 객체만 저장가능
    
    List list = new ArrayList();  
    List checkedList = checkedList(list, String.class); //String만 저장가능  
    checkedList.add("abc");  
    checkedList.add(3); //에러  
    

```java
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import static java.util.Collections.*; //Collections를 생략 기능

public class  Main {
	
	public static void main(String[] args) {
		List list = new ArrayList();
		System.out.println(list);
		
		addAll(list,1,2,3,4,5); //원래 Collections.addAll()로 써야함
		System.out.println(list);
		
		rotate(list,2);//반시계방향으로두번회전
		System.out.println(list);
		
		swap(list,0,2); //첫번째와 세번쨰를 교환
		System.out.println(list);
		
		shuffle(list); //저장된요소의 위치를 임의로 변경
		System.out.println(list);
		
		sort(list,reverseOrder()); 
		System.out.println(list);
		
		sort(list); 
		System.out.println(list);
		
		int idx = binarySearch(list,3);
		System.out.println("index of 3 = "+idx);
		
		System.out.println("max = "+max(list));
		System.out.println("min = "+min(list));
		System.out.println("min = "+max(list,reverseOrder()));
		
		fill(list,9); //9로 채움
		System.out.println(list);
		
		//list와 같은 크기의 새로운 list생성, 2로 채움
		List newlist = nCopies(list.size(),2);
		System.out.println("newList="+newlist);
		
		//공통요소가 없으면 true
		System.out.println(disjoint(list, newlist));
		
		copy(list, newlist);
		System.out.println("newlist="+newlist);
		System.out.println("list="+list);
		
		//2를 1로 변경
		replaceAll(list,2,1);
		System.out.println("list="+list);
		
		Enumeration e = enumeration(list);
		ArrayList list2 = list(e);
		
		System.out.println("list2 = "+list2);
	}
}
```

![images](assets/images/java/IMG-20240902113147.jpg)
