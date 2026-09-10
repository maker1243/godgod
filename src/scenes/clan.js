// =====================================================================
// Clan - 사용자가 만들거나 가입할 수 있는 클랜 시스템.
// state.clan = { name, motto, level, xp, memberCount, buffs, contribToday }
// XP 는 RP 기부로 얻는다. 레벨업 시 영구 버프 상승.
// =====================================================================

const clan = {
  cursor: 0,
  mode: 'main',       // 'main' | 'create_name' | 'create_motto' | 'donate'
  inputBuf: '',
  message: '',
  messageT: 0,
};

const CLAN_LEVELS = [
  { lv:1,  xpReq:0,       dmg:1.00, hp:0,    goldMult:1.00, rpMult:1.00, name:'거리의 파벌' },
  { lv:2,  xpReq:500,     dmg:1.05, hp:5,    goldMult:1.03, rpMult:1.05, name:'뒷골목 결사' },
  { lv:3,  xpReq:2000,    dmg:1.10, hp:12,   goldMult:1.06, rpMult:1.10, name:'인정받는 무리' },
  { lv:4,  xpReq:5000,    dmg:1.18, hp:22,   goldMult:1.10, rpMult:1.18, name:'학원 공식 클랜' },
  { lv:5,  xpReq:12000,   dmg:1.28, hp:35,   goldMult:1.15, rpMult:1.28, name:'명성 있는 클랜' },
  { lv:6,  xpReq:30000,   dmg:1.42, hp:55,   goldMult:1.22, rpMult:1.40, name:'전설의 조직' },
  { lv:7,  xpReq:75000,   dmg:1.60, hp:80,   goldMult:1.30, rpMult:1.55, name:'영웅 결사' },
  { lv:8,  xpReq:180000,  dmg:1.85, hp:120,  goldMult:1.45, rpMult:1.75, name:'제왕 클랜' },
  { lv:9,  xpReq:450000,  dmg:2.15, hp:180,  goldMult:1.65, rpMult:2.00, name:'신화 결사' },
  { lv:10, xpReq:1000000, dmg:2.60, hp:280,  goldMult:2.00, rpMult:2.50, name:'초월 클랜' },
];

function _clanEnsure() {
  if (!state.clan) state.clan = null;
}

function clanCurrentTier() {
  _clanEnsure();
  const c = state.clan;
  if (!c) return null;
  let tier = CLAN_LEVELS[0];
  for (const t of CLAN_LEVELS) if ((c.xp||0) >= t.xpReq) tier = t;
  return tier;
}

function clanNextTier() {
  const c = state.clan; if (!c) return null;
  const idx = CLAN_LEVELS.findIndex(t => t.xpReq > (c.xp||0));
  return idx >= 0 ? CLAN_LEVELS[idx] : null;
}

function clanApplyBuffs(p) {
  const t = clanCurrentTier(); if (!t) return;
  if (typeof p.baseDmg === 'number') p.baseDmg *= t.dmg;
  if (typeof p.maxHp === 'number') p.maxHp += t.hp;
  p.clanGoldMult = t.goldMult;
  p.clanRpMult = t.rpMult;
}

function clanContributeRp(amount) {
  _clanEnsure();
  if (!state.clan) return;
  if ((state.research||0) < amount) { showMsg('연구가 부족합니다.', 2); return; }
  state.research -= amount;
  const prev = clanCurrentTier();
  state.clan.xp = (state.clan.xp||0) + amount;
  state.clan.contribTotal = (state.clan.contribTotal||0) + amount;
  const now = clanCurrentTier();
  if (now && prev && now.lv > prev.lv) {
    showAchievementBanner('클랜 승급', now.name + ' (LV ' + now.lv + ')', '#e8c547');
    if (typeof sfx === 'function') sfx('level');
  }
  if (typeof saveAccountData === 'function') saveAccountData();
}

function openClanScene() {
  clan.cursor = 0; clan.mode = 'main'; clan.inputBuf = '';
  state.scene = 'clan';
}

function updateClan(dt) {
  if (clan.messageT > 0) clan.messageT -= dt;

  if (clan.mode === 'create_name' || clan.mode === 'create_motto') {
    // 텍스트 입력 (실제 캡처는 handleKeydown 훅에서)
    if (keys['Enter']) {
      keys['Enter'] = false;
      if (clan.inputBuf.trim().length < 2) { clan.message = '2자 이상 입력'; clan.messageT = 2; return; }
      if (clan.mode === 'create_name') {
        state.clan = state.clan || { xp:0, contribTotal:0 };
        state.clan.name = clan.inputBuf.trim().slice(0, 20);
        clan.inputBuf = '';
        clan.mode = 'create_motto';
      } else {
        state.clan.motto = clan.inputBuf.trim().slice(0, 40);
        clan.inputBuf = '';
        clan.mode = 'main';
        showAchievementBanner('클랜 창설', state.clan.name, '#e8c547');
        if (typeof sfx === 'function') sfx('jackpot');
        if (typeof saveAccountData === 'function') saveAccountData();
      }
      return;
    }
    if (keys['Backspace']) { keys['Backspace']=false; clan.inputBuf = clan.inputBuf.slice(0, -1); }
    if (keys['Escape']) { keys['Escape']=false; clan.mode = 'main'; clan.inputBuf=''; }
    return;
  }

  if (clan.mode === 'donate') {
    if (keys['Digit1']) { keys['Digit1']=false; clanContributeRp(100); }
    if (keys['Digit2']) { keys['Digit2']=false; clanContributeRp(1000); }
    if (keys['Digit3']) { keys['Digit3']=false; clanContributeRp(10000); }
    if (keys['Digit4']) { keys['Digit4']=false; clanContributeRp(100000); }
    if (keys['Digit5']) { keys['Digit5']=false; clanContributeRp(1000000); }
    if (keys['Escape'] || keys['KeyR']) { keys['Escape']=false; keys['KeyR']=false; clan.mode='main'; }
    return;
  }

  // main
  if (keys['Escape'] || keys['KeyR']) { keys['Escape']=false; keys['KeyR']=false; state.scene='academy'; return; }
  if (keys['KeyC']) { keys['KeyC']=false; if (!state.clan) { clan.mode='create_name'; clan.inputBuf=''; } }
  if (keys['KeyD']) { keys['KeyD']=false; if (state.clan) clan.mode='donate'; }
  if (keys['KeyX'] && state.clan) {
    keys['KeyX']=false;
    // 해체 확인 없이 리셋 - 데모용
    if (confirm && typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('클랜을 해체하시겠습니까? (돌이킬 수 없음)')) {
        state.clan = null;
        if (typeof saveAccountData === 'function') saveAccountData();
      }
    }
  }
}

// 텍스트 입력 훅
function clanKeyPressed(ch) {
  if (state.scene !== 'clan') return false;
  if (clan.mode !== 'create_name' && clan.mode !== 'create_motto') return false;
  if (ch && ch.length === 1 && clan.inputBuf.length < 40) {
    clan.inputBuf += ch;
    return true;
  }
  return false;
}

function renderClan() {
  ctx.fillStyle = '#0e0510'; ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();

  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('클랜 홀 (Clan Hall)', 4, 3, '#e8c547');
  drawText('[R/ESC] 아카데미로', W - textWidth('[R/ESC] 아카데미로') - 4, 3, '#8a7ab5');

  if (clan.mode === 'create_name' || clan.mode === 'create_motto') {
    drawText(clan.mode === 'create_name' ? '클랜 이름 입력' : '클랜 문장 입력 (모토)', W/2 - 40, 40, '#ffefa8', 2);
    const box = clan.inputBuf + (Math.floor(state.time*2)%2 ? '_' : ' ');
    pxDraw(30, 65, W - 60, 20, '#1a0e2e');
    pxDraw(30, 65, W - 60, 1, '#e8c547');
    pxDraw(30, 84, W - 60, 1, '#e8c547');
    drawText(box, 38, 71, '#ffefa8');
    drawText('[Enter] 확정   [Backspace] 지우기   [Esc] 취소', W/2 - 100, 95, '#8a7ab5');
    if (clan.messageT > 0) drawText(clan.message, W/2 - textWidth(clan.message)/2, 115, '#ff6666');
    return;
  }

  if (clan.mode === 'donate') {
    drawText('연구(RP) 기부 → 클랜 XP', W/2 - 60, 25, '#e8c547');
    const tiers = [
      { key:'1', amt:100 },
      { key:'2', amt:1000 },
      { key:'3', amt:10000 },
      { key:'4', amt:100000 },
      { key:'5', amt:1000000 },
    ];
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      drawText('[' + t.key + '] +' + t.amt + ' XP  (RP -' + t.amt + ')', 40, 45 + i * 12, '#c8b898');
    }
    drawText('현재 RP: ' + (state.research||0), 40, 45 + tiers.length * 12 + 10, '#8bd8ff');
    drawText('[R/ESC] 뒤로', W/2 - 30, H - 20, '#8a7ab5');
    return;
  }

  // main
  if (!state.clan) {
    drawText('아직 클랜이 없습니다.', W/2 - 50, 30, '#c8b898');
    drawText('클랜을 창설하고 성장시켜 영구 버프를 받으세요.', W/2 - 100, 45, '#8a7ab5');
    drawText('[C] 클랜 창설', W/2 - 30, 90, '#e8c547');
    drawText('클랜 레벨업 시:', 40, 115, '#ffefa8');
    drawText('- 데미지 배율 상승 (최대 x2.6)', 40, 128, '#c8b898');
    drawText('- 최대 HP 상승 (최대 +280)', 40, 138, '#c8b898');
    drawText('- 골드/RP 획득 배율 상승', 40, 148, '#c8b898');
    return;
  }

  const c = state.clan;
  const t = clanCurrentTier();
  const nt = clanNextTier();

  // 클랜 정보 카드
  pxDraw(15, 20, W - 30, 60, '#1a0e2e');
  pxDraw(15, 20, W - 30, 1, '#e8c547');
  pxDraw(15, 79, W - 30, 1, '#e8c547');
  drawText('[' + t.name + ']', 25, 26, '#e8c547');
  drawText(c.name || '(무명)', 25, 38, '#ffefa8', 2);
  drawText('"' + (c.motto || '(모토 없음)') + '"', 25, 58, '#c8b898');

  // 진행도
  drawText('LEVEL ' + t.lv + '   XP: ' + (c.xp||0), 25, 90, '#8bd8ff');
  if (nt) {
    const pct = Math.min(1, ((c.xp||0) - t.xpReq) / (nt.xpReq - t.xpReq));
    pxDraw(25, 100, W - 50, 6, '#1a0e2e');
    pxDraw(25, 100, Math.floor((W - 50) * pct), 6, '#e8c547');
    drawText('NEXT: ' + nt.name + '  (' + (nt.xpReq - (c.xp||0)) + ' XP 필요)', 25, 108, '#c8b898');
  } else {
    drawText('★ 최고 레벨 도달 ★', 25, 108, '#ff00ff');
  }

  // 현재 버프
  drawText('현재 버프:  DMG x' + t.dmg.toFixed(2) + '   +HP ' + t.hp + '   G x' + t.goldMult.toFixed(2) + '   RP x' + t.rpMult.toFixed(2), 25, 122, '#c86ade');

  // 통계
  drawText('총 기부: ' + (c.contribTotal||0) + ' RP', 25, 140, '#8a7ab5');

  // 액션
  drawText('[D] 기부 (XP 획득)   [X] 해체', W/2 - 90, H - 15, '#e8c547');
}
