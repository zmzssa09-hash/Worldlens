// '3분 스토리' (데모 모드) — AI 없이, 모은 기사 자체에서 이야기를 짜냄
//   1 배경        누가 언제 처음 보도했고, 어느 지역에서 어느 지역으로 퍼졌는지
//   2 무슨 일이    서로 다른 매체의 문장을 시간 순서로 2~3개 (매체·날짜 표시, 비슷한 문장은 하나만)
//   3 왜 중요한가  사건 유형이 왜 큰일인지(impact.js) + 지역별로 몇 곳이 다뤘는지 + 국영 매체 안내
//   4 앞으로 볼 것  사건 유형별로 지켜볼 점 + 지금도 보도가 늘고 있는지(진행 중/잦아드는 중)
// 문단은 줄바꿈(\n)으로 나눔 → 화면에서 문단마다 따로 보여 줌
import { countryName, outletName, SOURCE_BY_ID } from '../sources.js';
import { cleanSummary } from '../textclean.js';
import { whyFor } from './impact.js';

const LOCALE = { ko: 'ko-KR', en: 'en-GB', ja: 'ja-JP', zh: 'zh-CN', fr: 'fr-FR' };
const REGION = {
  ko: { asia: '아시아', europe: '유럽', 'middle-east': '중동', americas: '아메리카', africa: '아프리카', oceania: '오세아니아', global: '국제' },
  en: { asia: 'Asia', europe: 'Europe', 'middle-east': 'the Middle East', americas: 'the Americas', africa: 'Africa', oceania: 'Oceania', global: 'international' },
  ja: { asia: 'アジア', europe: '欧州', 'middle-east': '中東', americas: '米州', africa: 'アフリカ', oceania: 'オセアニア', global: '国際' },
  zh: { asia: '亚洲', europe: '欧洲', 'middle-east': '中东', americas: '美洲', africa: '非洲', oceania: '大洋洲', global: '国际' },
  fr: { asia: 'Asie', europe: 'Europe', 'middle-east': 'Moyen-Orient', americas: 'Amériques', africa: 'Afrique', oceania: 'Océanie', global: 'international' },
};

const L = {
  ko: {
    span: (h) => (h < 24 ? `${Math.max(1, h)}시간` : `${Math.round(h / 24)}일`),
    first: (when, place, title) => `${when}, ${place}에서 처음 보도됐어요.${title ? ` “${title}”라는 제목이었어요.` : ''}`,
    place: (country, outlet) => `${country}의 ${outlet}`,
    spread: (span, nc, no, na) => `그 뒤 ${span} 동안 ${nc}개국 ${no}개 매체가 모두 ${na}건을 보도했어요.`,
    route: (first, rest) => (rest ? `${first} 매체에서 시작해 ${rest} 순으로 관심이 퍼졌어요.` : `주로 ${first} 매체가 다루고 있어요.`),
    sep: ', ',
    cite: (outlet, when) => `(${outlet}, ${when})`,
    regions: (parts) => `지역별로 보면 ${parts}에서 보도했어요.`,
    regionPart: (r, n) => `${r} ${n}곳`,
    state: (names, n) => `${names} 등 국영 매체 ${n}곳도 보도했어요. 국영 매체는 정부 입장을 반영하는 경우가 많으니 '나라별 관점'에서 다른 매체와 비교해 보세요.`,
    hot: (n) => `최근 6시간 동안 새 보도가 ${n}건 나왔어요. 아직 진행 중인 사건이니 새 소식을 지켜보세요.`,
    warm: (n) => `최근 하루 동안 새 보도가 ${n}건 있었어요. 관심이 이어지고 있어요.`,
    cool: (h) => `마지막 보도 뒤로 ${h}시간 넘게 새 소식이 없어, 관심이 잦아드는 중이에요.`,
    recap2: (a, b) => `📌 지금까지: 처음엔 “${a}” 소식이었고, 최근에는 “${b}” 소식이 나왔어요.`,
    recap1: (a) => `📌 지금까지: “${a}”`,
  },
  en: {
    span: (h) => (h < 24 ? `${Math.max(1, h)} hour${h > 1 ? 's' : ''}` : `${Math.round(h / 24)} day${Math.round(h / 24) > 1 ? 's' : ''}`),
    first: (when, place, title) => `It was first reported on ${when} by ${place}.${title ? ` The first headline read: “${title}”.` : ''}`,
    place: (country, outlet) => `${outlet} (${country})`,
    spread: (span, nc, no, na) => `Over the next ${span}, ${no} outlets in ${nc} countries published ${na} reports.`,
    route: (first, rest) => (rest ? `Coverage began in ${first} and spread to ${rest}.` : `Coverage comes mainly from ${first}.`),
    sep: ', ',
    cite: (outlet, when) => `(${outlet}, ${when})`,
    regions: (parts) => `By region: ${parts}.`,
    regionPart: (r, n) => `${r} ${n}`,
    state: (names, n) => `${n} state-run outlet${n > 1 ? 's' : ''}, including ${names}, also covered it. State media often reflect their government’s line — compare them with others under “Country views”.`,
    hot: (n) => `${n} new report${n > 1 ? 's' : ''} in the last 6 hours: this story is still developing.`,
    warm: (n) => `${n} new report${n > 1 ? 's' : ''} in the last day: interest is holding.`,
    cool: (h) => `No new reports for over ${h} hours: attention is fading.`,
    recap2: (a, b) => `📌 So far: it began with “${a}”, and the latest is “${b}”.`,
    recap1: (a) => `📌 So far: “${a}”.`,
  },
  ja: {
    span: (h) => (h < 24 ? `${Math.max(1, h)}時間` : `${Math.round(h / 24)}日`),
    first: (when, place, title) => `${when}、${place}が最初に報じました。${title ? `最初の見出しは「${title}」でした。` : ''}`,
    place: (country, outlet) => `${country}の${outlet}`,
    spread: (span, nc, no, na) => `その後${span}の間に、${nc}か国の${no}メディアが計${na}件を報じました。`,
    route: (first, rest) => (rest ? `${first}のメディアから始まり、${rest}の順に関心が広がりました。` : `主に${first}のメディアが報じています。`),
    sep: '、',
    cite: (outlet, when) => `（${outlet}、${when}）`,
    regions: (parts) => `地域別では、${parts}が報じています。`,
    regionPart: (r, n) => `${r}${n}社`,
    state: (names, n) => `${names}など国営メディア${n}社も報じました。国営メディアは政府の立場を反映することが多いので、「国別の視点」で他のメディアと比べてみてください。`,
    hot: (n) => `直近6時間で新しい報道が${n}件ありました。まだ進行中の出来事なので、続報に注目しましょう。`,
    warm: (n) => `直近1日で新しい報道が${n}件ありました。関心が続いています。`,
    cool: (h) => `最後の報道から${h}時間以上新しいニュースがなく、関心が薄れつつあります。`,
    recap2: (a, b) => `📌 これまで：「${a}」から始まり、最新では「${b}」となっています。`,
    recap1: (a) => `📌 これまで：「${a}」`,
  },
  zh: {
    span: (h) => (h < 24 ? `${Math.max(1, h)}小时` : `${Math.round(h / 24)}天`),
    first: (when, place, title) => `${when}，${place}最先报道了此事。${title ? `第一篇报道的标题是“${title}”。` : ''}`,
    place: (country, outlet) => `${country}的${outlet}`,
    spread: (span, nc, no, na) => `此后${span}内，${nc}个国家的${no}家媒体共发布了${na}篇报道。`,
    route: (first, rest) => (rest ? `关注从${first}媒体开始，依次扩散到${rest}。` : `主要由${first}媒体报道。`),
    sep: '、',
    cite: (outlet, when) => `（${outlet}，${when}）`,
    regions: (parts) => `按地区看，${parts}进行了报道。`,
    regionPart: (r, n) => `${r}${n}家`,
    state: (names, n) => `${names}等${n}家官方媒体也作了报道。官方媒体往往反映政府立场，可以在“各国视角”中与其他媒体比较。`,
    hot: (n) => `过去6小时内有${n}篇新报道，事件仍在发展，请留意后续消息。`,
    warm: (n) => `过去一天内有${n}篇新报道，关注度仍在持续。`,
    cool: (h) => `距最后一篇报道已超过${h}小时没有新消息，关注度正在减退。`,
    recap2: (a, b) => `📌 目前为止：从“${a}”开始，最新进展是“${b}”。`,
    recap1: (a) => `📌 目前为止：“${a}”。`,
  },
  fr: {
    span: (h) => (h < 24 ? `${Math.max(1, h)} heure${h > 1 ? 's' : ''}` : `${Math.round(h / 24)} jour${Math.round(h / 24) > 1 ? 's' : ''}`),
    first: (when, place, title) => `L’information a d’abord été publiée le ${when} par ${place}.${title ? ` Premier titre : « ${title} ».` : ''}`,
    place: (country, outlet) => `${outlet} (${country})`,
    spread: (span, nc, no, na) => `En ${span}, ${no} médias de ${nc} pays ont publié ${na} articles.`,
    route: (first, rest) => (rest ? `La couverture est partie de : ${first}, puis s’est étendue à : ${rest}.` : `La couverture vient surtout de : ${first}.`),
    sep: ', ',
    cite: (outlet, when) => `(${outlet}, ${when})`,
    regions: (parts) => `Par région : ${parts}.`,
    regionPart: (r, n) => `${r} ${n}`,
    state: (names, n) => `${n} média${n > 1 ? 's' : ''} d’État, dont ${names}, en ont aussi parlé. Ils reflètent souvent la ligne de leur gouvernement : comparez-les aux autres dans « Points de vue ».`,
    hot: (n) => `${n} nouvel${n > 1 ? 's' : ''} article${n > 1 ? 's' : ''} ces 6 dernières heures : l’affaire est toujours en cours.`,
    warm: (n) => `${n} nouvel${n > 1 ? 's' : ''} article${n > 1 ? 's' : ''} ces dernières 24 heures : l’intérêt se maintient.`,
    cool: (h) => `Aucun nouvel article depuis plus de ${h} heures : l’attention retombe.`,
    recap2: (a, b) => `📌 Jusqu’ici : tout a commencé par « ${a} », et le dernier développement est « ${b} ».`,
    recap1: (a) => `📌 Jusqu’ici : « ${a} ».`,
  },
};

// 사건 유형별 '앞으로 볼 것' [ko, en, ja, zh, fr]
const WATCH = {
  nkorea: ['북한의 추가 발사나 도발이 이어지는지, 한·미·일과 중국이 어떻게 대응하는지 지켜보세요.', 'Watch for further launches or provocations, and how South Korea, the US, Japan and China respond.', 'さらなる発射や挑発が続くか、日米韓と中国がどう対応するかに注目しましょう。', '关注朝鲜是否继续发射或挑衅，以及韩美日和中国如何回应。', 'Surveillez d’éventuels nouveaux tirs ou provocations, et la réaction de Séoul, Washington, Tokyo et Pékin.'],
  korea: ['한국 정부와 기업의 공식 대응, 그리고 해외 언론의 후속 평가를 지켜보세요.', 'Watch for official responses from the Korean government and companies, and follow-up assessments abroad.', '韓国政府と企業の公式対応、そして海外メディアの続報での評価に注目しましょう。', '关注韩国政府和企业的正式回应，以及外国媒体的后续评价。', 'Surveillez les réactions officielles du gouvernement et des entreprises coréennes, et les analyses à l’étranger.'],
  chips: ['관련 기업의 주가와 실적 발표, 미국·중국 정부의 수출 규제나 조사 결과가 나오는지 지켜보세요.', 'Watch the companies’ share prices and earnings, and any US or Chinese export controls or investigation findings.', '関連企業の株価や決算、米中政府の輸出規制や調査結果に注目しましょう。', '关注相关企业的股价和业绩，以及美中政府的出口管制或调查结果。', 'Surveillez le cours et les résultats des entreprises, ainsi que d’éventuels contrôles à l’export ou conclusions d’enquête.'],
  arts: ['수상작·작품의 번역·개봉 소식과 작품을 둘러싼 반응을 지켜보세요.', 'Watch for translations, releases and how audiences and critics respond.', '翻訳や公開の知らせ、作品への反応に注目しましょう。', '关注作品的翻译、上映消息以及各方反响。', 'Surveillez les traductions, sorties et réactions du public et de la critique.'],
  ai: ['규제 당국의 결정, 경쟁 기업들의 대응, 이 기술이 실제 서비스에 언제 들어오는지 지켜보세요.', 'Watch regulators’ decisions, rivals’ responses and when the technology reaches real products.', '規制当局の判断、競合企業の対応、その技術が実際のサービスにいつ入るかに注目しましょう。', '关注监管机构的决定、竞争企业的回应，以及这项技术何时进入实际服务。', 'Surveillez les décisions des régulateurs, la riposte des concurrents et l’arrivée de la technologie dans les produits.'],
  cyber: ['피해 규모가 더 밝혀지는지, 공격 배후로 지목된 나라가 어떻게 반응하는지, 보안 업데이트가 나오는지 지켜보세요.', 'Watch whether the damage grows, how the accused country responds and whether security patches are released.', '被害の規模がさらに明らかになるか、名指しされた国の反応、セキュリティ更新の有無に注目しましょう。', '关注受害规模是否扩大、被指幕后的国家如何回应，以及是否发布安全更新。', 'Surveillez l’ampleur des dégâts, la réaction du pays mis en cause et la publication de correctifs.'],
  spy: ['수사·재판 결과와 외교관 추방 같은 보복 조치가 이어지는지 지켜보세요.', 'Watch the investigation or trial, and whether tit-for-tat measures such as expulsions follow.', '捜査や裁判の結果、外交官追放などの報復措置が続くかに注目しましょう。', '关注调查或审判结果，以及是否出现驱逐外交官等报复措施。', 'Surveillez l’enquête ou le procès, et d’éventuelles mesures de rétorsion comme des expulsions.'],
  rates: ['다음 금리 결정 날짜와, 그 뒤 환율·대출 금리가 어떻게 움직이는지 지켜보세요.', 'Watch the next rate-decision date and how currencies and loan rates move afterwards.', '次の金利決定の日程と、その後の為替やローン金利の動きに注目しましょう。', '关注下一次利率决议的日期，以及之后汇率和贷款利率的走势。', 'Surveillez la date de la prochaine décision de taux et l’évolution des changes et des crédits.'],
  trade: ['상대국의 보복 조치, 협상 일정, 실제로 관세가 적용되는 날짜를 지켜보세요.', 'Watch for retaliation, the negotiating calendar and the date tariffs actually take effect.', '相手国の報復措置、交渉日程、関税が実際に適用される日に注目しましょう。', '关注对方的报复措施、谈判日程以及关税实际生效的日期。', 'Surveillez les représailles, le calendrier des négociations et la date d’entrée en vigueur des droits.'],
  energy: ['국제 유가·가스값이 어디까지 움직이는지, 산유국들이 생산량을 바꾸는지 지켜보세요.', 'Watch how far oil and gas prices move and whether producers change output.', '原油・ガス価格の動きと、産油国が生産量を変えるかに注目しましょう。', '关注国际油气价格的走势，以及产油国是否调整产量。', 'Surveillez l’évolution du pétrole et du gaz, et un éventuel changement de production des pays producteurs.'],
  markets: ['며칠 동안 흐름이 이어지는지, 중앙은행이나 정부가 대응에 나서는지 지켜보세요.', 'Watch whether the trend lasts for several days and whether central banks or governments step in.', '流れが数日続くか、中央銀行や政府が対応に乗り出すかに注目しましょう。', '关注趋势是否持续数日，以及央行或政府是否出手。', 'Surveillez si la tendance dure plusieurs jours et si banques centrales ou gouvernements interviennent.'],
  company: ['회사의 공식 발표, 주가, 규제 당국이나 법원의 판단을 지켜보세요.', 'Watch the company’s statements, its share price and any decisions by regulators or courts.', '会社の公式発表、株価、規制当局や裁判所の判断に注目しましょう。', '关注公司的正式声明、股价，以及监管机构或法院的裁决。', 'Surveillez les annonces de l’entreprise, son cours et les décisions des régulateurs ou tribunaux.'],
  disaster: ['피해 규모가 어디까지 늘어나는지, 구조·복구와 국제 지원이 어떻게 이뤄지는지 지켜보세요.', 'Watch how high the toll climbs and how rescue, recovery and international aid unfold.', '被害がどこまで広がるか、救助・復旧や国際支援の動きに注目しましょう。', '关注灾情是否扩大，以及救援、重建和国际援助的进展。', 'Surveillez l’évolution du bilan, les secours, la reconstruction et l’aide internationale.'],
  health: ['환자 수가 늘어나는지, 세계보건기구(WHO)나 각국이 여행 주의보를 내는지 지켜보세요.', 'Watch whether case numbers rise and whether the WHO or governments issue travel advisories.', '感染者が増えるか、WHOや各国が渡航注意を出すかに注目しましょう。', '关注病例是否增加，以及世卫组织或各国是否发布旅行提醒。', 'Surveillez la hausse des cas et d’éventuels avis aux voyageurs de l’OMS ou des États.'],
  climate: ['나라들이 구체적인 숫자(감축 목표·기금)에 합의하는지, 그 약속이 실제 법으로 이어지는지 지켜보세요.', 'Watch whether countries agree on concrete numbers — targets, funding — and turn them into law.', '各国が削減目標や資金など具体的な数字で合意し、それが法律になるかに注目しましょう。', '关注各国是否就减排目标、资金等具体数字达成一致，并落实为法律。', 'Surveillez un accord sur des chiffres concrets (objectifs, financements) et leur traduction en lois.'],
  space: ['다른 연구진의 검증, 다음 실험·발사 일정을 지켜보세요.', 'Watch for independent verification and the next experiments or launches.', '他の研究チームによる検証や、次の実験・打ち上げの日程に注目しましょう。', '关注其他研究团队的验证，以及下一步实验或发射计划。', 'Surveillez la vérification par d’autres équipes et les prochaines expériences ou lancements.'],
  migration: ['정책이 실제로 바뀌는지, 법원 판결이나 주변국의 대응이 나오는지 지켜보세요.', 'Watch whether policy actually changes, and for court rulings or neighbours’ responses.', '政策が実際に変わるか、裁判所の判断や周辺国の対応に注目しましょう。', '关注政策是否真正改变，以及法院裁决或邻国的回应。', 'Surveillez un changement effectif de politique, les décisions de justice et la réaction des voisins.'],
  transport: ['사고 원인 조사 결과와, 같은 노선·기종의 운행 중단이나 안전 점검이 이어지는지 지켜보세요.', 'Watch the investigation into the cause and any groundings or safety checks on the same routes or vehicles.', '事故原因の調査結果と、同じ路線・機種の運行停止や安全点検に注目しましょう。', '关注事故原因调查结果，以及同线路、同型号是否停运或接受安全检查。', 'Surveillez l’enquête sur les causes et d’éventuels arrêts ou contrôles sur les mêmes lignes ou appareils.'],
  accident: ['사고 원인과 책임자, 그리고 안전 규정이 바뀌는지 지켜보세요.', 'Watch for the cause, who is held responsible and whether safety rules change.', '事故の原因と責任の所在、安全規則が変わるかに注目しましょう。', '关注事故原因、责任人，以及安全规定是否修改。', 'Surveillez les causes, les responsabilités et une éventuelle révision des règles de sécurité.'],
  court: ['다음 재판 일정과 판결, 항소 여부를 지켜보세요.', 'Watch the next hearing, the verdict and whether there is an appeal.', '次の公判日程と判決、控訴の有無に注目しましょう。', '关注下一次开庭、判决结果以及是否上诉。', 'Surveillez la prochaine audience, le verdict et un éventuel appel.'],
  mideast: ['확전이나 휴전 신호, 국제 유가, 주변국과 미국의 움직임을 지켜보세요.', 'Watch for signs of escalation or ceasefire, oil prices, and moves by neighbours and the US.', '拡大か停戦かの兆し、原油価格、周辺国と米国の動きに注目しましょう。', '关注局势升级或停火的迹象、国际油价，以及邻国和美国的动向。', 'Surveillez les signes d’escalade ou de trêve, le pétrole, et les gestes des voisins et des États-Unis.'],
  ukraine: ['협상의 다음 일정과 휴전 조건, 전선의 변화, 유럽 가스값과 곡물 가격을 지켜보세요.', 'Watch the next round of talks, ceasefire terms, changes at the front, and European gas and grain prices.', '次の交渉日程や停戦条件、前線の変化、欧州のガス価格と穀物価格に注目しましょう。', '关注下一轮谈判、停火条件、前线变化，以及欧洲天然气和粮食价格。', 'Surveillez le prochain cycle de pourparlers, les conditions d’un cessez-le-feu, le front, le gaz et les céréales.'],
  us: ['실제 정책(행정명령·법안·관세)으로 이어지는지, 의회와 법원이 어떻게 반응하는지 지켜보세요.', 'Watch whether it turns into actual policy — orders, bills, tariffs — and how Congress and the courts react.', '大統領令・法案・関税など実際の政策につながるか、議会や裁判所の反応に注目しましょう。', '关注是否转化为行政令、法案、关税等实际政策，以及国会和法院的反应。', 'Surveillez sa traduction en mesures concrètes (décrets, lois, droits de douane) et la réaction du Congrès et des tribunaux.'],
  elections: ['결과 확정과 연정 협상, 새 정부의 첫 정책을 지켜보세요.', 'Watch for final results, coalition talks and the new government’s first policies.', '結果の確定や連立交渉、新政府の最初の政策に注目しましょう。', '关注最终结果、组阁谈判以及新政府的首批政策。', 'Surveillez les résultats définitifs, les négociations de coalition et les premières mesures du nouveau gouvernement.'],
  war: ['사상자 규모, 휴전 협상이나 국제 사회의 중재, 주변 지역으로 번지는지를 지켜보세요.', 'Watch casualty figures, ceasefire talks or mediation, and whether fighting spreads.', '死傷者の規模、停戦交渉や国際社会の仲介、周辺への拡大に注目しましょう。', '关注伤亡规模、停火谈判或国际调停，以及冲突是否外溢。', 'Surveillez le bilan humain, les pourparlers ou médiations, et un éventuel débordement du conflit.'],
  violence: ['범행 동기와 배후 수사 결과, 그 나라의 치안 대책 변화를 지켜보세요.', 'Watch for the motive, the investigation’s findings and any change in security measures.', '犯行の動機や背後関係の捜査結果、その国の治安対策の変化に注目しましょう。', '关注作案动机和幕后调查结果，以及该国治安措施的变化。', 'Surveillez le mobile, les conclusions de l’enquête et l’évolution des mesures de sécurité.'],
  policy: ['언제부터 시행되는지, 반대 여론이나 법적 다툼이 생기는지 지켜보세요.', 'Watch when it takes effect and whether it faces opposition or legal challenges.', 'いつから施行されるか、反対世論や法的な争いが起きるかに注目しましょう。', '关注何时生效，以及是否遭遇反对或法律挑战。', 'Surveillez la date d’entrée en vigueur et d’éventuelles oppositions ou recours.'],
  religion: ['발언에 대한 각국 정부와 신자들의 반응을 지켜보세요.', 'Watch how governments and believers react to the remarks.', '発言に対する各国政府や信者の反応に注目しましょう。', '关注各国政府和信众对相关言论的反应。', 'Surveillez les réactions des gouvernements et des fidèles.'],
  sports: ['다음 경기 일정과 선수·팀의 공식 발표를 지켜보세요.', 'Watch the next fixtures and official statements from the players or teams.', '次の試合日程と選手・チームの公式発表に注目しましょう。', '关注下一场比赛安排以及球员、球队的正式声明。', 'Surveillez les prochains matchs et les annonces officielles des joueurs ou des équipes.'],
};
const IDX = { ko: 0, en: 1, ja: 2, zh: 3, fr: 4 };

// 문장 비교용 낱말 묶음 (한·중·일은 두 글자씩)
const tokens = (s) => {
  const t = String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const words = t.split(/\s+/).filter((w) => w.length > 1);
  const out = new Set(words);
  for (const w of words) if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(w)) for (let i = 0; i < w.length - 1; i++) out.add(w.slice(i, i + 2));
  return out;
};
const similar = (a, b) => {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / Math.max(1, Math.min(a.size, b.size));
};

function firstSentence(text = '', max = 260) {
  const t = String(text).trim();
  const m = t.match(/^.{25,}?(?:[.!?](?=\s|$)|[。！？])/);
  const s = (m?.[0] || t).trim();
  return s.length > max ? '' : s; // 너무 긴 건 잘라 붙이지 않고 버림
}
const complete = (s) => s.length >= 25 && !/(?:…|\.\.\.?)$/.test(s) && /[.!?。！？"”’」』)]$/.test(s);

// articles: articlesForEvent(id, lang) — 오래된 것부터, t_title/t_summary = 번역문
export function buildStory(event, articles, lang, kind, now = Date.now()) {
  const S = L[lang] || L.en;
  const JOIN = lang === 'ja' || lang === 'zh' ? '' : ' '; // 일본어·중국어는 문장 사이에 띄어쓰기를 하지 않음
  const R = REGION[lang] || REGION.en;
  const loc = LOCALE[lang] || 'en-GB';
  const done = (a) => lang === 'en' || a.t_title != null;
  const title = (a) => (lang === 'en' ? a.title : a.t_title);
  const summary = (a) => cleanSummary((lang === 'en' ? a.summary : a.t_summary) || '');
  const ts = (a) => Date.parse(a.published_at);
  const day = (a) => new Date(ts(a)).toLocaleDateString(loc, { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
  const dayHour = (a) => new Date(ts(a)).toLocaleString(loc, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' });
  const sorted = [...articles].sort((x, y) => ts(x) - ts(y));
  const first = sorted[0], last = sorted[sorted.length - 1];
  const outlets = new Set(sorted.map((a) => a.source_id));
  const countries = new Set(sorted.map((a) => a.country));

  // 1) 배경: 첫 보도 + 퍼진 범위 + 지역 순서
  const regionOrder = [];
  for (const a of sorted) {
    const r = SOURCE_BY_ID[a.source_id]?.region;
    if (r && r !== 'global' && !regionOrder.includes(r)) regionOrder.push(r);
  }
  const spanH = Math.round((ts(last) - ts(first)) / 3600e3);
  const bg = [
    S.first(dayHour(first), S.place(countryName(first.country, lang), outletName(first.source_id, lang)), done(first) ? title(first) : ''),
    sorted.length > 1 ? S.spread(S.span(spanH), countries.size, outlets.size, sorted.length) : '',
    regionOrder.length ? S.route(R[regionOrder[0]], regionOrder.slice(1, 4).map((r) => R[r]).join(S.sep)) : '',
  ].filter(Boolean).join(JOIN);

  // 2) 무슨 일이: 매체마다 온전한 첫 문장 → 시간 순 → 비슷한 문장 빼고 처음·중간·최근에서 고름 (최대 3개)
  const cands = [];
  const seenOutlet = new Set();
  for (const a of sorted) {
    if (!done(a) || seenOutlet.has(a.source_id)) continue;
    const s = firstSentence(summary(a));
    if (!complete(s)) continue;
    seenOutlet.add(a.source_id);
    cands.push({ a, s, tk: tokens(s) });
  }
  const order = cands.length <= 3 ? cands : [cands[0], cands[cands.length - 1], cands[Math.floor(cands.length / 2)], ...cands.slice(1)];
  const picked = [];
  for (const c of order) {
    if (picked.length >= 3) break;
    if (picked.some((p) => similar(p.tk, c.tk) > 0.5)) continue;
    picked.push(c);
  }
  picked.sort((x, y) => ts(x.a) - ts(y.a));
  const happened = picked.map((c) => `${c.s} ${S.cite(outletName(c.a.source_id, lang), day(c.a))}`).join('\n');

  // 3) 왜 중요한가: 유형 설명 + 지역 분포 + 국영 매체
  const perRegion = {};
  for (const id of outlets) { const r = SOURCE_BY_ID[id]?.region; if (r) perRegion[r] = (perRegion[r] || 0) + 1; }
  const regionParts = Object.entries(perRegion).filter(([r]) => r !== 'global').sort((x, y) => y[1] - x[1]).slice(0, 4).map(([r, n]) => S.regionPart(R[r], n));
  const stateIds = [...outlets].filter((id) => SOURCE_BY_ID[id]?.stateMedia);
  const why = [
    whyFor(kind, lang),
    regionParts.length > 1 ? S.regions(regionParts.join(S.sep)) : '',
  ].filter(Boolean).join(JOIN);
  const state = stateIds.length ? S.state(stateIds.slice(0, 2).map((id) => outletName(id, lang)).join(S.sep), stateIds.length) : '';

  // 4) 앞으로 볼 것: 유형별 + 지금 보도 흐름
  const in6 = sorted.filter((a) => now - ts(a) <= 6 * 3600e3).length;
  const in24 = sorted.filter((a) => now - ts(a) <= 24 * 3600e3).length;
  const sinceLast = Math.floor((now - ts(last)) / 3600e3);
  const momentum = in6 >= 2 ? S.hot(in6) : in24 >= 2 ? S.warm(in24) : sinceLast >= 12 ? S.cool(sinceLast) : '';
  // 맨 위에 뉴스 흐름 요약: 처음 제목 → 최신 제목 (번역된 제목만, 둘이 거의 같으면 하나만)
  const tdone = sorted.filter((x) => done(x) && title(x));
  const cut = (t) => { t = cleanSummary(t); return t.length > 90 ? `${t.slice(0, 88).replace(/\s+\S*$/, '')}…` : t; };
  let recap = '';
  if (tdone.length) {
    const a0 = tdone[0], a1 = tdone[tdone.length - 1];
    const t0 = cut(title(a0)), t1 = cut(title(a1));
    recap = a0 === a1 || similar(tokens(t0), tokens(t1)) > 0.6 ? S.recap1(t1) : S.recap2(t0, t1);
  }
  const watch = [recap, WATCH[kind]?.[IDX[lang] ?? 1] || '', momentum].filter(Boolean).join('\n');

  return { background: bg, what_happened: happened, why, state, watch };
}
