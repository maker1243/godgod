// =====================================================================
// Blessings (층 축복 카드) - 층 이동 시 3장 중 1장 선택. 다음 층까지 유지.
// player.blessings = [id, id, ...] 로 저장. createPlayer 시 리셋.
// =====================================================================

const BLESSING_DEFS = [
  // 공격
  { id:'bl_barrage',    name:'BARRAGE',       color:'#ff6666', desc:'ALL PROJECTILES x2',       apply:(p)=>{ p.projMult = (p.projMult||1) * 2; } },
  { id:'bl_burn',       name:'IGNITE',        color:'#ff9c3d', desc:'HITS APPLY 3s BURN',       apply:(p)=>{ p.blessBurn = true; } },
  { id:'bl_chainlt',    name:'CHAIN LIGHTNING',color:'#8bd8ff', desc:'KILL -> BOLT NEAR ENEMY',  apply:(p)=>{ p.blessChain = true; } },
  { id:'bl_glasscannon',name:'GLASS CANNON',  color:'#ff2d2d', desc:'DMG x3, MAX HP -50%',       apply:(p)=>{ p.baseDmg *= 3; const cut=Math.floor(p.maxHp*0.5); p.maxHp -= cut; p.hp = Math.min(p.hp, p.maxHp); } },
  { id:'bl_crit',       name:'PRISM EDGE',    color:'#ff00ff', desc:'CRIT +30%',                 apply:(p)=>{ p.crit = (p.crit||0) + 0.3; } },
  { id:'bl_pierce',     name:'PIERCE',        color:'#c86ade', desc:'PROJECTILES PIERCE ONCE',   apply:(p)=>{ p.blessPierce = (p.blessPierce||0) + 1; } },
  { id:'bl_bigshot',    name:'HEAVY ROUND',   color:'#e8c547', desc:'PROJECTILE SIZE x2, DMG x1.5', apply:(p)=>{ p.projSize = (p.projSize||1) * 2; p.baseDmg *= 1.5; } },
  { id:'bl_fast',       name:'RAPID FIRE',    color:'#ffefa8', desc:'ALL CD -30%',               apply:(p)=>{ p.cdMult *= 0.7; } },

  // 방어
  { id:'bl_lastward',   name:'LAST WARD',     color:'#ffefa8', desc:'HP 1 이하 사망 무효 (60s CD)', apply:(p)=>{ p.blessLastWard = 0; } },
  { id:'bl_thorns',     name:'SPIKED SKIN',   color:'#3ac762', desc:'THORNS +25',                apply:(p)=>{ p.thorns = (p.thorns||0) + 25; } },
  { id:'bl_armor',      name:'BULWARK',       color:'#8a7ab5', desc:'DMG TAKEN -30%',             apply:(p)=>{ p.dmgReduction = Math.min(0.85, (p.dmgReduction||0) + 0.30); } },
  { id:'bl_regen',      name:'REGROWTH',      color:'#3ac762', desc:'HP REGEN +5/s',              apply:(p)=>{ p.hpRegen = (p.hpRegen||0) + 5; } },
  { id:'bl_shield',     name:'AEGIS SHELL',   color:'#8bd8ff', desc:'START +100 SHIELD',          apply:(p)=>{ p.shield = (p.shield||0) + 100; } },
  { id:'bl_lifesteal',  name:'BLOOD OATH',    color:'#c81616', desc:'LIFESTEAL +8',               apply:(p)=>{ p.lifesteal = (p.lifesteal||0) + 8; } },

  // 유틸
  { id:'bl_swift',      name:'ZEPHYR',        color:'#c8ffc8', desc:'SPEED +30%',                 apply:(p)=>{ p.speed *= 1.30; } },
  { id:'bl_phase',      name:'PHASE STEP',    color:'#8bd8ff', desc:'ROLL 반투명 무적 x2',         apply:(p)=>{ p.perks.push('multiroll'); p.blessPhase = true; } },
  { id:'bl_focus',      name:'MIND CLARITY',  color:'#3b7fd6', desc:'MP COST -40%, REGEN +5',     apply:(p)=>{ p.mpCostMult *= 0.6; p.mpRegenBonus = (p.mpRegenBonus||0) + 5; } },
  { id:'bl_reflect',    name:'MIRROR SKIN',   color:'#ffefa8', desc:'PARRY -> FIREBALL',          apply:(p)=>{ p.perks.push('reflect'); } },

  // 특수/기괴
  { id:'bl_orbital',    name:'ORBITAL',       color:'#c86ade', desc:'SUMMON 2 ORBITING ORBS',     apply:(p)=>{ p.blessOrbital = (p.blessOrbital||0) + 2; } },
  { id:'bl_greed',      name:'GREED',         color:'#e8c547', desc:'RP DROP x2, MAX HP -10%',    apply:(p)=>{ p.rpMult = (p.rpMult||1) * 2; const cut=Math.floor(p.maxHp*0.1); p.maxHp -= cut; p.hp = Math.min(p.hp, p.maxHp); } },
  { id:'bl_pandemon',   name:'PANDEMONIUM',   color:'#ff6666', desc:'DEATH -> EXPLOSION',         apply:(p)=>{ p.perks.push('pandemonium'); } },
  { id:'bl_bloom',      name:'ELDRITCH BLOOM',color:'#ff00ff', desc:'ODD SHOTS +50% DMG',         apply:(p)=>{ p.blessBloom = true; } },
  { id:'bl_hex',        name:'HEX MARK',      color:'#7d4dbf', desc:'FIRST HIT MARKS FOR x2 DMG', apply:(p)=>{ p.blessHex = true; } },
  { id:'bl_echo',       name:'ECHO CAST',     color:'#8bd8ff', desc:'15% SPELLS CAST TWICE',      apply:(p)=>{ p.blessEcho = true; } },
  { id:'bl_giant',      name:'GIANT FORM',    color:'#e8c547', desc:'HITBOX +40%, DMG x2, HP x1.5', apply:(p)=>{ p.r *= 1.4; p.baseDmg *= 2; const add=Math.floor(p.maxHp*0.5); p.maxHp += add; p.hp += add; } },
  { id:'bl_tinylegend', name:'TINY LEGEND',   color:'#c8ffc8', desc:'HITBOX -30%, SPEED +20%, EVADE +25%', apply:(p)=>{ p.r *= 0.7; p.speed *= 1.2; p.blessEvade = (p.blessEvade||0) + 0.25; } },
  { id:'bl_frostaura',  name:'FROST AURA',    color:'#8bd8ff', desc:'NEARBY ENEMIES SLOWED 40%',  apply:(p)=>{ p.blessFrostAura = true; } },
  { id:'bl_soulharvest',name:'SOUL HARVEST',  color:'#7d4dbf', desc:'KILL -> +2 MAX HP (STACK)',  apply:(p)=>{ p.blessSoulHarvest = true; } },
  { id:'bl_berserker',  name:'BERSERKER',     color:'#c81616', desc:'HP<30% -> DMG x2.5',         apply:(p)=>{ p.blessBerserker = true; } },
  { id:'bl_precision',  name:'DEADEYE',       color:'#ff9c3d', desc:'CRIT MULT +2',               apply:(p)=>{ p.critMult = (p.critMult||2) + 2; } },

  // 최상급
  { id:'bl_dragon',     name:'DRAGON BREATH', color:'#ff2d2d', desc:'FIRE DMG x4',                apply:(p)=>{ p.mods.fire = (p.mods.fire||1) * 4; } },
  { id:'bl_timelord',   name:'TIME LORD',     color:'#c86ade', desc:'ALL CD -50%, MP COST +50%',  apply:(p)=>{ p.cdMult *= 0.5; p.mpCostMult *= 1.5; } },
  { id:'bl_arcanabless',name:'ARCANA BLESSING',color:'#ffefa8',desc:'ALL STATS x1.3',             apply:(p)=>{ p.baseDmg *= 1.3; const add=Math.floor(p.maxHp*0.3); p.maxHp += add; p.hp += add; p.speed *= 1.3; p.crit = (p.crit||0) + 0.15; } },
  { id:'bl_deathmark',  name:'DEATH MARK',    color:'#ff2d80', desc:'KILL LOW HP INSTANTLY (<15%)', apply:(p)=>{ p.blessExecute = 0.15; } },
  { id:'bl_immortal',   name:'IMMORTAL',      color:'#ffefa8', desc:'HP CANNOT DROP <10 (60s CD)', apply:(p)=>{ p.blessImmortal = 0; } },

  // 코업
  { id:'bl_partner',    name:'BOND OF TWO',   color:'#3ac762', desc:'COOP: BOTH +50% DMG',        apply:(p)=>{ if (typeof mp !== 'undefined' && mp.coop && mp.coop.active) p.baseDmg *= 1.5; } },

  // 도박
  { id:'bl_wildcard',   name:'WILDCARD',      color:'#ff00ff', desc:'다음 층에서 랜덤 축복 3개',   apply:(p)=>{ p.blessWildcard = 3; } },
  { id:'bl_gamble',     name:'GAMBLER SOUL',  color:'#e8c547', desc:'DMG x(0.5~4), 매초 재추첨',   apply:(p)=>{ p.blessGamble = true; } },

  // 추가 (10종)
  { id:'bl_ricochet',   name:'RICOCHET',      color:'#8bd8ff', desc:'발사체가 벽에서 1회 튕김',    apply:(p)=>{ p.blessRicochet = true; } },
  { id:'bl_swiftness',  name:'FLEET',         color:'#c8ffc8', desc:'ROLL 무적 시간 2배',           apply:(p)=>{ p.blessFleet = true; } },
  { id:'bl_manaburst',  name:'MANA BURST',    color:'#3b7fd6', desc:'MP 소모 없음 5초 (매 30초)',   apply:(p)=>{ p.blessManaBurst = true; p._manaBurstT = 0; } },
  { id:'bl_fortress',   name:'FORTRESS',      color:'#8a7ab5', desc:'정지 상태에서 DR +50%',        apply:(p)=>{ p.blessFortress = true; } },
  { id:'bl_bloodrage',  name:'BLOOD RAGE',    color:'#ff2d2d', desc:'HP <50% 시 DMG x1.5',         apply:(p)=>{ p.blessBloodrage = true; } },
  { id:'bl_lucky',      name:'LUCKY STAR',    color:'#ffefa8', desc:'상자 확률 x3',                apply:(p)=>{ p.blessLucky = true; } },
  { id:'bl_thunder',    name:'THUNDER',       color:'#ffefa8', desc:'모든 스킬에 번개 사슬 5% 확률', apply:(p)=>{ p.blessThunder = true; } },
  { id:'bl_ghostform',  name:'GHOST FORM',    color:'#c86ade', desc:'적을 통과 (무충돌)',           apply:(p)=>{ p.blessGhostForm = true; } },
  { id:'bl_multishot',  name:'MULTISHOT',     color:'#ff6666', desc:'모든 발사체 3방향',            apply:(p)=>{ p.projMult = (p.projMult||1) * 3; } },
  { id:'bl_holyward',   name:'HOLY WARD',     color:'#ffffff', desc:'다음 3회 피격 무효',            apply:(p)=>{ p.blessHolyCharges = 3; } },
];

const BLESSING_BY_ID = {};
for (const b of BLESSING_DEFS) BLESSING_BY_ID[b.id] = b;

// ---------- Picker Scene ----------
const blessingPick = {
  active: false,
  offers: [],       // 3 blessing ids
  cursor: 0,
  onDone: null,     // callback after choice
};

function _rollBlessingOffers(n) {
  const pool = BLESSING_DEFS.slice();
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx].id);
    pool.splice(idx, 1);
  }
  return out;
}

function openBlessingPick(onDone) {
  blessingPick.active = true;
  blessingPick.offers = _rollBlessingOffers(3);
  blessingPick.cursor = 0;
  blessingPick.onDone = onDone || null;
  state.scene = 'blessingPick';
}

function _grantBlessing(id) {
  const b = BLESSING_BY_ID[id]; if (!b || !player) return;
  if (!player.blessings) player.blessings = [];
  player.blessings.push(id);
  try { b.apply(player); } catch(_) {}
  spawnFloat(player.x, player.y - 12, '+ ' + b.name, b.color);
  if (typeof sfx === 'function') sfx('level');
  // 시너지 콤보 자동 체크
  if (typeof checkBlessingCombos === 'function') checkBlessingCombos();
  // 주간 도전
  if (typeof weeklyAdd === 'function') weeklyAdd('weekly_blessings', 1);
}

function updateBlessingPick(dt) {
  if (keys['KeyA'] || keys['ArrowLeft'])  { keys['KeyA']=false; keys['ArrowLeft']=false;  blessingPick.cursor = (blessingPick.cursor + 2) % 3; sfx('hit'); }
  if (keys['KeyD'] || keys['ArrowRight']) { keys['KeyD']=false; keys['ArrowRight']=false; blessingPick.cursor = (blessingPick.cursor + 1) % 3; sfx('hit'); }
  if (keys['Digit1']) { keys['Digit1']=false; blessingPick.cursor = 0; _confirmBlessing(); }
  if (keys['Digit2']) { keys['Digit2']=false; blessingPick.cursor = 1; _confirmBlessing(); }
  if (keys['Digit3']) { keys['Digit3']=false; blessingPick.cursor = 2; _confirmBlessing(); }
  if (keys['Space'] || keys['Enter']) { keys['Space']=false; keys['Enter']=false; _confirmBlessing(); }
  if (mouse.down && Array.isArray(window._blessRects)) {
    for (let i = 0; i < window._blessRects.length; i++) {
      const r = window._blessRects[i];
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        mouse.down = false;
        blessingPick.cursor = i; _confirmBlessing(); return;
      }
    }
  }
}

function _confirmBlessing() {
  const id = blessingPick.offers[blessingPick.cursor];
  _grantBlessing(id);
  // Wildcard: 추가 2개 랜덤
  if (player && player.blessWildcard) {
    const extra = player.blessWildcard - 1;
    player.blessWildcard = 0;
    for (let i = 0; i < extra; i++) {
      const rid = BLESSING_DEFS[Math.floor(Math.random() * BLESSING_DEFS.length)].id;
      _grantBlessing(rid);
    }
  }
  blessingPick.active = false;
  const cb = blessingPick.onDone;
  blessingPick.onDone = null;
  if (typeof cb === 'function') cb();
  else if (state.scene === 'blessingPick') state.scene = 'dungeon';
}

function renderBlessingPick() {
  ctx.fillStyle = '#050310'; ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.75)'; ctx.fillRect(0, 0, W*PX, H*PX);

  drawText('CHOOSE A BLESSING', W/2 - textWidth('CHOOSE A BLESSING', 2)/2, 20, '#ffefa8', 2);
  drawText('AD/1-3/CLICK  ·  SPACE 확정', W/2 - textWidth('AD/1-3/CLICK  ·  SPACE 확정')/2, 42, '#8a7ab5');

  window._blessRects = [];
  const cardW = 84, cardH = 100, gap = 12;
  const totalW = cardW * 3 + gap * 2;
  const startX = Math.floor(W/2 - totalW/2);
  const y = 70;
  for (let i = 0; i < 3; i++) {
    const id = blessingPick.offers[i]; const b = BLESSING_BY_ID[id]; if (!b) continue;
    const x = startX + i * (cardW + gap);
    const isSel = i === blessingPick.cursor;
    // 카드 배경
    pxDraw(x, y, cardW, cardH, isSel ? '#2a1548' : '#1a0e2e');
    pxDraw(x, y, cardW, 1, b.color);
    pxDraw(x, y + cardH - 1, cardW, 1, b.color);
    pxDraw(x, y, 1, cardH, b.color);
    pxDraw(x + cardW - 1, y, 1, cardH, b.color);
    if (isSel) {
      // 반짝임
      const glow = 0.4 + Math.sin(state.time * 5) * 0.3;
      ctx.strokeStyle = 'rgba(255, 239, 168, ' + glow.toFixed(2) + ')';
      ctx.lineWidth = PX * 2;
      ctx.strokeRect((x-2)*PX, (y-2)*PX, (cardW+4)*PX, (cardH+4)*PX);
    }
    // 번호
    drawText('[' + (i+1) + ']', x + 4, y + 4, '#5a4a80');
    // 이름
    const nm = b.name;
    drawText(nm, x + cardW/2 - textWidth(nm)/2, y + 16, b.color);
    // 아이콘 (색상 원)
    pxDraw(x + cardW/2 - 6, y + 34, 12, 12, b.color);
    pxDraw(x + cardW/2 - 3, y + 37, 6, 6, '#ffffff');
    // 설명 (여러 줄 자동 분할)
    const words = b.desc.split(' ');
    let line = '', ry = y + 58;
    for (const w of words) {
      const tr = line ? line + ' ' + w : w;
      if (textWidth(tr) > cardW - 8) {
        drawText(line, x + 4, ry, '#c8b898'); ry += 8; line = w;
      } else line = tr;
    }
    if (line) drawText(line, x + 4, ry, '#c8b898');
    window._blessRects.push({ x, y, w: cardW, h: cardH });
  }

  // 현재 보유 축복
  if (player && player.blessings && player.blessings.length) {
    drawText('현재 축복: ' + player.blessings.length + '개', 4, H - 10, '#8bd8ff');
  }
}

// ---------- 런타임 훅 ----------
// 런 시작 시 축복 초기화 (createPlayer 후 호출됨).
function resetBlessings() {
  if (!player) return;
  player.blessings = [];
  player.projMult = 1;
  player.projSize = 1;
  player.shield = 0;
  player.blessBurn = false;
  player.blessChain = false;
  player.blessPierce = 0;
  player.blessLastWard = -1;
  player.blessPhase = false;
  player.blessOrbital = 0;
  player.blessBloom = false;
  player.blessHex = false;
  player.blessEcho = false;
  player.blessEvade = 0;
  player.blessFrostAura = false;
  player.blessSoulHarvest = false;
  player.blessBerserker = false;
  player.blessExecute = 0;
  player.blessImmortal = -1;
  player.blessGamble = false;
  player.blessWildcard = 0;
  player.gambleT = 0; player.gambleMult = 1;
  player.orbitals = [];
  player._shotCounter = 0;
  if (typeof resetSynergies === 'function') resetSynergies();
  // 콤보 리셋
  if (typeof combo !== 'undefined') { combo.count = 0; combo.maxThisRun = 0; combo.lastKillT = 0; }
}

// 매 프레임 훅 (updateDungeon 등에서 호출).
function updateBlessingsFrame(dt) {
  if (!player) return;
  // Berserker
  if (player.blessBerserker) {
    const low = player.hp <= player.maxHp * 0.3;
    if (low && !player._berserkerOn) { player.baseDmg *= 2.5; player._berserkerOn = true; }
    if (!low && player._berserkerOn) { player.baseDmg /= 2.5; player._berserkerOn = false; }
  }
  // Bloodrage - HP < 50% 시 DMG x1.5
  if (player.blessBloodrage) {
    const low = player.hp <= player.maxHp * 0.5;
    if (low && !player._bloodrageOn) { player.baseDmg *= 1.5; player._bloodrageOn = true; }
    if (!low && player._bloodrageOn) { player.baseDmg /= 1.5; player._bloodrageOn = false; }
  }
  // Fortress - 정지 시 DR +50%
  if (player.blessFortress) {
    const stationary = Math.abs(player.vx || 0) < 0.5 && Math.abs(player.vy || 0) < 0.5;
    if (stationary && !player._fortressOn) { player.dmgReduction = (player.dmgReduction||0) + 0.5; player._fortressOn = true; }
    if (!stationary && player._fortressOn) { player.dmgReduction = Math.max(0, (player.dmgReduction||0) - 0.5); player._fortressOn = false; }
  }
  // Mana Burst - 매 30초 5초 MP 무한
  if (player.blessManaBurst) {
    player._manaBurstT = (player._manaBurstT || 0) + dt;
    if (player._manaBurstT >= 30) {
      player._manaBurstT = 0;
      player._manaBurstUntil = performance.now() + 5000;
      showMsg('MANA BURST! 5초간 MP 무제한', 3);
    }
    if (player._manaBurstUntil && performance.now() < player._manaBurstUntil) {
      player.mp = player.maxMp;
    }
  }
  // Gamble
  if (player.blessGamble) {
    player.gambleT = (player.gambleT || 0) + dt;
    if (player.gambleT >= 1) {
      player.gambleT = 0;
      const prev = player.gambleMult || 1;
      player.baseDmg /= prev;
      const next = 0.5 + Math.random() * 3.5;
      player.baseDmg *= next;
      player.gambleMult = next;
    }
  }
  // Frost aura
  if (player.blessFrostAura) {
    for (const e of entities.enemies) {
      if (dist(player, e) < 40) e.slow = Math.max(e.slow || 0, 0.4);
    }
  }
  // Orbitals: 2개가 플레이어 주위를 도는 파이어볼
  if (player.blessOrbital > 0) {
    if (!player.orbitals || player.orbitals.length !== player.blessOrbital) {
      player.orbitals = [];
      for (let i = 0; i < player.blessOrbital; i++) player.orbitals.push({ ang: (i / player.blessOrbital) * Math.PI * 2, hitCd: 0 });
    }
    for (const o of player.orbitals) {
      o.ang += dt * 3;
      o.hitCd = Math.max(0, o.hitCd - dt);
      const ox = player.x + Math.cos(o.ang) * 18;
      const oy = player.y + Math.sin(o.ang) * 18;
      o.x = ox; o.y = oy;
      if (o.hitCd <= 0) {
        for (const e of entities.enemies) {
          if (dist({x:ox,y:oy}, e) < 8) {
            const dmg = 20 * (player.baseDmg || 1) * (player.mods && player.mods.fire || 1);
            e.hp -= dmg; e.hitFlash = 0.15;
            if (typeof spawnFloat === 'function') spawnFloat(e.x, e.y, Math.floor(dmg), '#ff9c3d');
            o.hitCd = 0.4;
          }
        }
      }
    }
  }
  // LastWard / Immortal 쿨 감소
  if (player.blessLastWard > 0) player.blessLastWard = Math.max(0, player.blessLastWard - dt);
  if (player.blessImmortal > 0) player.blessImmortal = Math.max(0, player.blessImmortal - dt);
  // 시너지: Holy Shield - HP 5 이하 자동 회복
  if (player._synHolyShield && player.hp > 0 && player.hp <= 5) {
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5);
    spawnFloat(player.x, player.y - 12, 'HOLY SHIELD!', '#ffffff');
    if (typeof sfx === 'function') sfx('perfect');
  }
}

// 새 층 진입 시 (nextFloor()에서 호출): 축복 선택 트리거.
function triggerFloorBlessing() {
  openBlessingPick(null);
}
