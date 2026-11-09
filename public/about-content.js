// 서비스 소개 페이지 내용 (5개 언어). 구조는 같고 글만 다름.
(() => {
  const D = {
    ko: {
      eyebrow: '서비스 소개',
      title: 'WorldLens — 세상의 조각들을 연결하다',
      lead: '세계 곳곳의 뉴스는 나라마다 조각나 있어요. WorldLens는 그 조각들을 모아 하나의 사건으로 잇고, 각 나라가 그 사건을 어떻게 보고 있는지 나란히 보여 드립니다.',
      toc: ['개요', '문제', '차별점', '뉴스 수집', '중립성', '관점과 가설', '스토리', '매일 업데이트', '사건 관리', 'MVP와 계획'],
      s: [
        ['서비스 개요 및 탄생 배경', `<p>WorldLens는 여러 나라 언론의 보도를 한곳에 모아, 같은 사건을 서로 다른 시선으로 비교해 볼 수 있게 해 주는 세계 뉴스 서비스입니다.</p>
          <p>국제 뉴스를 제대로 이해하려면 여러 나라 언론을 직접 찾아 읽어야 해요. 하지만 언어도 다르고, 매체도 너무 많고, 사건은 며칠에 걸쳐 조금씩 바뀝니다. 대부분은 결국 한두 매체의 시각만 접하게 되죠. WorldLens는 "바쁜 사람도 세계를 균형 있게 이해할 수 있으면 좋겠다"는 생각에서 출발했습니다.</p>`],
        ['해결하려는 문제', `<ul><li><b>정보가 흩어져 있어요.</b> 한 사건의 보도가 수십 개 매체에 나뉘어 있어 전체 그림을 보기 어려워요.</li>
          <li><b>한쪽 시각에 갇히기 쉬워요.</b> 보는 매체가 정해져 있으면 다른 나라가 이 사건을 어떻게 보는지 알 기회가 없어요.</li>
          <li><b>맥락이 빠져 있어요.</b> 속보는 "무슨 일이"만 알려 주고 "왜", "그래서 어떻게"는 잘 알려 주지 않아요.</li>
          <li><b>언어와 시간의 벽이 있어요.</b> 매일 여러 나라 뉴스를 외국어로 찾아 읽을 여유가 있는 사람은 많지 않아요.</li></ul>`],
        ['핵심 컨셉과 차별점', `<p>핵심 컨셉은 <b>"렌즈"</b>예요. 한 사건을 여러 나라의 렌즈로 겹쳐 보면, 어디까지가 모두가 인정하는 사실이고 어디부터가 해석인지 드러납니다.</p>`,
          { head: ['', '일반 뉴스 앱', 'WorldLens'], rows: [['단위', '기사 하나하나', "여러 기사를 묶은 '사건'"], ['시각', '한 매체 또는 한 나라', '여러 나라 매체를 나란히 비교'], ['설명', '속보 위주', '배경·의미·전망까지 이야기로'], ['투명성', '출처 구분이 약함', '사실마다 출처, 국영 매체 표시, 가설에는 확신도'], ['언어', '한 가지 언어', '한국어·영어·일본어·중국어·프랑스어']] }],
        ['글로벌 뉴스 수집 및 통합 시스템', `<p>지금은 한국, 일본, 중국, 홍콩, 인도, 카타르, 튀르키예, 러시아, 영국, 독일, 프랑스, 미국, 우루과이, 호주, 아프리카 종합 매체까지 16개 언론사의 공개 RSS를 매시간 수집해요.</p>`,
          { flow: [['① 수집', '각 언론사 RSS에서 제목·요약·링크를 가져와요'], ['② 정리·번역', '중복 기사를 걸러내고 5개 언어로 번역해요'], ['③ 묶기', '핵심 단어가 겹치는 기사를 같은 사건으로 묶어요'], ['④ 분석', '사건마다 사실·관점·가설·스토리를 만들어요']] },
          `<p>일부 매체가 응답하지 않아도 나머지 매체로 계속 동작해요. 기사 전문은 저장하지 않고, 원문은 언제나 언론사 링크로 연결합니다.</p>`],
        ['AI 분석 및 중립성 확보 구조', `<p>AI가 "정답"을 말해 주는 대신, 독자가 스스로 판단할 수 있게 재료를 정리하는 것이 목표예요. 그래서 분석에 다음 원칙을 고정해 두었어요.</p>
          <ul><li><b>사실과 해석을 나눠요.</b> '확인된 사실'에는 서로 다른 매체 2곳 이상이 함께 보도한 내용만 넣어요.</li>
          <li><b>모든 문장에 출처를 달아요.</b> 어느 매체가 그렇게 보도했는지 함께 보여 드려요.</li>
          <li><b>기본 시각을 두지 않아요.</b> 어느 한 나라의 시각을 기준으로 삼지 않고, 매체마다 강조한 점과 덜 다룬 점을 비교해요.</li>
          <li><b>국영 매체를 표시해요.</b> 정부가 운영하는 매체는 공식 입장이 반영될 수 있다는 점을 알 수 있게 해요.</li>
          <li><b>보도 국가 수를 보여 줘요.</b> 한쪽에서만 크게 다룬 이야기인지 알 수 있게 해요.</li></ul>`],
        ['국가별 관점과 가설 제시 방식', `<p><b>나라별 관점</b>에서는 매체마다 이 사건을 어떤 말로 소개했고, 무엇을 가장 강조했는지 한두 문장으로 보여 드려요. 맨 위에는 "나라마다 무엇이 다를까"를 따로 정리해요.</p>
          <p><b>가설</b>은 "왜 이런 일이 일어났을까"와 "앞으로 어떻게 될까" 두 가지로 나눠 2~3개를 제시해요. 가설마다 근거가 된 보도와 확신도(낮음·중간·높음)를 붙이고, 확정된 사실이 아니라는 점을 분명히 밝혀요.</p>`],
        ['스토리텔링 콘텐츠 구성', `<p>뉴스를 처음 접하는 사람도 3분 안에 이해할 수 있도록, 모든 사건을 같은 네 단계 이야기로 풀어요.</p>`,
          { flow: [['배경', '이 일은 어디서부터 시작됐나'], ['무슨 일이', '지금 실제로 일어난 일'], ['왜 중요한가', '나와 세계에 어떤 의미가 있나'], ['앞으로 볼 것', '다음에 지켜볼 지점']] },
          '<p>문장은 짧게, 전문 용어는 처음 나올 때 풀어서 씁니다.</p>'],
        ['실시간 뉴스 수집 및 매일 업데이트 구조', `<ul><li><b>매시간</b> 새 기사를 수집하고 사건에 이어 붙여요.</li>
          <li><b>몇 시간마다</b> 새 기사가 충분히 쌓인 사건만 다시 분석해요. 바뀐 게 없으면 다시 분석하지 않아 비용을 아껴요.</li>
          <li><b>매일 아침 7시</b> 그날 가장 많이 보도된 사건으로 '오늘의 세계 브리핑'을 만들어요.</li>
          <li>급할 때는 화면 위의 <b>새로고침</b> 버튼으로 바로 갱신할 수 있어요.</li></ul>`],
        ['사건별 관리와 세계 정세 통합 시스템', `<p>WorldLens의 기본 단위는 기사가 아니라 <b>사건</b>이에요. 사건은 한 번 만들어지면 계속 유지되고, 며칠에 걸쳐 새 보도가 이어 붙어 타임라인이 됩니다. 표현만 달라 둘로 나뉜 사건은 자동으로 합쳐요.</p>
          <p>홈 화면에서는 아시아·유럽·중동·미주·아프리카·오세아니아별로 사건이 얼마나 있는지 한눈에 보여 드리고, 여러 나라가 함께 보도한 사건일수록 위에 놓아요.</p>`],
        ['MVP 개발 방향 및 향후 확장 계획', `<p><b>지금(MVP)</b>은 "여러 나라 보도를 사건으로 묶어 비교한다"는 핵심 경험을 검증하는 단계예요. 각국 매체의 영어판을 모아 5개 언어로 보여 드립니다.</p>
          <p><b>다음 단계</b></p>
          <ul><li>각 나라 자국어판 매체 추가 (영어판에 없는 시각까지)</li><li>관심 사건 구독과 새 소식 알림</li><li>사건 간 연결 지도 — 서로 영향을 주는 사건을 이어서 보기</li><li>매체별 보도 성향을 장기간 비교하는 편향 지표</li><li>인터넷 배포와 모바일 앱</li></ul>`],
      ],
    },
    en: {
      eyebrow: 'About',
      title: 'WorldLens — Connecting the pieces of the world',
      lead: 'News about the world is scattered country by country. WorldLens gathers those pieces into a single event and shows, side by side, how each country sees it.',
      toc: ['Overview', 'Problem', 'What’s different', 'Collection', 'Neutrality', 'Views & hypotheses', 'Story', 'Daily updates', 'Events', 'MVP & roadmap'],
      s: [
        ['Overview and origin', `<p>WorldLens is a world news service that brings together coverage from media in many countries, so you can compare the same event through different eyes.</p>
          <p>To really understand international news, you would have to read media from many countries yourself. But the languages differ, there are too many outlets, and stories shift over days. Most people end up seeing just one or two outlets’ view. WorldLens started from a simple wish: that busy people could understand the world in a balanced way.</p>`],
        ['The problem', `<ul><li><b>Information is scattered.</b> Coverage of one event is split across dozens of outlets, so the full picture is hard to see.</li>
          <li><b>It’s easy to get stuck in one view.</b> If you always read the same outlets, you never learn how other countries see the event.</li>
          <li><b>Context is missing.</b> Breaking news tells you what happened, but rarely why, or what comes next.</li>
          <li><b>Language and time are barriers.</b> Few people can read foreign-language news from many countries every day.</li></ul>`],
        ['Core concept and what’s different', `<p>The core concept is a <b>lens</b>. When you look at an event through several countries’ lenses at once, it becomes clear what everyone agrees is fact and where interpretation begins.</p>`,
          { head: ['', 'Typical news app', 'WorldLens'], rows: [['Unit', 'Individual articles', 'Events made of many articles'], ['Viewpoint', 'One outlet or one country', 'Many countries’ media side by side'], ['Explanation', 'Mostly breaking news', 'Background, meaning and outlook as a story'], ['Transparency', 'Sources often unclear', 'Sources for every fact, state-media labels, confidence on hypotheses'], ['Language', 'One language', 'Korean, English, Japanese, Chinese, French']] }],
        ['Global news collection', `<p>We currently collect public RSS feeds from 16 outlets every hour — from South Korea, Japan, China, Hong Kong, India, Qatar, Türkiye, Russia, the UK, Germany, France, the US, Uruguay, Australia and a pan-African outlet.</p>`,
          { flow: [['① Collect', 'Titles, summaries and links from each outlet’s RSS'], ['② Clean & translate', 'Remove duplicates and translate into 5 languages'], ['③ Group', 'Articles sharing key words become one event'], ['④ Analyse', 'Facts, perspectives, hypotheses and a story for each event']] },
          '<p>If some outlets don’t respond, the rest keep working. We never store full articles — originals are always linked on the publisher’s site.</p>'],
        ['AI analysis and neutrality', `<p>Instead of giving you “the answer”, the AI organises the material so you can judge for yourself. These rules are fixed in every analysis:</p>
          <ul><li><b>Separate fact from interpretation.</b> “Confirmed facts” only include what at least two different outlets reported.</li>
          <li><b>Cite every statement.</b> We show which outlet reported what.</li>
          <li><b>No default viewpoint.</b> No country’s view is the baseline; we compare what each outlet stresses and what it plays down.</li>
          <li><b>Label state media.</b> Government-run outlets may reflect official positions, and we say so.</li>
          <li><b>Show how many countries reported it.</b> So you can tell whether a story is big everywhere or only in one place.</li></ul>`],
        ['Country perspectives and hypotheses', `<p><b>By country</b> shows, in a sentence or two, how each outlet framed the event and what it stressed most. A summary at the top explains how the coverage differs.</p>
          <p><b>Hypotheses</b> come in two kinds — “why did this happen?” and “what comes next?” — two or three in all. Each one cites the coverage it rests on and carries a confidence level (low, medium, high), and we make clear they are not established facts.</p>`],
        ['Storytelling', `<p>So that anyone can understand an event in three minutes, every event is told in the same four steps.</p>`,
          { flow: [['Background', 'Where did this start?'], ['What happened', 'What actually happened now'], ['Why it matters', 'What it means for you and the world'], ['What to watch', 'What to look out for next']] },
          '<p>Sentences are short, and technical terms are explained the first time they appear.</p>'],
        ['Real-time collection and daily updates', `<ul><li><b>Every hour</b>, new articles are collected and attached to events.</li>
          <li><b>Every few hours</b>, only events with enough new coverage are re-analysed — nothing changes, nothing is re-run, which keeps costs down.</li>
          <li><b>Every morning at 7</b>, “Today’s world briefing” is built from the day’s most-covered events.</li>
          <li>Need it now? Use the <b>Refresh</b> button at the top.</li></ul>`],
        ['Event tracking and the world at a glance', `<p>The basic unit of WorldLens is the <b>event</b>, not the article. Once created, an event persists and new coverage is attached over days, forming a timeline. Events split in two only because of different wording are merged automatically.</p>
          <p>The home page shows at a glance how many events there are in Asia, Europe, the Middle East, the Americas, Africa and Oceania, and puts events covered by more countries first.</p>`],
        ['MVP direction and roadmap', `<p><b>Now (MVP)</b> we are testing the core experience: grouping coverage from many countries into events and comparing it. We collect the English editions of each country’s media and show them in five languages.</p>
          <p><b>Next steps</b></p>
          <ul><li>Native-language outlets in each country (for views missing from English editions)</li><li>Follow events and get notified of updates</li><li>A map of connected events — see how events influence each other</li><li>Long-term bias indicators comparing outlets’ coverage</li><li>Public launch and a mobile app</li></ul>`],
      ],
    },
    ja: {
      eyebrow: 'サービス紹介',
      title: 'WorldLens — 世界のかけらをつなぐ',
      lead: '世界のニュースは国ごとにばらばらです。WorldLensはそのかけらを集めてひとつの出来事としてつなぎ、各国がそれをどう見ているかを並べて見せます。',
      toc: ['概要', '課題', '違い', 'ニュース収集', '中立性', '視点と仮説', 'ストーリー', '毎日の更新', '出来事の管理', 'MVPと計画'],
      s: [
        ['サービス概要と誕生の背景', `<p>WorldLensは、さまざまな国のメディアの報道を一か所に集め、同じ出来事を異なる視点で比べられる世界ニュースサービスです。</p>
          <p>国際ニュースをきちんと理解するには、多くの国のメディアを自分で探して読む必要があります。しかし言語は違い、メディアは多すぎ、出来事は数日かけて少しずつ変わります。結局、一つか二つのメディアの見方しか知らないことがほとんどです。WorldLensは「忙しい人でも世界をバランスよく理解できたら」という思いから生まれました。</p>`],
        ['解決したい課題', `<ul><li><b>情報が散らばっている。</b> 一つの出来事の報道が何十ものメディアに分かれ、全体像が見えにくい。</li>
          <li><b>一つの視点にとらわれやすい。</b> いつも同じメディアだけを見ていると、他の国がどう見ているかを知る機会がない。</li>
          <li><b>文脈が欠けている。</b> 速報は「何が起きたか」は伝えても、「なぜ」「この先どうなるか」はあまり伝えない。</li>
          <li><b>言語と時間の壁。</b> 毎日、外国語で各国のニュースを読む余裕のある人は多くない。</li></ul>`],
        ['コアコンセプトと違い', `<p>コアコンセプトは<b>「レンズ」</b>です。一つの出来事を複数の国のレンズで重ねて見ると、どこまでが皆が認める事実で、どこからが解釈なのかが見えてきます。</p>`,
          { head: ['', '一般的なニュースアプリ', 'WorldLens'], rows: [['単位', '記事一つひとつ', '複数の記事をまとめた「出来事」'], ['視点', '一つのメディアや一つの国', '各国のメディアを並べて比較'], ['説明', '速報中心', '背景・意味・見通しまでストーリーで'], ['透明性', '出典の区別が弱い', '事実ごとの出典、国営メディア表示、仮説には確信度'], ['言語', '一つの言語', '韓国語・英語・日本語・中国語・フランス語']] }],
        ['グローバルニュース収集・統合システム', `<p>現在、韓国、日本、中国、香港、インド、カタール、トルコ、ロシア、イギリス、ドイツ、フランス、アメリカ、ウルグアイ、オーストラリア、アフリカ総合メディアまで、16の報道機関の公開RSSを1時間ごとに収集しています。</p>`,
          { flow: [['① 収集', '各メディアのRSSから見出し・要約・リンクを取得'], ['② 整理・翻訳', '重複を除き、5言語に翻訳'], ['③ まとめる', 'キーワードが重なる記事を同じ出来事に'], ['④ 分析', '出来事ごとに事実・視点・仮説・ストーリーを作成']] },
          '<p>一部のメディアが応答しなくても、残りで動き続けます。記事全文は保存せず、原文は常に報道機関のリンクで案内します。</p>'],
        ['AI分析と中立性を保つ仕組み', `<p>AIが「正解」を示すのではなく、読者が自分で判断できるよう材料を整理することが目的です。そのため、分析には次の原則を固定しています。</p>
          <ul><li><b>事実と解釈を分ける。</b>「確認された事実」には、異なる2つ以上のメディアが共に報じた内容だけを入れます。</li>
          <li><b>すべての文に出典をつける。</b> どのメディアがそう報じたかを示します。</li>
          <li><b>基準となる視点を置かない。</b> 特定の国の見方を基準にせず、各メディアが強調した点と扱いが小さい点を比べます。</li>
          <li><b>国営メディアを表示する。</b> 政府が運営するメディアは公式の立場が反映されうることがわかるようにします。</li>
          <li><b>報じた国の数を示す。</b> 一部だけで大きく扱われた話かどうかがわかります。</li></ul>`],
        ['国別の視点と仮説の示し方', `<p><b>国別の視点</b>では、各メディアがこの出来事をどんな言葉で伝え、何を最も強調したかを一、二文で示します。冒頭には「国によって何が違うか」をまとめます。</p>
          <p><b>仮説</b>は「なぜ起きたのか」と「今後どうなるか」の二種類に分けて2〜3個示します。仮説ごとに根拠となった報道と確信度（低・中・高）を添え、確定した事実ではないことを明記します。</p>`],
        ['ストーリーテリング', `<p>初めてニュースに触れる人でも3分で理解できるよう、すべての出来事を同じ4つのステップで語ります。</p>`,
          { flow: [['背景', 'これはどこから始まったのか'], ['何が起きたか', 'いま実際に起きたこと'], ['なぜ重要か', '自分と世界にとっての意味'], ['今後の注目点', '次に見ておくべきポイント']] },
          '<p>文は短く、専門用語は初めて出るときに説明します。</p>'],
        ['リアルタイム収集と毎日の更新', `<ul><li><b>1時間ごと</b>に新しい記事を集め、出来事につなげます。</li>
          <li><b>数時間ごと</b>に、新しい記事が十分に増えた出来事だけを再分析します。変化がなければ再分析しないのでコストを抑えられます。</li>
          <li><b>毎朝7時</b>に、その日最も報じられた出来事で「今日の世界ブリーフィング」を作ります。</li>
          <li>急ぐときは画面上の<b>更新</b>ボタンですぐに更新できます。</li></ul>`],
        ['出来事の管理と世界情勢の統合', `<p>WorldLensの基本単位は記事ではなく<b>出来事</b>です。出来事は一度作られると保たれ、数日にわたり新しい報道がつながってタイムラインになります。表現が違うだけで二つに分かれた出来事は自動で統合します。</p>
          <p>ホーム画面ではアジア・ヨーロッパ・中東・南北アメリカ・アフリカ・オセアニアごとの出来事の数が一目でわかり、多くの国が報じた出来事ほど上に表示します。</p>`],
        ['MVPの方向性と今後の拡張', `<p><b>現在（MVP）</b>は「各国の報道を出来事としてまとめて比べる」という中心体験を検証する段階です。各国メディアの英語版を集め、5つの言語で表示しています。</p>
          <p><b>次のステップ</b></p>
          <ul><li>各国の自国語メディアの追加（英語版にない視点まで）</li><li>気になる出来事のフォローと更新通知</li><li>出来事のつながりマップ — 影響し合う出来事をつなげて見る</li><li>メディアごとの報道傾向を長期比較する偏り指標</li><li>インターネット公開とモバイルアプリ</li></ul>`],
      ],
    },
    zh: {
      eyebrow: '关于我们',
      title: 'WorldLens — 连接世界的碎片',
      lead: '世界各地的新闻按国家被切割成碎片。WorldLens 把这些碎片汇聚成一个个事件，并排呈现各国如何看待同一件事。',
      toc: ['概述', '问题', '差异', '新闻采集', '中立性', '视角与假设', '故事', '每日更新', '事件管理', 'MVP与规划'],
      s: [
        ['服务概述与缘起', `<p>WorldLens 是一项世界新闻服务，把多国媒体的报道汇集在一处，让你从不同视角比较同一事件。</p>
          <p>要真正理解国际新闻，需要亲自查找并阅读多国媒体。但语言不同、媒体太多，事件又会在几天内不断变化，大多数人最终只能看到一两家媒体的视角。WorldLens 源于一个简单的愿望：让忙碌的人也能均衡地理解世界。</p>`],
        ['要解决的问题', `<ul><li><b>信息分散。</b>同一事件的报道分散在数十家媒体，难以看清全貌。</li>
          <li><b>容易困于单一视角。</b>总看固定的媒体，就无从得知其他国家如何看待这件事。</li>
          <li><b>缺少背景。</b>快讯只告诉你“发生了什么”，却很少说明“为什么”和“接下来会怎样”。</li>
          <li><b>语言与时间的壁垒。</b>很少有人每天有空用外语阅读多国新闻。</li></ul>`],
        ['核心理念与差异', `<p>核心理念是<b>“透镜”</b>。用多个国家的透镜叠加观察同一事件，就能看清哪些是公认的事实，哪些是解读。</p>`,
          { head: ['', '一般新闻应用', 'WorldLens'], rows: [['单位', '一篇篇报道', '由多篇报道组成的“事件”'], ['视角', '一家媒体或一个国家', '多国媒体并排比较'], ['解读', '以快讯为主', '以故事讲清背景、意义与展望'], ['透明度', '来源区分不清', '每条事实标注来源，标示官方媒体，假设附可信度'], ['语言', '单一语言', '韩语、英语、日语、中文、法语']] }],
        ['全球新闻采集与整合', `<p>目前每小时采集16家媒体的公开 RSS，覆盖韩国、日本、中国、香港、印度、卡塔尔、土耳其、俄罗斯、英国、德国、法国、美国、乌拉圭、澳大利亚以及泛非洲媒体。</p>`,
          { flow: [['① 采集', '从各媒体 RSS 获取标题、摘要和链接'], ['② 整理·翻译', '去除重复，并翻译成5种语言'], ['③ 归类', '关键词重合的报道归为同一事件'], ['④ 分析', '为每个事件生成事实、视角、假设和故事']] },
          '<p>即使部分媒体无响应，其余媒体照常运作。我们不保存报道全文，原文始终链接至媒体网站。</p>'],
        ['AI 分析与中立性机制', `<p>AI 不是给出“标准答案”，而是整理素材，让读者自行判断。因此，分析中固定遵循以下原则：</p>
          <ul><li><b>区分事实与解读。</b>“已确认的事实”只收录至少两家不同媒体共同报道的内容。</li>
          <li><b>每句话标注来源。</b>说明是哪家媒体这样报道的。</li>
          <li><b>不设默认视角。</b>不以任何一国的视角为基准，比较各媒体强调了什么、淡化了什么。</li>
          <li><b>标示官方媒体。</b>让读者知道政府运营的媒体可能反映官方立场。</li>
          <li><b>显示报道国家数。</b>帮助判断这是全球关注的事件，还是仅在一地被大幅报道。</li></ul>`],
        ['各国视角与假设的呈现方式', `<p><b>各国视角</b>用一两句话展示每家媒体如何介绍这一事件、最强调什么。顶部另有“各国报道有何不同”的总结。</p>
          <p><b>假设</b>分为“为什么会发生”和“接下来会怎样”两类，共两三条。每条假设都注明所依据的报道和可信度（低、中、高），并明确说明它们并非既定事实。</p>`],
        ['故事化内容结构', `<p>为了让初次接触的人也能在3分钟内读懂，每个事件都用同样的四个步骤讲述。</p>`,
          { flow: [['背景', '这件事从何而起'], ['发生了什么', '现在实际发生的事'], ['为什么重要', '对你和世界意味着什么'], ['接下来关注什么', '下一步值得留意的地方']] },
          '<p>句子简短，专业术语首次出现时会加以解释。</p>'],
        ['实时采集与每日更新', `<ul><li><b>每小时</b>采集新报道并归入事件。</li>
          <li><b>每隔几小时</b>只重新分析新报道足够多的事件；没有变化就不重复分析，以节省成本。</li>
          <li><b>每天早上7点</b>用当天报道最多的事件生成“今日世界简报”。</li>
          <li>着急时，可点击页面顶部的<b>刷新</b>按钮立即更新。</li></ul>`],
        ['事件管理与世界局势总览', `<p>WorldLens 的基本单位不是报道，而是<b>事件</b>。事件一旦建立便会持续存在，几天内的新报道不断补充进来，形成时间线。仅因措辞不同而被分成两个的事件会自动合并。</p>
          <p>首页一目了然地显示亚洲、欧洲、中东、美洲、非洲、大洋洲各有多少事件，并将更多国家共同报道的事件排在前面。</p>`],
        ['MVP 方向与未来规划', `<p><b>现阶段（MVP）</b>旨在验证核心体验：把多国报道归为事件并加以比较。我们采集各国媒体的英文版，并以五种语言呈现。</p>
          <p><b>下一步</b></p>
          <ul><li>加入各国本国语言媒体（呈现英文版中没有的视角）</li><li>关注事件并接收更新提醒</li><li>事件关联图——查看相互影响的事件</li><li>长期比较各媒体报道倾向的偏向指标</li><li>正式上线与移动应用</li></ul>`],
      ],
    },
    fr: {
      eyebrow: 'À propos',
      title: 'WorldLens — Relier les fragments du monde',
      lead: 'L’actualité mondiale est éclatée, pays par pays. WorldLens rassemble ces fragments en un même événement et montre, côte à côte, comment chaque pays le voit.',
      toc: ['Présentation', 'Problème', 'Différence', 'Collecte', 'Neutralité', 'Points de vue', 'Récit', 'Mises à jour', 'Événements', 'MVP et feuille de route'],
      s: [
        ['Présentation et origine', `<p>WorldLens est un service d’actualité internationale qui rassemble la couverture de médias de nombreux pays, pour comparer un même événement sous différents regards.</p>
          <p>Pour vraiment comprendre l’actualité internationale, il faudrait lire soi-même des médias de nombreux pays. Mais les langues diffèrent, les médias sont trop nombreux et les événements évoluent sur plusieurs jours. La plupart d’entre nous ne voient finalement qu’un ou deux points de vue. WorldLens est né d’une idée simple : permettre aux personnes pressées de comprendre le monde de façon équilibrée.</p>`],
        ['Le problème', `<ul><li><b>L’information est dispersée.</b> La couverture d’un événement est répartie entre des dizaines de médias ; difficile d’avoir une vue d’ensemble.</li>
          <li><b>On s’enferme facilement dans un seul point de vue.</b> En lisant toujours les mêmes médias, on ne découvre jamais comment les autres pays voient l’événement.</li>
          <li><b>Le contexte manque.</b> Les dépêches disent ce qui s’est passé, rarement pourquoi ni ce qui va suivre.</li>
          <li><b>La langue et le temps sont des obstacles.</b> Peu de gens peuvent lire chaque jour l’actualité de nombreux pays en langue étrangère.</li></ul>`],
        ['Concept et différence', `<p>Le concept central est une <b>lentille</b>. En superposant les regards de plusieurs pays sur un même événement, on voit ce que tous reconnaissent comme des faits et où commence l’interprétation.</p>`,
          { head: ['', 'Application d’actualité classique', 'WorldLens'], rows: [['Unité', 'Des articles isolés', 'Des événements regroupant plusieurs articles'], ['Regard', 'Un média ou un pays', 'Les médias de plusieurs pays, côte à côte'], ['Explication', 'Surtout des dépêches', 'Contexte, enjeux et perspectives sous forme de récit'], ['Transparence', 'Sources peu distinguées', 'Source pour chaque fait, médias publics signalés, niveau de confiance des hypothèses'], ['Langues', 'Une seule langue', 'Coréen, anglais, japonais, chinois, français']] }],
        ['Collecte mondiale de l’actualité', `<p>Nous collectons chaque heure les flux RSS publics de 16 médias : Corée du Sud, Japon, Chine, Hong Kong, Inde, Qatar, Turquie, Russie, Royaume-Uni, Allemagne, France, États-Unis, Uruguay, Australie et un média panafricain.</p>`,
          { flow: [['① Collecte', 'Titres, résumés et liens depuis le RSS de chaque média'], ['② Tri et traduction', 'Suppression des doublons et traduction en 5 langues'], ['③ Regroupement', 'Les articles aux mots-clés communs forment un événement'], ['④ Analyse', 'Faits, points de vue, hypothèses et récit pour chaque événement']] },
          '<p>Si certains médias ne répondent pas, les autres continuent de fonctionner. Nous ne stockons jamais les articles complets : les originaux sont toujours liés sur le site de l’éditeur.</p>'],
        ['Analyse IA et neutralité', `<p>Plutôt que de donner « la bonne réponse », l’IA organise les éléments pour que vous puissiez juger par vous-même. Ces règles s’appliquent à chaque analyse :</p>
          <ul><li><b>Séparer les faits de l’interprétation.</b> Les « faits confirmés » ne retiennent que ce qu’au moins deux médias différents ont rapporté.</li>
          <li><b>Sourcer chaque affirmation.</b> Nous indiquons quel média a rapporté quoi.</li>
          <li><b>Aucun point de vue par défaut.</b> Aucun pays ne sert de référence ; nous comparons ce que chaque média met en avant ou minimise.</li>
          <li><b>Signaler les médias publics.</b> Les médias gérés par un État peuvent refléter des positions officielles, et nous le disons.</li>
          <li><b>Indiquer le nombre de pays.</b> Pour savoir si un sujet est important partout ou seulement à un endroit.</li></ul>`],
        ['Points de vue par pays et hypothèses', `<p><b>Par pays</b> montre, en une ou deux phrases, comment chaque média présente l’événement et ce qu’il souligne le plus. Une synthèse en haut explique en quoi la couverture diffère.</p>
          <p>Les <b>hypothèses</b> sont de deux types — « pourquoi ? » et « et ensuite ? » — deux ou trois au total. Chacune cite la couverture sur laquelle elle repose et porte un niveau de confiance (faible, moyen, élevé), en précisant qu’il ne s’agit pas de faits établis.</p>`],
        ['Mise en récit', `<p>Pour que chacun puisse comprendre un événement en trois minutes, tous sont racontés en quatre étapes identiques.</p>`,
          { flow: [['Contexte', 'D’où cela vient-il ?'], ['Ce qui s’est passé', 'Ce qui se passe réellement'], ['Pourquoi c’est important', 'Ce que cela signifie pour vous et le monde'], ['À surveiller', 'Les points à suivre ensuite']] },
          '<p>Les phrases sont courtes et les termes techniques expliqués à leur première apparition.</p>'],
        ['Collecte en temps réel et mises à jour quotidiennes', `<ul><li><b>Toutes les heures</b>, de nouveaux articles sont collectés et rattachés aux événements.</li>
          <li><b>Toutes les quelques heures</b>, seuls les événements ayant assez de nouvelle couverture sont réanalysés — rien ne change, rien n’est relancé, ce qui limite les coûts.</li>
          <li><b>Chaque matin à 7 h</b>, « Le point sur le monde » est créé à partir des événements les plus couverts.</li>
          <li>Pressé ? Utilisez le bouton <b>Actualiser</b> en haut de la page.</li></ul>`],
        ['Suivi des événements et vue d’ensemble', `<p>L’unité de base de WorldLens est l’<b>événement</b>, pas l’article. Une fois créé, un événement est conservé et la nouvelle couverture s’y ajoute au fil des jours pour former une chronologie. Les événements séparés en deux seulement à cause d’une formulation différente sont fusionnés automatiquement.</p>
          <p>La page d’accueil montre d’un coup d’œil le nombre d’événements en Asie, en Europe, au Moyen-Orient, dans les Amériques, en Afrique et en Océanie, et place en tête ceux couverts par le plus de pays.</p>`],
        ['Orientation du MVP et feuille de route', `<p><b>Aujourd’hui (MVP)</b>, nous testons l’expérience centrale : regrouper la couverture de nombreux pays en événements et la comparer. Nous collectons les éditions anglaises des médias de chaque pays et les affichons en cinq langues.</p>
          <p><b>Prochaines étapes</b></p>
          <ul><li>Médias en langue locale dans chaque pays (pour les regards absents des éditions anglaises)</li><li>Suivre des événements et recevoir des alertes</li><li>Une carte des événements liés — voir comment ils s’influencent</li><li>Des indicateurs de biais comparant les médias sur la durée</li><li>Lancement public et application mobile</li></ul>`],
      ],
    },
  };

  const render = (d) => {
    const sec = d.s.map(([title, ...parts], i) => {
      const body = parts.map((p) => {
        if (typeof p === 'string') return p;
        if (p.flow) return `<div class="flow">${p.flow.map(([b, t]) => `<div><b>${b}</b>${t}</div>`).join('')}</div>`;
        return `<table class="compare"><thead><tr>${p.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${p.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      }).join('');
      return `<section class="about-sec" id="s${i + 1}"><div class="num">${String(i + 1).padStart(2, '0')}</div><h2>${title}</h2>${body}</section>`;
    }).join('');
    return `<section class="about-hero"><div class="eyebrow">${d.eyebrow}</div><h1>${d.title}</h1><p>${d.lead}</p>
      <nav class="toc">${d.toc.map((t, i) => `<a href="#s${i + 1}">${t}</a>`).join('')}</nav></section>${sec}`;
  };
  window.WL_ABOUT = Object.fromEntries(Object.entries(D).map(([k, d]) => [k, render(d)]));
})();
