---
title: "[외부API연동] 외부 메시징 API 에러를 공통 응답 코드로 바꾸기 - 응답 파서, 코드 매핑, zod 요청 검증"
category: 외부API연동
tags:
  - typescript
  - express
  - zod
  - error-handling
  - webhook
last_modified_at: 2025-12-26
---

## 발단

알림톡 발송 서비스를 서버리스로 다시 만드는 작업에 참여했다
인증/발송/웹훅/큐 같은 전체 구조는 팀에서 만들었고 나는 <mark class="hltr-cyan">외부 메시징 API 연동 구조와 템플릿/프로필 API 그리고 공통 응답 변환</mark>을 맡았다

서버리스라고 해도 함수마다 따로 짠건 아니고 Express 앱 하나를 `serverless-http`로 감싸서 Lambda 핸들러로 내보내는 구조이다

```ts
// 예시 코드 (app.ts에서 줄임)
export const app = express()
app.use(express.json())
setupRoutes(app)
app.use(errorHandler) // 모든 에러는 여기로 모인다

export const lambdaHandler = serverless(app)
```

연동하면서 제일 먼저 부딪힌건 <mark class="hltr-cyan">외부 API가 실패를 알려주는 방식이 제각각</mark>이라는 점이었다

---

## 외부 API는 실패를 세가지 모양으로 준다

1. HTTP 상태코드가 4xx/5xx
2. 응답 body가 JSON이 아님 (파싱 실패)
3. <mark class="hltr-cyan">HTTP는 200인데 body의 `code`가 실패</mark>

거기다 `code` 체계도 하나가 아니었다
중계사 자체 코드(1000번대 성공/3000번대 인증/7000번대 알림톡 등)와 템플릿 쪽 요청에서 그 뒤 채널이 직접 주는 코드(504 템플릿 코드 중복, 508 데이터 없음 등)가 섞여서 온다

이걸 그대로 클라이언트에 흘리면 화면 쪽이 외부 코드표를 알아야하고 외부 업체가 바뀌면 화면까지 같이 고쳐야하는 구조가 된다
그래서 목표를 이렇게 잡았다

- 세가지 실패를 한 종류의 에러로 모으기
- 외부 코드는 우리 응답 코드로 바꾸기
- 응답 포맷 변환은 마지막에 한 곳에서만

---

## 1. 응답 코드는 code / HTTP 상태 / 설명을 같이 들고 있는다

우리 쪽 응답 코드는 객체 하나에 HTTP 상태까지 같이 정의했다

```ts
// 예시 코드 (responseCode.ts 일부)
export const ResponseCodes = {
  OK: { code: 'OK', httpStatus: 200, description: '성공' },
  BAD_REQUEST: { code: 'BAD_REQUEST', httpStatus: 400, description: '잘못된 요청' },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', httpStatus: 500, description: '서버 내부 오류' },

  INVALID_TOKEN: { code: 'INVALID_TOKEN', httpStatus: 401, description: '토큰이 유효하지 않음' },
  CONNECTION_LIMIT_EXCEEDED: { code: 'CONNECTION_LIMIT_EXCEEDED', httpStatus: 429, description: '허용된 접속 수 초과' },
  TEMPLATE_CODE_DUPLICATE: { code: 'TEMPLATE_CODE_DUPLICATE', httpStatus: 400, description: '템플릿 코드 중복' },
} as const
```

코드마다 HTTP 상태가 붙어있어서 에러를 던지는 쪽은 코드만 고르면 되고 상태코드는 따로 고민할 필요가 없다

---

## 2. 외부 코드 -> 우리 코드 매핑

외부 코드는 맵 하나로 바꿔주었다. 맵에 없는 코드는 500으로 떨어진다

```ts
// 예시 코드 (코드 매핑 일부)
export const ExternalCodeMap: Record<string, keyof typeof ResponseCodes> = {
  '1000': 'API_SUCCESS',
  '3002': 'INVALID_TOKEN',
  '3008': 'CONNECTION_LIMIT_EXCEEDED',
  '7315': 'TEMPLATE_NOT_FOUND',
  '504': 'TEMPLATE_CODE_DUPLICATE', // 채널 쪽 코드
  '508': 'DATA_NOT_FOUND',
}

export const mapExternalCode = (externalCode: string) => {
  const key = ExternalCodeMap[externalCode]
  return key ? ResponseCodes[key] : ResponseCodes.INTERNAL_ERROR // 모르는 코드는 500
}
```

모르는 코드를 500으로 보내는건 일부러 그렇게 했다
외부가 새 코드를 추가해도 일단 터지지는 않고 로그에 원래 코드가 남기때문에 보고 맵에 추가하면 된다

---

## 3. 세가지 실패를 한 에러로 모으는 파서

외부 호출 결과는 전부 공통 파서를 거치게 했다
처음엔 템플릿 등록 서비스 안에 직접 짰다가 템플릿 API를 일괄로 붙이면서 함수로 뺐다

```ts
// 예시 코드 (응답 파서)
export async function parseExternalResponse<T>(response: Response, operation: string): Promise<T> {
  let result: ExternalResponse<T>
  try {
    result = (await response.json()) as ExternalResponse<T>
  } catch (e) {
    throw new ExternalApiError('PARSE_ERROR', '응답을 파싱할 수 없습니다') // 2. JSON 아님
  }

  if (!response.ok) {
    throw new ExternalApiError(String(response.status), result.message) // 1. HTTP 에러
  }

  if (isSuccess(result.code) && result.data) {
    return result.data
  }

  throw new ExternalApiError(result.code, result.message) // 3. 200인데 실패 코드
}
```

```ts
// 예시 코드
export class ExternalApiError extends AppError {
  readonly code: ResponseCode

  constructor(externalCode: string, originalMessage: string) {
    const mapped = mapExternalCode(externalCode)
    super(originalMessage || mapped.description) // 외부 메시지가 있으면 살린다
    this.code = mapped
    logger.warn('외부 API 실패', { externalCode, mappedCode: mapped.code, originalMessage })
  }
}
```

서비스 코드는 `fetch` 하고 파서만 부르면 끝이다
성공이면 data가 오고 실패면 에러가 던져진다

---

## 4. 응답으로 바꾸는건 에러 미들웨어 한 곳에서

던져진 에러는 Express 에러 미들웨어에서 한번에 공통 포맷으로 바꿔준다

```ts
// 예시 코드 (errorHandler 줄임)
export const errorHandler = (error: Error, req: Request, res: Response, _: NextFunction) => {
  if (error instanceof AppError) {
    return errorResponse(res, error.code, error.message)
  }
  return errorResponse(res, ResponseCodes.INTERNAL_ERROR, error.message)
}

export const errorResponse = (res: Response, code: ResponseCode, message?: string) =>
  res.status(code.httpStatus).json({
    success: false,
    code: code.code,
    message: message || code.description,
    timestamp: new Date().toISOString(),
  })
```

이렇게 해두면 클라이언트는 외부 API가 어떤 모양으로 실패했든 항상 `{ success, code, message, timestamp }`만 보면 된다

참고로 Express 4에서는 async 핸들러에서 던진 에러(reject된 Promise)를 에러 미들웨어가 못 받아서 `asyncHandler` 같은 래퍼로 `.catch(next)`를 붙여야 했다
이 프로젝트는 Express 5라서 async 핸들러 에러도 알아서 에러 미들웨어로 넘어간다(래퍼가 남아있어도 문제는 없음)

---

## zod는 요청 검증에 썼다

일지에 "타입 안맞는건 zod로 response 던지면됨"이라고 적어뒀었는데 코드를 다시 보니 zod는 <mark class="hltr-cyan">들어오는 요청</mark>을 검증하는데 쓰고 있었다

```ts
// 예시 코드 (validate 미들웨어)
export const validate = (schema: z.AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({ body: req.body, query: req.query, params: req.params })
      req.body = parsed.body
      return next()
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(res, ResponseCodes.BAD_REQUEST, 'Validation failed', error.errors)
      }
      return errorResponse(res, ResponseCodes.INTERNAL_ERROR)
    }
  }
```

```ts
// 예시 코드 (템플릿 버튼 스키마 일부)
const ButtonSchema = z.object({
  name: z.string(),
  linkType: z.enum(['DS', 'WL', 'AL', 'BK', 'MD', 'AC']),
  linkMo: z.string().optional(), // WL일때 필수
})
```

외부 API로 나가기 전에 형식이 틀린 요청을 400으로 돌려보내니까 외부까지 갔다가 낯선 에러 코드로 돌아오는 일이 줄어든다

그럼 외부 응답은?
외부 응답은 <mark class="hltr-cyan">`as`로 타입만 붙이고 있었다</mark>
`as`는 컴파일러에게 "믿어라"라고 하는것뿐이라 런타임에는 아무것도 검사하지 않는다
외부가 필드 이름을 바꾸거나 `data`를 빼고 보내도 그 자리에선 에러가 안나고 한참 뒤에 `undefined`로 터진다
외부 응답도 확실하게 하려면 파서에서 zod로 한번 더 거르면 된다

```ts
// 예시 코드 (대안)
const TemplateRes = z.object({ templateCode: z.string(), status: z.string() })

const data = await parseExternalResponse<unknown>(response, '템플릿 조회')
const parsed = TemplateRes.safeParse(data)
if (!parsed.success) {
  throw new ExternalApiError('INVALID_RESPONSE', '외부 응답 형식이 예상과 다릅니다')
}
return parsed.data
```

---

## 주의점

**1. HTTP 상태코드와 업무 코드를 한 맵에 넣으면 키가 겹친다**

HTTP 에러일때 `response.status`를 그대로 외부 코드 자리에 넣다보니 맵 안에서 HTTP 상태코드와 채널 쪽 업무 코드가 같은 키 공간을 쓰고 있었다
예를 들어 `'403'`, `'405'`는 채널 쪽 업무 코드로 매핑돼 있어서 진짜 HTTP 405(Method Not Allowed)가 와도 파라미터 오류로 읽힌다
`http:405`처럼 출처를 접두어로 붙이거나 HTTP 상태는 맵을 따로 두는게 안전하다

**2. body를 언제 읽을지**

처음 버전은 `response.ok`부터 보고 바로 던졌는데 그러면 HTTP 에러 body에 들어있는 외부 메시지를 버리고 `HTTP 400: Bad Request`만 남았다
그래서 지금은 body를 먼저 읽고 ok를 본다
대신 게이트웨이가 HTML 에러 페이지를 주는 경우엔 파싱 에러로 빠지면서 HTTP 상태를 잃는다
`response.text()`로 먼저 받고 JSON 파싱은 따로 시도하면 둘 다 살릴 수 있다

---

## 템플릿은 저장하지 않고 바로 조회

알림톡 템플릿은 우리 DB에 복사해두지 않고 외부 API에서 즉시 조회하는 방식으로 했다
템플릿 검수 상태는 외부에서 바뀌기때문에 복사본을 두면 승인/반려가 바뀔때마다 동기화를 따로 챙겨야해서 원본이 있는 곳에서 바로 읽는게 단순하다고 판단했다
다만 검색은 외부 API가 지원하는 만큼만 되니까 검색 요구가 커지면 엔티티를 추가할 수도 있다

---

## 팀이 만든 발송 / 웹훅 결과 흐름

발송 쪽은 팀에서 만든 구조고 나는 테스트 순서대로 따라가면서 정리햇다
보면서 제일 중요하다고 느낀건 <mark class="hltr-cyan">요청과 결과가 따로 온다</mark>는 점이었다

1. `send-prep`: 템플릿 안의 변수를 전부 조회
2. 발송 요청 -> 발송 그룹이 생기고 외부가 돌려준 메시지 ID로 redis 키를 만든다 (메시지 ID -> 우리 쪽 그룹/메시지 정보)
3. 결과가 웹훅으로 들어오면 메시지 ID로 redis에서 우리 메시지를 찾고 키를 지운 뒤 후속 처리는 queue로 넘긴다
4. `send-history`에서 그룹 단위로 결과 조회


웹훅에는 외부 메시지 ID와 결과 코드 정도만 온다
그래서 요청할때 "이 ID는 우리 어느 그룹의 어느 메시지"인지 빠르게 찾을 수 있게 redis에 적어두는 것이다

>[!결과가 매핑보다 먼저 올 수도 있다]
>
>발송 응답을 받고 매핑을 저장하기 전에 웹훅이 먼저 도착할 수도 있다
>이때 매핑이 없다고 결과를 버리면 그 메시지는 영영 결과가 없기때문에 바로 버리지 말고 재시도할 수 있는 곳(queue)에 다시 태우는게 안전하다
>그리고 결과가 끝내 안 오는 키가 쌓이지 않게 TTL도 걸어둬야한다
>

---

외부 실패를 파서 하나에서 모으고 응답 변환을 미들웨어 한곳에 몰아두니 외부 코드표가 화면까지 새어나가지 않게 되었다
더 챙긴다면 외부 응답 zod 검증이랑 HTTP 상태 키 분리 정도를 해보면 될것같다
