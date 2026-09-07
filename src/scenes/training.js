// =====================================================================
// Training Scene (레벨업 수련) - 아카데미에서 [TRAIN] 문으로 진입.
// 훈련 더미와 싸우며 자신의 DPS 에 맞춰 자동 스케일링.
// - 더미: 처음 100k HP → 죽이면 다음 더미 HP = max(peak_dps * 5, prev * 1.4).
// - 15초마다 DPS 를 평가해 보상 RP 지급 (peak * 0.5).
// - R/ESC 로 아카데미 복귀.
// =====================================================================

const training = {
  active: false,
  dummy: null,
  peakDps: 0,
  windowStart: 0,
  windowDmg: 0,
  totalRuns: 0,
  totalDmg: 0,
  message: '',
  messageT: 0,
  room: { x: 30, y: 30, w: 260, h: 150 },
};

function startTraining() {
  training.active = true;
  training.peakDps = 0;
  training.windowStart = performance.now();
  training.windowDmg = 0;
  training.totalRuns = 0;
  training.totalDmg = 0;
  training.message = '';
  training.messageT = 0;
  _spawnTrainingDummy(100000);
  player.x = training.room.x + 30;
  player.y = training.room.y + training.room.h/2;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  currentRoom = 0;
  rooms[0] = { x: training.room.x, y: training.room.y, w: training.room.w, h: training.room.h, isBoss: false, cleared: false };
  state.cam.x = 0; state.cam.y = 0;
  showMsg('레벨업 수련 시작 - 더미를 두들겨라!', 3);
}

function _spawnTrainingDummy(hp) {
  const r = training.room;
  training.dummy = {
    x: r.x + r.w - 40, y: r.y + r.h/2,
    r: 12, hp: hp, maxHp: hp, dmg: 0, speed: 0,
    kind: 'dummy', isTrainingDummy: true,
    hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
    isBoss: false, xp: 0, gold: 0,
  };
  entities.enemies = [training.dummy];
}

function updateTraining(dt) {
  // 씬 진입 자동 시작 (goTo('training') 만으로 startTraining 이 자동 호출됨)
  if (!training.active && state.scene === 'training') startTraining();
  if (!training.active) return;
  if (training.messageT > 0) training.messageT -= dt;

  // 씬 나가기
  if (keys['KeyR'] || keys['Escape']) {
    keys['KeyR']=false; keys['Escape']=false;
    training.active = false;
    entities.enemies = [];
    entities.bullets = [];
    entities.ebullets = [];
    goTo('academy');
    return;
  }

  // 플레이어 (아레나용 로직 재사용) — arena.room 을 임시로 training.room 으로 스왑
  if (typeof updatePlayerArena === 'function') {
    const savedRoom = rooms[currentRoom];
    const savedArena = (typeof arena !== 'undefined') ? arena.room : null;
    rooms[0] = { x: training.room.x, y: training.room.y, w: training.room.w, h: training.room.h, isBoss: false, cleared: false };
    currentRoom = 0;
    if (typeof arena !== 'undefined') arena.room = training.room;
    updatePlayerArena(dt);
    if (typeof arena !== 'undefined' && savedArena) arena.room = savedArena;
    rooms[0] = savedRoom;
  }
  updateBullets(dt);
  // DPS 누적 - 더미 HP 감소분 추적 (render 아닌 update 에서 처리)
  _accumulateDummyDps();
  if (typeof updateFx === 'function') updateFx(dt);
  updateParticles(dt);
  updateFloats(dt);
  state.cam.x = 0; state.cam.y = 0;

  // 더미 사망 → 더 큰 더미 리스폰
  if (training.dummy && training.dummy.hp <= 0) {
    training.totalRuns++;
    const prevHp = training.dummy.maxHp;
    const next = Math.max(Math.floor(training.peakDps * 5), Math.floor(prevHp * 1.4));
    // 파티클 폭발
    for (let i = 0; i < 20; i++) spawnParticle(training.dummy.x, training.dummy.y, '#3ac762', 0.6, 3, 80);
    spawnFloat(training.dummy.x, training.dummy.y - 8, 'HP +' + Math.floor(((next - prevHp) / prevHp) * 100) + '%', '#3ac762');
    _spawnTrainingDummy(next);
    if (typeof sfx === 'function') sfx('level');
  }

  // 15초 창 평가 - DPS 계산 후 리셋
  const now = performance.now();
  const dur = (now - training.windowStart) / 1000;
  if (dur >= 15) {
    const dps = Math.floor(training.windowDmg / dur);
    training.peakDps = Math.max(training.peakDps, dps);
    const reward = Math.floor(dps * 0.5);
    state.research = (state.research || 0) + reward;
    training.message = 'DPS ' + _fmtBig(dps) + '  →  +' + _fmtBig(reward) + ' RP';
    training.messageT = 3;
    training.windowDmg = 0;
    training.windowStart = now;
    if (typeof sfx === 'function') sfx('pickup');
    if (typeof saveAccountData === 'function') saveAccountData();
  }
}

// updateBullets 에서 스폰된 spawnFloat 텍스트를 훑어 damage 카운트 - 대신 더미 hp 감소량으로 근사
// (updateBullets 훅 없이 프레임간 hp 차이로 windowDmg 를 추정)
let _prevDummyHp = 0;
function _accumulateDummyDps() {
  if (!training.active || !training.dummy) return;
  const cur = training.dummy.hp;
  if (_prevDummyHp === 0) _prevDummyHp = training.dummy.maxHp;
  const delta = _prevDummyHp - cur;
  if (delta > 0) { training.windowDmg += delta; training.totalDmg += delta; }
  _prevDummyHp = (cur <= 0) ? training.dummy.maxHp : cur;
}

function _fmtBig(n) {
  if (n >= 1e12) return (n/1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(2)  + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(2)  + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(2)  + 'k';
  return String(n);
}

function renderTraining() {
  if (!training.active) return;
  // 배경
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, W*PX, H*PX);
  // 방
  const r = training.room;
  ctx.fillStyle = '#20143a';
  ctx.fillRect(r.x*PX, r.y*PX, r.w*PX, r.h*PX);
  // 격자
  ctx.fillStyle = '#2e1a4a';
  for (let x = r.x; x < r.x + r.w; x += 16) for (let y = r.y; y < r.y + r.h; y += 16) {
    if (((x/16 + y/16) & 1) === 0) ctx.fillRect(x*PX, y*PX, 16*PX, 16*PX);
  }
  // 벽
  ctx.fillStyle = '#5a2e8c';
  ctx.fillRect((r.x-4)*PX, (r.y-4)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, (r.y+r.h)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, r.y*PX, 4*PX, r.h*PX);
  ctx.fillRect((r.x+r.w)*PX, r.y*PX, 4*PX, r.h*PX);

  // 더미 렌더 (샌드백)
  const d = training.dummy;
  if (d) {
    pxDraw(d.x - 8, d.y - 12, 16, 24, '#8a5a30');   // 몸통
    pxDraw(d.x - 6, d.y - 10, 12, 20, '#c8a888');   // 밝은
    pxDraw(d.x - 2, d.y - 8, 4, 4, '#5a3a20');      // 눈
    // 히트 플래시
    if (d.hitFlash > 0) {
      ctx.globalAlpha = 0.7;
      pxDraw(d.x - 8, d.y - 12, 16, 24, '#fff');
      ctx.globalAlpha = 1;
    }
    // HP 바
    const w = 40;
    pxDraw(d.x - w/2, d.y - 20, w, 2, '#3a0a0a');
    pxDraw(d.x - w/2, d.y - 20, w * clamp(d.hp / d.maxHp, 0, 1), 2, '#c81616');
    drawText(_fmtBig(Math.max(0, Math.ceil(d.hp))) + '/' + _fmtBig(d.maxHp), d.x - textWidth(_fmtBig(Math.max(0, Math.ceil(d.hp))) + '/' + _fmtBig(d.maxHp))/2, d.y - 28, '#e8d9b0');
  }

  // 아군 발사체 + FX
  for (const b of entities.bullets) drawBullet(b);
  if (typeof drawFx === 'function') drawFx();
  // 파티클/플로트
  for (const p of entities.particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    pxDraw(p.x - p.size/2, p.y - p.size/2, p.size, p.size, p.color);
  }
  ctx.globalAlpha = 1;
  for (const f of entities.floats) {
    ctx.globalAlpha = clamp(f.life, 0, 1);
    const scale = f.scale || 1;
    drawText(f.text, f.x - textWidth(f.text, scale)/2, f.y - 8, f.color, scale);
    ctx.globalAlpha = 1;
  }
  drawPlayer(player.x, player.y, true);

  // HUD 상단
  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('레벨업 수련', 4, 3, '#ffefa8');
  const info = 'PEAK DPS: ' + _fmtBig(training.peakDps) + '   RUNS: ' + training.totalRuns + '   RP: ' + _fmtBig(state.research || 0);
  drawText(info, W - textWidth(info) - 4, 3, '#8bd8ff');

  // 현재 창 진행 게이지 (15초)
  const now = performance.now();
  const dur = (now - training.windowStart) / 1000;
  const pct = Math.min(1, dur / 15);
  pxDraw(4, 14, 100, 3, '#3a1e5c');
  pxDraw(4, 14, 100 * pct, 3, '#e8c547');
  drawText('DPS 창: ' + dur.toFixed(1) + 's / 15s   현재 DMG: ' + _fmtBig(training.windowDmg), 4, 18, '#c8b898');

  // 결과 메시지
  if (training.messageT > 0) {
    ctx.globalAlpha = Math.min(1, training.messageT / 0.5);
    drawText(training.message, W/2 - textWidth(training.message)/2, 40, '#ffefa8');
    ctx.globalAlpha = 1;
  }

  drawText('[R/ESC] 나가기', W/2 - textWidth('[R/ESC] 나가기')/2, H - 8, '#5a4a80');
}
