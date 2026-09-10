// =====================================================================
// Final Branch - 엘라라 유대 10 + 아카데미 진실 시청 후 선택.
// 두 결말: 봉인 부수기 (검은 심장 최종전) OR 봉인 유지 (교장이 됨).
// state.elaraChoice: null | 'break' | 'seal'
// =====================================================================

// 트리거 조건 체크
function canOfferEndingChoice() {
  if (state.elaraChoice) return false;   // 이미 선택
  if (!state.academyTruthSeen) return false;
  if (!state.npcQuests || !state.npcQuests.elara) return false;
  return state.npcQuests.elara.bond >= 10;
}

// 엘라라 선택 다이얼로그
const elaraEnding = {
  active: false,
  cursor: 0,
  message: '',
  messageT: 0,
};

function openElaraEnding() {
  elaraEnding.active = true;
  elaraEnding.cursor = 0;
  elaraEnding.message = '';
  elaraEnding.messageT = 0;
  state.scene = 'elaraEnding';
  // 결말 진입 시 관련 스토리 조각들 획득
  if (typeof unlockStoryFragment === 'function') {
    unlockStoryFragment('elara_true');
    unlockStoryFragment('chronoheart');
  }
}

function updateElaraEnding(dt) {
  if (elaraEnding.messageT > 0) elaraEnding.messageT -= dt;
  if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; elaraEnding.cursor = (elaraEnding.cursor - 1 + 2) % 2; sfx('hit'); }
  if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; elaraEnding.cursor = (elaraEnding.cursor + 1) % 2; sfx('hit'); }
  if (keys['Digit1']) { keys['Digit1']=false; elaraEnding.cursor = 0; _confirmElaraEnding(); }
  if (keys['Digit2']) { keys['Digit2']=false; elaraEnding.cursor = 1; _confirmElaraEnding(); }
  if (keys['Space'] || keys['Enter']) { keys['Space']=false; keys['Enter']=false; _confirmElaraEnding(); }
  if (mouse.down && Array.isArray(window._elaraEndingBtns)) {
    for (const b of window._elaraEndingBtns) {
      if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) {
        mouse.down = false; elaraEnding.cursor = b.idx; _confirmElaraEnding(); return;
      }
    }
  }
}

function _confirmElaraEnding() {
  const choice = elaraEnding.cursor === 0 ? 'break' : 'seal';
  state.elaraChoice = choice;
  if (choice === 'break') {
    state.sealBroken = true;
    showMsg('봉인이 부서졌다! 검은 심장이 깨어난다...', 6);
    state._academyQuakeUntil = performance.now() + 4000;
  } else {
    state.principalAscended = true;
    showMsg('네가 새 교장이 되었다. 교장의 방이 열린다.', 6);
  }
  if (typeof sfx === 'function') sfx('bosskill');
  if (typeof saveAccountData === 'function') saveAccountData();
  elaraEnding.active = false;
  state.scene = 'academy';
}

function renderElaraEnding() {
  ctx.fillStyle = '#050310'; ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();
  ctx.fillStyle = 'rgba(20, 5, 40, 0.9)'; ctx.fillRect(0, 0, W*PX, H*PX);

  drawText('엘라라의 마지막 부탁', W/2 - textWidth('엘라라의 마지막 부탁', 2)/2, 20, '#ffefa8', 2);

  const body = [
    '"이제 진실을 봤어. 봉인의 열쇠는 나의 이름이었어."',
    '"너에게 두 갈래 길이 있어. 잘 생각해."',
    '',
    '엘라라: 어떤 길을 택할래?',
  ];
  for (let i = 0; i < body.length; i++) {
    drawText(body[i], W/2 - textWidth(body[i])/2, 45 + i * 10, '#e8d9b0');
  }

  window._elaraEndingBtns = [];
  const options = [
    { title:'[1] 봉인을 부순다', desc:'검은 심장이 깨어난다. 최종전 → 교장의 150배', color:'#ff2d2d' },
    { title:'[2] 봉인을 유지한다', desc:'네가 새 교장이 된다. 삼관마도 획득 (DMG x3)', color:'#e8c547' },
  ];
  for (let i = 0; i < 2; i++) {
    const y = 100 + i * 30;
    const isSel = elaraEnding.cursor === i;
    const bw = 280, bx = W/2 - bw/2;
    if (isSel) pxDraw(bx, y - 2, bw, 26, '#2a1548');
    pxDraw(bx, y - 2, bw, 1, options[i].color);
    pxDraw(bx, y + 24, bw, 1, options[i].color);
    drawText(options[i].title, bx + 8, y + 2, options[i].color);
    drawText(options[i].desc, bx + 8, y + 12, '#c8b898');
    window._elaraEndingBtns.push({ idx: i, x: bx, y: y - 2, w: bw, h: 28 });
  }
  drawText('WS/1-2 SELECT   SPACE 확정', W/2 - textWidth('WS/1-2 SELECT   SPACE 확정')/2, H - 15, '#8a7ab5');
}

// =====================================================================
// 삼관마도 (Three Crown Magic Sword) - 봉인 유지 시 획득 가능한 특수 아티팩트
// =====================================================================
const THREECROWN_DEF = {
  id: 'god_threecrown',
  name: '삼관마도 (Three Crown Blade)',
  tier: 6,
  color: '#ff00ff',
  desc: 'DMG x3, 삼관 특수 스킬 해금, 캐스트 시 검격 애니메이션',
  apply: (p) => {
    p.baseDmg *= 3;
    p.threecrown = true;   // 캐스트 시 검격 애니 발동
  },
};

// 아티팩트 목록/맵에 등록 (artifacts.js 이후 로드됨)
if (typeof ARTIFACT_DEFS !== 'undefined' && typeof ARTIFACT_BY_ID !== 'undefined') {
  if (!ARTIFACT_BY_ID['god_threecrown']) {
    ARTIFACT_DEFS.push(THREECROWN_DEF);
    ARTIFACT_BY_ID['god_threecrown'] = THREECROWN_DEF;
  }
}

// 매 캐스트 시 검격 이펙트 스폰
function threecrownCastEffect(p, ang) {
  if (!p.threecrown || !entities.fx) return;
  // 큰 화면 검격
  entities.fx.push({ type:'slash', x: p.x, y: p.y, ang: ang, life: 0.28, max: 0.28, len: 28, col: '#ff00ff' });
  entities.fx.push({ type:'ring', x: p.x + Math.cos(ang) * 12, y: p.y + Math.sin(ang) * 12, life: 0.35, max: 0.35, r0: 3, r1: 20, col: '#ffefa8' });
  // 앞으로 나선형 파티클
  for (let i = 0; i < 8; i++) {
    const ox = p.x + Math.cos(ang) * i * 3;
    const oy = p.y + Math.sin(ang) * i * 3;
    spawnParticle(ox, oy, i % 2 ? '#ff00ff' : '#ffefa8', 0.4, 2, 40);
  }
}
