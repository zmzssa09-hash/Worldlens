// 기사 요약 앞뒤의 군더더기 걷어내기 (영어 원문·번역문 모두)
//   앞: "WASHINGTON — ", "ABU DHABI, United Arab Emirates — ", "ALIAGA, Turkiye: ", "Tehran, IRNA – ",
//       "FLORIDA (Uruguay), Nov 9 — ", "Nov 11 - ", "Opinion: ", "LIVE: ",
//       번역된 "워싱턴 — ", "필리핀 마닐라 — ", "ブリュッセル — ", "佛罗里达（乌拉圭），11 月 9 日——"
//   뒤: "Read Full Article at RT.com", "The post … appeared first on …", "(VIDEOS)"
const MONTH = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?';
const LEAD = [
  /^[A-Z][A-Z .'’-]{2,}(?:,\s*[A-Z][A-Za-z .'’-]+)?\s*(?:—|–|-|:)\s+/, // 대문자 지명 (+ 나라)
  /^\p{Lu}\p{Ll}+,\s*\p{Lu}\p{L}+\s*(?:—|–)\s+/u, // "Tehran, IRNA – ", 번역된 "Téhéran, IRNA – "
  new RegExp(`^[A-Z][A-Za-z .'’-]{1,40}(?:\\s*\\([^)]{1,30}\\))?,\\s*${MONTH}\\s*\\d{1,2}(?:,\\s*\\d{4})?\\s*(?:\\([^)]{1,20}\\))?\\s*(?:—|–|--|-)\\s*`), // "FLORIDA (Uruguay), Nov 9 — "
  new RegExp(`^${MONTH}\\s+\\d{1,2}(?:,\\s*\\d{4})?\\s*[-–—]\\s*`), // "Nov 11 - "
  /^(?:Opinion|Analysis|Explainer|Comment|Editorial|Live|LIVE|Watch|WATCH|Breaking|BREAKING|Update|UPDATE|Exclusive|EXCLUSIVE|IN BRIEF|In brief|Fact check|Factbox|FACTBOX)\s*[:|–—]\s*/,
  // 번역문의 지명 머리: 한두 낱말 + — (영어 이름 + — 는 "Vladimir Medinsky — presidential aide…"처럼 정상 문장일 수 있어 제외)
  //   번역기가 바꿔 놓은 쉼표(、，)·전각 하이픈(－)도 포함: "アブダビ、アラブ首長国連邦－"
  //   두 번째 낱말은 통신사 영문 이름일 수 있음: "テヘラン、IRNA – "
  /^[^\sA-Za-z,.:!?()、，。]{1,12}(?:[ ,、，]\s*[^\s,.:!?()、，。]{1,15})?(?:\s*[—–－]+\s*|\s+-\s+)/,
  /^[^—–]{1,30}?\d{1,2}\s*月\s*\d{1,2}\s*日\s*[—–]+\s*/, // 번역문의 날짜 머리: "…，11 月 9 日——"
  /^\((?:LEAD|2nd LD|URGENT|AMBIENT|News Focus|Yonhap Feature)[^)]*\)\s*/i,
  /^\[[^\]]{1,30}\]\s*(?=\S)/, // AllAfrica 요약 앞 꼬리표: "[UN News] ", 번역된 "[오늘] "
];
const TAIL = [
  /\s*Read (?:the )?Full Article at \S+\s*$/i,
  /\s*The post .{1,200} appeared first on .{1,80}$/i,
  /\s*\((?:VIDEOS?|PHOTOS?|WATCH|LIVE)\)\s*$/i,
  /\s*(?:Continue reading|Read more|Click here[^.]*)\.{0,3}\s*$/i,
  /\s*\[(?:…|\.\.\.)\]\s*$/,
];
// 요약이라 할 수 없는 것: '[allAfrica]' 같은 꼬리표뿐이거나, 여러 기사를 모은 묶음 소개
const NOT_SUMMARY = [
  /^\[[^\]]{1,40}\]$/,
  /^(?:While You Were Sleeping|Morning Briefing|Evening Briefing|The Morning|Today's headlines|Top stories|News in brief)\b/i,
];

export function cleanSummary(text = '') {
  let s = String(text ?? '').trim();
  for (let i = 0; i < 3; i++) { // "LIVE: WASHINGTON — " 처럼 겹친 경우
    const before = s;
    for (const re of LEAD) s = s.replace(re, '');
    if (s === before) break;
  }
  for (const re of TAIL) s = s.replace(re, '');
  s = s.trim();
  return NOT_SUMMARY.some((re) => re.test(s)) ? '' : s;
}
