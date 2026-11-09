// Claude API로 사건 분석·브리핑 생성 (ANTHROPIC_API_KEY가 있을 때만 사용)
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, FIELD_GUIDE, EVENT_SCHEMA, BRIEFING_SCHEMA, eventPrompt, briefingPrompt } from './prompts.js';

export const MODEL = process.env.WORLDLENS_MODEL || 'claude-opus-5-5';
const EFFORT = process.env.WORLDLENS_EFFORT || 'medium';

let client;
function getClient() {
  client ??= new Anthropic();
  return client;
}

async function askJson(userContent, schema, guide = '') {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // 안전 분류기가 요청을 거절하면 서버가 다른 모델로 자동 재시도
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: guide ? `${SYSTEM_PROMPT}\n\n${guide}` : SYSTEM_PROMPT,
    output_config: {
      effort: EFFORT,
      format: { type: 'json_schema', schema },
    },
    messages: [{ role: 'user', content: userContent }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error(`분석 거절됨 (${response.stop_details?.category ?? '사유 미상'})`);
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('응답이 너무 길어 중간에 잘렸습니다');
  }
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return JSON.parse(text);
}

export async function analyzeEvent(event, articles) {
  // 기사가 아주 많으면 최근 기사 위주로 40건까지 (매체 다양성은 유지)
  const picked = pickDiverse(articles, 40);
  return askJson(eventPrompt(event, picked), EVENT_SCHEMA, FIELD_GUIDE);
}

export async function makeBriefing(events) {
  return askJson(briefingPrompt(events), BRIEFING_SCHEMA);
}

function pickDiverse(articles, max) {
  if (articles.length <= max) return articles;
  const byOutlet = new Map();
  for (const a of [...articles].reverse()) {
    if (!byOutlet.has(a.source_id)) byOutlet.set(a.source_id, []);
    byOutlet.get(a.source_id).push(a);
  }
  const out = [];
  while (out.length < max) {
    let added = false;
    for (const list of byOutlet.values()) {
      if (list.length && out.length < max) { out.push(list.shift()); added = true; }
    }
    if (!added) break;
  }
  return out.sort((a, b) => a.published_at.localeCompare(b.published_at));
}
