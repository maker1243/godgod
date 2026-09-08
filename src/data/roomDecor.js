// =====================================================================
// Room Decorations - 던전 방에 랜덤 배경 장식.
// 기둥, 웅덩이, 균열, 깃발 등. 순수 시각용 (전투에 영향 없음).
// =====================================================================

const DECOR_TYPES = [
  // 각 타입: draw(x, y, room, seed)
  { id:'pillar', weight: 3, draw(x, y) {
    // 3x8 돌기둥
    for (let dy = 0; dy < 8; dy++) pxDraw(x, y + dy, 3, 1, dy < 2 ? '#5a4a80' : '#3a1e5c');
    pxDraw(x, y + 6, 3, 2, '#1a0e2e');
  } },
  { id:'crack', weight: 5, draw(x, y, seed) {
    const s = seed & 0xf;
    for (let i = 0; i < 4; i++) {
      const ox = ((s + i) * 3) % 12;
      const oy = ((s + i) * 5) % 3;
      pxDraw(x + ox, y + oy, 1, 1, '#050510');
    }
  } },
  { id:'skull', weight: 2, draw(x, y) {
    pxDraw(x, y, 4, 3, '#e8dcb0');
    pxDraw(x + 1, y + 1, 1, 1, '#050510');
    pxDraw(x + 2, y + 1, 1, 1, '#050510');
    pxDraw(x, y + 3, 4, 1, '#5a4a30');
  } },
  { id:'puddle', weight: 3, draw(x, y, seed) {
    pxDraw(x, y + 1, 6, 2, '#0a1a3a');
    pxDraw(x + 1, y, 4, 1, '#0a1a3a');
    pxDraw(x + 1, y + 3, 4, 1, '#0a1a3a');
    // 반짝임
    if (Math.sin(state.time * 3 + seed) > 0.5) pxDraw(x + 2, y + 1, 1, 1, '#8bd8ff');
  } },
  { id:'candle', weight: 2, draw(x, y, seed) {
    // 캔들 스탠드
    pxDraw(x + 1, y + 2, 2, 4, '#3a1e5c');
    pxDraw(x, y + 6, 4, 1, '#1a0e2e');
    // 불꽃
    const flicker = 0.5 + Math.sin(state.time * 8 + seed) * 0.5;
    ctx.globalAlpha = 0.8;
    pxDraw(x + 1, y + 1, 2, 1, '#ff9c3d');
    pxDraw(x + 1, y, 2, 1, flicker > 0.5 ? '#ffefa8' : '#ff2d2d');
    ctx.globalAlpha = 1;
    // 오라
    ctx.fillStyle = 'rgba(255, 156, 61, ' + (0.15 * flicker).toFixed(2) + ')';
    ctx.fillRect((x - 4)*PX, (y - 4)*PX, 12*PX, 12*PX);
  } },
  // (제거: chest_closed 장식품 — 실제 여는 상자와 헷갈림)
  { id:'moss', weight: 4, draw(x, y, seed) {
    pxDraw(x, y, 6, 2, '#1a4a20');
    pxDraw(x + 1, y + 2, 4, 1, '#3ac762');
    if ((seed & 1) === 0) pxDraw(x + 2, y - 1, 2, 1, '#3ac762');
  } },
];

// Decor 목록을 방마다 생성
function generateRoomDecor(room) {
  if (room._decor) return room._decor;
  const pool = DECOR_TYPES.slice();
  const weighted = [];
  for (const d of pool) for (let i = 0; i < d.weight; i++) weighted.push(d);
  const count = 4 + Math.floor(Math.random() * 5);   // 4~8
  const list = [];
  for (let i = 0; i < count; i++) {
    const d = weighted[Math.floor(Math.random() * weighted.length)];
    // 벽 근처 우선
    const nearWall = Math.random() < 0.5;
    let x, y;
    if (nearWall) {
      if (Math.random() < 0.5) {
        x = room.x + 6 + Math.floor(Math.random() * (room.w - 20));
        y = (Math.random() < 0.5) ? (room.y + 4) : (room.y + room.h - 12);
      } else {
        x = (Math.random() < 0.5) ? (room.x + 6) : (room.x + room.w - 12);
        y = room.y + 12 + Math.floor(Math.random() * (room.h - 24));
      }
    } else {
      x = room.x + 20 + Math.floor(Math.random() * (room.w - 40));
      y = room.y + 20 + Math.floor(Math.random() * (room.h - 40));
    }
    list.push({ type: d.id, x, y, seed: Math.floor(Math.random() * 256) });
  }
  room._decor = list;
  return list;
}

function drawRoomDecor(room) {
  if (!room) return;
  const list = generateRoomDecor(room);
  for (const d of list) {
    const def = DECOR_TYPES.find(t => t.id === d.type);
    if (def) { try { def.draw(d.x, d.y, d.seed); } catch(_){} }
  }
}
