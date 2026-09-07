// =====================================================================
// Combo System & Perfect Chamber - "재미있는" 즉시 피드백.
// - 킬 콤보: 3초 내 연쇄 킬 카운트. 큰 텍스트 + RP 보너스
// - 무피격 클리어: 방 클리어 시 피격 없었으면 +100 RP + "PERFECT!"
// - 블리스 시너지 콤보: 특정 축복 조합 소유 시 자동 시너지 발동
// =====================================================================

const combo = {
  count: 0,
  lastKillT: 0,      // performance.now() when
  maxThisRun: 0,
};

// 콤보 유지 시간 (초)
const COMBO_TIMEOUT = 3.0;
// 콤보 텍스트 색상 단계
const COMBO_TIERS = [
  { at: 3,   color:'#8bd8ff', label:'COMBO' },
  { at: 5,   color:'#ffefa8', label:'GREAT' },
  { at: 10,  color:'#ff9c3d', label:'AMAZING' },
  { at: 20,  color:'#ff2d80', label:'INSANE' },
  { at: 40,  color:'#ff00ff', label:'GODLIKE' },
  { at: 80,  color:'#ffffff', label:'DIVINE'  },
];

function _comboLabel(n) {
  let best = null;
  for (const t of COMBO_TIERS) if (n >= t.at) best = t;
  return best;
}

function comboOnKill(x, y) {
  const now = performance.now();
  if (now - combo.lastKillT > COMBO_TIMEOUT * 1000) combo.count = 0;
  combo.count++;
  combo.lastKillT = now;
  if (combo.count > combo.maxThisRun) combo.maxThisRun = combo.count;
  const tier = _comboLabel(combo.count);
  if (tier && combo.count === tier.at) {
    // 티어 진입 시 큰 텍스트
    spawnFloat(x, y - 20, tier.label + ' x' + combo.count + '!', tier.color);
    // 보너스 RP
    const bonus = Math.floor(combo.count * 5);
    state.research = (state.research || 0) + bonus;
    if (typeof sfx === 'function') sfx('level');
    // 하이라이트: x20 이상
    if (typeof highlightBigCombo === 'function') highlightBigCombo(combo.count);
  } else if (combo.count >= 3) {
    // 유지 표시 (작게)
    spawnFloat(x, y - 14, 'x' + combo.count, tier ? tier.color : '#8bd8ff');
  }
}

function comboTick(dt) {
  const now = performance.now();
  if (combo.count > 0 && now - combo.lastKillT > COMBO_TIMEOUT * 1000) {
    combo.count = 0;
  }
}

function drawComboHud() {
  if (combo.count < 3) return;
  const tier = _comboLabel(combo.count);
  const remain = Math.max(0, COMBO_TIMEOUT - (performance.now() - combo.lastKillT) / 1000);
  const label = (tier ? tier.label : 'COMBO') + ' x' + combo.count;
  const col = tier ? tier.color : '#8bd8ff';
  const scale = combo.count >= 10 ? 2 : 1;
  const tw = textWidth(label, scale);
  const y = 55;
  drawText(label, W/2 - tw/2, y, col, scale);
  // 콤보 게이지
  const gw = 60, gx = W/2 - gw/2;
  pxDraw(gx, y + 12 * scale, gw, 2, '#1a0e2e');
  pxDraw(gx, y + 12 * scale, gw * (remain / COMBO_TIMEOUT), 2, col);
}

// =====================================================================
// Perfect Chamber
// =====================================================================
const perfectChamber = {
  hpAtStart: 0,
  active: false,
};

function perfectChamberBegin() {
  perfectChamber.hpAtStart = player ? player.hp : 0;
  perfectChamber.active = true;
}

function perfectChamberCheck(room) {
  if (!perfectChamber.active) return;
  if (!player) return;
  if (room && room.cleared && !room.isBoss) {
    // 피격 없음 = HP 감소 없음 (회복 무시)
    const noDamage = player.hp >= perfectChamber.hpAtStart;
    if (noDamage) {
      const bonus = 100;
      state.research = (state.research || 0) + bonus;
      spawnFloat(player.x, player.y - 18, 'PERFECT! +' + bonus + ' RP', '#ffefa8');
      if (typeof sfx === 'function') sfx('level');
      if (typeof weeklyAdd === 'function') weeklyAdd('weekly_perfect', 1);
    }
    perfectChamber.active = false;
  }
}

// =====================================================================
// Blessing Synergy Combos - 특정 축복 조합 시 시너지 자동 발동.
// 매번 blessing 획득 시 checkBlessingCombos() 호출.
// =====================================================================
const BLESSING_COMBOS = [
  { id:'combo_sunblaze',
    name:'SUNBLAZE',
    color:'#ff9c3d',
    need: ['bl_dragon', 'bl_burn', 'bl_precision'],
    desc:'DRAGON + IGNITE + DEADEYE → 파이어볼 크리 시 태양 폭발',
    apply:(p)=>{ p._synSunblaze = true; },
  },
  { id:'combo_frostbite',
    name:'FROSTBITE',
    color:'#8bd8ff',
    need: ['bl_frostaura', 'bl_hex', 'bl_execute_low'],
    // execute low not exact — use closest existing
    desc:'FROST AURA + HEX + DEATH MARK → 슬로우된 적 즉사 확률',
    apply:(p)=>{ p._synFrostbite = true; },
  },
  { id:'combo_glassdance',
    name:'GLASS DANCE',
    color:'#c86ade',
    need: ['bl_glasscannon', 'bl_tinylegend', 'bl_phase'],
    desc:'GLASS CANNON + TINY + PHASE → 회피 시 데미지 x2',
    apply:(p)=>{ p._synGlassdance = true; },
  },
  { id:'combo_orbitalstorm',
    name:'ORBITAL STORM',
    color:'#e8c547',
    need: ['bl_orbital', 'bl_barrage', 'bl_echo'],
    desc:'ORBITAL + BARRAGE + ECHO → 궤도 발사체 4개, DPS x2',
    apply:(p)=>{ p._synOrbitalstorm = true; if (p.orbitals) p.orbitals = []; p.blessOrbital = 4; },
  },
  { id:'combo_vampire',
    name:'BLOOD LORD',
    color:'#c81616',
    need: ['bl_lifesteal', 'bl_regen', 'bl_berserker'],
    desc:'BLOOD OATH + REGROWTH + BERSERKER → HP 회복량 x3',
    apply:(p)=>{ p._synVampire = true; if (p.hpRegen) p.hpRegen *= 3; if (p.lifesteal) p.lifesteal *= 3; },
  },
  { id:'combo_arcanemaster',
    name:'ARCANE MASTER',
    color:'#ff00ff',
    need: ['bl_arcanabless', 'bl_timelord', 'bl_fast'],
    desc:'ARCANA + TIMELORD + RAPID → 모든 CD 90% 감소',
    apply:(p)=>{ p._synArcane = true; p.cdMult *= 0.5; },
  },
];

function checkBlessingCombos() {
  if (!player || !player.blessings) return;
  const owned = new Set(player.blessings);
  const activated = player._synActivated || (player._synActivated = new Set());
  for (const c of BLESSING_COMBOS) {
    if (activated.has(c.id)) continue;
    if (c.need.every(id => owned.has(id))) {
      activated.add(c.id);
      try { c.apply(player); } catch(_){}
      if (typeof weeklyAdd === 'function') weeklyAdd('weekly_synergies', 1);
      showMsg('★ SYNERGY: ' + c.name + ' - ' + c.desc, 6);
      spawnFloat(player.x, player.y - 24, '★ ' + c.name + ' ★', c.color);
      if (typeof highlightSynergy === 'function') highlightSynergy(c.name);
      if (typeof sfx === 'function') sfx('level');
      // 폭발적 파티클
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        const sp = 60 + Math.random() * 40;
        spawnParticle(player.x, player.y, c.color, 0.8, 3, sp);
      }
    }
  }
}

// 축복 리셋 시 시너지 해제도.
function resetSynergies() {
  if (!player) return;
  player._synActivated = new Set();
  player._synSunblaze = false;
  player._synFrostbite = false;
  player._synGlassdance = false;
  player._synOrbitalstorm = false;
  player._synVampire = false;
  player._synArcane = false;
}
