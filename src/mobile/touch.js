// =====================================================================
// Mobile touch controls
// =====================================================================

// =====================================================================
// MOBILE / TOUCH SUPPORT - 트윈스틱 + 액션 버튼
// =====================================================================
// keys/mouse 상태를 터치가 시뮬레이션하도록 만들어서 게임 로직은 그대로 사용.
// 좌측 하단: 이동 조이스틱 (WASD 시뮬레이션)
// 우측 하단: 조준 조이스틱 (마우스 이동 + LMB down 자동 발사)
// 액션 버튼들: Q, E, SHIFT, R, SPACE, ESC

const touch = {
  enabled: false,  // 모바일 감지되거나 사용자가 켜면 true
  // 조이스틱들 (좌표는 게임 논리 좌표 320x200 기준)
  leftStick:  { id:null, active:false, cx:40,  cy:160, tx:0, ty:0, radius:26 },
  rightStick: { id:null, active:false, cx:280, cy:160, tx:0, ty:0, radius:26 },
  buttons: [],  // 씬별로 채워짐. { id, x, y, r, label, keyName, pressed, touchId }
};

// 모바일 감지 + localStorage 저장된 사용자 설정
try {
  const saved = localStorage.getItem('gaa_touch_mode');   // 'on'|'off'|null
  if (saved === 'on')      touch.enabled = true;
  else if (saved === 'off') touch.enabled = false;
  else {
    // 저장된 설정 없으면 자동 감지 (조건 완화: 화면 900px 미만도 포함)
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent || '');
    const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 900;
    touch.enabled = isTouchDevice || isMobileUA || isSmallScreen;
  }
} catch(e) {}

// 첫 진짜 터치 이벤트 감지 시 자동으로 켜기 (사용자가 명시적으로 껐던 경우 제외)
let _touchAutoActivated = false;
window.addEventListener('touchstart', (ev) => {
  if (_touchAutoActivated) return;
  _touchAutoActivated = true;
  let saved = null;
  try { saved = localStorage.getItem('gaa_touch_mode'); } catch(e){}
  if (saved === 'off') return;   // 사용자가 명시적으로 껐으면 존중
  if (!touch.enabled) {
    touch.enabled = true;
    try { localStorage.setItem('gaa_touch_mode', 'on'); } catch(e){}
    if (typeof showMsg === 'function') showMsg('TOUCH CONTROLS ACTIVATED', 2);
  }
}, { passive: true, capture: true });

function toggleTouchMode() {
  touch.enabled = !touch.enabled;
  try { localStorage.setItem('gaa_touch_mode', touch.enabled ? 'on' : 'off'); } catch(e){}
  if (typeof showMsg === 'function') showMsg('TOUCH UI: ' + (touch.enabled ? 'ON' : 'OFF'), 2);
}
window.addEventListener('keydown', (ev) => {
  // T 키로 터치 UI 토글 (입력 필드 포커스 중이면 무시)
  if (ev.key === 't' || ev.key === 'T') {
    const act = document.activeElement;
    if (act && (act.tagName === 'INPUT' || act.tagName === 'TEXTAREA')) return;
    toggleTouchMode();
    ev.preventDefault();
  }
});

// 씬별 활성 액션 버튼 세트를 반환
function activeTouchButtons() {
  const sc = state.scene;
  // 캔버스 크기 논리 좌표: 320x200
  const btn = (x, y, r, label, key) => ({ x, y, r, label, keyName: key, pressed: false, touchId: null });
  if (sc === 'dungeon' || sc === 'arenaWave') {
    return [
      btn(300, 122, 12, 'Q',  'KeyQ'),
      btn(280, 138, 12, 'E',  'KeyE'),
      btn(300, 155, 14, 'SH', 'ShiftLeft'),   // 방패/구르기
      btn(20,  22,  10, 'R',  'KeyR'),         // 후퇴
    ];
  }
  if (sc === 'arena' || sc === 'arenaAI' || sc === 'arenaRoom' || sc === 'arenaEnd' || sc === 'duelEnd') {
    return [
      btn(300, 22,  12, 'OK',  'Space'),
      btn(20,  22,  10, 'R',   'KeyR'),
      btn(20,  40,  10, 'ESC', 'Escape'),
    ];
  }
  if (sc === 'library') {
    return [
      btn(300, 22,  12, 'OK',  'Space'),      // 구매 (Space)
      btn(300, 46,  12, 'EQP', 'KeyF'),       // 장착 (F)
      btn(20,  22,  10, 'ESC', 'Escape'),
    ];
  }
  if (sc === 'academy' || sc === 'shop' || sc === 'classroom') {
    return [
      btn(300, 22,  12, 'OK',  'Space'),
      btn(20,  22,  10, 'ESC', 'Escape'),
    ];
  }
  if (sc === 'title' || sc === 'intro' || sc === 'levelup' || sc === 'dead' || sc === 'ending' || sc === 'langSelect' || sc === 'login') {
    return [
      btn(300, 22,  12, 'OK',  'Space'),
    ];
  }
  return [];
}

// 게임 씬(트윈스틱 필요한 씬)만 조이스틱 활성화
function showJoysticks() {
  return touch.enabled && (
    state.scene === 'dungeon' ||
    state.scene === 'arenaWave' ||
    state.scene === 'arenaAI' ||
    state.scene === 'arenaRoom' ||
    state.scene === 'academy'
  );
}

// 캔버스 좌표 (px) → 논리 좌표 (0-320, 0-200)
function canvasEventToLogical(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  // 캔버스가 CSS로 리사이즈될 수 있으니 실제 크기 기준으로 스케일
  const sx = (clientX - rect.left) * (canvas.width  / rect.width)  / PX;
  const sy = (clientY - rect.top)  * (canvas.height / rect.height) / PX;
  return { x: sx, y: sy };
}

// HUD 하단 포션(버프) 슬롯 히트 테스트 - 논리 좌표 (0..320, 0..200) 기준.
// 슬롯 배치는 renderDungeonHUD 의 slotList 순서 = [LMB, Q, E, SHF, POT1, POT2, POT3]
// slotW=24, gap=3, totalW=7*24+6*3=186, startX=W/2 - totalW/2 = 67
// slotY = H - 22 = 178, height 20
function _hitPotionSlot(px, py) {
  if (state.scene !== 'dungeon' && state.scene !== 'arenaWave') return -1;
  const slotY = H - 22;
  // 세로 여유 4px (터치 정확도 보정)
  if (py < slotY - 4 || py > slotY + 24) return -1;
  const slotW = 24, gap = 3;
  const totalW = 7 * slotW + 6 * gap;
  const startX = W/2 - totalW/2;
  for (let i = 0; i < 3; i++) {
    const sx = startX + (4 + i) * (slotW + gap);
    if (px >= sx - 2 && px <= sx + slotW + 2) return i;
  }
  return -1;
}

function _handleTouchStart(t) {
  const p = canvasEventToLogical(t.clientX, t.clientY);
  // 액션 버튼 우선 검사 (조이스틱보다)
  const buttons = activeTouchButtons();
  for (const b of buttons) {
    const dx = p.x - b.x, dy = p.y - b.y;
    if (dx*dx + dy*dy <= (b.r + 4) * (b.r + 4)) {
      b.pressed = true;
      b.touchId = t.identifier;
      if (b.keyName) keys[b.keyName] = true;
      // 특수: Space는 마우스 클릭도 함께 (title 등에서 Space 처리)
      touch.buttons.push(b);
      return;
    }
  }
  // 포션(버프) 슬롯 - 터치로 사용
  const potSlot = _hitPotionSlot(p.x, p.y);
  if (potSlot >= 0) {
    if (typeof usePotionSlot === 'function') usePotionSlot(potSlot);
    return;
  }
  // 레벨업 카드 - 터치로 선택 (renderLevelUp 의 cardW=80, cardH=70, gap=10, y=70)
  if (state.scene === 'levelup' && typeof perkChoices !== 'undefined' && perkChoices.length) {
    const cardW = 80, cardH = 70, gap = 10;
    const total = perkChoices.length * cardW + (perkChoices.length - 1) * gap;
    const sx = W/2 - total/2;
    const y = 70;
    if (p.y >= y - 2 && p.y <= y + cardH + 2) {
      for (let i = 0; i < perkChoices.length; i++) {
        const cx = sx + i * (cardW + gap);
        if (p.x >= cx - 2 && p.x <= cx + cardW + 2) {
          // updateLevelUp 이 다음 프레임에 소비하도록 Digit 키 세팅
          keys['Digit' + (i+1)] = true;
          return;
        }
      }
    }
  }
  // 조이스틱 (게임 씬에서만)
  if (showJoysticks()) {
    // 왼쪽 반 → 왼쪽 스틱, 오른쪽 반 → 오른쪽 스틱. 손가락 위치를 스틱 중심으로.
    if (p.x < W/2 && !touch.leftStick.active) {
      touch.leftStick.active = true;
      touch.leftStick.id = t.identifier;
      touch.leftStick.cx = p.x; touch.leftStick.cy = p.y;
      touch.leftStick.tx = p.x; touch.leftStick.ty = p.y;
      return;
    }
    if (p.x >= W/2 && !touch.rightStick.active) {
      touch.rightStick.active = true;
      touch.rightStick.id = t.identifier;
      touch.rightStick.cx = p.x; touch.rightStick.cy = p.y;
      touch.rightStick.tx = p.x; touch.rightStick.ty = p.y;
      // 우측 조이스틱 활성 = 즉시 발사
      mouse.down = true;
      return;
    }
  } else {
    // 게임 씬이 아니면 터치를 마우스 클릭으로 매핑 (메뉴/로그인 UI용)
    mouse.x = p.x; mouse.y = p.y; mouse.down = true;
    // touchend에서 해제되므로 여기서는 클릭 이벤트도 발생시킴
  }
}

function _handleTouchMove(t) {
  const p = canvasEventToLogical(t.clientX, t.clientY);
  // 액션 버튼은 슬라이드 무효
  // 조이스틱 업데이트
  if (touch.leftStick.active && touch.leftStick.id === t.identifier) {
    touch.leftStick.tx = p.x; touch.leftStick.ty = p.y;
  }
  if (touch.rightStick.active && touch.rightStick.id === t.identifier) {
    touch.rightStick.tx = p.x; touch.rightStick.ty = p.y;
  }
  // 메뉴 씬에서는 마우스 위치 갱신
  if (!showJoysticks()) {
    mouse.x = p.x; mouse.y = p.y;
  }
}

function _handleTouchEnd(t) {
  // 액션 버튼 해제
  for (let i = touch.buttons.length - 1; i >= 0; i--) {
    const b = touch.buttons[i];
    if (b.touchId === t.identifier) {
      b.pressed = false;
      b.touchId = null;
      if (b.keyName) keys[b.keyName] = false;
      touch.buttons.splice(i, 1);
    }
  }
  // 조이스틱 해제
  if (touch.leftStick.id === t.identifier) {
    touch.leftStick.active = false; touch.leftStick.id = null;
  }
  if (touch.rightStick.id === t.identifier) {
    touch.rightStick.active = false; touch.rightStick.id = null;
    mouse.down = false;  // 오른쪽 놓으면 발사 중지
  }
  // 메뉴 씬에서는 마우스 up
  if (!showJoysticks()) {
    mouse.down = false;
  }
}

// 캔버스에 터치 이벤트 리스너
if (canvas && canvas.addEventListener) {
  canvas.addEventListener('touchstart', (e) => {
    // login 씬에서는 input 요소가 포커스 필요하니 preventDefault 안 함
    if (state.scene !== 'login') e.preventDefault();
    for (const t of e.changedTouches) _handleTouchStart(t);
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    if (state.scene !== 'login') e.preventDefault();
    for (const t of e.changedTouches) _handleTouchMove(t);
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    if (state.scene !== 'login') e.preventDefault();
    for (const t of e.changedTouches) _handleTouchEnd(t);
  }, { passive: false });
  canvas.addEventListener('touchcancel', (e) => {
    for (const t of e.changedTouches) _handleTouchEnd(t);
  }, { passive: false });
}

// 매 프레임: 왼쪽 조이스틱 → WASD 시뮬레이션, 오른쪽 조이스틱 → 마우스 조준
function updateTouchInput() {
  if (!touch.enabled) return;
  // 왼쪽 스틱: WASD 시뮬레이션
  const ls = touch.leftStick;
  if (ls.active) {
    const dx = ls.tx - ls.cx, dy = ls.ty - ls.cy;
    const mag = Math.hypot(dx, dy);
    const dead = 5;
    if (mag > dead) {
      const nx = dx / mag, ny = dy / mag;
      keys['KeyD'] = nx >  0.35;
      keys['KeyA'] = nx < -0.35;
      keys['KeyS'] = ny >  0.35;
      keys['KeyW'] = ny < -0.35;
    } else {
      keys['KeyW'] = keys['KeyA'] = keys['KeyS'] = keys['KeyD'] = false;
    }
  } else {
    // 왼쪽 스틱 안 잡혔으면 WASD는 그대로 false (물리 키보드가 아닌 이상)
    if (touch.enabled && !hasPhysicalKeyboard()) {
      keys['KeyW'] = keys['KeyA'] = keys['KeyS'] = keys['KeyD'] = false;
    }
  }
  // 오른쪽 스틱: 마우스 조준 위치 = 플레이어 + 스틱 방향
  const rs = touch.rightStick;
  if (rs.active && (state.scene === 'dungeon' || state.scene === 'arenaWave' || state.scene === 'arenaAI' || state.scene === 'arenaRoom')) {
    const dx = rs.tx - rs.cx, dy = rs.ty - rs.cy;
    const mag = Math.hypot(dx, dy);
    if (mag > 3 && typeof player !== 'undefined' && player) {
      const nx = dx / mag, ny = dy / mag;
      // 플레이어 위치 기준으로 조준. 마우스 x/y는 canvas 좌표계에서 (state.cam 반영 필요).
      mouse.x = player.x - state.cam.x + nx * 40;
      mouse.y = player.y - state.cam.y + ny * 40;
    }
  }
}
// 물리 키보드 감지: 아무 키나 눌린 적이 있으면 true (heuristic)
let _physicalKeyboardSeen = false;
window.addEventListener('keydown', () => { _physicalKeyboardSeen = true; });
function hasPhysicalKeyboard() { return _physicalKeyboardSeen; }

// 렌더링: 조이스틱 + 버튼 오버레이
function renderTouchOverlay() {
  if (!touch.enabled) return;
  ctx.save();
  // 조이스틱들
  if (showJoysticks()) {
    for (const stick of [touch.leftStick, touch.rightStick]) {
      const cx = stick.active ? stick.cx : stick.cx;
      const cy = stick.active ? stick.cy : stick.cy;
      // 배경 원
      ctx.globalAlpha = stick.active ? 0.5 : 0.25;
      ctx.strokeStyle = '#ffefa8';
      ctx.lineWidth = PX * 2;
      ctx.beginPath();
      ctx.arc(cx * PX, cy * PX, stick.radius * PX, 0, Math.PI * 2);
      ctx.stroke();
      // 손잡이
      if (stick.active) {
        let dx = stick.tx - cx, dy = stick.ty - cy;
        const mag = Math.hypot(dx, dy);
        if (mag > stick.radius) { dx = dx / mag * stick.radius; dy = dy / mag * stick.radius; }
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#e8c547';
        ctx.beginPath();
        ctx.arc((cx + dx) * PX, (cy + dy) * PX, 8 * PX, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#c8b898';
        ctx.beginPath();
        ctx.arc(cx * PX, cy * PX, 6 * PX, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // 액션 버튼들
  const buttons = activeTouchButtons();
  ctx.globalAlpha = 0.55;
  for (const b of buttons) {
    ctx.fillStyle = b.pressed ? '#e8c547' : 'rgba(20, 10, 40, 0.7)';
    ctx.beginPath();
    ctx.arc(b.x * PX, b.y * PX, b.r * PX, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = b.pressed ? '#ffefa8' : '#8a7ab5';
    ctx.lineWidth = PX * 1.5;
    ctx.beginPath();
    ctx.arc(b.x * PX, b.y * PX, b.r * PX, 0, Math.PI * 2);
    ctx.stroke();
    // 라벨
    const col = b.pressed ? '#1a0e2e' : '#ffefa8';
    const lw = textWidth(b.label);
    drawText(b.label, b.x - lw/2, b.y - 3, col);
    ctx.globalAlpha = 0.55;
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

