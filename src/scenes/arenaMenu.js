// =====================================================================
// Arena menu + room codes
// =====================================================================

// =====================================================================
// 아레나 메뉴 (WAVE / AI DUEL / ROOM)
// =====================================================================
const arenaMenu = {
  cursor: 0,
  mode: 'menu',          // 'menu' | 'aiPick' | 'mpHost' | 'mpJoin'
  aiDifficulty: 'normal',
  joinInput: '',         // 게스트가 입력하는 "IP:PORT/CODE" 문자열
  message: '',
  messageT: 0,
};

const arenaMenuOptions = [
  { id:'wave',    name:'SOLO WAVE',           desc:'ENDLESS SURVIVAL, ALONE. LOCAL HIGHSCORE.' },
  { id:'ai',      name:'AI DUEL (BEST OF 5)', desc:'5-ROUND SERIES VS AI. WINNER GAINS GPA.' },
  { id:'ranks',   name:'RANKINGS',            desc:'VIEW GPA LEADERBOARD OF ALL ACCOUNTS.' },
  { id:'mpHost',  name:'HOST PVP DUEL',       desc:'CREATE A 1V1 ROOM. WAIT FOR OPPONENT.' },
  { id:'mpJoin',  name:'JOIN PVP DUEL',       desc:'ENTER A HOST\'S ROOM CODE TO FIGHT.' },
  { id:'back',    name:'LEAVE ARENA',         desc:'RETURN TO ACADEMY.' },
];
const aiDifficulties = [
  { id:'easy',   name:'INITIATE',   desc:'RECRUIT ADEPT. WEAK STATS.', mult:0.7,  react:0.35 },
  { id:'normal', name:'DUELIST',    desc:'JOURNEYMAN. AVERAGE.',        mult:1.0,  react:0.20 },
  { id:'hard',   name:'CHAMPION',   desc:'HARDENED. FAST REACTIONS.',   mult:1.35, react:0.10 },
  { id:'nightmare', name:'ARCHON',  desc:'NEAR-PERFECT PLAY.',          mult:1.8,  react:0.05 },
];

function arenaFlash(m) { arenaMenu.message = m; arenaMenu.messageT = 2; }

// 아레나 메뉴 리스트 항목 탭 판정 (마우스/터치 공용).
// renderArenaMenu 의 rowY = 40 + i*22, x=30..W-30, height=20 배치와 일치해야 함.
// 히트 시 커서를 그 행으로 옮기고 SPACE 를 눌린 것으로 세팅 → 아래 기존 흐름이 확정 처리.
function _arenaMenuHitRow(list) {
  if (!mouse.down) return;
  const startY = 40, rowH = 22;
  if (mouse.x < 30 || mouse.x > W - 30) return;
  const idx = Math.floor((mouse.y - startY) / rowH);
  if (idx < 0 || idx >= list.length) return;
  const rowTop = startY + idx * rowH;
  if (mouse.y > rowTop + rowH - 2) return;   // 행 사이 간격 무시
  arenaMenu.cursor = idx;
  keys['Space'] = true;
  mouse.down = false;   // 다중 트리거 방지
}

function updateArenaMenu(dt) {
  if (arenaMenu.messageT > 0) arenaMenu.messageT -= dt;

  if (arenaMenu.mode === 'menu') {
    _arenaMenuHitRow(arenaMenuOptions);
    const n = arenaMenuOptions.length;
    if (keys['KeyW']) { keys['KeyW']=false; arenaMenu.cursor = (arenaMenu.cursor - 1 + n) % n; sfx('hit'); }
    if (keys['KeyS']) { keys['KeyS']=false; arenaMenu.cursor = (arenaMenu.cursor + 1) % n; sfx('hit'); }
    if (keys['Space'] || keys['Enter']) {
      keys['Space']=false; keys['Enter']=false;
      const opt = arenaMenuOptions[arenaMenu.cursor];
      sfx('door');
      if      (opt.id === 'wave')   { goTo('arenaWave'); }
      else if (opt.id === 'ai')     { arenaMenu.mode = 'aiPick'; arenaMenu.cursor = 1; }
      else if (opt.id === 'ranks')  { arenaMenu.mode = 'ranks'; }
      else if (opt.id === 'mpHost') { arenaMenu.mode = 'mpHost'; startMpHost(); }
      else if (opt.id === 'mpJoin') { arenaMenu.mode = 'mpJoin'; arenaMenu.joinInput = ''; }
      else if (opt.id === 'back')   { state.scene = 'academy'; }
    }
    if (keys['KeyR'] || keys['Escape']) { keys['KeyR']=false; keys['Escape']=false; state.scene='academy'; }
    return;
  }

  // 랭킹 화면
  if (arenaMenu.mode === 'ranks') {
    if (keys['KeyR'] || keys['Escape'] || keys['Space']) {
      keys['KeyR']=false; keys['Escape']=false; keys['Space']=false;
      arenaMenu.mode = 'menu';
    }
    return;
  }

  if (arenaMenu.mode === 'aiPick') {
    _arenaMenuHitRow(aiDifficulties);
    const n = aiDifficulties.length;
    if (keys['KeyW']) { keys['KeyW']=false; arenaMenu.cursor = (arenaMenu.cursor - 1 + n) % n; sfx('hit'); }
    if (keys['KeyS']) { keys['KeyS']=false; arenaMenu.cursor = (arenaMenu.cursor + 1) % n; sfx('hit'); }
    if (keys['Space'] || keys['Enter']) {
      keys['Space']=false; keys['Enter']=false;
      arenaMenu.aiDifficulty = aiDifficulties[arenaMenu.cursor].id;
      goTo('arenaAI');
    }
    if (keys['KeyR'] || keys['Escape']) { keys['KeyR']=false; keys['Escape']=false; arenaMenu.mode='menu'; arenaMenu.cursor=1; }
    return;
  }

  if (arenaMenu.mode === 'mpHost') {
    // 호스트: 상대 1명 이상 있어야 매치 시작 가능
    if ((keys['Space'] || keys['Enter']) && mp.roomCode && mp.peers.size >= 1) {
      keys['Space']=false; keys['Enter']=false;
      // 게스트들에게 시작 신호
      mpSend({ type: 'pvpStart' });
      startPvpMatch();
    }
    if (keys['KeyR'] || keys['Escape']) {
      keys['KeyR']=false; keys['Escape']=false;
      mpLeaveRoom();
      arenaMenu.mode = 'menu';
    }
    return;
  }

  if (arenaMenu.mode === 'mpJoin') {
    // 실제 <input>에 포커스 유지 (한글 IME 대응 및 붙여넣기 편의)
    if (mpJoinInputEl && document.activeElement !== mpJoinInputEl) mpJoinFocus();
    // 게스트: 방 코드만 입력 (서버 URL은 현재 페이지 origin에서 자동 유추)
    if (keys['Enter']) {
      keys['Enter']=false;
      // 코드만 추출: 알파벳/숫자 3-8자
      const raw = (arenaMenu.joinInput || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (raw.length < 3) { arenaFlash('ENTER ROOM CODE (3-8 CHARS)'); sfx('hurt'); return; }
      const code = raw.slice(0, 8);
      // 서버 URL은 mp.serverUrl (현재 페이지 origin에서 자동 세팅됨). 폴백은 localhost:8080.
      const url = mp.serverUrl || 'ws://localhost:8080';
      startMpJoin(url, code);
    }
    // 코드 입력 중이므로 R은 텍스트로 흡수. ESC만 뒤로가기.
    if (keys['Escape']) {
      keys['Escape']=false;
      if (mpJoinInputEl) mpJoinInputEl.blur();
      arenaMenu.mode = 'menu';
    }
    return;
  }
}

function renderArenaMenu() {
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, W*PX, H*PX);
  bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('THE ARENA', 4, 3, '#e8c547');
  const statStr = 'BEST WAVE ' + academy.bestArena + '   DUEL WINS ' + academy.duelWins;
  drawText(statStr, W - textWidth(statStr) - 4, 3, '#8bd8ff');

  if (arenaMenu.mode === 'menu') {
    drawText('CHOOSE YOUR MATCH', W/2 - textWidth('CHOOSE YOUR MATCH')/2, 22, '#c8b898');
    const startY = 40, rowH = 22;
    for (let i = 0; i < arenaMenuOptions.length; i++) {
      const o = arenaMenuOptions[i];
      const y = startY + i * rowH;
      const isSel = arenaMenu.cursor === i;
      pxDraw(30, y, W - 60, rowH - 2, isSel ? '#2a1548' : '#1a0e2e');
      if (isSel) {
        pxDraw(30, y, W - 60, 1, '#ffefa8');
        pxDraw(30, y + rowH - 3, W - 60, 1, '#ffefa8');
      }
      drawText(o.name, 38, y + 3, isSel ? '#ffefa8' : '#e8d9b0');
      drawText(o.desc, 38, y + 12, '#8a7ab5');
    }
    drawText('W/S SELECT   [SPACE] CONFIRM   [R] LEAVE', W/2 - textWidth('W/S SELECT   [SPACE] CONFIRM   [R] LEAVE')/2, H - 10, '#5a4a80');
  }

  else if (arenaMenu.mode === 'aiPick') {
    drawText('SELECT OPPONENT SKILL', W/2 - textWidth('SELECT OPPONENT SKILL')/2, 22, '#c8b898');
    const startY = 40, rowH = 22;
    for (let i = 0; i < aiDifficulties.length; i++) {
      const o = aiDifficulties[i];
      const y = startY + i * rowH;
      const isSel = arenaMenu.cursor === i;
      const col = ['#3ac762','#e8c547','#ff9c3d','#c81616'][i] || '#e8d9b0';
      pxDraw(30, y, W - 60, rowH - 2, isSel ? '#2a1548' : '#1a0e2e');
      if (isSel) { pxDraw(30, y, W - 60, 1, col); pxDraw(30, y + rowH - 3, W - 60, 1, col); }
      drawText(o.name, 38, y + 3, isSel ? col : '#e8d9b0');
      drawText(o.desc, 38, y + 12, '#8a7ab5');
      drawText('POWER x' + o.mult.toFixed(2), W - 90, y + 6, col);
    }
    drawText('W/S SELECT   [SPACE] DUEL   [R] BACK', W/2 - textWidth('W/S SELECT   [SPACE] DUEL   [R] BACK')/2, H - 10, '#5a4a80');
  }

  else if (arenaMenu.mode === 'ranks') {
    drawText('GPA RANKINGS', W/2 - textWidth('GPA RANKINGS', 2)/2, 20, '#e8c547', 2);
    drawText('TOP DUELISTS BY GPA', W/2 - textWidth('TOP DUELISTS BY GPA')/2, 40, '#c8b898');
    const lb = getLeaderboard();
    // 헤더
    drawText('RANK', 30, 56, '#8bd8ff');
    drawText('NAME', 60, 56, '#8bd8ff');
    drawText('GPA', 180, 56, '#8bd8ff');
    drawText('W', 220, 56, '#3ac762');
    drawText('L', 240, 56, '#c81616');
    pxDraw(28, 65, W - 56, 1, '#3a1e5c');

    if (lb.length === 0) {
      drawText('NO DUELS COMPLETED YET.', W/2 - textWidth('NO DUELS COMPLETED YET.')/2, 100, '#5a4a80');
      drawText('WIN AN AI DUEL SERIES TO APPEAR HERE.', W/2 - textWidth('WIN AN AI DUEL SERIES TO APPEAR HERE.')/2, 112, '#5a4a80');
    } else {
      const maxShow = Math.min(lb.length, 10);
      for (let i = 0; i < maxShow; i++) {
        const e = lb[i];
        const y = 70 + i * 10;
        const isYou = state.account && e.name === state.account.name;
        const col = isYou ? '#ffefa8' : (i < 3 ? '#e8c547' : '#c8b898');
        const rankStr = '#' + (i + 1);
        drawText(rankStr, 30, y, col);
        const nameStr = (e.name || '').slice(0, 14) + (isYou ? ' (YOU)' : '');
        drawText(nameStr, 60, y, col);
        drawText((e.gpa || 0).toFixed(2), 180, y, col);
        drawText(String(e.wins || 0), 220, y, '#3ac762');
        drawText(String(e.losses || 0), 240, y, '#c81616');
      }
    }

    // 내 정보 요약
    if (state.account) {
      const yourGpa = (state.gpa || 0).toFixed(2);
      const yourW = academy.duelWins || 0;
      const yourL = academy.duelLosses || 0;
      drawText('YOUR GPA: ' + yourGpa + '  W ' + yourW + '  L ' + yourL,
        W/2 - textWidth('YOUR GPA: ' + yourGpa + '  W ' + yourW + '  L ' + yourL)/2, H - 30, '#ffefa8');
    }
    drawText('[SPACE] OR [R] BACK', W/2 - textWidth('[SPACE] OR [R] BACK')/2, H - 10, '#5a4a80');
  }

  else if (arenaMenu.mode === 'mpHost') {
    drawText('PVP DUEL - BEST OF 5', W/2 - textWidth('PVP DUEL - BEST OF 5', 2)/2, 22, '#e8c547', 2);
    if (mp.connecting) {
      drawText('CONNECTING TO ' + mp.serverUrl + ' ...', W/2 - textWidth('CONNECTING TO ' + mp.serverUrl + ' ...')/2, 60, '#e8c547');
      drawText('(START THE SERVER FIRST - RUN start-server.sh OR .bat)', W/2 - textWidth('(START THE SERVER FIRST - RUN start-server.sh OR .bat)')/2, 74, '#8a7ab5');
    } else if (mp.err && !mp.roomCode) {
      drawText('ERROR: ' + mp.err, W/2 - textWidth('ERROR: ' + mp.err)/2, 60, '#ff6666');
      drawText('IS THE SERVER RUNNING AT ' + mp.serverUrl + ' ?', W/2 - textWidth('IS THE SERVER RUNNING AT ' + mp.serverUrl + ' ?')/2, 74, '#8a7ab5');
    } else if (mp.roomCode) {
      // 서버가 알려준 LAN IP가 있으면 그걸로 자동 완성. 없으면 접속한 URL로 폴백.
      const port = mp.serverPort || 8080;
      const lanHosts = (mp.serverHosts && mp.serverHosts.length) ? mp.serverHosts : null;
      const localFallback = mp.serverUrl.replace(/^wss?:\/\//, '');
      // === 코드를 가장 크게 강조 (친구가 코드만 입력하도록) ===
      drawText('ROOM CODE - SHARE WITH FRIENDS:', W/2 - textWidth('ROOM CODE - SHARE WITH FRIENDS:')/2, 42, '#c8b898');
      // 큰 코드
      const codeText = mp.roomCode;
      drawText(codeText, W/2 - textWidth(codeText, 3)/2, 54, '#ffefa8', 3);
      // 부가 정보: 브라우저 URL (같은 서버 페이지에 접속한 게스트는 코드만 입력하면 됨)
      drawText('FRIENDS OPEN THE SAME URL, PICK JOIN, ENTER THIS CODE.', W/2 - textWidth('FRIENDS OPEN THE SAME URL, PICK JOIN, ENTER THIS CODE.')/2, 86, '#8bd8ff');
      if (lanHosts) {
        let yy = 100;
        for (let i = 0; i < Math.min(2, lanHosts.length); i++) {
          const s = 'URL:  http://' + lanHosts[i] + ':' + port + '/';
          drawText(s, W/2 - textWidth(s)/2, yy, '#8a7ab5');
          yy += 10;
        }
      } else {
        drawText('(CHECK SERVER CONSOLE FOR THE URL)', W/2 - textWidth('(CHECK SERVER CONSOLE FOR THE URL)')/2, 100, '#5a4a80');
      }
      // 참가자 목록
      drawText('PLAYERS IN ROOM:', 40, 128, '#8bd8ff');
      drawText('- ' + (state.account ? state.account.name : mp.playerName) + '  (YOU, HOST)', 40, 140, '#3ac762');
      let yy2 = 150;
      for (const p of mp.peers.values()) {
        drawText('- ' + p.name + '  (READY)', 40, yy2, '#e8d9b0');
        yy2 += 10;
      }
      // 상대 없으면 대기 안내, 있으면 시작 안내
      if (mp.peers.size === 0) {
        drawText('WAITING FOR AN OPPONENT...', W/2 - textWidth('WAITING FOR AN OPPONENT...')/2, H - 30, '#e8c547');
        drawText('[R] LEAVE', W/2 - textWidth('[R] LEAVE')/2, H - 20, '#ffefa8');
      } else {
        drawText('[SPACE] START 5-ROUND DUEL   [R] LEAVE', W/2 - textWidth('[SPACE] START 5-ROUND DUEL   [R] LEAVE')/2, H - 20, '#ffefa8');
      }
    }
  }

  else if (arenaMenu.mode === 'mpJoin') {
    drawText('JOIN PVP DUEL', W/2 - textWidth('JOIN PVP DUEL', 2)/2, 22, '#e8c547', 2);
    drawText('ENTER THE ROOM CODE FROM YOUR OPPONENT', W/2 - textWidth('ENTER THE ROOM CODE FROM YOUR OPPONENT')/2, 52, '#c8b898');

    // 대문자/숫자만 유효한 코드 표시
    const codeStr = (arenaMenu.joinInput || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    // 5칸 슬롯 UI (일반 방 코드 길이 = 5). 코드가 그보다 길면 뒤에 이어 그림.
    const slots = Math.max(5, codeStr.length);
    const boxW = 24, gap = 6;
    const totalW = slots * boxW + (slots - 1) * gap;
    const sx = W/2 - totalW/2;
    for (let i = 0; i < slots; i++) {
      const bx = sx + i * (boxW + gap);
      const by = 74;
      const filled = i < codeStr.length;
      const isCursor = i === codeStr.length;
      pxDraw(bx, by, boxW, 28, filled ? '#2a1548' : '#1a0e2e');
      const borderCol = filled ? '#ffefa8' : (isCursor ? '#e8c547' : '#5a4a80');
      pxDraw(bx, by, boxW, 1, borderCol);
      pxDraw(bx, by + 27, boxW, 1, borderCol);
      pxDraw(bx, by, 1, 28, borderCol);
      pxDraw(bx + boxW - 1, by, 1, 28, borderCol);
      if (filled) {
        drawText(codeStr[i], bx + boxW/2 - 5, by + 8, '#ffefa8', 2);
      } else if (isCursor && Math.floor(state.time * 3) % 2 === 0) {
        pxDraw(bx + boxW/2 - 3, by + 20, 6, 1, '#e8c547');
      }
    }

    if (mp.connecting) {
      drawText('CONNECTING...', W/2 - textWidth('CONNECTING...')/2, 118, '#e8c547');
    } else if (mp.err) {
      drawText('ERROR: ' + mp.err, W/2 - textWidth('ERROR: ' + mp.err)/2, 118, '#ff6666');
    } else {
      drawText('LETTERS AND DIGITS ONLY', W/2 - textWidth('LETTERS AND DIGITS ONLY')/2, 118, '#5a4a80');
    }
    drawText('[ENTER] JOIN     [ESC] BACK', W/2 - textWidth('[ENTER] JOIN     [ESC] BACK')/2, H - 20, '#ffefa8');
  }

  if (arenaMenu.messageT > 0) {
    ctx.globalAlpha = clamp(arenaMenu.messageT, 0, 1);
    const tw = textWidth(arenaMenu.message);
    pxDraw(W/2 - tw/2 - 4, H - 40, tw + 8, 10, '#1a0e2e');
    drawText(arenaMenu.message, W/2 - tw/2, H - 37, '#ff9c3d');
    ctx.globalAlpha = 1;
  }
}

// =====================================================================
// 룸 저장/로드
// =====================================================================
function createRoom() {
  // 4자리 코드 생성 (플레이어 데이터 기반 시드)
  const code = String(1000 + Math.floor(Math.random() * 9000));
  const loadout = snapshotLoadout();
  try {
    const rooms = JSON.parse(localStorage.getItem('gaa_rooms') || '{}');
    rooms[code] = loadout;
    // 최대 20개까지만 유지
    const keys = Object.keys(rooms);
    if (keys.length > 20) delete rooms[keys[0]];
    localStorage.setItem('gaa_rooms', JSON.stringify(rooms));
  } catch(e) {}
  arenaMenu.roomCode = code;
  arenaMenu.loadedLoadout = loadout;
}

function loadRoom(code) {
  try {
    const rooms = JSON.parse(localStorage.getItem('gaa_rooms') || '{}');
    if (rooms[code]) {
      arenaMenu.loadedLoadout = rooms[code];
      return true;
    }
  } catch(e) {}
  return false;
}

function snapshotLoadout() {
  return {
    owned: JSON.parse(JSON.stringify(state.ownedSkills)),
    slots: JSON.parse(JSON.stringify(state.equippedSlots)),
    perks: JSON.parse(JSON.stringify(state.perks)),
    level: player ? player.level : 1,
    savedAt: Date.now(),
  };
}

