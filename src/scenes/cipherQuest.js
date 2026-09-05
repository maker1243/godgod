// =====================================================================
// Cipher Quest — 아카데미에서 벽에 10초 붙어있으면 나타나는 암호 퀘스트.
// Caesar / Affine 두 종류 중 랜덤으로 출제. 성공 시 RP 보상, 실패는 페널티 없음.
// =====================================================================

const CIPHER_WALL_HOLD_SEC = 2;

// 후보 평문 (4~6글자 영문 대문자). 오답 선지 생성용으로도 사용.
const CIPHER_WORDS = [
  'MAGIC','LIGHT','SPELL','TOWER','SWORD','ARROW','MYSTIC','CRYPT','ARCANE','GLYPH',
  'RUNE','FLAME','FROST','SHADE','HERO','QUEST','ELDER','MOUNT','BRAVE','ALPHA',
  'OMEGA','SILVER','GOLDEN','TRUTH','FAITH','HONOR','GRACE','ROYAL','KNIGHT','ORACLE',
];

// gcd(26, a) = 1 인 a 후보들 (아핀 암호 곱셈 키)
const AFFINE_A = [1,3,5,7,9,11,15,17,19,21,23,25];
// modular inverse of a mod 26
const AFFINE_A_INV = { 1:1, 3:9, 5:21, 7:15, 9:3, 11:19, 15:7, 17:23, 19:11, 21:5, 23:17, 25:25 };

function _caesarEnc(pt, shift) {
  let out = '';
  for (const ch of pt) {
    if (ch >= 'A' && ch <= 'Z') out += String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26 + 26) % 26 + 65);
    else out += ch;
  }
  return out;
}
function _affineEnc(pt, a, b) {
  let out = '';
  for (const ch of pt) {
    if (ch >= 'A' && ch <= 'Z') {
      const x = ch.charCodeAt(0) - 65;
      const y = ((a * x + b) % 26 + 26) % 26;
      out += String.fromCharCode(y + 65);
    } else out += ch;
  }
  return out;
}

const cipherQuest = {
  active: false,
  cursor: 0,
  correctIdx: 0,
  choices: [],       // 4개 평문 후보
  plainText: '',
  cipherText: '',
  cipherType: '',    // 'caesar' | 'affine'
  params: '',        // 사용자에게 힌트로 노출하는 파라미터 (a, b, shift)
  rewardRp: 0,
  message: '',
  messageT: 0,
  wallHoldT: 0,       // 벽 접촉 누적 시간(초)
  cooldown: 0,        // 실패/성공 후 잠깐 재출제 방지
};

function _rand(a, b) { return a + Math.floor(Math.random() * (b - a)); }

function startCipherQuest() {
  const useAffine = Math.random() < 0.5;
  const plainIdx = _rand(0, CIPHER_WORDS.length);
  const plain = CIPHER_WORDS[plainIdx];
  let cipher, typeLabel, params, reward;
  if (useAffine) {
    const a = AFFINE_A[_rand(1, AFFINE_A.length)];   // a=1 제외 (=Caesar-like)
    const b = _rand(1, 26);
    cipher = _affineEnc(plain, a, b);
    typeLabel = 'affine';
    params = 'a=' + a + ' b=' + b;
    reward = 50 + Math.floor(a + b);
  } else {
    const shift = _rand(1, 26);
    cipher = _caesarEnc(plain, shift);
    typeLabel = 'caesar';
    params = 'shift=' + shift;
    reward = 30 + shift;
  }
  // 오답 선지: 사전에서 3개 뽑되 정답 제외 + 길이 유사한 것 우선
  const distractors = [];
  const pool = CIPHER_WORDS.filter(w => w !== plain);
  while (distractors.length < 3 && pool.length) {
    const j = _rand(0, pool.length);
    distractors.push(pool.splice(j, 1)[0]);
  }
  const choices = [plain, ...distractors];
  // 셔플
  for (let i = choices.length - 1; i > 0; i--) {
    const k = _rand(0, i + 1);
    const t = choices[i]; choices[i] = choices[k]; choices[k] = t;
  }
  cipherQuest.active = true;
  cipherQuest.cipherType = typeLabel;
  cipherQuest.params = params;
  cipherQuest.cipherText = cipher;
  cipherQuest.plainText = plain;
  cipherQuest.choices = choices;
  cipherQuest.correctIdx = choices.indexOf(plain);
  cipherQuest.cursor = 0;
  cipherQuest.rewardRp = reward;
  cipherQuest.message = '';
  cipherQuest.messageT = 0;
  if (typeof sfx === 'function') sfx('door');
  if (typeof showMsg === 'function') showMsg('CIPHER QUEST', 2);
}

function _cipherFinish(correct) {
  if (correct) {
    state.research = (state.research || 0) + cipherQuest.rewardRp;
    cipherQuest.message = 'CORRECT! +' + cipherQuest.rewardRp + ' RP';
    if (typeof sfx === 'function') sfx('level');
    if (typeof spawnFloat === 'function' && player) spawnFloat(player.x, player.y - 10, '+' + cipherQuest.rewardRp + ' RP', '#8bd8ff');
    if (typeof saveAccountData === 'function') saveAccountData();
  } else {
    cipherQuest.message = 'WRONG. ANSWER WAS ' + cipherQuest.plainText;
    if (typeof sfx === 'function') sfx('hurt');
  }
  cipherQuest.messageT = 2.5;
  cipherQuest.active = false;
  cipherQuest.cooldown = 30;   // 다음 시도 30초 후
  cipherQuest.wallHoldT = 0;
}

// 매 프레임 아카데미 update 에서 호출. 벽 접촉 감지 + 팝업 입력 처리.
function updateCipherQuestAcademy(dt) {
  // 팝업 종료 안내 메시지 감쇠
  if (cipherQuest.messageT > 0) cipherQuest.messageT -= dt;
  if (cipherQuest.cooldown > 0) cipherQuest.cooldown -= dt;

  if (cipherQuest.active) {
    // 4개 선지 - W/S 이동, Space/Enter 제출, Esc 취소
    const n = cipherQuest.choices.length;
    if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; cipherQuest.cursor = (cipherQuest.cursor - 1 + n) % n; sfx('hit'); }
    if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; cipherQuest.cursor = (cipherQuest.cursor + 1) % n; sfx('hit'); }
    if (keys['KeyA'] || keys['ArrowLeft']) { keys['KeyA']=false; keys['ArrowLeft']=false; cipherQuest.cursor = (cipherQuest.cursor - 1 + n) % n; sfx('hit'); }
    if (keys['KeyD'] || keys['ArrowRight']){ keys['KeyD']=false; keys['ArrowRight']=false; cipherQuest.cursor = (cipherQuest.cursor + 1) % n; sfx('hit'); }
    if (keys['Digit1']) { keys['Digit1']=false; cipherQuest.cursor = 0; _cipherFinish(cipherQuest.cursor === cipherQuest.correctIdx); return; }
    if (keys['Digit2']) { keys['Digit2']=false; cipherQuest.cursor = 1; _cipherFinish(cipherQuest.cursor === cipherQuest.correctIdx); return; }
    if (keys['Digit3']) { keys['Digit3']=false; cipherQuest.cursor = 2; _cipherFinish(cipherQuest.cursor === cipherQuest.correctIdx); return; }
    if (keys['Digit4']) { keys['Digit4']=false; cipherQuest.cursor = 3; _cipherFinish(cipherQuest.cursor === cipherQuest.correctIdx); return; }
    if (keys['Space'] || keys['Enter']) { keys['Space']=false; keys['Enter']=false; _cipherFinish(cipherQuest.cursor === cipherQuest.correctIdx); return; }
    if (keys['Escape']) { keys['Escape']=false; cipherQuest.active = false; cipherQuest.cooldown = 5; cipherQuest.wallHoldT = 0; }
    // 클릭으로 선지 선택 (render 가 좌표 저장)
    if (mouse.down && Array.isArray(window._cipherChoiceRows)) {
      for (const r of window._cipherChoiceRows) {
        if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
          mouse.down = false;
          cipherQuest.cursor = r.idx;
          _cipherFinish(r.idx === cipherQuest.correctIdx);
          return;
        }
      }
    }
    return true;   // 팝업 활성 = 아카데미 이동/문 잠금
  }

  if (cipherQuest.cooldown > 0) return false;

  // 벽 접촉 감지
  const p = player;
  const r = academy.room;
  const near = 4;
  const touchingWall = (p.x - r.x < near) || (r.x + r.w - p.x < near) || (p.y - r.y < near) || (r.y + r.h - p.y < near);
  if (touchingWall) cipherQuest.wallHoldT += dt;
  else cipherQuest.wallHoldT = Math.max(0, cipherQuest.wallHoldT - dt * 0.5);

  if (cipherQuest.wallHoldT >= CIPHER_WALL_HOLD_SEC) {
    startCipherQuest();
    return true;
  }
  return false;
}

// 아카데미 렌더 뒤에 호출. 팝업 + 진행 게이지 + 알림 메시지 그림.
function renderCipherQuestOverlay() {
  // 진행 게이지 (벽 붙기 카운트다운) - 좌측 하단
  if (!cipherQuest.active && cipherQuest.wallHoldT > 0.2) {
    const pct = Math.min(1, cipherQuest.wallHoldT / CIPHER_WALL_HOLD_SEC);
    const bx = 8, by = H - 22, bw = 90, bh = 6;
    pxDraw(bx, by, bw, bh, '#1a0e2e');
    pxDraw(bx, by, bw * pct, bh, '#8bd8ff');
    drawText('CIPHER ' + Math.max(0, CIPHER_WALL_HOLD_SEC - cipherQuest.wallHoldT).toFixed(1) + 's', bx, by - 8, '#8bd8ff');
  }
  // 결과 메시지 (성공/실패)
  if (cipherQuest.messageT > 0 && !cipherQuest.active) {
    ctx.globalAlpha = Math.min(1, cipherQuest.messageT);
    const tw = textWidth(cipherQuest.message);
    pxDraw(W/2 - tw/2 - 4, H/2, tw + 8, 12, '#1a0e2e');
    drawText(cipherQuest.message, W/2 - tw/2, H/2 + 3, '#ffefa8');
    ctx.globalAlpha = 1;
  }
  // 팝업
  if (!cipherQuest.active) { window._cipherChoiceRows = null; return; }
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, W*PX, H*PX);
  const bw = 240, bh = 140;
  const bx = Math.floor(W/2 - bw/2);
  const by = Math.floor(H/2 - bh/2);
  // 패널
  pxDraw(bx, by, bw, bh, '#1a0e2e');
  pxDraw(bx, by, bw, 1, '#8bd8ff');
  pxDraw(bx, by + bh - 1, bw, 1, '#8bd8ff');
  pxDraw(bx, by, 1, bh, '#8bd8ff');
  pxDraw(bx + bw - 1, by, 1, bh, '#8bd8ff');
  // 헤더
  drawText('CIPHER QUEST', bx + bw/2 - textWidth('CIPHER QUEST')/2, by + 4, '#ffefa8');
  drawText('TYPE: ' + cipherQuest.cipherType.toUpperCase() + '  ' + cipherQuest.params,
    bx + bw/2 - textWidth('TYPE: ' + cipherQuest.cipherType.toUpperCase() + '  ' + cipherQuest.params)/2,
    by + 14, '#c8b898');
  // 암호문 (크게)
  drawText('CIPHER: ' + cipherQuest.cipherText,
    bx + bw/2 - textWidth('CIPHER: ' + cipherQuest.cipherText, 2)/2,
    by + 28, '#ffefa8', 2);
  // 선지 4개
  window._cipherChoiceRows = [];
  const rowH = 14;
  const startY = by + 56;
  for (let i = 0; i < cipherQuest.choices.length; i++) {
    const y = startY + i * rowH;
    const isSel = cipherQuest.cursor === i;
    if (isSel) pxDraw(bx + 12, y, bw - 24, rowH - 2, '#2a1548');
    const label = '[' + (i+1) + '] ' + cipherQuest.choices[i];
    drawText(label, bx + 20, y + 3, isSel ? '#ffefa8' : '#c8b898');
    window._cipherChoiceRows.push({ idx: i, x: bx + 12, y: y - 1, w: bw - 24, h: rowH });
  }
  // 보상 + 안내
  drawText('REWARD: +' + cipherQuest.rewardRp + ' RP', bx + 12, by + bh - 20, '#3ac762');
  drawText('WS/1-4 SELECT  SPACE SUBMIT  ESC CANCEL',
    bx + bw/2 - textWidth('WS/1-4 SELECT  SPACE SUBMIT  ESC CANCEL')/2,
    by + bh - 9, '#8a7ab5');
}
