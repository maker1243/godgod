// =====================================================================
// Projectiles
// =====================================================================

// ---------- 발사체 ----------
// 시각 이펙트 (링/슬래시/트레일) - 히트 시점의 폭발감 강화용
function updateFx(dt) {
  if (!entities.fx) return;
  for (let i = entities.fx.length - 1; i >= 0; i--) {
    const f = entities.fx[i];
    f.life -= dt;
    if (f.life <= 0) entities.fx.splice(i, 1);
  }
}
function drawFx() {
  if (!entities.fx) return;
  for (const f of entities.fx) {
    const t = 1 - (f.life / f.max);   // 0 → 1 progress
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    if (f.type === 'ring') {
      const r = f.r0 + (f.r1 - f.r0) * t;
      ctx.strokeStyle = f.col;
      ctx.lineWidth = PX * 2;
      ctx.beginPath();
      ctx.arc(f.x * PX, f.y * PX, r * PX, 0, Math.PI * 2);
      ctx.stroke();
    } else if (f.type === 'slash') {
      const len = f.len * (0.6 + t * 0.6);
      ctx.strokeStyle = f.col;
      ctx.lineWidth = PX * 3;
      ctx.beginPath();
      ctx.moveTo((f.x + Math.cos(f.ang) * len)*PX, (f.y + Math.sin(f.ang) * len)*PX);
      ctx.lineTo((f.x - Math.cos(f.ang) * len)*PX, (f.y - Math.sin(f.ang) * len)*PX);
      ctx.stroke();
    } else if (f.type === 'trail') {
      pxDraw(f.x - 1, f.y - 1, 2, 2, f.col);
    } else if (f.type === 'castRing') {
      const r = f.r0 + (f.r1 - f.r0) * t;
      ctx.strokeStyle = f.col;
      ctx.lineWidth = PX;
      ctx.beginPath();
      ctx.arc(f.x * PX, f.y * PX, r * PX, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function updateBullets(dt) {
  const rm = rooms[currentRoom];
  if (!rm) return;
  for (let i = entities.bullets.length - 1; i >= 0; i--) {
    const b = entities.bullets[i];
    // 유도
    if (b.homing) {
      let closest = null, cd = Infinity;
      for (const e of entities.enemies) {
        const dd = dist(b, e);
        if (dd < cd && dd < 80) { closest = e; cd = dd; }
      }
      if (closest) {
        const desired = angleTo(b, closest);
        const cur = Math.atan2(b.vy, b.vx);
        const spd = Math.hypot(b.vx, b.vy);
        const newA = cur + Math.max(-2*dt, Math.min(2*dt, ((desired-cur+Math.PI*3)%(Math.PI*2))-Math.PI));
        b.vx = Math.cos(newA) * spd; b.vy = Math.sin(newA) * spd;
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // visual 이 커스텀 모션(파도/나선/지그재그 등) 갖고 있으면 추가 오프셋 적용
    if (typeof applyBulletVisualMotion === 'function') applyBulletVisualMotion(b, dt);
    b.life -= dt;
    // 벽 처리: bounces 남았으면 반사, 아니면 소멸
    if (b.x < rm.x) {
      if (b.bounces && b.bounces > 0) { b.bounces--; b.vx = Math.abs(b.vx); b.x = rm.x + 1; sfx('hit'); }
      else b.life = 0;
    } else if (b.x > rm.x + rm.w) {
      if (b.bounces && b.bounces > 0) { b.bounces--; b.vx = -Math.abs(b.vx); b.x = rm.x + rm.w - 1; sfx('hit'); }
      else b.life = 0;
    }
    if (b.y < rm.y) {
      if (b.bounces && b.bounces > 0) { b.bounces--; b.vy = Math.abs(b.vy); b.y = rm.y + 1; sfx('hit'); }
      else b.life = 0;
    } else if (b.y > rm.y + rm.h) {
      if (b.bounces && b.bounces > 0) { b.bounces--; b.vy = -Math.abs(b.vy); b.y = rm.y + rm.h - 1; sfx('hit'); }
      else b.life = 0;
    }

    // 데미지 배율 계산 (베르세르크, 데스위시, 새크리파이스, 오버플로우 등)
    let dmgMult = 1;
    if (hasPerk('berserk') && player.hp / player.maxHp < 0.3) dmgMult *= 2;
    if (hasPerk('overflow') && player.mp >= player.maxMp * 0.99) dmgMult *= 1.3;
    if (hasPerk('sacrifice')) dmgMult *= (1 + Math.min(0.5, (player.sacrifStacks||0) * 0.05));
    if (hasPerk('circlelife') && player.hp >= player.maxHp) dmgMult *= 1.2;
    if (hasPerk('balance')) {
      const hpP = player.hp/player.maxHp, mpP = player.mp/player.maxMp;
      if (Math.abs(hpP - mpP) < 0.15) dmgMult *= 1.2;
    }
    if (hasPerk('manaburn')) dmgMult *= (1 + Math.floor(player.mp/10) * 0.05);
    if (hasPerk('doubleornothing')) dmgMult *= (Math.random() < 0.5 ? 2 : 0.5);

    // 크리티컬
    let isCrit = false;
    if ((player.crit || 0) > Math.random()) { dmgMult *= (player.critMult || 2); isCrit = true; }

    // 카테고리별 배율 (fire/ice)
    if (b.kind === 'fire' && player.mods.fire) dmgMult *= player.mods.fire;
    if (b.kind === 'ice' && player.mods.ice) dmgMult *= player.mods.ice;

    // 적 히트
    for (const e of entities.enemies) {
      if (dist(b, e) < b.r + e.r) {
        let finalDmg = b.dmg * dmgMult;
        if (e._dmgRed) finalDmg *= (1 - Math.min(0.9, e._dmgRed));
        e.hp -= finalDmg;
        e.hitFlash = isCrit ? 0.22 : 0.14;
        spawnFloat(e.x, e.y - 6, Math.ceil(finalDmg), isCrit ? '#ffefa8' : '#ffefa8');

        // === 강화된 히트 이펙트 ===
        const baseCol = b.kind === 'ice' ? '#8bd8ff' : (b.kind === 'fire' ? '#ff9c3d' : '#c86ade');
        const accCol  = b.kind === 'ice' ? '#ddf5ff' : (b.kind === 'fire' ? '#ffefa8' : '#ffb8ff');
        const partCount = isCrit ? 14 : 8;
        for (let i = 0; i < partCount; i++) {
          const pa = Math.random() * Math.PI * 2;
          const ps = 40 + Math.random() * 60;
          spawnParticle(b.x + Math.cos(pa)*2, b.y + Math.sin(pa)*2, i % 2 ? accCol : baseCol, 0.4, 2 + Math.random()*2, ps);
        }
        // 링 임팩트 (짧게 확장하는 원)
        if (typeof entities.fx !== 'undefined' && entities.fx) {
          entities.fx.push({ type:'ring', x: b.x, y: b.y, life: 0.25, max: 0.25, r0: 3, r1: isCrit ? 16 : 10, col: accCol });
        }
        // 크리티컬 슬래시
        if (isCrit && typeof entities.fx !== 'undefined' && entities.fx) {
          const sa = Math.atan2(b.vy, b.vx);
          entities.fx.push({ type:'slash', x: e.x, y: e.y, ang: sa, life: 0.22, max: 0.22, len: 20, col: '#ffefa8' });
        }

        // 익스트림 방 버프: thorns (몹이 데미지 받으면 플레이어에게 반사)
        if (e._thorns && !player.invuln) {
          player.hp -= e._thorns;
          spawnFloat(player.x, player.y - 8, '-' + e._thorns, '#c81616');
        }

        if (b.kind === 'ice') {
          if (!e.isBoss) e.freeze = Math.max(e.freeze || 0, b.freeze);
          else e.slow = Math.max(e.slow || 0, 1.2);
        }
        // 넉백
        if (hasPerk('recoil') || b.knockback) {
          const a = angleTo(b, e);
          e.x += Math.cos(a) * (b.knockback || 4);
          e.y += Math.sin(a) * (b.knockback || 4);
        }
        // 라이프스틸
        if (player.lifesteal) player.hp = Math.min(player.maxHp, player.hp + player.lifesteal);
        state.shake = Math.max(state.shake, isCrit ? 4 : 2);
        sfx('hit');

        // 폭발형
        if (b.explosive) {
          const R = b.explodeR || 20;
          for (const e2 of entities.enemies) {
            if (e2 === e) continue;
            if (dist(b, e2) < R) {
              e2.hp -= finalDmg * 0.6;
              e2.hitFlash = 0.1;
              spawnFloat(e2.x, e2.y - 6, Math.ceil(finalDmg * 0.6), '#ff9c3d');
            }
          }
          spawnParticle(b.x, b.y, '#ff9c3d', 0.6, 16, 100);
          state.shake = Math.max(state.shake, 5);
        }

        b.hits++;
        const canPierce = b.pierce || hasPerk('lmbpierce');
        if (canPierce && b.hits < 3) continue;
        b.life = 0;
        break;
      }
    }
    if (b.life <= 0) entities.bullets.splice(i, 1);
  }
}

function updateEBullets(dt) {
  const rm = rooms[currentRoom];
  for (let i = entities.ebullets.length - 1; i >= 0; i--) {
    const b = entities.ebullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // 교수 학과 테마 발사체는 커스텀 모션 (wave/spiral/pulse 등)도 적용
    if (typeof applyBulletVisualMotion === 'function') applyBulletVisualMotion(b, dt);
    b.life -= dt;
    if (b.x < rm.x || b.x > rm.x + rm.w || b.y < rm.y || b.y > rm.y + rm.h) b.life = 0;

    if (dist(b, player) < b.r + player.r) {
      damagePlayer(b.dmg, b);
      spawnParticle(b.x, b.y, b.kind === 'bone' ? '#e8dcb0' : '#7d4dbf', 0.3, 6, 50);
      b.life = 0;
    }
    if (b.life <= 0) entities.ebullets.splice(i, 1);
  }
}

function updateParticles(dt) {
  for (let i = entities.particles.length - 1; i >= 0; i--) {
    const p = entities.particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.9; p.vy *= 0.9;
    p.life -= dt;
    if (p.life <= 0) entities.particles.splice(i, 1);
  }
}
function updateFloats(dt) {
  for (let i = entities.floats.length - 1; i >= 0; i--) {
    const f = entities.floats[i];
    f.y += f.vy * dt;
    f.life -= dt;
    if (f.life <= 0) entities.floats.splice(i, 1);
  }
}
function updatePickups(dt) {
  for (let i = entities.pickups.length - 1; i >= 0; i--) {
    const p = entities.pickups[i];
    p.life -= dt;
    p.bob += dt * 4;
    if (p.life <= 0) entities.pickups.splice(i, 1);
  }
}
function updateDoors(dt) {}

