// =====================================================================
// Faction UI - 가문/학파 선택 (미확정 시 선택 강제) + 평판 조회.
// =====================================================================

const factionUI = {
  mode: 'view',        // 'view' | 'select_house' | 'select_school'
  houseIdx: 0,
  schoolIdx: 0,
  pendingHouse: null,
  msg: '', msgT: 0,
};

function openFactionScene() {
  if (!hasFaction()) {
    factionUI.mode = 'select_house';
    factionUI.houseIdx = 0;
  } else {
    factionUI.mode = 'view';
  }
  state.scene = 'faction';
}

function updateFaction(dt) {
  if (factionUI.msgT > 0) factionUI.msgT -= dt;

  if (factionUI.mode === 'select_house') {
    if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; factionUI.houseIdx = (factionUI.houseIdx - 1 + HOUSES.length) % HOUSES.length; sfx('hit'); }
    if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; factionUI.houseIdx = (factionUI.houseIdx + 1) % HOUSES.length; sfx('hit'); }
    if (keys['Space'] || keys['Enter']) {
      keys['Space']=false; keys['Enter']=false;
      factionUI.pendingHouse = HOUSES[factionUI.houseIdx].id;
      factionUI.mode = 'select_school';
      factionUI.schoolIdx = 0;
    }
    return;
  }
  if (factionUI.mode === 'select_school') {
    if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; factionUI.schoolIdx = (factionUI.schoolIdx - 1 + SCHOOLS.length) % SCHOOLS.length; sfx('hit'); }
    if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; factionUI.schoolIdx = (factionUI.schoolIdx + 1) % SCHOOLS.length; sfx('hit'); }
    if (keys['Escape'] || keys['KeyR']) { keys['Escape']=false; keys['KeyR']=false; factionUI.mode = 'select_house'; }
    if (keys['Space'] || keys['Enter']) {
      keys['Space']=false; keys['Enter']=false;
      initFaction(factionUI.pendingHouse, SCHOOLS[factionUI.schoolIdx].id);
      if (typeof refreshPlayerStats === 'function') refreshPlayerStats();
      factionUI.mode = 'view';
    }
    return;
  }
  // view
  if (keys['Escape'] || keys['KeyR']) { keys['Escape']=false; keys['KeyR']=false; state.scene = 'academy'; }
}

function renderFaction() {
  ctx.fillStyle = '#0e0510'; ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();

  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('가문 · 학파 · 평판', 4, 3, '#e8c547');
  if (factionUI.mode === 'view') drawText('[R/ESC] 나가기', W - textWidth('[R/ESC] 나가기') - 4, 3, '#8a7ab5');

  if (factionUI.mode === 'select_house') {
    drawText('가문 선택 (Step 1/2) — 되돌릴 수 없음', W/2 - 100, 20, '#ffefa8');
    for (let i = 0; i < HOUSES.length; i++) {
      const h = HOUSES[i];
      const y = 35 + i * 38;
      const isSel = factionUI.houseIdx === i;
      pxDraw(8, y, W - 16, 34, isSel ? '#2a1548' : '#1a0e2e');
      if (isSel) pxDraw(8, y, 2, 34, h.color);
      drawText(h.name, 14, y + 3, h.color, isSel ? 2 : 1);
      drawText(h.desc, 14, y + (isSel ? 18 : 14), '#c8b898');
      drawText(h.perks, 14, y + (isSel ? 26 : 22), '#8bd8ff');
    }
    drawText('WS 이동   SPACE 선택', W/2 - 60, H - 8, '#8a7ab5');
    return;
  }
  if (factionUI.mode === 'select_school') {
    drawText('학파 선택 (Step 2/2)', W/2 - 60, 20, '#ffefa8');
    drawText('가문: ' + HOUSE_BY_ID[factionUI.pendingHouse].name, W/2 - 40, 30, HOUSE_BY_ID[factionUI.pendingHouse].color);
    for (let i = 0; i < SCHOOLS.length; i++) {
      const s = SCHOOLS[i];
      const y = 45 + i * 26;
      const isSel = factionUI.schoolIdx === i;
      pxDraw(8, y, W - 16, 22, isSel ? '#2a1548' : '#1a0e2e');
      if (isSel) pxDraw(8, y, 2, 22, s.color);
      drawText(s.name, 14, y + 2, s.color, isSel ? 2 : 1);
      drawText(s.desc, 14, y + (isSel ? 12 : 10), '#c8b898');
      drawText(s.perks, W/2, y + (isSel ? 12 : 10), '#8bd8ff');
    }
    drawText('WS 이동   SPACE 확정   [R/ESC] 뒤로', W/2 - 80, H - 8, '#8a7ab5');
    return;
  }

  // view
  const info = getFactionInfo();
  if (!info) return;
  const h = info.house, s = info.school;
  // 가문 카드
  pxDraw(8, 20, W - 16, 40, '#1a0e2e');
  pxDraw(8, 20, 2, 40, h.color);
  drawText('[ 가문 ] ' + h.name, 14, 24, h.color, 2);
  drawText(h.desc, 14, 42, '#c8b898');
  drawText(h.perks, 14, 51, '#8bd8ff');

  // 학파 카드
  pxDraw(8, 65, W - 16, 34, '#1a0e2e');
  pxDraw(8, 65, 2, 34, s.color);
  drawText('[ 학파 ] ' + s.name, 14, 69, s.color, 2);
  drawText(s.desc, 14, 85, '#c8b898');
  drawText(s.perks, 14, 92, '#8bd8ff');

  // 평판
  drawText('평판', 14, 108, '#ffefa8');
  const facs = [
    { id:'noble',       name:'명문가' },
    { id:'commoner',    name:'평민' },
    { id:'wanderer',    name:'방랑자' },
    { id:'royal',       name:'왕실' },
    { id:'underground', name:'뒷골목' },
    { id:'academy',     name:'학원' },
  ];
  for (let i = 0; i < facs.length; i++) {
    const f = facs[i];
    const v = info.rep[f.id] || 0;
    const t = repTier(v);
    const y = 120 + i * 10;
    drawText(f.name, 14, y, '#c8b898');
    // 바
    const barX = 90, barW = 100;
    pxDraw(barX, y + 2, barW, 4, '#1a0e2e');
    const centerX = barX + barW / 2;
    const filled = Math.min(1, Math.abs(v) / 100);
    if (v >= 0) pxDraw(centerX, y + 2, Math.floor(barW / 2 * filled), 4, t.color);
    else pxDraw(centerX - Math.floor(barW / 2 * filled), y + 2, Math.floor(barW / 2 * filled), 4, t.color);
    // 중앙 마커
    pxDraw(centerX, y + 2, 1, 4, '#8a7ab5');
    drawText(String(v), barX + barW + 4, y, t.color);
    drawText(t.name, barX + barW + 32, y, t.color);
  }
}
