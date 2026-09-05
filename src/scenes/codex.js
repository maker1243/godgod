// =====================================================================
// Codex (도감) - 특성/스킬/난이도/시련의 모든 효과를 조회.
// 아카데미에서 X 키 또는 상단 [DOCS] 버튼으로 진입.
// =====================================================================

const codex = {
  tab: 'perks',       // 'perks' | 'skills' | 'tiers' | 'trials'
  cursor: 0,
  scroll: 0,
  visibleRows: 12,
  message: '',
  messageT: 0,
};

const CODEX_TABS = [
  { id:'perks',  name:'PERKS'      },
  { id:'skills', name:'SKILLS'     },
  { id:'tiers',  name:'DIFFICULTY' },
  { id:'trials', name:'TRIALS'     },
];

function codexSetTab(id) {
  codex.tab = id;
  codex.cursor = 0;
  codex.scroll = 0;
}

// 각 탭이 렌더할 항목 리스트 반환. 각 항목: {title, sub, color}
function codexEntries() {
  const out = [];
  if (codex.tab === 'perks') {
    if (typeof PERK_POOL !== 'undefined') {
      for (const p of PERK_POOL) out.push({ title: p.name, sub: p.desc, color: '#ffefa8' });
    }
  } else if (codex.tab === 'skills') {
    if (typeof SKILL_TREE !== 'undefined') {
      for (const cat of Object.keys(SKILL_TREE)) {
        const tree = SKILL_TREE[cat];
        for (const s of tree.skills) {
          const tag = s.isUltra ? '[U]' : s.isMax ? '[M]' : '';
          const slot = s.slot === 'passive' ? 'PSV' : s.slot.toUpperCase();
          out.push({
            title: (tag ? tag + ' ' : '') + s.name + '  ' + slot,
            sub: (s.desc || '-') + '   COST ' + s.cost + 'R',
            color: tree.color,
            owned: (state.ownedSkills[s.id] || 0),
            maxLv: (s.maxLv || 1),
          });
        }
      }
    }
  } else if (codex.tab === 'tiers') {
    if (typeof DIFFICULTY_TIERS !== 'undefined') {
      for (const t of DIFFICULTY_TIERS) {
        const parts = [];
        if (t.hpBase > 0) parts.push('HP=' + _short(t.hpBase));
        parts.push('DMG x' + t.dmgMult);
        parts.push('BOSS HP x' + t.bossHpMult);
        if (t.rpPerKill > 0) parts.push('+' + _short(t.rpPerKill) + ' RP/kill');
        if (t.gpaPerKill > 0) parts.push('+' + t.gpaPerKill + ' GPA/kill');
        out.push({ title: t.name.toUpperCase() + ' (' + t.id + ')', sub: parts.join('  ·  '), color: t.color });
      }
    }
  } else if (codex.tab === 'trials') {
    if (typeof TRIAL_BOSS_DEFS !== 'undefined') {
      for (const cat of Object.keys(TRIAL_BOSS_DEFS)) {
        const d = TRIAL_BOSS_DEFS[cat];
        out.push({ title: '[STAGE 1] ' + d.name + ' (' + cat + ')',
          sub: 'HP=' + _short(d.baseHp) + '  DMG=' + d.baseDmg + '  60s 제한',
          color: d.color });
      }
      if (typeof ULTRA_TRIAL_BOSS_DEFS !== 'undefined') {
        for (const cat of Object.keys(ULTRA_TRIAL_BOSS_DEFS)) {
          const d = ULTRA_TRIAL_BOSS_DEFS[cat];
          if (!d) continue;
          out.push({ title: '[STAGE 2] ' + d.name + ' (' + cat + ')',
            sub: 'HP=' + _short(d.baseHp) + '  DMG=' + d.baseDmg + '  40s 제한  실패 시 10분 추방',
            color: '#ff2d2d' });
        }
      }
    }
  }
  return out;
}

function _short(n) {
  if (n >= 1e12) return (n/1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(1)  + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(1)  + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(1)  + 'k';
  return String(n);
}

function updateCodex(dt) {
  if (codex.messageT > 0) codex.messageT -= dt;
  const entries = codexEntries();
  const n = entries.length || 1;
  // 탭 전환
  if (keys['Digit1']) { keys['Digit1']=false; codexSetTab('perks');  sfx('hit'); }
  if (keys['Digit2']) { keys['Digit2']=false; codexSetTab('skills'); sfx('hit'); }
  if (keys['Digit3']) { keys['Digit3']=false; codexSetTab('tiers');  sfx('hit'); }
  if (keys['Digit4']) { keys['Digit4']=false; codexSetTab('trials'); sfx('hit'); }
  if (keys['Tab'])    { keys['Tab']=false; const idx = CODEX_TABS.findIndex(t => t.id === codex.tab); codexSetTab(CODEX_TABS[(idx+1) % CODEX_TABS.length].id); sfx('hit'); }
  // 커서/스크롤
  if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; codex.cursor = Math.max(0, codex.cursor - 1); }
  if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; codex.cursor = Math.min(n - 1, codex.cursor + 1); }
  if (keys['PageUp'])   { keys['PageUp']=false;   codex.cursor = Math.max(0, codex.cursor - codex.visibleRows); }
  if (keys['PageDown']) { keys['PageDown']=false; codex.cursor = Math.min(n - 1, codex.cursor + codex.visibleRows); }
  if (keys['Home'])     { keys['Home']=false;     codex.cursor = 0; }
  if (keys['End'])      { keys['End']=false;      codex.cursor = n - 1; }
  if (mouse.wheel) { codex.cursor = Math.max(0, Math.min(n - 1, codex.cursor + mouse.wheel)); mouse.wheel = 0; }
  // 나가기
  if (keys['KeyR'] || keys['Escape'] || keys['KeyX']) {
    keys['KeyR']=false; keys['Escape']=false; keys['KeyX']=false;
    state.scene = 'academy';
  }
  // 마우스 클릭 - 탭 히트 / 항목 클릭
  if (mouse.down && Array.isArray(window._codexTabRects)) {
    for (const r of window._codexTabRects) {
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        mouse.down = false;
        codexSetTab(r.id);
        sfx('hit');
        return;
      }
    }
  }
  if (mouse.down && Array.isArray(window._codexRowRects)) {
    for (const r of window._codexRowRects) {
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        mouse.down = false;
        codex.cursor = r.idx;
        return;
      }
    }
  }
}

function renderCodex() {
  ctx.fillStyle = '#050310';
  ctx.fillRect(0, 0, W*PX, H*PX);
  bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  // 헤더
  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('CODEX - GAME ENCYCLOPEDIA', 4, 3, '#ffefa8');
  drawText('[TAB] SWITCH  [1-4] TAB  [R/ESC/X] BACK', W - textWidth('[TAB] SWITCH  [1-4] TAB  [R/ESC/X] BACK') - 4, 3, '#8a7ab5');

  // 탭 4개
  const tabW = 60, tabY = 14, tabH = 10;
  window._codexTabRects = [];
  for (let i = 0; i < CODEX_TABS.length; i++) {
    const t = CODEX_TABS[i];
    const x = 8 + i * (tabW + 4);
    const active = codex.tab === t.id;
    pxDraw(x, tabY, tabW, tabH, active ? '#3a1e5c' : '#1a0e2e');
    if (active) pxDraw(x, tabY + tabH, tabW, 1, '#ffefa8');
    drawText((i+1) + ' ' + t.name, x + tabW/2 - textWidth((i+1) + ' ' + t.name)/2, tabY + 2, active ? '#ffefa8' : '#8a7ab5');
    window._codexTabRects.push({ id: t.id, x, y: tabY, w: tabW, h: tabH });
  }

  // 내용 영역
  const entries = codexEntries();
  const bodyX = 8, bodyY = 30, bodyW = W - 16;
  const rowH = 13;
  const bodyH = codex.visibleRows * rowH;
  pxDraw(bodyX, bodyY, bodyW, bodyH + 4, '#0a0512');
  pxDraw(bodyX, bodyY, bodyW, 1, '#3a1e5c');
  pxDraw(bodyX, bodyY + bodyH + 3, bodyW, 1, '#3a1e5c');

  // 스크롤 오프셋 자동 정렬
  let scroll = codex.scroll;
  if (codex.cursor < scroll) scroll = codex.cursor;
  if (codex.cursor >= scroll + codex.visibleRows) scroll = codex.cursor - codex.visibleRows + 1;
  scroll = Math.max(0, Math.min(scroll, Math.max(0, entries.length - codex.visibleRows)));
  codex.scroll = scroll;

  window._codexRowRects = [];
  for (let vi = 0; vi < codex.visibleRows; vi++) {
    const i = scroll + vi;
    if (i >= entries.length) break;
    const e = entries[i];
    const ry = bodyY + 2 + vi * rowH;
    const isSel = codex.cursor === i;
    if (isSel) pxDraw(bodyX + 2, ry, bodyW - 4, rowH - 1, '#2a1548');
    drawText(e.title, bodyX + 6, ry, e.color || '#e8d9b0');
    drawText(e.sub, bodyX + 6, ry + 6, '#8a7ab5');
    if (typeof e.owned === 'number' && e.maxLv >= 1) {
      const own = 'LV ' + e.owned + '/' + e.maxLv;
      drawText(own, bodyX + bodyW - textWidth(own) - 6, ry, e.owned >= e.maxLv ? '#3ac762' : '#c8b898');
    }
    window._codexRowRects.push({ idx: i, x: bodyX, y: ry - 1, w: bodyW, h: rowH });
  }

  // 스크롤바
  const trackX = bodyX + bodyW - 3;
  const trackY = bodyY + 2;
  pxDraw(trackX, trackY, 2, bodyH, '#1a0e2e');
  if (entries.length > codex.visibleRows) {
    const thumbH = Math.max(6, Math.floor(bodyH * codex.visibleRows / entries.length));
    const thumbY = trackY + Math.floor((bodyH - thumbH) * scroll / (entries.length - codex.visibleRows));
    pxDraw(trackX, thumbY, 2, thumbH, '#ffefa8');
  }

  // 총 개수 표시
  const total = 'TOTAL ' + entries.length;
  drawText(total, W - textWidth(total) - 4, H - 10, '#8a7ab5');
  drawText('WASD/WHEEL SCROLL   ' + (codex.cursor + 1) + '/' + entries.length, 4, H - 10, '#8a7ab5');
}
