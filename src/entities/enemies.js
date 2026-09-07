// =====================================================================
// Enemy AI + bosses
// =====================================================================

// ---------- 적 업데이트 ----------
function updateEnemies(dt) {
  for (let i = entities.enemies.length - 1; i >= 0; i--) {
    const e = entities.enemies[i];
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    if (e.freeze > 0) { e.freeze -= dt; continue; }
    if (e.slow > 0) e.slow -= dt;
    if (e.stun > 0) { e.stun -= dt; continue; }

    // 익스트림 방 버프: 리젠
    if (e._regen && e.hp < e.maxHp) {
      e.hp = Math.min(e.maxHp, e.hp + e._regen * dt);
    }

    const speedMod = (e.slow > 0) ? 0.4 : 1.0;

    // 시련 보스는 전용 업데이터 사용 (원래 kind 별 AI 대신)
    if (e.isTrialBoss && typeof updateTrialBoss === 'function') {
      updateTrialBoss(e, dt, speedMod);
    }
    else if (e.isProfessor && typeof updateProfessor === 'function') {
      updateProfessor(e, dt, speedMod);
      if (e._profDeathT > 0) continue;
      if (e.hp <= 0 && e._profDeathT <= 0 && e._profEntryT <= 0) {
        // 교수 처치 기록 + 관련 스킬 잠금 해제 + 스토리 조각 + 통계
        if (e._profDef && e._profDef.key) {
          state.professorsBeaten = state.professorsBeaten || {};
          state.professorsBeaten[e._profDef.key] = (state.professorsBeaten[e._profDef.key] || 0) + 1;
          if (typeof statAdd === 'function') statAdd('profsBeaten', 1);
          if (typeof unlockStoryFragment === 'function') unlockStoryFragment(e._profDef.key);
          if (typeof checkAchievements === 'function') checkAchievements();
          if (typeof checkDailies === 'function') checkDailies();
          // rewardSkills: 각 스킬을 maxLv 로 즉시 소유 (이미 max 면 스킵)
          const rewards = e._profDef.rewardSkills || [];
          let unlockedNames = [];
          for (const sid of rewards) {
            const s = (typeof SKILL_BY_ID !== 'undefined') ? SKILL_BY_ID[sid] : null;
            if (!s) continue;
            const maxLv = s.maxLv || 1;
            const cur = state.ownedSkills[sid] || 0;
            if (cur < maxLv) {
              state.ownedSkills[sid] = maxLv;
              unlockedNames.push(s.name);
            }
          }
          if (unlockedNames.length && typeof showMsg === 'function') {
            showMsg('스킬 해금: ' + unlockedNames.join(', '), 4);
          }
          if (unlockedNames.length && typeof spawnFloat === 'function' && player) {
            spawnFloat(player.x, player.y - 12, 'UNLOCK: ' + unlockedNames.length + ' SKILL', '#ffefa8');
          }
        }
        onEnemyDeath(e);
        entities.enemies.splice(i, 1);
      }
      continue;
    }
    else if (e.kind === 'slime')    updateSlime(e, dt, speedMod);
    else if (e.kind === 'skeleton') updateSkeleton(e, dt, speedMod);
    else if (e.kind === 'wraith')   updateWraith(e, dt, speedMod);
    else if (e.kind === 'bat')      updateBat(e, dt, speedMod);
    else if (e.kind === 'imp')      updateImp(e, dt, speedMod);
    else if (e.kind === 'golem')    updateGolem(e, dt, speedMod);
    else if (e.kind === 'spider')   updateSpider(e, dt, speedMod);
    else if (e.kind === 'cultist')  updateCultist(e, dt, speedMod);
    else if (e.kind === 'knight')   updateKnight(e, dt, speedMod);
    else if (e.kind === 'colossus') updateColossus(e, dt, speedMod);
    else if (e.kind === 'seer')     updateSeer(e, dt, speedMod);
    else if (e.kind === 'lich')     updateLich(e, dt, speedMod);
    else if (e.kind === 'core')     updateCore(e, dt, speedMod);
    else if (e.kind === 'shade')    updateShade(e, dt, speedMod);
    else if (e.kind === 'dragonlord') updateDragonlord(e, dt, speedMod);
    else if (e.kind === 'voidempress') updateVoidEmpress(e, dt, speedMod);
    else if (e.kind === 'chronomancer') updateChronomancer(e, dt, speedMod);

    // 벽 클램프
    const rm = rooms[currentRoom];
    e.x = clamp(e.x, rm.x + 6, rm.x + rm.w - 6);
    e.y = clamp(e.y, rm.y + 6, rm.y + rm.h - 6);

    // 접촉 데미지
    if (dist(e, player) < e.r + player.r) {
      damagePlayer(e.dmg * dt * 2, e);
    }

    // 사망
    if (e.hp <= 0) {
      onEnemyDeath(e);
      entities.enemies.splice(i, 1);
    }
  }
}

function updateSlime(e, dt, sm) {
  // 튀듯이 이동: 짧게 정지 -> 도약
  if (e.attackCd <= 0) {
    const a = angleTo(e, player);
    e.vx = Math.cos(a) * e.speed * 3 * sm;
    e.vy = Math.sin(a) * e.speed * 3 * sm;
    e.attackCd = 1.0;
  } else {
    e.attackCd -= dt;
  }
  e.vx *= 0.9;
  e.vy *= 0.9;
  e.x += e.vx * dt;
  e.y += e.vy * dt;
}

function updateSkeleton(e, dt, sm) {
  const d = dist(e, player);
  const a = angleTo(e, player);
  // 거리 유지: 너무 가까우면 후퇴, 너무 멀면 접근, 중간이면 정지
  if (d < 40) {
    e.x -= Math.cos(a) * e.speed * sm * dt;
    e.y -= Math.sin(a) * e.speed * sm * dt;
  } else if (d > 90) {
    e.x += Math.cos(a) * e.speed * sm * dt;
    e.y += Math.sin(a) * e.speed * sm * dt;
  }
  // 뼈 던지기
  e.shootCd -= dt;
  if (e.shootCd <= 0 && d < 130) {
    entities.ebullets.push({
      x: e.x, y: e.y - 4,
      vx: Math.cos(a) * 110, vy: Math.sin(a) * 110,
      r: 2, dmg: e.dmg, life: 2, kind: 'bone',
    });
    e.shootCd = rand(1.4, 2.6);
  }
}

function updateWraith(e, dt, sm) {
  const a = angleTo(e, player);
  const d = dist(e, player);
  // 순간이동
  e.teleCd -= dt;
  if (e.teleCd <= 0 && d > 60) {
    spawnParticle(e.x, e.y, '#7d4dbf', 0.4, 10, 60);
    const rm = rooms[currentRoom];
    e.x = clamp(player.x + Math.cos(a + Math.PI) * 30 + rand(-10,10), rm.x + 10, rm.x + rm.w - 10);
    e.y = clamp(player.y + Math.sin(a + Math.PI) * 30 + rand(-10,10), rm.y + 10, rm.y + rm.h - 10);
    spawnParticle(e.x, e.y, '#7d4dbf', 0.4, 10, 60);
    e.teleCd = rand(3, 5);
  }
  // 저속 추적
  e.x += Math.cos(a) * e.speed * sm * dt * 0.6;
  e.y += Math.sin(a) * e.speed * sm * dt * 0.6;
  // 쉐도우 볼트
  e.attackCd -= dt;
  if (e.attackCd <= 0 && d < 100) {
    entities.ebullets.push({
      x: e.x, y: e.y,
      vx: Math.cos(a) * 90, vy: Math.sin(a) * 90,
      r: 3, dmg: e.dmg, life: 2.5, kind: 'shadow',
    });
    e.attackCd = rand(1.5, 2.5);
  }
}

// === 신규 잡몹 AI ===
function updateBat(e, dt, sm) {
  // 빠른 지그재그로 접근
  const a = angleTo(e, player);
  e.zigT += dt * 8;
  const zig = Math.sin(e.zigT) * 0.8;
  const perp = a + Math.PI/2;
  e.x += (Math.cos(a) + Math.cos(perp) * zig) * e.speed * sm * dt * 0.7;
  e.y += (Math.sin(a) + Math.sin(perp) * zig) * e.speed * sm * dt * 0.7;
}

function updateImp(e, dt, sm) {
  const a = angleTo(e, player);
  const d = dist(e, player);
  // 접근 후 뛰어드는 러쉬
  if (d > 25) {
    e.x += Math.cos(a) * e.speed * sm * dt;
    e.y += Math.sin(a) * e.speed * sm * dt;
    e.chargeCd = 0;
  } else {
    // 근접 시 짧게 대기 후 도약
    e.chargeCd += dt;
    if (e.chargeCd > 0.4) {
      e.x += Math.cos(a) * e.speed * sm * dt * 2.5;
      e.y += Math.sin(a) * e.speed * sm * dt * 2.5;
    }
  }
}

function updateGolem(e, dt, sm) {
  const a = angleTo(e, player);
  const d = dist(e, player);
  // 매우 느린 추적
  e.x += Math.cos(a) * e.speed * sm * dt;
  e.y += Math.sin(a) * e.speed * sm * dt;
  // 근접 시 스매시 (범위 데미지)
  e.smashCd -= dt;
  if (e.smashCd <= 0 && d < 30) {
    // 8방향 파편 발사
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      entities.ebullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(ang) * 80, vy: Math.sin(ang) * 80,
        r: 3, dmg: e.dmg * 0.7, life: 1.2, kind: 'bone',
      });
    }
    state.shake = Math.max(state.shake, 4);
    sfx('boss');
    e.smashCd = rand(2.5, 4);
  }
}

function updateSpider(e, dt, sm) {
  // 극도로 빠른 러쉬
  const a = angleTo(e, player);
  e.x += Math.cos(a) * e.speed * sm * dt;
  e.y += Math.sin(a) * e.speed * sm * dt;
}

function updateCultist(e, dt, sm) {
  const a = angleTo(e, player);
  const d = dist(e, player);
  // 거리 유지 + 3-way 볼트
  if (d < 60) {
    e.x -= Math.cos(a) * e.speed * sm * dt;
    e.y -= Math.sin(a) * e.speed * sm * dt;
  } else if (d > 120) {
    e.x += Math.cos(a) * e.speed * sm * dt;
    e.y += Math.sin(a) * e.speed * sm * dt;
  }
  e.spellCd -= dt;
  if (e.spellCd <= 0 && d < 150) {
    // 자주색 3-way 볼트
    for (let i = -1; i <= 1; i++) {
      const ang = a + i * 0.25;
      entities.ebullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(ang) * 100, vy: Math.sin(ang) * 100,
        r: 3, dmg: e.dmg, life: 2.5, kind: 'shadow',
      });
    }
    e.spellCd = rand(2, 3.5);
  }
}

// === 엑스트라 보스 AI ===
function updateDragonlord(e, dt, sm) {
  // 화염 브레스 + 돌진 + 유성 낙하 (기존 knight+colossus 조합)
  const a = angleTo(e, player);
  const d = dist(e, player);
  // 저속 추적
  e.x += Math.cos(a) * e.speed * sm * dt * 0.7;
  e.y += Math.sin(a) * e.speed * sm * dt * 0.7;

  // 화염 브레스 (부채꼴)
  e.breathCd = (e.breathCd || 3) - dt;
  if (e.breathCd <= 0 && d < 150) {
    for (let i = 0; i < 9; i++) {
      const ang = a + (i - 4) * 0.10;
      entities.ebullets.push({
        x: e.x + Math.cos(ang) * 10, y: e.y + Math.sin(ang) * 10,
        vx: Math.cos(ang) * (90 + Math.random() * 40), vy: Math.sin(ang) * (90 + Math.random() * 40),
        r: 4, dmg: e.dmg * 0.6, life: 1.8, kind: 'fire',
      });
    }
    sfx('fire');
    e.breathCd = rand(2.8, 4);
  }

  // 유성 낙하 (플레이어 위치에)
  e.meteorCd = (e.meteorCd || 5) - dt;
  if (e.meteorCd <= 0) {
    const tx = player.x, ty = player.y;
    entities.ebullets.push({
      x: tx, y: ty - 60,
      vx: 0, vy: 200,
      r: 5, dmg: e.dmg, life: 0.4, kind: 'fire',
    });
    spawnParticle(tx, ty, '#ff9c3d', 0.5, 6, 40);
    e.meteorCd = rand(3.5, 5.5);
  }
}

function updateVoidEmpress(e, dt, sm) {
  // 순간이동 + 관통 볼트 + 그림자 소환
  const a = angleTo(e, player);
  const d = dist(e, player);

  // 텔레포트 (자주)
  e.teleCd = (e.teleCd || 2) - dt;
  if (e.teleCd <= 0) {
    spawnParticle(e.x, e.y, '#c86ade', 0.4, 14, 70);
    const rm = rooms[currentRoom];
    e.x = clamp(player.x + Math.cos(a + Math.PI) * 40 + rand(-20, 20), rm.x + 15, rm.x + rm.w - 15);
    e.y = clamp(player.y + Math.sin(a + Math.PI) * 40 + rand(-20, 20), rm.y + 15, rm.y + rm.h - 15);
    spawnParticle(e.x, e.y, '#c86ade', 0.4, 14, 70);
    e.teleCd = rand(2.5, 4);
  }

  // 관통 8방향 볼트
  e.volleyCd = (e.volleyCd || 3) - dt;
  if (e.volleyCd <= 0) {
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      entities.ebullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(ang) * 130, vy: Math.sin(ang) * 130,
        r: 3, dmg: e.dmg * 0.6, life: 3.0, kind: 'shadow',
      });
    }
    e.volleyCd = rand(3, 4.5);
  }

  // 그림자 소환
  e.summonCd = (e.summonCd || 10) - dt;
  if (e.summonCd <= 0 && entities.enemies.length < 10) {
    for (let i = 0; i < 2; i++) {
      spawnEnemy('wraith', rooms[currentRoom]);
    }
    e.summonCd = rand(10, 15);
  }
}

function updateChronomancer(e, dt, sm) {
  // 시간 정지 + 텔레포트 + 링 볼트
  const a = angleTo(e, player);
  const d = dist(e, player);

  // 저속 추적
  e.x += Math.cos(a) * e.speed * sm * dt * 0.5;
  e.y += Math.sin(a) * e.speed * sm * dt * 0.5;

  // 시간 링 (사방 대칭 회전 볼트)
  e.ringCd = (e.ringCd || 3) - dt;
  if (e.ringCd <= 0) {
    e.ringPhase = (e.ringPhase || 0) + 0.4;
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + e.ringPhase;
      entities.ebullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(ang) * 80, vy: Math.sin(ang) * 80,
        r: 3, dmg: e.dmg * 0.5, life: 2.5, kind: 'shadow',
      });
    }
    e.ringCd = rand(2.2, 3.2);
  }

  // 텔레포트
  e.warpCd = (e.warpCd || 6) - dt;
  if (e.warpCd <= 0) {
    spawnParticle(e.x, e.y, '#ffefa8', 0.5, 20, 80);
    const rm = rooms[currentRoom];
    e.x = clamp(rm.x + rm.w/2 + rand(-40, 40), rm.x + 15, rm.x + rm.w - 15);
    e.y = clamp(rm.y + rm.h/2 + rand(-30, 30), rm.y + 15, rm.y + rm.h - 15);
    spawnParticle(e.x, e.y, '#ffefa8', 0.5, 20, 80);
    e.warpCd = rand(5, 8);
  }

  // 시간 정지 (10초마다, 플레이어를 잠시 얼림)
  e.stopCd = (e.stopCd || 12) - dt;
  if (e.stopCd <= 0 && d < 100) {
    // 짧은 프리즈 대신 강력한 유도 볼트 3발
    for (let i = -1; i <= 1; i++) {
      entities.ebullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(a + i * 0.4) * 110, vy: Math.sin(a + i * 0.4) * 110,
        r: 4, dmg: e.dmg, life: 3.0, kind: 'shadow',
      });
    }
    sfx('boss');
    e.stopCd = rand(8, 12);
  }
}

function updateLich(e, dt, sm) {
  const a = angleTo(e, player);
  const d = dist(e, player);
  e.phaseT += dt;

  // 서서히 접근 (부유)
  if (d > 80) {
    e.x += Math.cos(a) * e.speed * sm * dt;
    e.y += Math.sin(a) * e.speed * sm * dt;
  }

  // 페이즈: 공격 패턴 순환
  e.attackCd -= dt;
  if (e.attackCd <= 0) {
    const hpPct = e.hp / e.maxHp;
    const pattern = e.phase % 3;
    if (pattern === 0) {
      // 방사형 12발
      for (let i = 0; i < 12; i++) {
        const aa = (i / 12) * Math.PI * 2;
        entities.ebullets.push({
          x: e.x, y: e.y, vx: Math.cos(aa)*70, vy: Math.sin(aa)*70,
          r: 3, dmg: e.dmg, life: 3, kind: 'shadow'
        });
      }
    } else if (pattern === 1) {
      // 3연발 조준
      for (let i = -1; i <= 1; i++) {
        const aa = a + i * 0.15;
        entities.ebullets.push({
          x: e.x, y: e.y, vx: Math.cos(aa)*130, vy: Math.sin(aa)*130,
          r: 3, dmg: e.dmg, life: 3, kind: 'shadow'
        });
      }
    } else {
      // 소환: 슬라임 2마리
      for (let i = 0; i < 2; i++) {
        spawnEnemy('slime', rooms[currentRoom]);
      }
    }
    e.phase++;
    e.attackCd = hpPct < 0.4 ? 1.4 : 2.2;
    sfx('fire');
  }
}

// ========== 썩은 기사 (1층 보스) ==========
// 근접 추격 + 돌진 + 광역 검격
function updateKnight(e, dt, sm) {
  const a = angleTo(e, player);
  const d = dist(e, player);

  // 상태: 0 = 추격, 1 = 돌진 준비, 2 = 돌진 중, 3 = 슬램 준비
  e.chargeCd -= dt;
  e.slamCd -= dt;

  if (e.phase === 2) {
    // 돌진 중
    e.x += Math.cos(e.chargeAng) * 180 * dt * sm;
    e.y += Math.sin(e.chargeAng) * 180 * dt * sm;
    e.chargeT -= dt;
    // 궤적 파티클
    if (Math.random() < 0.5) spawnParticle(e.x, e.y, '#ff2d2d', 0.3, 2, 20);
    if (e.chargeT <= 0) { e.phase = 0; e.chargeCd = rand(2.5, 4); }
    return;
  }
  if (e.phase === 1) {
    // 돌진 준비 (짧은 정지, 방향 표시)
    e.chargeT -= dt;
    if (e.chargeT <= 0) { e.phase = 2; e.chargeT = 0.5; sfx('boss'); state.shake = 4; }
    return;
  }
  if (e.phase === 3) {
    // 슬램 준비
    e.chargeT -= dt;
    if (e.chargeT <= 0) {
      // 광역 검격: 원형 폭발
      for (let i = 0; i < 16; i++) {
        const aa = (i / 16) * Math.PI * 2;
        entities.ebullets.push({
          x: e.x, y: e.y, vx: Math.cos(aa)*100, vy: Math.sin(aa)*100,
          r: 3, dmg: e.dmg, life: 1.2, kind: 'shadow'
        });
      }
      spawnParticle(e.x, e.y, '#ff2d2d', 0.6, 24, 100);
      state.shake = 8;
      sfx('boss');
      e.phase = 0;
      e.slamCd = rand(4, 6);
    }
    return;
  }

  // 추격
  e.x += Math.cos(a) * e.speed * sm * dt;
  e.y += Math.sin(a) * e.speed * sm * dt;

  // 돌진 트리거 (거리 있을 때)
  if (e.chargeCd <= 0 && d > 40) {
    e.phase = 1;
    e.chargeT = 0.6;
    e.chargeAng = a;
  }
  // 슬램 트리거 (가까울 때)
  if (e.slamCd <= 0 && d < 30) {
    e.phase = 3;
    e.chargeT = 0.7;
  }
}

// ========== 뼈 거상 (2층 보스) ==========
// 저속 이동 + 뼈 비 소환 + 강타
function updateColossus(e, dt, sm) {
  const a = angleTo(e, player);
  const d = dist(e, player);
  e.stompCd -= dt;
  e.rainCd -= dt;

  // 저속 추격
  e.x += Math.cos(a) * e.speed * sm * dt;
  e.y += Math.sin(a) * e.speed * sm * dt;

  // 뼈 비: 랜덤 위치에 예고 후 낙하
  if (e.rainCd <= 0) {
    const rm = rooms[currentRoom];
    for (let i = 0; i < 6; i++) {
      const tx = rm.x + 20 + Math.random() * (rm.w - 40);
      const ty = rm.y + 20 + Math.random() * (rm.h - 40);
      // 예고 마커 파티클
      spawnParticle(tx, ty, '#e8dcb0', 0.8, 4, 5);
      setTimeout(() => {
        entities.ebullets.push({
          x: tx, y: ty - 40,
          vx: 0, vy: 200,
          r: 3, dmg: e.dmg, life: 0.5, kind: 'bone'
        });
      }, 500 + i * 80);
    }
    e.rainCd = rand(5, 7);
  }

  // 강타: 근접 시 광역
  if (e.stompCd <= 0 && d < 50) {
    for (let i = 0; i < 12; i++) {
      const aa = (i / 12) * Math.PI * 2;
      entities.ebullets.push({
        x: e.x, y: e.y, vx: Math.cos(aa)*90, vy: Math.sin(aa)*90,
        r: 3, dmg: e.dmg, life: 1.0, kind: 'bone'
      });
    }
    spawnParticle(e.x, e.y, '#e8dcb0', 0.5, 20, 80);
    state.shake = 6;
    sfx('boss');
    e.stompCd = rand(3, 4.5);
  }
}

// ========== 그림자 예언자 (3층 보스) ==========
// 순간이동 + 대량 그림자 볼트 + 분신 소환
function updateSeer(e, dt, sm) {
  const a = angleTo(e, player);
  const d = dist(e, player);
  e.teleCd -= dt;
  e.volleyCd -= dt;
  e.cloneCd -= dt;

  // 순간이동 (가까우면 도망)
  if (e.teleCd <= 0 && d < 45) {
    spawnParticle(e.x, e.y, '#7d4dbf', 0.4, 12, 60);
    const rm = rooms[currentRoom];
    e.x = clamp(rm.x + 20 + Math.random() * (rm.w - 40), rm.x + 10, rm.x + rm.w - 10);
    e.y = clamp(rm.y + 20 + Math.random() * (rm.h - 40), rm.y + 10, rm.y + rm.h - 10);
    spawnParticle(e.x, e.y, '#7d4dbf', 0.4, 12, 60);
    e.teleCd = rand(2.5, 4);
  } else {
    // 저속 부유
    e.x += Math.cos(a) * e.speed * sm * dt * 0.5;
    e.y += Math.sin(a) * e.speed * sm * dt * 0.5;
  }

  // 그림자 볼트 산탄
  if (e.volleyCd <= 0) {
    const hpPct = e.hp / e.maxHp;
    const count = hpPct < 0.4 ? 7 : 5;
    for (let i = 0; i < count; i++) {
      const aa = a + (i - (count-1)/2) * 0.18;
      entities.ebullets.push({
        x: e.x, y: e.y, vx: Math.cos(aa)*110, vy: Math.sin(aa)*110,
        r: 3, dmg: e.dmg, life: 3, kind: 'shadow'
      });
    }
    e.volleyCd = rand(2, 3);
    sfx('fire');
  }

  // 분신 소환 (체력 50% 이하)
  if (e.cloneCd <= 0 && e.hp < e.maxHp * 0.7) {
    for (let i = 0; i < 2; i++) {
      const rm = rooms[currentRoom];
      const shade = {
        x: rm.x + 20 + Math.random() * (rm.w - 40),
        y: rm.y + 20 + Math.random() * (rm.h - 40),
        vx: 0, vy: 0, r: 5, kind: 'shade',
        hp: 25 + floor * 5, maxHp: 25 + floor * 5,
        dmg: 10, speed: 40, xp: 3, gold: 1,
        hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: rand(1, 2),
      };
      entities.enemies.push(shade);
    }
    e.cloneCd = rand(9, 12);
    spawnParticle(e.x, e.y, '#5e2f8f', 0.6, 20, 80);
  }
}

// 그림자 분신 (예언자 소환수)
function updateShade(e, dt, sm) {
  const a = angleTo(e, player);
  const d = dist(e, player);
  e.x += Math.cos(a) * e.speed * sm * dt * 0.9;
  e.y += Math.sin(a) * e.speed * sm * dt * 0.9;
  e.attackCd -= dt;
  if (e.attackCd <= 0 && d < 80) {
    entities.ebullets.push({
      x: e.x, y: e.y, vx: Math.cos(a)*90, vy: Math.sin(a)*90,
      r: 2, dmg: e.dmg, life: 2, kind: 'shadow'
    });
    e.attackCd = rand(1.5, 2.5);
  }
}

// ========== 크로노 코어 (최종 보스) ==========
// 3페이즈: 방사탄 -> 조준 빔 -> 시간 왜곡
function updateCore(e, dt, sm) {
  const a = angleTo(e, player);
  const d = dist(e, player);
  e.beamCd -= dt;
  e.ringCd -= dt;
  e.warpCd -= dt;
  e.phaseT += dt;

  // 방 중앙으로 서서히 부유
  const rm = rooms[currentRoom];
  const cx = rm.x + rm.w/2, cy = rm.y + rm.h/2 - 10;
  e.x = lerp(e.x, cx + Math.sin(e.phaseT * 0.4) * 30, dt * 0.5);
  e.y = lerp(e.y, cy + Math.cos(e.phaseT * 0.3) * 20, dt * 0.5);

  const hpPct = e.hp / e.maxHp;

  // 페이즈 1: 방사탄 (자주)
  if (e.ringCd <= 0) {
    const count = hpPct < 0.3 ? 20 : (hpPct < 0.6 ? 16 : 12);
    const offset = e.phaseT * 0.5;
    for (let i = 0; i < count; i++) {
      const aa = (i / count) * Math.PI * 2 + offset;
      entities.ebullets.push({
        x: e.x, y: e.y, vx: Math.cos(aa)*80, vy: Math.sin(aa)*80,
        r: 3, dmg: e.dmg, life: 3.5, kind: 'shadow'
      });
    }
    e.ringCd = hpPct < 0.5 ? 2.2 : 3.2;
    sfx('fire');
  }

  // 페이즈 2: 조준 빔 (3연발 + 4방향)
  if (e.beamCd <= 0) {
    // 조준
    for (let i = -1; i <= 1; i++) {
      const aa = a + i * 0.1;
      entities.ebullets.push({
        x: e.x, y: e.y, vx: Math.cos(aa)*150, vy: Math.sin(aa)*150,
        r: 4, dmg: e.dmg, life: 3, kind: 'shadow'
      });
    }
    // 십자
    for (const aa of [0, Math.PI/2, Math.PI, Math.PI*1.5]) {
      entities.ebullets.push({
        x: e.x, y: e.y, vx: Math.cos(aa)*130, vy: Math.sin(aa)*130,
        r: 3, dmg: e.dmg, life: 3, kind: 'shadow'
      });
    }
    e.beamCd = hpPct < 0.5 ? 3 : 4.5;
    sfx('ice');
  }

  // 페이즈 3: 시간 왜곡 - 방 전체 볼트 지연 낙하
  if (e.warpCd <= 0 && hpPct < 0.5) {
    const rm2 = rooms[currentRoom];
    for (let i = 0; i < 20; i++) {
      const tx = rm2.x + 20 + Math.random() * (rm2.w - 40);
      const ty = rm2.y + 20 + Math.random() * (rm2.h - 40);
      spawnParticle(tx, ty, '#e8c547', 0.6, 3, 5);
      setTimeout(() => {
        for (let j = 0; j < 4; j++) {
          const aa = (j / 4) * Math.PI * 2;
          entities.ebullets.push({
            x: tx, y: ty, vx: Math.cos(aa)*60, vy: Math.sin(aa)*60,
            r: 2, dmg: e.dmg * 0.6, life: 1.2, kind: 'shadow'
          });
        }
      }, 800 + i * 40);
    }
    e.warpCd = 9;
    state.shake = 6;
  }
}

function damagePlayer(amt, source) {
  if (player.invuln > 0) return;
  // 몹 접두 히트 훅 (독/슬로우 등)
  if (typeof onMobAffixHitPlayer === 'function') onMobAffixHitPlayer(source);
  // 축복: Evade (일정 확률 회피)
  if (player.blessEvade && Math.random() < player.blessEvade) {
    spawnFloat(player.x, player.y - 8, 'EVADE!', '#c8ffc8');
    return;
  }
  // 축복: Shield (전면 흡수)
  if (player.shield && player.shield > 0) {
    const absorb = Math.min(player.shield, amt);
    player.shield -= absorb; amt -= absorb;
    spawnFloat(player.x, player.y - 8, 'SHIELD -' + Math.floor(absorb), '#8bd8ff');
    if (amt <= 0) return;
  }

  // 반사 상태
  if (player.reflectT > 0 && source) {
    const a = angleTo(player, source);
    entities.bullets.push({
      x: player.x, y: player.y, vx: Math.cos(a)*200, vy: Math.sin(a)*200,
      r: 3, dmg: amt * 1.5 * player.baseDmg, life: 1.2, kind: 'fire', hits: 0,
    });
    spawnFloat(player.x, player.y - 8, 'REFLECT!', '#ffefa8');
    return;
  }

  // 방패
  if (player.shielding) {
    if (player.parryWindow > 0 && source) {
      sfx('parry');
      state.shake = 6;
      if (source.stun !== undefined) source.stun = 0.8;
      spawnParticle(player.x, player.y, '#ffefa8', 0.4, 12, 80);
      spawnFloat(player.x, player.y - 8, 'PARRY!', '#ffefa8');
      const refCount = countPerk('reflect');
      if (refCount > 0 && source.kind !== 'lich' && source.kind !== 'core') {
        // 스택마다 반사 발사체 +2 (1→3→5→7)
        const shots = 1 + (refCount - 1) * 2;
        const baseA = angleTo(player, source);
        const spread = shots > 1 ? 0.3 : 0;
        for (let i = 0; i < shots; i++) {
          const a = baseA + (i - (shots-1)/2) * spread;
          entities.bullets.push({
            x: player.x, y: player.y, vx: Math.cos(a)*200, vy: Math.sin(a)*200,
            r: 3, dmg: 30 * player.baseDmg, life: 1.2, kind: 'fire', hits: 0,
          });
        }
      }
      player.invuln = 0.4;
      return;
    }
    amt *= 0.3;
  }

  // 피해 감소
  if (player.dmgReduction) amt *= (1 - Math.min(0.75, player.dmgReduction));

  // 가시
  if (player.thorns && source && source.hp !== undefined) {
    source.hp -= player.thorns;
    source.hitFlash = 0.1;
    spawnFloat(source.x, source.y - 6, Math.ceil(player.thorns), '#3ac762');
  }

  // 마나 실드 - MP로 절반 흡수
  if (hasPerk('manashield') && player.mp > 0) {
    const absorb = Math.min(amt * 0.5, player.mp);
    player.mp -= absorb;
    amt -= absorb;
  }

  player.hp -= amt;
  player.hitFlash = 0.2;
  player.invuln = 0.3;
  state.shake = Math.max(state.shake, Math.min(8, amt * 0.6));
  if (amt >= 1) sfx('hurt');

  // 부활/최후의 저항
  if (player.hp <= 0) {
    if (hasPerk('rebirth') && player.rebirthReady) {
      player.hp = player.maxHp * 0.4;
      player.rebirthReady = false;
      player.invuln = 2;
      spawnParticle(player.x, player.y, '#3ac762', 0.8, 30, 100);
      spawnFloat(player.x, player.y - 10, 'REBIRTH!', '#3ac762');
      showMsg('NATURES REBIRTH', 2);
      sfx('level');
    } else if (hasPerk('divinity') && player.divinityReady) {
      player.hp = player.maxHp;
      player.divinityReady = false;
      player.invuln = 3;
      spawnParticle(player.x, player.y, '#ffefa8', 0.8, 30, 100);
      spawnFloat(player.x, player.y - 10, 'DIVINITY!', '#ffefa8');
      showMsg('SAVED BY DIVINITY', 2);
      sfx('level');
    } else if (hasPerk('laststand') && player.lastStandReady && player.hp <= 0) {
      player.hp = 1;
      player.invuln = 5;
      player.lastStandReady = false;
      spawnFloat(player.x, player.y - 10, 'LAST STAND!', '#ffefa8');
      showMsg('LAST STAND', 2);
      sfx('parry');
    } else if (player.blessLastWard === 0) {
      // Last Ward: 사망 무효 (60s CD)
      player.hp = Math.max(1, Math.floor(player.maxHp * 0.3));
      player.blessLastWard = 60;
      player.invuln = 3;
      spawnParticle(player.x, player.y, '#ffefa8', 0.8, 30, 100);
      spawnFloat(player.x, player.y - 10, 'LAST WARD!', '#ffefa8');
      showMsg('LAST WARD - 60s CD', 2);
      sfx('parry');
    } else if (player.reviveCharges && player.reviveCharges > 0) {
      // Phoenix down / Phoenix event
      player.hp = player.maxHp;
      player.reviveCharges -= 1;
      player.invuln = 3;
      spawnParticle(player.x, player.y, '#ff9c3d', 0.9, 40, 120);
      spawnFloat(player.x, player.y - 10, 'REVIVED!', '#ffefa8');
      showMsg('불사조가 너를 되살렸다.', 2);
      sfx('level');
    }
  }
  // Immortal: HP<10 되면 강제 10 유지 (60s CD)
  if (player.blessImmortal === 0 && player.hp > 0 && player.hp < 10) {
    player.hp = 10;
    player.blessImmortal = 60;
    spawnFloat(player.x, player.y - 8, 'IMMORTAL', '#ffefa8');
  }
}

function onEnemyDeath(e) {
  // 콤보 카운트 + 티어 텍스트
  if (typeof comboOnKill === 'function' && !e.isBoss && !e.isProfessor) comboOnKill(e.x, e.y);
  // 몹 접두 사망 훅 (폭발/그림자 분신 등)
  if (typeof onMobAffixDeath === 'function') onMobAffixDeath(e);
  // 축복 훅: Chain Lightning
  if (player && player.blessChain) {
    let near = null, nd = 60;
    for (const t of entities.enemies) {
      if (t === e || t.hp <= 0) continue;
      const d = dist(t, e); if (d < nd) { nd = d; near = t; }
    }
    if (near) {
      const dmg = 30 * (player.baseDmg || 1);
      near.hp -= dmg; near.hitFlash = 0.15;
      if (typeof spawnFloat === 'function') spawnFloat(near.x, near.y, Math.floor(dmg), '#8bd8ff');
      if (typeof sfx === 'function') sfx('hit');
    }
  }
  // 축복 훅: Soul Harvest (+2 MAX HP per kill)
  if (player && player.blessSoulHarvest) { player.maxHp += 2; player.hp += 2; }
  // 업적/일일 통계
  if (typeof statAdd === 'function') {
    statAdd('totalKills', 1);
    if (e.isBoss) statAdd('bossKills', 1);
  }
  spawnParticle(e.x, e.y, e.kind === 'slime' ? '#3ac762' : '#e8dcb0', 0.5, 14, 70);
  // 엘리트 몹 처치 → RP 조각 드롭
  if (e.isElite) {
    entities.pickups.push({ x: e.x, y: e.y, kind: 'rpshard', life: 20, bob: 0, amount: e._eliteRp || 50 });
    spawnParticle(e.x, e.y, '#8bd8ff', 0.7, 20, 100);
  }
  const isExtreme = state.dungeonMode === 'extreme';
  if (isExtreme) {
    // 익스트림: XP 안 주고 골드만. 대신 골드 2배 보상.
    const g = Math.max(1, Math.floor(e.gold * 2));
    state.gold += g;
    spawnFloat(e.x, e.y, '+' + g + ' G', '#e8c547');
  } else {
    player.xp += e.xp;
    state.gold += e.gold;
    spawnFloat(e.x, e.y, '+' + e.xp + ' XP', '#ffefa8');
  }
  // 난이도 티어 보상: 높은 티어일수록 잡몹 처치 시 RP/GPA 지급.
  // 보스는 별도로 층 클리어 지점에서 추가로 rpBossMult 적용.
  if (typeof currentDifficulty === 'function') {
    const diff = currentDifficulty();
    if (diff.rpPerKill > 0) {
      const rp = e.isBoss ? diff.rpPerKill * 20 : diff.rpPerKill;
      state.research += rp;
      spawnFloat(e.x, e.y - 8, '+' + rp + ' RP', '#8bd8ff');
    }
    if (diff.gpaPerKill > 0) {
      const gp = e.isBoss ? diff.gpaPerKill * 20 : diff.gpaPerKill;
      state.gpa = (state.gpa || 0) + gp;
    }
  }
  sfx('die');

  // 익스트림 방 버프: 사망 시 폭발
  if (e._explode) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      entities.ebullets.push({
        x: e.x, y: e.y, vx: Math.cos(a)*120, vy: Math.sin(a)*120,
        r: 3, dmg: Math.max(6, Math.floor(e.dmg * 0.5)), life: 0.9, kind: 'fire',
      });
    }
    spawnParticle(e.x, e.y, '#ff9c3d', 0.6, 20, 90);
    sfx('boss');
  }

  // 판데모니엄: 사망 시 폭발
  if (hasPerk('pandemonium')) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      entities.bullets.push({
        x: e.x, y: e.y, vx: Math.cos(a)*100, vy: Math.sin(a)*100,
        r: 2, dmg: 15 * player.baseDmg, life: 0.5, kind: 'fire', hits: 0,
      });
    }
    spawnParticle(e.x, e.y, '#c81616', 0.5, 12, 80);
  }
  // 새크리파이스 스택
  if (hasPerk('sacrifice')) player.sacrifStacks = Math.min(10, (player.sacrifStacks || 0) + 1);
  // MP 흡수
  if (hasPerk('mpsiphon')) player.mp = Math.min(player.maxMp, player.mp + 4);

  // 픽업 드롭 (익스트림은 픽업 없음)
  if (!isExtreme) {
    const pickupChance = hasPerk('bountiful') ? 1.4 : 1;
    if (Math.random() < 0.35 * pickupChance) spawnPickup(e.x, e.y, 'hp');
    else if (Math.random() < 0.5 * pickupChance) spawnPickup(e.x, e.y, 'mp');
    else spawnPickup(e.x, e.y, 'gold');

    // === 인벤토리 포션 드롭 (낮은 확률) ===
    // 보스는 확정 드롭 + 상급 포션 확률 높음
    // 일반 몹은 약 8% (bountiful 시 12%)
    const potChance = e.isBoss ? 1.0 : (hasPerk('bountiful') ? 0.12 : 0.08);
    if (Math.random() < potChance) {
      // 후반 몹/보스는 상급 포션 확률
      const strong = e.isBoss || (e.xp || 0) >= 20;
      const pool = strong ? ['heal','mana','swift','fury','guard'] : ['heal','mana'];
      const pk = pool[Math.floor(Math.random() * pool.length)];
      academy.inventory[pk] = (academy.inventory[pk] || 0) + 1;
      recomputeHotkeys();
      spawnFloat(e.x, e.y - 12, '+' + POTIONS[pk].name.replace(' POTION',''), POTIONS[pk].color);
      sfx('pickup');
    }
  }

  // 레벨업 (익스트림 아닐 때만 - XP를 안 주므로)
  if (!isExtreme) {
    while (player.xp >= player.xpNext) {
      player.xp -= player.xpNext;
      player.level++;
      player.xpNext = Math.floor(player.xpNext * 1.4 + 4);
      player.hp = Math.min(player.maxHp, player.hp + 15);
      player.mp = Math.min(player.maxMp, player.mp + 20);
      state.scene = 'levelup';
      pickPerks();
      sfx('level');
      showMsg('LEVEL UP!', 2);
      break;
    }
  }
}

