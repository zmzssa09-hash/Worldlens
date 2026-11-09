// 지원 언어 (화면·기사 번역·분석 모두 이 순서)
export const LANGS = ['ko', 'en', 'ja', 'zh', 'fr'];
export const BASE_LANG = 'ko'; // AI 분석을 처음 쓰는 언어. 나머지 언어는 여기서 번역
export const normLang = (l) => (LANGS.includes(l) ? l : BASE_LANG);

// 국가별 뉴스 출처 목록 (2026-11-06 기준 RSS 동작 확인, 모두 영어판)
// stateMedia: 국가가 소유·운영하는 매체 → 화면에 표시해 독자가 감안할 수 있게 함
// names: 언어별 매체 이름 [ko, en, ja, zh, fr]
const S = (id, names, country, region, url, stateMedia = false) => ({
  id, country, region, url, stateMedia,
  names: Object.fromEntries(LANGS.map((l, i) => [l, names[i]])),
});
export const SOURCES = [
  S('bbc', ['BBC 방송', 'BBC', 'BBC', '英国广播公司', 'BBC'], 'GB', 'europe', 'https://feeds.bbci.co.uk/news/world/rss.xml'),
  S('guardian', ['가디언', 'The Guardian', 'ガーディアン', '卫报', 'The Guardian'], 'GB', 'europe', 'https://www.theguardian.com/world/rss'),
  S('dw', ['도이체벨레', 'DW', 'ドイチェ・ヴェレ', '德国之声', 'Deutsche Welle'], 'DE', 'europe', 'https://rss.dw.com/rdf/rss-en-world', true),
  S('france24', ['프랑스24', 'France 24', 'フランス24', '法国24台', 'France 24'], 'FR', 'europe', 'https://www.france24.com/en/rss', true),
  S('tass', ['타스 통신', 'TASS', 'タス通信', '塔斯社', 'TASS'], 'RU', 'europe', 'https://tass.com/rss/v2.xml', true),
  S('anadolu', ['아나돌루 통신', 'Anadolu Agency', 'アナドル通信', '阿纳多卢通讯社', 'Agence Anadolu'], 'TR', 'middle-east', 'https://www.aa.com.tr/en/rss/default?cat=world', true),
  S('aljazeera', ['알자지라', 'Al Jazeera', 'アルジャジーラ', '半岛电视台', 'Al Jazeera'], 'QA', 'middle-east', 'https://www.aljazeera.com/xml/rss/all.xml'),
  S('npr', ['NPR 공영라디오', 'NPR', 'NPR', '美国国家公共电台', 'NPR'], 'US', 'americas', 'https://feeds.npr.org/1004/rss.xml'),
  S('mercopress', ['메르코프레스', 'MercoPress', 'メルコプレス', 'MercoPress', 'MercoPress'], 'UY', 'americas', 'https://en.mercopress.com/rss/'),
  S('yonhap', ['연합뉴스', 'Yonhap', '聯合ニュース', '韩联社', 'Yonhap'], 'KR', 'asia', 'https://en.yna.co.kr/RSS/news.xml'),
  S('japantimes', ['재팬타임스', 'The Japan Times', 'ジャパンタイムズ', '日本时报', 'The Japan Times'], 'JP', 'asia', 'https://www.japantimes.co.jp/feed/'),
  S('cgtn', ['CGTN 중국국제TV', 'CGTN', '中国国際テレビ(CGTN)', '中国国际电视台', 'CGTN'], 'CN', 'asia', 'https://www.cgtn.com/subscribe/rss/section/world.xml', true),
  S('scmp', ['사우스차이나모닝포스트', 'South China Morning Post', 'サウスチャイナ・モーニング・ポスト', '南华早报', 'South China Morning Post'], 'HK', 'asia', 'https://www.scmp.com/rss/91/feed'),
  S('hindu', ['더 힌두', 'The Hindu', 'ザ・ヒンドゥー', '印度教徒报', 'The Hindu'], 'IN', 'asia', 'https://www.thehindu.com/news/international/feeder/default.rss'),
  S('abcau', ['호주 ABC', 'ABC News (Australia)', 'オーストラリア放送協会', '澳大利亚广播公司', 'ABC (Australie)'], 'AU', 'oceania', 'https://www.abc.net.au/news/feed/2942460/rss.xml', true),
  S('allafrica', ['올아프리카', 'AllAfrica', 'オールアフリカ', '全非洲网', 'AllAfrica'], 'XA', 'africa', 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf'),
];
export const SOURCE_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

// 나라 이름: 표준 지역 코드는 Intl로 각 언어 이름을 만들고, 'XA'(아프리카 종합)만 직접 지정
const COUNTRY_OVERRIDE = {
  XA: { ko: '아프리카(종합)', en: 'Pan-African', ja: 'アフリカ(総合)', zh: '泛非洲', fr: 'Panafricain' },
  HK: { ko: '홍콩', en: 'Hong Kong', ja: '香港', zh: '香港', fr: 'Hong Kong' },
  KR: { ko: '한국', en: 'South Korea', ja: '韓国', zh: '韩国', fr: 'Corée du Sud' },
  GB: { ko: '영국', en: 'UK', ja: 'イギリス', zh: '英国', fr: 'Royaume-Uni' },
  AU: { ko: '호주', en: 'Australia', ja: 'オーストラリア', zh: '澳大利亚', fr: 'Australie' },
  US: { ko: '미국', en: 'US', ja: 'アメリカ', zh: '美国', fr: 'États-Unis' },
};
const displayNames = Object.fromEntries(LANGS.map((l) => [l, new Intl.DisplayNames([l === 'zh' ? 'zh-Hans' : l], { type: 'region' })]));
export function countryName(code, lang) {
  return COUNTRY_OVERRIDE[code]?.[lang] ?? displayNames[lang].of(code);
}
export function outletName(sourceId, lang) {
  return SOURCE_BY_ID[sourceId]?.names[lang] ?? sourceId;
}

export const REGIONS = ['asia', 'europe', 'middle-east', 'americas', 'africa', 'oceania', 'global'];

// 사건이 '어디서' 일어났는지 추정하기 위한 지명 사전 (제목·요약에 등장하는 단어 → 지역)
export const PLACE_REGION = {
  // 아시아
  china: 'asia', chinese: 'asia', beijing: 'asia', taiwan: 'asia', taipei: 'asia', hong: 'asia', japan: 'asia', japanese: 'asia', tokyo: 'asia',
  korea: 'asia', korean: 'asia', seoul: 'asia', pyongyang: 'asia', india: 'asia', indian: 'asia', delhi: 'asia', pakistan: 'asia', afghanistan: 'asia',
  bangladesh: 'asia', myanmar: 'asia', thailand: 'asia', vietnam: 'asia', philippines: 'asia', indonesia: 'asia', malaysia: 'asia', singapore: 'asia',
  cambodia: 'asia', nepal: 'asia', 'sri': 'asia', mongolia: 'asia', kazakhstan: 'asia', timor: 'asia',
  // 유럽
  ukraine: 'europe', ukrainian: 'europe', kyiv: 'europe', russia: 'europe', russian: 'europe', moscow: 'europe', kremlin: 'europe', putin: 'europe',
  britain: 'europe', british: 'europe', london: 'europe', england: 'europe', france: 'europe', french: 'europe', paris: 'europe', macron: 'europe',
  germany: 'europe', german: 'europe', berlin: 'europe', italy: 'europe', spain: 'europe', poland: 'europe', nato: 'europe', europe: 'europe',
  european: 'europe', brussels: 'europe', netherlands: 'europe', sweden: 'europe', norway: 'europe', finland: 'europe', greece: 'europe', hungary: 'europe',
  serbia: 'europe', romania: 'europe', belarus: 'europe', moldova: 'europe', zelensky: 'europe', starmer: 'europe',
  // 중동
  israel: 'middle-east', israeli: 'middle-east', gaza: 'middle-east', palestinian: 'middle-east', palestine: 'middle-east',
  iran: 'middle-east', iranian: 'middle-east', tehran: 'middle-east', iraq: 'middle-east', syria: 'middle-east', syrian: 'middle-east', lebanon: 'middle-east',
  hezbollah: 'middle-east', hamas: 'middle-east', yemen: 'middle-east', houthi: 'middle-east', houthis: 'middle-east', saudi: 'middle-east', qatar: 'middle-east',
  uae: 'middle-east', jordan: 'middle-east', turkey: 'middle-east', turkiye: 'middle-east', erdogan: 'middle-east', netanyahu: 'middle-east', gulf: 'middle-east',
  egypt: 'middle-east', jericho: 'middle-east',
  // 미주
  trump: 'americas', washington: 'americas', america: 'americas', american: 'americas', usa: 'americas', congress: 'americas', senate: 'americas',
  midterm: 'americas', midterms: 'americas', canada: 'americas', canadian: 'americas', mexico: 'americas', brazil: 'americas', argentina: 'americas',
  chile: 'americas', colombia: 'americas', venezuela: 'americas', peru: 'americas', paraguay: 'americas', cuba: 'americas', haiti: 'americas',
  ecuador: 'americas', bolivia: 'americas', uruguay: 'americas', lula: 'americas', milei: 'americas', rubio: 'americas',
  // 아프리카
  africa: 'africa', african: 'africa', nigeria: 'africa', kenya: 'africa', sudan: 'africa', ethiopia: 'africa', congo: 'africa', drc: 'africa',
  somalia: 'africa', mali: 'africa', niger: 'africa', ghana: 'africa', uganda: 'africa', rwanda: 'africa', zimbabwe: 'africa', mozambique: 'africa',
  libya: 'africa', tunisia: 'africa', morocco: 'africa', algeria: 'africa', senegal: 'africa', cameroon: 'africa', tanzania: 'africa', ebola: 'africa',
  // 오세아니아
  australia: 'oceania', australian: 'oceania', zealand: 'oceania', pacific: 'oceania', fiji: 'oceania', papua: 'oceania',
};
