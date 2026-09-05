// =====================================================================
// Classroom minigame
// =====================================================================

// =====================================================================
// 교실 (수업 미니게임 - 마법진 타이밍)
// =====================================================================
const classroom = {
  runes: [],       // { x, y, order, hit }
  active: null,    // 다음 클릭해야 할 순서
  timer: 0,
  timeLimit: 8,
  done: false,
  score: 0,
  total: 5,
};

function startClass() {
  classroom.runes = [];
  const n = 5 + Math.min(3, state.day);   // 진행할수록 더 많음
  classroom.total = n;
  for (let i = 0; i < n; i++) {
    let x, y, tries = 0;
    do {
      x = 60 + Math.random() * (W - 120);
      y = 60 + Math.random() * (H - 90);
      tries++;
    } while (classroom.runes.some(r => Math.hypot(r.x-x, r.y-y) < 30) && tries < 30);
    classroom.runes.push({ x, y, order: i, hit: false, pulse: rand(0, Math.PI*2) });
  }
  classroom.active = 0;
  classroom.timer = 0;
  classroom.timeLimit = 6 + Math.max(0, n - 5);
  classroom.done = false;
  classroom.score = 0;
}

function updateClassroom(dt) {
  if (classroom.done) {
    if (keys['Space'] || keys['Enter']) {
      keys['Space'] = false; keys['Enter'] = false;
      // 정산
      const pct = classroom.score / classroom.total;
      let gpaChange, msg;
      if (pct >= 0.95) { gpaChange = 0.15; msg = 'PERFECT! +0.15 GPA'; }
      else if (pct >= 0.7) { gpaChange = 0.08; msg = 'GOOD. +0.08 GPA'; }
      else if (pct >= 0.4) { gpaChange = 0; msg = 'PASSING. GPA UNCHANGED'; }
      else { gpaChange = -0.15; msg = 'FAILED. -0.15 GPA'; }
      state.gpa = Math.max(0, state.gpa + gpaChange);
      state.gold += classroom.score * 2;
      showMsg(msg, 3);
      state.scene = 'academy';
    }
    return;
  }

  classroom.timer += dt;
  for (const r of classroom.runes) r.pulse += dt * 3;

  // 마우스 클릭
  if (mouse.down) {
    mouse.down = false;
    // 활성 룬 클릭 검사
    if (classroom.active < classroom.runes.length) {
      const active = classroom.runes[classroom.active];
      const d = Math.hypot(mouse.x - active.x, mouse.y - active.y);
      if (d < 14) {
        active.hit = true;
        classroom.active++;
        classroom.score++;
        sfx('pickup');
        spawnParticle(active.x, active.y, '#e8c547', 0.5, 10, 60);
      } else {
        // 잘못된 클릭 - 페널티
        sfx('hurt');
        state.shake = 4;
      }
    }
  }

  // 시간 종료 or 모두 클릭
  if (classroom.timer >= classroom.timeLimit || classroom.active >= classroom.runes.length) {
    classroom.done = true;
  }

  if (keys['KeyR']) {
    keys['KeyR'] = false;
    state.scene = 'academy';
  }
}

function renderClassroom() {
  // 배경
  ctx.fillStyle = '#0a2030';
  ctx.fillRect(0, 0, W*PX, H*PX);
  // 상단 정보
  pxDraw(0, 0, W, 14, '#05101a');
  drawText('SPELLCASTING PRACTICE', 4, 4, '#8bd8ff');
  const timeLeft = Math.max(0, classroom.timeLimit - classroom.timer);
  drawText('TIME ' + timeLeft.toFixed(1), W - 60, 4, timeLeft < 2 ? '#c81616' : '#e8d9b0');
  drawText('SCORE ' + classroom.score + '/' + classroom.total, W - 130, 4, '#e8d9b0');

  // 룬 그리기
  for (const r of classroom.runes) {
    const isActive = !r.hit && r.order === classroom.active;
    const pulse = 0.7 + Math.sin(r.pulse) * 0.3;
    if (r.hit) {
      // 완료된 룬
      ctx.strokeStyle = '#3ac762';
      ctx.lineWidth = PX;
      ctx.beginPath();
      ctx.arc(r.x*PX, r.y*PX, 8*PX, 0, Math.PI*2);
      ctx.stroke();
      drawText((r.order + 1), r.x - 2, r.y - 3, '#3ac762');
    } else if (isActive) {
      // 활성: 밝은 원 + 링
      ctx.fillStyle = 'rgba(232, 197, 71, ' + (pulse * 0.4) + ')';
      ctx.beginPath();
      ctx.arc(r.x*PX, r.y*PX, 14*PX, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#ffefa8';
      ctx.lineWidth = PX * 2;
      ctx.beginPath();
      ctx.arc(r.x*PX, r.y*PX, 10*PX, 0, Math.PI*2);
      ctx.stroke();
      ctx.strokeStyle = '#e8c547';
      ctx.lineWidth = PX;
      ctx.beginPath();
      ctx.arc(r.x*PX, r.y*PX, 16*PX * pulse, 0, Math.PI*2);
      ctx.stroke();
      drawText((r.order + 1), r.x - 2, r.y - 3, '#ffefa8');
    } else {
      // 대기 중
      ctx.strokeStyle = '#3a5a7a';
      ctx.lineWidth = PX;
      ctx.beginPath();
      ctx.arc(r.x*PX, r.y*PX, 8*PX, 0, Math.PI*2);
      ctx.stroke();
      drawText((r.order + 1), r.x - 2, r.y - 3, '#3a5a7a');
    }
  }

  // 안내
  if (!classroom.done) {
    const s = 'CLICK RUNES IN ORDER';
    drawText(s, W/2 - textWidth(s)/2, H - 24, '#8bd8ff');
    drawText('[R] LEAVE', 4, H - 12, '#5a7a90');
  } else {
    ctx.fillStyle = 'rgba(0, 0, 20, 0.8)';
    ctx.fillRect(0, 0, W*PX, H*PX);
    const pct = classroom.score / classroom.total;
    let title, col;
    if (pct >= 0.95) { title = 'PERFECT'; col = '#ffefa8'; }
    else if (pct >= 0.7) { title = 'GOOD WORK'; col = '#3ac762'; }
    else if (pct >= 0.4) { title = 'PASSING'; col = '#8a7ab5'; }
    else { title = 'FAILED'; col = '#c81616'; }
    drawText(title, W/2 - textWidth(title, 2)/2, 70, col, 2);
    drawText('SCORE ' + classroom.score + '/' + classroom.total, W/2 - textWidth('SCORE ' + classroom.score + '/' + classroom.total)/2, 100, '#e8d9b0');
    drawText('+' + (classroom.score * 2) + ' GOLD', W/2 - textWidth('+' + (classroom.score * 2) + ' GOLD')/2, 115, '#e8c547');
    if (Math.floor(state.time * 2) % 2 === 0) {
      drawText('[SPACE] CONTINUE', W/2 - textWidth('[SPACE] CONTINUE')/2, 145, '#ffefa8');
    }
  }
}

