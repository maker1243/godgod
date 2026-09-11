// =====================================================================
// TRANSCEND Skills - ULTRA 위, 10종. 각각 지금까지 어떤 스킬도 안 쓰던
// 특수 이펙트를 전용으로 사용. state.transcendCleared[cat] 시 구매 가능.
// 데미지는 ULTRA 대비 10^15 배 스케일 (초월 시련 = ULTRA HP × 1e30).
// =====================================================================

// 각 스킬: category, id, name, slot, visual (unused 계열), cast, cost.
const TRANSCEND_SKILL_DEFS = [
  // === magic 계열 ===
  { cat:'magic', id:'tr_polarwind', name:'극지의 바람', slot:'lmb', visual:'polarwind',
    dmg: 1e18, speed: 260, r: 4, life: 2.0, count: 5, spread: 0.35, mp: 40, cd: 0.4, kind: 'ice',
    desc:'북극의 바람 5발이 냉기 파도로 흐른다. DMG 1e18, 5발 산탄.',
    extra: { freeze: 3 } },
  { cat:'magic', id:'tr_iceray', name:'절대영도 광선', slot:'q', visual:'iceray',
    dmg: 5e18, speed: 500, r: 3, life: 1.2, pierce: true, count: 3, spread: 0.06, mp: 80, cd: 1.4, kind: 'ice',
    desc:'절대영도 관통 광선 3연발. DMG 5e18.',
    extra: { freeze: 5 } },
  { cat:'magic', id:'tr_freezing', name:'시간 정지 오브', slot:'e', visual:'freezing',
    dmg: 5e19, speed: 120, r: 8, life: 3, count: 8, spread: 6.28, homing: true, mp: 200, cd: 12, kind: 'ice',
    desc:'8방향 시간 정지 오브. 유도. DMG 5e19.',
    extra: { freeze: 10 } },

  // === chaos / void 계열 ===
  { cat:'chaos', id:'tr_eyeofchaos', name:'혼돈의 눈', slot:'lmb', visual:'eyeofchaos',
    dmg: 1.5e18, speed: 200, r: 4, life: 3, count: 4, spread: 0.5, mp: 45, cd: 0.5, kind: 'shadow',
    desc:'혼돈의 눈 4개가 나선을 그리며 회전. DMG 1.5e18.',
    extra: { _curse: 3 } },
  { cat:'chaos', id:'tr_chaoslance', name:'혼돈의 창', slot:'q', visual:'chaoslance',
    dmg: 8e18, speed: 550, r: 3, life: 1.8, pierce: true, instant: true, count: 5, spread: 0.15, mp: 90, cd: 1.6, kind: 'shadow',
    desc:'즉시 관통 5개. 대혼돈의 창. DMG 8e18.',
    extra: {} },

  // === order / holy 계열 ===
  { cat:'order', id:'tr_benediction', name:'천상의 축복', slot:'lmb', visual:'benediction',
    dmg: 1.2e18, speed: 240, r: 4, life: 2.0, count: 6, spread: 0.28, mp: 45, cd: 0.35, kind: 'holy',
    desc:'축복의 오브 6발. 시전 시 15 HP 회복. DMG 1.2e18.',
    extra: { _lifesteal: 0.15 }, healOnCast: 15 },
  { cat:'order', id:'tr_psalm', name:'신성 시편', slot:'q', visual:'psalm',
    dmg: 6e18, speed: 320, r: 4, life: 2.4, count: 4, spread: 0.3, homing: true, mp: 80, cd: 1.5, kind: 'holy',
    desc:'룬으로 새긴 시편 4발이 적을 추적. DMG 6e18.',
    extra: { _lifesteal: 0.1 } },
  { cat:'order', id:'tr_amen', name:'세계 종결의 아멘', slot:'e', visual:'amen',
    dmg: 8e19, speed: 180, r: 10, life: 3.5, count: 16, spread: 6.28, explosive: true, explodeR: 100, mp: 250, cd: 14, kind: 'holy',
    desc:'세계를 봉인하는 16방향 아멘. 광역 폭발. DMG 8e19.',
    extra: {} },

  // === nature 계열 ===
  { cat:'nature', id:'tr_woodshard', name:'천년목의 파편', slot:'lmb', visual:'woodshard',
    dmg: 1.4e18, speed: 300, r: 3, life: 1.6, count: 8, spread: 0.4, pierce: true, mp: 40, cd: 0.35, kind: 'fire',
    desc:'천년목의 파편 8발 관통. DMG 1.4e18.',
    extra: { _burn: 4, _burnDmgRate: 0.02 } },

  // === engineering 계열 ===
  { cat:'engineering', id:'tr_thunderhead', name:'뇌우의 심장', slot:'e', visual:'thunderhead',
    dmg: 7e19, speed: 200, r: 12, life: 3, count: 24, spread: 6.28, homing: true, explosive: true, explodeR: 90, mp: 220, cd: 13, kind: 'thunder',
    desc:'뇌우의 심장 24방향 · 유도 · 광역. DMG 7e19.',
    extra: { stun: 1.5 } },

  // === arcane 확장 ===
  { cat:'magic', id:'tr_arcanepulse', name:'맥동하는 아르카나', slot:'q', visual:'arcanepulse',
    dmg: 6e18, speed: 260, r: 5, life: 2.5, count: 3, spread: 0.25, homing: true, mp: 75, cd: 1.3, kind: 'fire',
    desc:'맥동하는 아르카나 3발. 강력한 유도. DMG 6e18.',
    extra: {} },
];

// SKILL_TREE 에 등록. category 는 TRIAL 카테고리 (magic/chaos/order/nature/engineering)
// 각각 pos 는 tier 12 로 별도 열에 배치.
(function registerTranscendSkills() {
  if (typeof SKILL_TREE === 'undefined' || typeof SKILL_BY_ID === 'undefined') return;
  let idx = 0;
  for (const def of TRANSCEND_SKILL_DEFS) {
    const catKey = def.cat;
    if (!SKILL_TREE[catKey]) continue;
    const skill = {
      id: def.id,
      name: '★' + def.name,
      slot: def.slot,
      tier: 12,
      pos: [idx % 4, 10 + Math.floor(idx / 4)],
      cost: 100000,
      req: [],
      maxLv: 1,
      cd: () => def.cd,
      mp: () => def.mp,
      desc: def.desc,
      visual: def.visual,
      isMax: true,
      isTranscend: true,
      transcendCat: catKey,
      cast: (function(d){
        return function(p, ang, lv) {
          const c = d.count || 1;
          const sp = d.spread || 0;
          if (d.healOnCast) p.hp = Math.min(p.maxHp, p.hp + d.healOnCast);
          for (let i = 0; i < c; i++) {
            const a = ang + (i - (c-1)/2) * sp;
            const b = {
              x: p.x + Math.cos(a) * 6, y: p.y + Math.sin(a) * 6,
              vx: Math.cos(a) * d.speed, vy: Math.sin(a) * d.speed,
              r: d.r || 3, dmg: d.dmg * (p.baseDmg || 1),
              life: d.life || 1.8, kind: d.kind || 'fire', hits: 0,
              visual: d.visual,
              pierce: !!d.pierce, homing: !!d.homing, instant: !!d.instant,
              explosive: !!d.explosive, explodeR: d.explodeR || 0,
            };
            if (d.extra) Object.assign(b, d.extra);
            entities.bullets.push(b);
          }
          if (typeof sfx === 'function') sfx(d.kind === 'ice' ? 'ice' : (d.kind === 'holy' ? 'level' : 'fire'));
        };
      })(def),
    };
    SKILL_TREE[catKey].skills.push(skill);
    SKILL_BY_ID[skill.id] = skill;
    if (typeof SKILL_VISUAL !== 'undefined') SKILL_VISUAL[skill.id] = def.visual;
    idx++;
  }
})();

// canBuySkill 게이트 - 초월 시련 통과했으면 구매 가능
if (typeof canBuySkill === 'function') {
  const _origCanBuyT = canBuySkill;
  canBuySkill = function(s) {
    if (s.isTranscend && s.transcendCat) {
      if (!(state.transcendCleared && state.transcendCleared[s.transcendCat])) return false;
    }
    return _origCanBuyT(s);
  };
}

// 초월 스킬 판별
function isTranscendSkill(s) { return !!(s && s.isTranscend); }
