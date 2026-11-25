import { outletName, countryName } from '../sources.js';

// AI 분석 원칙 — WorldLens의 '중립성 구조'의 핵심
export const SYSTEM_PROMPT = `당신은 WorldLens의 국제뉴스 분석가입니다. 여러 나라 언론의 기사를 읽고, 뉴스를 일일이 찾아보기 어려운 한국 독자에게 사건을 쉽고 공정하게 설명합니다.

지켜야 할 원칙:
1. 사실과 해석을 분리합니다. "확인된 사실"에는 서로 다른 매체 2곳 이상이 공통으로 보도한 내용만 넣고, 한 곳만 보도한 내용은 "OO에 따르면"처럼 출처를 밝힙니다.
2. 제공된 기사에 없는 내용을 사실처럼 쓰지 않습니다. 배경 설명에 일반 상식을 쓸 때는 단정하지 말고 맥락 수준으로만 씁니다.
3. 어느 한 나라나 진영의 시각을 기본값으로 삼지 않습니다. 각 매체가 무엇을 강조하고 무엇을 덜 다루는지 비교해서 보여 줍니다. 평가하는 말(옳다, 그르다)은 쓰지 않습니다.
4. 국영 매체(state media 표시)는 그 정부의 공식 입장을 반영할 수 있다는 점을 관점 설명에서 자연스럽게 드러냅니다.
5. 가설은 반드시 가설입니다. "이 사건은 ○○과 관련이 있을 수 있다"는 하나의 주장을 세우고, 기승전결이 있는 짧은 이야기로 풉니다. 근거가 된 보도를 밝히고, 가설과 맞지 않는 점도 반드시 함께 씁니다. 확신도는 낮음/중간/높음으로 솔직하게 매기고, 근거가 약하면 낮음을 씁니다. 음모론처럼 근거 없이 연결하지 않습니다.
6. 문장은 짧고 쉬운 한국어로 씁니다. 전문 용어는 처음 나올 때 짧게 풀어 줍니다. 인명·지명은 한국어 표기 뒤에 필요하면 원어를 괄호로 붙입니다.`;

export function eventPrompt(event, articles) {
  const lines = articles.map((a, i) => [
    `[${i + 1}] 매체 id: ${a.source_id} (${outletName(a.source_id, 'ko')}, ${countryName(a.country, 'ko')}${a.state_media ? ', 국영 매체' : ''}) · ${a.published_at.slice(0, 16).replace('T', ' ')} UTC`,
    `제목: ${a.title}`,
    a.summary ? `요약: ${a.summary}` : '',
  ].filter(Boolean).join('\n'));
  return `아래는 같은 사건을 다룬 것으로 묶인 기사 ${articles.length}개입니다 (${new Set(articles.map((a) => a.country)).size}개국 매체).
혹시 이 사건과 관계없는 기사가 섞여 있으면 분석에서 빼고 무시하세요.

${lines.join('\n\n')}

이 사건을 분석해 주세요.`;
}

export function briefingPrompt(events) {
  const lines = events.map((e) => `- [id ${e.id}] ${e.title_local || e.title} (${e.country_count}개국 ${e.article_count}건) — ${e.one_line || ''}`);
  return `오늘 세계에서 많이 보도된 사건 목록입니다.

${lines.join('\n')}

바쁜 독자가 출근길 1분 안에 읽을 수 있는 '오늘의 세계 브리핑'을 만들어 주세요. 가장 중요한 사건 5개 안팎을 고르고, 각 사건이 왜 중요한지 한 문장으로 알려 주세요. event_id는 목록의 id를 그대로 쓰세요.`;
}

// 구조화 출력(JSON Schema) — 응답이 이 형식을 반드시 따르게 함
const str = { type: 'string' };
const strArr = { type: 'array', items: str };
// 나라별 관점: 쟁점(누구의 무엇)에 대해 각 매체가 보이는 태도 — 세 칸으로 나눠 보여 줌
export const STANCES = ['비판적', '중립', '우호적'];
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });

export const EVENT_SCHEMA = obj({
  title: str,
  one_line: str,
  where: str,
  impact: str,
  facts: { type: 'array', items: obj({ text: str, sources: strArr }) },
  stance_target: str,
  perspectives: { type: 'array', items: obj({ source_id: str, view: str, emphasis: str, stance: { type: 'string', enum: STANCES } }) },
  differences: str,
  // 가설: 하나의 주장(claim)을 기(setup)·승(develop)·전(turn)·결(conclusion)으로 풀어냄
  hypotheses: { type: 'array', items: obj({ claim: str, setup: str, develop: str, turn: str, conclusion: str, sources: strArr, confidence: { type: 'string', enum: ['낮음', '중간', '높음'] } }) },
  story: obj({ background: str, what_happened: str, why_it_matters: str, what_to_watch: str }),
  keywords: strArr,
});

export const BRIEFING_SCHEMA = obj({
  headline: str,
  intro: str,
  items: { type: 'array', items: obj({ event_id: { type: 'integer' }, title: str, why: str }) },
  closing: str,
});

// 스키마 각 필드의 의미 (프롬프트로도 안내)
export const FIELD_GUIDE = `필드 안내:
- title: 사건을 한눈에 알 수 있는 한국어 제목 (30자 안팎)
- one_line: 무슨 일인지 한 문장 요약
- where: 사건이 일어난 곳 (나라·도시 이름, 짧게. 예: "폴란드 크라쿠프")
- impact: '나한테 무슨 상관?' — 평범한 사람의 생활(물가·기름값·환율·여행·안전·일자리 등)에 줄 수 있는 영향 1~2문장. 특정 나라 독자를 가정하지 말 것. 영향이 작거나 불확실하면 솔직하게 그렇게 쓰고, 과장하지 말 것
- facts: 확인된 사실 3~6개. sources에는 그 사실을 보도한 매체 id (기사 목록의 '매체 id' 그대로, 예: bbc)
- stance_target: 매체들의 태도를 잴 대상 — 이 사건의 중심에 있는 사람·정부·결정을 구체적으로 (예: "헤르조그 대통령의 정부 구성 결정", "미국의 대중국 반도체 수출 규제"). 재난·사고처럼 평가할 대상이 없으면 빈 문자열
- perspectives: 매체별로 이 사건을 어떻게 다루는지. source_id는 기사 목록의 '매체 id' 그대로, view는 1~2문장(태도를 그렇게 본 근거가 드러나게), emphasis는 그 매체가 특히 강조한 점 한 구절
  · stance: stance_target에 대한 그 매체의 태도 — 비판적(비난·의문 제기) / 중립 / 우호적(지지·긍정 평가)
  · 중요: 사건 자체가 비극이거나 나쁜 소식이라서 어둡게 보도한 것은 '비판적'이 아님. 대상을 평가하는 태도만 봄. 평가 없이 사실만 전했거나 stance_target이 비어 있으면 중립
- differences: 나라·매체 사이에 보도 관점이 어떻게 다른지 2~3문장. 차이가 거의 없으면 그렇다고 씀
- hypotheses: 가설 2~3개. 각 가설은 이 사건을 더 큰 무언가(다른 사건, 오래된 갈등, 누군가의 이해관계, 경제·정치 흐름, 과거의 비슷한 일)와 연결하는 하나의 주장이고, 가설마다 서로 다른 것과 연결할 것
  · claim: 가설 한 문장. "이 사건은 ○○과 관련이 있을 수 있어요" 꼴로 무엇과 연결되는지 구체적으로 (예: "이번 회담은 미국 중간선거를 앞둔 외교 성과 만들기와 관련이 있을 수 있어요")
  · setup(기): 출발점 — 이 사건에서 눈에 띄는 사실 하나. 1~2문장
  · develop(승): 연결고리 — 가설을 뒷받침하는 보도·정황·시점. "OO에 따르면"처럼 출처를 밝힘. 2~3문장
  · turn(전): 반전 — 이 가설과 맞지 않는 점, 또는 다른 설명. 반드시 씀. 1~2문장
  · conclusion(결): 가설이 맞다면 무엇을 뜻하는지, 그리고 맞는지 틀린지 확인해 줄 신호(앞으로 나올 발표·지표·일정). 1~2문장
  · sources: 근거가 된 매체 id (기사 목록의 '매체 id' 그대로)
- story: '3분 만에 이해하기' — background(배경), what_happened(무슨 일이), why_it_matters(왜 중요한가), what_to_watch(앞으로 볼 것). 각 2~4문장
- keywords: 한국어 핵심어 3~6개`;
