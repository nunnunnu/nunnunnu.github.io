---
title: "[스프링 부트와 AWS로 혼자 구현하는 웹 서비스] 8장 EC2 서버에 프로젝트를 배포해 보자"
category: AWS
tags:
  - spring
  - aws
  - 스프링부트와AWS로혼자구현하는웹서비스
  - ec2
  - 배포
last_modified_at: 2024-03-02
---
`sudo yum install git` 으로 git 먼저 설치

`mkdir ~/app && mkdir ~/app/step1` → `cd ~/app/step1` 먼저 git clone 할 경로 먼저 만들어주고 git clone 

`./gradlew test`로 빌드되는지 확인

- 빌드 중 멈춤 현상 발생

	구글링해보니 메모리 부족이슈라는 답을 얻었음..
	프리티어로안되나? 연습용으로 간단한 api 하나 만든 스프링프로젝트라 그럴리가 없는데?
 
	하던 도중 스택플로우에서 본 
	`sudo apt-get install lib32stdc++6`
	`sudo apt-get install lib32z1`
	
	이 두 명령어를 실행했는데! 안됨..
	
	결국 스왑메모리 설정을 해보기로 결정..

	참고로 스왑메모리는 ram이 부족하면 SSD나 HDD의 공간을 ram처럼 사용할수있는 메모리라고함!
	
	1. 하드디스크 용량 확인
		`df -h`
	2. 스왑메모리 확인 `free`
	3. 스왑 파일 생성 `sudo fallocate -l 2G /swapfile`
	4. 스왑 권한 설정 `sudo chmod 600 /swapfile`
	5. 파일적용 `sudo mkswap /swapfile` `sudo swapon /swapfile`
	6. 부팅시 스왑파일 활성화 `sudo nano /etc/fstab`
	- 할당 전 메모리
		![image](/assets/images/alone/Pastedimage20240406224840.png)
	- 할당 후 메모리
		![image](/assets/images/alone/Pastedimage20240406224827.png)

만약 프로젝트에 push했다면 pull로 땡겨서 하면됨

만약 권한없다는 permission denied 에러가 뜬다면 

`chmod +x ./gradlew` 로 권한 부여한 후 테스트수행

이 과정을배포할때마다 하면 귀찮으니 스크립트를 만들겟음

`vim ~/app/step1/deploy.sh`

```
#!/bin/bash

REPOSITORY=/home/ec2-user/app/step1
PROJECT_NAME=springboot-web-practise

cd $REPOSITORY/$PROJECT_NAME/

echo "> Git Pull"

git pull

echo "> 프로젝트 Build 시작"

./gradlew build

echo "> step1 디렉토리로 이동"

cd $REPOSITORY

echo "> Build 파일 복사"

cp $REPOSITORY/$PROJECT_NAME/build/libs/*.jar $REPOSITORY/

echo "> 현재 구동중인 어플리케이션 pid 확인"

CURRENT_PID=$(pgrep -f ${PROJECT_NAME}.*.jar)

echo "> 현재 구동중인 어플리케이션 pid: $CURRENT_PID"

if [ -z "$CURRENT_PID" ]; then
	echo "> 현재 구동 중인 어플리케이션이 없으므로 종료하지 않습니다."
else
	echo "> kill -15 $CURRENT_PID"
    kill -15 $CURRENT_PID
    sleep 5
fi

echo "> 새 어플리케이션 배포"

JAR_NAME=$(ls -tr $REPOSITORY/ | grep jar | tail -n 1)

echo "> JAR Name: $JAR_NAME"

nohup java -jar $REPOSITORY/$JAR_NAME 2>&1 &

```

`chmod +x ./deploy.sh` 실행권한 추가

`./deploy.sh` 으로 실행

vim nohup 으로가면 실행 애플리케이션 로그를 가지고있음

다음장인 CI/CD와 무중단 배포는 도서관 대여기간 이슈로 진행하지못하였다.. 다음에 다시 대여해서 정리해볼예정
