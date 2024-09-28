---
title: "[스프링 부트와 AWS로 혼자 구현하는 웹 서비스] 8장 EC2 서버에 프로젝트를 배포해 보자"
category: AWS
tags:
  - spring
  - aws
  - 스프링부트와AWS로혼자구현하는웹서비스
  - ec2
  - 배포
  - 책요약
last_modified_at: 2024-03-02
---
`sudo yum install git` 으로 git 먼저 설치

`mkdir ~/app && mkdir ~/app/step1` → `cd ~/app/step1` 먼저 git clone 할 경로 먼저 만들어주고 git clone 

`./gradlew test`로 빌드되는지 확인	
=> 빌드 중 멈춤 현상 발생하여 스왑 메모리 설정으로 해결하였다. (자세한 내용은 [[EC2] Spring boot 프로젝트 Gradle 빌드 멈춤 현상 해결](https://nunnunnu.github.io/swap%EB%A9%94%EB%AA%A8%EB%A6%AC/) 참고)

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
