// 데모 가설 — AI 없이 "이 사건은 ○○과 관련이 있을 수 있다"는 주장 하나를 기승전결로 풂
// 기: 첫 보도 / 승: 기사 속 원인·배경 문장(~때문에, amid …) / 전: 다른 설명의 여지 / 결: 기사 속 전망 문장(~할 예정, will …)
// 주장과, 기사에서 근거를 못 찾은 칸은 사건 종류별 일반적인 흐름으로 채움
// 확신도: 같은 내용을 여러 나라 여러 매체가 전하면 '중간', 아니면 '낮음'. 규칙으로 고른 추정이라 '높음'은 주지 않음
import { outletName } from '../sources.js';
import { cleanSummary } from '../textclean.js';

const CAUSE = {
  ko: /(때문|이후|뒤에|에 따라|에 따른|속에|가운데|에 대응|에 반발|여파|으로 인해|로 인해|계기|발단)/,
  en: /\b(after|following|amid|due to|because|in response to|sparked by|triggered by|prompted by|blamed on|in the wake of)\b/i,
  ja: /(ため|を受け|受けて|をめぐ|背景|影響で|きっかけ|に反発|に対応|発端)/,
  zh: /(因为|由于|之后|随着|回应|背景|导致|引发|此前|起因)/,
  fr: /(?:^|[\s'’(])(après|suite à|à la suite|en raison|à cause|face à|en réponse|sur fond de|provoqué|déclenché)/i,
};
const OUTLOOK = {
  ko: /(예정|전망(?:이다|입니다|된다|됩니다|이에요)|할 계획|할 방침|(?:할|될|갈|올) 것으로|(?:할|될) 것이|가능성이 (?:있다|있습니다|있어|있으며|있고|크|높|제기)|예상(?:된다|됩니다|돼|되고)|앞두고|검토(?:하고|중|할|에 들어)|추진할|할 수도|하기로)/,
  en: /\b(will|expected to|plans? to|planning to|set to|could|likely to|is due to|scheduled|vow(?:s|ed)? to|aims? to|would)\b/i,
  ja: /(予定|見通し|方針|する計画|可能性があ(?!るとは)|見込み|検討して|検討中|する考え|目指す|へ向け)/,
  zh: /(将(?!近|军|领)|预计|计划(?:在|于|将|明|下)|可能会|有望|准备|拟|打算|即将)/,
  fr: /(?:^|[\s'’(])(devrai(?:t|ent)|prévoi|pourrai(?:t|ent)|va |vont |doi(?:t|vent) |projette|envisag|prochain)/i,
};
// 앞일처럼 보이지만 아닌 것: 'could have been'처럼 지난 일을 추측하는 말
const NOT_OUTLOOK = /\b(?:could|would|may|might|will) have\b|pourrait avoir été/i;
// 원인을 뚜렷하게 말하는 표현 (이것부터 찾고, 없을 때만 '이후·after' 같은 약한 표현을 씀)
const STRONG_CAUSE = {
  ko: /(때문|여파|으로 인해|로 인해|에 반발|에 대응|계기|발단|속에|가운데)/,
  en: /\b(due to|because|amid|in response to|sparked by|triggered by|prompted by|blamed on|in the wake of|over (?:concerns?|fears?|allegations?))\b/i,
  ja: /(ため|を受け|受けて|背景|影響で|きっかけ|に反発|に対応|発端)/,
  zh: /(因为|由于|回应|背景|导致|引发|起因)/,
  fr: /(?:^|[\s'’(])(en raison|à cause|face à|en réponse|sur fond de|provoqué|déclenché)/i,
};

const T = {
  ko: {
    setup: (t) => `이 사건의 출발점은 이 보도예요. “${t}”`,
    develop: (q, b) => `${b}에 따르면 “${q}” 보도에서 원인·배경으로 꼽힌 대목이 이 가설과 이어져요.`,
    noDevelop: '아직 보도에서 원인이나 배경을 직접 꼽은 문장은 찾지 못했어요. 그래서 같은 종류 사건의 일반적인 흐름에 기대고 있어요.',
    turn: '다만 이건 같은 종류 사건에서 흔히 보이는 흐름에서 끌어낸 추정이에요. 우발적인 일이거나, 이번 사건만의 다른 사정 때문일 수도 있어요.',
    conclusionEv: (q, b) => `가설이 맞다면 다음 흐름이 이어질 거예요. ${b} 보도에 따르면 “${q}” 이게 실제로 일어나는지가 확인해 줄 신호예요.`,
    conclusionGen: (g) => `가설이 맞다면, ${g} 이런 흐름이 실제로 나타나는지 지켜보면 돼요.`,
    basis: (o, n, nc) => (n > 1 ? `${o} 등 ${nc}개국 ${n}개 매체` : o),
  },
  en: {
    setup: (t) => `The starting point is this report: “${t}”`,
    develop: (q, b) => `According to ${b}, “${q}” The background named in the coverage links to this hypothesis.`,
    noDevelop: 'No sentence in the coverage names a cause or background yet, so this rests on the usual pattern for events of this kind.',
    turn: 'But this is drawn from the usual pattern for similar events. It could be accidental, or due to circumstances specific to this case.',
    conclusionEv: (q, b) => `If the hypothesis holds, this should follow. ${b} reports: “${q}” Whether it actually happens is the signal to watch.`,
    conclusionGen: (g) => `If the hypothesis holds: ${g} Watch whether this pattern actually appears.`,
    basis: (o, n, nc) => (n > 1 ? `${o} and ${n - 1} other outlet${n > 2 ? 's' : ''} in ${nc} countr${nc > 1 ? 'ies' : 'y'}` : o),
  },
  ja: {
    setup: (t) => `この出来事の出発点はこの報道です。「${t}」`,
    develop: (q, b) => `${b}によると「${q}」報道で原因・背景として挙げられた部分がこの仮説につながります。`,
    noDevelop: 'まだ報道の中に原因や背景を直接挙げた文は見つかっていません。そのため、同じ種類の出来事によくある流れに頼っています。',
    turn: 'ただし、これは同じ種類の出来事によくある流れから導いた推定です。偶発的な出来事だったり、今回ならではの別の事情によるものだったりする可能性もあります。',
    conclusionEv: (q, b) => `仮説が正しければ、次の流れが続くはずです。${b}はこう伝えています。「${q}」これが実際に起きるかどうかが確かめる手がかりです。`,
    conclusionGen: (g) => `仮説が正しければ、${g} こうした流れが実際に現れるか見守りましょう。`,
    basis: (o, n, nc) => (n > 1 ? `${o}など${nc}か国${n}メディア` : o),
  },
  zh: {
    setup: (t) => `此事的起点是这篇报道：“${t}”`,
    develop: (q, b) => `据${b}报道，“${q}”报道中提到的原因或背景与这一假设相关联。`,
    noDevelop: '报道中尚未找到直接指出原因或背景的句子，因此这一假设依据的是同类事件的一般走向。',
    turn: '不过，这是根据同类事件的常见走向得出的推断。也可能是偶发事件，或出于此事特有的其他原因。',
    conclusionEv: (q, b) => `如果假设成立，接下来应会出现这样的发展。${b}报道称：“${q}”这是否真的发生，就是验证的信号。`,
    conclusionGen: (g) => `如果假设成立，${g}可以留意这种走向是否真的出现。`,
    basis: (o, n, nc) => (n > 1 ? `${o}等${nc}个国家${n}家媒体` : o),
  },
  fr: {
    setup: (t) => `Le point de départ est cet article : « ${t} »`,
    develop: (q, b) => `Selon ${b}, « ${q} » Le contexte cité dans la couverture rejoint cette hypothèse.`,
    noDevelop: 'Aucune phrase de la couverture n’indique encore de cause ou de contexte ; l’hypothèse repose donc sur l’évolution habituelle de ce type d’événement.',
    turn: 'Mais cela découle de l’évolution habituelle d’événements similaires. Il peut s’agir d’un hasard, ou de circonstances propres à cette affaire.',
    conclusionEv: (q, b) => `Si l’hypothèse se vérifie, la suite devrait être celle-ci. ${b} rapporte : « ${q} » Que cela se produise ou non sera le signal à suivre.`,
    conclusionGen: (g) => `Si l’hypothèse se vérifie : ${g} Reste à voir si cette évolution se produit.`,
    basis: (o, n, nc) => (n > 1 ? `${o} et ${n - 1} autre${n > 2 ? 's' : ''} média${n > 2 ? 's' : ''} dans ${nc} pays` : o),
  },
};

// 사건 종류(impact.js의 kind)를 큰 묶음으로 → 묶음마다 일반적인 원인·전망
const FAMILY = {
  war: 'conflict', mideast: 'conflict', ukraine: 'conflict', nkorea: 'conflict',
  violence: 'crime', spy: 'crime',
  rates: 'economy', trade: 'economy', energy: 'economy', markets: 'economy', company: 'economy', chips: 'economy',
  us: 'politics', elections: 'politics', policy: 'politics', korea: 'politics', migration: 'politics', court: 'politics',
  disaster: 'disaster', climate: 'disaster', accident: 'disaster', transport: 'disaster', health: 'disaster',
  ai: 'tech', cyber: 'tech', space: 'tech',
  arts: 'culture', sports: 'culture', religion: 'culture',
};
// [원인, 전망] × [ko, en, ja, zh, fr]
const GENERAL = {
  conflict: [
    ['오래 쌓인 영토·안보 갈등이나 상대의 최근 행동에 대한 보복이 겹쳤을 가능성이 있어요.', 'Long-running territorial or security disputes, or retaliation for a recent move, may have combined.', '長年の領土・安全保障をめぐる対立や、相手の最近の行動への報復が重なった可能性があります。', '长期积累的领土或安全矛盾，或对对方近期行动的报复，可能交织在一起。', 'De vieux différends territoriaux ou sécuritaires, ou des représailles à une action récente, ont pu se combiner.'],
    ['이런 사건은 보통 국제 사회의 중재·휴전 요구가 커지거나, 반대로 맞대응이 이어지며 길어지는 경우가 많아요.', 'Events like this usually bring growing calls for mediation and a ceasefire, or drag on through tit-for-tat responses.', 'こうした出来事は、国際社会の仲介・停戦要求が強まるか、逆に応酬が続いて長引くことが多いです。', '此类事件通常会引发更多国际调停和停火呼声，或因相互报复而拖延。', 'Ce type d’événement entraîne souvent des appels croissants à la médiation et au cessez-le-feu, ou s’enlise dans des représailles.'],
  ],
  crime: [
    ['개인이나 조직의 범행 동기, 또는 수사 과정에서 드러난 정황이 사건의 출발점이었을 가능성이 있어요.', 'The motive of an individual or group, or circumstances uncovered during an investigation, may be where this started.', '個人や組織の犯行動機、あるいは捜査の過程で明らかになった状況が発端だった可能性があります。', '个人或组织的作案动机，或调查过程中发现的情况，可能是事件的起点。', 'Le mobile d’une personne ou d’un groupe, ou des éléments mis au jour par l’enquête, pourraient être à l’origine de l’affaire.'],
    ['보통 수사 결과 발표와 기소·재판 절차가 이어지고, 다른 나라가 얽혀 있으면 외교 문제로 번지기도 해요.', 'Investigation findings and charges or a trial usually follow; when other countries are involved, it can turn into a diplomatic issue.', '通常は捜査結果の発表や起訴・裁判の手続きが続き、他国が絡めば外交問題に発展することもあります。', '通常会公布调查结果并进入起诉、审判程序；若牵涉他国，还可能演变为外交问题。', 'Suivent généralement les conclusions de l’enquête, des poursuites ou un procès ; si d’autres pays sont impliqués, l’affaire peut devenir diplomatique.'],
  ],
  economy: [
    ['물가·금리 흐름, 수요 변화, 각국 정책 같은 경제 여건이 바뀐 게 배경일 가능성이 있어요.', 'A shift in economic conditions such as inflation, interest rates, demand or government policy may be behind it.', '物価・金利の動き、需要の変化、各国の政策といった経済環境の変化が背景にある可能性があります。', '通胀、利率、需求变化或各国政策等经济环境的变化可能是背景。', 'Un changement de conjoncture (inflation, taux, demande ou politiques publiques) pourrait en être à l’origine.'],
    ['보통 시장이 먼저 반응하고, 이어 관련 기업·정부의 대응과 다음 경제 지표 발표가 방향을 정해요.', 'Markets usually react first; then company and government responses and the next economic data set the direction.', '通常は市場が先に反応し、続いて関連企業・政府の対応や次の経済指標が方向を決めます。', '通常市场会率先反应，随后相关企业和政府的应对以及下一批经济数据将决定走向。', 'Les marchés réagissent généralement d’abord ; puis les réponses des entreprises et des gouvernements et les prochains indicateurs fixent la direction.'],
  ],
  politics: [
    ['정치 일정(선거·법안 처리)이나 지지층·여론의 압박이 결정을 앞당겼을 가능성이 있어요.', 'The political calendar (elections, legislation) or pressure from supporters and public opinion may have pushed this forward.', '政治日程（選挙・法案審議）や支持層・世論の圧力が決定を早めた可能性があります。', '政治日程（选举、立法）或支持者与舆论的压力可能促成了这一决定。', 'Le calendrier politique (élections, textes de loi) ou la pression des partisans et de l’opinion ont pu précipiter les choses.'],
    ['보통 반대 진영의 반발과 법적 다툼, 여론조사 변화가 뒤따르고, 다음 표결·발표가 분기점이 돼요.', 'Opposition pushback, legal challenges and shifts in polling usually follow; the next vote or announcement is the turning point.', '通常は反対勢力の反発や法廷闘争、世論調査の変化が続き、次の採決・発表が分岐点になります。', '通常会出现反对阵营的反弹、法律纠纷和民调变化，下一次表决或公告将是转折点。', 'Suivent souvent l’opposition, des recours en justice et des sondages en mouvement ; le prochain vote ou annonce sera décisif.'],
  ],
  disaster: [
    ['자연 조건(기상·지형)에 시설 관리나 대비 부족 같은 사람의 요인이 겹쳤을 가능성이 있어요.', 'Natural conditions (weather, terrain) may have combined with human factors such as poor maintenance or preparedness.', '自然条件（気象・地形）に、施設管理や備えの不足といった人的要因が重なった可能性があります。', '自然条件（天气、地形）可能与设施维护不善、准备不足等人为因素叠加。', 'Des conditions naturelles (météo, relief) ont pu se combiner à des facteurs humains comme un mauvais entretien ou un manque de préparation.'],
    ['보통 피해 규모가 며칠에 걸쳐 늘어나며 집계되고, 이어서 원인 조사와 책임 논의, 재발 방지 대책이 나와요.', 'The toll is usually revised upward over several days, followed by investigations, debate over responsibility and prevention measures.', '通常は被害の規模が数日かけて増えながら集計され、続いて原因調査や責任論、再発防止策が出てきます。', '伤亡和损失通常会在数天内不断上调，随后是原因调查、追责讨论和防范措施。', 'Le bilan est souvent revu à la hausse sur plusieurs jours, puis viennent les enquêtes, le débat sur les responsabilités et les mesures de prévention.'],
  ],
  tech: [
    ['기술 경쟁과 규제 환경의 변화, 또는 보안 허점이 드러난 게 배경일 가능성이 있어요.', 'Tech competition, a changing regulatory environment or an exposed security gap may be behind it.', '技術競争や規制環境の変化、あるいはセキュリティの穴が明らかになったことが背景にある可能性があります。', '技术竞争、监管环境变化或暴露出的安全漏洞可能是背景。', 'La concurrence technologique, l’évolution de la réglementation ou une faille de sécurité révélée pourraient en être à l’origine.'],
    ['보통 경쟁사·정부의 후속 대응과 규제 논의가 이어지고, 실제 서비스나 일상에 미치는 영향은 몇 주에서 몇 달 뒤에 드러나요.', 'Rivals and governments usually respond and regulation is debated; the real effect on services and daily life shows weeks or months later.', '通常は競合他社・政府の対応や規制論議が続き、実際のサービスや生活への影響は数週間から数か月後に表れます。', '通常竞争对手和政府会跟进应对并讨论监管，对服务和日常生活的实际影响要几周到几个月后才显现。', 'Concurrents et gouvernements réagissent généralement et la régulation est débattue ; l’effet réel apparaît des semaines ou des mois plus tard.'],
  ],
  culture: [
    ['개인·단체의 결정이나 대회·행사 일정이 계기가 됐을 가능성이 있어요.', 'A decision by a person or group, or the timing of a competition or event, may have been the trigger.', '個人・団体の決定や、大会・行事の日程がきっかけになった可能性があります。', '个人或团体的决定，或赛事、活动的日程可能是起因。', 'Une décision individuelle ou collective, ou le calendrier d’une compétition ou d’un événement, a pu servir de déclencheur.'],
    ['보통 당사자의 입장 발표와 팬·여론의 반응이 이어지고, 관심은 다음 일정에 맞춰 다시 커지거나 잦아들어요.', 'Statements from those involved and reactions from fans and the public usually follow; interest rises or fades with the next fixture.', '通常は当事者の声明とファン・世論の反応が続き、関心は次の日程に合わせて高まったり落ち着いたりします。', '通常当事人会发表声明，粉丝与舆论随之反应，关注度会随下一个日程起伏。', 'Suivent souvent les déclarations des intéressés et les réactions du public ; l’intérêt varie selon le prochain rendez-vous.'],
  ],
};
const IDX = { ko: 0, en: 1, ja: 2, zh: 3, fr: 4 };

// 원인처럼 보이지만 아닌 것: 시간 표현('9개월 만에', 'after 9 months')과 결과('이로 인해', 'As a result')
const NOT_CAUSE = {
  ko: /(^이로 인해|^이 때문에|^이에 따라|^그 결과|^(?:이|그|이번)\s?\S{0,6}(?:으로|로) 인해|그로 인한|\d+\s*(?:년|개월|주|일|시간)\s*(?:만|이후|뒤)|\d+월\s*이후)/,
  en: /(^(?:this|that|as a result|which)\b|\b(?:after|following)\s+(?:\d+|a|an|one|two|three|four|five|six|several|many|nearly|almost|more than)\s+(?:\w+\s+)?(?:hours?|days?|weeks?|months?|years?|decades?)\b)/i,
  ja: /(^これにより|^このため|^その結果|\d+\s*(?:年|か月|カ月|週間|日|時間)ぶり)/,
  zh: /(^因此|^这导致|^结果|\d+\s*(?:年|个月|周|天|小时)(?:来|后|以来))/,
  fr: /(^(?:cela|ceci|ce qui|de ce fait|en conséquence)|après\s+(?:\d+|un|une|deux|trois|plusieurs|près de)\s+(?:\S+\s+)?(?:heures?|jours?|semaines?|mois|ans|années))/i,
};
const splitSentences = (t) => String(t).split(/(?<=[.!?。！？])\s+|(?<=[。！？])/).map((s) => s.trim()).filter(Boolean);
const CJK = (lang) => lang === 'ja' || lang === 'zh';
function grams(s, lang) {
  const t = s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  if (CJK(lang)) {
    const c = t.replace(/\s+/g, '');
    const g = new Set();
    for (let i = 0; i < c.length - 1; i++) g.add(c.slice(i, i + 2));
    return g;
  }
  return new Set(t.split(' ').filter((w) => w.length > 2));
}
const sim = (a, b) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / Math.min(a.size, b.size);
};
// 근거로 쓸 만한 문장: 적당한 길이, 잘리지 않음, 질문 아님
// 요약 문장은 문장 부호로 끝나야 하고, 영어·프랑스어는 대문자나 따옴표로 시작해야 함 ('Nov. 10, with …' 같은 조각 걸러냄)
function usable(s, lang, isTitle) {
  if (s.length < 25 || s.length > 220) return false;
  if (/(?:…|\.\.\.?)$/.test(s) || /[?？]$/.test(s)) return false;
  if (!isTitle && !/[.!。！"”’」』)]$/.test(s)) return false;
  if ((lang === 'en' || lang === 'fr') && !/^[\p{Lu}"“«‘'(]/u.test(s)) return false;
  return true;
}
const overlap = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n; };

// 근거 문장 고르기: 같은 내용을 전한 매체가 가장 많은 문장 → 같으면 최근 것
// '같은 내용'은 사건 전체에 흔한 낱말(나라·인물 이름 등)을 뺀 나머지로 비교 → 주제만 같다고 지지로 세지 않음
function pickEvidence(cands, avoid) {
  let best = null;
  for (const c of cands) {
    if (avoid && sim(c.g, avoid) > 0.5) continue;
    const backers = cands.filter((x) => x === c || (overlap(c.d, x.d) >= 2 && sim(c.d, x.d) >= 0.4));
    const outlets = new Set(backers.map((x) => x.source_id));
    const countries = new Set(backers.map((x) => x.country));
    const score = outlets.size * 10 + countries.size * 5 + c.at / 1e12;
    if (!best || score > best.score) best = { ...c, outlets, countries, score };
  }
  return best;
}

// 데모 가설 하나: 주장(claim) + 기(출발점)·승(연결고리)·전(반전)·결(결론)
// 주장은 사건 종류별 일반적인 원인, 승·결은 기사에서 찾은 원인·전망 문장으로 채움
export function buildHypotheses(articles, lang, kind) {
  const L = T[lang] || T.en;
  const done = (a) => lang === 'en' || a.t_title != null;
  const sents = [];
  for (const a of articles) {
    if (!done(a)) continue; // 번역 안 된 원문은 쓰지 않음
    const title = a.t_title || a.title;
    const summary = cleanSummary((lang === 'en' ? a.summary : a.t_summary) || '');
    splitSentences(summary).concat([title]).forEach((s, i, arr) => {
      if (!usable(s, lang, i === arr.length - 1)) return;
      sents.push({ s, g: grams(s, lang), source_id: a.source_id, country: a.country, at: new Date(a.published_at).getTime() || 0 });
    });
  }
  // 사건 문장의 30% 넘게 나오는 낱말은 '주제어'로 보고 같은 내용 비교에서 뺌
  const df = new Map();
  for (const x of sents) for (const w of x.g) df.set(w, (df.get(w) || 0) + 1);
  const common = Math.max(3, sents.length * 0.3);
  for (const x of sents) x.d = new Set([...x.g].filter((w) => df.get(w) <= common));

  const quote = (ev) => ev.s.replace(/[“”"「」«»]/g, '').replace(/[.。]$/, CJK(lang) ? '' : '.');
  const who = (ev) => L.basis(outletName(ev.source_id, lang), ev.outlets.size, ev.countries.size);
  const causeCands = sents.filter((x) => CAUSE[lang]?.test(x.s) && !NOT_CAUSE[lang]?.test(x.s));
  const strong = causeCands.filter((x) => STRONG_CAUSE[lang]?.test(x.s));
  const cause = pickEvidence(strong.length ? strong : causeCands);
  const outlook = pickEvidence(sents.filter((x) => OUTLOOK[lang]?.test(x.s) && !NOT_OUTLOOK.test(x.s)), cause?.g);
  const fam = GENERAL[FAMILY[kind]] || GENERAL.politics;
  const i = IDX[lang] ?? 1;
  const first = articles.find(done);
  const sources = [...new Set([cause?.source_id, outlook?.source_id].filter(Boolean))];
  return [{
    claim: fam[0][i],
    setup: first ? L.setup(first.t_title || first.title) : '',
    develop: cause ? L.develop(quote(cause), who(cause)) : L.noDevelop,
    turn: L.turn,
    conclusion: outlook ? L.conclusionEv(quote(outlook), who(outlook)) : L.conclusionGen(fam[1][i]),
    sources,
    confidence: cause && cause.outlets.size >= 3 && cause.countries.size >= 2 ? '중간' : '낮음',
  }];
}
