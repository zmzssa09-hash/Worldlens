// 사건 주제(카테고리) 나누기: 영어 원문 기사의 제목·요약에 나온 낱말로 점수를 매겨 가장 높은 주제 하나를 고름
// (모든 매체가 영어판이라 영어 낱말만 보면 됨. 제목은 요약보다 2배로 침)
export const CATEGORIES = ['politics', 'conflict', 'economy', 'tech', 'climate', 'health', 'society', 'culture'];

const RULES = {
  politics: /\b(elections?|elected|vote[sd]?|voters?|voting|ballot\w*|president\w*|prime minister|parliament\w*|congress\w*|senate|lawmakers?|government|ministers?|ministry|coalition|opposition|summit|diplomat\w*|foreign minister|talks|treaty|referendum|campaign\w*|candidates?|party|parties|cabinet|impeach\w*|resign\w*|sanctions?|embass\w*|un general assembly|united nations)\b/gi,
  conflict: /\b(war|wars|warfare|missiles?|troops|soldiers?|military|army|armed|drones?|air ?strikes?|strikes? on|invasion|invad\w*|ceasefire|truce|shelling|bombard\w*|nuclear weapons?|weapons?|militants?|rebels?|insurgen\w*|hostages?|frontline|offensive|airstrikes?|killed in|nato|defen[cs]e|hamas|hezbollah|houthis?|attacks?|attacked|hits|shelled|casualt\w*|wounded|killed)\b/gi,
  economy: /\b(econom\w*|stocks?|shares|markets?|inflation|interest rates?|central bank|currenc(?:y|ies)|dollar|yen|yuan|bonds?|recession|gdp|growth|tariffs?|trade|exports?|imports?|budget|debt|tax\w*|investors?|investment|banks?|banking|oil prices?|crude|opec|companies|company|firms?|profits?|earnings|jobs|unemployment|wages?|prices)\b/gi,
  tech: /\b(ai|artificial intelligence|chips?|semiconductors?|technolog\w*|tech|cyber\w*|hack\w*|smartphones?|software|internet|social media|apps?|satellites?|space|rockets?|nasa|robots?|quantum|scientists?|research\w*|study finds|discover\w*)\b/gi,
  climate: /\b(climate|cop\d+|emissions?|carbon|global warming|earthquakes?|floods?|flooding|storms?|hurricanes?|typhoons?|cyclones?|tornado\w*|wildfires?|bushfires?|drought|heatwaves?|volcan\w*|tsunami|landslides?|environment\w*|pollution|deforestation|biodiversity|renewable|wildlife)\b/gi,
  health: /\b(health|virus|viral|outbreaks?|vaccin\w*|diseases?|pandemic|epidemic|hospitals?|doctors?|patients?|medical|medicine|drugs?|cholera|measles|malaria|ebola|mpox|covid|cancer|world health organization)\b/gi,
  society: /\b(police|arrest\w*|court|judge|trial|sentenced|prison|crime|criminal|shootings?|gunman|stabbing|murder\w*|terror\w*|protests?|protesters?|rally|strike action|migrants?|migration|refugees?|asylum|immigra\w*|education|schools?|students?|accident|crash|fire|rescu\w*|missing|sinks?|sank|collision|derail\w*|pope|religio\w*|church|rights|women|children|poverty|housing)\b/gi,
  culture: /\b(football|soccer|olympic\w*|world cup|tournament|championship|match|cricket|tennis|athletes?|coach|league|film|movie|cinema|music|singer|concert|festival|art|artists?|museum|book|novel|celebrity|fashion|k-pop|royal|grand prix|formula (?:one|1)|f1|race|olympics|heritage|premier league|goals?|draw|striker|manchester|man united)\b/gi,
};

// 정치 낱말(정부·대통령 등)은 거의 모든 기사에 나와서 조금 낮게 침
const WEIGHT = { politics: 0.8 };

const count = (text, re) => (text.match(re) || []).length;

// articles: [{ title, summary }] (원문). 낱말이 하나도 안 걸리면 'other'
export function guessCategory(articles) {
  const score = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const a of articles) {
    const t = a.title || '', s = a.summary || '';
    for (const c of CATEGORIES) score[c] += (count(t, RULES[c]) * 2 + count(s, RULES[c])) * (WEIGHT[c] || 1);
  }
  const [best, n] = Object.entries(score).sort((x, y) => y[1] - x[1])[0];
  return n >= 2 ? best : 'other';
}
