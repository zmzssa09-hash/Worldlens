// 수집 → 사건 묶기 → 번역(기준 언어) → 분석 → 브리핑 → 다른 언어로 번역·현지화
// 동시에 두 번 돌지 않도록 잠금. 단계가 끝날 때마다 'update' 이벤트를 내보내
// 접속 중인 브라우저가 새로고침 없이 바로 화면을 바꿀 수 있게 함 (server.js의 /api/stream)
import { EventEmitter } from 'node:events';
import { collectAll } from './collector.js';
import { clusterRecent } from './clusterer.js';
import { translateArticles } from './translator.js';
import {
  analyzePending, buildBriefing, hasBriefingToday, localizeAnalyses, localizeBriefing, OTHER_LANGS, modeInfo,
} from './analyzer/index.js';
import { BASE_LANG } from './sources.js';
import { setMeta, pruneOld } from './db.js';

export const updates = new EventEmitter();
updates.setMaxListeners(1000); // 접속자마다 하나씩 붙음

let running = null;
let lastPendingLog = 0;
let phase = null; // 'main' = 수집·분석 중, 'localize' = 다른 언어 번역 중

export function isRunning() {
  return !!running;
}
export function currentPhase() {
  return phase;
}

export function refresh({ analyze = true, briefing = 'if-missing' } = {}) {
  if (running) return running;
  running = (async () => {
    const started = Date.now();
    phase = 'main';
    // 1단계: 기준 언어로 먼저 완성 → 화면이 빨리 채워짐
    const collect = await collectAll();
    const cluster = clusterRecent(); // 사건 묶기는 영어 원문으로 → 번역 전에 해도 됨
    const translated = [await translateArticles(BASE_LANG)];
    const analysis = analyze ? await analyzePending() : null;
    let briefed = false;
    // 데모 브리핑은 비용이 없으니 새 번역이 들어오면 다시 만듦 (영어 제목이 남지 않게)
    const demoRetitle = modeInfo().mode !== 'ai' && translated[0].translated > 0;
    if (briefing === 'force' || demoRetitle || (briefing === 'if-missing' && !hasBriefingToday())) briefed = !!(await buildBriefing());
    setMeta('last_refresh', new Date().toISOString());
    const changed = collect.added > 0 || (analysis?.done ?? 0) > 0 || briefed;
    updates.emit('update', { stage: 'main', lang: BASE_LANG, changed, added: collect.added, analyzed: analysis?.done ?? 0 });

    // 2단계: 나머지 언어 (기사 번역 → 분석·브리핑 현지화)
    phase = 'localize';
    const localized = [];
    for (const lang of OTHER_LANGS) {
      const t = await translateArticles(lang);
      const l = await localizeAnalyses(lang);
      const b = await localizeBriefing(lang);
      translated.push(t);
      localized.push(l);
      updates.emit('update', { stage: 'lang', lang, changed: changed || t.translated > 0 || l.done > 0 || b, added: collect.added });
    }
    setMeta('last_localize', new Date().toISOString());
    const pruned = pruneOld(); // 3주 넘은 데이터 정리
    if (pruned.articles) console.log(`[정리] 3주 넘은 기사 ${pruned.articles}건, 사건 ${pruned.events}개 지움`);

    const report = { collect, translated, cluster, analysis, localized, seconds: Math.round((Date.now() - started) / 1000) };
    // 5분마다 돌기 때문에, 바뀐 게 있을 때만 기록
    if (changed || translated.some((t) => t.translated > 0)) {
      const tr = translated.map((t) => `${t.lang} ${t.translated}`).join(', ');
      console.log(`[갱신] 새 기사 ${collect.added}건, 번역(${tr}), 새 사건 ${cluster.created}개, 분석 ${analysis?.done ?? 0}건 (${report.seconds}초)`);
    }
    // 번역이 남아 있으면 상태에 기록 (화면·/api/status에서 확인 가능). 로그는 30분에 한 번만
    const pending = Object.fromEntries(translated.filter((t) => t.remaining > 0).map((t) => [t.lang, t.remaining]));
    setMeta('translation_pending', JSON.stringify(pending));
    if (Object.keys(pending).length && Date.now() - lastPendingLog > 30 * 60 * 1000) {
      lastPendingLog = Date.now();
      console.warn(`[번역 남음] ${Object.entries(pending).map(([l, n]) => `${l} ${n}건`).join(', ')} — 다음 갱신 때 이어서`);
    }
    return report;
  })().finally(() => { running = null; phase = null; });
  return running;
}
