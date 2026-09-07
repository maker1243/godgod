// =====================================================================
// Customize (외관 커스터마이즈) - 로브 색/모자 색/오라 색.
// state.customize = { robe:idx, hat:idx, trail:idx }
// activePlayerPal() 반환값이 drawPlayer 에서 사용됨.
// =====================================================================

const CUSTOM_ROBES = [
  { name:'ARCANE PURPLE',  cost:0,      c:{ '2':'#4a2870', '3':'#7d4dbf' } },
  { name:'CRIMSON',        cost:5000,   c:{ '2':'#5a1414', '3':'#c81616' } },
  { name:'EMERALD',        cost:5000,   c:{ '2':'#1a5a30', '3':'#3ac762' } },
  { name:'ABYSS BLUE',     cost:5000,   c:{ '2':'#0e2a5c', '3':'#3b7fd6' } },
  { name:'GOLD',           cost:20000,  c:{ '2':'#7a5a10', '3':'#e8c547' } },
  { name:'MIDNIGHT',       cost:20000,  c:{ '2':'#050510', '3':'#3a1e5c' } },
  { name:'ROSE',           cost:20000,  c:{ '2':'#7a1a4a', '3':'#ff2d80' } },
  { name:'FROST',          cost:50000,  c:{ '2':'#3a5a8a', '3':'#8bd8ff' } },
  { name:'INFERNO',        cost:100000, c:{ '2':'#3a0a0a', '3':'#ff2d2d' } },
  { name:'VOID',           cost:500000, c:{ '2':'#0a0510', '3':'#c86ade' } },
  { name:'ANGEL',          cost:1e6,    c:{ '2':'#e8d9b0', '3':'#ffffff' } },
  { name:'PRISMATIC',      cost:5e6,    c:{ '2':'#ff00ff', '3':'#00ffff' } },
];

const CUSTOM_HATS = [
  { name:'CLASSIC',        cost:0,      c:{ '7':'#2a1548' } },
  { name:'CRIMSON HAT',    cost:2000,   c:{ '7':'#c81616' } },
  { name:'GREEN HAT',      cost:2000,   c:{ '7':'#3ac762' } },
  { name:'GOLDEN HAT',     cost:10000,  c:{ '7':'#e8c547' } },
  { name:'CROWN',          cost:50000,  c:{ '7':'#ffefa8' } },
  { name:'DARK CROWN',     cost:200000, c:{ '7':'#050505' } },
  { name:'PRISM CROWN',    cost:1e6,    c:{ '7':'#ff00ff' } },
];

const CUSTOM_TRAILS = [
  { name:'NONE',           cost:0,      color:null },
  { name:'GOLD TRAIL',     cost:5000,   color:'#e8c547' },
  { name:'ARCANE TRAIL',   cost:5000,   color:'#c86ade' },
  { name:'BLOOD TRAIL',    cost:20000,  color:'#c81616' },
  { name:'FROST TRAIL',    cost:20000,  color:'#8bd8ff' },
  { name:'EMBER TRAIL',    cost:50000,  color:'#ff9c3d' },
  { name:'VOID TRAIL',     cost:200000, color:'#050505' },
  { name:'RAINBOW TRAIL',  cost:1e6,    color:'#RAINBOW' },
];

const CUSTOM_STARS = [
  { name:'GOLD STAR',      cost:0,      c:{ '6':'#e8c547' } },
  { name:'RED STAR',       cost:1000,   c:{ '6':'#ff2d2d' } },
  { name:'BLUE STAR',      cost:1000,   c:{ '6':'#8bd8ff' } },
  { name:'WHITE STAR',     cost:5000,   c:{ '6':'#ffffff' } },
  { name:'VOID STAR',      cost:50000,  c:{ '6':'#c86ade' } },
];

function _ensureCustomState() {
  if (!state.customize) state.customize = { robe: 0, hat: 0, trail: 0, star: 0, owned: { robe:{0:1}, hat:{0:1}, trail:{0:1}, star:{0:1} } };
  const c = state.customize;
  if (!c.owned) c.owned = { robe:{0:1}, hat:{0:1}, trail:{0:1}, star:{0:1} };
  for (const k of ['robe','hat','trail','star']) { if (!c.owned[k]) c.owned[k] = {0:1}; c.owned[k][0] = 1; }
}

// 게임에서 실시간 조회 - drawPlayer 가 호출.
function activePlayerPal() {
  _ensureCustomState();
  if (typeof PLAYER_PAL === 'undefined') return {};
  const out = Object.assign({}, PLAYER_PAL);
  const c = state.customize;
  const rb = CUSTOM_ROBES[c.robe || 0]; if (rb && rb.c) Object.assign(out, rb.c);
  const ht = CUSTOM_HATS[c.hat || 0];   if (ht && ht.c) Object.assign(out, ht.c);
  const st = CUSTOM_STARS[c.star || 0]; if (st && st.c) Object.assign(out, st.c);
  return out;
}

// 트레일 색 반환 (drawPlayer 에서 사용)
function activePlayerTrailColor() {
  _ensureCustomState();
  const t = CUSTOM_TRAILS[state.customize.trail || 0];
  if (!t || !t.color) return null;
  if (t.color === '#RAINBOW') {
    const h = Math.floor((state.time * 200) % 360);
    return 'hsl(' + h + ', 90%, 60%)';
  }
  return t.color;
}

// ---------- Scene ----------
const customize = {
  tab: 'robe',
  cursor: 0,
  message: '',
  messageT: 0,
};

const CUSTOM_TABS = [
  { id:'robe',  name:'ROBE',  list: CUSTOM_ROBES,  key:'robe' },
  { id:'hat',   name:'HAT',   list: CUSTOM_HATS,   key:'hat' },
  { id:'star',  name:'STAR',  list: CUSTOM_STARS,  key:'star' },
  { id:'trail', name:'TRAIL', list: CUSTOM_TRAILS, key:'trail' },
];

function _currentCustomTab() { return CUSTOM_TABS.find(t => t.id === customize.tab); }

function updateCustomize(dt) {
  _ensureCustomState();
  if (customize.messageT > 0) customize.messageT -= dt;
  const tab = _currentCustomTab();
  const list = tab.list;
  const n = list.length;

  if (keys['Digit1']) { keys['Digit1']=false; customize.tab='robe';  customize.cursor=0; sfx('hit'); }
  if (keys['Digit2']) { keys['Digit2']=false; customize.tab='hat';   customize.cursor=0; sfx('hit'); }
  if (keys['Digit3']) { keys['Digit3']=false; customize.tab='star';  customize.cursor=0; sfx('hit'); }
  if (keys['Digit4']) { keys['Digit4']=false; customize.tab='trail'; customize.cursor=0; sfx('hit'); }
  if (keys['Tab'])    { keys['Tab']=false; const idx = CUSTOM_TABS.findIndex(t => t.id === customize.tab); customize.tab = CUSTOM_TABS[(idx+1)%CUSTOM_TABS.length].id; customize.cursor=0; sfx('hit'); }

  if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; customize.cursor = Math.max(0, customize.cursor - 1); }
  if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; customize.cursor = Math.min(n - 1, customize.cursor + 1); }
  if (mouse.wheel) { customize.cursor = Math.max(0, Math.min(n - 1, customize.cursor + mouse.wheel)); mouse.wheel = 0; }

  if (keys['Space'] || keys['Enter']) {
    keys['Space']=false; keys['Enter']=false;
    const item = list[customize.cursor];
    const owned = !!(state.customize.owned[tab.key] && state.customize.owned[tab.key][customize.cursor]);
    if (owned) {
      state.customize[tab.key] = customize.cursor;
      customize.message = '장착: ' + item.name; customize.messageT = 2; sfx('pickup');
      if (typeof saveAccountData === 'function') saveAccountData();
    } else {
      if ((state.research || 0) >= item.cost) {
        state.research -= item.cost;
        state.customize.owned[tab.key][customize.cursor] = 1;
        state.customize[tab.key] = customize.cursor;
        customize.message = '구매+장착: ' + item.name; customize.messageT = 2; sfx('level');
        if (typeof saveAccountData === 'function') saveAccountData();
      } else {
        customize.message = 'RP 부족'; customize.messageT = 2; sfx('hurt');
      }
    }
  }

  if (keys['KeyR'] || keys['Escape']) { keys['KeyR']=false; keys['Escape']=false; state.scene = 'academy'; }

  if (mouse.down && Array.isArray(window._customTabRects)) {
    for (const r of window._customTabRects) {
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        mouse.down = false; customize.tab = r.id; customize.cursor = 0; sfx('hit'); return;
      }
    }
  }
  if (mouse.down && Array.isArray(window._customRowRects)) {
    for (const r of window._customRowRects) {
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        mouse.down = false; customize.cursor = r.idx; return;
      }
    }
  }
}

function renderCustomize() {
  _ensureCustomState();
  ctx.fillStyle = '#050310'; ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)'; ctx.fillRect(0, 0, W*PX, H*PX);

  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('CUSTOMIZE  RP ' + _fmtBigRp(state.research||0), 4, 3, '#ffefa8');
  const hintShort = '[R/ESC] BACK';
  drawText(hintShort, W - textWidth(hintShort) - 4, 3, '#8a7ab5');

  // 탭
  window._customTabRects = [];
  const tabW = 50, tabY = 14, tabH = 10;
  for (let i = 0; i < CUSTOM_TABS.length; i++) {
    const t = CUSTOM_TABS[i]; const x = 8 + i * (tabW + 4);
    const active = customize.tab === t.id;
    pxDraw(x, tabY, tabW, tabH, active ? '#3a1e5c' : '#1a0e2e');
    if (active) pxDraw(x, tabY + tabH, tabW, 1, '#ffefa8');
    drawText((i+1) + ' ' + t.name, x + tabW/2 - textWidth((i+1)+' '+t.name)/2, tabY + 2, active ? '#ffefa8' : '#8a7ab5');
    window._customTabRects.push({ id: t.id, x, y: tabY, w: tabW, h: tabH });
  }

  // 미리보기 (좌측)
  const previewX = 40, previewY = 60;
  pxDraw(previewX - 18, previewY - 18, 40, 40, '#1a0e2e');
  pxDraw(previewX - 18, previewY - 18, 40, 1, '#3a1e5c');
  pxDraw(previewX - 18, previewY + 21, 40, 1, '#3a1e5c');
  pxDraw(previewX - 18, previewY - 18, 1, 40, '#3a1e5c');
  pxDraw(previewX + 21, previewY - 18, 1, 40, '#3a1e5c');
  // 임시 팔레트로 미리보기
  const tab = _currentCustomTab();
  const previewIdx = customize.cursor;
  const previewPal = Object.assign({}, PLAYER_PAL);
  const rb = CUSTOM_ROBES[state.customize.robe||0]; if (rb) Object.assign(previewPal, rb.c || {});
  const ht = CUSTOM_HATS[state.customize.hat||0];   if (ht) Object.assign(previewPal, ht.c || {});
  const st = CUSTOM_STARS[state.customize.star||0]; if (st) Object.assign(previewPal, st.c || {});
  if (tab.id === 'robe' && CUSTOM_ROBES[previewIdx]) Object.assign(previewPal, CUSTOM_ROBES[previewIdx].c || {});
  if (tab.id === 'hat'  && CUSTOM_HATS[previewIdx])  Object.assign(previewPal, CUSTOM_HATS[previewIdx].c || {});
  if (tab.id === 'star' && CUSTOM_STARS[previewIdx]) Object.assign(previewPal, CUSTOM_STARS[previewIdx].c || {});
  // 트레일 미리보기 - 스프라이트가 좌우로 스윙, 뒤에 궤적이 남는 형태
  const trailIdxPreview = (tab.id === 'trail') ? previewIdx : (state.customize.trail || 0);
  const trailDef = CUSTOM_TRAILS[trailIdxPreview];
  let trailBase = trailDef && trailDef.color;
  const rainbow = (trailBase === '#RAINBOW');
  const T = state.time * 3;
  const swing = Math.sin(T) * 8;        // -8 ~ +8
  const px = previewX + swing;
  // 궤적: 캐릭터가 지나간 지점들 (과거 5개 프레임의 스윙 위치)
  if (trailBase) {
    for (let i = 5; i >= 1; i--) {
      const ox = Math.sin(T - i * 0.15) * 8;
      const col = rainbow ? ('hsl(' + Math.floor((state.time * 200 - i * 30) % 360) + ', 90%, 60%)') : trailBase;
      ctx.globalAlpha = 0.8 * (1 - i / 6);
      // 발 아래 위치 (previewY + 5)
      pxDraw(previewX + ox - 2, previewY + 5, 4, 3, col);
      pxDraw(previewX + ox - 1, previewY + 5, 2, 2, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }
  if (typeof SPR_PLAYER_S1 !== 'undefined' && typeof drawSprite === 'function') {
    drawSprite(SPR_PLAYER_S1, previewPal, px - 6, previewY - 7);
  }
  drawText('PREVIEW', previewX - textWidth('PREVIEW')/2, previewY + 26, '#8a7ab5');

  // 목록 (우측)
  const list = tab.list;
  const bodyX = 90, bodyY = 30, bodyW = W - 100, rowH = 14;
  window._customRowRects = [];
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    const owned = !!(state.customize.owned[tab.key] && state.customize.owned[tab.key][i]);
    const equipped = (state.customize[tab.key] || 0) === i;
    const y = bodyY + i * rowH;
    if (y + rowH > H - 20) break;
    const isSel = customize.cursor === i;
    if (isSel) pxDraw(bodyX, y - 2, bodyW, rowH, '#2a1548');
    // 색 미리보기 박스
    const box = (tab.id === 'trail') ? (it.color && it.color !== '#RAINBOW' ? it.color : '#c86ade') : (it.c && (it.c['3'] || it.c['7'] || it.c['6']) || '#ffffff');
    pxDraw(bodyX + 4, y + 2, 8, 8, box);
    const label = (equipped ? '[EQ] ' : '') + it.name;
    drawText(label, bodyX + 16, y, equipped ? '#3ac762' : (owned ? '#ffefa8' : '#c8b898'));
    const cost = owned ? 'OWNED' : (Math.floor(it.cost) + ' RP');
    drawText(cost, bodyX + bodyW - textWidth(cost) - 4, y, owned ? '#5a4a80' : ((state.research||0) >= it.cost ? '#8bd8ff' : '#c81616'));
    window._customRowRects.push({ idx: i, x: bodyX, y: y - 2, w: bodyW, h: rowH });
  }

  if (customize.messageT > 0) {
    ctx.globalAlpha = Math.min(1, customize.messageT / 0.5);
    drawText(customize.message, W/2 - textWidth(customize.message)/2, H - 18, '#ffefa8');
    ctx.globalAlpha = 1;
  }
  const bottomHint = '1-4 TAB   WASD SCROLL   SPACE BUY/EQUIP';
  drawText(bottomHint, W/2 - textWidth(bottomHint)/2, H - 8, '#5a4a80');
}
