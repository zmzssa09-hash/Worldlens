// 내 컴퓨터 미리 보기용 자동 갱신 일정 (공개 사이트는 GitHub Actions가 대신 함)
// - 5분마다: 수집 → 사건 묶기 → 번역 → (필요한 사건만) 분석 → 다른 언어 현지화 → 정적 파일 다시 만들기
// - 매일 아침 7시: 오늘의 브리핑을 새로 만듦
import cron from 'node-cron';
import { refresh } from './pipeline.js';
import { buildSite } from './build.js';

const LIVE_CRON = process.env.WORLDLENS_LIVE_CRON || '*/5 * * * *';
const BRIEFING_CRON = process.env.WORLDLENS_BRIEFING_CRON || '0 7 * * *';

function job(label, briefing) {
  return () => refresh({ analyze: true, briefing }).then(() => buildSite())
    .catch((e) => console.error(`[${label} 오류]`, e.message));
}

export function startScheduler() {
  cron.schedule(LIVE_CRON, job('실시간 갱신', 'if-missing'), { noOverlap: true });
  cron.schedule(BRIEFING_CRON, job('브리핑', 'force'));
  console.log(`[일정] 갱신 "${LIVE_CRON}", 아침 브리핑 "${BRIEFING_CRON}"`);
}
