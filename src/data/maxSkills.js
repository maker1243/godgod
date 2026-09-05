// =====================================================================
// MAX Skills - 각 종파의 모든 기본 스킬을 MAX 로 찍었을 때 열리는 최강 스킬 트리
// 해금 조건:
//   1) 해당 종파의 모든 기본 스킬을 MAX 레벨까지 소유
//   2) 도서관에서 Z → "시련의 방"(특별 던전) 진입
//   3) 60초 안에 시련 클리어 → state.maxUnlocked = true
//      실패 시 아카데미로 추방 + 5분 재도전 쿨다운 (state.trialBanUntil)
// 각 종파당 25개 (5x5 그리드): lmb 5, q 5, e 5, passive 10.
// =====================================================================

const MAX_TRIAL_TIME_SEC = 60;          // 시련 제한 시간
const MAX_TRIAL_BAN_MS = 5 * 60 * 1000; // 실패 시 재도전 쿨다운 (5분)

// 종파별 MAX 스킬 정의. 심연/신 학살자 티어(잡몹 HP 1M+)를 견딜 수 있도록 데미지 스케일 매우 큼.
// 스킬 pos = [col(0-4), row(0-4)] - 5x5 그리드
// tier = 9 (기본 4보다 위, UI 에서 구분)
// cost 는 500~2500 RP 사이.

function _mk(id, name, slot, pos, cost, castFn, effectFn, opts) {
  opts = opts || {};
  return {
    id, name, slot, tier: 9, pos, cost,
    req: [],
    maxLv: opts.maxLv || 5,
    cd: typeof opts.cd === 'function' ? opts.cd : (lv => opts.cd == null ? 4 : opts.cd),
    mp: typeof opts.mp === 'function' ? opts.mp : (lv => opts.mp == null ? 40 : opts.mp),
    desc: opts.desc || '',
    cast: castFn || undefined,
    effect: effectFn || undefined,
    isMax: true,
  };
}

// 카테고리별 스킬 배열 (SKILL_TREE 에 삽입될 것)
const MAX_SKILLS = {
  magic: [
    // LMB (rapid) - 5개
    _mk('mx_m01', 'STAR SPARK',    'lmb', [0,0],  600,  shot('fire', {dmg:l=>800+l*400,   speed:280, r:2, life:0.9, sfx:'fire'}),                                                       null, {cd:0.15, mp:3,  desc:'REPLACE LMB. FAST STARFIRE.'}),
    _mk('mx_m02', 'PRISMATIC RAY', 'lmb', [1,0],  700,  shot('fire', {dmg:l=>1200+l*600,  speed:400, r:3, life:0.8, pierce:true, sfx:'ice'}),                                          null, {cd:0.2,  mp:4,  desc:'PIERCING PRISM.'}),
    _mk('mx_m03', 'VOID DART',     'lmb', [2,0],  800,  shot('ice',  {dmg:l=>1500+l*700,  speed:340, r:2, life:1.0, count:3, spread:0.15, freeze:0.8}),                                null, {cd:0.25, mp:5,  desc:'3-WAY VOID DARTS. FREEZE.'}),
    _mk('mx_m04', 'NEBULA BOLT',   'lmb', [3,0],  1000, shot('fire', {dmg:l=>2000+l*900,  speed:260, r:3, life:1.4, homing:true, explosive:true, explodeR:20}),                        null, {cd:0.3,  mp:6,  desc:'HOMING EXPLOSIVE ORB.'}),
    _mk('mx_m05', 'ETERNAL EMBER', 'lmb', [4,0],  1400, shot('fire', {dmg:l=>3500+l*1500, speed:220, r:4, life:1.8, count:5, spread:0.4, bounces:3, pierce:true, explosive:true, explodeR:24}), null, {cd:0.4, mp:10, desc:'5-WAY BOUNCING PYRE.'}),
    // Q (heavy) - 5개
    _mk('mx_m06', 'CELESTIAL LANCE',    'q', [0,1],  700,  shot('ice',  {dmg:l=>8000+l*3500,   speed:340, r:3, life:2, pierce:true}),                                                     null, {cd:1.2, mp:22, desc:'PIERCING STAR LANCE.'}),
    _mk('mx_m07', 'FROST CATACLYSM',    'q', [1,1],  900,  shot('ice',  {dmg:l=>12000+l*5000,  speed:280, r:5, life:2.5, freeze:2.5, count:3, spread:0.35}),                             null, {cd:1.5, mp:28, desc:'3 FROST COMETS. FREEZE 2.5S.'}),
    _mk('mx_m08', 'ARCANE PIERCE',      'q', [2,1],  1100, shot('fire', {dmg:l=>18000+l*7000,  speed:500, r:2, life:1.4, pierce:true, instant:true}),                                     null, {cd:1.8, mp:30, desc:'INSTANT PIERCING LANCE.'}),
    _mk('mx_m09', 'ICE COMET',          'q', [3,1],  1400, shot('ice',  {dmg:l=>25000+l*10000, speed:220, r:6, life:3, explosive:true, explodeR:60, freeze:3}),                          null, {cd:2.0, mp:38, desc:'MASSIVE ICE COMET.'}),
    _mk('mx_m10', 'ELDER FLAME',        'q', [4,1],  1800, shot('fire', {dmg:l=>40000+l*15000, speed:180, r:8, life:3.5, count:2, spread:0.15, explosive:true, explodeR:80, homing:true}), null, {cd:2.5, mp:50, desc:'TWIN DRAGONS. HOMING.'}),
    // E (ultimate) - 5개
    _mk('mx_m11', 'GALACTIC WINTER',    'e', [0,2],  1200, shot('ice',  {dmg:l=>15000+l*6000,  speed:150, r:4, life:3, count:24, spread:6.28, freeze:4}),                                 null, {cd:6,   mp:60, desc:'FULL FREEZE NOVA (24 SHARDS).'}),
    _mk('mx_m12', 'STAR ANNIHILATOR',   'e', [1,2],  1600, shot('fire', {dmg:l=>50000+l*20000, speed:200, r:6, life:3, count:20, spread:6.28, explosive:true, explodeR:60}),              null, {cd:8,   mp:80, desc:'20-WAY EXPLOSIVE NOVA.'}),
    _mk('mx_m13', 'TIME COLLAPSE',      'e', [2,2],  2000, null, null, {cd:12, mp:60, desc:'FREEZE TIME 6S. STATE SHAKE.',
      cast: (p,ang,lv)=>{ timeStopT = 6 + lv*0.6; state.shake = 14; showMsg('TIME COLLAPSE', 2); sfx('parry'); } }),
    _mk('mx_m14', 'ARCANE SINGULARITY', 'e', [3,2],  2200, shot('fire', {dmg:l=>80000+l*35000, speed:100, r:10, life:4, count:6, spread:0.9, homing:true, explosive:true, explodeR:100}), null, {cd:10, mp:90, desc:'BLACK HOLE - HOMING + BIG EXPLODE.'}),
    _mk('mx_m15', 'PRIMORDIAL DAWN',    'e', [4,2],  2500, shot('fire', {dmg:l=>150000+l*60000,speed:250, r:8, life:4, count:32, spread:6.28, explosive:true, explodeR:70, pierce:true}), null, {cd:14, mp:120, desc:'ULT. 32 STAR SHARDS + PIERCE.'}),
    // PASSIVE - 10개
    _mk('mx_m16', 'MANA BATTERY',    'passive', [0,3], 500,  null, (p,lv)=>{ p.maxMp += 200; p.mp += 200; },                                {desc:'MAX MP +200.',   maxLv:1}),
    _mk('mx_m17', 'ARCHMAGIC',       'passive', [1,3], 800,  null, (p,lv)=>{ p.mods.fire = (p.mods.fire||1) * 2.0; p.mods.ice = (p.mods.ice||1) * 2.0; }, {desc:'ALL MAGIC DMG x2.', maxLv:1}),
    _mk('mx_m18', 'SPELL FUSION',    'passive', [2,3], 900,  null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.5; },                             {desc:'ALL CD -50%.', maxLv:1}),
    _mk('mx_m19', 'ETERNAL LEARNING','passive', [3,3], 1000, null, (p,lv)=>{ p.mpCostMult = (p.mpCostMult||1) * 0.4; },                     {desc:'MP COST -60%.', maxLv:1}),
    _mk('mx_m20', 'ICE ETERNITY',    'passive', [4,3], 700,  null, (p,lv)=>{ p.perks.push('icefreeze'); p.perks.push('icefreeze'); p.perks.push('icepierce'); }, {desc:'ICE FREEZE x3 + PIERCE.', maxLv:1}),
    _mk('mx_m21', 'FIRE ETERNITY',   'passive', [0,4], 700,  null, (p,lv)=>{ p.perks.push('firemult'); p.perks.push('firemult'); },        {desc:'FIRE +4 PROJECTILES.',   maxLv:1}),
    _mk('mx_m22', 'ARCANE MASTERY',  'passive', [1,4], 1200, null, (p,lv)=>{ p.baseDmg *= 2.5; },                                            {desc:'BASE DMG x2.5.',   maxLv:1}),
    _mk('mx_m23', 'ELEMENTAL SYNERGY','passive',[2,4], 1000, null, (p,lv)=>{ p.crit = (p.crit||0) + 0.5; p.critMult = (p.critMult||2) * 1.5; }, {desc:'+50% CRIT, +50% CRIT DMG.', maxLv:1}),
    _mk('mx_m24', 'MANA ABYSS',      'passive', [3,4], 1400, null, (p,lv)=>{ p.perks.push('overflow'); p.perks.push('manaburn'); p.perks.push('mpsiphon'); }, {desc:'OVERFLOW + MANABURN + SIPHON.', maxLv:1}),
    _mk('mx_m25', 'PRIMEVAL FONT',   'passive', [4,4], 2000, null, (p,lv)=>{ p.maxHp += 400; p.hp += 400; p.hpRegen = (p.hpRegen||0) + 10; p.mpRegenBonus = (p.mpRegenBonus||0) + 10; }, {desc:'ULT. +400 HP, +10 HP/S, +10 MP/S.', maxLv:1}),
  ],

  engineering: [
    _mk('mx_e01', 'PROTON RIFLE',     'lmb', [0,0], 600,  shot('fire', {dmg:l=>1000+l*500,  speed:400, r:2, life:0.9, sfx:'fire'}),                                                   null, {cd:0.15, mp:3,  desc:'REPLACE LMB. FAST PROTON.'}),
    _mk('mx_e02', 'GATLING X',        'lmb', [1,0], 700,  shot('fire', {dmg:l=>500+l*300,   speed:340, r:1, life:0.6, count:2, spread:0.15}),                                          null, {cd:0.1,  mp:2,  desc:'INSANE ROF DUAL.'}),
    _mk('mx_e03', 'TESLA STORM',      'lmb', [2,0], 900,  shot('fire', {dmg:l=>2000+l*900,  speed:500, r:2, life:0.8, count:3, spread:0.3, instant:true, pierce:true}),                null, {cd:0.3,  mp:6,  desc:'3-WAY INSTANT LIGHTNING.'}),
    _mk('mx_e04', 'ANTIMATTER CANNON','lmb', [3,0], 1200, shot('fire', {dmg:l=>3500+l*1500, speed:280, r:3, life:1.4, homing:true, pierce:true}),                                     null, {cd:0.4,  mp:8,  desc:'HOMING PIERCING BOLT.'}),
    _mk('mx_e05', 'RAILGUN OMEGA',    'lmb', [4,0], 1600, shot('fire', {dmg:l=>8000+l*3500, speed:600, r:3, life:1.2, pierce:true, instant:true}),                                     null, {cd:0.6,  mp:12, desc:'HEAVY SNIPE. INSTANT.'}),

    _mk('mx_e06', 'FUSION SLUG',      'q', [0,1], 800,  shot('fire', {dmg:l=>15000+l*6000,  speed:300, r:4, life:1.8, pierce:true, explosive:true, explodeR:30}),                       null, {cd:1.2, mp:22, desc:'FUSION ROUND. PIERCE + BOOM.'}),
    _mk('mx_e07', 'ION LANCE',        'q', [1,1], 1000, shot('ice',  {dmg:l=>22000+l*9000,  speed:420, r:3, life:1.6, pierce:true, freeze:1.5}),                                       null, {cd:1.4, mp:26, desc:'ION FREEZE LANCE.'}),
    _mk('mx_e08', 'ORBITAL RAILGUN',  'q', [2,1], 1300, shot('fire', {dmg:l=>35000+l*14000, speed:700, r:4, life:1.5, pierce:true, instant:true}),                                     null, {cd:2.0, mp:35, desc:'ORBITAL SNIPE.'}),
    _mk('mx_e09', 'PHOTON PIERCER',   'q', [3,1], 1500, shot('fire', {dmg:l=>50000+l*20000, speed:800, r:3, life:1.2, pierce:true, instant:true, count:2, spread:0.1}),                null, {cd:2.2, mp:40, desc:'TWIN PHOTON SPEARS.'}),
    _mk('mx_e10', 'GAUSS OMEGA',      'q', [4,1], 2000, shot('fire', {dmg:l=>80000+l*30000, speed:600, r:5, life:2, pierce:true, count:3, spread:0.05, explosive:true, explodeR:25}), null, {cd:2.5, mp:50, desc:'3 GAUSS + EXPLODE.'}),

    _mk('mx_e11', 'NUKE',             'e', [0,2], 1400, shot('fire', {dmg:l=>200000+l*80000, speed:120, r:12, life:2, explosive:true, explodeR:150, count:1}),                          null, {cd:12, mp:100, desc:'ULT. NUCLEAR STRIKE. POISON RADIUS.',
      /* 폭발 + 독장판 (독 = 지속 데미지 몹) */ }),
    _mk('mx_e12', 'ORBITAL STRIKE',   'e', [1,2], 1600, shot('fire', {dmg:l=>150000+l*60000, speed:500, r:8, life:2, explosive:true, explodeR:80, count:5, spread:0.4}),                null, {cd:10, mp:80, desc:'5 ORBITAL LASERS.'}),
    _mk('mx_e13', 'PLASMA STORM',     'e', [2,2], 1800, shot('fire', {dmg:l=>60000+l*25000, speed:200, r:4, life:3, count:30, spread:6.28, explosive:true, explodeR:30}),               null, {cd:9,  mp:75, desc:'30-WAY PLASMA NOVA.'}),
    _mk('mx_e14', 'EMP DEVASTATOR',   'e', [3,2], 2100, shot('ice',  {dmg:l=>50000+l*20000, speed:300, r:4, life:2.5, count:20, spread:6.28, freeze:5}),                                null, {cd:10, mp:80, desc:'GLOBAL EMP FREEZE 5S.'}),
    _mk('mx_e15', 'WMD RAIN',         'e', [4,2], 2500, shot('fire', {dmg:l=>120000+l*45000, speed:180, r:6, life:3, count:16, spread:6.28, explosive:true, explodeR:60, homing:true}), null, {cd:14, mp:110, desc:'ULT. 16 HOMING NUKES.'}),

    _mk('mx_e16', 'MECH ARMOR',      'passive', [0,3], 700,  null, (p,lv)=>{ p.maxHp += 500; p.hp += 500; p.dmgReduction = (p.dmgReduction||0) + 0.3; }, {desc:'+500 HP, +30% RES.', maxLv:1}),
    _mk('mx_e17', 'OVERCLOCK CORE',  'passive', [1,3], 900,  null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.4; p.speed *= 1.3; },              {desc:'CD -60%, SPD +30%.', maxLv:1}),
    _mk('mx_e18', 'NANITE REPAIR',   'passive', [2,3], 800,  null, (p,lv)=>{ p.hpRegen = (p.hpRegen||0) + 12; p.lifesteal = (p.lifesteal||0) + 6; }, {desc:'+12 REGEN, +6 LIFESTEAL.', maxLv:1}),
    _mk('mx_e19', 'CRIT LENS',       'passive', [3,3], 1000, null, (p,lv)=>{ p.crit = (p.crit||0) + 0.6; p.critMult = (p.critMult||2) + 2; }, {desc:'+60% CRIT, +2x CRIT MULT.', maxLv:1}),
    _mk('mx_e20', 'ARMOR MK-5',      'passive', [4,3], 800,  null, (p,lv)=>{ p.thorns = (p.thorns||0) + 40; },                              {desc:'THORNS +40.', maxLv:1}),
    _mk('mx_e21', 'POWER CORE',      'passive', [0,4], 1000, null, (p,lv)=>{ p.baseDmg *= 2; },                                              {desc:'BASE DMG x2.', maxLv:1}),
    _mk('mx_e22', 'TITAN FRAME',     'passive', [1,4], 1400, null, (p,lv)=>{ p.maxHp += 1000; p.hp += 1000; },                              {desc:'ULT. +1000 HP.', maxLv:1}),
    _mk('mx_e23', 'WEAPON MASTERY',  'passive', [2,4], 1200, null, (p,lv)=>{ p.mods.lmbCd = (p.mods.lmbCd||1) * 0.3; p.mods.lmbDmg = (p.mods.lmbDmg||1) * 1.8; }, {desc:'LMB CD -70%, DMG x1.8.', maxLv:1}),
    _mk('mx_e24', 'KINETIC PIERCE',  'passive', [3,4], 900,  null, (p,lv)=>{ p.perks.push('lmbpierce'); p.perks.push('bouncy'); p.perks.push('bouncy'); }, {desc:'LMB PIERCE + 5 BOUNCES.', maxLv:1}),
    _mk('mx_e25', 'LEGENDARY BUILD', 'passive', [4,4], 2200, null, (p,lv)=>{ p.baseDmg *= 1.5; p.maxHp += 800; p.hp += 800; p.dmgReduction = (p.dmgReduction||0) + 0.4; p.cdMult = (p.cdMult||1) * 0.6; }, {desc:'ULT. +DMG +HP +RES +CD.', maxLv:1}),
  ],

  nature: [
    _mk('mx_n01', 'THORN VOLLEY', 'lmb', [0,0], 600,  shot('fire', {dmg:l=>1200+l*500,  speed:280, r:2, life:0.9, count:4, spread:0.2}),                                              null, {cd:0.2, mp:4, desc:'4 THORNS.'}),
    _mk('mx_n02', 'LEAF STORM',   'lmb', [1,0], 700,  shot('ice',  {dmg:l=>900+l*400,   speed:220, r:2, life:1.4, count:6, spread:0.5, freeze:0.4}),                                  null, {cd:0.25, mp:5, desc:'6 FREEZING LEAVES.'}),
    _mk('mx_n03', 'VINE WHIP',    'lmb', [2,0], 900,  shot('fire', {dmg:l=>1800+l*800,  speed:180, r:3, life:1.6, pierce:true, bounces:2}),                                            null, {cd:0.3,  mp:6, desc:'PIERCING BOUNCING VINE.'}),
    _mk('mx_n04', 'BLOOM SPARK',  'lmb', [3,0], 1200, shot('fire', {dmg:l=>3000+l*1200, speed:260, r:3, life:1.4, explosive:true, explodeR:30, homing:true}),                          null, {cd:0.4,  mp:8, desc:'BLOOMING HOMING SPARK.'}),
    _mk('mx_n05', 'LIVING SHOT',  'lmb', [4,0], 1500, shot('fire', {dmg:l=>4500+l*1800, speed:220, r:3, life:2.0, count:3, spread:0.4, homing:true, bounces:3}),                        null, {cd:0.5,  mp:12, desc:'3 HOMING SEEDS.'}),

    _mk('mx_n06', 'EARTHSHAKER',  'q', [0,1], 900,  shot('fire', {dmg:l=>18000+l*7000, speed:200, r:6, life:2.5, count:5, spread:0.6, explosive:true, explodeR:40}),                    null, {cd:1.5, mp:26, desc:'GROUND SHAKER.'}),
    _mk('mx_n07', 'ENTS ROOT',    'q', [1,1], 1100, shot('ice',  {dmg:l=>25000+l*10000, speed:300, r:4, life:2, pierce:true, freeze:2.5}),                                              null, {cd:1.6, mp:30, desc:'ENT ROOT SPEAR.'}),
    _mk('mx_n08', 'GIANT ACORN',  'q', [2,1], 1300, shot('fire', {dmg:l=>35000+l*14000, speed:180, r:8, life:3, explosive:true, explodeR:60, bounces:3}),                               null, {cd:2.0, mp:38, desc:'HEAVY BOUNCING ACORN.'}),
    _mk('mx_n09', 'BEAR PAW',     'q', [3,1], 1500, shot('fire', {dmg:l=>55000+l*20000, speed:260, r:5, life:1.8, count:3, spread:0.25, knockback:12}),                                 null, {cd:2.2, mp:42, desc:'3 BEAR CLAWS.'}),
    _mk('mx_n10', 'TIGER FANG',   'q', [4,1], 2000, shot('fire', {dmg:l=>90000+l*35000, speed:340, r:5, life:2, pierce:true, count:2, spread:0.1, homing:true}),                        null, {cd:2.5, mp:50, desc:'PIERCING HOMING FANGS.'}),

    _mk('mx_n11', 'GAIAS WRATH',      'e', [0,2], 1500, shot('fire', {dmg:l=>80000+l*32000, speed:200, r:5, life:3, count:24, spread:6.28, explosive:true, explodeR:50}),               null, {cd:9,  mp:80, desc:'24-WAY GAIA STRIKE.'}),
    _mk('mx_n12', 'PRIMORDIAL BLOOM', 'e', [1,2], 1800, shot('ice',  {dmg:l=>60000+l*25000, speed:150, r:6, life:3.5, count:20, spread:6.28, freeze:4, homing:true}),                   null, {cd:10, mp:90, desc:'20 FREEZING BLOOMS.'}),
    _mk('mx_n13', 'ANCIENT FOREST',   'e', [2,2], 2000, shot('fire', {dmg:l=>100000+l*40000, speed:100, r:8, life:4, count:16, spread:6.28, explosive:true, explodeR:80}),              null, {cd:11, mp:95, desc:'16 ANCIENT TREES ERUPT.'}),
    _mk('mx_n14', 'WORLD TREE',       'e', [3,2], 2300, null, null, {cd:14, mp:100, desc:'HEAL + INVULN 5S + AURA.',
      cast: (p,ang,lv)=>{ p.hp = p.maxHp; p.invuln = 5 + lv*0.4; state.shake = 10; showMsg('WORLD TREE', 2); sfx('level');
        for (let i = 0; i < 20; i++) { const a = (i/20)*Math.PI*2; entities.bullets.push({x:p.x, y:p.y, vx:Math.cos(a)*180, vy:Math.sin(a)*180, r:4, dmg:(80000+lv*30000)*p.baseDmg, life:2, kind:'fire', hits:0, explosive:true, explodeR:40}); }
      } }),
    _mk('mx_n15', 'TSUNAMI',          'e', [4,2], 2500, shot('ice',  {dmg:l=>200000+l*80000, speed:300, r:10, life:4, count:12, spread:0.5, freeze:3, pierce:true}),                    null, {cd:13, mp:110, desc:'ULT. TSUNAMI WALL.'}),

    _mk('mx_n16', 'LIFES FONT',       'passive', [0,3], 800,  null, (p,lv)=>{ p.maxHp += 800; p.hp += 800; p.hpRegen = (p.hpRegen||0) + 20; }, {desc:'+800 HP, +20 REGEN.', maxLv:1}),
    _mk('mx_n17', 'NATURES BLESSING', 'passive', [1,3], 700,  null, (p,lv)=>{ p.perks.push('rebirth'); p.rebirthReady = true; },              {desc:'AUTO-REVIVE ONCE.', maxLv:1}),
    _mk('mx_n18', 'THORN MASTER',     'passive', [2,3], 900,  null, (p,lv)=>{ p.thorns = (p.thorns||0) + 80; },                               {desc:'THORNS +80.', maxLv:1}),
    _mk('mx_n19', 'REGEN BODY',       'passive', [3,3], 1000, null, (p,lv)=>{ p.hpRegen = (p.hpRegen||0) + 30; p.mpRegenBonus = (p.mpRegenBonus||0) + 12; }, {desc:'+30 HP/S, +12 MP/S.', maxLv:1}),
    _mk('mx_n20', 'GAIAS GIFT',       'passive', [4,3], 1200, null, (p,lv)=>{ p.perks.push('bountiful'); p.perks.push('magnet'); },           {desc:'BOUNTIFUL + MAGNET.', maxLv:1}),
    _mk('mx_n21', 'SEED OF LIFE',     'passive', [0,4], 1100, null, (p,lv)=>{ p.lifesteal = (p.lifesteal||0) + 15; },                         {desc:'LIFESTEAL +15/HIT.', maxLv:1}),
    _mk('mx_n22', 'DRUID SOUL',       'passive', [1,4], 1300, null, (p,lv)=>{ p.baseDmg *= 1.8; p.perks.push('seeker'); },                    {desc:'DMG x1.8 + SEEKER.', maxLv:1}),
    _mk('mx_n23', 'HARMONY',          'passive', [2,4], 1000, null, (p,lv)=>{ p.perks.push('balance'); p.perks.push('circlelife'); },         {desc:'BALANCE + CIRCLE OF LIFE.', maxLv:1}),
    _mk('mx_n24', 'WILD SPIRIT',      'passive', [3,4], 1400, null, (p,lv)=>{ p.speed *= 1.4; p.dmgReduction = (p.dmgReduction||0) + 0.25; }, {desc:'SPD +40%, RES +25%.', maxLv:1}),
    _mk('mx_n25', 'ETERNAL GROWTH',   'passive', [4,4], 2200, null, (p,lv)=>{ p.maxHp += 1500; p.hp += 1500; p.baseDmg *= 1.5; p.hpRegen = (p.hpRegen||0) + 25; }, {desc:'ULT. +1500 HP, x1.5 DMG.', maxLv:1}),
  ],

  chaos: [
    _mk('mx_c01', 'CHAOS SPARK',   'lmb', [0,0], 600,  shot('fire', {dmg:l=>900+l*450,   speed:280, r:2, life:0.9, count:2, spread:0.35, bounces:2}),                                  null, {cd:0.2, mp:4, desc:'ERRATIC BOUNCE.'}),
    _mk('mx_c02', 'MADNESS SHOT',  'lmb', [1,0], 800,  shot('fire', {dmg:l=>1500+l*700,  speed:260, r:2, life:1.2, homing:true}),                                                     null, {cd:0.25, mp:5, desc:'MADDENING HOMING.'}),
    _mk('mx_c03', 'WARP SPARK',    'lmb', [2,0], 1000, shot('fire', {dmg:l=>2500+l*1100, speed:400, r:2, life:0.7, count:3, spread:0.3, pierce:true}),                                 null, {cd:0.3,  mp:6, desc:'3-WAY PIERCE.'}),
    _mk('mx_c04', 'ENTROPY BOLT',  'lmb', [3,0], 1300, shot('fire', {dmg:l=>3500+l*1500, speed:220, r:3, life:1.4, explosive:true, explodeR:25, homing:true}),                          null, {cd:0.4,  mp:8, desc:'HOMING EXPLODE.'}),
    _mk('mx_c05', 'VOID SPARK',    'lmb', [4,0], 1600, shot('fire', {dmg:l=>5500+l*2200, speed:260, r:3, life:1.6, count:5, spread:0.5, bounces:4, pierce:true}),                       null, {cd:0.5,  mp:12, desc:'5-WAY CHAOS BOUNCE.'}),

    _mk('mx_c06', 'REALITY TEAR',  'q', [0,1], 900,  shot('fire', {dmg:l=>16000+l*6500, speed:280, r:4, life:2, pierce:true, count:2, spread:0.2}),                                     null, {cd:1.4, mp:24, desc:'REALITY TEAR TWIN.'}),
    _mk('mx_c07', 'VOID LANCE',    'q', [1,1], 1100, shot('ice',  {dmg:l=>25000+l*10000, speed:340, r:3, life:1.8, pierce:true, freeze:2}),                                             null, {cd:1.5, mp:28, desc:'FREEZING VOID LANCE.'}),
    _mk('mx_c08', 'CHAOS PIERCE',  'q', [2,1], 1300, shot('fire', {dmg:l=>40000+l*16000, speed:500, r:3, life:1.4, pierce:true, count:3, spread:0.15, instant:true}),                   null, {cd:2.0, mp:35, desc:'INSTANT 3-BURST.'}),
    _mk('mx_c09', 'MADNESS COMET', 'q', [3,1], 1600, shot('fire', {dmg:l=>60000+l*24000, speed:200, r:6, life:2.5, explosive:true, explodeR:60, bounces:3, homing:true}),               null, {cd:2.3, mp:44, desc:'MAD COMET (HOMING + BOUNCE + BOOM).'}),
    _mk('mx_c10', 'ENTROPY LANCE', 'q', [4,1], 2000, shot('fire', {dmg:l=>95000+l*38000, speed:400, r:5, life:2, pierce:true, count:2, spread:0.05, explosive:true, explodeR:35}),      null, {cd:2.5, mp:50, desc:'TWIN ENTROPY.'}),

    _mk('mx_c11', 'VOID RIP',              'e', [0,2], 1400, shot('fire', {dmg:l=>100000+l*40000, speed:180, r:8, life:3, count:20, spread:6.28, explosive:true, explodeR:60, homing:true}), null, {cd:10, mp:85, desc:'20-WAY VOID RIP.'}),
    _mk('mx_c12', 'ENTROPY WAVE',          'e', [1,2], 1700, shot('ice',  {dmg:l=>70000+l*28000, speed:220, r:5, life:3, count:32, spread:6.28, freeze:3}),                              null, {cd:9,  mp:80, desc:'FULL 32-SHARD FREEZE.'}),
    _mk('mx_c13', 'DIMENSIONAL COLLAPSE',  'e', [2,2], 2000, shot('fire', {dmg:l=>150000+l*60000, speed:100, r:10, life:4, count:8, spread:0.8, explosive:true, explodeR:120, homing:true}), null, {cd:12, mp:100, desc:'8 HUGE DIMENSIONAL RUPTURES.'}),
    _mk('mx_c14', 'CHAOS INCARNATE',       'e', [3,2], 2200, shot('fire', {dmg:l=>180000+l*70000, speed:260, r:6, life:3, count:40, spread:6.28, explosive:true, explodeR:50, bounces:2, homing:true}), null, {cd:14, mp:110, desc:'40 CHAOS ORBS.'}),
    _mk('mx_c15', 'ABYSSAL EXPUNGE',       'e', [4,2], 2500, shot('fire', {dmg:l=>300000+l*120000, speed:150, r:12, life:4, count:6, spread:0.6, explosive:true, explodeR:180}),         null, {cd:16, mp:130, desc:'ULT. ABYSSAL WIPE.'}),

    _mk('mx_c16', 'VOID HEART',      'passive', [0,3], 800,  null, (p,lv)=>{ p.maxHp += 400; p.hp += 400; p.perks.push('sacrifice'); },      {desc:'+400 HP, SACRIFICE STACKS.', maxLv:1}),
    _mk('mx_c17', 'CHAOS FURY',      'passive', [1,3], 1000, null, (p,lv)=>{ p.baseDmg *= 2.2; p.perks.push('doubleornothing'); },           {desc:'DMG x2.2, D/N ON HIT.', maxLv:1}),
    _mk('mx_c18', 'ENTROPY LORE',    'passive', [2,3], 900,  null, (p,lv)=>{ p.perks.push('erratic'); p.perks.push('erratic'); },            {desc:'25% CD RESET x2.', maxLv:1}),
    _mk('mx_c19', 'MADNESS INSIGHT', 'passive', [3,3], 1200, null, (p,lv)=>{ p.crit = (p.crit||0) + 0.8; p.critMult = (p.critMult||2) * 2; }, {desc:'+80% CRIT, x2 CRIT DMG.', maxLv:1}),
    _mk('mx_c20', 'REALITY BREAK',   'passive', [4,3], 1400, null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.35; },                             {desc:'CD -65%.', maxLv:1}),
    _mk('mx_c21', 'WARP MASTER',     'passive', [0,4], 1000, null, (p,lv)=>{ p.speed *= 1.5; p.perks.push('multiroll'); p.perks.push('multiroll'); }, {desc:'SPD +50%, ROLL CD -75%.', maxLv:1}),
    _mk('mx_c22', 'ABYSS EMBRACE',   'passive', [1,4], 1300, null, (p,lv)=>{ p.perks.push('berserk'); p.perks.push('berserk'); },            {desc:'DOUBLE BERSERK.', maxLv:1}),
    _mk('mx_c23', 'CHAOS ORACLE',    'passive', [2,4], 1100, null, (p,lv)=>{ p.perks.push('chain'); p.perks.push('chain'); p.perks.push('chain'); }, {desc:'CHAIN x3 (60% RESET).', maxLv:1}),
    _mk('mx_c24', 'VOID GAZE',       'passive', [3,4], 1500, null, (p,lv)=>{ p.perks.push('splitshot'); p.perks.push('splitshot'); p.perks.push('splitshot'); }, {desc:'LMB +6 PROJECTILES.', maxLv:1}),
    _mk('mx_c25', 'PRIMAL CHAOS',    'passive', [4,4], 2200, null, (p,lv)=>{ p.baseDmg *= 2; p.cdMult = (p.cdMult||1) * 0.5; p.perks.push('erratic'); p.perks.push('sacrifice'); }, {desc:'ULT. x2 DMG, -50% CD.', maxLv:1}),
  ],

  order: [
    _mk('mx_o01', 'DIVINE SPARK',    'lmb', [0,0], 700,  shot('fire', {dmg:l=>1400+l*600,  speed:300, r:2, life:1.0, count:2, spread:0.15}),                                            null, {cd:0.2, mp:4, desc:'HOLY DUAL SPARK.'}),
    _mk('mx_o02', 'LAW BOLT',        'lmb', [1,0], 900,  shot('fire', {dmg:l=>2000+l*900,  speed:400, r:2, life:0.9, pierce:true}),                                                     null, {cd:0.25, mp:5, desc:'PIERCING LAW.'}),
    _mk('mx_o03', 'JUDGMENT SHOT',   'lmb', [2,0], 1100, shot('fire', {dmg:l=>3200+l*1300, speed:320, r:2, life:1.2, homing:true, count:3, spread:0.2}),                                 null, {cd:0.3,  mp:6, desc:'3 HOMING JUDGE.'}),
    _mk('mx_o04', 'HOLY DART',       'lmb', [3,0], 1300, shot('fire', {dmg:l=>4500+l*1800, speed:340, r:2, life:1.0, count:4, spread:0.3, pierce:true}),                                 null, {cd:0.4,  mp:8, desc:'4 HOLY DARTS.'}),
    _mk('mx_o05', 'RIGHTEOUS RAY',   'lmb', [4,0], 1600, shot('fire', {dmg:l=>7000+l*2800, speed:600, r:3, life:1.4, pierce:true, instant:true, count:2, spread:0.05}),                  null, {cd:0.5,  mp:10, desc:'TWIN INSTANT RAY.'}),

    _mk('mx_o06', 'DIVINE LANCE',    'q', [0,1], 900,  shot('fire', {dmg:l=>20000+l*8000,  speed:340, r:3, life:2, pierce:true}),                                                       null, {cd:1.3, mp:24, desc:'PIERCING DIVINE LANCE.'}),
    _mk('mx_o07', 'LAW HAMMER',      'q', [1,1], 1100, shot('fire', {dmg:l=>30000+l*12000, speed:220, r:5, life:2, knockback:20, explosive:true, explodeR:40}),                          null, {cd:1.6, mp:30, desc:'HAMMER OF LAW.'}),
    _mk('mx_o08', 'JUDGMENT COMET',  'q', [2,1], 1400, shot('fire', {dmg:l=>45000+l*18000, speed:280, r:5, life:2.5, count:3, spread:0.25, homing:true}),                                null, {cd:1.8, mp:36, desc:'3 HOMING JUDGES.'}),
    _mk('mx_o09', 'SACRED PIERCE',   'q', [3,1], 1700, shot('fire', {dmg:l=>70000+l*28000, speed:600, r:3, life:1.6, pierce:true, instant:true, count:2, spread:0.03}),                  null, {cd:2.0, mp:40, desc:'TWIN INSTANT SPEAR.'}),
    _mk('mx_o10', 'HOLY LIGHTNING',  'q', [4,1], 2000, shot('fire', {dmg:l=>110000+l*44000, speed:800, r:3, life:1.2, pierce:true, instant:true, count:4, spread:0.15}),                 null, {cd:2.4, mp:50, desc:'4 HOLY BOLTS.'}),

    _mk('mx_o11', 'FINAL VERDICT',   'e', [0,2], 1500, shot('fire', {dmg:l=>120000+l*48000, speed:150, r:8, life:3, count:16, spread:6.28, explosive:true, explodeR:60, homing:true}),   null, {cd:11, mp:95, desc:'16 HOMING VERDICTS.'}),
    _mk('mx_o12', 'HEAVENS GATE',    'e', [1,2], 1800, shot('fire', {dmg:l=>80000+l*32000, speed:200, r:6, life:3.5, count:30, spread:6.28, explosive:true, explodeR:50}),               null, {cd:10, mp:85, desc:'30 HOLY MOTES.'}),
    _mk('mx_o13', 'DIVINE JUDGMENT', 'e', [2,2], 2000, null, null, {cd:13, mp:100, desc:'DAMAGE ALL ENEMIES. HEAL SELF.',
      cast: (p,ang,lv)=>{ const D = (100000 + lv*40000) * p.baseDmg; for (const e of entities.enemies) { e.hp -= D; e.hitFlash = 0.2; spawnFloat(e.x, e.y-6, Math.ceil(D), '#ffefa8'); } p.hp = Math.min(p.maxHp, p.hp + 200); state.shake = 12; showMsg('DIVINE JUDGMENT', 2); sfx('level'); } }),
    _mk('mx_o14', 'ARCH ANGEL',      'e', [3,2], 2300, shot('fire', {dmg:l=>180000+l*70000, speed:340, r:6, life:2.5, count:12, spread:0.6, pierce:true, homing:true}),                  null, {cd:12, mp:105, desc:'12 ANGELIC BLADES.'}),
    _mk('mx_o15', 'LAW ETERNAL',     'e', [4,2], 2500, shot('fire', {dmg:l=>250000+l*100000, speed:400, r:6, life:3, count:8, spread:0.4, pierce:true, instant:true, explosive:true, explodeR:80}), null, {cd:14, mp:120, desc:'ULT. 8 INSTANT JUDGES + AOE.'}),

    _mk('mx_o16', 'HALO',           'passive', [0,3], 800,  null, (p,lv)=>{ p.dmgReduction = (p.dmgReduction||0) + 0.35; },                  {desc:'RES +35%.', maxLv:1}),
    _mk('mx_o17', 'DIVINE ARMOR',   'passive', [1,3], 1000, null, (p,lv)=>{ p.maxHp += 700; p.hp += 700; p.dmgReduction = (p.dmgReduction||0) + 0.2; }, {desc:'+700 HP, RES +20%.', maxLv:1}),
    _mk('mx_o18', 'LAW MASTER',     'passive', [2,3], 900,  null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.45; },                              {desc:'CD -55%.', maxLv:1}),
    _mk('mx_o19', 'JUSTICE CORE',   'passive', [3,3], 1100, null, (p,lv)=>{ p.baseDmg *= 2; },                                                {desc:'DMG x2.', maxLv:1}),
    _mk('mx_o20', 'HOLY BODY',      'passive', [4,3], 1200, null, (p,lv)=>{ p.hpRegen = (p.hpRegen||0) + 15; p.perks.push('manashield'); },  {desc:'+15 REGEN + MANA SHIELD.', maxLv:1}),
    _mk('mx_o21', 'ANGELIC AURA',   'passive', [0,4], 900,  null, (p,lv)=>{ p.perks.push('reflect'); p.perks.push('reflect'); },              {desc:'PARRY REFLECT x2.', maxLv:1}),
    _mk('mx_o22', 'DIVINE WILL',    'passive', [1,4], 1300, null, (p,lv)=>{ p.perks.push('divinity'); p.divinityReady = true; },              {desc:'AUTO FULL-HEAL ONCE.', maxLv:1}),
    _mk('mx_o23', 'LAWFUL GAZE',    'passive', [2,4], 1000, null, (p,lv)=>{ p.crit = (p.crit||0) + 0.4; p.critMult = (p.critMult||2) + 1; }, {desc:'+40% CRIT, +1x CRIT.', maxLv:1}),
    _mk('mx_o24', 'RIGHTEOUS SOUL', 'passive', [3,4], 1400, null, (p,lv)=>{ p.mods.fire = (p.mods.fire||1) * 1.6; p.mods.ice = (p.mods.ice||1) * 1.6; }, {desc:'ALL ELEMENT DMG x1.6.', maxLv:1}),
    _mk('mx_o25', 'ORDERS BLESSING','passive', [4,4], 2200, null, (p,lv)=>{ p.baseDmg *= 1.5; p.maxHp += 1200; p.hp += 1200; p.dmgReduction = (p.dmgReduction||0) + 0.3; p.perks.push('laststand'); p.lastStandReady = true; }, {desc:'ULT. HP + DMG + RES + LAST STAND.', maxLv:1}),
  ],
};

// =====================================================================
// ULTRA MAX 확장 - 각 종파에 15개 추가 (pos 행 5-7 사용). 티어 최상위 난이도
// (특이점~창조주) 상대로 실효 있는 데미지 스케일.
// =====================================================================
const ULTRA_MAX_SKILLS = {
  magic: [
    _mk('mx_m26', 'SUPERNOVA BLAST', 'lmb', [0,5], 2000, shot('fire', {dmg:l=>15000+l*6000,  speed:400, r:4, life:1.4, count:4, spread:0.2, pierce:true, explosive:true, explodeR:30}),                    null, {cd:0.4, mp:8,  desc:'ULTRA LMB. 4-WAY NOVA.'}),
    _mk('mx_m27', 'GAMMA RAY',       'lmb', [1,5], 2400, shot('fire', {dmg:l=>25000+l*10000, speed:700, r:3, life:1.2, pierce:true, instant:true}),                                                          null, {cd:0.5, mp:10, desc:'INSTANT PIERCING RAY.'}),
    _mk('mx_m28', 'COSMIC STRING',   'q',   [2,5], 2600, shot('ice',  {dmg:l=>200000+l*80000, speed:300, r:4, life:2.5, pierce:true, freeze:5, count:3, spread:0.15}),                                       null, {cd:1.5, mp:35, desc:'3 COSMIC STRINGS. 5S FREEZE.'}),
    _mk('mx_m29', 'ARCANE MONOLITH', 'q',   [3,5], 2800, shot('fire', {dmg:l=>500000+l*200000, speed:400, r:5, life:2, pierce:true, explosive:true, explodeR:80}),                                            null, {cd:2.0, mp:50, desc:'MONOLITH IMPACT.'}),
    _mk('mx_m30', 'PULSAR',          'e',   [4,5], 3200, shot('fire', {dmg:l=>1000000+l*400000, speed:180, r:8, life:4, count:36, spread:6.28, explosive:true, explodeR:60, homing:true}),                    null, {cd:12, mp:110, desc:'ULT. 36-WAY PULSAR NOVA.'}),
    _mk('mx_m31', 'DIMENSIONAL RIFT','e',   [0,6], 3400, null, null, {cd:14, mp:120, desc:'FREEZE TIME 10S + MASSIVE RAIN.',
      cast: (p,ang,lv)=>{ timeStopT = 10 + lv*0.5; state.shake = 20; showMsg('DIMENSIONAL RIFT', 2); sfx('parry');
        for (let i = 0; i < 60; i++) { const a = (i/60) * Math.PI * 2; entities.bullets.push({x:p.x, y:p.y, vx:Math.cos(a)*200, vy:Math.sin(a)*200, r:5, dmg:(500000+lv*200000)*p.baseDmg, life:3, kind:'fire', hits:0, explosive:true, explodeR:50, homing:true}); }
      }}),
    _mk('mx_m32', 'BIG BANG',        'e',   [1,6], 3800, shot('fire', {dmg:l=>3000000+l*1200000, speed:250, r:12, life:4, count:48, spread:6.28, explosive:true, explodeR:100, pierce:true}),                 null, {cd:16, mp:150, desc:'ULT. 48-WAY BIG BANG.'}),
    _mk('mx_m33', 'MANA OCEAN',      'passive', [2,6], 2500, null, (p,lv)=>{ p.maxMp += 1000; p.mp += 1000; p.mpRegenBonus = (p.mpRegenBonus||0) + 30; },              {desc:'+1000 MP, +30 REGEN.',   maxLv:1}),
    _mk('mx_m34', 'GOD TIER',        'passive', [3,6], 3000, null, (p,lv)=>{ p.baseDmg *= 5; },                                                                         {desc:'BASE DMG x5.', maxLv:1}),
    _mk('mx_m35', 'INSTANT CAST',    'passive', [4,6], 2800, null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.15; },                                                        {desc:'CD -85%.', maxLv:1}),
    _mk('mx_m36', 'CRIT LORD',       'passive', [0,7], 2600, null, (p,lv)=>{ p.crit = (p.crit||0) + 1.5; p.critMult = (p.critMult||2) * 3; },                          {desc:'+150% CRIT, x3 MULT.', maxLv:1}),
    _mk('mx_m37', 'ELEMENTAL GOD',   'passive', [1,7], 3200, null, (p,lv)=>{ p.mods.fire = (p.mods.fire||1) * 4; p.mods.ice = (p.mods.ice||1) * 4; },                  {desc:'FIRE/ICE x4.', maxLv:1}),
    _mk('mx_m38', 'ETERNAL ARCANE',  'passive', [2,7], 3500, null, (p,lv)=>{ p.perks.push('overflow'); p.perks.push('overflow'); p.perks.push('manaburn'); p.perks.push('manaburn'); }, {desc:'OVERFLOW x2 + MANABURN x2.', maxLv:1}),
    _mk('mx_m39', 'ARCANE OMNIPOTENCE','passive', [3,7], 4000, null, (p,lv)=>{ p.baseDmg *= 3; p.cdMult = (p.cdMult||1) * 0.3; p.mpCostMult = (p.mpCostMult||1) * 0.2; }, {desc:'DMG x3, CD -70%, MP -80%.', maxLv:1}),
    _mk('mx_m40', 'ASCENSION',       'passive', [4,7], 5000, null, (p,lv)=>{ p.baseDmg *= 4; p.maxHp += 3000; p.hp += 3000; p.maxMp += 2000; p.mp += 2000; p.dmgReduction = (p.dmgReduction||0) + 0.4; p.cdMult = (p.cdMult||1) * 0.4; }, {desc:'ULT. ASCEND. DMGx4 HP+3k MP+2k RES+40%.', maxLv:1}),
  ],
  engineering: [
    _mk('mx_e26', 'ANTIMATTER RIFLE','lmb', [0,5], 2000, shot('fire', {dmg:l=>18000+l*7000,  speed:500, r:3, life:1.2, pierce:true, explosive:true, explodeR:25}),                                            null, {cd:0.4, mp:8,  desc:'PIERCING ANTIMATTER.'}),
    _mk('mx_e27', 'QUANTUM CANNON',  'lmb', [1,5], 2500, shot('fire', {dmg:l=>30000+l*12000, speed:800, r:3, life:1.0, pierce:true, instant:true, count:2, spread:0.05}),                                     null, {cd:0.5, mp:12, desc:'TWIN QUANTUM SHOT.'}),
    _mk('mx_e28', 'SINGULARITY GUN', 'q',   [2,5], 2800, shot('fire', {dmg:l=>300000+l*120000, speed:400, r:5, life:2, pierce:true, explosive:true, explodeR:60, count:3, spread:0.15}),                      null, {cd:1.5, mp:38, desc:'3 SINGULARITY ROUNDS.'}),
    _mk('mx_e29', 'RAILGUN GOD',     'q',   [3,5], 3200, shot('fire', {dmg:l=>600000+l*250000, speed:1000, r:4, life:1.5, pierce:true, instant:true, count:2, spread:0.03}),                                  null, {cd:2.0, mp:45, desc:'INSTANT ORBITAL RAILGUN.'}),
    _mk('mx_e30', 'ATOMIC BOMB',     'e',   [4,5], 3800, shot('fire', {dmg:l=>2500000+l*1000000, speed:100, r:14, life:3, explosive:true, explodeR:200}),                                                     null, {cd:14, mp:130, desc:'ULT. NUCLEAR ANNIHILATION.'}),
    _mk('mx_e31', 'ORBITAL BOMBARD', 'e',   [0,6], 3200, shot('fire', {dmg:l=>1500000+l*600000, speed:300, r:8, life:2.5, count:20, spread:0.9, explosive:true, explodeR:80, homing:true}),                   null, {cd:12, mp:110, desc:'20 HOMING ORBITAL STRIKES.'}),
    _mk('mx_e32', 'DOOMSDAY',        'e',   [1,6], 4200, shot('fire', {dmg:l=>4000000+l*1500000, speed:200, r:10, life:3, count:32, spread:6.28, explosive:true, explodeR:100, homing:true}),                 null, {cd:16, mp:160, desc:'ULT. DOOMSDAY DEVICE.'}),
    _mk('mx_e33', 'GOD ARMOR',       'passive', [2,6], 3000, null, (p,lv)=>{ p.maxHp += 3000; p.hp += 3000; p.dmgReduction = (p.dmgReduction||0) + 0.5; },              {desc:'+3000 HP, +50% RES.', maxLv:1}),
    _mk('mx_e34', 'TITAN CORE',      'passive', [3,6], 3500, null, (p,lv)=>{ p.baseDmg *= 4; p.crit = (p.crit||0) + 1; },                                                {desc:'DMG x4, +100% CRIT.', maxLv:1}),
    _mk('mx_e35', 'CYBERNETIC',      'passive', [4,6], 2800, null, (p,lv)=>{ p.speed *= 2; p.cdMult = (p.cdMult||1) * 0.25; },                                          {desc:'SPD x2, CD -75%.', maxLv:1}),
    _mk('mx_e36', 'PLASMA SHIELD',   'passive', [0,7], 2500, null, (p,lv)=>{ p.thorns = (p.thorns||0) + 200; p.perks.push('manashield'); },                             {desc:'THORNS +200 + MANA SHIELD.', maxLv:1}),
    _mk('mx_e37', 'NANO SWARM',      'passive', [1,7], 3200, null, (p,lv)=>{ p.hpRegen = (p.hpRegen||0) + 50; p.lifesteal = (p.lifesteal||0) + 30; },                   {desc:'+50 REGEN, +30 LIFESTEAL.', maxLv:1}),
    _mk('mx_e38', 'RAILGUN MASTERY', 'passive', [2,7], 3500, null, (p,lv)=>{ p.mods.lmbCd = (p.mods.lmbCd||1) * 0.1; p.mods.lmbDmg = (p.mods.lmbDmg||1) * 3; p.perks.push('lmbpierce'); }, {desc:'LMB CD -90%, DMG x3, PIERCE.', maxLv:1}),
    _mk('mx_e39', 'OMNI TECH',       'passive', [3,7], 4000, null, (p,lv)=>{ p.baseDmg *= 2.5; p.cdMult = (p.cdMult||1) * 0.4; p.maxHp += 2000; p.hp += 2000; },        {desc:'DMG x2.5, CD -60%, +2000 HP.', maxLv:1}),
    _mk('mx_e40', 'INDUSTRIAL GOD',  'passive', [4,7], 5000, null, (p,lv)=>{ p.baseDmg *= 3; p.maxHp += 5000; p.hp += 5000; p.dmgReduction = (p.dmgReduction||0) + 0.6; p.cdMult = (p.cdMult||1) * 0.2; p.crit = (p.crit||0) + 1; }, {desc:'ULT. INDUSTRIAL DEITY.', maxLv:1}),
  ],
  nature: [
    _mk('mx_n26', 'PRIMAL THORN',    'lmb', [0,5], 2000, shot('fire', {dmg:l=>16000+l*6500, speed:280, r:3, life:1.4, count:6, spread:0.3, pierce:true, bounces:3}),                                          null, {cd:0.4, mp:8,  desc:'6-WAY BOUNCING THORNS.'}),
    _mk('mx_n27', 'LIFE STORM',      'lmb', [1,5], 2400, shot('ice',  {dmg:l=>22000+l*9000, speed:300, r:2, life:1.5, count:8, spread:0.4, freeze:1, homing:true}),                                            null, {cd:0.5, mp:10, desc:'8 FREEZING SEEKERS.'}),
    _mk('mx_n28', 'GAIA SPEAR',      'q',   [2,5], 2800, shot('fire', {dmg:l=>350000+l*140000, speed:400, r:5, life:2, pierce:true, count:3, spread:0.2}),                                                    null, {cd:1.5, mp:35, desc:'3 GAIA SPEARS.'}),
    _mk('mx_n29', 'WORLD ROOT',      'q',   [3,5], 3200, shot('ice',  {dmg:l=>600000+l*240000, speed:250, r:6, life:3, freeze:4, count:2, spread:0.1, pierce:true}),                                          null, {cd:2.0, mp:45, desc:'WORLD-ROOT LANCE.'}),
    _mk('mx_n30', 'BIOSPHERE',       'e',   [4,5], 3800, shot('fire', {dmg:l=>1800000+l*700000, speed:200, r:8, life:3.5, count:24, spread:6.28, explosive:true, explodeR:80, homing:true}),                   null, {cd:12, mp:120, desc:'ULT. LIVING BIOSPHERE.'}),
    _mk('mx_n31', 'GAIA REBIRTH',    'e',   [0,6], 3400, null, null, {cd:16, mp:120, desc:'HEAL + INVULN + WORLD-END EXPLOSION.',
      cast: (p,ang,lv)=>{ p.hp = p.maxHp; p.invuln = 8 + lv*0.5; state.shake = 16; showMsg('GAIA REBIRTH', 2); sfx('level');
        for (let i = 0; i < 40; i++) { const a = (i/40) * Math.PI * 2; entities.bullets.push({x:p.x, y:p.y, vx:Math.cos(a)*220, vy:Math.sin(a)*220, r:6, dmg:(1500000+lv*600000)*p.baseDmg, life:3, kind:'fire', hits:0, explosive:true, explodeR:80}); }
      }}),
    _mk('mx_n32', 'PRIMAL AVATAR',   'e',   [1,6], 4200, shot('fire', {dmg:l=>3500000+l*1300000, speed:280, r:10, life:3.5, count:20, spread:0.6, pierce:true, homing:true, explosive:true, explodeR:60}), null, {cd:14, mp:145, desc:'ULT. AVATAR OF NATURE.'}),
    _mk('mx_n33', 'BLESSED BODY',    'passive', [2,6], 3000, null, (p,lv)=>{ p.maxHp += 4000; p.hp += 4000; p.hpRegen = (p.hpRegen||0) + 80; },                          {desc:'+4000 HP, +80 REGEN.', maxLv:1}),
    _mk('mx_n34', 'IMMORTALITY',     'passive', [3,6], 3500, null, (p,lv)=>{ p.perks.push('rebirth'); p.rebirthReady = true; p.perks.push('laststand'); p.lastStandReady = true; p.perks.push('divinity'); p.divinityReady = true; }, {desc:'TRIPLE REVIVE.', maxLv:1}),
    _mk('mx_n35', 'GAIA HEART',      'passive', [4,6], 2800, null, (p,lv)=>{ p.baseDmg *= 3; p.lifesteal = (p.lifesteal||0) + 50; },                                    {desc:'DMG x3, +50 LIFESTEAL.', maxLv:1}),
    _mk('mx_n36', 'THORN TITAN',     'passive', [0,7], 2500, null, (p,lv)=>{ p.thorns = (p.thorns||0) + 500; },                                                          {desc:'THORNS +500.', maxLv:1}),
    _mk('mx_n37', 'WILD FURY',       'passive', [1,7], 3200, null, (p,lv)=>{ p.speed *= 2; p.crit = (p.crit||0) + 1; p.perks.push('seeker'); },                          {desc:'SPD x2, +100% CRIT, SEEKER.', maxLv:1}),
    _mk('mx_n38', 'SEED OF WORLDS',  'passive', [2,7], 3500, null, (p,lv)=>{ p.maxHp += 2000; p.hp += 2000; p.baseDmg *= 2; p.hpRegen = (p.hpRegen||0) + 60; },          {desc:'HP+2k, DMGx2, REGEN+60.', maxLv:1}),
    _mk('mx_n39', 'ETERNAL FOREST',  'passive', [3,7], 4000, null, (p,lv)=>{ p.baseDmg *= 2.5; p.cdMult = (p.cdMult||1) * 0.4; p.dmgReduction = (p.dmgReduction||0) + 0.35; }, {desc:'DMGx2.5, CD-60%, RES+35%.', maxLv:1}),
    _mk('mx_n40', 'GAIA APOTHEOSIS', 'passive', [4,7], 5000, null, (p,lv)=>{ p.baseDmg *= 4; p.maxHp += 8000; p.hp += 8000; p.hpRegen = (p.hpRegen||0) + 100; p.dmgReduction = (p.dmgReduction||0) + 0.5; p.lifesteal = (p.lifesteal||0) + 40; }, {desc:'ULT. BECOME GAIA.', maxLv:1}),
  ],
  chaos: [
    _mk('mx_c26', 'VOID SHOT',       'lmb', [0,5], 2000, shot('fire', {dmg:l=>20000+l*8000,  speed:340, r:3, life:1.4, count:5, spread:0.4, bounces:5, pierce:true}),                                          null, {cd:0.4, mp:8,  desc:'5-WAY VOID PIERCE.'}),
    _mk('mx_c27', 'MADNESS BURST',   'lmb', [1,5], 2400, shot('fire', {dmg:l=>28000+l*11000, speed:280, r:4, life:1.6, count:6, spread:0.6, homing:true, explosive:true, explodeR:20}),                        null, {cd:0.5, mp:10, desc:'6 HOMING MADNESS.'}),
    _mk('mx_c28', 'REALITY BREAK',   'q',   [2,5], 2800, shot('fire', {dmg:l=>400000+l*160000, speed:500, r:5, life:2, pierce:true, count:3, spread:0.15, explosive:true, explodeR:50}),                       null, {cd:1.5, mp:38, desc:'3 REALITY TEARS.'}),
    _mk('mx_c29', 'VOID SPEAR',      'q',   [3,5], 3200, shot('ice',  {dmg:l=>700000+l*280000, speed:600, r:4, life:1.8, pierce:true, freeze:3, count:2, spread:0.08}),                                        null, {cd:2.0, mp:45, desc:'TWIN VOID SPEARS.'}),
    _mk('mx_c30', 'ABYSSAL VOID',    'e',   [4,5], 3800, shot('fire', {dmg:l=>2200000+l*900000, speed:150, r:14, life:4, count:8, spread:0.7, explosive:true, explodeR:200, homing:true}),                     null, {cd:14, mp:130, desc:'ULT. ABYSSAL SINGULARITY.'}),
    _mk('mx_c31', 'CHAOS INCARNATE II','e', [0,6], 3600, shot('fire', {dmg:l=>1500000+l*600000, speed:300, r:6, life:3, count:60, spread:6.28, explosive:true, explodeR:40, bounces:3, homing:true}),           null, {cd:12, mp:120, desc:'60 CHAOS ORBS.'}),
    _mk('mx_c32', 'ENDING',          'e',   [1,6], 4500, shot('fire', {dmg:l=>5000000+l*2000000, speed:220, r:12, life:4, count:48, spread:6.28, explosive:true, explodeR:120, pierce:true}),                   null, {cd:18, mp:180, desc:'ULT. THE ENDING.'}),
    _mk('mx_c33', 'VOID BODY',       'passive', [2,6], 3000, null, (p,lv)=>{ p.maxHp += 2500; p.hp += 2500; p.perks.push('sacrifice'); p.perks.push('sacrifice'); },     {desc:'HP+2500, SACRIFICE x2.', maxLv:1}),
    _mk('mx_c34', 'CHAOS INSANITY',  'passive', [3,6], 3500, null, (p,lv)=>{ p.baseDmg *= 4; p.perks.push('doubleornothing'); p.perks.push('doubleornothing'); },        {desc:'DMG x4, D/N x2.', maxLv:1}),
    _mk('mx_c35', 'ENTROPY LORD',    'passive', [4,6], 2800, null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.15; p.perks.push('erratic'); p.perks.push('erratic'); p.perks.push('erratic'); }, {desc:'CD-85%, ERRATIC x3.', maxLv:1}),
    _mk('mx_c36', 'MADNESS GAZE',    'passive', [0,7], 2500, null, (p,lv)=>{ p.crit = (p.crit||0) + 2; p.critMult = (p.critMult||2) * 4; },                              {desc:'+200% CRIT, x4 MULT.', maxLv:1}),
    _mk('mx_c37', 'VOID EMBRACE',    'passive', [1,7], 3200, null, (p,lv)=>{ p.perks.push('berserk'); p.perks.push('berserk'); p.perks.push('berserk'); },               {desc:'TRIPLE BERSERK.', maxLv:1}),
    _mk('mx_c38', 'CHAOS ORACLE II', 'passive', [2,7], 3500, null, (p,lv)=>{ p.perks.push('chain'); p.perks.push('chain'); p.perks.push('chain'); p.perks.push('chain'); p.perks.push('chain'); }, {desc:'CHAIN x5.', maxLv:1}),
    _mk('mx_c39', 'REALITY BROKEN',  'passive', [3,7], 4000, null, (p,lv)=>{ p.baseDmg *= 3; p.perks.push('splitshot'); p.perks.push('splitshot'); p.perks.push('splitshot'); }, {desc:'DMG x3, SPLITSHOT x3.', maxLv:1}),
    _mk('mx_c40', 'THE END',         'passive', [4,7], 5000, null, (p,lv)=>{ p.baseDmg *= 5; p.cdMult = (p.cdMult||1) * 0.2; p.crit = (p.crit||0) + 3; p.critMult = (p.critMult||2) * 3; p.perks.push('sacrifice'); p.perks.push('erratic'); }, {desc:'ULT. BE THE END.', maxLv:1}),
  ],
  order: [
    _mk('mx_o26', 'DIVINE VOLLEY',   'lmb', [0,5], 2000, shot('fire', {dmg:l=>18000+l*7000,  speed:400, r:3, life:1.4, count:5, spread:0.25, pierce:true}),                                                    null, {cd:0.4, mp:8,  desc:'5-WAY DIVINE PIERCE.'}),
    _mk('mx_o27', 'HOLY BEAM',       'lmb', [1,5], 2400, shot('fire', {dmg:l=>32000+l*13000, speed:800, r:3, life:1.2, pierce:true, instant:true, count:3, spread:0.1}),                                       null, {cd:0.5, mp:12, desc:'3 INSTANT HOLY BEAMS.'}),
    _mk('mx_o28', 'SACRED SPEAR',    'q',   [2,5], 2800, shot('fire', {dmg:l=>450000+l*180000, speed:500, r:4, life:2, pierce:true, count:3, spread:0.1, homing:true}),                                        null, {cd:1.5, mp:38, desc:'3 HOMING DIVINE SPEARS.'}),
    _mk('mx_o29', 'JUSTICE HAMMER',  'q',   [3,5], 3200, shot('fire', {dmg:l=>800000+l*320000, speed:280, r:6, life:2.5, knockback:30, explosive:true, explodeR:60, count:2, spread:0.15}),                    null, {cd:2.0, mp:45, desc:'TWIN LAW HAMMERS.'}),
    _mk('mx_o30', 'FINAL JUDGMENT+', 'e',   [4,5], 3800, null, null, {cd:14, mp:130, desc:'ULT. ALL ENEMIES x3 DMG + HEAL.',
      cast: (p,ang,lv)=>{ const D = (2000000 + lv*800000) * p.baseDmg; for (const e of entities.enemies) { e.hp -= D * 3; e.hitFlash = 0.3; spawnFloat(e.x, e.y-6, Math.ceil(D*3), '#ffefa8'); } p.hp = Math.min(p.maxHp, p.hp + 1000); state.shake = 18; showMsg('FINAL JUDGMENT', 2); sfx('level'); } }),
    _mk('mx_o31', 'HEAVENS RAY',     'e',   [0,6], 3400, shot('fire', {dmg:l=>1800000+l*720000, speed:400, r:6, life:3, count:24, spread:6.28, pierce:true, homing:true}),                                     null, {cd:12, mp:110, desc:'24-WAY HEAVENS RAY.'}),
    _mk('mx_o32', 'GOD MODE',        'e',   [1,6], 4500, null, null, {cd:18, mp:170, desc:'INVULN 15S + AURA + REGEN.',
      cast: (p,ang,lv)=>{ p.invuln = 15 + lv; p.hp = p.maxHp; state.shake = 12; showMsg('GOD MODE', 3); sfx('level');
        for (let i = 0; i < 32; i++) { const a = (i/32) * Math.PI * 2; entities.bullets.push({x:p.x, y:p.y, vx:Math.cos(a)*260, vy:Math.sin(a)*260, r:5, dmg:(1000000+lv*400000)*p.baseDmg, life:2.5, kind:'fire', hits:0, pierce:true, homing:true}); }
      }}),
    _mk('mx_o33', 'DIVINE BODY',     'passive', [2,6], 3000, null, (p,lv)=>{ p.maxHp += 3500; p.hp += 3500; p.dmgReduction = (p.dmgReduction||0) + 0.4; },              {desc:'+3500 HP, +40% RES.', maxLv:1}),
    _mk('mx_o34', 'DIVINE POWER',    'passive', [3,6], 3500, null, (p,lv)=>{ p.baseDmg *= 4; p.mods.fire = (p.mods.fire||1) * 2; },                                     {desc:'DMG x4, FIRE x2.', maxLv:1}),
    _mk('mx_o35', 'HOLY CORE',       'passive', [4,6], 2800, null, (p,lv)=>{ p.hpRegen = (p.hpRegen||0) + 40; p.perks.push('reflect'); p.perks.push('reflect'); p.perks.push('reflect'); }, {desc:'+40 REGEN, TRIPLE REFLECT.', maxLv:1}),
    _mk('mx_o36', 'JUSTICE EYE',     'passive', [0,7], 2500, null, (p,lv)=>{ p.crit = (p.crit||0) + 1.5; p.critMult = (p.critMult||2) * 2.5; },                          {desc:'+150% CRIT, x2.5 MULT.', maxLv:1}),
    _mk('mx_o37', 'ANGELIC WINGS',   'passive', [1,7], 3200, null, (p,lv)=>{ p.speed *= 1.8; p.perks.push('divinity'); p.divinityReady = true; p.perks.push('rebirth'); p.rebirthReady = true; }, {desc:'SPD x1.8, DIVINITY + REBIRTH.', maxLv:1}),
    _mk('mx_o38', 'LAW ETERNAL II',  'passive', [2,7], 3500, null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.25; p.mpCostMult = (p.mpCostMult||1) * 0.3; },                {desc:'CD-75%, MP-70%.', maxLv:1}),
    _mk('mx_o39', 'DIVINE WILL II',  'passive', [3,7], 4000, null, (p,lv)=>{ p.baseDmg *= 2.5; p.dmgReduction = (p.dmgReduction||0) + 0.35; p.perks.push('laststand'); p.lastStandReady = true; }, {desc:'DMGx2.5, RES+35%, LAST STAND.', maxLv:1}),
    _mk('mx_o40', 'GODHOOD',         'passive', [4,7], 5000, null, (p,lv)=>{ p.baseDmg *= 4; p.maxHp += 6000; p.hp += 6000; p.dmgReduction = (p.dmgReduction||0) + 0.55; p.crit = (p.crit||0) + 1.5; p.critMult = (p.critMult||2) * 2; p.perks.push('divinity'); p.divinityReady = true; p.perks.push('laststand'); p.lastStandReady = true; }, {desc:'ULT. ASCEND TO GODHOOD.', maxLv:1}),
  ],
};
// ULTRA 를 각 카테고리에 병합
for (const cat of Object.keys(ULTRA_MAX_SKILLS)) {
  if (!MAX_SKILLS[cat]) continue;
  for (const s of ULTRA_MAX_SKILLS[cat]) MAX_SKILLS[cat].push(s);
}

// SKILL_TREE 에 등록 + SKILL_BY_ID 인덱스 갱신
for (const cat of Object.keys(MAX_SKILLS)) {
  if (!SKILL_TREE[cat]) continue;
  for (const s of MAX_SKILLS[cat]) {
    s.category = cat;
    SKILL_TREE[cat].skills.push(s);
    SKILL_BY_ID[s.id] = s;
  }
}

// 카테고리의 모든 MAX 스킬(isMax=true, isUltra 제외)이 max 레벨까지 소유되었는지
function categoryAllMaxMaxed(cat) {
  const list = SKILL_TREE[cat] && SKILL_TREE[cat].skills;
  if (!list) return false;
  let hasMax = false;
  for (const s of list) {
    if (!s.isMax || s.isUltra) continue;
    hasMax = true;
    const lv = state.ownedSkills[s.id] || 0;
    const max = s.maxLv || 1;
    if (lv < max) return false;
  }
  return hasMax;   // 하나라도 MAX 스킬이 있어야 true
}

// 카테고리의 모든 기본(비-MAX) 스킬이 max 레벨까지 소유되었는지
function categoryFullyMaxed(cat) {
  const list = SKILL_TREE[cat] && SKILL_TREE[cat].skills;
  if (!list) return false;
  for (const s of list) {
    if (s.isMax) continue;
    const lv = state.ownedSkills[s.id] || 0;
    const max = s.maxLv || 1;
    if (lv < max) return false;
  }
  return true;
}
