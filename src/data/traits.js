// =====================================================================
// Traits (트레잇) - 5개 슬롯. 20종. RP 로 영구 해금 후 자유 장착.
// state.traits = { owned: {id:true}, equipped: [id1..id5] }
// =====================================================================

const TRAIT_SLOT_COUNT = 5;

const TRAIT_DEFS = [
  // 공격
  { id:'tr_dmg1',    name:'STRIKER I',    cat:'ATK', cost:2e5,  color:'#ff6666',
    desc:'DMG +10%',           apply:(p)=>{ p.baseDmg *= 1.10; } },
  { id:'tr_dmg2',    name:'STRIKER II',   cat:'ATK', cost:2e6,  color:'#ff2d2d',
    desc:'DMG +25%',           apply:(p)=>{ p.baseDmg *= 1.25; } },
  { id:'tr_cdall',   name:'CHRONO',       cat:'ATK', cost:3e6,  color:'#e8c547',
    desc:'ALL SKILL CD -15%',  apply:(p)=>{ p.cdMult = p.cdMult * 0.85; } },
  { id:'tr_lmb',     name:'LMB MASTER',   cat:'ATK', cost:1.5e6,color:'#ff9c3d',
    desc:'LMB DMG +40%, CD -20%', apply:(p)=>{ p.mods.lmbDmg = (p.mods.lmbDmg||1) * 1.4; p.mods.lmbCd = (p.mods.lmbCd||1) * 0.8; } },

  // 방어
  { id:'tr_hp1',     name:'BULK I',       cat:'DEF', cost:2e5,  color:'#3ac762',
    desc:'MAX HP +15%',        apply:(p)=>{ const add = Math.floor(p.maxHp * 0.15); p.maxHp += add; p.hp += add; } },
  { id:'tr_hp2',     name:'BULK II',      cat:'DEF', cost:2e6,  color:'#1a6a2a',
    desc:'MAX HP +40%',        apply:(p)=>{ const add = Math.floor(p.maxHp * 0.40); p.maxHp += add; p.hp += add; } },
  { id:'tr_dr',      name:'IRON SKIN',    cat:'DEF', cost:1.5e6,color:'#8a7ab5',
    desc:'DMG TAKEN -20%',     apply:(p)=>{ p.dmgReduction = Math.min(0.8, (p.dmgReduction||0) + 0.20); } },
  { id:'tr_regen',   name:'RESTORE',      cat:'DEF', cost:1e6,  color:'#8bd8ff',
    desc:'HP REGEN +3/S',      apply:(p)=>{ p.hpRegen = (p.hpRegen||0) + 3; } },

  // 유틸
  { id:'tr_swift',   name:'SWIFT',        cat:'UTIL',cost:5e5,  color:'#c8ffc8',
    desc:'SPEED +15%',         apply:(p)=>{ p.speed *= 1.15; } },
  { id:'tr_mp',      name:'MANA WELL',    cat:'UTIL',cost:3e5,  color:'#3b7fd6',
    desc:'MAX MP +50%, REGEN +3', apply:(p)=>{ const add = Math.floor(p.maxMp * 0.5); p.maxMp += add; p.mp += add; p.mpRegenBonus = (p.mpRegenBonus||0) + 3; } },
  { id:'tr_dodge',   name:'PHASE',        cat:'UTIL',cost:1e6,  color:'#c86ade',
    desc:'ROLL CD -50%',       apply:(p)=>{ p.perks.push('multiroll'); } },
  { id:'tr_reflect', name:'REFLECT',      cat:'UTIL',cost:8e5,  color:'#ffefa8',
    desc:'PARRY -> FIREBALL',  apply:(p)=>{ p.perks.push('reflect'); } },

  // 크리티컬
  { id:'tr_crit1',   name:'PRECISION I',  cat:'CRIT',cost:6e5,  color:'#ff2d80',
    desc:'CRIT +15%',          apply:(p)=>{ p.crit = (p.crit||0) + 0.15; } },
  { id:'tr_crit2',   name:'PRECISION II', cat:'CRIT',cost:5e6,  color:'#ff00ff',
    desc:'CRIT +30%, MULT +0.5', apply:(p)=>{ p.crit = (p.crit||0) + 0.3; p.critMult = (p.critMult||2) + 0.5; } },

  // 재화
  { id:'tr_rp',      name:'FORTUNE',      cat:'ECO', cost:5e5,  color:'#e8c547',
    desc:'RP DROP +30%',       apply:(p)=>{ p.rpMult = (p.rpMult||1) * 1.3; } },
  { id:'tr_xp',      name:'SCHOLAR',      cat:'ECO', cost:5e5,  color:'#8bd8ff',
    desc:'XP GAIN +40%',       apply:(p)=>{ p.xpMult = (p.xpMult||1) * 1.4; } },

  // 코업
  { id:'tr_coop_rp', name:'PARTNER LUCK', cat:'COOP',cost:8e5,  color:'#3ac762',
    desc:'COOP 시 RP x2',      apply:(p)=>{ p.coopRp = true; if (typeof mp !== 'undefined' && mp && mp.coop && mp.coop.active) p.rpMult = (p.rpMult||1) * 2; } },

  // 훈련장
  { id:'tr_train',   name:'DRILLMASTER', cat:'TRAIN',cost:1e6,  color:'#e8c547',
    desc:'TRAINING DPS x1.5',  apply:(p)=>{ p.trainMult = (p.trainMult||1) * 1.5; } },

  // 흡혈
  { id:'tr_life',    name:'BLOODBOND',    cat:'DEF', cost:1.5e6,color:'#c81616',
    desc:'LIFESTEAL +3',       apply:(p)=>{ p.lifesteal = (p.lifesteal||0) + 3; } },

  // 특수
  { id:'tr_thorns',  name:'THORNS',       cat:'UTIL',cost:8e5,  color:'#3ac762',
    desc:'THORNS +15',         apply:(p)=>{ p.thorns = (p.thorns||0) + 15; } },

  // 추가 트레잇 (5종)
  { id:'tr_chest',   name:'TREASURE HUNT', cat:'ECO', cost:2e6,  color:'#e8c547',
    desc:'CHEST 확률 +10%',    apply:(p)=>{ p.blessLucky = true; } },
  { id:'tr_combo',   name:'COMBO INSTINCT',cat:'ATK', cost:2e6,  color:'#ff9c3d',
    desc:'콤보 유지 시간 +50%', apply:(p)=>{ p.comboExtra = true; } },
  { id:'tr_potion',  name:'ALCHEMY',       cat:'UTIL',cost:1.5e6,color:'#c86ade',
    desc:'포션 효과 +50%',      apply:(p)=>{ p.potionMult = (p.potionMult||1) * 1.5; } },
  { id:'tr_pickup',  name:'MAGNET',        cat:'UTIL',cost:1e6,  color:'#8bd8ff',
    desc:'PICKUP 자석 +50 반경',apply:(p)=>{ p.pickupRange = (p.pickupRange||0) + 50; } },
  { id:'tr_bosskill',name:'BOSS SLAYER',   cat:'ATK', cost:3e6,  color:'#c81616',
    desc:'보스에게 DMG +50%',   apply:(p)=>{ p.bossDmgMult = (p.bossDmgMult||1) * 1.5; } },
];

const TRAIT_BY_ID = {};
for (const t of TRAIT_DEFS) TRAIT_BY_ID[t.id] = t;

function _ensureTraitsState() {
  if (!state.traits) state.traits = { owned: {}, equipped: [] };
}

function traitBuy(id) {
  _ensureTraitsState();
  const t = TRAIT_BY_ID[id]; if (!t) return false;
  if (state.traits.owned[id]) return false;
  if ((state.research || 0) < t.cost) return false;
  state.research -= t.cost;
  state.traits.owned[id] = true;
  if (typeof saveAccountData === 'function') saveAccountData();
  return true;
}

function traitEquip(id) {
  _ensureTraitsState();
  if (!state.traits.owned[id]) return false;
  const eq = state.traits.equipped;
  const idx = eq.indexOf(id);
  if (idx >= 0) { eq.splice(idx, 1); if (typeof saveAccountData === 'function') saveAccountData(); return true; }
  if (eq.length >= TRAIT_SLOT_COUNT) return false;
  eq.push(id);
  if (typeof saveAccountData === 'function') saveAccountData();
  return true;
}

function applyTraitsToPlayer(p) {
  _ensureTraitsState();
  for (const id of state.traits.equipped) {
    const t = TRAIT_BY_ID[id];
    if (t && typeof t.apply === 'function') { try { t.apply(p); } catch(_){} }
  }
}
