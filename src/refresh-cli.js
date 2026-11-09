// 서버 없이 수동으로 한 번 갱신: npm run refresh
import { refresh } from './pipeline.js';

const report = await refresh({ analyze: true, briefing: 'force' });
console.log(JSON.stringify(report, null, 2));
