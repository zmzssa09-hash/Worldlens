// 백업용 DB 사본 만들기: node src/backup-cli.js <출력 경로>
// 저장소가 공개라 GitHub 아티팩트는 누구나 받을 수 있음 → 회원·로그인·결제 정보는 비우고 뉴스 데이터만 남김
import { DatabaseSync } from 'node:sqlite';
import { rmSync } from 'node:fs';

const src = process.env.WORLDLENS_DB || 'data/worldlens.db';
const out = process.argv[2] || 'backup.db';
rmSync(out, { force: true });

const db = new DatabaseSync(src);
db.exec(`VACUUM INTO '${out.replace(/'/g, "''")}'`);
db.close();

const copy = new DatabaseSync(out);
const tables = new Set(copy.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name));
for (const t of ['payments', 'sessions', 'users']) if (tables.has(t)) copy.exec(`DELETE FROM ${t}`);
copy.exec('VACUUM');
copy.close();
console.log(`[백업] ${out} (회원·결제 정보 제외)`);
