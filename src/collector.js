// 여러 나라 언론사의 RSS를 동시에 수집 → 정리 → DB 저장
import Parser from 'rss-parser';
import { createHash } from 'node:crypto';
import { SOURCES } from './sources.js';
import { insertArticle, setMeta } from './db.js';

const parser = new Parser();

const MAX_AGE_MS = 72 * 3600 * 1000; // 3일보다 오래된 기사는 저장하지 않음

export function cleanText(html = '') {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#8217;|&rsquo;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// "SEOUL, Nov. 6 (Yonhap) -- ", "MOSCOW, November 5. /TASS/. " 같은 기사 머리(데이트라인) 제거
export function stripDateline(text = '') {
  return text
    .replace(/^[A-Z][A-Za-z .,'-]{1,40},\s+[A-Z][a-z]{2,8}\.?\s+\d{1,2}\.?\s*(\([^)]*\)|\/[^/]+\/\.?)?\s*(--|—|-)?\s*/, '')
    .trim();
}

function normalizeUrl(u = '') {
  try {
    const url = new URL(u);
    url.hash = '';
    for (const k of [...url.searchParams.keys()]) if (/^utm_|^at_|^ref/.test(k)) url.searchParams.delete(k);
    return url.toString();
  } catch { return u; }
}

// rss-parser 자체 타임아웃이 일부 서버에서 동작하지 않아, fetch + 강제 중단(AbortSignal)으로 가져옴
async function fetchFeed(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WorldLens/0.1 (personal news aggregator)', Accept: 'application/rss+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = (await res.text()).replace(/^[^<]+/, ''); // XML 앞에 붙은 잡문자 제거
  return parser.parseString(xml);
}

async function fetchSource(src) {
  const feed = await fetchFeed(src.url);
  const now = Date.now();
  const fetchedAt = new Date(now).toISOString();
  let added = 0;
  for (const item of feed.items) {
    const title = cleanText(item.title);
    const url = normalizeUrl(item.link);
    if (!title || !/^https?:\/\//.test(url)) continue;
    const pub = new Date(item.isoDate || item.pubDate || fetchedAt);
    const publishedAt = isNaN(pub) ? fetchedAt : pub.toISOString();
    if (now - Date.parse(publishedAt) > MAX_AGE_MS) continue;
    const summary = stripDateline(cleanText(item.contentSnippet || item.summary || item.content || '')).slice(0, 600);
    // 같은 매체의 같은 제목은 한 번만 (URL이 달라도 재게시되는 경우가 있음)
    const id = createHash('sha1').update(`${src.id}|${title.toLowerCase()}`).digest('hex');
    const ok = insertArticle({
      id, sourceId: src.id, country: src.country, stateMedia: src.stateMedia, title, summary, url, publishedAt, fetchedAt,
    });
    if (ok) added++;
  }
  return added;
}

export async function collectAll() {
  const results = await Promise.allSettled(SOURCES.map(fetchSource));
  const report = { added: 0, ok: [], failed: [] };
  results.forEach((r, i) => {
    const src = SOURCES[i];
    if (r.status === 'fulfilled') { report.added += r.value; report.ok.push(src.id); }
    else { report.failed.push(src.id); console.warn(`[수집 실패] ${src.names.ko}: ${r.reason?.message}`); }
  });
  setMeta('last_collect', new Date().toISOString());
  setMeta('last_collect_report', JSON.stringify(report));
  return report;
}
