// 분석 흐름
// 1) 기준 언어(한국어)로 분석: 키가 있으면 Claude, 없으면 데모 분석기
// 2) 나머지 언어로 현지화: AI 분석은 자동 번역(비용 추가 없음), 데모는 언어별 문장 틀로 다시 생성
import * as demo from './demo.js';
import {
  db, listEvents, articlesForEvent, articleTitle, getAnalysis, saveAnalysis, markAnalyzed, saveBriefing,
} from '../db.js';
import { LANGS, BASE_LANG } from '../sources.js';
import { translateJson, translationEnabled } from '../translator.js';

export const MODE = process.env.ANTHROPIC_API_KEY ? 'ai' : 'demo';
const claude = MODE === 'ai' ? await import('./claude.js') : null;

// AI 비용 안전장치 (5분마다 갱신하므로 꼭 필요)
const MAX_AI_EVENTS = Number(process.env.WORLDLENS_MAX_AI_EVENTS || 4);          // 한 번 갱신에 AI로 분석할 최대 사건 수
const MAX_AI_PER_DAY = Number(process.env.WORLDLENS_MAX_AI_PER_DAY || 120);       // 하루 최대 AI 분석 횟수
const REANALYZE_MIN = Number(process.env.WORLDLENS_REANALYZE_MINUTES || 60);     // 같은 사건을 다시 분석하기까지 최소 간격(분)
const WINDOW_MS = 48 * 3600 * 1000;

function aiCountToday() {
  return Number(db.prepare('SELECT value FROM meta WHERE key = ?').get(`ai_count_${todayKey()}`)?.value || 0);
}
function bumpAiCount() {
  db.prepare(`INSERT INTO meta (key, value) VALUES (?, '1') ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1`).run(`ai_count_${todayKey()}`);
}
const OTHER_LANGS = LANGS.filter((l) => l !== BASE_LANG);
// 번역하면 안 되는 값: 매체 id, 가설 종류·확신도 코드, 사건 번호
const KEEP = new Set(['sources', 'source_id', 'kind', 'confidence', 'stance', 'applicable', 'event_id']);

export function modeInfo() {
  return { mode: MODE, model: claude?.MODEL ?? null };
}

const recentEvents = (limit = 200) => listEvents({ sinceIso: new Date(Date.now() - WINDOW_MS).toISOString(), limit });

function needsAnalysis(e) {
  // 'sample' = 직접 넣어 둔 예시 분석 → 자동 분석이 덮어쓰지 않음 (API 키를 넣으면 AI 분석으로 교체)
  if (e.analysis_mode === 'sample' && MODE !== 'ai') return false;
  if (!getAnalysis(e.id, BASE_LANG)) return true;
  if (e.analysis_mode !== MODE) return true;
  if (MODE !== 'ai') return e.article_count > e.analyzed_article_count;
  // AI: 새 기사가 2건 이상 늘었고, 마지막 분석 뒤 일정 시간이 지났을 때만 다시 분석
  const minutesSince = (Date.now() - Date.parse(e.analyzed_at || 0)) / 60000;
  return e.article_count - e.analyzed_article_count >= 2 && minutesSince >= REANALYZE_MIN;
}

// 1) 기준 언어 분석 (처음 보는 사건을 먼저, 그다음 보도가 많이 늘어난 사건)
export async function analyzePending() {
  const events = recentEvents().filter(needsAnalysis)
    .sort((a, b) => (a.analysis_mode ? 1 : 0) - (b.analysis_mode ? 1 : 0));
  let targets = events;
  if (MODE === 'ai') {
    const left = Math.max(0, MAX_AI_PER_DAY - aiCountToday());
    if (!left && events.length) console.warn(`[분석] 오늘 AI 분석 상한(${MAX_AI_PER_DAY}회)에 도달했어요. 내일 다시 분석해요.`);
    targets = events.slice(0, Math.min(MAX_AI_EVENTS, left));
  }
  let done = 0, failed = 0;
  for (const e of targets) {
    try {
      const analysis = MODE === 'ai'
        ? await claude.analyzeEvent(e, articlesForEvent(e.id))
        : demo.analyzeEvent(e, articlesForEvent(e.id, BASE_LANG), BASE_LANG);
      saveAnalysis(e.id, BASE_LANG, analysis, MODE);
      markAnalyzed(e.id, MODE, e.article_count);
      if (MODE === 'ai') bumpAiCount();
      done++;
    } catch (err) {
      failed++;
      console.warn(`[분석 실패] 사건 ${e.id}: ${err.message}`);
    }
  }
  // 데모 분석은 비용이 없으니 기준 언어도 매번 새로 (분석 뒤에 들어온 기사 번역을 바로 반영)
  if (MODE !== 'ai') {
    const fresh = new Set(targets.map((e) => e.id));
    for (const e of recentEvents()) {
      if (fresh.has(e.id) || getAnalysis(e.id, BASE_LANG)?.mode !== 'demo') continue;
      saveAnalysis(e.id, BASE_LANG, demo.analyzeEvent(e, articlesForEvent(e.id, BASE_LANG), BASE_LANG), 'demo');
    }
  }
  return { done, failed, waiting: events.length - targets.length };
}

// 2) 다른 언어로 현지화 (기준 분석보다 오래됐거나 없는 것만)
export async function localizeAnalyses(lang) {
  let done = 0;
  for (const e of recentEvents()) {
    const base = getAnalysis(e.id, BASE_LANG);
    if (!base) continue;
    // 데모 분석은 비용이 없으니 매번 새로 (기사 번역이 늘어나면 바로 반영). AI 분석은 기준 분석이 바뀐 것만 번역
    const cur = getAnalysis(e.id, lang);
    if (base.mode !== 'demo' && cur && cur.created_at >= base.created_at && cur.mode === base.mode) continue;
    try {
      let analysis;
      if (base.mode === 'demo') analysis = demo.analyzeEvent(e, articlesForEvent(e.id, lang), lang);
      else if (translationEnabled()) analysis = await translateJson(JSON.parse(base.json), lang, KEEP);
      else continue;
      saveAnalysis(e.id, lang, analysis, base.mode);
      done++;
    } catch (err) {
      if (!err.message.startsWith('무료 번역이 잠시')) console.warn(`[현지화 실패:${lang}] 사건 ${e.id}: ${err.message}`);
      break; // 번역이 막혔으면 다음 갱신 때 이어서
    }
  }
  return { lang, done };
}

export function todayKey() {
  return new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD (현지 시간)
}

// 사건 제목: 해당 언어 분석 제목 → 대표 기사 번역 제목 → 원문
export function localTitle(e, lang) {
  const a = getAnalysis(e.id, lang);
  if (a) { const t = JSON.parse(a.json).title; if (t) return t; }
  return (e.rep_article_id && articleTitle(e.rep_article_id, lang)) || e.title;
}

function briefingEvents(lang) {
  const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
  return listEvents({ sinceIso: since, limit: 15 }).map((e) => {
    const a = getAnalysis(e.id, lang);
    return { ...e, title_local: localTitle(e, lang), one_line: a ? JSON.parse(a.json).one_line : '' };
  });
}

export async function buildBriefing() {
  const events = briefingEvents(BASE_LANG);
  if (!events.length) return null;
  let content, mode = MODE;
  try {
    content = MODE === 'ai' ? await claude.makeBriefing(events) : demo.makeBriefing(events, BASE_LANG);
  } catch (err) {
    console.warn(`[브리핑 실패] ${err.message} → 데모 브리핑으로 대체`);
    content = demo.makeBriefing(events, BASE_LANG);
    mode = 'demo';
  }
  // 존재하지 않는 사건 id가 섞이지 않게 정리
  const valid = new Set(events.map((e) => e.id));
  content.items = (content.items || []).filter((it) => valid.has(it.event_id));
  saveBriefing(todayKey(), BASE_LANG, content, mode);
  return content;
}

export async function localizeBriefing(lang) {
  const base = db.prepare('SELECT * FROM briefings WHERE date = ? AND lang = ?').get(todayKey(), BASE_LANG);
  if (!base) return false;
  const cur = db.prepare('SELECT * FROM briefings WHERE date = ? AND lang = ?').get(todayKey(), lang);
  if (base.mode !== 'demo' && cur && cur.created_at >= base.created_at) return false;
  let content;
  if (base.mode === 'demo') {
    // 데모 브리핑은 같은 사건 순서로 언어별 문장 틀을 다시 채움
    const ids = JSON.parse(base.content_json).items.map((it) => it.event_id);
    const byId = new Map(briefingEvents(lang).map((e) => [e.id, e]));
    content = demo.makeBriefing(ids.map((id) => byId.get(id)).filter(Boolean), lang);
  } else if (translationEnabled()) {
    content = await translateJson(JSON.parse(base.content_json), lang, KEEP);
  } else return false;
  saveBriefing(todayKey(), lang, content, base.mode);
  return true;
}

export function hasBriefingToday() {
  return !!db.prepare('SELECT 1 FROM briefings WHERE date = ? AND lang = ? AND mode = ?').get(todayKey(), BASE_LANG, MODE);
}

export { OTHER_LANGS };
