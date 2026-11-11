// 데모 분석기 — API 키가 없을 때 사용.
// 실제 수집·번역한 기사를 규칙에 따라 정리할 뿐 'AI 해석'은 하지 않는다.
// (가설·전망은 만들지 않고, 화면에 '데모' 표시가 붙는다)
import { countryName } from '../sources.js';

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
    why: (c) => `${c} 등 여러 나라 언론이 함께 다룬 사건이에요.`,
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
    why: (c) => `An event covered by media in several countries, including ${c}.`,
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
    why: (c) => `${c}など、複数の国のメディアが報じた出来事です。`,
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
    why: (c) => `这是${c}等多个国家媒体共同关注的事件。`,
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
    why: (c) => `Un événement couvert par des médias de plusieurs pays, dont ${c}.`,
    watch: 'Activez l’analyse IA pour savoir quoi surveiller ensuite.',
    join: ', ',
    headline: (n) => `Les ${n} sujets les plus couverts dans le monde aujourd’hui`,
    intro: 'Des événements couverts par des médias de plusieurs pays, classés selon le nombre de pays.',
    itemWhy: (nc, no) => `Couvert par ${no} médias dans ${nc} pays.`,
    closing: 'Ouvrez une carte pour comparer la couverture de chaque pays.',
  },
};

// ── '나한테 무슨 상관?' (데모: 영어 원문에 나온 낱말로 주제를 짐작) ──
const TOPICS = [
  ['energy', /\b(oil|crude|opec|lng|energy|fuel|petrol|gasoline|electricity|power grid)\b/gi],
  ['markets', /\b(stocks?|shares|markets?|inflation|interest rates?|central bank|currenc(?:y|ies)|dollar|yen|yuan|bonds?|recession|economy|economic)\b/gi],
  ['trade', /\b(tariffs?|trade|exports?|imports?|supply chains?|sanctions?|shipping)\b/gi],
  ['conflict', /\b(war|missiles?|troops|military|army|drones?|air ?strikes?|invasion|ceasefire|shelling|nuclear|weapons?)\b/gi],
  ['travel', /\b(flights?|airports?|airlines?|aviation|visas?|tourism|tourists?|travel)\b/gi],
  ['disaster', /\b(earthquakes?|floods?|flooding|storms?|hurricanes?|typhoons?|cyclones?|wildfires?|drought|heatwaves?|climate|volcan\w*|tsunami)\b/gi],
  ['health', /\b(virus|outbreaks?|vaccines?|diseases?|pandemic|epidemic|health|hospitals?|cholera|measles)\b/gi],
  ['tech', /\b(ai|artificial intelligence|chips?|semiconductors?|technology|tech|cyber\w*|hack\w*|smartphones?)\b/gi],
  ['safety', /\b(shootings?|terror\w*|bomb\w*|gunman|stabbing|attackers?|police)\b/gi],
  ['politics', /\b(elections?|vote|voters|president|parliament|government|ministers?|coalition|summit|diplomat\w*|talks)\b/gi],
];
const IMPACT = {
  ko: {
    energy: '기름값·전기·가스 요금', markets: '환율·금리·주식 투자', trade: '수입품 가격과 수출 기업', conflict: '국제 안보와 그 지역 여행·항공편',
    travel: '해외여행과 항공편', disaster: '그 지역 여행과 농산물·식료품 가격', health: '건강과 해외여행 때 주의할 점',
    tech: '내가 쓰는 기기·서비스와 관련 산업', safety: '그 나라에 살거나 여행하는 사람들의 안전', politics: '나라 사이의 외교·무역 관계',
    say: (x, y) => (y ? `${x}, 그리고 ${y}에 영향이 있을 수 있어요.` : `${x}에 영향이 있을 수 있어요.`),
    none: '당장 일상에 주는 직접 영향은 크지 않아 보여요. 다만 세계 흐름을 이해하는 데 도움이 되는 소식이에요.',
  },
  en: {
    energy: 'fuel prices and energy bills', markets: 'exchange rates, interest rates and investments', trade: 'the price of imported goods and exporting businesses',
    conflict: 'global security and travel or flights in the region', travel: 'overseas travel and flights', disaster: 'travel to the area and food prices',
    health: 'your health and precautions when travelling', tech: 'the devices and services you use, and related industries',
    safety: 'the safety of people living in or visiting the country', politics: 'diplomatic and trade ties between countries',
    say: (x, y) => (y ? `This could affect ${x}, as well as ${y}.` : `This could affect ${x}.`),
    none: 'It may not affect daily life directly for now, but it helps to understand where the world is heading.',
  },
  ja: {
    energy: 'ガソリン代や電気・ガス料金', markets: '為替・金利・株式投資', trade: '輸入品の価格や輸出企業', conflict: '国際的な安全保障や、その地域への旅行・航空便',
    travel: '海外旅行や航空便', disaster: 'その地域への旅行や農産物・食料品の価格', health: '健康や海外旅行時の注意点',
    tech: '使っている機器・サービスや関連産業', safety: 'その国に住む人や旅行する人の安全', politics: '国と国との外交・貿易関係',
    say: (x, y) => (y ? `${x}、そして${y}に影響が出るかもしれません。` : `${x}に影響が出るかもしれません。`),
    none: '今すぐ日常生活に直接影響することはなさそうです。ただ、世界の流れを理解するのに役立つニュースです。',
  },
  zh: {
    energy: '油价和水电燃气费用', markets: '汇率、利率和投资', trade: '进口商品价格和出口企业', conflict: '国际安全局势以及该地区的出行和航班',
    travel: '出境旅行和航班', disaster: '前往该地区的出行以及农产品和食品价格', health: '健康状况和出境旅行时的注意事项',
    tech: '你使用的设备、服务及相关产业', safety: '在当地生活或旅行的人的安全', politics: '国与国之间的外交和贸易关系',
    say: (x, y) => (y ? `这可能会影响${x}，以及${y}。` : `这可能会影响${x}。`),
    none: '目前对日常生活似乎没有直接影响，但有助于了解世界的走向。',
  },
  fr: {
    energy: 'les prix des carburants et les factures d’énergie', markets: 'les taux de change, les taux d’intérêt et les placements',
    trade: 'le prix des produits importés et les entreprises exportatrices', conflict: 'la sécurité internationale et les voyages ou vols dans la région',
    travel: 'les voyages à l’étranger et les vols', disaster: 'les voyages dans la région et les prix alimentaires',
    health: 'votre santé et les précautions en voyage', tech: 'les appareils et services que vous utilisez, et les secteurs liés',
    safety: 'la sécurité des habitants et des visiteurs du pays', politics: 'les relations diplomatiques et commerciales entre pays',
    say: (x, y) => (y ? `Cela pourrait toucher ${x}, ainsi que ${y}.` : `Cela pourrait toucher ${x}.`),
    none: 'Pas d’effet direct sur le quotidien pour l’instant, mais une information utile pour comprendre l’évolution du monde.',
  },
};
function guessImpact(articles, lang) {
  const text = articles.map((a) => `${a.title} ${a.summary || ''}`).join(' ');
  const scored = TOPICS.map(([k, re]) => [k, (text.match(re) || []).length]).filter(([, n]) => n >= 2).sort((x, y) => y[1] - x[1]);
  const L = IMPACT[lang];
  if (!scored.length) return L.none;
  return L.say(L[scored[0][0]], scored[1] ? L[scored[1][0]] : null);
}

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

// articles: articlesForEvent(id, lang) 결과 (t_title/t_summary = 번역문)
export function analyzeEvent(event, articles, lang = 'ko') {
  const L = T[lang];
  const title = (a) => a.t_title || a.title;
  const summary = (a) => (a.t_summary ?? a.summary) || '';
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
  const facts = (factSrc.length ? factSrc : firsts.filter((a) => summary(a))).slice(0, 5);
  const stances = guessStances(articles, shown.map((a) => a.source_id));

  return {
    title: title(rep),
    one_line: firstSentence(summary(latest) || title(latest)),
    where: null, // 데모: 화면에서 지역 이름으로 대신 보여 줌
    impact: guessImpact(articles, lang),
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
      what_happened: firstSentence(summary(latest) || title(latest), 400),
      why_it_matters: L.why(countries.slice(0, 6).join(L.join)),
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
