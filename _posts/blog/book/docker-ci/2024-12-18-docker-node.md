---
title: "[따라하며 배우는 도커와 CI 환경] 도커를 이용한 간단한 Node.js 애플리케이션 만들기"
category: Docker
tags:
  - docker
  - 책요약
---

1. 노드를 설치해준 후 생성한 node app폴더에서 `npm init -y`명령어로 package.json 파일을 생성해준다
2. pakege.json파일의 메인파일을 Index.js -> service.js 로 수정해준다
	```js
	{
		"name": "nodesjs-docker-app",

		"version": "1.0.0",
		
		"main": "server.js", //이부분은 index.js -> server.js 로 변경
		
		"scripts": {
		
			"test": "echo \"Error: no test specified\" && exit 1"
		
		},
		
		"keywords": [],
		
		"author": "",
		
		"license": "ISC",
		
		"description": ""
		
		}
	
	```
3. 프로젝트에 필요한 종속성 추가
	```js
	{
		
		"name": "nodesjs-docker-app",
		
		"version": "1.0.0",
		
		"main": "server.js",
		
		"dependencies": { //이부분 추가
		
			"express": "^5.1.0"
		
		},
		
		"scripts": {
		
			"test": "echo \"Error: no test specified\" && exit 1"
		
		},
		
		"keywords": [],
		
		"author": "",
		
		"license": "ISC",
		
		"description": ""
		
		}
	```
	이번에 사용할 종속성은 익스프레스 모듈.
	종속성은 자바스크립트와 jQuery의 관계처럼 Node.js의 API를 단순화하고 새로운 기능들을 추가해서 Node.js 를 더 쉽고 유용하게 사용할 수 있도록 돕는 모듈임
4. 진입점이 되는 파일인 server.js파일을 pakege.js 파일과 같은 디렉토리에 생성
	```js
	//Express 모듈 불러오기
	
	const express = require('express')
	
	  
	
	//Express 서버를 위한 포트 설정
	
	const PORT = 8250
	
	  
	
	//새로운 Express 애플리케이션 생성
	
	const app = express()
	
	  
	
	// '/'경로로 로청이 들어오면 "반갑습니다." 라는 결과값을 전달
	
	app.get('/', (req, res) => {
	
	res.send("반갑습니다.")
	
	})
	
	  
	  
	
	//해당 포트에 애플리케이션을 시작
	
	app.listen(PORT, () => {
	
	console.log("애플리케이션 실행")
	
	})
	```
5. 도커 파일 생성
	```dockerfile
	FROM node
	
	  
	
	WORKDIR /usr/src/app
	
	  
	//package.json은 컨테이너 밖에 있기때문에 컨테이너 안으로 넣어주는 작업을 먼저 해야함
	//로컬 컴퓨터에 있는 packge.json을 도커 컨테이너 안으로 복사
	//COPY ./ ./ 명령어로 모든 파일을 복사해도되지만 이렇게되면 
	//모듈의 변화가 생겼을때 불필요한 파일도 다운받아짐
	//종속성 변경 유무를 알려주는 pagckege.js 파일 먼저 복사했기때문에 
	//server.js 파일에 변경이 일어나도 종속성 부분은 재 다운하지않고 캐시를 이용해 처리함
	COPY package.json ./
	
	  
	//2. 
	RUN npm install
	
	  
	
	COPY ./ ./
	
	  
	
	CMD [ "node", "server.js" ]
	```
	- FROM
		- 이미지 생성 시 기반이 되는 이미지 레이어를 명시
		- <이미지 이름>:<태그> 형식으로 작성(ex. ubuntu:14.04)
		- 태그를 붙이지않으면 가장 최신 버전으로 내려받음
	- RUN
		- 도커 이미지가 생성되기 전에 수행할 셸 명령어
	- CMD
		- 컨테이너가 시작됐을때 실행할 실행파일 or 셸 스크립트
		- 도커 파일 내에서 한번만 사용 가능함
	- WORKDIR
		- 도커 파일에서 뒤에오는 모든 지시자(RUN, CMD, COPY, ADD 등)에 대한 작업 디렉터리 설정. 리눅스 명령어의 cd와 비슷한 역할
		- WORKDIR을 통해 작업 디렉터리를 별도로 지정하면 로컬 파일들이 도커 컨테이너로 복사될때 지정 작업 디렉터리 안으로 복사됨
6. 이름과 함께 이미지를 빌드 `docker build -t <도커 ID>/<프로젝트 이름> ./`
7. 도커 컨테이너 실행 `docker run -p <로컬 호스트 포트>:<컨테이너 속 포트> <이미지 이름>/<프로젝트 이름>`
	- <로컬 호스트 포트>:<컨테이너 속 포트> 란?
	  브라우저에서 Node.js애플리케이션 접속을 위한 포트매핑
	  
	![image](/assets/images/docker-ci/IMG-20250521171250.png)
	
	![image](/assets/images/docker-ci/IMG-20250521171250-1.png)
	localhost:5000으로 접속하면 반갑습니다가 출력된다
8. server.js파일 수정 시 6, 7번 명령어를 다시 실행해야 변경사항이 적용됨

![image](/assets/images/docker-ci/IMG-20250521171251.png)
책에서 에러날거라고했는데 왜...나는 되는것임? 일단 되니까 넘어가자

---
## 도커 볼륨
앞선 작업에서는 COPY 지시자를 통해 소스코드를 복사했으나 도커볼륨을 이용했을때는 도커 컨테이너에서 로컬 호스트의 디렉터리에 있는 파일을 계속 참조하므로 소스코드를 변경해도 다시 빌드할 필요가없음
![image](/assets/images/docker-ci/IMG-20250521171251-3.png)
- 도커 볼륨을 사용해 애플리케이션 실행: `docker run -d -p 5000:8250 -v /usr/src/app/node_modules -v $(pwd):/usr/src/app/nunnunnu/node-app`
	- pwd: 현재 작업중인 디렉터리 절대경로를 출력(윈도우는 %cd%). 
	- $(pwd):/usr/src/app/nunnunnu/node-app: 도커 볼륨은 컨테이너 안에서 호스트 디렉터리의 파일이나 폴더를 참조하기때문에 pwd명령어를 이용해 출력된 절대경로 + 쌍점 뒤에 있는 작업 디렉터리 참조
	- -v /usr/src/app/node_modules: 도커 볼륨이 참조하면 안되는 폴더 지정. node_modules폴더가 호스트 디렉터리에 없기때문에 지정해줌
	- -d: detach 의 약자. 컨테이너를 실행한 후 컨테이너 id만 출력하고 컨테이너에서 나오는 명령어. 백그라운드에 컨테이너를 실행하고 원래 터미널상태로 돌아옴


---

## 도커 컴포즈
- 도커 컴포즈: 다중 컨테이너인 도커 애플리케이션을 정의하고 실행하기위한 도구

도커 컴포즈를 이해하기위해 redis를 활용한 Node 애플리케이션을 실습해볼것임(레디스는 이미 이해하고있기때문에 자세한 설명은 생략함)

1. 실습을 진행할 디렉터리에서 `npm init` 명령어를 통해 기본 세팅을 해준다(자세한 세팅이 필요없다면 위에서 처럼 `npm init -y`로 생생해주어도 무방함)
2. 프로젝트에 필요한 종속성과 시작 시 사용할 스크립트 추가
	```js
	{
	
	"name": "docker-compose-app",
	
	"version": "1.0.0",
	
	"main": "server.js",
	
	"scripts": {
	
		"start": "nodemon server.js",
		
		"test": "echo \"Error: no test specified\" && exit 1"
	
	},
	
	"dependencies": {
		
		"express": "4.17.1",
		
		"redis": "3.0.2",
		
		"nodemon": "*"
	
	},
	
	"author": "",
	
	"license": "ISC",
	
	"description": ""
	
	}
	```
	
	종속성 부분에 express를 추가하고 레디스 사용을 위해 redis 모듈도 추가함
	nodemon 모듈은 소스코드를 수정하고 저장하면 자동으로 서버를 다시 시작해서 변경사항을 애플리케이션에 바로 반영해주는 모듈임
	
	"start": "nodemon server.js" 로 시작시 사용할 스크립트를 넣어줌.(원래는 node <시작점 파일 이름>으로 지정해주어야하나 nodemon모듈을 사용하기위해 nodemon을 선언해주었음)
3. server.js 파일 생성
	```js
	//Express 모듈 불러오기

	const express = require("express")
	
	  
	
	//Express App 생성
	
	const app = express()
	

	
	const redis = require('redis')
	

	//redis 클라이언트 생성
	
	const client = redis.createClient( {
		
		host: 'redis-server',
		
		port: 6379
	
	})
	
	  
	
	app.get('/', (req, res) => {
	
	res.send("ㅎㅇ")
	
	})
	
	  
	
	//Express App시작
	
	app.listen(8888, () => {
	
	console.log("실행")
	
	})
	```
4. redis 코드 생성 - 접속할때마다 1씩 오르는 서비스
	```js
	//Express 모듈 불러오기
	
	const express = require("express")
	
	  
	
	//Express App 생성
	
	const app = express()
	
	  
	
	const redis = require('redis')
	
	  
	
	const client = redis.createClient( {
		
		host: 'redis-server',
		
		port: 6379
	
	})
	
	  
	
	client.set("number", 0)
	
	  
	  
	
	app.get('/', (req, res) => {
		
		client.get("number", (err, number) => {
			
			res.send("숫자 1 올라감" + number)
			
			client.set("number", parseInt(number) + 1)
			
		})
		
	})
	
	  
	
	//Express App시작
	
	app.listen(8888, () => {
	
		console.log("실행")
	
	})
	```
5. 도커파일 작성
	```dockerfile
	//기반이 될 베이스 이미지 생성
	
	FROM node:10
	
	  
	
	//작업디렉터리 지정
	
	WORKDIR /usr/src/app
	
	  
	
	//종속성 재 다운을 막기위해 package.json 파일부터 먼저 복사
	
	COPY package.json ./
	
	  
	
	//종속성 내려받음
	
	RUN npm install
	
	  
	
	//package.js 제외 파일들 복사
	
	COPY ./ ./
	
	  
	
	//컨테이너가 시작되면 실행될 명령어
	
	CMD ["node", "server.js"]
	```
6. `docker run redis`명령어를 통해 redis 이미지를 통한 도커 컨테이너 실행
7. 도커 파일로 도커 이미지 생성 -> 에러 나야 정상임
	![image](/assets/images/docker-ci/IMG-20250521171251-4.png)
	
	아직 redis 연결 설정을 하지않아서 에러나는게 정상임
	현재 생성한 <mark class="hltr-cyan">노드 앱 컨테이너와 6번에서 설치한 레디스 컨테이너 사이의 연결이 막힌 상황</mark>
	컨테이너는 기본으로 격리된 상태로 생성되기때문에 외부와 통신할 수 없음. 통신을 하려면 필요한게 바로 <mark class="hltr-red">도커 컴포즈</mark>

### 도커 컴포즈 파일 작성
도커 컴포즈 파일의 이름은 docker-compose.yaml 또는 docker-compose-yml 임
규격 버전이 있으며 파일의 규격에 따라 지원하는 옵션이 다름.(이번엔 버전 3으로 사용)

![image](/assets/images/docker-ci/IMG-20250521171252.png) 

```js
version: "3"

services:

	redis-server:

		image: "redis"

node-app:

	build: .
	
	ports:

		- 5001:8888
```
- version - 도커 컴포즈의 버전
- services - 이곳에 실행하려는 컨테이너들을 정의
- redis-server - 컨테이너 이름
- image - 컨테이너에서 사용하는 이미지
- node-app - 컨테이너 이름
- build - 현 디렉터리에 있는 Dockerfile 사용
- ports - 포트 매핑 로컬 포트 : 컨테이너 포트

`docker-compose up`명령어로 도커 컨테이너를 띄우면 yaml에서 5001:8888으로 포트를 지정해주었으니 localhost:5001로 접속 가능하다

![image](/assets/images/docker-ci/IMG-20250521171252-1.png)

서버 코드에 변경이 필요하다면 `docker-compose up --build`명령어로 재 빌드하면서 실행하면 반영된다
또한 `docker-compose stop`으로 정지 가능하고, 정지가 아닌 삭제가 하고싶다면 `docker-compose down`으로 삭제하면된다. down 은 컨테이너와 네트워크까지 모두 삭제함

![image](/assets/images/docker-ci/IMG-20250521171252-2.png)

새로고침할때마다 숫자 1이 증가한다

---

...몰랐는데 다음장에서 react를 쓴다.

지금 react를 배우기엔 너무 오래걸릴거같으니 다른책으로 넘어가야겠다..