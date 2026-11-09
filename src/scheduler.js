// 자동 업데이트 일정
// - 5분마다: 수집 → 사건 묶기 → 번역 → (필요한 사건만) 분석 → 다른 언어 현지화
//   AI 분석은 analyzer/index.js의 재분석 간격·하루 상한으로 비용을 제한
// - 10분마다: 구독 정기 결제
// - 매일 아침 7시: 오늘의 브리핑을 새로 만듦
import cron from 'node-cron';
import { refresh } from './pipeline.js';
import { runRenewals } from './billing.js';

const LIVE_CRON = process.env.WORLDLENS_LIVE_CRON || '*/5 * * * *';
const BRIEFING_CRON = process.env.WORLDLENS_BRIEFING_CRON || '0 7 * * *';

function safe(label, fn) {
  return () => fn().catch((e) => console.error(`[${label} 오류]`, e.message));
}

export function startScheduler() {
  cron.schedule(LIVE_CRON, safe('실시간 갱신', () => refresh({ analyze: true, briefing: 'if-missing' })), { noOverlap: true });
  // 10분마다: 결제일이 된 구독자 자동 결제, 기간 끝난 회원 만료 처리
  cron.schedule('*/10 * * * *', safe('정기 결제', runRenewals), { noOverlap: true });
  cron.schedule(BRIEFING_CRON, safe('브리핑', () => refresh({ analyze: true, briefing: 'force' })));
  console.log(`[일정] 실시간 갱신 "${LIVE_CRON}", 아침 브리핑 "${BRIEFING_CRON}"`);
}
