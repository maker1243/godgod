// =====================================================================
// Mob Affixes (몹 접두 능력) - 스폰 시 5~10% 확률로 하나 부여.
// 여러 훅에서 처리: onSpawn (apply), onHit (플레이어가 때렸을 때),
// onDeath (사망 이펙트), tick (매 프레임).
// =====================================================================

const MOB_AFFIX_DEFS = [
  { id:'af_explode', name:'폭발성', color:'#ff2d2d',
    apply:(e)=>{ e._afExplode = true; },
    onDeath:(e)=>{
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*140, vy: Math.sin(a)*140, r: 3, dmg: Math.max(8, Math.floor((e.dmg||6)*0.8)), life: 0.8, kind: 'fire' });
      }
      spawnParticle(e.x, e.y, '#ff9c3d', 0.6, 20, 90); sfx('boss');
    } },
  { id:'af_regen', name:'재생', color:'#3ac762',
    apply:(e)=>{ e._afRegen = true; },
    tick:(e, dt)=>{ if (e.hp > 0 && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.02 * dt); } },
  { id:'af_freeze', name:'얼음결계', color:'#8bd8ff',
    apply:(e)=>{ e._afFreeze = true; },
    // 히트 시 플레이어 슬로우
    onHitPlayer:(e)=>{ if (player) player._slowUntil = Math.max(player._slowUntil||0, performance.now() + 1500); } },
  { id:'af_shadow', name:'그림자 분신', color:'#7d4dbf',
    apply:(e)=>{ e._afShadow = 1; },
    onDeath:(e)=>{
      if (e._afShadow > 0) {
        // 절반 HP 로 부활 1회
        const clone = Object.assign({}, e);
        clone.hp = Math.max(1, Math.floor(e.maxHp * 0.5));
        clone.maxHp = clone.hp;
        clone.x = e.x + rand(-20, 20);
        clone.y = e.y + rand(-20, 20);
        clone._afShadow = 0;
        clone.isElite = false;
        entities.enemies.push(clone);
        spawnParticle(e.x, e.y, '#7d4dbf', 0.5, 12, 60);
      }
    } },
  { id:'af_swift', name:'질주자', color:'#c8ffc8',
    apply:(e)=>{ e.speed = Math.floor((e.speed||30) * 1.7); } },
  { id:'af_tough', name:'철갑', color:'#8a7ab5',
    apply:(e)=>{ e.hp = Math.floor(e.hp * 2.5); e.maxHp = e.hp; e._afTough = true; } },
  { id:'af_venom', name:'맹독', color:'#3ac762',
    apply:(e)=>{ e._afVenom = true; },
    onHitPlayer:(e)=>{ if (player) player._poisonUntil = Math.max(player._poisonUntil||0, performance.now() + 4000); } },
  { id:'af_bolt', name:'번개촉수', color:'#ffefa8',
    apply:(e)=>{ e._afBolt = 0; },
    tick:(e, dt)=>{
      e._afBolt = (e._afBolt||0) + dt;
      if (e._afBolt >= 2.5 && player && dist(e, player) < 80) {
        e._afBolt = 0;
        // 즉발 번개
        for (let i = 0; i < 3; i++) {
          const a = Math.atan2(player.y - e.y, player.x - e.x) + rand(-0.3, 0.3);
          entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*220, vy: Math.sin(a)*220, r: 2, dmg: Math.max(5, Math.floor((e.dmg||6)*0.6)), life: 0.9, kind: 'bolt' });
        }
      }
    } },
];

const MOB_AFFIX_BY_ID = {};
for (const a of MOB_AFFIX_DEFS) MOB_AFFIX_BY_ID[a.id] = a;

// 스폰 훅 - 5% 기본, INFERNO/EXTREME 은 12%.
function maybeApplyMobAffix(e) {
  const mode = state.dungeonMode || 'normal';
  const p = (mode === 'inferno' || mode === 'extreme') ? 0.12 : 0.05;
  if (e.isBoss || e.isProfessor) return;   // 보스는 제외
  if (Math.random() > p) return;
  const def = MOB_AFFIX_DEFS[Math.floor(Math.random() * MOB_AFFIX_DEFS.length)];
  e.affix = def.id;
  e.affixColor = def.color;
  e.affixName = def.name;
  // 스탯 살짝 강화 + 보상 살짝 증가
  e.hp = Math.floor(e.hp * 1.4); e.maxHp = e.hp;
  e.xp = Math.floor((e.xp||1) * 1.5);
  e.gold = Math.floor((e.gold||0) * 1.5);
  if (typeof def.apply === 'function') { try { def.apply(e); } catch(_){} }
}

// 매 프레임 - 접두 tick 실행
function tickMobAffixes(dt) {
  for (const e of entities.enemies) {
    if (e.affix) {
      const def = MOB_AFFIX_BY_ID[e.affix];
      if (def && typeof def.tick === 'function') { try { def.tick(e, dt); } catch(_){} }
    }
    // 축복 화상 (몹 공통)
    if (e._burn && e._burn > 0) {
      e._burn -= dt;
      e.hp -= (e._burnDmg || 1) * dt * 2;
    }
  }
  // 플레이어 독 (매 초 HP -1% max)
  const now = performance.now();
  if (player && player._poisonUntil && now < player._poisonUntil) {
    player._poisonAccum = (player._poisonAccum || 0) + dt;
    if (player._poisonAccum >= 0.5) {
      player._poisonAccum = 0;
      const d = Math.max(1, Math.floor(player.maxHp * 0.005));
      if (typeof damagePlayer === 'function') damagePlayer(d, null);
      if (typeof spawnFloat === 'function') spawnFloat(player.x, player.y - 8, '독 -' + d, '#3ac762');
    }
  }
  // 슬로우 (일시적)
  if (player && player._slowUntil && now < player._slowUntil) {
    player._slowMult = 0.6;
  } else if (player) {
    player._slowMult = 1;
  }
}

// 사망 훅
function onMobAffixDeath(e) {
  if (!e.affix) return;
  const def = MOB_AFFIX_BY_ID[e.affix];
  if (def && typeof def.onDeath === 'function') { try { def.onDeath(e); } catch(_){} }
}

// 플레이어 피격 훅 (damagePlayer 에서 호출)
function onMobAffixHitPlayer(e) {
  if (!e || !e.affix) return;
  const def = MOB_AFFIX_BY_ID[e.affix];
  if (def && typeof def.onHitPlayer === 'function') { try { def.onHitPlayer(e); } catch(_){} }
}
