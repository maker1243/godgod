// =====================================================================
// Spell Craft UI - 4개 축을 사이클하며 스펠을 미리보고 이름을 지어 등록.
// 사이드: 소유한 스펠 목록 · 장착/삭제.
// =====================================================================

const spellCraftUI = {
  tab: 'craft',        // 'craft' | 'library'
  // craft 상태
  eIdx: 0, tIdx: 0, gIdx: 0, cIdx: 0,
  cursor: 0,           // 0:element 1:traj 2:trigger 3:chant 4:name 5:craft
  inputBuf: '',
  namingMode: false,
  // library
  libCursor: 0,
  msg: '', msgT: 0,
};

function openSpellCraft() {
  _spellState();
  spellCraftUI.tab = 'craft';
  spellCraftUI.cursor = 0;
  spellCraftUI.namingMode = false;
  spellCraftUI.inputBuf = '';
  state.scene = 'spellCraft';
}

function _spellCraftPreview() {
  return {
    element: SPELL_ELEMENTS[spellCraftUI.eIdx].id,
    traj:    SPELL_TRAJECTORIES[spellCraftUI.tIdx].id,
    trigger: SPELL_TRIGGERS[spellCraftUI.gIdx].id,
    chant:   SPELL_CHANTS[spellCraftUI.cIdx].id,
  };
}

function updateSpellCraft(dt) {
  if (spellCraftUI.msgT > 0) spellCraftUI.msgT -= dt;

  // 이름 입력 모드
  if (spellCraftUI.namingMode) {
    if (keys['Enter']) {
      keys['Enter'] = false;
      if (spellCraftUI.inputBuf.trim().length < 1) { spellCraftUI.msg = '1자 이상 입력'; spellCraftUI.msgT = 2; return; }
      const prev = _spellCraftPreview();
      const sp = craftSpell(prev.element, prev.traj, prev.trigger, prev.chant, spellCraftUI.inputBuf.trim().slice(0, 20));
      if (sp) { spellCraftUI.namingMode = false; spellCraftUI.inputBuf = ''; spellCraftUI.msg = '창조! [' + sp.name + ']'; spellCraftUI.msgT = 3; }
      return;
    }
    if (keys['Backspace']) { keys['Backspace']=false; spellCraftUI.inputBuf = spellCraftUI.inputBuf.slice(0, -1); }
    if (keys['Escape']) { keys['Escape']=false; spellCraftUI.namingMode=false; spellCraftUI.inputBuf=''; }
    return;
  }

  // ESC 종료
  if (keys['Escape'] || keys['KeyR']) { keys['Escape']=false; keys['KeyR']=false; state.scene='academy'; return; }
  // 탭 전환
  if (keys['Tab']) { keys['Tab']=false; spellCraftUI.tab = (spellCraftUI.tab === 'craft') ? 'library' : 'craft'; }

  if (spellCraftUI.tab === 'craft') {
    // WS 로 커서 이동 (5개: E/T/G/C/CRAFT)
    if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; spellCraftUI.cursor = (spellCraftUI.cursor - 1 + 5) % 5; sfx('hit'); }
    if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; spellCraftUI.cursor = (spellCraftUI.cursor + 1) % 5; sfx('hit'); }
    // AD 로 값 변경 (선택된 축)
    const dir = keys['KeyD'] || keys['ArrowRight'] ? 1 : (keys['KeyA'] || keys['ArrowLeft'] ? -1 : 0);
    if (dir !== 0 && spellCraftUI.cursor < 4) {
      keys['KeyD']=false; keys['ArrowRight']=false; keys['KeyA']=false; keys['ArrowLeft']=false;
      if (spellCraftUI.cursor === 0) spellCraftUI.eIdx = (spellCraftUI.eIdx + dir + SPELL_ELEMENTS.length) % SPELL_ELEMENTS.length;
      if (spellCraftUI.cursor === 1) spellCraftUI.tIdx = (spellCraftUI.tIdx + dir + SPELL_TRAJECTORIES.length) % SPELL_TRAJECTORIES.length;
      if (spellCraftUI.cursor === 2) spellCraftUI.gIdx = (spellCraftUI.gIdx + dir + SPELL_TRIGGERS.length) % SPELL_TRIGGERS.length;
      if (spellCraftUI.cursor === 3) spellCraftUI.cIdx = (spellCraftUI.cIdx + dir + SPELL_CHANTS.length) % SPELL_CHANTS.length;
      sfx('hit');
    }
    // SPACE 로 창조 (커서=4) 혹은 이름 짓기 시작
    if (keys['Space'] || keys['Enter']) {
      keys['Space']=false; keys['Enter']=false;
      if (spellCraftUI.cursor === 4) {
        // 창조 시도 → 이름 입력 모드
        spellCraftUI.namingMode = true;
        spellCraftUI.inputBuf = '';
      }
    }
  } else if (spellCraftUI.tab === 'library') {
    if (!state.customSpells || state.customSpells.length === 0) return;
    if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; spellCraftUI.libCursor = (spellCraftUI.libCursor - 1 + state.customSpells.length) % state.customSpells.length; sfx('hit'); }
    if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; spellCraftUI.libCursor = (spellCraftUI.libCursor + 1) % state.customSpells.length; sfx('hit'); }
    if (keys['KeyE']) { keys['KeyE']=false; const sp = state.customSpells[spellCraftUI.libCursor]; if (sp) { equipSpell(sp.id); spellCraftUI.msg = '장착: ' + sp.name; spellCraftUI.msgT = 2; } }
    if (keys['KeyX']) { keys['KeyX']=false; const sp = state.customSpells[spellCraftUI.libCursor]; if (sp) { deleteSpell(sp.id); spellCraftUI.libCursor = Math.max(0, spellCraftUI.libCursor - 1); spellCraftUI.msg = '삭제됨'; spellCraftUI.msgT = 2; } }
    if (keys['KeyQ']) { keys['KeyQ']=false; equipSpell(null); spellCraftUI.msg = '기본 화염구로 전환'; spellCraftUI.msgT = 2; }
  }
}

// 텍스트 입력 훅 (utils.js keydown)
function spellCraftKeyPressed(ch) {
  if (state.scene !== 'spellCraft') return false;
  if (!spellCraftUI.namingMode) return false;
  if (ch && ch.length === 1 && spellCraftUI.inputBuf.length < 20) {
    spellCraftUI.inputBuf += ch;
    return true;
  }
  return false;
}

function renderSpellCraft() {
  ctx.fillStyle = '#0a0510'; ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();

  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('마법 조합실 (Spell Craftorium)', 4, 3, '#c86ade');
  drawText('[TAB] 전환   [R/ESC] 나가기', W - textWidth('[TAB] 전환   [R/ESC] 나가기') - 4, 3, '#8a7ab5');

  // 탭
  const tabs = [
    { id:'craft',   name:'창조' },
    { id:'library', name:'라이브러리 (' + ((state.customSpells||[]).length) + ')' },
  ];
  for (let i = 0; i < tabs.length; i++) {
    const tx = 8 + i * 80;
    const active = spellCraftUI.tab === tabs[i].id;
    if (active) pxDraw(tx, 15, 76, 10, '#3a1e5c');
    drawText(tabs[i].name, tx + 4, 17, active ? '#ffefa8' : '#8a7ab5');
  }

  if (spellCraftUI.namingMode) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W*PX, H*PX);
    drawText('주문 이름 입력', W/2 - textWidth('주문 이름 입력', 2)/2, 55, '#ffefa8', 2);
    const box = spellCraftUI.inputBuf + (Math.floor(state.time*2)%2 ? '_' : ' ');
    pxDraw(40, 85, W - 80, 20, '#1a0e2e');
    pxDraw(40, 85, W - 80, 1, '#e8c547');
    pxDraw(40, 104, W - 80, 1, '#e8c547');
    drawText(box, 48, 91, '#ffefa8');
    drawText('[Enter] 창조   [Esc] 취소', W/2 - 60, 115, '#8a7ab5');
    if (spellCraftUI.msgT > 0) drawText(spellCraftUI.msg, W/2 - textWidth(spellCraftUI.msg)/2, 135, '#ff6666');
    return;
  }

  if (spellCraftUI.tab === 'craft') {
    // 4개 축 카드
    const axes = [
      { title:'속성 (Element)',   items: SPELL_ELEMENTS,    idx: spellCraftUI.eIdx },
      { title:'궤도 (Trajectory)', items: SPELL_TRAJECTORIES, idx: spellCraftUI.tIdx },
      { title:'기폭 (Trigger)',    items: SPELL_TRIGGERS,    idx: spellCraftUI.gIdx },
      { title:'영창 (Chant)',      items: SPELL_CHANTS,      idx: spellCraftUI.cIdx },
    ];
    for (let i = 0; i < axes.length; i++) {
      const ax = axes[i];
      const y = 30 + i * 22;
      const isSel = spellCraftUI.cursor === i;
      const it = ax.items[ax.idx];
      // 카드
      pxDraw(8, y, W - 16, 20, isSel ? '#2a1548' : '#1a0e2e');
      if (isSel) {
        pxDraw(8, y, 2, 20, '#e8c547');
      }
      drawText(ax.title, 14, y + 2, '#8a7ab5');
      drawText('◀ ' + it.name + ' ▶', 14, y + 11, it.color || '#ffefa8');
      drawText((it.desc || it.castLabel || it.effect || '').slice(0, 40), 100, y + 11, '#c8b898');
    }

    // 결과 미리보기 + 크래프트 버튼
    const y = 30 + 4 * 22;
    const isSel = spellCraftUI.cursor === 4;
    const cost = nextSpellCraftCost();
    const preview = _spellCraftPreview();
    const st = computeSpellStats(preview);
    pxDraw(8, y, W - 16, 30, isSel ? '#2a1548' : '#1a0e2e');
    if (isSel) pxDraw(8, y, 2, 30, '#e8c547');
    drawText('예상 스탯:  DMG ' + Math.round(st.dmg) + '  ·  CD ' + st.cd.toFixed(2) + 's  ·  MP ' + st.cost, 14, y + 3, '#8bd8ff');
    drawText('시전 속도: ' + st.c.castLabel + '   ·   ' + st.e.effect, 14, y + 12, '#c86ade');
    const canAfford = (state.research||0) >= cost;
    drawText((isSel ? '▶ ' : '  ') + '[SPACE] 창조하기   (비용: ' + cost + ' RP  ·  보유: ' + Math.floor(state.research||0) + ')', 14, y + 21, canAfford ? '#3ac762' : '#c81616');

    drawText('WS 축 선택   AD 값 변경   SPACE 창조', W/2 - textWidth('WS 축 선택   AD 값 변경   SPACE 창조')/2, H - 8, '#8a7ab5');
  } else {
    // 라이브러리
    const list = state.customSpells || [];
    if (list.length === 0) {
      drawText('아직 창조한 주문이 없습니다.', W/2 - 80, 70, '#c8b898');
      drawText('[TAB] 을 눌러 창조 탭으로 이동.', W/2 - 90, 85, '#8a7ab5');
      return;
    }
    // 헤더
    drawText('WS 이동   E 장착   X 삭제   Q 기본 화염구', 8, 30, '#8a7ab5');
    // 목록
    const rowH = 22;
    for (let i = 0; i < list.length; i++) {
      const sp = list[i];
      const y = 45 + i * rowH;
      if (y > H - 20) break;
      const isSel = spellCraftUI.libCursor === i;
      const isEq  = state.equippedSpell === sp.id;
      pxDraw(8, y, W - 16, rowH - 2, isSel ? '#2a1548' : '#1a0e2e');
      if (isSel) pxDraw(8, y, 2, rowH - 2, '#e8c547');
      const el = SPELL_ELEMENT_BY_ID[sp.element] || SPELL_ELEMENTS[0];
      const st = computeSpellStats(sp);
      drawText((isEq ? '★ ' : '  ') + sp.name, 14, y + 2, isEq ? '#ffefa8' : el.color);
      drawText(el.name + ' / ' + (SPELL_TRAJ_BY_ID[sp.traj]||{}).name + ' / ' + (SPELL_TRIGGER_BY_ID[sp.trigger]||{}).name + ' / ' + (SPELL_CHANT_BY_ID[sp.chant]||{}).name, 14, y + 11, '#c8b898');
      drawText('DMG ' + Math.round(st.dmg) + ' · CD ' + st.cd.toFixed(2) + 's · MP ' + st.cost, W - 130, y + 6, '#8bd8ff');
    }
  }

  if (spellCraftUI.msgT > 0 && !spellCraftUI.namingMode) {
    ctx.globalAlpha = Math.min(1, spellCraftUI.msgT);
    const boxW = textWidth(spellCraftUI.msg) + 16;
    pxDraw(W/2 - boxW/2, H - 30, boxW, 12, '#1a0e2e');
    drawText(spellCraftUI.msg, W/2 - textWidth(spellCraftUI.msg)/2, H - 26, '#ffefa8');
    ctx.globalAlpha = 1;
  }
}
