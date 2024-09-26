---
title: "[스프링 부트와 AWS로 혼자 구현하는 웹 서비스] 6장 AWS 서버 환경을 만들어보자 - AWS EC2"
category: AWS
tags:
  - spring
  - aws
  - 스프링부트와AWS로혼자구현하는웹서비스
  - ec2
  - 책요약
last_modified_at: 2024-04-06
---
### 인스턴스 시작

인스턴스 세부정보는 기업에서 사용할 경우에는 세세하게 다루지만 혼자 1대의 서버를 다룰때는 굳이 설정하지않아도됨. 자세한건 다른 AWS책에서 찾아볼것. 

다른유형을 선택하면 비용청구됨
![images](/assets/images/alone/IMG-20240925142225.png)

다른유형을 선택하면 비용청구됨

![images](/assets/images/alone/IMG-20240925142225-1.png)

프리티어유형인 t2.micro를 선택
t2는 요금제, micro는 사양을 의미
t2외에 t3도 있는데 이들을 T시리즈(범용 시리즈)라고부름(다른 시리즈는 nano, macro등의 저사양이 존재하지않음)

크레딧이라는 일종의 CPU사용가능한 포인트 개념이 있는데 인스턴스 크기에따라 정해진비율로 크레딧을 계속 받으며 사용하지않을때는 크레딧을 축적하고 사용할때 축적된 크레딧을 사용함

크레딧을 모두 사용하면 EC2들 더이상 사용할 수 없어 트래픽이 높은 서비스는 T시리즈가아닌 다른 시리즈를 사용하기도함 

![images](/assets/images/alone/IMG-20240925142226.png)

- ssn - port 22 : 터미널로 AWS접속할때 key가없으면 접속이안되니 간혹 전체접속 허용(0.0.0./0, ::/0)하는 경우가 있는데 **실수로 pem 키가 노출되는순간 가상화폐 채굴에 이용되기도함** <mark class="hltr-red">따라서 pem키 관리와 지정된 IP에서만 접근할 수 있도록 구성하는것이 안전함</mark>
	집을 기본설정하고 외부에서 접속할때 ssh에 해당 장소의 IP를 추가하는것을 권장함
- 사용자 지정 TCP - port {애플리케이션 포트번호} : 프로젝트의 기본 포트설정 추가. 보안그룹 경고가 날수있는데 이건 지정한 애플리케이션 포트번호가 전체허용되어서 그런것임. 그리 위험한일은 아니니 무시하고 시작해도됨

![images](/assets/images/alone/IMG-20240925142226-1.png)

인스턴스는 비밀키(pem)과 매칭되는 공개키를 가지고있어 해당 pem키 외에는 접근을 허용하지않음. <mark class="hltr-red">일종의 마스터키이기때문에 유출되면안됨</mark>


![images](/assets/images/alone/IMG-20240925142226-2.png)
30기가까지 프리티어임

### EIP할당

AWS의 고정 IP를 Elastic IP(EIP)라고 부름. 인스턴스의 퍼블릭 IP는 유동적 주소라서 인스턴스 중지, 실행 시 새주소가 할당됨. 고정 IP를 인스턴스에 할당하는 과정이 필요함 

<mark class="hltr-red">생성은 무료이나 생성 후 방치하면 요금이 부과된다고함! 안쓰면 삭제할것!!</mark>

![images](/assets/images/alone/IMG-20240925142226-3.png)

![images](/assets/images/alone/IMG-20240925142226-4.png)

![images](/assets/images/alone/IMG-20240925142226-5.png)

![image](/assets/images/alone/IMG-20240925142227.png)

위 과정으로 인스턴스와 연결해주면됨

### ec2 터미널 접속

글은 Mac을 기준으로 작성하였지만 같은방법으로 윈도우에서 진행했을때도 정상 접속되는것을 확인함.
윈도우에서 putty를 이용하여 접근하는 방법도 사용해보았으나 해당 방법이 더 간단함

`ssh -i {pem키위치} {ec2탄력적IP주소)` 로 접속 가능하나 바로접속은 안될거임
`chmod 600 {pem키위치}` 로 권한을 먼저 변경해준 후 접속가능함

그러나 ec2에 접속할때마다 pem키를 찾는것은 너무 비효율적임
그래서 pem키를 복사한 후 따로 설정해줄것임

`cp {pem키 다운위치} ~/.ssh/`
`chmod 600 {~/.ssh/{pem키이름}}`
`vim ~/.ssh/config`

```shell
Host {본인이원하는서비스명}
HostName {탄력적IP}
User ec2-user
IdentityFile ~/.ssh/{pem키 이름}
```

을 config에 설정해줌

-  2024/04/06 글 추가

	User ec2-user 부분은
	<mark class="hltr-cyan">사용자이름이 인스턴스의 이름과 같아야 접속이 가능함</mark>
	ec2-user는 처음 인스턴스생성시 아마존을 선택했을때 기본으로 지정되는 유저이름인듯함. 
	우분투로 생성하면 사용자이름은 ubuntu이기때문에 아래처럼 작성해주어야함
	![images](/assets/images/alone/IMG-20240925142227-1.png)
```shell
		> Host {본인이원하는서비스명}
		HostName {탄력적IP}
		User ubuntu
		IdentityFile ~/.ssh/{pem키 이름}
```

![images](/assets/images/alone/IMG-20240925142227-2.png)

이까지했을때 이렇게나옴
`chmod 700 ~/.ssh/config` 까지 한 후
`ssh {본인이원하는서비스명}`
을 해주면 접속 성공함

![images](/assets/images/alone/IMG-20240925142227-3.png)

- 아마존 리눅스 설정
    - 자바 설치
        
        `sudo yum install java-17-amazon-corretto` 자바 17버전 설치(아마존 리눅스서버 1 기준 기본 자바버전이 java7. 책에서는 자바 8버전을 설치하나 17버전으로 설치했음)
        <font color="#7f7f7f">사실 설치하기전에 ec2자체 자바버전이 몇인지 확인을 못해서 아직 기본버전이 7인지는 모르겠다;; 다음에 ec2 인스턴스 생성할때 꼭 확인해보고 업데이트하겠음;;</font> —> 2024/04/06 우분투는 설치안돼있음
        
        `sudo /usr/sbin/alternatives --config java` 인스턴스 버전 변경
        
        ![images](/assets/images/alone/IMG-20240925142227-4.png)
        
        `sudo yum remove {삭제하려는자바버전}` 으로 사용하지않는 자바버전은 삭제 가능함
        
    - 타임존 변경
    
        EC2 서버의 기본 타임존은 UTC라 한국시간과 9시간 차이남. java 어플리케이션에서도 9시간씩 차이가 나서 미리 꼭 수정해두어야함
        `sudo rm /etc/localtime`
        `sudo ln -s /usr/share/zoneinfo/Asia/Seoul /etc/localtime`
        설정 후 date 명령어로 현재시간이 나오는지 확인
        
        ![images](/assets/images/alone/IMG-20240925142227-5.png)
        
    - HostName 변경
        
        서버가 여러개인경우 ip만으로 어떤 서비스의 서버인지 확인이 어려워서 각 서버가 어떤 서비스인지 표현하기위해 변경함
        `sudo vim /etc/sysconfig/network`
        
        ![images](/assets/images/alone/IMG-20240925142227-6.png)
        
        HOSTNAME을 사진과 같이 추가한다.
        처음에 wm-service로만 등록했다가 안돼서 별짓다했는데 HOSTNAME에 <font color="#c0504d">.</font>이 하나는 있어야하나봄
        
        ![images](/assets/images/alone/IMG-20240925142228.png)
        
        hostName확인
        `sudo reboot`로 재부팅하면 됨
        `sudo vim /etc/hosts` 에 127.0.0.1  에 HOSTNAME을 방금 등록한 호스트명으로 등록함
        
        ![images](/assets/images/alone/IMG-20240925142228-1.png)
        
        설정 후 `curl {HOSTNAME}` 을 했을때
        
        ![images](/assets/images/alone/IMG-20240925142228-2.png)
        
        위처럼 80포트로 실행된 서비스가 없음. 이라는 문구가 떠야 정상임
