// =====================================================================
// Login (nickname/password)
// =====================================================================

// =====================================================================
// LOGIN SCENE - nickname + password (local storage)
// =====================================================================
// Simple non-cryptographic hash. NOT secure - just so plain passwords
// aren't sitting in localStorage in cleartext.
function simpleHash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function loadAccounts() {
  try { return JSON.parse(localStorage.getItem('gaa_accounts') || '{}') || {}; }
  catch(e) { return {}; }
}
function saveAccounts(accs) {
  try { localStorage.setItem('gaa_accounts', JSON.stringify(accs)); } catch(e){}
}

const login = {
  mode: 'new',       // 'new' | 'exist'
  field: 'name',     // 'name' | 'pass'
  nameInput: '',
  passInput: '',
  err: '',
  errT: 0,
};

function loginFlash(msg, dur) { login.err = msg; login.errT = dur || 2.5; }

// 서버 API 시도 → 실패 시 로컬 fallback. 서버 성공 시 계정 데이터도 서버에서 복원.
async function _apiCall(path, body) {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('http ' + res.status);
    return await res.json();
  } catch(e) {
    return { ok:false, err:'offline' };
  }
}

async function loginSubmit() {
  const name = login.nameInput.trim();
  const pass = login.passInput;
  if (name.length < 3 || name.length > 12) { loginFlash(t('login.invalidName')); return; }
  if (/[\s\x00-\x1f]/.test(name))          { loginFlash(t('login.invalidName')); return; }
  if (pass.length < 4) { loginFlash(t('login.tooShort')); return; }

  const accs = loadAccounts();
  const key = name.toLowerCase();
  const hash = simpleHash(pass);

  if (login.mode === 'new') {
    // 1) 서버 우선 시도
    const srv = await _apiCall('/api/register', { name, passHash: hash });
    if (srv.err === 'exists') { loginFlash(t('login.exists')); return; }
    // 서버 성공 or offline: 로컬에도 저장 (오프라인 대비 캐시)
    if (accs[key] && srv.ok !== true) { loginFlash(t('login.exists')); return; }
    accs[key] = { name, passHash: hash, createdAt: Date.now() };
    saveAccounts(accs);
    state.account = { name, passHash: hash };
    try { localStorage.setItem('gaa_current_account', JSON.stringify(state.account)); } catch(e){}
    resetGameData();
    saveAccountData();       // 로컬 즉시 저장 + 서버 동기화
    showMsg(t('login.created') + ' - ' + t('login.welcome') + name.toUpperCase(), 3);
    state.scene = 'title';
    sfx('level');
    _tryAutoJoin();
  } else {
    // 1) 서버 우선 시도
    const srv = await _apiCall('/api/login', { name, passHash: hash });
    if (srv.err === 'not_found')  { loginFlash(t('login.notFound')); return; }
    if (srv.err === 'wrong_pass') { loginFlash(t('login.wrongPass')); return; }
    if (srv.ok) {
      // 서버 성공 - 로컬 캐시도 갱신
      accs[key] = { name: srv.name, passHash: hash, createdAt: Date.now() };
      saveAccounts(accs);
      state.account = { name: srv.name, passHash: hash };
      try { localStorage.setItem('gaa_current_account', JSON.stringify(state.account)); } catch(e){}
      // 서버 데이터로 로컬 blob 교체 후 로드
      if (srv.data) {
        try { localStorage.setItem('gaa_data_' + srv.name.toLowerCase(), JSON.stringify(srv.data)); } catch(e){}
      }
      if (!loadAccountData()) resetGameData();
      showMsg(t('login.signedIn') + ' - ' + t('login.welcome') + srv.name.toUpperCase(), 3);
      state.scene = 'title';
      sfx('level');
      _tryAutoJoin();
      return;
    }
    // 2) 오프라인 fallback: 로컬 계정으로 진행
    const rec = accs[key];
    if (!rec) { loginFlash(t('login.notFound') + ' (오프라인)'); return; }
    if (rec.passHash !== hash) { loginFlash(t('login.wrongPass')); return; }
    state.account = { name: rec.name, passHash: rec.passHash };
    try { localStorage.setItem('gaa_current_account', JSON.stringify(state.account)); } catch(e){}
    if (!loadAccountData()) resetGameData();
    showMsg(t('login.signedIn') + ' - ' + t('login.welcome') + rec.name.toUpperCase() + ' (오프라인)', 3);
    state.scene = 'title';
    sfx('level');
    _tryAutoJoin();
  }
}

// URL로 ?room=CODE 붙어서 들어왔으면 로그인 후 자동으로 그 방에 접속
function _tryAutoJoin() {
  if (!_autoJoinRoom) return;
  const code = _autoJoinRoom;
  _autoJoinRoom = null;  // 한 번만 실행
  showMsg('AUTO-JOINING ROOM ' + code + '...', 3);
  // startMpJoin이 로드된 뒤에 실행
  setTimeout(() => {
    if (typeof startMpJoin === 'function') {
      state.scene = 'arena';
      arenaMenu.mode = 'mpJoin';
      startMpJoin(MP_DEFAULT_URL, code);
    }
  }, 100);
}

function updateLogin(dt) {
  if (login.errT > 0) login.errT -= dt;

  // 실제 <input>에 포커스가 없으면 다시 잡기 (다른 곳 클릭 등으로 잃었을 때)
  const focused = document.activeElement;
  if (focused !== loginInput && focused !== loginPass) loginSyncFocus();

  // 마우스 클릭: 모드 버튼 / 입력 필드 / CONFIRM 버튼
  if (mouse.down) {
    mouse.down = false;
    const mx = mouse.x, my = mouse.y;
    // 모드 버튼
    if (login._modeBtns) {
      for (const b of login._modeBtns) {
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          login.mode = b.mode;
          sfx('hit');
        }
      }
    }
    // 입력 필드
    if (login._fieldBtns) {
      for (const b of login._fieldBtns) {
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          login.field = b.field;
          loginSyncFocus();
          sfx('hit');
        }
      }
    }
    // CONFIRM (SUBMIT) 버튼
    if (login._submitBtn) {
      const b = login._submitBtn;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        sfx('hit');
        loginSubmit();
      }
    }
    // BACK (언어 선택으로) 버튼
    if (login._backBtn) {
      const b = login._backBtn;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        sfx('hit');
        if (loginInput) loginInput.blur();
        if (loginPass) loginPass.blur();
        state.scene = 'langSelect';
      }
    }
  }

  // F2 로 모드 전환 (숫자 키는 이제 <input>이 흡수)
  if (keys['F2']) { keys['F2'] = false; login.mode = (login.mode === 'new') ? 'exist' : 'new'; sfx('hit'); }

  // Tab: 필드 전환 (실제 input의 keydown 리스너에서 keys['Tab']=true 로 신호를 넣음)
  if (keys['Tab']) {
    keys['Tab'] = false;
    login.field = (login.field === 'name') ? 'pass' : 'name';
    loginSyncFocus();
    sfx('hit');
  }

  if (keys['Enter'])  { keys['Enter']  = false; loginSubmit(); }
  if (keys['Escape']) { keys['Escape'] = false; loginInput.blur(); loginPass.blur(); state.scene = 'langSelect'; }
}

function renderLogin() {
  bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.9)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  // Title
  const t1 = t('login.title');
  drawText(t1, W/2 - textWidth(t1, 2)/2, 20, '#e8c547', 2);
  const sub = t('login.subtitle');
  drawText(sub, W/2 - textWidth(sub)/2, 42, '#8a7ab5');

  // Mode selector (clickable buttons)
  const modeNewLabel = t('login.mode.new');
  const modeExiLabel = t('login.mode.exist');
  const btnW = 90, btnH = 12, gap = 8;
  const totalW = btnW * 2 + gap;
  const bx1 = W/2 - totalW/2;
  const bx2 = bx1 + btnW + gap;
  const by = 58;
  // NEW
  const newActive = login.mode === 'new';
  pxDraw(bx1, by, btnW, btnH, newActive ? '#e8c547' : '#1a0e2e');
  pxDraw(bx1, by, btnW, 1, '#e8c547');
  pxDraw(bx1, by + btnH - 1, btnW, 1, '#e8c547');
  drawText(modeNewLabel, bx1 + btnW/2 - textWidth(modeNewLabel)/2, by + 3, newActive ? '#0a0512' : '#e8c547');
  // EXIST
  const exiActive = login.mode === 'exist';
  pxDraw(bx2, by, btnW, btnH, exiActive ? '#8bd8ff' : '#1a0e2e');
  pxDraw(bx2, by, btnW, 1, '#8bd8ff');
  pxDraw(bx2, by + btnH - 1, btnW, 1, '#8bd8ff');
  drawText(modeExiLabel, bx2 + btnW/2 - textWidth(modeExiLabel)/2, by + 3, exiActive ? '#0a0512' : '#8bd8ff');
  // 클릭 판정용 저장
  login._modeBtns = [
    { x: bx1, y: by, w: btnW, h: btnH, mode: 'new' },
    { x: bx2, y: by, w: btnW, h: btnH, mode: 'exist' },
  ];

  // Input fields
  const boxX = W/2 - 80, boxW = 160;
  const nameY = 82, passY = 102;
  const nameLabel = t('login.name') + ':';
  drawText(nameLabel, boxX - 4 - textWidth(nameLabel), nameY + 3, '#e8d9b0');
  drawInputBox(login.nameInput, boxX, nameY, boxW, login.field === 'name');
  const passLabel = t('login.pass') + ':';
  drawText(passLabel, boxX - 4 - textWidth(passLabel), passY + 3, '#e8d9b0');
  drawInputBox('*'.repeat(login.passInput.length), boxX, passY, boxW, login.field === 'pass');
  // 클릭 판정용 저장
  login._fieldBtns = [
    { x: boxX, y: nameY, w: boxW, h: 12, field: 'name' },
    { x: boxX, y: passY, w: boxW, h: 12, field: 'pass' },
  ];

  // Hints
  drawText(t('login.nameHint'), boxX, nameY + 14, '#5a4a80');
  drawText(t('login.passHint'), boxX, passY + 14, '#5a4a80');

  // === 큰 CONFIRM 버튼 (모바일에서 SUBMIT용) ===
  const okLabel = login.mode === 'new' ? t('login.new') : t('login.enter');
  const okW = 120, okH = 18, okX = W/2 - okW/2, okY = 138;
  pxDraw(okX, okY, okW, okH, '#3ac762');
  pxDraw(okX, okY, okW, 1, '#ffefa8');
  pxDraw(okX, okY + okH - 1, okW, 1, '#ffefa8');
  pxDraw(okX, okY, 1, okH, '#ffefa8');
  pxDraw(okX + okW - 1, okY, 1, okH, '#ffefa8');
  drawText(okLabel, okX + okW/2 - textWidth(okLabel)/2, okY + 6, '#0a0512');
  login._submitBtn = { x: okX, y: okY, w: okW, h: okH };

  // BACK 버튼 (좌측 하단)
  const backW = 60, backH = 14, backX = 8, backY = H - 20;
  pxDraw(backX, backY, backW, backH, '#1a0e2e');
  pxDraw(backX, backY, backW, 1, '#8a7ab5');
  pxDraw(backX, backY + backH - 1, backW, 1, '#8a7ab5');
  drawText(t('common.back'), backX + backW/2 - textWidth(t('common.back'))/2, backY + 4, '#8a7ab5');
  login._backBtn = { x: backX, y: backY, w: backW, h: backH };

  // 키보드 조작 힌트 (데스크톱용, 작게)
  const c1 = t('login.switch');
  const c2 = t('login.confirm');
  drawText(c1 + '   ' + c2, W/2 - textWidth(c1 + '   ' + c2)/2, 162, '#5a4a80');

  // Error
  if (login.errT > 0 && login.err) {
    ctx.globalAlpha = Math.min(1, login.errT);
    const tw = textWidth(login.err);
    pxDraw(W/2 - tw/2 - 4, 172, tw + 8, 10, '#3a0a0a');
    drawText(login.err, W/2 - tw/2, 175, '#ff8888');
    ctx.globalAlpha = 1;
  }

  // Footer 는 이제 BACK 버튼이 대체
}

function drawInputBox(text, x, y, w, focused) {
  const h = 12;
  pxDraw(x, y, w, h, '#1a0e2e');
  const bc = focused ? '#e8c547' : '#3a1e5c';
  pxDraw(x, y, w, 1, bc);
  pxDraw(x, y + h - 1, w, 1, bc);
  pxDraw(x, y, 1, h, bc);
  pxDraw(x + w - 1, y, 1, h, bc);
  const showCursor = focused && Math.floor(state.time * 3) % 2 === 0;
  const display = text + (showCursor ? '_' : '');
  drawText(display, x + 3, y + 3, '#ffefa8');
}

// ---------- 로그인 텍스트 입력 (숨겨진 input으로 IME/한글 지원) ----------
// keydown 방식은 한글 조합 중 이벤트가 씹혀서 문자가 사라짐.
// 실제 <input> 을 만들어 캔버스 위에 겹쳐 두고 값만 읽어옴.
const loginInput = document.createElement('input');
loginInput.type = 'text';
loginInput.autocomplete = 'off';
loginInput.autocapitalize = 'off';
loginInput.spellcheck = false;
loginInput.style.position = 'fixed';
loginInput.style.opacity = '0';        // 시각적으론 숨김 (커서 등은 캔버스에서 그림)
loginInput.style.pointerEvents = 'none';
loginInput.style.left = '-9999px';
loginInput.style.top = '0';
loginInput.style.width = '200px';
loginInput.style.height = '20px';
loginInput.setAttribute('inputmode', 'text');
loginInput.maxLength = 12;
document.body && document.body.appendChild(loginInput);

const loginPass = document.createElement('input');
loginPass.type = 'password';
loginPass.autocomplete = 'off';
loginPass.spellcheck = false;
loginPass.style.position = 'fixed';
loginPass.style.opacity = '0';
loginPass.style.pointerEvents = 'none';
loginPass.style.left = '-9999px';
loginPass.style.top = '30px';
loginPass.style.width = '200px';
loginPass.style.height = '20px';
loginPass.maxLength = 24;
document.body && document.body.appendChild(loginPass);

// 입력값이 변경될 때 login 객체와 동기화
loginInput.addEventListener('input', () => {
  // 공백과 제어문자 제거
  login.nameInput = loginInput.value.replace(/[\s\x00-\x1f]/g, '').slice(0, 12);
  if (loginInput.value !== login.nameInput) loginInput.value = login.nameInput;
});
loginPass.addEventListener('input', () => {
  login.passInput = loginPass.value.slice(0, 24);
});
loginInput.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter')  { ev.preventDefault(); keys['Enter'] = true; }
  if (ev.key === 'Tab')    { ev.preventDefault(); keys['Tab']   = true; }
  if (ev.key === 'Escape') { ev.preventDefault(); keys['Escape']= true; }
});
loginPass.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter')  { ev.preventDefault(); keys['Enter'] = true; }
  if (ev.key === 'Tab')    { ev.preventDefault(); keys['Tab']   = true; }
  if (ev.key === 'Escape') { ev.preventDefault(); keys['Escape']= true; }
});

// 현재 필드에 따라 실제 <input> 에 포커스
function loginSyncFocus() {
  if (state.scene !== 'login') { loginInput.blur(); loginPass.blur(); return; }
  if (login.field === 'name') { loginInput.value = login.nameInput; loginInput.focus(); }
  else                        { loginPass.value  = login.passInput; loginPass.focus(); }
}

// F1 to sign out (from title screen)
window.addEventListener('keydown', (ev) => {
  if (state.scene !== 'title') return;
  if (ev.key === 'F1') {
    // 현재 계정 데이터 저장 후 클린업
    saveAccountData();
    state.account = null;
    try { localStorage.removeItem('gaa_current_account'); } catch(e){}
    resetGameData();  // 다음 로그인 전까지 이전 계정 값이 남지 않도록
    login.nameInput = ''; login.passInput = '';
    state.scene = 'login';
    ev.preventDefault();
  }
});

