---
생성일: Invalid date
태그:
  - 모든 개발자를 위한 HTTP 웹 기본지식
---
## HTTP(HyperText[HTML] Transfer Protocol)

처음에는 HTML을 담아 전송하는 것이었으나 지금은 모든 것을 담아서 전송 가능함.

HTML, TEXT, 이미지, 음성, 영상, JSON, XML(API) 등등 모든 형태의 데이터, 서버간의 데이터를 주고받을때도 사용함

TCP프로토콜을 사용하는 경우는 거의 없고 HTTP를 사용함. 게임에나 TCP를 쓰는데 요즘은 모바일게임에도 HTTP를 사용함

1997년에 나온 HTTP/1.1을 가장 많이 사용함.

- 기반 프로토콜
    - TCP: HTTP/1.1, HTTP/2 - 속도가 빠르지않음
    - UDP: HTTP/3 - 속도보완을 위해 나옴
    - 현재 HTTP/1.1 주로 사용
        - HTTP/2, HTTP/3 도 점점 증가
- 특징
    - 클라이언트 서버 구조
        - request, response 구조
        - 클라이언트는 서버에 요청을 보내고, 응답을 대기
        - 서버가 요청에 대한 결과를 만들어서 응답
    - 무상태 프로토콜(스테이리스), 비연결성
        - 서버가 클라이언트의 상태를 보존x(stateless)
            - stateful(상태보존)와 stateless(무상태)의 차이
                
                서버가 클라이언트의 값을 유지하냐 유지하지 않냐의 차이.
                
                - statefull - 어떤 상품을 선택했는지, 어떤 결제 수단을 선택했는지 다음 단계에도 계속 값을 유지중임
                    
                    → 중간에 직원이 바뀌지 않는다고 가정하고 로직을 짜기때문에 직원이 바뀌면 문제가 생김
                    
                    ![[assets/images/HTTP 기본/IMG-20240910101943.png|IMG-20240910101943.png]]
                    
                    서버 장애 시 문제 발생
                    
                - stateless - 어떤 상품을 선택했는지, 어떤 결제 수단을 선택했는지 다음 단계에서 값을 날림. 결제수단을 선택할때 의식적으로 어떤 상품을 선택했는지 알려줘야하는 것
                    
                    → 중간에 직원이 바뀌어도 문제가 되지않도록 로직을 짜기때문에 직원이 바뀌어도 상관없음
                    
                    ⇒ 갑자기 클라이언트의 요청이 증가해도 서버를 대거 투입가능함.  
                    응답 서버를 쉽게 바꿀수 있기때문에 무한한  
                    **서버 증걸이 가능**함.
                    
                    ![[assets/images/HTTP 기본/IMG-20240910101943-1.png|IMG-20240910101943-1.png]]
                    
                    서버 1에 문제가 생기면 그대로 서버2로 요청을 보내면된다.
                    
                    그러나 로그인 같은 경우는 상태를 유지해야하기때문에 브라우저의 쿠키와 서버 세션 등을 사용해서 상태를 유지함
                    
        - 장점 - 서버 확장성이 높음(스케일 아웃)
        - 단점 - 클라이언트가 추가 데이터를 전송해줘야함
    - HTTP 메세지
    - 단순함, 확장가능

### 비 연결성(connectionless)

- 연결을 유지할 때
    - 여러 클라이언트와 연결 시 각 클라이언트마다 서버가 연결을 유지한 상태임 → 서버 자원 소모
- 연결을 유지하지 않을 때
    - 여러 클라이언트와 연결 시 각 요청이 끝나면 연결을 종료시켜버림 → 서버가 연결을 유지하지 않아 최소한의 자원 유지

⇒ 연결을 유지 하지 않는 것이 효율적임

- HTTP는 기본이 연결을 유지하지 않음.
- 일반적으로 초단위 이하의 빠른 속도로 응답함
- 1시간동안 수천명이 서비스를 사용해도 실제 서버에서 동시에 처리하는 요청은 수십개 이하로 매우 적음(웹 브라우저에서 연속으로 검색 버튼만 누르는 일은 거의 없음)
- 한계와 극복
    - TCP/IP연결을 새로 맺어야 함 → 3 way handshake(syn, ack) 시간 추가
    - 웹 브라우저로 사이트를 요청하면 HTML 뿐만 아니라 자바스크립트, css, 추가 이미지 등 수 많은 자원이 함께 다운로드 됨
    - 지금은 HTTP 지속 연결(Persistent Connerctions)로 문제 해결
        
        ![[assets/images/HTTP 기본/IMG-20240910101943-2.png|IMG-20240910101943-2.png]]
        
    - HTTP/2, HTTP/3에서 더 많은 최적화

❗최대한 stateless로 개발해야 동시에 여러 사람이 몰리는 이벤트에서 서버가 터지지 않을 가능성이 높음!!!!!!!!!!!!!!!!!!!!!!!!

보통 최대한 풀기 위해 첫 페이지는 아무런 요청이없는 순수 html로 만들고 이벤트를 접수할 수 있도록 처리함

### HTTP 메세지

![[assets/images/HTTP 기본/IMG-20240910101943-3.png|IMG-20240910101943-3.png]]

![[assets/images/HTTP 기본/IMG-20240910101944.png|IMG-20240910101944.png]]

공식 스펙  
  
[https://tools.ietf.org/html/rfc7230#section-3](https://tools.ietf.org/html/rfc7230#section-3)

  

- 시작라인
    - 요청 메세지(request-line**)**
        - start-line = **request-line** / status-line
        - **request-line** = method SP(공백) request-target[요청대상] SP HTTP-version CRLF(엔터)
        - HTTP 메서드 (GET, POST, PUT, DELETE…) - 서버가 수행해야 할 동작 지정
        - 요청 대상 (/search?q=hello&hl=ko) - (절대경로[?쿼리])
        - HTTP Version
    - 응답 메세지(status-line)
        - start-line = request-line / **status-line**
        - **status-line** = HTTP-version SP status-code[상태코드] SP reason-phrase CRLF
        - HTTP 버전
        - HTTP 상태 코드: 요청 성공, 실패를 나타냄
            - 200: 성공
            - 400: 클라이언트 요청 오류
            - 500: 서버 내부 오류
            - 이유 문구: 사람이 이해할 수 있는 짧은 상태 코드 설명 글

- HTTP 헤더
    - header-field = field-name ":" OWS field-value OWS (OWS:띄어쓰기 허용)
    - field-name은 대소문자 구문 없음
    - HTTP 전송에 필요한 모든 부가정보
        - Ex) 메시지 바디의 내용, 메시지 바디의 크기, 압축, 인증, 요청 클라이언트(브라우저) 정보,서버 애플리케이션 정보, 캐시 관리 정보...
    - 표준 헤더가 너무 많음
        - [https://en.wikipedia.org/wiki/List_of_HTTP_header_fields](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields)
    - 필요시 임의의 헤더 추가 가능
        - helloworld: hihi

![[assets/images/HTTP 기본/IMG-20240910101945.png|IMG-20240910101945.png]]

Host : www. 이건안됨. host귀에 OWS가 없음

- HTTP 메세지 바디
    - 실제 전송할 데이터
    - HTML 문서, 이미지, 영상, JSON 등 byte로 표현할 수 있는 모든 데이터 전송 가능