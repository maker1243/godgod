// =====================================================================
// Death / ending
// =====================================================================

// ---------- 사망/엔딩 ----------
let endingT = 0;
function updateDead(dt) {}

function updateEnding(dt) {
  endingT += dt;
  if (endingT < 0.5) return;
  if (keys['Space'] || keys['Enter']) {
    keys['Space'] = false; keys['Enter'] = false;
    endingT = 0;
    // 결과 정산 (난이도 티어의 gpaFinalMult/rpBossMult 로 스케일)
    const diff = (typeof currentDifficulty === 'function') ? currentDifficulty() : { gpaFinalMult:1, rpBossMult:1 };
    const gMul = diff.gpaFinalMult || 1;
    const rMul = diff.rpBossMult || 1;
    if (state.runResult === 'final') {
      const rp = Math.round(50 * rMul);
      const gpaGain = 0.6 * gMul;
      state.research += rp;
      state.gold += 200;
      state.gpa = state.gpa + gpaGain;
      state.finalCleared = (state.finalCleared || 0) + 1;
      showMsg('THE CORE FALLS. +' + rp + ' RP  +' + gpaGain.toFixed(2) + ' GPA', 4);
      saveAccountData();
    } else if (state.runResult === 'clear') {
      state.research += Math.round(10 * floor * rMul);
      state.gold += 30 * floor;
      state.gpa = state.gpa + 0.2 * gMul;
    } else if (state.runResult === 'retreat') {
      state.research += Math.round(Math.max(1, floor) * rMul);
      state.gpa = state.gpa + 0.1 * gMul;
    } else if (state.runResult === 'dead') {
      state.gold = Math.floor(state.gold * 0.5);
      state.gpa = Math.max(0, state.gpa - 0.4);
    }
    goTo('academy');
  }
}

