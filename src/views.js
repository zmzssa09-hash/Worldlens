// 화면에 보낼 데이터 모양 만들기 — 정적 파일 만들기(build.js)에서 사용
import { listEvents, getEvent, articlesForEvent, getAnalysis, getBriefing, getMeta, counts } from './db.js';
import { modeInfo, todayKey, localTitle } from './analyzer/index.js';
import { SOURCES, SOURCE_BY_ID, LANGS, BASE_LANG, countryName, outletName } from './sources.js';
import { guessCategory } from './category.js';

const parse = (s, fallback) => { try { return s ? JSON.parse(s) : fallback; } catch { return fallback; } };
export const sinceHours = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

// 사이트 아래쪽·약관에 보일 운영자 정보 (환경 변수에서 설정. 비어 있으면 표시하지 않음)
export const SITE_INFO = {
  contact_email: process.env.WORLDLENS_CONTACT_EMAIL || null,
  business_name: process.env.WORLDLENS_BUSINESS_NAME || null,
  owner: process.env.WORLDLENS_BUSINESS_OWNER || null,
  reg_no: process.env.WORLDLENS_BUSINESS_REG_NO || null,
  mail_order_no: process.env.WORLDLENS_MAIL_ORDER_NO || null,
  address: process.env.WORLDLENS_BUSINESS_ADDRESS || null,
};

// 해당 언어 분석 → 없으면 기준 언어 분석 (번역 대기 중)
function analysisFor(eventId, lang) {
  const row = getAnalysis(eventId, lang) || getAnalysis(eventId, BASE_LANG);
  return row ? { data: parse(row.json, null), lang: row.lang, mode: row.mode } : null;
}

// 읽는 시간(분): 한·중·일은 1분에 약 500자, 영어·프랑스어는 약 1,000자(200단어)
function readMinutes(data, lang) {
  if (!data) return null;
  const s = data.story || {};
  const text = [data.one_line, s.background, s.what_happened, s.why_it_matters, s.what_to_watch, data.impact, ...(data.facts || []).map((x) => x.text)].join(' ');
  const perMin = ['ko', 'ja', 'zh'].includes(lang) ? 500 : 1000;
  return Math.max(1, Math.round(text.length / perMin));
}

export function eventCard(e, lang) {
  const a = analysisFor(e.id, lang);
  const arts = articlesForEvent(e.id);
  const countries = [...new Set(arts.map((x) => x.country))];
  return {
    id: e.id,
    title: localTitle(e, lang),
    orig_title: lang === 'en' ? undefined : e.title, // 검색용 (영어 원문 제목)
    one_line: a?.lang === lang ? a.data?.one_line || null : null,
    region: e.region,
    category: guessCategory(arts),
    article_count: e.article_count,
    outlet_count: e.outlet_count,
    country_count: e.country_count,
    countries: countries.map((code) => ({ code, name: countryName(code, lang) })),
    first_seen: e.first_seen,
    last_updated: e.last_updated,
    analysis_mode: a?.mode ?? null,
    read_min: readMinutes(a?.data, lang),
  };
}

// 분석 안의 매체 id를 화면에 보일 이름으로 바꿔 줌
function localizeAnalysis(data, lang) {
  if (!data) return null;
  const src = (id) => SOURCE_BY_ID[id];
  return {
    ...data,
    facts: (data.facts || []).map((f) => ({ ...f, sources: (f.sources || []).map((id) => outletName(id, lang)) })),
    perspectives: (data.perspectives || []).filter((p) => src(p.source_id)).map((p) => ({
      ...p,
      outlet: outletName(p.source_id, lang),
      country: countryName(src(p.source_id).country, lang),
      state_media: !!src(p.source_id).stateMedia,
    })),
  };
}

export function statusData() {
  const report = parse(getMeta('last_collect_report'), null);
  return {
    ...modeInfo(),
    ...counts(),
    langs: LANGS,
    running: false,
    phase: null,
    last_collect: getMeta('last_collect'),
    last_refresh: getMeta('last_refresh'),
    sources_total: SOURCES.length,
    sources_ok: report?.ok?.length ?? null,
    sources_failed: report?.failed ?? [],
    translator: process.env.ANTHROPIC_API_KEY ? 'claude' : 'free',
    translation_pending: parse(getMeta('translation_pending'), {}),
    site: SITE_INFO,
  };
}

export function briefingData(lang) {
  const b = getBriefing(todayKey(), lang);
  if (!b) return null;
  const content = parse(b.content_json, {});
  // 30초 요약용: 각 사건의 한 줄 요약을 붙여 줌
  const items = (content.items || []).map((it) => ({ ...it, one_line: analysisFor(it.event_id, lang)?.data?.one_line || null }));
  return { date: b.date, lang: b.lang, mode: b.mode, created_at: b.created_at, ...content, items };
}

// 최근 48시간 사건 전부 (지역 거르기는 화면에서)
export function shownEvents() {
  return listEvents({ sinceIso: sinceHours(48), limit: 500 });
}

export function eventsData(lang, events = shownEvents()) {
  const regionCounts = {};
  for (const e of events) regionCounts[e.region] = (regionCounts[e.region] || 0) + 1;
  return { region_counts: regionCounts, events: events.map((e) => eventCard(e, lang)) };
}

export function eventDetail(id, lang) {
  const e = getEvent(id);
  if (!e) return null;
  const a = analysisFor(e.id, lang);
  const articles = articlesForEvent(e.id, lang).map((x) => ({
    outlet: outletName(x.source_id, lang),
    country: countryName(x.country, lang),
    state_media: !!x.state_media,
    title: x.t_title || x.title,
    summary: x.t_summary ?? x.summary,
    original_title: x.title,
    translated: !!x.t_title && lang !== 'en',
    url: x.url,
    published_at: x.published_at,
  }));
  return {
    ...eventCard(e, lang),
    analysis: localizeAnalysis(a?.data, lang),
    analysis_lang: a?.lang ?? null,
    articles,
  };
}
