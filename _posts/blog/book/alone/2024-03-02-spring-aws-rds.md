---
title: "[스프링 부트와 AWS로 혼자 구현하는 웹 서비스] 7장 AWS에 데이터베이스 환경을 만들어보자 - AWS RDS"
category: AWS
tags:
  - aws
  - spring
  - 스프링부트와AWS로혼자구현하는웹서비스
  - RDS
  - 책요약
last_modified_at: 2024-03-02
---
### 설정
mariaDB를 사용할것임

![images](/assets/images/alone/IMG-20240925132200-6.png)

![images](/assets/images/alone/IMG-20240925132201.png)

![images](/assets/images/alone/IMG-20240925132201-1.png)

![images](/assets/images/alone/IMG-20240925132201-2.png)

![images](/assets/images/alone/IMG-20240925132201-3.png)

![images](/assets/images/alone/IMG-20240925132201-4.png)

위 설정으로 생성하면되는데

검색해보니 DB인스턴스 클래스는 프리티어를 선택했기때문에 버스터블 클래스(t클래스포함) 만 선택가능하다고한다
추가로 책에는 설명이없지만 과금방지를 위해 <mark class="hltr-red">유지 관리의 마이너버전 자동업그레이드 사용도 해제</mark>해주었다
설정한다면 마이너 버전이 자동으로 업그레이드되며 DB는 약 30분간 정지된다고한다. <font color="#a5a5a5">(해제해주어도 취약점 대응시 강제 업데이트가 될 수도 있다고 한다)</font>
### 파라미터 설정
    
![images](/assets/images/alone/IMG-20240925132201-5.png)
    
![images](/assets/images/alone/IMG-20240925132202.png)
    
    버전은 아까 생성한 RDS와 동일버전으로 선택
    
    생성 후 목록에서 편집으로 이동한 후 
    
#### 타임존 설정
        
![images](/assets/images/alone/IMG-20240925132202-1.png)
        
	서울로 지정
        
#### Character Set
        
![images](/assets/images/alone/IMG-20240925132202-2.png)
        
        utf8mb4가 이모지 사용이 가능해서 보통 많이 씀

#### Max Connection

![images](/assets/images/alone/IMG-20240925132202-3.png)

인스턴스 사양에 맞게 자동으로 정해지나 현재 프리티어 사양으로는 60개의 커넥션만 가능해서 넉넉하게 설정함
사양을 높이게된다면 기본값으로 돌려놓으면됨


다시 rds로 돌아가서 

![images](/assets/images/alone/IMG-20240925132202-4.png)

파라미터 설정까지해줌
    
### 보안그룹
    
생성한 RDS에서 
![images](/assets/images/alone/IMG-20240925132202-5.png)

보안그룹 밑의 ID링크를 클릭

![images](/assets/images/alone/IMG-20240925132202-6.png)

잘못보고 아웃바운드에서 설정을 했는데..**인바운드**로해야함.. 설정은 다시했는데 캡쳐를 안함;;

RDS보안그룹에 EC2보안그룹의 ID를 넣어서 저장해줌.

![images](/assets/images/alone/IMG-20240925132203.png)

RDS의 엔드포인트로 DB 연결가능해짐

### ec2에 RDS 접근확인

접근 테스트를 위해 ec2에 mysql을 설치함
	
`sudo yum install mysql` 을 시도했으나 실패하여 찾아보니
Amazon linux의 yum에는 mysql 설치 경로가 없기때문에 아래명령어로 yum repository에 등록을 먼저 해줘야한다고
`sudo yum install https://dev.mysql.com/get/mysql80-community-release-el7-5.noarch.rpm`

yum repository에 등록 후 `sudo yum install mysql`로 mysql을 설치했으나
Problem: conflicting requests 에러가뜸

에러내용을 확인해보니 
아마존 리눅스 2023을 쓸 때는 el9 버전 레포지토리를 사용해주어야 한다

`sudo dnf install [https://dev.mysql.com/get/mysql80-community-release-el9-1.noarch.rpm](https://dev.mysql.com/get/mysql80-community-release-el9-1.noarch.rpm)`
`sudo dnf install mysql-community-server`

을 했더니 이번엔 GPG 키에러가 발생함ㅜ Amazon Linux 2 에서 지원하지 않는 버전의 레포지토리를 설치했기 때문이라고

`sudo rpm --import [https://repo.mysql.com/RPM-GPG-KEY-mysql-2022](https://repo.mysql.com/RPM-GPG-KEY-mysql-2022)`

로 GPG키 연결을 해준 후 `sudo yum update` 으로 yum 업데이트까지해준 후 설치 성공했다

![images](/assets/images/alone/IMG-20240925132203-1.png)
설치 성공하여 버전정보가 조회되는것을 확인함

`mysql -u {마스터명} -p -h {엔드포인트}` 로 접속. 
비밀번호치라고나오는데 마스터명, 비밀번호 모두 RDS 생성할때 적용한걸로 사용하면됨

![images](/assets/images/alone/IMG-20240925132203-2.png)

비밀번호치고 `show databases;` 로 쿼리가 실행되는지 확인

