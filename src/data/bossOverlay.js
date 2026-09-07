// =====================================================================
// Boss HP Overlay + Boss Kill Cinematic
// - 보스 등장 시 하단에 큰 HP 바
// - 보스 격파 시 화면 슬로모 + 확대
// =====================================================================

const bossHud = {
  currentBoss: null,
  killT: 0,          // 죽는 애니메이션 진행 (0~1.5초)
  killTarget: null,
};

// updateDungeon tick 에서 호출.
function updateBossHud(dt) {
  bossHud.currentBoss = null;
  for (const e of entities.enemies) {
    if ((e.isBoss || e.isProfessor) && e.hp > 0) {
      bossHud.currentBoss = e;
      break;
    }
  }
  if (bossHud.killT > 0) bossHud.killT -= dt;
}

// onEnemyDeath 에서 호출 (보스일 때).
function bossKillCinematic(e) {
  if (!e || (!e.isBoss && !e.isProfessor)) return;
  bossHud.killT = 1.5;
  bossHud.killTarget = { x: e.x, y: e.y };
  // 슬로모 (전역 dt scaling)
  state._slowMoUntil = performance.now() + 1000;
  state.shake = Math.max(state.shake || 0, 10);
  // 폭발 파티클
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 120;
    const cols = ['#ff9c3d','#ffefa8','#c81616','#ff2d80'];
    spawnParticle(e.x, e.y, cols[i % cols.length], 1.2, 3, sp);
  }
}

// updateGame 상위에서 dt 를 스케일링.
function scaledDt(dt) {
  if (state._slowMoUntil && performance.now() < state._slowMoUntil) return dt * 0.35;
  return dt;
}

// 하단 HP 바 렌더 (renderDungeon 마지막에 호출).
function drawBossHpOverlay() {
  const b = bossHud.currentBoss;
  if (!b) return;
  const barW = W - 40;
  const barH = 8;
  const bx = 20;
  const by = H - 16;
  // 백그라운드
  pxDraw(bx - 2, by - 8, barW + 4, barH + 12, '#050510');
  pxDraw(bx - 2, by - 8, barW + 4, 1, '#ff2d2d');
  pxDraw(bx - 2, by + barH + 3, barW + 4, 1, '#ff2d2d');
  // HP 바
  const pct = Math.max(0, Math.min(1, b.hp / b.maxHp));
  pxDraw(bx, by, barW, barH, '#3a0a0a');
  pxDraw(bx, by, Math.floor(barW * pct), barH, '#c81616');
  pxDraw(bx, by, Math.floor(barW * pct), 1, '#ff6666');
  // 이름
  const name = b._profDef ? b._profDef.name : (b.isTrialBoss ? 'TRIAL BOSS' : 'BOSS');
  drawText(name, bx, by - 8, '#ffefa8');
  // HP 수치
  const hpStr = _bossFmt(b.hp) + ' / ' + _bossFmt(b.maxHp);
  drawText(hpStr, bx + barW - textWidth(hpStr), by - 8, '#e8d9b0');
  // Phase 표시 (교수)
  if (b._profDef && b.phase) {
    drawText('PHASE ' + b.phase, W/2 - textWidth('PHASE ' + b.phase)/2, by - 8, '#8bd8ff');
  }
}

function _bossFmt(n) {
  if (n >= 1e12) return (n/1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(1)  + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(1)  + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(1)  + 'k';
  return String(Math.max(0, Math.floor(n)));
}
