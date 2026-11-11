// 정적 사이트 만들기: public/ 화면 파일 + 데이터베이스 내용을 JSON 파일로 → dist/
// Vercel은 dist/ 폴더를 그대로 보여 주기만 함 (서버·데이터베이스 없음)
//
//   dist/data/status.json               마지막 갱신 시각, 모드, 운영자 정보
//   dist/data/{언어}/briefing.json       오늘의 브리핑
//   dist/data/{언어}/events.json         최근 48시간 사건 목록
//   dist/data/{언어}/event/{id}.json     사건 상세 (최근 7일 날짜별 목록에 나온 사건 + 홈 사건)
//   dist/data/{언어}/days.json           과거 뉴스 달력: 날짜별 사건 수 (최근 6개월)
//   dist/data/{언어}/day/{날짜}.json      그날 여러 나라가 함께 보도한 사건
//                                        (7일이 넘은 날은 많이 보도된 20개 + 원문 링크 몇 개만)
//
// 날짜별 목록은 data/archive/{언어}/{날짜}.json 에 굳혀 둠 (GitHub Actions 캐시로 data/와 함께 이어짐)
// → 데이터베이스에서 3주 넘은 기사를 지워도 과거 뉴스는 6개월까지 남음
//
// 사용: node src/build.js  (npm run build)
import { copyFileSync, readdirSync, mkdirSync, rmSync, writeFileSync, readFileSync, renameSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS } from './sources.js';
import {
  statusData, briefingData, shownEvents, eventsData, eventDetail, eventCard,
  poolEvents, archiveDays, slimArticles, kstDate, FULL_DAYS, KEEP_DAYS, DB_DAYS, RECENT_CAP, OLD_CAP,
} from './views.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DIST = process.env.WORLDLENS_DIST || join(ROOT, 'dist');
const ARCHIVE = process.env.WORLDLENS_ARCHIVE || join(ROOT, 'data', 'archive');

// 폴더 복사 (Node의 cpSync는 윈도우에서 한글 경로일 때 조용히 죽는 경우가 있어 직접 구현)
function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  for (const ent of readdirSync(from, { withFileTypes: true })) {
    const a = join(from, ent.name), b = join(to, ent.name);
    if (ent.isDirectory()) copyDir(a, b); else copyFileSync(a, b);
  }
}

const write = (file, data) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data));
};
const dateAgo = (n) => kstDate(Date.now() - n * 86400e3);

export function buildSite(outDir = DIST) {
  // 새 폴더에 다 만든 뒤 한 번에 바꿔치기 → 만드는 도중에 반쯤 빈 사이트가 보이지 않게
  const tmp = `${outDir}.tmp`;
  rmSync(tmp, { recursive: true, force: true });
  copyDir(join(ROOT, 'public'), tmp);
  copyFileSync(join(ROOT, 'vercel.json'), join(tmp, 'vercel.json'));

  const events = shownEvents();
  const pool = poolEvents(events);
  const days = archiveDays(pool, dateAgo(DB_DAYS - 1));
  const today = dateAgo(0), oldestKept = dateAgo(KEEP_DAYS - 1), fullFrom = dateAgo(FULL_DAYS - 1);

  // 상세 페이지를 만들 사건: 홈 사건 + 최근 7일 날짜별 목록에 나온 사건
  const fullIds = new Set(events.map((e) => e.id));
  for (let i = 0; i < FULL_DAYS; i++) for (const x of (days[dateAgo(i)] || []).slice(0, RECENT_CAP)) fullIds.add(x.event.id);
  const byId = new Map(pool.map((e) => [e.id, e]));

  let files = 0;
  write(join(tmp, 'data', 'status.json'), statusData()); files++;
  for (const lang of LANGS) {
    write(join(tmp, 'data', lang, 'briefing.json'), briefingData(lang)); files++;
    write(join(tmp, 'data', lang, 'events.json'), eventsData(lang, events)); files++;
    for (const id of fullIds) { write(join(tmp, 'data', lang, 'event', `${id}.json`), eventDetail(id, lang)); files++; }

    // 1) 데이터베이스에 남아 있는 날짜는 목록을 새로 만들어 굳혀 둠
    const cards = new Map();
    const card = (e) => { if (!cards.has(e.id)) cards.set(e.id, eventCard(e, lang)); return cards.get(e.id); };
    for (let i = 0; i < DB_DAYS; i++) {
      const d = dateAgo(i);
      const full = d >= fullFrom;
      const list = (days[d] || []).slice(0, full ? RECENT_CAP : OLD_CAP).map((x) => ({
        ...card(byId.get(x.event.id) || x.event),
        day_countries: x.day_countries,
        day_articles: x.day_articles,
        ...(full ? {} : { articles: slimArticles(x.event.id, lang, d) }), // 상세 페이지가 없는 날은 원문 링크를 함께
      }));
      if (!list.length && !existsSync(join(ARCHIVE, lang, `${d}.json`))) continue;
      write(join(ARCHIVE, lang, `${d}.json`), { date: d, full, events: list });
    }

    // 2) 굳혀 둔 날짜 목록 → 사이트로. 6개월 넘은 것은 지움
    const counts = {};
    const dir = join(ARCHIVE, lang);
    for (const f of existsSync(dir) ? readdirSync(dir) : []) {
      const d = f.replace(/\.json$/, '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
      if (d < oldestKept) { rmSync(join(dir, f), { force: true }); continue; }
      if (d > today) continue;
      const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      if (!data.events?.length) continue;
      counts[d] = data.events.length;
      write(join(tmp, 'data', lang, 'day', `${d}.json`), data); files++;
    }
    const known = Object.keys(counts).sort();
    write(join(tmp, 'data', lang, 'days.json'), { today, first: known[0] || today, full_days: FULL_DAYS, keep_days: KEEP_DAYS, counts }); files++;
  }

  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  try { renameSync(tmp, outDir); } catch { // 윈도우에서 폴더가 잠깐 잠겨 있으면 이름 바꾸기가 실패할 수 있음 → 복사로 대신
    copyDir(tmp, outDir);
    rmSync(tmp, { recursive: true, force: true });
  }
  return { events: events.length, details: fullIds.size, files };
}

// 직접 실행했을 때
const norm = (p) => resolve(p).toLowerCase(); // 윈도우는 경로 대소문자가 섞여 들어올 수 있음
if (process.argv[1] && norm(fileURLToPath(import.meta.url)) === norm(process.argv[1])) {
  const r = buildSite();
  console.log(`[만들기] 홈 사건 ${r.events}개, 상세 페이지 ${r.details}개, 데이터 파일 ${r.files}개 → ${DIST}`);
}
