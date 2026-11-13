// 데모 분석기 — API 키가 없을 때 사용.
// 실제 수집·번역한 기사를 규칙에 따라 정리할 뿐 'AI 해석'은 하지 않는다.
// (가설·전망은 만들지 않고, 화면에 '데모' 표시가 붙는다)
import { countryName } from '../sources.js';
import { cleanSummary } from '../textclean.js';
import { guessCategory } from '../category.js';
import { guessImpact, whyFor } from './impact.js';

const LOCALE = { ko: 'ko-KR', en: 'en-GB', ja: 'ja-JP', zh: 'zh-CN', fr: 'fr-FR' };

// 언어별 문장 틀
const T = {
  ko: {
    view: (t) => `“${t}” — 이런 제목으로 보도했어요.`,
    noSummary: '요약 없음',
    differences: (c) => `${c} 매체가 이 사건을 다뤘어요. 매체마다 제목에서 무엇을 앞세웠는지 비교해 보세요. (AI 분석을 켜면 관점 차이를 자동으로 비교해 드려요.)`,
    cause: '데모 모드에서는 가설을 만들지 않아요. AI 분석을 켜면 보도 내용을 근거로 "왜 이런 일이 일어났는지" 가설을 보여 드려요.',
    outlook: '데모 모드에서는 전망을 만들지 않아요. AI 분석을 켜면 "앞으로 어떻게 될지" 가설과 확신도를 보여 드려요.',
    background: (d, nc, no, na) => `이 사건은 ${d}부터 보도되기 시작했고, 지금까지 ${nc}개국 ${no}개 매체가 ${na}건을 보도했어요.`,
    why: (c, n) => `${c} 등 ${n}개국 언론이 다뤘어요. ${n >= 10 ? '지금 세계가 가장 주목하는 사건 중 하나예요.' : n >= 5 ? '여러 대륙에서 관심을 받고 있는 사건이에요.' : '관련된 나라들을 중심으로 보도되고 있어요.'}`,
    watch: 'AI 분석을 켜면 앞으로 지켜볼 점을 정리해 드려요.',
    join: ', ',
    headline: (n) => `오늘 세계에서 가장 많이 보도된 ${n}가지`,
    intro: '여러 나라 언론이 함께 다룬 사건을, 보도한 나라가 많은 순서로 골랐어요.',
    itemWhy: (nc, no) => `${nc}개국 ${no}개 매체가 보도했어요.`,
    closing: '카드를 눌러 나라별로 어떻게 보도했는지 비교해 보세요.',
  },
  en: {
    view: (t) => `Headline: “${t}”`,
    noSummary: 'No summary',
    differences: (c) => `Outlets from ${c} covered this event. Compare what each one put first in its headline. (Turn on AI analysis to have the differences compared for you.)`,
    cause: 'Demo mode does not generate hypotheses. With AI analysis on, you will see hypotheses on why this happened, based on the coverage.',
    outlook: 'Demo mode does not generate outlooks. With AI analysis on, you will see what may happen next, with a confidence level.',
    background: (d, nc, no, na) => `Coverage began on ${d}. So far ${no} outlets in ${nc} countries have published ${na} reports.`,
    why: (c, n) => `Covered by media in ${n} countries, including ${c}. ${n >= 10 ? 'One of the stories the world is watching most closely right now.' : n >= 5 ? 'It is drawing attention across several continents.' : 'Coverage is centred on the countries directly involved.'}`,
    watch: 'Turn on AI analysis to see what to watch next.',
    join: ', ',
    headline: (n) => `The ${n} most-covered stories in the world today`,
    intro: 'Events covered by media in several countries, ranked by how many countries reported them.',
    itemWhy: (nc, no) => `Reported by ${no} outlets in ${nc} countries.`,
    closing: 'Open a card to compare how each country covered it.',
  },
  ja: {
    view: (t) => `「${t}」という見出しで報じました。`,
    noSummary: '要約なし',
    differences: (c) => `${c}のメディアがこの出来事を報じました。各メディアが見出しで何を前面に出したか比べてみてください。（AI分析をオンにすると、視点の違いを自動で比較します。）`,
    cause: 'デモモードでは仮説を作成しません。AI分析をオンにすると、報道内容をもとに「なぜ起きたのか」の仮説を表示します。',
    outlook: 'デモモードでは見通しを作成しません。AI分析をオンにすると、「今後どうなるか」の仮説と確信度を表示します。',
    background: (d, nc, no, na) => `この出来事は${d}から報じられ始め、これまでに${nc}か国の${no}メディアが${na}件報じています。`,
    why: (c, n) => `${c}など${n}か国のメディアが報じています。${n >= 10 ? '今、世界で最も注目されている出来事の一つです。' : n >= 5 ? '複数の大陸で関心を集めている出来事です。' : '関係する国を中心に報じられています。'}`,
    watch: 'AI分析をオンにすると、今後注目すべき点をまとめます。',
    join: '、',
    headline: (n) => `今日、世界で最も報じられた${n}つの出来事`,
    intro: '複数の国のメディアが報じた出来事を、報じた国の多い順に選びました。',
    itemWhy: (nc, no) => `${nc}か国の${no}メディアが報道。`,
    closing: 'カードを開いて、国ごとの報じ方を比べてみてください。',
  },
  zh: {
    view: (t) => `以“${t}”为标题进行了报道。`,
    noSummary: '无摘要',
    differences: (c) => `${c}的媒体报道了这一事件。比较一下各家媒体在标题中突出了什么。（开启 AI 分析后，会自动比较各方视角的差异。）`,
    cause: '演示模式不生成假设。开启 AI 分析后，将根据报道内容给出“为什么会发生”的假设。',
    outlook: '演示模式不生成展望。开启 AI 分析后，将给出“接下来会怎样”的假设及可信度。',
    background: (d, nc, no, na) => `该事件自${d}起开始被报道，目前已有${nc}个国家的${no}家媒体发布了${na}篇报道。`,
    why: (c, n) => `${c}等${n}个国家的媒体进行了报道。${n >= 10 ? '这是当前全球最受关注的事件之一。' : n >= 5 ? '该事件正在多个大洲引起关注。' : '报道主要集中在相关国家。'}`,
    watch: '开启 AI 分析后，将整理接下来值得关注的要点。',
    join: '、',
    headline: (n) => `今日全球报道最多的${n}件大事`,
    intro: '按报道国家数量排序，选出多国媒体共同报道的事件。',
    itemWhy: (nc, no) => `${nc}个国家的${no}家媒体进行了报道。`,
    closing: '点开卡片，比较各国如何报道。',
  },
  fr: {
    view: (t) => `Titre : « ${t} »`,
    noSummary: 'Pas de résumé',
    differences: (c) => `Des médias de ces pays ont couvert l’événement : ${c}. Comparez ce que chacun met en avant dans son titre. (Activez l’analyse IA pour une comparaison automatique des points de vue.)`,
    cause: 'Le mode démo ne génère pas d’hypothèses. Avec l’analyse IA, vous verrez des hypothèses sur les causes, fondées sur la couverture.',
    outlook: 'Le mode démo ne génère pas de perspectives. Avec l’analyse IA, vous verrez ce qui pourrait suivre, avec un niveau de confiance.',
    background: (d, nc, no, na) => `La couverture a commencé le ${d}. À ce jour, ${no} médias de ${nc} pays ont publié ${na} articles.`,
    why: (c, n) => `Couvert par des médias de ${n} pays, dont ${c}. ${n >= 10 ? 'C’est l’un des événements les plus suivis dans le monde en ce moment.' : n >= 5 ? 'Il suscite l’attention sur plusieurs continents.' : 'La couverture se concentre sur les pays directement concernés.'}`,
    watch: 'Activez l’analyse IA pour savoir quoi surveiller ensuite.',
    join: ', ',
    headline: (n) => `Les ${n} sujets les plus couverts dans le monde aujourd’hui`,
    intro: 'Des événements couverts par des médias de plusieurs pays, classés selon le nombre de pays.',
    itemWhy: (nc, no) => `Couvert par ${no} médias dans ${nc} pays.`,
    closing: 'Ouvrez une carte pour comparer la couverture de chaque pays.',
  },
};

// ── 나라별 관점: 비판적 / 중립 / 우호적 '추정' (데모 전용) ──
// 영어 원문의 부정·긍정 낱말 수로 각 매체의 논조 점수를 낸 뒤, 같은 사건을 다룬 매체들의 평균과 비교함
// → 사건 자체가 슬픈 소식이라 다들 어둡게 썼으면 모두 '중립'. 평균보다 확실히 더 부정적·긍정적인 곳만 나눔
const NEG = /\b(condemn\w*|criticis\w*|criticiz\w*|accus\w*|blam\w*|slam\w*|denounc\w*|reject\w*|outrage\w*|fail\w*|scandal\w*|corrupt\w*|illegal|crackdown|chaos|turmoil|crisis|threat\w*|warn\w*|fears?|risk\w*|clash\w*|tensions?|protest\w*|row|doubt\w*|controvers\w*|backlash|setback|blow)\b/gi;
// (support·back·win처럼 '누가 누구를 지지했다/이겼다'는 사건 설명에 흔한 낱말은 매체의 태도가 아니라서 뺌)
const POS = /\b(welcom\w*|prais\w*|agree\w*|deal|deals|peace\w*|success\w*|boost\w*|breakthrough|progress|hope\w*|cooperat\w*|partnership|historic|landmark|relief|celebrat\w*|recover\w*|improv\w*|stabil\w*|optimis\w*)\b/gi;
function toneScore(outletArticles) {
  const text = outletArticles.map((a) => `${a.title} ${a.summary || ''}`).join(' ');
  return ((text.match(POS) || []).length - (text.match(NEG) || []).length) / outletArticles.length;
}
function guessStances(articles, sourceIds) {
  // 매체가 둘뿐이면 작은 낱말 차이에도 양 끝으로 갈라지므로 비교하지 않음
  if (sourceIds.length < 3) return Object.fromEntries(sourceIds.map((id) => [id, '중립']));
  const score = Object.fromEntries(sourceIds.map((id) => [id, toneScore(articles.filter((a) => a.source_id === id))]));
  const avg = sourceIds.reduce((s, id) => s + score[id], 0) / (sourceIds.length || 1);
  return Object.fromEntries(sourceIds.map((id) => {
    const d = score[id] - avg;
    return [id, d <= -0.75 ? '비판적' : d >= 0.75 ? '우호적' : '중립'];
  }));
}


function firstSentence(text = '', max = 220) {
  const t = String(text).trim();
  // 너무 짧은 조각(약어 등)에서 끊기지 않도록 25자 이상 지난 뒤의 문장 끝만 인정 (。！？ 포함)
  const m = t.match(/^.{25,}?(?:[.!?](?=\s|$)|[。！？])/);
  const s = (m?.[0] || t).trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
// 온전한 문장인지: 문장 부호로 끝나고, 잘리지 않았고, 너무 짧지 않음 (RSS 요약은 중간에 잘려 오는 경우가 많음)
const complete = (s) => s.length >= 25 && !/(?:…|\.\.\.?)$/.test(s) && /[.!?。！？"”’」』)]$/.test(s);

// articles: articlesForEvent(id, lang) 결과 (t_title/t_summary = 번역문)
export function analyzeEvent(event, articles, lang = 'ko') {
  const L = T[lang];
  const title = (a) => a.t_title || a.title;
  // 번역된 요약만 씀 (제목만 먼저 번역된 기사는 요약이 아직 없음 → 영어 요약이 섞이지 않게). 머리·꼬리('WASHINGTON — ' 등)는 걷어냄
  const summary = (a) => cleanSummary((lang === 'en' ? a.summary : a.t_summary) || '');
  // 번역이 끝난 기사에서 문장을 가져옴 (가장 최근 기사는 아직 번역 전일 때가 많아 영어가 그대로 보이던 문제)
  const done = (a) => lang === 'en' || a.t_title != null;
  const byOutlet = new Map();
  for (const a of articles) {
    const cur = byOutlet.get(a.source_id);
    if (!cur || (!done(cur) && done(a))) byOutlet.set(a.source_id, a); // 매체마다 첫 기사, 단 번역된 기사를 우선
  }
  const firsts = [...byOutlet.values()];
  const latest = [...articles].reverse().find((a) => done(a) && summary(a)) || articles[articles.length - 1];
  const rep = articles.find((a) => a.id === event.rep_article_id) || latest;
  const countries = [...new Set(articles.map((a) => countryName(a.country, lang)))];
  const start = new Date(articles[0].published_at).toLocaleDateString(LOCALE[lang], { month: 'long', day: 'numeric' });
  // 관점 카드 8개·확인된 사실 5개: 번역된 매체부터 (번역된 게 하나도 없을 때만 원문)
  const translatedFirst = [...firsts.filter(done), ...firsts.filter((a) => !done(a))];
  const shown = translatedFirst.slice(0, 8);
  const factSrc = firsts.filter((a) => done(a) && summary(a));
  const factPool = factSrc.length ? factSrc : firsts.filter((a) => summary(a));
  // 확인된 사실: 온전한 문장을 먼저, 모자라면 잘린 문장으로 채움
  const facts = [...factPool.filter((a) => complete(firstSentence(summary(a)))), ...factPool.filter((a) => !complete(firstSentence(summary(a))))].slice(0, 5);
  // 무엇이(한 줄 요약)·무슨 일이: 번역된 최신 기사부터 온전한 문장을 찾음
  // 고르는 순서: 번역된 최신 기사의 온전한 문장 → (가장 먼저 번역되는) 사건 대표 제목 → 비워 둠
  // 잘린 문장이나 번역 안 된 영어는 보여 주지 않음. 비어 있으면 화면이 '한눈에 보기'를 숨기고, 번역이 들어오면 다음 갱신 때 채워짐
  const recent = [...articles].reverse();
  const lineCands = recent.filter((a) => done(a) && summary(a));
  const firstComplete = (cands, max) => {
    for (const a of cands) { const s = firstSentence(summary(a), max); if (complete(s)) return s; }
    return '';
  };
  const pickLine = (max) => firstComplete(lineCands, max) || (done(rep) ? title(rep) : '');
  const oneLine = pickLine(220);
  const whatHappened = pickLine(400);
  const impact = guessImpact(articles, lang, guessCategory(articles));
  const stances = guessStances(articles, shown.map((a) => a.source_id));

  return {
    title: title(rep),
    one_line: oneLine,
    where: null, // 데모: 화면에서 지역 이름으로 대신 보여 줌
    impact: impact.text,
    impact_tip: impact.tip,
    facts: facts.map((a) => ({ text: firstSentence(summary(a)), sources: [a.source_id] })),
    stance_target: '', // 데모: 대상을 알 수 없어 '다른 매체와 비교한 논조'로만 추정
    stance_guess: true, // 화면에 '추정' 표시
    perspectives: shown.map((a) => ({
      source_id: a.source_id,
      view: L.view(title(a)),
      emphasis: firstSentence(summary(a), 120) || L.noSummary,
      stance: stances[a.source_id],
    })),
    differences: L.differences(countries.join(L.join)),
    hypotheses: [
      { kind: '원인', text: L.cause, basis: '', confidence: '낮음' },
      { kind: '전망', text: L.outlook, basis: '', confidence: '낮음' },
    ],
    story: {
      background: L.background(start, countries.length, byOutlet.size, articles.length),
      what_happened: whatHappened,
      // 사건 유형이 왜 큰일인지 한 문장 + 몇 개국이 보도했는지
      why_it_matters: [whyFor(impact.kind, lang), L.why(countries.slice(0, 4).join(L.join), countries.length)].filter(Boolean).join(' '),
      what_to_watch: L.watch,
    },
    keywords: [],
  };
}

// events: { id, title_local, country_count, outlet_count }
export function makeBriefing(events, lang = 'ko') {
  const L = T[lang];
  const top = events.slice(0, 6);
  return {
    headline: L.headline(top.length),
    intro: L.intro,
    items: top.map((e) => ({ event_id: e.id, title: e.title_local || e.title, why: L.itemWhy(e.country_count, e.outlet_count) })),
    closing: L.closing,
  };
}
