// 기사들을 '사건(event)' 단위로 묶는다.
// 방식: 제목·요약의 핵심 단어(희귀할수록 가중치↑, IDF)가 많이 겹치면 같은 사건으로 판단.
// 사건은 계속 유지되고, 새 기사가 들어오면 기존 사건에 이어 붙는다 → 타임라인이 생김.
import { db, recentArticles } from './db.js';
import { PLACE_REGION } from './sources.js';
import { shortTitle } from './textclean.js';

const WINDOW_MS = 72 * 3600 * 1000;
const THRESHOLD = 0.3;      // 기사 핵심어 가중치 중 30% 이상이 사건과 겹치면 합침
const MIN_SHARED = 2;       // 그리고 최소 2개 단어가 겹쳐야 함

const STOP = new Set(`a an the and or but if of to in on at by for with from as is are was were be been being it its this that these those
he she they them his her their we our you your i me my not no yes do does did done has have had having will would can could should may might must
than then there here when where what which who whom whose why how all any each few more most other some such only own same so too very just
over under after before about into through during against between up down out off again further once also new says said say saying
amid amidst after news live latest update updates watch video videos photo photos report reports reported reportedly year years day days week weeks
month months time people world first last two three four five six one million billion percent per cent mr mrs ms dr st via while still
make makes made take takes took get gets got set sets back like near since until among across around top big major key amid follow following
calls call called told tell tells according including include includes official officials government govt state states country countries
minister president leader leaders talks talk plan plans deal deals move moves amid ahead early late today tomorrow yesterday week end ends
monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december
2024 2025 2026 2027 global international national public group groups part says set within without what's it's he's she's don't won't can't
latest breaking analysis opinion editorial explainer comment`.split(/\s+/));

const ALIASES = { 'u.n': 'un', 'e.u': 'eu',
  ukrainian: 'ukraine', russian: 'russia', chinese: 'china', israeli: 'israel', iranian: 'iran', korean: 'korea',
  japanese: 'japan', indian: 'india', palestinians: 'palestinian', syrian: 'syria', american: 'usa', americans: 'usa',
  british: 'britain', french: 'france', german: 'germany', european: 'europe', australian: 'australia', african: 'africa',
  houthis: 'houthi', midterms: 'midterm' };

export function tokenize(text = '') {
  const out = new Set();
  const words = String(text)
    .replace(/\bU\.?S\.?A?\b/g, ' usa ') // 대문자 'US'만 미국으로 (소문자 'us'는 대명사)
    .replace(/\bU\.?K\.?\b/g, ' britain ')
    .toLowerCase().replace(/[’']s\b/g, '').match(/[a-z][a-z.\-]*[a-z]|[a-z]/g) || [];
  for (let w of words) {
    w = w.replace(/\.$/, '');
    if (ALIASES[w]) w = ALIASES[w];
    if (w.length < 3 && !['un', 'eu', 'g7', 'g20'].includes(w)) continue;
    if (STOP.has(w)) continue;
    if (w.length > 4 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
    if (ALIASES[w]) w = ALIASES[w];
    out.add(w);
  }
  return out;
}

// 제목은 앞 25단어까지만 (본문을 통째로 제목에 넣는 매체가 있어서)
function articleTokens(a) {
  const titleLead = (a.title || '').split(/\s+/).slice(0, 25).join(' ');
  const summaryLead = (a.summary || '').split(/\s+/).slice(0, 30).join(' ');
  return tokenize(`${titleLead} ${summaryLead}`);
}

// 사건의 '핵심어': 가장 많이 나온 단어 CORE_SIZE개만 비교에 씀
// (예전엔 사건에 들어온 모든 단어와 비교 → 사건이 커질수록 단어가 쌓여 아무 기사나 붙는 눈덩이 현상)
const CORE_SIZE = 30;
function coreOf(prof, idf) {
  return new Set([...prof.entries()].sort((x, y) => y[1] * idf(y[0]) - x[1] * idf(x[0])).slice(0, CORE_SIZE).map(([w]) => w));
}

// 이미 엉킨 사건 풀기: 핵심어 10개 중 2개 이상이 제목에 있는 기사가 30%도 안 되면, 서로 상관없는 기사가 모인 것
// → 최근 기사를 사건에서 빼서 다시 묶음 (오래된 기사가 하나도 안 남으면 사건과 분석도 지움)
function dissolveIncoherent(arts, tokMap, idf) {
  const byEvent = new Map();
  for (const a of arts) if (a.event_id != null) (byEvent.get(a.event_id) || byEvent.set(a.event_id, []).get(a.event_id)).push(a);
  const unassignAll = db.prepare('UPDATE articles SET event_id = NULL WHERE event_id = ?');
  const delEvent = db.prepare('DELETE FROM events WHERE id = ?');
  const delAnalysis = db.prepare('DELETE FROM event_analysis WHERE event_id = ?');
  let dissolved = 0;
  for (const [eid, list] of byEvent) {
    if (list.length < 15) continue;
    const prof = new Map();
    for (const a of list) for (const w of tokenize((a.title || '').split(/\s+/).slice(0, 25).join(' '))) prof.set(w, (prof.get(w) || 0) + 1);
    const core = new Set([...prof.entries()].sort((x, y) => y[1] * idf(y[0]) - x[1] * idf(x[0])).slice(0, 10).map(([w]) => w));
    const ok = list.filter((a) => [...tokenize((a.title || '').split(/\s+/).slice(0, 25).join(' '))].filter((w) => core.has(w)).length >= 2).length;
    if (ok / list.length >= 0.3) continue;
    // 오래된 기사까지 모두 빼고 사건·분석을 지움 (사건이 남으면 기사 수 3,961 같은 낡은 통계가 홈에 그대로 보임)
    unassignAll.run(eid);
    for (const a of list) a.event_id = null;
    delAnalysis.run(eid);
    delEvent.run(eid);
    dissolved++;
    console.warn(`[묶기] 서로 상관없는 기사가 모인 사건 ${eid} (${list.length}건)을 풀어 다시 묶어요`);
  }
  return dissolved;
}

export function clusterRecent() {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const arts = recentArticles(since);
  if (!arts.length) return { assigned: 0, created: 0 };

  // IDF 계산: 많은 기사에 나오는 흔한 단어일수록 가중치를 낮춤
  const tokMap = new Map();
  const df = new Map();
  for (const a of arts) {
    const t = articleTokens(a);
    tokMap.set(a.id, t);
    for (const w of t) df.set(w, (df.get(w) || 0) + 1);
  }
  const N = arts.length;
  const idf = (w) => Math.log((N + 1) / ((df.get(w) || 0) + 1));

  // 예전에 저장된 너무 긴 제목도 줄이고, 그 번역은 지워서 다시 번역되게
  for (const a of arts) {
    const t = shortTitle(a.title);
    if (t === a.title) continue;
    db.prepare('UPDATE articles SET title = ? WHERE id = ?').run(t, a.id);
    db.prepare('DELETE FROM article_i18n WHERE article_id = ?').run(a.id);
    a.title = t;
  }
  dissolveIncoherent(arts, tokMap, idf);

  // 기존 사건의 단어 프로필
  const profiles = new Map(); // eventId → Map(token→count)
  const members = new Map();  // eventId → article[]
  for (const a of arts) {
    if (a.event_id == null) continue;
    addToProfile(profiles, members, a.event_id, a, tokMap.get(a.id));
  }

  const insertEvent = db.prepare(`INSERT INTO events (title, first_seen, last_updated) VALUES (?, ?, ?)`);
  const assign = db.prepare('UPDATE articles SET event_id = ? WHERE id = ?');
  let assigned = 0, created = 0;
  const cores = new Map(); // eventId → { n: 계산할 때 기사 수, set: 핵심어 }

  db.exec('BEGIN');
  try {
    for (const a of arts) {
      if (a.event_id != null) continue;
      const toks = tokMap.get(a.id);
      const total = [...toks].reduce((s, w) => s + idf(w), 0) || 1;
      let best = null, bestScore = 0;
      for (const [eid, prof] of profiles) {
        const n = members.get(eid).length;
        const minCount = n >= 4 ? 2 : 1; // 큰 사건은 두 번 이상 나온 단어만 '사건의 핵심어'로 봄
        // 핵심어 목록은 기사가 붙을 때만 다시 계산
        let c = cores.get(eid);
        if (!c || c.n !== n) { c = { n, set: coreOf(prof, idf) }; cores.set(eid, c); }
        let shared = 0, sharedIdf = 0;
        for (const w of toks) {
          if (c.set.has(w) && (prof.get(w) || 0) >= minCount) { shared++; sharedIdf += idf(w); }
        }
        if (shared < MIN_SHARED) continue;
        const score = sharedIdf / total;
        if (score > bestScore) { bestScore = score; best = eid; }
      }
      let eid = best;
      if (!eid || bestScore < THRESHOLD) {
        eid = Number(insertEvent.run(a.title, a.published_at, a.published_at).lastInsertRowid);
        created++;
      } else assigned++;
      assign.run(eid, a.id);
      a.event_id = eid;
      addToProfile(profiles, members, eid, a, toks);
    }

    // 2차: 따로 생긴 비슷한 사건끼리 합치기 (같은 사건이 표현만 달라 둘로 나뉜 경우)
    mergeSimilarEvents(profiles, members, idf);

    // 사건별 통계·대표 제목·지역 갱신
    const upd = db.prepare(`UPDATE events SET title = ?, rep_article_id = ?, region = ?, keywords = ?, first_seen = MIN(first_seen, ?),
      last_updated = ?, article_count = ?, outlet_count = ?, country_count = ? WHERE id = ?`);
    for (const [eid, list] of members) {
      const all = db.prepare('SELECT * FROM articles WHERE event_id = ? ORDER BY published_at ASC').all(eid);
      const prof = profiles.get(eid);
      const outlets = new Set(all.map((x) => x.source_id));
      const countries = new Set(all.map((x) => x.country));
      const rep = pickRepresentative(list, prof, tokMap);
      const keywords = [...prof.entries()].sort((x, y) => y[1] * idf(y[0]) - x[1] * idf(x[0])).slice(0, 8).map(([w]) => w);
      upd.run(rep.title, rep.id, guessRegion(prof), JSON.stringify(keywords), all[0].published_at,
        all[all.length - 1].published_at, all.length, outlets.size, countries.size, eid);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return { assigned, created };
}

function topTokens(prof, idf, n = 12) {
  return [...prof.entries()].sort((x, y) => y[1] * idf(y[0]) - x[1] * idf(x[0])).slice(0, n).map(([w]) => w);
}

function mergeSimilarEvents(profiles, members, idf) {
  const ids = [...profiles.keys()].filter((id) => members.get(id).length >= 2);
  const tops = new Map(ids.map((id) => [id, topTokens(profiles.get(id), idf)]));
  const moveArticles = db.prepare('UPDATE articles SET event_id = ? WHERE event_id = ?');
  const delEvent = db.prepare('DELETE FROM events WHERE id = ?');
  const gone = new Set();
  // 큰 사건부터 작은 사건을 흡수
  ids.sort((a, b) => members.get(b).length - members.get(a).length);
  for (let i = 0; i < ids.length; i++) {
    const a = ids[i];
    if (gone.has(a)) continue;
    for (let j = i + 1; j < ids.length; j++) {
      const b = ids[j];
      if (gone.has(b)) continue;
      const ta = tops.get(a), tb = new Set(tops.get(b));
      const shared = ta.filter((w) => tb.has(w));
      if (shared.length < 3) continue;
      const sharedIdf = shared.reduce((s, w) => s + idf(w), 0);
      const minSum = Math.min(ta.reduce((s, w) => s + idf(w), 0), [...tb].reduce((s, w) => s + idf(w), 0)) || 1;
      if (sharedIdf / minSum < 0.35) continue;
      moveArticles.run(a, b);
      delEvent.run(b);
      for (const art of members.get(b)) addToProfile(profiles, members, a, art, tokenize(`${art.title} ${(art.summary || '').split(/\s+/).slice(0, 30).join(' ')}`));
      profiles.delete(b); members.delete(b);
      gone.add(b);
      tops.set(a, topTokens(profiles.get(a), idf));
    }
  }
}

function addToProfile(profiles, members, eid, a, toks) {
  if (!profiles.has(eid)) { profiles.set(eid, new Map()); members.set(eid, []); }
  const p = profiles.get(eid);
  for (const w of toks) p.set(w, (p.get(w) || 0) + 1);
  members.get(eid).push(a);
}

// 대표 제목: 사건 핵심어를 많이 담은 제목. 단어 수로 나눠서(평균) 긴 글이 무조건 이기지 않게, 너무 긴 제목은 후보에서 뺌
function pickRepresentative(list, prof, tokMap) {
  const pool = list.filter((a) => (a.title || '').length <= 200);
  if (pool.length) list = pool;
  let best = list[list.length - 1], bestScore = -1;
  for (const a of list) {
    const toks = tokMap.get(a.id) || [];
    let s = 0;
    for (const w of toks) s += (prof.get(w) || 0) - 1;
    s /= Math.sqrt(Math.max(1, toks.size || 0));
    if (s > bestScore || (s === bestScore && a.published_at > best.published_at)) { bestScore = s; best = a; }
  }
  return best;
}

function guessRegion(prof) {
  const score = {};
  for (const [w, c] of prof) {
    const r = PLACE_REGION[w];
    if (r) score[r] = (score[r] || 0) + c;
  }
  const top = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : 'global';
}
