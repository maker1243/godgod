// =====================================================================
// Black Heart - 최종 보스 (봉인 부수기 결말).
// HP = 교장의 150배 (26.25T × 150 ≈ 3.9 * 10^15).
// 20+ 패턴. 30% HP 부활 (2 페이즈).
// dungeonMode='blackheart' 에서 spawnBoss 대신 spawnBlackHeart 호출.
// =====================================================================

const BLACKHEART_HP = 3937500000000000;   // 3.9375 * 10^15

function spawnBlackHeart(room) {
  const boss = {
    x: room.x + room.w/2, y: room.y + 60, vx: 0, vy: 0,
    r: 20,
    kind: 'blackheart',
    hp: BLACKHEART_HP, maxHp: BLACKHEART_HP,
    dmg: 200000, speed: 40,
    xp: 0, gold: 0,
    hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
    isBoss: true,
    _isBlackHeart: true,
    _phase: 1,
    _pattern: 0,
    _patternT: 0,
    _entryT: 5,
    _entryTotal: 5,
    _reviveArmed: true,
  };
  entities.enemies = [boss];
  showMsg('검은 심장이 깨어난다.', 5);
  if (typeof sfx === 'function') sfx('boss');
}

// 20 개의 공격 패턴
const BH_PATTERNS = [
  // 0. 8-way shot
  { name:'8-way', cd: 2.0, fire(e) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + state.time;
      entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*120, vy: Math.sin(a)*120, r: 4, dmg: e.dmg, life: 3, kind: 'shadow' });
    }
  } },
  // 1. Player-tracked storm
  { name:'storm', cd: 1.5, fire(e) {
    const a = angleTo(e, player);
    for (let i = -3; i <= 3; i++) {
      const ang = a + i * 0.15;
      entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(ang)*180, vy: Math.sin(ang)*180, r: 3, dmg: e.dmg * 0.8, life: 2, kind: 'shadow' });
    }
  } },
  // 2. Meteor rain
  { name:'meteor', cd: 3.0, fire(e) {
    const rm = rooms[currentRoom];
    for (let i = 0; i < 8; i++) {
      const tx = rm.x + 20 + Math.random() * (rm.w - 40);
      const ty = rm.y + 20 + Math.random() * (rm.h - 40);
      if (entities.fx) entities.fx.push({ type:'warning', x: tx, y: ty, r: 15, life: 0.8, max: 0.8 });
      setTimeout(() => entities.ebullets.push({ x: tx, y: ty - 60, vx: 0, vy: 250, r: 5, dmg: e.dmg * 1.2, life: 0.5, kind: 'fire' }), 700);
    }
  } },
  // 3. Void beam (line through player)
  { name:'beam', cd: 2.5, fire(e) {
    const a = angleTo(e, player);
    for (let i = 0; i < 20; i++) {
      entities.ebullets.push({ x: e.x + Math.cos(a)*i*5, y: e.y + Math.sin(a)*i*5, vx: Math.cos(a)*100, vy: Math.sin(a)*100, r: 5, dmg: e.dmg * 0.6, life: 1.2, kind: 'shadow' });
    }
  } },
  // 4. Spiral death
  { name:'spiral', cd: 2.0, fire(e) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.sin(state.time * 2) * 0.5;
      entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*100, vy: Math.sin(a)*100, r: 3, dmg: e.dmg, life: 2.5, kind: 'shadow' });
    }
  } },
  // 5. Chase orb (slow homing)
  { name:'chase', cd: 3.5, fire(e) {
    entities.ebullets.push({ x: e.x, y: e.y, vx: 0, vy: 0, r: 8, dmg: e.dmg * 1.5, life: 5, kind: 'shadow', _homing: true });
  } },
  // 6. Wall of bullets
  { name:'wall', cd: 3.0, fire(e) {
    const dir = Math.sign(player.x - e.x) || 1;
    for (let i = 0; i < 12; i++) {
      const y = 20 + i * 15;
      entities.ebullets.push({ x: e.x - dir * 80, y: y, vx: dir * 100, vy: 0, r: 4, dmg: e.dmg, life: 4, kind: 'shadow' });
    }
  } },
  // 7. Blood explosion
  { name:'explode', cd: 4.0, fire(e) {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*200, vy: Math.sin(a)*200, r: 4, dmg: e.dmg, life: 1.5, kind: 'fire' });
    }
    state.shake = 12;
    if (typeof sfx === 'function') sfx('boss');
  } },
  // 8. Void slime spawn
  { name:'spawn', cd: 5.0, fire(e) {
    for (let i = 0; i < 3; i++) {
      const spawn = {
        x: e.x + rand(-30, 30), y: e.y + rand(-30, 30),
        r: 6, hp: e.hp * 0.001, maxHp: e.hp * 0.001,
        dmg: e.dmg * 0.3, speed: 40, kind: 'slime',
        hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
        xp: 0, gold: 0, _bhMinion: true,
      };
      entities.enemies.push(spawn);
    }
  } },
  // 9. Time distortion (all enemy bullets speed up)
  { name:'timeslip', cd: 6.0, fire(e) {
    for (const b of entities.ebullets) {
      b.vx *= 1.5; b.vy *= 1.5; b.life *= 0.7;
    }
    showMsg('시간이 뒤틀린다!', 2);
  } },
  // 10. Player location target - cross X
  { name:'cross', cd: 3.0, fire(e) {
    const tx = player.x, ty = player.y;
    if (entities.fx) entities.fx.push({ type:'warning', x: tx, y: ty, r: 20, life: 0.6, max: 0.6 });
    setTimeout(() => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        entities.ebullets.push({ x: tx, y: ty, vx: Math.cos(a)*150, vy: Math.sin(a)*150, r: 4, dmg: e.dmg, life: 2, kind: 'fire' });
      }
    }, 600);
  } },
  // 11. Void portal - teleport self
  { name:'teleport', cd: 4.0, fire(e) {
    const rm = rooms[currentRoom];
    spawnParticle(e.x, e.y, '#c86ade', 0.8, 30, 100);
    e.x = clamp(player.x + rand(-80, 80), rm.x + 20, rm.x + rm.w - 20);
    e.y = clamp(player.y + rand(-80, 80), rm.y + 20, rm.y + rm.h - 20);
    spawnParticle(e.x, e.y, '#c86ade', 0.8, 30, 100);
    state.shake = 6;
  } },
  // 12. Slow wave (radial)
  { name:'slowwave', cd: 2.5, fire(e) {
    if (entities.fx) entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 1.0, max: 1.0, r0: 5, r1: 100, col: '#8bd8ff' });
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*80, vy: Math.sin(a)*80, r: 2, dmg: e.dmg * 0.5, life: 2, kind: 'shadow', _slowBullet: true });
    }
  } },
  // 13. Curse mark on player
  { name:'curse', cd: 5.0, fire(e) {
    if (player) player._curseUntil = performance.now() + 5000;
    showMsg('저주받았다! 5초간 회복 무효', 3);
  } },
  // 14. Rapid shots
  { name:'rapid', cd: 0.3, fire(e) {
    const a = angleTo(e, player);
    entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*250, vy: Math.sin(a)*250, r: 3, dmg: e.dmg * 0.7, life: 1.5, kind: 'shadow' });
  } },
  // 15. Curved wave
  { name:'curved', cd: 2.5, fire(e) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const b = { x: e.x, y: e.y, vx: Math.cos(a)*120, vy: Math.sin(a)*120, r: 3, dmg: e.dmg, life: 3, kind: 'shadow', _curve: 0.02 };
      entities.ebullets.push(b);
    }
  } },
  // 16. Poison cloud
  { name:'poison', cd: 4.0, fire(e) {
    const tx = player.x, ty = player.y;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      entities.ebullets.push({ x: tx + Math.cos(a)*20, y: ty + Math.sin(a)*20, vx: Math.cos(a)*20, vy: Math.sin(a)*20, r: 6, dmg: e.dmg * 0.4, life: 4, kind: 'venom', _venomDot: 3 });
    }
  } },
  // 17. Judgment (huge damage single line)
  { name:'judgment', cd: 5.0, fire(e) {
    const a = angleTo(e, player);
    if (entities.fx) entities.fx.push({ type:'warning', x: (e.x + player.x)/2, y: (e.y + player.y)/2, r: 40, life: 1.0, max: 1.0 });
    setTimeout(() => {
      entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*400, vy: Math.sin(a)*400, r: 10, dmg: e.dmg * 3, life: 2, kind: 'shadow' });
    }, 1000);
  } },
  // 18. Bullet swap (steal player's bullets)
  { name:'swap', cd: 6.0, fire(e) {
    for (const b of entities.bullets) {
      entities.ebullets.push({ x: b.x, y: b.y, vx: -b.vx, vy: -b.vy, r: b.r, dmg: e.dmg * 0.5, life: 2, kind: 'shadow' });
    }
    entities.bullets = [];
    if (typeof showMsg === 'function') showMsg('발사체를 빼앗겼다!', 2);
  } },
  // 19. Void draining (heal boss)
  { name:'drain', cd: 5.0, fire(e) {
    const heal = e.maxHp * 0.02;
    e.hp = Math.min(e.maxHp, e.hp + heal);
    spawnFloat(e.x, e.y - 8, '+' + Math.floor(heal/1e12) + 'T', '#c81616');
    // 흡수 이펙트
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      spawnParticle(e.x + Math.cos(a)*40, e.y + Math.sin(a)*40, '#c81616', 0.6, 2, 60);
    }
  } },
];

function updateBlackHeart(e, dt, sm) {
  // 등장 애니
  if (e._entryT > 0) {
    e._entryT -= dt;
    const t = 1 - (e._entryT / e._entryTotal);
    e.y = 30 + t * 40;
    // 등장 이펙트
    if (Math.random() < 0.4) spawnParticle(e.x + rand(-20, 20), e.y + rand(-20, 20), '#c81616', 0.6, 3, 50);
    return;
  }

  // 부활 (30% HP 이하 첫 방문 시)
  if (e._reviveArmed && e.hp <= e.maxHp * 0.3) {
    e._reviveArmed = false;
    e.hp = e.maxHp * 0.3;    // 유지
    e._phase = 2;
    e.dmg *= 1.5;             // 데미지 +50%
    e.speed *= 1.3;
    state.shake = 20;
    state._slowMoUntil = performance.now() + 1500;
    showMsg('★ 검은 심장이 부활했다! 데미지 x1.5', 6);
    if (typeof sfx === 'function') sfx('bosskill');
    // 큰 폭발 이펙트
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 80;
      spawnParticle(e.x, e.y, i % 2 ? '#c81616' : '#ffefa8', 1.2, 3, sp);
    }
    if (entities.fx) entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 1.2, max: 1.2, r0: 5, r1: 100, col: '#ff2d2d' });
    return;
  }

  // 저속 이동
  const a = angleTo(e, player);
  e.x += Math.cos(a) * e.speed * sm * dt * 0.3;
  e.y += Math.sin(a) * e.speed * sm * dt * 0.3;
  const rm = rooms[currentRoom];
  if (rm) {
    e.x = clamp(e.x, rm.x + 20, rm.x + rm.w - 20);
    e.y = clamp(e.y, rm.y + 20, rm.y + rm.h - 20);
  }

  // 패턴 사이클 - 페이즈 1: 순차, 페이즈 2: 랜덤
  e._patternT -= dt;
  if (e._patternT <= 0) {
    const pat = BH_PATTERNS[e._pattern];
    if (pat) { try { pat.fire(e); } catch(_) {} }
    e._patternT = pat.cd / (e._phase === 2 ? 1.5 : 1);
    if (e._phase === 1) {
      e._pattern = (e._pattern + 1) % BH_PATTERNS.length;
    } else {
      e._pattern = Math.floor(Math.random() * BH_PATTERNS.length);
    }
  }
}

// 저주 효과 tick (updateDungeon 에서 호출)
function tickBlackHeartCurse(dt) {
  if (!player || !player._curseUntil) return;
  if (performance.now() > player._curseUntil) player._curseUntil = 0;
}

// 검은 심장 그리기 - 어두운 심장 + 붉은 오라
function drawBlackHeart(e) {
  const wobble = Math.sin(state.time * 3) * 2;
  // 오라
  const pulse = 0.6 + Math.sin(state.time * 4) * 0.4;
  ctx.fillStyle = 'rgba(200, 22, 22, ' + (0.15 * pulse).toFixed(2) + ')';
  ctx.beginPath(); ctx.arc(e.x*PX, e.y*PX, 30*PX, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(120, 0, 40, ' + (0.3 * pulse).toFixed(2) + ')';
  ctx.beginPath(); ctx.arc(e.x*PX, e.y*PX, 22*PX, 0, Math.PI*2); ctx.fill();
  // 심장 몸 (검은 원)
  pxDraw(e.x - 12, e.y - 10 + wobble, 24, 20, '#0a0510');
  pxDraw(e.x - 10, e.y - 8 + wobble, 20, 16, '#2a0a10');
  // 붉은 파열선
  const vein = 0.5 + Math.sin(state.time * 5) * 0.5;
  ctx.strokeStyle = 'rgba(255, 30, 30, ' + vein.toFixed(2) + ')';
  ctx.lineWidth = PX;
  ctx.beginPath();
  ctx.moveTo((e.x - 8)*PX, (e.y - 2 + wobble)*PX);
  ctx.lineTo((e.x - 2)*PX, (e.y + 6 + wobble)*PX);
  ctx.lineTo((e.x + 4)*PX, (e.y - 4 + wobble)*PX);
  ctx.lineTo((e.x + 8)*PX, (e.y + 2 + wobble)*PX);
  ctx.stroke();
  // 페이즈 2 표시
  if (e._phase === 2) {
    // 검은 심장 위 왕관 같은 것
    pxDraw(e.x - 6, e.y - 14 + wobble, 2, 3, '#ff2d2d');
    pxDraw(e.x - 2, e.y - 15 + wobble, 2, 4, '#ff2d2d');
    pxDraw(e.x + 2, e.y - 14 + wobble, 2, 3, '#ff2d2d');
    pxDraw(e.x + 6, e.y - 14 + wobble, 2, 3, '#ff2d2d');
  }
}
