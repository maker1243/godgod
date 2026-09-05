// =====================================================================
// Shop
// =====================================================================

// =====================================================================
// 상점 (SHOP)
// =====================================================================
const shop = { cursor: 0, message: '', messageT: 0 };

function shopFlash(m) { shop.message = m; shop.messageT = 1.5; }

function updateShop(dt) {
  if (shop.messageT > 0) shop.messageT -= dt;
  const n = POTION_ORDER.length;
  if (keys['KeyW']) { keys['KeyW']=false; shop.cursor = (shop.cursor - 1 + n) % n; sfx('hit'); }
  if (keys['KeyS']) { keys['KeyS']=false; shop.cursor = (shop.cursor + 1) % n; sfx('hit'); }
  if (keys['Space'] || keys['Enter']) {
    keys['Space']=false; keys['Enter']=false;
    const kind = POTION_ORDER[shop.cursor];
    const pot = POTIONS[kind];
    if (state.gold < pot.cost) { shopFlash('NEED ' + pot.cost + ' GOLD'); sfx('hurt'); return; }
    state.gold -= pot.cost;
    academy.inventory[kind]++;
    recomputeHotkeys();
    savePotions();
    shopFlash('BOUGHT ' + pot.name + ' (x' + academy.inventory[kind] + ')');
    sfx('pickup');
  }
  if (keys['KeyR'] || keys['Escape']) { keys['KeyR']=false; keys['Escape']=false; state.scene='academy'; }
}

function renderShop() {
  // 배경
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, W*PX, H*PX);
  bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  // 상단 헤더
  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('MERCHANT SHOP', 4, 3, '#e8c547');
  const g = 'GOLD ' + state.gold;
  drawText(g, W - textWidth(g) - 4, 3, '#e8c547');

  drawText('MERCHANT: WHAT NEED YOU, ADEPT?', W/2 - textWidth('MERCHANT: WHAT NEED YOU, ADEPT?')/2, 18, '#8bd8ff');

  // 포션 리스트
  const listX = 30, listY = 34, rowH = 22;
  for (let i = 0; i < POTION_ORDER.length; i++) {
    const kind = POTION_ORDER[i];
    const pot = POTIONS[kind];
    const y = listY + i * rowH;
    const isSel = shop.cursor === i;
    const canBuy = state.gold >= pot.cost;

    pxDraw(listX, y, W - listX*2, rowH - 2, isSel ? '#2a1548' : '#1a0e2e');
    if (isSel) {
      pxDraw(listX, y, W - listX*2, 1, '#ffefa8');
      pxDraw(listX, y + rowH - 3, W - listX*2, 1, '#ffefa8');
      pxDraw(listX, y, 1, rowH - 2, '#ffefa8');
      pxDraw(listX + W - listX*2 - 1, y, 1, rowH - 2, '#ffefa8');
    }
    // 색상 도트
    pxDraw(listX + 4, y + 6, 6, 6, pot.color);
    // 이름
    drawText(pot.name, listX + 14, y + 3, canBuy ? pot.color : '#5a4a80');
    // 설명
    drawText(pot.desc, listX + 14, y + 12, '#c8b898');
    // 소지 수
    const owned = academy.inventory[kind];
    const ownStr = 'OWN x' + owned;
    drawText(ownStr, W - listX - textWidth(ownStr) - 40, y + 6, owned > 0 ? '#3ac762' : '#5a4a80');
    // 가격
    const costStr = pot.cost + 'G';
    drawText(costStr, W - listX - textWidth(costStr) - 6, y + 6, canBuy ? '#e8c547' : '#c81616');
  }

  // 하단 정보 패널
  const sel = POTIONS[POTION_ORDER[shop.cursor]];
  drawText('HOTKEY SLOTS: ' + academy.hotkeys.map((k,i)=>(i+1)+'='+(k?POTIONS[k].name.split(' ')[0]:'---')).join('  '),
    W/2 - textWidth('HOTKEY SLOTS: ' + academy.hotkeys.map((k,i)=>(i+1)+'='+(k?POTIONS[k].name.split(' ')[0]:'---')).join('  '))/2,
    H - 30, '#8a7ab5');

  if (shop.messageT > 0) {
    ctx.globalAlpha = clamp(shop.messageT, 0, 1);
    const tw = textWidth(shop.message);
    pxDraw(W/2 - tw/2 - 4, H - 45, tw + 8, 10, '#1a0e2e');
    drawText(shop.message, W/2 - tw/2, H - 42, '#ffefa8');
    ctx.globalAlpha = 1;
  }
  drawText('W/S SELECT   [SPACE] BUY   [R] LEAVE', W/2 - textWidth('W/S SELECT   [SPACE] BUY   [R] LEAVE')/2, H - 10, '#5a4a80');
}

