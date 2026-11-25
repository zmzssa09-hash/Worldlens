// 한 번 갱신하고 정적 파일까지 만들기: npm run refresh
// GitHub Actions가 주기적으로 이걸 실행해서 Vercel에 올림
//   --briefing   오늘의 브리핑을 새로 만듦 (기본: 오늘 브리핑이 없을 때만)
// 한국 시간 아침 7시가 지난 첫 갱신은 브리핑을 새로 만듦 (밤사이 뉴스까지 담기게)
//  → 예전엔 7시 예약 실행이 따로 있었는데, 20분 갱신 사슬과 부딪혀 매번 '취소됨'으로 끝나고 메일이 갔음
import Anthropic from '@anthropic-ai/sdk';
import { getMeta, setMeta, noteAiError } from './db.js';

// API 키 확인: 키가 틀렸으면(401·403) 이번 갱신은 키 없이(무료 번역 + 데모 분석) 돌림
// → 틀린 키 때문에 번역·분석이 전부 멈추던 문제 (2026-11-25: invalid x-api-key로 번역이 쌓이기만 함)
// AI 모드 여부는 모듈을 불러올 때 정해지므로, 확인을 먼저 하고 나머지는 그 뒤에 불러옴
if (process.env.ANTHROPIC_API_KEY) {
  try {
    await new Anthropic().models.list({ limit: 1 });
    setMeta('last_ai_error', '');
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) {
      noteAiError('key-check', err);
      console.warn(`[AI] API 키가 거절됐어요 (${err.status}). 이번 갱신은 무료 번역·데모 분석으로 돌려요.`);
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      console.warn(`[AI] 키 확인 중 오류 (${err?.status ?? err?.message}) — 그대로 AI 모드로 진행해요`);
    }
  }
}

const { refresh } = await import('./pipeline.js');
const { buildSite } = await import('./build.js');

const kst = new Date(Date.now() + 9 * 3600e3);
const kstDay = kst.toISOString().slice(0, 10);
const morningKey = `briefing_morning_${kstDay}`;
const morningDue = kst.getUTCHours() >= 7 && !getMeta(morningKey);

const briefing = process.argv.includes('--briefing') || morningDue ? 'force' : 'if-missing';
const report = await refresh({ analyze: true, briefing });
if (morningDue) setMeta(morningKey, '1');
const t = report.translated.map((x) => `${x.lang} ${x.translated}`).join(', ');
console.log(`[갱신] 새 기사 ${report.collect.added}건, 번역(${t}), 분석 ${report.analysis?.done ?? 0}건${morningDue ? ', 아침 브리핑 새로 만듦' : ''} (${report.seconds}초)`);
const b = buildSite();
console.log(`[만들기] 사건 ${b.events}개, 데이터 파일 ${b.files}개`);
