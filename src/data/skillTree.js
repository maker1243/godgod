// =====================================================================
// Skill tree (5x20 = 100)
// =====================================================================

// =====================================================================
// 스킬 트리 시스템 (5계열 × 20 = 100개)
// =====================================================================
// slot: 'lmb' | 'q' | 'e' | 'passive'
// tier: 0~4 (선행 조건 층)
// pos: [col, row]  도서관 격자 좌표
// effect: 스킬 적용 시 호출 (레벨업 시마다)
// cast: 액티브 스킬만 - (player, angle, level) => void

// 현재 시전 중인 슬롯 (castSlot에서 세팅, shot/nova에서 참조)
let _currentCastSlot = null;
let _currentCastVisual = null;

// 스킬 id별 시각 타입 매핑 (렌더러가 이걸 보고 다른 그림/궤적 그림)
const SKILL_VISUAL = {
  // Magic
  m01: 'fireball', m05: 'icebolt', m06: 'spark', m07: 'arcane',
  m09: 'meteor',   m10: 'blizzard', m11: 'lightning', m13: 'prism',
  // Engineering
  e01: 'bolt',     e05: 'bolt',     e09: 'laser',    e10: 'rocket',
  e15: 'bolt',     e16: 'railgun',  e17: 'rocket',
  // Nature
  n01: 'seed',     n06: 'thorn',    n13: 'thorn',    n07: 'bee',
  // Chaos
  c01: 'chaos',    c05: 'chaos',    c06: 'chaos',    c09: 'chaos',
  // Order
  o01: 'holy',     o05: 'holy',     o06: 'spear',    o11: 'holy',
  o13: 'sunray',   o14: 'holy',
};

// 헬퍼: 시전 함수 생성기
// 숫자 또는 함수(lv) 형태를 모두 받아 값을 뽑는다. undefined/null 이면 def 반환.
// 상당수 스킬이 count/dmg 등을 숫자 리터럴로 선언해서 opts.count(lv) 호출이 예외를 던지던 문제 방어.
function _resolve(v, lv, def) {
  if (typeof v === 'function') return v(lv);
  if (v === undefined || v === null) return def;
  return v;
}

function shot(kind, opts) {
  return (p, ang, lv) => {
    const dmg = _resolve(opts.dmg, lv, 0) * p.baseDmg;
    let count = _resolve(opts.count, lv, 1);
    // Perks: firemult(스택마다 +2발), splitshot(스택마다 +2발) - 단발 스킬만
    if (count === 1 && kind === 'fire') {
      const fm = countPerk('firemult');
      if (fm > 0) count = 1 + fm * 2;   // 1→3→5→7→9...
    }
    if (_currentCastSlot === 'lmb') {
      const ss = countPerk('splitshot');
      if (ss > 0 && count === 1) count = 1 + ss * 2;
    }
    const spread = opts.spread || (count > 1 ? 0.22 : 0);
    // Ice perk overrides (스택마다 지속 시간 증가)
    let pierce = opts.pierce || false;
    let freeze = opts.freeze || 0;
    if (kind === 'ice') {
      if (hasPerk('icepierce')) pierce = true;
      const fz = countPerk('icefreeze');
      if (fz > 0) freeze = Math.max(freeze, 1.2 * fz);   // 1스택 1.2s, 2스택 2.4s...
    }
    // Perk: bouncy (스택마다 반사 +2)
    let bounces = opts.bounces || 0;
    const bc = countPerk('bouncy');
    if (bc > 0) bounces = Math.max(bounces, 1 + bc * 2);   // 1→3→5→7
    // Perk: seeker (있으면 유도, 스택마다 강화되진 않음 - 1회로 충분)
    let homing = opts.homing || false;
    if (hasPerk('seeker')) homing = true;
    // Visual tag
    const visual = opts.visual || _currentCastVisual || (kind === 'ice' ? 'icebolt' : 'fireball');
    for (let i = 0; i < count; i++) {
      const a = ang + (i - (count-1)/2) * spread;
      entities.bullets.push({
        x: p.x + Math.cos(a) * 6, y: p.y + Math.sin(a) * 6,
        vx: Math.cos(a) * opts.speed, vy: Math.sin(a) * opts.speed,
        r: opts.r || 3, dmg, life: opts.life || 1.4,
        kind, visual, hits: 0,
        pierce, freeze,
        knockback: opts.knockback || 0,
        explosive: opts.explosive || false,
        explodeR: opts.explodeR || 0,
        homing,
        bounces,
        color: opts.color || null,
        trail: opts.trail || null,
        trailChance: opts.trailChance || 0,
        size: opts.size || 'md',
        instant: opts.instant || false,
      });
    }
    if (opts.sfx) sfx(opts.sfx);
  };
}

// 헬퍼: 즉시 광역 스킬
function nova(opts) {
  return (p, ang, lv) => {
    const n = _resolve(opts.count, lv, 1);
    const dmg = _resolve(opts.dmg, lv, 0) * p.baseDmg;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      entities.bullets.push({
        x: p.x + Math.cos(a) * 4, y: p.y + Math.sin(a) * 4,
        vx: Math.cos(a) * (opts.speed || 100), vy: Math.sin(a) * (opts.speed || 100),
        r: opts.r || 3, dmg, life: opts.life || 0.8, kind: opts.kind || 'fire', hits: 0,
      });
    }
    spawnParticle(p.x, p.y, opts.color || '#ff9c3d', 0.5, 20, 80);
    state.shake = 4;
    if (opts.sfx) sfx(opts.sfx);
  };
}

// 스킬 데이터 (계열별)
const SKILL_TREE = {
  magic: {
    name: 'MAGIC', color: '#8bd8ff', desc: 'ELEMENTAL POWER',
    skills: [
      // Tier 0 - 기본 (무료, 게임 시작 시 소유)
      { id:'m01', name:'FIREBALL', slot:'lmb', tier:0, pos:[2,0], cost:0, req:[],
        cd:lv=>0.35, mp:lv=>4, desc:'BASIC LMB. FAST FLAMING SHOT.',
        cast: shot('fire', { dmg:lv=>10+lv*3, speed:140, r:3, life:1.4, sfx:'fire' }) },
      // Tier 1 (req: m01)
      { id:'m02', name:'MANA WELL', slot:'passive', tier:1, pos:[0,1], cost:3, req:['m01'],
        desc:'MAX MP +25 PER LEVEL. UP TO LV 3.', maxLv:3, effect:(p,lv)=>{ p.maxMp+=25; p.mp+=25; } },
      { id:'m03', name:'FOCUS', slot:'passive', tier:1, pos:[1,1], cost:3, req:['m01'],
        desc:'MP REGEN +2/S PER LV. UP TO 3.', maxLv:3, effect:(p,lv)=>{ p.mpRegenBonus=(p.mpRegenBonus||0)+2; } },
      { id:'m04', name:'FIRE POWER', slot:'passive', tier:1, pos:[3,1], cost:3, req:['m01'],
        desc:'FIRE DMG +20% PER LV.', maxLv:3, effect:(p,lv)=>{ p.mods.fire=(p.mods.fire||1)*1.20; } },
      // Tier 2 (req any tier 1)
      { id:'m05', name:'ICE BOLT', slot:'q', tier:2, pos:[0,2], cost:5, req:['m03'],
        cd:lv=>0.9, mp:lv=>12, desc:'Q SKILL. FROSTBOLT SLOWS + FREEZES.',
        cast: shot('ice', { dmg:lv=>22+lv*5, speed:180, r:2, life:1.8, freeze:0.4, sfx:'ice' }) },
      { id:'m06', name:'SPARK', slot:'lmb', tier:2, pos:[2,2], cost:5, req:['m02','m04'],
        cd:lv=>0.28, mp:lv=>5, desc:'REPLACE LMB. FAST SPARK 2X SPEED.',
        cast: shot('fire', { dmg:lv=>8+lv*2, speed:220, r:2, life:0.8, sfx:'fire' }) },
      { id:'m07', name:'ARCANE MISSILE', slot:'q', tier:2, pos:[3,2], cost:5, req:['m04'],
        cd:lv=>1.1, mp:lv=>15, desc:'Q SKILL. THREE HOMING MISSILES.',
        cast: (p,ang,lv)=>{
          for (let i=-1;i<=1;i++) entities.bullets.push({
            x:p.x, y:p.y, vx:Math.cos(ang+i*0.6)*100, vy:Math.sin(ang+i*0.6)*100,
            r:2, dmg:(14+lv*4)*p.baseDmg, life:1.5, kind:'fire', hits:0, homing:true
          });
          sfx('fire');
        } },
      { id:'m08', name:'MANA BURN', slot:'passive', tier:2, pos:[1,2], cost:5, req:['m02','m03'],
        desc:'HITS ADD +1 DMG PER 10 MP.', maxLv:1, effect:(p,lv)=>{ p.perks.push('manaburn'); } },
      // Tier 3
      { id:'m09', name:'METEOR', slot:'e', tier:3, pos:[0,3], cost:8, req:['m05'],
        cd:lv=>4, mp:lv=>25, desc:'E SKILL. NOVA FROM CASTER.',
        cast: nova({ count:lv=>10+lv*2, dmg:lv=>18+lv*4, speed:120, r:3, life:0.9, kind:'fire', color:'#ff9c3d', sfx:'boss' }) },
      { id:'m10', name:'BLIZZARD', slot:'e', tier:3, pos:[1,3], cost:8, req:['m05','m08'],
        cd:lv=>5, mp:lv=>28, desc:'E SKILL. FREEZING NOVA.',
        cast: nova({ count:lv=>14, dmg:lv=>14+lv*3, speed:110, r:2, life:1.0, kind:'ice', color:'#8bd8ff', sfx:'ice' }) },
      { id:'m11', name:'LIGHTNING', slot:'lmb', tier:3, pos:[3,3], cost:8, req:['m06','m07'],
        cd:lv=>0.4, mp:lv=>8, desc:'REPLACE LMB. INSTANT LIGHTNING.',
        cast: shot('fire', { dmg:lv=>18+lv*4, speed:400, r:2, life:0.4, sfx:'ice' }) },
      { id:'m12', name:'SPLIT', slot:'passive', tier:3, pos:[2,3], cost:7, req:['m04','m06'],
        desc:'LMB SPLITS INTO 3 SHOTS.', maxLv:1, effect:(p,lv)=>{ p.perks.push('splitshot'); } },
      // Tier 4
      { id:'m13', name:'PRISM', slot:'lmb', tier:4, pos:[0,4], cost:12, req:['m11','m12'],
        cd:lv=>0.5, mp:lv=>10, desc:'REPLACE LMB. 5 ELEMENTAL SHOTS.',
        cast: shot('fire', { dmg:lv=>10+lv*3, speed:180, count:lv=>5, spread:0.25, life:1.2, sfx:'fire' }) },
      { id:'m14', name:'TIMESTOP', slot:'e', tier:4, pos:[1,4], cost:12, req:['m09','m10'],
        cd:lv=>12, mp:lv=>30, desc:'E SKILL. FREEZE TIME 2.5S.',
        cast: (p,ang,lv)=>{ timeStopT = 2.5 + lv*0.3; state.shake=8; showMsg('TIME STOP'); sfx('parry'); } },
      { id:'m15', name:'ARCHMAGE', slot:'passive', tier:4, pos:[2,4], cost:12, req:['m12'],
        desc:'ALL MAGIC DMG +40%.', maxLv:1, effect:(p,lv)=>{ p.mods.fire=(p.mods.fire||1)*1.4; p.mods.ice=(p.mods.ice||1)*1.4; } },
      { id:'m16', name:'MANA SHIELD', slot:'passive', tier:4, pos:[3,4], cost:12, req:['m02','m08'],
        desc:'50% DMG TAKEN FROM MP INSTEAD.', maxLv:1, effect:(p,lv)=>{ p.perks.push('manashield'); } },
      { id:'m17', name:'OVERFLOW', slot:'passive', tier:4, pos:[0,5], cost:10, req:['m02'],
        desc:'FULL MP: +30% ALL DMG.', maxLv:1, effect:(p,lv)=>{ p.perks.push('overflow'); } },
      { id:'m18', name:'PORTAL', slot:'e', tier:4, pos:[3,5], cost:10, req:['m11'],
        cd:lv=>3, mp:lv=>15, desc:'E SKILL. TELEPORT TO CURSOR.',
        cast: (p,ang,lv)=>{
          const tx=mouse.x+state.cam.x, ty=mouse.y+state.cam.y;
          spawnParticle(p.x,p.y,'#8bd8ff',0.5,10,50);
          const rm=rooms[currentRoom]; if(rm){ p.x=clamp(tx,rm.x+8,rm.x+rm.w-8); p.y=clamp(ty,rm.y+8,rm.y+rm.h-8); }
          spawnParticle(p.x,p.y,'#8bd8ff',0.5,10,50); p.invuln=0.5; sfx('ice');
        } },
      { id:'m19', name:'ARCANE SIPHON', slot:'passive', tier:4, pos:[1,5], cost:10, req:['m03'],
        desc:'KILLS RESTORE 4 MP.', maxLv:1, effect:(p,lv)=>{ p.perks.push('mpsiphon'); } },
      { id:'m20', name:'ETERNAL', slot:'passive', tier:4, pos:[2,5], cost:15, req:['m15','m17'],
        desc:'ULTIMATE. NEVER LOSE MP UNDER 20.', maxLv:1, effect:(p,lv)=>{ p.perks.push('eternal'); } },
      { id:'m21', name:'INFERNO', slot:'lmb', tier:1, pos:[0,6], cost:6, req:['m20'],
        cd:lv=>0.3, mp:lv=>5, desc:'ROLLING FIRE.', maxLv:3,
        cast: shot('fire', {dmg:l=>12+l*4,speed:150,r:4,life:1.6}) },
      { id:'m22', name:'FROSTLANCE', slot:'q', tier:1, pos:[1,6], cost:8, req:['m21'],
        cd:lv=>1.2, mp:lv=>18, desc:'PIERCING ICE LANCE.', maxLv:3,
        cast: shot('ice', {dmg:l=>28+l*7,speed:210,r:3,life:1.8,pierce:true}) },
      { id:'m23', name:'MANA SHIELD', slot:'passive', tier:1, pos:[2,6], cost:10, req:['m22'],
        desc:'ABSORB SOME DMG AS MP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.perks.push("manashield");})(p); } },
      { id:'m24', name:'EMBER', slot:'lmb', tier:1, pos:[3,6], cost:12, req:['m23'],
        cd:lv=>0.3, mp:lv=>5, desc:'FIRE SPARK BOUNCES 3X.', maxLv:3,
        cast: shot('fire', {dmg:l=>9+l*3,speed:180,r:2,life:1.2,bounces:3}) },
      { id:'m25', name:'THUNDER', slot:'q', tier:1, pos:[4,6], cost:14, req:['m24'],
        cd:lv=>1.2, mp:lv=>18, desc:'INSTANT LIGHTNING.', maxLv:3,
        cast: shot('fire', {dmg:l=>35+l*8,speed:400,r:3,life:0.4,instant:true,pierce:true}) },
      { id:'m26', name:'CRYOBLAST', slot:'e', tier:1, pos:[0,7], cost:16, req:['m25'],
        cd:lv=>4.0, mp:lv=>35, desc:'FREEZE NOVA.', maxLv:3,
        cast: shot('ice', {count:12,dmg:l=>18+l*4,speed:100,r:3,life:1.2,spread:6.28,freeze:2}) },
      { id:'m27', name:'STARFALL', slot:'e', tier:1, pos:[1,7], cost:18, req:['m26'],
        cd:lv=>4.0, mp:lv=>35, desc:'HOMING METEORS.', maxLv:3,
        cast: shot('fire', {count:5,dmg:l=>20+l*5,speed:120,r:4,life:2,spread:0.5,homing:true}) },
      { id:'m28', name:'ARC LORE', slot:'passive', tier:2, pos:[2,7], cost:20, req:['m27'],
        desc:'MAX MP +40.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxMp+=40;p.mp+=40;})(p); } },
      { id:'m29', name:'FLAME AURA', slot:'passive', tier:2, pos:[3,7], cost:22, req:['m28'],
        desc:'FIRE DMG +30%.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.mods.fire=(p.mods.fire||1)*1.3;})(p); } },
      { id:'m30', name:'PYROMANCY', slot:'passive', tier:2, pos:[4,7], cost:24, req:['m29'],
        desc:'FIRE DMG +40%.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.mods.fire=(p.mods.fire||1)*1.4;})(p); } },
      { id:'m31', name:'CRYOMANCY', slot:'passive', tier:2, pos:[0,8], cost:26, req:['m30'],
        desc:'ICE FREEZE +50%.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.perks.push("cryomancy");})(p); } },
      { id:'m32', name:'SPELLWEAVE', slot:'passive', tier:2, pos:[1,8], cost:28, req:['m31'],
        desc:'ALL CD -20%.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.cdMult=(p.cdMult||1)*0.8;})(p); } },
      { id:'m33', name:'SUPERNOVA', slot:'e', tier:2, pos:[2,8], cost:30, req:['m32'],
        cd:lv=>4.0, mp:lv=>35, desc:'HUGE EXPLOSION.', maxLv:3,
        cast: shot('fire', {dmg:l=>50+l*10,speed:100,r:6,life:1.5,explosive:true,explodeR:40}) },
      { id:'m34', name:'SHARDS', slot:'lmb', tier:2, pos:[3,8], cost:32, req:['m33'],
        cd:lv=>0.3, mp:lv=>5, desc:'ICE FRAGMENTS 5.', maxLv:3,
        cast: shot('ice', {count:5,dmg:l=>8+l*2,speed:180,r:2,life:0.8,spread:0.5}) },
      { id:'m35', name:'MISSILE', slot:'q', tier:3, pos:[4,8], cost:34, req:['m34'],
        cd:lv=>1.2, mp:lv=>18, desc:'HOMING ARCANE.', maxLv:3,
        cast: shot('fire', {dmg:l=>32+l*7,speed:150,r:3,life:2.5,homing:true}) },
      { id:'m36', name:'GLACIER', slot:'e', tier:3, pos:[0,9], cost:36, req:['m35'],
        cd:lv=>4.0, mp:lv=>35, desc:'ICE WALL.', maxLv:3,
        cast: shot('ice', {count:8,dmg:l=>15+l*3,speed:80,r:4,life:2,spread:0.6,freeze:1}) },
      { id:'m37', name:'CINDER', slot:'passive', tier:3, pos:[1,9], cost:38, req:['m36'],
        desc:'+15 THORNS.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.thorns=(p.thorns||0)+15;})(p); } },
      { id:'m38', name:'CHILL', slot:'passive', tier:3, pos:[2,9], cost:40, req:['m37'],
        desc:'+2 REGEN.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.hpRegen=(p.hpRegen||0)+2;})(p); } },
      { id:'m39', name:'ETHER', slot:'passive', tier:3, pos:[3,9], cost:42, req:['m38'],
        desc:'MP REGEN +6/S.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.mpRegenBonus=(p.mpRegenBonus||0)+6;})(p); } },
      { id:'m40', name:'CATACLYSM', slot:'e', tier:3, pos:[4,9], cost:44, req:['m39'],
        cd:lv=>4.0, mp:lv=>35, desc:'FIRE + ICE COMBO.', maxLv:3,
        cast: shot('fire', {count:12,dmg:l=>40+l*8,speed:140,r:4,life:2,spread:0.6,explosive:true,explodeR:30}) },
      { id:'m41', name:'MANA BOND', slot:'passive', tier:3, pos:[5,0], cost:46, req:['m40'],
        desc:'+50 MAX MP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxMp+=50;p.mp+=50;})(p); } },
      { id:'m42', name:'SCORCH', slot:'lmb', tier:4, pos:[5,1], cost:48, req:['m41'],
        cd:lv=>0.3, mp:lv=>5, desc:'BURNING SHOT.', maxLv:3,
        cast: shot('fire', {dmg:l=>10+l*3,speed:160,r:3,life:1.4}) },
      { id:'m43', name:'SLEET', slot:'q', tier:4, pos:[5,2], cost:50, req:['m42'],
        cd:lv=>1.2, mp:lv=>18, desc:'ICE VOLLEY.', maxLv:3,
        cast: shot('ice', {count:3,dmg:l=>14+l*3,speed:200,r:2,life:1.4,spread:0.2,freeze:0.6}) },
      { id:'m44', name:'MAELSTROM', slot:'e', tier:4, pos:[5,3], cost:52, req:['m43'],
        cd:lv=>4.0, mp:lv=>35, desc:'SPINNING BLADES.', maxLv:3,
        cast: shot('fire', {count:8,dmg:l=>18+l*4,speed:120,r:3,life:1.6,spread:1,bounces:2}) },
      { id:'m45', name:'ELDRITCH', slot:'passive', tier:4, pos:[5,4], cost:54, req:['m44'],
        desc:'ALL DMG +15%.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.baseDmg*=1.15;})(p); } },
      { id:'m46', name:'NEBULA', slot:'e', tier:4, pos:[5,5], cost:56, req:['m45'],
        cd:lv=>4.0, mp:lv=>35, desc:'ARCANE FIELD.', maxLv:3,
        cast: shot('fire', {count:6,dmg:l=>25+l*5,speed:90,r:5,life:2.5,homing:true,spread:1}) },
      { id:'m47', name:'REKINDLE', slot:'passive', tier:4, pos:[5,6], cost:58, req:['m46'],
        desc:'LMB CD -30%.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.mods.lmbCd=(p.mods.lmbCd||1)*0.7;})(p); } },
      { id:'m48', name:'HAILSTORM', slot:'e', tier:4, pos:[5,7], cost:60, req:['m47'],
        cd:lv=>4.0, mp:lv=>35, desc:'ICICLE RAIN.', maxLv:3,
        cast: shot('ice', {count:15,dmg:l=>12+l*3,speed:100,r:2,life:1.8,spread:6.28,freeze:0.4}) },
      { id:'m49', name:'PROMINENCE', slot:'q', tier:4, pos:[5,8], cost:62, req:['m48'],
        cd:lv=>1.2, mp:lv=>18, desc:'SOLAR FLARE.', maxLv:3,
        cast: shot('fire', {dmg:l=>40+l*9,speed:250,r:4,life:1.5,pierce:true}) },
      { id:'m50', name:'ASCENSION', slot:'passive', tier:4, pos:[5,9], cost:64, req:['m49'],
        desc:'ULT. +25% ALL.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxHp*=1.25;p.hp=p.maxHp;p.maxMp*=1.25;p.mp=p.maxMp;p.baseDmg*=1.25;p.speed*=1.15;})(p); } },

    ]
  },

  engineering: {
    name: 'ENGINEERING', color: '#e8c547', desc: 'PRECISION MACHINERY',
    skills: [
      { id:'e01', name:'BOLT', slot:'lmb', tier:0, pos:[2,0], cost:2, req:['m01'],
        cd:lv=>0.30, mp:lv=>3, desc:'REPLACE LMB. RAPID METAL BOLT.',
        cast: shot('fire', { dmg:lv=>7+lv*2, speed:200, r:2, life:1.0, sfx:'fire' }) },
      { id:'e02', name:'RAPID FIRE', slot:'passive', tier:1, pos:[0,1], cost:4, req:['e01'],
        desc:'LMB CD -20% PER LV.', maxLv:2, effect:(p,lv)=>{ p.mods.lmbCd=(p.mods.lmbCd||1)*0.80; } },
      { id:'e03', name:'PIERCING', slot:'passive', tier:1, pos:[1,1], cost:4, req:['e01'],
        desc:'LMB PIERCES 1 ENEMY.', maxLv:1, effect:(p,lv)=>{ p.perks.push('lmbpierce'); } },
      { id:'e04', name:'HEAT SHOT', slot:'passive', tier:1, pos:[3,1], cost:4, req:['e01'],
        desc:'LMB DMG +18% PER LV.', maxLv:3, effect:(p,lv)=>{ p.mods.lmbDmg=(p.mods.lmbDmg||1)*1.18; } },
      { id:'e05', name:'AUTO GUN', slot:'q', tier:2, pos:[0,2], cost:6, req:['e02'],
        cd:lv=>0.6, mp:lv=>10, desc:'Q SKILL. AUTOFIRE BURST (5).',
        cast: (p,ang,lv)=>{
          for (let i=0;i<5;i++) setTimeout(()=>entities.bullets.push({
            x:p.x, y:p.y, vx:Math.cos(ang+rand(-0.1,0.1))*220, vy:Math.sin(ang+rand(-0.1,0.1))*220,
            r:2, dmg:(6+lv*2)*p.baseDmg, life:0.8, kind:'fire', hits:0
          }), i*50);
          sfx('fire');
        } },
      { id:'e06', name:'EMP GRENADE', slot:'q', tier:2, pos:[2,2], cost:6, req:['e04'],
        cd:lv=>2.5, mp:lv=>15, desc:'Q SKILL. STUN NOVA.',
        cast: (p,ang,lv)=>{
          for (const e of entities.enemies) if (dist(e,p)<60) { e.stun=1.5+lv*0.3; e.hp-=(15+lv*3)*p.baseDmg; }
          spawnParticle(p.x,p.y,'#8bd8ff',0.6,20,80); state.shake=6; sfx('parry');
        } },
      { id:'e07', name:'MAGNET FIELD', slot:'passive', tier:2, pos:[3,2], cost:5, req:['e03','e04'],
        desc:'PICKUPS PULL FROM 40 UNITS.', maxLv:1, effect:(p,lv)=>{ p.perks.push('magnet'); } },
      { id:'e08', name:'RECOIL', slot:'passive', tier:2, pos:[1,2], cost:5, req:['e02'],
        desc:'LMB KNOCKS BACK ENEMIES.', maxLv:1, effect:(p,lv)=>{ p.perks.push('recoil'); } },
      { id:'e09', name:'LASER BEAM', slot:'lmb', tier:3, pos:[0,3], cost:9, req:['e05'],
        cd:lv=>0.5, mp:lv=>8, desc:'REPLACE LMB. PIERCING LASER.',
        cast: shot('fire', { dmg:lv=>14+lv*3, speed:360, r:2, life:0.7, pierce:true, sfx:'ice' }) },
      { id:'e10', name:'ROCKET', slot:'lmb', tier:3, pos:[2,3], cost:9, req:['e06'],
        cd:lv=>0.6, mp:lv=>10, desc:'REPLACE LMB. SLOW EXPLOSIVE.',
        cast: (p,ang,lv)=>{
          entities.bullets.push({
            x:p.x, y:p.y, vx:Math.cos(ang)*120, vy:Math.sin(ang)*120,
            r:3, dmg:(20+lv*5)*p.baseDmg, life:1.5, kind:'fire', hits:0, explosive:true, explodeR:20
          });
          sfx('fire');
        } },
      { id:'e11', name:'TURRET', slot:'e', tier:3, pos:[1,3], cost:10, req:['e05','e08'],
        cd:lv=>8, mp:lv=>20, desc:'E SKILL. DEPLOY AUTO TURRET.',
        cast: (p,ang,lv)=>{
          entities.turrets = entities.turrets || [];
          entities.turrets.push({ x:p.x, y:p.y, life:12+lv*2, cd:0, dmg:(8+lv*3)*p.baseDmg });
          spawnParticle(p.x,p.y,'#e8c547',0.4,10,40); sfx('door');
        } },
      { id:'e12', name:'DRONE', slot:'e', tier:3, pos:[3,3], cost:10, req:['e06','e07'],
        cd:lv=>10, mp:lv=>22, desc:'E SKILL. ORBITING ATTACK DRONE.',
        cast: (p,ang,lv)=>{
          entities.drones = entities.drones || [];
          entities.drones.push({ ang:0, life:15, cd:0, dmg:(10+lv*3)*p.baseDmg });
          sfx('door');
        } },
      { id:'e13', name:'PLATED', slot:'passive', tier:3, pos:[2,4], cost:8, req:['e07'],
        desc:'DMG TAKEN -15% PER LV.', maxLv:2, effect:(p,lv)=>{ p.dmgReduction=(p.dmgReduction||0)+0.15; } },
      { id:'e14', name:'TOOLKIT', slot:'passive', tier:3, pos:[0,4], cost:7, req:['e02','e03'],
        desc:'ALL SKILL CD -12%.', maxLv:2, effect:(p,lv)=>{ p.cdMult *= 0.88; } },
      { id:'e15', name:'GATLING', slot:'lmb', tier:4, pos:[1,4], cost:14, req:['e09'],
        cd:lv=>0.15, mp:lv=>2, desc:'REPLACE LMB. INSANE ROF.',
        cast: shot('fire', { dmg:lv=>5+lv*2, speed:240, r:1, life:0.6, sfx:'fire' }) },
      { id:'e16', name:'RAILGUN', slot:'lmb', tier:4, pos:[3,4], cost:14, req:['e09','e10'],
        cd:lv=>1.2, mp:lv=>15, desc:'REPLACE LMB. HEAVY SNIPE.',
        cast: shot('fire', { dmg:lv=>60+lv*15, speed:500, r:3, life:0.8, pierce:true, sfx:'boss' }) },
      { id:'e17', name:'SATCHEL', slot:'e', tier:4, pos:[0,5], cost:12, req:['e11'],
        cd:lv=>6, mp:lv=>25, desc:'E SKILL. TRIPLE BOMB SPREAD.',
        cast: (p,ang,lv)=>{
          for (let i=-1;i<=1;i++) entities.bullets.push({
            x:p.x, y:p.y, vx:Math.cos(ang+i*0.3)*140, vy:Math.sin(ang+i*0.3)*140,
            r:3, dmg:(25+lv*5)*p.baseDmg, life:1.2, kind:'fire', hits:0, explosive:true, explodeR:24
          });
          sfx('fire');
        } },
      { id:'e18', name:'FORTRESS', slot:'e', tier:4, pos:[2,5], cost:13, req:['e13'],
        cd:lv=>10, mp:lv=>20, desc:'E SKILL. INVULN 3S + HEAL.',
        cast: (p,ang,lv)=>{ p.invuln=3+lv*0.5; p.hp=Math.min(p.maxHp,p.hp+30); sfx('parry'); state.shake=4; } },
      { id:'e19', name:'PRECISION', slot:'passive', tier:4, pos:[3,5], cost:10, req:['e04'],
        desc:'+30% CRIT CHANCE.', maxLv:1, effect:(p,lv)=>{ p.crit=(p.crit||0)+0.30; } },
      { id:'e20', name:'OVERCLOCK', slot:'passive', tier:4, pos:[1,5], cost:15, req:['e14','e15'],
        desc:'ULTIMATE. ALL CD -30%.', maxLv:1, effect:(p,lv)=>{ p.cdMult *= 0.70; } },
      { id:'e21', name:'SUBMACHINE', slot:'lmb', tier:1, pos:[0,6], cost:6, req:['e20'],
        cd:lv=>0.3, mp:lv=>5, desc:'FAST BOLT LOW DMG.', maxLv:3,
        cast: shot('fire', {dmg:l=>4+l*2,speed:280,r:2,life:0.8}) },
      { id:'e22', name:'CANNON', slot:'q', tier:1, pos:[1,6], cost:8, req:['e21'],
        cd:lv=>1.2, mp:lv=>18, desc:'HEAVY SHELL.', maxLv:3,
        cast: shot('fire', {dmg:l=>50+l*12,speed:120,r:5,life:1.8,explosive:true,explodeR:35}) },
      { id:'e23', name:'DRONE', slot:'e', tier:1, pos:[2,6], cost:10, req:['e22'],
        cd:lv=>4.0, mp:lv=>35, desc:'4 HOMING DRONES.', maxLv:3,
        cast: shot('fire', {count:4,dmg:l=>15+l*4,speed:100,r:2,life:3,homing:true,spread:6.28}) },
      { id:'e24', name:'SHIELDGEN', slot:'passive', tier:1, pos:[3,6], cost:12, req:['e23'],
        desc:'+15% DMG RES.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.dmgReduction=(p.dmgReduction||0)+0.15;})(p); } },
      { id:'e25', name:'NAPALM', slot:'e', tier:1, pos:[4,6], cost:14, req:['e24'],
        cd:lv=>4.0, mp:lv=>35, desc:'FIRE POOL AOE.', maxLv:3,
        cast: shot('fire', {dmg:l=>25+l*6,speed:100,r:5,life:2.5,explosive:true,explodeR:50}) },
      { id:'e26', name:'EMP', slot:'q', tier:1, pos:[0,7], cost:16, req:['e25'],
        cd:lv=>1.2, mp:lv=>18, desc:'STUN NOVA.', maxLv:3,
        cast: shot('ice', {count:16,dmg:l=>10+l*3,speed:200,r:2,life:0.8,spread:6.28,freeze:1.2}) },
      { id:'e27', name:'AUTOTURRET', slot:'passive', tier:1, pos:[1,7], cost:18, req:['e26'],
        desc:'+10 THORNS.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.thorns=(p.thorns||0)+10;})(p); } },
      { id:'e28', name:'PLASMA', slot:'lmb', tier:2, pos:[2,7], cost:20, req:['e27'],
        cd:lv=>0.3, mp:lv=>5, desc:'PLASMA BURST.', maxLv:3,
        cast: shot('fire', {dmg:l=>12+l*4,speed:180,r:3,life:1.2,explosive:true,explodeR:15}) },
      { id:'e29', name:'MISSILE POD', slot:'e', tier:2, pos:[3,7], cost:22, req:['e28'],
        cd:lv=>4.0, mp:lv=>35, desc:'HOMING VOLLEY.', maxLv:3,
        cast: shot('fire', {count:8,dmg:l=>18+l*5,speed:140,r:2,life:1.8,spread:0.5,homing:true,explosive:true,explodeR:12}) },
      { id:'e30', name:'REPAIR', slot:'passive', tier:2, pos:[4,7], cost:24, req:['e29'],
        desc:'+2 HP REGEN.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.hpRegen=(p.hpRegen||0)+2;})(p); } },
      { id:'e31', name:'CRIT SIGHT', slot:'passive', tier:2, pos:[0,8], cost:26, req:['e30'],
        desc:'+25% CRIT.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.crit=(p.crit||0)+0.25;})(p); } },
      { id:'e32', name:'HAYWIRE', slot:'passive', tier:2, pos:[1,8], cost:28, req:['e31'],
        desc:'LMB CD -35%.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.mods.lmbCd=(p.mods.lmbCd||1)*0.65;})(p); } },
      { id:'e33', name:'THERMAL', slot:'lmb', tier:2, pos:[2,8], cost:30, req:['e32'],
        cd:lv=>0.3, mp:lv=>5, desc:'HEAT SEEKING.', maxLv:3,
        cast: shot('fire', {dmg:l=>10+l*3,speed:150,r:2,life:2,homing:true}) },
      { id:'e34', name:'GAUSS', slot:'q', tier:2, pos:[3,8], cost:32, req:['e33'],
        cd:lv=>1.2, mp:lv=>18, desc:'RAILGUN PIERCE.', maxLv:3,
        cast: shot('fire', {dmg:l=>60+l*15,speed:300,r:3,life:1.2,pierce:true}) },
      { id:'e35', name:'CLUSTER', slot:'e', tier:3, pos:[4,8], cost:34, req:['e34'],
        cd:lv=>4.0, mp:lv=>35, desc:'CLUSTER BOMB.', maxLv:3,
        cast: shot('fire', {count:6,dmg:l=>20+l*5,speed:130,r:3,life:1.6,spread:0.9,explosive:true,explodeR:20}) },
      { id:'e36', name:'DEFLECT', slot:'passive', tier:3, pos:[0,9], cost:36, req:['e35'],
        desc:'+5 THORNS.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.thorns=(p.thorns||0)+5;})(p); } },
      { id:'e37', name:'NANITES', slot:'passive', tier:3, pos:[1,9], cost:38, req:['e36'],
        desc:'KILLS +4 HP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.lifesteal=(p.lifesteal||0)+4;})(p); } },
      { id:'e38', name:'SATCHEL', slot:'e', tier:3, pos:[2,9], cost:40, req:['e37'],
        cd:lv=>4.0, mp:lv=>35, desc:'HUGE BOMB.', maxLv:3,
        cast: shot('fire', {dmg:l=>80+l*20,speed:80,r:6,life:2,explosive:true,explodeR:60}) },
      { id:'e39', name:'CHAINGUN', slot:'lmb', tier:3, pos:[3,9], cost:42, req:['e38'],
        cd:lv=>0.3, mp:lv=>5, desc:'RAPID FIRE.', maxLv:3,
        cast: shot('fire', {count:2,dmg:l=>3+l,speed:260,r:2,life:0.7,spread:0.3}) },
      { id:'e40', name:'MECH SUIT', slot:'passive', tier:3, pos:[4,9], cost:44, req:['e39'],
        desc:'ULT. +100 HP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxHp+=100;p.hp+=100;})(p); } },
      { id:'e41', name:'SHRAPNEL', slot:'passive', tier:3, pos:[5,0], cost:46, req:['e40'],
        desc:'+20% CRIT.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.crit=(p.crit||0)+0.20;})(p); } },
      { id:'e42', name:'OVERDRIVE', slot:'passive', tier:4, pos:[5,1], cost:48, req:['e41'],
        desc:'SPD+20%, DMG+15%.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.speed*=1.20;p.baseDmg*=1.15;})(p); } },
      { id:'e43', name:'DECOY', slot:'passive', tier:4, pos:[5,2], cost:50, req:['e42'],
        desc:'+5 THORNS.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.thorns=(p.thorns||0)+5;})(p); } },
      { id:'e44', name:'MINEFIELD', slot:'e', tier:4, pos:[5,3], cost:52, req:['e43'],
        cd:lv=>4.0, mp:lv=>35, desc:'MINE BURST.', maxLv:3,
        cast: shot('fire', {count:8,dmg:l=>30+l*7,speed:60,r:3,life:1.5,spread:6.28,explosive:true,explodeR:25}) },
      { id:'e45', name:'SNIPER', slot:'q', tier:4, pos:[5,4], cost:54, req:['e44'],
        cd:lv=>1.2, mp:lv=>18, desc:'ONE-SHOT SNIPE.', maxLv:3,
        cast: shot('fire', {dmg:l=>100+l*25,speed:400,r:3,life:1,pierce:true}) },
      { id:'e46', name:'TESLA', slot:'e', tier:4, pos:[5,5], cost:56, req:['e45'],
        cd:lv=>4.0, mp:lv=>35, desc:'CHAIN LIGHTNING.', maxLv:3,
        cast: shot('fire', {count:3,dmg:l=>35+l*8,speed:250,r:3,life:1.4,spread:0.3,instant:true}) },
      { id:'e47', name:'ARMOR PL', slot:'passive', tier:4, pos:[5,6], cost:58, req:['e46'],
        desc:'+50 HP, +20% RES.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxHp+=50;p.hp+=50;p.dmgReduction=(p.dmgReduction||0)+0.20;})(p); } },
      { id:'e48', name:'LASER GRID', slot:'e', tier:4, pos:[5,7], cost:60, req:['e47'],
        cd:lv=>4.0, mp:lv=>35, desc:'CROSS LASER.', maxLv:3,
        cast: shot('fire', {count:8,dmg:l=>20+l*5,speed:200,r:2,life:1.4,spread:0.78,pierce:true}) },
      { id:'e49', name:'REACTOR', slot:'passive', tier:4, pos:[5,8], cost:62, req:['e48'],
        desc:'MP +60.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxMp+=60;p.mp+=60;})(p); } },
      { id:'e50', name:'ANNIHILATE', slot:'e', tier:4, pos:[5,9], cost:64, req:['e49'],
        cd:lv=>4.0, mp:lv=>35, desc:'ULT. RAILGUN ARRAY.', maxLv:3,
        cast: shot('fire', {count:5,dmg:l=>70+l*18,speed:350,r:4,life:1.2,spread:0.2,pierce:true}) },

    ]
  },

  nature: {
    name: 'NATURE', color: '#3ac762', desc: 'GROWTH AND ENDURANCE',
    skills: [
      { id:'n01', name:'SEED SHOT', slot:'lmb', tier:0, pos:[2,0], cost:2, req:['m01'],
        cd:lv=>0.35, mp:lv=>3, desc:'REPLACE LMB. SPROUTING SEED.',
        cast: shot('fire', { dmg:lv=>9+lv*2, speed:160, r:2, life:1.4, sfx:'fire' }) },
      { id:'n02', name:'VITALITY', slot:'passive', tier:1, pos:[0,1], cost:3, req:['n01'],
        desc:'MAX HP +30 PER LV.', maxLv:3, effect:(p,lv)=>{ p.maxHp+=30; p.hp+=30; } },
      { id:'n03', name:'REGEN', slot:'passive', tier:1, pos:[1,1], cost:3, req:['n01'],
        desc:'REGEN +1 HP/S PER LV.', maxLv:3, effect:(p,lv)=>{ p.hpRegen=(p.hpRegen||0)+1; } },
      { id:'n04', name:'THORNS', slot:'passive', tier:1, pos:[3,1], cost:3, req:['n01'],
        desc:'REFLECT 8 DMG ON CONTACT.', maxLv:2, effect:(p,lv)=>{ p.thorns=(p.thorns||0)+8; } },
      { id:'n05', name:'HEAL AURA', slot:'q', tier:2, pos:[0,2], cost:5, req:['n02'],
        cd:lv=>4, mp:lv=>18, desc:'Q SKILL. HEAL 30 HP.',
        cast: (p,ang,lv)=>{ p.hp=Math.min(p.maxHp,p.hp+30+lv*8); spawnParticle(p.x,p.y,'#3ac762',0.6,16,60); sfx('pickup'); } },
      { id:'n06', name:'THORN WHIP', slot:'lmb', tier:2, pos:[2,2], cost:5, req:['n04'],
        cd:lv=>0.5, mp:lv=>6, desc:'REPLACE LMB. PIERCING WHIP.',
        cast: shot('fire', { dmg:lv=>16+lv*3, speed:200, r:2, life:0.9, pierce:true, sfx:'fire' }) },
      { id:'n07', name:'BEES', slot:'q', tier:2, pos:[3,2], cost:5, req:['n03'],
        cd:lv=>2, mp:lv=>14, desc:'Q SKILL. RELEASE 6 BEES.',
        cast: (p,ang,lv)=>{
          for (let i=0;i<6;i++) {
            const aa=ang+rand(-0.6,0.6);
            entities.bullets.push({
              x:p.x, y:p.y, vx:Math.cos(aa)*120, vy:Math.sin(aa)*120,
              r:2, dmg:(6+lv*2)*p.baseDmg, life:2.5, kind:'fire', hits:0, homing:true
            });
          }
          sfx('fire');
        } },
      { id:'n08', name:'LIFESTEAL', slot:'passive', tier:2, pos:[1,2], cost:5, req:['n02','n03'],
        desc:'HITS HEAL 2 HP PER LV.', maxLv:2, effect:(p,lv)=>{ p.lifesteal=(p.lifesteal||0)+2; p.perks.push('lifesteal'); } },
      { id:'n09', name:'ENTANGLE', slot:'q', tier:3, pos:[0,3], cost:8, req:['n05','n07'],
        cd:lv=>3, mp:lv=>16, desc:'Q SKILL. ROOT NOVA.',
        cast: (p,ang,lv)=>{
          for (const e of entities.enemies) if (dist(e,p)<50) { e.stun=2+lv*0.4; e.hp-=(12+lv*3)*p.baseDmg; }
          spawnParticle(p.x,p.y,'#3ac762',0.6,18,70); sfx('hit');
        } },
      { id:'n10', name:'WOLF', slot:'e', tier:3, pos:[1,3], cost:10, req:['n06','n07'],
        cd:lv=>12, mp:lv=>25, desc:'E SKILL. SUMMON SPIRIT WOLF.',
        cast: (p,ang,lv)=>{
          entities.pets = entities.pets || [];
          entities.pets.push({ x:p.x, y:p.y, hp:60+lv*10, life:18, cd:0, dmg:(10+lv*3)*p.baseDmg, kind:'wolf' });
          spawnParticle(p.x,p.y,'#3ac762',0.5,12,40); sfx('door');
        } },
      { id:'n11', name:'EARTHQUAKE', slot:'e', tier:3, pos:[3,3], cost:10, req:['n06'],
        cd:lv=>7, mp:lv=>26, desc:'E SKILL. ROOM-WIDE QUAKE.',
        cast: (p,ang,lv)=>{
          for (const e of entities.enemies) { e.hp-=(30+lv*8)*p.baseDmg; e.stun=1; }
          state.shake=12; spawnParticle(p.x,p.y,'#8a5a3a',0.8,30,120); sfx('boss');
        } },
      { id:'n12', name:'DEEP ROOTS', slot:'passive', tier:3, pos:[2,3], cost:8, req:['n04','n05'],
        desc:'DMG TAKEN -20%.', maxLv:1, effect:(p,lv)=>{ p.dmgReduction=(p.dmgReduction||0)+0.20; } },
      { id:'n13', name:'FOREST WRATH', slot:'lmb', tier:4, pos:[0,4], cost:13, req:['n06','n09'],
        cd:lv=>0.4, mp:lv=>7, desc:'REPLACE LMB. 3-BRANCH THORNS.',
        cast: shot('fire', { dmg:lv=>10+lv*3, speed:180, count:lv=>3, spread:0.2, life:1.4, pierce:true, sfx:'fire' }) },
      { id:'n14', name:'TREANT', slot:'e', tier:4, pos:[1,4], cost:14, req:['n10','n11'],
        cd:lv=>15, mp:lv=>30, desc:'E SKILL. SUMMON GUARDIAN TREANT.',
        cast: (p,ang,lv)=>{
          entities.pets = entities.pets || [];
          entities.pets.push({ x:p.x+20, y:p.y, hp:150+lv*20, life:25, cd:0, dmg:(15+lv*4)*p.baseDmg, kind:'treant' });
          sfx('boss');
        } },
      { id:'n15', name:'REBIRTH', slot:'passive', tier:4, pos:[2,4], cost:15, req:['n08','n12'],
        desc:'REVIVE ONCE PER RUN AT 40% HP.', maxLv:1, effect:(p,lv)=>{ p.perks.push('rebirth'); p.rebirthReady=true; } },
      { id:'n16', name:'BOUNTIFUL', slot:'passive', tier:4, pos:[3,4], cost:10, req:['n05'],
        desc:'PICKUPS RESTORE 2X.', maxLv:1, effect:(p,lv)=>{ p.perks.push('bountiful'); } },
      { id:'n17', name:'CIRCLE LIFE', slot:'passive', tier:4, pos:[0,5], cost:12, req:['n03','n05'],
        desc:'ALL HP OVERFLOW +DMG.', maxLv:1, effect:(p,lv)=>{ p.perks.push('circlelife'); } },
      { id:'n18', name:'SWARM', slot:'e', tier:4, pos:[3,5], cost:13, req:['n07','n10'],
        cd:lv=>10, mp:lv=>28, desc:'E SKILL. 15 BEE SWARM.',
        cast: (p,ang,lv)=>{
          for (let i=0;i<15;i++) {
            const aa=(i/15)*Math.PI*2;
            entities.bullets.push({ x:p.x, y:p.y, vx:Math.cos(aa)*130, vy:Math.sin(aa)*130,
              r:2, dmg:(8+lv*2)*p.baseDmg, life:2.5, kind:'fire', hits:0, homing:true });
          }
          sfx('fire');
        } },
      { id:'n19', name:'NATURES BOND', slot:'passive', tier:4, pos:[1,5], cost:12, req:['n02','n04'],
        desc:'ALL STATS +15%.', maxLv:1, effect:(p,lv)=>{ p.maxHp*=1.15; p.hp*=1.15; p.baseDmg*=1.15; p.speed*=1.15; } },
      { id:'n20', name:'WORLD TREE', slot:'passive', tier:4, pos:[2,5], cost:16, req:['n14','n15'],
        desc:'ULTIMATE. REGEN 3 HP/S.', maxLv:1, effect:(p,lv)=>{ p.hpRegen=(p.hpRegen||0)+3; } },
      { id:'n21', name:'ROOTS', slot:'e', tier:1, pos:[0,6], cost:6, req:['n20'],
        cd:lv=>4.0, mp:lv=>35, desc:'ROOT ALL NEARBY.', maxLv:3,
        cast: shot('ice', {count:12,dmg:l=>15+l*4,speed:100,r:3,life:1,spread:6.28,freeze:1.5}) },
      { id:'n22', name:'VINE', slot:'q', tier:1, pos:[1,6], cost:8, req:['n21'],
        cd:lv=>1.2, mp:lv=>18, desc:'GRAPPLE VINE.', maxLv:3,
        cast: shot('fire', {dmg:l=>25+l*6,speed:180,r:3,life:1.5,pierce:true}) },
      { id:'n23', name:'HEAL', slot:'passive', tier:1, pos:[2,6], cost:10, req:['n22'],
        desc:'+3 HP REGEN.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.hpRegen=(p.hpRegen||0)+3;})(p); } },
      { id:'n24', name:'BEAR', slot:'e', tier:1, pos:[3,6], cost:12, req:['n23'],
        cd:lv=>4.0, mp:lv=>35, desc:'SPIRIT BEAR CHARGE.', maxLv:3,
        cast: shot('fire', {dmg:l=>40+l*10,speed:60,r:6,life:3,homing:true,pierce:true}) },
      { id:'n25', name:'POISON', slot:'lmb', tier:1, pos:[4,6], cost:14, req:['n24'],
        cd:lv=>0.3, mp:lv=>5, desc:'TOXIC DART.', maxLv:3,
        cast: shot('fire', {dmg:l=>10+l*3,speed:170,r:2,life:1.5}) },
      { id:'n26', name:'HEALMIST', slot:'e', tier:1, pos:[0,7], cost:16, req:['n25'],
        cd:lv=>4.0, mp:lv=>35, desc:'BIG HEAL PLUS.', maxLv:3,
        cast: shot('fire', {count:8,dmg:l=>18+l*4,speed:80,r:3,life:1.5,spread:6.28}) },
      { id:'n27', name:'THORNS AL', slot:'passive', tier:1, pos:[1,7], cost:18, req:['n26'],
        desc:'+10 THORNS.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.thorns=(p.thorns||0)+10;})(p); } },
      { id:'n28', name:'SUNFLOWER', slot:'passive', tier:2, pos:[2,7], cost:20, req:['n27'],
        desc:'MP REGEN +5/S.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.mpRegenBonus=(p.mpRegenBonus||0)+5;})(p); } },
      { id:'n29', name:'EARTHQUAKE', slot:'e', tier:2, pos:[3,7], cost:22, req:['n28'],
        cd:lv=>4.0, mp:lv=>35, desc:'HIGH DMG NOVA.', maxLv:3,
        cast: shot('fire', {count:16,dmg:l=>40+l*10,speed:120,r:4,life:1,spread:6.28,explosive:true,explodeR:25}) },
      { id:'n30', name:'SEEDS', slot:'lmb', tier:2, pos:[4,7], cost:24, req:['n29'],
        cd:lv=>0.3, mp:lv=>5, desc:'SEED SPRAY.', maxLv:3,
        cast: shot('fire', {count:5,dmg:l=>6+l*2,speed:180,r:2,life:1,spread:0.5}) },
      { id:'n31', name:'LIFEBLOOM', slot:'passive', tier:2, pos:[0,8], cost:26, req:['n30'],
        desc:'+50 MAX HP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxHp+=50;p.hp+=50;})(p); } },
      { id:'n32', name:'SWARM', slot:'q', tier:2, pos:[1,8], cost:28, req:['n31'],
        cd:lv=>1.2, mp:lv=>18, desc:'8 BEES.', maxLv:3,
        cast: shot('fire', {count:8,dmg:l=>7+l*2,speed:120,r:2,life:2.5,spread:1.5,homing:true}) },
      { id:'n33', name:'REGROW', slot:'passive', tier:2, pos:[2,8], cost:30, req:['n32'],
        desc:'KILLS +2 HP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.lifesteal=(p.lifesteal||0)+2;})(p); } },
      { id:'n34', name:'THUNDER TR', slot:'e', tier:2, pos:[3,8], cost:32, req:['n33'],
        cd:lv=>4.0, mp:lv=>35, desc:'LIGHTNING TREE.', maxLv:3,
        cast: shot('fire', {count:6,dmg:l=>30+l*7,speed:200,r:3,life:1.2,spread:0.5,instant:true}) },
      { id:'n35', name:'VERDANT', slot:'passive', tier:3, pos:[4,8], cost:34, req:['n34'],
        desc:'+15% RES.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.dmgReduction=(p.dmgReduction||0)+0.15;})(p); } },
      { id:'n36', name:'BRAMBLES', slot:'e', tier:3, pos:[0,9], cost:36, req:['n35'],
        cd:lv=>4.0, mp:lv=>35, desc:'THORN WALL BOUNCE.', maxLv:3,
        cast: shot('fire', {count:10,dmg:l=>18+l*4,speed:150,r:2,life:2,spread:0.6,bounces:3}) },
      { id:'n37', name:'SPORES', slot:'lmb', tier:3, pos:[1,9], cost:38, req:['n36'],
        cd:lv=>0.3, mp:lv=>5, desc:'SLOW SPORES.', maxLv:3,
        cast: shot('ice', {count:3,dmg:l=>8+l*2,speed:140,r:3,life:1.5,spread:0.4,freeze:0.5}) },
      { id:'n38', name:'LEAF DANCE', slot:'passive', tier:3, pos:[2,9], cost:40, req:['n37'],
        desc:'SPD+15%.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.speed*=1.15;})(p); } },
      { id:'n39', name:'MOON WELL', slot:'passive', tier:3, pos:[3,9], cost:42, req:['n38'],
        desc:'MP REGEN +8/S.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.mpRegenBonus=(p.mpRegenBonus||0)+8;})(p); } },
      { id:'n40', name:'ANCIENTS', slot:'passive', tier:3, pos:[4,9], cost:44, req:['n39'],
        desc:'ULT. +50% HP/MP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxHp*=1.5;p.hp=p.maxHp;p.maxMp*=1.5;p.mp=p.maxMp;})(p); } },
      { id:'n41', name:'GALE', slot:'e', tier:3, pos:[5,0], cost:46, req:['n40'],
        cd:lv=>4.0, mp:lv=>35, desc:'WIND BURST.', maxLv:3,
        cast: shot('fire', {count:12,dmg:l=>18+l*4,speed:220,r:2,life:1,spread:6.28}) },
      { id:'n42', name:'BLOOM', slot:'q', tier:4, pos:[5,1], cost:48, req:['n41'],
        cd:lv=>1.2, mp:lv=>18, desc:'PETAL SHURIKEN.', maxLv:3,
        cast: shot('fire', {count:6,dmg:l=>10+l*3,speed:180,r:2,life:1.2,spread:6.28}) },
      { id:'n43', name:'DRUID', slot:'passive', tier:4, pos:[5,2], cost:50, req:['n42'],
        desc:'ALL DMG +15%.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.baseDmg*=1.15;})(p); } },
      { id:'n44', name:'FOREST', slot:'passive', tier:4, pos:[5,3], cost:52, req:['n43'],
        desc:'+5 HP REGEN.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.hpRegen=(p.hpRegen||0)+5;})(p); } },
      { id:'n45', name:'PHOENIX', slot:'passive', tier:4, pos:[5,4], cost:54, req:['n44'],
        desc:'SURVIVE FATAL.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.perks.push("phoenix");})(p); } },
      { id:'n46', name:'HAWK', slot:'q', tier:4, pos:[5,5], cost:56, req:['n45'],
        cd:lv=>1.2, mp:lv=>18, desc:'PIERCING HAWK.', maxLv:3,
        cast: shot('fire', {dmg:l=>32+l*8,speed:280,r:3,life:1.5,pierce:true,homing:true}) },
      { id:'n47', name:'CREEPER', slot:'e', tier:4, pos:[5,6], cost:58, req:['n46'],
        cd:lv=>4.0, mp:lv=>35, desc:'ROOT ALL ENEMIES.', maxLv:3,
        cast: shot('ice', {count:20,dmg:l=>15+l*4,speed:100,r:3,life:1,spread:6.28,freeze:2.5}) },
      { id:'n48', name:'REGROWTH', slot:'passive', tier:4, pos:[5,7], cost:60, req:['n47'],
        desc:'HP REGEN +5/S.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.hpRegen=(p.hpRegen||0)+5;})(p); } },
      { id:'n49', name:'GAIA', slot:'passive', tier:4, pos:[5,8], cost:62, req:['n48'],
        desc:'+30 THORNS.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.thorns=(p.thorns||0)+30;})(p); } },
      { id:'n50', name:'NAT FURY', slot:'e', tier:4, pos:[5,9], cost:64, req:['n49'],
        cd:lv=>4.0, mp:lv=>35, desc:'ULT. HOMING BLAST.', maxLv:3,
        cast: shot('fire', {count:20,dmg:l=>25+l*6,speed:150,r:2,life:2,spread:6.28,homing:true}) },

    ]
  },

  chaos: {
    name: 'CHAOS', color: '#c81616', desc: 'HIGH RISK HIGH REWARD',
    skills: [
      { id:'c01', name:'CHAOS BOLT', slot:'lmb', tier:0, pos:[2,0], cost:2, req:['m01'],
        cd:lv=>0.35, mp:lv=>4, desc:'REPLACE LMB. WILDLY VARIABLE DMG.',
        cast: (p,ang,lv)=>{
          const dmg = (5 + Math.random() * (20 + lv*8)) * p.baseDmg;
          entities.bullets.push({ x:p.x, y:p.y, vx:Math.cos(ang)*160, vy:Math.sin(ang)*160,
            r:3, dmg, life:1.4, kind:'fire', hits:0 });
          sfx('fire');
        } },
      { id:'c02', name:'LUCKY', slot:'passive', tier:1, pos:[0,1], cost:3, req:['c01'],
        desc:'CRIT CHANCE +15% PER LV.', maxLv:3, effect:(p,lv)=>{ p.crit=(p.crit||0)+0.15; } },
      { id:'c03', name:'ERRATIC', slot:'passive', tier:1, pos:[1,1], cost:3, req:['c01'],
        desc:'25% NO-CD CHANCE ON CAST.', maxLv:1, effect:(p,lv)=>{ p.perks.push('erratic'); } },
      { id:'c04', name:'BLOOD PACT', slot:'passive', tier:1, pos:[3,1], cost:4, req:['c01'],
        desc:'HP -20%, DMG +35%.', maxLv:1, effect:(p,lv)=>{ p.maxHp*=0.8; p.hp=Math.min(p.hp,p.maxHp); p.baseDmg*=1.35; } },
      { id:'c05', name:'CURSE', slot:'q', tier:2, pos:[0,2], cost:6, req:['c02'],
        cd:lv=>1.5, mp:lv=>14, desc:'Q SKILL. TIME BOMB CURSE.',
        cast: (p,ang,lv)=>{
          entities.bullets.push({ x:p.x, y:p.y, vx:Math.cos(ang)*130, vy:Math.sin(ang)*130,
            r:3, dmg:(10+lv*3)*p.baseDmg, life:1.2, kind:'fire', hits:0, explosive:true, explodeR:30 });
          sfx('fire');
        } },
      { id:'c06', name:'MAD ARROW', slot:'lmb', tier:2, pos:[2,2], cost:6, req:['c02','c03'],
        cd:lv=>0.4, mp:lv=>5, desc:'REPLACE LMB. BOUNCING SHOTS.',
        cast: shot('fire', { dmg:lv=>12+lv*3, speed:180, r:2, life:2.0, sfx:'fire' }) },
      { id:'c07', name:'HEX', slot:'q', tier:2, pos:[3,2], cost:6, req:['c03','c04'],
        cd:lv=>2, mp:lv=>15, desc:'Q SKILL. WEAKEN + SLOW.',
        cast: (p,ang,lv)=>{
          for (const e of entities.enemies) if (dist(e,p)<70) { e.slow=3; e.hp-=(8+lv*2)*p.baseDmg; }
          spawnParticle(p.x,p.y,'#c81616',0.6,16,60); sfx('hit');
        } },
      { id:'c08', name:'DOUBLE', slot:'passive', tier:2, pos:[1,2], cost:5, req:['c02'],
        desc:'50%: DMG X2. 50%: DMG X0.5.', maxLv:1, effect:(p,lv)=>{ p.perks.push('doubleornothing'); } },
      { id:'c09', name:'WILD MAGIC', slot:'lmb', tier:3, pos:[0,3], cost:9, req:['c06'],
        cd:lv=>0.35, mp:lv=>4, desc:'REPLACE LMB. RANDOM ELEMENT SHOT.',
        cast: (p,ang,lv)=>{
          const r=Math.random();
          const kind = r<0.5 ? 'fire' : 'ice';
          entities.bullets.push({ x:p.x, y:p.y, vx:Math.cos(ang)*180, vy:Math.sin(ang)*180,
            r:3, dmg:(14+lv*4)*p.baseDmg, life:1.4, kind, hits:0, freeze: kind==='ice'?0.6:0 });
          sfx(kind);
        } },
      { id:'c10', name:'EXPLOSION', slot:'e', tier:3, pos:[2,3], cost:10, req:['c05','c07'],
        cd:lv=>5, mp:lv=>25, desc:'E SKILL. SELF-DETONATE.',
        cast: (p,ang,lv)=>{
          for (const e of entities.enemies) if (dist(e,p)<50) { e.hp-=(40+lv*10)*p.baseDmg; }
          p.hp -= 10;
          spawnParticle(p.x,p.y,'#c81616',0.8,40,150); state.shake=12; sfx('boss');
        } },
      { id:'c11', name:'PHASE', slot:'e', tier:3, pos:[1,3], cost:9, req:['c03'],
        cd:lv=>4, mp:lv=>15, desc:'E SKILL. RANDOM TELEPORT + INVULN.',
        cast: (p,ang,lv)=>{
          const rm=rooms[currentRoom]; if(rm) {
            p.x=rm.x+20+Math.random()*(rm.w-40);
            p.y=rm.y+20+Math.random()*(rm.h-40);
          }
          p.invuln=1+lv*0.3; spawnParticle(p.x,p.y,'#c81616',0.5,16,70); sfx('roll');
        } },
      { id:'c12', name:'BERSERK', slot:'passive', tier:3, pos:[3,3], cost:9, req:['c04','c08'],
        desc:'BELOW 30% HP: DMG 2X.', maxLv:1, effect:(p,lv)=>{ p.perks.push('berserk'); } },
      { id:'c13', name:'CHAOS STORM', slot:'e', tier:4, pos:[0,4], cost:14, req:['c10'],
        cd:lv=>8, mp:lv=>30, desc:'E SKILL. RANDOM BOLT STORM.',
        cast: (p,ang,lv)=>{
          for (let i=0;i<20;i++) setTimeout(()=>{
            const a=Math.random()*Math.PI*2;
            entities.bullets.push({ x:p.x, y:p.y, vx:Math.cos(a)*rand(100,200), vy:Math.sin(a)*rand(100,200),
              r:2, dmg:(8+lv*2)*p.baseDmg, life:1.5, kind:'fire', hits:0 });
          }, i*60);
          sfx('boss');
        } },
      { id:'c14', name:'DEMON', slot:'e', tier:4, pos:[1,4], cost:13, req:['c11'],
        cd:lv=>12, mp:lv=>28, desc:'E SKILL. SUMMON HUNGRY DEMON.',
        cast: (p,ang,lv)=>{
          entities.pets = entities.pets || [];
          entities.pets.push({ x:p.x, y:p.y, hp:80+lv*15, life:15, cd:0, dmg:(15+lv*4)*p.baseDmg, kind:'demon' });
          sfx('boss');
        } },
      { id:'c15', name:'REROLL', slot:'e', tier:4, pos:[2,4], cost:11, req:['c07','c12'],
        cd:lv=>15, mp:lv=>20, desc:'E SKILL. FULL HEAL + RANDOM BUFF.',
        cast: (p,ang,lv)=>{ p.hp=p.maxHp; p.mp=p.maxMp; p.baseDmg*=1.2; p.invuln=1; sfx('level'); } },
      { id:'c16', name:'SACRIFICE', slot:'passive', tier:4, pos:[3,4], cost:12, req:['c10'],
        desc:'KILLS +5% DMG (STACK 10).', maxLv:1, effect:(p,lv)=>{ p.perks.push('sacrifice'); p.sacrifStacks=0; } },
      { id:'c17', name:'DEMONIC', slot:'passive', tier:4, pos:[0,5], cost:12, req:['c12'],
        desc:'LIFESTEAL +4 PER HIT.', maxLv:1, effect:(p,lv)=>{ p.lifesteal=(p.lifesteal||0)+4; p.perks.push('lifesteal'); } },
      { id:'c18', name:'PANDEMONIUM', slot:'passive', tier:4, pos:[2,5], cost:15, req:['c13','c14'],
        desc:'ULTIMATE. ENEMIES EXPLODE ON DEATH.', maxLv:1, effect:(p,lv)=>{ p.perks.push('pandemonium'); } },
      { id:'c19', name:'DEATH WISH', slot:'passive', tier:4, pos:[1,5], cost:11, req:['c04'],
        desc:'BELOW 20% HP: SPEED X2.', maxLv:1, effect:(p,lv)=>{ p.perks.push('deathwish'); } },
      { id:'c20', name:'TRICKSTER', slot:'passive', tier:4, pos:[3,5], cost:14, req:['c02','c08'],
        desc:'ULTIMATE. CRIT DMG X4.', maxLv:1, effect:(p,lv)=>{ p.critMult=(p.critMult||2)+2; } },
      { id:'c21', name:'MAYHEM', slot:'lmb', tier:1, pos:[0,6], cost:6, req:['c20'],
        cd:lv=>0.3, mp:lv=>5, desc:'RANDOM DMG.', maxLv:3,
        cast: shot('fire', {dmg:l=>15+l*10,speed:200,r:3,life:1.4}) },
      { id:'c22', name:'WARP', slot:'q', tier:1, pos:[1,6], cost:8, req:['c21'],
        cd:lv=>1.2, mp:lv=>18, desc:'TELEPORT SHOT.', maxLv:3,
        cast: shot('fire', {dmg:l=>25+l*6,speed:300,r:3,life:0.8,pierce:true}) },
      { id:'c23', name:'CURSE', slot:'passive', tier:1, pos:[2,6], cost:10, req:['c22'],
        desc:'+25% DMG.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.baseDmg*=1.25;})(p); } },
      { id:'c24', name:'SHADOWS', slot:'e', tier:1, pos:[3,6], cost:12, req:['c23'],
        cd:lv=>4.0, mp:lv=>35, desc:'SHADOW CLONES.', maxLv:3,
        cast: shot('fire', {count:6,dmg:l=>20+l*5,speed:180,r:3,life:2,spread:6.28,homing:true}) },
      { id:'c25', name:'LUCK', slot:'passive', tier:1, pos:[4,6], cost:14, req:['c24'],
        desc:'CRIT MULT X3.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.critMult=(p.critMult||2)+1;})(p); } },
      { id:'c26', name:'MADNESS', slot:'lmb', tier:1, pos:[0,7], cost:16, req:['c25'],
        cd:lv=>0.3, mp:lv=>5, desc:'ERRATIC BOLT.', maxLv:3,
        cast: shot('fire', {dmg:l=>18+l*5,speed:200,r:3,life:1.2,bounces:2}) },
      { id:'c27', name:'VOID', slot:'e', tier:1, pos:[1,7], cost:18, req:['c26'],
        cd:lv=>4.0, mp:lv=>35, desc:'BLACK HOLE.', maxLv:3,
        cast: shot('fire', {dmg:l=>40+l*10,speed:80,r:8,life:2.5,homing:true,pierce:true}) },
      { id:'c28', name:'GAMBLE', slot:'passive', tier:2, pos:[2,7], cost:20, req:['c27'],
        desc:'x2 OR x0.5 DMG.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.perks.push("doubleornothing");})(p); } },
      { id:'c29', name:'DECAY', slot:'passive', tier:2, pos:[3,7], cost:22, req:['c28'],
        desc:'+15% DMG.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.baseDmg*=1.15;})(p); } },
      { id:'c30', name:'CHAOS ORB', slot:'e', tier:2, pos:[4,7], cost:24, req:['c29'],
        cd:lv=>4.0, mp:lv=>35, desc:'ORBITING ORBS.', maxLv:3,
        cast: shot('fire', {count:6,dmg:l=>15+l*4,speed:100,r:3,life:3,spread:6.28,bounces:5}) },
      { id:'c31', name:'MIRROR', slot:'q', tier:2, pos:[0,8], cost:26, req:['c30'],
        cd:lv=>1.2, mp:lv=>18, desc:'MIRROR SHOT.', maxLv:3,
        cast: shot('fire', {count:4,dmg:l=>18+l*5,speed:220,r:2,life:1.6,spread:1.57,bounces:2}) },
      { id:'c32', name:'DOOM', slot:'e', tier:2, pos:[1,8], cost:28, req:['c31'],
        cd:lv=>4.0, mp:lv=>35, desc:'MARK OF DEATH.', maxLv:3,
        cast: shot('fire', {dmg:l=>90+l*20,speed:150,r:4,life:1.5,pierce:true}) },
      { id:'c33', name:'TRICKSTER', slot:'passive', tier:2, pos:[2,8], cost:30, req:['c32'],
        desc:'20% NO CD.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.perks.push("chain");})(p); } },
      { id:'c34', name:'ETHER', slot:'passive', tier:2, pos:[3,8], cost:32, req:['c33'],
        desc:'MP +50.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxMp+=50;p.mp+=50;})(p); } },
      { id:'c35', name:'CACOPHONY', slot:'e', tier:3, pos:[4,8], cost:34, req:['c34'],
        cd:lv=>4.0, mp:lv=>35, desc:'CHAOS SPREAD.', maxLv:3,
        cast: shot('fire', {count:10,dmg:l=>20+l*5,speed:200,r:2,life:1.5,spread:1.5}) },
      { id:'c36', name:'ENTROPY', slot:'passive', tier:3, pos:[0,9], cost:36, req:['c35'],
        desc:'+30% DMG.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.baseDmg*=1.30;})(p); } },
      { id:'c37', name:'VOIDBOLT', slot:'lmb', tier:3, pos:[1,9], cost:38, req:['c36'],
        cd:lv=>0.3, mp:lv=>5, desc:'PIERCE BOLT.', maxLv:3,
        cast: shot('fire', {dmg:l=>14+l*4,speed:190,r:3,life:1.4,pierce:true}) },
      { id:'c38', name:'CATASTROPHE', slot:'e', tier:3, pos:[2,9], cost:40, req:['c37'],
        cd:lv=>4.0, mp:lv=>35, desc:'HUGE EXPLOSION.', maxLv:3,
        cast: shot('fire', {dmg:l=>80+l*20,speed:120,r:5,life:1.8,explosive:true,explodeR:60}) },
      { id:'c39', name:'UNSTABLE', slot:'passive', tier:3, pos:[3,9], cost:42, req:['c38'],
        desc:'+50% DMG.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.baseDmg*=1.5;})(p); } },
      { id:'c40', name:'RECKONING', slot:'passive', tier:3, pos:[4,9], cost:44, req:['c39'],
        desc:'ULT. +ALL.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.baseDmg*=1.3;p.speed*=1.15;p.crit=(p.crit||0)+0.15;})(p); } },
      { id:'c41', name:'HEX', slot:'lmb', tier:3, pos:[5,0], cost:46, req:['c40'],
        cd:lv=>0.3, mp:lv=>5, desc:'CURSING BOLT.', maxLv:3,
        cast: shot('fire', {dmg:l=>12+l*4,speed:180,r:3,life:1.4}) },
      { id:'c42', name:'ANARCHY', slot:'q', tier:4, pos:[5,1], cost:48, req:['c41'],
        cd:lv=>1.2, mp:lv=>18, desc:'CHAOS BURST.', maxLv:3,
        cast: shot('fire', {count:5,dmg:l=>10+l*3,speed:250,r:2,life:1,spread:0.5}) },
      { id:'c43', name:'NIGHTMARE', slot:'e', tier:4, pos:[5,2], cost:50, req:['c42'],
        cd:lv=>4.0, mp:lv=>35, desc:'FEAR STUN.', maxLv:3,
        cast: shot('ice', {count:16,dmg:l=>25+l*6,speed:150,r:2,life:1,spread:6.28,freeze:2}) },
      { id:'c44', name:'RITUAL', slot:'passive', tier:4, pos:[5,3], cost:52, req:['c43'],
        desc:'KILLS +MP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.perks.push("mpsiphon");})(p); } },
      { id:'c45', name:'BEDLAM', slot:'passive', tier:4, pos:[5,4], cost:54, req:['c44'],
        desc:'BOUNCE ALL.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.perks.push("bouncy");})(p); } },
      { id:'c46', name:'DISCORD', slot:'e', tier:4, pos:[5,5], cost:56, req:['c45'],
        cd:lv=>4.0, mp:lv=>35, desc:'HOMING SWARM.', maxLv:3,
        cast: shot('fire', {count:8,dmg:l=>20+l*5,speed:150,r:3,life:2.5,spread:6.28,homing:true}) },
      { id:'c47', name:'MUTATE', slot:'passive', tier:4, pos:[5,6], cost:58, req:['c46'],
        desc:'SEEKER ALL.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.perks.push("seeker");})(p); } },
      { id:'c48', name:'ABYSS', slot:'q', tier:4, pos:[5,7], cost:60, req:['c47'],
        cd:lv=>1.2, mp:lv=>18, desc:'VOID BEAM.', maxLv:3,
        cast: shot('fire', {dmg:l=>50+l*12,speed:300,r:4,life:1.5,pierce:true}) },
      { id:'c49', name:'OBLIVION', slot:'e', tier:4, pos:[5,8], cost:62, req:['c48'],
        cd:lv=>4.0, mp:lv=>35, desc:'ULT. BIG DMG.', maxLv:3,
        cast: shot('fire', {dmg:l=>200,speed:250,r:5,life:1.5,pierce:true,explosive:true,explodeR:40}) },
      { id:'c50', name:'PARADOX', slot:'passive', tier:4, pos:[5,9], cost:64, req:['c49'],
        desc:'ULT. +ALL.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.baseDmg*=1.5;p.maxHp*=1.5;p.hp=p.maxHp;p.speed*=1.2;})(p); } },

    ]
  },

  order: {
    name: 'ORDER', color: '#ffefa8', desc: 'DISCIPLINE AND DEFENSE',
    skills: [
      { id:'o01', name:'HOLY ARROW', slot:'lmb', tier:0, pos:[2,0], cost:2, req:['m01'],
        cd:lv=>0.4, mp:lv=>3, desc:'REPLACE LMB. PRECISE HOLY SHOT.',
        cast: shot('fire', { dmg:lv=>13+lv*3, speed:200, r:2, life:1.4, sfx:'fire' }) },
      { id:'o02', name:'DISCIPLINE', slot:'passive', tier:1, pos:[0,1], cost:3, req:['o01'],
        desc:'MP COST -20% PER LV.', maxLv:2, effect:(p,lv)=>{ p.mpCostMult=(p.mpCostMult||1)*0.80; } },
      { id:'o03', name:'ARMOR', slot:'passive', tier:1, pos:[1,1], cost:3, req:['o01'],
        desc:'DMG TAKEN -15% PER LV.', maxLv:3, effect:(p,lv)=>{ p.dmgReduction=(p.dmgReduction||0)+0.15; } },
      { id:'o04', name:'MEDITATION', slot:'passive', tier:1, pos:[3,1], cost:3, req:['o01'],
        desc:'MP REGEN +3/S PER LV.', maxLv:2, effect:(p,lv)=>{ p.mpRegenBonus=(p.mpRegenBonus||0)+3; } },
      { id:'o05', name:'JUDGMENT', slot:'q', tier:2, pos:[0,2], cost:6, req:['o02'],
        cd:lv=>1.0, mp:lv=>12, desc:'Q SKILL. PIERCING JUDGMENT.',
        cast: shot('fire', { dmg:lv=>28+lv*6, speed:280, r:3, life:1.2, pierce:true, sfx:'ice' }) },
      { id:'o06', name:'SPEAR', slot:'lmb', tier:2, pos:[2,2], cost:5, req:['o03'],
        cd:lv=>0.5, mp:lv=>6, desc:'REPLACE LMB. PIERCING SPEAR.',
        cast: shot('fire', { dmg:lv=>18+lv*4, speed:220, r:2, life:1.2, pierce:true, sfx:'fire' }) },
      { id:'o07', name:'BARRIER', slot:'q', tier:2, pos:[3,2], cost:6, req:['o03','o04'],
        cd:lv=>3, mp:lv=>18, desc:'Q SKILL. INVULN 1.5S.',
        cast: (p,ang,lv)=>{ p.invuln=1.5+lv*0.2; spawnParticle(p.x,p.y,'#ffefa8',0.4,10,40); sfx('parry'); } },
      { id:'o08', name:'BALANCE', slot:'passive', tier:2, pos:[1,2], cost:5, req:['o02','o03'],
        desc:'HP=MP RATIO: DMG +20%.', maxLv:1, effect:(p,lv)=>{ p.perks.push('balance'); } },
      { id:'o09', name:'SANCTUARY', slot:'e', tier:3, pos:[0,3], cost:10, req:['o05','o07'],
        cd:lv=>10, mp:lv=>25, desc:'E SKILL. HEAL + INVULN 3S.',
        cast: (p,ang,lv)=>{ p.hp=Math.min(p.maxHp,p.hp+40); p.invuln=3+lv*0.5; sfx('level'); } },
      { id:'o10', name:'REFLECT', slot:'e', tier:3, pos:[3,3], cost:10, req:['o07'],
        cd:lv=>8, mp:lv=>22, desc:'E SKILL. REFLECT 4S.',
        cast: (p,ang,lv)=>{ p.reflectT=4+lv*0.5; showMsg('REFLECT ACTIVE'); sfx('parry'); } },
      { id:'o11', name:'EQUILIBRIUM', slot:'lmb', tier:3, pos:[2,3], cost:9, req:['o06','o08'],
        cd:lv=>0.35, mp:lv=>5, desc:'REPLACE LMB. BALANCED BOLT.',
        cast: shot('fire', { dmg:lv=>15+lv*4, speed:200, r:2, life:1.3, sfx:'fire' }) },
      { id:'o12', name:'PROTECTION', slot:'passive', tier:3, pos:[1,3], cost:8, req:['o03'],
        desc:'DMG TAKEN -25%.', maxLv:1, effect:(p,lv)=>{ p.dmgReduction=(p.dmgReduction||0)+0.25; } },
      { id:'o13', name:'SUNRAY', slot:'lmb', tier:4, pos:[0,4], cost:13, req:['o11'],
        cd:lv=>0.8, mp:lv=>10, desc:'REPLACE LMB. HOLY BEAM.',
        cast: shot('fire', { dmg:lv=>30+lv*7, speed:400, r:3, life:0.8, pierce:true, sfx:'ice' }) },
      { id:'o14', name:'JURY', slot:'e', tier:4, pos:[2,4], cost:12, req:['o09'],
        cd:lv=>9, mp:lv=>26, desc:'E SKILL. 3 JUDGMENT BOLTS.',
        cast: (p,ang,lv)=>{
          const target = entities.enemies.slice(0,3);
          for (const e of target) {
            const a = angleTo(p, e);
            entities.bullets.push({ x:p.x, y:p.y, vx:Math.cos(a)*260, vy:Math.sin(a)*260,
              r:3, dmg:(35+lv*8)*p.baseDmg, life:1.5, kind:'fire', hits:0, pierce:true });
          }
          sfx('ice');
        } },
      { id:'o15', name:'FROZEN TIME', slot:'e', tier:4, pos:[1,4], cost:14, req:['o07','o10'],
        cd:lv=>14, mp:lv=>30, desc:'E SKILL. FREEZE TIME 3S.',
        cast: (p,ang,lv)=>{ timeStopT = 3+lv*0.4; state.shake=8; showMsg('TIME STOP'); sfx('parry'); } },
      { id:'o16', name:'PURIFY', slot:'passive', tier:4, pos:[3,4], cost:10, req:['o05'],
        desc:'IMMUNE TO SLOW/STUN.', maxLv:1, effect:(p,lv)=>{ p.perks.push('purify'); } },
      { id:'o17', name:'JUDGE', slot:'passive', tier:4, pos:[0,5], cost:10, req:['o05'],
        desc:'ALL DMG +25%.', maxLv:1, effect:(p,lv)=>{ p.baseDmg*=1.25; } },
      { id:'o18', name:'DIVINITY', slot:'passive', tier:4, pos:[2,5], cost:15, req:['o09','o14'],
        desc:'ULTIMATE. AUTO REVIVE ONCE.', maxLv:1, effect:(p,lv)=>{ p.perks.push('divinity'); p.divinityReady=true; } },
      { id:'o19', name:'SYMPHONY', slot:'passive', tier:4, pos:[1,5], cost:14, req:['o12','o11'],
        desc:'ALL SKILL DMG +30%.', maxLv:1, effect:(p,lv)=>{ p.baseDmg*=1.30; } },
      { id:'o20', name:'LAST STAND', slot:'passive', tier:4, pos:[3,5], cost:13, req:['o12','o16'],
        desc:'ULTIMATE. HP 1: INVULN 5S.', maxLv:1, effect:(p,lv)=>{ p.perks.push('laststand'); p.lastStandReady=true; } },
      { id:'o21', name:'SMITE', slot:'lmb', tier:1, pos:[0,6], cost:6, req:['o20'],
        cd:lv=>0.3, mp:lv=>5, desc:'HOLY STRIKE.', maxLv:3,
        cast: shot('fire', {dmg:l=>12+l*4,speed:180,r:3,life:1.3}) },
      { id:'o22', name:'JUDGEMENT', slot:'q', tier:1, pos:[1,6], cost:8, req:['o21'],
        cd:lv=>1.2, mp:lv=>18, desc:'JUDGE PIERCE.', maxLv:3,
        cast: shot('fire', {dmg:l=>35+l*8,speed:250,r:3,life:1.5,pierce:true}) },
      { id:'o23', name:'BLESS', slot:'passive', tier:1, pos:[2,6], cost:10, req:['o22'],
        desc:'+5 HP REGEN.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.hpRegen=(p.hpRegen||0)+5;})(p); } },
      { id:'o24', name:'SANCTUARY', slot:'e', tier:1, pos:[3,6], cost:12, req:['o23'],
        cd:lv=>4.0, mp:lv=>35, desc:'HEAL NOVA.', maxLv:3,
        cast: shot('fire', {count:16,dmg:l=>10+l*3,speed:180,r:2,life:1,spread:6.28}) },
      { id:'o25', name:'GUARD', slot:'passive', tier:1, pos:[4,6], cost:14, req:['o24'],
        desc:'+20% RES.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.dmgReduction=(p.dmgReduction||0)+0.20;})(p); } },
      { id:'o26', name:'DAWNBREAK', slot:'q', tier:1, pos:[0,7], cost:16, req:['o25'],
        cd:lv=>1.2, mp:lv=>18, desc:'LIGHT ARROW.', maxLv:3,
        cast: shot('fire', {dmg:l=>40+l*10,speed:280,r:3,life:1.5,pierce:true}) },
      { id:'o27', name:'REVIVE', slot:'passive', tier:1, pos:[1,7], cost:18, req:['o26'],
        desc:'SURVIVE FATAL.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.perks.push("phoenix");})(p); } },
      { id:'o28', name:'SEAL', slot:'e', tier:2, pos:[2,7], cost:20, req:['o27'],
        cd:lv=>4.0, mp:lv=>35, desc:'STUN ALL.', maxLv:3,
        cast: shot('ice', {count:16,dmg:l=>15+l*4,speed:200,r:2,life:1,spread:6.28,freeze:2}) },
      { id:'o29', name:'PRAYER', slot:'passive', tier:2, pos:[3,7], cost:22, req:['o28'],
        desc:'MP +5/S.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.mpRegenBonus=(p.mpRegenBonus||0)+5;})(p); } },
      { id:'o30', name:'DIVINITY', slot:'passive', tier:2, pos:[4,7], cost:24, req:['o29'],
        desc:'+30% RES.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.dmgReduction=(p.dmgReduction||0)+0.30;})(p); } },
      { id:'o31', name:'CRUSADE', slot:'e', tier:2, pos:[0,8], cost:26, req:['o30'],
        cd:lv=>4.0, mp:lv=>35, desc:'LIGHT LINE.', maxLv:3,
        cast: shot('fire', {dmg:l=>60+l*15,speed:350,r:5,life:1.5,pierce:true}) },
      { id:'o32', name:'SHIELDING', slot:'passive', tier:2, pos:[1,8], cost:28, req:['o31'],
        desc:'+50 HP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxHp+=50;p.hp+=50;})(p); } },
      { id:'o33', name:'WRATH', slot:'lmb', tier:2, pos:[2,8], cost:30, req:['o32'],
        cd:lv=>0.3, mp:lv=>5, desc:'HOLY HAMMER.', maxLv:3,
        cast: shot('fire', {dmg:l=>15+l*5,speed:150,r:4,life:1.4}) },
      { id:'o34', name:'SERAPHIM', slot:'e', tier:2, pos:[3,8], cost:32, req:['o33'],
        cd:lv=>4.0, mp:lv=>35, desc:'8 HOMING ARROWS.', maxLv:3,
        cast: shot('fire', {count:8,dmg:l=>25+l*6,speed:180,r:2,life:2,spread:6.28,homing:true}) },
      { id:'o35', name:'VOW', slot:'passive', tier:3, pos:[4,8], cost:34, req:['o34'],
        desc:'+30% CRIT.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.crit=(p.crit||0)+0.30;})(p); } },
      { id:'o36', name:'ABSOLVE', slot:'passive', tier:3, pos:[0,9], cost:36, req:['o35'],
        desc:'+3 REGEN.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.hpRegen=(p.hpRegen||0)+3;})(p); } },
      { id:'o37', name:'MARTYR', slot:'passive', tier:3, pos:[1,9], cost:38, req:['o36'],
        desc:'LOW HP +DMG.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.perks.push("berserk");})(p); } },
      { id:'o38', name:'DAYSTAR', slot:'e', tier:3, pos:[2,9], cost:40, req:['o37'],
        cd:lv=>4.0, mp:lv=>35, desc:'SOLAR PILLAR.', maxLv:3,
        cast: shot('fire', {count:12,dmg:l=>50+l*12,speed:100,r:3,life:1.5,spread:6.28}) },
      { id:'o39', name:'SILENCE', slot:'passive', tier:3, pos:[3,9], cost:42, req:['o38'],
        desc:'+15% RES.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.dmgReduction=(p.dmgReduction||0)+0.15;})(p); } },
      { id:'o40', name:'ARCHANGEL', slot:'passive', tier:3, pos:[4,9], cost:44, req:['o39'],
        desc:'ULT. +100 HP+DMG.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxHp+=100;p.hp+=100;p.baseDmg*=1.5;})(p); } },
      { id:'o41', name:'DEVOTION', slot:'passive', tier:3, pos:[5,0], cost:46, req:['o40'],
        desc:'+40 MP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.maxMp+=40;p.mp+=40;})(p); } },
      { id:'o42', name:'LIGHTLANCE', slot:'q', tier:4, pos:[5,1], cost:48, req:['o41'],
        cd:lv=>1.2, mp:lv=>18, desc:'PIERCE BEAM.', maxLv:3,
        cast: shot('fire', {dmg:l=>45+l*11,speed:320,r:3,life:1.4,pierce:true}) },
      { id:'o43', name:'HOSANNA', slot:'e', tier:4, pos:[5,2], cost:50, req:['o42'],
        cd:lv=>4.0, mp:lv=>35, desc:'360 BURST.', maxLv:3,
        cast: shot('fire', {count:12,dmg:l=>25+l*6,speed:200,r:2,life:1.5,spread:6.28}) },
      { id:'o44', name:'REDEMPTION', slot:'passive', tier:4, pos:[5,3], cost:52, req:['o43'],
        desc:'KILLS +3 HP.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.lifesteal=(p.lifesteal||0)+3;})(p); } },
      { id:'o45', name:'CONVICTION', slot:'passive', tier:4, pos:[5,4], cost:54, req:['o44'],
        desc:'+20% DMG.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.baseDmg*=1.20;})(p); } },
      { id:'o46', name:'ORISON', slot:'q', tier:4, pos:[5,5], cost:56, req:['o45'],
        cd:lv=>1.2, mp:lv=>18, desc:'BLESSED VOLLEY.', maxLv:3,
        cast: shot('fire', {count:3,dmg:l=>20+l*5,speed:230,r:2,life:1.3,spread:0.25}) },
      { id:'o47', name:'HALO', slot:'passive', tier:4, pos:[5,6], cost:58, req:['o46'],
        desc:'+10 THORNS.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.thorns=(p.thorns||0)+10;})(p); } },
      { id:'o48', name:'ARK', slot:'e', tier:4, pos:[5,7], cost:60, req:['o47'],
        cd:lv=>4.0, mp:lv=>35, desc:'MASSIVE BEAM.', maxLv:3,
        cast: shot('fire', {dmg:l=>150+l*30,speed:400,r:6,life:1.2,pierce:true}) },
      { id:'o49', name:'GRACE', slot:'passive', tier:4, pos:[5,8], cost:62, req:['o48'],
        desc:'+15% RES.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.dmgReduction=(p.dmgReduction||0)+0.15;})(p); } },
      { id:'o50', name:'LIGHT', slot:'passive', tier:4, pos:[5,9], cost:64, req:['o49'],
        desc:'ULT. +10 HP REGEN.', maxLv:1,
        effect:(p,lv)=>{ (p=>{p.hpRegen=(p.hpRegen||0)+10;})(p); } },

    ]
  },
};

// 인덱스: 모든 스킬을 id로 조회
const SKILL_BY_ID = {};
for (const cat of Object.keys(SKILL_TREE)) {
  for (const s of SKILL_TREE[cat].skills) {
    s.category = cat;
    SKILL_BY_ID[s.id] = s;
  }
}

// 소유 스킬과 레벨 (영구, 저장)
state.ownedSkills = state.ownedSkills || { 'm01': 1 };  // 시작 시 파이어볼 소유
state.equippedSlots = state.equippedSlots || { lmb:'m01', q:null, e:null };

// (구 gaa_skills 로드 제거 - 이제 계정별 blob에서 로드함. 파일 하단에서
//  account 있으면 loadAccountData() 호출)

function saveProgress() {
  // 계정별 통합 저장으로 리다이렉트
  saveAccountData();
}

// 스킬 소유 여부
function ownsSkill(id) { return state.ownedSkills[id] > 0; }
function skillLevel(id) { return state.ownedSkills[id] || 0; }
function canBuySkill(s) {
  const lv = skillLevel(s.id);
  const maxLv = s.maxLv || 1;
  if (lv >= maxLv) return false;
  if (state.research < s.cost) return false;
  // MAX/ULTRA 스킬 게이트
  if (s.isUltra) {
    // 2단계 시련 통과 필요
    if (!(state.ultraCleared && state.ultraCleared[s.category])) return false;
    if (typeof categoryAllMaxMaxed === 'function' && !categoryAllMaxMaxed(s.category)) return false;
  } else if (s.isMax) {
    if (!(state.trialCleared && state.trialCleared[s.category])) return false;
    if (typeof categoryFullyMaxed === 'function' && !categoryFullyMaxed(s.category)) return false;
  }
  if (s.req.length === 0) return true;
  for (const r of s.req) if (!ownsSkill(r)) return false;
  return true;
}

// 시전
function castSlot(p, slotName, ang) {
  const skillId = p.slots[slotName];
  if (!skillId) return false;
  const s = SKILL_BY_ID[skillId];
  if (!s || !s.cast) return false;
  const lv = state.ownedSkills[skillId] || 1;
  const mpCost = Math.ceil(_resolve(s.mp, lv, 0) * (p.mpCostMult || 1));
  if (p.mp < mpCost) return false;
  if (p.cd[skillId] > 0) return false;
  const cdMul = (slotName === 'lmb' ? (p.mods.lmbCd || 1) : 1);
  let baseCd = _resolve(s.cd, lv, 0) * (p.cdMult || 1) * cdMul;
  if (hasPerk('erratic') && Math.random() < 0.25) baseCd = 0;
  else {
    const chainStack = countPerk('chain');
    if (chainStack > 0 && Math.random() < Math.min(1, 0.20 * chainStack)) baseCd = 0;
  }
  p.mp -= mpCost;
  p.cd[skillId] = baseCd;
  _currentCastSlot = slotName;
  _currentCastVisual = SKILL_VISUAL[skillId] || null;
  try { s.cast(p, ang, lv); } finally { _currentCastSlot = null; _currentCastVisual = null; }
  return true;
}

