// =====================================================================
// Professor Aftermath - 교수 격파 후 다음 facultyLobby 진입 시 짧은 후일담.
// state.profAftermathSeen[key] 로 중복 방지.
// =====================================================================

const PROF_AFTERMATH = {
  // key -> { ko, en, portrait? }
  // 인문
  'lit_a':  { ko:'서재의 등불이 꺼졌다. 문학과 학생들은 이제 스스로 이야기를 쓴다.',              en:'The library lamp went out. Literature students now write their own tales.' },
  'lit_b':  { ko:'책장이 스스로 재배열된다. 그의 마지막 시가 벽에 새겨졌다.',                     en:'Shelves rearrange themselves. His last verse is carved into the wall.' },
  'phil_a': { ko:'철학과의 원탁이 조용해졌다. 답은 이제 각자의 몫이다.',                            en:'The philosophy roundtable fell silent. Answers now belong to each of us.' },
  'phil_b': { ko:'회의론자는 죽고, 의심은 살아남았다.',                                            en:'The skeptic died. The doubt remains.' },
  // 자연
  'phys_a': { ko:'실험실의 원자로가 멈췄다. 연구는 검은 노트에 봉인되었다.',                       en:'The lab reactor stopped. Research sealed in a black notebook.' },
  'phys_b': { ko:'중력이 방 안에서 잠시 반전되었다. 학생들은 웃음을 터뜨렸다.',                    en:'Gravity flipped briefly in the room. The students laughed.' },
  'chem_a': { ko:'벤젠 고리 문양이 벽에 남아 있다. 반응은 끝나지 않았다.',                          en:'Benzene rings remain etched on the wall. The reaction is not over.' },
  'chem_b': { ko:'플라스크가 하나 남아 있다. 열지 마시오.',                                       en:'One flask remains. Do not open.' },
  // 공학
  'eng_a':  { ko:'톱니바퀴가 뜨겁다. 그는 도면 위에서 쓰러졌다.',                                  en:'The gears are still hot. He fell on his blueprint.' },
  'eng_b':  { ko:'거대한 기계가 멈췄다. 심장 소리처럼 마지막 박동 하나가 남아 있다.',              en:'The great machine stopped. One heartbeat lingers.' },
  // 의학
  'med_a':  { ko:'수술실의 십자가가 부서졌다. 그의 마지막 처방은 자기 자신이었다.',                en:'The cross in the operating room broke. His last prescription was himself.' },
  'med_b':  { ko:'약병들이 굴러다닌다. 어느 것도 그를 구할 수 없었다.',                            en:'Vials roll on the floor. None could save him.' },
  // 수학
  'math_a': { ko:'∞ 기호가 칠판에 남아 있다. 문제는 여전히 풀리지 않았다.',                        en:'The ∞ symbol remains on the board. The problem is still unsolved.' },
  'math_b': { ko:'그의 마지막 정리는 여백에 쓸 수 없었다.',                                        en:'His last theorem could not fit in the margin.' },
  // 체육
  'pe_a':   { ko:'경기장이 텅 비었다. 오늘도 그의 훈련은 계속된다, 어딘가에서.',                    en:'The arena is empty. His training continues, somewhere.' },
  'pe_b':   { ko:'호루라기 소리 하나가 복도에 남았다.',                                            en:'A single whistle echoes in the corridor.' },
  // 예술
  'art_a':  { ko:'미완성 그림 하나가 이젤에 남아 있다. 붓은 아직 젖어 있다.',                       en:'One unfinished painting on the easel. The brush is still wet.' },
  'art_b':  { ko:'대리석 조각이 눈물을 흘리는 것 같다.',                                          en:'The marble statue seems to weep.' },
  // 음악
  'mus_a':  { ko:'그의 최후의 노래가 홀에 메아리친다. 아무도 반주하지 않는다.',                     en:'His last song echoes in the hall. No one accompanies.' },
  'mus_b':  { ko:'악보 한 장이 바닥에 떨어져 있다. 마지막 마디는 쉼표다.',                          en:'A score lies on the floor. The last measure is a rest.' },
  // 종교
  'rel_a':  { ko:'제단의 불이 꺼졌다. 신도들은 이제 서로에게 기도한다.',                           en:'The altar flame died. The faithful now pray to each other.' },
  'rel_b':  { ko:'십자가 두 개가 X 자로 남아 있다. 그의 표식이었다.',                              en:'Two crosses lie as an X. It was his sign.' },
  // 도서관
  'lib_a':  { ko:'도서관 문이 스스로 잠겼다. 안에서 무언가 쓰고 있는 소리가 난다.',                 en:'The library door locked itself. Something inside is still writing.' },
  'lib_b':  { ko:'분류표가 무너져 있다. 어떤 책도 원래 자리로 돌아가지 않을 것이다.',              en:'The catalog collapsed. No book will return to its place.' },
  // 미디어
  'med_arts_a':{ ko:'방송실의 마이크가 열려 있다. 아무도 말하지 않는다.',                          en:'The studio mic is still open. Nobody speaks.' },
  'med_arts_b':{ ko:'카메라 렌즈에 그의 마지막 얼굴이 담겨 있다.',                                 en:'His last face is captured in the lens.' },
  // 디자인
  'des_a':  { ko:'설계도 위에 빨간 X 자가 그어져 있다. 그가 자신을 지웠다.',                        en:'A red X is drawn over the blueprint. He erased himself.' },
  'des_b':  { ko:'모든 프레임이 완벽했지만, 안이 비어 있었다.',                                    en:'Every frame was perfect. All were empty.' },
  // 한문/일본
  'chn_a':  { ko:'漢 자가 벽에서 스스로 흐릿해진다.',                                              en:'The 漢 character fades from the wall on its own.' },
  'chn_b':  { ko:'천 년의 문헌이 재가 되었다.',                                                   en:'A millennium of scripts turned to ash.' },
  'jpn_a':  { ko:'하이쿠 한 편이 남아 있다: "지지 않네 / 우리의 오늘도 / 마지막 잎".',              en:'One haiku remains: "It does not fall / this today of ours / the last leaf".' },
  'jpn_b':  { ko:'벚꽃잎이 실내에 흩날린다. 계절은 존재하지 않는데.',                              en:'Cherry petals drift indoors. There is no season here.' },
  // 교장
  'principal': { ko:'교장의 왕좌가 무너졌다. 아카데미의 진짜 이야기가 시작된다.',                  en:'The Principal\'s throne crumbled. The true story of the Academy begins.' },
};

function _lang() { return state.lang === 'en' ? 'en' : 'ko'; }

// facultyLobby 진입 시 호출 - 최근 격파한 교수 중 아직 후일담을 보지 않은 것 있으면 팝업.
function checkProfessorAftermath() {
  if (!state.profAftermathSeen) state.profAftermathSeen = {};
  const beaten = state.professorsBeaten || {};
  for (const key of Object.keys(beaten)) {
    if (beaten[key] > 0 && !state.profAftermathSeen[key] && PROF_AFTERMATH[key]) {
      // 팝업 데이터 준비 (facultyLobby 가 렌더)
      profAftermath.active = true;
      profAftermath.key = key;
      profAftermath.text = PROF_AFTERMATH[key][_lang()] || PROF_AFTERMATH[key].ko;
      profAftermath.t = 0;
      state.profAftermathSeen[key] = Date.now();
      if (typeof saveAccountData === 'function') saveAccountData();
      return true;
    }
  }
  return false;
}

const profAftermath = {
  active: false,
  key: null,
  text: '',
  t: 0,
};

function updateProfAftermath(dt) {
  if (!profAftermath.active) return false;
  profAftermath.t += dt;
  if (keys['Space'] || keys['Enter'] || keys['Escape'] || (mouse.down)) {
    keys['Space']=false; keys['Enter']=false; keys['Escape']=false; mouse.down = false;
    profAftermath.active = false;
    checkProfessorAftermath();   // 대기 중 다음 것 확인
  }
  return true;
}

function renderProfAftermath() {
  if (!profAftermath.active) return;
  ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W*PX, H*PX);
  drawText('AFTERMATH', W/2 - textWidth('AFTERMATH', 2)/2, 40, '#ffefa8', 2);
  // 텍스트 자동 줄바꿈
  const words = profAftermath.text.split(' ');
  let line = '', ry = 90, maxW = 280;
  for (const w of words) {
    const tr = line ? line + ' ' + w : w;
    if (textWidth(tr) > maxW) { drawText(line, W/2 - textWidth(line)/2, ry, '#e8d9b0'); ry += 12; line = w; }
    else line = tr;
  }
  if (line) drawText(line, W/2 - textWidth(line)/2, ry, '#e8d9b0');
  const s = '[SPACE] 계속';
  if (Math.floor(state.time * 2) % 2 === 0) drawText(s, W/2 - textWidth(s)/2, H - 30, '#8bd8ff');
}
