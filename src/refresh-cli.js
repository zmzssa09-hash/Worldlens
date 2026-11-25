// 한 번 갱신하고 정적 파일까지 만들기: npm run refresh
// GitHub Actions가 주기적으로 이걸 실행해서 Vercel에 올림
//   --briefing   오늘의 브리핑을 새로 만듦 (기본: 오늘 브리핑이 없을 때만)
// 한국 시간 아침 7시가 지난 첫 갱신은 브리핑을 새로 만듦 (밤사이 뉴스까지 담기게)
//  → 예전엔 7시 예약 실행이 따로 있었는데, 20분 갱신 사슬과 부딪혀 매번 '취소됨'으로 끝나고 메일이 갔음
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getMeta, setMeta, noteAiError } from './db.js';

// ── AI 키 정리·확인 ──
// AI 모드·제공자는 모듈을 불러올 때 정해지므로, 키 확인을 먼저 하고 나머지는 그 뒤에 불러옴
// 붙여 넣을 때 딸려 온 공백·줄바꿈·따옴표는 걷어냄 (Secrets에 키를 복사해 넣다 흔히 생김)
const clean = (name) => {
  const v = (process.env[name] || '').trim().replace(/^["'`]+|["'`]+$/g, '').trim();
  if (v) process.env[name] = v; else delete process.env[name];
};
clean('ANTHROPIC_API_KEY');
clean('OPENAI_API_KEY');
// ANTHROPIC_API_KEY 자리에 OpenAI 키(sk-proj-…, sk-…)를 넣은 경우 → OpenAI 키로 옮김 (2026-11-25 실제로 그랬음)
const ak = process.env.ANTHROPIC_API_KEY;
if (ak && !ak.startsWith('sk-ant-') && ak.startsWith('sk-')) {
  if (!process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = ak;
  delete process.env.ANTHROPIC_API_KEY;
  console.log('[AI] ANTHROPIC_API_KEY에 OpenAI 키가 들어 있어 OpenAI로 분석해요');
}
// 키 모양: 앞 10글자('sk-ant-api' 등, 비밀 아님)와 길이만 남김 → 엉뚱한 값을 넣었는지 로그 없이 알 수 있게
const keyShape = (k) => (k ? `${k.slice(0, 10)}… (${k.length}자)` : '없음');
// 키가 틀렸으면(401·403) 그 키는 빼고 진행 → 틀린 키 때문에 번역·분석이 전부 멈추던 문제 방지
async function checkKey(name, label, probe) {
  if (!process.env[name]) return;
  try {
    await probe();
    setMeta('last_ai_error', '');
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) {
      noteAiError(`key-check(${label}) · 키 모양 ${keyShape(process.env[name])}`, err);
      console.warn(`[AI] ${label} 키가 거절됐어요 (${err.status}). 이 키 없이 진행해요.`);
      delete process.env[name];
    } else {
      console.warn(`[AI] ${label} 키 확인 중 오류 (${err?.status ?? err?.message}) — 그대로 진행해요`);
    }
  }
}
await checkKey('ANTHROPIC_API_KEY', 'Claude', () => new Anthropic().models.list({ limit: 1 }));
if (!process.env.ANTHROPIC_API_KEY) await checkKey('OPENAI_API_KEY', 'OpenAI', () => new OpenAI().models.list());

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
