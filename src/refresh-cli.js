// 한 번 갱신하고 정적 파일까지 만들기: npm run refresh
// GitHub Actions가 주기적으로 이걸 실행해서 Vercel에 올림
//   --briefing   오늘의 브리핑을 새로 만듦 (기본: 오늘 브리핑이 없을 때만)
import { refresh } from './pipeline.js';
import { buildSite } from './build.js';

const briefing = process.argv.includes('--briefing') ? 'force' : 'if-missing';
const report = await refresh({ analyze: true, briefing });
const t = report.translated.map((x) => `${x.lang} ${x.translated}`).join(', ');
console.log(`[갱신] 새 기사 ${report.collect.added}건, 번역(${t}), 분석 ${report.analysis?.done ?? 0}건 (${report.seconds}초)`);
const b = buildSite();
console.log(`[만들기] 사건 ${b.events}개, 데이터 파일 ${b.files}개`);
