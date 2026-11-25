// OpenAI로 사건 분석·브리핑 생성 (OPENAI_API_KEY가 있고 Claude 키가 없을 때 사용)
// claude.js와 같은 프롬프트·같은 JSON 구조(EVENT_SCHEMA)를 써서 화면·번역은 그대로 동작
import OpenAI from 'openai';
import { SYSTEM_PROMPT, FIELD_GUIDE, EVENT_SCHEMA, BRIEFING_SCHEMA, eventPrompt, briefingPrompt } from './prompts.js';

// 모델: WORLDLENS_OPENAI_MODEL로 정할 수 있고, 없으면 계정에서 쓸 수 있는 것 중 앞쪽부터 고름
// (모델 이름이 바뀌거나 계정에 없는 모델이어도 멈추지 않게)
const PREFERRED = ['gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini', 'gpt-5', 'gpt-4.1', 'gpt-4o'];
export let MODEL = process.env.WORLDLENS_OPENAI_MODEL || PREFERRED[0];

let client;
const getClient = () => (client ??= new OpenAI());

let picked = !!process.env.WORLDLENS_OPENAI_MODEL;
async function pickModel() {
  if (picked) return MODEL;
  picked = true;
  try {
    const ids = new Set();
    for await (const m of getClient().models.list()) ids.add(m.id);
    MODEL = PREFERRED.find((id) => ids.has(id)) || MODEL;
  } catch { /* 목록을 못 받으면 기본값으로 시도 */ }
  return MODEL;
}

async function askJson(userContent, schema, name, guide = '') {
  const model = await pickModel();
  const res = await getClient().chat.completions.create({
    model,
    max_completion_tokens: 16000,
    messages: [
      { role: 'system', content: guide ? `${SYSTEM_PROMPT}\n\n${guide}` : SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    // 구조화 출력: 응답이 스키마를 반드시 따르게 함
    response_format: { type: 'json_schema', json_schema: { name, schema, strict: true } },
  });
  const choice = res.choices?.[0];
  if (choice?.message?.refusal) throw new Error(`분석 거절됨 (${choice.message.refusal.slice(0, 80)})`);
  if (choice?.finish_reason === 'length') throw new Error('응답이 너무 길어 중간에 잘렸습니다');
  return JSON.parse(choice?.message?.content || '');
}

export async function analyzeEvent(event, articles) {
  // 기사가 아주 많으면 매체가 고르게 섞이도록 40건까지
  return askJson(eventPrompt(event, pickDiverse(articles, 40)), EVENT_SCHEMA, 'event_analysis', FIELD_GUIDE);
}

export async function makeBriefing(events) {
  return askJson(briefingPrompt(events), BRIEFING_SCHEMA, 'briefing');
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
