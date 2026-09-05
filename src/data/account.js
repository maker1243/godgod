// =====================================================================
// Account save (localStorage) + game state
// =====================================================================

// ---------- 게임 상태 ----------
const state = {
  scene: 'langSelect',   // langSelect | login | title | intro | academy | dungeon | ...
  lang: null,            // 'en' | 'ko' - null이면 langSelect로 시작
  account: null,         // { name, passHash } - 로그인된 계정
  day: 1,
  gpa: 3.5,
  gold: 20,
  research: 0,          // 영구 재화
  perks: {              // 영구 패시브 (연구 포인트로 해금)
    hp: 0, mp: 0, dmg: 0, cd: 0
  },
  msg: '',
  msgTimer: 0,
  shake: 0,
  cam: { x: 0, y: 0 },
  time: 0,
  runResult: null,
  // 스킬 트리 시스템 (SKILL_TREE 정의 이전에 createPlayer가 호출되므로 미리 초기화)
  ownedSkills: { 'm01': 1 },       // 시작 시 파이어볼(m01) 자동 소유
  equippedSlots: { lmb: 'm01', q: null, e: null },
  finalCleared: 0,
  difficulty: 'normal',            // 전역 난이도 (DIFFICULTY_TIERS 참조)
  maxUnlocked: false,              // 어느 한 카테고리라도 시련 통과했는지 (전역 편의 플래그).
  trialCleared: {},                // { magic:true, ... } 카테고리별 1단계 시련 통과 여부. MAX 트리 뷰/구매 게이트.
  ultraCleared: {},                // 카테고리별 2단계(ULTRA) 시련 통과 여부. ULTRA 트리 게이트.
  dungeonStart: 0,                 // performance.now() 기준 던전 진입 시각
  trialStage: 1,                   // 현재 진행 중인 시련 단계 (1 또는 2)
  trialBanUntil: 0,                // Date.now() ms. 1단계 시련 재도전 불가 시각 (실패 페널티 5분).
  ultraTrialBanUntil: 0,           // 2단계(ULTRA) 시련 재도전 불가 시각 (실패 페널티 10분).
};

// 언어 설정 로드 (없으면 langSelect 씬)
try {
  const savedLang = localStorage.getItem('gaa_lang');
  if (savedLang === 'en' || savedLang === 'ko') { state.lang = savedLang; state.scene = 'login'; }
} catch(e){}

// 계정 로드 (있으면 title로 스킵)
try {
  const savedAcc = localStorage.getItem('gaa_current_account');
  if (savedAcc) {
    const a = JSON.parse(savedAcc);
    if (a && a.name) { state.account = a; if (state.scene === 'login') state.scene = 'title'; }
  }
} catch(e){}

// =====================================================================
// 계정별 데이터 관리
// =====================================================================
// 저장 구조: localStorage['gaa_data_<name>'] = { ownedSkills, equippedSlots, perks,
//   research, gold, gpa, day, finalCleared, inventory, bestArena, duelWins, npcBonds }
// 계정마다 완전 격리. 로그인/생성 시 로드, 저장은 자동 (변경 시점마다).
function accDataKey() {
  if (!state.account || !state.account.name) return null;
  return 'gaa_data_' + state.account.name.toLowerCase();
}

// 게임 데이터를 초기(신규 계정용) 상태로 리셋
function resetGameData() {
  state.ownedSkills = { 'm01': 1 };
  state.equippedSlots = { lmb: 'm01', q: null, e: null };
  state.perks = { hp: 0, mp: 0, dmg: 0, cd: 0 };
  state.research = 0;
  state.gold = 20;
  state.gpa = 3.5;
  state.day = 1;
  state.finalCleared = 0;
  // academy 는 아래 파일에서 정의됨. 여기서는 존재 여부만 확인 후 리셋.
  if (typeof academy !== 'undefined' && academy) {
    if (academy.inventory) academy.inventory = { heal:0, mana:0, swift:0, fury:0, guard:0 };
    academy.bestArena = 0;
    academy.duelWins = 0;
    if (Array.isArray(academy.npcs)) for (const n of academy.npcs) if (n.bond !== undefined) n.bond = 0;
    if (typeof recomputeHotkeys === 'function') recomputeHotkeys();
  }
}

// 현재 계정의 저장 데이터를 state/academy에 로드. 없으면 기본값.
function loadAccountData() {
  const k = accDataKey();
  if (!k) return false;
  let raw = null;
  try { raw = localStorage.getItem(k); } catch(e){}
  if (!raw) return false;
  try {
    const d = JSON.parse(raw);
    if (d.ownedSkills)   state.ownedSkills   = d.ownedSkills;
    if (d.equippedSlots) state.equippedSlots = d.equippedSlots;
    if (d.perks)         state.perks         = d.perks;
    if (typeof d.research === 'number')     state.research     = d.research;
    if (typeof d.gold === 'number')         state.gold         = d.gold;
    if (typeof d.gpa === 'number')          state.gpa          = d.gpa;
    if (typeof d.day === 'number')          state.day          = d.day;
    if (typeof d.finalCleared === 'number') state.finalCleared = d.finalCleared;
    if (typeof d.difficulty === 'string')  state.difficulty  = d.difficulty;
    if (typeof d.maxUnlocked === 'boolean') state.maxUnlocked = d.maxUnlocked;
    if (d.trialCleared && typeof d.trialCleared === 'object') state.trialCleared = d.trialCleared;
    if (d.ultraCleared && typeof d.ultraCleared === 'object') state.ultraCleared = d.ultraCleared;
    if (typeof d.trialBanUntil === 'number') state.trialBanUntil = d.trialBanUntil;
    if (typeof d.ultraTrialBanUntil === 'number') state.ultraTrialBanUntil = d.ultraTrialBanUntil;
    if (typeof academy !== 'undefined' && academy) {
      if (d.inventory)                    academy.inventory  = d.inventory;
      if (typeof d.bestArena === 'number') academy.bestArena = d.bestArena;
      if (typeof d.duelWins === 'number')  academy.duelWins  = d.duelWins;
      if (d.npcBonds && Array.isArray(academy.npcs)) {
        for (const n of academy.npcs) if (n.name && typeof d.npcBonds[n.name] === 'number') n.bond = d.npcBonds[n.name];
      }
      if (typeof recomputeHotkeys === 'function') recomputeHotkeys();
    }
    return true;
  } catch(e) { return false; }
}

// 현재 계정에 게임 데이터 저장. 계정 없으면 no-op (임시 진행 사라짐).
function saveAccountData() {
  const k = accDataKey();
  if (!k) return;
  const npcBonds = {};
  if (typeof academy !== 'undefined' && academy && Array.isArray(academy.npcs)) {
    for (const n of academy.npcs) if (n.name && typeof n.bond === 'number') npcBonds[n.name] = n.bond;
  }
  const payload = {
    ownedSkills: state.ownedSkills,
    equippedSlots: state.equippedSlots,
    perks: state.perks,
    research: state.research,
    gold: state.gold,
    gpa: state.gpa,
    day: state.day,
    finalCleared: state.finalCleared,
    difficulty: state.difficulty || 'normal',
    maxUnlocked: !!state.maxUnlocked,
    trialCleared: state.trialCleared || {},
    ultraCleared: state.ultraCleared || {},
    trialBanUntil: state.trialBanUntil || 0,
    ultraTrialBanUntil: state.ultraTrialBanUntil || 0,
    inventory: (typeof academy !== 'undefined' && academy) ? academy.inventory : null,
    bestArena: (typeof academy !== 'undefined' && academy) ? academy.bestArena : 0,
    duelWins:  (typeof academy !== 'undefined' && academy) ? academy.duelWins  : 0,
    npcBonds,
    savedAt: Date.now(),
  };
  try { localStorage.setItem(k, JSON.stringify(payload)); } catch(e){}
}

// 계정 삭제 시 데이터도 삭제 (미래에 사용)
function deleteAccountData(name) {
  if (!name) return;
  try { localStorage.removeItem('gaa_data_' + name.toLowerCase()); } catch(e){}
}

function showMsg(text, dur = 2.2) { state.msg = text; state.msgTimer = dur; }

