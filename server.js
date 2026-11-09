import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listEvents, getEvent, articlesForEvent, getAnalysis, getBriefing, getMeta, counts } from './src/db.js';
import { modeInfo, todayKey, localTitle } from './src/analyzer/index.js';
import { refresh, isRunning, currentPhase, updates } from './src/pipeline.js';
import { startScheduler } from './src/scheduler.js';
import { SOURCES, SOURCE_BY_ID, REGIONS, LANGS, BASE_LANG, normLang, countryName, outletName } from './src/sources.js';
import {
  attachUser, createUser, checkLogin, findUserByEmail, startSession, endSession, validEmail, validPassword, tooManyAttempts, TRIAL_DAYS,
} from './src/auth.js';
import { hasAccess, publicUser, billingConfig, completeCardRegistration, devSubscribe, setCancel, DEV_BILLING, PROVIDER } from './src/billing.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1'; // 기본은 내 컴퓨터에서만 접속 가능

const app = express();
app.set('trust proxy', 'loopback');
app.use(express.static(join(ROOT, 'public'), { extensions: ['html'] }));
app.use(express.json({ limit: '20kb' }));
app.use(attachUser);

// 다른 사이트에서 몰래 보내는 요청(CSRF) 막기: POST는 같은 출처에서 온 것만 허용
app.use((req, res, next) => {
  if (req.method !== 'POST') return next();
  const origin = req.get('origin');
  if (origin && new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'bad_origin' });
  next();
});

// 운영자만 '지금 갱신'을 할 수 있음 (아무나 누르면 AI 비용이 듦)
const ADMIN_EMAIL = (process.env.WORLDLENS_ADMIN_EMAIL || '').toLowerCase();
const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const canRefresh = (req) => (ADMIN_EMAIL ? req.user?.email === ADMIN_EMAIL : isLocal(req));

// 사이트 아래쪽·약관에 보일 운영자 정보 (.env에서 설정. 비어 있으면 화면에 '준비 중'으로 보임)
const SITE_INFO = {
  contact_email: process.env.WORLDLENS_CONTACT_EMAIL || null,
  business_name: process.env.WORLDLENS_BUSINESS_NAME || null, // 상호
  owner: process.env.WORLDLENS_BUSINESS_OWNER || null, // 대표자
  reg_no: process.env.WORLDLENS_BUSINESS_REG_NO || null, // 사업자등록번호
  mail_order_no: process.env.WORLDLENS_MAIL_ORDER_NO || null, // 통신판매업 신고번호
  address: process.env.WORLDLENS_BUSINESS_ADDRESS || null,
};

const parse = (s, fallback) => { try { return s ? JSON.parse(s) : fallback; } catch { return fallback; } };
const sinceHours = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
const langOf = (req) => normLang(req.query.lang);

// 해당 언어 분석 → 없으면 기준 언어 분석 (번역 대기 중)
function analysisFor(eventId, lang) {
  const row = getAnalysis(eventId, lang) || getAnalysis(eventId, BASE_LANG);
  return row ? { data: parse(row.json, null), lang: row.lang, mode: row.mode } : null;
}

// 읽는 시간(분): '3분 만에 이해하기'와 확인된 사실을 읽는 데 걸리는 시간
// 한·중·일은 1분에 약 500자, 영어·프랑스어는 약 1,000자(200단어)
function readMinutes(data, lang) {
  if (!data) return null;
  const s = data.story || {};
  const text = [data.one_line, s.background, s.what_happened, s.why_it_matters, s.what_to_watch, data.impact, ...(data.facts || []).map((x) => x.text)].join(' ');
  const perMin = ['ko', 'ja', 'zh'].includes(lang) ? 500 : 1000;
  return Math.max(1, Math.round(text.length / perMin));
}

function eventCard(e, lang) {
  const a = analysisFor(e.id, lang);
  const countries = [...new Set(articlesForEvent(e.id).map((x) => x.country))];
  return {
    id: e.id,
    title: localTitle(e, lang),
    one_line: a?.lang === lang ? a.data?.one_line || null : null,
    region: e.region,
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

app.get('/api/status', (req, res) => {
  const report = parse(getMeta('last_collect_report'), null);
  res.json({
    ...modeInfo(),
    ...counts(),
    langs: LANGS,
    running: isRunning(),
    phase: currentPhase(),
    last_collect: getMeta('last_collect'),
    last_refresh: getMeta('last_refresh'),
    sources_total: SOURCES.length,
    sources_ok: report?.ok?.length ?? null,
    sources_failed: report?.failed ?? [],
    translator: process.env.ANTHROPIC_API_KEY ? 'claude' : 'free',
    translation_pending: parse(getMeta('translation_pending'), {}),
  });
});

app.get('/api/briefing', (req, res) => {
  const lang = langOf(req);
  const b = getBriefing(todayKey(), lang);
  if (!b) return res.json(null);
  const content = parse(b.content_json, {});
  // 30초 요약용: 각 사건의 한 줄 요약을 붙여 줌
  const items = (content.items || []).map((it) => ({ ...it, one_line: analysisFor(it.event_id, lang)?.data?.one_line || null }));
  res.json({ date: b.date, lang: b.lang, mode: b.mode, created_at: b.created_at, ...content, items });
});

app.get('/api/events', (req, res) => {
  const lang = langOf(req);
  const region = REGIONS.includes(req.query.region) ? req.query.region : undefined;
  const events = listEvents({ region, sinceIso: sinceHours(48), limit: 60 });
  // 지역별 사건 수 (세계 정세 한눈에 보기)
  const regionCounts = {};
  for (const e of listEvents({ sinceIso: sinceHours(48), limit: 500 })) regionCounts[e.region] = (regionCounts[e.region] || 0) + 1;
  res.json({ region_counts: regionCounts, events: events.map((e) => eventCard(e, lang)) });
});

app.get('/api/events/:id', (req, res) => {
  const lang = langOf(req);
  const e = getEvent(Number(req.params.id));
  if (!e) return res.status(404).json({ error: 'not_found' });
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
  let analysis = localizeAnalysis(a?.data, lang);
  // 나라별 관점 (비판적 / 중립 / 우호적): 어느 칸인지는 무료 맛보기, 매체별 설명은 유료
  const access = hasAccess(req.user);
  const stances = !access && analysis ? (analysis.perspectives || []).filter((p) => p.stance)
    .map(({ country, outlet, state_media, stance }) => ({ country, outlet, state_media, stance })) : null;
  let locked = null;
  if (analysis && !access) {
    // 유료: 나라별 관점·가설. 개수만 알려 주고 내용은 보내지 않음
    locked = { perspectives: analysis.perspectives?.length || 0, hypotheses: analysis.hypotheses?.length || 0 };
    analysis = { ...analysis, perspectives: [], differences: null, hypotheses: [] };
  }
  res.json({
    ...eventCard(e, lang),
    analysis,
    analysis_lang: a?.lang ?? null,
    locked,
    stances,
    articles,
  });
});

// 실시간 알림 (Server-Sent Events): 새 기사·분석·번역이 생기면 접속 중인 브라우저에 바로 알림
app.get('/api/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write('retry: 5000\n\n');
  const send = (u) => res.write(`event: update\ndata: ${JSON.stringify(u)}\n\n`);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000); // 연결 유지
  updates.on('update', send);
  req.on('close', () => { clearInterval(ping); updates.off('update', send); });
});

app.post('/api/refresh', async (req, res) => {
  if (!canRefresh(req)) return res.status(403).json({ error: 'forbidden' });
  if (isRunning()) return res.status(202).json({ status: 'running' });
  refresh({ analyze: true, briefing: 'force' }).catch((e) => console.error('[갱신 오류]', e));
  res.status(202).json({ status: 'started' });
});

// ── 회원 ──
app.get('/api/me', (req, res) => {
  res.json({ user: publicUser(req.user), billing: billingConfig(), trial_days: TRIAL_DAYS, can_refresh: canRefresh(req), site: SITE_INFO });
});

app.post('/api/auth/signup', (req, res) => {
  if (tooManyAttempts(req.ip)) return res.status(429).json({ error: 'too_many' });
  const { email, password, lang } = req.body || {};
  if (!validEmail(email)) return res.status(400).json({ error: 'bad_email' });
  if (!validPassword(password)) return res.status(400).json({ error: 'bad_password' });
  if (findUserByEmail(email)) return res.status(409).json({ error: 'email_taken' });
  const id = createUser(email, password, normLang(lang));
  startSession(res, req, id);
  res.json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  if (tooManyAttempts(req.ip)) return res.status(429).json({ error: 'too_many' });
  const { email, password } = req.body || {};
  const u = validEmail(email) && typeof password === 'string' ? checkLogin(email, password) : null;
  if (!u) return res.status(401).json({ error: 'bad_login' });
  startSession(res, req, u.id);
  res.json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  endSession(req, res);
  res.json({ ok: true });
});

// ── 구독·결제 ──
const needUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'login_required' }));

// 카드 등록 창을 열 때 필요한 값 (토스 결제창에 넘김)
app.post('/api/billing/prepare', needUser, (req, res) => {
  if (PROVIDER !== 'toss') return res.status(400).json({ error: 'toss_not_configured' });
  const origin = `${req.protocol}://${req.get('host')}`;
  res.json({
    client_key: billingConfig().client_key,
    customer_key: req.user.customer_key,
    customer_email: req.user.email,
    success_url: `${origin}/billing/success`,
    fail_url: `${origin}/billing/fail`,
  });
});

// 토스 카드 등록이 끝나면 이 주소로 돌아옴 (?authKey=&customerKey=)
app.get('/billing/success', async (req, res) => {
  if (!req.user) return res.redirect('/login?next=/account');
  const { authKey, customerKey } = req.query;
  if (typeof authKey !== 'string' || typeof customerKey !== 'string') return res.redirect('/account?result=fail');
  try {
    const r = await completeCardRegistration(req.user.id, authKey, customerKey);
    res.redirect(r.ok ? '/account?result=ok' : `/account?result=fail&message=${encodeURIComponent(r.error || '')}`);
  } catch (e) {
    console.warn('[카드 등록 실패]', e.message);
    res.redirect(`/account?result=fail&message=${encodeURIComponent(e.message)}`);
  }
});
app.get('/billing/fail', (req, res) => {
  const msg = typeof req.query.message === 'string' ? req.query.message : '';
  res.redirect(`/account?result=fail&message=${encodeURIComponent(msg)}`);
});

app.post('/api/billing/dev-subscribe', needUser, (req, res) => {
  if (!DEV_BILLING) return res.status(403).json({ error: 'disabled' });
  devSubscribe(req.user.id);
  res.json({ ok: true });
});
app.post('/api/billing/cancel', needUser, (req, res) => { setCancel(req.user.id, true); res.json({ ok: true }); });
app.post('/api/billing/resume', needUser, (req, res) => { setCancel(req.user.id, false); res.json({ ok: true }); });

app.listen(PORT, HOST, () => {
  const { mode, model } = modeInfo();
  console.log(`\n🌍 WorldLens 실행 중 → http://localhost:${PORT}`);
  console.log(`   분석 모드: ${mode === 'ai' ? `AI (${model})` : '데모 (API 키 없음)'} · 언어: ${LANGS.join(', ')}\n`);
  startScheduler();
  console.log(`   결제: ${PROVIDER === 'toss' ? '토스페이먼츠' : DEV_BILLING ? '개발용 테스트 결제 (실제 결제 아님)' : '꺼짐'}`);
  // 켜자마자 한 번 갱신 (마지막 갱신이 5분 넘게 지났으면)
  const last = getMeta('last_refresh');
  if (!last || Date.now() - Date.parse(last) > 5 * 60 * 1000) {
    console.log('[시작] 최신 뉴스를 가져오는 중…');
    refresh({ analyze: true, briefing: 'if-missing' }).catch((e) => console.error('[갱신 오류]', e));
  }
});
