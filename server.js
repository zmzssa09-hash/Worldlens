// 내 컴퓨터에서 미리 보기: npm start → http://localhost:3000
// Vercel과 똑같이 dist/ 폴더(정적 파일)를 보여 주고, 5분마다 뉴스를 갱신해 dist/를 다시 만듦
// (실제 공개 사이트는 GitHub Actions가 갱신해서 Vercel에 올림 — .github/workflows/update.yml)
import express from 'express';
import { getMeta } from './src/db.js';
import { modeInfo } from './src/analyzer/index.js';
import { refresh } from './src/pipeline.js';
import { startScheduler } from './src/scheduler.js';
import { buildSite, DIST } from './src/build.js';
import { LANGS } from './src/sources.js';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1'; // 내 컴퓨터에서만 접속 가능

const app = express();
app.use(express.static(DIST, { extensions: ['html'] })); // /event → event.html (Vercel의 cleanUrls와 같게)

app.listen(PORT, HOST, () => {
  const { mode, model } = modeInfo();
  console.log(`\n🌍 WorldLens 미리 보기 → http://localhost:${PORT}`);
  console.log(`   분석 모드: ${mode === 'ai' ? `AI (${model})` : '데모 (API 키 없음)'} · 언어: ${LANGS.join(', ')}\n`);
  const b = buildSite(); // 지금 있는 데이터로 먼저 화면을 만들어 둠
  console.log(`[만들기] 사건 ${b.events}개, 데이터 파일 ${b.files}개`);
  startScheduler();
  const last = getMeta('last_refresh');
  if (!last || Date.now() - Date.parse(last) > 5 * 60 * 1000) {
    console.log('[시작] 최신 뉴스를 가져오는 중…');
    refresh({ analyze: true, briefing: 'if-missing' }).then(() => buildSite()).catch((e) => console.error('[갱신 오류]', e));
  }
});
