// =====================================================================
// Arena waves
// =====================================================================

// =====================================================================
// 아레나 (웨이브 챌린지 + AI 대전 + 룸)
// =====================================================================
const arena = {
  wave: 0,
  waveTimer: 0,
  waveDelay: 0,
  score: 0,
  active: false,
  finished: false,
  room: { x: 40, y: 30, w: 240, h: 160 },
};

function startArena() {
  arena.wave = 0;
  arena.waveTimer = 0;
  arena.waveDelay = 2;
  arena.score = 0;
  arena.active = true;
  arena.finished = false;
  clearEntities();
  // 플레이어 리셋 (아레나용 표준 스탯)
  player = createPlayer();
  player.x = arena.room.x + arena.room.w/2;
  player.y = arena.room.y + arena.room.h/2;
  // 아레나는 즉시 최대 레벨 근접 - 재밌게
  player.hp = player.maxHp = 120;
  player.mp = player.maxMp = 80;
  showMsg('ARENA: SURVIVE THE WAVES', 2);
}

function spawnArenaWave(w) {
  const room = arena.room;
  // 웨이브 구성: 개수와 종류가 점점 어려워짐
  const total = 2 + w * 2;
  for (let i = 0; i < total; i++) {
    const r = Math.random();
    let kind;
    if (w <= 2) kind = r < 0.7 ? 'slime' : 'skeleton';
    else if (w <= 5) kind = r < 0.4 ? 'slime' : (r < 0.8 ? 'skeleton' : 'wraith');
    else kind = r < 0.25 ? 'slime' : (r < 0.6 ? 'skeleton' : 'wraith');
    // 스폰 위치 (플레이어에서 떨어진 곳)
    let x, y, tries = 0;
    do {
      x = room.x + 15 + Math.random() * (room.w - 30);
      y = room.y + 15 + Math.random() * (room.h - 30);
      tries++;
    } while (dist({x,y}, player) < 50 && tries < 20);
    const oldPos = {x, y};
    spawnEnemyAt(kind, x, y);
  }
  // 미니 보스 웨이브: 5, 10, 15
  if (w > 0 && w % 5 === 0) {
    const bosses = ['knight', 'seer', 'lich', 'colossus'];
    const bkind = bosses[Math.floor((w/5 - 1) % bosses.length)];
    spawnArenaBoss(bkind);
  }
}

function spawnEnemyAt(kind, x, y) {
  const base = { x, y, vx: 0, vy: 0, hitFlash: 0, kind, freeze: 0, slow: 0, stun: 0, attackCd: 0 };
  const wave = arena.wave;
  if (kind === 'slime') {
    Object.assign(base, { r: 5, hp: 12 + wave*3, dmg: 8, speed: 22, xp: 2, gold: 1 });
  } else if (kind === 'skeleton') {
    Object.assign(base, { r: 5, hp: 20 + wave*4, dmg: 12, speed: 34, xp: 4, gold: 2, shootCd: rand(1, 2.5) });
  } else if (kind === 'wraith') {
    Object.assign(base, { r: 6, hp: 30 + wave*5, dmg: 16, speed: 44, xp: 6, gold: 3, teleCd: rand(2, 4) });
  }
  base.maxHp = base.hp;
  entities.enemies.push(base);
}

function spawnArenaBoss(kind) {
  const cx = arena.room.x + arena.room.w/2;
  const cy = arena.room.y + 40;
  const scale = 0.6 + arena.wave * 0.06;
  let boss;
  if (kind === 'knight') {
    boss = { x:cx, y:cy, vx:0, vy:0, r:8, kind, hp:180*scale, dmg:14, speed:38, xp:20, gold:15,
             chargeT:0, chargeCd:2.5, slamCd:3.5, phase:0 };
  } else if (kind === 'seer') {
    boss = { x:cx, y:cy, vx:0, vy:0, r:7, kind, hp:250*scale, dmg:16, speed:24, xp:30, gold:20,
             teleCd:2, volleyCd:2.6, cloneCd:10, phase:0 };
  } else if (kind === 'colossus') {
    boss = { x:cx, y:cy, vx:0, vy:0, r:12, kind, hp:320*scale, dmg:20, speed:14, xp:40, gold:25,
             stompCd:3, rainCd:5, phase:0 };
  } else {
    boss = { x:cx, y:cy, vx:0, vy:0, r:10, kind, hp:360*scale, dmg:18, speed:20, xp:50, gold:35,
             attackCd:2, phaseT:0, phase:0 };
  }
  boss.maxHp = boss.hp;
  boss.hitFlash = 0; boss.freeze = 0; boss.slow = 0; boss.stun = 0;
  boss.isBoss = true;
  entities.enemies.push(boss);
  showMsg('CHAMPION APPEARS!', 2);
  sfx('boss');
  state.shake = 8;
}

function updateArena(dt) {
  if (!arena.active && !mp.pvp.active) return;

  const dtLogic = dt;
  const dtEnemy = dt;

  const savedRoom = rooms[currentRoom];
  rooms[0] = arena.room;
  currentRoom = 0;
  updatePlayerArena(dtLogic);
  updateEnemies(dtEnemy);
  updateBullets(dtEnemy);
  updateEBullets(dtEnemy);
  updateParticles(dt);
  updateFloats(dt);
  updatePickups(dt);

  state.cam.x = 0; state.cam.y = 0;

  // PvP 매치 진행
  if (mp.pvp.active) {
    updatePvp(dt);
    // 상대 총알 → 나 피격 판정. 데미지는 sender-authoritative(pvpHit)로 이미 처리되므로
    // 여기서는 시각적 소비/파티클만 (중복 데미지 방지).
    for (let i = entities.bullets.length - 1; i >= 0; i--) {
      const b = entities.bullets[i];
      if (b.hostileToMe && dist(b, player) < b.r + player.r) {
        if (!b.remote) {
          // remote가 아니면 (구 폴백 등) 로컬 판정
          if (!player.invuln && !player.rolling) {
            if (typeof damagePlayer === 'function') damagePlayer(b.dmg || 8, b);
            else player.hp -= (b.dmg || 8);
          }
        } else {
          // remote 총알: 시각 파티클만 - 데미지는 sender의 pvpHit이 담당
          if (typeof spawnParticle === 'function') {
            spawnParticle(b.x, b.y, b.kind === 'ice' ? '#8bd8ff' : '#ff9c3d', 0.3, 6, 50);
          }
        }
        entities.bullets.splice(i, 1);
      }
    }
    // 내 총알 → 상대 피격 판정. 로컬 시뮬레이션에서 내가 본 peer 위치에 맞으면
    // 즉시 pvpHit 로 데미지 통지. 상대는 자기 HP 를 자기 클라이언트가 관리.
    // (기존엔 상대가 spawn 한 로컬 총알로만 판정 → 지연/시야 불일치로 자주 놓쳤음.)
    if (mp.roomCode && !mp.pvp.roundOver) {
      for (let i = entities.bullets.length - 1; i >= 0; i--) {
        const b = entities.bullets[i];
        if (b.remote || b.hostileToMe) continue;   // 상대가 쏜 총알은 여기서 제외
        for (const [pid, peer] of mp.peers) {
          if (peer.hp !== undefined && peer.hp <= 0) continue;
          if (peer.lastSeen && (performance.now() - peer.lastSeen) > 4000) continue;
          if (dist(b, peer) < (b.r || 3) + 5) {   // peer 반경 5
            const dmg = Math.max(1, Math.round(b.dmg || 6));
            mpSend({ type: 'pvpHit', targetId: pid, dmg });
            // 로컬 피드백: 예상 HP 감소 (실제 값은 state 브로드캐스트로 곧 덮어씀)
            peer.hp = Math.max(0, (peer.hp || 0) - dmg);
            spawnFloat(peer.x, peer.y - 6, Math.ceil(dmg), '#ffefa8');
            spawnParticle(b.x, b.y, b.kind === 'ice' ? '#8bd8ff' : '#ff9c3d', 0.3, 6, 50);
            state.shake = Math.max(state.shake, 2);
            sfx('hit');
            const canPierce = b.pierce;
            b.hits = (b.hits || 0) + 1;
            if (!canPierce || b.hits >= 3) { entities.bullets.splice(i, 1); }
            break;
          }
        }
      }
    }
  }

  // 멀티플레이 상태 브로드캐스트 (있으면)
  if (mp && mp.connected && mp.roomCode) {
    const nowMs = performance.now();
    if (!mp.lastSent || nowMs - mp.lastSent > (1000 / (MP_TICK_HZ || 15))) {
      mp.lastSent = nowMs;
      mpSend({ type: 'state',
        x: Math.round(player.x*10)/10, y: Math.round(player.y*10)/10,
        hp: Math.ceil(player.hp), facing: player.facing, animT: player.animT });
    }
    for (const p of mp.peers.values()) if (p.casting > 0) p.casting -= dt;
  }

  // 웨이브 진행 (PvP 매치 중에는 몹 스폰 안 함)
  if (!mp.pvp.active && entities.enemies.length === 0) {
    arena.waveDelay -= dt;
    if (arena.waveDelay <= 0) {
      arena.wave++;
      arena.score = arena.wave;
      spawnArenaWave(arena.wave);
      arena.waveDelay = 3;
      showMsg('WAVE ' + arena.wave, 2);
      sfx('level');
    }
  }

  // 사망 or 나가기
  if (player.hp <= 0 && !mp.pvp.active) {
    arena.active = false;
    arena.finished = true;
    if (arena.score > academy.bestArena) {
      academy.bestArena = arena.score;
    }
    saveAccountData();
    if (mp && mp.roomCode) mpLeaveRoom();
    state.scene = 'arenaEnd';
    return;
  }
  if (keys['KeyR']) {
    keys['KeyR'] = false;
    if (mp.pvp.active) {
      // PvP 중 R = 시리즈 기권 (남은 라운드 다 지고 종료)
      mp.pvp.oppWins = mp.pvp.target;
      mp.pvp.roundOver = true;
      mp.pvp.myRoundResult = 'lose';
      endPvpSeries();
      mpLeaveRoom();
      mp.pvp.active = false;
      state.scene = 'arena';
      arenaMenu.mode = 'menu';
      return;
    }
    arena.active = false;
    arena.finished = true;
    if (arena.score > academy.bestArena) {
      academy.bestArena = arena.score;
    }
    saveAccountData();
    if (mp && mp.roomCode) mpLeaveRoom();
    state.scene = 'arenaEnd';
  }
}

// 아레나 전용 플레이어 업데이트 (문/후퇴 없음)
function updatePlayerArena(dt) {
  const p = player;
  p.animT += dt;
  if (p.rollCd > 0) p.rollCd -= dt;
  if (p.hitFlash > 0) p.hitFlash -= dt;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.parryWindow > 0) p.parryWindow -= dt;
  for (const k in p.cd) p.cd[k] = Math.max(0, p.cd[k] - dt);
  const mpr = hasPerk('mpregen') ? 8 : 6;
  p.mp = Math.min(p.maxMp, p.mp + mpr * dt);
  if (hasPerk('regen')) p.hp = Math.min(p.maxHp, p.hp + 1 * dt);

  let mx = 0, my = 0;
  if (keys['KeyA']) mx -= 1;
  if (keys['KeyD']) mx += 1;
  if (keys['KeyW']) my -= 1;
  if (keys['KeyS']) my += 1;
  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; }

  const shieldKey = mouse.right || keys['ShiftLeft'] || keys['ShiftRight'];
  if (p.rolling > 0) {
    p.rolling -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.invuln = Math.max(p.invuln, 0.02);
  } else if (shieldKey) {
    if (!p.shielding) { p.shielding = true; p.parryWindow = 0.18; }
    if (len > 0 && p.rollCd <= 0) {
      p.rolling = 0.28;
      p.vx = mx * 200; p.vy = my * 200;
      p.rollCd = hasPerk('multiroll') ? 0.5 : 1.0;
      p.shielding = false; p.parryWindow = 0; p.invuln = 0.28;
      sfx('roll');
    } else {
      const spd = (typeof effectiveSpeed === 'function') ? effectiveSpeed(p) : p.speed;
      p.x += mx * spd * 0.3 * dt; p.y += my * spd * 0.3 * dt;
    }
  } else {
    p.shielding = false; p.parryWindow = 0;
    const spd = (typeof effectiveSpeed === 'function') ? effectiveSpeed(p) : p.speed;
    p.x += mx * spd * dt; p.y += my * spd * dt;
  }

  // 현재 활성 방 (아레나 or 듀얼)
  const room = (state.scene === 'arenaAI' || state.scene === 'arenaRoom') ? duel.room : arena.room;
  p.x = clamp(p.x, room.x + 8, room.x + room.w - 8);
  p.y = clamp(p.y, room.y + 8, room.y + room.h - 8);

  const aimX = mouse.x, aimY = mouse.y;
  const ang = angleTo(p, {x: aimX, y: aimY});
  p.facing = Math.cos(ang) >= 0 ? 1 : -1;

  // 시전 + 멀티플레이 브로드캐스트. cast 이전 bullets 스냅샷 → cast 후 새로 생긴 것들만
  // 상대적 좌표/속도/속성으로 직렬화해 상대 클라가 그대로 재현.
  function _castAndBroadcast(slot) {
    const before = entities.bullets.length;
    const ok = castSlot(p, slot, ang);
    if (!ok || !(mp && mp.roomCode)) return;
    const newBullets = [];
    for (let i = before; i < entities.bullets.length; i++) {
      const b = entities.bullets[i];
      // 상대 위치 기준으로 relative offset. 최대 16개까지만 보냄 (프레임 페이로드 상한).
      if (newBullets.length >= 16) break;
      newBullets.push({
        dx: Math.round((b.x - p.x) * 10) / 10,
        dy: Math.round((b.y - p.y) * 10) / 10,
        vx: Math.round(b.vx * 10) / 10, vy: Math.round(b.vy * 10) / 10,
        r: b.r || 3, dmg: b.dmg,
        li: Math.round(b.life * 100) / 100,
        k: b.kind, v: b.visual || null,
        pi: b.pierce ? 1 : 0, fr: b.freeze || 0,
        kb: b.knockback || 0,
        ex: b.explosive ? 1 : 0, er: b.explodeR || 0,
        ho: b.homing ? 1 : 0, bo: b.bounces || 0,
      });
    }
    mpSend({ type: 'cast', ang, slot, bullets: newBullets });
  }
  if (mouse.down && !p.shielding && p.rolling <= 0) _castAndBroadcast('lmb');
  if (keys['KeyQ'] && !p.shielding && p.rolling <= 0) { keys['KeyQ']=false; _castAndBroadcast('q'); }
  if (keys['KeyE'] && p.rolling <= 0)                 { keys['KeyE']=false; _castAndBroadcast('e'); }
  if (keys['Digit1']) { keys['Digit1']=false; usePotionSlot(0); }
  if (keys['Digit2']) { keys['Digit2']=false; usePotionSlot(1); }
  if (keys['Digit3']) { keys['Digit3']=false; usePotionSlot(2); }

  // 픽업
  for (let i = entities.pickups.length - 1; i >= 0; i--) {
    const it = entities.pickups[i];
    const d = dist(it, p);
    if (d < 20) {
      const a = angleTo(it, p);
      it.x += Math.cos(a) * 80 * dt; it.y += Math.sin(a) * 80 * dt;
    }
    if (d < 6) {
      if (it.kind === 'hp') p.hp = Math.min(p.maxHp, p.hp + 15);
      else if (it.kind === 'mp') p.mp = Math.min(p.maxMp, p.mp + 20);
      else state.gold += 1;
      entities.pickups.splice(i, 1);
      sfx('pickup');
    }
  }
}

function renderArena() {
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, W*PX, H*PX);

  // 방
  const r = arena.room;
  ctx.fillStyle = '#2a1a3a';
  ctx.fillRect(r.x*PX, r.y*PX, r.w*PX, r.h*PX);
  // 격자
  ctx.fillStyle = '#3a2a4a';
  for (let x = r.x; x < r.x + r.w; x += 16) {
    for (let y = r.y; y < r.y + r.h; y += 16) {
      if (((x/16 + y/16) & 1) === 0) {
        ctx.fillRect(x*PX, y*PX, 16*PX, 16*PX);
      }
    }
  }
  // 아레나 원
  ctx.strokeStyle = 'rgba(232, 197, 71, 0.3)';
  ctx.lineWidth = PX;
  ctx.beginPath();
  ctx.arc((r.x + r.w/2)*PX, (r.y + r.h/2)*PX, 60*PX, 0, Math.PI*2);
  ctx.stroke();
  // 벽
  ctx.fillStyle = '#5a2e8c';
  ctx.fillRect((r.x-4)*PX, (r.y-4)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, (r.y+r.h)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, r.y*PX, 4*PX, r.h*PX);
  ctx.fillRect((r.x+r.w)*PX, r.y*PX, 4*PX, r.h*PX);

  // 픽업
  for (const p of entities.pickups) {
    if (p.kind === 'hp') drawSprite(SPR_ORB_HP, ORB_HP_PAL, p.x - 2, p.y - 2);
    else if (p.kind === 'mp') drawSprite(SPR_ORB_MP, ORB_MP_PAL, p.x - 2, p.y - 2);
    else pxDraw(p.x - 2, p.y - 2, 4, 4, '#e8c547');
  }
  // 적
  for (const e of entities.enemies) drawEnemy(e);
  // 적 발사체
  for (const b of entities.ebullets) {
    if (b.kind === 'bone') { pxDraw(b.x - 1, b.y - 1, 3, 3, '#e8dcb0'); }
    else { pxDraw(b.x - 2, b.y - 2, 5, 5, '#3a1a5c'); pxDraw(b.x - 1, b.y - 1, 3, 3, '#7d4dbf'); }
  }
  // 아군 발사체
  for (const b of entities.bullets) drawBullet(b);
  // 원격 플레이어(멀티플레이) - 자기보다 살짝 아래에서 그림
  if (mp && mp.roomCode) {
    const nowMs = performance.now();
    for (const [id, peer] of mp.peers) {
      const age = nowMs - (peer.lastSeen || nowMs);
      if (age > 4000) continue;      // 4초 이상 무응답이면 숨김
      if (age > 2000) ctx.globalAlpha = 0.4;
      drawPlayer(peer.x, peer.y, peer.facing >= 0);
      ctx.globalAlpha = 1;
      // 이름표
      const nm = peer.name || '???';
      const col = id === mp.hostId ? '#ffefa8' : '#8bd8ff';
      drawText(nm, peer.x - textWidth(nm)/2, peer.y - 18, col);
      // 미니 HP 바
      const pct = clamp((peer.hp || 0) / 100, 0, 1);
      pxDraw(peer.x - 8, peer.y - 10, 16, 2, '#3a0a0a');
      pxDraw(peer.x - 8, peer.y - 10, 16 * pct, 2, '#c81616');
      // 시전 이펙트
      if (peer.casting > 0) {
        ctx.strokeStyle = 'rgba(232, 197, 71, ' + peer.casting.toFixed(2) + ')';
        ctx.lineWidth = PX;
        ctx.beginPath();
        ctx.arc(peer.x*PX, peer.y*PX, 10*PX, 0, Math.PI*2);
        ctx.stroke();
      }
    }
  }
  // 플레이어
  drawPlayer(player.x, player.y, true);
  // 파티클
  for (const p of entities.particles) {
    const a = p.life / p.max;
    ctx.globalAlpha = clamp(a, 0, 1);
    pxDraw(p.x - p.size/2, p.y - p.size/2, p.size, p.size, p.color);
  }
  ctx.globalAlpha = 1;
  for (const f of entities.floats) {
    ctx.globalAlpha = clamp(f.life, 0, 1);
    drawText(f.text, f.x - textWidth(f.text)/2, f.y - 8, f.color);
    ctx.globalAlpha = 1;
  }

  // HUD
  pxDraw(0, 0, W, 14, 'rgba(0,0,0,0.7)');
  drawText('ARENA', 4, 4, '#e8c547');
  if (mp.pvp.active) {
    // PvP HUD - 스코어와 라운드
    const scoreStr = 'YOU ' + mp.pvp.myWins + ' - ' + mp.pvp.oppWins + ' ' + mp.pvp.oppName;
    drawText(scoreStr, 40, 4, '#ffefa8');
    drawText('R' + mp.pvp.round + '/5', W/2 - 10, 4, '#e8c547');
    drawText('HP ' + Math.max(0, Math.ceil(player.hp)) + '/' + player.maxHp, W - 100, 4, '#c81616');
  } else {
    drawText('WAVE ' + arena.wave, 40, 4, '#ffefa8');
    drawText('BEST ' + academy.bestArena, 90, 4, '#8bd8ff');
    drawText('HP ' + Math.max(0, Math.ceil(player.hp)) + '/' + player.maxHp, 140, 4, '#c81616');
    if (mp && mp.roomCode) {
      const s = 'ROOM ' + mp.roomCode + '  P' + (mp.peers.size + 1);
      drawText(s, W/2 - textWidth(s)/2, 4, '#3ac762');
    }
  }
  drawText('[R] ' + (mp.pvp.active ? 'FORFEIT' : 'SURRENDER'), W - textWidth('[R] ' + (mp.pvp.active ? 'FORFEIT' : 'SURRENDER')) - 4, 4, '#8a7ab5');

  // HP/MP 바
  const hpPct = clamp(player.hp / player.maxHp, 0, 1);
  const mpPct = clamp(player.mp / player.maxMp, 0, 1);
  pxDraw(4, H - 20, 80, 4, '#3a0a0a');
  pxDraw(4, H - 20, 80 * hpPct, 4, '#c81616');
  pxDraw(4, H - 14, 80, 4, '#0a1a3a');
  pxDraw(4, H - 14, 80 * mpPct, 4, '#3b7fd6');
}

// 아레나 종료 화면
function updateArenaEnd(dt) {
  if (keys['Space'] || keys['Enter']) {
    keys['Space'] = false; keys['Enter'] = false;
    // 골드 정산 (웨이브에 비례)
    const reward = arena.score * 5;
    state.gold += reward;
    showMsg('ARENA REWARD: +' + reward + ' GOLD', 2.5);
    state.scene = 'academy';
  }
}

function renderArenaEnd() {
  bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);
  const isBest = arena.score >= academy.bestArena && arena.score > 0;
  drawText('ARENA ENDED', W/2 - textWidth('ARENA ENDED', 2)/2, 40, '#c81616', 2);
  drawText('WAVE REACHED: ' + arena.score, W/2 - textWidth('WAVE REACHED: ' + arena.score)/2, 80, '#e8d9b0');
  drawText('BEST: ' + academy.bestArena, W/2 - textWidth('BEST: ' + academy.bestArena)/2, 95, '#8bd8ff');
  if (isBest) {
    drawText('*** NEW RECORD ***', W/2 - textWidth('*** NEW RECORD ***')/2, 115, '#ffefa8');
  }
  drawText('REWARD: +' + (arena.score * 5) + ' GOLD', W/2 - textWidth('REWARD: +' + (arena.score * 5) + ' GOLD')/2, 135, '#e8c547');
  if (Math.floor(state.time * 2) % 2 === 0) {
    drawText('[SPACE] LEAVE', W/2 - textWidth('[SPACE] LEAVE')/2, 165, '#ffefa8');
  }
}

