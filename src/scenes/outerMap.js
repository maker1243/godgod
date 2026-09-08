// =====================================================================
// Outer Map - 봉인이 부서진 후 나오는 바깥 세계.
// 검은 심장의 위치를 나침반 화살표로 표시. 이동 시 최종전 진입.
// =====================================================================

const outerMap = {
  arrowAng: 0,
  playerX: 50,
  playerY: 100,
  targetX: 260,
  targetY: 100,
  bhX: 260,     // 검은 심장 위치
  bhY: 100,
  message: '',
  messageT: 0,
};

function _initOuterMap() {
  outerMap.playerX = 40;
  outerMap.playerY = 100;
}

function updateOuterMap(dt) {
  if (outerMap.messageT > 0) outerMap.messageT -= dt;
  // 이동
  let mx = 0, my = 0;
  if (keys['KeyA'] || keys['ArrowLeft'])  mx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
  if (keys['KeyW'] || keys['ArrowUp'])    my -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  my += 1;
  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; }
  const spd = 80;
  outerMap.playerX += mx * spd * dt;
  outerMap.playerY += my * spd * dt;
  outerMap.playerX = clamp(outerMap.playerX, 10, W - 10);
  outerMap.playerY = clamp(outerMap.playerY, 30, H - 30);

  // 나침반 각도
  outerMap.arrowAng = Math.atan2(outerMap.bhY - outerMap.playerY, outerMap.bhX - outerMap.playerX);

  // 검은 심장 위치 도달 → 최종전 진입
  const d = Math.hypot(outerMap.bhX - outerMap.playerX, outerMap.bhY - outerMap.playerY);
  if (d < 12 && (keys['Space'] || keys['Enter'])) {
    keys['Space']=false; keys['Enter']=false;
    state.dungeonMode = 'blackheart';
    if (typeof sfx === 'function') sfx('boss');
    goTo('dungeon');
    return;
  }

  // ESC 로 아카데미 복귀
  if (keys['Escape'] || keys['KeyR']) {
    keys['Escape']=false; keys['KeyR']=false;
    goTo('academy');
  }
}

function renderOuterMap() {
  // 배경 - 황폐한 대지
  ctx.fillStyle = '#0a0510';
  ctx.fillRect(0, 0, W*PX, H*PX);
  // 별
  if (typeof bgStars === 'function') bgStars();

  // 붉은 지평선 (봉인 파괴로 오염된 하늘)
  const grad = ctx.createLinearGradient(0, 0, 0, H*PX);
  grad.addColorStop(0, 'rgba(200, 22, 22, 0.3)');
  grad.addColorStop(0.5, 'rgba(120, 0, 60, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W*PX, H*PX * 0.6);

  // 지평선 산
  ctx.fillStyle = '#1a0a1a';
  for (let x = 0; x < W; x += 20) {
    const h = 15 + Math.sin(x * 0.2) * 8 + Math.cos(x * 0.5) * 5;
    ctx.fillRect(x*PX, (H - h - 10)*PX, 20*PX, (h + 10)*PX);
  }

  // 아카데미 (좌측 뒤로) 실루엣 - 흔들리며 부서짐
  const quake = Math.sin(state.time * 4) * 1.5;
  const acadX = 15 + quake;
  pxDraw(acadX, H - 60, 12, 30, '#1a0e2e');
  pxDraw(acadX + 3, H - 66, 6, 6, '#1a0e2e');
  drawText('아카데미', acadX - 4, H - 68, '#5a4a80');

  // 검은 심장 (우측 목표점) - 어두운 원 + 점점 크기 커짐
  const bhPulse = 0.7 + Math.sin(state.time * 2) * 0.3;
  ctx.fillStyle = 'rgba(120, 0, 30, ' + bhPulse.toFixed(2) + ')';
  ctx.beginPath(); ctx.arc(outerMap.bhX*PX, outerMap.bhY*PX, 20*PX, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#050510';
  ctx.beginPath(); ctx.arc(outerMap.bhX*PX, outerMap.bhY*PX, 10*PX, 0, Math.PI*2); ctx.fill();
  drawText('검은 심장', outerMap.bhX - textWidth('검은 심장')/2, outerMap.bhY - 18, '#ff2d2d');

  // 플레이어
  const pa = (typeof activePlayerPal === 'function') ? activePlayerPal() : (typeof PLAYER_PAL !== 'undefined' ? PLAYER_PAL : null);
  if (pa && typeof SPR_PLAYER_S1 !== 'undefined' && typeof drawSprite === 'function') {
    drawSprite(SPR_PLAYER_S1, pa, outerMap.playerX - 6, outerMap.playerY - 7);
  } else {
    pxDraw(outerMap.playerX - 4, outerMap.playerY - 4, 8, 8, '#ffefa8');
  }

  // 나침반 화살표 - 플레이어 주위 회전
  const arrowX = outerMap.playerX + Math.cos(outerMap.arrowAng) * 18;
  const arrowY = outerMap.playerY + Math.sin(outerMap.arrowAng) * 18;
  const tipX = outerMap.playerX + Math.cos(outerMap.arrowAng) * 24;
  const tipY = outerMap.playerY + Math.sin(outerMap.arrowAng) * 24;
  ctx.strokeStyle = '#ff2d2d';
  ctx.lineWidth = PX * 2;
  ctx.beginPath(); ctx.moveTo(arrowX*PX, arrowY*PX); ctx.lineTo(tipX*PX, tipY*PX); ctx.stroke();
  // 화살촉
  const perp = outerMap.arrowAng + Math.PI/2;
  ctx.beginPath();
  ctx.moveTo(tipX*PX, tipY*PX);
  ctx.lineTo((tipX - Math.cos(outerMap.arrowAng) * 3 + Math.cos(perp) * 2)*PX, (tipY - Math.sin(outerMap.arrowAng) * 3 + Math.sin(perp) * 2)*PX);
  ctx.lineTo((tipX - Math.cos(outerMap.arrowAng) * 3 - Math.cos(perp) * 2)*PX, (tipY - Math.sin(outerMap.arrowAng) * 3 - Math.sin(perp) * 2)*PX);
  ctx.closePath();
  ctx.fillStyle = '#ff2d2d';
  ctx.fill();

  // 거리 표시
  const d = Math.hypot(outerMap.bhX - outerMap.playerX, outerMap.bhY - outerMap.playerY);
  const distStr = Math.floor(d) + 'm';
  drawText(distStr, outerMap.playerX - textWidth(distStr)/2, outerMap.playerY - 14, '#ff9c3d');

  // HUD
  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('BROKEN LANDS - 검은 심장이 부른다', 4, 3, '#ff2d2d');
  drawText('[R/ESC] 아카데미 복귀', W - textWidth('[R/ESC] 아카데미 복귀') - 4, 3, '#8a7ab5');
  drawText('WASD 로 이동   나침반이 목표를 가리킨다', W/2 - textWidth('WASD 로 이동   나침반이 목표를 가리킨다')/2, H - 20, '#c8b898');
  if (d < 12) {
    drawText('[SPACE] 최종전 진입', W/2 - textWidth('[SPACE] 최종전 진입')/2, H - 10, '#ffefa8');
  }
}
