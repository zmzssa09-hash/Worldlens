// '나한테 무슨 상관?' (데모 모드) — 사건 유형을 짐작해서, 그 유형이 보통 생활에 닿는 길을 구체적으로 설명
//  - 원문(영어) 기사 제목에 나온 낱말로 유형을 고름. 제목이 가장 믿을 만해서 제목은 1점, 요약에만 나오면 0.25점
//  - 같은 점수면 목록에서 앞에 있는 유형(더 구체적인 것)이 이김: 예) '이란 사이버 부대' → 중동보다 사이버
//  - 영향이 거의 없으면 없다고 솔직하게 씀 (연예인 재판에 '환율 영향' 같은 억지 연결을 하지 않음)
//  - 한국어는 한국 독자 기준, 다른 언어는 특정 나라를 가정하지 않음
//  결과: { text, tip }

const S = [
  {
    k: 'nkorea', re: /\b(north korea\w*|pyongyang|kim jong[- ]un)\b/i,
    ko: ['북한의 움직임은 한반도 긴장 수준과 곧바로 이어져요. 긴장이 높아지면 원화 가치와 주가가 잠시 흔들리기도 해요.', '정부·합동참모본부의 공식 발표를 기준으로 판단하고, 확인되지 않은 소문은 걸러 들으세요.'],
    en: ['North Korea’s moves directly shape tension on the Korean Peninsula and across East Asia. Spikes in tension can briefly rattle regional markets and currencies.', 'Rely on official government statements rather than unverified rumours.'],
    ja: ['北朝鮮の動きは朝鮮半島と東アジアの緊張に直結します。緊張が高まると、地域の株価や為替が一時的に揺れることもあります。', '未確認のうわさではなく、政府の公式発表をもとに判断しましょう。'],
    zh: ['朝鲜的动向直接关系到朝鲜半岛和东亚的紧张程度。局势升温时，地区股市和汇率可能出现短暂波动。', '以政府的官方发布为准，不要轻信未经证实的传言。'],
    fr: ['Les gestes de la Corée du Nord pèsent directement sur la tension dans la péninsule coréenne et en Asie de l’Est. Un regain de tension peut secouer brièvement les marchés et les devises de la région.', 'Fiez-vous aux annonces officielles plutôt qu’aux rumeurs non vérifiées.'],
  },
  {
    k: 'korea', re: /\b(south korea\w*|korean|seoul|busan|samsung|hyundai|sk hynix|k-pop)\b/i,
    ko: ['한국이 직접 관련된 소식이에요. 해외 언론이 한국을 어떻게 다루는지는 수출·관광·투자 분위기에도 영향을 줘요.', '같은 사건을 한국 언론과 해외 언론이 어떻게 다르게 보도하는지 비교해 보세요.'],
    en: ['South Korea is directly involved. As a major maker of chips, cars, batteries and ships, Korea’s news can ripple into global supply chains.', 'Compare how Korean and foreign media frame the same story.'],
    ja: ['韓国が直接関わるニュースです。韓国は半導体・自動車・電池・船舶の主要な生産国なので、その動きは世界の供給網にも波及します。', '韓国メディアと海外メディアの報じ方の違いを比べてみてください。'],
    zh: ['这则新闻与韩国直接相关。韩国是芯片、汽车、电池和船舶的主要生产国，其动向可能波及全球供应链。', '比较一下韩国媒体和外国媒体对同一事件的报道有何不同。'],
    fr: ['La Corée du Sud est directement concernée. Grand producteur de puces, de voitures, de batteries et de navires, le pays peut influer sur les chaînes d’approvisionnement mondiales.', 'Comparez la façon dont les médias coréens et étrangers présentent l’événement.'],
  },
  {
    k: 'chips', re: /\b(chips?|semiconductors?|chipmakers?|nvidia|tsmc|sk hynix|micron|asml|jensen huang)\b/i,
    ko: ['반도체는 한국 수출의 약 5분의 1을 차지하는 1등 품목이에요. 반도체 기업과 미·중 기술 갈등 소식은 삼성전자·SK하이닉스 같은 기업 실적과 주가, 나아가 국민연금·펀드 수익률에도 이어질 수 있어요.', '반도체 관련 주식·펀드를 갖고 있다면, 이 소식에 시장이 어떻게 반응하는지 지켜보세요.'],
    en: ['Chips power everything from phones and cars to AI. Disputes over chipmakers and the US–China tech rivalry can affect device prices and supply, and move stock markets — including the pension and index funds that hold big tech.', 'If you hold tech stocks or index funds, watch how markets react.'],
    ja: ['半導体はスマホや自動車からAIまであらゆる製品を動かしています。半導体企業をめぐる対立や米中の技術競争は、機器の価格や供給、株式市場、さらに大手IT株を含む年金・投資信託にも影響し得ます。', 'IT関連の株や投資信託を持っているなら、市場の反応を見てみましょう。'],
    zh: ['芯片驱动着从手机、汽车到人工智能的一切。围绕芯片企业的纠纷和中美科技竞争，可能影响电子产品的价格和供应，并带动股市波动，包括持有大型科技股的养老金和指数基金。', '如果你持有科技股或指数基金，可以留意市场的反应。'],
    fr: ['Les puces font tourner téléphones, voitures et IA. Les litiges autour des fabricants et la rivalité technologique sino-américaine peuvent peser sur le prix et l’offre des appareils, et faire bouger les marchés — y compris les fonds de retraite et indiciels exposés à la tech.', 'Si vous détenez des actions tech ou des fonds indiciels, observez la réaction des marchés.'],
  },
  {
    // 책·영화·음악·시상식 (AI를 다룬 소설이 상을 받았다고 AI 설명이 붙지 않게 AI보다 앞에)
    k: 'arts', re: /\b(novels?|books?|authors?|writers?|booker|pulitzer|films?|movies?|cinema|oscars?|grammys?|albums?|singers?|concerts?|museums?|exhibitions?|festivals?)\b/i,
    ko: ['문화 소식이라 생활에 직접 주는 영향은 없어요. 다만 지금 세계가 어떤 이야기에 마음이 움직이는지 보여 주고, 읽거나 볼거리를 고르는 데 도움이 돼요.', '한국어판이나 국내 개봉·공연 소식이 있는지 찾아보세요.'],
    en: ['Cultural news has no direct effect on daily life, but it shows which stories are moving people around the world — and can point you to something worth reading or watching.', ''],
    ja: ['文化のニュースなので生活への直接の影響はありません。ただ、いま世界がどんな物語に心を動かされているかがわかり、読むものや観るものを選ぶヒントになります。', ''],
    zh: ['这是文化新闻，对生活没有直接影响。不过它反映出当下世界被哪些故事打动，也能帮你挑选值得一读或一看的作品。', ''],
    fr: ['L’actualité culturelle n’a pas d’effet direct sur le quotidien, mais elle montre quelles histoires touchent le monde — et peut vous donner une idée de lecture ou de sortie.', ''],
  },
  {
    k: 'ai', re: /\b(ai|a\.i\.|artificial intelligence|chatgpt|openai|chatbots?|deepfakes?|generative)\b/i,
    ko: ['AI는 내가 쓰는 검색·번역·사진 앱에 빠르게 들어오고 있고, 일하는 방식과 일자리에도 영향을 주기 시작했어요. 규칙과 기업 경쟁이 어떻게 정해지느냐에 따라 쓸 수 있는 서비스와 개인정보 보호 수준이 달라져요.', '가족 목소리를 흉내 낸 AI 전화 사기가 늘고 있어요. 돈을 보내 달라는 연락은 꼭 다른 방법으로 다시 확인하세요.'],
    en: ['AI is quickly moving into the search, translation and photo apps you use, and is starting to change how people work. How rules and corporate competition shake out will shape which services you get and how well your data is protected.', 'AI voice-cloning scams are rising: always verify urgent money requests through another channel.'],
    ja: ['AIは検索・翻訳・写真アプリなど身近なサービスに急速に入り込み、働き方や仕事にも影響し始めています。ルールや企業競争の行方によって、使えるサービスや個人情報の守られ方が変わります。', '家族の声をまねたAI詐欺電話が増えています。送金を求める連絡は必ず別の方法で確認しましょう。'],
    zh: ['人工智能正迅速进入你使用的搜索、翻译和照片应用，也开始改变工作方式和就业。规则和企业竞争如何发展，将决定你能用到哪些服务、个人信息受到多大保护。', '利用AI模仿亲人声音的诈骗电话在增加，遇到要钱的联系一定要用其他方式核实。'],
    fr: ['L’IA arrive vite dans vos applis de recherche, de traduction ou de photos, et commence à changer le travail. Les règles et la concurrence entre entreprises détermineront les services disponibles et la protection de vos données.', 'Les arnaques par clonage de voix se multiplient : vérifiez toujours une demande d’argent urgente par un autre moyen.'],
  },
  {
    k: 'cyber', re: /\b(cyber\w*|hack\w*|ransomware|data breach\w*|malware|phishing|leaked data)\b/i,
    ko: ['해킹에는 국경이 없어서, 다른 나라를 노린 공격 방식이 곧 우리 주변 기기와 서비스에도 쓰일 수 있어요. 공유기·스마트 가전·홈캠처럼 인터넷에 연결된 기기가 특히 자주 노려져요.', '기기 비밀번호를 처음 설정 그대로 두지 말고, 자동 업데이트를 켜 두세요.'],
    en: ['Hacking knows no borders: techniques used against one country soon turn up against everyday devices and services elsewhere. Internet-connected gadgets like routers, smart appliances and home cameras are frequent targets.', 'Change default device passwords and keep automatic updates on.'],
    ja: ['ハッキングに国境はなく、他国を狙った手口がすぐ身近な機器やサービスにも使われます。ルーターやスマート家電、見守りカメラなどネットにつながる機器は特に狙われやすいです。', '機器のパスワードを初期設定のままにせず、自動更新をオンにしておきましょう。'],
    zh: ['黑客攻击没有国界，针对别国的手法很快也会用在身边的设备和服务上。路由器、智能家电、家用摄像头等联网设备尤其容易成为目标。', '不要沿用设备的初始密码，并开启自动更新。'],
    fr: ['Le piratage ne connaît pas de frontières : les méthodes utilisées contre un pays se retrouvent vite contre des appareils et services du quotidien. Box, électroménager connecté et caméras domestiques sont des cibles fréquentes.', 'Changez les mots de passe par défaut et laissez les mises à jour automatiques activées.'],
  },
  {
    k: 'spy', re: /\b(spy|spies|spying|espionage|operatives?|plot\w*|secret agents?|intelligence officers?|sabotage)\b/i,
    ko: ['다른 나라 정보기관의 활동이 드러나면 외교관 추방이나 제재처럼 나라 사이 관계가 얼어붙는 일로 번지곤 해요. 당장 내 생활에 오는 영향은 작지만, 각국이 안보 위협을 얼마나 심각하게 보는지 보여 주는 신호예요.', '그 나라를 자주 오간다면 외교부 해외안전여행 공지를 한번 확인해 두세요.'],
    en: ['When foreign intelligence activity is exposed, it often leads to expelled diplomats or sanctions, chilling relations between countries. The direct effect on daily life is small, but it signals how seriously governments now take security threats.', 'If you travel there often, check your government’s travel advice.'],
    ja: ['外国の情報機関の活動が明るみに出ると、外交官の追放や制裁など国同士の関係悪化につながることがあります。日常生活への直接の影響は小さいものの、各国が安全保障上の脅威をどれほど深刻に見ているかを示すサインです。', 'その国へよく行くなら、政府の海外安全情報を確認しておきましょう。'],
    zh: ['外国情报活动一旦曝光，常会引发驱逐外交官或制裁，使国家关系降温。对日常生活的直接影响不大，但这表明各国正如何严肃看待安全威胁。', '如果经常往返该国，可以查看本国政府的出行安全提示。'],
    fr: ['Quand une opération de renseignement étrangère est révélée, cela débouche souvent sur des expulsions de diplomates ou des sanctions. L’effet direct sur le quotidien est faible, mais c’est un signal du sérieux avec lequel les États prennent les menaces.', 'Si vous vous y rendez souvent, consultez les conseils aux voyageurs de votre gouvernement.'],
  },
  {
    k: 'rates', re: /\b(interest rates?|rate (?:cut|hike|rise)s?|federal reserve|the fed|central bank|inflation|bank of (?:england|japan|korea|canada)|ecb)\b/i,
    ko: ['금리와 물가는 내 지갑에 가장 빨리 닿는 경제 소식이에요. 특히 미국 금리가 바뀌면 원-달러 환율과 한국 대출 금리가 따라 움직여, 대출 이자·해외여행·직구 비용이 달라질 수 있어요.', '변동금리 대출이 있다면 다음 금리 발표 일정을 챙겨 보세요.'],
    en: ['Interest rates and inflation reach your wallet faster than almost any other economic news. Rate moves — especially in the US — ripple into exchange rates, mortgage and loan costs, and the price of travel and imports.', 'If you have a variable-rate loan, note the date of the next rate decision.'],
    ja: ['金利と物価は、家計に最も早く響く経済ニュースです。特に米国の金利が動くと、為替やローン金利が連動し、借入の利息や海外旅行・輸入品の値段が変わることがあります。', '変動金利のローンがあるなら、次の金利発表の日程を確認しておきましょう。'],
    zh: ['利率和物价是最快影响钱包的经济新闻。尤其是美国利率变动，会带动汇率和贷款利率，进而改变房贷利息、出境旅行和进口商品的成本。', '如果你有浮动利率贷款，可以留意下一次利率决议的时间。'],
    fr: ['Taux d’intérêt et inflation touchent votre portefeuille plus vite que presque toute autre actualité économique. Les décisions de taux — surtout aux États-Unis — se répercutent sur les changes, le coût des crédits et le prix des voyages et des importations.', 'Si vous avez un prêt à taux variable, notez la date de la prochaine décision.'],
  },
  {
    k: 'trade', re: /\b(tariffs?|trade (?:war|deal|talks|deficit|dispute)s?|export controls?|import duties|customs duties|sanctions?)\b/i,
    ko: ['관세나 제재가 늘면 수입품 값이 오르고, 수출로 돈을 버는 기업(자동차·반도체·배터리)의 이익이 줄 수 있어요. 수출 비중이 큰 한국은 무역 갈등에 특히 민감해요.', '해외 직구를 자주 한다면 관세·배송비가 바뀌는지 확인하세요.'],
    en: ['Higher tariffs or sanctions tend to raise the price of imported goods and squeeze exporters such as carmakers and electronics firms. Trade-dependent economies feel these disputes most.', 'If you shop from overseas sites, watch for changes in duties and shipping costs.'],
    ja: ['関税や制裁が増えると輸入品が値上がりし、自動車や電子機器など輸出企業の利益が圧迫されがちです。貿易に頼る国ほど影響を強く受けます。', '海外通販をよく使うなら、関税や送料の変化をチェックしましょう。'],
    zh: ['关税或制裁增加，往往会推高进口商品价格，并压缩汽车、电子等出口企业的利润。越依赖贸易的经济体受影响越大。', '如果常在海外网站购物，可以留意关税和运费的变化。'],
    fr: ['Davantage de droits de douane ou de sanctions renchérit les produits importés et pèse sur les exportateurs comme l’automobile ou l’électronique. Les économies très ouvertes au commerce sont les plus touchées.', 'Si vous achetez sur des sites étrangers, surveillez les droits et les frais de livraison.'],
  },
  {
    k: 'energy', re: /\b(oil|crude|opec\+?|lng|natural gas|gas fields?|oil fields?|refiner\w*|pipelines?|gas prices?|fuel|petrol|gasoline|energy prices?|power cuts?|blackouts?)\b/i,
    ko: ['에너지 값은 기름값·전기·가스 요금은 물론, 물건을 만들고 나르는 비용을 통해 거의 모든 물가에 스며들어요. 원유를 대부분 수입하는 한국은 국제 유가에 특히 민감해요.', '국제 유가가 크게 움직이면 보통 2~3주 뒤 주유소 가격에 반영돼요.'],
    en: ['Energy costs seep into almost every price — fuel and utility bills directly, and everything else through the cost of making and shipping goods.', 'Big moves in crude prices usually show up at the pump within a few weeks.'],
    ja: ['エネルギー価格は、ガソリン代や電気・ガス料金はもちろん、ものを作って運ぶ費用を通じてほぼすべての物価にしみ込みます。', '原油価格の大きな変動は、たいてい数週間でガソリンスタンドの価格に表れます。'],
    zh: ['能源价格不仅直接影响油价和水电燃气费，还通过生产和运输成本渗入几乎所有物价。', '国际油价大幅波动，通常几周内就会反映到加油站价格上。'],
    fr: ['Le coût de l’énergie se diffuse dans presque tous les prix : directement dans le carburant et les factures, et indirectement via la production et le transport des biens.', 'Les fortes variations du brut se retrouvent généralement à la pompe en quelques semaines.'],
  },
  {
    k: 'markets', re: /\b(stocks?|shares|stock markets?|wall street|dow|nasdaq|s&p|recession|gdp|currenc(?:y|ies)|dollar|yen|yuan|bonds?|bitcoin|crypto\w*)\b/i,
    ko: ['세계 금융시장은 촘촘히 이어져 있어, 큰 나라의 경기·시장 소식은 하루 만에 코스피와 환율에도 반영되곤 해요. 주식·펀드·퇴직연금을 갖고 있다면 간접적으로 영향을 받아요.', '하루 이틀의 오르내림보다, 그 흐름이 이어지는지를 지켜보세요.'],
    en: ['Global markets are tightly linked: economic and market news from a big economy can move stock indexes and currencies elsewhere within a day. Anyone with shares, funds or a pension is indirectly exposed.', 'Watch whether the trend lasts rather than reacting to a single day’s move.'],
    ja: ['世界の金融市場は密接につながっていて、大国の景気・市場のニュースは一日で他国の株価や為替にも表れます。株・投資信託・年金を持っていれば間接的に影響を受けます。', '一日の値動きより、その流れが続くかどうかに注目しましょう。'],
    zh: ['全球金融市场紧密相连，大型经济体的经济和市场消息往往一天之内就会影响其他地方的股指和汇率。持有股票、基金或养老金的人都会间接受到影响。', '与其在意一两天的涨跌，不如看趋势是否持续。'],
    fr: ['Les marchés mondiaux sont étroitement liés : une nouvelle venue d’une grande économie peut faire bouger indices et devises ailleurs en une journée. Actions, fonds et retraites y sont indirectement exposés.', 'Regardez si la tendance se confirme plutôt que de réagir à une seule séance.'],
  },
  {
    k: 'company', re: /\b(ceo|companies|company|corporations?|layoffs?|job cuts|mergers?|acquisitions?|takeover|antitrust|shareholders?|tech giants?|apple|google|meta|amazon|microsoft|tesla|boeing|airbus)\b/i,
    ko: ['큰 기업의 소송·인수·감원 소식은 그 회사 제품의 가격과 서비스, 주가, 그리고 그 업계의 일자리에 영향을 줄 수 있어요.', '그 회사 제품을 쓰거나 주식을 갖고 있다면 후속 발표를 지켜보세요.'],
    en: ['Lawsuits, takeovers and layoffs at big companies can change the price and quality of their products, move their shares, and affect jobs across the industry.', 'If you use their products or own their shares, follow the next announcements.'],
    ja: ['大企業の訴訟・買収・人員削減は、その会社の製品の価格やサービス、株価、業界の雇用に影響することがあります。', 'その会社の製品を使っていたり株を持っていたりするなら、続報に注目しましょう。'],
    zh: ['大企业的诉讼、并购和裁员，可能影响其产品价格和服务、股价，以及整个行业的就业。', '如果你使用其产品或持有其股票，可以关注后续公告。'],
    fr: ['Procès, rachats et licenciements dans les grandes entreprises peuvent changer le prix et la qualité de leurs produits, faire bouger leur action et toucher l’emploi du secteur.', 'Si vous utilisez leurs produits ou détenez leurs actions, suivez les prochaines annonces.'],
  },
  {
    k: 'disaster', re: /\b(earthquakes?|quake|floods?|flooding|flash floods?|storms?|hurricanes?|typhoons?|cyclones?|tornado\w*|wildfires?|bushfires?|drought|heatwaves?|volcan\w*|eruption|tsunami|landslides?|heavy rains?|rainstorms?)\b/i,
    ko: ['큰 자연재해는 그 지역 여행과 항공편을 막고, 농산물·원자재 생산지라면 식료품과 물건 값에도 영향을 줄 수 있어요.', '그 지역 여행 계획이 있다면 항공사 공지와 현지 기상 정보를 확인하세요. 돕고 싶다면 공식 구호 단체를 이용하세요.'],
    en: ['Major disasters disrupt travel and flights to the area, and if it produces crops or raw materials, they can push up food and goods prices.', 'If you plan to travel there, check airline notices and local weather alerts. To help, give through established relief organisations.'],
    ja: ['大きな自然災害はその地域への旅行や航空便を止め、農産物や原材料の産地であれば食料品やモノの値段にも影響します。', 'その地域へ旅行する予定なら、航空会社の案内と現地の気象情報を確認しましょう。支援するなら公式の救援団体を通じて。'],
    zh: ['重大自然灾害会阻断前往该地区的出行和航班；如果当地是农产品或原材料产地，还可能推高食品和商品价格。', '如计划前往该地区，请查看航空公司通知和当地气象信息。想帮忙，请通过正规救援机构捐助。'],
    fr: ['Une catastrophe majeure perturbe voyages et vols vers la région et, s’il s’agit d’une zone agricole ou productrice de matières premières, peut faire grimper les prix.', 'Si vous comptez y aller, consultez les avis des compagnies et la météo locale. Pour aider, passez par des organisations humanitaires reconnues.'],
  },
  {
    k: 'health', re: /\b(outbreaks?|virus|viral|vaccin\w*|epidemic|pandemic|cholera|measles|malaria|ebola|mpox|dengue|bird flu|avian flu|covid\w*)\b/i,
    ko: ['감염병은 비행기를 타고 빠르게 국경을 넘어요. 그 지역을 여행하거나 출장 갈 계획이 있다면 직접 관련이 있는 소식이에요.', '출국 전 질병관리청 ‘해외감염병NOW’에서 여행지 정보와 필요한 예방접종을 확인하세요.'],
    en: ['Infectious diseases cross borders quickly by air. If you plan to travel to the area, this news concerns you directly.', 'Check your government’s travel health advice and any recommended vaccinations before you go.'],
    ja: ['感染症は飛行機に乗って素早く国境を越えます。その地域へ旅行や出張の予定があれば、直接関係するニュースです。', '出発前に、政府の海外感染症情報と必要な予防接種を確認しましょう。'],
    zh: ['传染病会随航班迅速跨越国界。如果你计划前往该地区旅行或出差，这条新闻与你直接相关。', '出发前请查看官方的出境健康提示和建议接种的疫苗。'],
    fr: ['Les maladies infectieuses franchissent vite les frontières par avion. Si vous prévoyez de vous rendre dans la région, cette actualité vous concerne directement.', 'Avant de partir, consultez les conseils santé aux voyageurs et les vaccins recommandés.'],
  },
  {
    k: 'climate', re: /\b(climate|cop ?\d+|emissions?|carbon|net zero|global warming|renewables?|fossil fuels?)\b/i,
    ko: ['기후 회의와 탄소 규제의 결과는 몇 년에 걸쳐 전기 요금, 자동차(전기차) 가격, 기업의 생산 비용으로 이어져요. 수출 기업은 탄소 국경세 같은 새 규칙도 맞춰야 해요.', '당장 바뀌는 건 적지만, 약속이 실제 규제로 이어지는지 지켜볼 만해요.'],
    en: ['Climate deals and carbon rules feed through, over years, into electricity bills, car prices (including EVs) and production costs. Exporters also face new rules such as carbon border taxes.', 'Little changes overnight; what matters is whether pledges turn into actual rules.'],
    ja: ['気候会議や炭素規制の結果は、数年かけて電気料金や自動車（EV）の価格、企業の生産コストに表れます。輸出企業は炭素国境調整のような新ルールにも対応が必要です。', 'すぐに変わることは少ないですが、約束が実際の規制になるかが注目点です。'],
    zh: ['气候谈判和碳排放规则的结果，会在几年间逐步体现在电费、汽车（含电动车）价格和企业生产成本上。出口企业还要应对碳边境税等新规则。', '短期变化不大，关键是承诺能否变成真正的规则。'],
    fr: ['Les accords climatiques et règles carbone se répercutent, sur plusieurs années, sur les factures d’électricité, le prix des voitures (électriques comprises) et les coûts de production. Les exportateurs doivent aussi s’adapter à des règles comme la taxe carbone aux frontières.', 'Peu de choses changent du jour au lendemain : l’enjeu est de savoir si les promesses deviennent des règles.'],
  },
  {
    k: 'space', re: /\b(scientists?|researchers?|study finds|new study|discover\w*|breakthrough|space|spacecraft|satellites?|rockets?|nasa|astronauts?|moon|lunar|mars|telescope|quantum|fusion|genome|fossils?|dinosaurs?|species)\b/i,
    ko: ['이런 연구·탐사가 당장 생활을 바꾸진 않지만, 위성 통신·내비게이션·날씨 예보·의료 기술처럼 몇 년 뒤 일상 기술로 돌아오곤 해요.', '새 발견이 실제 제품이나 치료로 이어지기까지는 보통 오랜 시간이 걸려요.'],
    en: ['Research like this rarely changes daily life right away, but it often returns years later as everyday technology — satellite links, navigation, weather forecasts, medical treatments.', 'It usually takes years for a discovery to become a product or treatment.'],
    ja: ['こうした研究や探査がすぐ生活を変えることは少ないものの、衛星通信・ナビ・天気予報・医療技術のように、数年後に身近な技術として戻ってくることがよくあります。', '新しい発見が製品や治療になるまでには、ふつう長い時間がかかります。'],
    zh: ['这类研究和探索很少立刻改变生活，但常在几年后以卫星通信、导航、天气预报、医疗技术等形式回到日常。', '一项新发现变成产品或疗法，通常需要很多年。'],
    fr: ['Ce type de recherche change rarement le quotidien tout de suite, mais revient souvent des années plus tard sous forme de technologies courantes : satellites, navigation, météo, traitements médicaux.', 'Il faut généralement des années pour qu’une découverte devienne un produit ou un traitement.'],
  },
  {
    k: 'migration', re: /\b(migrants?|refugees?|asylum|immigration|immigrants?|visas?|deport\w*|border crossings?)\b/i,
    ko: ['이민·비자 정책이 바뀌면 그 나라로 유학·취업·여행하려는 사람에게 바로 영향이 있어요. 그곳에 사는 교민의 생활에도 직접 닿는 문제예요.', '그 나라에 갈 계획이 있다면 대사관의 비자 안내를 확인하세요.'],
    en: ['Changes to migration and visa rules directly affect anyone planning to study, work or travel in that country, as well as people already living there.', 'If you plan to go there, check the embassy’s visa guidance.'],
    ja: ['移民・ビザ政策が変わると、その国へ留学・就職・旅行しようとする人や、現地で暮らす人に直接影響します。', 'その国へ行く予定があるなら、大使館のビザ案内を確認しましょう。'],
    zh: ['移民和签证政策一旦变化，计划去该国留学、工作或旅行的人，以及已在当地生活的人都会直接受到影响。', '如计划前往该国，请查看使馆的签证说明。'],
    fr: ['Un changement des règles d’immigration ou de visa touche directement ceux qui veulent y étudier, travailler ou voyager, ainsi que les personnes qui y vivent déjà.', 'Si vous comptez y aller, consultez les informations visa de l’ambassade.'],
  },
  {
    k: 'transport', re: /\b(flights?|airlines?|airports?|aviation|air traffic|plane crash|train crash|derail\w*|ferry|ship sinks?|sank|collision|bus crash)\b/i,
    ko: ['교통 사고·운항 소식은 그 지역을 오가는 사람에게 바로 닿아요. 큰 사고라면 같은 노선이나 교통수단의 안전 점검과 운항 변경으로 이어지기도 해요.', '해당 항공사·노선을 이용할 예정이면 운항 공지를 확인하세요. 해외에서 사고를 당하면 영사콜센터(+82-2-3210-0404)에 도움을 요청할 수 있어요.'],
    en: ['Transport accidents and disruptions matter most to people travelling in the area. Major incidents can lead to safety checks and schedule changes on the same routes or vehicles.', 'If you are booked on that airline or route, check its service notices.'],
    ja: ['交通事故や運航の乱れは、その地域を行き来する人に直接関わります。大きな事故なら、同じ路線や乗り物の安全点検や運行変更につながることもあります。', '該当する航空会社や路線を使う予定なら、運航情報を確認しましょう。'],
    zh: ['交通事故和运营中断，与往返该地区的人直接相关。重大事故还可能导致同一线路或交通工具接受安全检查、调整班次。', '如计划乘坐相关航空公司或线路，请查看运营通知。'],
    fr: ['Accidents et perturbations de transport concernent d’abord ceux qui voyagent dans la région. Un accident grave peut entraîner des contrôles de sécurité et des changements d’horaires.', 'Si vous avez réservé sur cette compagnie ou cette ligne, consultez ses avis.'],
  },




  {
    k: 'accident', w: 0.75, re: /\b((?<!under |opened |open )fires?|blaze|explosions?|blasts?|pile-?ups?|collapse[sd]?|gas leak|stampede|mine accident)\b/i,
    ko: ['현지에서 일어난 사고라 대부분 사람의 일상에 직접 영향은 없어요. 다만 비슷한 사고를 막기 위한 안전 규정이 바뀌는 계기가 되기도 해요.', '해외에서 사고를 당하면 영사콜센터(+82-2-3210-0404)에 도움을 요청할 수 있어요.'],
    en: ['This was a local accident, so for most people there is no direct effect on daily life. Such incidents often prompt tighter safety rules, though.', ''],
    ja: ['現地で起きた事故なので、多くの人の日常に直接の影響はありません。ただ、同じような事故を防ぐための安全規則が見直されるきっかけになることがあります。', ''],
    zh: ['这是当地发生的事故，对大多数人的日常生活没有直接影响。不过这类事故常会促使当地收紧安全规定。', ''],
    fr: ['Il s’agit d’un accident local, sans effet direct sur le quotidien de la plupart des gens. Ce genre d’événement conduit souvent à durcir les règles de sécurité.', ''],
  },
  {
    k: 'court', w: 0.7, re: /\b(charged|sentenced|jailed|prison|trial|court|convicted|accused|arrested|lawsuit|sued|sues|scandal|allegations?|guilty|acquitted)\b/i,
    ko: ['특정 인물이나 한 사회 안의 사건이라 일상에 직접 주는 영향은 거의 없어요. 다만 그 사회가 범죄·인권·권력 문제를 어떻게 다루는지 보여 주는 사례로 볼 수 있어요.', ''],
    en: ['This concerns specific people or one society, so it has little direct effect on daily life. It does show how that society handles crime, rights or abuses of power.', ''],
    ja: ['特定の人物や一つの社会の中の出来事なので、日常への直接の影響はほとんどありません。ただ、その社会が犯罪・人権・権力の問題にどう向き合うかを示す例といえます。', ''],
    zh: ['这是围绕特定人物或某个社会内部的事件，对日常生活几乎没有直接影响。不过可以从中看出当地社会如何处理犯罪、人权或权力问题。', ''],
    fr: ['L’affaire concerne des personnes précises ou une seule société, avec peu d’effet direct sur le quotidien. Elle montre toutefois comment cette société traite la criminalité, les droits ou les abus de pouvoir.', ''],
  },  {
    k: 'mideast', w: 0.8, re: /\b(iran\w*|israel\w*|gaza|west bank|lebanon|hezbollah|hamas|houthis?|yemen|red sea|strait of hormuz|hormuz|syria\w*|iraq\w*|saudi\w*|riyadh|gulf)\b/i,
    need: /\b(war|attacks?|strikes?|missiles?|drones?|troops|military|ceasefire|truce|conflict|tensions?|nuclear|bomb\w*|killed|offensive|forces|hostages?|shipping|tankers?|under fire|opened fire)\b/i,
    ko: ['중동은 세계 석유의 약 3분의 1이 나오는 곳이에요. 이 지역 긴장이 커지면 국제 유가가 먼저 반응하고, 몇 주 뒤 주유소 기름값·항공권 유류할증료·물가로 번질 수 있어요. 원유의 약 70%를 중동에서 들여오는 한국은 특히 민감해요.', '이 지역 여행이나 경유 항공편이 있다면 외교부 해외안전여행의 여행경보 단계를 꼭 확인하세요.'],
    en: ['The Middle East produces about a third of the world’s oil. When tension rises there, crude prices react first, and within weeks that can show up in fuel prices, airline surcharges and inflation.', 'If you are travelling to or through the region, check your government’s travel advisories.'],
    ja: ['中東は世界の石油の約3分の1を産出しています。この地域の緊張が高まると原油価格がまず反応し、数週間でガソリン代や航空券の燃油サーチャージ、物価に表れることがあります。', 'この地域への旅行や経由便があるなら、政府の海外安全情報を必ず確認しましょう。'],
    zh: ['中东生产全球约三分之一的石油。该地区局势一紧张，国际油价会率先反应，几周内就可能体现在油价、机票燃油附加费和物价上。', '如需前往或途经该地区，请务必查看官方的出行安全提示。'],
    fr: ['Le Moyen-Orient produit environ un tiers du pétrole mondial. Quand la tension y monte, le brut réagit d’abord, puis en quelques semaines les prix à la pompe, les surcharges aériennes et l’inflation.', 'Si vous voyagez vers ou via la région, consultez les conseils aux voyageurs de votre gouvernement.'],
  },  {
    k: 'ukraine', w: 0.8, re: /\b(ukrain\w*|russia\w*|kremlin|putin|zelensk\w*|kyiv|moscow)\b/i,
    ko: ['러시아와 우크라이나는 밀·옥수수·해바라기유와 천연가스·비료를 많이 내다 파는 나라예요. 전쟁과 협상 흐름에 따라 곡물·에너지 값이 오르내리고, 그게 빵·라면·식용유 같은 장바구니 물가와 난방비로 이어질 수 있어요.', '휴전·평화 협상 소식이 나오면 유럽 가스값과 국제 곡물 가격이 먼저 움직이는지 보세요.'],
    en: ['Russia and Ukraine are major exporters of wheat, maize, sunflower oil, natural gas and fertiliser. The course of the war and peace talks moves grain and energy prices, which feed into grocery bills and heating costs.', 'When ceasefire or peace news breaks, watch European gas and global grain prices first.'],
    ja: ['ロシアとウクライナは小麦・トウモロコシ・ひまわり油、天然ガス・肥料の主要輸出国です。戦争や交渉の行方で穀物・エネルギー価格が上下し、パンや食用油など食卓の物価や暖房費につながります。', '停戦や和平交渉のニュースが出たら、欧州のガス価格と国際穀物価格の動きに注目しましょう。'],
    zh: ['俄罗斯和乌克兰是小麦、玉米、葵花籽油以及天然气和化肥的主要出口国。战争与谈判的走向会带动粮食和能源价格涨跌，进而影响面包、食用油等日常开支和取暖费用。', '一旦有停火或和谈消息，可以先看欧洲天然气和国际粮价的变化。'],
    fr: ['La Russie et l’Ukraine exportent beaucoup de blé, de maïs, d’huile de tournesol, de gaz et d’engrais. L’évolution de la guerre et des négociations fait bouger les prix des céréales et de l’énergie, et donc ceux du panier de courses et du chauffage.', 'En cas d’annonce de cessez-le-feu ou de paix, regardez d’abord le prix du gaz européen et des céréales.'],
  },  {
    k: 'us', w: 0.8, re: /\b(trump|white house|congress|senate|pentagon|hegseth|biden|republicans?|democrats?|washington)\b/i,
    ko: ['미국은 한국의 가장 큰 동맹이자 두 번째로 큰 수출 시장이에요. 미국 정부의 결정이 관세·방위비·환율로 이어지면 한국 경제와 안보에도 넓게 번져요. 다만 모든 미국 정치 소식이 그렇진 않아서, 실제 정책으로 이어지는지가 중요해요.', '관세·규제·예산 같은 실제 정책 변화로 이어지는지 후속 보도를 보세요.'],
    en: ['Decisions in Washington often spread abroad through tariffs, alliances and the dollar. Not every US political story does, though — what counts is whether it turns into actual policy.', 'Follow up on whether it leads to concrete changes in tariffs, regulation or spending.'],
    ja: ['米国政府の決定は、関税・同盟・ドルを通じて海外にも広がることがよくあります。ただ、すべての米政治ニュースがそうではなく、実際の政策につながるかが大切です。', '関税・規制・予算など、具体的な政策の変化につながるか続報を見ましょう。'],
    zh: ['美国政府的决定常通过关税、同盟关系和美元影响到其他国家。但并非所有美国政治新闻都会如此，关键要看是否变成实际政策。', '关注后续报道，看是否带来关税、监管或预算等具体政策变化。'],
    fr: ['Les décisions de Washington se propagent souvent à l’étranger via les droits de douane, les alliances et le dollar. Mais toute actualité politique américaine n’a pas cet effet : l’essentiel est de savoir si elle se traduit en politique concrète.', 'Suivez la suite pour voir si cela débouche sur des mesures concrètes (droits de douane, réglementation, budget).'],
  },  {
    k: 'elections', re: /\b(elections?|elected|vote[sd]?|voters?|referendum|parliament|coalition|sworn in|new government|prime minister|president-elect|presidency|presidential|cabinet|polls?)\b/i,
    ko: ['새 지도자나 정부가 들어서면 그 나라의 외교·무역 방향과 비자·여행 규정이 바뀔 수 있어요. 그 나라와 거래하는 기업이나 그곳에 사는 교민에게는 특히 중요한 변화예요.', '그 나라로 유학·이민·출장을 준비 중이라면 정책이 바뀌는지 챙겨 보세요.'],
    en: ['A new leader or government can shift a country’s foreign and trade policy, as well as its visa and travel rules. It matters most to businesses that trade with it and to people living there.', 'If you are planning to study, move or do business there, keep an eye on policy changes.'],
    ja: ['新しい指導者や政府が誕生すると、その国の外交・貿易の方針やビザ・旅行の規定が変わることがあります。その国と取引する企業や現地で暮らす人には特に重要です。', 'その国への留学・移住・出張を考えているなら、政策の変化をチェックしましょう。'],
    zh: ['新领导人或新政府上台，可能改变该国的外交和贸易方向，以及签证和旅行规定。对与该国做生意的企业和当地居民尤其重要。', '如果正准备去该国留学、移居或出差，请留意政策变化。'],
    fr: ['Un nouveau dirigeant ou gouvernement peut infléchir la politique étrangère et commerciale du pays, ainsi que ses règles de visa et de voyage. C’est surtout important pour les entreprises qui y commercent et pour ceux qui y vivent.', 'Si vous prévoyez d’y étudier, de vous y installer ou d’y travailler, suivez les changements de politique.'],
  },  {
    k: 'war', w: 0.75, re: /\b(war|missiles?|troops|military|air ?strikes?|invasion|ceasefire|truce|shelling|drones?|militants?|rebels?|insurgen\w*|clashes)\b/i,
    ko: ['무력 충돌은 그 지역 사람들의 삶을 가장 크게 흔들고, 멀리서도 에너지·곡물 값과 항로·항공편을 통해 영향이 번질 수 있어요.', '그 지역 여행·경유 계획이 있다면 외교부 해외안전여행의 여행경보 단계를 꼭 확인하세요.'],
    en: ['Armed conflict upends life for people in the region most of all, and its effects can travel far through energy and food prices and disrupted shipping routes and flights.', 'If you plan to travel to or through the area, check your government’s travel advisories.'],
    ja: ['武力衝突は何よりその地域の人々の暮らしを揺るがし、遠く離れていてもエネルギーや食料の価格、航路・航空便を通じて影響が広がることがあります。', 'その地域への旅行や経由の予定があるなら、政府の海外安全情報を必ず確認しましょう。'],
    zh: ['武装冲突首先冲击当地民众的生活，其影响还可能通过能源和粮食价格、航运和航班受阻波及远方。', '如计划前往或途经该地区，请务必查看官方的出行安全提示。'],
    fr: ['Un conflit armé bouleverse d’abord la vie des habitants, et ses effets peuvent voyager loin via les prix de l’énergie et de l’alimentation, ou les routes maritimes et aériennes perturbées.', 'Si vous comptez vous y rendre ou y transiter, consultez les conseils aux voyageurs.'],
  },
  {
    k: 'violence', re: /\b(shootings?|shot dead|gunman|gunmen|stabbing|terror\w*|massacre|mass killing|bomb(?:ing|ings|s)?|hostage)\b/i,
    ko: ['현지에서 일어난 사건이라 대부분 사람의 일상에 직접 영향은 크지 않아요. 다만 그 나라에 살거나 여행할 계획이라면 치안 상황을 확인해 볼 만해요.', '외교부 해외안전여행에서 그 나라의 여행경보를 확인하세요. 해외에서 위급하면 영사콜센터(+82-2-3210-0404)로 연락할 수 있어요.'],
    en: ['This happened locally, so for most people the direct effect on daily life is small. If you live in or plan to visit the country, it is worth checking the security situation.', 'Check your government’s travel advice for that country.'],
    ja: ['現地で起きた事件なので、多くの人の日常に直接の影響は大きくありません。ただ、その国に住んでいたり旅行の予定があったりするなら、治安情報を確認しておくとよいでしょう。', '政府の海外安全情報で、その国の危険レベルを確認しましょう。'],
    zh: ['事件发生在当地，对大多数人的日常生活直接影响不大。不过如果你在该国生活或计划前往，值得了解一下治安状况。', '请查看官方对该国的出行安全提示。'],
    fr: ['L’événement est local : pour la plupart des gens, l’effet direct sur le quotidien est faible. Si vous vivez dans le pays ou comptez y aller, mieux vaut vérifier la situation sécuritaire.', 'Consultez les conseils aux voyageurs de votre gouvernement pour ce pays.'],
  },
  {
    k: 'policy', re: /\b(laws?|bills?|bans?|banned|regulat\w*|governor|ruling|policy|reforms?|decree)\b/i,
    ko: ['다른 나라의 정치 결정이 당장 내 생활을 바꾸진 않아요. 하지만 법과 규제가 바뀌면 그곳에 사는 사람, 여행하는 사람, 그 나라와 거래하는 기업에는 실제 변화가 생겨요.', '그 나라에 갈 일이나 거래가 있다면 무엇이 언제부터 바뀌는지 확인해 보세요.'],
    en: ['Another country’s political decisions won’t change your life overnight. But new laws and rules make a real difference to residents, visitors and businesses dealing with that country.', 'If you travel or do business there, check what changes and when.'],
    ja: ['他国の政治的な決定がすぐに生活を変えるわけではありません。ただ、法律や規制が変われば、現地の住民や旅行者、その国と取引する企業には実際の変化が生じます。', 'その国へ行く用事や取引があるなら、何がいつから変わるか確認しましょう。'],
    zh: ['别国的政治决定不会立刻改变你的生活。但法律和规定一旦改变，当地居民、游客以及与该国往来的企业都会感受到实际变化。', '如果你要去该国或与其有业务往来，可以确认具体变化和生效时间。'],
    fr: ['Les décisions politiques d’un autre pays ne changent pas votre vie du jour au lendemain. Mais de nouvelles lois changent concrètement la donne pour les habitants, les visiteurs et les entreprises qui y travaillent.', 'Si vous y voyagez ou y faites des affaires, vérifiez ce qui change et à partir de quand.'],
  },
  {
    k: 'religion', re: /\b(pope|vatican|church|bishops?|religio\w*|mosque|imam|dalai lama)\b/i,
    ko: ['종교 지도자의 말과 행보가 내 생활을 직접 바꾸진 않지만, 전 세계 수많은 신자와 각국 정치·여론에 영향을 주는 목소리예요.', ''],
    en: ['Religious leaders’ words don’t change daily life directly, but they carry weight with huge numbers of believers and can sway politics and public opinion.', ''],
    ja: ['宗教指導者の言葉や行動が生活を直接変えるわけではありませんが、世界中の多くの信者や各国の政治・世論に影響を与える声です。', ''],
    zh: ['宗教领袖的言行不会直接改变日常生活，但对全球众多信众以及各国政治和舆论都有影响力。', ''],
    fr: ['Les paroles des chefs religieux ne changent pas directement le quotidien, mais elles comptent pour d’innombrables croyants et peuvent peser sur la politique et l’opinion.', ''],
  },
  {
    k: 'sports', re: /\b(football|soccer|olympic\w*|world cup|tournament|championship|cricket|tennis|atp|wta|grand slam|grand prix|formula (?:one|1)|f1|premier league|nba|nfl|ufc|boxing|marathon|golf)\b/i,
    ko: ['경기 결과가 생활을 바꾸진 않지만, 응원하는 선수나 팀이 있다면 놓치기 아까운 소식이에요.', ''],
    en: ['Results won’t change your daily life, but if you follow the sport or the team, it’s one not to miss.', ''],
    ja: ['試合結果が生活を変えるわけではありませんが、応援している選手やチームがいるなら見逃せないニュースです。', ''],
    zh: ['比赛结果不会改变生活，但如果你关注这项运动或这支球队，就别错过。', ''],
    fr: ['Le résultat ne changera pas votre quotidien, mais si vous suivez ce sport ou cette équipe, c’est à ne pas manquer.', ''],
  },

];

// '왜 중요한가' (데모): 이런 유형의 사건이 세계에서 왜 큰일인지 한 문장. [ko, en, ja, zh, fr]
const WHY = {
  nkorea: ['북한의 군사 행동과 외교는 동북아 전체의 안보 지형을 바꿀 수 있는 변수예요.', 'North Korea’s military and diplomatic moves can reshape security across Northeast Asia.', '北朝鮮の軍事行動や外交は、北東アジア全体の安全保障を左右しかねない要素です。', '朝鲜的军事行动和外交可能改变整个东北亚的安全格局。', 'Les gestes militaires et diplomatiques de la Corée du Nord peuvent redessiner la sécurité en Asie du Nord-Est.'],
  korea: ['한국은 반도체·자동차·배터리 공급망의 핵심이라, 한국의 변화는 세계 산업에도 번져요.', 'South Korea sits at the heart of chip, car and battery supply chains, so changes there ripple through global industry.', '韓国は半導体・自動車・電池の供給網の要で、その変化は世界の産業にも波及します。', '韩国处在芯片、汽车和电池供应链的核心，其变化会波及全球产业。', 'La Corée du Sud est au cœur des chaînes des puces, de l’automobile et des batteries : ce qui s’y passe se répercute sur l’industrie mondiale.'],
  chips: ['반도체는 AI·스마트폰·자동차를 움직이는 핵심 부품이라, 반도체를 둘러싼 갈등은 기술 패권 경쟁의 최전선이에요.', 'Chips power AI, phones and cars, so fights over them are the front line of the global tech race.', '半導体はAI・スマホ・自動車を動かす中核部品で、それをめぐる対立は技術覇権争いの最前線です。', '芯片驱动着人工智能、手机和汽车，围绕芯片的争夺是全球科技竞争的最前线。', 'Les puces font tourner l’IA, les téléphones et les voitures : les luttes à leur sujet sont la ligne de front de la course technologique.'],
  arts: ['문화계의 큰 소식은 지금 사람들이 무엇에 공감하고 무엇을 고민하는지 보여 주는 거울이에요.', 'Big cultural news is a mirror of what people are moved by and worried about right now.', '文化界の大きなニュースは、いま人々が何に共感し何に悩んでいるかを映す鏡です。', '文化界的大新闻，是映照人们当下共鸣与困惑的一面镜子。', 'Les grandes nouvelles culturelles reflètent ce qui touche et inquiète les gens aujourd’hui.'],
  ai: ['AI는 산업과 일자리, 정보의 신뢰까지 바꾸고 있어서, 규칙과 경쟁이 어떻게 정해지느냐가 앞으로 수십 년을 좌우해요.', 'AI is reshaping industries, jobs and trust in information, so how its rules and competition are settled will shape decades to come.', 'AIは産業や雇用、情報の信頼性まで変えつつあり、ルールと競争の行方が今後数十年を左右します。', '人工智能正在改变产业、就业乃至信息的可信度，规则和竞争如何确定将影响未来几十年。', 'L’IA transforme l’industrie, l’emploi et la confiance dans l’information : ses règles et sa concurrence pèseront pour des décennies.'],
  cyber: ['사이버 공격은 총 한 발 없이 전기·병원·금융 같은 기반 시설을 멈출 수 있어, 새로운 전쟁터가 됐어요.', 'Cyberattacks can shut down power grids, hospitals and banks without a shot fired — it has become a new battlefield.', 'サイバー攻撃は一発の銃弾もなく電力・病院・金融などのインフラを止められ、新たな戦場になっています。', '网络攻击不费一枪一弹就能让电网、医院和金融系统瘫痪，已成为新的战场。', 'Les cyberattaques peuvent paralyser réseaux électriques, hôpitaux et banques sans un coup de feu : c’est devenu un nouveau champ de bataille.'],
  spy: ['간첩·공작 사건은 나라 사이의 불신이 어디까지 깊어졌는지 보여 주고, 외교 갈등의 불씨가 되곤 해요.', 'Spy and sabotage cases reveal how deep mistrust between countries runs, and often spark diplomatic rows.', 'スパイや工作の事件は国家間の不信の深さを示し、外交摩擦の火種になりがちです。', '间谍和破坏事件显示出国家间不信任之深，常常成为外交冲突的导火索。', 'Les affaires d’espionnage montrent la profondeur de la défiance entre États et déclenchent souvent des crises diplomatiques.'],
  rates: ['큰 나라의 금리는 전 세계 돈의 흐름을 바꿔, 다른 나라의 환율·집값·주가까지 움직여요.', 'Interest rates in big economies redirect money worldwide, moving currencies, house prices and stocks everywhere.', '大国の金利は世界のお金の流れを変え、他国の為替・住宅価格・株価まで動かします。', '大国的利率会改变全球资金流向，牵动其他国家的汇率、房价和股价。', 'Les taux des grandes économies réorientent l’argent du monde entier et font bouger devises, immobilier et Bourses partout.'],
  trade: ['무역 갈등은 수십 년 동안 쌓아 온 세계 공급망을 다시 짜게 만들 만큼 파급력이 커요.', 'Trade disputes are powerful enough to force a rewiring of supply chains built over decades.', '貿易摩擦は、数十年かけて築かれた世界の供給網を組み直させるほどの影響力があります。', '贸易冲突的影响之大，足以迫使几十年建立起来的全球供应链重新布局。', 'Les conflits commerciaux peuvent forcer à recomposer des chaînes d’approvisionnement bâties pendant des décennies.'],
  energy: ['에너지는 모든 경제 활동의 바탕이라, 공급이 흔들리면 물가와 경기 전체가 흔들려요.', 'Energy underpins all economic activity; when supply wobbles, prices and growth wobble with it.', 'エネルギーはあらゆる経済活動の土台で、供給が揺らげば物価と景気全体が揺らぎます。', '能源是一切经济活动的基础，供应一旦动摇，物价和整体经济都会随之动摇。', 'L’énergie est à la base de toute activité économique : quand l’offre vacille, les prix et la croissance vacillent aussi.'],
  markets: ['세계 시장은 서로 이어져 있어, 한 곳의 충격이 몇 시간 만에 전 세계로 번질 수 있어요.', 'Global markets are linked, so a shock in one place can spread worldwide within hours.', '世界の市場はつながっていて、一か所の衝撃が数時間で世界中に広がることがあります。', '全球市场相互关联，一处的冲击可能在几小时内蔓延到全世界。', 'Les marchés mondiaux sont liés : un choc à un endroit peut se propager partout en quelques heures.'],
  company: ['거대 기업의 결정은 한 나라 경제만큼 큰 영향을 줄 때가 있어서, 그 방향이 업계 전체의 규칙이 되곤 해요.', 'Decisions by giant companies can weigh as much as a national economy and often set the rules for a whole industry.', '巨大企業の決定は一国の経済並みの影響を持つことがあり、その方向が業界全体のルールになりがちです。', '巨头企业的决定有时影响力堪比一国经济，其方向往往成为整个行业的规则。', 'Les décisions des géants pèsent parfois autant qu’une économie nationale et fixent souvent les règles de tout un secteur.'],
  disaster: ['큰 재해는 많은 사람의 생명과 삶터를 앗아 가고, 회복에 몇 년이 걸리기도 해요. 기후 변화로 이런 재해가 잦아지고 있어요.', 'Major disasters cost lives and homes and can take years to recover from — and climate change is making them more frequent.', '大きな災害は多くの命と暮らしを奪い、復旧に何年もかかることがあります。気候変動でこうした災害は増えています。', '重大灾害夺走许多生命和家园，恢复可能需要数年，而气候变化正让这类灾害愈发频繁。', 'Les grandes catastrophes coûtent des vies et des foyers, et la reconstruction peut prendre des années — le changement climatique les rend plus fréquentes.'],
  health: ['감염병은 초기에 막지 못하면 국경을 넘어 퍼지기 쉬워, 세계가 함께 지켜보는 사안이에요.', 'If not contained early, infectious diseases easily cross borders, which is why the whole world watches.', '感染症は初期に抑えられなければ国境を越えて広がりやすく、世界が注視する問題です。', '传染病若不及早控制，很容易跨境传播，因此全世界都在关注。', 'Faute d’être contenues tôt, les maladies infectieuses franchissent facilement les frontières : le monde entier surveille.'],
  climate: ['기후 문제는 어느 한 나라가 혼자 풀 수 없어서, 나라들 사이의 약속과 실천이 모두의 미래를 정해요.', 'No country can solve climate change alone, so what nations promise and deliver together shapes everyone’s future.', '気候問題は一国だけでは解決できず、国同士の約束と実行が皆の未来を決めます。', '气候问题无法由一国单独解决，各国之间的承诺与行动决定着所有人的未来。', 'Aucun pays ne peut régler seul le climat : ce que les États promettent et font ensemble décide de l’avenir de tous.'],
  space: ['과학의 큰 발견과 우주 탐사는 인류가 할 수 있는 일의 한계를 넓히고, 나라 사이의 기술 경쟁에서도 중요한 무대예요.', 'Major discoveries and space missions push the limits of what humanity can do, and are a key arena of technological rivalry.', '科学の大発見や宇宙探査は人類にできることの限界を広げ、国家間の技術競争でも重要な舞台です。', '重大科学发现和太空探索拓展了人类能力的边界，也是国家间科技竞争的重要舞台。', 'Les grandes découvertes et missions spatiales repoussent les limites de l’humanité et sont un terrain clé de la rivalité technologique.'],
  migration: ['이주와 난민 문제는 여러 나라의 선거와 정치를 흔드는 큰 쟁점이에요.', 'Migration and refugees are among the issues swinging elections and politics in many countries.', '移民・難民の問題は、多くの国の選挙や政治を揺るがす大きな争点です。', '移民和难民问题是左右许多国家选举和政治的重大议题。', 'Les migrations et les réfugiés font partie des sujets qui font basculer élections et politique dans de nombreux pays.'],
  transport: ['큰 교통 사고와 운항 차질은 안전 기준과 교통 정책을 다시 들여다보게 만들어요.', 'Major transport accidents and disruptions force a fresh look at safety standards and transport policy.', '大きな交通事故や運航の乱れは、安全基準や交通政策を見直すきっかけになります。', '重大交通事故和运营中断会促使人们重新审视安全标准和交通政策。', 'Les grands accidents et perturbations de transport obligent à revoir normes de sécurité et politiques de transport.'],
  accident: ['많은 사람이 다친 사고는 그 나라의 안전 관리 수준을 드러내고, 책임과 재발 방지가 큰 쟁점이 돼요.', 'Accidents with many casualties expose a country’s safety standards and raise hard questions about accountability.', '多くの死傷者が出た事故は、その国の安全管理の水準を浮き彫りにし、責任と再発防止が大きな争点になります。', '造成大量伤亡的事故暴露出一个国家的安全管理水平，责任追究和防止再发成为焦点。', 'Les accidents faisant de nombreuses victimes révèlent le niveau de sécurité d’un pays et posent la question des responsabilités.'],
  court: ['유명인이나 권력자를 둘러싼 재판은 그 사회의 법이 모두에게 똑같이 적용되는지를 보여 줘요.', 'Trials involving famous or powerful people show whether the law applies equally to everyone.', '有名人や権力者をめぐる裁判は、その社会の法がすべての人に平等に適用されるかを示します。', '涉及名人或权贵的审判，显示出当地法律是否对所有人一视同仁。', 'Les procès de personnalités ou de puissants montrent si la loi s’applique à tous de la même façon.'],
  mideast: ['중동은 에너지 공급과 여러 강대국의 이해가 얽힌 곳이라, 작은 충돌도 더 큰 전쟁으로 번질 위험이 있어요.', 'The Middle East is where energy supply and great-power interests collide, so even small clashes risk spiralling into wider war.', '中東はエネルギー供給と大国の利害が絡み合う地域で、小さな衝突でも大きな戦争に広がる危険があります。', '中东交织着能源供应和大国利益，即便是小冲突也有升级为更大战争的风险。', 'Au Moyen-Orient se mêlent énergie et intérêts des grandes puissances : le moindre affrontement risque de dégénérer.'],
  ukraine: ['러시아-우크라이나 전쟁은 유럽 안보와 미국·러시아·유럽의 관계를 다시 짜고 있는, 지금 세계 질서의 가장 큰 변수 중 하나예요.', 'The Russia–Ukraine war is reshaping European security and relations between the US, Russia and Europe — one of the biggest forces in today’s world order.', 'ロシア・ウクライナ戦争は欧州の安全保障と米ロ欧の関係を組み替えつつあり、いまの世界秩序で最大級の要素の一つです。', '俄乌战争正在重塑欧洲安全以及美俄欧关系，是当今世界秩序中最大的变量之一。', 'La guerre russo-ukrainienne redessine la sécurité européenne et les relations entre États-Unis, Russie et Europe : l’un des grands moteurs de l’ordre mondial actuel.'],
  us: ['미국은 세계 최대 경제이자 군사 강국이라, 미국 정치의 변화는 동맹과 무역을 통해 세계로 번져요.', 'As the world’s largest economy and military power, shifts in US politics spread worldwide through alliances and trade.', '米国は世界最大の経済・軍事大国で、米国政治の変化は同盟と貿易を通じて世界に広がります。', '美国是世界最大的经济和军事强国，美国政治的变化会通过同盟和贸易传导到全世界。', 'Première économie et première puissance militaire, les États-Unis propagent leurs changements politiques au monde via alliances et commerce.'],
  elections: ['선거와 정권 교체는 한 나라가 앞으로 몇 년 동안 어떤 길을 갈지 정하는 갈림길이에요.', 'Elections and changes of government decide which path a country will take for years to come.', '選挙や政権交代は、その国がこれから数年どの道を進むかを決める分かれ道です。', '选举和政府更迭是决定一个国家未来几年走向的十字路口。', 'Élections et alternances décident de la voie qu’un pays suivra pour les années à venir.'],
  war: ['무력 충돌은 무엇보다 많은 사람의 생명을 위협하고, 주변 지역으로 번지면 국제 질서 전체를 흔들 수 있어요.', 'Armed conflict above all threatens many lives, and if it spreads it can shake the wider international order.', '武力衝突は何より多くの命を脅かし、周辺に広がれば国際秩序全体を揺るがしかねません。', '武装冲突首先威胁众多生命，一旦蔓延还可能动摇整个国际秩序。', 'Un conflit armé menace avant tout de nombreuses vies et, s’il s’étend, peut ébranler l’ordre international.'],
  violence: ['무고한 사람이 희생된 사건은 그 사회의 치안과 총기·테러 대책을 둘러싼 논쟁을 다시 불러와요.', 'Attacks on innocent people reopen debates over security, guns and counter-terrorism.', '罪のない人が犠牲になった事件は、治安や銃・テロ対策をめぐる議論を再燃させます。', '无辜民众遇害的事件，会再度引发围绕治安、枪支和反恐措施的争论。', 'Les attaques contre des innocents relancent les débats sur la sécurité, les armes et l’antiterrorisme.'],
  policy: ['새 법과 정책은 그 사회의 방향을 보여 주고, 다른 나라가 따라 하거나 반발하는 기준이 되기도 해요.', 'New laws and policies show where a society is heading, and can become a model — or a target — for other countries.', '新しい法律や政策はその社会の方向を示し、他国が手本にしたり反発したりする基準にもなります。', '新的法律和政策显示出社会的走向，也可能成为别国效仿或反对的参照。', 'Les nouvelles lois montrent la direction d’une société et peuvent servir de modèle — ou de repoussoir — à d’autres pays.'],
  religion: ['종교 지도자의 목소리는 수억 명의 신자에게 닿기 때문에, 정치와 사회 논쟁에도 큰 무게를 가져요.', 'Religious leaders reach hundreds of millions of believers, giving their words real weight in political and social debates.', '宗教指導者の声は何億人もの信者に届くため、政治や社会の議論にも大きな重みを持ちます。', '宗教领袖的声音能传达给数以亿计的信众，因此在政治和社会议题上分量很重。', 'Les chefs religieux s’adressent à des centaines de millions de fidèles : leur parole pèse dans les débats politiques et sociaux.'],
  sports: ['큰 경기와 스타 선수의 소식은 나라를 넘어 수많은 사람을 함께 웃고 울게 만들어요.', 'Big matches and star athletes bring huge numbers of people together across borders.', '大きな試合やスター選手のニュースは、国を越えて多くの人を一緒に笑わせ、泣かせます。', '重大赛事和明星运动员的消息，能让无数人跨越国界同喜同悲。', 'Les grands matchs et les stars du sport rassemblent d’immenses foules par-delà les frontières.'],
};
const LANG_IDX = { ko: 0, en: 1, ja: 2, zh: 3, fr: 4 };
export const whyFor = (kind, lang = 'ko') => WHY[kind]?.[LANG_IDX[lang] ?? 1] || '';

// 아무 유형에도 안 걸릴 때: 사건 주제(카테고리)로 대신
const BY_CATEGORY = { politics: 'policy', conflict: 'war', economy: 'markets', tech: 'space', climate: 'disaster', health: 'health' }; // 사회·문화는 범위가 넓어 억지로 붙이지 않음

const NONE = {
  ko: '당장 일상에 주는 직접 영향은 크지 않아 보여요. 다만 세계가 어디로 흘러가는지 이해하는 데 도움이 되는 소식이에요.',
  en: 'It may not affect daily life directly for now, but it helps to understand where the world is heading.',
  ja: '今すぐ日常生活に直接影響することはなさそうです。ただ、世界の流れを理解するのに役立つニュースです。',
  zh: '目前对日常生活似乎没有直接影响，但有助于了解世界的走向。',
  fr: 'Pas d’effet direct sur le quotidien pour l’instant, mais une information utile pour comprendre l’évolution du monde.',
};

// articles: 원문 { title, summary }, category: guessCategory 결과
export function guessImpact(articles, lang = 'ko', category = 'other') {
  const n = articles.length || 1;
  let best = null, bestScore = 0;
  for (const s of S) {
    const hit = (t) => s.re.test(t) && (!s.need || s.need.test(t));
    // 제목에 한 번도 안 나오면 그 유형으로 보지 않음 (요약에 스친 낱말로 엉뚱한 설명이 붙지 않게)
    let score = 0, titled = 0;
    for (const a of articles) {
      if (hit(a.title || '')) { score += 1; titled++; }
      else if (hit(a.summary || '')) score += 0.25;
    }
    score = titled ? score / n : 0;
    score *= s.w || 1; // 나라·지역 이름만으로 고른 유형은 조금 덜 믿음 → '러시아 간첩'은 우크라이나 전쟁이 아니라 간첩 사건으로
    if (score > bestScore) { best = s; bestScore = score; }
  }
  // 기사 다섯 개 중 하나 정도는 제목에 그 낱말이 있어야 믿음
  if (bestScore < 0.2) best = S.find((s) => s.k === BY_CATEGORY[category]) || null;
  if (!best) return { text: NONE[lang], tip: '', kind: 'none' };
  const [text, tip] = best[lang] || best.en;
  return { text, tip, kind: best.k };
}
