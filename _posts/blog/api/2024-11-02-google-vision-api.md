---
title: "[Google Vision API 연동] 이미지 분석 API 사용하기"
category: 외부API연동
tags:
  - spring
  - kotlin
  - google
  - ec2
last_modified_at: 2024-11-03
---

## 발단

친구들과 사용할 서비스를 구현 도중, 친구들이 원하는 요구사항을 듣다보니 
메신저 캡처를 내가 구현한 서비스에서 자동 변환해주는 기능이 필요하다고 판단하였다

메신저 캡처를 db로 변환하기 위해서 google cloud vsion api의 텍스트 인식 기능을 사용하기로 결정하였다
### Google Vision Ai

[https://cloud.google.com/vision?hl=ko](https://cloud.google.com/vision?hl=ko)

구글에서 제공하는 머신러닝 기반 이미지 분석 AI로 이미지의 텍스트를 인식하고 텍스트의 위치정보도 응답받을 수 있는 open api이다

---

## 구현
### 사전 설정

1. [구글 클라우드](https://cloud.google.com/vision/)에 접속하여 새 프로젝트를 개설해준다
	
	![image](/assets/images/api/IMG-20250520152834.png)
	![image](/assets/images/api/IMG-20250520152834-1.png)
2. 서비스 계정에서  Json 키를 발급받는다
	
	![image](/assets/images/api/IMG-20250520152835.png)
	![image](/assets/images/api/IMG-20250520152835-1.png)
	![image](/assets/images/api/IMG-20250520152835-2.png)
	![image](/assets/images/api/IMG-20250520152835-3.png)
	생성된 서비스 계정에서 키 탭으로 들어가 키 추가 -> 새키만들기 -> JSON 비공개 키를 만들어준다
	![image](/assets/images/api/IMG-20250520152835-4.png)
3. [google cloud vision api](https://console.cloud.google.com/apis/library/vision.googleapis.com?inv=1&invt=Abw0Rg&project=silken-zenith-440207-u0) 에 들어가서 사용 설정을 해준다

### api 사용하기

1. [공식문서](https://cloud.google.com/vision/docs/detect-labels-image-client-libraries?hl=ko#client-libraries-install-java)에 나온 google cloud vision api 클라이언트 라이브러리 버전을 gradle에 추가해준다
	```
	implementation 'com.google.cloud:google-cloud-vision:3.59.0'
	```

2. 미리 받아놓은 JSON 키를 환경변수로 등록해준다. .evn 파일로 관리중이라면 하던방식대로 해주어도 무방하다
	InteliJ를 사용중이라 오른쪽 상단의 RUN의  Edit Configuartions에서 환경변수를 등록해주었다
	![image](/assets/images/api/IMG-20250520152836.png)
	![image](/assets/images/api/IMG-20250520152836-1.png)
	추가 버튼을 누른 후 Json 파일이 저장된 경로를 절대 경로로 지정해주었다
	이 비공개키는 절대로 외부에 노출이되면안되기때문에 나는 위험요소를 제거하기위해 프로젝트 폴더 외부에 파일을 위치시켰다.
	ec2에도 파일을 옮겨두면 배포 서버에서도 사용가능하다
3. Vision Api 호출
	예시로 이미지 파일을 업로드 받아 Vision API로 텍스트를 추출하는 컨트롤러를 작성해 보았다
	```kotlin
	@PostMapping("/test")  
	fun test(@RequestPart image: MultipartFile) {  
	    val imgBytes = image.bytes  
	    val img = Image.newBuilder().setContent(ByteString.copyFrom(imgBytes)).build()  
	    val feat = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build()  
	    val request = AnnotateImageRequest.newBuilder()  
	        .addFeatures(feat)  
	        .setImage(img)  
	        .build()  
			  
	    val requests: MutableList<AnnotateImageRequest> = mutableListOf(request)  
	  
	    ImageAnnotatorClient.create().use { client ->  
	        val response = client.batchAnnotateImages(requests)  
			
			//로직 구현
	    }  
	}
	```

이미지를 업로드하고 디버그를 해보았을때,
- 사용이미지
	
	![image](/assets/images/api/IMG-20250520152836-2.png)

- 결과
	
	![image](/assets/images/api/IMG-20250520152836-3.png)

	response 안의 responses 배열의 fullTextAnnotation_의 text_ 변수 안에 전체 텍스트가,
	textAnnotations안에 각각 단어 배열이 있는 것을 확인할 수 있다

	![image](/assets/images/api/IMG-20250520152836-4.png)
	또한 fullTextAnnotaion의 pages -> blocks -> paragraphs -> boundingBox -> vertices 배열에 보면 X, Y 좌표를 알수 있으며, 
	fullTextAnnotaion의 pages -> blocks -> paragraphs -> words 배열에서 각 배열의 text를 보면 한 배열 별로 한 행의
	![image](/assets/images/api/IMG-20250520152836-5.png)
	words 배열이 한 문장, sysbols배열이 한 문장의 각 낱말로 이루어져있다
	
	```
	{
	  "fullTextAnnotation": {
	    "text": "안녕\n테스트",
	    "pages": [{
	      "blocks": [{
	        "paragraphs": [{
	          "words": [{
	            "symbols": [{"text": "안"}, {"text": "녕"}]
	          },
	          {
		          "symbols": [{"text": "테"}, {"text": "스"}, {"text": "트"}]
	          }]
	        }]
	      }]
	    }]
	  }
	}
	```
	이런 구조라고 생각하면 될것이다
	
	응답받은 response로 서비스 로직을 구현해주면된다

### EC2에 파일 전송
구글 api 인증을 Json 키 파일로 하고있는데, <mark class="hltr-red">이 파일을 git 에 업로드하면 안되기때문에</mark> 환경변수로 지정을 해주었다
미리 .gitignore 로 제외하길 바란다(나는 실수할까봐 프로젝트 외부 파일에 파일을 저장해두었다)

배포중인 서비스에서 Json 키 파일을 환경변수에 절대 경로로 등록하기 위해서 EC2 내부에 로컬 파일을 전송해 줄 필요가 있다

`scp [옵션] [key.pem File] [EC2 호스트 이름]@[EC2 퍼블릭 ip]:[송신 파일] [수신 경로]`

해당 명령어를 실행해주면
이동시킬 파일 명이 한번 더 출력되고 종료된다
ec2 쉘에 접속해 [수신 경로]로 이동하여 ls명령어를 사용해보면
![image](/assets/images/api/IMG-20250520152837.png)
전송한 파일 경로가 있는 것을 확인 가능하다
이제 배포 환경에서 환경변수를 지정해주면 되는데 간단하게

`export [변수명]=[파일 절대 경로]` 로 지정해주어도 되지만, 이렇게되면 주기적으로 환경변수를 재 지정해주어야하기때문에
`vi ~/.bashrc` 명령어로 bashrc파일을 열어준 후
![image](/assets/images/api/IMG-20250520152837-1.png)
가장 하단에 환경 변수를 지정해주고
`source ~/.bashrc` 명령어를 실행해주면 ec2에서도 환경변수를 영구히 사용할 수 있다

