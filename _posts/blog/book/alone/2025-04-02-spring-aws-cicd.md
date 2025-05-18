---
title: "[스프링 부트와 AWS로 혼자 구현하는 웹 서비스] 9장 Travis CI 배포 자동화"
category: AWS
tags:
  - spring
  - 스프링부트와AWS로혼자구현하는웹서비스
  - aws
  - 책요약
  - CI/CD
---

- CI 서비스
	-  Travis CI
		깃허브에서 제공하는 무료 CI서비스. 
	- 젠킨스
		설치형이기때문에 이를 위한 EC2가 필요하기 때문에 프로젝트 규모에 따라 부담이 될 수도있음
	- AWS - codeBuild
		빌드 시간만큼 요금이 부과되는 구조라 초기에 사용하기엔 부담이 있음
위와 같은 특성으로 이번엔 Travis CI로 진행함
## Travis CI
[Travis CI](https://www.travis-ci.com/) 에서 깃허브 계정으로 로그인 후 