// =====================================================================
// Rendering (all scenes)
// =====================================================================

// =====================================================================
// 렌더링
// =====================================================================
function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 화면 흔들림
  const sx = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const sy = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  ctx.save();
  ctx.translate(sx * PX, sy * PX);

  switch(state.scene) {
    case 'langSelect': renderLangSelect(); break;
    case 'login':      renderLogin(); break;
    case 'title':     renderTitle(); break;
    case 'intro':     renderIntro(); break;
    case 'academy':   renderAcademy(); break;
    case 'dungeon':   renderDungeon(); break;
    case 'levelup':   renderDungeon(); renderLevelUp(); break;
    case 'dead':      renderDungeon(); renderDeath(); break;
    case 'ending':    renderEnding(); break;
    case 'library':   renderLibrary(); break;
    case 'codex':     renderCodex(); break;
    case 'facultyLobby': renderFacultyLobby(); break;
    case 'academyTruth': renderAcademyTruth(); break;
    case 'training':     renderTraining(); break;
    case 'legacyLobby':  renderLegacyLobby(); break;
    case 'customize':    renderCustomize(); break;
    case 'blessingPick': renderBlessingPick(); break;
    case 'runEvent':     renderRunEvent(); break;
    case 'shop':      renderShop(); break;
    case 'classroom': renderClassroom(); break;
    case 'arena':     renderArenaMenu(); break;
    case 'arenaWave': renderArena(); break;
    case 'arenaAI':   renderDuel(); break;
    case 'arenaRoom': renderDuel(); break;
    case 'arenaEnd':  renderArenaEnd(); break;
    case 'duelEnd':   renderDuelEnd(); break;
    case 'mplobby':   renderMpLobby(); break;
    case 'mproom':    renderMpRoom(); break;
  }

  // 메시지
  if (state.msgTimer > 0 && state.scene !== 'title' && state.scene !== 'intro' && state.scene !== 'ending') {
    const alpha = clamp(state.msgTimer, 0, 1);
    ctx.globalAlpha = alpha;
    const tw = textWidth(state.msg);
    pxDraw(W/2 - tw/2 - 4, 18, tw + 8, 12, '#1a0e2e');
    drawText(state.msg, W/2 - tw/2, 20, '#ffefa8');
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ---------- Title ----------
function renderTitle() {
  // 배경: 별과 어두운 성
  bgStars();
  // 성 실루엣
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 130*PX, W*PX, 70*PX);
  // 탑
  ctx.fillStyle = '#1a0e2e';
  for (const [x,w,h] of [[40,30,50],[100,20,70],[140,50,90],[200,20,70],[240,30,50]]) {
    ctx.fillRect(x*PX, (130-h)*PX, w*PX, (h+70)*PX);
    // 창문
    ctx.fillStyle = '#e8c547';
    ctx.fillRect((x+w/2-1)*PX, (130-h/2)*PX, 2*PX, 3*PX);
    ctx.fillStyle = '#1a0e2e';
  }
  // 첨탑
  for (const [x, tipY] of [[55,60],[150,30],[255,60]]) {
    ctx.fillStyle = '#2a1548';
    ctx.beginPath();
    ctx.moveTo(x*PX, (tipY+20)*PX);
    ctx.lineTo((x+15)*PX, (tipY+20)*PX);
    ctx.lineTo((x+7.5)*PX, tipY*PX);
    ctx.closePath();
    ctx.fill();
  }

  // 안개
  ctx.fillStyle = 'rgba(120, 80, 200, 0.15)';
  ctx.fillRect(0, 120*PX, W*PX, 30*PX);

  // 타이틀
  const t1 = 'GRAND ARCANA';
  const t2 = 'ACADEMY';
  const scale = 2;
  drawText(t1, W/2 - textWidth(t1, scale)/2, 40, '#e8c547', scale);
  drawText(t2, W/2 - textWidth(t2, scale)/2, 60, '#e8c547', scale);

  // 서브
  drawText(t('title.sub'), W/2 - textWidth(t('title.sub'))/2, 85, '#8a7ab5');

  // 깜빡이는 안내
  if (Math.floor(state.time * 2) % 2 === 0) {
    const s = t('title.enter');
    drawText(s, W/2 - textWidth(s)/2, 110, '#e8d9b0');
  }

  // 로그인된 계정 이름
  if (state.account) {
    const s = t('title.playing') + state.account.name.toUpperCase();
    drawText(s, W/2 - textWidth(s)/2, 140, '#3ac762');
    drawText(t('login.logout'), W/2 - textWidth(t('login.logout'))/2, 150, '#5a4a80');
  }

  drawText(t('title.footer'), W/2 - textWidth(t('title.footer'))/2, 190, '#5a4a80');
  // 터치 UI 토글 - 크고 눌러지는 버튼 (모바일에서도 확실히 활성화 가능)
  const isOn = (typeof touch !== 'undefined' && touch.enabled);
  const btnW = 110, btnH = 14, btnX = W/2 - btnW/2, btnY = 172;
  const bg = isOn ? '#3ac762' : '#3a1e5c';
  const fg = isOn ? '#0a0512' : '#e8c547';
  pxDraw(btnX, btnY, btnW, btnH, bg);
  pxDraw(btnX, btnY, btnW, 1, '#ffefa8');
  pxDraw(btnX, btnY + btnH - 1, btnW, 1, '#ffefa8');
  pxDraw(btnX, btnY, 1, btnH, '#ffefa8');
  pxDraw(btnX + btnW - 1, btnY, 1, btnH, '#ffefa8');
  const btnLabel = 'TOUCH UI: ' + (isOn ? 'ON' : 'OFF') + '  (TAP)';
  drawText(btnLabel, btnX + btnW/2 - textWidth(btnLabel)/2, btnY + 4, fg);
  // 클릭 판정용 좌표 저장
  window._titleTouchBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
}

function bgStars() {
  ctx.fillStyle = '#080418';
  ctx.fillRect(0, 0, W*PX, H*PX);
  // 별
  for (let i = 0; i < 60; i++) {
    const seed = i * 13.7;
    const x = (seed * 7) % W;
    const y = (seed * 3) % 130;
    const b = Math.sin(state.time * 2 + i) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 240, 200, ${0.3 + b * 0.5})`;
    ctx.fillRect(Math.floor(x)*PX, Math.floor(y)*PX, PX, PX);
  }
}

// ---------- Intro ----------
function renderIntro() {
  bgStars();
  const startY = 40;
  for (let i = 0; i < INTRO_LINES.length; i++) {
    const raw = INTRO_LINES[i];
    const text = raw.trim();
    const isTitle = i === 0;
    const isPrompt = raw.trim().startsWith('[');
    const c = isTitle ? '#e8c547' : (isPrompt ? '#ffefa8' : '#c8b898');
    const scale = isTitle ? 1 : 1;
    const tx = W/2 - textWidth(text, scale)/2;
    const delay = i * 0.3;
    const alpha = clamp(introT - delay, 0, 1);
    if (alpha > 0) {
      ctx.globalAlpha = alpha;
      // 프롬프트는 깜빡임
      if (isPrompt && Math.floor(state.time * 2) % 2 === 1) ctx.globalAlpha *= 0.4;
      drawText(text, tx, startY + i * 12, c, scale);
      ctx.globalAlpha = 1;
    }
  }
}

// ---------- Academy ----------
function renderAcademy() {
  // 배경 (창문 밖 노을)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H*PX);
  bgGrad.addColorStop(0, '#3a2050');
  bgGrad.addColorStop(0.5, '#8a4a70');
  bgGrad.addColorStop(1, '#c86840');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W*PX, 30*PX);
  // 방 배경
  ctx.fillStyle = '#3a2a4a';
  ctx.fillRect(0, 30*PX, W*PX, (H-30)*PX);
  // 방 바닥 격자
  ctx.fillStyle = '#2a1a3a';
  for (let x = 0; x < W; x += 16) {
    for (let y = 30; y < H; y += 16) {
      if (((x/16 + y/16) & 1) === 0) {
        ctx.fillRect(x*PX, y*PX, 16*PX, 16*PX);
      }
    }
  }
  // 방 벽
  const r = academy.room;
  ctx.fillStyle = '#1a0e2e';
  ctx.fillRect((r.x-4)*PX, (r.y-4)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, (r.y+r.h)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, r.y*PX, 4*PX, r.h*PX);
  ctx.fillRect((r.x+r.w)*PX, r.y*PX, 4*PX, r.h*PX);
  // 벽돌 패턴
  ctx.fillStyle = '#3a1e5c';
  for (let x = r.x; x < r.x + r.w; x += 12) {
    ctx.fillRect(x*PX, (r.y-2)*PX, 10*PX, PX);
  }

  // NPC
  for (const n of academy.npcs) {
    drawSprite(SPR_NPC, n.color, n.x - 5, n.y - 12);
    // ELARA 는 npcQuests.elara.bond 사용 (10단계까지 확장됨)
    let displayBond = n.bond;
    if (n.name === 'ELARA' && state.npcQuests && state.npcQuests.elara) displayBond = state.npcQuests.elara.bond;
    const nameCol = displayBond >= 3 ? '#ffefa8' : '#e8d9b0';
    drawText(n.name, n.x - textWidth(n.name)/2, n.y - 18, nameCol);
    // 호감도 하트 (최대 10)
    if (!n.shop) {
      const maxHearts = Math.min(10, displayBond);
      for (let i = 0; i < maxHearts; i++) {
        const col = i >= 6 ? '#ff2d80' : (i >= 3 ? '#ff9c3d' : '#c81616');
        pxDraw(n.x - 6 + i * 2, n.y - 24, 1, 2, col);
      }
    }
    if (dist(player, n) < 20) {
      const s = '[SPACE]';
      drawText(s, n.x - textWidth(s)/2, n.y - 32, '#ffefa8');
      if (n._livingHint) {
        drawText('(' + n._livingHint + ')', n.x - textWidth('(' + n._livingHint + ')')/2, n.y - 40, '#8bd8ff');
      }
    }
  }

  // 문 10개 (EXTRA/EXTREME/INFERNO/PROF는 조건부 해금)
  const doors = [academy.door, academy.libDoor, academy.classDoor, academy.arenaDoor, academy.extraDoor, academy.extremeDoor, academy.infernoDoor, academy.cipherDoor, academy.profDoor, academy.trainDoor, academy.legacyDoor, academy.customDoor];
  const doorCols = ['#ff6666', '#8bd8ff', '#c8b898', '#e8c547', '#c86ade', '#ff2d2d', '#ff00ff', '#ff0000', '#00c8ff', '#3ac762', '#ffefa8', '#c86ade'];
  for (let i = 0; i < doors.length; i++) {
    const d = doors[i];
    if (d.hidden) continue;   // 완전히 숨겨진 문은 렌더/상호작용 제외
    const isExtra   = d.kind === 'extra';
    const isExtreme = d.kind === 'extreme';
    const isInferno = d.kind === 'inferno';
    const isCipher  = d.kind === 'cipher';
    const isProf    = d.kind === 'professor';
    const locked =
      (isExtra   && state.finalCleared < 1) ||
      (isExtreme && state.finalCleared < 2) ||
      (isInferno && state.finalCleared < 3) ||
      (isProf    && !(state.cipherSolvedCount > 0));
    if (locked) ctx.globalAlpha = 0.35;
    drawSprite(SPR_DOOR, DOOR_PAL, d.x, d.y);
    const label = locked ? '?????' : d.label;
    const col = locked ? '#5a4a80' : doorCols[i];
    drawText(label, d.x + 6 - textWidth(label)/2, d.y - 8, col);
    // CIPHER 문: 강렬한 붉은 오라 + 붉은 배경 광원 (주변보다 훨씬 붉게)
    if (isCipher) {
      const glow = 0.55 + Math.sin(state.time * 6) * 0.35;
      // 배경 붉은 광원 오버레이
      ctx.fillStyle = 'rgba(255, 0, 0, ' + (0.18 + glow*0.25).toFixed(2) + ')';
      ctx.fillRect((d.x - 10)*PX, (d.y - 10)*PX, (d.w + 20)*PX, (d.h + 20)*PX);
      ctx.strokeStyle = 'rgba(255, 0, 0, ' + glow.toFixed(2) + ')';
      ctx.lineWidth = PX * 3;
      ctx.strokeRect((d.x - 3)*PX, (d.y - 3)*PX, (d.w + 6)*PX, (d.h + 6)*PX);
      // 안쪽 링 추가
      ctx.strokeStyle = 'rgba(255, 80, 80, ' + (glow * 0.7).toFixed(2) + ')';
      ctx.lineWidth = PX;
      ctx.strokeRect((d.x - 6)*PX, (d.y - 6)*PX, (d.w + 12)*PX, (d.h + 12)*PX);
    }
    // PROF 문: 해금 시 시원한 푸른 오라
    if (isProf && !locked) {
      const glow = 0.5 + Math.sin(state.time * 4) * 0.35;
      ctx.fillStyle = 'rgba(0, 200, 255, ' + (0.15 + glow*0.2).toFixed(2) + ')';
      ctx.fillRect((d.x - 10)*PX, (d.y - 10)*PX, (d.w + 20)*PX, (d.h + 20)*PX);
      ctx.strokeStyle = 'rgba(0, 200, 255, ' + glow.toFixed(2) + ')';
      ctx.lineWidth = PX * 3;
      ctx.strokeRect((d.x - 3)*PX, (d.y - 3)*PX, (d.w + 6)*PX, (d.h + 6)*PX);
    }
    // 기존 특수 문 반짝임
    if ((isExtra || isExtreme || isInferno) && !locked) {
      const glow = 0.4 + Math.sin(state.time * (isInferno ? 5 : 3)) * (isInferno ? 0.5 : 0.3);
      ctx.strokeStyle = isInferno
        ? 'rgba(255, 0, 255, ' + glow.toFixed(2) + ')'
        : isExtreme
          ? 'rgba(255, 45, 45, ' + glow.toFixed(2) + ')'
          : 'rgba(200, 106, 222, ' + glow.toFixed(2) + ')';
      ctx.lineWidth = PX * (isInferno ? 3 : 2);
      ctx.strokeRect((d.x - 3)*PX, (d.y - 3)*PX, (d.w + 6)*PX, (d.h + 6)*PX);
    }
    if (Math.abs(player.x - (d.x + d.w/2)) < 12 && Math.abs(player.y - (d.y + d.h/2)) < 14) {
      const hint = locked ? '[LOCKED]' : '[SPACE]';
      drawText(hint, d.x + 6 - textWidth(hint)/2, d.y - 18, locked ? '#c81616' : '#ffefa8');
      ctx.strokeStyle = col;
      ctx.lineWidth = PX;
      ctx.strokeRect((d.x - 2)*PX, (d.y - 2)*PX, (d.w + 4)*PX, (d.h + 4)*PX);
    }
    ctx.globalAlpha = 1;
  }

  // 아침 이벤트: 강조된 문 링
  if (typeof drawMorningEventHighlight === 'function') drawMorningEventHighlight();

  // 플레이어
  drawPlayer(player.x, player.y, false);

  // 학원 HUD
  renderAcademyHUD();
  // 아침 이벤트: 상단 티커
  if (typeof drawMorningEventTicker === 'function') drawMorningEventTicker();
  // 팁 티커 (하단)
  if (typeof drawTipHud === 'function') drawTipHud();
}

function renderAcademyHUD() {
  // 상단
  pxDraw(0, 0, W, 12, '#1a0e2e');
  const totalPots = POTION_ORDER.reduce((s,k)=>s+academy.inventory[k], 0);
  // 축약
  const fmt = (n)=>{ if(n>=1e12)return (n/1e12).toFixed(1)+'T'; if(n>=1e9)return (n/1e9).toFixed(1)+'B'; if(n>=1e6)return (n/1e6).toFixed(1)+'M'; if(n>=1e3)return (n/1e3).toFixed(1)+'k'; return String(n); };
  const info1 = 'DAY ' + state.day + '  GPA ' + state.gpa.toFixed(1) + '  G ' + fmt(state.gold||0) + '  POT ' + totalPots + '  RP ' + fmt(state.research||0);
  drawText(info1, 4, 3, '#e8d9b0');
  // GPA 색상 강조
  const gpaCol = state.gpa >= 3.5 ? '#3ac762' : state.gpa >= 2.5 ? '#e8c547' : '#c81616';
  pxDraw(4 + textWidth('DAY ' + state.day + '  GPA '), 3, textWidth(state.gpa.toFixed(1)), 7, gpaCol);
  drawText(state.gpa.toFixed(1), 4 + textWidth('DAY ' + state.day + '  GPA '), 3, '#1a0e2e');

  // 우측: 아레나 기록 (짧게)
  const arenaStr = 'ARENA W' + academy.bestArena;
  drawText(arenaStr, W - textWidth(arenaStr) - 4, 3, '#8bd8ff');
  if (state.finalCleared) {
    for (let i = 0; i < state.finalCleared; i++) {
      pxDraw(W - 4 - (i+1) * 8, 14, 6, 4, '#e8c547');
      pxDraw(W - 3 - (i+1) * 8, 15, 1, 1, '#ff9c3d');
    }
  }

  // 하단 힌트
  drawText('WASD MOVE  [SPACE] INTERACT  [C] DIFFICULTY  [X] CODEX  [H] HELP', 4, H - 10, '#5a4a80');
  // 활성 게임 모드 (상단 우측)
  if (typeof activeModeLabels === 'function') {
    const labels = activeModeLabels();
    if (labels.length) {
      let mx = W - 4;
      for (let i = labels.length - 1; i >= 0; i--) {
        const l = labels[i];
        const tw = textWidth('[' + l.name + ']');
        mx -= tw + 4;
        drawText('[' + l.name + ']', mx, 22, l.color);
      }
    }
  }
  // 로비 프리센스: 같은 난이도 사람 수 + coop 초대 활성 표시
  if (typeof mp !== 'undefined' && mp && mp.connected && mp.roomCode) {
    const diff = state.difficulty || 'normal';
    let sameDiff = 0, otherAcademy = 0;
    for (const pid of Object.keys(mp.presence || {})) {
      const pr = mp.presence[pid];
      if (pr.scene === 'academy') otherAcademy++;
      if (pr.difficulty === diff) sameDiff++;
    }
    const s = 'LOBBY: ' + otherAcademy + '명 · 같은 난이도 ' + sameDiff + '명';
    drawText(s, 4, 22, '#8bd8ff');
    // coop 초대가 있으면
    const invIds = Object.keys(mp.coop.invites || {});
    if (invIds.length) {
      const inv = mp.coop.invites[invIds[0]];
      const rem = Math.max(0, 5 - (performance.now() - inv.ts) / 1000);
      drawText('COOP 초대: ' + inv.mode + '/' + inv.difficulty + '  ' + rem.toFixed(1) + 's', 4, 30, '#ffefa8');
    }
    if (mp.coop && mp.coop.active && mp.coop.partner) {
      drawText('★ COOP: ' + mp.coop.partner.name, W - textWidth('★ COOP: ' + mp.coop.partner.name) - 4, 22, '#3ac762');
    }
  }
  // 좌상단 [?] 버튼 (도움말)
  const helpBtn = { x: W - 18, y: 14, w: 14, h: 10 };
  pxDraw(helpBtn.x, helpBtn.y, helpBtn.w, helpBtn.h, '#1a0e2e');
  pxDraw(helpBtn.x, helpBtn.y, helpBtn.w, 1, '#ffefa8');
  pxDraw(helpBtn.x, helpBtn.y + helpBtn.h - 1, helpBtn.w, 1, '#ffefa8');
  pxDraw(helpBtn.x, helpBtn.y, 1, helpBtn.h, '#ffefa8');
  pxDraw(helpBtn.x + helpBtn.w - 1, helpBtn.y, 1, helpBtn.h, '#ffefa8');
  drawText('?', helpBtn.x + helpBtn.w/2 - 2, helpBtn.y + 2, '#ffefa8');
  window._academyHelpBtn = helpBtn;
  // 스토리 조각 패널
  if (typeof renderStoryPanel === 'function') renderStoryPanel();
  // 튜토리얼 오버레이 (마지막에 그려서 최상위)
  if (typeof renderOnboarding === 'function') renderOnboarding();

  // 난이도 배너 (중앙 상단, 탭/클릭 시 사이클) - updateAcademy 가 히트 판정에 사용
  if (typeof currentDifficulty === 'function') {
    const d = currentDifficulty();
    const label = 'DIFFICULTY: ' + d.name.toUpperCase();
    const lw = textWidth(label);
    const bx = Math.floor(W/2 - (lw + 12)/2);
    const by = 14;
    const bw = lw + 12;
    const bh = 10;
    // 배경 + 컬러 테두리
    pxDraw(bx, by, bw, bh, '#1a0e2e');
    pxDraw(bx, by, bw, 1, d.color);
    pxDraw(bx, by + bh - 1, bw, 1, d.color);
    pxDraw(bx, by, 1, bh, d.color);
    pxDraw(bx + bw - 1, by, 1, bh, d.color);
    drawText(label, bx + 6, by + 2, d.color);
    window._academyDiffBtn = { x: bx, y: by, w: bw, h: bh };
  }

  // 난이도 피커 팝업 (스크롤 지원 - 티어 개수가 많아도 캔버스 안에 fit)
  if (window._diffPickerOpen && typeof DIFFICULTY_TIERS !== 'undefined') {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W*PX, H*PX);
    const tiers = DIFFICULTY_TIERS;
    const rowH = 12;
    const visibleRows = 11;           // 화면에 한 번에 보이는 행 수
    const listW = 210;
    const headH = 14, footH = 12;
    const bodyH = visibleRows * rowH;
    const listH = headH + bodyH + footH + 4;
    const bx = Math.floor(W/2 - listW/2);
    const by = Math.floor(H/2 - listH/2);
    // 커서/스크롤 오프셋 자동 정렬
    const cur = window._diffPickerCursor != null ? window._diffPickerCursor : 0;
    let scroll = window._diffPickerScroll || 0;
    if (cur < scroll) scroll = cur;
    if (cur >= scroll + visibleRows) scroll = cur - visibleRows + 1;
    scroll = Math.max(0, Math.min(scroll, Math.max(0, tiers.length - visibleRows)));
    window._diffPickerScroll = scroll;
    // 패널
    pxDraw(bx, by, listW, listH, '#1a0e2e');
    pxDraw(bx, by, listW, 1, '#ffefa8');
    pxDraw(bx, by + listH - 1, listW, 1, '#ffefa8');
    pxDraw(bx, by, 1, listH, '#ffefa8');
    pxDraw(bx + listW - 1, by, 1, listH, '#ffefa8');
    drawText('SELECT DIFFICULTY  (' + (cur+1) + '/' + tiers.length + ')',
      bx + listW/2 - textWidth('SELECT DIFFICULTY  (' + (cur+1) + '/' + tiers.length + ')')/2,
      by + 4, '#ffefa8');
    // 스크롤 인디케이터 (위/아래 화살표) - 탭 가능한 스크롤 버튼
    window._diffPickerScrollBtns = { up: null, down: null };
    if (scroll > 0) {
      const upBtn = { x: bx + listW - 16, y: by + 2, w: 12, h: 10 };
      drawText('▲', upBtn.x + 2, upBtn.y + 2, '#ffefa8');
      window._diffPickerScrollBtns.up = upBtn;
    }
    if (scroll + visibleRows < tiers.length) {
      const dnBtn = { x: bx + listW - 16, y: by + listH - footH - 4, w: 12, h: 10 };
      drawText('▼', dnBtn.x + 2, dnBtn.y + 2, '#ffefa8');
      window._diffPickerScrollBtns.down = dnBtn;
    }
    // 스크롤바
    const trackX = bx + listW - 4;
    const trackY = by + headH;
    pxDraw(trackX, trackY, 2, bodyH, '#3a1e5c');
    if (tiers.length > visibleRows) {
      const thumbH = Math.max(6, Math.floor(bodyH * visibleRows / tiers.length));
      const thumbY = trackY + Math.floor((bodyH - thumbH) * scroll / (tiers.length - visibleRows));
      pxDraw(trackX, thumbY, 2, thumbH, '#ffefa8');
    }
    // 행 좌표 저장 (클릭 판정용)
    window._diffPickerRows = [];
    const curId = state.difficulty || 'normal';
    const bodyTop = by + headH;
    for (let vi = 0; vi < visibleRows; vi++) {
      const i = scroll + vi;
      if (i >= tiers.length) break;
      const t = tiers[i];
      const ry = bodyTop + vi * rowH;
      const isSel = cur === i;
      const isCur = t.id === curId;
      if (isSel) pxDraw(bx + 3, ry, listW - 10, rowH - 1, '#2a1548');
      pxDraw(bx + 6, ry + 3, 4, 4, t.color);
      drawText(t.name.toUpperCase(), bx + 14, ry + 2, isSel ? t.color : (isCur ? t.color : '#c8b898'));
      if (isCur) drawText('*', bx + listW - 18, ry + 2, '#ffefa8');
      window._diffPickerRows.push({ idx: i, x: bx, y: ry - 1, w: listW - 6, h: rowH });
    }
    drawText('WS/TAP MOVE  SPACE APPLY  ESC/C CANCEL',
      bx + listW/2 - textWidth('WS/TAP MOVE  SPACE APPLY  ESC/C CANCEL')/2,
      by + listH - 9, '#8a7ab5');
  } else {
    window._diffPickerRows = null;
  }

  // 암호 퀘스트 오버레이 (게이지/팝업/결과 메시지)
  if (typeof renderCipherQuestOverlay === 'function') renderCipherQuestOverlay();
}

// ---------- Dungeon ----------
function renderDungeon() {
  // 배경: 어두운 돌
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, W*PX, H*PX);

  ctx.save();
  ctx.translate(-state.cam.x * PX, -state.cam.y * PX);

  // 방
  const r = rooms[currentRoom];
  const fd = currentFloorData();
  // 바닥
  ctx.fillStyle = fd.floor;
  ctx.fillRect(r.x*PX, r.y*PX, r.w*PX, r.h*PX);
  // 격자
  ctx.fillStyle = fd.floorAlt;
  for (let x = r.x; x < r.x + r.w; x += 16) {
    for (let y = r.y; y < r.y + r.h; y += 16) {
      if (((x/16 + y/16) & 1) === 0) {
        ctx.fillRect(x*PX, y*PX, 16*PX, 16*PX);
      }
    }
  }
  // 벽
  ctx.fillStyle = fd.wall;
  ctx.fillRect((r.x-4)*PX, (r.y-4)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, (r.y+r.h)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, r.y*PX, 4*PX, r.h*PX);
  ctx.fillRect((r.x+r.w)*PX, r.y*PX, 4*PX, r.h*PX);
  // 벽 벽돌 라인
  ctx.fillStyle = fd.wallLight;
  for (let x = r.x; x < r.x + r.w; x += 12) {
    ctx.fillRect(x*PX, (r.y-2)*PX, 10*PX, PX);
  }
  // 방 장식 (기둥/균열/촛대/유리병 등)
  if (typeof drawRoomDecor === 'function') drawRoomDecor(r);

  // 앰비언트 먼지 파티클 (분위기 강화)
  const dustCount = 12;
  for (let i = 0; i < dustCount; i++) {
    const seed = i * 7.31;
    const wave = state.time * 0.4 + seed;
    const dx = r.x + 10 + (i * 30 + Math.sin(wave) * 12) % (r.w - 20);
    const dy = r.y + 20 + (i * 17 + Math.cos(wave * 0.7) * 8) % (r.h - 40);
    const a = 0.15 + Math.sin(wave * 1.3) * 0.1;
    ctx.globalAlpha = a;
    pxDraw(Math.floor(dx), Math.floor(dy), 1, 1, '#8bd8ff');
    ctx.globalAlpha = 1;
  }

  // 룬 (보스방)
  if (r.isBoss) {
    ctx.fillStyle = 'rgba(200, 40, 80, 0.15)';
    ctx.fillRect(r.x*PX, r.y*PX, r.w*PX, r.h*PX);
    // 마법진
    ctx.strokeStyle = 'rgba(230, 60, 30, 0.4)';
    ctx.lineWidth = PX;
    ctx.beginPath();
    ctx.arc((r.x + r.w/2)*PX, (r.y + r.h/2)*PX, 40*PX, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc((r.x + r.w/2)*PX, (r.y + r.h/2)*PX, 25*PX, 0, Math.PI*2);
    ctx.stroke();
  }

  // 픽업
  for (const p of entities.pickups) {
    const y = p.y + Math.sin(p.bob) * 1.5;
    if (p.kind === 'hp') drawSprite(SPR_ORB_HP, ORB_HP_PAL, p.x - 2, y - 2);
    else if (p.kind === 'mp') drawSprite(SPR_ORB_MP, ORB_MP_PAL, p.x - 2, y - 2);
    else if (p.kind === 'pouch') {
      // 유품 파우치 - 갈색 주머니 + 금색 반짝임
      const pu = 0.5 + Math.sin(state.time * 5) * 0.5;
      pxDraw(p.x - 3, y - 3, 6, 6, '#3a2010');
      pxDraw(p.x - 2, y - 2, 4, 4, '#8a5a30');
      pxDraw(p.x - 1, y - 1, 2, 2, '#ffefa8');
      ctx.strokeStyle = 'rgba(232, 197, 71, ' + pu.toFixed(2) + ')';
      ctx.lineWidth = PX;
      ctx.beginPath(); ctx.arc(p.x * PX, y * PX, 6 * PX, 0, Math.PI * 2); ctx.stroke();
    }
    else if (p.kind === 'rpshard') {
      // RP 조각 - 시안 다이아
      pxDraw(p.x - 1, y - 3, 2, 1, '#8bd8ff');
      pxDraw(p.x - 2, y - 2, 4, 2, '#8bd8ff');
      pxDraw(p.x - 1, y, 2, 1, '#8bd8ff');
      pxDraw(p.x, y - 1, 1, 1, '#ffffff');
    }
    else if (p.kind === 'xp') {
      // XP 오브 - 자주
      pxDraw(p.x - 2, y - 2, 4, 4, '#c86ade');
      pxDraw(p.x - 1, y - 1, 2, 2, '#ff9cff');
      // 오라
      const glow = 0.4 + Math.sin(state.time * 4 + p.x) * 0.3;
      ctx.strokeStyle = 'rgba(200, 106, 222, ' + glow.toFixed(2) + ')';
      ctx.lineWidth = PX;
      ctx.beginPath(); ctx.arc(p.x*PX, y*PX, 4*PX, 0, Math.PI*2); ctx.stroke();
    }
    else if (p.kind === 'chest' || p.kind === 'chest_rare' || p.kind === 'chest_legend') {
      const boxCol = p.kind === 'chest_legend' ? '#c86ade' : (p.kind === 'chest_rare' ? '#3a5a8a' : '#5a3a20');
      const topCol = p.kind === 'chest_legend' ? '#ff00ff' : (p.kind === 'chest_rare' ? '#8bd8ff' : '#8a5a30');
      const lockCol = p.kind === 'chest_legend' ? '#ffefa8' : '#e8c547';
      const ringCol = p.kind === 'chest_legend' ? [255, 0, 255] : (p.kind === 'chest_rare' ? [139, 216, 255] : [232, 197, 71]);
      // 상자
      pxDraw(p.x - 5, y - 2, 10, 6, boxCol);
      pxDraw(p.x - 5, y - 3, 10, 1, topCol);
      pxDraw(p.x - 1, y - 1, 2, 2, lockCol);
      // 반짝임 링
      const glow = 0.5 + Math.sin(state.time * 5 + p.x) * 0.4;
      ctx.strokeStyle = 'rgba(' + ringCol.join(',') + ', ' + glow.toFixed(2) + ')';
      ctx.lineWidth = PX;
      ctx.beginPath(); ctx.arc(p.x*PX, y*PX, 10*PX, 0, Math.PI*2); ctx.stroke();
      // 전설 상자: 두 번째 링
      if (p.kind === 'chest_legend') {
        ctx.strokeStyle = 'rgba(255, 239, 168, ' + (glow * 0.7).toFixed(2) + ')';
        ctx.lineWidth = PX;
        ctx.beginPath(); ctx.arc(p.x*PX, y*PX, 14*PX, 0, Math.PI*2); ctx.stroke();
      }
      // 접근 시 힌트
      if (typeof player !== 'undefined' && Math.abs(player.x - p.x) < 12 && Math.abs(player.y - y) < 12) {
        drawText('[SPACE]', p.x - textWidth('[SPACE]')/2, y - 12, '#ffefa8');
      }
    }
    else {
      pxDraw(p.x - 2, y - 2, 4, 4, '#e8c547');
      pxDraw(p.x - 1, y - 1, 2, 2, '#ffefa8');
    }
    // 사라지기 직전 깜빡임
    if (p.life < 2 && Math.floor(state.time * 8) % 2 === 0) {
      ctx.globalAlpha = 0.4;
      pxDraw(p.x - 2, y - 2, 4, 4, '#000000');
      ctx.globalAlpha = 1;
    }
  }

  // 문
  for (const d of entities.doors) {
    drawSprite(SPR_DOOR, DOOR_PAL, d.x, d.y);
    if (d.kind === 'exit') drawText('NEXT', d.x - 2, d.y - 8, '#ffefa8');
    else if (d.kind === 'nextfloor') {
      drawText('DEEPER', d.x - 6, d.y - 8, '#ff9c3d');
      // 붉은 오라
      const pulse = 0.4 + Math.sin(state.time * 4) * 0.2;
      ctx.fillStyle = `rgba(255, 100, 50, ${pulse * 0.3})`;
      ctx.fillRect((d.x - 3)*PX, (d.y - 3)*PX, (d.w + 6)*PX, (d.h + 6)*PX);
    }
    else drawText('EXIT', d.x - 2, d.y - 8, '#c8b898');
  }

  // 시간정지 시각 효과
  if (timeStopT > 0) {
    ctx.fillStyle = 'rgba(180, 220, 255, 0.08)';
    ctx.fillRect(r.x*PX, r.y*PX, r.w*PX, r.h*PX);
  }

  // 적
  for (const e of entities.enemies) drawEnemy(e);

  // 적 발사체
  for (const b of entities.ebullets) {
    // 교수 학과 테마 발사체: BULLET_VISUALS 등록된 visual 우선
    if (b.visual && typeof BULLET_VISUALS !== 'undefined' && BULLET_VISUALS[b.visual]) {
      const ang = Math.atan2(b.vy, b.vx);
      try { BULLET_VISUALS[b.visual].draw(b, ang); } catch(_) {}
      continue;
    }
    // 시련 보스 발사체: 카테고리별 완전히 다른 시각
    if (b.bossVis) {
      const cat = b.bossVis;
      if (cat === 'magic') {
        // 회전하는 별 - 시안/흰색 크리스탈
        ctx.globalAlpha = 0.95;
        pxDraw(b.x - 3, b.y - 1, 7, 2, '#8bd8ff');
        pxDraw(b.x - 1, b.y - 3, 2, 7, '#8bd8ff');
        pxDraw(b.x - 1, b.y - 1, 2, 2, '#fff');
        ctx.globalAlpha = 1;
      } else if (cat === 'engineering') {
        // 금속 슬러그 - 노란 궤적
        ctx.globalAlpha = 0.5;
        pxDraw(b.x - b.vx*0.01 - 1, b.y - b.vy*0.01 - 1, 3, 3, '#e8c547');
        ctx.globalAlpha = 1;
        pxDraw(b.x - 2, b.y - 2, 5, 5, '#5a4a20');
        pxDraw(b.x - 1, b.y - 1, 3, 3, '#e8c547');
        pxDraw(b.x, b.y, 1, 1, '#ff2d2d');
      } else if (cat === 'nature') {
        // 가시 씨앗 - 초록 다이아몬드 + 잎
        pxDraw(b.x - 1, b.y - 3, 2, 2, '#1a6a2a');
        pxDraw(b.x - 3, b.y - 1, 2, 2, '#1a6a2a');
        pxDraw(b.x + 1, b.y - 1, 2, 2, '#1a6a2a');
        pxDraw(b.x - 1, b.y + 1, 2, 2, '#1a6a2a');
        pxDraw(b.x - 1, b.y - 1, 2, 2, '#3ac762');
      } else if (cat === 'chaos') {
        // 보이드 오브 - 자주 + 깜박거림
        const flicker = (Math.sin(state.time * 20 + b.x) + 1) / 2;
        ctx.globalAlpha = 0.4 + flicker * 0.5;
        pxDraw(b.x - 3, b.y - 3, 7, 7, '#4a1a70');
        pxDraw(b.x - 2, b.y - 2, 5, 5, '#c86ade');
        pxDraw(b.x - 1, b.y - 1, 3, 3, '#ff2d80');
        ctx.globalAlpha = 1;
      } else if (cat === 'order') {
        // 성스러운 창 - 노란 십자
        pxDraw(b.x - 4, b.y, 9, 1, '#ffefa8');
        pxDraw(b.x, b.y - 4, 1, 9, '#ffefa8');
        pxDraw(b.x - 1, b.y - 1, 3, 3, '#fff');
      } else {
        // 폴백
        pxDraw(b.x - 2, b.y - 2, 5, 5, '#3a1a5c');
        pxDraw(b.x - 1, b.y - 1, 3, 3, '#7d4dbf');
      }
      continue;
    }
    if (b.kind === 'bone') {
      pxDraw(b.x - 1, b.y - 1, 3, 3, '#e8dcb0');
      pxDraw(b.x, b.y, 1, 1, '#5a4a30');
    } else if (b.kind === 'venom') {
      // 초록 독 볼트 + 방울 궤적
      pxDraw(b.x - 2, b.y - 2, 5, 5, '#0a4a10');
      pxDraw(b.x - 1, b.y - 1, 3, 3, '#3ac762');
      pxDraw(b.x, b.y, 1, 1, '#8bff8b');
      // 궤적 방울
      if (Math.random() < 0.4) spawnParticle(b.x - b.vx*0.02, b.y - b.vy*0.02, '#3ac762', 0.3, 1, 20);
    } else if (b.kind === 'bolt') {
      // 접두: 번개 화살 (노란)
      pxDraw(b.x - 1, b.y - 1, 3, 3, '#ffefa8');
      pxDraw(b.x, b.y, 1, 1, '#ffffff');
    } else {
      // 그림자 볼트 (일반 몹)
      ctx.globalAlpha = 0.9;
      pxDraw(b.x - 2, b.y - 2, 5, 5, '#3a1a5c');
      pxDraw(b.x - 1, b.y - 1, 3, 3, '#7d4dbf');
      pxDraw(b.x, b.y, 1, 1, '#ff2d2d');
      ctx.globalAlpha = 1;
    }
  }

  // 아군 발사체
  for (const b of entities.bullets) drawBullet(b);
  // FX (링/슬래시 등 히트 이펙트)
  if (typeof drawFx === 'function') drawFx();

  // 플레이어
  drawPlayer(player.x, player.y, true);
  // 축복: 궤도 발사체
  if (player && player.orbitals) {
    for (const o of player.orbitals) {
      pxDraw(o.x - 2, o.y - 2, 4, 4, '#ff9c3d');
      pxDraw(o.x - 1, o.y - 1, 2, 2, '#ffefa8');
    }
  }
  // 축복: 실드 링
  if (player && player.shield > 0) {
    const glow = 0.5 + Math.sin(state.time * 4) * 0.3;
    ctx.strokeStyle = 'rgba(139, 216, 255, ' + glow.toFixed(2) + ')';
    ctx.lineWidth = PX;
    ctx.beginPath();
    ctx.arc(player.x*PX, player.y*PX, (player.r + 4)*PX, 0, Math.PI*2);
    ctx.stroke();
  }
  // 축복: FrostAura 반경
  if (player && player.blessFrostAura) {
    ctx.strokeStyle = 'rgba(139, 216, 255, 0.15)';
    ctx.lineWidth = PX;
    ctx.beginPath();
    ctx.arc(player.x*PX, player.y*PX, 40*PX, 0, Math.PI*2);
    ctx.stroke();
  }

  // 파티클
  for (const p of entities.particles) {
    const a = p.life / p.max;
    ctx.globalAlpha = clamp(a, 0, 1);
    pxDraw(p.x - p.size/2, p.y - p.size/2, p.size, p.size, p.color);
  }
  ctx.globalAlpha = 1;

  // 플로팅 텍스트 - scale 지원
  for (const f of entities.floats) {
    ctx.globalAlpha = clamp(f.life, 0, 1);
    const scale = f.scale || 1;
    drawText(f.text, f.x - textWidth(f.text, scale)/2, f.y - 8, f.color, scale);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // Blood Moon 아침 이벤트: 미묘한 붉은 톤 오버레이
  if (typeof morningEvent !== 'undefined' && morningEvent.today && morningEvent.today.id === 'ev_bloodmoon') {
    ctx.fillStyle = 'rgba(200, 22, 22, 0.08)';
    ctx.fillRect(0, 0, W*PX, H*PX);
  }
  // Fog 아침 이벤트: 미묘한 흰 안개
  if (typeof morningEvent !== 'undefined' && morningEvent.today && morningEvent.today.id === 'ev_fog') {
    ctx.fillStyle = 'rgba(139, 216, 255, 0.06)';
    ctx.fillRect(0, 0, W*PX, H*PX);
  }
  // 큰 피격 시 순간 붉은 플래시 (전체 화면)
  if (state._damageFlashUntil && performance.now() < state._damageFlashUntil) {
    const remain = (state._damageFlashUntil - performance.now()) / 200;
    ctx.fillStyle = 'rgba(200, 22, 22, ' + (0.4 * remain).toFixed(2) + ')';
    ctx.fillRect(0, 0, W*PX, H*PX);
  }
  // HP 낮을 때 화면 가장자리 붉은 비네트
  if (player && player.hp > 0 && player.maxHp > 0) {
    const hpPct = player.hp / player.maxHp;
    if (hpPct < 0.3) {
      const intensity = (0.3 - hpPct) / 0.3;
      const pulse = 0.5 + Math.sin(state.time * 6) * 0.3;
      // 화면 가장자리 그라디언트로 붉은 비네트
      const grad = ctx.createRadialGradient(W*PX/2, H*PX/2, 0, W*PX/2, H*PX/2, Math.max(W, H)*PX*0.7);
      grad.addColorStop(0.5, 'rgba(200, 22, 22, 0)');
      grad.addColorStop(1.0, 'rgba(200, 22, 22, ' + (intensity * pulse * 0.6).toFixed(2) + ')');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W*PX, H*PX);
    }
  }

  // 던전 HUD
  renderDungeonHUD();
  // 보스 HP 오버레이
  if (typeof drawBossHpOverlay === 'function') drawBossHpOverlay();
  // 일시정지 오버레이
  if (state._paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W*PX, H*PX);
    drawText('PAUSED', W/2 - textWidth('PAUSED', 3)/2, 50, '#ffefa8', 3);
    const hint = '[ESC/SPACE] 재개   [Q] 후퇴 (아카데미로)';
    drawText(hint, W/2 - textWidth(hint)/2, 95, '#8a7ab5');
    // 현재 런 요약
    if (player) {
      const rows = [
        'LV ' + player.level + '   XP ' + player.xp + '/' + player.xpNext,
        'HP ' + Math.ceil(player.hp) + '/' + player.maxHp,
        'GOLD ' + state.gold + '   RP ' + Math.floor(state.research || 0),
        '축복: ' + ((player.blessings || []).length),
        '콤보 MAX: x' + ((typeof combo !== 'undefined') ? combo.maxThisRun : 0),
      ];
      let y = 130;
      for (const r of rows) {
        drawText(r, W/2 - textWidth(r)/2, y, '#c8b898');
        y += 10;
      }
      // 축복 이름 리스트
      if (player.blessings && player.blessings.length && typeof BLESSING_BY_ID !== 'undefined') {
        y += 4;
        const names = player.blessings.map(id => BLESSING_BY_ID[id] && BLESSING_BY_ID[id].name).filter(Boolean).join(', ');
        // 여러 줄로 wrap
        const words = names.split(', ');
        let line = '', ry = y;
        for (const w of words) {
          const test = line ? line + ', ' + w : w;
          if (textWidth(test) > W - 40) { drawText(line, W/2 - textWidth(line)/2, ry, '#8bd8ff'); ry += 8; line = w; }
          else line = test;
        }
        if (line) drawText(line, W/2 - textWidth(line)/2, ry, '#8bd8ff');
      }
    }
  }
}

function drawPlayer(x, y, showFX) {
  const p = player;
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x*PX, (y+6)*PX, 5*PX, 2*PX, 0, 0, Math.PI*2);
  ctx.fill();

  // 히트 플래시
  if (showFX && p.hitFlash > 0) {
    ctx.globalAlpha = 0.6;
    for (const c of ['#ffffff','#ffcccc']) {}
  }

  // 구르기 회전 표현 (간단히 스프라이트 뒤집기)
  const walking = Math.abs(Math.hypot((keys['KeyA']?-1:0)+(keys['KeyD']?1:0),
                                       (keys['KeyW']?-1:0)+(keys['KeyS']?1:0))) > 0;
  const sprite = (Math.floor(p.animT * 6) % 2 === 0) ? SPR_PLAYER_S1 : SPR_PLAYER_S2;

  // 방어 시 살짝 위치 아래
  const oy = p.shielding ? 1 : 0;

  // 무적 시 깜빡임
  if (showFX && p.invuln > 0 && Math.floor(state.time * 20) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }
  // 트레일 (커스터마이즈) - 아카데미/던전 모두 표시. 스프라이트 아래에 그려서 캐릭터를 가리지 않음.
  if (typeof activePlayerTrailColor === 'function') {
    const tc = activePlayerTrailColor();
    if (tc) {
      const prev = p._trailPrev || [];
      // 저장된 과거 궤적 렌더 (오래된 것부터, 페이드)
      for (let i = prev.length - 1; i >= 0; i--) {
        const tr = prev[i];
        const alpha = 0.7 * (1 - i / prev.length);
        ctx.globalAlpha = alpha;
        pxDraw(tr.x - 2, tr.y - 2, 4, 4, tc);
        // 살짝 흰 하이라이트 중심
        pxDraw(tr.x - 1, tr.y - 1, 2, 2, '#ffffff');
      }
      ctx.globalAlpha = 1;
      // 현재 위치를 궤적에 추가 (이동했을 때만)
      const last = prev[0];
      if (!last || Math.hypot((last.x||x) - x, (last.y||y) - y) > 1.2) {
        prev.unshift({ x, y });
        if (prev.length > 10) prev.length = 10;
        p._trailPrev = prev;
      }
    }
  }
  const _pal = (typeof activePlayerPal === 'function') ? activePlayerPal() : PLAYER_PAL;
  drawSprite(sprite, _pal, x - 6, y - 8 + oy, p.facing === -1);
  ctx.globalAlpha = 1;

  // 히트 플래시 오버레이
  if (showFX && p.hitFlash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.7;
    drawSpriteFlash(sprite, x - 6, y - 8 + oy, p.facing === -1, '#ff8888');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  if (!showFX) return;

  // 방패 (마력 방패)
  if (p.shielding) {
    const ang = angleTo(p, {x: mouse.x + state.cam.x, y: mouse.y + state.cam.y});
    const cx = x + Math.cos(ang) * 8;
    const cy = y + Math.sin(ang) * 8;
    // 방패 링
    ctx.strokeStyle = p.parryWindow > 0 ? '#ffefa8' : '#8bd8ff';
    ctx.lineWidth = PX * 2;
    ctx.beginPath();
    ctx.arc(cx*PX, cy*PX, 7*PX, ang - 0.9, ang + 0.9);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // 조준선
  if (!p.shielding && !p.rolling) {
    const ang = angleTo(p, {x: mouse.x + state.cam.x, y: mouse.y + state.cam.y});
    for (let i = 1; i < 6; i++) {
      const px = x + Math.cos(ang) * (8 + i * 3);
      const py = y + Math.sin(ang) * (8 + i * 3);
      ctx.globalAlpha = 0.5 - i * 0.08;
      pxDraw(px - 0.5, py - 0.5, 1, 1, '#e8c547');
    }
    ctx.globalAlpha = 1;
  }
}

// 스프라이트를 단색으로 다시 그림
function drawSpriteFlash(sprite, x, y, flip, color) {
  const h = sprite.length;
  const w = sprite[0].length;
  for (let ry = 0; ry < h; ry++) {
    for (let rx = 0; rx < w; rx++) {
      const c = sprite[ry][rx];
      if (c === '.' || c === ' ') continue;
      const drawX = flip ? (x + (w - 1 - rx)) : (x + rx);
      pxDraw(drawX, y + ry, 1, 1, color);
    }
  }
}

