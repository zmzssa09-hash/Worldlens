// 자동 번역
// - API 키가 있으면: Claude Haiku로 번역 (안정적, 매우 저렴)
// - 키가 없으면: 무료 Google 번역 주소를 천천히 사용. 공식 API가 아니라 요청이 많으면 한동안 막힘(429)
//   → 한 번에 조금씩만 번역하고, 막히면 멈췄다가 다음 갱신(매시간) 때 이어서
import { db, saveArticleTranslation } from './db.js';

const USE_CLAUDE = !!process.env.ANTHROPIC_API_KEY;
const TRANSLATE_MODEL = process.env.WORLDLENS_TRANSLATE_MODEL || 'claude-haiku-5-5';
const LANG_NAME = { ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Simplified Chinese', fr: 'French' };
let claudeClient;

async function translateWithClaude(texts, lang) {
  if (!claudeClient) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    claudeClient = new Anthropic();
  }
  const response = await claudeClient.messages.create({
    model: TRANSLATE_MODEL,
    max_tokens: 16000,
    output_config: {
      effort: 'low',
      format: {
        type: 'json_schema',
        schema: { type: 'object', properties: { translations: { type: 'array', items: { type: 'string' } } }, required: ['translations'], additionalProperties: false },
      },
    },
    system: `You translate news headlines and summaries into natural ${LANG_NAME[lang]} for general readers. Keep names of people, places and organisations in their standard ${LANG_NAME[lang]} form. Translate faithfully; do not add or omit information.`,
    messages: [{ role: 'user', content: `Translate each item into ${LANG_NAME[lang]}. Return exactly ${texts.length} translations in the same order.\n\n${JSON.stringify(texts)}` }],
  });
  if (response.stop_reason !== 'end_turn') throw new Error(`번역 중단 (${response.stop_reason})`);
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const out = JSON.parse(text).translations;
  if (out.length !== texts.length) throw new Error('번역 개수가 맞지 않아요');
  return out;
}

const GT_CODE = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-CN', fr: 'fr' };
const BATCH_CHARS = 3000;
const SEP = '\n\n';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const translationEnabled = () => process.env.WORLDLENS_TRANSLATE !== 'off';

let blockedUntil = 0; // 막혔으면 30분 동안은 무료 번역 요청을 보내지 않음

async function translateRaw(text, lang) {
  if (Date.now() < blockedUntil) throw new Error('무료 번역이 잠시 막혀 있어요 (30분 뒤 다시 시도)');
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${GT_CODE[lang]}&dt=t`;
  // 너무 자주 요청하면 429(요청 과다)로 막힘 → 20초, 60초 기다렸다가 다시 시도
  for (const wait of [0, 20000, 60000]) {
    if (wait) { console.warn(`[번역] 요청이 많아 ${wait / 1000}초 기다렸다가 다시 시도해요`); await sleep(wait); }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `q=${encodeURIComponent(text)}`,
      signal: AbortSignal.timeout(20000),
    });
    if (res.status === 429) continue;
    if (!res.ok) throw new Error(`번역 HTTP ${res.status}`);
    const j = await res.json();
    await sleep(1000); // 요청 사이 간격
    return (j[0] || []).map((s) => s[0]).join('');
  }
  blockedUntil = Date.now() + 30 * 60 * 1000;
  throw new Error('번역 HTTP 429 (요청 과다) — 30분 동안 쉬어요');
}

// 여러 문장을 한 번에 보내고 빈 줄 기준으로 다시 나눔. 개수가 안 맞으면 하나씩 번역.
export async function translateTexts(texts, lang) {
  const clean = texts.map((t) => String(t ?? '').replace(/\s*\n+\s*/g, ' ').trim() || '-');
  if (USE_CLAUDE) {
    const out = [];
    for (let i = 0; i < clean.length; i += 60) out.push(...await translateWithClaude(clean.slice(i, i + 60), lang));
    return out.map((t, k) => (clean[k] === '-' ? '' : t));
  }
  const out = new Array(clean.length);
  let i = 0;
  while (i < clean.length) {
    let j = i, len = 0;
    while (j < clean.length && (j === i || len + clean[j].length + SEP.length <= BATCH_CHARS)) len += clean[j++].length + SEP.length;
    const chunk = clean.slice(i, j);
    const translated = (await translateRaw(chunk.join(SEP), lang)).split(/\n\s*\n/).map((s) => s.trim());
    if (translated.length === chunk.length) translated.forEach((t, k) => { out[i + k] = t; });
    else for (let k = 0; k < chunk.length; k++) { out[i + k] = (await translateRaw(chunk[k], lang)).trim(); await sleep(150); }
    i = j;
    await sleep(300);
  }
  return out.map((t, k) => (clean[k] === '-' ? '' : t));
}

// 화면에 나오는 기사(여러 매체가 함께 보도한 사건의 기사) 중 아직 lang 번역이 없는 것을 번역해서 저장
// 한 매체만 다룬 기사는 화면에 나오지 않으므로 번역하지 않음 → 번역 요청을 크게 줄임
// 무료 번역은 한 번에 언어당 200건까지만 (막히지 않도록). 남은 건 다음 갱신 때 이어서.
// 사건 제목이 되는 대표 기사를 가장 먼저 번역
export async function translateArticles(lang, { limit = USE_CLAUDE ? 400 : 200 } = {}) {
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const FROM = `FROM articles a
    JOIN events e ON e.id = a.event_id AND e.outlet_count >= 2 AND e.last_updated >= ?
    LEFT JOIN article_i18n i ON i.article_id = a.id AND i.lang = ?
    WHERE i.article_id IS NULL`;
  const total = db.prepare(`SELECT count(*) n ${FROM}`).get(since, lang).n;
  const rows = db.prepare(`SELECT a.id, a.title, a.summary ${FROM}
    ORDER BY (a.id = e.rep_article_id) DESC, e.country_count DESC, a.published_at DESC LIMIT ?`).all(since, lang, limit);
  if (!rows.length) return { lang, translated: 0, remaining: 0 };

  // 수집하는 매체가 모두 영어판이라 영어는 원문을 그대로 사용
  if (lang === 'en' || !translationEnabled()) {
    if (lang !== 'en') return { lang, translated: 0, skipped: 'off' };
    for (const r of rows) saveArticleTranslation(r.id, 'en', r.title, r.summary || '');
    return { lang, translated: rows.length };
  }

  let translated = 0;
  // 50개씩 나눠서 번역·저장 (중간에 막혀도 그때까지 한 것은 남김)
  for (let s = 0; s < rows.length; s += 50) {
    const part = rows.slice(s, s + 50);
    const texts = part.flatMap((r) => [r.title, r.summary || '']);
    try {
      const res = await translateTexts(texts, lang);
      part.forEach((r, k) => {
        const t = res[k * 2];
        if (t) { saveArticleTranslation(r.id, lang, t, r.summary ? res[k * 2 + 1] : ''); translated++; }
      });
    } catch (e) {
      // 막혀서 쉬는 중이면 5분마다 같은 경고를 반복하지 않음
      if (!e.message.startsWith('무료 번역이 잠시')) console.warn(`[번역 실패:${lang}] ${e.message} — 남은 기사는 다음에 다시 시도해요`);
      break;
    }
  }
  return { lang, translated, remaining: total - translated };
}

// 분석 결과(JSON) 안의 글자만 골라 번역. skipKeys에 있는 필드(출처 id, 확신도 같은 코드값)는 그대로 둠
export async function translateJson(obj, lang, skipKeys = new Set()) {
  const slots = [];
  const walk = (node, key) => {
    if (typeof node === 'string') return skipKeys.has(key) ? node : (slots.push(node), { __slot: slots.length - 1 });
    if (Array.isArray(node)) return node.map((v) => walk(v, key));
    if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v, k)]));
    return node;
  };
  const skeleton = walk(obj, null);
  const translated = slots.length ? await translateTexts(slots, lang) : [];
  const fill = (node) => {
    if (node && typeof node === 'object' && '__slot' in node) return translated[node.__slot] || slots[node.__slot];
    if (Array.isArray(node)) return node.map(fill);
    if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, fill(v)]));
    return node;
  };
  return fill(skeleton);
}
