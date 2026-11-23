// 한 번 갱신하고 정적 파일까지 만들기: npm run refresh
// GitHub Actions가 주기적으로 이걸 실행해서 Vercel에 올림
//   --briefing   오늘의 브리핑을 새로 만듦 (기본: 오늘 브리핑이 없을 때만)
// 한국 시간 아침 7시가 지난 첫 갱신은 브리핑을 새로 만듦 (밤사이 뉴스까지 담기게)
//  → 예전엔 7시 예약 실행이 따로 있었는데, 20분 갱신 사슬과 부딪혀 매번 '취소됨'으로 끝나고 메일이 갔음
import { refresh } from './pipeline.js';
import { buildSite } from './build.js';
import { getMeta, setMeta } from './db.js';

const kst = new Date(Date.now() + 9 * 3600e3);
const kstDay = kst.toISOString().slice(0, 10);
const morningKey = `briefing_morning_${kstDay}`;
const morningDue = kst.getUTCHours() >= 7 && !getMeta(morningKey);

const briefing = process.argv.includes('--briefing') || morningDue ? 'force' : 'if-missing';
const report = await refresh({ analyze: true, briefing });
if (morningDue) setMeta(morningKey, '1');
const t = report.translated.map((x) => `${x.lang} ${x.translated}`).join(', ');
console.log(`[갱신] 새 기사 ${report.collect.added}건, 번역(${t}), 분석 ${report.analysis?.done ?? 0}건${morningDue ? ', 아침 브리핑 새로 만듦' : ''} (${report.seconds}초)`);
const b = buildSite();
console.log(`[만들기] 사건 ${b.events}개, 데이터 파일 ${b.files}개`);
