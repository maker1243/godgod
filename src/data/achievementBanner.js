// =====================================================================
// Achievement Banner - 업적 달성 시 화려한 슬라이드 배너 오버레이.
// checkAchievements 에서 showAchievementBanner 호출.
// =====================================================================

const achBanner = {
  queue: [],
  active: null,
  t: 0,           // 0~3 시간
};

function showAchievementBanner(name, subtitle, iconColor) {
  achBanner.queue.push({
    name: name,
    sub: subtitle || '업적 달성!',
    color: iconColor || '#ffefa8',
  });
}

function updateAchievementBanner(dt) {
  if (!achBanner.active && achBanner.queue.length > 0) {
    achBanner.active = achBanner.queue.shift();
    achBanner.t = 0;
  }
  if (achBanner.active) {
    achBanner.t += dt;
    if (achBanner.t >= 3.5) {
      achBanner.active = null;
    }
  }
}

function drawAchievementBanner() {
  if (!achBanner.active) return;
  const a = achBanner.active;
  const t = achBanner.t;
  // 슬라이드 인 (0~0.4), hold (0.4~3), 슬라이드 아웃 (3~3.5)
  let x = 0;
  if (t < 0.4) x = -100 * (1 - t / 0.4);
  else if (t > 3) x = -100 * ((t - 3) / 0.5);
  const bw = 240, bh = 32;
  const bx = W/2 - bw/2 + x;
  const by = 30;
  // 배경 (그림자 + 본체)
  pxDraw(bx + 2, by + 2, bw, bh, 'rgba(0,0,0,0.6)');
  pxDraw(bx, by, bw, bh, '#1a0e2e');
  // 위 아래 컬러 스트라이프
  pxDraw(bx, by, bw, 2, a.color);
  pxDraw(bx, by + bh - 2, bw, 2, a.color);
  // 좌 아이콘
  const iconX = bx + 8, iconY = by + 8;
  const iconGlow = 0.7 + Math.sin(state.time * 8) * 0.3;
  ctx.globalAlpha = iconGlow;
  pxDraw(iconX, iconY, 16, 16, a.color);
  pxDraw(iconX + 4, iconY + 4, 8, 8, '#ffffff');
  ctx.globalAlpha = 1;
  drawText('★', iconX + 5, iconY + 4, '#1a0e2e');
  // 헤더
  drawText('업적 달성!', bx + 32, by + 6, a.color);
  // 이름 (더 크게 - 여기서는 그냥 스케일 1 로)
  drawText(a.name, bx + 32, by + 16, '#ffefa8');
  // 서브
  drawText(a.sub, bx + 32, by + 24, '#8a7ab5');
}
