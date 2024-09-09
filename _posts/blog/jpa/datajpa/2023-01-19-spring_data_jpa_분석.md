---
생성일: 2023-01-19
하위태그:
  - 실전! 스프링 데이터 JPA
last_modified_at: 2023-01-19
category: JPA
tags:
  - jpa
  - 실전스프링데이터JPA
  - ORM
title: "[김영한 실전! 스프링 데이터 JPA] Spring Data Jpa 분석"
---
### 구현체 분석
- @Repository 적용: JPA 예외를 스프링이 추상화한 예외로 변환
- @Transactional 트랜잭션 적용 - jpa에서는 붙여야했으나 spring data jpa에서는 안붙여도됨
    - JPA의 모든 변경은 트랜잭션 안에서 동작
    - 스프링 데이터 JPA는 변경(등록, 수정, 삭제) 메서드를 트랜잭션 처리
    - 서비스 계층에서 트랜잭션을 시작하지 않으면 리파지토리에서 트랜잭션 시작
    - 서비스 계층에서 트랜잭션을 시작하면 리파지토리는 해당 트랜잭션을 전파 받아서 사용
    - 그래서 스프링 데이터 JPA를 사용할 때 트랜잭션이 없어도 데이터 등록, 변경이 가능했음(사실은 트랜잭션이 리포지토리 계층에 걸려있는 것임)
- @Transactional(readOnly = true)
    - 데이터를 단순히 조회만 하고 변경하지 않는 트랜잭션에서 readOnly = true 옵션을 사용하면 플러시를 생략해서 약간의 성능 향상을 얻을 수 있음
- <mark class="hltr-cyan">save() 메서드</mark>
    - 새로운 엔티티면 저장(persist) - isNew(entity)가 true면
    - 새로운 엔티티가 아니면 병합(merge) - isNew(entity)가 false면
    — 새로운 엔티티 구분 방법
    - 식별자가 객체일 때 null 로 판단
    - 식별자가 자바 기본 타입일 때 0 으로 판단 - int처럼 null이 올 수 없는 경우
    - Persistable 인터페이스를 구현해서 판단 로직 변경 가능
    
    기본키가 없으면 엔티티고 있으면 기존에있던 엔티티로 판단하는 듯.
    
    ![images](/assets/images/datajpa/IMG-20240909101927.png)
    
    근데 만약 임의로 기본키를 지정했는데 DB에 해당하는 기본키가 존재하지 않으면? insert구문으로 바꿔서 날림. = 비효율적
    
    데이터 변경을 변경감지 기능을 하용하고 저장은 persist를 사용하는게 나음. merge를 쓰지않겠다고 가정하고 코드를 짜면 됨.
    
    근데 만약! 기본키를 임의로 지정해줘야하는 순간이 온다면?
    
    ```java
    package com.spring.datajpa.entity;
    
    import java.time.LocalDateTime;
    
    import org.springframework.data.annotation.CreatedDate;
    import org.springframework.data.domain.Persistable;
    import org.springframework.data.jpa.domain.support.AuditingEntityListener;
    
    import jakarta.persistence.Entity;
    import jakarta.persistence.EntityListeners;
    import jakarta.persistence.Id;
    import lombok.AccessLevel;
    import lombok.NoArgsConstructor;
    
    @Entity
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @EntityListeners(AuditingEntityListener.class)
    public class Item implements Persistable<String>{
        @Id
        private String id;
    
        @CreatedDate 
        private LocalDateTime createdDate;
    
        public Item(String id){
            this.id=id;
        }
    
        @Override
        public String getId(){
            return id;
        }
    
        @Override
        public boolean isNew(){
            return createdDate==null;
        }
    }
    ```
    
    ```java
    package com.spring.datajpa.repository;
    
    import org.junit.jupiter.api.Test;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.boot.test.context.SpringBootTest;
    
    import com.spring.datajpa.entity.Item;
    
    @SpringBootTest
    public class ItemRepositoryTest {
        @Autowired ItemRepository itemRepository;
    
        @Test
        public void save(){
            Item item = new Item("a");
            itemRepository.save(item);
        }
    }
    ```
    
    저장 값의 등록일을 기준으로 판단하도록 오버라이딩함.