/**
 * 매일 아침 8시 제미나이로 복지·AI 조사를 하고 내 메일로 보낸다.
 * 설정: script.google.com 새 프로젝트에 붙여넣기
 *  1) 프로젝트 설정 > 스크립트 속성에 GEMINI_API_KEY 추가 (키는 코드에 쓰지 말 것!)
 *  2) setupTrigger() 를 한 번 실행 (권한 허용)
 *  3) 먼저 dailyBrief() 를 수동 실행해서 메일이 오는지 확인
 */
const MODEL = 'gemini-2.5-flash'; // 사용 가능한 최신 모델명으로 바꿀 것

const PROMPT = `너는 복지·AI 동향 '조사 담당'이다. 수집만 하고 의견은 쓰지 않는다.
독자: 울산광역시 남구 삼호동행정복지센터 사회복지 담당 팀장
기간: 최근 48시간 (오래된 자료는 '배경'으로 표시). 우선순위: 울산 남구·삼호동 → 울산시 → 전국
범위: (1) 복지: 복지부·행안부·울산시·남구청 보도자료, 통합돌봄, 인구·돌봄 정책 (2) AI: 공공·행정 AI 활용, 정부 AI 정책, 생성형 AI 신기능
항목마다: 제목 / 출처 기관 / 게시일 / 개별 기사 URL / 핵심 사실 2~3줄 / 확인 상태(원문 확인 | 검색요약만)
규칙: 확인 못한 날짜·URL은 '미확인'. 추측·과장 금지. 개인정보 금지. 복지·AI 구분해 8~12건.`;

function dailyBrief() {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent';
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': key },
    payload: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT }] }],
      tools: [{ google_search: {} }]
    }),
    muteHttpExceptions: true
  });
  const data = JSON.parse(res.getContentText());
  const parts = data.candidates && data.candidates[0] && data.candidates[0].content.parts;
  const body = parts ? parts.map(function (p) { return p.text || ''; }).join('\n')
                     : '오류: ' + res.getContentText();
  const today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  MailApp.sendEmail(Session.getActiveUser().getEmail(),
    '[조사 원자료] 복지·AI 동향 ' + today, body);
}

function setupTrigger() {
  ScriptApp.newTrigger('dailyBrief').timeBased().everyDays(1).atHour(8).create();
}
