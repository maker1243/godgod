// =====================================================================
// Spell Crafting - 플레이어가 마법 조합을 만들고, 이름을 지정하고, 장착.
// 4개 축: 속성 (element) · 궤도 (traj) · 기폭 조건 (trigger) · 영창 (chant).
// 5 × 5 × 5 × 3 = 375 조합.
// state.customSpells = [{id, name, element, traj, trigger, chant}, ...]
// state.equippedSpell = id or null.
// 장착 시 castFire 대신 castCustomSpell 이 호출됨.
// =====================================================================

const SPELL_ELEMENTS = [
  { id:'fire',    name:'화염',   color:'#ff6666', kind:'fire',      dmgMult:1.00, effect:'화상 (DoT)' },
  { id:'ice',     name:'냉기',   color:'#8bd8ff', kind:'ice',       dmgMult:0.85, effect:'적 슬로우' },
  { id:'thunder', name:'번개',   color:'#e8c547', kind:'thunder',   dmgMult:1.15, effect:'경직 chance' },
  { id:'void',    name:'허공',   color:'#c86ade', kind:'shadow',    dmgMult:1.30, effect:'저주 (아머 감소)' },
  { id:'holy',    name:'신성',   color:'#ffefa8', kind:'holy',      dmgMult:1.10, effect:'회복 흡수' },
];

const SPELL_TRAJECTORIES = [
  { id:'straight', name:'직진',   speedMult:1.10, dmgMult:1.00, desc:'가장 표준적. 빠르고 안정적.' },
  { id:'homing',   name:'추적',   speedMult:0.75, dmgMult:0.95, desc:'가장 가까운 적 추적.',       homing: true },
  { id:'spiral',   name:'나선',   speedMult:0.85, dmgMult:0.90, desc:'회전하며 진행. 광역 공격.', spin: 6 },
  { id:'arc',      name:'곡선',   speedMult:0.90, dmgMult:1.10, desc:'포물선 궤도.',                arc: 0.08 },
  { id:'spread',   name:'산탄',   speedMult:1.00, dmgMult:0.55, desc:'5발 분사.',                   count: 5, spread: 0.3 },
];

const SPELL_TRIGGERS = [
  { id:'impact',  name:'즉발',       dmgMult:1.00, desc:'적중 즉시 데미지.' },
  { id:'delay',   name:'지연폭발',   dmgMult:1.50, desc:'0.5초 후 폭발. 광역 데미지.', delay:0.5, aoeR:20 },
  { id:'pierce',  name:'관통',       dmgMult:0.85, desc:'적 3명 관통.',                pierceLeft:3 },
  { id:'chain',   name:'연쇄',       dmgMult:0.80, desc:'적중 시 다음 적으로 튐 (3회).', chainLeft:3, chainR: 60 },
  { id:'ground',  name:'지면 장판',  dmgMult:0.60, desc:'착탄 지점에 3초 장판.',       ground:3, groundR:24 },
];

const SPELL_CHANTS = [
  { id:'quick',    name:'속창', dmgMult:0.60, cdMult:0.40, costMult:0.50, castLabel:'빠름 · 약함' },
  { id:'balanced', name:'표준', dmgMult:1.00, cdMult:1.00, costMult:1.00, castLabel:'표준' },
  { id:'slow',     name:'심창', dmgMult:1.90, cdMult:2.20, costMult:2.00, castLabel:'느림 · 강력' },
];

// ID/이름으로 조회
const SPELL_ELEMENT_BY_ID = Object.fromEntries(SPELL_ELEMENTS.map(e => [e.id, e]));
const SPELL_TRAJ_BY_ID    = Object.fromEntries(SPELL_TRAJECTORIES.map(t => [t.id, t]));
const SPELL_TRIGGER_BY_ID = Object.fromEntries(SPELL_TRIGGERS.map(t => [t.id, t]));
const SPELL_CHANT_BY_ID   = Object.fromEntries(SPELL_CHANTS.map(c => [c.id, c]));

function _spellState() {
  if (!state.customSpells) state.customSpells = [];
  if (typeof state.equippedSpell === 'undefined') state.equippedSpell = null;
}

function computeSpellStats(spell) {
  const e = SPELL_ELEMENT_BY_ID[spell.element] || SPELL_ELEMENTS[0];
  const t = SPELL_TRAJ_BY_ID[spell.traj]        || SPELL_TRAJECTORIES[0];
  const g = SPELL_TRIGGER_BY_ID[spell.trigger]  || SPELL_TRIGGERS[0];
  const c = SPELL_CHANT_BY_ID[spell.chant]      || SPELL_CHANTS[1];
  const dmg = 40 * e.dmgMult * t.dmgMult * g.dmgMult * c.dmgMult;
  const cd  = 0.35 * c.cdMult;
  const cost = Math.max(1, Math.round(6 * c.costMult));
  const speed = 240 * (t.speedMult || 1);
  return { e, t, g, c, dmg, cd, cost, speed };
}

// 새 스펠 생성 (RP 비용). 이미 만든 개수에 따라 비용 증가.
function craftSpell(element, traj, trigger, chant, name) {
  _spellState();
  const cost = 300 + (state.customSpells.length * 500);
  if ((state.research||0) < cost) { showMsg('연구가 부족합니다 (' + cost + ' RP)', 3); return null; }
  state.research -= cost;
  const id = 'sc_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const spell = { id, name: name || '무명 주문', element, traj, trigger, chant, createdAt: Date.now() };
  state.customSpells.push(spell);
  // 첫 스펠은 자동 장착
  if (state.equippedSpell === null) state.equippedSpell = id;
  if (typeof showAchievementBanner === 'function') showAchievementBanner('주문 창조', spell.name, '#ff00ff');
  if (typeof sfx === 'function') sfx('jackpot');
  if (typeof saveAccountData === 'function') saveAccountData();
  return spell;
}

function deleteSpell(id) {
  _spellState();
  const idx = state.customSpells.findIndex(s => s.id === id);
  if (idx < 0) return;
  state.customSpells.splice(idx, 1);
  if (state.equippedSpell === id) state.equippedSpell = state.customSpells.length ? state.customSpells[0].id : null;
  if (typeof saveAccountData === 'function') saveAccountData();
}

function equipSpell(id) {
  _spellState();
  if (id && !state.customSpells.find(s => s.id === id)) return;
  state.equippedSpell = id;
  if (typeof saveAccountData === 'function') saveAccountData();
}

function getEquippedSpell() {
  _spellState();
  if (!state.equippedSpell) return null;
  return state.customSpells.find(s => s.id === state.equippedSpell) || null;
}

// castCustomSpell - update.js 의 castFire 대신 호출됨 (equippedSpell 세팅 시)
function castCustomSpell(p, ang) {
  const spell = getEquippedSpell();
  if (!spell) return false;   // 폴백: 원래 castFire
  const st = computeSpellStats(spell);
  if (p.mp < st.cost) return false;
  p.mp -= st.cost;
  p.cd.fire = st.cd * (p.cdMult || 1);

  const dmg = st.dmg * (p.baseDmg || 1);
  const traj = st.t; const trig = st.g; const el = st.e;

  const count = traj.count || 1;
  const spread = traj.spread || 0;

  for (let i = 0; i < count; i++) {
    const a = ang + (i - (count-1)/2) * spread;
    const b = {
      x: p.x + Math.cos(a) * 6, y: p.y + Math.sin(a) * 6,
      vx: Math.cos(a) * st.speed, vy: Math.sin(a) * st.speed,
      r: 4, dmg, life: 2.0, kind: el.kind || 'fire', hits: 0,
      _customSpell: true,
      _element: spell.element,
    };
    // 궤도
    if (traj.homing) b.homing = true;
    if (traj.spin)   { b._sc_spin = traj.spin; b._sc_t = 0; }
    if (traj.arc)    { b._sc_arc = traj.arc; }
    // 기폭
    if (trig.pierceLeft) { b.pierce = true; b._pierceLeft = trig.pierceLeft; }
    if (trig.chainLeft)  { b._chainLeft = trig.chainLeft; b._chainR = trig.chainR; }
    if (trig.delay)      { b._delayFuse = trig.delay; b._aoeR = trig.aoeR; }
    if (trig.ground)     { b._groundFuse = 0; b._groundDur = trig.ground; b._groundR = trig.groundR; }
    // 속성 부가 효과
    if (spell.element === 'ice')     { b.freeze = 0.6; }
    if (spell.element === 'thunder' && Math.random() < 0.2) { b.stun = 0.4; }
    if (spell.element === 'void')    { b._curse = 2; }
    if (spell.element === 'holy')    { b._lifesteal = 0.05; }

    entities.bullets.push(b);
  }
  // 삼관마도
  if (p.threecrown && typeof threecrownCastEffect === 'function') threecrownCastEffect(p, ang);
  if (typeof sfx === 'function') sfx(el.kind === 'ice' ? 'ice' : 'fire');
  return true;
}

// 크래프팅 비용 - UI 표시용
function nextSpellCraftCost() {
  _spellState();
  return 300 + (state.customSpells.length * 500);
}
