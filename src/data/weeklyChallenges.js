// =====================================================================
// Weekly Challenges - 매주 3가지 고정 시드 도전. 완료 시 큰 RP.
// state.weekly = { week: 'YYYY-Www', progress: {id:number}, done: {id: timestamp} }
// =====================================================================

const WEEKLY_POOL = [
  { id:'w_kill100',   name:'100 KILLS',           desc:'100마리 처치',
    goal: 100, key:'weekly_kills',        reward: 5000  },
  { id:'w_kill500',   name:'500 KILLS',           desc:'500마리 처치',
    goal: 500, key:'weekly_kills',        reward: 30000 },
  { id:'w_prof3',     name:'교수 3명',            desc:'교수 3명 격파',
    goal: 3,   key:'weekly_profKills',    reward: 20000 },
  { id:'w_trial',     name:'시련 통과',           desc:'시련 1회 통과',
    goal: 1,   key:'weekly_trials',       reward: 10000 },
  { id:'w_bless30',   name:'축복 30개',           desc:'축복 30개 획득 (누적)',
    goal: 30,  key:'weekly_blessings',    reward: 15000 },
  { id:'w_combo20',   name:'콤보 x20',            desc:'단일 콤보 x20 달성',
    goal: 20,  key:'weekly_maxCombo',     reward: 8000  },
  { id:'w_rp1m',      name:'RP 100만',            desc:'런 하나에서 RP 100만 획득',
    goal: 1e6, key:'weekly_maxRunRp',     reward: 25000 },
  { id:'w_apex',      name:'APEX 진입',           desc:'APEX 티어로 던전 1회 클리어',
    goal: 1,   key:'weekly_apexClears',   reward: 50000 },
  { id:'w_synergy',   name:'시너지 활성화',       desc:'축복 시너지 1회 발동',
    goal: 1,   key:'weekly_synergies',    reward: 12000 },
  { id:'w_perfect',   name:'무피격 챔버 20개',    desc:'PERFECT! 20회',
    goal: 20,  key:'weekly_perfect',      reward: 12000 },
  { id:'w_elara',     name:'ELARA 유대 +1',        desc:'ELARA 유대 단계 1회 승격',
    goal: 1,   key:'weekly_elaraBond',    reward: 6000  },
  { id:'w_cipher5',   name:'암호 5회',             desc:'CIPHER 5회 성공',
    goal: 5,   key:'weekly_ciphers',      reward: 15000 },
];

function _currentWeek() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const daysDiff = Math.floor((d - start) / (1000*60*60*24));
  const week = Math.floor((daysDiff + start.getDay()) / 7);
  return d.getFullYear() + '-W' + String(week).padStart(2, '0');
}

function _pickWeekly(week) {
  let h = 0;
  for (let i = 0; i < week.length; i++) h = ((h * 31) + week.charCodeAt(i)) | 0;
  const pool = WEEKLY_POOL.slice();
  const out = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    h = (h * 1103515245 + 12345) | 0;
    const idx = Math.abs(h) % pool.length;
    out.push(pool[idx].id);
    pool.splice(idx, 1);
  }
  return out;
}

function ensureWeekly() {
  if (!state.weekly) state.weekly = { week: '', ids: [], progress: {}, done: {} };
  const w = _currentWeek();
  if (state.weekly.week !== w) {
    state.weekly.week = w;
    state.weekly.ids = _pickWeekly(w);
    state.weekly.progress = {};
    state.weekly.done = {};
    if (typeof saveAccountData === 'function') saveAccountData();
  }
}

function weeklyAdd(key, amount) {
  ensureWeekly();
  const p = state.weekly.progress;
  p[key] = (p[key] || 0) + amount;
  _weeklyCheck();
}

function weeklySet(key, value) {
  ensureWeekly();
  const p = state.weekly.progress;
  p[key] = Math.max(p[key] || 0, value);
  _weeklyCheck();
}

function _weeklyCheck() {
  const w = state.weekly;
  for (const id of w.ids) {
    if (w.done[id]) continue;
    const def = WEEKLY_POOL.find(d => d.id === id); if (!def) continue;
    const cur = w.progress[def.key] || 0;
    if (cur >= def.goal) {
      w.done[id] = Date.now();
      state.research = (state.research || 0) + def.reward;
      if (typeof showMsg === 'function') showMsg('★ 주간 도전 완료: ' + def.name + ' +' + _fmt(def.reward) + ' RP', 5);
      if (typeof sfx === 'function') sfx('level');
      if (typeof saveAccountData === 'function') saveAccountData();
    }
  }
}

function _fmt(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'k';
  return String(n);
}

// 상태 정보 반환 (UI 렌더용)
function weeklyStatus() {
  ensureWeekly();
  const w = state.weekly;
  return w.ids.map(id => {
    const def = WEEKLY_POOL.find(d => d.id === id);
    if (!def) return null;
    const cur = w.progress[def.key] || 0;
    const done = !!w.done[id];
    return { id, name: def.name, desc: def.desc, goal: def.goal, cur, done, reward: def.reward };
  }).filter(Boolean);
}

// 이번 주 리셋까지 남은 일수
function weeklyDaysLeft() {
  const d = new Date();
  // 다음 월요일 자정까지
  const day = d.getDay();   // 0=일요일, 1=월요일
  let daysLeft = (day === 0 ? 1 : 8 - day);   // 0 → 1일, 1 → 7일, 2 → 6일, ...
  return daysLeft;
}
