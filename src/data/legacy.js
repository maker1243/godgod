// =====================================================================
// Legacy (관록) - RP 로 사는 영구 계정 스탯. 로그 스케일 비용 → 사면 살수록 다음이 10배.
// state.legacy = { pillarId: level }
// createPlayer 시 자동 적용. LEGACY 로비에서 구매.
// =====================================================================

const LEGACY_PILLARS = [
  { id:'dmg',   name:'DAMAGE PILLAR',   color:'#ff6666', desc:'BASE DMG +1% / LV',
    baseCost: 1e6,    grow: 1.35, apply:(p, lv)=>{ p.baseDmg *= (1 + lv * 0.01); } },
  { id:'hp',    name:'VITAL PILLAR',    color:'#3ac762', desc:'MAX HP +1% / LV',
    baseCost: 5e5,    grow: 1.30, apply:(p, lv)=>{ const add = Math.floor(p.maxHp * lv * 0.01); p.maxHp += add; p.hp += add; } },
  { id:'mp',    name:'MANA PILLAR',     color:'#3b7fd6', desc:'MAX MP +2% / LV',
    baseCost: 3e5,    grow: 1.28, apply:(p, lv)=>{ const add = Math.floor(p.maxMp * lv * 0.02); p.maxMp += add; p.mp += add; } },
  { id:'cd',    name:'SWIFT PILLAR',    color:'#e8c547', desc:'CD -0.5% / LV (min x0.1)',
    baseCost: 2e6,    grow: 1.40, apply:(p, lv)=>{ p.cdMult = Math.max(0.1, p.cdMult * Math.pow(0.995, lv)); } },
  { id:'crit',  name:'CRIT PILLAR',     color:'#ff9c3d', desc:'CRIT CHANCE +0.5% / LV',
    baseCost: 1.5e6,  grow: 1.38, apply:(p, lv)=>{ p.crit = (p.crit || 0) + lv * 0.005; } },
  { id:'reg',   name:'REGEN PILLAR',    color:'#8bd8ff', desc:'HP REGEN +0.5/S / LV',
    baseCost: 8e5,    grow: 1.32, apply:(p, lv)=>{ p.hpRegen = (p.hpRegen || 0) + lv * 0.5; } },
  { id:'speed', name:'SWIFTFOOT',       color:'#c8ffc8', desc:'MOVE SPEED +0.5% / LV (cap +250%)',
    baseCost: 6e5,    grow: 1.33, apply:(p, lv)=>{
      const mult = Math.min(3.5, 1 + lv * 0.005);
      p.speed *= mult;
    } },
  { id:'lifest',name:'BLOODBIND',       color:'#c81616', desc:'LIFESTEAL +0.2 / LV',
    baseCost: 2e6,    grow: 1.42, apply:(p, lv)=>{ p.lifesteal = (p.lifesteal || 0) + lv * 0.2; } },
  { id:'armor', name:'BULWARK',         color:'#8a7ab5', desc:'DMG TAKEN -0.4% / LV (cap 80%)',
    baseCost: 1.2e6,  grow: 1.36, apply:(p, lv)=>{ p.dmgReduction = Math.min(0.8, (p.dmgReduction || 0) + lv * 0.004); } },
  { id:'gold',  name:'FORTUNE',         color:'#ffefa8', desc:'RP DROP +1% / LV',
    baseCost: 5e5,    grow: 1.30, apply:(p, lv)=>{ p.rpMult = (p.rpMult || 1) * (1 + lv * 0.01); } },
  { id:'xp',    name:'SCHOLAR PILLAR',  color:'#8bd8ff', desc:'XP GAIN +2% / LV',
    baseCost: 4e5,    grow: 1.28, apply:(p, lv)=>{ p.xpMult = (p.xpMult || 1) * (1 + lv * 0.02); } },
  { id:'mag',   name:'MAGNET PILLAR',   color:'#c86ade', desc:'PICKUP 반경 +2 / LV',
    baseCost: 1e6,    grow: 1.32, apply:(p, lv)=>{ p.pickupRange = (p.pickupRange || 0) + lv * 2; } },
  { id:'chest', name:'HOARDER',         color:'#e8c547', desc:'상자 확률 +0.5% / LV',
    baseCost: 3e6,    grow: 1.36, apply:(p, lv)=>{ p.chestBoost = (p.chestBoost || 0) + lv * 0.005; } },
];

const LEGACY_BY_ID = {};
for (const l of LEGACY_PILLARS) LEGACY_BY_ID[l.id] = l;

function _legacyCostAt(pillar, level) {
  // 다음 level 을 사는 비용 (현재 lv → lv+1)
  return Math.ceil(pillar.baseCost * Math.pow(pillar.grow, level));
}

function legacyGetLevel(id) {
  return (state.legacy && state.legacy[id]) || 0;
}

function legacyBuy(id) {
  const p = LEGACY_BY_ID[id];
  if (!p) return false;
  const cur = legacyGetLevel(id);
  const cost = _legacyCostAt(p, cur);
  if ((state.research || 0) < cost) return false;
  state.research -= cost;
  if (!state.legacy) state.legacy = {};
  state.legacy[id] = cur + 1;
  if (typeof saveAccountData === 'function') saveAccountData();
  return true;
}

// createPlayer 훅: 모든 관록을 순차 적용.
function applyLegacyToPlayer(p) {
  if (!state.legacy) return;
  for (const pil of LEGACY_PILLARS) {
    const lv = state.legacy[pil.id] || 0;
    if (lv > 0 && typeof pil.apply === 'function') {
      try { pil.apply(p, lv); } catch(_) {}
    }
  }
}
