// =====================================================================
// Level-up trigger
// =====================================================================

// ---------- 레벨업 ----------
let perkChoices = [];
function pickPerks() {
  perkChoices = [];
  const pool = [...PERK_POOL];
  for (let i = 0; i < 3; i++) {
    if (pool.length === 0) break;
    const idx = randi(0, pool.length);
    perkChoices.push(pool[idx]);
    pool.splice(idx, 1);
  }
}
function updateLevelUp(dt) {
  // 마우스/터치 클릭으로 카드 선택 (renderLevelUp 의 cardW=80, cardH=70, gap=10, y=70)
  if (mouse.down && perkChoices.length) {
    const cardW = 92, cardH = 78, gap = 8;
    const total = perkChoices.length * cardW + (perkChoices.length - 1) * gap;
    const sx = W/2 - total/2;
    const cy = 70;
    if (mouse.y >= cy - 2 && mouse.y <= cy + cardH + 2) {
      for (let i = 0; i < perkChoices.length; i++) {
        const cx = sx + i * (cardW + gap);
        if (mouse.x >= cx - 2 && mouse.x <= cx + cardW + 2) {
          keys['Digit' + (i+1)] = true;
          mouse.down = false;   // 다중 트리거 방지
          break;
        }
      }
    }
  }
  for (let i = 0; i < perkChoices.length; i++) {
    if (keys['Digit' + (i+1)]) {
      keys['Digit' + (i+1)] = false;
      perkChoices[i].apply(player);
      state.scene = 'dungeon';
      showMsg('ACQUIRED: ' + perkChoices[i].name, 2);
      sfx('level');
      break;   // 한 번에 하나만
    }
  }
}

