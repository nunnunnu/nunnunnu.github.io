---
title: "[Spring boot] logback으로 로그 남기기"
last_modified_at: 2025-02-26
tags:
  - spring
  - log
  - logback
category: Spring
---

## 개요

Spring Boot 기본 로깅은 Logback 기반이다
기본 설정을 커스터마이징하여 로그 파일 위치, 로그 롤링 정책, 에러 로그 분리 등을 관리할 수 있다. 
프로젝트의 resources 폴더에 logback-spring.xml 파일을 생성해준다

![image](/assets/images/spring/IMG-20250520155657.png)

## logback-spring.xml

### 최종 버전

```xml
<?xml version="1.0" encoding="UTF-8"?>  
<configuration scan="true" scanPeriod="60 seconds">  
  
    <springProperty scope="context" name="LOG_LEVEL" source="logging.level.root"/>  
  
    <property name="LOG_PATH" value="./logs"/>  
    <property name="LOG_FILE_NAME" value="logs"/>  
    <property name="ERR_LOG_FILE_NAME" value="err_log"/>  
    <property name="LOG_PATTERN"  
              value="%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"/>  
  
    <!-- Console Appender -->  
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">  
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">  
            <pattern>${LOG_PATTERN}</pattern>  
        </encoder>  
    </appender>  
  
    <!-- File Appender -->  
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">  
        <!-- 파일경로 설정 -->  
        <file>${LOG_PATH}/${LOG_FILE_NAME}.log</file>  
        <!-- 출력패턴 설정-->  
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">  
            <pattern>${LOG_PATTERN}</pattern>  
  
        </encoder>  
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">  
            <fileNamePattern>${LOG_PATH}/${LOG_FILE_NAME}.%d{yyyy-MM-dd}.log.zip</fileNamePattern>  
            <maxHistory>30</maxHistory>  
            <totalSizeCap>10MB</totalSizeCap>  
        </rollingPolicy>  
    </appender>  
  
    <!-- 에러의 경우 파일에 로그 처리 -->  
    <appender name="Error" class="ch.qos.logback.core.rolling.RollingFileAppender">  
        <filter class="ch.qos.logback.classic.filter.LevelFilter">  
            <level>error</level>  
            <onMatch>ACCEPT</onMatch>  
            <onMismatch>DENY</onMismatch>  
        </filter>  
        <file>${LOG_PATH}/${ERR_LOG_FILE_NAME}.log</file>  
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">  
            <pattern>${LOG_PATTERN}</pattern>  
        </encoder>  
        <!-- Rolling 정책 -->  
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">  
            <!-- 파일명 패턴에 날짜와 인덱스를 포함합니다. -->  
            <fileNamePattern>${LOG_PATH}/${ERR_LOG_FILE_NAME}.%d{yyyy-MM-dd}.%i.log</fileNamePattern>  
            <maxFileSize>10MB</maxFileSize>  
            <maxHistory>30</maxHistory>  
            <totalSizeCap>1GB</totalSizeCap>  
        </rollingPolicy>  
  
    </appender>  
  
    <root level="${LOG_LEVEL}">  
        <appender-ref ref="CONSOLE"/>  
        <appender-ref ref="FILE"/>  
        <appender-ref ref="Error"/>  
    </root>  
  
    <logger name="org.apache.ibatis" level="DEBUG" additivity="false">  
        <appender-ref ref="CONSOLE"/>  
        <appender-ref ref="FILE"/>  
        <appender-ref ref="Error"/>  
    </logger>  
  
    <logger name="jdbc" level="OFF"/>  
    <logger name="jdbc.connection" level="OFF"/>  
    <!-- SQL문만을 로그로 남기며, PreparedStatement일 경우 관련된 argument 값으로 대체된 SQL문이 보여진다. -->  
    <logger name="jdbc.sqlonly"  
            level="OFF"/> <!-- SQL문과 해당 SQL을 실행시키는데 수행된 시간 정보(milliseconds)를 포함한다. -->  
    <logger name="jdbc.sqltiming" level="DEBUG"/>  
    <!-- ResultSet을 제외한 모든 JDBC 호출 정보를 로그로 남긴다. 많은 양의 로그가 생성되므로 특별히 JDBC 문제를 추적해야 할 필요가 있는 경우를 제외하고는 사용을 권장하지 않는다. -->  
    <logger name="jdbc.audit" level="OFF"/>  
    <!-- ResultSet을 포함한 모든 JDBC 호출 정보를 로그로 남기므로 매우 방대한 양의 로그가 생성된다. -->  
    <logger name="jdbc.resultset" level="OFF"/>  
    <!-- SQL 결과 조회된 데이터의 table을 로그로 남긴다. -->  
    <logger name="jdbc.resultsettable" level="OFF"/>  
  
</configuration>
```
---

### 기본 설정

```xml
<configuration scan="true" scanPeriod="60 seconds">
    <springProperty scope="context" name="LOG_LEVEL" source="logging.level.root"/>
    <property name="LOG_PATH" value="./logs"/>
    <property name="LOG_FILE_NAME" value="logs"/>
    <property name="ERR_LOG_FILE_NAME" value="err_log"/>
    <property name="LOG_PATTERN"
              value="%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"/>

```
- `scan="true"`, `scanPeriod`: 설정파일 변경 감지 주기 (60초)
- `springProperty`: Spring 환경설정(`application.properties` 등)의 `logging.level.root` 값을 동적으로 가져옴
- 로그 경로, 파일명, 패턴을 프로퍼티로 선언해 유지보수 편리
    

### Console Appender 설정

```xml
<appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
        <pattern>${LOG_PATTERN}</pattern>
    </encoder>
</appender>

```

- 개발 중 콘솔 확인 용도
- 로그 패턴 적용

---

### 일반 로그 파일 설정 (RollingFileAppender)

```xml
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>${LOG_PATH}/${LOG_FILE_NAME}.log</file>
    <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
        <pattern>${LOG_PATTERN}</pattern>
    </encoder>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>${LOG_PATH}/${LOG_FILE_NAME}.%d{yyyy-MM-dd}.log.zip</fileNamePattern>
        <maxHistory>30</maxHistory>
        <totalSizeCap>10MB</totalSizeCap>
    </rollingPolicy>
</appender>
```

- 기본 로그를 `./logs/logs.log`에 기록
- 매일 파일 롤링하며, `.zip` 압축 저장
- 최대 30일 유지, 총 용량 10MB 제한

---

### 에러 전용 로그 파일 설정

```xml
<appender name="Error" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <filter class="ch.qos.logback.classic.filter.LevelFilter">
        <level>error</level>
        <onMatch>ACCEPT</onMatch>
        <onMismatch>DENY</onMismatch>
    </filter>
    <file>${LOG_PATH}/${ERR_LOG_FILE_NAME}.log</file>
    <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
        <pattern>${LOG_PATTERN}</pattern>
    </encoder>
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <fileNamePattern>${LOG_PATH}/${ERR_LOG_FILE_NAME}.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
        <maxFileSize>10MB</maxFileSize>
        <maxHistory>30</maxHistory>
        <totalSizeCap>1GB</totalSizeCap>
    </rollingPolicy>
</appender>

```

- 에러 레벨 로그만 필터링해서 별도 파일에 기록
- 날짜 + 인덱스 롤링 정책 적용 (용량 및 날짜 기준)
- 30일 보존, 최대 총 용량 1GB 제한

---

### Root Logger 및 패키지별 로그 레벨 설정

```xml
<root level="${LOG_LEVEL}">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="FILE"/>
    <appender-ref ref="Error"/>
</root>

<logger name="org.apache.ibatis" level="DEBUG" additivity="false">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="FILE"/>
    <appender-ref ref="Error"/>
</logger>
```

- 루트 로그레벨을 Spring 프로퍼티 값에 맞춰서 동적 설정
- Console, File, Error appender 모두 적용
- `org.apache.ibatis`는 별도 DEBUG 레벨 적용 (additivity=false로 중복 출력 방지)

---

### JDBC 관련 로그 비활성화 설정

```xml
<logger name="jdbc" level="OFF"/>
<logger name="jdbc.connection" level="OFF"/>
<logger name="jdbc.sqlonly" level="OFF"/>
<logger name="jdbc.sqltiming" level="DEBUG"/>
<logger name="jdbc.audit" level="OFF"/>
<logger name="jdbc.resultset" level="OFF"/>
<logger name="jdbc.resultsettable" level="OFF"/>

```

- JDBC 관련 로그를 주로 꺼서 불필요한 로그 발생 방지
- SQL 실행 시간(`jdbc.sqltiming`) 로그만 DEBUG 레벨로 유지

---

## 주의점
### timeBasedFileNamingAndTriggeringPolicy 에러

```xml
<rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">  
    <!-- 파일명 패턴에 날짜와 인덱스를 포함합니다. -->  
    <fileNamePattern>${LOG_PATH}/${ERR_LOG_FILE_NAME}.%d{yyyy-MM-dd}.%i.log</fileNamePattern>  
    <timeBasedFileNamingAndTriggeringPolicy  
            class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">  
        <maxFileSize>10MB</maxFileSize>  
    </timeBasedFileNamingAndTriggeringPolicy>  
    <maxFileSize>10MB</maxFileSize>  
    <maxHistory>30</maxHistory>  
    <totalSizeCap>1GB</totalSizeCap>  
</rollingPolicy>
```

과거에 진행한 프로젝트에서는 rolling 설정에 다음과같이 timeBasedFileNamingAndTriggeringPolicy 설정을 해주었는데, 현재 확인해보니

```
Exception in thread "main" java.lang.IllegalStateException: java.lang.IllegalStateException: Logback configuration error detected: 
ERROR in ch.qos.logback.core.model.processor.ImplicitModelHandler - Could not create component [timeBasedFileNamingAndTriggeringPolicy] of type [ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP] java.lang.ClassNotFoundException: ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP
```

이런 에러가 발생하였음
[logback 공식문서](https://logback.qos.ch/manual/appenders.html#SizeAndTimeBasedRollingPolicy)를 찾아보니
![image](/assets/images/spring/IMG-20250520155657-1.png)
timeBasedFileNamingAndTriggeringPolicy는 버전 1.1.7 이후로는 SizeAndTimeBasedRollingPolicy로 통합되었다고한다
만약 에러가 난다면 timeBasedFileNamingAndTriggeringPolicy 설정은 그냥 지워주면된다

### 인텔리제이 파일 검색 제외
로그파일이 생성되면 파일 전체검색할떄 로그파일의 내용이 함께 검색되어
찾기도힘들고 시간이지나면 검색 속도도 오래걸리니 미리 제외해주는것을 추천한다

Project Structure -> Modules에서
![image](/assets/images/spring/IMG-20250520155657-2.png)
log 폴더를 Excluded해준다


---
## 결과

![image](/assets/images/spring/IMG-20250520155657-3.png)
다음날 확인해보니 
log파일과 일별로 압축된 zip파일도 생성되었으며, 오류만 모아둔 log파일도 생성되었음을 확인가능하다

나는 이번에 굳이 분리해주지않았지만
`<springProfile name="local">` 설정으로 개발환경별 설정을 분리해줄수도 있다

