// =====================================================================
// Epilogue - 최종 결말 후 크레딧/에필로그. 두 결말 각각 다른 텍스트.
// state.epilogueKind: 'break' | 'seal'
// =====================================================================

const epilogue = {
  scroll: 0,
  active: false,
  kind: 'break',
  startT: 0,
};

const EPILOGUE_BREAK = [
  '',
  '',
  '',
  '',
  '- 봉인이 부서졌다 -',
  '',
  '검은 심장은 소멸했다.',
  '자신의 육체를 찾기 전에.',
  '',
  '아카데미의 학생들은',
  '부모의 이름을 다시 되찾았다.',
  '',
  '엘라라는 사라졌다.',
  '봉인의 열쇠였기에.',
  '그녀의 이름만이 도서관에 남았다.',
  '',
  '누군가는 말했다.',
  '"그녀가 마지막에 웃었다."',
  '',
  '아카데미는 새로운 이름을 얻었다.',
  '"엘라라 기념 아르카나 학원"',
  '',
  '너는 학원을 떠나',
  '봉인 없는 세계로 걸어갔다.',
  '',
  '그리고 세계는 조금 더 자유로워졌다.',
  '조금 더 위험해졌다.',
  '',
  '',
  '- FIN -',
  '',
  '',
  '',
  'CREDITS',
  '',
  'Design & Code: Claude Opus 4.7',
  'Direction:     Player (You)',
  'Story:         An Academy that Forgot Itself',
  '',
  '',
  '',
  'SPACE - 아카데미로',
];

const EPILOGUE_SEAL = [
  '',
  '',
  '',
  '',
  '- 봉인이 유지된다 -',
  '',
  '너는 아카데미의 새 교장이 되었다.',
  '',
  '학생들은 너를 두려워하고',
  '한편으로 존경한다.',
  '',
  '삼관마도는 너의 허리에 있다.',
  '세 개의 왕관: 과거·현재·미래.',
  '',
  '엘라라는 매일 아침 홍차를 내온다.',
  '그녀는 웃지 않지만',
  '눈은 부드럽다.',
  '',
  '봉인의 무게는 무겁다.',
  '하지만 견딜 수 있다.',
  '',
  '너 이전의 교장이 47년을 버텼듯이',
  '너도 언젠가 후계자를 찾겠지.',
  '',
  '그리고 그 아이에게',
  '똑같은 편지를 남기겠지.',
  '',
  '"봉인 유지자는 결국 홀로 남는다."',
  '',
  '그러나 오늘 밤은',
  '홀로 서 있어도 괜찮다.',
  '',
  '',
  '- FIN -',
  '',
  '',
  '',
  'CREDITS',
  '',
  'Design & Code: Claude Opus 4.7',
  'Direction:     Player (You)',
  'Story:         The Weight of the Seal',
  '',
  '',
  '',
  'SPACE - 아카데미로',
];

function openEpilogue(kind) {
  epilogue.active = true;
  epilogue.kind = (kind === 'seal') ? 'seal' : 'break';
  epilogue.scroll = 0;
  epilogue.startT = 0;
  state.scene = 'epilogue';
  state.epilogueSeen = state.epilogueSeen || {};
  state.epilogueSeen[epilogue.kind] = true;
  if (typeof saveAccountData === 'function') saveAccountData();
}

function updateEpilogue(dt) {
  epilogue.startT += dt;
  // 스크롤 속도: 초당 12픽셀
  epilogue.scroll += 14 * dt;
  // 빠른 감기
  if (keys['ShiftLeft'] || keys['ShiftRight']) epilogue.scroll += 40 * dt;

  const lines = epilogue.kind === 'seal' ? EPILOGUE_SEAL : EPILOGUE_BREAK;
  const totalH = lines.length * 11 + H;

  if (epilogue.scroll >= totalH - H*0.4 && (keys['Space'] || keys['Enter'])) {
    keys['Space']=false; keys['Enter']=false;
    epilogue.active = false;
    state.scene = 'academy';
    return;
  }
  // ESC 스킵
  if (keys['Escape']) {
    keys['Escape']=false;
    epilogue.active = false;
    state.scene = 'academy';
  }
}

function renderEpilogue() {
  // 배경 - 엔딩 색조
  const isBreak = epilogue.kind === 'break';
  if (isBreak) {
    // 파괴된 세계 - 붉은
    const grad = ctx.createLinearGradient(0, 0, 0, H*PX);
    grad.addColorStop(0, '#1a0000');
    grad.addColorStop(1, '#0a0510');
    ctx.fillStyle = grad;
  } else {
    // 유지의 평온 - 붉은 자주
    const grad = ctx.createLinearGradient(0, 0, 0, H*PX);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(1, '#1a0510');
    ctx.fillStyle = grad;
  }
  ctx.fillRect(0, 0, W*PX, H*PX);

  // 별
  if (typeof bgStars === 'function') bgStars();

  // 상징 아이콘 (상단)
  if (isBreak) {
    // 부서진 심장
    const pulse = 0.4 + Math.sin(state.time * 2) * 0.2;
    ctx.fillStyle = 'rgba(200, 22, 22, ' + pulse.toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(W/2*PX, 24*PX, 12*PX, 0, Math.PI*2); ctx.fill();
    pxDraw(W/2 - 1, 15, 2, 20, '#050505');   // 균열
    pxDraw(W/2 + 3, 20, 2, 8, '#050505');
  } else {
    // 왕관
    pxDraw(W/2 - 8, 18, 16, 2, '#e8c547');
    pxDraw(W/2 - 8, 15, 3, 3, '#e8c547');
    pxDraw(W/2 - 2, 12, 4, 6, '#e8c547');
    pxDraw(W/2 + 5, 15, 3, 3, '#e8c547');
    pxDraw(W/2 - 2, 21, 4, 2, '#ff00ff');   // 삼관 문양
  }

  // 스크롤 텍스트
  const lines = isBreak ? EPILOGUE_BREAK : EPILOGUE_SEAL;
  const startY = H - Math.floor(epilogue.scroll);
  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * 11;
    if (y < -8 || y > H) continue;
    const txt = lines[i];
    if (txt.indexOf('- FIN -') >= 0 || txt.indexOf('- 봉인이') >= 0) {
      drawText(txt, W/2 - textWidth(txt, 2)/2, y, isBreak ? '#ff2d2d' : '#e8c547', 2);
    } else if (txt === 'CREDITS') {
      drawText(txt, W/2 - textWidth(txt)/2, y, '#8bd8ff');
    } else if (txt.startsWith('SPACE')) {
      drawText(txt, W/2 - textWidth(txt)/2, y, '#ffefa8');
    } else {
      drawText(txt, W/2 - textWidth(txt)/2, y, '#e8d9b0');
    }
  }

  // 상단 페이드
  const fadeTop = ctx.createLinearGradient(0, 0, 0, 30*PX);
  fadeTop.addColorStop(0, isBreak ? '#1a0000' : '#0a0a1a');
  fadeTop.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fadeTop;
  ctx.fillRect(0, 0, W*PX, 30*PX);

  // 하단 안내
  if (epilogue.startT > 2) {
    drawText('[SHIFT] 빠르게   [ESC] 건너뛰기', W/2 - textWidth('[SHIFT] 빠르게   [ESC] 건너뛰기')/2, H - 6, '#8a7ab5');
  }
}
