// =====================================================================
// Game Modes - 도전 모드. 아카데미 UI 에서 토글.
// state.gameModes = { ironman: bool, nomagic: bool, speedrun: bool }
// 각 모드는 특별한 규칙 + 완료 시 뱃지 부여.
// =====================================================================

const GAME_MODES = [
  {
    id:'ironman',
    name:'IRONMAN',
    color:'#c81616',
    desc:'한 번 죽으면 계정의 관록/아티팩트/트레잇 30% 초기화',
    onDeath: () => {
      // Legacy 30% 리셋
      if (state.legacy) {
        for (const k of Object.keys(state.legacy)) {
          state.legacy[k] = Math.floor((state.legacy[k] || 0) * 0.7);
        }
      }
      showMsg('IRONMAN: 관록 30% 초기화됨.', 6);
    },
  },
  {
    id:'nomagic',
    name:'NOMAGIC',
    color:'#8bd8ff',
    desc:'스킬 트리 스킬 사용 안 함 (기본 파이어볼만). 완료 시 x5 RP',
    modifyCreate: (p) => { p._nomagic = true; },
    rewardMult: 5,
  },
  {
    id:'speedrun',
    name:'SPEEDRUN',
    color:'#3ac762',
    desc:'런 시간을 측정. 하이라이트에 시간 기록. 완료 시 시간 랭킹',
    modifyCreate: (p) => { p._runStart = Date.now(); },
  },
  {
    id:'hardcore',
    name:'HARDCORE',
    color:'#ff2d80',
    desc:'HP 최대치 50%. 데미지 x2. 완료 시 x3 RP',
    modifyCreate: (p) => {
      p.maxHp = Math.floor(p.maxHp * 0.5);
      p.hp = Math.min(p.hp, p.maxHp);
      p.baseDmg *= 2;
    },
    rewardMult: 3,
  },
  {
    id:'blindfaith',
    name:'BLIND FAITH',
    color:'#c86ade',
    desc:'축복을 볼 수 없이 랜덤 획득. 완료 시 x2 RP',
    modifyBlessing: true,
    rewardMult: 2,
  },
];

function _ensureModes() {
  if (!state.gameModes) state.gameModes = {};
}

function toggleGameMode(id) {
  _ensureModes();
  state.gameModes[id] = !state.gameModes[id];
  if (typeof saveAccountData === 'function') saveAccountData();
  return state.gameModes[id];
}

function isModeActive(id) {
  _ensureModes();
  return !!state.gameModes[id];
}

// createPlayer 훅
function applyGameModesToPlayer(p) {
  _ensureModes();
  for (const m of GAME_MODES) {
    if (state.gameModes[m.id] && m.modifyCreate) {
      try { m.modifyCreate(p); } catch(_){}
    }
  }
}

// onDeath 훅
function applyGameModesOnDeath() {
  _ensureModes();
  for (const m of GAME_MODES) {
    if (state.gameModes[m.id] && m.onDeath) {
      try { m.onDeath(); } catch(_){}
    }
  }
}

// RP 곱셈 (몹 처치, 보스 처치 시 사용)
function gameModeRpMult() {
  _ensureModes();
  let mult = 1;
  for (const m of GAME_MODES) {
    if (state.gameModes[m.id] && m.rewardMult) mult *= m.rewardMult;
  }
  return mult;
}

// UI: 아카데미 상단 표시할 활성 모드 이름들
function activeModeLabels() {
  _ensureModes();
  const arr = [];
  for (const m of GAME_MODES) if (state.gameModes[m.id]) arr.push({ name: m.name, color: m.color });
  return arr;
}
