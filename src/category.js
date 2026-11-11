// 사건 주제(카테고리) 나누기: 영어 원문 기사의 제목·요약에 나온 낱말로 점수를 매겨 가장 높은 주제 하나를 고름
// (모든 매체가 영어판이라 영어 낱말만 보면 됨. 제목이 가장 믿을 만해서 제목 낱말은 3점, 요약 낱말은 0.5점)
export const CATEGORIES = ['politics', 'conflict', 'economy', 'tech', 'climate', 'health', 'society', 'culture'];

const RULES = {
  politics: /\b(politic\w*|elections?|elected|vote[sd]?|voters?|voting|ballot\w*|president\w*|prime minister|parliament\w*|congress\w*|senate|lawmakers?|government|ministers?|ministry|coalition|opposition|summit|diplomat\w*|foreign minister|talks|treaty|referendum|campaign\w*|candidates?|party|parties|cabinet|impeach\w*|resign\w*|sanctions?|embass\w*|un general assembly|united nations|envoys?|summon\w*|expel\w*|chief of staff|aides?|white house|administration|boycott\w*|regulat\w*|legislation|bill|law|laws|ban|bans|banned|penalt\w*)\b/gi,
  conflict: /\b(war|wars|warfare|missiles?|troops|soldiers?|military|army|armed|drones?|air ?strikes?|strikes? on|invasion|invad\w*|ceasefire|truce|shelling|bombard\w*|nuclear weapons?|weapons?|militants?|rebels?|insurgen\w*|hostages?|frontline|offensive|airstrikes?|forces|occupied|occupation|settlers?|under fire|opened fire|gunfire|fight(?:ing)? (?:in|for)|nato|defen[cs]e|hamas|hezbollah|houthis?|cyber\w*|hack\w*|spy|spies|espionage|covert|disinformation|propaganda|sabotage|attacks?|attacked|shelled|strikes|struck|irgc|revolutionary guards?|operatives?|plot|(?<!artificial )intelligence|peacekeep\w*|iaea|nonproliferation|nuclear|mercenar\w*|fighters?|security)\b/gi,
  economy: /\b(econom\w*|stocks?|shares|markets?|inflation|interest rates?|central bank|currenc(?:y|ies)|dollar|yen|yuan|bonds?|recession|gdp|growth|tariffs?|trade|exports?|imports?|budget|debt|tax\w*|investors?|investment|banks?|banking|oil prices?|crude|opec|companies|company|firms?|profits?|earnings|jobs|unemployment|wages?|prices|oil|gas|projects?|chips?|semiconductors?|chipmakers?|tech giants?|startups?|layoffs?|ceo|executives?|shareholders?|antitrust|merger|acquisition|ipo)\b/gi,
  // 과학·기술은 '발전' 자체(발견·연구·우주·새 기술 공개)만. AI·칩·해킹 같은 분야 이름만으로는 넣지 않음
  // → 기술 기업·사람의 소송·추문은 사회, 사이버 공격은 분쟁·안보, 기술 규제는 정치, 칩 산업은 경제로
  tech: /\b(scientists?|researchers?|research|study finds|new study|discover\w*|breakthrough\w*|invent\w*|innovation|experiment\w*|prototype|unveil\w*|space|spacecraft|satellites?|rockets?|nasa|esa|astronauts?|lunar|moon|mars|orbit\w*|telescope|space station|quantum|fusion|genome|gene therapy|dna|dinosaurs?|species|robots?|robotics|first-ever|world's first)\b/gi,
  climate: /\b(climate|cop\d+|emissions?|carbon|global warming|earthquakes?|floods?|flooding|storms?|hurricanes?|typhoons?|cyclones?|tornado\w*|wildfires?|bushfires?|drought|heatwaves?|volcan\w*|tsunami|rain|rains|rainstorms?|heavy rain\w*|submerged|weather|landslides?|environment\w*|pollution|deforestation|biodiversity|renewable|wildlife)\b/gi,
  health: /\b(health|virus|viral|outbreaks?|vaccin\w*|diseases?|pandemic|epidemic|hospitals?|doctors?|patients?|medical|medicine|drugs?|cholera|measles|malaria|ebola|mpox|covid|cancer|world health organization)\b/gi,
  society: /\b(police|arrest\w*|newspapers?|journalists?|press freedom|factory|workers|blast|explosion|sued|sues|lawsuits?|affair|scandal\w*|fraud|charged|probe|investigation|court|judge|trial|sentenced|prison|crime|criminal|shootings?|gunman|stabbing|murder\w*|terror\w*|protests?|protesters?|rally|strike action|migrants?|migration|refugees?|asylum|immigra\w*|education|schools?|students?|universit(?:y|ies)|campus|fraternit(?:y|ies)|accident|(?:car|bus|train|plane|road|motorway|highway|helicopter) crash|crash(?:ed)? into|blaze|rescu\w*|missing|sinks?|sank|collision|derail\w*|pope|religio\w*|church|rights|women|children|poverty|housing)\b/gi,
  culture: /\b(football|soccer|olympic\w*|world cup|tournament|championship|match|cricket|tennis|atp|wta|masters|grand slam|athletes?|coach|league|film|movie|cinema|music|singer|concert|festival|art|artists?|museum|book|novel|celebrity|fashion|k-pop|royal|grand prix|formula (?:one|1)|f1|race|olympics|heritage|premier league|goals?|draw|striker|manchester|man united)\b/gi,
};

// 주제별 가중치 (지금은 모두 1)
const WEIGHT = {};

const count = (text, re) => (text.match(re) || []).length;

// articles: [{ title, summary }] (원문). 낱말이 하나도 안 걸리면 'other'
export function guessCategory(articles) {
  const score = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const a of articles) {
    const t = a.title || '', s = a.summary || '';
    for (const c of CATEGORIES) score[c] += (count(t, RULES[c]) * 3 + count(s, RULES[c]) * 0.5) * (WEIGHT[c] || 1);
  }
  const [best, n] = Object.entries(score).sort((x, y) => y[1] - x[1])[0];
  return n >= 2 ? best : 'other';
}
