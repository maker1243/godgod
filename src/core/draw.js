// =====================================================================
// Pixel drawing helpers
// =====================================================================

// ---------- 픽셀 그리기 헬퍼 ----------
function pxDraw(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x) * PX, Math.floor(y) * PX, w * PX, h * PX);
}
function pxDrawSub(x, y, w, h, color) {
  // 서브픽셀 없이 정수 반올림
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x) * PX, Math.round(y) * PX, w * PX, h * PX);
}

// 스프라이트를 문자열 배열로 정의하고 색상 팔레트로 그림
function drawSprite(sprite, palette, x, y, flipX = false) {
  const h = sprite.length;
  const w = sprite[0].length;
  for (let ry = 0; ry < h; ry++) {
    for (let rx = 0; rx < w; rx++) {
      const c = sprite[ry][rx];
      if (c === '.' || c === ' ') continue;
      const col = palette[c];
      if (!col) continue;
      const drawX = flipX ? (x + (w - 1 - rx)) : (x + rx);
      pxDraw(drawX, y + ry, 1, 1, col);
    }
  }
}

