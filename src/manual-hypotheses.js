// 직접 써 넣은 '숨은 이유 추리' 가설 (AI 분석이 아직 없는 사건용, 2026-11-25 상위 사건)
// AI 분석이 가설을 만들면 그쪽이 우선 (views.js eventDetail). 단서는 모은 기사에서만 가져옴
// plausibility(그럴듯함)는 언어와 상관없이 낮음/중간/높음 코드를 씀 (화면이 언어별로 바꿔 보여 줌)
const H = (title, theory, clues, counter, plausibility) => ({ title, theory, clues, counter, plausibility, sources: [] });

export const MANUAL_HYPOTHESES = {
  // 엔비디아, 젠슨 황 CEO 복귀
  264: {
    ko: {
      summary: '단서가 가장 많이 맞아떨어지는 건 가설 1이에요. 백악관과 엔비디아 이사회 사이에 오간 대화 내용이 공개되면 확인될 수 있어요.',
      hypotheses: [
        H('주가를 지키려는 백악관의 구조 작전?', '어쩌면 스캔들보다 엔비디아 주가 폭락이 더 큰 문제였을지도 몰라요. AI 산업의 상징이 흔들리면 미국 증시 전체가 흔들리니까요.',
          ['복귀 발표 당일 주가가 31.5% 뛰었어요 (아나돌루)', '트럼프는 복귀 전에 이사회와 직접 이야기했다고 밝혔어요 (유로뉴스)', '대만 증시(TAIEX)도 하루 만에 8.99% 급등했어요 (타이페이타임스)'],
          '이사회는 만장일치로 결정했어요. 창업자를 대체할 사람이 없다는 단순한 이유였을 수도 있어요.', '중간'),
        H('진짜 목적은 대중국 반도체 협상 카드?', '어쩌면 복귀는 중국과의 연결고리를 끊는 조건부 거래였을지도 몰라요. 사람은 남기고, 의심받는 회사는 정리하는 식으로요.',
          ['같은 주에 미국이 스캔들과 얽힌 칩 회사를 블랙리스트에 올렸어요 (더 힌두)', '의회가 칩 수출 통제 조사를 진행 중이에요 (아나돌루)', '중국 국영 매체는 스파이 보도를 "마녀사냥"이라고 했어요 (가디언)'],
          '블랙리스트는 원래 준비되던 조치일 수 있고, 두 일을 직접 잇는 보도는 아직 없어요.', '낮음'),
      ],
    },
    en: {
      summary: 'Theory 1 fits the most clues. It could be confirmed if the conversations between the White House and Nvidia’s board come out.',
      hypotheses: [
        H('A White House rescue to protect the share price?', 'Perhaps the bigger worry was not the scandal but a collapse in Nvidia’s stock. When the symbol of the AI boom wobbles, the whole US market wobbles.',
          ['Shares jumped 31.5% on the day the return was announced (Anadolu)', 'Trump said he spoke with the board before the return (Euronews)', 'Taiwan’s TAIEX also surged 8.99% in a day (Taipei Times)'],
          'The board voted unanimously; it may simply be that the founder is irreplaceable.', '중간'),
        H('Really a bargaining chip in the chip war with China?', 'Perhaps the return was a conditional deal to cut links to China: keep the man, clean up the suspect companies.',
          ['The same week, the US blacklisted a chip firm tied to the scandal (The Hindu)', 'Congress is investigating chip export controls (Anadolu)', 'Chinese state media called the spy reports a “witch hunt” (The Guardian)'],
          'The blacklisting may have been planned anyway, and no report links the two directly.', '낮음'),
      ],
    },
    ja: {
      summary: '最も多くの手がかりと合うのは仮説1です。ホワイトハウスとエヌビディア取締役会のやり取りが明らかになれば確かめられます。',
      hypotheses: [
        H('株価を守るためのホワイトハウスの救出作戦？', 'もしかすると、スキャンダルよりエヌビディア株の暴落のほうが大きな問題だったのかもしれません。AI産業の象徴が揺らげば米国市場全体が揺らぐからです。',
          ['復帰発表の当日、株価が31.5%上昇しました（アナドル通信）', 'トランプ氏は復帰前に取締役会と直接話したと述べました（ユーロニュース）', '台湾株（TAIEX）も1日で8.99%急騰しました（台北タイムズ）'],
          '取締役会は全会一致でした。創業者の代わりがいないという単純な理由だった可能性もあります。', '중간'),
        H('本当の狙いは対中半導体交渉のカード？', 'もしかすると復帰は、中国とのつながりを断つ条件付きの取引だったのかもしれません。人は残し、疑われる会社は整理するという形です。',
          ['同じ週、米国はスキャンダルに関わる半導体企業をブラックリストに載せました（ザ・ヒンドゥー）', '議会が半導体の輸出規制を調査中です（アナドル通信）', '中国国営メディアはスパイ報道を「魔女狩り」と呼びました（ガーディアン）'],
          'ブラックリストは元々準備されていた措置かもしれず、二つを直接結ぶ報道はまだありません。', '낮음'),
      ],
    },
    zh: {
      summary: '与线索最吻合的是假设 1。如果白宫与英伟达董事会之间的对话内容曝光，就能得到验证。',
      hypotheses: [
        H('白宫为保股价发起的救援行动？', '也许比起丑闻，英伟达股价暴跌才是更大的问题。AI 产业的象征一旦动摇，整个美股都会动摇。',
          ['宣布复职当天股价上涨 31.5%（阿纳多卢通讯社）', '特朗普称复职前曾与董事会直接交谈（欧洲新闻台）', '台湾加权指数也在一天内暴涨 8.99%（台北时报）'],
          '董事会是全票通过的，也可能只是因为创始人无可替代。', '중간'),
        H('真正目的是对华芯片谈判筹码？', '也许复职是一笔切断与中国联系的附条件交易：留下人，清理受怀疑的公司。',
          ['同一周美国将与丑闻相关的芯片公司列入黑名单（印度教徒报）', '国会正在调查芯片出口管制（阿纳多卢通讯社）', '中国官方媒体称间谍报道是“猎巫”（卫报）'],
          '黑名单可能本就在准备中，目前也没有报道直接把两件事联系起来。', '낮음'),
      ],
    },
    fr: {
      summary: 'L’hypothèse 1 colle au plus grand nombre d’indices. Elle pourrait se vérifier si les échanges entre la Maison Blanche et le conseil de Nvidia étaient rendus publics.',
      hypotheses: [
        H('Une opération de sauvetage de la Maison Blanche pour protéger le cours ?', 'Peut-être que le vrai souci n’était pas le scandale mais l’effondrement de l’action Nvidia. Quand le symbole de l’IA vacille, tout le marché américain vacille.',
          ['L’action a bondi de 31,5 % le jour de l’annonce (Anadolu)', 'Trump dit avoir parlé au conseil avant le retour (Euronews)', 'Le TAIEX taïwanais a aussi grimpé de 8,99 % en un jour (Taipei Times)'],
          'Le conseil a voté à l’unanimité ; le fondateur est peut-être simplement irremplaçable.', '중간'),
        H('En réalité, une monnaie d’échange dans la guerre des puces avec la Chine ?', 'Peut-être que ce retour était un accord conditionnel pour couper les liens avec la Chine : garder l’homme, écarter les sociétés suspectes.',
          ['La même semaine, les États-Unis ont mis sur liste noire une société liée au scandale (The Hindu)', 'Le Congrès enquête sur les contrôles à l’exportation des puces (Anadolu)', 'Les médias d’État chinois ont parlé de « chasse aux sorcières » (The Guardian)'],
          'La liste noire était peut-être prévue de toute façon, et aucun article ne relie directement les deux.', '낮음'),
      ],
    },
  },

  // 우크라이나 해상 드론, 리비아 벵가지에서 러시아 군함 공격
  20591: {
    ko: {
      summary: '가설 1이 우크라이나의 공식 설명과도 가장 잘 맞아요. 공격받은 화물선이 실제로 무엇을 싣고 있었는지 밝혀지면 확인될 수 있어요.',
      hypotheses: [
        H('노린 건 군함이 아니라 아프리카로 가는 러시아 무기 보급로?', '어쩌면 진짜 표적은 리비아를 거쳐 아프리카로 이어지는 러시아의 군수 물류였을지도 몰라요. 흑해 밖에서도 보급선을 끊겠다는 신호인 셈이죠.',
          ['공격받은 화물선에 무기·탄약·드론이 실려 있었다고 해요 (프리미엄타임스)', '우크라이나 외무장관은 군함과 화물선 모두 정당한 표적이었다고 했어요 (재팬타임스)', '우크라이나는 석유 판매로 전쟁 자금을 대는 러시아 해운을 계속 공격해 왔어요 (재팬타임스)'],
          '러시아 측은 화물 내용을 인정하지 않았고, 유엔 대표단은 공격 자체를 비난하며 조사를 요구했어요.', '중간'),
        H('지중해로 전선을 넓혀 유럽을 끌어들이려는 계산?', '어쩌면 유럽 코앞에서 공격해 유럽이 이 전쟁을 남의 일로 볼 수 없게 만들려는 의도였을지도 몰라요.',
          ['알자지라는 "리비아가 우크라이나 전쟁의 새 전선인가?"라고 물었어요', '이탈리아가 우크라이나에 우려를 전했어요 (가디언)', '유럽의회는 "유럽의 역할"을 논의하기로 했어요 (프랑스24)'],
          '우크라이나는 전쟁 확대를 부인했고, 유럽의 반응은 지지보다 우려 쪽이었어요. 의도했다면 역효과가 난 셈이에요.', '낮음'),
      ],
    },
    en: {
      summary: 'Theory 1 also fits Ukraine’s official explanation best. It could be confirmed if what the cargo ship was carrying is revealed.',
      hypotheses: [
        H('The real target: Russia’s arms supply route to Africa, not the warship?', 'Perhaps the real target was Russia’s military logistics running through Libya into Africa — a signal that supply lines will be hit even beyond the Black Sea.',
          ['The cargo ship reportedly carried weapons, ammunition and drones (Premium Times)', 'Ukraine’s foreign minister said both the warship and the cargo ship were valid targets (The Japan Times)', 'Ukraine has been striking Russian shipping that funds the war through oil sales (The Japan Times)'],
          'Russia has not confirmed the cargo, and the UN mission condemned the strike and called for an inquiry.', '중간'),
        H('Widening the front to the Mediterranean to pull Europe in?', 'Perhaps striking right on Europe’s doorstep was meant to make Europeans stop treating this war as someone else’s problem.',
          ['Al Jazeera asked: “Is Libya a new front in the Ukraine war?”', 'Italy raised concerns with Ukraine (The Guardian)', 'The European Parliament scheduled a debate on “Europe’s role” (France 24)'],
          'Ukraine denied widening the war, and Europe reacted with concern rather than support — if this was the aim, it backfired.', '낮음'),
      ],
    },
    ja: {
      summary: '仮説1はウクライナの公式説明とも最もよく合います。攻撃された貨物船が実際に何を積んでいたかが分かれば確かめられます。',
      hypotheses: [
        H('狙いは軍艦ではなく、アフリカへのロシアの武器補給路？', 'もしかすると本当の標的は、リビアを経てアフリカにつながるロシアの軍需物流だったのかもしれません。黒海の外でも補給線を断つという合図です。',
          ['攻撃された貨物船には武器・弾薬・ドローンが積まれていたとされます（プレミアム・タイムズ）', 'ウクライナ外相は軍艦も貨物船も正当な標的だったと述べました（ジャパンタイムズ）', 'ウクライナは石油販売で戦費を賄うロシアの海運を攻撃してきました（ジャパンタイムズ）'],
          'ロシア側は積み荷を認めておらず、国連代表団は攻撃自体を非難し調査を求めました。', '중간'),
        H('地中海に戦線を広げて欧州を巻き込む計算？', 'もしかすると欧州の目の前で攻撃し、欧州がこの戦争を他人事と見られないようにする狙いだったのかもしれません。',
          ['アルジャジーラは「リビアはウクライナ戦争の新たな戦線か？」と問いました', 'イタリアがウクライナに懸念を伝えました（ガーディアン）', '欧州議会は「欧州の役割」を議論することにしました（フランス24）'],
          'ウクライナは戦争拡大を否定し、欧州の反応は支持より懸念でした。狙いだったなら逆効果です。', '낮음'),
      ],
    },
    zh: {
      summary: '假设 1 也与乌克兰的官方说法最吻合。如果查明遭袭货船实际运载的货物，就能得到验证。',
      hypotheses: [
        H('目标不是军舰，而是俄罗斯通往非洲的武器补给线？', '也许真正的目标是经利比亚通往非洲的俄罗斯军需物流——这是在黑海之外也要切断补给线的信号。',
          ['据报道遭袭货船载有武器、弹药和无人机（尖峰时报）', '乌克兰外长称军舰和货船都是正当目标（日本时报）', '乌克兰一直在打击靠卖油为战争筹资的俄罗斯航运（日本时报）'],
          '俄方未承认货物内容，联合国代表团谴责了袭击并要求调查。', '중간'),
        H('把战线扩大到地中海以拉欧洲入局？', '也许在欧洲家门口发动袭击，是为了让欧洲无法再把这场战争当作别人的事。',
          ['半岛电视台发问：“利比亚是乌克兰战争的新战线吗？”', '意大利向乌克兰表达了关切（卫报）', '欧洲议会决定讨论“欧洲的角色”（法国24台）'],
          '乌克兰否认扩大战争，欧洲的反应多是担忧而非支持——若这是目的，反而适得其反。', '낮음'),
      ],
    },
    fr: {
      summary: 'L’hypothèse 1 correspond aussi le mieux à l’explication officielle de l’Ukraine. Elle se vérifierait si l’on apprenait ce que transportait le cargo.',
      hypotheses: [
        H('La vraie cible : la route d’armement russe vers l’Afrique, pas le navire de guerre ?', 'Peut-être que la vraie cible était la logistique militaire russe passant par la Libye vers l’Afrique — un signal que les lignes d’approvisionnement seront visées au-delà de la mer Noire.',
          ['Le cargo transportait des armes, des munitions et des drones (Premium Times)', 'Le ministre ukrainien des Affaires étrangères juge les deux navires des cibles légitimes (The Japan Times)', 'L’Ukraine frappe le transport maritime russe qui finance la guerre par le pétrole (The Japan Times)'],
          'La Russie n’a pas confirmé la cargaison, et la mission de l’ONU a condamné l’attaque et demandé une enquête.', '중간'),
        H('Élargir le front à la Méditerranée pour impliquer l’Europe ?', 'Peut-être que frapper aux portes de l’Europe visait à empêcher les Européens de voir cette guerre comme l’affaire des autres.',
          ['Al Jazeera demande : « La Libye, nouveau front de la guerre en Ukraine ? »', 'L’Italie a fait part de ses inquiétudes à l’Ukraine (The Guardian)', 'Le Parlement européen va débattre du « rôle de l’Europe » (France 24)'],
          'L’Ukraine nie tout élargissement, et l’Europe a réagi avec inquiétude plutôt que soutien : si c’était le but, c’est raté.', '낮음'),
      ],
    },
  },

  // 美 정보국장 "트럼프의 푸틴 '친구' 표현은 적절"
  4508: {
    ko: {
      summary: '가설 1이 더 많은 단서와 맞아요. 다음 미·러 협상에서 미국이 실제로 무엇을 얻어 내는지 보면 확인될 수 있어요.',
      hypotheses: [
        H("'친구' 발언은 협상 판을 깔기 위한 계산된 말?", '어쩌면 친구라는 말은 감정이 아니라 전략이었을지도 몰라요. 우크라이나 평화 협상을 앞두고 푸틴을 협상 테이블에 붙잡아 두려는 거죠.',
          ['정보국장은 정상회담 맥락에서 "완전히 적절했다"고 했어요 (알자지라)', '같은 정보국장이 "푸틴은 우크라이나에서 미국의 친구가 아니다"라고도 했어요 (메두자)', '중국 선전에서 미·중·러 3자 정상회담이 막 열렸어요 (사우스차이나모닝포스트)'],
          '트럼프는 비판을 받은 뒤에도 SNS에 또 "내 친구"라고 올렸어요. 계산보다는 개인적 친분일 수도 있어요.', '중간'),
        H('정보기관이 대통령 편에 서서 내부 반발을 막으려는 것?', '어쩌면 정보국장이 나선 건 민주당과 유럽의 비판이 정보기관 쪽으로 번지기 전에 선을 그으려는 의도였을지도 몰라요.',
          ['민주당은 이 발언을 "미국 가치에 대한 배신"이라고 했어요 (아랍뉴스)', '정보국장이 일요일 방송에 직접 나와 해명했어요 (가디언)'],
          '정보국장은 대통령이 임명한 사람이라, 따로 노린 것 없이 그냥 대통령을 옹호한 것일 수 있어요.', '낮음'),
      ],
    },
    en: {
      summary: 'Theory 1 fits more of the clues. It could be tested by what the US actually gets out of the next round of talks with Russia.',
      hypotheses: [
        H('“Friend” as a calculated move to set up a deal?', 'Perhaps “friend” was strategy, not sentiment — a way to keep Putin at the table ahead of Ukraine peace talks.',
          ['The intelligence chief called it “entirely appropriate” in the context of the summit (Al Jazeera)', 'The same chief also said Putin “is not America’s friend in Ukraine” (Meduza)', 'A US–China–Russia summit had just taken place in Shenzhen (SCMP)'],
          'Trump posted “my friend” again even after the criticism — it may be personal rapport rather than calculation.', '중간'),
        H('The intelligence community closing ranks to head off a revolt?', 'Perhaps the intelligence chief stepped in to draw a line before criticism from Democrats and Europe spread to the agencies themselves.',
          ['Democrats called the remarks a “betrayal of American values” (Arab News)', 'The chief went on Sunday TV to defend them personally (The Guardian)'],
          'He is a presidential appointee; he may simply have been defending his boss with no further aim.', '낮음'),
      ],
    },
    ja: {
      summary: '仮説1のほうが多くの手がかりと合います。次の米ロ協議で米国が実際に何を得るかで確かめられます。',
      hypotheses: [
        H('「友人」発言は交渉の地ならしのための計算？', 'もしかすると「友人」は感情ではなく戦略だったのかもしれません。ウクライナ和平交渉を前に、プーチン氏を交渉の席に引き留めておくためです。',
          ['情報長官は首脳会談の文脈では「完全に適切だった」と述べました（アルジャジーラ）', '同じ長官は「プーチンはウクライナで米国の友人ではない」とも述べました（メドゥーザ）', '中国・深圳で米中ロ3か国首脳会談が開かれたばかりでした（サウスチャイナ・モーニング・ポスト）'],
          'トランプ氏は批判の後もSNSで再び「私の友人」と投稿しました。計算より個人的な親しさかもしれません。', '중간'),
        H('情報機関が大統領側に立ち、内部の反発を抑える狙い？', 'もしかすると情報長官が前に出たのは、民主党や欧州の批判が情報機関に及ぶ前に線を引くためだったのかもしれません。',
          ['民主党はこの発言を「米国の価値への裏切り」と呼びました（アラブニュース）', '長官は日曜の番組に自ら出演して弁明しました（ガーディアン）'],
          '長官は大統領が任命した人物で、特別な狙いなく単に大統領を擁護しただけかもしれません。', '낮음'),
      ],
    },
    zh: {
      summary: '假设 1 与更多线索吻合。看美国在下一轮美俄谈判中实际得到什么，就能检验。',
      hypotheses: [
        H('“朋友”一词是为谈判铺路的算计？', '也许“朋友”不是感情而是策略——在乌克兰和谈前把普京留在谈判桌上。',
          ['情报总监称在峰会背景下这一说法“完全恰当”（半岛电视台）', '这位总监也说过“普京在乌克兰问题上不是美国的朋友”（美杜莎）', '美中俄三方峰会刚在深圳举行（南华早报）'],
          '特朗普在受批评后又在社交媒体上称“我的朋友”，这或许是私人交情而非算计。', '중간'),
        H('情报机构站到总统一边以压住内部反弹？', '也许情报总监出面，是想在民主党和欧洲的批评蔓延到情报机构之前划清界限。',
          ['民主党称这番话是“对美国价值观的背叛”（阿拉伯新闻）', '总监亲自上周日节目为其辩护（卫报）'],
          '他是总统任命的官员，可能只是单纯为上司辩护，并无其他目的。', '낮음'),
      ],
    },
    fr: {
      summary: 'L’hypothèse 1 colle à davantage d’indices. On pourra la tester à ce que les États-Unis obtiendront réellement lors des prochaines discussions avec la Russie.',
      hypotheses: [
        H('« Ami », un mot calculé pour préparer un accord ?', 'Peut-être que « ami » relevait de la stratégie et non du sentiment : garder Poutine à la table avant les négociations de paix sur l’Ukraine.',
          ['Le chef du renseignement a jugé le mot « tout à fait approprié » dans le contexte du sommet (Al Jazeera)', 'Le même responsable a aussi dit que Poutine « n’est pas l’ami de l’Amérique en Ukraine » (Meduza)', 'Un sommet États-Unis–Chine–Russie venait de se tenir à Shenzhen (SCMP)'],
          'Trump a reposté « mon ami » malgré les critiques : peut-être une affinité personnelle plutôt qu’un calcul.', '중간'),
        H('Le renseignement fait bloc pour éviter une fronde ?', 'Peut-être que le chef du renseignement est intervenu pour tracer une ligne avant que les critiques des démocrates et de l’Europe n’atteignent les agences.',
          ['Les démocrates ont parlé de « trahison des valeurs américaines » (Arab News)', 'Il est venu en personne se justifier à la télévision dimanche (The Guardian)'],
          'Nommé par le président, il a peut-être simplement défendu son patron, sans autre but.', '낮음'),
      ],
    },
  },

  // 러시아 드론 공습과 크림대교 공격
  9885: {
    ko: {
      summary: '가설 1은 양쪽 발표가 서로 맞물려 꽤 그럴듯해요. 크림대교 복구 속도와 남부 전선의 러시아 보급 상황이 확인의 열쇠예요.',
      hypotheses: [
        H('밤마다 쏟아지는 드론은 크림대교 공격에 대한 보복전?', '어쩌면 최근 드론 공습이 부쩍 거세진 건 크림대교 공격에 대한 계산된 보복일지도 몰라요. 서로 상대의 다리와 보급로를 노리는 맞대응이죠.',
          ['푸틴은 케르치 다리 공격에 "고통스러운" 대응을 다짐했어요 (도이체벨레)', '그 뒤 하룻밤에 드론 400여 대와 미사일 110기가 날아왔어요 (알자지라)', '젤렌스키는 러시아가 먼저 우크라이나 다리를 109번 공격했다고 했어요 (우크린폼)'],
          '러시아의 대규모 공습은 9월부터 사실상 계속돼 왔어요. 다리 공격이 없었어도 이어졌을 수 있어요 (스트레이츠타임스).', '중간'),
        H('다리 공격의 진짜 목표는 협상 전 남부 전선 흔들기?', '어쩌면 우크라이나가 크림대교를 거듭 노리는 건 평화 협상 전에 러시아의 남부 보급을 끊어 협상력을 높이려는 것일지도 몰라요.',
          ['다리 복구에 "몇 달"이 걸릴 거라는 보도가 있어요 (타임스 오브 인디아)', '공격으로 러시아 물류에 부담이 커졌어요 (재팬타임스, 데일리 사바)'],
          '러시아는 열차 통행이 완전히 복구됐다고 발표했어요 (타스). 효과가 생각보다 작을 수 있어요.', '낮음'),
      ],
    },
    en: {
      summary: 'Theory 1 is fairly convincing because both sides’ statements line up. The keys are how fast the Crimean Bridge is repaired and Russia’s supply situation on the southern front.',
      hypotheses: [
        H('Nightly drone swarms as revenge for the Crimean Bridge strike?', 'Perhaps the sharp rise in drone attacks is calculated retaliation for the bridge strike — each side going after the other’s bridges and supply lines.',
          ['Putin vowed a “painful” response to the Kerch bridge attack (DW)', 'Then over 400 drones and 110 missiles were fired in one night (Al Jazeera)', 'Zelensky says Russia attacked Ukrainian bridges 109 times first (Ukrinform)'],
          'Large-scale Russian strikes have been near-constant since September; they may have continued regardless (The Straits Times).', '중간'),
        H('The bridge strikes as a way to shake the southern front before talks?', 'Perhaps Ukraine keeps hitting the Crimean Bridge to choke Russia’s southern supply and gain leverage before peace talks.',
          ['Repairs reportedly will take “months” (The Times of India)', 'The strikes have strained Russian logistics (The Japan Times, Daily Sabah)'],
          'Russia says rail traffic over the bridge is fully restored (TASS) — the effect may be smaller than it looks.', '낮음'),
      ],
    },
    ja: {
      summary: '仮説1は双方の発表がかみ合っていて、かなりもっともらしいです。クリミア橋の復旧速度と南部戦線のロシアの補給状況が確認の鍵です。',
      hypotheses: [
        H('毎晩のドローン攻撃はクリミア橋攻撃への報復？', 'もしかすると最近ドローン攻撃が急に激しくなったのは、クリミア橋攻撃への計算された報復なのかもしれません。互いに相手の橋と補給路を狙う応酬です。',
          ['プーチン氏はケルチ橋攻撃に「痛みを伴う」対応を誓いました（ドイチェ・ヴェレ）', 'その後、一晩でドローン400機超とミサイル110発が飛来しました（アルジャジーラ）', 'ゼレンスキー氏はロシアが先にウクライナの橋を109回攻撃したと述べました（ウクルインフォルム）'],
          'ロシアの大規模攻撃は9月から事実上続いており、橋への攻撃がなくても続いていたかもしれません（ストレーツ・タイムズ）。', '중간'),
        H('橋攻撃の本当の狙いは和平交渉前に南部戦線を揺さぶること？', 'もしかするとウクライナがクリミア橋を繰り返し狙うのは、和平交渉前にロシアの南部補給を断ち、交渉力を高めるためかもしれません。',
          ['橋の復旧には「数か月」かかるとの報道があります（タイムズ・オブ・インディア）', '攻撃でロシアの物流への負担が増しました（ジャパンタイムズ、デイリー・サバ）'],
          'ロシアは列車の通行が完全に復旧したと発表しました（タス通信）。効果は思ったより小さいかもしれません。', '낮음'),
      ],
    },
    zh: {
      summary: '假设 1 因双方说法相互印证而颇为可信。关键在于克里米亚大桥的修复速度和俄军南线补给情况。',
      hypotheses: [
        H('每晚的无人机空袭是对克里米亚大桥遇袭的报复？', '也许近来无人机空袭骤然加剧，是对大桥遇袭的蓄意报复——双方互打对方的桥梁和补给线。',
          ['普京誓言对刻赤大桥遇袭作出“痛苦的”回应（德国之声）', '随后一夜之间来袭无人机 400 多架、导弹 110 枚（半岛电视台）', '泽连斯基称俄罗斯此前已袭击乌克兰桥梁 109 次（乌克兰国家通讯社）'],
          '俄方大规模空袭自 9 月以来几乎从未停止，即便没有大桥遇袭也可能照常进行（海峡时报）。', '중간'),
        H('袭击大桥的真正目的是在和谈前动摇南线？', '也许乌克兰反复袭击克里米亚大桥，是想在和谈前切断俄军南线补给、增加谈判筹码。',
          ['有报道称大桥修复需要“数月”（印度时报）', '袭击加重了俄方物流压力（日本时报、每日晨报）'],
          '俄方宣布铁路通行已完全恢复（塔斯社），实际效果可能比看起来小。', '낮음'),
      ],
    },
    fr: {
      summary: 'L’hypothèse 1 est assez convaincante car les déclarations des deux camps concordent. Les clés : la vitesse de réparation du pont de Crimée et l’approvisionnement russe sur le front sud.',
      hypotheses: [
        H('Des essaims de drones chaque nuit en représailles au pont de Crimée ?', 'Peut-être que la forte hausse des attaques de drones est une riposte calculée à la frappe sur le pont — chaque camp visant les ponts et les lignes d’approvisionnement de l’autre.',
          ['Poutine a promis une réponse « douloureuse » à l’attaque du pont de Kertch (DW)', 'Plus de 400 drones et 110 missiles ont ensuite été tirés en une nuit (Al Jazeera)', 'Zelensky affirme que la Russie a frappé 109 fois des ponts ukrainiens d’abord (Ukrinform)'],
          'Les frappes massives russes sont quasi continues depuis septembre ; elles auraient pu se poursuivre de toute façon (The Straits Times).', '중간'),
        H('Frapper le pont pour ébranler le front sud avant les négociations ?', 'Peut-être que l’Ukraine vise sans cesse le pont de Crimée pour étrangler l’approvisionnement russe au sud et peser davantage avant les pourparlers.',
          ['La réparation prendrait « des mois » (The Times of India)', 'Les frappes ont mis la logistique russe sous pression (The Japan Times, Daily Sabah)'],
          'La Russie dit le trafic ferroviaire entièrement rétabli (TASS) : l’effet est peut-être plus faible qu’il n’y paraît.', '낮음'),
      ],
    },
  },

  // COP31 기후 정상회담 합의 실패
  445: {
    ko: {
      summary: '가설 1이 여러 나라 보도에서 공통으로 확인돼 가장 그럴듯해요. 다음 COP에서 만장일치 규칙을 바꾸자는 논의가 힘을 얻는지가 확인의 신호예요.',
      hypotheses: [
        H('산유국이 일부러 판을 깬 것?', '어쩌면 합의 실패는 우연이 아니라, 화석연료 퇴출 문구를 막으려는 산유국들이 버틴 결과일지도 몰라요. 만장일치 규칙에서는 몇 나라만 반대해도 아무것도 못 정하니까요.',
          ['산유국들이 화석연료 단계적 퇴출에 반대했다고 해요 (프랑스24)', '"화석연료 이해관계를 둘러싼 대결"이라는 분석이 나왔어요 (프랑스24)', '17년 만에 처음으로 핵심 합의에 실패했어요 (가디언)'],
          '기후 재원(돈) 문제로도 깊이 갈라져 있었어요. 산유국 탓만은 아닐 수 있어요 (더 나미비안).', '높음'),
        H('실패를 계기로 COP 규칙 자체를 바꾸려는 흐름?', '어쩌면 일부 나라들은 이번 실패를 오히려 만장일치 방식을 바꿀 기회로 보고 있을지도 몰라요.',
          ['앨 고어 등이 결정 방식 개혁을 촉구했어요 (가디언)', '영국 기후 책임자는 "COP가 바뀌어야 한다"고 했어요 (폴리티코 유럽)'],
          '규칙을 바꾸려면 그것도 만장일치가 필요해서, 실제로 바뀔 가능성은 낮아요.', '낮음'),
      ],
    },
    en: {
      summary: 'Theory 1 is the most convincing, as reports from many countries point the same way. Watch whether a push to change the consensus rule gains ground at the next COP.',
      hypotheses: [
        H('Did oil producers break the deal on purpose?', 'Perhaps the failure was no accident but the result of oil-producing states holding out against fossil-fuel phase-out language. Under consensus rules, a few objectors can block everything.',
          ['Oil producers opposed a fossil-fuel phase-out (France 24)', 'Analysts called it a “showdown over fossil fuel interests” (France 24)', 'It was the first failure to reach a core deal in 17 years (The Guardian)'],
          'Countries were also deeply split over climate finance — it may not be the oil producers alone (The Namibian).', '높음'),
        H('Using the failure to change the COP rules themselves?', 'Perhaps some countries see this failure as a chance to change the consensus system.',
          ['Al Gore and others called for reforming how decisions are made (The Guardian)', 'The UK’s climate envoy said “COP must change” (Politico Europe)'],
          'Changing the rules would itself need consensus, so it is unlikely to happen.', '낮음'),
      ],
    },
    ja: {
      summary: '仮説1は多くの国の報道で共通して確認でき、最ももっともらしいです。次のCOPで全会一致ルールの見直し論が勢いを得るかが確認のサインです。',
      hypotheses: [
        H('産油国がわざと合意を壊した？', 'もしかすると合意失敗は偶然ではなく、化石燃料の段階的廃止の文言を阻もうとした産油国が粘った結果かもしれません。全会一致ルールでは数か国が反対するだけで何も決められません。',
          ['産油国が化石燃料の段階的廃止に反対したとされます（フランス24）', '「化石燃料の利害をめぐる対決」という分析が出ました（フランス24）', '17年ぶりに初めて中核合意に失敗しました（ガーディアン）'],
          '気候資金（お金）の問題でも深く対立していました。産油国だけのせいではないかもしれません（ザ・ナミビアン）。', '높음'),
        H('失敗を機にCOPのルール自体を変えようとする流れ？', 'もしかすると一部の国は、今回の失敗をむしろ全会一致方式を変える機会と見ているのかもしれません。',
          ['アル・ゴア氏らが意思決定方式の改革を求めました（ガーディアン）', '英国の気候担当者は「COPは変わらなければならない」と述べました（ポリティコ・ヨーロッパ）'],
          'ルール変更にも全会一致が必要なので、実際に変わる可能性は低いです。', '낮음'),
      ],
    },
    zh: {
      summary: '假设 1 在多国报道中都得到印证，最为可信。下届 COP 上修改协商一致规则的讨论能否获得支持，是验证的信号。',
      hypotheses: [
        H('产油国故意搅黄了协议？', '也许谈判失败并非偶然，而是产油国为阻止“逐步淘汰化石燃料”的措辞而坚持到底的结果。在协商一致规则下，少数国家反对就能让一切落空。',
          ['据报道产油国反对逐步淘汰化石燃料（法国24台）', '有分析称这是“围绕化石燃料利益的较量”（法国24台）', '这是 17 年来首次未能达成核心协议（卫报）'],
          '各国在气候资金问题上也分歧严重，未必只是产油国的责任（纳米比亚人报）。', '높음'),
        H('借失败之机改变 COP 规则本身？', '也许一些国家把这次失败视为改变协商一致机制的机会。',
          ['戈尔等人呼吁改革决策方式（卫报）', '英国气候特使称“COP 必须改变”（政客欧洲版）'],
          '修改规则本身也需要协商一致，因此真正改变的可能性很低。', '낮음'),
      ],
    },
    fr: {
      summary: 'L’hypothèse 1 est la plus convaincante, confirmée par des médias de nombreux pays. À surveiller : la réforme de la règle du consensus gagnera-t-elle du terrain à la prochaine COP ?',
      hypotheses: [
        H('Les pays pétroliers ont-ils fait capoter l’accord exprès ?', 'Peut-être que l’échec n’a rien d’un hasard et résulte de la résistance des producteurs de pétrole à toute mention de sortie des énergies fossiles. Avec la règle du consensus, quelques opposants suffisent à tout bloquer.',
          ['Les producteurs de pétrole se sont opposés à la sortie des fossiles (France 24)', 'Des analystes parlent d’un « bras de fer autour des intérêts fossiles » (France 24)', 'Premier échec à conclure un accord central depuis 17 ans (The Guardian)'],
          'Les pays étaient aussi profondément divisés sur la finance climatique : les pétroliers ne sont peut-être pas seuls en cause (The Namibian).', '높음'),
        H('Profiter de l’échec pour changer les règles de la COP ?', 'Peut-être que certains pays voient dans cet échec l’occasion de réformer le système du consensus.',
          ['Al Gore et d’autres demandent de réformer la prise de décision (The Guardian)', 'L’envoyée britannique pour le climat estime que « la COP doit changer » (Politico Europe)'],
          'Changer les règles exige lui-même le consensus : c’est peu probable.', '낮음'),
      ],
    },
  },

  // 이스라엘 아이젠코트, 서안 정착민 공격을 '유대인 테러'로 규탄
  12469: {
    ko: {
      summary: '가설 1이 시점과 발언 내용이 잘 맞아 가장 그럴듯해요. 아이젠코트가 연정 협상에서 극우 정당을 배제하는지가 확인의 신호예요.',
      hypotheses: [
        H("'유대인 테러' 발언은 연정 구성을 앞둔 극우 견제구?", '어쩌면 강한 표현은 정착민 문제만이 아니라, 정부 구성을 맡은 아이젠코트가 극우 장관들을 연정에서 밀어내려는 정치적 신호일지도 몰라요.',
          ['아이젠코트는 극우 장관 스모트리치와 벤그비르를 직접 비난했어요 (미들이스트아이)', '선거 결과가 확정되지 않은 상황에서 나온 발언이에요 (프랑스24)', '네타냐후 정부 반대자들이 강력한 대응을 요구했어요 (뉴욕타임스)'],
          '이스라엘 대법원도 정착민이 "민병대처럼" 행동한다고 판결했어요. 정치 계산이 아니라 실제로 심각해진 상황에 대한 반응일 수 있어요 (하아레츠).', '중간'),
        H('미국의 압박을 의식한 발언?', '어쩌면 미국 의회에서 책임을 요구하는 목소리가 나오자, 동맹 관계가 흔들리기 전에 먼저 선을 그은 것일지도 몰라요.',
          ['미국 하원의원이 책임을 요구한 뒤 규탄이 나왔어요 (미들이스트아이)', '아이젠코트는 이번 공격이 "외교 관계에 심각한 피해"를 준다고 했어요 (더 힌두)'],
          '미국 하원의원 한 명의 요구라 무게가 크지 않아요. 국내 정치 요인이 더 클 수 있어요.', '낮음'),
      ],
    },
    en: {
      summary: 'Theory 1 is the most convincing given the timing and the wording. Watch whether Eisenkot shuts far-right parties out of coalition talks.',
      hypotheses: [
        H('“Jewish terrorism” as a shot at the far right ahead of coalition-building?', 'Perhaps the strong language is not only about settlers but a political signal from Eisenkot, now tasked with forming a government, to push far-right ministers out of any coalition.',
          ['Eisenkot directly blamed far-right ministers Smotrich and Ben-Gvir (Middle East Eye)', 'The remarks came while the election result was still unresolved (France 24)', 'Opponents of Netanyahu’s government demanded a strong response (The New York Times)'],
          'Israel’s Supreme Court also ruled that settlers act “like militias” — it may be a genuine reaction to a worsening situation, not political calculation (Haaretz).', '중간'),
        H('A nod to pressure from Washington?', 'Perhaps, as calls for accountability rose in the US Congress, he drew a line before the alliance came under strain.',
          ['The condemnation followed a US congressman’s call for accountability (Middle East Eye)', 'Eisenkot said the attacks seriously damage Israel’s “foreign relations” (The Hindu)'],
          'One congressman’s demand carries limited weight; domestic politics may matter more.', '낮음'),
      ],
    },
    ja: {
      summary: '仮説1は時期と発言内容がよく合い、最ももっともらしいです。アイゼンコット氏が連立協議で極右政党を外すかが確認のサインです。',
      hypotheses: [
        H('「ユダヤ人テロ」発言は連立組閣を前にした極右けん制？', 'もしかすると強い表現は入植者問題だけでなく、組閣を任されたアイゼンコット氏が極右閣僚を連立から締め出すための政治的シグナルなのかもしれません。',
          ['アイゼンコット氏は極右のスモトリッチ氏とベングビール氏を名指しで非難しました（ミドル・イースト・アイ）', '選挙結果が確定していない中での発言です（フランス24）', 'ネタニヤフ政権の反対派が強い対応を求めました（ニューヨーク・タイムズ）'],
          'イスラエル最高裁も入植者が「民兵のように」行動していると判断しました。政治的計算ではなく、深刻化した状況への反応かもしれません（ハアレツ）。', '중간'),
        H('米国の圧力を意識した発言？', 'もしかすると米議会で責任を問う声が上がり、同盟関係が揺らぐ前に先に一線を引いたのかもしれません。',
          ['米下院議員が責任を求めた後に非難が出ました（ミドル・イースト・アイ）', 'アイゼンコット氏は今回の攻撃が「外交関係に深刻な損害」を与えると述べました（ザ・ヒンドゥー）'],
          '米下院議員一人の要求で重みは大きくありません。国内政治の要因のほうが大きいかもしれません。', '낮음'),
      ],
    },
    zh: {
      summary: '假设 1 的时间点与言论内容最吻合，最为可信。阿伊森科特是否在组阁谈判中排除极右翼政党，是验证的信号。',
      hypotheses: [
        H('“犹太恐怖主义”之说是组阁前对极右翼的敲打？', '也许这一强硬措辞不只针对定居者问题，而是受命组阁的阿伊森科特把极右翼部长挤出联合政府的政治信号。',
          ['阿伊森科特点名批评极右翼部长斯莫特里赫和本-格维尔（中东之眼）', '这番话是在选举结果尚未确定时说的（法国24台）', '内塔尼亚胡政府的反对者要求强硬回应（纽约时报）'],
          '以色列最高法院也裁定定居者“像民兵一样”行事，这或许是对恶化局势的真实反应，而非政治算计（国土报）。', '중간'),
        H('顾及美国压力的表态？', '也许在美国国会出现追责呼声后，他赶在同盟关系受损前先划清界限。',
          ['一名美国众议员要求追责后才出现谴责（中东之眼）', '阿伊森科特称袭击严重损害以色列的“外交关系”（印度教徒报）'],
          '一名众议员的要求分量有限，国内政治因素可能更重要。', '낮음'),
      ],
    },
    fr: {
      summary: 'L’hypothèse 1 est la plus convaincante au vu du moment et des mots choisis. À surveiller : Eisenkot écartera-t-il l’extrême droite des négociations de coalition ?',
      hypotheses: [
        H('« Terrorisme juif », une pique à l’extrême droite avant de former la coalition ?', 'Peut-être que ces mots forts ne visent pas que les colons, mais sont un signal politique d’Eisenkot, chargé de former le gouvernement, pour écarter les ministres d’extrême droite.',
          ['Eisenkot a directement accusé les ministres d’extrême droite Smotrich et Ben-Gvir (Middle East Eye)', 'La déclaration intervient alors que le résultat des élections reste incertain (France 24)', 'Les opposants au gouvernement Netanyahou réclament une réponse ferme (The New York Times)'],
          'La Cour suprême israélienne a aussi jugé que les colons agissent « comme des milices » : il peut s’agir d’une vraie réaction à une situation qui s’aggrave (Haaretz).', '중간'),
        H('Un signe adressé à Washington ?', 'Peut-être qu’avec les appels à rendre des comptes au Congrès américain, il a tracé une ligne avant que l’alliance ne se tende.',
          ['La condamnation a suivi l’appel d’un élu américain à rendre des comptes (Middle East Eye)', 'Eisenkot dit que ces attaques nuisent gravement aux « relations extérieures » d’Israël (The Hindu)'],
          'La demande d’un seul élu pèse peu ; la politique intérieure compte sans doute davantage.', '낮음'),
      ],
    },
  },
};
