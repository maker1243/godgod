// =====================================================================
// ULTRA Skills - 2단계 시련(HP 1e44 보스) 40초 클리어 시 카테고리별 20개 해금
// 종파당 20개 × 5 = 총 100개. MAX 이상의 압도적 배율.
// pos 는 별도 뷰(library.viewMode='ultra')에서 그리므로 자유롭게 0..4 x 0..3 사용.
// =====================================================================

function _mkU(id, name, slot, pos, cost, castFn, effectFn, opts) {
  opts = opts || {};
  return {
    id, name, slot, tier: 10, pos, cost,
    req: [],
    maxLv: opts.maxLv || 5,
    cd: typeof opts.cd === 'function' ? opts.cd : (lv => opts.cd == null ? 4 : opts.cd),
    mp: typeof opts.mp === 'function' ? opts.mp : (lv => opts.mp == null ? 40 : opts.mp),
    desc: opts.desc || '',
    cast: castFn || undefined,
    effect: effectFn || undefined,
    isMax: true,
    isUltra: true,
  };
}

// 20 per category = 4 lmb / 4 q / 4 e / 8 passive
const ULTRA_SKILLS = {
  magic: [
    _mkU('u_m01','QUASAR',       'lmb',[0,0], 5000, shot('fire', {dmg:l=>500000+l*200000, speed:600, r:3, life:1.2, pierce:true, count:3, spread:0.1, instant:true}), null, {cd:0.3, mp:6, desc:'INSTANT 3-QUASAR.'}),
    _mkU('u_m02','MAGIC OMEGA',  'lmb',[1,0], 6000, shot('fire', {dmg:l=>1500000+l*600000, speed:500, r:4, life:1.4, pierce:true, homing:true, count:5, spread:0.3, explosive:true, explodeR:40}), null, {cd:0.45, mp:12, desc:'5 HOMING QUASARS + BOOM.'}),
    _mkU('u_m03','FROSTVOID',    'q',[2,0],   7500, shot('ice',  {dmg:l=>20000000+l*8000000, speed:400, r:5, life:2.5, freeze:8, pierce:true, count:3, spread:0.2}), null, {cd:1.8, mp:50, desc:'3 FROSTVOID LANCES. 8S FREEZE.'}),
    _mkU('u_m04','ETERNAL STAR', 'q',[3,0],   8500, shot('fire', {dmg:l=>50000000+l*20000000, speed:350, r:6, life:2.5, pierce:true, count:2, spread:0.1, explosive:true, explodeR:80, homing:true}), null, {cd:2.2, mp:60, desc:'TWIN ETERNAL STARS.'}),
    _mkU('u_m05','GENESIS',      'e',[4,0],   12000, shot('fire', {dmg:l=>500000000+l*200000000, speed:200, r:14, life:5, count:60, spread:6.28, pierce:true, explosive:true, explodeR:150, homing:true}), null, {cd:16, mp:200, desc:'60-WAY GENESIS BURST.'}),
    _mkU('u_m06','END OF TIME',  'e',[0,1],   14000, null, null, {cd:20, mp:220, desc:'STOP TIME 20S + RAIN OF STARS.',
      cast: (p,ang,lv)=>{ timeStopT = 20 + lv*0.5; state.shake = 25; showMsg('END OF TIME', 3); sfx('parry');
        for (let i = 0; i < 100; i++) { const a = Math.random() * Math.PI * 2; entities.bullets.push({x:p.x, y:p.y, vx:Math.cos(a)*(180+Math.random()*220), vy:Math.sin(a)*(180+Math.random()*220), r:6, dmg:(50000000+lv*20000000)*p.baseDmg, life:4, kind:'fire', hits:0, explosive:true, explodeR:80, homing:true}); }
      }}),
    _mkU('u_m07','COSMOS ERASE', 'e',[1,1],   16000, shot('fire', {dmg:l=>3000000000+l*1200000000, speed:300, r:16, life:5, count:80, spread:6.28, explosive:true, explodeR:200, pierce:true}), null, {cd:22, mp:250, desc:'ULT. ERASE COSMOS.'}),
    _mkU('u_m08','OMNIWIZARD',   'passive',[2,1], 8000, null, (p,lv)=>{ p.baseDmg *= 10; }, {desc:'BASE DMG x10.', maxLv:1}),
    _mkU('u_m09','ETHER MASTER', 'passive',[3,1], 8500, null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.08; p.mpCostMult = (p.mpCostMult||1) * 0.1; }, {desc:'CD -92%, MP -90%.', maxLv:1}),
    _mkU('u_m10','INFINITE MANA','passive',[4,1], 9000, null, (p,lv)=>{ p.maxMp += 5000; p.mp += 5000; p.mpRegenBonus = (p.mpRegenBonus||0) + 100; }, {desc:'MP+5k, +100/s.', maxLv:1}),
    _mkU('u_m11','ULTRA CRIT',   'passive',[0,2], 9500, null, (p,lv)=>{ p.crit = (p.crit||0) + 5; p.critMult = (p.critMult||2) * 5; }, {desc:'+500% CRIT, x5 MULT.', maxLv:1}),
    _mkU('u_m12','TIME LORD',    'passive',[1,2], 10000, null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.5; p.perks.push('erratic'); p.perks.push('erratic'); p.perks.push('chain'); p.perks.push('chain'); }, {desc:'CD -50%, ERR x2, CHAIN x2.', maxLv:1}),
    _mkU('u_m13','ARCANE DEITY', 'passive',[2,2], 10500, null, (p,lv)=>{ p.mods.fire = (p.mods.fire||1) * 10; p.mods.ice = (p.mods.ice||1) * 10; }, {desc:'ELEMENT DMG x10.', maxLv:1}),
    _mkU('u_m14','MANA STORM',   'passive',[3,2], 11000, null, (p,lv)=>{ p.perks.push('overflow'); p.perks.push('overflow'); p.perks.push('manaburn'); p.perks.push('manaburn'); p.perks.push('mpsiphon'); }, {desc:'OVERFLOW x2, MANABURN x2, SIPHON.', maxLv:1}),
    _mkU('u_m15','FORTITUDE',    'passive',[4,2], 11500, null, (p,lv)=>{ p.maxHp += 20000; p.hp += 20000; p.dmgReduction = (p.dmgReduction||0) + 0.6; }, {desc:'HP+20k, RES+60%.', maxLv:1}),
    _mkU('u_m16','ARCHMAGE PLUS','passive',[0,3], 12000, null, (p,lv)=>{ p.perks.push('splitshot'); p.perks.push('splitshot'); p.perks.push('firemult'); p.perks.push('firemult'); p.perks.push('firemult'); }, {desc:'SPLIT x2, FIRE x3.', maxLv:1}),
    _mkU('u_m17','ETERNAL FROST','passive',[1,3], 12500, null, (p,lv)=>{ p.perks.push('icefreeze'); p.perks.push('icefreeze'); p.perks.push('icefreeze'); p.perks.push('icepierce'); }, {desc:'ICE FREEZE x3, PIERCE.', maxLv:1}),
    _mkU('u_m18','PRISM LORD',   'passive',[2,3], 13000, null, (p,lv)=>{ p.baseDmg *= 5; p.cdMult = (p.cdMult||1) * 0.4; }, {desc:'DMG x5, CD -60%.', maxLv:1}),
    _mkU('u_m19','ETHER HEART',  'passive',[3,3], 14000, null, (p,lv)=>{ p.perks.push('overflow'); p.perks.push('circlelife'); p.perks.push('balance'); p.hpRegen = (p.hpRegen||0) + 200; p.maxHp += 15000; p.hp += 15000; }, {desc:'OVERFLOW + CIRCLE + BAL + REGEN.', maxLv:1}),
    _mkU('u_m20','TRANSCEND',    'passive',[4,3], 20000, null, (p,lv)=>{ p.baseDmg *= 20; p.cdMult = (p.cdMult||1) * 0.1; p.mpCostMult = (p.mpCostMult||1) * 0.05; p.maxHp += 30000; p.hp += 30000; p.crit = (p.crit||0) + 3; p.critMult = (p.critMult||2) * 3; p.dmgReduction = (p.dmgReduction||0) + 0.7; }, {desc:'ULT. TRANSCEND.', maxLv:1}),
  ],
  engineering: [
    _mkU('u_e01','PARTICLE GUN', 'lmb',[0,0], 5000, shot('fire', {dmg:l=>600000+l*250000, speed:800, r:2, life:1.0, pierce:true, count:3, spread:0.05, instant:true}), null, {cd:0.25, mp:5, desc:'3 PARTICLE BEAMS.'}),
    _mkU('u_e02','QUANTUM MG',   'lmb',[1,0], 6000, shot('fire', {dmg:l=>1200000+l*500000, speed:900, r:2, life:0.8, count:5, spread:0.2, instant:true, pierce:true}), null, {cd:0.3, mp:8, desc:'5-WAY QUANTUM MG.'}),
    _mkU('u_e03','SINGULARITY CANNON','q',[2,0], 7500, shot('fire', {dmg:l=>25000000+l*10000000, speed:500, r:6, life:2, pierce:true, explosive:true, explodeR:100, count:3, spread:0.15}), null, {cd:1.8, mp:55, desc:'3 SINGULARITIES.'}),
    _mkU('u_e04','ANTIMATTER SNIPE','q',[3,0], 8500, shot('fire', {dmg:l=>80000000+l*30000000, speed:1200, r:4, life:1.5, pierce:true, instant:true, count:2, spread:0.03}), null, {cd:2.2, mp:65, desc:'TWIN ANTIMATTER.'}),
    _mkU('u_e05','NUKE OMEGA',   'e',[4,0], 12000, shot('fire', {dmg:l=>800000000+l*300000000, speed:250, r:20, life:4, explosive:true, explodeR:250, count:1}), null, {cd:16, mp:200, desc:'ULT. FALLOUT.'}),
    _mkU('u_e06','GALAXY GUN',   'e',[0,1], 14000, shot('fire', {dmg:l=>2000000000+l*800000000, speed:400, r:10, life:3, count:24, spread:0.8, pierce:true, homing:true, explosive:true, explodeR:120}), null, {cd:18, mp:220, desc:'24 GALAXY BEAMS.'}),
    _mkU('u_e07','DOOMSDAY+',    'e',[1,1], 16000, shot('fire', {dmg:l=>6000000000+l*2500000000, speed:280, r:14, life:4, count:48, spread:6.28, explosive:true, explodeR:150, homing:true}), null, {cd:22, mp:260, desc:'ULT. DOOMSDAY MK2.'}),
    _mkU('u_e08','TITAN ARMOR',  'passive',[2,1], 8000, null, (p,lv)=>{ p.maxHp += 30000; p.hp += 30000; p.dmgReduction = (p.dmgReduction||0) + 0.7; }, {desc:'+30k HP, RES+70%.', maxLv:1}),
    _mkU('u_e09','OVERCLOCK',    'passive',[3,1], 8500, null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.05; }, {desc:'CD -95%.', maxLv:1}),
    _mkU('u_e10','GOD CIRCUIT',  'passive',[4,1], 9000, null, (p,lv)=>{ p.baseDmg *= 12; }, {desc:'BASE DMG x12.', maxLv:1}),
    _mkU('u_e11','WEAPON LORD',  'passive',[0,2], 9500, null, (p,lv)=>{ p.mods.lmbCd = (p.mods.lmbCd||1) * 0.03; p.mods.lmbDmg = (p.mods.lmbDmg||1) * 5; p.perks.push('lmbpierce'); }, {desc:'LMB CD-97%, DMG x5.', maxLv:1}),
    _mkU('u_e12','ULTRA CRIT',   'passive',[1,2], 10000, null, (p,lv)=>{ p.crit = (p.crit||0) + 4; p.critMult = (p.critMult||2) * 4; }, {desc:'+400% CRIT, x4 MULT.', maxLv:1}),
    _mkU('u_e13','MECH GOD',     'passive',[2,2], 10500, null, (p,lv)=>{ p.thorns = (p.thorns||0) + 1000; p.perks.push('manashield'); }, {desc:'THORNS+1k, MANA SHIELD.', maxLv:1}),
    _mkU('u_e14','NANO CORE',    'passive',[3,2], 11000, null, (p,lv)=>{ p.hpRegen = (p.hpRegen||0) + 300; p.lifesteal = (p.lifesteal||0) + 100; }, {desc:'+300 REGEN, +100 LIFESTEAL.', maxLv:1}),
    _mkU('u_e15','RAILGUN MASTER','passive',[4,2], 11500, null, (p,lv)=>{ p.perks.push('lmbpierce'); p.perks.push('bouncy'); p.perks.push('bouncy'); p.perks.push('bouncy'); }, {desc:'LMB PIERCE + BOUNCE x3.', maxLv:1}),
    _mkU('u_e16','SPEED DEMON',  'passive',[0,3], 12000, null, (p,lv)=>{ p.speed *= 3; p.perks.push('multiroll'); p.perks.push('multiroll'); }, {desc:'SPD x3 (capped), ROLL FAST.', maxLv:1}),
    _mkU('u_e17','MEGA OVERLOAD','passive',[1,3], 12500, null, (p,lv)=>{ p.baseDmg *= 3; p.cdMult = (p.cdMult||1) * 0.2; p.maxMp += 3000; p.mp += 3000; }, {desc:'DMG x3, CD-80%, MP+3k.', maxLv:1}),
    _mkU('u_e18','SIEGE MODE',   'passive',[2,3], 13000, null, (p,lv)=>{ p.baseDmg *= 6; p.speed *= 0.7; }, {desc:'DMG x6 (SPD -30%).', maxLv:1}),
    _mkU('u_e19','FACTORY',      'passive',[3,3], 14000, null, (p,lv)=>{ p.perks.push('splitshot'); p.perks.push('splitshot'); p.perks.push('splitshot'); p.perks.push('splitshot'); }, {desc:'SPLIT x4 (LMB +8).', maxLv:1}),
    _mkU('u_e20','APEX MECH',    'passive',[4,3], 20000, null, (p,lv)=>{ p.baseDmg *= 25; p.cdMult = (p.cdMult||1) * 0.08; p.maxHp += 60000; p.hp += 60000; p.dmgReduction = (p.dmgReduction||0) + 0.75; p.crit = (p.crit||0) + 2; p.critMult = (p.critMult||2) * 4; }, {desc:'ULT. APEX MECH.', maxLv:1}),
  ],
  nature: [
    _mkU('u_n01','PRIMAL SHOT',  'lmb',[0,0], 5000, shot('fire', {dmg:l=>550000+l*220000, speed:340, r:3, life:1.4, count:8, spread:0.5, pierce:true, homing:true}), null, {cd:0.35, mp:7, desc:'8 SEEKERS.'}),
    _mkU('u_n02','LIFE VOLLEY',  'lmb',[1,0], 6000, shot('ice',  {dmg:l=>1300000+l*550000, speed:380, r:3, life:1.6, count:10, spread:0.6, freeze:2, homing:true}), null, {cd:0.5, mp:12, desc:'10 FREEZE SEEKERS.'}),
    _mkU('u_n03','GAIA SPEAR+',  'q',[2,0],   7500, shot('fire', {dmg:l=>22000000+l*9000000, speed:500, r:5, life:2, pierce:true, count:4, spread:0.2}), null, {cd:1.8, mp:50, desc:'4 GAIA SPEARS.'}),
    _mkU('u_n04','WORLDTREE ROOT','q',[3,0],   8500, shot('ice',  {dmg:l=>60000000+l*25000000, speed:350, r:8, life:3.5, freeze:5, count:3, spread:0.1, pierce:true, explosive:true, explodeR:60}), null, {cd:2.2, mp:60, desc:'3 WORLD ROOTS.'}),
    _mkU('u_n05','GAIA WRATH+',  'e',[4,0], 12000, shot('fire', {dmg:l=>700000000+l*280000000, speed:250, r:10, life:4, count:32, spread:6.28, explosive:true, explodeR:100, homing:true}), null, {cd:16, mp:200, desc:'32-WAY GAIA.'}),
    _mkU('u_n06','WORLD REBIRTH','e',[0,1], 14000, null, null, {cd:22, mp:220, desc:'FULL HEAL + 30S INVULN + RAIN.',
      cast: (p,ang,lv)=>{ p.hp = p.maxHp; p.invuln = 30 + lv; state.shake = 20; showMsg('WORLD REBIRTH', 3); sfx('level');
        for (let i = 0; i < 80; i++) { const a = (i/80) * Math.PI * 2; entities.bullets.push({x:p.x, y:p.y, vx:Math.cos(a)*250, vy:Math.sin(a)*250, r:8, dmg:(300000000+lv*100000000)*p.baseDmg, life:4, kind:'fire', hits:0, explosive:true, explodeR:100, homing:true}); }
      }}),
    _mkU('u_n07','ETERNAL BLOOM','e',[1,1], 16000, shot('fire', {dmg:l=>4000000000+l*1500000000, speed:280, r:12, life:5, count:40, spread:6.28, pierce:true, homing:true, explosive:true, explodeR:120}), null, {cd:20, mp:240, desc:'ULT. ETERNAL BLOOM.'}),
    _mkU('u_n08','TITAN HP',     'passive',[2,1], 8000, null, (p,lv)=>{ p.maxHp += 40000; p.hp += 40000; p.hpRegen = (p.hpRegen||0) + 150; }, {desc:'+40k HP, +150 REGEN.', maxLv:1}),
    _mkU('u_n09','IMMORTAL',     'passive',[3,1], 8500, null, (p,lv)=>{ p.perks.push('rebirth'); p.rebirthReady = true; p.perks.push('laststand'); p.lastStandReady = true; p.perks.push('divinity'); p.divinityReady = true; }, {desc:'TRIPLE REVIVE.', maxLv:1}),
    _mkU('u_n10','GAIA HEART+',  'passive',[4,1], 9000, null, (p,lv)=>{ p.baseDmg *= 8; p.lifesteal = (p.lifesteal||0) + 200; }, {desc:'DMG x8, +200 LIFESTEAL.', maxLv:1}),
    _mkU('u_n11','THORN LORD',   'passive',[0,2], 9500, null, (p,lv)=>{ p.thorns = (p.thorns||0) + 2000; }, {desc:'THORNS +2000.', maxLv:1}),
    _mkU('u_n12','WILD APEX',    'passive',[1,2], 10000, null, (p,lv)=>{ p.speed *= 3; p.crit = (p.crit||0) + 2; p.perks.push('seeker'); }, {desc:'SPD x3 (cap), +200% CRIT.', maxLv:1}),
    _mkU('u_n13','SEED CORE',    'passive',[2,2], 10500, null, (p,lv)=>{ p.maxHp += 15000; p.hp += 15000; p.baseDmg *= 3; p.hpRegen = (p.hpRegen||0) + 200; }, {desc:'HP+15k, DMGx3.', maxLv:1}),
    _mkU('u_n14','FOREVER GREEN','passive',[3,2], 11000, null, (p,lv)=>{ p.baseDmg *= 4; p.cdMult = (p.cdMult||1) * 0.3; p.dmgReduction = (p.dmgReduction||0) + 0.4; }, {desc:'DMGx4, CD-70%, RES+40%.', maxLv:1}),
    _mkU('u_n15','BOUNTIFUL+',   'passive',[4,2], 11500, null, (p,lv)=>{ p.perks.push('bountiful'); p.perks.push('magnet'); p.perks.push('mpsiphon'); }, {desc:'BOUNTIFUL + MAGNET + SIPHON.', maxLv:1}),
    _mkU('u_n16','WILD FURY+',   'passive',[0,3], 12000, null, (p,lv)=>{ p.baseDmg *= 5; p.crit = (p.crit||0) + 3; p.perks.push('bouncy'); p.perks.push('bouncy'); }, {desc:'DMGx5, +300% CRIT.', maxLv:1}),
    _mkU('u_n17','DRUID SOUL+',  'passive',[1,3], 12500, null, (p,lv)=>{ p.perks.push('seeker'); p.perks.push('firemult'); p.perks.push('firemult'); p.perks.push('splitshot'); }, {desc:'SEEK, FIRE x2, SPLIT.', maxLv:1}),
    _mkU('u_n18','LIVING TITAN', 'passive',[2,3], 13000, null, (p,lv)=>{ p.maxHp += 25000; p.hp += 25000; p.baseDmg *= 4; p.dmgReduction = (p.dmgReduction||0) + 0.4; }, {desc:'HP+25k, DMGx4, RES+40%.', maxLv:1}),
    _mkU('u_n19','WORLD SOUL',   'passive',[3,3], 14000, null, (p,lv)=>{ p.perks.push('rebirth'); p.perks.push('divinity'); p.hpRegen = (p.hpRegen||0) + 300; p.lifesteal = (p.lifesteal||0) + 150; p.rebirthReady = true; p.divinityReady = true; }, {desc:'DOUBLE REVIVE + REGEN + LS.', maxLv:1}),
    _mkU('u_n20','GAIA GOD',     'passive',[4,3], 20000, null, (p,lv)=>{ p.baseDmg *= 20; p.maxHp += 80000; p.hp += 80000; p.hpRegen = (p.hpRegen||0) + 500; p.dmgReduction = (p.dmgReduction||0) + 0.7; p.lifesteal = (p.lifesteal||0) + 300; p.cdMult = (p.cdMult||1) * 0.15; }, {desc:'ULT. BECOME GAIA-GOD.', maxLv:1}),
  ],
  chaos: [
    _mkU('u_c01','VOID FLARE',   'lmb',[0,0], 5000, shot('fire', {dmg:l=>700000+l*280000, speed:400, r:3, life:1.4, count:6, spread:0.5, pierce:true, bounces:6}), null, {cd:0.35, mp:7, desc:'6-WAY BOUNCE.'}),
    _mkU('u_c02','MADNESS BLOOM','lmb',[1,0], 6000, shot('fire', {dmg:l=>1500000+l*600000, speed:340, r:4, life:1.8, count:8, spread:0.7, homing:true, explosive:true, explodeR:30}), null, {cd:0.5, mp:12, desc:'8 HOMING BOOMS.'}),
    _mkU('u_c03','REALITY TEAR+','q',[2,0],   7500, shot('fire', {dmg:l=>28000000+l*11000000, speed:550, r:6, life:2.2, pierce:true, count:4, spread:0.15, explosive:true, explodeR:60}), null, {cd:1.8, mp:55, desc:'4 REALITY TEARS.'}),
    _mkU('u_c04','ABYSS SPEAR',  'q',[3,0],   8500, shot('ice',  {dmg:l=>60000000+l*25000000, speed:600, r:5, life:2, pierce:true, freeze:4, count:3, spread:0.08}), null, {cd:2.2, mp:60, desc:'3 ABYSS SPEARS.'}),
    _mkU('u_c05','VOID COLLAPSE','e',[4,0], 12000, shot('fire', {dmg:l=>1800000000+l*700000000, speed:180, r:18, life:5, count:16, spread:0.8, explosive:true, explodeR:250, homing:true}), null, {cd:18, mp:210, desc:'ULT. VOID COLLAPSE.'}),
    _mkU('u_c06','ENTROPY WAVE+','e',[0,1], 14000, shot('fire', {dmg:l=>2500000000+l*1000000000, speed:320, r:10, life:4, count:80, spread:6.28, explosive:true, explodeR:80, bounces:3, homing:true}), null, {cd:16, mp:200, desc:'80 CHAOS ORBS.'}),
    _mkU('u_c07','THE VOID',     'e',[1,1], 16000, shot('fire', {dmg:l=>8000000000+l*3000000000, speed:250, r:16, life:5, count:60, spread:6.28, explosive:true, explodeR:180, pierce:true}), null, {cd:22, mp:260, desc:'ULT. VOID INCARNATE.'}),
    _mkU('u_c08','VOID HEART+',  'passive',[2,1], 8000, null, (p,lv)=>{ p.maxHp += 20000; p.hp += 20000; p.perks.push('sacrifice'); p.perks.push('sacrifice'); p.perks.push('sacrifice'); }, {desc:'HP+20k, SACRIFICE x3.', maxLv:1}),
    _mkU('u_c09','CHAOS FURY+',  'passive',[3,1], 8500, null, (p,lv)=>{ p.baseDmg *= 12; p.perks.push('doubleornothing'); p.perks.push('doubleornothing'); p.perks.push('doubleornothing'); }, {desc:'DMG x12, D/N x3.', maxLv:1}),
    _mkU('u_c10','ENTROPY LORD+','passive',[4,1], 9000, null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.05; p.perks.push('erratic'); p.perks.push('erratic'); p.perks.push('erratic'); p.perks.push('erratic'); }, {desc:'CD -95%, ERR x4.', maxLv:1}),
    _mkU('u_c11','MAD GAZE+',    'passive',[0,2], 9500, null, (p,lv)=>{ p.crit = (p.crit||0) + 6; p.critMult = (p.critMult||2) * 5; }, {desc:'+600% CRIT, x5 MULT.', maxLv:1}),
    _mkU('u_c12','VOID EMBRACE+','passive',[1,2], 10000, null, (p,lv)=>{ p.perks.push('berserk'); p.perks.push('berserk'); p.perks.push('berserk'); p.perks.push('berserk'); }, {desc:'BERSERK x4.', maxLv:1}),
    _mkU('u_c13','CHAOS ORACLE+','passive',[2,2], 10500, null, (p,lv)=>{ for (let i=0;i<7;i++) p.perks.push('chain'); }, {desc:'CHAIN x7.', maxLv:1}),
    _mkU('u_c14','REALITY BREAK+','passive',[3,2], 11000, null, (p,lv)=>{ p.baseDmg *= 5; p.perks.push('splitshot'); p.perks.push('splitshot'); p.perks.push('splitshot'); p.perks.push('splitshot'); }, {desc:'DMGx5, SPLIT x4.', maxLv:1}),
    _mkU('u_c15','ABYSSAL LORD', 'passive',[4,2], 11500, null, (p,lv)=>{ p.baseDmg *= 6; p.cdMult = (p.cdMult||1) * 0.15; p.perks.push('sacrifice'); p.perks.push('sacrifice'); }, {desc:'DMGx6, CD-85%.', maxLv:1}),
    _mkU('u_c16','FROZEN MADNESS','passive',[0,3], 12000, null, (p,lv)=>{ p.perks.push('icefreeze'); p.perks.push('icefreeze'); p.perks.push('icefreeze'); p.perks.push('bouncy'); p.perks.push('bouncy'); }, {desc:'ICE FREEZE x3, BOUNCE x2.', maxLv:1}),
    _mkU('u_c17','VOID BODY+',   'passive',[1,3], 12500, null, (p,lv)=>{ p.maxHp += 35000; p.hp += 35000; p.dmgReduction = (p.dmgReduction||0) + 0.5; p.thorns = (p.thorns||0) + 1500; }, {desc:'HP+35k, RES+50%, THORNS+1.5k.', maxLv:1}),
    _mkU('u_c18','ENTROPY GAZE', 'passive',[2,3], 13000, null, (p,lv)=>{ p.crit = (p.crit||0) + 3; p.critMult = (p.critMult||2) * 3; p.baseDmg *= 3; }, {desc:'CRIT+300%, DMGx3.', maxLv:1}),
    _mkU('u_c19','MADNESS PLUS', 'passive',[3,3], 14000, null, (p,lv)=>{ p.baseDmg *= 4; p.speed *= 2; p.perks.push('erratic'); p.perks.push('doubleornothing'); }, {desc:'DMGx4, SPDx2 cap.', maxLv:1}),
    _mkU('u_c20','PRIMAL VOID',  'passive',[4,3], 20000, null, (p,lv)=>{ p.baseDmg *= 30; p.cdMult = (p.cdMult||1) * 0.05; p.crit = (p.crit||0) + 5; p.critMult = (p.critMult||2) * 5; p.maxHp += 50000; p.hp += 50000; p.perks.push('sacrifice'); p.perks.push('erratic'); }, {desc:'ULT. PRIMAL VOID.', maxLv:1}),
  ],
  order: [
    _mkU('u_o01','JUSTICE VOLLEY','lmb',[0,0], 5000, shot('fire', {dmg:l=>650000+l*260000, speed:500, r:3, life:1.4, count:6, spread:0.3, pierce:true}), null, {cd:0.35, mp:7, desc:'6-WAY JUSTICE.'}),
    _mkU('u_o02','HOLY BEAM+',   'lmb',[1,0], 6000, shot('fire', {dmg:l=>1400000+l*560000, speed:1000, r:3, life:1.2, pierce:true, instant:true, count:5, spread:0.15}), null, {cd:0.45, mp:12, desc:'5-WAY INSTANT.'}),
    _mkU('u_o03','SACRED SPEAR+','q',[2,0],   7500, shot('fire', {dmg:l=>26000000+l*10000000, speed:600, r:4, life:2, pierce:true, count:4, spread:0.15, homing:true}), null, {cd:1.8, mp:50, desc:'4 SACRED SPEARS.'}),
    _mkU('u_o04','HAMMER GOD',   'q',[3,0],   8500, shot('fire', {dmg:l=>65000000+l*26000000, speed:320, r:7, life:2.5, knockback:40, explosive:true, explodeR:80, count:3, spread:0.2}), null, {cd:2.2, mp:60, desc:'3 GOD HAMMERS.'}),
    _mkU('u_o05','FINAL VERDICT+','e',[4,0], 12000, null, null, {cd:16, mp:200, desc:'ULT. ALL ENEMIES x10 DMG.',
      cast: (p,ang,lv)=>{ const D = (200000000 + lv*80000000) * p.baseDmg * 10; for (const e of entities.enemies) { e.hp -= D; e.hitFlash = 0.4; spawnFloat(e.x, e.y-6, Math.ceil(D), '#ffefa8'); } p.hp = Math.min(p.maxHp, p.hp + 3000); state.shake = 22; showMsg('FINAL VERDICT', 3); sfx('level'); }}),
    _mkU('u_o06','HEAVENS BEAM', 'e',[0,1], 14000, shot('fire', {dmg:l=>1600000000+l*640000000, speed:500, r:6, life:3, count:32, spread:6.28, pierce:true, homing:true}), null, {cd:16, mp:210, desc:'32-WAY HEAVENS.'}),
    _mkU('u_o07','GOD MODE+',    'e',[1,1], 16000, null, null, {cd:24, mp:260, desc:'INVULN 30S + AURA + REGEN.',
      cast: (p,ang,lv)=>{ p.invuln = 30 + lv*2; p.hp = p.maxHp; state.shake = 18; showMsg('GOD MODE', 4); sfx('level');
        for (let i = 0; i < 48; i++) { const a = (i/48) * Math.PI * 2; entities.bullets.push({x:p.x, y:p.y, vx:Math.cos(a)*280, vy:Math.sin(a)*280, r:6, dmg:(500000000+lv*200000000)*p.baseDmg, life:3, kind:'fire', hits:0, pierce:true, homing:true}); }
      }}),
    _mkU('u_o08','DIVINE BODY+', 'passive',[2,1], 8000, null, (p,lv)=>{ p.maxHp += 25000; p.hp += 25000; p.dmgReduction = (p.dmgReduction||0) + 0.55; }, {desc:'HP+25k, RES+55%.', maxLv:1}),
    _mkU('u_o09','GOD POWER',    'passive',[3,1], 8500, null, (p,lv)=>{ p.baseDmg *= 10; p.mods.fire = (p.mods.fire||1) * 3; }, {desc:'DMG x10, FIRE x3.', maxLv:1}),
    _mkU('u_o10','HOLY CORE+',   'passive',[4,1], 9000, null, (p,lv)=>{ p.hpRegen = (p.hpRegen||0) + 150; p.perks.push('reflect'); p.perks.push('reflect'); p.perks.push('reflect'); p.perks.push('reflect'); }, {desc:'+150 REGEN, REFLECT x4.', maxLv:1}),
    _mkU('u_o11','ULTRA CRIT',   'passive',[0,2], 9500, null, (p,lv)=>{ p.crit = (p.crit||0) + 4; p.critMult = (p.critMult||2) * 4; }, {desc:'+400% CRIT, x4 MULT.', maxLv:1}),
    _mkU('u_o12','ANGELIC WINGS+','passive',[1,2], 10000, null, (p,lv)=>{ p.speed *= 2.5; p.perks.push('divinity'); p.divinityReady = true; p.perks.push('rebirth'); p.rebirthReady = true; p.perks.push('laststand'); p.lastStandReady = true; }, {desc:'SPDx2.5 cap, TRIPLE REVIVE.', maxLv:1}),
    _mkU('u_o13','LAW ETERNAL+', 'passive',[2,2], 10500, null, (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.1; p.mpCostMult = (p.mpCostMult||1) * 0.15; }, {desc:'CD -90%, MP -85%.', maxLv:1}),
    _mkU('u_o14','DIVINE WILL+', 'passive',[3,2], 11000, null, (p,lv)=>{ p.baseDmg *= 5; p.dmgReduction = (p.dmgReduction||0) + 0.5; p.hpRegen = (p.hpRegen||0) + 100; }, {desc:'DMGx5, RES+50%.', maxLv:1}),
    _mkU('u_o15','GUARDIAN',     'passive',[4,2], 11500, null, (p,lv)=>{ p.thorns = (p.thorns||0) + 800; p.perks.push('manashield'); p.perks.push('reflect'); }, {desc:'THORNS+800.', maxLv:1}),
    _mkU('u_o16','JUSTICE EYE+', 'passive',[0,3], 12000, null, (p,lv)=>{ p.crit = (p.crit||0) + 2; p.critMult = (p.critMult||2) * 3; p.baseDmg *= 3; }, {desc:'CRIT+200%, DMGx3.', maxLv:1}),
    _mkU('u_o17','SACRED HEART', 'passive',[1,3], 12500, null, (p,lv)=>{ p.maxHp += 30000; p.hp += 30000; p.hpRegen = (p.hpRegen||0) + 200; p.lifesteal = (p.lifesteal||0) + 80; }, {desc:'HP+30k, REGEN+200.', maxLv:1}),
    _mkU('u_o18','ARCHANGEL',    'passive',[2,3], 13000, null, (p,lv)=>{ p.baseDmg *= 4; p.speed *= 1.8; p.perks.push('seeker'); }, {desc:'DMGx4, SPDx1.8, SEEK.', maxLv:1}),
    _mkU('u_o19','RIGHTEOUS+',   'passive',[3,3], 14000, null, (p,lv)=>{ p.mods.fire = (p.mods.fire||1) * 5; p.mods.ice = (p.mods.ice||1) * 5; p.perks.push('firemult'); p.perks.push('firemult'); }, {desc:'ELEM DMG x5, FIREx2.', maxLv:1}),
    _mkU('u_o20','GODHOOD+',     'passive',[4,3], 20000, null, (p,lv)=>{ p.baseDmg *= 22; p.maxHp += 70000; p.hp += 70000; p.dmgReduction = (p.dmgReduction||0) + 0.7; p.crit = (p.crit||0) + 3; p.critMult = (p.critMult||2) * 4; p.perks.push('divinity'); p.divinityReady = true; p.perks.push('laststand'); p.lastStandReady = true; p.perks.push('rebirth'); p.rebirthReady = true; p.hpRegen = (p.hpRegen||0) + 500; p.cdMult = (p.cdMult||1) * 0.1; }, {desc:'ULT. FULL GODHOOD.', maxLv:1}),
  ],
};

// SKILL_TREE 등록 + SKILL_BY_ID 인덱싱
for (const cat of Object.keys(ULTRA_SKILLS)) {
  if (!SKILL_TREE[cat]) continue;
  for (const s of ULTRA_SKILLS[cat]) {
    s.category = cat;
    SKILL_TREE[cat].skills.push(s);
    SKILL_BY_ID[s.id] = s;
  }
}
