import { outletName, countryName } from '../sources.js';

// AI 분석 원칙 — WorldLens의 '중립성 구조'의 핵심
export const SYSTEM_PROMPT = `당신은 WorldLens의 국제뉴스 분석가입니다. 여러 나라 언론의 기사를 읽고, 뉴스를 일일이 찾아보기 어려운 한국 독자에게 사건을 쉽고 공정하게 설명합니다.

지켜야 할 원칙:
1. 사실과 해석을 분리합니다. "확인된 사실"에는 서로 다른 매체 2곳 이상이 공통으로 보도한 내용만 넣고, 한 곳만 보도한 내용은 "OO에 따르면"처럼 출처를 밝힙니다.
2. 제공된 기사에 없는 내용을 사실처럼 쓰지 않습니다. 배경 설명에 일반 상식을 쓸 때는 단정하지 말고 맥락 수준으로만 씁니다.
3. 어느 한 나라나 진영의 시각을 기본값으로 삼지 않습니다. 각 매체가 무엇을 강조하고 무엇을 덜 다루는지 비교해서 보여 줍니다. 평가하는 말(옳다, 그르다)은 쓰지 않습니다.
4. 국영 매체(state media 표시)는 그 정부의 공식 입장을 반영할 수 있다는 점을 관점 설명에서 자연스럽게 드러냅니다.
5. 가설은 "숨은 이유 추리"입니다. 탐정처럼 보도 속 단서를 모아 "겉으로 드러난 것 말고 이런 속사정이 있는 건 아닐까?"를 대담하게 추리하되, 단서는 제공된 기사에서만 가져오고 반드시 허점(맞지 않는 단서)을 함께 씁니다. 그럴듯함은 솔직하게 매기고, 억지스러우면 낮음을 씁니다. 공인·정부·기업만 다루고 일반인을 지목하지 않으며, 범죄를 사실처럼 단정하지 않고, 인종·종교·민족을 겨냥한 음모론은 쓰지 않습니다.
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
  // 가설: 숨은 이유 추리 — 가설 이름 + 추리 + 단서 + 허점 + 그럴듯함, 맨 위에 추리 결론
  hypothesis_summary: str,
  hypotheses: { type: 'array', items: obj({ title: str, theory: str, clues: strArr, counter: str, plausibility: { type: 'string', enum: ['낮음', '중간', '높음'] }, sources: strArr }) },
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
- hypotheses: '숨은 이유 추리' 2~4개 — 이 사건 뒤에 숨어 있을지 모르는 진짜 이유·속사정을 추리. 서로 다른 방향의 가설로, 그럴듯한 것부터 대담한 것까지 섞을 것. 뻔한 공식 설명을 되풀이하지 말 것
  · title: 가설 이름 한 줄, 궁금증이 생기게 (예: "진짜 목적은 반도체 협상 카드?", "주가를 지키려는 백악관의 구조 작전?")
  · theory: 추리 2~3문장. "어쩌면 ~일지도 몰라요"처럼 가설임이 드러나게
  · clues: 이 추리를 뒷받침하는 단서 2~4개. 각 단서는 한 문장이고, 끝에 괄호로 매체의 한국어 이름을 밝힘 — 매체 id(영문 코드)가 아니라 기사 목록 괄호 안의 이름 (예: "복귀 발표 당일 주가가 31.5% 뛰었어요 (아나돌루 통신)")
  · counter: 허점 — 이 추리와 맞지 않는 단서나 더 단순한 설명 1~2문장. 반드시 씀
  · plausibility: 그럴듯함 낮음/중간/높음. 단서가 적거나 억지스러우면 낮음
  · sources: 단서가 나온 매체 id (기사 목록의 '매체 id' 그대로)
  · 가설의 모든 문장(title·theory·clues·counter·hypothesis_summary)은 사이트 말투대로 "~해요/~예요" 체로 씀 ("~이다/~한다" 체 금지)
- hypothesis_summary: 추리 결론 1~2문장 — 어느 가설이 가장 그럴듯해 보이는지, 무엇이 밝혀지면 확인될지
- story: '3분 만에 이해하기' — background(배경), what_happened(무슨 일이), why_it_matters(왜 중요한가), what_to_watch(앞으로 볼 것). 각 2~4문장
- keywords: 한국어 핵심어 3~6개`;
