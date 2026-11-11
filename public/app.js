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
// 관심 주제 ('기타'는 고를 수 없음)
const FAV_CAT_KEYS = ['politics', 'conflict', 'economy', 'tech', 'climate', 'health', 'society', 'culture'];
let FAV_CATS = [];
try { const v = JSON.parse(localStorage.getItem('wl-cats') || '[]'); FAV_CATS = Array.isArray(v) ? v.filter((c) => FAV_CAT_KEYS.includes(c)) : []; } catch {}
function saveFavCats(list) {
  FAV_CATS = list;
  try { localStorage.setItem('wl-cats', JSON.stringify(list)); } catch {}
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

// 데이터: 서버 없이 미리 만들어 둔 파일(/data/...)을 읽음
// (GitHub Actions가 주기적으로 뉴스를 모아 이 파일들을 새로 만들어 Vercel에 올림)
const getJson = async (path) => {
  const r = await fetch(path, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};
const api = {
  status: () => getJson('/data/status.json'),
  briefing: () => getJson(`/data/${LANG}/briefing.json`).catch(() => null),
  events: () => getJson(`/data/${LANG}/events.json`),
  event: (id) => getJson(`/data/${LANG}/event/${id}.json`),
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
const ICON_GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>';

// ── 헤더·푸터 ──
const page = document.body.dataset.page;
const FROM_ARCHIVE = page === 'event' && new URLSearchParams(location.search).has('d');
function applyChrome() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hans' : LANG;
  const el = $('#site-header');
  el.className = 'site-header';
  el.innerHTML = `<div class="wrap">
    <a class="logo" href="/">${ICON_LENS}<span>WorldLens</span></a>
    <nav class="nav">
      <a href="/" ${page === 'home' || (page === 'event' && !FROM_ARCHIVE) ? 'aria-current="page"' : ''}>${esc(T.nav_today)}</a>
      <a href="/archive" ${page === 'archive' || (page === 'event' && FROM_ARCHIVE) ? 'aria-current="page"' : ''}>${esc(T.nav_archive)}</a>
      <a href="/about" ${page === 'about' ? 'aria-current="page"' : ''}>${esc(T.nav_about)}</a>
    </nav>
    <div class="header-right">
      <span class="status" id="status"><i class="dot"></i><span class="label">${esc(T.st_loading)}</span></span>
      <label class="lang-select" title="${esc(T.lang_label)}">${ICON_GLOBE}
        <select id="lang" aria-label="${esc(T.lang_label)}">${window.WL_LANGS.map(([c, n]) => `<option value="${c}" ${c === LANG ? 'selected' : ''}>${n}</option>`).join('')}</select>
      </label>
      <button class="btn font-btn" id="font-size" title="${esc(T.font_label)}" aria-label="${esc(`${T.font_label}: ${T.font_sizes[fontStep]}`)}"><span aria-hidden="true">A<b>A</b></span></button>
    </div>
  </div>`;
  $('#lang').addEventListener('change', (ev) => setLang(ev.target.value));
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
  if (page === 'archive') document.title = T.title_archive;
  if (window.__status) paintStatus(window.__status);
}

// 아래쪽 정보: 소개·약관·문의 + 사업자 정보 (.env에서 설정)
function footerHtml() {
  const s = window.__status?.site || {};
  const biz = [[T.b_name, s.business_name], [T.b_owner, s.owner], [T.b_reg, s.reg_no], [T.b_mail, s.mail_order_no], [T.b_addr, s.address]]
    .filter(([, v]) => v).map(([k, v]) => `<span>${esc(k)} ${esc(v)}</span>`).join('');
  return `<div class="wrap foot">
    <nav class="foot-links" aria-label="${esc(T.f_about)}">
      <a href="/about">${esc(T.f_about)}</a><a href="/terms">${esc(T.f_terms)}</a><a href="/privacy"><b>${esc(T.f_privacy)}</b></a>
      ${s.contact_email ? `<a href="mailto:${esc(s.contact_email)}">${esc(T.f_contact)}</a>` : ''}
    </nav>
    ${biz || s.contact_email ? `<p class="biz">${biz}${s.contact_email ? `<span>${esc(T.f_contact)} ${esc(s.contact_email)}</span>` : ''}</p>` : ''}
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
  st.innerHTML = `<i class="dot ${s.mode} ${s.running ? 'busy' : ''}"></i><span class="label">${esc(label)}</span>`;
  st.title = T.st_title(s.sources_ok ?? '?', s.sources_total, s.articles, s.events);
}
async function watchStatus(expectRun = false) {
  clearTimeout(statusTimer);
  let s;
  try { s = await api.status(); } catch { return; }
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

// 사건 카드 (홈·지난 사건 공용). dayMeta가 있으면 '그날' 보도 수를 보여 줌
function cardHtml(e, { fav = false, dayMeta = false, date = '' } = {}) {
  const meta = dayMeta && e.day_countries ? T.ar_day_meta(e.day_countries, e.day_articles) : T.card_meta(e.country_count, e.article_count);
  return `
    <a class="card ${fav ? 'fav' : ''}" href="${withLang(`/event?id=${e.id}${date ? `&d=${date}` : ''}`)}">
      <div class="card-top"><span class="tags"><span class="region-tag" data-region="${esc(e.region)}">${esc(T.regions[e.region] || e.region)}</span>${e.category && T.cats[e.category] ? `<span class="cat-tag">${esc(T.cats[e.category])}</span>` : ''}</span>${heat(e.country_count)}</div>
      <h3>${esc(e.title)}</h3>
      ${e.one_line && e.one_line !== e.title ? `<p>${esc(e.one_line)}</p>` : ''}
      <div class="countries">${pills(e.countries)}</div>
      <div class="meta"><span>${esc(meta)}</span>${e.read_min ? `<span class="read" title="${esc(T.read_title)}">⏱ ${esc(T.read_min(e.read_min))}</span>` : ''}<span>${esc(dayMeta ? T.first_seen(fmtDay(e.first_seen)) : ago(e.last_updated))}</span></div>
    </a>`;
}

// ── 홈 ──
let currentRegion = '';
let currentCat = '';
// 검색: 띄어 쓴 낱말이 모두 들어간 사건만 (제목·한 줄 요약·영어 원문 제목·나라·지역·주제에서 찾음)
let searchQ = new URLSearchParams(location.search).get('q') || '';
let homeCache = null; // 검색어를 칠 때마다 파일을 다시 받지 않도록 마지막 데이터를 기억
const norm = (s) => String(s || '').toLowerCase().normalize('NFKC');
function matchesSearch(e, words) {
  const hay = norm([e.title, e.one_line, e.orig_title, T.regions[e.region], T.cats?.[e.category], ...(e.countries || []).map((c) => c.name)].join(' '));
  return words.every((w) => hay.includes(w));
}
function setupSearch() {
  const q = $('#q');
  if (!q) return;
  q.placeholder = T.search_ph; // 언어를 바꾸면 다시 그리므로 매번 설정
  q.setAttribute('aria-label', T.search_label);
  if (q.dataset.ready) return;
  q.dataset.ready = '1';
  q.value = searchQ;
  let timer;
  q.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQ = q.value.trim();
      const u = new URL(location.href);
      if (searchQ) u.searchParams.set('q', searchQ); else u.searchParams.delete('q');
      history.replaceState(null, '', u);
      renderHome(true);
    }, 120);
  });
  q.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && q.value) { q.value = ''; q.dispatchEvent(new Event('input')); } });
  // '/' 키로 바로 검색창으로
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== '/' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const t = ev.target;
    if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
    ev.preventDefault(); q.focus();
  });
}
const CAT_ORDER = ['politics', 'conflict', 'economy', 'tech', 'climate', 'health', 'society', 'culture', 'other'];
const ORDER = ['asia', 'europe', 'middle-east', 'americas', 'africa', 'oceania', 'global'];
async function renderHome(useCache = false) {
  setupSearch();
  if (!useCache || !homeCache) homeCache = await Promise.all([api.briefing(), api.events()]);
  const [briefing, all] = homeCache;
  const inRegion = currentRegion ? all.events.filter((e) => e.region === currentRegion) : all.events;
  const catCounts = {};
  for (const e of inRegion) catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  if (currentCat && !catCounts[currentCat]) currentCat = '';
  const words = norm(searchQ).split(/\s+/).filter(Boolean);
  document.body.classList.toggle('searching', words.length > 0); // 검색 중에는 요약·브리핑을 숨겨 결과가 바로 보이게
  const picked = (currentCat ? inRegion.filter((e) => e.category === currentCat) : inRegion).filter((e) => !words.length || matchesSearch(e, words));
  const data = { region_counts: all.region_counts, events: picked }; // 관심사 순서로 정렬한 뒤 60개로 자름 (아래)
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
    </div>
    <div class="chips cat-chips" role="group" aria-label="${esc(T.cat_filter)}">
      <span class="chips-label">${esc(T.cat_label)}</span>
      <button class="chip cat" aria-pressed="${!currentCat}" data-c="">${esc(T.all)} <span class="c">${inRegion.length}</span></button>
      ${CAT_ORDER.filter((c) => catCounts[c]).map((c) => `<button class="chip cat" data-cat="${c}" data-c="${c}" aria-pressed="${currentCat === c}">${esc(T.cats[c])} <span class="c">${catCounts[c]}</span></button>`).join('')}
    </div>` : '';
  $('#world').querySelectorAll('.chip:not(.cat)').forEach((c) => c.addEventListener('click', () => { currentRegion = c.dataset.r; renderHome(); }));
  $('#world').querySelectorAll('.chip.cat').forEach((c) => c.addEventListener('click', () => { currentCat = c.dataset.c; renderHome(); }));

  $('#events-title').textContent = words.length ? T.search_title(searchQ, picked.length)
    : (currentRegion ? T.events_region(T.regions[currentRegion]) : T.events_title) + (currentCat ? ` · ${T.cats[currentCat]}` : '');
  $('#sort-note').textContent = T.sort_note;
  // 관심 지역: 그 지역 사건을 앞으로 (전체 보기일 때만)
  const favs = FAV || [];
  const favBar = $('#fav-bar');
  const favCats = FAV_CATS;
  const favNames = [...favs.map((r) => T.regions[r]), ...favCats.map((c) => T.cats[c])];
  favBar.innerHTML = storageOk ? `${favNames.length ? `<span>⭐ ${esc(T.fav2_note(favNames.join(', ')))}</span>` : ''}
    <button class="link-btn" id="fav-edit">${esc(favNames.length ? T.fav2_change : T.fav2_set)}</button>` : '';
  $('#fav-edit')?.addEventListener('click', () => showOnboarding());
  // 관심 지역·주제에 둘 다 맞는 사건 → 하나만 맞는 사건 → 나머지 (이미 그 지역·주제로 거르고 있으면 그 기준은 빼고)
  const favScore = (e) => (!currentRegion && favs.includes(e.region) ? 1 : 0) + (!currentCat && favCats.includes(e.category) ? 1 : 0);
  if (favs.length || favCats.length) {
    data.events = data.events.map((e, i) => [e, i]).sort((x, y) => favScore(y[0]) - favScore(x[0]) || x[1] - y[1]).map(([e]) => e);
  }
  data.events = data.events.slice(0, 60);
  const grid = $('#events');
  if (!data.events.length && words.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(T.search_none(searchQ))}</div>`;
    return;
  }
  if (!data.events.length) {
    grid.innerHTML = s?.running || !s?.last_refresh
      ? `<div class="empty" style="grid-column:1/-1"><div class="spinner"></div>${esc(T.empty_collecting)}</div>`
      : `<div class="empty" style="grid-column:1/-1">${esc(T.empty_none)}</div>`;
    return;
  }
  grid.innerHTML = data.events.map((e) => cardHtml(e, { fav: favScore(e) > 0 })).join('')
    + (words.length ? '' : `<a class="archive-link" href="/archive">${esc(T.ar_more)}</a>`);
  // 처음 온 사람: 관심 지역 고르기
  // (?nolive 화면 캡처 모드에서는 &onboard가 있을 때만)
  const qs = new URLSearchParams(location.search);
  const autoOb = !qs.has('nolive') || qs.has('onboard');
  if (FAV === null && storageOk && autoOb && !document.querySelector('dialog.onboard')) showOnboarding();
}

function showOnboarding() {
  document.querySelector('dialog.onboard')?.remove();
  const picked = new Set(FAV || []);
  const pickedCats = new Set(FAV_CATS);
  const d = document.createElement('dialog');
  d.className = 'onboard';
  d.setAttribute('aria-labelledby', 'ob-title');
  const draw = () => {
    d.innerHTML = `<h2 id="ob-title">${esc(T.ob2_title)}</h2><p class="muted">${esc(T.ob2_body)}</p>
      <h3 class="ob-sec">${esc(T.ob2_regions)}</h3>
      <div class="ob-grid">${FAV_REGIONS.map((r) => `<button type="button" class="ob-chip" data-region="${r}" aria-pressed="${picked.has(r)}"><i></i>${esc(T.regions[r])}</button>`).join('')}</div>
      <h3 class="ob-sec">${esc(T.ob2_cats)}</h3>
      <div class="ob-grid cats">${FAV_CAT_KEYS.map((c) => `<button type="button" class="ob-chip" data-cat="${c}" aria-pressed="${pickedCats.has(c)}">${esc(T.cats[c])}</button>`).join('')}</div>
      <div class="ob-actions"><button type="button" class="btn" id="ob-skip">${esc(T.ob_skip)}</button>
      <button type="button" class="btn primary" id="ob-go" ${picked.size || pickedCats.size ? '' : 'disabled'}>${esc(T.ob2_start)}</button></div>`;
    d.querySelectorAll('.ob-chip').forEach((c) => c.addEventListener('click', () => {
      const [set, key, attr] = c.dataset.cat ? [pickedCats, c.dataset.cat, 'data-cat'] : [picked, c.dataset.region, 'data-region'];
      set.has(key) ? set.delete(key) : set.add(key);
      const scroll = d.scrollTop;
      draw();
      d.scrollTop = scroll;
      d.querySelector(`[${attr}="${key}"]`).focus();
    }));
    d.querySelector('#ob-skip').onclick = () => { if (FAV === null) saveFav([]); d.close(); };
    d.querySelector('#ob-go').onclick = () => {
      saveFav(FAV_REGIONS.filter((r) => picked.has(r)));
      saveFavCats(FAV_CAT_KEYS.filter((c) => pickedCats.has(c)));
      d.close();
    };
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
  try { if (!Number.isInteger(id) || id <= 0) throw new Error(); e = await api.event(id); } catch {
    const d = params.get('d');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && await renderKeptEvent(id, d)) return;
    main.innerHTML = `<div class="empty">${esc(T.not_found)} <a href="/">${esc(T.home)}</a></div>`;
    return;
  }
  document.title = `${e.title} — WorldLens`;
  const a = e.analysis || {};
  const outlets = new Set(e.articles.map((x) => x.outlet)).size;

  main.innerHTML = `
    <div class="event-head">
      <a class="back" href="/">${esc(T.back)}</a><br>
      <span class="region-tag" data-region="${esc(e.region)}">${esc(T.regions[e.region] || e.region)}</span>${e.category && T.cats[e.category] ? ` <span class="cat-tag">${esc(T.cats[e.category])}</span>` : ''}
      <h1>${esc(e.title)}</h1>
      <div class="stats">${heat(e.country_count)}<span><b>${e.country_count}</b>${esc(T.st_countries)}</span><span><b>${outlets}</b>${esc(T.st_outlets)}</span><span><b>${e.article_count}</b>${esc(T.st_articles)}</span>${e.read_min ? `<span title="${esc(T.read_title)}">⏱ ${esc(T.read_min(e.read_min))}</span>` : ''}<span>${esc(T.first_seen(fmtDay(e.first_seen)))}</span></div>
      <div class="countries">${pills(e.countries, 20)}</div>
    </div>
    ${glanceHtml(e, a)}
    ${chartHtml(e.articles)}
    ${e.analysis_lang && e.analysis_lang !== LANG ? `<p class="notice" style="max-width:820px">${esc(T.analysis_pending_lang)}</p>` : ''}
    ${e.analysis_mode === 'demo' ? `<p class="notice" style="max-width:820px">${T.demo_analysis}</p>` : ''}
    ${e.analysis_mode === 'sample' ? `<p class="notice sample" style="max-width:820px">${T.sample_analysis}</p>` : ''}
    <div class="tabs" role="tablist">${TAB_KEYS.map((k) => `<button role="tab" data-tab="${k}" aria-selected="${k === currentTab}">${esc(T.tabs[k])}</button>`).join('')}</div>
    <div class="panel" data-panel="story">${storyHtml(a.story)}</div>
    <div class="panel" data-panel="facts">${factsHtml(a.facts)}</div>
    <div class="panel" data-panel="views">${viewsHtml(a)}</div>
    <div class="panel" data-panel="hypo">${hypoHtml(a.hypotheses)}</div>
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
  // 데모는 짧은 두 문장(몇 개국이 보도 + 주목도)이라 그대로, AI 분석은 첫 문장만
  const why = demo ? (a.story?.why_it_matters || '') : firstSentence(a.story?.why_it_matters || '');
  return `<div class="glance-row">
    <section class="glance" aria-labelledby="g-title"><h2 class="eyebrow" id="g-title">${esc(T.glance_title)}</h2>
      <dl><div><dt>${esc(T.g_what)}</dt><dd>${esc(a.one_line)}</dd></div>
      <div><dt>${esc(T.g_where)}</dt><dd>${esc(where)}</dd></div>
      ${why ? `<div><dt>${esc(T.g_why)}</dt><dd>${esc(why)}</dd></div>` : ''}</dl></section>
    ${a.impact ? `<section class="impact" aria-labelledby="i-title"><h2 id="i-title"><span aria-hidden="true">💡</span> ${esc(T.impact_title)}</h2><p>${esc(a.impact)}</p>
      ${a.impact_tip ? `<p class="impact-tip"><span aria-hidden="true">👉</span> ${esc(a.impact_tip)}</p>` : ''}
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
const notYet = () => `<p class="muted">${esc(T.not_yet)}</p>`;
function storyHtml(s) {
  if (!s) return notYet();
  const parts = [s.background, s.what_happened, s.why_it_matters, s.what_to_watch];
  // 빈 칸(아직 번역 전이라 비워 둔 '무슨 일이' 등)은 제목째 숨김
  return `<div class="story">${parts.map((t, i) => (t ? `<section><h3>${esc(T.story[i])}</h3><p>${esc(t)}</p></section>` : '')).join('')}</div>`;
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
const POLICY_DOCS = ['terms', 'privacy'];
function renderPolicy() {
  const doc = POLICY_DOCS.includes(document.body.dataset.doc) ? document.body.dataset.doc : 'terms';
  const P = window.WL_POLICY[LANG] || window.WL_POLICY.ko;
  const d = P[doc];
  document.title = `${d.title} — WorldLens`;
  const email = window.__status?.site?.contact_email;
  const contact = email ? `${esc(T.f_contact)}: <a href="mailto:${esc(email)}">${esc(email)}</a>` : `${esc(T.f_contact)}: ${esc(T.contact_pending)}`;
  const fill = (s) => esc(s).replaceAll('{contact}', contact);
  $('#policy').innerHTML = `<article class="policy">
    <nav class="policy-tabs">${POLICY_DOCS.map((k) => `<a href="/${k}" ${k === doc ? 'aria-current="page"' : ''}>${esc(P[k].title)}</a>`).join('')}</nav>
    <h1>${esc(d.title)}</h1>
    <p class="notice">${esc(P.draft)}</p>
    <ol class="policy-list">${d.sections.map(([h, p]) => `<li><h2>${esc(h)}</h2><p>${fill(p)}</p></li>`).join('')}</ol>
  </article>`;
}

// ── 알림 ──
function toast(msg) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 4000);
}

// ── 시작 ──
// ── 과거 뉴스 (달력) ──
let arDate = new URLSearchParams(location.search).get('date') || '';
let arMonth = ''; // 'YYYY-MM' 달력에 보이는 달
let arCat = '';
// 'YYYY-MM-DD'(한국 날짜)를 화면 언어로: 11월 9일 (일)
const fmtDate = (d) => new Date(`${d}T12:00:00+09:00`).toLocaleDateString(LOCALE(), { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul' });
const addMonth = (ym, n) => { const [y, m] = ym.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1 + n, 1)); return t.toISOString().slice(0, 7); };

function calendarHtml(idx) {
  const [y, m] = arMonth.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = first.getUTCDay(); // 일요일 시작
  const wk = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 10, 1 + i)).toLocaleDateString(LOCALE(), { weekday: 'narrow', timeZone: 'UTC' })); // 2026-11-01은 일요일
  const minMonth = idx.first.slice(0, 7), maxMonth = idx.today.slice(0, 7);
  let cells = '';
  for (let i = 0; i < lead; i++) cells += '<span class="cd blank"></span>';
  for (let d = 1; d <= daysIn; d++) {
    const date = `${arMonth}-${String(d).padStart(2, '0')}`;
    const n = idx.counts[date] || 0;
    const cls = ['cd', date === idx.today ? 'today' : '', n >= 40 ? 'lv3' : n >= 15 ? 'lv2' : n ? 'lv1' : ''].join(' ');
    cells += n
      ? `<button type="button" class="${cls}" data-d="${date}" aria-pressed="${date === arDate}" aria-label="${esc(fmtDate(date))} · ${esc(T.ar_count(n))}"><b>${d}</b><i>${n}</i></button>`
      : `<span class="${cls} off"><b>${d}</b></span>`;
  }
  return `<div class="cal-head">
      <button type="button" class="cal-nav" data-m="-1" aria-label="${esc(T.ar_prev)}" ${arMonth <= minMonth ? 'disabled' : ''}>‹</button>
      <h2>${esc(T.ar_month(y, m))}</h2>
      <button type="button" class="cal-nav" data-m="1" aria-label="${esc(T.ar_next)}" ${arMonth >= maxMonth ? 'disabled' : ''}>›</button>
    </div>
    <div class="cal-grid" role="group">${wk.map((w) => `<span class="wd">${esc(w)}</span>`).join('')}${cells}</div>`;
}

async function renderArchive() {
  $('#ar-heading').textContent = T.ar_heading;
  $('#ar-intro').textContent = T.ar_intro;
  $('#ar-note').textContent = T.ar_note;
  const grid = $('#ar-events');
  let idx;
  try { idx = await getJson(`/data/${LANG}/days.json`); } catch {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(T.ar_empty)}</div>`;
    return;
  }
  idx.counts ||= {};
  const dates = Object.keys(idx.counts).sort();
  if (!idx.counts[arDate]) arDate = dates.at(-1) || idx.today;
  if (!arMonth) arMonth = arDate.slice(0, 7);

  const cal = $('#cal');
  cal.setAttribute('aria-label', T.ar_days_label);
  cal.innerHTML = calendarHtml(idx);
  cal.querySelectorAll('.cal-nav').forEach((b) => b.addEventListener('click', () => { arMonth = addMonth(arMonth, Number(b.dataset.m)); renderArchive(); }));
  cal.querySelectorAll('button.cd').forEach((b) => b.addEventListener('click', () => {
    arDate = b.dataset.d; arCat = '';
    const u = new URL(location.href); u.searchParams.set('date', arDate); history.replaceState(null, '', u);
    renderArchive();
    $('#ar-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  $('#ar-title').textContent = T.ar_title(fmtDate(arDate));
  let day;
  try { day = await getJson(`/data/${LANG}/day/${arDate}.json`); } catch { day = { events: [] }; }
  const slim = $('#ar-slim');
  slim.hidden = day.full !== false;
  slim.textContent = T.ar_slim_note;
  const list = day.events || [];
  const catCounts = {};
  for (const e of list) catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  if (arCat && !catCounts[arCat]) arCat = '';
  const cats = $('#ar-cats');
  cats.innerHTML = list.length ? `<span class="chips-label">${esc(T.cat_label)}</span>
    <button class="chip cat" aria-pressed="${!arCat}" data-c="">${esc(T.all)} <span class="c">${list.length}</span></button>
    ${CAT_ORDER.filter((c) => catCounts[c]).map((c) => `<button class="chip cat" data-c="${c}" aria-pressed="${arCat === c}">${esc(T.cats[c])} <span class="c">${catCounts[c]}</span></button>`).join('')}` : '';
  cats.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { arCat = c.dataset.c; renderArchive(); }));
  const shown = arCat ? list.filter((e) => e.category === arCat) : list;
  grid.innerHTML = shown.length ? shown.map((e) => cardHtml(e, { dayMeta: true, date: arDate })).join('')
    : `<div class="empty" style="grid-column:1/-1">${esc(T.ar_empty)}</div>`;
}

// 보관된 사건 (상세 파일이 없는 오래된 사건): 날짜별 목록에 함께 담긴 한 줄 요약·원문 링크로 보여 줌
async function renderKeptEvent(id, date) {
  const main = $('#event');
  let e;
  try { e = (await getJson(`/data/${LANG}/day/${date}.json`)).events.find((x) => x.id === id); } catch {}
  if (!e) return false;
  document.title = `${e.title} — WorldLens`;
  main.innerHTML = `
    <div class="event-head">
      <a class="back" href="/archive?date=${esc(date)}">${esc(T.ar_back)}</a><br>
      <span class="region-tag" data-region="${esc(e.region)}">${esc(T.regions[e.region] || e.region)}</span>${e.category && T.cats[e.category] ? ` <span class="cat-tag">${esc(T.cats[e.category])}</span>` : ''} <span class="cat-tag">${esc(T.ar_kept)}</span>
      <h1>${esc(e.title)}</h1>
      <div class="stats">${heat(e.country_count)}<span><b>${e.country_count}</b>${esc(T.st_countries)}</span><span><b>${e.outlet_count}</b>${esc(T.st_outlets)}</span><span><b>${e.article_count}</b>${esc(T.st_articles)}</span><span>${esc(T.first_seen(fmtDay(e.first_seen)))}</span></div>
      <div class="countries">${pills(e.countries, 20)}</div>
    </div>
    ${e.one_line ? `<section class="glance kept"><h2 class="eyebrow">${esc(T.glance_title)}</h2><p>${esc(e.one_line)}</p></section>` : ''}
    <p class="notice" style="max-width:820px">${esc(T.ar_kept_note)}</p>
    <section class="kept-sources"><h2>${esc(T.ar_sources)}</h2>
      <ul class="timeline">${(e.articles || []).map((x) => `<li class="tl-item"><time datetime="${esc(x.published_at)}">${esc(fmtDay(x.published_at))}</time><div>
        <div class="who"><span class="pill">${esc(x.country)}</span>${esc(x.outlet)}</div>
        <a class="t" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer">${esc(x.title)} ↗</a></div></li>`).join('')}</ul>
    </section>`;
  return true;
}

function renderPage() {
  if (page === 'home') return renderHome();
  if (page === 'event') return renderEvent();
  if (page === 'archive') return renderArchive();
  if (page === 'about') return renderAbout();
  if (page === 'policy') return renderPolicy();
}
const STATIC_PAGES = ['about', 'policy'];
(async () => {
  await watchStatus(); // 1분마다 새 데이터가 있는지 확인 → 있으면 화면을 다시 그림
  applyChrome();
  renderPage();
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
