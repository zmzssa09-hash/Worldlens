// WorldLens 화면 스크립트 (빌드 없이 바로 동작)
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '#');

// ── 언어 ──
const LANG_CODES = window.WL_LANGS.map(([c]) => c);
function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANG_CODES.includes(q)) return q;
  try { const s = localStorage.getItem('wl-lang'); if (LANG_CODES.includes(s)) return s; } catch {}
  const nav = (navigator.language || 'ko').slice(0, 2);
  return LANG_CODES.includes(nav) ? nav : 'ko';
}
let LANG = pickLang();
let T = window.WL_I18N[LANG];
const LOCALE = () => window.WL_LOCALE[LANG];

// ── 글자 크기 (보통 / 크게 / 아주 크게) — 이 브라우저에만 저장 ──
const FONT_STEPS = [1, 1.125, 1.25];
let fontStep = 0;
try { fontStep = Math.min(2, Math.max(0, Number(localStorage.getItem('wl-font')) || 0)); } catch {}
const applyFont = () => { document.documentElement.style.fontSize = `${FONT_STEPS[fontStep] * 100}%`; };
applyFont();

// ── 관심 지역 (첫 방문 때 고름) — null이면 아직 안 고름, []이면 건너뜀 ──
const FAV_REGIONS = ['asia', 'europe', 'middle-east', 'americas', 'africa', 'oceania'];
let FAV = null, storageOk = true;
try { const v = JSON.parse(localStorage.getItem('wl-regions') || 'null'); FAV = Array.isArray(v) ? v.filter((r) => FAV_REGIONS.includes(r)) : null; } catch { storageOk = false; }
function saveFav(list) {
  FAV = list;
  try { localStorage.setItem('wl-regions', JSON.stringify(list)); } catch {}
}

// 첫 문장만 (한눈에 보기용)
const firstSentence = (t = '') => (String(t).match(/^.{12,}?[.!?。！？](?=\s|$)|^.{12,}?[。！？]/)?.[0] || String(t)).trim();

function setLang(l) {
  LANG = l; T = window.WL_I18N[l];
  try { localStorage.setItem('wl-lang', l); } catch {}
  const u = new URL(location.href);
  u.searchParams.delete('lang');
  history.replaceState(null, '', u);
  applyChrome();
  renderPage();
}

const api = async (path, opts) => {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`${path}${sep}lang=${LANG}`, opts);
  if (!r.ok && r.status !== 202) throw new Error(`${r.status}`);
  return r.json();
};

function ago(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return T.ago_now;
  if (m < 60) return T.ago_m(m);
  const h = Math.round(m / 60);
  if (h < 24) return T.ago_h(h);
  return T.ago_d(Math.round(h / 24));
}
const fmtDay = (iso) => new Date(iso).toLocaleDateString(LOCALE(), { month: 'long', day: 'numeric', weekday: 'short' });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit', hour12: false });

const ICON_LENS = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="14" cy="14" r="9"/><path d="M5 14h18M14 5c3 3 3 15 0 18M14 5c-3 3-3 15 0 18" stroke-width="1.6"/><path d="M21 21l6 6" stroke-linecap="round"/></svg>';
const ICON_REFRESH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>';
const ICON_USER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const ICON_GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>';

// ── 헤더·푸터 ──
const page = document.body.dataset.page;
function applyChrome() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hans' : LANG;
  const el = $('#site-header');
  el.className = 'site-header';
  el.innerHTML = `<div class="wrap">
    <a class="logo" href="/">${ICON_LENS}<span>WorldLens</span></a>
    <nav class="nav">
      <a href="/" ${page === 'home' || page === 'event' ? 'aria-current="page"' : ''}>${esc(T.nav_today)}</a>
      <a href="/about" ${page === 'about' ? 'aria-current="page"' : ''}>${esc(T.nav_about)}</a>
    </nav>
    <div class="header-right">
      <span class="status" id="status"><i class="dot"></i><span class="label">${esc(T.st_loading)}</span></span>
      <label class="lang-select" title="${esc(T.lang_label)}">${ICON_GLOBE}
        <select id="lang" aria-label="${esc(T.lang_label)}">${window.WL_LANGS.map(([c, n]) => `<option value="${c}" ${c === LANG ? 'selected' : ''}>${n}</option>`).join('')}</select>
      </label>
      <button class="btn font-btn" id="font-size" title="${esc(T.font_label)}" aria-label="${esc(`${T.font_label}: ${T.font_sizes[fontStep]}`)}"><span aria-hidden="true">A<b>A</b></span></button>
      ${ME?.can_refresh ? `<button class="btn" id="refresh" title="${esc(T.refresh_title)}">${ICON_REFRESH}<span class="label">${esc(T.refresh)}</span></button>` : ''}
      ${ME?.user ? `<a class="btn ${page === 'account' ? 'on' : ''}" href="/account">${ICON_USER}<span class="label">${esc(T.nav_account)}</span></a>`
        : `<a class="btn primary" href="/login">${esc(T.nav_login)}</a>`}
    </div>
  </div>`;
  $('#lang').addEventListener('change', (ev) => setLang(ev.target.value));
  $('#refresh')?.addEventListener('click', async () => {
    $('#refresh').disabled = true;
    await api('/api/refresh', { method: 'POST' }).catch(() => {});
    watchStatus(true);
  });
  $('#font-size').addEventListener('click', () => {
    fontStep = (fontStep + 1) % FONT_STEPS.length;
    try { localStorage.setItem('wl-font', String(fontStep)); } catch {}
    applyFont();
    $('#font-size').setAttribute('aria-label', `${T.font_label}: ${T.font_sizes[fontStep]}`);
    toast(`${T.font_label}: ${T.font_sizes[fontStep]}`);
  });
  const f = $('#site-footer');
  if (f) f.innerHTML = footerHtml();
  if (page === 'home') document.title = T.title_home;
  if (page === 'about') document.title = T.title_about;
  if (page === 'login') document.title = T.title_login;
  if (page === 'account') document.title = T.title_account;
  if (window.__status) paintStatus(window.__status);
}

// 아래쪽 정보: 소개·약관·문의 + 사업자 정보 (.env에서 설정)
function footerHtml() {
  const s = ME?.site || {};
  const biz = [[T.b_name, s.business_name], [T.b_owner, s.owner], [T.b_reg, s.reg_no], [T.b_mail, s.mail_order_no], [T.b_addr, s.address]]
    .filter(([, v]) => v).map(([k, v]) => `<span>${esc(k)} ${esc(v)}</span>`).join('');
  return `<div class="wrap foot">
    <nav class="foot-links" aria-label="${esc(T.f_about)}">
      <a href="/about">${esc(T.f_about)}</a><a href="/terms">${esc(T.f_terms)}</a><a href="/privacy"><b>${esc(T.f_privacy)}</b></a><a href="/refund">${esc(T.f_refund)}</a>
      ${s.contact_email ? `<a href="mailto:${esc(s.contact_email)}">${esc(T.f_contact)}</a>` : ''}
    </nav>
    <p class="biz">${biz || esc(T.b_pending)}${s.contact_email ? `<span>${esc(T.f_contact)} ${esc(s.contact_email)}</span>` : ''}</p>
    <p class="copy">${esc(T.footer)}</p>
  </div>`;
}

let statusTimer = null;
let lastSeen = { refresh: null, localize: null };
function paintStatus(s, expectRun = false) {
  const st = $('#status');
  if (!st) return;
  const busy = (s.running && s.phase !== 'localize') || (expectRun && !s.running && !s.last_refresh);
  const label = busy ? T.st_busy
    : s.phase === 'localize' ? T.st_localizing
      : T.st_updated(s.mode === 'ai' ? T.st_ai : T.st_demo, ago(s.last_refresh) || T.st_never);
  const live = streamOpen ? `<span class="live">${esc(T.live)}</span>` : '';
  st.innerHTML = `${live}<i class="dot ${s.mode} ${s.running ? 'busy' : ''}"></i><span class="label">${esc(label)}</span>`;
  st.title = T.st_title(s.sources_ok ?? '?', s.sources_total, s.articles, s.events);
  if ($('#refresh')) $('#refresh').disabled = !!s.running;
}
async function watchStatus(expectRun = false) {
  clearTimeout(statusTimer);
  let s;
  try { s = await api('/api/status'); } catch { return; }
  window.__status = s;
  paintStatus(s, expectRun);
  // 1단계(수집·분석)가 끝나면 바로, 다른 언어 번역이 끝나면 한 번 더 다시 그림
  const changed = (lastSeen.refresh && s.last_refresh !== lastSeen.refresh) || (lastSeen.running && !s.running);
  lastSeen = { refresh: s.last_refresh, running: s.running };
  if (changed) renderPage();
  statusTimer = setTimeout(() => watchStatus(), s.running || expectRun ? 3000 : 60000);
}

const pills = (countries, max = 6) => {
  const shown = countries.slice(0, max).map((c) => `<span class="pill">${esc(c.name)}</span>`).join('');
  return shown + (countries.length > max ? `<span class="pill">+${countries.length - max}</span>` : '');
};
// 중요도: 보도한 나라 수로 1~3단계
const heatLevel = (n) => (n >= 6 ? 3 : n >= 4 ? 2 : 1);
const heat = (n) => { const l = heatLevel(n); return `<span class="heat h${l}" title="${esc(T.coverage_title(n))}"><span aria-hidden="true">${'🔥'.repeat(l)}</span> ${esc(T.heat[l - 1])}</span>`; };
const withLang = (href) => href; // 언어는 저장돼 있어 링크에 붙일 필요 없음

// ── 홈 ──
let currentRegion = '';
const ORDER = ['asia', 'europe', 'middle-east', 'americas', 'africa', 'oceania', 'global'];
async function renderHome() {
  const [briefing, data] = await Promise.all([api('/api/briefing'), api(`/api/events${currentRegion ? `?region=${currentRegion}` : ''}`)]);
  const s = window.__status;
  const today = new Date().toLocaleDateString(LOCALE(), { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  // 30초 요약: 브리핑 상위 3개를 한 줄씩
  const q = $('#quick');
  const top3 = (briefing?.items || []).slice(0, 3);
  q.hidden = !top3.length;
  q.innerHTML = top3.length ? `<div class="quick-head"><span class="eyebrow">⏱ ${esc(T.q_eyebrow)}</span><h2>${esc(T.q_title)}</h2></div>
    <ol class="quick-list">${top3.map((it) => `<li><a href="/event?id=${it.event_id}"><b>${esc(it.title)}</b>${it.one_line && it.one_line !== it.title ? `<span>${esc(it.one_line)}</span>` : ''}</a></li>`).join('')}</ol>` : '';

  const b = $('#briefing');
  if (briefing && briefing.items?.length) {
    b.innerHTML = `<div>
        <div class="eyebrow">${esc(today)} · ${esc(T.brief_eyebrow)}</div>
        <h1>${esc(briefing.headline)}</h1>
        <p class="intro">${esc(briefing.intro)}</p>
        ${briefing.mode === 'demo' ? `<p class="notice">${T.demo_notice}</p>` : ''}
      </div>
      <div>
        <ol class="brief-list">${briefing.items.map((it, i) => `<li><a href="${withLang(`/event?id=${it.event_id}`)}"><span class="n">${i + 1}</span><span><span class="t">${esc(it.title)}</span><span class="w">${esc(it.why)}</span></span></a></li>`).join('')}</ol>
        <p class="closing">${esc(briefing.closing)}</p>
      </div>`;
  } else {
    b.innerHTML = `<div><div class="eyebrow">${esc(today)}</div><h1>${esc(T.hero_title)}</h1><p class="intro">${esc(T.hero_intro)}</p></div><div></div>`;
  }

  const counts = data.region_counts;
  const total = Object.values(counts).reduce((a, n) => a + n, 0);
  $('#world').innerHTML = total ? `
    <div class="eyebrow">${esc(T.world_eyebrow(total))}</div>
    <div class="world-bar" aria-hidden="true">${ORDER.filter((r) => counts[r]).map((r) => `<span data-region="${r}" style="flex:${counts[r]}" title="${esc(T.regions[r])} ${counts[r]}"></span>`).join('')}</div>
    <div class="chips" role="group" aria-label="${esc(T.region_filter)}">
      <button class="chip" aria-pressed="${!currentRegion}" data-r="">${esc(T.all)} <span class="c">${total}</span></button>
      ${ORDER.filter((r) => counts[r]).map((r) => `<button class="chip" data-region="${r}" data-r="${r}" aria-pressed="${currentRegion === r}">${esc(T.regions[r])} <span class="c">${counts[r]}</span></button>`).join('')}
    </div>` : '';
  $('#world').querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { currentRegion = c.dataset.r; renderHome(); }));

  $('#events-title').textContent = currentRegion ? T.events_region(T.regions[currentRegion]) : T.events_title;
  $('#sort-note').textContent = T.sort_note;
  // 관심 지역: 그 지역 사건을 앞으로 (전체 보기일 때만)
  const favs = FAV || [];
  const favBar = $('#fav-bar');
  favBar.innerHTML = storageOk ? `${favs.length ? `<span>⭐ ${esc(T.fav_note(favs.map((r) => T.regions[r]).join(', ')))}</span>` : ''}
    <button class="link-btn" id="fav-edit">${esc(favs.length ? T.fav_change : T.fav_set)}</button>` : '';
  $('#fav-edit')?.addEventListener('click', () => showOnboarding());
  if (!currentRegion && favs.length) {
    const rank = (e) => (favs.includes(e.region) ? 0 : 1);
    data.events = data.events.map((e, i) => [e, i]).sort((x, y) => rank(x[0]) - rank(y[0]) || x[1] - y[1]).map(([e]) => e);
  }
  const grid = $('#events');
  if (!data.events.length) {
    grid.innerHTML = s?.running || !s?.last_refresh
      ? `<div class="empty" style="grid-column:1/-1"><div class="spinner"></div>${esc(T.empty_collecting)}</div>`
      : `<div class="empty" style="grid-column:1/-1">${esc(T.empty_none)}</div>`;
    return;
  }
  grid.innerHTML = data.events.map((e) => `
    <a class="card ${favs.includes(e.region) && !currentRegion ? 'fav' : ''}" href="${withLang(`/event?id=${e.id}`)}">
      <div class="card-top"><span class="region-tag" data-region="${esc(e.region)}">${esc(T.regions[e.region] || e.region)}</span>${heat(e.country_count)}</div>
      <h3>${esc(e.title)}</h3>
      ${e.one_line && e.one_line !== e.title ? `<p>${esc(e.one_line)}</p>` : ''}
      <div class="countries">${pills(e.countries)}</div>
      <div class="meta"><span>${esc(T.card_meta(e.country_count, e.article_count))}</span>${e.read_min ? `<span class="read" title="${esc(T.read_title)}">⏱ ${esc(T.read_min(e.read_min))}</span>` : ''}<span>${esc(ago(e.last_updated))}</span></div>
    </a>`).join('');
  // 처음 온 사람: 관심 지역 고르기
  // (?nolive 화면 캡처 모드에서는 &onboard가 있을 때만)
  const qs = new URLSearchParams(location.search);
  const autoOb = !qs.has('nolive') || qs.has('onboard');
  if (FAV === null && storageOk && autoOb && !document.querySelector('dialog.onboard')) showOnboarding();
}

function showOnboarding() {
  document.querySelector('dialog.onboard')?.remove();
  const picked = new Set(FAV || []);
  const d = document.createElement('dialog');
  d.className = 'onboard';
  d.setAttribute('aria-labelledby', 'ob-title');
  const draw = () => {
    d.innerHTML = `<h2 id="ob-title">${esc(T.ob_title)}</h2><p class="muted">${esc(T.ob_body)}</p>
      <div class="ob-grid">${FAV_REGIONS.map((r) => `<button type="button" class="ob-chip" data-region="${r}" aria-pressed="${picked.has(r)}"><i></i>${esc(T.regions[r])}</button>`).join('')}</div>
      <div class="ob-actions"><button type="button" class="btn" id="ob-skip">${esc(T.ob_skip)}</button>
      <button type="button" class="btn primary" id="ob-go" ${picked.size ? '' : 'disabled'}>${esc(T.ob_start)}</button></div>`;
    d.querySelectorAll('.ob-chip').forEach((c) => c.addEventListener('click', () => {
      picked.has(c.dataset.region) ? picked.delete(c.dataset.region) : picked.add(c.dataset.region);
      draw();
      d.querySelector(`[data-region="${c.dataset.region}"]`).focus();
    }));
    d.querySelector('#ob-skip').onclick = () => { if (FAV === null) saveFav([]); d.close(); };
    d.querySelector('#ob-go').onclick = () => { saveFav(FAV_REGIONS.filter((r) => picked.has(r))); d.close(); };
  };
  draw();
  d.addEventListener('cancel', () => { if (FAV === null) saveFav([]); });
  d.addEventListener('close', () => { d.remove(); if (page === 'home') renderHome(); });
  document.body.append(d);
  d.showModal();
}

// ── 사건 상세 ──
const TAB_KEYS = ['story', 'facts', 'views', 'hypo', 'timeline'];
let currentTab = null;
async function renderEvent() {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));
  currentTab ??= TAB_KEYS.includes(params.get('tab')) ? params.get('tab') : 'story';
  const main = $('#event');
  let e;
  try { e = await api(`/api/events/${id}`); } catch {
    main.innerHTML = `<div class="empty">${esc(T.not_found)} <a href="/">${esc(T.home)}</a></div>`;
    return;
  }
  document.title = `${e.title} — WorldLens`;
  const a = e.analysis || {};
  const outlets = new Set(e.articles.map((x) => x.outlet)).size;

  main.innerHTML = `
    <div class="event-head">
      <a class="back" href="/">${esc(T.back)}</a><br>
      <span class="region-tag" data-region="${esc(e.region)}">${esc(T.regions[e.region] || e.region)}</span>
      <h1>${esc(e.title)}</h1>
      <div class="stats">${heat(e.country_count)}<span><b>${e.country_count}</b>${esc(T.st_countries)}</span><span><b>${outlets}</b>${esc(T.st_outlets)}</span><span><b>${e.article_count}</b>${esc(T.st_articles)}</span>${e.read_min ? `<span title="${esc(T.read_title)}">⏱ ${esc(T.read_min(e.read_min))}</span>` : ''}<span>${esc(T.first_seen(fmtDay(e.first_seen)))}</span></div>
      <div class="countries">${pills(e.countries, 20)}</div>
    </div>
    ${glanceHtml(e, a)}
    ${chartHtml(e.articles)}
    ${e.analysis_lang && e.analysis_lang !== LANG ? `<p class="notice" style="max-width:820px">${esc(T.analysis_pending_lang)}</p>` : ''}
    ${e.analysis_mode === 'demo' ? `<p class="notice" style="max-width:820px">${T.demo_analysis}</p>` : ''}
    ${e.analysis_mode === 'sample' ? `<p class="notice sample" style="max-width:820px">${T.sample_analysis}</p>` : ''}
    <div class="tabs" role="tablist">${TAB_KEYS.map((k) => `<button role="tab" data-tab="${k}" aria-selected="${k === currentTab}">${e.locked && (k === 'views' || k === 'hypo') ? `<span class="tab-lock">${ICON_LOCK}</span>` : ''}${esc(T.tabs[k])}</button>`).join('')}</div>
    <div class="panel" data-panel="story">${storyHtml(a.story)}</div>
    <div class="panel" data-panel="facts">${factsHtml(a.facts)}</div>
    <div class="panel" data-panel="views">${e.locked ? stanceTeaserHtml(e) + paywallHtml(T.pw_views(e.locked.perspectives)) : viewsHtml(a)}</div>
    <div class="panel" data-panel="hypo">${e.locked ? paywallHtml(T.pw_hypo(e.locked.hypotheses)) : hypoHtml(a.hypotheses)}</div>
    <div class="panel" data-panel="timeline">${timelineHtml(e.articles)}</div>`;

  const select = (key) => {
    currentTab = key;
    main.querySelectorAll('[role="tab"]').forEach((x) => x.setAttribute('aria-selected', x.dataset.tab === key));
    main.querySelectorAll('.panel').forEach((p) => { p.hidden = p.dataset.panel !== key; });
  };
  main.querySelectorAll('[role="tab"]').forEach((t) => t.addEventListener('click', () => {
    select(t.dataset.tab);
    const u = new URL(location.href);
    u.searchParams.set('tab', t.dataset.tab);
    history.replaceState(null, '', u);
  }));
  select(currentTab);
}

// 한눈에 보기 (무엇이·어디서·왜 중요한가) + 나한테 무슨 상관?
function glanceHtml(e, a) {
  if (!a.one_line) return '';
  const demo = e.analysis_mode === 'demo';
  const where = T.g_where_val(a.where || T.regions[e.region] || e.region, e.country_count);
  const why = firstSentence(a.story?.why_it_matters || '');
  return `<div class="glance-row">
    <section class="glance" aria-labelledby="g-title"><h2 class="eyebrow" id="g-title">${esc(T.glance_title)}</h2>
      <dl><div><dt>${esc(T.g_what)}</dt><dd>${esc(a.one_line)}</dd></div>
      <div><dt>${esc(T.g_where)}</dt><dd>${esc(where)}</dd></div>
      ${why ? `<div><dt>${esc(T.g_why)}</dt><dd>${esc(why)}</dd></div>` : ''}</dl></section>
    ${a.impact ? `<section class="impact" aria-labelledby="i-title"><h2 id="i-title"><span aria-hidden="true">💡</span> ${esc(T.impact_title)}</h2><p>${esc(a.impact)}</p>
      ${demo ? `<p class="guess">${esc(T.demo_guess)}</p>` : ''}</section>` : ''}
  </div>`;
}

// 보도량 변화: 기간에 따라 2시간·6시간·하루 단위 막대
function chartHtml(articles) {
  if (articles.length < 3) return '';
  const ts = articles.map((x) => Date.parse(x.published_at)).sort((x, y) => x - y);
  const H = 3600e3, span = ts.at(-1) - ts[0];
  const step = span <= 24 * H ? 2 * H : span <= 72 * H ? 6 * H : 24 * H;
  const off = new Date().getTimezoneOffset() * 60e3; // 현지 시각 기준으로 칸 나누기
  const start = Math.floor((ts[0] - off) / step) * step + off;
  const n = Math.min(48, Math.floor((ts.at(-1) - start) / step) + 1);
  const counts = new Array(n).fill(0);
  for (const t of ts) counts[Math.min(n - 1, Math.floor((t - start) / step))]++;
  const max = Math.max(...counts);
  const label = (i) => {
    const d = new Date(start + i * step);
    const day = d.toLocaleDateString(LOCALE(), { month: 'numeric', day: 'numeric' });
    return step >= 24 * H ? day : `${day} ${fmtTime(d.toISOString())}`;
  };
  const peak = counts.indexOf(max);
  return `<section class="chart-box" aria-labelledby="c-title">
    <div class="chart-head"><h2 class="eyebrow" id="c-title">${esc(T.chart_title)}</h2><span class="muted">${esc(T.chart_peak(label(peak)))}</span></div>
    <div class="chart" role="img" aria-label="${esc(`${T.chart_title}. ${T.chart_peak(label(peak))}`)}">${counts.map((c, i) => `<span class="${c ? '' : 'zero'} ${i === peak ? 'peak' : ''}" style="height:${c ? Math.max(8, (c / max) * 100) : 3}%" title="${esc(T.chart_bar(label(i), c))}"></span>`).join('')}</div>
    <div class="chart-axis"><span>${esc(label(0))}</span><span>${esc(label(n - 1))}</span></div>
  </section>`;
}

// 나라별 관점: 비판적 / 중립 / 우호적 세 칸으로 나눠 보여 줌
// 어느 칸인지는 무료 맛보기, 매체별 설명은 유료. 데모 모드는 '추정'이라고 분명히 표시
const STANCES = ['비판적', '중립', '우호적'];
const stanceOf = (p) => (STANCES.includes(p.stance) ? p.stance : '중립');
function stanceHead(a) {
  return `<h3 class="stance-title">${esc(T.spec_title)}</h3>
    ${a.stance_target ? `<p class="spec-target"><b>${esc(T.spec_about)}</b> ${esc(a.stance_target)}</p>` : ''}
    ${a.stance_guess ? `<p class="notice stance-guess">${esc(T.spec_guess)}</p>` : ''}`;
}
function stanceGroups(list, item) {
  return `<div class="stance-groups">${STANCES.map((s) => {
    const g = list.filter((p) => stanceOf(p) === s);
    return `<section class="stance-group" data-stance="${s}"><h4><i aria-hidden="true"></i>${esc(T.stance[s])} <span class="c">${g.length}</span></h4>
      ${g.length ? item(g) : `<p class="muted none">—</p>`}</section>`;
  }).join('')}</div>`;
}
// 잠겨 있을 때: 어느 칸에 어느 나라·매체가 있는지만
function stanceTeaserHtml(e) {
  if (!e.stances?.length) return '';
  return `<section class="stance-wrap">${stanceHead(e.analysis || {})}
    ${stanceGroups(e.stances, (g) => `<div class="stance-pills">${g.map((p) => `<span class="pill ${p.state_media ? 'state' : ''}">${esc(p.country)} · ${esc(p.outlet)}</span>`).join('')}</div>`)}
    <p class="spec-locked">${ICON_LOCK} ${esc(T.spec_locked)}</p></section>`;
}

// ── 유료 잠금 안내 ──
const fmtPrice = () => new Intl.NumberFormat(LOCALE(), { style: 'currency', currency: ME?.billing?.currency || 'KRW', maximumFractionDigits: 0 }).format(ME?.billing?.price || 0);
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(LOCALE(), { year: 'numeric', month: 'long', day: 'numeric' }) : '');
function paywallHtml(title) {
  const next = encodeURIComponent(location.pathname + location.search);
  const cta = ME?.user
    ? `<a class="btn primary big" href="/account">${esc(T.pw_cta_subscribe(fmtPrice()))}</a>`
    : `<a class="btn primary big" href="/login?mode=signup&next=${next}">${esc(T.pw_cta_signup(ME?.trial_days ?? 7))}</a>
       <a class="muted small-link" href="/login?next=${next}">${esc(T.pw_login)}</a>`;
  return `<div class="paywall"><div class="pw-icon">${ICON_LOCK}</div><h3>${esc(title)}</h3><p>${esc(T.pw_body)}</p>
    <div class="pw-fake" aria-hidden="true"><i></i><i></i><i></i></div><div class="pw-cta">${cta}</div></div>`;
}

// ── 로그인·가입 ──
function renderLogin() {
  const params = new URLSearchParams(location.search);
  let mode = params.get('mode') === 'signup' ? 'signup' : 'login';
  // 로그인 뒤 돌아갈 곳: 이 사이트 안의 주소만 허용 (다른 사이트로 보내는 공격 방지)
  const nextParam = params.get('next') || '';
  const next = /^\/[^/\\]/.test(nextParam) || nextParam === '/' ? nextParam : '/';
  if (ME?.user) { location.replace(next); return; }
  const draw = (err = '', email = '') => {
    const signup = mode === 'signup';
    $('#auth').innerHTML = `<div class="auth-card">
      <h1>${esc(signup ? T.signup_title : T.login_title)}</h1>
      <p class="muted">${esc(signup ? T.signup_lead(ME?.trial_days ?? 7) : T.login_lead)}</p>
      <form id="auth-form" novalidate>
        <label>${esc(T.email)}<input type="email" name="email" autocomplete="email" required value="${esc(email)}"></label>
        <label>${esc(T.password)} <span class="muted">· ${esc(T.password_hint)}</span>
          <input type="password" name="password" minlength="8" autocomplete="${signup ? 'new-password' : 'current-password'}" required></label>
        ${err ? `<p class="form-error" role="alert">${esc(err)}</p>` : ''}
        <button class="btn primary big" type="submit">${esc(signup ? T.signup_btn : T.login_btn)}</button>
      </form>
      <button class="link-btn" id="switch">${esc(signup ? T.to_login : T.to_signup)}</button>
    </div>`;
    $('#switch').onclick = () => { mode = signup ? 'login' : 'signup'; draw(); };
    $('#auth-form').onsubmit = async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      ev.target.querySelector('button[type=submit]').disabled = true;
      const r = await fetch(`/api/auth/${signup ? 'signup' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.get('email'), password: f.get('password'), lang: LANG }),
      }).catch(() => null);
      if (r?.ok) { location.href = next; return; }
      const code = (await r?.json().catch(() => ({})))?.error;
      const msg = { bad_email: T.err_bad_email, bad_password: T.err_bad_password, email_taken: T.err_email_taken, bad_login: T.err_bad_login, too_many: T.err_too_many }[code] || T.err_generic;
      draw(msg, f.get('email'));
    };
  };
  draw();
}

// ── 내 계정·구독 ──
function renderAccount() {
  if (!ME?.user) { location.replace('/login?next=/account'); return; }
  const u = ME.user, b = ME.billing;
  const params = new URLSearchParams(location.search);
  const result = params.get('result');
  let state;
  if (u.status === 'active' && u.cancel_at_period_end) state = T.st_canceling(fmtDate(u.period_end));
  else if (u.status === 'active') state = T.st_active(fmtDate(u.period_end));
  else if (u.trial_active) state = T.st_trial(fmtDate(u.trial_end));
  else if (u.status === 'past_due') state = T.st_past_due;
  else state = T.st_expired;
  const subscribed = u.status === 'active';
  const cardWaiting = u.trial_active && u.has_card && !u.cancel_at_period_end; // 체험 중 카드 등록 완료 → 체험 끝나면 결제
  const showSubscribe = !subscribed && !cardWaiting;
  $('#account').innerHTML = `<div class="auth-card wide">
    <h1>${esc(T.account_title)}</h1>
    <p class="muted">${esc(u.email)}</p>
    ${result === 'ok' ? `<p class="notice sample">${esc(T.result_ok)}</p>` : ''}
    ${result === 'fail' ? `<p class="form-error" role="alert">${esc(T.result_fail)} ${esc(params.get('message') || '')}</p>` : ''}
    <section class="plan-box">
      <div class="eyebrow">${esc(T.plan)}</div>
      <p class="plan-state ${u.access ? 'ok' : ''}">${esc(state)}</p>
      ${u.has_card ? `<p class="muted">${esc(T.card)} · ${esc(u.card_label || '')}</p>` : ''}
      ${cardWaiting && !subscribed ? `<p class="muted">${esc(T.trial_note(fmtDate(u.trial_end)))}</p>` : ''}
    </section>
    ${showSubscribe ? `<section class="offer">
      <div class="price">${esc(T.price_line(fmtPrice()))}</div>
      <ul>${T.benefits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${b.provider === 'toss' ? `<button class="btn primary big" id="subscribe">${esc(u.trial_active ? T.subscribe_trial_btn : T.subscribe_btn)}</button>
        ${u.trial_active ? `<p class="muted small">${esc(T.trial_note(fmtDate(u.trial_end)))}</p>` : ''}` : ''}
      ${b.provider !== 'toss' && b.dev_billing ? `<button class="btn primary big" id="dev-subscribe">${esc(T.dev_subscribe_btn)}</button>
        <p class="muted small">${esc(T.dev_note)}</p>` : ''}
    </section>` : ''}
    <div class="account-actions">
      ${(subscribed || cardWaiting) && !u.cancel_at_period_end ? `<button class="btn" id="cancel">${esc(T.cancel_btn)}</button>` : ''}
      ${u.cancel_at_period_end && u.access ? `<button class="btn" id="resume">${esc(T.resume_btn)}</button>` : ''}
      <button class="btn" id="logout">${esc(T.logout)}</button>
    </div>
  </div>`;
  const post = (path) => fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  const reload = async () => { await loadMe(); applyChrome(); renderAccount(); };
  $('#logout').onclick = async () => { await post('/api/auth/logout'); location.href = '/'; };
  if ($('#cancel')) $('#cancel').onclick = async () => { if (confirm(T.cancel_confirm)) { await post('/api/billing/cancel'); reload(); } };
  if ($('#resume')) $('#resume').onclick = async () => { await post('/api/billing/resume'); reload(); };
  if ($('#dev-subscribe')) $('#dev-subscribe').onclick = async () => { await post('/api/billing/dev-subscribe'); history.replaceState(null, '', '/account?result=ok'); reload(); };
  if ($('#subscribe')) $('#subscribe').onclick = startTossBilling;
}

// 토스페이먼츠 카드 등록 창 열기 (SDK v2)
function loadScript(src) {
  return new Promise((ok, fail) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = fail;
    document.head.append(s);
  });
}
async function startTossBilling() {
  const btn = $('#subscribe');
  btn.disabled = true;
  try {
    const r = await fetch('/api/billing/prepare', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (!r.ok) throw new Error('prepare');
    const p = await r.json();
    await loadScript('https://js.tosspayments.com/v2/standard');
    const payment = window.TossPayments(p.client_key).payment({ customerKey: p.customer_key });
    await payment.requestBillingAuth({
      method: 'CARD',
      successUrl: p.success_url,
      failUrl: p.fail_url,
      customerEmail: p.customer_email,
    });
  } catch (e) {
    console.error(e);
    toast(T.result_fail);
    btn.disabled = false;
  }
}

const notYet = () => `<p class="muted">${esc(T.not_yet)}</p>`;
function storyHtml(s) {
  if (!s) return notYet();
  const parts = [s.background, s.what_happened, s.why_it_matters, s.what_to_watch];
  return `<div class="story">${parts.map((t, i) => `<section><h3>${esc(T.story[i])}</h3><p>${esc(t)}</p></section>`).join('')}</div>`;
}
function factsHtml(facts) {
  if (!facts?.length) return notYet();
  return `<ul class="facts">${facts.map((f) => `<li>${esc(f.text)}<div class="src">${(f.sources || []).map((s) => `<span class="pill">${esc(s)}</span>`).join('')}</div></li>`).join('')}</ul>`;
}
function viewsHtml(a) {
  if (!a.perspectives?.length) return notYet();
  const card = (p) => `<article>
      <header><span class="pill">${esc(p.country)}</span><b>${esc(p.outlet)}</b>${p.state_media ? `<span class="pill state" title="${esc(T.state_tip)}">${esc(T.state)}</span>` : ''}</header>
      <p>${esc(p.view)}</p><p class="emph">${esc(T.emphasis)} · ${esc(p.emphasis)}</p></article>`;
  return `${a.differences ? `<div class="callout"><h3>${esc(T.diff_title)}</h3><p>${esc(a.differences)}</p></div>` : ''}
    <section class="stance-wrap">${stanceHead(a)}${stanceGroups(a.perspectives, (g) => `<div class="persp">${g.map(card).join('')}</div>`)}</section>`;
}
function hypoHtml(hs) {
  if (!hs?.length) return notYet();
  const lv = { 낮음: 1, 중간: 2, 높음: 3 };
  return `<p class="hypo-note">${esc(T.hypo_note)}</p>
    <div class="hypos">${hs.map((h) => `<div class="hypo"><header><span class="kind">${esc(T.kind[h.kind] || h.kind)}</span>
      <span class="conf">${esc(T.conf_label)} ${esc(T.conf[h.confidence] || h.confidence)} ${[1, 2, 3].map((i) => `<i class="${i <= (lv[h.confidence] || 1) ? 'on' : ''}"></i>`).join('')}</span></header>
      <p>${esc(h.text)}</p>${h.basis && h.basis !== '—' ? `<p class="basis">${esc(T.basis)} · ${esc(h.basis)}</p>` : ''}</div>`).join('')}</div>`;
}
function timelineHtml(articles) {
  let lastDay = '';
  const items = [...articles].reverse().map((x) => {
    const day = fmtDay(x.published_at);
    const head = day !== lastDay ? `<li class="day">${esc(day)}</li>` : '';
    lastDay = day;
    return `${head}<li class="tl-item"><time datetime="${esc(x.published_at)}">${fmtTime(x.published_at)}</time><div>
      <div class="who"><span class="pill">${esc(x.country)}</span>${esc(x.outlet)}${x.state_media ? `<span class="pill state" title="${esc(T.state_tip)}">${esc(T.state)}</span>` : ''}</div>
      ${!x.translated && LANG !== 'en' ? `<span class="pill pending">${esc(T.translating)}</span> ` : ''}<a class="t" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer" ${x.translated ? `title="${esc(T.orig_title)}: ${esc(x.original_title)}"` : ''}>${esc(x.title)} ↗</a>
      ${x.summary ? `<p>${esc(x.summary.length > 260 ? `${x.summary.slice(0, 259)}…` : x.summary)}</p>` : ''}</div></li>`;
  }).join('');
  return `<p class="muted" style="margin-top:0">${esc(LANG === 'en' ? T.tl_note_en : T.tl_note)}</p><ul class="timeline">${items}</ul>`;
}

// ── 소개 ──
function renderAbout() {
  $('#about').innerHTML = window.WL_ABOUT[LANG] || window.WL_ABOUT.ko;
}

// ── 약관·개인정보·환불 ──
const POLICY_DOCS = ['terms', 'privacy', 'refund'];
function renderPolicy() {
  const doc = POLICY_DOCS.includes(document.body.dataset.doc) ? document.body.dataset.doc : 'terms';
  const P = window.WL_POLICY[LANG] || window.WL_POLICY.ko;
  const d = P[doc];
  document.title = `${d.title} — WorldLens`;
  const email = ME?.site?.contact_email;
  const contact = email ? `${esc(T.f_contact)}: <a href="mailto:${esc(email)}">${esc(email)}</a>` : `${esc(T.f_contact)}: ${esc(T.contact_pending)}`;
  const fill = (s) => esc(s.replaceAll('{price}', fmtPrice()).replaceAll('{trial}', String(ME?.trial_days ?? 7))).replaceAll('{contact}', contact);
  $('#policy').innerHTML = `<article class="policy">
    <nav class="policy-tabs">${POLICY_DOCS.map((k) => `<a href="/${k}" ${k === doc ? 'aria-current="page"' : ''}>${esc(P[k].title)}</a>`).join('')}</nav>
    <h1>${esc(d.title)}</h1>
    <p class="notice">${esc(P.draft)}</p>
    <ol class="policy-list">${d.sections.map(([h, p]) => `<li><h2>${esc(h)}</h2><p>${fill(p)}</p></li>`).join('')}</ol>
  </article>`;
}

// ── 실시간 연결 (서버가 새 소식을 바로 알려 줌) ──
let streamOpen = false;
let rerenderTimer = null;
function toast(msg) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 4000);
}
function connectStream() {
  if (!window.EventSource) return;
  const es = new EventSource('/api/stream');
  es.onopen = () => { streamOpen = true; if (window.__status) paintStatus(window.__status); };
  es.onerror = () => { streamOpen = false; if (window.__status) paintStatus(window.__status); }; // 브라우저가 알아서 다시 연결
  es.addEventListener('update', (ev) => {
    let u; try { u = JSON.parse(ev.data); } catch { return; }
    watchStatus();
    // 지금 보고 있는 언어에 해당하는 변화일 때만 다시 그림 (여러 신호가 몰리면 한 번만)
    if (!u.changed || STATIC_PAGES.includes(page)) return;
    if (u.stage === 'main' || u.lang === LANG) {
      clearTimeout(rerenderTimer);
      rerenderTimer = setTimeout(() => {
        renderPage();
        if (u.stage === 'main' && u.added > 0) toast(T.toast_new(u.added));
        else if (u.stage === 'main' && u.analyzed > 0) toast(T.toast_update);
      }, 400);
    }
  });
}

// ── 시작 ──
let ME = null;
async function loadMe() {
  try { ME = await (await fetch('/api/me')).json(); } catch { ME = null; }
}
function renderPage() {
  if (page === 'home') return renderHome();
  if (page === 'event') return renderEvent();
  if (page === 'about') return renderAbout();
  if (page === 'login') return renderLogin();
  if (page === 'account') return renderAccount();
  if (page === 'policy') return renderPolicy();
}
const STATIC_PAGES = ['about', 'login', 'account', 'policy'];
(async () => {
  await loadMe();
  applyChrome();
  if (STATIC_PAGES.includes(page)) renderPage();
  await watchStatus();
  if (!STATIC_PAGES.includes(page)) renderPage();
  // ?nolive: 실시간 연결 없이 열기 (화면 캡처·테스트용)
  if (!new URLSearchParams(location.search).has('nolive')) connectStream();
  // 다른 탭에 있다 돌아오거나 컴퓨터가 절전에서 깨어나면: 그동안 놓친 소식을 바로 다시 불러옴
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 60000) {
      watchStatus();
      if (!STATIC_PAGES.includes(page) && !document.querySelector('dialog.onboard')) renderPage();
    }
  });
})();
