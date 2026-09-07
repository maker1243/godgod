// =====================================================================
// Legacy Lobby - 관록/아티팩트/트레잇 통합 상점.
// 아카데미 [LEGACY] 문으로 진입. 세 탭.
// =====================================================================

const legacyLobby = {
  tab: 'legacy',        // 'legacy' | 'artifact' | 'trait'
  cursor: 0,
  scroll: 0,
  visibleRows: 10,
  message: '',
  messageT: 0,
};

const LEGACY_TABS = [
  { id:'legacy',   name:'LEGACY'    },
  { id:'artifact', name:'ARTIFACT'  },
  { id:'trait',    name:'TRAIT'     },
];

function _fmtBigRp(n) {
  if (n >= 1e12) return (n/1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(2)  + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(2)  + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(2)  + 'k';
  return String(Math.floor(n));
}

function legacyLobbyEntries() {
  const out = [];
  if (legacyLobby.tab === 'legacy') {
    for (const p of LEGACY_PILLARS) {
      const lv = legacyGetLevel(p.id);
      const cost = _legacyCostAt(p, lv);
      out.push({
        kind: 'legacy', id: p.id, color: p.color,
        title: p.name + '  LV ' + lv,
        sub:   p.desc + '   NEXT: ' + _fmtBigRp(cost) + ' RP',
        cost,
        can: (state.research || 0) >= cost,
      });
    }
  } else if (legacyLobby.tab === 'artifact') {
    _ensureArtifactsState();
    // 오늘의 로테이션 5개 - 우선 표시
    const offers = state.artifacts.rotationOffers || [];
    out.push({ kind:'header', title:'>> TODAY\'S OFFER  (' + state.artifacts.rotationDay + ')', color:'#ffefa8' });
    for (const id of offers) {
      const a = ARTIFACT_BY_ID[id]; if (!a) continue;
      const owned = !!state.artifacts.owned[id];
      const eq = state.artifacts.equipped.indexOf(id) >= 0;
      out.push({
        kind:'artifact', id, color: a.color,
        title: (eq ? '[EQ] ' : '') + a.name + '  T' + a.tier,
        sub:   a.desc + '   ' + (owned ? 'OWNED  [F EQUIP]' : _fmtBigRp(a.cost) + ' RP  [SPACE BUY]'),
        cost:  a.cost, owned, eq,
        can:   owned || (state.research || 0) >= a.cost,
      });
    }
    // 이미 소유한 것 모두 (F로 장착 관리)
    out.push({ kind:'header', title:'>> OWNED ARTIFACTS  (' + state.artifacts.equipped.length + '/' + ARTIFACT_SLOT_COUNT + ' EQUIPPED)', color:'#8bd8ff' });
    for (const id of Object.keys(state.artifacts.owned)) {
      const a = ARTIFACT_BY_ID[id]; if (!a) continue;
      const eq = state.artifacts.equipped.indexOf(id) >= 0;
      out.push({
        kind:'artifact', id, color: a.color,
        title: (eq ? '[EQ] ' : '') + a.name + '  T' + a.tier,
        sub:   a.desc + '   [F EQUIP/UNEQUIP]',
        owned: true, eq, can: true,
      });
    }
  } else if (legacyLobby.tab === 'trait') {
    _ensureTraitsState();
    out.push({ kind:'header', title:'>> TRAITS  (' + state.traits.equipped.length + '/' + TRAIT_SLOT_COUNT + ' EQUIPPED)', color:'#ffefa8' });
    for (const t of TRAIT_DEFS) {
      const owned = !!state.traits.owned[t.id];
      const eq = state.traits.equipped.indexOf(t.id) >= 0;
      out.push({
        kind:'trait', id: t.id, color: t.color,
        title: (eq ? '[EQ] ' : '') + '[' + t.cat + '] ' + t.name,
        sub:   t.desc + '   ' + (owned ? '[F EQUIP]' : _fmtBigRp(t.cost) + ' RP  [SPACE BUY]'),
        cost: t.cost, owned, eq,
        can: owned || (state.research || 0) >= t.cost,
      });
    }
  }
  return out;
}

function updateLegacyLobby(dt) {
  if (legacyLobby.messageT > 0) legacyLobby.messageT -= dt;
  const entries = legacyLobbyEntries();
  const n = entries.length || 1;

  if (keys['Digit1']) { keys['Digit1']=false; legacyLobby.tab='legacy';   legacyLobby.cursor=0; legacyLobby.scroll=0; sfx('hit'); }
  if (keys['Digit2']) { keys['Digit2']=false; legacyLobby.tab='artifact'; legacyLobby.cursor=0; legacyLobby.scroll=0; sfx('hit'); }
  if (keys['Digit3']) { keys['Digit3']=false; legacyLobby.tab='trait';    legacyLobby.cursor=0; legacyLobby.scroll=0; sfx('hit'); }
  if (keys['Tab'])    { keys['Tab']=false; const idx = LEGACY_TABS.findIndex(t => t.id === legacyLobby.tab); legacyLobby.tab = LEGACY_TABS[(idx+1) % LEGACY_TABS.length].id; legacyLobby.cursor=0; legacyLobby.scroll=0; sfx('hit'); }

  if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; legacyLobby.cursor = Math.max(0, legacyLobby.cursor - 1); }
  if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; legacyLobby.cursor = Math.min(n - 1, legacyLobby.cursor + 1); }
  if (keys['PageUp'])   { keys['PageUp']=false;   legacyLobby.cursor = Math.max(0, legacyLobby.cursor - legacyLobby.visibleRows); }
  if (keys['PageDown']) { keys['PageDown']=false; legacyLobby.cursor = Math.min(n - 1, legacyLobby.cursor + legacyLobby.visibleRows); }
  if (mouse.wheel) { legacyLobby.cursor = Math.max(0, Math.min(n - 1, legacyLobby.cursor + mouse.wheel)); mouse.wheel = 0; }

  // 구매 / 장착
  const cur = entries[legacyLobby.cursor];
  if (keys['Space'] || keys['Enter']) {
    keys['Space']=false; keys['Enter']=false;
    if (cur && cur.kind === 'legacy') {
      if (legacyBuy(cur.id)) { legacyLobby.message = 'PURCHASED +1 LV'; legacyLobby.messageT = 2; sfx('level'); refreshPlayerStats(); }
      else                    { legacyLobby.message = 'NOT ENOUGH RP';  legacyLobby.messageT = 2; sfx('hurt'); }
    } else if (cur && cur.kind === 'artifact' && !cur.owned) {
      if (artifactBuy(cur.id)) { legacyLobby.message = 'ARTIFACT ACQUIRED'; legacyLobby.messageT = 2; sfx('level'); }
      else                     { legacyLobby.message = 'NOT ENOUGH RP';     legacyLobby.messageT = 2; sfx('hurt'); }
    } else if (cur && cur.kind === 'trait' && !cur.owned) {
      if (traitBuy(cur.id)) { legacyLobby.message = 'TRAIT LEARNED'; legacyLobby.messageT = 2; sfx('level'); }
      else                  { legacyLobby.message = 'NOT ENOUGH RP'; legacyLobby.messageT = 2; sfx('hurt'); }
    }
  }
  if (keys['KeyF']) {
    keys['KeyF']=false;
    if (cur && cur.kind === 'artifact' && cur.owned) {
      if (artifactEquip(cur.id)) { legacyLobby.message = cur.eq ? 'UNEQUIPPED' : 'EQUIPPED'; legacyLobby.messageT = 2; sfx('pickup'); refreshPlayerStats(); }
      else                        { legacyLobby.message = 'SLOT FULL (' + ARTIFACT_SLOT_COUNT + ')'; legacyLobby.messageT = 2; sfx('hurt'); }
    } else if (cur && cur.kind === 'trait' && cur.owned) {
      if (traitEquip(cur.id)) { legacyLobby.message = cur.eq ? 'UNEQUIPPED' : 'EQUIPPED'; legacyLobby.messageT = 2; sfx('pickup'); refreshPlayerStats(); }
      else                     { legacyLobby.message = 'SLOT FULL (' + TRAIT_SLOT_COUNT + ')'; legacyLobby.messageT = 2; sfx('hurt'); }
    }
  }
  if (keys['KeyR'] || keys['Escape']) {
    keys['KeyR']=false; keys['Escape']=false;
    state.scene = 'academy';
  }

  // 마우스 탭/행 클릭
  if (mouse.down && Array.isArray(window._llTabRects)) {
    for (const r of window._llTabRects) {
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        mouse.down = false;
        legacyLobby.tab = r.id; legacyLobby.cursor = 0; legacyLobby.scroll = 0;
        sfx('hit'); return;
      }
    }
  }
  if (mouse.down && Array.isArray(window._llRowRects)) {
    for (const r of window._llRowRects) {
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        mouse.down = false;
        legacyLobby.cursor = r.idx; return;
      }
    }
  }
}

// 관록/아티팩트/트레잇 변경 즉시 반영. player 재생성으로 스탯 다시 계산.
// 진행 중 HP/MP 는 비율 유지.
function refreshPlayerStats() {
  if (!player) return;
  const hpRatio = player.maxHp > 0 ? (player.hp / player.maxHp) : 1;
  const mpRatio = player.maxMp > 0 ? (player.mp / player.maxMp) : 1;
  const px = player.x, py = player.y;
  const np = createPlayer();
  np.x = px; np.y = py;
  np.hp = Math.min(np.maxHp, Math.max(1, Math.floor(np.maxHp * hpRatio)));
  np.mp = Math.min(np.maxMp, Math.floor(np.maxMp * mpRatio));
  player = np;
}

function renderLegacyLobby() {
  ctx.fillStyle = '#050310';
  ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  // 헤더
  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('LEGACY HALL  RP ' + _fmtBigRp(state.research || 0), 4, 3, '#ffefa8');
  const hintShort = '[R/ESC] BACK';
  drawText(hintShort, W - textWidth(hintShort) - 4, 3, '#8a7ab5');

  // 탭
  const tabW = 60, tabY = 14, tabH = 10;
  window._llTabRects = [];
  for (let i = 0; i < LEGACY_TABS.length; i++) {
    const t = LEGACY_TABS[i];
    const x = 8 + i * (tabW + 4);
    const active = legacyLobby.tab === t.id;
    pxDraw(x, tabY, tabW, tabH, active ? '#3a1e5c' : '#1a0e2e');
    if (active) pxDraw(x, tabY + tabH, tabW, 1, '#ffefa8');
    drawText((i+1) + ' ' + t.name, x + tabW/2 - textWidth((i+1) + ' ' + t.name)/2, tabY + 2, active ? '#ffefa8' : '#8a7ab5');
    window._llTabRects.push({ id: t.id, x, y: tabY, w: tabW, h: tabH });
  }

  // 내용
  const entries = legacyLobbyEntries();
  const bodyX = 8, bodyY = 30, bodyW = W - 16;
  const rowH = 14;
  const bodyH = legacyLobby.visibleRows * rowH;
  pxDraw(bodyX, bodyY, bodyW, bodyH + 4, '#0a0512');
  pxDraw(bodyX, bodyY, bodyW, 1, '#3a1e5c');
  pxDraw(bodyX, bodyY + bodyH + 3, bodyW, 1, '#3a1e5c');

  let scroll = legacyLobby.scroll;
  if (legacyLobby.cursor < scroll) scroll = legacyLobby.cursor;
  if (legacyLobby.cursor >= scroll + legacyLobby.visibleRows) scroll = legacyLobby.cursor - legacyLobby.visibleRows + 1;
  scroll = Math.max(0, Math.min(scroll, Math.max(0, entries.length - legacyLobby.visibleRows)));
  legacyLobby.scroll = scroll;

  window._llRowRects = [];
  for (let vi = 0; vi < legacyLobby.visibleRows; vi++) {
    const i = scroll + vi;
    if (i >= entries.length) break;
    const e = entries[i];
    const ry = bodyY + 2 + vi * rowH;
    const isSel = legacyLobby.cursor === i;
    if (e.kind === 'header') {
      pxDraw(bodyX + 2, ry, bodyW - 4, rowH - 1, '#1a0e2e');
      drawText(e.title, bodyX + 6, ry + 3, e.color || '#ffefa8');
    } else {
      if (isSel) pxDraw(bodyX + 2, ry, bodyW - 4, rowH - 1, '#2a1548');
      pxDraw(bodyX + 6, ry + 3, 4, 8, e.color || '#e8d9b0');
      drawText(e.title, bodyX + 14, ry, e.color || '#e8d9b0');
      const subCol = e.can ? '#c8b898' : '#5a4a80';
      drawText(e.sub, bodyX + 14, ry + 7, subCol);
    }
    window._llRowRects.push({ idx: i, x: bodyX, y: ry - 1, w: bodyW, h: rowH });
  }

  // 스크롤바
  const trackX = bodyX + bodyW - 3;
  const trackY = bodyY + 2;
  pxDraw(trackX, trackY, 2, bodyH, '#1a0e2e');
  if (entries.length > legacyLobby.visibleRows) {
    const thumbH = Math.max(6, Math.floor(bodyH * legacyLobby.visibleRows / entries.length));
    const thumbY = trackY + Math.floor((bodyH - thumbH) * scroll / (entries.length - legacyLobby.visibleRows));
    pxDraw(trackX, thumbY, 2, thumbH, '#ffefa8');
  }

  // 메시지
  if (legacyLobby.messageT > 0) {
    ctx.globalAlpha = Math.min(1, legacyLobby.messageT / 0.5);
    const s = legacyLobby.message;
    drawText(s, W/2 - textWidth(s)/2, H - 20, '#ffefa8');
    ctx.globalAlpha = 1;
  }
  const counter = (legacyLobby.cursor + 1) + '/' + entries.length;
  drawText(counter, W - textWidth(counter) - 4, H - 10, '#8a7ab5');
  const bottomHint = '1-3 TAB   WASD/WHEEL SCROLL   SPACE BUY   F EQUIP';
  drawText(bottomHint, 4, H - 10, '#5a4a80');
}
