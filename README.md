# SyncTime

HTML/CSS/JavaScript → Express API → Neon PostgreSQL 구조입니다. Stitch 원본 `_1`~`_4`, `synchronous_utility`는 그대로 보존합니다.

## 로컬 실행

Node.js 22 이상을 사용합니다.

```sh
npm install
npm run db:migrate
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. `index.html`을 직접 열거나 Live Server로 실행하면 API가 연결되지 않습니다. PowerShell 실행 정책으로 npm 실행이 막히면 `npm.cmd run dev`처럼 사용하세요.

프로젝트 루트 `.env`에는 다음 변수를 설정합니다. 실제 연결 문자열은 Neon Console의 Connect에서 가져옵니다. 비밀번호와 실제 `.env`는 GitHub에 올리지 않습니다.

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@YOUR-NEON-HOST/neondb?sslmode=verify-full
PORT=3000
```

`db.js`만 `process.env.DATABASE_URL`을 사용합니다. 프런트엔드에는 연결 문자열이 없습니다. 웹 서버는 `index.html`, `script.js`, `style.css`만 제공합니다.

## Neon 연결 확인

```sh
npm run db:check
```

기존 6개 테이블의 컬럼 구조를 출력하면 연결 성공입니다. 연결 문자열은 출력하지 않습니다. 앱 실행 후 `http://localhost:3000/api/health`에서 다음 응답도 확인할 수 있습니다.

```json
{"ok":true,"database":"connected"}
```

`npm run db:migrate`는 기존 테이블을 삭제하거나 재생성하지 않습니다. `groups.notes`, `participants.submitted`, `events.color`, `events.description`과 조회 인덱스만 추가하며 반복 실행할 수 있습니다. 기존 테이블의 bigint identity ID와 컬럼 이름에 맞춰 구현했습니다.

## 데이터와 사용자 흐름

- 그룹, 참여자, 가능 시간, 장소, 일정, 일정 참여자는 Neon에 저장됩니다.
- `sessionStorage`에는 현재 참여자 ID, 최근 그룹 ID, 마지막 화면 정보만 저장합니다. 새로고침해도 화면을 복원합니다.
- 초대 링크는 그룹 코드로 실제 DB 그룹을 조회합니다. 다른 브라우저도 같은 그룹에 참여합니다.
- 탭을 다시 활성화하거나 페이지를 새로고침하면 공유 데이터를 다시 조회합니다. 실시간 WebSocket 동기화는 사용하지 않습니다.
- 가능 시간 UI는 09:00~24:00의 1시간 단위입니다. DB에는 기존 형식과 호환되도록 30분 구간으로 저장합니다.
- 그룹 관리에서 그룹 수정·삭제, 참여자 삭제, 장소 추가·수정·삭제가 가능합니다. 장소는 일정표의 열이나 일정 입력 항목에 다시 추가하지 않았습니다.
- 로그인과 역할 구분은 없습니다. 수업 실습용으로 API 접근 권한 인증을 추가하지 않았습니다. 같은 이름으로 다시 참여하면 기존 참여자 ID를 사용합니다.
- 이전 버전의 localStorage 데이터는 자동 업로드하지 않습니다. 기존 브라우저 데이터는 삭제하지 않으며 새 저장부터 Neon을 사용합니다.

## API

모든 요청/응답은 JSON입니다. ID는 bigint 정밀도를 보존하는 문자열입니다. 일정 및 참여자 변경은 그룹 ID 안에서 검증합니다. 삭제 성공은 `204`입니다.

| 메서드 | 경로 (`/api` 기준) | 기능 |
|---|---|---|
| GET | `/health` | DB 연결 확인 |
| GET / POST | `/groups` | 그룹 목록 / 생성 |
| GET | `/groups/code/:code` | 초대 코드로 그룹 조회 |
| GET / PATCH / DELETE | `/groups/:id` | 그룹 전체 조회 / 수정 / 삭제 |
| GET / POST | `/groups/:id/participants` | 참여자 조회 / 추가·재참여 |
| DELETE | `/groups/:id/participants/:child` | 참여자 삭제 |
| GET / PUT | `/groups/:id/participants/:child/availability` | 가능 시간 조회 / 전체 교체 |
| GET / POST | `/groups/:id/places` | 장소 조회 / 추가 |
| PATCH / DELETE | `/groups/:id/places/:child` | 장소 수정 / 삭제 |
| GET / POST | `/groups/:id/events` | 일정 목록 / 생성 |
| GET / PUT / DELETE | `/groups/:id/events/:child` | 일정 조회 / 수정 / 삭제 |
| GET / PUT | `/groups/:id/events/:child/participants` | 일정 참여자 조회 / 저장 |

그룹 생성: `{ "name":"촬영 일정", "self":"김민수", "start":"2026-10-27", "end":"2026-11-02" }`

참여자/장소 추가: `{ "name":"이름" }`

가능 시간 저장: `{ "slots":["2026-10-27|540","2026-10-27|570"] }` (`540`은 09:00). 빈 배열도 입력 완료로 저장됩니다.

일정 저장: `{ "title":"리허설", "description":"준비물 확인", "date":"2026-10-27", "start":540, "end":660, "color":"#16a34a", "members":["1","2"] }`. 선택적으로 `place_id`를 지정할 수 있습니다. 일정별 참여자 저장은 `{ "members":["1"] }`입니다.

## GitHub + Vercel 배포

1. `.env`, `node_modules`, `.vercel`이 제외되는지 확인하고 소스를 GitHub 저장소에 push합니다.
2. Vercel에서 저장소를 Import합니다. 프로젝트 Root Directory는 이 앱 루트입니다.
3. Environment Variables에 `DATABASE_URL`을 추가합니다. Production과 사용할 Preview 환경에 설정합니다. Neon의 pooled 연결 문자열 사용을 권장합니다.
4. DB가 다른 환경이라면 해당 DB에 `npm run db:migrate`를 먼저 실행합니다. 배포 요청 중에는 스키마를 변경하지 않습니다.
5. Deploy합니다. `vercel.json`이 Express 엔트리와 프런트엔드 파일을 패키징합니다. 프레임워크 빌드나 `dist` 출력 폴더는 필요 없습니다.
6. 배포 주소의 `/api/health`를 확인한 뒤 해당 웹 주소에서 초대 링크를 생성합니다.

이 작업에서는 GitHub push나 Vercel 실제 배포는 수행하지 않았습니다.

## 검증

```sh
npm test
```

기본 테스트는 정적 파일 제공 범위, API 입력 검증, 프런트엔드 복원과 API 저장 호출을 확인하며 DB에 데이터를 쓰지 않습니다. 실제 DB 통합 테스트는 별도로 실행합니다.

```powershell
$env:LIVE_DB_TESTS='1'
npm.cmd test
Remove-Item Env:LIVE_DB_TESTS
```

실제 DB 테스트는 고유한 테스트 그룹을 생성해 그룹·참여자·가능 시간·장소·일정·일정 참여자의 CRUD, 실패 시 롤백, 24:00 저장을 확인하고 마지막에 생성한 그룹을 삭제합니다.

패키지: `express`, `pg`, `dotenv`; 개발 검증용 `supertest`.

참고: [Vercel Express 지원](https://vercel.com/docs/frameworks/backend/express), [Neon 연결](https://neon.com/docs/get-started-with-neon/connect-neon).
