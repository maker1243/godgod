// =====================================================================
// Library (permanent skill tree)
// =====================================================================

// =====================================================================
// 도서관 (영구 스킬 트리 - 5계열 × 20)
// =====================================================================
const library = {
  tab: 'magic',
  cursor: 0,      // 현재 계열 내 스킬 인덱스
  message: '',
  messageT: 0,
  viewMode: 'base',   // 'base' | 'max' | 'ultra'
};
// 호환용 alias (기존 코드에서 library.maxView 참조가 있으면 max/ultra 뷰 모두를 true 로 보게)
Object.defineProperty(library, 'maxView', {
  get() { return this.viewMode !== 'base'; },
  set(v) { this.viewMode = v ? 'max' : 'base'; },
});

function libSetTab(t) {
  library.tab = t;
  library.cursor = 0;
  library.viewMode = 'base';   // 탭 바꾸면 기본 뷰로
}

// 현재 뷰의 노드 목록
function libNodes() {
  const all = SKILL_TREE[library.tab].skills;
  if (library.viewMode === 'ultra')  return all.filter(s => s.isUltra);
  if (library.viewMode === 'max')    return all.filter(s => s.isMax && !s.isUltra);
  return all.filter(s => !s.isMax);
}

// MAX 뷰 진입 가능 조건: 이 카테고리의 시련 통과(trialCleared[cat]) + 모든 기본 스킬 max
function canOpenMaxView(cat) {
  if (!state.trialCleared || !state.trialCleared[cat]) return false;
  if (typeof categoryFullyMaxed !== 'function') return false;
  return categoryFullyMaxed(cat);
}

// 시련(특별 던전) 시작 가능 여부: 이 카테고리 모든 기본 스킬 max + 아직 이 카테고리 시련 미통과 + 쿨다운 아님
function canStartTrial(cat) {
  if (typeof categoryFullyMaxed !== 'function' || !categoryFullyMaxed(cat)) return false;
  if (state.trialCleared && state.trialCleared[cat]) return false;   // 이미 통과한 카테고리는 시련 안 열림
  if (state.trialBanUntil && Date.now() < state.trialBanUntil) return false;
  return true;
}
function trialCooldownLeftSec() {
  if (!state.trialBanUntil) return 0;
  return Math.max(0, Math.ceil((state.trialBanUntil - Date.now()) / 1000));
}

function libMoveCursor(dx, dy) {
  // 노드들의 pos[0]=col(0-3), pos[1]=row(0-5) 기준으로 인접 노드 찾기
  const nodes = libNodes();
  const cur = nodes[library.cursor];
  if (!cur) return;
  const [cx, cy] = cur.pos;
  const targetX = cx + dx, targetY = cy + dy;
  // 정확히 인접 위치의 노드 우선
  let best = null, bestD = Infinity;
  for (let i = 0; i < nodes.length; i++) {
    if (i === library.cursor) continue;
    const n = nodes[i];
    const [nx, ny] = n.pos;
    // 방향 필터
    if (dx > 0 && nx <= cx) continue;
    if (dx < 0 && nx >= cx) continue;
    if (dy > 0 && ny <= cy) continue;
    if (dy < 0 && ny >= cy) continue;
    const d = Math.abs(nx - targetX) + Math.abs(ny - targetY);
    if (d < bestD) { bestD = d; best = i; }
  }
  if (best !== null) { library.cursor = best; sfx('hit'); }
}

function libFlash(msg) { library.message = msg; library.messageT = 1.5; }

// 마우스/터치 클릭 → 탭 전환 & 노드 선택+구매.
// 렌더링 좌표와 반드시 일치해야 함:
//   탭: x=8+i*(50+4), y=14, size 50x10
//   노드: gridX=24, gridY=28, cellW=55, cellH=15, 위치 (gx*55+24, gy*15+28), 셀 크기 55x15
function _libraryClick() {
  if (!mouse.down) return;
  // 탭 히트
  const tabs = ['magic','engineering','nature','chaos','order'];
  const tabW = 50, tabH = 10, tabY = 14;
  if (mouse.y >= tabY && mouse.y <= tabY + tabH + 2) {
    for (let i = 0; i < tabs.length; i++) {
      const x = 8 + i * (tabW + 4);
      if (mouse.x >= x && mouse.x <= x + tabW) {
        if (library.tab !== tabs[i]) { libSetTab(tabs[i]); sfx('hit'); }
        mouse.down = false;
        return;
      }
    }
  }
  // 노드 히트
  const gridX = 24, gridY = 28, cellW = 55, cellH = 15;
  const nodes = libNodes();
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const [gx, gy] = n.pos;
    const x = gridX + gx * cellW;
    const y = gridY + gy * cellH;
    if (mouse.x >= x && mouse.x <= x + cellW && mouse.y >= y && mouse.y <= y + cellH) {
      if (library.cursor === i) {
        // 두 번째 탭 = 구매(=Space) 트리거
        keys['Space'] = true;
      } else {
        library.cursor = i;
        sfx('hit');
      }
      mouse.down = false;
      return;
    }
  }
}

function updateLibrary(dt) {
  if (library.messageT > 0) library.messageT -= dt;
  _libraryClick();

  // Z: 뷰 상태에 따라 다음 단계 시련 또는 뷰 전환
  //   [base 뷰]
  //     - 기본 스킬 full-max + trialCleared 안됨 → 1단계 시련 시작
  //     - trialCleared 됨 → max 뷰로 전환
  //     - 그 외 → 안내
  //   [max 뷰]
  //     - 모든 MAX 스킬 max + ultraCleared 안됨 → 2단계(ULTRA) 시련 시작
  //     - ultraCleared 됨 → ultra 뷰로 전환
  //     - MAX 부족 → 안내
  //   [ultra 뷰] → base 뷰로 복귀 (순환)
  if (keys['KeyZ']) {
    keys['KeyZ'] = false;
    const cat = library.tab;
    const fullMaxBase   = typeof categoryFullyMaxed === 'function' && categoryFullyMaxed(cat);
    const allMaxMaxed   = typeof categoryAllMaxMaxed === 'function' && categoryAllMaxMaxed(cat);
    const clearedT1     = state.trialCleared && state.trialCleared[cat];
    const clearedT2     = state.ultraCleared && state.ultraCleared[cat];
    const banT1         = state.trialBanUntil      && Date.now() < state.trialBanUntil;
    const banT2         = state.ultraTrialBanUntil && Date.now() < state.ultraTrialBanUntil;

    if (library.viewMode === 'ultra') {
      library.viewMode = 'base';
      library.cursor = 0;
      libFlash('BASE VIEW'); sfx('hit');
    } else if (library.viewMode === 'max') {
      if (clearedT2) {
        library.viewMode = 'ultra'; library.cursor = 0;
        libFlash('ULTRA VIEW - TRANSCENDENT SKILLS'); sfx('level');
      } else if (!allMaxMaxed) {
        libFlash('이 탭의 MAX 스킬 전부 MAX 필요 (2단계 시련 자격)'); sfx('hurt');
      } else if (banT2) {
        libFlash('ULTRA 추방 중. ' + Math.ceil((state.ultraTrialBanUntil - Date.now())/1000) + '초 후.'); sfx('hurt');
      } else {
        state.trialCategory = cat;
        state.trialStage = 2;
        libFlash('2단계 시련 입장 (' + cat.toUpperCase() + '). 40초!'); sfx('boss');
        state.dungeonMode = 'trial';
        goTo('dungeon');
      }
    } else {
      // base 뷰
      if (clearedT1) {
        library.viewMode = 'max'; library.cursor = 0;
        libFlash('MAX VIEW - ULTIMATE SKILLS'); sfx('level');
      } else if (!fullMaxBase) {
        libFlash('MAX ALL BASE SKILLS IN THIS TAB FIRST'); sfx('hurt');
      } else if (banT1) {
        libFlash('추방 중. ' + trialCooldownLeftSec() + '초 후 재도전.'); sfx('hurt');
      } else {
        state.trialCategory = cat;
        state.trialStage = 1;
        libFlash('1단계 시련 입장 (' + cat.toUpperCase() + '). 60초!'); sfx('boss');
        state.dungeonMode = 'trial';
        goTo('dungeon');
      }
    }
  }

  // 계열 탭 전환
  if (keys['Digit1']) { keys['Digit1']=false; libSetTab('magic'); sfx('hit'); }
  if (keys['Digit2']) { keys['Digit2']=false; libSetTab('engineering'); sfx('hit'); }
  if (keys['Digit3']) { keys['Digit3']=false; libSetTab('nature'); sfx('hit'); }
  if (keys['Digit4']) { keys['Digit4']=false; libSetTab('chaos'); sfx('hit'); }
  if (keys['Digit5']) { keys['Digit5']=false; libSetTab('order'); sfx('hit'); }

  // 커서 이동
  if (keys['KeyA']) { keys['KeyA']=false; libMoveCursor(-1, 0); }
  if (keys['KeyD']) { keys['KeyD']=false; libMoveCursor(1, 0); }
  if (keys['KeyW']) { keys['KeyW']=false; libMoveCursor(0, -1); }
  if (keys['KeyS']) { keys['KeyS']=false; libMoveCursor(0, 1); }

  // 구매 (Space)
  if (keys['Space']) {
    keys['Space'] = false;
    const s = libNodes()[library.cursor];
    if (!s) return;
    const lv = skillLevel(s.id);
    const maxLv = s.maxLv || 1;
    if (lv >= maxLv) { libFlash('ALREADY MAX'); sfx('hurt'); return; }
    if (s.req.length > 0) {
      for (const r of s.req) if (!ownsSkill(r)) { libFlash('MISSING PREREQ'); sfx('hurt'); return; }
    }
    if (state.research < s.cost) { libFlash('NEED ' + s.cost + ' RESEARCH'); sfx('hurt'); return; }
    state.research -= s.cost;
    state.ownedSkills[s.id] = lv + 1;
    if (typeof statAdd === 'function') statAdd('skillsBought', 1);
    if (typeof checkAchievements === 'function') checkAchievements();
    if (typeof checkDailies === 'function') checkDailies();
    libFlash('LEARNED ' + s.name + (maxLv > 1 ? ' LV ' + (lv + 1) : ''));
    // 액티브 스킬이면 자동 장착
    if (s.slot !== 'passive' && !state.equippedSlots[s.slot]) {
      state.equippedSlots[s.slot] = s.id;
      libFlash('EQUIPPED TO ' + s.slot.toUpperCase());
    }
    saveProgress();
    sfx('level');
  }

  // 장착 (Enter or F)
  if (keys['KeyF'] || keys['Enter']) {
    keys['KeyF'] = false; keys['Enter'] = false;
    const s = libNodes()[library.cursor];
    if (!s || !ownsSkill(s.id) || s.slot === 'passive') return;
    // 슬롯 토글: 이미 장착됐으면 해제, 아니면 장착
    if (state.equippedSlots[s.slot] === s.id) {
      state.equippedSlots[s.slot] = null;
      libFlash('UNEQUIPPED FROM ' + s.slot.toUpperCase());
    } else {
      state.equippedSlots[s.slot] = s.id;
      libFlash('EQUIPPED TO ' + s.slot.toUpperCase());
    }
    saveProgress();
    sfx('hit');
  }

  // 나가기
  if (keys['KeyR'] || keys['Escape']) {
    keys['KeyR']=false; keys['Escape']=false;
    state.scene = 'academy';
  }
}

function renderLibrary() {
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, W*PX, H*PX);
  bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  // 상단 헤더
  pxDraw(0, 0, W, 12, '#1a0e2e');
  const titleTxt = library.maxView ? 'LIBRARY - MAX SKILL TREE' : 'LIBRARY - SKILL RESEARCH';
  drawText(titleTxt, 4, 3, library.maxView ? '#ff2d80' : '#e8c547');
  const rInfo = 'RESEARCH ' + state.research + '  GOLD ' + state.gold;
  drawText(rInfo, W - textWidth(rInfo) - 4, 3, '#8bd8ff');

  // 계열 탭 (5개)
  const tabs = ['magic','engineering','nature','chaos','order'];
  const tabLabels = ['1 MAGIC','2 ENGIN','3 NATURE','4 CHAOS','5 ORDER'];
  const tabW = 50, tabY = 14;
  for (let i = 0; i < tabs.length; i++) {
    const t = tabs[i];
    const c = SKILL_TREE[t].color;
    const x = 8 + i * (tabW + 4);
    const active = library.tab === t;
    pxDraw(x, tabY, tabW, 10, active ? c : '#1a0e2e');
    if (active) pxDraw(x, tabY + 10, tabW, 1, c);
    drawText(tabLabels[i], x + tabW/2 - textWidth(tabLabels[i])/2, tabY + 2, active ? '#0a0512' : c);
  }
  // 계열 설명
  drawText(SKILL_TREE[library.tab].desc, W - textWidth(SKILL_TREE[library.tab].desc) - 4, tabY + 2, SKILL_TREE[library.tab].color);

  // 노드 그래프 영역 (5열 × 10행 = 50 슬롯)
  const gridX = 24, gridY = 28, cellW = 55, cellH = 15;
  const nodes = libNodes();

  // 선행 조건 연결선 먼저 (뒤에 깔림)
  for (const n of nodes) {
    if (n.req.length === 0) continue;
    const [tx, ty] = n.pos;
    const nx = gridX + tx * cellW + cellW/2;
    const ny = gridY + ty * cellH + cellH/2;
    for (const rid of n.req) {
      const r = SKILL_BY_ID[rid];
      if (!r || r.category !== library.tab) continue;
      const [fx, fy] = r.pos;
      const fnx = gridX + fx * cellW + cellW/2;
      const fny = gridY + fy * cellH + cellH/2;
      const owned = ownsSkill(rid) && ownsSkill(n.id);
      const partial = ownsSkill(rid);
      ctx.strokeStyle = owned ? SKILL_TREE[library.tab].color :
                        partial ? 'rgba(232, 197, 71, 0.4)' : 'rgba(90, 74, 128, 0.3)';
      ctx.lineWidth = PX;
      ctx.beginPath();
      ctx.moveTo(fnx * PX, fny * PX);
      ctx.lineTo(nx * PX, ny * PX);
      ctx.stroke();
    }
  }

  // 노드 그리기
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const [gx, gy] = n.pos;
    const x = gridX + gx * cellW;
    const y = gridY + gy * cellH;
    const lv = skillLevel(n.id);
    const maxLv = n.maxLv || 1;
    const owned = lv > 0;
    const canBuy = canBuySkill(n);
    const equipped = state.equippedSlots.lmb === n.id || state.equippedSlots.q === n.id || state.equippedSlots.e === n.id;
    const isSel = library.cursor === i;
    const c = SKILL_TREE[library.tab].color;

    // 배경
    let bgCol = '#1a0e2e';
    if (owned) bgCol = '#2a1548';
    if (equipped) bgCol = '#3a1e5c';
    pxDraw(x + 2, y + 2, cellW - 4, cellH - 4, bgCol);
    // 테두리
    let borderCol = '#3a1e5c';
    if (canBuy) borderCol = c;
    if (owned) borderCol = c;
    if (isSel) borderCol = '#ffefa8';
    pxDraw(x + 2, y + 2, cellW - 4, 1, borderCol);
    pxDraw(x + 2, y + cellH - 3, cellW - 4, 1, borderCol);
    pxDraw(x + 2, y + 2, 1, cellH - 4, borderCol);
    pxDraw(x + cellW - 3, y + 2, 1, cellH - 4, borderCol);

    // 잠긴 노드: 흐리게
    if (!owned && !canBuy) ctx.globalAlpha = 0.4;

    // 이름 (더 작은 셀에 맞게 짧게)
    const nameCol = owned ? '#ffefa8' : (canBuy ? c : '#5a4a80');
    const displayName = n.name.length > 8 ? n.name.slice(0, 8) : n.name;
    drawText(displayName, x + cellW/2 - textWidth(displayName)/2, y + 3, nameCol);

    // 슬롯 아이콘
    let slotIcon = '';
    if (n.slot === 'lmb') slotIcon = 'L';
    else if (n.slot === 'q') slotIcon = 'Q';
    else if (n.slot === 'e') slotIcon = 'E';
    else slotIcon = '+';
    drawText(slotIcon, x + 3, y + 3, equipped ? '#3ac762' : '#8a7ab5');

    // 레벨 도트
    for (let d = 0; d < maxLv; d++) {
      pxDraw(x + cellW/2 - maxLv*2 + d*3, y + 10, 2, 2, d < lv ? c : '#3a1e5c');
    }

    ctx.globalAlpha = 1;
  }

  // 선택된 노드 세부 정보 패널 (하단)
  const sel = nodes[library.cursor];
  if (sel) {
    const panelY = H - 45;
    pxDraw(4, panelY, W - 8, 30, '#1a0e2e');
    pxDraw(4, panelY, W - 8, 1, SKILL_TREE[library.tab].color);
    pxDraw(4, panelY + 29, W - 8, 1, SKILL_TREE[library.tab].color);

    const lv = skillLevel(sel.id);
    const maxLv = sel.maxLv || 1;
    const slotLabel = sel.slot === 'passive' ? 'PASSIVE' : sel.slot.toUpperCase();
    drawText(sel.name + '  [' + slotLabel + ']  LV ' + lv + '/' + maxLv, 8, panelY + 3, SKILL_TREE[library.tab].color);
    drawText(sel.desc, 8, panelY + 12, '#e8d9b0');

    // 요구사항
    let reqStr = 'REQ: ';
    if (sel.req.length === 0) reqStr += 'NONE';
    else {
      reqStr += sel.req.map(rid => {
        const r = SKILL_BY_ID[rid];
        const has = ownsSkill(rid);
        return (has ? '' : '(') + (r ? r.name : rid) + (has ? '' : ')');
      }).join(', ');
    }
    drawText(reqStr, 8, panelY + 21, '#8a7ab5');

    // 비용 및 액션
    const costCol = state.research >= sel.cost ? '#8bd8ff' : '#c81616';
    const costStr = 'COST ' + sel.cost + 'R';
    drawText(costStr, W - textWidth(costStr) - 8, panelY + 3, costCol);

    // 장착 상태
    if (sel.slot !== 'passive' && lv > 0) {
      const eqStr = state.equippedSlots[sel.slot] === sel.id ? 'EQUIPPED' : 'NOT EQUIPPED';
      drawText(eqStr, W - textWidth(eqStr) - 8, panelY + 12, state.equippedSlots[sel.slot] === sel.id ? '#3ac762' : '#8a7ab5');
    }
  }

  // 알림 메시지
  if (library.messageT > 0) {
    ctx.globalAlpha = clamp(library.messageT, 0, 1);
    const tw = textWidth(library.message);
    pxDraw(W/2 - tw/2 - 4, H - 60, tw + 8, 10, '#1a0e2e');
    drawText(library.message, W/2 - tw/2, H - 57, '#ffefa8');
    ctx.globalAlpha = 1;
  }

  // 하단 안내 - 상태별 다름
  let hint, hintCol;
  if (library.maxView) {
    hint = 'MAX VIEW - [Z] EXIT  [SPACE] BUY  [F] EQUIP';
    hintCol = '#ff2d80';
  } else if (state.maxUnlocked && canOpenMaxView(library.tab)) {
    hint = '[Z] MAX VIEW  [SPACE] BUY  [F] EQUIP  [R] BACK';
    hintCol = '#ff2d80';
  } else if (state.trialBanUntil && Date.now() < state.trialBanUntil) {
    hint = '추방 중 - ' + trialCooldownLeftSec() + 's 후 [Z] 재도전 가능';
    hintCol = '#c81616';
  } else if (canStartTrial(library.tab)) {
    hint = '[Z] 시련 입장! (60초 안에 클리어 → MAX 트리 해금)';
    hintCol = '#ffefa8';
  } else {
    hint = 'WASD MOVE  [SPACE] BUY  [F] EQUIP  [1-5] TABS  [R] BACK';
    hintCol = '#5a4a80';
  }
  drawText(hint, W/2 - textWidth(hint)/2, H - 8, hintCol);
}

