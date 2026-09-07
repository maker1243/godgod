// =====================================================================
// Story Fragments (아카데미 이야기 조각)
// - 각 교수/교장을 처치하면 관련 조각 1개 획득 → state.storyFragments[key] = true
// - 조각 획득 시 화면 아래 큰 대사 패널로 3~4줄 나레이션.
// - 모든 조각 수집 시 "아카데미의 진실" 컷씬(academyTruth 씬) 자동 재생.
// =====================================================================

// 이야기 조각: ko / en 두 언어 모두 지원. runtime 에 state.lang 으로 선택.
const STORY_FRAGMENTS = {
  kor:  { ko:{ title:'국문학과 李 교수의 유언장', lines:['나는 언어의 힘을 믿었다. 하지만 총장은 그 힘을 봉인했다.','한글의 자모 하나하나가 봉인의 열쇠였다는 것을,','나는 죽음의 순간에야 알았다.'] },
          en:{ title:'Prof. Lee\'s Last Will (Korean Lit)',      lines:['I believed in the power of language. The Principal sealed it.','Every hangul jamo was a key to the seal.','I only learned this at the moment of my death.'] } },
  eng:  { ko:{ title:'金 교수의 편지', lines:['"Shall I compare thee to a summer\'s day?" — 셰익스피어의 시는 봉인이었다.','외국의 문헌이 자모 봉인의 다른 열쇠일 줄이야.','진리는 언어 너머에 있음을.'] },
          en:{ title:'Prof. Kim\'s Letter (English Lit)',        lines:['"Shall I compare thee..." — the sonnets were a seal.','Foreign scripts were another key entirely.','Truth lies beyond every tongue.'] } },
  biz:  { ko:{ title:'경영학과 회의록', lines:['이사회는 아카데미를 팔아버리려 했다.','나는 반대했다. 하지만 그가 나를 오염시켰다.','이제야 그의 진짜 목적을 이해한다.'] },
          en:{ title:'Board Minutes (Business)',                 lines:['The board wanted to sell the Academy.','I opposed. He corrupted me for it.','Now I finally understand his real goal.'] } },
  psy:  { ko:{ title:'심리학과 상담 기록', lines:['학생들이 매일 밤 같은 악몽을 꾼다고 왔다.','거대한 검은 심장이 아카데미 지하에서 뛴다고.','그것은 꿈이 아니었다.'] },
          en:{ title:'Counseling Notes (Psychology)',            lines:['Students kept reporting the same nightmare.','A giant black heart beating beneath the Academy.','It was never a dream.'] } },
  phys: { ko:{ title:'물리학과 실험 노트', lines:['아카데미 지하에서 측정된 중력 이상.','시공간이 접혀 있다. 크로노 코어가 실재한다.','누군가 봉인을 풀고 있다.'] },
          en:{ title:'Lab Notebook (Physics)',                   lines:['Gravitational anomalies beneath the Academy.','Spacetime is folded. The Chrono Core is real.','Someone is unsealing it.'] } },
  chem: { ko:{ title:'화학과 조제 일지', lines:['오염된 마나의 분자 구조를 분석했다.','이것은 자연에 없는 원소. 인공적으로 합성됐다.','누가? 그리고 왜?'] },
          en:{ title:'Compound Log (Chemistry)',                 lines:['I analyzed the molecular structure of the corruption.','No natural element matches it. It was synthesized.','By whom, and why?'] } },
  cs:   { ko:{ title:'컴퓨터공학과 커밋 로그', lines:['#!/bin/purge — 아카데미 시스템에서 삭제된 파일들.','봉인 프로토콜의 소스 코드였다.','누군가 봉인 자체를 백도어로 만들었다.'] },
          en:{ title:'Commit Log (Computer Sci)',                lines:['#!/bin/purge — files erased from Academy systems.','It was the seal-protocol source.','Someone turned the seal itself into a backdoor.'] } },
  robot:{ ko:{ title:'로봇공학과 프로토타입 노트', lines:['내가 만든 자동인형이 밤마다 스스로 움직였다.','총장의 명령을 따랐다.','나는 나 자신도 조종당하고 있었다.'] },
          en:{ title:'Prototype Notes (Robotics)',               lines:['My automatons moved on their own each night.','They obeyed the Principal.','I too was being remotely operated.'] } },
  med:  { ko:{ title:'의예과 부검 소견서', lines:['학생의 사인은 급성 마나 중독. 지하실 근처에서 발견됐다.','이 케이스가 처음이 아니다. 총장은 은폐를 지시했다.','나는 폭로하려 했다.'] },
          en:{ title:'Autopsy Report (Medicine)',                lines:['Cause of death: acute mana poisoning. Body found near the basement.','Not the first case. The Principal ordered a coverup.','I was going to expose it.'] } },
  phar: { ko:{ title:'약학과 처방전 사본', lines:['"기분 안정제" 처방이 급증했다. 학생들이 뭔가를 봤다는 것이다.','나는 약을 조제하며 나 자신도 마셨다.','이제 기억이 흐릿하다.'] },
          en:{ title:'Prescription Copy (Pharmacy)',             lines:['"Mood stabilizer" prescriptions spiked. Students had seen something.','I compounded the pills and swallowed them myself.','My memory is a fog now.'] } },
  math: { ko:{ title:'수학교육과 미완의 증명', lines:['봉인 방정식의 해가 존재한다.','해를 계산한 자만이 봉인을 풀 수 있다.','나는 계산했고, 침묵했다. 하지만 늦었다.'] },
          en:{ title:'Unfinished Proof (Math Edu)',              lines:['The seal equation has a solution.','Only those who compute it can undo the seal.','I did. I stayed silent. It was too late.'] } },
  pe:   { ko:{ title:'체육교육과 훈련 일지', lines:['체력만이 살아남는다. 나는 학생들을 단련시켰다.','언젠가 그들이 총장에 맞설 수 있도록.','아직 준비되지 않은 채로 그가 오고 있다.'] },
          en:{ title:'Training Log (PE Edu)',                    lines:['Only endurance survives. I trained the students hard.','So one day they might face the Principal.','He comes before they are ready.'] } },
  paint:{ ko:{ title:'회화과 미완성 작품', lines:['캔버스에 그리려 했던 것은 학교의 진짜 얼굴이었다.','붓이 저절로 움직여 다른 그림을 그렸다.','오염이 손끝까지 내려왔다.'] },
          en:{ title:'Unfinished Canvas (Painting)',             lines:['I meant to paint the school\'s true face.','The brush moved by itself and painted something else.','The corruption reached my fingertips.'] } },
  vocal:{ ko:{ title:'성악과 마지막 아리아', lines:['나는 봉인을 노래로 유지해왔다.','누군가 내 목을 조르는 밤이 있었다.','노래가 멈추면 봉인도 풀린다.'] },
          en:{ title:'Last Aria (Vocal)',                        lines:['I have kept the seal held with my song.','Some nights, unseen hands close around my throat.','When the song stops, the seal falls.'] } },
  phil: { ko:{ title:'철학과 미출간 원고', lines:['존재하지 않는 것을 봉인할 수 있는가?','봉인 자체가 그것을 존재하게 만든 것은 아닌가?','나는 답을 찾았다. 그 답이 나를 죽였다.'] },
          en:{ title:'Unpublished Manuscript (Philosophy)',      lines:['Can one seal a thing that does not exist?','Or does the seal itself will it into being?','I found the answer. It killed me.'] } },
  rel:  { ko:{ title:'종교학과 기도문', lines:['어느 신도 아카데미의 지하를 축복하지 않았다.','그것은 신들이 잊은 자리.','오직 인간이 만들어낸 지옥.'] },
          en:{ title:'Prayer Text (Religion)',                   lines:['No god ever blessed the Academy\'s basement.','It is a place the gods forgot.','A hell built by human hands.'] } },
  lib:  { ko:{ title:'문헌정보학과 삭제된 인덱스', lines:['아카데미 도서관에서 사라진 500권의 금서.','봉인 이전의 역사가 담겨 있었다.','누가, 언제, 왜 삭제했는지 나는 안다.'] },
          en:{ title:'Deleted Index (Library Science)',          lines:['500 banned books vanished from the library.','They held the history before the sealing.','I know who erased them, when, and why.'] } },
  media:{ ko:{ title:'미디어커뮤니케이션학과 방송 원고', lines:['나는 학교 방송으로 진실을 전하려 했다.','방송은 나가지 못했다. 나 대신 다른 목소리가 나갔다.','학생들은 그 목소리를 아직도 믿고 있다.'] },
          en:{ title:'Broadcast Script (Media Comm)',            lines:['I tried to tell the truth on the school broadcast.','My voice was replaced with another.','The students still trust that voice.'] } },
  sculpt:{ko:{ title:'조소과 미완의 흉상', lines:['총장의 흉상을 만들라는 명령을 받았다.','조각칼이 대리석 대신 내 손을 파고들었다.','나는 재료가 되었다.'] },
          en:{ title:'Unfinished Bust (Sculpture)',              lines:['I was ordered to sculpt the Principal.','My chisel bit into my hand, not the marble.','I became the material.'] } },
  vdesign:{ko:{ title:'시각디자인학과 로고 시안', lines:['아카데미 로고의 원형을 뒤집으면 봉인 문양이다.','이 사실을 안 순간 나는 사라질 운명이었다.','너희가 이 조각을 읽는다면, 로고를 다시 보라.'] },
          en:{ title:'Logo Draft (Visual Design)',               lines:['Invert the Academy logo and you get the seal glyph.','The moment I noticed, I was already doomed.','If you read this, look at the logo again.'] } },
  chn:  { ko:{ title:'중어중문학과 죽편 번역', lines:['고대 중국의 봉인 의식 기록.','아카데미의 봉인은 그 의식을 그대로 베낀 것.','3000년 전에 이미 실패한 봉인이었다.'] },
          en:{ title:'Bamboo Slip Translation (Chinese Lit)',    lines:['Ancient Chinese records of a sealing rite.','The Academy\'s seal is a copy of that rite.','It had already failed 3000 years ago.'] } },
  jpn:  { ko:{ title:'일어일문학과 겐지 주해', lines:['겐지모노가타리의 마지막 장은 봉인 이야기다.','천 년 전 헤이안 궁정도 같은 실수를 반복했다.','역사는 반복된다. 이번엔 우리 차례.'] },
          en:{ title:'Genji Annotations (Japanese Lit)',         lines:['The last chapter of Genji Monogatari is a sealing tale.','A thousand years ago Heian court made the same mistake.','History repeats. This time it is our turn.'] } },
  principal: { ko:{ title:'교장 崔 총장의 진심', lines:['나는 봉인을 유지하기 위해 이 자리에 있었다.','하지만 봉인은 결국 나를 삼켰다.','너, 학생이여. 이제 네가 이 자리에 앉을 차례다.','아카데미는 너의 것이다.'] },
          en:{ title:'The Principal\'s True Heart',              lines:['I sat in this chair to hold the seal.','In the end the seal devoured me.','You, student — now it is your turn to sit here.','The Academy is yours.'] } },
  // 추가 조각 (7개) - Living Academy NPC 및 새 이벤트 관련
  timetraveler_evt: { ko:{ title:'시간 여행자의 노트', lines:['나는 미래에서 왔다. 아카데미의 마지막 날을 봤다.','너는 그 순간에 서 있었다. 웃고 있었다.','이 조각을 잃지 마라.'] },
                     en:{ title:'Time Traveler\'s Note',            lines:['I came from the future. I saw the Academy\'s last day.','You stood at that moment. You were smiling.','Do not lose this fragment.'] } },
  wanderer_evt:     { ko:{ title:'떠도는 교수의 기록', lines:['나는 이제 교수가 아니다. 이름조차 잊었다.','하지만 이 학교의 지도가 내 머릿속에 있다.','언젠가 너에게 도움이 될 것이다.'] },
                     en:{ title:'The Wandering Professor',          lines:['I am no longer a professor. I forgot even my name.','But this school\'s map is in my head.','Someday it will help you.'] } },
  mirror_evt:       { ko:{ title:'거울 속의 나', lines:['거울이 다른 나를 보여준다.','그 나는 봉인이 풀리지 않은 세계에서 왔다.','더 행복해 보였다. 나는 부러웠다.'] },
                     en:{ title:'The Other Me in the Mirror',       lines:['The mirror shows another me.','That me came from a world where the seal never broke.','They looked happier. I was jealous.'] } },
  renn_bond:        { ko:{ title:'RENN 의 낡은 책갈피', lines:['RENN 이 자신의 책에서 뽑은 책갈피.','뒷면에 작은 글씨: "너를 지켜본다."','알 수 없는 언어로 봉인 주문이 새겨져 있다.'] },
                     en:{ title:'RENN\'s Old Bookmark',             lines:['A bookmark RENN pulled from their own book.','A tiny script on the back: "I am watching you."','Sealing runes are carved in unknown letters.'] } },
  elara_true:       { ko:{ title:'엘라라의 진짜 이름', lines:['엘라라는 가명이었다. 그녀의 진짜 이름은 봉인의 열쇠다.','그 이름을 아는 자는 이 아카데미에서 나 하나뿐.','언젠가 그 이름을 부를 순간이 온다.'] },
                     en:{ title:'Elara\'s True Name',               lines:['Elara was an alias. Her true name is the key to the seal.','Only I in this Academy know that name.','A moment will come when I must speak it.'] } },
  chronoheart:      { ko:{ title:'크로노 코어의 심장', lines:['코어의 심장은 사실 봉인 그 자체다.','부수는 자는 봉인을 풀고, 봉인하는 자는 코어를 유지한다.','두 길 다 끝이 없다.'] },
                     en:{ title:'Heart of the Chrono Core',         lines:['The core\'s heart is the seal itself.','Break it and you break the seal; hold it and you hold the core.','Both paths are endless.'] } },
  the_end_start:    { ko:{ title:'끝의 시작', lines:['조각들을 다 모으면, 이야기는 끝난다.','하지만 끝은 시작이다.','네가 다음 학기를 시작할 때, 이 조각들이 다시 나타날 것이다.'] },
                     en:{ title:'The Beginning of the End',         lines:['When all fragments are gathered, the story ends.','But every ending is a beginning.','When you start next term, these fragments will appear again.'] } },
};

// 언어에 맞춰 title/lines 를 골라주는 헬퍼
function _pickStoryLang(key) {
  const f = STORY_FRAGMENTS[key];
  if (!f) return null;
  const lang = (state.lang === 'en') ? 'en' : 'ko';
  return f[lang] || f.ko || f.en;
}

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
  const frag = _pickStoryLang(cur.key);
  if (!frag) return;
  const alpha = cur.t < 0.4 ? cur.t / 0.4 : (cur.t > 4.5 ? (5 - cur.t) / 0.5 : 1);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const bx = 12, by = H - 62, bw = W - 24, bh = 54;
  pxDraw(bx, by, bw, bh, '#050310');
  pxDraw(bx, by, bw, 1, '#ffefa8');
  pxDraw(bx, by + bh - 1, bw, 1, '#ffefa8');
  pxDraw(bx, by, 1, bh, '#ffefa8');
  pxDraw(bx + bw - 1, by, 1, bh, '#ffefa8');
  drawText((state.lang === 'en' ? '★ STORY FRAGMENT — ' : '★ 이야기 조각 획득 — ') + frag.title, bx + 6, by + 4, '#ffefa8');
  pxDraw(bx + 4, by + 12, bw - 8, 1, '#3a1e5c');
  for (let i = 0; i < frag.lines.length; i++) {
    drawText(frag.lines[i], bx + 8, by + 16 + i * 8, '#e8d9b0');
  }
  ctx.globalAlpha = 1;
}

// =====================================================================
// Academy Truth 씬 - 최종 컷씬 (모든 조각 수집 후)
// =====================================================================
const ACADEMY_TRUTH_TEXT_KO = [
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
const ACADEMY_TRUTH_TEXT_EN = [
  '',
  'THE TRUTH OF THE ACADEMY',
  '',
  'This school was built to seal the being beneath it.',
  '',
  'Its founders forged the seal from magic and science,',
  'art and religion — every faculty a key.',
  '',
  'Only one who gathers the wisdom of every faculty',
  'may hold the final position.',
  '',
  'You have beaten 22 professors and won the Principal\'s chair.',
  '',
  'You are now the keeper of the seal.',
  '',
  'This academy will forever bear your name in that seat.',
  '',
  '                                                       ~ END ~',
  '',
  'PRESS [SPACE] TO RETURN TO ACADEMY',
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
  if (typeof bgStars === 'function') bgStars();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W*PX, H*PX);
  const TEXT = (state.lang === 'en') ? ACADEMY_TRUTH_TEXT_EN : ACADEMY_TRUTH_TEXT_KO;
  const lineH = 10;
  const startY = H + 20 - _truthT * 12;
  for (let i = 0; i < TEXT.length; i++) {
    const y = startY + i * lineH;
    if (y < -10 || y > H + 10) continue;
    const line = TEXT[i];
    const col = (i === 1) ? '#ffefa8' : (line === '' ? '#000' : '#c8b898');
    const sc  = (i === 1) ? 2 : 1;
    drawText(line, W/2 - textWidth(line, sc)/2, y, col, sc);
  }
  if (_truthT > 2) drawText('[SPACE]', W/2 - textWidth('[SPACE]')/2, H - 4, '#ffefa8');
}
