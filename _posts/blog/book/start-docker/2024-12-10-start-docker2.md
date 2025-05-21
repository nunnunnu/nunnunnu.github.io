---
title: "[시작하세요! 도커/쿠버네티스] 도커엔진 2"
category: Docker
tags:
  - docker
  - 책요약
last_modified_at: 2024-12-12
---

###### 도커 볼륨
도커 이미지로 컨테이너를 생성하면 이미지는 읽기전용이 되기때문에 컨테이너의 변경사항만 별도 저장하여 각 컨테이너의 정보를 보존함.

도커 이미지(읽기전용):mysql - 도커 컨테이너(쓰기가능):컨테이너 레이어

만약 컨테이너를 삭제하면 도커 컨테이너 계층의 정보도 모두 삭제되는 단점이있음. 그래서 이런 정보를 영속적으로 관리하기위해 사용하는것이 도커 볼륨
- 호스트와 볼륨 공유
	- `docker run -d --platform linux/amd64 --name wordpressdb_hostvolume -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=wordpress -v /home/wordpress_db:/val/lib/mysql mysql:5.7`
	- `docker run -d -e WORDPRESS_DB_PASSWORD=password --name wordpress_hostvolume --link wordpressdb_hostvolume:mysql -p 80 wordpress`
	-v 로 공유한 디렉토리에 
	![image](/assets/images/start-docker/IMG-20250521165047-2.png)volume이 붙은걸 확인가능
	
	나는 파일 쉐어설정이 안돼서..;; 그냥 Users파일에 -v에 Users디렉토리를 선택함
	
	이렇게 해두면 위에 생성한 두 컨테이너를 삭제해도 호스트에 볼륨으로 지정한 폴더는 남아있음. 당연하게도 폴더단위가 아니라 파일단위로도 가능하며 동시에 여러개 지정도 가능함
	
	참고로 호스트폴더에 이미 파일이있는경우에는 덮어쓰기되니까 주의할것.
- 볼륨 컨테이너
  
	`docker run -i -t --name volumes_from_container --volumes-from volume-overide ubuntu:14.04`
	
	호스트에 볼륨을 두는것이아닌 볼륨용 컨테이너를 생성함
	
	앞으로 여러개의 컨테이너가 동일한 컨테이너에 volumes-from 옵선을 사용하면 볼륨을 공유해서 사용하는것도 가능함
- <mark class="hltr-cyan">도커볼륨</mark>
  
	docker volume 명령어를 사용하는것. `docker volume create --name myvolume`
	
	![image](/assets/images/start-docker/IMG-20250521165047-3.png)
	
	해당 볼륨을 사용하려면 컨테이너 생성 시 `docker run -i -t --name myvolume1 -v myvolume:/root/ ubuntu:14.04` 
	
	해당 컨테이너에서 `echo hello >> /root/volume`로 볼륨 내에 파일을 생성한 후 다른컨테이너에 같은 볼륨을 지정한 후 root폴더를 조회해보면
	
	![image](/assets/images/start-docker/IMG-20250521165047-4.png)
	
	파일이 잘 공유되는것이 확인됨
	
	`docker inspect --type volume myvolume`로 볼륨의 대한 상세 정보 조회 가능
	
	![image](/assets/images/start-docker/IMG-20250521165048.png)
	
	컨테이터생성시 -v로 지정한 볼륨이 없다면 컨테이너생성동시에 생성됨
	
	볼륨 전체 삭제는 docker volume prune

###### 도커 네트워크

컨테이너 생성 시 docker0 브리지를 통해 외부와 통신환경을 사용하게되나 다른 네트워크 드라이버도 사용가능함

브리지, 호스트, 논, 컨테이너, 오버레이 가있음

- 브리지 네트워크 
  
  `docker network create --driver bridge mybridge` 생성
  
  `docker run -i -t --name mynetwork_container --net mybridge ubuntu:14.04` 연결
  
  `docker network ls`로 생성네트워크 확인가능
  
  ![image](/assets/images/start-docker/IMG-20250521165048-1.png)
  
  오타가 나긴했는데 생성할때 bridge로 만들어서 DRIVER가 bridge임
  
  `docker network disconnect mybridge mynetwork_container` 연결 해제
  
  `docker network connect mybridge mynetwork_container` 연결
  
  단, 논 네트워크, 호스트 네트워크에서는 connect disconnect 명령어 사용이 불가능함
  
  브리지, 오버레이같이 특정 ip대역을 가지는 네트워크모드에서만 사용가능
  
  - --net-alias 명령어와 함께 쓰면 특정 호스트 이름으로 여러개의 컨테이너에 접근 가능
    
    `docker run -i -t --name mynetwork_container --net mybridge --net-alias alicek106 ubuntu:14.04` -> `docker run -i -t --name mynetwork_container --net mybridge --net-alias alicek106 ubuntu:14.04`
    
    별칭을 통해 네트워크를 지정한다고 같은 ip주소를 공유하는것은 아니고 매번 달라지는 ip주소는 라룬드 로빈 방식으로 결정됨
    
    생성한 컨테이너에 접근할 새 컨테이너를 생성한 후 네트워크 ping요청을 별칭을 통해 전송하면
	`ping -c 1 alicek106` 각 연결된 컨테이너의 네트워크 정보를 볼수있음
	
	이렇게 별칭을 통해 등록한 네트워크들은 사용자가 정의한 브리지네트워크에서 사용되는 내장 DNS서버를 가지며(127.0.0.11) DNS서버에 alicek106이라는 호스트 이름으로 저장됨
	
	mybridge네트워크에 속한 컨테이너에서 alicek106라는 호스트이름으로 접근하면 라운드로빈방식을 사용해 컨테이너의 ip리스트를 반환하는데 ping명령어는 이 리스트에서 첫번째 ip를 사용함. 라운드로빈방식의 특성상 조회할때마다 순서가 달라지므로 매번 다른 ip로 ping이 전송됨 
	
> [!NOTE]
> 
> 서브넷, 케이트웨이, ip할당범위등을 임의로 설정하려면 네트워크 생성 시 지정해줘야함. 단, --subnet과 --ip-range는 같은 대역이여야함
> 
> `docker network create --driver=bridge --subnet=172.72.0.0/16 --ip-range=172.72.0.0/24 --gateway=172.72.0.1 my_custom_netword`

- 호스트 네트워크
  
	`docker run -i -t --name network_host --net host ubuntu:14.04`
	
	호스트 모드를 사용하면 컨테이너 내부의 어플리케이션을 별도의 포트 포워딩 없이 바로 서비스가능.
	
	위에서 아파치 서버에 80포트로 바로 접속가능했던것이 이때문임
- 논 네트워크
  
	`docker run -i -t --name network-none --net none ubuntu:14.04`
	
	아무 네트워크도 안쓰는것. 외부와 연결이 단절됨
	 ![image](/assets/images/start-docker/IMG-20250521165048-2.png)
	 
	 로컬 호스트 ip만 조회됨
 - 컨테이너 네트워크
	 - docker run -i -t -d --name network_container_1 ubuntu:14.04` -> `docker run -i -t -d --name network_container2 --net container:network_container_1 ubuntu:14.04`
	 - 다른 컨테이너의 네트워크 설정을 그대로 쓸수있음
	 - 두 컨테이너에서 ifconfig를 조회하면 완전히 같은 결과가 나옴
- MacVLAN 네트워크
	- 호스트의 네트워크 인터페이스 카드를 가상화해 물리 네트워크 환경을 컨테이너에게 동일하게 제공
	- 따라서 MacVLAN을 사용하는 컨테이너들과 동일한 IP대역을 사용하는 서버 및 컨테이너들은 서로 통신이 가능함(MacVLAN을 사용하는 컨테이너는 기본적으로 호스트와 통신이 불가능함.)
	- `docker network create -d macvlan --subnet=192.168.0.0/24 --ip-range=192.168.0.64/28 --gateway=192.168.0.1 -o macvlan_mode=dridge -o parent=eth0 my_macvlan`
	- --ip-range=192.168.0.64/28 는 사용할 컨테이너의 ip범위. 컨테이너를 여러개 사용한다면 겹치지 않도록 설정해주어야함.
	- -o parent=eth0 부모 네트워크의 인터페이스를 지정해주어야해서 사용한 옵션
	- `docker run -it --name c1 --hostname c1 --network my_macvlan utunbu:14.04`

###### 도커 이미지
`docker search {검색어}`로 이미지를 검색가능. STARS가 즐찾 개수임

![image](/assets/images/start-docker/IMG-20250521165048-3.png)검색한 이미지를 pull로 내려받아 사용하는것도 가능하나 

`docker run -i -t --name commit_test ubuntu:14.04` -> `echo test_first >> first`
-> `docker commit -a CONTAINER eea3dc4f1d02 test` 로 커밋.

`docker images`로 조회하면 방금 커밋한 이미지가 조회됨

![image](/assets/images/start-docker/IMG-20250521165048-4.png)

TAG를 넣으려면 :{TAG}로 해주면되는듯함
