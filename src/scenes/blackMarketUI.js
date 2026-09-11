// =====================================================================
// Black Market Scene - INFO / REPAIR / TOOLS 세 탭.
// =====================================================================

const blackMarket = {
  tab: 'info',           // 'info' | 'repair' | 'tools'
  cursor: 0,
  msg: '', msgT: 0,
};

function openBlackMarket() {
  _equipEnsure();
  _toolEnsure();
  blackMarket.tab = 'info';
  blackMarket.cursor = 0;
  state.scene = 'blackMarket';
}

function canAccessBlackMarket() {
  const rep = (state.faction && state.faction.rep && state.faction.rep.underground) || 0;
  if (rep >= 10) return true;
  if (state.faction && state.faction.house === 'commoner') return true;
  if (state.blackMarketVisited) return true;
  return false;
}

function updateBlackMarket(dt) {
  if (blackMarket.msgT > 0) blackMarket.msgT -= dt;
  if (keys['Escape'] || keys['KeyR']) { keys['Escape']=false; keys['KeyR']=false; state.scene='academy'; return; }
  if (keys['Tab']) {
    keys['Tab']=false;
    const order = ['info', 'repair', 'tools'];
    const idx = order.indexOf(blackMarket.tab);
    blackMarket.tab = order[(idx + 1) % order.length];
    blackMarket.cursor = 0;
  }
  if (keys['Digit1']) { keys['Digit1']=false; blackMarket.tab='info';   blackMarket.cursor=0; }
  if (keys['Digit2']) { keys['Digit2']=false; blackMarket.tab='repair'; blackMarket.cursor=0; }
  if (keys['Digit3']) { keys['Digit3']=false; blackMarket.tab='tools';  blackMarket.cursor=0; }

  if (blackMarket.tab === 'info') {
    const stock = todaysInfoStock();
    if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; blackMarket.cursor = (blackMarket.cursor - 1 + stock.length) % stock.length; sfx('hit'); }
    if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; blackMarket.cursor = (blackMarket.cursor + 1) % stock.length; sfx('hit'); }
    if (keys['Space'] || keys['Enter']) {
      keys['Space']=false; keys['Enter']=false;
      const it = stock[blackMarket.cursor];
      if (!it) return;
      if ((state.gold||0) < it.price) { blackMarket.msg = '골드 부족'; blackMarket.msgT = 2; return; }
      state.gold -= it.price;
      try { it.buy(); } catch(_){}
      blackMarket.msg = '[' + it.name + '] 구매 (-' + it.price + 'G)';
      blackMarket.msgT = 3;
      if (typeof sfx==='function') sfx('level');
      if (typeof saveAccountData==='function') saveAccountData();
    }
  } else if (blackMarket.tab === 'repair') {
    const items = ['staff', 'robe'];
    if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; blackMarket.cursor = (blackMarket.cursor - 1 + items.length) % items.length; sfx('hit'); }
    if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; blackMarket.cursor = (blackMarket.cursor + 1) % items.length; sfx('hit'); }
    const kind = items[blackMarket.cursor];
    if (keys['Space'] || keys['Enter']) {   // 부분 수리 (200 G)
      keys['Space']=false; keys['Enter']=false;
      if (repairEquipment(kind, 200)) { blackMarket.msg = EQUIPMENT_DEFS[kind].name + ' 수리 +40 두르'; blackMarket.msgT = 2; sfx('level'); }
    }
    if (keys['KeyF']) {   // 완전 수리
      keys['KeyF']=false;
      fullRepair();
    }
    if (keys['KeyU']) {   // 강화 (연금술)
      keys['KeyU']=false;
      upgradeEquipment(kind);
    }
  } else if (blackMarket.tab === 'tools') {
    const list = MAGIC_TOOLS;
    if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; blackMarket.cursor = (blackMarket.cursor - 1 + list.length) % list.length; sfx('hit'); }
    if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; blackMarket.cursor = (blackMarket.cursor + 1) % list.length; sfx('hit'); }
    if (keys['Space'] || keys['Enter']) {
      keys['Space']=false; keys['Enter']=false;
      const t = list[blackMarket.cursor];
      if (craftMagicTool(t.id)) {
        blackMarket.msg = '제작: ' + t.name + ' +' + (state.magicTools[t.id]||1);
        blackMarket.msgT = 2.5;
        if (typeof refreshPlayerStats === 'function') refreshPlayerStats();
      }
    }
  }
}

function renderBlackMarket() {
  ctx.fillStyle = '#0a0510'; ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();
  // 배경 - 어두운 골목
  ctx.fillStyle = '#1a0510';
  for (let x = 0; x < W; x += 20) {
    for (let y = 12; y < H; y += 20) {
      if (((x/20 + y/20) & 1) === 0) ctx.fillRect(x*PX, y*PX, 20*PX, 20*PX);
    }
  }

  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('검은 시장 & 공방 (Black Market)', 4, 3, '#c86ade');
  drawText('G ' + Math.floor(state.gold||0) + '  RP ' + Math.floor(state.research||0), W - 130, 3, '#e8c547');

  // 탭
  const tabs = [
    { id:'info',   name:'정보 브로커', col:'#c86ade' },
    { id:'repair', name:'장비 수리',   col:'#8bd8ff' },
    { id:'tools',  name:'마도구 제작', col:'#ff9c3d' },
  ];
  for (let i = 0; i < tabs.length; i++) {
    const tx = 8 + i * 90;
    const active = blackMarket.tab === tabs[i].id;
    if (active) pxDraw(tx, 15, 86, 10, '#3a1e5c');
    drawText('[' + (i+1) + '] ' + tabs[i].name, tx + 4, 17, active ? '#ffefa8' : tabs[i].col);
  }

  if (blackMarket.tab === 'info') {
    const stock = todaysInfoStock();
    drawText('오늘의 재고 (매일 자정 회전)', 8, 30, '#8a7ab5');
    for (let i = 0; i < stock.length; i++) {
      const it = stock[i];
      const y = 42 + i * 30;
      const isSel = blackMarket.cursor === i;
      pxDraw(8, y, W - 16, 28, isSel ? '#2a1548' : '#1a0e2e');
      if (isSel) pxDraw(8, y, 2, 28, it.col);
      drawText(it.name, 14, y + 3, it.col);
      drawText(it.desc, 14, y + 13, '#c8b898');
      const priceCol = (state.gold||0) >= it.price ? '#3ac762' : '#c81616';
      drawText(it.price + ' G', W - textWidth(it.price + ' G') - 14, y + 3, priceCol);
    }
    drawText('WS 이동   SPACE 구매', W/2 - textWidth('WS 이동   SPACE 구매')/2, H - 8, '#8a7ab5');
  } else if (blackMarket.tab === 'repair') {
    _equipEnsure();
    const items = ['staff', 'robe'];
    for (let i = 0; i < items.length; i++) {
      const k = items[i];
      const def = EQUIPMENT_DEFS[k];
      const eq = state.equipment[k];
      const y = 32 + i * 44;
      const isSel = blackMarket.cursor === i;
      pxDraw(8, y, W - 16, 42, isSel ? '#2a1548' : '#1a0e2e');
      if (isSel) pxDraw(8, y, 2, 42, '#8bd8ff');
      const maxDur = def.maxDur + eq.level * 20;
      drawText(def.name + '  Lv' + eq.level, 14, y + 3, '#ffefa8');
      drawText('내구도: ' + eq.dur + ' / ' + maxDur, 14, y + 13, eq.dur === 0 ? '#c81616' : '#c8b898');
      // 진행 바
      pxDraw(14, y + 22, 200, 5, '#1a0e2e');
      const fill = Math.floor((eq.dur / maxDur) * 200);
      const barCol = eq.dur === 0 ? '#c81616' : eq.dur < 30 ? '#ff9c3d' : '#3ac762';
      pxDraw(14, y + 22, fill, 5, barCol);
      drawText(def.desc, 14, y + 31, '#8a7ab5');
      if (eq.dur === 0) drawText('★ 파손: 페널티 발동', W - textWidth('★ 파손: 페널티 발동') - 14, y + 13, '#c81616');
    }
    const y = 32 + 2 * 44 + 8;
    drawText('선택된 장비:', 14, y, '#ffefa8');
    drawText('[SPACE] 부분 수리 (-200G, +40두르)', 14, y + 12, '#3ac762');
    drawText('[F] 전체 완전 수리', 14, y + 22, '#e8c547');
    const eq = state.equipment[items[blackMarket.cursor]];
    const upCost = 500 * ((eq && eq.level || 0) + 1);
    drawText('[U] 연금술 강화 (-' + upCost + ' RP, +5% 성능, +20 최대 두르)', 14, y + 32, '#c86ade');
    drawText('WS 이동   SPACE 수리   F 완전   U 강화', W/2 - textWidth('WS 이동   SPACE 수리   F 완전   U 강화')/2, H - 8, '#8a7ab5');
  } else if (blackMarket.tab === 'tools') {
    _toolEnsure();
    const list = MAGIC_TOOLS;
    const rowH = 20;
    const visRows = 7;
    const cursor = blackMarket.cursor;
    const start = Math.max(0, Math.min(list.length - visRows, cursor - Math.floor(visRows/2)));
    for (let i = 0; i < visRows; i++) {
      const k = start + i;
      if (k >= list.length) break;
      const t = list[k];
      const cnt = state.magicTools[t.id] || 0;
      const y = 32 + i * rowH;
      const isSel = k === cursor;
      pxDraw(8, y, W - 16, rowH - 2, isSel ? '#2a1548' : '#1a0e2e');
      if (isSel) pxDraw(8, y, 2, rowH - 2, '#ff9c3d');
      drawText(t.name + ' ' + cnt + '/' + t.maxStack, 14, y + 2, cnt >= t.maxStack ? '#5a4a80' : '#ffefa8');
      drawText(t.desc, 14, y + 11, '#c8b898');
      const canG = (state.gold||0) >= t.gold;
      const canR = (state.research||0) >= t.rp;
      const priceCol = (canG && canR) ? '#3ac762' : '#c81616';
      drawText('-' + t.gold + 'G  -' + t.rp + 'RP', W - textWidth('-' + t.gold + 'G  -' + t.rp + 'RP') - 14, y + 6, priceCol);
    }
    drawText('WS 이동   SPACE 제작', W/2 - textWidth('WS 이동   SPACE 제작')/2, H - 8, '#8a7ab5');
  }

  drawText('[TAB] 탭 전환   [R/ESC] 나가기', W - textWidth('[TAB] 탭 전환   [R/ESC] 나가기') - 4, H - 18, '#5a4a80');

  if (blackMarket.msgT > 0) {
    ctx.globalAlpha = Math.min(1, blackMarket.msgT);
    const boxW = textWidth(blackMarket.msg) + 16;
    pxDraw(W/2 - boxW/2, H - 30, boxW, 12, '#1a0e2e');
    drawText(blackMarket.msg, W/2 - textWidth(blackMarket.msg)/2, H - 26, '#ffefa8');
    ctx.globalAlpha = 1;
  }
}
