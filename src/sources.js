// 지원 언어 (화면·기사 번역·분석 모두 이 순서)
export const LANGS = ['ko', 'en', 'ja', 'zh', 'fr'];
export const BASE_LANG = 'ko'; // AI 분석을 처음 쓰는 언어. 나머지 언어는 여기서 번역
export const normLang = (l) => (LANGS.includes(l) ? l : BASE_LANG);

// 국가별 뉴스 출처 목록 (2026-11-06·11-11 기준 RSS 동작 확인, 모두 영어판 — 사건 묶기·주제 나누기가 영어 기준이라서)
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
  // ── 아시아 ──
  S('toi', ['타임스 오브 인디아', 'The Times of India', 'タイムズ・オブ・インディア', '印度时报', 'The Times of India'], 'IN', 'asia', 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms'),
  S('ndtv', ['NDTV', 'NDTV', 'NDTV', '新德里电视台', 'NDTV'], 'IN', 'asia', 'https://feeds.feedburner.com/ndtvnews-world-news'),
  S('dawn', ['돈', 'Dawn', 'ドーン', '黎明报', 'Dawn'], 'PK', 'asia', 'https://www.dawn.com/feeds/world'),
  S('tribunepk', ['익스프레스 트리뷴', 'The Express Tribune', 'エクスプレス・トリビューン', '快报论坛报', 'The Express Tribune'], 'PK', 'asia', 'https://tribune.com.pk/feed/world'),
  S('straitstimes', ['스트레이츠타임스', 'The Straits Times', 'ストレーツ・タイムズ', '海峡时报', 'The Straits Times'], 'SG', 'asia', 'https://www.straitstimes.com/news/world/rss.xml'),
  S('cna', ['CNA 채널뉴스아시아', 'CNA', 'CNA', '亚洲新闻台', 'CNA'], 'SG', 'asia', 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311', true),
  S('bangkokpost', ['방콕포스트', 'Bangkok Post', 'バンコク・ポスト', '曼谷邮报', 'Bangkok Post'], 'TH', 'asia', 'https://www.bangkokpost.com/rss/data/world.xml'),
  S('vnexpress', ['VN익스프레스', 'VnExpress International', 'VnExpress', '越南快讯', 'VnExpress International'], 'VN', 'asia', 'https://e.vnexpress.net/rss/world.rss', true),
  S('inquirer', ['필리핀 데일리 인콰이어러', 'Philippine Daily Inquirer', 'フィリピン・デイリー・インクワイアラー', '菲律宾每日询问者报', 'Philippine Daily Inquirer'], 'PH', 'asia', 'https://globalnation.inquirer.net/feed'),
  S('rappler', ['래플러', 'Rappler', 'ラップラー', 'Rappler', 'Rappler'], 'PH', 'asia', 'https://www.rappler.com/world/feed/'),
  S('malaymail', ['말레이메일', 'Malay Mail', 'マレー・メール', '马来邮报', 'Malay Mail'], 'MY', 'asia', 'https://www.malaymail.com/feed/rss/world'),
  S('koreatimes', ['코리아타임스', 'The Korea Times', 'コリア・タイムズ', '韩国时报', 'The Korea Times'], 'KR', 'asia', 'https://www.koreatimes.co.kr/www/rss/world.xml'),
  S('mainichi', ['마이니치신문', 'The Mainichi', '毎日新聞', '每日新闻', 'Mainichi Shimbun'], 'JP', 'asia', 'https://mainichi.jp/rss/etc/english_latest.rss'),
  S('taipeitimes', ['타이페이타임스', 'Taipei Times', '台北時報', '台北时报', 'Taipei Times'], 'TW', 'asia', 'https://www.taipeitimes.com/xml/index.rss'),
  S('timesca', ['타임스 오브 센트럴아시아', 'The Times of Central Asia', 'タイムズ・オブ・セントラルアジア', '中亚时报', 'The Times of Central Asia'], 'KZ', 'asia', 'https://timesca.com/feed/'),
  S('akipress', ['AKI프레스', 'AKIpress', 'AKIプレス', 'AKIpress通讯社', 'AKIpress'], 'KG', 'asia', 'https://akipress.com/rss/news_en.rss'),
  S('diplomat', ['더 디플로맷', 'The Diplomat', 'ザ・ディプロマット', '外交家', 'The Diplomat'], 'US', 'asia', 'https://thediplomat.com/feed/'),
  // ── 중동 ──
  S('haaretz', ['하아레츠', 'Haaretz', 'ハアレツ', '国土报', 'Haaretz'], 'IL', 'middle-east', 'https://www.haaretz.com/srv/haaretz-latest-headlines'),
  S('arabnews', ['아랍뉴스', 'Arab News', 'アラブ・ニュース', '阿拉伯新闻', 'Arab News'], 'SA', 'middle-east', 'https://www.arabnews.com/rss.xml'),
  S('thenational', ['더 내셔널', 'The National', 'ザ・ナショナル', '国家报', 'The National'], 'AE', 'middle-east', 'https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml', true),
  S('tehrantimes', ['테헤란타임스', 'Tehran Times', 'テヘラン・タイムズ', '德黑兰时报', 'Tehran Times'], 'IR', 'middle-east', 'https://www.tehrantimes.com/rss', true),
  S('irna', ['IRNA 이란 국영통신', 'IRNA', 'イラン国営通信(IRNA)', '伊朗国家通讯社', 'IRNA'], 'IR', 'middle-east', 'https://en.irna.ir/rss', true),
  S('hurriyet', ['휘리예트 데일리뉴스', 'Hürriyet Daily News', 'ヒュリエト・デイリー・ニュース', '自由日报', 'Hürriyet Daily News'], 'TR', 'middle-east', 'https://www.hurriyetdailynews.com/rss/world'),
  S('dailysabah', ['데일리 사바', 'Daily Sabah', 'デイリー・サバ', '每日晨报', 'Daily Sabah'], 'TR', 'middle-east', 'https://www.dailysabah.com/rss/world'),
  S('egyptindependent', ['이집트 인디펜던트', 'Egypt Independent', 'エジプト・インディペンデント', '埃及独立报', 'Egypt Independent'], 'EG', 'middle-east', 'https://www.egyptindependent.com/feed/'),
  S('middleeasteye', ['미들이스트아이', 'Middle East Eye', 'ミドル・イースト・アイ', '中东之眼', 'Middle East Eye'], 'GB', 'middle-east', 'https://www.middleeasteye.net/rss'),
  // ── 유럽 ──
  S('euronews', ['유로뉴스', 'Euronews', 'ユーロニュース', '欧洲新闻台', 'Euronews'], 'FR', 'europe', 'https://www.euronews.com/rss?level=theme&name=news'),
  S('politicoeu', ['폴리티코 유럽', 'Politico Europe', 'ポリティコ・ヨーロッパ', 'Politico欧洲版', 'Politico Europe'], 'BE', 'europe', 'https://www.politico.eu/feed/'),
  S('rte', ['RTÉ 아일랜드 방송', 'RTÉ', 'アイルランド放送協会(RTÉ)', '爱尔兰广播电视台', 'RTÉ'], 'IE', 'europe', 'https://www.rte.ie/feeds/rss/?index=/news/world/', true),
  S('irishtimes', ['아이리시타임스', 'The Irish Times', 'アイリッシュ・タイムズ', '爱尔兰时报', 'The Irish Times'], 'IE', 'europe', 'https://www.irishtimes.com/arc/outboundfeeds/feed-world/?outputType=xml'),
  S('independent', ['인디펜던트', 'The Independent', 'インディペンデント', '独立报', 'The Independent'], 'GB', 'europe', 'https://www.independent.co.uk/news/world/rss'),
  S('skynews', ['스카이뉴스', 'Sky News', 'スカイニュース', '天空新闻', 'Sky News'], 'GB', 'europe', 'https://feeds.skynews.com/feeds/rss/world.xml'),
  S('ansa', ['안사 통신', 'ANSA', 'ANSA通信', '安莎通讯社', 'ANSA'], 'IT', 'europe', 'https://www.ansa.it/english/news/english_nr_rss.xml'),
  S('elpais', ['엘파이스', 'El País', 'エル・パイス', '国家报(西班牙)', 'El País'], 'ES', 'europe', 'https://feeds.elpais.com/mrss-s/pages/ep/site/english.elpais.com/portada'),
  S('yle', ['윌레 핀란드 방송', 'Yle', 'フィンランド放送協会(Yle)', '芬兰广播公司', 'Yle'], 'FI', 'europe', 'https://yle.fi/rss/t/18-34837/en', true),
  S('notesfrompoland', ['노츠 프롬 폴란드', 'Notes from Poland', 'ノーツ・フロム・ポーランド', 'Notes from Poland', 'Notes from Poland'], 'PL', 'europe', 'https://notesfrompoland.com/feed/'),
  S('kyivindependent', ['키이우 인디펜던트', 'The Kyiv Independent', 'キーウ・インディペンデント', '基辅独立报', 'The Kyiv Independent'], 'UA', 'europe', 'https://kyivindependent.com/news-archive/rss/'),
  S('ukrinform', ['우크린폼 통신', 'Ukrinform', 'ウクルインフォルム', '乌克兰国家通讯社', 'Ukrinform'], 'UA', 'europe', 'https://www.ukrinform.net/rss/block-lastnews', true),
  S('meduza', ['메두자', 'Meduza', 'メドゥーザ', '美杜莎', 'Meduza'], 'LV', 'europe', 'https://meduza.io/rss/en/all'),
  S('rt', ['RT 러시아 투데이', 'RT', 'RT(ロシア・トゥデイ)', '今日俄罗斯', 'RT'], 'RU', 'europe', 'https://www.rt.com/rss/news/', true),
  S('balkaninsight', ['발칸 인사이트', 'Balkan Insight', 'バルカン・インサイト', '巴尔干观察', 'Balkan Insight'], 'RS', 'europe', 'https://balkaninsight.com/feed/'),
  S('hungarytoday', ['헝가리 투데이', 'Hungary Today', 'ハンガリー・トゥデイ', '今日匈牙利', 'Hungary Today'], 'HU', 'europe', 'https://hungarytoday.hu/feed/'),
  // ── 미주 ──
  S('globalnews', ['글로벌뉴스', 'Global News', 'グローバル・ニュース', '环球新闻(加拿大)', 'Global News'], 'CA', 'americas', 'https://globalnews.ca/world/feed/'),
  S('nyt', ['뉴욕타임스', 'The New York Times', 'ニューヨーク・タイムズ', '纽约时报', 'The New York Times'], 'US', 'americas', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'),
  S('wapo', ['워싱턴포스트', 'The Washington Post', 'ワシントン・ポスト', '华盛顿邮报', 'The Washington Post'], 'US', 'americas', 'https://feeds.washingtonpost.com/rss/world'),
  S('foxnews', ['폭스뉴스', 'Fox News', 'FOXニュース', '福克斯新闻', 'Fox News'], 'US', 'americas', 'https://moxie.foxnews.com/google-publisher/world.xml'),
  S('cbsnews', ['CBS 뉴스', 'CBS News', 'CBSニュース', '哥伦比亚广播公司新闻', 'CBS News'], 'US', 'americas', 'https://www.cbsnews.com/latest/rss/world'),
  S('abcus', ['ABC 뉴스(미국)', 'ABC News (US)', 'ABCニュース(米国)', '美国广播公司新闻', 'ABC News (États-Unis)'], 'US', 'americas', 'https://abcnews.go.com/abcnews/internationalheadlines'),
  S('mexiconewsdaily', ['멕시코 뉴스 데일리', 'Mexico News Daily', 'メキシコ・ニュース・デイリー', '墨西哥每日新闻', 'Mexico News Daily'], 'MX', 'americas', 'https://mexiconewsdaily.com/feed/'),
  S('batimes', ['부에노스아이레스 타임스', 'Buenos Aires Times', 'ブエノスアイレス・タイムズ', '布宜诺斯艾利斯时报', 'Buenos Aires Times'], 'AR', 'americas', 'https://www.batimes.com.ar/feed'),
  S('agenciabrasil', ['아젠시아 브라질', 'Agência Brasil', 'ブラジル通信', '巴西通讯社', 'Agência Brasil'], 'BR', 'americas', 'https://agenciabrasil.ebc.com.br/en/rss/ultimasnoticias/feed.xml', true),
  S('riotimes', ['리우타임스', 'The Rio Times', 'リオ・タイムズ', '里约时报', 'The Rio Times'], 'BR', 'americas', 'https://www.riotimesonline.com/feed/'),
  S('ticotimes', ['티코타임스', 'The Tico Times', 'ティコ・タイムズ', '蒂科时报', 'The Tico Times'], 'CR', 'americas', 'https://ticotimes.net/feed'),
  S('colombiareports', ['콜롬비아 리포츠', 'Colombia Reports', 'コロンビア・レポーツ', '哥伦比亚报道', 'Colombia Reports'], 'CO', 'americas', 'https://colombiareports.com/feed/'),
  S('jamaicagleaner', ['자메이카 글리너', 'The Jamaica Gleaner', 'ジャマイカ・グリーナー', '牙买加集锦报', 'The Jamaica Gleaner'], 'JM', 'americas', 'https://jamaica-gleaner.com/feed/rss.xml'),
  // ── 아프리카 ──
  S('dailymaverick', ['데일리 매버릭', 'Daily Maverick', 'デイリー・マーベリック', '每日独行者报', 'Daily Maverick'], 'ZA', 'africa', 'https://www.dailymaverick.co.za/dmrss/'),
  S('nation_ke', ['데일리 네이션', 'Daily Nation', 'デイリー・ネーション', '民族日报', 'Daily Nation'], 'KE', 'africa', 'https://nation.africa/kenya/rss.xml'),
  S('standard_ke', ['더 스탠더드(케냐)', 'The Standard (Kenya)', 'ザ・スタンダード(ケニア)', '标准报(肯尼亚)', 'The Standard (Kenya)'], 'KE', 'africa', 'https://www.standardmedia.co.ke/rss/world.php'),
  S('eastafrican', ['이스트아프리칸', 'The EastAfrican', 'イースト・アフリカン', '东非人报', 'The EastAfrican'], 'KE', 'africa', 'https://www.theeastafrican.co.ke/rss.xml'),
  S('premiumtimes', ['프리미엄타임스', 'Premium Times', 'プレミアム・タイムズ', '优质时报', 'Premium Times'], 'NG', 'africa', 'https://www.premiumtimesng.com/feed'),
  S('punch', ['펀치', 'The Punch', 'パンチ', '笨拙报', 'The Punch'], 'NG', 'africa', 'https://punchng.com/feed/'),
  S('vanguard', ['뱅가드', 'Vanguard', 'ヴァンガード', '先锋报', 'Vanguard'], 'NG', 'africa', 'https://www.vanguardngr.com/feed/'),
  S('myjoyonline', ['마이조이온라인', 'MyJoyOnline', 'マイジョイオンライン', 'MyJoyOnline', 'MyJoyOnline'], 'GH', 'africa', 'https://www.myjoyonline.com/feed/'),
  S('monitor_ug', ['데일리 모니터', 'Daily Monitor', 'デイリー・モニター', '每日观察报', 'Daily Monitor'], 'UG', 'africa', 'https://www.monitor.co.ug/rss.xml'),
  S('africanews', ['아프리카뉴스', 'Africanews', 'アフリカニュース', '非洲新闻台', 'Africanews'], 'CG', 'africa', 'https://www.africanews.com/feed/rss'),
  S('lusakatimes', ['루사카타임스', 'Lusaka Times', 'ルサカ・タイムズ', '卢萨卡时报', 'Lusaka Times'], 'ZM', 'africa', 'https://www.lusakatimes.com/feed/'),
  S('namibian', ['더 나미비안', 'The Namibian', 'ザ・ナミビアン', '纳米比亚人报', 'The Namibian'], 'NA', 'africa', 'https://www.namibian.com.na/feed/'),
  // ── 오세아니아 ──
  S('nzherald', ['뉴질랜드 헤럴드', 'The New Zealand Herald', 'ニュージーランド・ヘラルド', '新西兰先驱报', 'The New Zealand Herald'], 'NZ', 'oceania', 'https://www.nzherald.co.nz/arc/outboundfeeds/rss/section/world/?outputType=xml'),
  S('sbs', ['SBS 호주 특별방송', 'SBS News', 'SBSニュース', '澳大利亚特别广播服务公司', 'SBS News'], 'AU', 'oceania', 'https://www.sbs.com.au/news/topic/world/feed', true),
  S('rnzpacific', ['RNZ 퍼시픽', 'RNZ Pacific', 'RNZパシフィック', '新西兰广播电台太平洋频道', 'RNZ Pacific'], 'NZ', 'oceania', 'https://www.rnz.co.nz/rss/pacific.xml', true),
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
