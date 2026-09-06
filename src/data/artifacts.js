// =====================================================================
// Artifacts (아티팩트) - 매일 5개 랜덤 로테이션. RP 로 구매하고 슬롯에 장착.
// state.artifacts = {
//   owned: { id: true }, equipped: [id, id, id],
//   rotationDay: 'YYYYMMDD', rotationOffers: [id, id, id, id, id]
// }
// =====================================================================

const ARTIFACT_SLOT_COUNT = 3;

const ARTIFACT_DEFS = [
  // ---------- 공격 계열 ----------
  { id:'atk_bloom',   name:'BLOOM CORE',       tier:1, cost: 5e5,  color:'#ff6666',
    desc:'DMG +15%',
    apply:(p)=>{ p.baseDmg *= 1.15; } },
  { id:'atk_prism',   name:'PRISM SHARD',      tier:2, cost: 5e6,  color:'#ff2d2d',
    desc:'DMG +35%',
    apply:(p)=>{ p.baseDmg *= 1.35; } },
  { id:'atk_stormeye',name:'STORM EYE',        tier:3, cost: 5e7,  color:'#c81616',
    desc:'DMG +80%',
    apply:(p)=>{ p.baseDmg *= 1.80; } },
  { id:'atk_dracoheart',name:'DRACO HEART',    tier:4, cost: 5e8,  color:'#ff0080',
    desc:'DMG x2.5',
    apply:(p)=>{ p.baseDmg *= 2.5; } },

  // ---------- 폭발/파이어 계열 ----------
  { id:'fire_forge',  name:'FIRE FORGE',       tier:2, cost: 3e6,  color:'#ff9c3d',
    desc:'FIRE MODIFIER x1.5',
    apply:(p)=>{ p.mods.fire = (p.mods.fire || 1) * 1.5; } },
  { id:'fire_solar',  name:'SOLAR CROWN',      tier:3, cost: 4e7,  color:'#ffdd66',
    desc:'FIRE x3, LMB CD -20%',
    apply:(p)=>{ p.mods.fire = (p.mods.fire || 1) * 3.0; p.mods.lmbCd = (p.mods.lmbCd || 1) * 0.8; } },
  { id:'ice_glacier', name:'GLACIER LENS',     tier:2, cost: 3e6,  color:'#8bd8ff',
    desc:'ICE MOD x2',
    apply:(p)=>{ p.mods.ice = (p.mods.ice || 1) * 2.0; } },

  // ---------- 방어/생존 ----------
  { id:'def_aegis',   name:'AEGIS PLATE',      tier:1, cost: 8e5,  color:'#8a7ab5',
    desc:'MAX HP +25%, DR +10%',
    apply:(p)=>{ const add = Math.floor(p.maxHp * 0.25); p.maxHp += add; p.hp += add; p.dmgReduction = (p.dmgReduction||0) + 0.10; } },
  { id:'def_titan',   name:'TITAN CORE',       tier:3, cost: 4e7,  color:'#5a4a80',
    desc:'MAX HP +75%, DR +25%',
    apply:(p)=>{ const add = Math.floor(p.maxHp * 0.75); p.maxHp += add; p.hp += add; p.dmgReduction = Math.min(0.85, (p.dmgReduction||0) + 0.25); } },
  { id:'def_phoenix', name:'PHOENIX DOWN',     tier:4, cost: 6e8,  color:'#ffefa8',
    desc:'죽으면 자동 부활 1회 (per run)',
    apply:(p)=>{ p.reviveCharges = (p.reviveCharges || 0) + 1; } },
  { id:'def_thorns',  name:'THORNVEIL',        tier:2, cost: 2e6,  color:'#3ac762',
    desc:'THORNS +30',
    apply:(p)=>{ p.thorns = (p.thorns || 0) + 30; } },

  // ---------- 유틸리티 ----------
  { id:'ut_swift',    name:'FEATHER BOOTS',    tier:1, cost: 5e5,  color:'#c8ffc8',
    desc:'SPEED +25%',
    apply:(p)=>{ p.speed *= 1.25; } },
  { id:'ut_phase',    name:'PHASE CLOAK',      tier:2, cost: 3e6,  color:'#8bd8ff',
    desc:'ROLL CD -50%',
    apply:(p)=>{ p.perks.push('multiroll'); } },
  { id:'ut_focus',    name:'FOCUS BAND',       tier:2, cost: 2.5e6, color:'#3b7fd6',
    desc:'MP REGEN +8/S, MP COST -20%',
    apply:(p)=>{ p.mpRegenBonus = (p.mpRegenBonus||0) + 8; p.mpCostMult = (p.mpCostMult||1) * 0.8; } },

  // ---------- 크리티컬 ----------
  { id:'crit_dagger', name:'CRIT DAGGER',      tier:2, cost: 3e6,  color:'#ff2d80',
    desc:'CRIT +25%',
    apply:(p)=>{ p.crit = (p.crit||0) + 0.25; } },
  { id:'crit_shatter',name:'SHATTER PRISM',    tier:3, cost: 3e7,  color:'#ff00ff',
    desc:'CRIT +40%, CRIT MULT x1.5',
    apply:(p)=>{ p.crit = (p.crit||0) + 0.4; p.critMult = (p.critMult||2) * 1.5; } },
  { id:'crit_moon',   name:'MOONBLADE',        tier:4, cost: 5e8,  color:'#ffefa8',
    desc:'CRIT +60%, CRIT MULT x2.5',
    apply:(p)=>{ p.crit = (p.crit||0) + 0.6; p.critMult = (p.critMult||2) * 2.5; } },

  // ---------- 재화/드롭 ----------
  { id:'eco_purse',   name:'MERCHANT PURSE',   tier:1, cost: 4e5,  color:'#e8c547',
    desc:'RP DROP +25%',
    apply:(p)=>{ p.rpMult = (p.rpMult||1) * 1.25; } },
  { id:'eco_treasury',name:'TREASURY SEAL',    tier:3, cost: 3e7,  color:'#ffefa8',
    desc:'RP DROP +100%',
    apply:(p)=>{ p.rpMult = (p.rpMult||1) * 2.0; } },
  { id:'eco_scholar', name:'SCHOLAR CROWN',    tier:2, cost: 1.5e6, color:'#8bd8ff',
    desc:'XP GAIN +50%',
    apply:(p)=>{ p.xpMult = (p.xpMult||1) * 1.5; } },

  // ---------- 흡혈/재생 ----------
  { id:'vamp_fang',   name:'VAMPIRE FANG',     tier:2, cost: 3e6,  color:'#c81616',
    desc:'LIFESTEAL +5',
    apply:(p)=>{ p.lifesteal = (p.lifesteal||0) + 5; } },
  { id:'vamp_covenant',name:'DARK COVENANT',   tier:4, cost: 5e8,  color:'#ff2d80',
    desc:'LIFESTEAL +20, MAX HP -20%',
    apply:(p)=>{ p.lifesteal = (p.lifesteal||0) + 20; const cut = Math.floor(p.maxHp * 0.2); p.maxHp -= cut; p.hp = Math.min(p.hp, p.maxHp); } },
  { id:'vamp_regen',  name:'GAIA HEART',       tier:2, cost: 2e6,  color:'#3ac762',
    desc:'HP REGEN +5/S',
    apply:(p)=>{ p.hpRegen = (p.hpRegen||0) + 5; } },

  // ---------- 특수 (몹 관련) ----------
  { id:'sp_elite',    name:'ELITE MARKER',     tier:3, cost: 2e7,  color:'#ffefa8',
    desc:'ELITE SPAWN CHANCE x3',
    apply:(p)=>{ p.eliteMult = (p.eliteMult||1) * 3; } },
  { id:'sp_pouch',    name:'AUTO POUCH',       tier:2, cost: 4e6,  color:'#8a5a30',
    desc:'DEATH POUCH 자동 회수',
    apply:(p)=>{ p.autoPouch = true; } },
  { id:'sp_chain',    name:'CHAIN RUNE',       tier:2, cost: 3e6,  color:'#c86ade',
    desc:'20% CHANCE NO CD',
    apply:(p)=>{ p.perks.push('chain'); } },

  // ---------- 최상위 (사기) ----------
  { id:'god_arcana',  name:'ARCANA CROWN',     tier:5, cost: 5e9,  color:'#ff00ff',
    desc:'DMG x5, MAX HP x2',
    apply:(p)=>{ p.baseDmg *= 5; const add = Math.floor(p.maxHp); p.maxHp += add; p.hp += add; } },
  { id:'god_infinity',name:'INFINITY SIGIL',   tier:5, cost: 1e10, color:'#ffffff',
    desc:'ALL STATS x1.5',
    apply:(p)=>{ p.baseDmg *= 1.5; const add = Math.floor(p.maxHp * 0.5); p.maxHp += add; p.hp += add; p.speed *= 1.5; p.crit = (p.crit||0) + 0.3; } },
  { id:'god_starforge',name:'STAR FORGE',      tier:5, cost: 2e10, color:'#ffefa8',
    desc:'DMG x10 (fire only)',
    apply:(p)=>{ p.mods.fire = (p.mods.fire||1) * 10; } },
  { id:'god_wraith',  name:'WRAITH KING',      tier:5, cost: 3e10, color:'#7d4dbf',
    desc:'CRIT +80%, LIFESTEAL +30',
    apply:(p)=>{ p.crit = (p.crit||0) + 0.8; p.lifesteal = (p.lifesteal||0) + 30; } },
];

const ARTIFACT_BY_ID = {};
for (const a of ARTIFACT_DEFS) ARTIFACT_BY_ID[a.id] = a;

function _todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return y + m + dd;
}

// 결정론적 랜덤 (일자 시드) - 매일 같은 5개 오퍼
function _artifactSeededPick(dayStr, n) {
  let seed = 0;
  for (let i = 0; i < dayStr.length; i++) seed = ((seed * 31) + dayStr.charCodeAt(i)) | 0;
  const ids = ARTIFACT_DEFS.map(a => a.id).slice();
  const out = [];
  for (let i = 0; i < n && ids.length; i++) {
    seed = (seed * 1103515245 + 12345) | 0;
    const r = Math.abs(seed) % ids.length;
    out.push(ids[r]);
    ids.splice(r, 1);
  }
  return out;
}

function _ensureArtifactsState() {
  if (!state.artifacts) {
    state.artifacts = { owned: {}, equipped: [], rotationDay: '', rotationOffers: [] };
  }
  const today = _todayStr();
  if (state.artifacts.rotationDay !== today) {
    state.artifacts.rotationDay = today;
    state.artifacts.rotationOffers = _artifactSeededPick(today, 5);
    if (typeof saveAccountData === 'function') saveAccountData();
  }
}

function artifactBuy(id) {
  _ensureArtifactsState();
  const a = ARTIFACT_BY_ID[id]; if (!a) return false;
  if (state.artifacts.owned[id]) return false;
  if ((state.research || 0) < a.cost) return false;
  state.research -= a.cost;
  state.artifacts.owned[id] = true;
  if (typeof saveAccountData === 'function') saveAccountData();
  return true;
}

function artifactEquip(id) {
  _ensureArtifactsState();
  if (!state.artifacts.owned[id]) return false;
  const eq = state.artifacts.equipped;
  const idx = eq.indexOf(id);
  if (idx >= 0) { eq.splice(idx, 1); if (typeof saveAccountData === 'function') saveAccountData(); return true; }
  if (eq.length >= ARTIFACT_SLOT_COUNT) return false;
  eq.push(id);
  if (typeof saveAccountData === 'function') saveAccountData();
  return true;
}

function applyArtifactsToPlayer(p) {
  _ensureArtifactsState();
  for (const id of state.artifacts.equipped) {
    const a = ARTIFACT_BY_ID[id];
    if (a && typeof a.apply === 'function') { try { a.apply(p); } catch(_){} }
  }
}
