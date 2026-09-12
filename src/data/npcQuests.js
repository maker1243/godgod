// =====================================================================
// NPC Quests (NPC 심화) - Elara 를 10단계 유대로 확장.
// state.npcQuests = { elara: { bond:0, activeQuest:null, done:{} } }
// 진행: 각 단계마다 미니 조건(킬 카운트/RP 등) → 자동 검사 → 완료 시 대사 + 보상.
// =====================================================================

const ELARA_QUESTS = [
  { bond: 1, title:'첫 인사',           desc:'그저 인사만 나눈다.',
    check:()=>true,   reward:()=>{ state.gold += 20; return '+20G'; } },
  { bond: 2, title:'10마리 처치',       desc:'몹 10마리 처치',
    check:()=>{ return (state.stats && state.stats.totalKills || 0) >= 10; },
    reward:()=>{ state.research = (state.research||0) + 100; return '+100 RP'; } },
  { bond: 3, title:'첫 시련',           desc:'아무 시련이든 하나 통과',
    check:()=>{ return Object.keys(state.trialCleared || {}).length >= 1; },
    reward:()=>{ state.gold += 100; return '+100G'; } },
  { bond: 4, title:'교수 격파',         desc:'교수 1명 이상 격파',
    check:()=>{ return Object.keys(state.professorsBeaten || {}).length >= 1; },
    reward:()=>{ state.research = (state.research||0) + 500; return '+500 RP'; } },
  { bond: 5, title:'암호 해독',         desc:'CIPHER 3회 성공',
    check:()=>{ return (state.cipherSolvedCount || 0) >= 3; },
    reward:()=>{ academy.inventory.heal = (academy.inventory.heal||0) + 5; if (typeof recomputeHotkeys === 'function') recomputeHotkeys(); return '+5 힐포션'; } },
  { bond: 6, title:'스토리 조각',       desc:'스토리 조각 5개 수집',
    check:()=>{ return Object.keys(state.storyFragments || {}).length >= 5; },
    reward:()=>{ state.research = (state.research||0) + 2000; return '+2000 RP'; } },
  { bond: 7, title:'ULTRA 도전',        desc:'ULTRA 시련 1회 통과',
    check:()=>{
      // ultraCleared 는 {magic:true} 형태로 저장됨. true 값만 카운트.
      const uc = state.ultraCleared || {};
      let n = 0;
      for (const k of Object.keys(uc)) if (uc[k]) n++;
      return n >= 1;
    },
    reward:()=>{ state.gold += 500; return '+500G'; } },
  { bond: 8, title:'모든 계열',         desc:'서로 다른 계열 교수 5명 격파',
    check:()=>{
      // FACULTY_PROFESSORS 의 실제 키 사용 (kor/eng/biz/psy/phys/chem/cs/robot/med/phar/math/pe/
      // paint/vocal/phil/rel/lib/media/sculpt/vdesign/chn/jpn). 서로 다른 계열 5개 이상 격파 시 통과.
      const FACULTY_GROUPS = [
        ['kor','eng'], ['biz','psy'], ['phys','chem'], ['cs','robot'],
        ['med','phar'], ['math','pe'], ['paint','vocal'], ['phil','rel'],
        ['lib','media'], ['sculpt','vdesign'], ['chn','jpn'],
      ];
      const beaten = state.professorsBeaten || {};
      let groups = 0;
      for (const grp of FACULTY_GROUPS) {
        if (grp.some(k => beaten[k])) groups++;
      }
      return groups >= 5;
    },
    reward:()=>{ state.research = (state.research||0) + 10000; return '+10000 RP'; } },
  { bond: 9, title:'교장 격파',         desc:'교장을 1회 이상 격파',
    check:()=>{ return (state.principalDefeated || 0) >= 1; },
    reward:()=>{ state.research = (state.research||0) + 50000; return '+50000 RP'; } },
  { bond:10, title:'진실을 마주하다',   desc:'아카데미의 진실 컷씬 시청 (또는 모든 조각 수집)',
    check:()=>{
      // 컷씬을 봤거나 (일반 경로), 이미 모든 조각을 모아 컷씬 트리거 조건을 충족한 경우
      // 컷씬을 미처 못 본 유저도 자동 통과되도록 완화.
      if (state.academyTruthSeen) return true;
      if (typeof STORY_FRAGMENTS !== 'undefined' && state.storyFragments) {
        const total = Object.keys(STORY_FRAGMENTS).length;
        const owned = Object.keys(state.storyFragments).filter(k => STORY_FRAGMENTS[k]).length;
        if (owned >= total) {
          // 조각을 다 모았는데 컷씬을 놓친 경우 - 자동으로 시청 처리
          state.academyTruthSeen = true;
          if (typeof saveAccountData === 'function') saveAccountData();
          return true;
        }
      }
      return false;
    },
    reward:()=>{
      // 고유 아티팩트 지급
      if (typeof _ensureArtifactsState === 'function') _ensureArtifactsState();
      if (state.artifacts) state.artifacts.owned['god_arcana'] = true;
      return 'ARCANA CROWN 획득!';
    } },
];

const ELARA_LINES = [
  '봉인이 어젯밤 다시 약해졌어.',
  '너의 얼굴에서 오늘은 다른 빛이 보여.',
  '나는 밤마다 이상한 꿈을 꿔. 코어의 소리...',
  '엄마는 내가 포션이나 배우고 있다고 알아.',
  '너는 우리와 달라. 그게 무서워.',
  '교수님들이 왜 봉인되었는지 궁금하지 않아?',
  '나는 진실이 두렵지만, 너와 함께라면 볼 수 있어.',
  '이 아카데미의 지하에는 우리가 배워선 안 되는 것이 있어.',
  '너는 이제 신에 가까워지고 있어. 조심해.',
  '내가 처음부터 알았어. 너는 열쇠였어.',
  '엘라라는 조용히 미소짓는다. 이제 그녀는 너의 유일한 아군이다.',
];

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
    if (typeof showMsg === 'function') showMsg('엘라라: 그동안 지켜보고 있었어. (' + advanced + ' 단계 승급)', 5);
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
    // 최종 단계 이후
    showMsg(ELARA_LINES[10] || '엘라라: ...', 4);
    return;
  }
  // 조건 만족 시 승격
  if (nextQ.check()) {
    const rwd = (typeof nextQ.reward === 'function') ? nextQ.reward() : '';
    el.done[nextQ.bond] = Date.now();
    el.bond = nextQ.bond;
    const line = ELARA_LINES[Math.min(el.bond, ELARA_LINES.length - 1)];
    showMsg('엘라라: ' + line + '  (BOND ' + el.bond + ' · ' + rwd + ')', 5);
    if (typeof sfx === 'function') sfx('level');
    if (typeof weeklyAdd === 'function') weeklyAdd('weekly_elaraBond', 1);
    if (typeof saveAccountData === 'function') saveAccountData();
    return;
  }
  // 조건 미달 - 힌트
  showMsg('엘라라 (BOND ' + el.bond + '/10) → 다음 조건: ' + nextQ.desc, 4);
}

function elaraBond() {
  _ensureNpcQuestsState();
  return state.npcQuests.elara.bond;
}
