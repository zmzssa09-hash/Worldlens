// Node 내장 SQLite (node:sqlite) 사용 → 별도 설치·빌드 불필요
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB_PATH = process.env.WORLDLENS_DB || join(ROOT, 'data', 'worldlens.db');
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

// 구조가 바뀌면 예전 데이터는 지우고 새로 모음 (뉴스는 다시 수집하면 되므로)
const SCHEMA_VERSION = '3';
db.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);');
if (db.prepare("SELECT value FROM meta WHERE key = 'schema'").get()?.value !== SCHEMA_VERSION) {
  db.exec(`DROP TABLE IF EXISTS articles; DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS briefings;
    DROP TABLE IF EXISTS article_i18n; DROP TABLE IF EXISTS event_analysis; DELETE FROM meta;`);
  db.prepare("INSERT INTO meta (key, value) VALUES ('schema', ?)").run(SCHEMA_VERSION);
}

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    country TEXT NOT NULL,
    state_media INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,             -- 원문 (영어)
    summary TEXT,
    url TEXT NOT NULL,
    published_at TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    event_id INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_articles_pub ON articles(published_at);
  CREATE INDEX IF NOT EXISTS idx_articles_event ON articles(event_id);

  -- 기사 번역 (언어별)
  CREATE TABLE IF NOT EXISTS article_i18n (
    article_id TEXT NOT NULL,
    lang TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    PRIMARY KEY (article_id, lang)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,             -- 대표 기사 원문 제목
    rep_article_id TEXT,             -- 대표 기사 (언어별 제목은 이 기사의 번역)
    region TEXT NOT NULL DEFAULT 'global',
    keywords TEXT NOT NULL DEFAULT '[]',
    first_seen TEXT NOT NULL,
    last_updated TEXT NOT NULL,
    article_count INTEGER NOT NULL DEFAULT 0,
    outlet_count INTEGER NOT NULL DEFAULT 0,
    country_count INTEGER NOT NULL DEFAULT 0,
    analysis_mode TEXT,
    analyzed_at TEXT,
    analyzed_article_count INTEGER NOT NULL DEFAULT 0
  );

  -- 사건 분석 (언어별). 기준 언어 분석이 새로 만들어지면 다른 언어는 다시 번역
  CREATE TABLE IF NOT EXISTS event_analysis (
    event_id INTEGER NOT NULL,
    lang TEXT NOT NULL,
    json TEXT NOT NULL,
    mode TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (event_id, lang)
  );

  CREATE TABLE IF NOT EXISTS briefings (
    date TEXT NOT NULL,
    lang TEXT NOT NULL,
    content_json TEXT NOT NULL,
    mode TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (date, lang)
  );
`);

export function getMeta(key) {
  return db.prepare('SELECT value FROM meta WHERE key = ?').get(key)?.value ?? null;
}
export function setMeta(key, value) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));
}

export function insertArticle(a) {
  const r = db.prepare(`INSERT OR IGNORE INTO articles
    (id, source_id, country, state_media, title, summary, url, published_at, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    a.id, a.sourceId, a.country, a.stateMedia ? 1 : 0, a.title, a.summary, a.url, a.publishedAt, a.fetchedAt,
  );
  return r.changes > 0;
}

export function recentArticles(sinceIso) {
  return db.prepare('SELECT * FROM articles WHERE published_at >= ? ORDER BY published_at ASC').all(sinceIso);
}

// lang 번역을 붙여서 돌려줌 (없으면 원문)
export function articlesForEvent(eventId, lang = null) {
  if (!lang) return db.prepare('SELECT * FROM articles WHERE event_id = ? ORDER BY published_at ASC').all(eventId);
  return db.prepare(`SELECT a.*, i.title AS t_title, i.summary AS t_summary FROM articles a
    LEFT JOIN article_i18n i ON i.article_id = a.id AND i.lang = ?
    WHERE a.event_id = ? ORDER BY a.published_at ASC`).all(lang, eventId);
}

export function articleTitle(articleId, lang) {
  return db.prepare('SELECT title FROM article_i18n WHERE article_id = ? AND lang = ?').get(articleId, lang)?.title ?? null;
}

export function saveArticleTranslation(articleId, lang, title, summary) {
  db.prepare(`INSERT INTO article_i18n (article_id, lang, title, summary) VALUES (?, ?, ?, ?)
    ON CONFLICT(article_id, lang) DO UPDATE SET title = excluded.title, summary = excluded.summary`).run(articleId, lang, title, summary);
}

export function getEvent(id) {
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id);
}

export function listEvents({ region, minOutlets = 2, sinceIso, limit = 60 } = {}) {
  const where = ['outlet_count >= ?', 'last_updated >= ?'];
  const params = [minOutlets, sinceIso];
  if (region) { where.push('region = ?'); params.push(region); }
  params.push(limit);
  return db.prepare(`SELECT * FROM events WHERE ${where.join(' AND ')}
    ORDER BY country_count DESC, article_count DESC, last_updated DESC LIMIT ?`).all(...params);
}

export function getAnalysis(eventId, lang) {
  return db.prepare('SELECT * FROM event_analysis WHERE event_id = ? AND lang = ?').get(eventId, lang);
}

export function saveAnalysis(eventId, lang, analysis, mode) {
  db.prepare(`INSERT INTO event_analysis (event_id, lang, json, mode, created_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(event_id, lang) DO UPDATE SET json = excluded.json, mode = excluded.mode, created_at = excluded.created_at`)
    .run(eventId, lang, JSON.stringify(analysis), mode, new Date().toISOString());
}

export function markAnalyzed(eventId, mode, articleCount) {
  db.prepare('UPDATE events SET analysis_mode = ?, analyzed_at = ?, analyzed_article_count = ? WHERE id = ?')
    .run(mode, new Date().toISOString(), articleCount, eventId);
}

export function getBriefing(date, lang) {
  return db.prepare('SELECT * FROM briefings WHERE date = ? AND lang = ?').get(date, lang)
    ?? db.prepare('SELECT * FROM briefings WHERE lang = ? ORDER BY date DESC LIMIT 1').get(lang);
}

export function saveBriefing(date, lang, content, mode) {
  db.prepare(`INSERT INTO briefings (date, lang, content_json, mode, created_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(date, lang) DO UPDATE SET content_json = excluded.content_json, mode = excluded.mode, created_at = excluded.created_at`)
    .run(date, lang, JSON.stringify(content), mode, new Date().toISOString());
}

export function counts() {
  return {
    articles: db.prepare('SELECT COUNT(*) AS n FROM articles').get().n,
    events: db.prepare('SELECT COUNT(*) AS n FROM events WHERE outlet_count >= 2').get().n,
  };
}

// ── 회원·구독·결제 (뉴스 데이터와 따로 보관, 구조 버전이 바뀌어도 지우지 않음) ──
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    pass_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    lang TEXT,
    status TEXT NOT NULL DEFAULT 'trialing',   -- trialing | active | past_due | expired
    trial_end TEXT,                            -- 무료 체험 끝나는 시각
    period_end TEXT,                           -- 유료 이용 기간 끝나는 시각
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    customer_key TEXT UNIQUE,                  -- 토스 고객 키 (무작위)
    billing_key TEXT,                          -- 토스 자동결제 키
    card_label TEXT,                           -- 예: 신한 4330****
    last_charge_error TEXT
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS payments (
    order_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,                      -- DONE | FAILED | DEV
    payment_key TEXT,
    message TEXT,
    created_at TEXT NOT NULL
  );
`);

// 오래된 데이터 정리: 마지막 기사가 keepDays일보다 오래된 사건과 그 기사·번역·분석을 지움
// (지난 사건은 2주까지만 보여 주므로 3주 넘은 것은 필요 없음. 데이터베이스가 끝없이 커지지 않게)
export function pruneOld(keepDays = 21) {
  const cutoff = new Date(Date.now() - keepDays * 86400e3).toISOString();
  db.exec('BEGIN');
  try {
    const oldEvents = `SELECT id FROM events WHERE last_updated < '${cutoff}'`;
    const oldArticles = `SELECT id FROM articles WHERE published_at < '${cutoff}' AND (event_id IS NULL OR event_id IN (${oldEvents}))`;
    db.exec(`DELETE FROM article_i18n WHERE article_id IN (${oldArticles})`);
    const a = db.prepare(`DELETE FROM articles WHERE id IN (${oldArticles})`).run().changes;
    db.exec(`DELETE FROM event_analysis WHERE event_id IN (${oldEvents})`);
    const e = db.prepare(`DELETE FROM events WHERE id IN (${oldEvents}) AND id NOT IN (SELECT DISTINCT event_id FROM articles WHERE event_id IS NOT NULL)`).run().changes;
    db.exec('COMMIT');
    return { articles: a, events: e };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
