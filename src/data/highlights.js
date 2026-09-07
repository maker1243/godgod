// =====================================================================
// Highlight Reel - 최근 하이라이트 20개 저장. 매 런의 큰 순간을 자동 캡처.
// state.highlights = [{ts, type, title, subtitle, tier, floor, blessCount}]
// =====================================================================

const HIGHLIGHT_MAX = 20;

function _ensureHighlights() {
  if (!state.highlights) state.highlights = [];
}

function _snapCommon() {
  return {
    ts: Date.now(),
    tier: state.difficulty || 'normal',
    day: state.day || 1,
    floor: (typeof floor !== 'undefined') ? floor : 1,
    room: (typeof currentRoom !== 'undefined') ? (currentRoom + 1) : 1,
    lv: player ? player.level : 1,
    dmg: player ? Math.floor(player.baseDmg * 100) / 100 : 1,
    blessCount: (player && player.blessings) ? player.blessings.length : 0,
    maxCombo: (typeof combo !== 'undefined') ? combo.maxThisRun : 0,
  };
}

function recordHighlight(type, title, subtitle) {
  _ensureHighlights();
  const h = Object.assign({ type, title, subtitle }, _snapCommon());
  state.highlights.unshift(h);
  if (state.highlights.length > HIGHLIGHT_MAX) state.highlights.length = HIGHLIGHT_MAX;
  if (typeof saveAccountData === 'function') saveAccountData();
}

// 자동 트리거 지점들 (다른 파일에서 호출):
function highlightBossKill(e) {
  const name = e._profDef ? e._profDef.name : (e.isTrialBoss ? 'TRIAL BOSS' : 'BOSS');
  recordHighlight('boss', '★ ' + name + ' 격파', 'F' + (typeof floor !== 'undefined' ? floor : 1) + ' · ' + (state.difficulty || 'normal').toUpperCase());
}
function highlightBigCombo(n) {
  if (n >= 20) recordHighlight('combo', 'COMBO x' + n, '연쇄 처치의 극한');
}
function highlightBigHit(dmg, e) {
  if (dmg >= 1e9) recordHighlight('bighit', _fmtHl(dmg) + ' 데미지', '단일 히트');
}
function highlightSynergy(comboName) {
  recordHighlight('synergy', '시너지: ' + comboName, '축복 3장 조합');
}
function highlightProfessorFirst(profName) {
  recordHighlight('professor', '첫 격파: ' + profName, '기억할 순간');
}
function highlightPrincipal() {
  recordHighlight('principal', '★★★ 교장 격파', '아카데미의 왕좌를 무너뜨렸다');
}

function _fmtHl(n) {
  if (n >= 1e12) return (n/1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(1)  + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(1)  + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(1)  + 'k';
  return String(Math.floor(n));
}

function highlightStatus() {
  _ensureHighlights();
  return state.highlights.slice();
}

function _hlTimeStr(ts) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mn = String(d.getMinutes()).padStart(2, '0');
  return mm + '/' + dd + ' ' + hh + ':' + mn;
}
