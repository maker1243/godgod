// =====================================================================
// Black Heart - 최종 보스 (봉인 부수기 결말).
// HP = 교장의 150배 (26.25T × 150 ≈ 3.9 * 10^15).
// 20+ 패턴. 30% HP 부활 (2 페이즈).
// dungeonMode='blackheart' 에서 spawnBoss 대신 spawnBlackHeart 호출.
// =====================================================================

// 3단계 시련 보스 HP = ULTRA_TRIAL_HP × 1e32 = 1e39. 검은 심장은 그 × 1e13 = 1e52.
const BLACKHEART_HP = 1e52;
const BLACKHEART_DMG = 5e18;

function spawnBlackHeart(room) {
  const boss = {
    x: room.x + room.w/2, y: room.y + 60, vx: 0, vy: 0,
    r: 32,                            // 훨씬 크게
    kind: 'blackheart',
    hp: BLACKHEART_HP, maxHp: BLACKHEART_HP,
    dmg: BLACKHEART_DMG, speed: 50,
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
    _rebirth2Armed: true,             // 2차 부활 (10% HP)
    _tentacles: [],                   // 촉수 3~5개
    _dmgRed: 0.15,                    // 상시 15% 감쇄
  };
  // 촉수 초기화 (형상)
  for (let i = 0; i < 5; i++) {
    boss._tentacles.push({ ang: (i / 5) * Math.PI * 2, len: 20 + Math.random() * 8, phase: Math.random() * Math.PI * 2 });
  }
  entities.enemies = [boss];
  showMsg('★ 검은 심장이 각성한다. 세상의 종말이 다가온다. ★', 6);
  if (typeof sfx === 'function') sfx('boss');
  if (typeof state !== 'undefined') { state.shake = 40; state._slowMoUntil = performance.now() + 2000; }
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
  // === 20~29: 신규 강화 패턴 ===
  // 20. 촉수 채찍 (사방 촉수 확장 후 근접 광역)
  { name:'tentacle_lash', cd: 3.5, fire(e) {
    if (e._tentacles) for (const t of e._tentacles) t.len = 60;
    setTimeout(() => {
      if (e._tentacles) for (const t of e._tentacles) t.len = 20 + Math.random() * 8;
      const rr = 60;
      for (let a = 0; a < 12; a++) {
        const ang = (a/12)*Math.PI*2;
        entities.ebullets.push({ x: e.x + Math.cos(ang)*rr, y: e.y + Math.sin(ang)*rr, vx: Math.cos(ang)*80, vy: Math.sin(ang)*80, r: 5, dmg: e.dmg * 1.2, life: 1.5, kind: 'shadow', visual:'voidtear' });
      }
    }, 900);
  } },
  // 21. 나선 폭풍 (36발 이중 나선)
  { name:'twin_spiral', cd: 4.0, fire(e) {
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*130, vy: Math.sin(a)*130, r: 3, dmg: e.dmg * 0.9, life: 3, kind: 'shadow', _sc_spin: 4, visual:'chaosorb' });
      entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a+Math.PI/36)*80, vy: Math.sin(a+Math.PI/36)*80, r: 3, dmg: e.dmg * 0.7, life: 3, kind: 'shadow', _sc_spin: -4, visual:'madnessorb' });
    }
  } },
  // 22. 흑화 지대 (플레이어 위치 그라운드 필드 3개)
  { name:'blackout_field', cd: 5.0, fire(e) {
    for (let i = 0; i < 3; i++) {
      const tx = player.x + rand(-40, 40), ty = player.y + rand(-40, 40);
      if (entities.fx) entities.fx.push({ type:'warning', x: tx, y: ty, r: 30, life: 0.8, max: 0.8 });
      setTimeout(() => {
        entities.ebullets.push({ x: tx, y: ty, vx: 0, vy: 0, r: 30, dmg: e.dmg * 0.8, life: 4, kind: 'shadow', pierce: true, _isGround: true, _pierceLeft: 9999 });
        if (entities.fx) entities.fx.push({ type:'ring', x: tx, y: ty, life: 4, max: 4, r0: 4, r1: 30, col: '#c86ade' });
      }, 800);
    }
  } },
  // 23. 심장의 고동 (전방향 링 3중)
  { name:'heartbeat', cd: 3.0, fire(e) {
    state.shake = 15;
    for (let ring = 0; ring < 3; ring++) {
      setTimeout(() => {
        for (let i = 0; i < 20 + ring * 4; i++) {
          const a = (i / (20 + ring * 4)) * Math.PI * 2 + ring * 0.15;
          entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*140, vy: Math.sin(a)*140, r: 3, dmg: e.dmg * 0.7, life: 2, kind: 'fire', visual:'sacredorb' });
        }
        if (entities.fx) entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 0.4, max: 0.4, r0: 5, r1: 60 + ring * 30, col: '#c81616' });
      }, ring * 300);
    }
  } },
  // 24. 심연의 눈 (플레이어 조준 광선 4개 지연 발사)
  { name:'abyss_eye', cd: 4.5, fire(e) {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const a = angleTo(e, player) + (i - 1.5) * 0.15;
        if (entities.fx) entities.fx.push({ type:'warning', x: (e.x + player.x)/2, y: (e.y + player.y)/2, r: 20, life: 0.4, max: 0.4 });
        setTimeout(() => {
          entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*500, vy: Math.sin(a)*500, r: 6, dmg: e.dmg * 1.8, life: 1.5, kind: 'shadow', visual:'eyeofchaos', pierce: true, _pierceLeft: 5 });
        }, 400);
      }, i * 150);
    }
  } },
  // 25. 저주 대륙 (넓은 저주 지대)
  { name:'curse_land', cd: 6.0, fire(e) {
    // 8방향 저주 웨이브 + 5초 저주
    if (player) player._curseUntil = performance.now() + 5000;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*60, vy: Math.sin(a)*60, r: 12, dmg: e.dmg * 0.6, life: 4, kind: 'shadow', pierce: true, _pierceLeft: 999, visual:'nethershard' });
    }
    showMsg('저주받은 대륙 - 5초간 회복 무효', 3);
  } },
  // 26. 세계 반전 (플레이어 발사체 전부 반전 + 자체 발사)
  { name:'reflect_world', cd: 8.0, fire(e) {
    for (const b of entities.bullets) { b.vx = -b.vx; b.vy = -b.vy; b.dmg = 0; }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a)*180, vy: Math.sin(a)*180, r: 5, dmg: e.dmg * 1.5, life: 2, kind: 'shadow', visual:'voidbolt' });
    }
    showMsg('세계가 반전한다.', 3);
  } },
  // 27. 종말의 심판 (화면 전체 낙석)
  { name:'apocalypse', cd: 8.0, fire(e) {
    const rm = rooms[currentRoom];
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const tx = rm.x + rand(20, rm.w - 20);
        const ty = rm.y + rand(20, rm.h - 20);
        if (entities.fx) entities.fx.push({ type:'warning', x: tx, y: ty, r: 18, life: 0.5, max: 0.5 });
        setTimeout(() => {
          entities.ebullets.push({ x: tx, y: ty - 60, vx: 0, vy: 400, r: 6, dmg: e.dmg * 1.4, life: 0.5, kind: 'fire', visual:'meteor' });
        }, 500);
      }, i * 100);
    }
  } },
  // 28. 심장 분열 (4개 미니 검은 심장 스폰)
  { name:'split_hearts', cd: 12.0, fire(e) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const miniHp = e.maxHp * 0.001;
      const mini = {
        x: e.x + Math.cos(a)*40, y: e.y + Math.sin(a)*40, r: 8,
        hp: miniHp, maxHp: miniHp, dmg: e.dmg * 0.4, speed: 60,
        kind: 'slime', hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
        xp: 0, gold: 0, _bhMinion: true, isElite: true,
      };
      entities.enemies.push(mini);
    }
    showMsg('심장이 분열한다.', 3);
  } },
  // 29. 절대 정지 (모든 발사체 정지 후 재가속)
  { name:'time_lock', cd: 10.0, fire(e) {
    const bak = [];
    for (const b of entities.ebullets) { bak.push({ b, vx: b.vx, vy: b.vy }); b.vx *= 0.05; b.vy *= 0.05; }
    setTimeout(() => {
      for (const it of bak) { if (it.b) { it.b.vx = it.vx * 2.5; it.b.vy = it.vy * 2.5; } }
    }, 1200);
    showMsg('시간이 멈춘다...', 2);
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

  // 2차 부활 (10% HP - 페이즈 3, 진짜 광기)
  if (e._rebirth2Armed && e.hp <= e.maxHp * 0.1) {
    e._rebirth2Armed = false;
    e.hp = e.maxHp * 0.1;
    e._phase = 3;
    e.dmg *= 2;
    e.speed *= 1.5;
    e._dmgRed = 0.35;
    state.shake = 50;
    state._slowMoUntil = performance.now() + 2500;
    showMsg('★★★ 검은 심장이 진짜 형상을 드러낸다 - 광기의 페이즈 3 ★★★', 8);
    if (typeof sfx === 'function') sfx('bosskill');
    for (let i = 0; i < 120; i++) {
      const a2 = Math.random() * Math.PI * 2;
      const sp2 = 100 + Math.random() * 140;
      spawnParticle(e.x, e.y, i % 3 === 0 ? '#ff00ff' : (i % 3 === 1 ? '#c81616' : '#0a0510'), 1.8, 5, sp2);
    }
    if (entities.fx) {
      entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 2, max: 2, r0: 8, r1: 200, col: '#ff00ff' });
      entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 2, max: 2, r0: 4, r1: 160, col: '#c81616' });
    }
    return;
  }

  // 저속 이동
  const a = angleTo(e, player);
  const spdMul = e._phase === 3 ? 0.6 : (e._phase === 2 ? 0.4 : 0.3);
  e.x += Math.cos(a) * e.speed * sm * dt * spdMul;
  e.y += Math.sin(a) * e.speed * sm * dt * spdMul;
  const rm = rooms[currentRoom];
  if (rm) {
    e.x = clamp(e.x, rm.x + 20, rm.x + rm.w - 20);
    e.y = clamp(e.y, rm.y + 20, rm.y + rm.h - 20);
  }

  // 촉수 애니메이션 업데이트
  if (e._tentacles) {
    for (const t of e._tentacles) { t.ang += dt * 0.5; t.phase += dt * 4; }
  }

  // ===== 병렬 패턴 스케줄러 =====
  // 여러 슬롯이 각자 독립된 타이머를 갖고 패턴을 발사. 페이즈가 높아질수록 슬롯 수 증가.
  // 슬롯마다 다른 패턴을 선택 → 화면에 끊임없이 여러 종류의 패턴이 동시에 나옴.
  if (!e._slots) {
    e._slots = [];
    // 초기 슬롯 셋업 (페이즈 1: 3, 2: 5, 3: 8)
  }
  const targetSlots = e._phase === 3 ? 12 : (e._phase === 2 ? 7 : 4);
  // 부족하면 추가 - 초기 지연을 짧게 (첫 발사부터 촘촘하게)
  while (e._slots.length < targetSlots) {
    e._slots.push({
      pat: Math.floor(Math.random() * BH_PATTERNS.length),
      t: 0.1 + Math.random() * 0.8,        // 훨씬 짧은 초기 지연
    });
  }
  // 페이즈 감소 시 (부활 리셋) 초과 슬롯 제거는 안 함 - 계속 늘어나기만 함

  // 패턴 간격 대폭 축소 - 페이즈 1: 40%, 2: 25%, 3: 15%
  const cdMul = e._phase === 3 ? 0.15 : (e._phase === 2 ? 0.25 : 0.4);
  for (let i = 0; i < e._slots.length; i++) {
    const slot = e._slots[i];
    slot.t -= dt;
    if (slot.t <= 0) {
      const pat = BH_PATTERNS[slot.pat];
      if (pat) { try { pat.fire(e); } catch(_) {} }
      // 다음 패턴 선정
      let next;
      let tries = 0;
      do { next = Math.floor(Math.random() * BH_PATTERNS.length); tries++; } while (next === slot.pat && tries < 4);
      slot.pat = next;
      // 다음 CD - 짧고 촘촘하게. 오프셋도 축소
      slot.t = pat.cd * cdMul * (0.6 + Math.random() * 0.4) + (i * 0.04);
      // 최소 지연 보장 (프레임 폭발 방지)
      if (slot.t < 0.08) slot.t = 0.08;
    }
  }
}

// 저주 효과 tick (updateDungeon 에서 호출)
function tickBlackHeartCurse(dt) {
  if (!player || !player._curseUntil) return;
  if (performance.now() > player._curseUntil) player._curseUntil = 0;
}

// 검은 심장 그리기 - 심장 + 촉수 + 다중 눈 + 오라 (페이즈별)
function drawBlackHeart(e) {
  const wobble = Math.sin(state.time * 3) * 2;
  const pulse = 0.6 + Math.sin(state.time * 4) * 0.4;
  const phase = e._phase || 1;

  // 초거대 외곽 오라
  const auraR = 60 + (phase - 1) * 20;
  const auraCol = phase === 3 ? '#ff00ff' : '#c81616';
  ctx.fillStyle = 'rgba(255, 0, 255, ' + (0.06 * pulse).toFixed(2) + ')';
  if (phase === 3) { ctx.beginPath(); ctx.arc(e.x*PX, e.y*PX, (auraR + 15)*PX, 0, Math.PI*2); ctx.fill(); }
  ctx.fillStyle = 'rgba(200, 22, 22, ' + (0.10 * pulse).toFixed(2) + ')';
  ctx.beginPath(); ctx.arc(e.x*PX, e.y*PX, auraR*PX, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(120, 0, 40, ' + (0.20 * pulse).toFixed(2) + ')';
  ctx.beginPath(); ctx.arc(e.x*PX, e.y*PX, (auraR * 0.65)*PX, 0, Math.PI*2); ctx.fill();

  // === 촉수 (형상 특징) ===
  if (e._tentacles) {
    for (const t of e._tentacles) {
      const baseAng = t.ang + Math.sin(t.phase) * 0.3;
      const segments = 6;
      let px = e.x, py = e.y;
      let ang = baseAng;
      const segLen = t.len / segments;
      for (let s = 0; s < segments; s++) {
        const nx = px + Math.cos(ang) * segLen;
        const ny = py + Math.sin(ang) * segLen;
        const w = Math.max(1, 5 - s * 0.6);
        ctx.strokeStyle = phase === 3 ? '#ff2d80' : (phase === 2 ? '#c81616' : '#3a0a2a');
        ctx.lineWidth = w * PX;
        ctx.beginPath(); ctx.moveTo(px*PX, py*PX); ctx.lineTo(nx*PX, ny*PX); ctx.stroke();
        px = nx; py = ny;
        ang += Math.sin(t.phase + s) * 0.35;
      }
      // 촉수 끝 눈
      pxDraw(px - 1, py - 1, 2, 2, '#ff2d80');
    }
  }

  // 심장 몸 - 페이즈별 크기 확장
  const bodyR = phase === 3 ? 18 : (phase === 2 ? 15 : 12);
  const bodyH = phase === 3 ? 26 : (phase === 2 ? 22 : 20);
  pxDraw(e.x - bodyR, e.y - 12 + wobble, bodyR * 2, bodyH, '#0a0510');
  pxDraw(e.x - bodyR + 2, e.y - 10 + wobble, (bodyR - 2) * 2, bodyH - 4, '#2a0a10');
  // 중앙 심장 - 두 개 반원 + 아래 삼각
  ctx.fillStyle = phase === 3 ? '#ff00ff' : '#c81616';
  ctx.beginPath(); ctx.arc((e.x - bodyR/2)*PX, (e.y - 4 + wobble)*PX, (bodyR/2)*PX, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc((e.x + bodyR/2)*PX, (e.y - 4 + wobble)*PX, (bodyR/2)*PX, 0, Math.PI*2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo((e.x - bodyR)*PX, (e.y - 4 + wobble)*PX);
  ctx.lineTo((e.x + bodyR)*PX, (e.y - 4 + wobble)*PX);
  ctx.lineTo(e.x*PX, (e.y + bodyR + 4 + wobble)*PX);
  ctx.closePath(); ctx.fill();

  // 붉은 파열선 (혈관)
  const vein = 0.5 + Math.sin(state.time * 5) * 0.5;
  ctx.strokeStyle = phase === 3 ? 'rgba(255, 128, 255, ' + vein.toFixed(2) + ')' : 'rgba(255, 30, 30, ' + vein.toFixed(2) + ')';
  ctx.lineWidth = PX;
  for (let v = 0; v < 4; v++) {
    ctx.beginPath();
    const sx = e.x + Math.cos(state.time + v * 1.5) * 8;
    const sy = e.y - 4 + wobble;
    ctx.moveTo(sx*PX, sy*PX);
    for (let seg = 1; seg <= 3; seg++) {
      const bx = e.x + Math.cos(state.time + v * 1.5 + seg * 0.5) * (8 + seg * 3);
      const by = sy + seg * 4;
      ctx.lineTo(bx*PX, by*PX);
    }
    ctx.stroke();
  }

  // 중앙 눈 (모든 페이즈)
  const eyeBlink = Math.sin(state.time * 2) > -0.85 ? 1 : 0.2;
  ctx.fillStyle = '#0a0000';
  ctx.beginPath(); ctx.arc(e.x*PX, (e.y - 2 + wobble)*PX, 4*PX, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = phase === 3 ? '#ff00ff' : '#ffff00';
  ctx.globalAlpha = eyeBlink;
  ctx.beginPath(); ctx.arc(e.x*PX, (e.y - 2 + wobble)*PX, 3*PX, 0, Math.PI*2); ctx.fill();
  pxDraw(e.x - 1, e.y - 3 + wobble, 2, 2, '#000');
  ctx.globalAlpha = 1;

  // 페이즈 2/3 표시 - 왕관
  if (phase >= 2) {
    const crownCol = phase === 3 ? '#ff00ff' : '#ff2d2d';
    const cy = e.y - bodyH/2 - 6 + wobble;
    pxDraw(e.x - 8, cy + 2, 16, 2, crownCol);
    pxDraw(e.x - 7, cy, 2, 3, crownCol);
    pxDraw(e.x - 3, cy - 2, 2, 5, crownCol);
    pxDraw(e.x + 1, cy - 3, 2, 6, crownCol);
    pxDraw(e.x + 5, cy - 1, 2, 4, crownCol);
  }
  // 페이즈 3 표시 - 다중 눈 (몸 주위 3개 추가)
  if (phase === 3) {
    for (let i = 0; i < 3; i++) {
      const ea = state.time * 0.5 + i * (Math.PI * 2 / 3);
      const ex = e.x + Math.cos(ea) * 24;
      const ey = e.y + Math.sin(ea) * 24 + wobble;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(ex*PX, ey*PX, 3*PX, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ff00ff';
      ctx.beginPath(); ctx.arc(ex*PX, ey*PX, 2*PX, 0, Math.PI*2); ctx.fill();
      pxDraw(ex - 0.5, ey - 0.5, 1, 1, '#000');
    }
  }
}
