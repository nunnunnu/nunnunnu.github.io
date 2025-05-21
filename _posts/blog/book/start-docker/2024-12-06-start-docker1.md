---
title: "[시작하세요! 도커/쿠버네티스] 도커 엔진"
category: Docker
tags:
  - docker
  - 책요약
last_modified_at: 2024-12-10
---

#### 도커 엔진
###### 컨테이너 시작~종료

1. 컨테이너 접속/생성
	1. <mark class="hltr-cyan">컨테이너 생성 + 내부 접속 : run 명령어 사용</mark>. `docker run -i -t ubuntu:14.04'
	2. 컨테이너 생성만 : create명령어 사용 `docker create -i -t --name mycentos centos:7`
	3. 생성된 컨테이너 접속 : start + attach 명령어 사용 `docker start mycentos`으로 컨테이너 시작
	    +`docker attach mycentos`
		
		시험해보니 없는 컨테이너명을 치면 둘다 에러뜬다
		
	- ubuntu:14.04 : 이미지 이름. 해당 이름의 이미지가 로컬 도커엔진에 없으면 도커 허브에서 자동으로 이미지를 내려받음
	- -i : 컨테이너와 상호 입출력을 가능하게하는 옵션
	- -t : tty활성화 옵션(bash 셸 사용가능)
2. 위 명령어 실행 후 해당 컨테이너에 자동 접속됨
   
   ![image](/assets/images/start-docker/IMG-20250521165406.png)
	
	- 컨테이너 기본사용자 : root
	- 호스트 이름 : e0295e~~ -> 무작위의 16진수 해시 값
	- ls로 확인한 결과 이시점에서는 아무것도 저장되지않은 것을 확인가능
3. 컨테이너 접속 종료
	- 빠져나옴 + 컨테이너 정지 => exit 명령어 or ctrl + D
	- <mark class="hltr-cyan">접속만 종료 -> ctrl + P, Q</mark>
4. 도커허브에서 이미지 내려받기 `docker pull {이미지이름}` -> `docker images`로 다운된 이미지들 확인
	
	![image](/assets/images/start-docker/IMG-20250521165406-1.png)
	
###### 도커 명령어
- 컨테이너 목록 관리 `docker ps`(정지되지않은 컨테이너만 조회)
	- 정지된 컨테이너까지 조회 `docker ps -a`
	![image](/assets/images/start-docker/IMG-20250521165406-2.png)
	- container id : container id는 일부만 보여짐. 전체아이디는 `docker inspect mycentos || grep Id` 로 조회가능
		![image](/assets/images/start-docker/IMG-20250521165406-3.png)
		
	- NAMES : create 명령어 사용시 사용한 명령어의 `docker create -i -t --name mycentos centos:7` --name을 지정해준다면 지정된 이름이 NAMES에 뜸, 안했으면 무작위로 나옴
	  
	  만약 수정하고싶다면 rename 명령어 사용 `docker rename {originName} {changeName}`
	- image : 컨테이너 생성 시 사용한 이미지 이름	  
	- command : 컨테이너 시작 시 실행 될 명령어 `docker run -i -t ubuntu:14.04 echo hello world` echo 명령어로 지정 가능하나 기존의 /bin/bash를 덮어쓰기했기때문에 hello world가 실행된 후 종료됨 -> 4장 ENTRYPOINT, CMD 참고
- 컨테이너 삭제
	- `docker rm mycentos` 로 삭제 가능하나 실행중인 컨테이너는 삭제불가능
		-> `docker rm -f mycentos`로 강제 삭제 or `docker stop mycentos`로 종료시킨 후 삭제
	- 컨테이너 전체 삭제 : `docker container prune`
		- 변수 지정 가능. `docker ps -a -q`의 -q는 도커의 아이디만 가져오는 명령어인데 이를 변수에 넣어서 삭제 가능함. 위의 -a -q는 모든 컨테이너의 아이디만, `docker ps -q`는 실행중인 컨테이너의 아이디만 나오니 `docker rm ${docker ps -q}`로 실행중인 컨테이너만 삭제하는 등 응용가능
		  
		  *..아직 제대로 이해못함 다시해봐야함*

###### 컨테이너 외부 노출

컨테이너 접속 후 ifconfig로 아이피 조회 가능

![image](/assets/images/start-docker/IMG-20250521165406-4.png)

도커의 NAT IP인 172.17.0.3를 할당받은 eth0과 로컬호스트인 lo의 인터페이스가있음

아무 설정을 하지않았다면 컨테이너는 외부 접속을 막고있음

외부 접속을 허용하려면 eth0의 ip와 포트를 호스트의 ip와 포트에 바인딩해야함

`docker run -i -t --name mywebserver -p 80:80 ubuntu:14.04`

![image](/assets/images/start-docker/IMG-20250521165406-5.png)

-p 옵션은 컨테이너의 포트를 호스트의 포트와 바인딩하는역할을 함. 형식은 {호스트의포트}:{컨테이너의포트}로 호스트의 특정 ip의 특정포트를 사용하려면 -p 192.168.0.100:7777:80 와 같이 사용하면됨

만약 여러개의 포트와 바인딩해야한다면 `docker run -i -t --name mywebserver -p 80:80 -p 192.168.0.100:7777:80 ubuntu:14.04` 이렇게 여러번 적어주면됨

컨테이너 내부에서 `apt-get update` `apt-get install apache2-y` `service apache2 start`로 아파치 웹 서버를 설치, 실행함

그 후 위에 바인딩 된 0.0.0.0:80으로 접속해보면

![image](/assets/images/start-docker/IMG-20250521165407.png)

설치한 아파치 서버로 접근할 수 있는것이 확인됨

여기서 중요한것은 아파치 서버가 설치된것은 호스트가 아닌 컨테이너 내부이기때문에 로컬환경에는 아파치를 설치하지않았지만 아파치 서버를 사용할수있다는것임.

호스트 ip의 80포트로 접근 -> 80포트는 컨테이너의 80포트로 포워딩 -> 웹서버 접근

당연하게도 접근을 http://0.0.0.0:81 로 하면 접근이실패됨
###### 컨테이너 애플리케이션 구축
참고로 한 컨테이너에 한 서버만 설치하는것이 관리하고 독립성을 유지하기 쉬움.
`docker run -d --name wordpressdb -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=wordpress mysql:5.7` 으로 db서버 컨테이너 생성
만약 docker: no matching manifest for linux/arm64/v8 in the manifest list entries. 같은 에러문구가 뜬다면 
- mysql 이미지를 사용해 db컨테이너 생성 `docker run -d --platform linux/amd64 --name wordpressdb -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=wordpress mysql:5.7` 처럼 --platform linux/amd64 명령어를 사용해 이미지를 다운로드할 플랫폼이 arm64이 아닌 linux의 arm64임을 명시해서 다운하면됨
- 이리 준비된 워드프레스 이미지를 사용하여 웹서버 컨테이너 생성 `docker run -d -e WORDPRESS_DB_PASSWORD=password --name wordpress --link wordpressdb:mysql -p 80 wordpress`


![image](/assets/images/start-docker/IMG-20250521165407-1.png)

> [!만약 특정 컨테이너에 바인딩된 포트만 조회하고싶다면?]
> 
> `docker port wordpress`로 포트만 조회 가능

참고로 위 컨테이너 생성시 사용한 -d옵션은 컨테이너를 생성할때 컨테이너를 백그라운드에서 동작하는 애플리케이션(입출력 없어 사용자의 입력을 받지않음)으로써 실행시키는 옵션임. detached모드로 실행하는것. 이것은 반드시 컨테이너에서 프로그램이 실행되어야하며 포그라운드 프로그램이 실행되지않으면 컨테이너는 종료됨
mysql서버를 -i -t옵션으로 실행했어도 mysql프로그램이 포그라운드로 실행되기때문에 입출력이 불가하고 실행되는 것만 지켜볼수있음

...그것도모르고 attach명령어로 내부에 들어갔다가 못나와서 터미널껐음

-e 옵션은 컨테이너 내부의 환경변수를 설정함. 이를 확인하려면 컨테이너 내부에서 `echo $MYSQL_ROOT_PASSWORD` 로 확인할 수 있으나 입출력이 가능한 bash쉘로 접근하려면 attach가 아닌 exec 명령어로 접근해야함
`docker exec -i -t wordpressdb /bin/bash` 접근한 다음 echo를 사용하면되는데
혹시 `qemu: uncaught target signal 11 (Segmentation fault) - core dumped`라는 에러가 뜬다면 

![image](/assets/images/start-docker/IMG-20250521165407-2.png)

도커 설정에서 Rosetta를 활성화해주면됨.

그러나 이번엔 테스트로 환경변수에 비밀번호를 지정해주었지만 비밀번호같은 민감정보를 컨테이너 내부의 환경변수로 입력하는것은 바람직하지않음. 이런경우 도커 스웜모드의 secret기능이나 쿠버네티스의 secret같은 기능을 사용하는것이 좋음 -> 3.3.3.5 or 7.2.2
