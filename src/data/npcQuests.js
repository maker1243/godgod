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
    check:()=>{ return Object.keys(state.ultraCleared || {}).length >= 1; },
    reward:()=>{ state.gold += 500; return '+500G'; } },
  { bond: 8, title:'모든 계열',         desc:'모든 계열 교수 1명씩 격파',
    check:()=>{
      const keys = ['lit','phil','phys','chem','eng','med','math','pe','art','mus','rel'];
      const beaten = state.professorsBeaten || {};
      for (const k of keys) {
        if (!(beaten[k+'_a'] || beaten[k+'_b'])) return false;
      }
      return true;
    },
    reward:()=>{ state.research = (state.research||0) + 10000; return '+10000 RP'; } },
  { bond: 9, title:'교장 격파',         desc:'교장을 1회 이상 격파',
    check:()=>{ return (state.principalDefeated || 0) >= 1; },
    reward:()=>{ state.research = (state.research||0) + 50000; return '+50000 RP'; } },
  { bond:10, title:'진실을 마주하다',   desc:'아카데미의 진실 컷씬 시청',
    check:()=>{ return !!state.academyTruthSeen; },
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

// SPACE 로 Elara 와 대화. 조건 만족 여부에 따라 다른 대사.
function elaraInteract() {
  _ensureNpcQuestsState();
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
