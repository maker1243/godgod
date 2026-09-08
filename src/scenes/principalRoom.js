// =====================================================================
// Principal's Room - 봉인 유지 결말 후 열리는 교장의 방.
// 이력서, 책, 삼관마도 (Three-Crown Blade) 를 볼 수 있음.
// =====================================================================

const principalRoom = {
  cursor: 0,
  reading: null,     // 현재 읽는 문서
  swordClaimed: false,
  message: '',
  messageT: 0,
};

// 방 안의 오브젝트들
const PRINCIPAL_ITEMS = [
  {
    id:'resume', title:'교장 崔의 이력서', x: 60, y: 100,
    lines: [
      '이력: 아카데미 봉인 유지자 (제 47대)',
      '전공: 크로노 물리학, 봉인 마도학',
      '학위: 봉인학 박사 (아카데미 지하 도서관)',
      '',
      '경력:',
      '- 47년 봉인 유지',
      '- 12명의 후보자를 시험 (모두 실패)',
      '- 33편의 미출간 논문 (봉인의 열쇠에 관한)',
      '',
      '취미:',
      '- 홍차 (다즐링 두 스푼)',
      '- 학생 관찰 (뒷문에서)',
      '- 봉인 매듭 뜨개질',
      '',
      '가장 후회하는 것:',
      '"봉인이 완벽하지 않다는 걸 알면서도',
      ' 유지했다. 다음 세대에게 넘겼어야 했다."',
    ],
  },
  {
    id:'book1', title:'봉인 유지자의 일지', x: 130, y: 100,
    lines: [
      '1월 12일. 새 학생이 왔다. 엘라라.',
      '봉인의 열쇠가 될 아이. 나는 안다.',
      '',
      '3월 8일. 그녀가 교실을 열었다.',
      '봉인이 흔들렸지만 유지되었다.',
      '',
      '9월 3일. 학생 하나가 지하로 내려갔다.',
      '이름은 기록하지 않겠다.',
      '봉인을 부술 자가 되겠지.',
      '',
      '11월 30일. 마지막 페이지.',
      '이 학생이 나를 죽일 것이다.',
      '그리고 봉인의 새 유지자가 될 것이다.',
      '아이야, 너의 선택을 존중한다.',
    ],
  },
  {
    id:'book2', title:'후계자에게', x: 200, y: 100,
    lines: [
      '봉인을 유지하는 자는 결국 홀로 남는다.',
      '학생들은 너를 사랑하지 않을 것이다.',
      '너는 그들의 부모를 죽인 자다.',
      '봉인의 대가는 그들이 지불했다.',
      '',
      '하지만 봉인이 없으면',
      '더 많은 이가 죽는다.',
      '',
      '이 검을 받아라. 삼관마도.',
      '봉인 유지자만이 다룰 수 있는 검.',
      '이 검은 너의 짐이자 무기다.',
      '',
      '교장 崔 · 3033년',
    ],
  },
  {
    id:'sword', title:'삼관마도 (Three-Crown Blade)', x: 160, y: 65,
    lines: [
      '봉인 유지자에게 대대로 전해진 검.',
      '세 개의 왕관 문양: 과거·현재·미래.',
      '',
      '효과:',
      '- 모든 데미지 x3',
      '- 특수 스킬 [삼관검격] 해금',
      '- 캐스트 시 검격 애니메이션',
      '',
      '[F] 로 획득',
    ],
    isSword: true,
  },
];

function updatePrincipalRoom(dt) {
  if (principalRoom.messageT > 0) principalRoom.messageT -= dt;
  // 오브젝트 순환
  if (keys['KeyA'] || keys['ArrowLeft'])  { keys['KeyA']=false; keys['ArrowLeft']=false; principalRoom.cursor = (principalRoom.cursor - 1 + PRINCIPAL_ITEMS.length) % PRINCIPAL_ITEMS.length; sfx('hit'); }
  if (keys['KeyD'] || keys['ArrowRight']) { keys['KeyD']=false; keys['ArrowRight']=false; principalRoom.cursor = (principalRoom.cursor + 1) % PRINCIPAL_ITEMS.length; sfx('hit'); }
  // 읽기
  if (keys['Space'] || keys['Enter']) {
    keys['Space']=false; keys['Enter']=false;
    if (principalRoom.reading) principalRoom.reading = null;
    else principalRoom.reading = PRINCIPAL_ITEMS[principalRoom.cursor];
  }
  // 검 획득
  if (keys['KeyF']) {
    keys['KeyF']=false;
    const item = PRINCIPAL_ITEMS[principalRoom.cursor];
    if (item.isSword && !state.swordClaimed) {
      state.swordClaimed = true;
      principalRoom.swordClaimed = true;
      // 삼관마도 부여
      if (!state.artifacts) _ensureArtifactsState();
      state.artifacts.owned['god_threecrown'] = true;
      if (state.artifacts.equipped.length < 3) state.artifacts.equipped.push('god_threecrown');
      showAchievementBanner('삼관마도 획득', '봉인 유지자의 검을 손에 넣었다', '#ff00ff');
      if (typeof sfx === 'function') sfx('jackpot');
      if (typeof saveAccountData === 'function') saveAccountData();
      if (typeof refreshPlayerStats === 'function') refreshPlayerStats();
    }
  }
  if (keys['KeyR'] || keys['Escape']) {
    if (principalRoom.reading) { keys['KeyR']=false; keys['Escape']=false; principalRoom.reading = null; }
    else { keys['KeyR']=false; keys['Escape']=false; state.scene = 'academy'; }
  }
  // 클릭
  if (mouse.down && !principalRoom.reading && Array.isArray(window._principalRoomItems)) {
    for (const it of window._principalRoomItems) {
      if (mouse.x >= it.x - 12 && mouse.x <= it.x + 12 && mouse.y >= it.y - 12 && mouse.y <= it.y + 12) {
        mouse.down = false;
        principalRoom.cursor = it.idx;
        principalRoom.reading = PRINCIPAL_ITEMS[it.idx];
        return;
      }
    }
  }
}

function renderPrincipalRoom() {
  // 배경: 붉은 카펫 방
  ctx.fillStyle = '#1a0510';
  ctx.fillRect(0, 0, W*PX, H*PX);
  // 벽지 패턴
  ctx.fillStyle = '#2a0e2e';
  for (let x = 0; x < W; x += 12) {
    for (let y = 0; y < H; y += 12) {
      if (((x/12 + y/12) & 1) === 0) ctx.fillRect(x*PX, y*PX, 12*PX, 12*PX);
    }
  }
  // 카펫 (붉은 십자)
  ctx.fillStyle = '#5a1010';
  ctx.fillRect(W/2*PX - 40*PX, 0, 80*PX, H*PX);

  // 상단 HUD
  pxDraw(0, 0, W, 12, '#1a0510');
  drawText('교장 崔 총장의 방', 4, 3, '#e8c547');
  drawText('[R/ESC] 나가기', W - textWidth('[R/ESC] 나가기') - 4, 3, '#8a7ab5');
  drawText('AD 순환   SPACE 읽기   F 획득 (삼관마도)', W/2 - textWidth('AD 순환   SPACE 읽기   F 획득 (삼관마도)')/2, 20, '#c8b898');

  // 방 안의 오브젝트들
  window._principalRoomItems = [];
  for (let i = 0; i < PRINCIPAL_ITEMS.length; i++) {
    const it = PRINCIPAL_ITEMS[i];
    const isSel = principalRoom.cursor === i;
    // 오브젝트 그리기 (책 아이콘)
    if (it.isSword) {
      // 검
      const glow = 0.5 + Math.sin(state.time * 3) * 0.3;
      ctx.fillStyle = 'rgba(255, 0, 255, ' + (glow * 0.3).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(it.x*PX, it.y*PX, 25*PX, 0, Math.PI*2); ctx.fill();
      // 검 몸통
      pxDraw(it.x - 1, it.y - 10, 2, 18, '#c8c8c8');
      pxDraw(it.x - 2, it.y - 12, 4, 3, '#e8c547');
      // 왕관 문양 (3개)
      pxDraw(it.x - 3, it.y - 15, 2, 2, '#ff00ff');
      pxDraw(it.x - 1, it.y - 15, 2, 2, '#ff00ff');
      pxDraw(it.x + 1, it.y - 15, 2, 2, '#ff00ff');
      // 이미 획득 시 흐릿하게
      if (state.swordClaimed) {
        ctx.globalAlpha = 0.4;
        pxDraw(it.x - 12, it.y - 15, 24, 30, '#000');
        ctx.globalAlpha = 1;
        drawText('획득함', it.x - textWidth('획득함')/2, it.y + 10, '#5a4a80');
      }
    } else {
      // 책
      pxDraw(it.x - 5, it.y - 6, 10, 12, '#5a2020');
      pxDraw(it.x - 5, it.y - 6, 10, 1, '#8a4030');
      pxDraw(it.x - 3, it.y - 3, 6, 1, '#e8c547');
    }
    // 선택 링
    if (isSel) {
      ctx.strokeStyle = '#ffefa8';
      ctx.lineWidth = PX * 2;
      ctx.strokeRect((it.x - 14)*PX, (it.y - 14)*PX, 28*PX, 28*PX);
    }
    // 타이틀
    drawText(it.title, it.x - textWidth(it.title)/2, it.y + 16, isSel ? '#ffefa8' : '#8a7ab5');
    window._principalRoomItems.push({ idx: i, x: it.x, y: it.y });
  }

  // 읽는 문서 오버레이
  if (principalRoom.reading) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, W*PX, H*PX);
    // 문서 프레임
    const doc = principalRoom.reading;
    const dx = 20, dy = 20, dw = W - 40, dh = H - 40;
    pxDraw(dx, dy, dw, dh, '#0e0510');
    pxDraw(dx, dy, dw, 1, '#e8c547');
    pxDraw(dx, dy + dh - 1, dw, 1, '#e8c547');
    pxDraw(dx, dy, 1, dh, '#e8c547');
    pxDraw(dx + dw - 1, dy, 1, dh, '#e8c547');
    drawText(doc.title, W/2 - textWidth(doc.title)/2, dy + 6, '#ffefa8');
    for (let i = 0; i < doc.lines.length; i++) {
      drawText(doc.lines[i], dx + 8, dy + 20 + i * 9, '#e8d9b0');
    }
    drawText('[SPACE/ESC] 닫기', W/2 - textWidth('[SPACE/ESC] 닫기')/2, dy + dh - 12, '#8a7ab5');
  }
}
