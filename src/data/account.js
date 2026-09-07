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
  cipherSolvedCount: 0,            // CIPHER 문에서 성공한 횟수. >0 이면 PROF 문 해금.
  facultyCleared: {},              // 계열별 시련 통과 카운트 (모두 >0 이면 교장 해금).
  principalDefeated: 0,            // 교장 격파 횟수.
  professorsBeaten: {},            // 교수 개별 격파 카운트.
  achievementsUnlocked: {},        // 업적 { id: 달성시각ms }
  dailyDone: {},                   // { 'YYYYMMDD': { _base: {...}, dailyId: 완료시각ms } }
  stats: null,                     // 통계 카운터 (achievements.js 가 초기화)
  storyFragments: {},              // 이야기 조각 { key: 획득시각ms }
  academyTruthSeen: false,         // 진실 컷씬 시청 여부
  tutorialSeen: false,             // 튜토리얼 첫 노출 여부
  deathPouch: null,                // 사망 지점 유품 (다음 던전 재진입 시 회수)
  legacy: {},                      // { pillarId: level } RP 로 산 영구 스탯
  artifacts: null,                 // { owned:{id:true}, equipped:[id..], rotationDay, rotationOffers } 초기 null → 씬 진입 시 생성
  traits: null,                    // { owned:{id:true}, equipped:[id..] } 초기 null
  profAftermathSeen: {},           // 교수 후일담 관람 여부
  npcQuests: null,                 // Elara 등 심화 유대 진행
  customize: null,                 // 외관 커스터마이즈 { robe, hat, star, trail, owned }
  weekly: null,                    // 주간 도전 { week, ids, progress, done }
  highlights: null,                // 하이라이트 릴 (최근 20개 큰 순간)
  gameModes: null,                 // 도전 모드 { id: bool }
  dailyLogin: null,                // 매일 로그인 { lastDay, streak }
  endlessBest: 0,                  // Endless 모드 최고 층 도달
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
  state.legacy = {};
  state.artifacts = null;
  state.traits = null;
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
    if (typeof d.cipherSolvedCount === 'number') state.cipherSolvedCount = d.cipherSolvedCount;
    if (d.facultyCleared && typeof d.facultyCleared === 'object') state.facultyCleared = d.facultyCleared;
    if (typeof d.principalDefeated === 'number') state.principalDefeated = d.principalDefeated;
    if (d.professorsBeaten && typeof d.professorsBeaten === 'object') state.professorsBeaten = d.professorsBeaten;
    if (d.achievementsUnlocked && typeof d.achievementsUnlocked === 'object') state.achievementsUnlocked = d.achievementsUnlocked;
    if (d.dailyDone && typeof d.dailyDone === 'object') state.dailyDone = d.dailyDone;
    if (d.stats && typeof d.stats === 'object') state.stats = d.stats;
    if (d.storyFragments && typeof d.storyFragments === 'object') state.storyFragments = d.storyFragments;
    if (typeof d.academyTruthSeen === 'boolean') state.academyTruthSeen = d.academyTruthSeen;
    if (typeof d.tutorialSeen === 'boolean') state.tutorialSeen = d.tutorialSeen;
    if (d.deathPouch && typeof d.deathPouch === 'object') state.deathPouch = d.deathPouch;
    if (d.legacy && typeof d.legacy === 'object') state.legacy = d.legacy;
    if (d.artifacts && typeof d.artifacts === 'object') state.artifacts = d.artifacts;
    if (d.traits && typeof d.traits === 'object') state.traits = d.traits;
    if (d.profAftermathSeen && typeof d.profAftermathSeen === 'object') state.profAftermathSeen = d.profAftermathSeen;
    if (d.npcQuests && typeof d.npcQuests === 'object') state.npcQuests = d.npcQuests;
    if (d.customize && typeof d.customize === 'object') state.customize = d.customize;
    if (d.weekly && typeof d.weekly === 'object') state.weekly = d.weekly;
    if (Array.isArray(d.highlights)) state.highlights = d.highlights;
    if (d.gameModes && typeof d.gameModes === 'object') state.gameModes = d.gameModes;
    if (d.dailyLogin && typeof d.dailyLogin === 'object') state.dailyLogin = d.dailyLogin;
    if (typeof d.endlessBest === 'number') state.endlessBest = d.endlessBest;
    if (typeof academy !== 'undefined' && academy) {
      if (d.inventory)                    academy.inventory  = d.inventory;
      if (typeof d.bestArena === 'number') academy.bestArena = d.bestArena;
      if (typeof d.duelWins === 'number')  academy.duelWins  = d.duelWins;
      // 살아있는 아카데미 NPC 병합 (bond 로드 전에 배열에 있어야 함)
      if (typeof ensureLivingAcademyNpcs === 'function') ensureLivingAcademyNpcs();
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
    cipherSolvedCount: state.cipherSolvedCount || 0,
    facultyCleared: state.facultyCleared || {},
    principalDefeated: state.principalDefeated || 0,
    professorsBeaten: state.professorsBeaten || {},
    achievementsUnlocked: state.achievementsUnlocked || {},
    dailyDone: state.dailyDone || {},
    stats: state.stats || null,
    storyFragments: state.storyFragments || {},
    academyTruthSeen: !!state.academyTruthSeen,
    tutorialSeen: !!state.tutorialSeen,
    deathPouch: state.deathPouch || null,
    legacy: state.legacy || {},
    artifacts: state.artifacts || null,
    traits: state.traits || null,
    profAftermathSeen: state.profAftermathSeen || {},
    npcQuests: state.npcQuests || null,
    customize: state.customize || null,
    weekly: state.weekly || null,
    highlights: state.highlights || null,
    gameModes: state.gameModes || null,
    dailyLogin: state.dailyLogin || null,
    endlessBest: state.endlessBest || 0,
    inventory: (typeof academy !== 'undefined' && academy) ? academy.inventory : null,
    bestArena: (typeof academy !== 'undefined' && academy) ? academy.bestArena : 0,
    duelWins:  (typeof academy !== 'undefined' && academy) ? academy.duelWins  : 0,
    npcBonds,
    savedAt: Date.now(),
  };
  try { localStorage.setItem(k, JSON.stringify(payload)); } catch(e){}
  _syncAccountToServer(payload);
  // 자동 저장 인디케이터 (짧게 표시)
  state._saveIndicatorUntil = performance.now() + 1200;
}

// 서버에 계정 데이터 백업 (throttled: 5초). 성공 시 다른 기기에서도 로그인 가능.
let _lastServerSync = 0;
let _serverSyncTimer = null;
function _syncAccountToServer(payload) {
  if (!state.account || !state.account.name || !state.account.passHash) return;
  const now = Date.now();
  const delay = Math.max(0, 5000 - (now - _lastServerSync));
  if (_serverSyncTimer) clearTimeout(_serverSyncTimer);
  _serverSyncTimer = setTimeout(() => {
    _serverSyncTimer = null;
    _lastServerSync = Date.now();
    try {
      fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: state.account.name, passHash: state.account.passHash, data: payload }),
      }).catch(()=>{});
    } catch(_){}
  }, delay);
}

// 계정 삭제 시 데이터도 삭제 (미래에 사용)
function deleteAccountData(name) {
  if (!name) return;
  try { localStorage.removeItem('gaa_data_' + name.toLowerCase()); } catch(e){}
}

function showMsg(text, dur = 2.2) { state.msg = text; state.msgTimer = dur; }

