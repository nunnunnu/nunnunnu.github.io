---
title: "[사이드프로젝트 aws배포] DNS발급/연결 & HTTPS 설정"
category: AWS
tags:
  - aws
  - https
  - 배포
last_modified_at: 2024-04-20
---
## 도메인 발급

사이드 프로젝트의 비용절감을 위해 무료로 도메인을 발급받을 수 있는 [내도메인한국](https://xn--220b31d95hq8o.xn--3e0b707e/)에서 도메인을 발급받음
![images](/assets/images/aws/Pastedimage20240925164947.png)
등록하기로 뜨는 test-domain.kro.kr 이 등록가능한 도메인임

등록하기를 누르면 보안코드를 입력하고 도메인 관리에 선택한 도메인이 들어온걸 확인가능함

EC2의 퍼플릭 IP를 이미 발급받은 상태이기때문에 
![images](/assets/images/aws/Pastedimage20240925165403.png)
IP연결에 예시 한국 IP가 적힌 쪽에 퍼블릭 IP를 입력하고 저장해줌.

이까지만해줘도 도메인으로 접속하면 api호출이 가능하나 http로 접속이된다는 문제가있음
## aws 사용 (최종 사용하지 않았음)
### 인증서 발급

AWS Certificate Manager에서 인증서 먼저 발급(단 클라우드 프론트(CDN)는 https를 적용하려면 미국 동부 버지니아북부에서 발급받아야함)
![images](/assets/images/aws/IMG-20240925160329.png)
도메인 이름에 발급받은 무료 도메인을 지정한 후 생성함

route53에서 해당 도메인으로 생성하려했는데 aws에서 받은 도메인이 아니라그런지 생성이 안됨..

그러나 인증서 요청 상세에서 
![images](/assets/images/aws/IMG-20240925160329-1.png)
저 route53에서 레코드 생성으로 생성하면 일단 생성이 가능함.

또한 저기에있는 CNAME값으로 내도메인 한국의 CNAME에 값을 지정해주려고했으나![images](/assets/images/aws/IMG-20240925160330.png)실패함

알고보니 내가 cname의 값을 무지성으로 복붙했는데 <font color="#c0504d">.</font>은 떼고해야하는거였음

^^..

인증서 상태가 발급됨으로 바뀌었다면!

이제 ec2로 가서 대상그룹 생성

기본구성은 인스턴스로

![images](/assets/images/aws/IMG-20240925160330-1.png)

그리고 고급 상태검사 설정 -> 재정의

까지 해준 후 대상등록에서 인스턴스 선택 -> 아래에보류중인것으로 포함 -> 생성

### HTTPS 인증

로드밸런서 생성
![images](/assets/images/aws/IMG-20240925160330-2.png)
아래와같이 선택한 후 네트워크매핑에서 매핑(2개이상은 해야한다고함)

그리고 프로젝트에서 사용하는 보안그룹 선택
![images](/assets/images/aws/IMG-20240925160330-3.png)
리스너는 http와 https둘다 설정
![images](/assets/images/aws/IMG-20240925160330-4.png)
인증서 선택. 만약안뜨면 다시 발급받아야함

route 53에서 생성한 도메인 클릭, 레코드 생성에서 www 레코드 생성
![images](/assets/images/aws/IMG-20240925160330-5.png)

해치웠나?

![images](/assets/images/aws/IMG-20240925160330-6.png)
??

???????/

???????????????

알고보니 path가 /인 api가 있어야 가능한것이었음

getMapping으로 /가 path인 api를 생성하니 성공함!

## nignx/Let's Encrypt 사용

내도메인한국이 3개월단위로 새로운 도메인을 발급받아야한다고 함

만료일전에 연장하면 1년사용가능하다는데 혹시모르니..

그러나 사이드 프로젝트 정식 배포 후 백엔드 도메인을 정식으로 발급받게된다면 aws에서 인증서를 받아 다시 설정하게될수도있으나 지금은 해당 방법으로 배포를 진행하였다

1. nignx 설치

	`sudo apt-get install -y nginx nginx-common nginx-full`
2. 포트 포워딩

	`sudo iptables -t nat -L --line-numbers` 으로 포트 포워딩 관련 정책 번호를 확인
	
	num target prot opt source destination 형식으로 조회가 될텐데 첫번째 num의 위치에있는것이 포워딩 관련 정책번호임
	
	`sudo iptables -t nat -D PREROUTING {포트 포워딩 관련 정책 번호}` 으로 정책을 제거
	
1. 포워딩 코드 작성
	
	`sudo vi /etc/nginx/nginx.conf` 으로 nginx.conf를 열어 아래코드를 작성함
	```shell
	user www-data; 
	worker_processes auto; 
	pid /run/nginx.pid; 
	include /etc/nginx/modules-enabled/*.conf; 
	events {} 
	http { 
		upstream app { 
			server 127.0.0.1:8080; 
		} 
		server { 
			# 80번으로 요청이 오면 8080번 포트로 변경하여 연결
			listen 80; 
			
			location / { 
				proxy_pass http://app; 
			} 
		} 
	}
```
4. nginx 재시작

	`sudo service nginx restart`
5. 무료 인증서 발급
	
	1. `apt-get update -y`
	
	2. `apt-get install software-properties-common -y`
	
	3. `apt-get install certbot -y`
	
	4. `sudo certbot certonly -d {domain.com} --manual --preferred-challenges dns`
	
		순서대로 명령어 실행
		
		그럼 이메일을 입력하라고 뜰건데 본인 이메일을 입력까지하면
		
		이후로 약관이나 메일수신 등의 약관을 작성하면됨
	
		그럼 
		```
		Please deploy a DNS TXT record under the name 
			{hostName}.{domain} with the following value: {key}
		Before continuing, verify the record is deployed. 
		- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
		- Press Enter to Continue
		```
		라고 뜰텐데
	
		여기서 중요한것은 {hostName}과 {key}
	
		내도메인 한국으로 돌아가서
		![images](/assets/images/aws/Pastedimage20240925164440.png)
		ec2에 접속한 콘솔에서 축하메세지가 뜬다면 성공한것!
6. 포워딩 코드 수정
	
	`sudo vi /etc/nginx/nginx.conf`
	
	```shell
	user www-data; 
	worker_processes auto; 
	pid /run/nginx.pid; 
	include /etc/nginx/modules-enabled/*.conf; 
	events {} 
	http { 
		upstream app { 
			server 127.0.0.1:8080; 
		} 
		server { 
			# 80번으로 요청이 오면 8080번 포트로 변경하여 연결
			listen 80;  
			return 301 https://$host$request_uri; 
		} 
		
		server { 
			listen 443 ssl; 
			ssl_certificate /etc/letsencrypt/live/{도메인 URL}/fullchain.pem; 
			ssl_certificate_key /etc/letsencrypt/live/{도메인 URL}/privkey.pem; 
			ssl_protocols TLSv1 TLSv1.1 TLSv1.2; 
			ssl_prefer_server_ciphers on; ssl_ciphers ECDH+AESGCM:ECDH+AES256:ECDH+AES128:DH+3DES:!ADH:!AECDH:!MD5; 
			
			add_header Strict-Transport-Security "max-age=31536000" always; 
			ssl_session_cache shared:SSL:10m;
			ssl_session_timeout 10m; 
			 
			location / { 
				proxy_pass http://app; 
			} 
		} 
	}
	```
	그리고 인스턴스의 보안그룹-인바운드 규칙에서 HTTPS의 포트번호 443을 열어주어야함
	
	이까지하면 http.domain.com 으로 접속하여도 https.domain.com으로 변경되는것을 확인할 수 있음

만약 도메인이 만료되어 갱신하여야한다면
5-4와 6번 포워딩 코드의 {domain URL} 만 수정하면될것같다

---
***참고한 블로그***

- [https://steady-coding.tistory.com/629](https://steady-coding.tistory.com/629)
