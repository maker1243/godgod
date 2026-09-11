// =====================================================================
// Player, skill defs, perks
// =====================================================================

// ---------- 플레이어 ----------
function createPlayer() {
  const base = {
    x: W/2, y: H/2,
    vx: 0, vy: 0,
    r: 5,
    speed: 60,
    facing: 1,
    hp: 100 + state.perks.hp * 20,
    maxHp: 100 + state.perks.hp * 20,
    mp: 60 + state.perks.mp * 15,
    maxMp: 60 + state.perks.mp * 15,
    level: 1,
    xp: 0,
    xpNext: 8,
    // 스킬 슬롯 (영구 저장 값 복사)
    slots: { lmb: state.equippedSlots.lmb, q: state.equippedSlots.q, e: state.equippedSlots.e },
    // 스킬별 쿨다운 (id 키)
    cd: {},
    baseDmg: 1 + state.perks.dmg * 0.15,
    cdMult: 1 - state.perks.cd * 0.08,
    mods: { fire: 1, ice: 1, lmbCd: 1, lmbDmg: 1 },
    // 상태
    shielding: false,
    parryWindow: 0,
    rolling: 0,
    rollCd: 0,
    invuln: 0,
    hitFlash: 0,
    animT: 0,
    reflectT: 0,
    // 특성 (로그라이크 - 매 던전 리셋)
    perks: [],
    hpRegen: 0,
    mpRegenBonus: 0,
    dmgReduction: 0,
    lifesteal: 0,
    thorns: 0,
    crit: 0,
    critMult: 2,
    mpCostMult: 1,
  };

  // 소유한 영구 스킬의 패시브 효과 적용 (SKILL_BY_ID가 아직 없으면 조용히 스킵)
  try {
    for (const id of Object.keys(state.ownedSkills)) {
      const s = SKILL_BY_ID[id];
      if (!s) continue;
      const lv = state.ownedSkills[id] || 0;
      if (s.effect && lv > 0) {
        for (let i = 0; i < lv; i++) s.effect(base, i + 1);
      }
    }
  } catch(e) { /* SKILL_BY_ID 아직 정의 전 - 첫 초기화 시점 */ }

  // Legacy / Artifacts / Traits 영구 효과 적용 (정의 파일이 없으면 스킵)
  try { if (typeof applyLegacyToPlayer    === 'function') applyLegacyToPlayer(base); } catch(_){}
  try { if (typeof applyArtifactsToPlayer === 'function') applyArtifactsToPlayer(base); } catch(_){}
  try { if (typeof applyTraitsToPlayer    === 'function') applyTraitsToPlayer(base); } catch(_){}
  try { if (typeof applyGameModesToPlayer === 'function') applyGameModesToPlayer(base); } catch(_){}
  try { if (typeof clanApplyBuffs         === 'function') clanApplyBuffs(base); } catch(_){}
  try { if (typeof factionApplyBuffs      === 'function') factionApplyBuffs(base); } catch(_){}

  // 아침 이벤트: 축제일이면 이번 던전 진입 시 RP DROP +50%
  try {
    if (typeof morningEvent !== 'undefined' && morningEvent.today && morningEvent.today.id === 'ev_festival') {
      base.rpMult = (base.rpMult || 1) * 1.5;
    }
    // 안개일이면 몹 데미지 살짝 강화 - createPlayer 에서 dmgReduction 살짝 낮춤
    if (typeof morningEvent !== 'undefined' && morningEvent.today && morningEvent.today.id === 'ev_fog') {
      base.dmgReduction = Math.max(0, (base.dmgReduction || 0) - 0.05);
    }
  } catch(_){}

  return base;
}

let player = createPlayer();

// ---------- 스킬 정의 ----------
const SKILLS = {
  fire: { name: 'FIREBALL', cd: 0.35, cost: 4, dmg: 10, speed: 140, radius: 3, key: 'LMB' },
  ice:  { name: 'ICE BOLT', cd: 0.9,  cost: 12, dmg: 22, speed: 180, radius: 2, key: 'Q', slow: 0.4 },
  time: { name: 'TIMESTOP', cd: 12,   cost: 30, dur: 2.5, key: 'E' },
};

// ---------- 특성 풀 (레벨업 선택) ----------
const PERK_POOL = [
  { id:'firemult',  name:'FIRE SPLIT', desc:'FIREBALL SPLITS INTO 3',
      apply: p => p.perks.push('firemult') },
  { id:'firedmg',   name:'FIRE POWER', desc:'FIRE DMG +40%',
      apply: p => { p.mods.fire = (p.mods.fire || 1) * 1.4; p.perks.push('firedmg'); } },
  { id:'firecd',    name:'QUICK CAST', desc:'LMB CD -30%',
      apply: p => { p.mods.lmbCd = (p.mods.lmbCd || 1) * 0.7; p.perks.push('firecd'); } },
  { id:'icepierce', name:'ICE PIERCE', desc:'ICE BOLT PIERCES ENEMIES',
      apply: p => p.perks.push('icepierce') },
  { id:'icefreeze', name:'DEEP FROST', desc:'ICE BOLT FREEZES 1.2S',
      apply: p => p.perks.push('icefreeze') },
  { id:'maxhp',     name:'VITALITY',   desc:'MAX HP +30',
      apply: p => { p.maxHp += 30; p.hp += 30; } },
  { id:'maxmp',     name:'MANA WELL',  desc:'MAX MP +25',
      apply: p => { p.maxMp += 25; p.mp += 25; } },
  { id:'regen',     name:'REGEN',      desc:'REGEN 1 HP/S',
      apply: p => { p.hpRegen = (p.hpRegen || 0) + 1; p.perks.push('regen'); } },
  { id:'mpregen',   name:'FOCUS',      desc:'MP REGEN +4/S',
      apply: p => { p.mpRegenBonus = (p.mpRegenBonus || 0) + 4; p.perks.push('mpregen'); } },
  { id:'speed',     name:'SWIFT',      desc:'MOVE SPEED +15%',
      apply: p => { p.speed *= 1.15; } },
  { id:'reflect',   name:'REFLECT',    desc:'PARRY LAUNCHES FIREBALL',
      apply: p => p.perks.push('reflect') },
  { id:'lifesteal', name:'LIFESTEAL',  desc:'HITS HEAL 2 HP',
      apply: p => { p.lifesteal = (p.lifesteal || 0) + 2; p.perks.push('lifesteal'); } },
  { id:'vampire',   name:'DARK PACT',  desc:'MAX HP -20, DMG +30%',
      apply: p => { p.maxHp -= 20; p.hp = Math.min(p.hp, p.maxHp); p.baseDmg *= 1.3; } },
  { id:'chain',     name:'CHAIN CAST', desc:'20% CHANCE NO CD',
      apply: p => p.perks.push('chain') },
  { id:'multiroll', name:'PHASE',      desc:'ROLL CD -50%',
      apply: p => p.perks.push('multiroll') },
  { id:'critup',    name:'PRECISION',  desc:'CRIT CHANCE +20%',
      apply: p => { p.crit = (p.crit || 0) + 0.2; } },
  { id:'thorns',    name:'THORNS',     desc:'REFLECT 6 DMG ON CONTACT',
      apply: p => { p.thorns = (p.thorns || 0) + 6; } },
  { id:'armor',     name:'ARMOR',      desc:'DMG TAKEN -15%',
      apply: p => { p.dmgReduction = (p.dmgReduction || 0) + 0.15; } },
];

function hasPerk(id) { return player.perks.includes(id); }
// 특성 스택 수(같은 특성을 몇 번 획득했는지) - 중첩 효과에 사용
function countPerk(id) {
  let n = 0;
  const arr = player.perks || [];
  for (let i = 0; i < arr.length; i++) if (arr[i] === id) n++;
  return n;
}

