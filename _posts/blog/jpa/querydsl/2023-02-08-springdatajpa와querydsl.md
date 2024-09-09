---
생성일: 2023-02-08
하위태그:
  - Querydsl
last_modified_at: 2023-02-20
title: "[김영한 Querydsl] Spring Data Jpa와 QueryDsl"
category: JPA
tags:
  - spring
  - jpa
  - querydsl
  - 김영한Querydsl
---
StringUtils.hasText → null과 “” 둘다 체크하는 방법!!!!!!!! 값이있으면 true, 없으면 false 반환

### 사용자 정의 repository

```java
package com.kyh.querydsl2.repository;

import java.util.List;

import com.kyh.querydsl2.dto.MemberSearchCondition;
import com.kyh.querydsl2.dto.MemberTeamDto;

public interface MemberRepositoryCustom {
    List<MemberTeamDto> search(MemberSearchCondition condition);
}
```

일단 querydsl을 사용할 repository를 만들어서 ~~ repositoryImpl 라는 이름으로 구현체를 만들어줌. 이름 규칙은 바뀌면안됨

```java
package com.kyh.querydsl2.repository;

import java.util.List;

import org.springframework.util.StringUtils;

import com.kyh.querydsl2.dto.MemberSearchCondition;
import com.kyh.querydsl2.dto.MemberTeamDto;
import com.kyh.querydsl2.dto.QMemberTeamDto;
import com.kyh.querydsl2.entity.QMember;
import com.kyh.querydsl2.entity.QTeam;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;

import jakarta.persistence.EntityManager;

public class MemberRepositoryImpl implements MemberRepositoryCustom {

    private final JPAQueryFactory queryfactory;

    public MemberRepositoryImpl(EntityManager em) {
        this.queryfactory = new JPAQueryFactory(em);
    }

    @Override
    public List < MemberTeamDto > search(MemberSearchCondition condition) {
        return queryfactory
            .select(new QMemberTeamDto(
                QMember.member.id,
                QMember.member.username,
                QMember.member.age,
                QTeam.team.id,
                QTeam.team.name))
            .from(QMember.member)
            .leftJoin(QMember.member.team, QTeam.team)
            .where(usernameEq(condition.getUsername()),
                teamNameEq(condition.getTeamName()),
                ageGoe(condition.getAgeGoe()),
                ageLoe(condition.getAgeLoe()))
            .fetch();
    }
    private BooleanExpression usernameEq(String username) {
        return StringUtils.hasText(username) ? QMember.member.username.eq(username) : null;
    }
    private BooleanExpression teamNameEq(String teamName) {
        return StringUtils.hasText(teamName) ? QTeam.team.name.eq(teamName) : null;
    }
    private BooleanExpression ageGoe(Integer ageGoe) {
        return ageGoe == null ? null : QMember.member.age.goe(ageGoe);
    }
    private BooleanExpression ageLoe(Integer ageLoe) {
        return ageLoe == null ? null : QMember.member.age.loe(ageLoe);
    }

}
```

```java
package com.kyh.querydsl2.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kyh.querydsl2.entity.Member;

public interface MemberRepository extends JpaRepository<Member, Long>, MemberRepositoryCustom{
    List<Member> findByUsername(String name);

    
}
```

그리고 MemberRepositoryCustom을 extends함.

```java
package com.kyh.querydsl2;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.kyh.querydsl2.dto.MemberSearchCondition;
import com.kyh.querydsl2.dto.MemberTeamDto;
import com.kyh.querydsl2.entity.Member;
import com.kyh.querydsl2.entity.Team;
import com.kyh.querydsl2.repository.MemberRepository;

import jakarta.persistence.EntityManager;
@SpringBootTest
@Transactional
class MemberRepositoryTest {
    @Autowired
    EntityManager em;
    @Autowired
    MemberRepository memberRepo;
 
    @Test
    public void searchTest() {
        Team teamA = new Team("teamA");
        Team teamB = new Team("teamB");
        em.persist(teamA);
        em.persist(teamB);
        Member member1 = new Member("member1", 10, teamA);
        Member member2 = new Member("member2", 20, teamA);
        Member member3 = new Member("member3", 30, teamB);
        Member member4 = new Member("member4", 40, teamB);
        em.persist(member1);
        em.persist(member2);
        em.persist(member3);
        em.persist(member4);
        MemberSearchCondition condition = new MemberSearchCondition();
        condition.setAgeGoe(35);
        condition.setAgeLoe(40);
        condition.setTeamName("teamB");
        List < MemberTeamDto > result = memberRepo.search(condition);
        assertThat(result).extracting("username").containsExactly("member4");
        //username에 member4가 있는지?
        
    }
}
```

사용

꼭 custom에 묶여있을 필요는 없음. 그냥 repository class를 하나 만들어서 거기다가 만들어줘도됨. (특정 API에 묶여있다면 별도의 조회용 repository를 만들어도 좋다는 의미같음)

### 페이징

```java
package com.kyh.querydsl2.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.kyh.querydsl2.dto.MemberSearchCondition;
import com.kyh.querydsl2.dto.MemberTeamDto;

public interface MemberRepositoryCustom {
    List<MemberTeamDto> search(MemberSearchCondition condition);
    Page<MemberTeamDto> searchPageSimple(MemberSearchCondition condition, Pageable pageable);
    Page<MemberTeamDto> searchPageComplex(MemberSearchCondition condition, Pageable pageable);

}
```

```java
@Override
public Page<MemberTeamDto> searchPageSimple(MemberSearchCondition condition, Pageable pageable){
    QueryResults<MemberTeamDto> results = queryfactory
    .select(new QMemberTeamDto(
        QMember.member.id,
        QMember.member.username,
        QMember.member.age,
        QTeam.team.id,
        QTeam.team.name))
    .from(QMember.member)
    .leftJoin(QMember.member.team, QTeam.team)
    .where(usernameEq(condition.getUsername()),
        teamNameEq(condition.getTeamName()),
        ageGoe(condition.getAgeGoe()),
        ageLoe(condition.getAgeLoe()))
        .offset(pageable.getOffset())
        .limit(pageable.getPageSize())
    .fetchResults();

    List<MemberTeamDto> content = results.getResults();
    Long total = results.getTotal();
    return new PageImpl<>(content, pageable, total);
}
```

오버라이딩 해줌

```java
@Test
public void searchPage() {
    Team teamA = new Team("teamA");
    Team teamB = new Team("teamB");
    em.persist(teamA);
    em.persist(teamB);
    Member member1 = new Member("member1", 10, teamA);
    Member member2 = new Member("member2", 20, teamA);
    Member member3 = new Member("member3", 30, teamB);
    Member member4 = new Member("member4", 40, teamB);
    em.persist(member1);
    em.persist(member2);
    em.persist(member3);
    em.persist(member4);
    MemberSearchCondition condition = new MemberSearchCondition();
    PageRequest pageRequest = PageRequest.of(0, 3);

    Page < MemberTeamDto > result = memberRepo.searchPageSimple(condition, pageRequest);
    assertThat(result.getSize()).isEqualTo(3);
    assertThat(result.getContent()).extracting("username").containsExactly("member1", "member2", "member3");
    
}
```

![images](/assets/images/querydsl/IMG-20240909112439.png)

count와 limit 두개가 나감

```java
@Override
public Page<MemberTeamDto> searchPageComplex(MemberSearchCondition condition, Pageable pageable){
    List<MemberTeamDto> content = queryfactory
    .select(new QMemberTeamDto(
        QMember.member.id,
        QMember.member.username,
        QMember.member.age,
        QTeam.team.id,
        QTeam.team.name))
    .from(QMember.member)
    .leftJoin(QMember.member.team, QTeam.team)
    .where(usernameEq(condition.getUsername()),
        teamNameEq(condition.getTeamName()),
        ageGoe(condition.getAgeGoe()),
        ageLoe(condition.getAgeLoe()))
        .offset(pageable.getOffset())
        .limit(pageable.getPageSize())
    .fetch();

    Long total = queryfactory
            .select(QMember.member)
            .from(QMember.member)
            .leftJoin(QMember.member.team, QTeam.team)
            .where(usernameEq(condition.getUsername()),
                teamNameEq(condition.getTeamName()),
                ageGoe(condition.getAgeGoe()),
                ageLoe(condition.getAgeLoe()))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
            .fetchCount();
    return new PageImpl<>(content, pageable, total);
}
```

count쿼리를 분리해서 해도 됨.

### count 쿼리 최적화

```java
@Override
    public Page<MemberTeamDto> searchPageComplex(MemberSearchCondition condition, Pageable pageable){
        List<MemberTeamDto> content = queryfactory
        .select(new QMemberTeamDto(
            QMember.member.id,
            QMember.member.username,
            QMember.member.age,
            QTeam.team.id,
            QTeam.team.name))
        .from(QMember.member)
        .leftJoin(QMember.member.team, QTeam.team)
        .where(usernameEq(condition.getUsername()),
            teamNameEq(condition.getTeamName()),
            ageGoe(condition.getAgeGoe()),
            ageLoe(condition.getAgeLoe()))
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
        .fetch();

        JPAQuery<Member> countQuery = queryfactory
                .select(QMember.member)
                .from(QMember.member)
                .leftJoin(QMember.member.team, QTeam.team)
                .where(usernameEq(condition.getUsername()),
                    teamNameEq(condition.getTeamName()),
                    ageGoe(condition.getAgeGoe()),
                    ageLoe(condition.getAgeLoe()));

        return PageableExecutionUtils.getPage(content, pageable, ()->countQuery.fetchCount());
        //return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchCount);
				//위와 같은 표현임
    }
```

이렇게하면 count쿼리가 필요하지 않을때(ex.마지막페이지)는 spring data jpa가 자동으로 쿼리문을 안날림.