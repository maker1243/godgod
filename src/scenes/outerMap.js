// =====================================================================
// Outer Map - 봉인 파괴 후 광대한 바깥 세계.
// 800x600 월드, 플레이어 카메라 팔로우. 여러 랜드마크에서 축복/조각 획득.
// 검은 심장 (동쪽 끝) 도달 → 최종전.
// =====================================================================

const OUTER_W = 800;
const OUTER_H = 600;

const outerMap = {
  playerX: 100, playerY: 300,
  camX: 0, camY: 0,
  arrowAng: 0,
  bhX: 720, bhY: 300,      // 검은 심장 위치 (동쪽 끝)
  visited: {},              // {landmark id: true}
  msg: '', msgT: 0,
};

// 랜드마크: 각기 다른 위치 + 방문 시 보상
const LANDMARKS = [
  { id:'ruin_temple', x: 200, y: 150, r: 20, name:'무너진 신전', color:'#c8b898',
    desc:'봉인 이전 시대의 신전. 재단 위에 유리병이 있다.',
    reward:(s)=>{ s.research = (s.research||0) + 5000; return '+5000 RP (고대 지혜)'; } },
  { id:'ghost_village', x: 350, y: 100, r: 22, name:'유령 마을', color:'#8bd8ff',
    desc:'봉인 붕괴 이후 아이들만 남은 마을. 그들의 눈은 텅 비어있다.',
    reward:(s)=>{ s.gold = (s.gold||0) + 10000; return '+10000 G (아이들의 저축)'; } },
  { id:'ash_forest', x: 500, y: 450, r: 25, name:'재의 숲', color:'#ff9c3d',
    desc:'모든 나무가 검게 타버린 숲. 그러나 나무 하나가 아직 붉게 빛난다.',
    reward:(s)=>{
      if (typeof unlockStoryFragment === 'function') unlockStoryFragment('mirror_evt');
      return '스토리 조각 획득';
    } },
  { id:'iron_tower', x: 250, y: 500, r: 24, name:'철의 탑', color:'#c86ade',
    desc:'거대한 검은 탑. 정상에서 봉인의 마지막 유지자가 잠들어 있다고 한다.',
    reward:(s)=>{
      if (typeof _ensureArtifactsState === 'function') _ensureArtifactsState();
      if (s.artifacts) s.artifacts.owned['god_iron'] = true;
      return '아티팩트 획득 (있으면)';
    } },
  { id:'bloody_lake', x: 600, y: 150, r: 22, name:'피의 호수', color:'#ff2d2d',
    desc:'검은 심장의 피로 물든 호수. 물결이 심장 박동에 맞춰 뛴다.',
    reward:(s)=>{ if (player) { player.maxHp += 100; player.hp += 100; } return '+100 MAX HP (피의 은총)'; } },
  { id:'crossroads', x: 450, y: 300, r: 18, name:'교차로', color:'#e8c547',
    desc:'네 방향으로 이어지는 갈림길. 표지판이 모두 지워져 있다.',
    reward:(s)=>{ s.gpa = (s.gpa||0) + 0.5; return '+0.5 GPA (여행 경험)'; } },
  { id:'lost_library', x: 130, y: 480, r: 20, name:'잃어버린 도서관', color:'#5affff',
    desc:'모든 책이 스스로 페이지를 넘기고 있다. 아무도 읽지 않는데.',
    reward:(s)=>{ s.research = (s.research||0) + 20000; if (typeof unlockStoryFragment === 'function') unlockStoryFragment('wanderer_evt'); return '+20000 RP + 조각'; } },
];

function _initOuterMap() {
  outerMap.playerX = 80;
  outerMap.playerY = 300;
  outerMap.camX = 0;
  outerMap.camY = 0;
}

function updateOuterMap(dt) {
  if (outerMap.msgT > 0) outerMap.msgT -= dt;
  // 이동
  let mx = 0, my = 0;
  if (keys['KeyA'] || keys['ArrowLeft'])  mx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
  if (keys['KeyW'] || keys['ArrowUp'])    my -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  my += 1;
  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; }
  const spd = 90 * (keys['ShiftLeft'] || keys['ShiftRight'] ? 2.2 : 1);
  outerMap.playerX = clamp(outerMap.playerX + mx * spd * dt, 8, OUTER_W - 8);
  outerMap.playerY = clamp(outerMap.playerY + my * spd * dt, 8, OUTER_H - 8);

  // 카메라 - 플레이어 중앙 유지, 월드 경계 clamp
  outerMap.camX = clamp(outerMap.playerX - W/2, 0, OUTER_W - W);
  outerMap.camY = clamp(outerMap.playerY - H/2, 0, OUTER_H - H);

  // 나침반 (검은 심장 향)
  outerMap.arrowAng = Math.atan2(outerMap.bhY - outerMap.playerY, outerMap.bhX - outerMap.playerX);

  // 랜드마크 상호작용
  for (const lm of LANDMARKS) {
    const d = Math.hypot(outerMap.playerX - lm.x, outerMap.playerY - lm.y);
    if (d < lm.r && (keys['Space'] || keys['Enter'])) {
      keys['Space']=false; keys['Enter']=false;
      if (outerMap.visited[lm.id]) {
        outerMap.msg = lm.name + ' - 이미 방문한 곳'; outerMap.msgT = 2.5;
      } else {
        outerMap.visited[lm.id] = true;
        const rwd = lm.reward(state) || '';
        outerMap.msg = lm.name + ' 도착! ' + rwd;
        outerMap.msgT = 4;
        if (typeof sfx === 'function') sfx('level');
        if (typeof saveAccountData === 'function') saveAccountData();
      }
      return;
    }
  }

  // 검은 심장 도달
  const d = Math.hypot(outerMap.bhX - outerMap.playerX, outerMap.bhY - outerMap.playerY);
  if (d < 20 && (keys['Space'] || keys['Enter'])) {
    keys['Space']=false; keys['Enter']=false;
    state.dungeonMode = 'blackheart';
    if (typeof sfx === 'function') sfx('boss');
    goTo('dungeon');
    return;
  }

  if (keys['Escape'] || keys['KeyR']) {
    keys['Escape']=false; keys['KeyR']=false;
    goTo('academy');
  }
}

function renderOuterMap() {
  // 배경
  ctx.fillStyle = '#0a0510'; ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();

  const camX = outerMap.camX, camY = outerMap.camY;

  // 지형 - 타일 그라디언트 (붉은 오염이 동쪽으로 갈수록 심해짐)
  for (let ty = 0; ty < OUTER_H; ty += 40) {
    for (let tx = 0; tx < OUTER_W; tx += 40) {
      const sx = tx - camX, sy = ty - camY;
      if (sx < -40 || sx > W || sy < -40 || sy > H) continue;
      const corrupt = tx / OUTER_W;  // 0 to 1
      const r = Math.floor(20 + corrupt * 60);
      const g = Math.floor(10 + Math.sin(tx * 0.01 + ty * 0.01) * 5);
      const b = Math.floor(30 - corrupt * 20);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(sx*PX, sy*PX, 40*PX, 40*PX);
    }
  }

  // 지평선 산 (배경, 전 세계)
  ctx.fillStyle = '#1a0510';
  for (let x = -camX % 24; x < W + 24; x += 24) {
    const wx = x + camX;
    const h = 15 + Math.sin(wx * 0.15) * 8 + Math.cos(wx * 0.4) * 5;
    ctx.fillRect(x*PX, (H - h - 10)*PX, 24*PX, (h + 10)*PX);
  }

  // 아카데미 실루엣 (서쪽, 세계 원점 근처)
  if (0 - camX < W && 0 - camX > -80) {
    const acadX = 10 - camX;
    const acadY = 200 - camY;
    const quake = Math.sin(state.time * 4) * 1.5;
    pxDraw(acadX + quake, acadY, 20, 40, '#1a0e2e');
    pxDraw(acadX + 3 + quake, acadY - 8, 12, 8, '#1a0e2e');
    if (acadY > -20 && acadY < H) drawText('아카데미', acadX - 4, acadY - 10, '#5a4a80');
  }

  // 랜드마크
  for (const lm of LANDMARKS) {
    const sx = lm.x - camX, sy = lm.y - camY;
    if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;
    const visited = outerMap.visited[lm.id];
    const glow = 0.4 + Math.sin(state.time * 2 + lm.x * 0.01) * 0.3;
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (glow * 0.15).toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(sx*PX, sy*PX, lm.r*PX, 0, Math.PI*2); ctx.fill();
    // 아이콘 (마름모)
    ctx.fillStyle = visited ? '#3a2e5c' : lm.color;
    ctx.beginPath();
    ctx.moveTo(sx*PX, (sy-6)*PX);
    ctx.lineTo((sx+6)*PX, sy*PX);
    ctx.lineTo(sx*PX, (sy+6)*PX);
    ctx.lineTo((sx-6)*PX, sy*PX);
    ctx.closePath(); ctx.fill();
    if (visited) drawText('✓', sx - 2, sy - 3, '#e8c547');
    // 이름 (근접 시)
    const d = Math.hypot(outerMap.playerX - lm.x, outerMap.playerY - lm.y);
    if (d < 50) drawText(lm.name, sx - textWidth(lm.name)/2, sy - lm.r - 6, '#ffefa8');
    if (d < lm.r) drawText('[SPACE]', sx - textWidth('[SPACE]')/2, sy + lm.r + 4, '#8bd8ff');
  }

  // 검은 심장 (동쪽 끝)
  const bhSx = outerMap.bhX - camX, bhSy = outerMap.bhY - camY;
  if (bhSx > -50 && bhSx < W + 50) {
    const bhPulse = 0.6 + Math.sin(state.time * 2) * 0.4;
    ctx.fillStyle = 'rgba(200, 22, 22, ' + bhPulse.toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(bhSx*PX, bhSy*PX, 28*PX, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(120, 0, 30, 0.9)';
    ctx.beginPath(); ctx.arc(bhSx*PX, bhSy*PX, 18*PX, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#050510';
    ctx.beginPath(); ctx.arc(bhSx*PX, bhSy*PX, 10*PX, 0, Math.PI*2); ctx.fill();
    drawText('검은 심장', bhSx - textWidth('검은 심장')/2, bhSy - 26, '#ff2d2d');
    const d = Math.hypot(outerMap.bhX - outerMap.playerX, outerMap.bhY - outerMap.playerY);
    if (d < 20) drawText('[SPACE] 최종전 진입', bhSx - textWidth('[SPACE] 최종전 진입')/2, bhSy + 30, '#ffefa8');
  }

  // 플레이어
  const psx = outerMap.playerX - camX, psy = outerMap.playerY - camY;
  const pa = (typeof activePlayerPal === 'function') ? activePlayerPal() : null;
  if (pa && typeof SPR_PLAYER_S1 !== 'undefined' && typeof drawSprite === 'function') {
    drawSprite(SPR_PLAYER_S1, pa, psx - 6, psy - 7);
  } else {
    pxDraw(psx - 4, psy - 4, 8, 8, '#ffefa8');
  }

  // 나침반 화살표
  const ax = psx + Math.cos(outerMap.arrowAng) * 20;
  const ay = psy + Math.sin(outerMap.arrowAng) * 20;
  const tx = psx + Math.cos(outerMap.arrowAng) * 26;
  const ty = psy + Math.sin(outerMap.arrowAng) * 26;
  ctx.strokeStyle = '#ff2d2d'; ctx.lineWidth = PX * 2;
  ctx.beginPath(); ctx.moveTo(ax*PX, ay*PX); ctx.lineTo(tx*PX, ty*PX); ctx.stroke();

  // HUD
  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('BROKEN LANDS   [' + Math.floor(outerMap.playerX) + ',' + Math.floor(outerMap.playerY) + ']', 4, 3, '#ff2d2d');
  drawText('[R/ESC] 아카데미', W - textWidth('[R/ESC] 아카데미') - 4, 3, '#8a7ab5');

  // 미니맵
  const mmW = 60, mmH = 45, mmX = W - mmW - 4, mmY = 15;
  pxDraw(mmX - 1, mmY - 1, mmW + 2, mmH + 2, '#000');
  pxDraw(mmX, mmY, mmW, mmH, '#1a0e2e');
  // 오염 그라디언트
  for (let mx = 0; mx < mmW; mx++) {
    ctx.fillStyle = 'rgba(200, 22, 22, ' + (mx / mmW * 0.3).toFixed(2) + ')';
    ctx.fillRect((mmX + mx)*PX, mmY*PX, PX, mmH*PX);
  }
  // 랜드마크 점
  for (const lm of LANDMARKS) {
    const dx = mmX + Math.floor((lm.x / OUTER_W) * mmW);
    const dy = mmY + Math.floor((lm.y / OUTER_H) * mmH);
    pxDraw(dx, dy, 1, 1, outerMap.visited[lm.id] ? '#3a2e5c' : lm.color);
  }
  // 검은 심장
  const bhMx = mmX + Math.floor((outerMap.bhX / OUTER_W) * mmW);
  const bhMy = mmY + Math.floor((outerMap.bhY / OUTER_H) * mmH);
  pxDraw(bhMx, bhMy, 2, 2, '#ff2d2d');
  // 플레이어
  const pMx = mmX + Math.floor((outerMap.playerX / OUTER_W) * mmW);
  const pMy = mmY + Math.floor((outerMap.playerY / OUTER_H) * mmH);
  pxDraw(pMx, pMy, 1, 1, '#ffefa8');

  // 방문 상태
  const visitCount = Object.keys(outerMap.visited).length;
  drawText('탐사: ' + visitCount + '/' + LANDMARKS.length, mmX, mmY + mmH + 2, '#c8b898');

  // 하단 안내
  drawText('WASD 이동   SHIFT 달리기   SPACE 조사', W/2 - textWidth('WASD 이동   SHIFT 달리기   SPACE 조사')/2, H - 12, '#8a7ab5');

  // 메시지
  if (outerMap.msgT > 0) {
    const alpha = outerMap.msgT < 1 ? outerMap.msgT : 1;
    ctx.globalAlpha = alpha;
    const boxW = textWidth(outerMap.msg) + 16;
    pxDraw(W/2 - boxW/2, H - 30, boxW, 12, '#1a0e2e');
    drawText(outerMap.msg, W/2 - textWidth(outerMap.msg)/2, H - 26, '#ffefa8');
    ctx.globalAlpha = 1;
  }
}
