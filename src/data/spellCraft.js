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

// =====================================================================
// 물약 재료 (Ingredients) - 크래프트 시 넣어 특수 효과 부여.
// 한 종류를 300 이상 넣으면 폭발 (크래프트 실패 + HP 감소).
// 재료는 크래프트 시 RP 로 함께 구매됨 (개당 20 RP).
// =====================================================================
const INGREDIENT_UNIT_COST = 20;
const INGREDIENT_EXPLODE_AT = 300;

const SPELL_INGREDIENTS = [
  { id:'atk',     name:'공격력 물약',   color:'#ff6666', desc:'+2% DMG per 물약' },
  { id:'heal',    name:'생명 물약',     color:'#3ac762', desc:'시전 시 +1 HP per 물약 (최대 30/캐스트)' },
  { id:'mp',      name:'마나 절약 물약',color:'#8bd8ff', desc:'MP 비용 -0.5% per 물약' },
  { id:'speed',   name:'가속 물약',     color:'#ffefa8', desc:'투사체 속도 +1% per 물약' },
  { id:'crit',    name:'크리티컬 물약', color:'#e8c547', desc:'+0.15% 크리티컬 확률 per 물약' },
  { id:'pierce',  name:'관통 물약',     color:'#c86ade', desc:'+1 관통 per 50 물약' },
  { id:'lifesteal',name:'흡혈 물약',    color:'#c81616', desc:'+0.15% 흡혈 per 물약' },
  { id:'burn',    name:'화상 물약',     color:'#ff9c3d', desc:'적에게 화상 (+0.5% DoT per 물약)' },
  { id:'freeze',  name:'냉동 물약',     color:'#5adcff', desc:'적을 냉동 (+0.02s per 물약)' },
  { id:'stun',    name:'감전 물약',     color:'#ffff88', desc:'경직 확률 +0.1% per 물약' },
  { id:'knock',   name:'넉백 물약',     color:'#a0a0a0', desc:'넉백 강도 +0.05 per 물약' },
  { id:'multi',   name:'분열 물약',     color:'#ff2d80', desc:'추가 발사체 +1 per 100 물약' },
  { id:'echo',    name:'메아리 물약',   color:'#c86ade', desc:'25% 확률로 즉시 재시전 (100 물약당 5%)' },
  { id:'bounce',  name:'반사 물약',     color:'#8a5adc', desc:'벽 반사 횟수 +1 per 60 물약' },
  { id:'shield', name:'수호 물약',      color:'#00c8ff', desc:'시전 시 0.3초 무적 (100 물약당 활성)' },
];
const INGREDIENT_BY_ID = Object.fromEntries(SPELL_INGREDIENTS.map(i => [i.id, i]));

// 재료 총 비용 (RP)
function ingredientCost(ing) {
  let n = 0;
  if (!ing) return 0;
  for (const k of Object.keys(ing)) n += Math.max(0, Math.min(9999, ing[k] || 0));
  return n * INGREDIENT_UNIT_COST;
}

// 폭발 위험 재료 목록
function unstableIngredients(ing) {
  const out = [];
  if (!ing) return out;
  for (const k of Object.keys(ing)) if ((ing[k] || 0) >= INGREDIENT_EXPLODE_AT) out.push(k);
  return out;
}

// 재료가 적용된 스탯 계산
function _applyIngredientsToStats(st, ing) {
  if (!ing) return st;
  const g = (k) => Math.max(0, Math.min(9999, ing[k] || 0));
  st.dmg  *= (1 + g('atk') * 0.02);
  st.cost = Math.max(1, Math.round(st.cost * (1 - g('mp') * 0.005)));
  st.speed *= (1 + g('speed') * 0.01);
  // 추가 필드 - castCustomSpell 에서 소비
  st.critAdd     = g('crit') * 0.0015;
  st.pierceAdd   = Math.floor(g('pierce') / 50);
  st.lifestealAdd = g('lifesteal') * 0.0015;
  st.burnDmg     = g('burn') * 0.005;
  st.freezeAdd   = g('freeze') * 0.02;
  st.stunChance  = g('stun') * 0.001;
  st.knockAdd    = g('knock') * 0.05;
  st.multiAdd    = Math.floor(g('multi') / 100);
  st.echoChance  = g('echo') * 0.0005;
  st.bounceAdd   = Math.floor(g('bounce') / 60);
  st.shieldOnCast = g('shield') >= 100;
  st.healPerCast  = Math.min(30, g('heal'));
  return st;
}

// ID/이름으로 조회
const SPELL_ELEMENT_BY_ID = Object.fromEntries(SPELL_ELEMENTS.map(e => [e.id, e]));
const SPELL_TRAJ_BY_ID    = Object.fromEntries(SPELL_TRAJECTORIES.map(t => [t.id, t]));
const SPELL_TRIGGER_BY_ID = Object.fromEntries(SPELL_TRIGGERS.map(t => [t.id, t]));
const SPELL_CHANT_BY_ID   = Object.fromEntries(SPELL_CHANTS.map(c => [c.id, c]));

function _spellState() {
  if (!state.customSpells) state.customSpells = [];
  if (typeof state.equippedSpell === 'undefined') state.equippedSpell = null;
  // 새 다중 슬롯 저장소: {lmb, q, e}
  if (!state.equippedSpells || typeof state.equippedSpells !== 'object') {
    state.equippedSpells = { lmb: state.equippedSpell || null, q: null, e: null };
  }
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

// 새 스펠 생성 (RP 비용). 이미 만든 개수에 따라 비용 증가. ingredients 부수 재료.
function craftSpell(element, traj, trigger, chant, name, ingredients) {
  _spellState();
  const baseCost = 300 + (state.customSpells.length * 500);
  const ingCost = ingredientCost(ingredients);
  const totalCost = baseCost + ingCost;
  if ((state.research||0) < totalCost) { showMsg('연구가 부족합니다 (' + totalCost + ' RP)', 3); return null; }
  // 폭발 체크 - 어떤 재료가 300 이상이면
  const unstable = unstableIngredients(ingredients);
  if (unstable.length > 0) {
    state.research -= Math.floor(totalCost / 2);   // 절반은 소모
    // 폭발 처리
    if (typeof player !== 'undefined' && player) {
      const damage = Math.floor(player.maxHp * 0.5);
      player.hp = Math.max(1, player.hp - damage);
      if (typeof spawnFloat === 'function') spawnFloat(player.x, player.y - 8, '-' + damage, '#ff2d80');
    }
    if (typeof state !== 'undefined') state.shake = 30;
    if (typeof entities !== 'undefined' && entities.fx && player) {
      entities.fx.push({ type:'ring', x: player.x, y: player.y, life: 0.7, max: 0.7, r0: 4, r1: 60, col: '#ff2d80' });
    }
    if (typeof sfx === 'function') sfx('bosskill');
    const names = unstable.map(k => (INGREDIENT_BY_ID[k]||{name:k}).name).join(', ');
    showMsg('★ 물약이 폭발했다! (' + names + ' >= 300) HP -50%', 6);
    if (typeof showAchievementBanner === 'function') showAchievementBanner('불안정한 마법', names, '#ff2d80');
    if (typeof saveAccountData === 'function') saveAccountData();
    return null;
  }
  state.research -= totalCost;
  const id = 'sc_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const spell = { id, name: name || '무명 주문', element, traj, trigger, chant, ingredients: ingredients || {}, createdAt: Date.now() };
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

// slot: 'lmb'|'q'|'e'. 미지정 시 lmb 로. 같은 슬롯에 같은 스펠이 이미 있으면 해제 (토글).
function equipSpell(id, slot) {
  _spellState();
  slot = slot || 'lmb';
  if (id && !state.customSpells.find(s => s.id === id)) return;
  // 토글: 이미 이 슬롯에 이 스펠이 장착돼 있으면 해제
  if (state.equippedSpells[slot] === id) {
    state.equippedSpells[slot] = null;
    if (slot === 'lmb') state.equippedSpell = null;
  } else {
    // 이 스펠이 다른 슬롯에 있었다면 그 슬롯에서도 제거 (한 스펠은 한 슬롯만)
    for (const s of ['lmb', 'q', 'e']) {
      if (state.equippedSpells[s] === id) state.equippedSpells[s] = null;
    }
    state.equippedSpells[slot] = id;
    if (slot === 'lmb') state.equippedSpell = id;
  }
  // 즉시 반영
  if (typeof refreshPlayerStats === 'function') try { refreshPlayerStats(); } catch(_){}
  if (typeof saveAccountData === 'function') saveAccountData();
}

function getEquippedSpell(slot) {
  _spellState();
  slot = slot || 'lmb';
  const id = state.equippedSpells[slot];
  if (!id) return null;
  return state.customSpells.find(s => s.id === id) || null;
}

// 스펠 id가 어느 슬롯에 장착됐는지 (0개 이상) — UI 표시용
function equippedSlotsFor(id) {
  _spellState();
  const out = [];
  for (const s of ['lmb', 'q', 'e']) if (state.equippedSpells[s] === id) out.push(s);
  return out;
}

function unequipSlot(slot) {
  _spellState();
  state.equippedSpells[slot] = null;
  if (slot === 'lmb') state.equippedSpell = null;
  if (typeof saveAccountData === 'function') saveAccountData();
}

// castCustomSpell - 지정한 슬롯의 커스텀 주문을 시전. 실패 시 원래 슬롯 스킬로 폴백.
function castCustomSpell(p, ang, slot) {
  const spell = getEquippedSpell(slot || 'lmb');
  if (!spell) return false;   // 폴백: 원래 슬롯 스킬
  const st = computeSpellStats(spell);
  // 재료 특수 효과 적용
  _applyIngredientsToStats(st, spell.ingredients || {});
  if (p.mp < st.cost) return false;
  p.mp -= st.cost;
  // 재료: 시전 시 회복
  if (st.healPerCast > 0) {
    p.hp = Math.min(p.maxHp, p.hp + st.healPerCast);
    if (typeof spawnFloat === 'function') spawnFloat(p.x, p.y - 8, '+' + st.healPerCast, '#3ac762');
  }
  // 재료: 시전 시 무적 (수호 물약 100+ 시)
  if (st.shieldOnCast) p.invuln = Math.max(p.invuln || 0, 0.3);
  // 슬롯별 CD 저장 (충돌 방지)
  const cdKey = 'cs_' + (slot || 'lmb');
  p.cd[cdKey] = st.cd * (p.cdMult || 1);
  // 하위 호환
  p.cd.fire = st.cd * (p.cdMult || 1);

  const dmg = st.dmg * (p.baseDmg || 1);
  const traj = st.t; const trig = st.g; const el = st.e;

  let count = traj.count || 1;
  count += (st.multiAdd || 0);
  const spread = traj.spread || (count > 1 ? 0.2 : 0);

  // 융합 주문은 spell.id 별 고유 비주얼 등록 & 사용
  const visKey = (spell.fused && typeof ensureFusionVisual === 'function') ? ensureFusionVisual(spell) : null;

  for (let i = 0; i < count; i++) {
    const a = ang + (i - (count-1)/2) * spread;
    const b = {
      x: p.x + Math.cos(a) * 6, y: p.y + Math.sin(a) * 6,
      vx: Math.cos(a) * st.speed, vy: Math.sin(a) * st.speed,
      r: 4, dmg, life: 2.0, kind: el.kind || 'fire', hits: 0,
      _customSpell: true,
      _element: spell.element,
      visual: visKey || undefined,
      color: el.color,
    };
    // 궤도
    if (traj.homing) b.homing = true;
    if (traj.spin)   { b._sc_spin = traj.spin; b._sc_t = 0; }
    if (traj.arc)    { b._sc_arc = traj.arc; }
    // 재료: 관통 추가
    const totalPierce = (trig.pierceLeft || 0) + (st.pierceAdd || 0);
    if (totalPierce > 0) { b.pierce = true; b._pierceLeft = totalPierce; }
    // 재료: 반사 추가
    if (st.bounceAdd > 0) b.bounces = st.bounceAdd;
    // 재료: 크리티컬 추가 (플레이어 crit 에 임시 부스트)
    if (st.critAdd > 0) b._critBoost = st.critAdd;
    // 재료: 흡혈
    if (st.lifestealAdd > 0) b._lifesteal = (b._lifesteal || 0) + st.lifestealAdd;
    // 재료: 화상
    if (st.burnDmg > 0) { b._burn = 3; b._burnDmgRate = st.burnDmg; }
    // 재료: 냉동
    if (st.freezeAdd > 0) b.freeze = Math.max(b.freeze || 0, st.freezeAdd);
    // 재료: 감전
    if (st.stunChance > 0) b._stunChance = st.stunChance;
    // 재료: 넉백
    if (st.knockAdd > 0) b.knockback = (b.knockback || 0) + st.knockAdd;
    // 기폭
    if (trig.pierceLeft) { /* already handled above */ }
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
  // 재료: 메아리 - 확률적 즉시 재시전
  if (st.echoChance > 0 && Math.random() < st.echoChance) {
    // 무한 재귀 방지: 임시로 재료 없이 한 번만
    const echo = Object.assign({}, spell, { ingredients: {} });
    const bak = state.equippedSpells[slot || 'lmb'];
    state.customSpells.push(echo);
    state.equippedSpells[slot || 'lmb'] = echo.id;
    try { castCustomSpell(p, ang, slot); } catch(_){}
    // 정리
    state.customSpells.pop();
    state.equippedSpells[slot || 'lmb'] = bak;
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

// =====================================================================
// SKILL FUSION - 소유한 스킬 2개를 조합해 커스텀 주문 생성
// =====================================================================

// 스킬 이름/설명에서 축 값을 추론
function _skillToAxes(sk) {
  if (!sk) return { element:'fire', traj:'straight', trigger:'impact', chant:'balanced' };
  const s = ((sk.name || '') + ' ' + (sk.desc || '')).toLowerCase();
  let element = 'fire';
  if (/ice|frost|freeze|cryo|snow|cold|blizzard/.test(s))    element = 'ice';
  else if (/thunder|lightning|spark|arc|storm|electric/.test(s)) element = 'thunder';
  else if (/void|shadow|dark|null|abyss|curse/.test(s))       element = 'void';
  else if (/holy|light|divine|angel|heal|bless/.test(s))      element = 'holy';
  else if (/fire|flame|burn|inferno|ember|meteor/.test(s))    element = 'fire';

  let traj = 'straight';
  if (/homing|missile|track|seek/.test(s))                   traj = 'homing';
  else if (/spiral|nova|circle|orbit|rotate/.test(s))         traj = 'spiral';
  else if (/arc|curve|bend/.test(s))                          traj = 'arc';
  else if (/split|prism|shotgun|spread|multi|fan|starfall/.test(s)) traj = 'spread';

  let trigger = 'impact';
  if (/explod|meteor|nova|boom|blast|aoe/.test(s))            trigger = 'delay';
  else if (/pierce|lance|arrow|beam/.test(s))                 trigger = 'pierce';
  else if (/chain|jump|bounce/.test(s))                       trigger = 'chain';
  else if (/ground|field|aura|zone|puddle/.test(s))           trigger = 'ground';

  // 영창 - CD/MP 기반. cd 함수 있으면 lv=1 값 사용, 없으면 balanced.
  let chant = 'balanced';
  try {
    const cd = typeof sk.cd === 'function' ? sk.cd(1) : (sk.cd || 0.35);
    if (cd < 0.3) chant = 'quick';
    else if (cd > 1.2) chant = 'slow';
  } catch(_){}
  return { element, traj, trigger, chant };
}

// 두 스킬을 합쳐서 최종 축 계산 - 베이스가 우세 (element/traj), 모디파이어가 세부 (trigger/chant)
function fuseSkillsToAxes(baseSkill, modSkill) {
  const a = _skillToAxes(baseSkill);
  const b = _skillToAxes(modSkill);
  return {
    element: a.element,             // 베이스가 속성 결정
    traj:    b.traj !== 'straight' ? b.traj : a.traj,  // 모디파이어가 특별한 궤도면 우선
    trigger: b.trigger,             // 모디파이어가 기폭 결정
    chant:   a.chant,               // 베이스가 시전 속도 결정
  };
}

// 소유한 활성 스킬 (lmb/q/e slot) 목록
function getOwnedActiveSkills() {
  if (typeof SKILL_BY_ID === 'undefined') return [];
  const owned = state.ownedSkills || {};
  const out = [];
  for (const id of Object.keys(owned)) {
    const sk = SKILL_BY_ID[id];
    if (!sk) continue;
    if (sk.slot === 'passive') continue;
    out.push(sk);
  }
  return out;
}

// 모든 소유 스킬 (모디파이어용)
function getOwnedAllSkills() {
  if (typeof SKILL_BY_ID === 'undefined') return [];
  const owned = state.ownedSkills || {};
  const out = [];
  for (const id of Object.keys(owned)) {
    const sk = SKILL_BY_ID[id];
    if (sk) out.push(sk);
  }
  return out;
}

// 융합 크래프트 - 두 스킬 조합 → 커스텀 주문 생성. name 자동 조합.
function fuseCraftSpell(baseSkill, modSkill) {
  _spellState();
  if (!baseSkill || !modSkill) { showMsg('두 스킬을 선택해주세요.', 2); return null; }
  if (baseSkill.id === modSkill.id) { showMsg('같은 스킬끼리는 융합할 수 없습니다.', 2); return null; }
  const cost = nextFusionCost();
  if ((state.research||0) < cost) { showMsg('연구가 부족합니다 (' + cost + ' RP)', 3); return null; }
  const axes = fuseSkillsToAxes(baseSkill, modSkill);
  state.research -= cost;
  const name = _fusionName(baseSkill, modSkill);
  const id = 'scf_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const spell = {
    id, name,
    element: axes.element, traj: axes.traj, trigger: axes.trigger, chant: axes.chant,
    baseSkillId: baseSkill.id, modSkillId: modSkill.id,
    fused: true,
    createdAt: Date.now(),
  };
  state.customSpells.push(spell);
  if (state.equippedSpell === null) state.equippedSpell = id;
  if (typeof showAchievementBanner === 'function') showAchievementBanner('스킬 융합', spell.name, '#00ffcc');
  if (typeof sfx === 'function') sfx('jackpot');
  if (typeof saveAccountData === 'function') saveAccountData();
  return spell;
}

// 융합 비용 - 조금 더 저렴 (창의성 장려)
function nextFusionCost() {
  _spellState();
  return 200 + (state.customSpells.length * 300);
}

// 자동 이름 - 앞 스킬 접두어 + 뒤 스킬 접미어
function _fusionName(base, mod) {
  const bn = (base.name || '').split(/\s+/)[0];
  const mn = (mod.name || '').split(/\s+/).pop();
  return bn + '-' + mn;
}
