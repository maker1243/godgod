// =====================================================================
// NPC Quests (NPC 심화) - Elara 를 10단계 유대로 확장.
// state.npcQuests = { elara: { bond:0, activeQuest:null, done:{} } }
// 진행: 각 단계마다 미니 조건(킬 카운트/RP 등) → 자동 검사 → 완료 시 대사 + 보상.
// =====================================================================

// 유대 미션 - 새 콘텐츠(클랜/스펠크래프트/암시장/평판/지하/초월)를 반영해 재설계.
// 초기 미션은 가볍고, 후반은 진짜 도전과 진행을 반영.
const ELARA_QUESTS = [
  // 1단계: 관찰 - NPC 3명과 인사 (아카데미 NPC 병합 시스템)
  { bond: 1, title:'낯선 얼굴들',       desc:'아카데미 NPC 3명과 인사 (SPACE)',
    check:()=>{
      // livingNpcInteract 는 NPC.bond 를 증가시킴. 아카데미 NPC 중 bond>=1 이 3명 이상.
      const npcs = (typeof academy !== 'undefined' && academy.npcs) ? academy.npcs : [];
      let n = 0;
      for (const nc of npcs) { if ((nc.bond || 0) >= 1) n++; }
      return n >= 3;
    },
    reward:()=>{ state.gold += 50; return '+50 G'; } },

  // 2단계: 스타일 - 캐릭터 커스터마이즈 열람 (외모 결정 자체가 관계 진전)
  { bond: 2, title:'자기 표현',         desc:'STYLE 문 진입 후 팔레트/특성 최소 1회 변경',
    check:()=>{ return !!state.customizeVisited; },
    reward:()=>{ state.research = (state.research||0) + 200; return '+200 RP'; } },

  // 3단계: 가문 결정
  { bond: 3, title:'출신의 자각',       desc:'HOUSE 문에서 가문·학파 확정',
    check:()=>{ return typeof hasFaction === 'function' && hasFaction(); },
    reward:()=>{ state.gold += 200; return '+200 G'; } },

  // 4단계: 주문 창조
  { bond: 4, title:'첫 자작 마법',      desc:'SPELL 조합실에서 커스텀 주문 1개 창조',
    check:()=>{ return Array.isArray(state.customSpells) && state.customSpells.length >= 1; },
    reward:()=>{ academy.inventory.mana = (academy.inventory.mana||0) + 5; if (typeof recomputeHotkeys === 'function') recomputeHotkeys(); return '+5 마나 물약'; } },

  // 5단계: 계열 결투 - 서로 다른 3계열 교수 격파
  { bond: 5, title:'세 학문의 통달',    desc:'서로 다른 계열 교수 3명 격파',
    check:()=>{
      const FACULTY_GROUPS = [
        ['kor','eng'], ['biz','psy'], ['phys','chem'], ['cs','robot'],
        ['med','phar'], ['math','pe'], ['paint','vocal'], ['phil','rel'],
        ['lib','media'], ['sculpt','vdesign'], ['chn','jpn'],
      ];
      const beaten = state.professorsBeaten || {};
      let groups = 0;
      for (const grp of FACULTY_GROUPS) if (grp.some(k => beaten[k])) groups++;
      return groups >= 3;
    },
    reward:()=>{ state.research = (state.research||0) + 1500; return '+1500 RP'; } },

  // 6단계: 지하 진입 및 방 개방
  { bond: 6, title:'지하의 발견',       desc:'지하 던전에서 교수의 방 3개 개방',
    check:()=>{
      const cl = (typeof underground !== 'undefined' && underground.claimed) ? underground.claimed : {};
      return Object.keys(cl).filter(k => cl[k]).length >= 3;
    },
    reward:()=>{ if (typeof _ensureArtifactsState === 'function') _ensureArtifactsState(); state.gold = (state.gold||0) + 1000; return '+1000 G · 뒷골목 rep+3'; } },

  // 7단계: 검은 시장 & 마도구
  { bond: 7, title:'금기의 거래',       desc:'검은 시장 방문 + 마도구 1개 제작',
    check:()=>{
      if (!state.blackMarketVisited) return false;
      if (!state.magicTools) return false;
      let n = 0;
      for (const k of Object.keys(state.magicTools)) n += state.magicTools[k] || 0;
      return n >= 1;
    },
    reward:()=>{ state.research = (state.research||0) + 5000; return '+5000 RP'; } },

  // 8단계: 클랜 창설 및 성장
  { bond: 8, title:'무리의 지도자',     desc:'클랜 창설 후 LV 3 도달',
    check:()=>{
      if (!state.clan) return false;
      // 클랜 XP 로 tier 조회 - 없으면 xpReq 로 판단
      const xp = state.clan.xp || 0;
      return xp >= 2000;   // CLAN_LEVELS[2].xpReq
    },
    reward:()=>{ state.research = (state.research||0) + 20000; state.gold = (state.gold||0) + 5000; return '+20k RP · +5k G'; } },

  // 9단계: 지하 심연 정복
  { bond: 9, title:'심연의 정복자',     desc:'지하 5층 심연의 지배자 격파',
    check:()=>{
      return !!(typeof underground !== 'undefined' && underground.bossDown && underground.bossDown[5]);
    },
    reward:()=>{ state.research = (state.research||0) + 100000; return '+100000 RP'; } },

  // 10단계: 학원 정복 - 22명 교수 전원 + 교장 격파
  { bond:10, title:'학원의 정복',      desc:'22명 교수 전원 격파 + 교장 격파',
    check:()=>{
      const FACULTY_KEYS = [
        'kor','eng','biz','psy','phys','chem','cs','robot','med','phar',
        'math','pe','paint','vocal','phil','rel','lib','media',
        'sculpt','vdesign','chn','jpn',
      ];
      const beaten = state.professorsBeaten || {};
      for (const k of FACULTY_KEYS) if (!beaten[k]) return false;
      if ((state.principalDefeated || 0) < 1) return false;
      // 부수 효과: 진실 컷씬을 아직 못 봤다면 자동 시청 처리
      if (!state.academyTruthSeen) {
        state.academyTruthSeen = true;
      }
      return true;
    },
    reward:()=>{
      if (typeof _ensureArtifactsState === 'function') _ensureArtifactsState();
      if (state.artifacts) state.artifacts.owned['god_arcana'] = true;
      state.research = (state.research||0) + 500000;
      return 'ARCANA CROWN · +500000 RP';
    } },
];

// 각 유대 단계 완료 시 나오는 승급 대사 (해당 미션에 특화). 인덱스 = bond 번호.
const ELARA_LINES = [
  '(bond 0) 봉인이 어젯밤 다시 약해졌어.',                                    // bond 0 - 기본
  '엘라라: 세 명이나 너와 인사했다니. 학원이 조금은 따뜻해졌네.',             // bond 1 - 낯선 얼굴들
  '엘라라: 그 옷... 너에게 잘 어울려. 정말로.',                                // bond 2 - 자기 표현
  '엘라라: 가문을 정했구나. 이제 학원이 너를 어떻게 볼지 두려워?',            // bond 3 - 출신의 자각
  '엘라라: 네가 만든 주문에서 너의 냄새가 나. 처음 맡아본 마법이야.',         // bond 4 - 첫 자작 마법
  '엘라라: 세 계열의 교수를 이겼다니. 나는 너를 조금 두려워하기 시작했어.',   // bond 5 - 세 학문의 통달
  '엘라라: 지하에서 뭘 봤어? 나는 그곳의 소리를 매일 밤 들어.',                // bond 6 - 지하의 발견
  '엘라라: 검은 시장에 갔다고? 그들이 나에 대해 뭐라고 해?',                  // bond 7 - 금기의 거래
  '엘라라: 너를 따르는 사람들이 생겼어. 학원의 정치가 흔들리고 있어.',        // bond 8 - 무리의 지도자
  '엘라라: 심연의 지배자를 이긴 사람은 47년 만이야. 교장 崔 이후로.',         // bond 9 - 심연의 정복자
  '엘라라: 학원의 모든 권력자를 무너뜨렸구나. 이제 남은 건 나와 너뿐이야.',   // bond 10 - 학원의 정복
];

// 미완료 상태에서 진행 중 대사 (미션별로 다른 힌트/독백)
const ELARA_HINT_LINES = [
  '엘라라: (아무 말도 하지 않는다)',                                          // bond 0
  '엘라라: 다른 학생들과도 이야기해봐. 그들도 너를 지켜보고 있어.',           // 미션 1
  '엘라라: 너의 모습을 스스로 정해봐. 나는 너의 진짜 색이 궁금해.',            // 미션 2
  '엘라라: 이 학원에서는 태생이 문 하나를 여닫아. 어느 문 앞에 설 거야?',      // 미션 3
  '엘라라: 남이 만든 마법이 아닌 너만의 마법을 갖고 와줘.',                    // 미션 4
  '엘라라: 세 계열의 교수를 이겨봐. 학원의 지도가 너에게 다시 그려질 거야.',   // 미션 5
  '엘라라: 지하로 내려가봐. 진실은 위층에 있지 않아.',                          // 미션 6
  '엘라라: 검은 시장의 노인들과 마도구 제작자를 찾아봐. 그들이 아는 게 있어.',  // 미션 7
  '엘라라: 너만의 무리를 만들어. 혼자서는 아카데미를 이길 수 없어.',            // 미션 8
  '엘라라: 지하의 가장 깊은 곳. 심연의 지배자를 이겨야 해.',                    // 미션 9
  '엘라라: 22명 교수와 교장. 학원 전체가 너에게 무릎을 꿇을 때까지.',           // 미션 10
];

// 접근 헬퍼
function getElaraLineForBond(bond) {
  if (bond < 0) bond = 0;
  if (bond >= ELARA_LINES.length) bond = ELARA_LINES.length - 1;
  return ELARA_LINES[bond];
}
function getElaraHintForBond(bond) {
  const idx = Math.min(bond, ELARA_HINT_LINES.length - 1);
  return ELARA_HINT_LINES[idx];
}

function _ensureNpcQuestsState() {
  if (!state.npcQuests) state.npcQuests = { elara: { bond: 0, done: {}, pendingRewards: [] } };
  if (!state.npcQuests.elara) state.npcQuests.elara = { bond: 0, done: {}, pendingRewards: [] };
  const el = state.npcQuests.elara;
  if (!el.done) el.done = {};
  if (!el.pendingRewards) el.pendingRewards = [];
}

// 아카데미 진입/틱마다 호출: 이미 조건 만족한 유대 미션 자동 클리어
// (엘라라와 대화하지 않아도 진행). 여러 단계가 이미 만족된 경우 순차 처리.
function autoAdvanceElaraBond() {
  _ensureNpcQuestsState();
  const el = state.npcQuests.elara;
  let advanced = 0;
  const rewards = [];
  // 최대 10회 (bond 0..10) 순차. 결말 선택 조건 도달 시 멈춤.
  for (let iter = 0; iter < 12; iter++) {
    const nextQ = ELARA_QUESTS[el.bond];
    if (!nextQ) break;
    // 결말 선택 조건 도달 시 자동 진행 중단 (플레이어가 대화로 결말 선택하도록)
    if (typeof canOfferEndingChoice === 'function' && canOfferEndingChoice()) break;
    // check 실패 시 중단
    let ok = false;
    try { ok = !!nextQ.check(); } catch(_){}
    if (!ok) break;
    // 보상 지급
    const rwd = (typeof nextQ.reward === 'function') ? (function(){ try { return nextQ.reward(); } catch(_) { return ''; } })() : '';
    el.done[nextQ.bond] = Date.now();
    el.bond = nextQ.bond;
    advanced++;
    rewards.push('BOND ' + el.bond + (rwd ? ' · ' + rwd : ''));
    if (typeof weeklyAdd === 'function') weeklyAdd('weekly_elaraBond', 1);
  }
  if (advanced > 0) {
    if (typeof sfx === 'function') sfx('level');
    if (typeof showAchievementBanner === 'function') showAchievementBanner('엘라라 유대 승급 ×' + advanced, rewards.join(' | '), '#c86ade');
    // 각 승급에 대응하는 대사가 있으면 도달한 최종 bond 대사를 우선 표시
    const finalLine = getElaraLineForBond(el.bond);
    if (typeof showMsg === 'function') showMsg(finalLine, 5);
    if (typeof saveAccountData === 'function') saveAccountData();
  }
  return advanced;
}

// SPACE 로 Elara 와 대화. 조건 만족 여부에 따라 다른 대사.
function elaraInteract() {
  _ensureNpcQuestsState();
  // 결말 선택 조건 만족 시 다이얼로그 오픈
  if (typeof canOfferEndingChoice === 'function' && canOfferEndingChoice()) {
    if (typeof openElaraEnding === 'function') { openElaraEnding(); return; }
  }
  const el = state.npcQuests.elara;
  // 현재 유대 단계
  const nextQ = ELARA_QUESTS[el.bond];
  if (!nextQ) {
    // 최종 단계 이후 - 최종 bond 승급 대사 반복
    showMsg(getElaraLineForBond(el.bond) || '엘라라: ...', 5);
    return;
  }
  // 조건 만족 시 승격
  if (nextQ.check()) {
    const rwd = (typeof nextQ.reward === 'function') ? nextQ.reward() : '';
    el.done[nextQ.bond] = Date.now();
    el.bond = nextQ.bond;
    const line = getElaraLineForBond(el.bond);
    showMsg(line + '  (BOND ' + el.bond + ' · ' + rwd + ')', 6);
    if (typeof sfx === 'function') sfx('level');
    if (typeof weeklyAdd === 'function') weeklyAdd('weekly_elaraBond', 1);
    if (typeof saveAccountData === 'function') saveAccountData();
    return;
  }
  // 조건 미달 - 미션별 대사 + 목표 힌트
  const nextIdx = el.bond + 1;   // 진행 중인 미션 번호
  const hintLine = getElaraHintForBond(nextIdx);
  showMsg(hintLine + '  [BOND ' + nextIdx + '/10 · ' + nextQ.desc + ']', 5);
}

function elaraBond() {
  _ensureNpcQuestsState();
  return state.npcQuests.elara.bond;
}
