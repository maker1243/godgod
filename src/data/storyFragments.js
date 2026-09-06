// =====================================================================
// Story Fragments (아카데미 이야기 조각)
// - 각 교수/교장을 처치하면 관련 조각 1개 획득 → state.storyFragments[key] = true
// - 조각 획득 시 화면 아래 큰 대사 패널로 3~4줄 나레이션.
// - 모든 조각 수집 시 "아카데미의 진실" 컷씬(academyTruth 씬) 자동 재생.
// =====================================================================

const STORY_FRAGMENTS = {
  // 인문
  kor:  { title:'국문학과 李 교수의 유언장', lines:[
    '나는 언어의 힘을 믿었다. 하지만 총장은 그 힘을 봉인했다.',
    '한글의 자모 하나하나가 봉인의 열쇠였다는 것을,',
    '나는 죽음의 순간에야 알았다.',
  ]},
  eng:  { title:'金 교수의 편지', lines:[
    '"Shall I compare thee to a summer\'s day?" — 셰익스피어의 시는 봉인이었다.',
    '외국의 문헌이 자모 봉인의 다른 열쇠일 줄이야.',
    '진리는 언어 너머에 있음을.',
  ]},
  // 사회
  biz:  { title:'경영학과 회의록', lines:[
    '이사회는 아카데미를 팔아버리려 했다.',
    '나는 반대했다. 하지만 그가 나를 오염시켰다.',
    '이제야 그의 진짜 목적을 이해한다.',
  ]},
  psy:  { title:'심리학과 상담 기록', lines:[
    '학생들이 매일 밤 같은 악몽을 꾼다고 왔다.',
    '거대한 검은 심장이 아카데미 지하에서 뛴다고.',
    '그것은 꿈이 아니었다.',
  ]},
  // 자연
  phys: { title:'물리학과 실험 노트', lines:[
    '아카데미 지하에서 측정된 중력 이상.',
    '시공간이 접혀 있다. 크로노 코어가 실재한다.',
    '누군가 봉인을 풀고 있다.',
  ]},
  chem: { title:'화학과 조제 일지', lines:[
    '오염된 마나의 분자 구조를 분석했다.',
    '이것은 자연에 없는 원소. 인공적으로 합성됐다.',
    '누가? 그리고 왜?',
  ]},
  // 공학
  cs:   { title:'컴퓨터공학과 커밋 로그', lines:[
    '#!/bin/purge — 아카데미 시스템에서 삭제된 파일들.',
    '봉인 프로토콜의 소스 코드였다.',
    '누군가 봉인 자체를 백도어로 만들었다.',
  ]},
  robot:{ title:'로봇공학과 프로토타입 노트', lines:[
    '내가 만든 자동인형이 밤마다 스스로 움직였다.',
    '총장의 명령을 따랐다.',
    '나는 나 자신도 조종당하고 있었다.',
  ]},
  // 의약
  med:  { title:'의예과 부검 소견서', lines:[
    '학생의 사인은 급성 마나 중독. 지하실 근처에서 발견됐다.',
    '이 케이스가 처음이 아니다. 총장은 은폐를 지시했다.',
    '나는 폭로하려 했다.',
  ]},
  phar: { title:'약학과 처방전 사본', lines:[
    '"기분 안정제" 처방이 급증했다. 학생들이 뭔가를 봤다는 것이다.',
    '나는 약을 조제하며 나 자신도 마셨다.',
    '이제 기억이 흐릿하다.',
  ]},
  // 사범
  math: { title:'수학교육과 미완의 증명', lines:[
    '봉인 방정식의 해가 존재한다.',
    '해를 계산한 자만이 봉인을 풀 수 있다.',
    '나는 계산했고, 침묵했다. 하지만 늦었다.',
  ]},
  pe:   { title:'체육교육과 훈련 일지', lines:[
    '체력만이 살아남는다. 나는 학생들을 단련시켰다.',
    '언젠가 그들이 총장에 맞설 수 있도록.',
    '아직 준비되지 않은 채로 그가 오고 있다.',
  ]},
  // 예체능
  paint:{ title:'회화과 미완성 작품', lines:[
    '캔버스에 그리려 했던 것은 학교의 진짜 얼굴이었다.',
    '붓이 저절로 움직여 다른 그림을 그렸다.',
    '오염이 손끝까지 내려왔다.',
  ]},
  vocal:{ title:'성악과 마지막 아리아', lines:[
    '나는 봉인을 노래로 유지해왔다.',
    '누군가 내 목을 조르는 밤이 있었다.',
    '노래가 멈추면 봉인도 풀린다.',
  ]},
  // 종교철학
  phil: { title:'철학과 미출간 원고', lines:[
    '존재하지 않는 것을 봉인할 수 있는가?',
    '봉인 자체가 그것을 존재하게 만든 것은 아닌가?',
    '나는 답을 찾았다. 그 답이 나를 죽였다.',
  ]},
  rel:  { title:'종교학과 기도문', lines:[
    '어느 신도 아카데미의 지하를 축복하지 않았다.',
    '그것은 신들이 잊은 자리.',
    '오직 인간이 만들어낸 지옥.',
  ]},
  // 정보통신
  lib:  { title:'문헌정보학과 삭제된 인덱스', lines:[
    '아카데미 도서관에서 사라진 500권의 금서.',
    '봉인 이전의 역사가 담겨 있었다.',
    '누가, 언제, 왜 삭제했는지 나는 안다.',
  ]},
  media:{ title:'미디어커뮤니케이션학과 방송 원고', lines:[
    '나는 학교 방송으로 진실을 전하려 했다.',
    '방송은 나가지 못했다. 나 대신 다른 목소리가 나갔다.',
    '학생들은 그 목소리를 아직도 믿고 있다.',
  ]},
  // 미술디자인
  sculpt:{ title:'조소과 미완의 흉상', lines:[
    '총장의 흉상을 만들라는 명령을 받았다.',
    '조각칼이 대리석 대신 내 손을 파고들었다.',
    '나는 재료가 되었다.',
  ]},
  vdesign:{ title:'시각디자인학과 로고 시안', lines:[
    '아카데미 로고의 원형을 뒤집으면 봉인 문양이다.',
    '이 사실을 안 순간 나는 사라질 운명이었다.',
    '너희가 이 조각을 읽는다면, 로고를 다시 보라.',
  ]},
  // 외국어문학
  chn:  { title:'중어중문학과 죽편 번역', lines:[
    '고대 중국의 봉인 의식 기록.',
    '아카데미의 봉인은 그 의식을 그대로 베낀 것.',
    '3000년 전에 이미 실패한 봉인이었다.',
  ]},
  jpn:  { title:'일어일문학과 겐지 주해', lines:[
    '겐지모노가타리의 마지막 장은 봉인 이야기다.',
    '천 년 전 헤이안 궁정도 같은 실수를 반복했다.',
    '역사는 반복된다. 이번엔 우리 차례.',
  ]},
  // 교장
  principal: { title:'교장 崔 총장의 진심', lines:[
    '나는 봉인을 유지하기 위해 이 자리에 있었다.',
    '하지만 봉인은 결국 나를 삼켰다.',
    '너, 학생이여. 이제 네가 이 자리에 앉을 차례다.',
    '아카데미는 너의 것이다.',
  ]},
};

function _storyEnsure() {
  state.storyFragments = state.storyFragments || {};
}

function unlockStoryFragment(key) {
  _storyEnsure();
  if (!STORY_FRAGMENTS[key]) return;
  if (state.storyFragments[key]) return;
  state.storyFragments[key] = Date.now();
  // 화면에 대사 패널 큐잉
  _storyQueue.push({ key, t: 0 });
  if (typeof sfx === 'function') sfx('level');
  if (typeof saveAccountData === 'function') saveAccountData();
  // 전부 모았으면 진실 컷씬 트리거
  const total = Object.keys(STORY_FRAGMENTS).length;
  const owned = Object.keys(state.storyFragments).filter(k => STORY_FRAGMENTS[k]).length;
  if (owned >= total && !state.academyTruthSeen) {
    setTimeout(() => { if (!state.academyTruthSeen) goTo('academyTruth'); }, 3000);
  }
}

// 대사 패널 큐 — 등장하는 조각을 순차적으로 4초씩 하단에 보여줌
const _storyQueue = [];
function updateStoryPanel(dt) {
  if (_storyQueue.length === 0) return;
  const cur = _storyQueue[0];
  cur.t += dt;
  if (cur.t > 5) _storyQueue.shift();
}
function renderStoryPanel() {
  if (_storyQueue.length === 0) return;
  const cur = _storyQueue[0];
  const frag = STORY_FRAGMENTS[cur.key];
  if (!frag) return;
  const alpha = cur.t < 0.4 ? cur.t / 0.4 : (cur.t > 4.5 ? (5 - cur.t) / 0.5 : 1);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const bx = 12, by = H - 62, bw = W - 24, bh = 54;
  pxDraw(bx, by, bw, bh, '#050310');
  pxDraw(bx, by, bw, 1, '#ffefa8');
  pxDraw(bx, by + bh - 1, bw, 1, '#ffefa8');
  pxDraw(bx, by, 1, bh, '#ffefa8');
  pxDraw(bx + bw - 1, by, 1, bh, '#ffefa8');
  drawText('★ 이야기 조각 획득 — ' + frag.title, bx + 6, by + 4, '#ffefa8');
  pxDraw(bx + 4, by + 12, bw - 8, 1, '#3a1e5c');
  for (let i = 0; i < frag.lines.length; i++) {
    drawText(frag.lines[i], bx + 8, by + 16 + i * 8, '#e8d9b0');
  }
  ctx.globalAlpha = 1;
}

// =====================================================================
// Academy Truth 씬 - 최종 컷씬 (모든 조각 수집 후)
// =====================================================================
const ACADEMY_TRUTH_TEXT = [
  '',
  '아카데미의 진실',
  '',
  '이 학교는 원래 지하의 존재를 봉인하기 위해 지어졌다.',
  '',
  '설립자들은 마법과 과학, 예술과 종교의 모든 학문을',
  '봉인의 열쇠로 삼았다.',
  '',
  '오직 모든 계열의 지혜를 하나로 모은 자만이',
  '봉인의 최종 자격이 있었다.',
  '',
  '너는 22명의 교수를 이겼고, 총장의 자리를 얻었다.',
  '',
  '이제 봉인 유지자는 너다.',
  '',
  '이 학교는 앞으로도, 너의 이름으로 그 자리를 지킬 것이다.',
  '',
  '                                                    ~ 끝 ~',
  '',
  '[SPACE] 로 아카데미로 복귀',
];

let _truthT = 0;
function updateAcademyTruth(dt) {
  _truthT += dt;
  if (_truthT > 2 && (keys['Space'] || keys['Enter'] || keys['Escape'])) {
    keys['Space']=false; keys['Enter']=false; keys['Escape']=false;
    state.academyTruthSeen = true;
    if (typeof saveAccountData === 'function') saveAccountData();
    _truthT = 0;
    goTo('academy');
  }
}
function renderAcademyTruth() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W*PX, H*PX);
  // 배경 별
  if (typeof bgStars === 'function') bgStars();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W*PX, H*PX);
  // 스크롤: 화면 아래에서 위로 흐름
  const lineH = 10;
  const totalH = ACADEMY_TRUTH_TEXT.length * lineH;
  const startY = H + 20 - _truthT * 12;
  for (let i = 0; i < ACADEMY_TRUTH_TEXT.length; i++) {
    const y = startY + i * lineH;
    if (y < -10 || y > H + 10) continue;
    const line = ACADEMY_TRUTH_TEXT[i];
    const col = (i === 1) ? '#ffefa8' : (line === '' ? '#000' : '#c8b898');
    const sc  = (i === 1) ? 2 : 1;
    drawText(line, W/2 - textWidth(line, sc)/2, y, col, sc);
  }
  // 하단 안내
  if (_truthT > 2) drawText('[SPACE]', W/2 - textWidth('[SPACE]')/2, H - 4, '#ffefa8');
}
