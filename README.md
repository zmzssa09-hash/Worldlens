# WorldLens — 세상의 조각들을 연결하다

여러 나라 언론의 뉴스를 모아 **사건별로 묶고**, 나라마다 어떻게 다르게 보도하는지 비교해 보여 주는 사이트예요.
뉴스를 일일이 찾아보고 이해하기 번거로운 사람을 위해 만들었어요. 5개 언어(한국어·영어·일본어·중국어·프랑스어)를 지원해요.

공개 사이트: https://worldlens-three.vercel.app

## 어떻게 돌아가나요

서버와 데이터베이스 없이 동작해요.

```
GitHub Actions (약 20분마다)                         Vercel
  뉴스 수집 → 사건 묶기 → 번역 → 분석          →     dist/ 폴더를 그대로 보여 줌
  → 화면용 파일(dist/) 만들기 → Vercel에 올리기       브라우저는 1분마다 새 데이터를 확인
```

- 모은 기사·번역·분석은 SQLite 파일(`data/`)에 쌓이고, GitHub Actions 캐시로 다음 실행에 이어져요.
- `src/build.js`가 데이터베이스 내용을 `dist/data/...json` 파일로 만들어요.
- Vercel 무료 플랜의 하루 배포 횟수 제한 때문에 20분 간격이에요 (`.github/workflows/update.yml`).

## 주요 화면

- **오늘의 세계**: 30초 요약, 오늘의 브리핑, 지역별 사건 분포, 주제별 거르기(정치·분쟁·경제·과학·환경·건강·사회·문화), 중요도·읽는 시간이 붙은 사건 카드, 관심 지역
- **사건 상세**: 한눈에 보기, 나한테 무슨 상관?, 보도량 그래프, 3분 스토리, 확인된 사실, 나라별 관점(비판적 / 중립 / 우호적), 가설, 타임라인·원문
- 글자 크기 조절, 다크 모드, 휴대폰 화면 대응, 이용약관·개인정보처리방침(초안)

## 데모 모드와 AI 모드

| | 데모 모드 (API 키 없음) | AI 모드 (`ANTHROPIC_API_KEY` 있음) |
|---|---|---|
| 번역 | 무료 번역(느리고 가끔 막힘) | Claude Haiku |
| 요약·관점·가설 | 기사 문장을 규칙대로 정리, 관점은 낱말 비교로 **추정** | Claude가 기사를 읽고 분석 |

AI 비용 관리: 한 번에 4건, 하루 120회까지만 분석하고, 같은 사건은 새 기사가 2건 이상 늘었을 때 1시간 간격으로만 다시 분석해요.

## 내 컴퓨터에서 미리 보기

```bash
npm install
npm start          # http://localhost:3000 (5분마다 갱신, 공개 사이트와 같은 dist/를 보여 줌)
npm run refresh    # 한 번 갱신 + dist/ 만들기
npm run build      # 지금 데이터로 dist/만 다시 만들기
```

설정은 `.env.example`을 `.env`로 복사해서 넣어요. Node.js 22.13 이상이 필요해요.

## 공개 사이트 자동 갱신 설정

GitHub 저장소 → **Settings → Secrets and variables → Actions**

| 종류 | 이름 | 값 |
|---|---|---|
| Secret | `VERCEL_TOKEN` | https://vercel.com/account/tokens 에서 만든 토큰 |
| Secret | `VERCEL_ORG_ID` | Vercel 팀 ID (`.vercel/project.json`의 `orgId`) |
| Secret | `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID (`.vercel/project.json`의 `projectId`) |
| Secret (선택) | `ANTHROPIC_API_KEY` | 넣으면 AI 분석·번역 |
| Variable (선택) | `WORLDLENS_CONTACT_EMAIL` | 사이트 아래쪽에 보일 문의 메일 |

설정 뒤 **Actions → 뉴스 갱신 및 배포 → Run workflow**로 바로 실행해 볼 수 있어요.

## 폴더 구조

```
src/sources.js      수집하는 55개국 86개 매체(모두 영어판)와 언어·나라 이름
src/collector.js    RSS 수집
src/clusterer.js    기사를 사건으로 묶기
src/category.js     사건 주제 나누기 (영어 원문 낱말 기준)
src/translator.js   번역 (Claude 또는 무료 번역)
src/analyzer/       분석 (claude.js: AI, demo.js: 규칙 기반, prompts.js: 중립성 원칙)
src/pipeline.js     수집 → 묶기 → 번역 → 분석 → 브리핑 → 현지화
src/views.js        화면에 보낼 데이터 모양
src/build.js        dist/ 정적 사이트 만들기
src/refresh-cli.js  한 번 갱신 + 만들기 (GitHub Actions가 실행)
server.js           내 컴퓨터 미리 보기
public/             화면 (HTML·CSS·JS, 5개 언어 문구)
```

기사 저작권은 각 언론사에 있으며, WorldLens는 제목·요약과 원문 링크만 보여 줘요.
