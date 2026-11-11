// 정적 사이트 만들기: public/ 화면 파일 + 데이터베이스 내용을 JSON 파일로 → dist/
// Vercel은 dist/ 폴더를 그대로 보여 주기만 함 (서버·데이터베이스 없음)
//
//   dist/data/status.json               마지막 갱신 시각, 모드, 운영자 정보
//   dist/data/{언어}/briefing.json       오늘의 브리핑
//   dist/data/{언어}/events.json         최근 48시간 사건 목록
//   dist/data/{언어}/event/{id}.json     사건 상세 (지난 사건 포함)
//   dist/data/{언어}/days.json           최근 2주 날짜 목록과 날짜별 사건 수
//   dist/data/{언어}/day/{날짜}.json      그날 여러 나라가 함께 보도한 사건
//
// 사용: node src/build.js  (npm run build)
import { copyFileSync, readdirSync, mkdirSync, rmSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS } from './sources.js';
import { statusData, briefingData, shownEvents, eventsData, eventDetail, eventCard, archiveEvents, archiveDays, kstDate, ARCHIVE_DAYS } from './views.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DIST = process.env.WORLDLENS_DIST || join(ROOT, 'dist');

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

export function buildSite(outDir = DIST) {
  // 새 폴더에 다 만든 뒤 한 번에 바꿔치기 → 만드는 도중에 반쯤 빈 사이트가 보이지 않게
  const tmp = `${outDir}.tmp`;
  rmSync(tmp, { recursive: true, force: true });
  copyDir(join(ROOT, 'public'), tmp);
  copyFileSync(join(ROOT, 'vercel.json'), join(tmp, 'vercel.json'));

  const events = shownEvents();
  const archived = archiveEvents(events); // 지금 사건 + 최근 2주 지난 사건 → 상세 파일은 모두 만듦
  const days = archiveDays(archived);
  const dayList = Array.from({ length: ARCHIVE_DAYS }, (_, i) => kstDate(Date.now() - i * 86400e3));
  let files = 0;
  write(join(tmp, 'data', 'status.json'), statusData()); files++;
  for (const lang of LANGS) {
    write(join(tmp, 'data', lang, 'briefing.json'), briefingData(lang)); files++;
    write(join(tmp, 'data', lang, 'events.json'), eventsData(lang, events)); files++;
    const cards = new Map(archived.map((e) => [e.id, eventCard(e, lang)]));
    for (const e of archived) { write(join(tmp, 'data', lang, 'event', `${e.id}.json`), eventDetail(e.id, lang)); files++; }
    write(join(tmp, 'data', lang, 'days.json'), { days: dayList.map((d) => ({ date: d, count: days[d]?.length || 0 })) }); files++;
    for (const d of dayList) {
      const list = (days[d] || []).map((x) => ({ ...cards.get(x.event.id), day_countries: x.day_countries, day_articles: x.day_articles }));
      write(join(tmp, 'data', lang, 'day', `${d}.json`), { date: d, events: list }); files++;
    }
  }

  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  try { renameSync(tmp, outDir); } catch { // 윈도우에서 폴더가 잠깐 잠겨 있으면 이름 바꾸기가 실패할 수 있음 → 복사로 대신
    copyDir(tmp, outDir);
    rmSync(tmp, { recursive: true, force: true });
  }
  return { events: events.length, archived: archived.length, files };
}

// 직접 실행했을 때
const norm = (p) => resolve(p).toLowerCase(); // 윈도우는 경로 대소문자가 섞여 들어올 수 있음
if (process.argv[1] && norm(fileURLToPath(import.meta.url)) === norm(process.argv[1])) {
  const r = buildSite();
  console.log(`[만들기] 사건 ${r.events}개 (지난 사건 포함 ${r.archived}개), 데이터 파일 ${r.files}개 → ${DIST}`);
}
