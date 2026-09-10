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
    } else if (f.type === 'warning') {
      // 보스 공격 예고 - 빨간 채워진 원 + 펄스
      const pulse = 0.4 + Math.abs(Math.sin(state.time * 8)) * 0.5;
      ctx.fillStyle = 'rgba(200, 22, 22, ' + (0.15 * pulse * (f.life / f.max)).toFixed(2) + ')';
      ctx.beginPath();
      ctx.arc(f.x * PX, f.y * PX, f.r * PX, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 45, 45, ' + pulse.toFixed(2) + ')';
      ctx.lineWidth = PX * 2;
      ctx.beginPath();
      ctx.arc(f.x * PX, f.y * PX, f.r * PX, 0, Math.PI * 2);
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
    // 커스텀 주문 궤도
    if (b._sc_spin) {
      const cur = Math.atan2(b.vy, b.vx);
      const spd = Math.hypot(b.vx, b.vy);
      const newA = cur + b._sc_spin * dt;
      b.vx = Math.cos(newA) * spd; b.vy = Math.sin(newA) * spd;
    }
    if (b._sc_arc) {
      // 시전 방향 기준 수직 방향으로 곡률
      const cur = Math.atan2(b.vy, b.vx);
      const perp = cur + Math.PI/2;
      const spd = Math.hypot(b.vx, b.vy);
      b.vx += Math.cos(perp) * b._sc_arc * spd * dt;
      b.vy += Math.sin(perp) * b._sc_arc * spd * dt;
      // 속도 정규화 방지 - overshoot 방지
      const ns = Math.hypot(b.vx, b.vy);
      if (ns > 0) { b.vx = b.vx / ns * spd; b.vy = b.vy / ns * spd; }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // visual 이 커스텀 모션(파도/나선/지그재그 등) 갖고 있으면 추가 오프셋 적용
    if (typeof applyBulletVisualMotion === 'function') applyBulletVisualMotion(b, dt);
    b.life -= dt;
    // 지연폭발: 카운트다운 → 폭발 → 소멸
    if (b._delayFuse) {
      b._delayFuse -= dt;
      if (b._delayFuse <= 0) {
        // 광역 데미지
        const R = b._aoeR || 20;
        for (const e of entities.enemies) {
          const d = dist(b, e);
          if (d < R + e.r) {
            const df = b.dmg * (1 - d / (R + e.r));
            e.hp -= df;
            e.hitFlash = 0.14;
            if (typeof spawnFloat === 'function') spawnFloat(e.x, e.y - 6, _dmgFmt ? _dmgFmt(df) : Math.floor(df), '#ff9c3d');
          }
        }
        if (entities.fx) entities.fx.push({ type:'ring', x: b.x, y: b.y, life: 0.35, max: 0.35, r0: 4, r1: R, col: '#ffefa8' });
        if (typeof state !== 'undefined') state.shake = Math.max(state.shake || 0, 6);
        b.life = 0;
      }
    }
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
    if ((player.crit || 0) > Math.random()) { dmgMult *= (player.critMult || 2); isCrit = true; if (typeof statAdd === 'function') statAdd('critHits', 1); }

    // 카테고리별 배율 (fire/ice)
    if (b.kind === 'fire' && player.mods.fire) dmgMult *= player.mods.fire;
    if (b.kind === 'ice' && player.mods.ice) dmgMult *= player.mods.ice;

    // 적 히트
    for (const e of entities.enemies) {
      if (dist(b, e) < b.r + e.r) {
        let finalDmg = b.dmg * dmgMult;
        // 트레잇: BOSS SLAYER
        if ((e.isBoss || e.isProfessor) && player.bossDmgMult) finalDmg *= player.bossDmgMult;
        if (e._dmgRed) finalDmg *= (1 - Math.min(0.9, e._dmgRed));
        // 저주 (void 커스텀 주문): 만료 안 됐으면 25% 추가 데미지
        if (e._curseDmgAmp && e._curseUntil && performance.now() < e._curseUntil) finalDmg *= (1 + e._curseDmgAmp);
        // 축복: Hex mark (첫 히트 표식, 이후 히트 x2)
        if (b._hex) {
          if (e._hexed) finalDmg *= 2;
          else e._hexed = true;
        }
        e.hp -= finalDmg;
        // 축복: Execute (특정 HP 이하 즉사)
        if (b._execute && e.hp > 0 && e.maxHp && (e.hp / e.maxHp) < b._execute) {
          e.hp = 0;
          spawnFloat(e.x, e.y - 12, 'EXECUTE!', '#ff2d80');
        }
        // 축복: Burn (초당 데미지 인플릭트)
        if (b._burn) { e._burn = Math.max(e._burn||0, b._burn); e._burnDmg = finalDmg * 0.15; }
        // 아티팩트 VENOM CROWN: 모든 발사체 4초 독
        if (player.venomAttack) { e._burn = Math.max(e._burn||0, 4); e._burnDmg = Math.max(e._burnDmg||0, finalDmg * 0.1); }
        // 코업 게스트: 실제 데미지는 호스트가 처리. mobHit 로 통지.
        if (typeof mp !== 'undefined' && mp.coop && mp.coop.active && !mp.coop.isHost && e._syncId != null) {
          if (typeof mpSend === 'function') mpSend({ type:'mobHit', i: e._syncId, dmg: finalDmg });
        }
        e.hitFlash = isCrit ? 0.22 : 0.14;
        // 데미지 넘버: 크리 시 큰 노란 텍스트, 큰 데미지는 폰트 스케일 업
        const bigHit = finalDmg >= 1e6;
        const veryBigHit = finalDmg >= 1e9;
        const dmgLabel = _dmgFmt(finalDmg);
        const dmgCol = isCrit ? '#ffefa8' : (bigHit ? '#ff9c3d' : '#e8d9b0');
        const scale = veryBigHit ? 2 : (isCrit || bigHit ? 1 : 1);
        // 큰 히트는 두 번 (그림자 효과)
        if (veryBigHit || isCrit) spawnFloatScale(e.x, e.y - 6, dmgLabel, dmgCol, scale, 1.5);
        else spawnFloat(e.x, e.y - 6, dmgLabel, dmgCol);
        // 큰 히트 프리즈 프레임
        if (veryBigHit) state._slowMoUntil = Math.max(state._slowMoUntil || 0, performance.now() + 80);
        else if (isCrit) state._slowMoUntil = Math.max(state._slowMoUntil || 0, performance.now() + 40);

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
        // 커스텀 주문: 흡혈 (holy)
        if (b._lifesteal) player.hp = Math.min(player.maxHp, player.hp + finalDmg * b._lifesteal);
        // 커스텀 주문: 저주 (void) - 아머 감소 (dmgRed 반대 부호로 취급)
        if (b._curse) { e._curseDmgAmp = Math.max(e._curseDmgAmp || 0, 0.25); e._curseUntil = performance.now() + b._curse * 1000; }
        // 커스텀 주문: 연쇄
        if (b._chainLeft && b._chainLeft > 0) {
          let nearest = null, nd = Infinity;
          for (const e2 of entities.enemies) {
            if (e2 === e) continue;
            const dd = dist(b, e2);
            if (dd < nd && dd < (b._chainR || 60)) { nearest = e2; nd = dd; }
          }
          if (nearest) {
            const a2 = angleTo(b, nearest);
            const spd2 = Math.hypot(b.vx, b.vy) || 200;
            entities.bullets.push({
              x: b.x, y: b.y,
              vx: Math.cos(a2) * spd2, vy: Math.sin(a2) * spd2,
              r: b.r, dmg: b.dmg * 0.75, life: 0.4, kind: b.kind, hits: 0,
              _customSpell: true, _element: b._element,
              _chainLeft: b._chainLeft - 1, _chainR: b._chainR,
            });
          }
        }
        state.shake = Math.max(state.shake, isCrit ? 4 : 2);
        if (isCrit) sfx('crit'); else sfx('hit');

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
        const pierceMax = (b._pierceLeft ? Math.max(3, b._pierceLeft + 1) : 3);
        if (canPierce && b.hits < pierceMax) continue;
        b.life = 0;
        break;
      }
    }
    if (b.life <= 0) {
      // 커스텀: 지면 장판 - bullet 소멸 시 stationary DoT 장판 스폰
      if (b._groundDur && !b._groundSpawned) {
        b._groundSpawned = true;
        entities.bullets.push({
          x: b.x, y: b.y, vx: 0, vy: 0,
          r: b._groundR || 20, dmg: b.dmg * 0.3, life: b._groundDur, kind: b.kind, hits: 0,
          _isGround: true, pierce: true, _pierceLeft: 9999,
        });
        if (entities.fx) entities.fx.push({ type:'ring', x: b.x, y: b.y, life: b._groundDur, max: b._groundDur, r0: 2, r1: (b._groundR || 20), col: '#c86ade' });
      }
      entities.bullets.splice(i, 1);
    }
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
      // 볼트 특수: 독 DoT (venom_spitter 등)
      if (b._venomDot) {
        player._poisonUntil = Math.max(player._poisonUntil || 0, performance.now() + b._venomDot * 1000);
      }
      spawnParticle(b.x, b.y, b.kind === 'bone' ? '#e8dcb0' : (b.kind === 'venom' ? '#3ac762' : '#7d4dbf'), 0.3, 6, 50);
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
  const magnetRange = 30 + (player.pickupRange || 0);
  for (let i = entities.pickups.length - 1; i >= 0; i--) {
    const p = entities.pickups[i];
    p.life -= dt;
    p.bob += dt * 4;
    // 픽업 자석: 일정 반경 내 픽업이 플레이어 쪽으로 부드럽게 이동
    const d = dist(p, player);
    if (d < magnetRange && p.kind !== 'pouch') {
      const a = Math.atan2(player.y - p.y, player.x - p.x);
      const speed = 60 + (magnetRange - d) * 3;
      p.x += Math.cos(a) * speed * dt;
      p.y += Math.sin(a) * speed * dt;
    }
    if (p.life <= 0) entities.pickups.splice(i, 1);
  }
}
function updateDoors(dt) {}

