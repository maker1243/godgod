// =====================================================================
// 1v1 duel
// =====================================================================

// =====================================================================
// AI 대전 (1v1 듀얼)
// =====================================================================
const duel = {
  room: { x: 30, y: 30, w: 260, h: 150 },
  enemy: null,
  eBullets: [],
  playerBullets: [],
  timer: 0,
  outcome: null,        // 'win' | 'lose' | null (해당 라운드)
  timerLeft: 60,
  difficulty: 'normal',
  isRoom: false,
  // 5선승제 (best-of-5, 먼저 3승)
  seriesTarget: 3,      // 3승이면 시리즈 승리
  playerWins: 0,
  enemyWins: 0,
  seriesRound: 1,
  seriesOver: false,
  gpaDelta: 0,          // 시리즈 종료 시 GPA 변화량
};

function startAIDuel(diff) {
  const d = aiDifficulties.find(x => x.id === diff) || aiDifficulties[1];
  duel.difficulty = diff;
  duel.isRoom = false;
  // 5선승제 초기화
  duel.playerWins = 0;
  duel.enemyWins = 0;
  duel.seriesRound = 1;
  duel.seriesOver = false;
  duel.gpaDelta = 0;
  setupDuel(createAIOpponent(d));
}

function startNextRound() {
  duel.seriesRound++;
  const d = aiDifficulties.find(x => x.id === duel.difficulty) || aiDifficulties[1];
  setupDuel(createAIOpponent(d));
}

function startRoomDuel(code) {
  duel.isRoom = true;
  const loadout = arenaMenu.loadedLoadout;
  setupDuel(createOpponentFromLoadout(loadout, code));
}

function setupDuel(enemy) {
  clearEntities();
  player = createPlayer();
  player.x = duel.room.x + 30;
  player.y = duel.room.y + duel.room.h/2;
  // 대전 시작 시 풀 HP/MP
  player.hp = player.maxHp;
  player.mp = player.maxMp;

  duel.enemy = enemy;
  duel.enemy.x = duel.room.x + duel.room.w - 30;
  duel.enemy.y = duel.room.y + duel.room.h/2;

  duel.timer = 0;
  duel.outcome = null;
  duel.timerLeft = 90;
  state.cam.x = 0; state.cam.y = 0;

  // 진 사람 버프: 시리즈에서 상대가 나보다 앞서 있으면 스택 수 만큼 강화.
  // (aiEval win/lose 라운드 종료 후 startNextRound 로 진입한 뒤에 적용됨)
  const behind = Math.max(0, (duel.enemyWins || 0) - (duel.playerWins || 0));
  if (behind > 0) {
    const hpBonus = 30 * behind;
    const dmgMult = 1 + 0.25 * behind;
    const spdMult = 1 + 0.08 * behind;
    player.maxHp += hpBonus;
    player.hp = player.maxHp;
    player.baseDmg *= dmgMult;
    player.speed *= spdMult;
    player.dmgReduction = (player.dmgReduction || 0) + Math.min(0.35, 0.1 * behind);
    showMsg('LOSER BUFF x' + behind + ' — +' + hpBonus + ' HP, DMG x' + dmgMult.toFixed(2), 3);
  }

  showMsg('DUEL: ' + duel.enemy.name.toUpperCase(), 2.5);
  sfx('boss');
}

// AI 상대 생성 (난이도 기반)
function createAIOpponent(diffObj) {
  const enemy = baseOpponent();
  enemy.name = diffObj.name;
  enemy.reactTime = diffObj.react;
  // 스탯 스케일
  enemy.baseDmg *= diffObj.mult;
  enemy.maxHp = Math.floor(120 * diffObj.mult);
  enemy.hp = enemy.maxHp;
  enemy.maxMp = 80;
  enemy.mp = enemy.maxMp;
  // 스킬셋 - 난이도별 다르게
  if (diffObj.id === 'easy') {
    enemy.slots = { lmb:'m01', q:null, e:null };
  } else if (diffObj.id === 'normal') {
    enemy.slots = { lmb:'m01', q:'m05', e:null };  // 파이어+아이스
    enemy.dmgReduction = 0.1;
  } else if (diffObj.id === 'hard') {
    enemy.slots = { lmb:'e01', q:'e06', e:'e11' };  // 공학
    enemy.dmgReduction = 0.2;
    enemy.crit = 0.15;
  } else {  // nightmare
    enemy.slots = { lmb:'m11', q:'m10', e:'m14' };  // 라이트닝+블리자드+타임스탑
    enemy.dmgReduction = 0.3;
    enemy.crit = 0.25;
    enemy.hpRegen = 2;
  }
  return enemy;
}

// 로드아웃 기반 상대 생성 (룸)
function createOpponentFromLoadout(loadout, code) {
  const enemy = baseOpponent();
  enemy.name = 'GHOST ' + (code || '????');
  enemy.reactTime = 0.15;
  // 로드아웃의 owned 스킬을 실제로 적용
  if (loadout && loadout.owned && loadout.slots) {
    enemy.slots = { lmb: loadout.slots.lmb, q: loadout.slots.q, e: loadout.slots.e };
    for (const id of Object.keys(loadout.owned)) {
      const s = SKILL_BY_ID[id];
      if (!s || !s.effect) continue;
      const lv = loadout.owned[id];
      for (let i = 0; i < lv; i++) s.effect(enemy, i+1);
    }
  } else {
    enemy.slots = { lmb:'m01', q:null, e:null };
  }
  return enemy;
}

// 상대의 기본 스탯 구조 (플레이어와 유사, 함수는 없음)
function baseOpponent() {
  return {
    x: 0, y: 0, vx: 0, vy: 0, r: 6,
    speed: 55, facing: -1,
    hp: 100, maxHp: 100, mp: 60, maxMp: 60,
    baseDmg: 1, cdMult: 1,
    mods: { fire: 1, ice: 1, lmbCd: 1, lmbDmg: 1 },
    slots: { lmb: null, q: null, e: null },
    cd: {},
    dmgReduction: 0, lifesteal: 0, thorns: 0, crit: 0, critMult: 2, mpCostMult: 1,
    hpRegen: 0, mpRegenBonus: 0,
    perks: [],
    hitFlash: 0, invuln: 0, animT: 0,
    isEnemy: true,
    aiState: 'idle',      // 'idle' | 'approach' | 'retreat' | 'attack'
    aiTimer: 0,
    _mvAng: null,
    reactTime: 0.2,
    name: 'DUELIST',
    dodgeCd: 0,
    strategy: 'balanced',
  };
}

// AI 발사체 (플레이어에게 피해 주는) - 아군 castSlot을 상대용으로 개조
function opponentCast(o, slotName, ang) {
  const skillId = o.slots[slotName];
  if (!skillId) return false;
  const s = SKILL_BY_ID[skillId];
  if (!s || !s.cast) return false;
  const lv = 1;
  const mpCost = Math.ceil(_resolve(s.mp, lv, 0) * (o.mpCostMult || 1));
  if (o.mp < mpCost) return false;
  if ((o.cd[skillId] || 0) > 0) return false;
  o.mp -= mpCost;
  o.cd[skillId] = _resolve(s.cd, lv, 0) * (o.cdMult || 1);
  // 상대 발사체는 특별 태그로 spawn - 임시로 bullets에 넣지 않고 duel.opBullets에 넣음
  // 여기서는 castSlot의 훅을 재사용하지 않고 직접 발사체 생성
  spawnOpponentShot(o, ang, s, lv);
  return true;
}

function spawnOpponentShot(o, ang, s, lv) {
  // 대부분의 스킬은 spread + speed + dmg 패턴
  // 간단히 스킬 이름/카테고리로 분기
  const dmg = (s.cast.name === 'nova') ? 15 : 12;  // 기본
  // 스킬별 표현 - 여기선 스킬을 실제 시전하지 않고 유사한 상대 발사체 하나만 소환
  const speed = 150 + (s.slot === 'lmb' ? 40 : 0);
  entities.ebullets.push({
    x: o.x + Math.cos(ang) * 6, y: o.y + Math.sin(ang) * 6,
    vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
    r: 3, dmg: 8 + o.baseDmg * 8, life: 2.0, kind: 'shadow',
  });
  // Q/E 스킬은 3방향
  if (s.slot === 'q' || s.slot === 'e') {
    for (const off of [-0.3, 0.3]) {
      entities.ebullets.push({
        x: o.x, y: o.y,
        vx: Math.cos(ang+off) * speed * 0.9, vy: Math.sin(ang+off) * speed * 0.9,
        r: 3, dmg: 6 + o.baseDmg * 6, life: 2.0, kind: 'shadow',
      });
    }
  }
  sfx(s.slot === 'lmb' ? 'fire' : 'ice');
}

// AI 상대 업데이트
function updateOpponent(o, dt) {
  if (o.hitFlash > 0) o.hitFlash -= dt;
  if (o.invuln > 0) o.invuln -= dt;
  if (o.dodgeCd > 0) o.dodgeCd -= dt;
  for (const k in o.cd) o.cd[k] = Math.max(0, o.cd[k] - dt);
  // MP regen
  o.mp = Math.min(o.maxMp, o.mp + (4 + o.mpRegenBonus) * dt);
  if (o.hpRegen) o.hp = Math.min(o.maxHp, o.hp + o.hpRegen * dt);

  o.aiTimer += dt;
  o.animT = (o.animT || 0) + dt;

  const d = dist(o, player);
  const ang = angleTo(o, player);

  // === 이동은 매 프레임 연속으로 (기존엔 reactTime 마다 한 번씩 큰 스텝으로 튀어서 사라진 것처럼 보였음) ===
  // 이동 방향은 캐시된 mvAng 을 쓰고, reactTime 마다만 재결정.
  if (o._mvAng == null || (o.aiTimer >= o.reactTime)) {
    // 회피: 가까운 플레이어 발사체가 있으면 옆으로 이동
    let dodgeAng = null;
    for (const b of entities.bullets) {
      const bd = dist(b, o);
      if (bd < 20 && o.dodgeCd <= 0) {
        const bang = Math.atan2(b.vy, b.vx);
        dodgeAng = bang + Math.PI/2 * (Math.random() < 0.5 ? 1 : -1);
        o.dodgeCd = 0.4;
        break;
      }
    }
    if (dodgeAng !== null) o._mvAng = dodgeAng;
    else if (d < 40)       o._mvAng = ang + Math.PI;              // 너무 가까우면 후퇴
    else if (d > 100)      o._mvAng = ang;                        // 너무 멀면 접근
    else                   o._mvAng = ang + Math.PI/2 + Math.sin(o.animT * 2) * 0.5;   // 원 그리며 이동
  }
  const nx = o.x + Math.cos(o._mvAng) * o.speed * dt;
  const ny = o.y + Math.sin(o._mvAng) * o.speed * dt;
  o.x = clamp(nx, duel.room.x + 8, duel.room.x + duel.room.w - 8);
  o.y = clamp(ny, duel.room.y + 8, duel.room.y + duel.room.h - 8);

  // === 사격/시전은 반응 시간마다만 ===
  if (o.aiTimer < o.reactTime) return;
  o.aiTimer = 0;

  // 조준 오차 (난이도 낮을수록 오차 큼)
  const aimError = o.reactTime * 0.5 * (Math.random() - 0.5);
  const shootAng = ang + aimError;

  // 시전: 우선순위 LMB > Q > E
  if (opponentCast(o, 'lmb', shootAng)) return;
  if (opponentCast(o, 'q', shootAng)) return;
  if (opponentCast(o, 'e', shootAng)) return;
}

// AI 발사체가 플레이어와 충돌 - 기존 updateEBullets가 처리하지만, 
// duel 모드에서는 shielding/reflect가 정상 동작해야 함 (기존 damagePlayer 통해)
// 발사체 → 상대 충돌은 updateBullets에 상대를 적으로 넣지 않으므로 수동 처리
function checkDuelHits(dt) {
  // 아군 발사체(entities.bullets)가 상대에 맞는지
  const o = duel.enemy;
  if (!o) return;
  for (let i = entities.bullets.length - 1; i >= 0; i--) {
    const b = entities.bullets[i];
    if (dist(b, o) < b.r + o.r) {
      let dmg = b.dmg;
      // 상대 감소
      if (o.dmgReduction) dmg *= (1 - Math.min(0.75, o.dmgReduction));
      o.hp -= dmg;
      o.hitFlash = 0.15;
      spawnFloat(o.x, o.y - 6, Math.ceil(dmg), '#ffefa8');
      spawnParticle(b.x, b.y, b.kind === 'fire' ? '#ff9c3d' : '#8bd8ff', 0.3, 6, 50);
      state.shake = Math.max(state.shake, 2);
      sfx('hit');
      if (player.lifesteal) player.hp = Math.min(player.maxHp, player.hp + player.lifesteal);
      b.hits = (b.hits || 0) + 1;
      const pierce = b.pierce || hasPerk('lmbpierce');
      if (!pierce || b.hits >= 3) { entities.bullets.splice(i, 1); }
    }
  }
}

function updateAIDuel(dt) {
  if (duel.outcome) return;
  duel.timer += dt;
  duel.timerLeft -= dt;

  // 플레이어 (아레나용 로직 재사용)
  const savedRooms = rooms.slice();
  rooms[0] = duel.room;
  currentRoom = 0;
  updatePlayerArena(dt);
  // 발사체 이동/충돌
  updateBullets(dt);
  updateEBullets(dt);
  if (typeof updateFx === 'function') updateFx(dt);
  updateParticles(dt);
  updateFloats(dt);
  // 상대 업데이트
  updateOpponent(duel.enemy, dt);
  // 아군 → 상대 충돌
  checkDuelHits(dt);

  // 상대 사망
  if (duel.enemy.hp <= 0) {
    setTimeout(() => onRoundEnd('win'), 1200);
    duel.enemy.hp = 0;    // 재트리거 방지
    state.shake = 12;
    spawnParticle(duel.enemy.x, duel.enemy.y, '#ffefa8', 1.0, 40, 120);
    sfx('level');
  }
  // 플레이어 사망
  else if (player.hp <= 0) {
    setTimeout(() => onRoundEnd('lose'), 1200);
    player.hp = 0;
    sfx('die');
  }
  // 시간 초과 - HP 비율로 승부
  else if (duel.timerLeft <= 0) {
    const outcome = (player.hp / player.maxHp) > (duel.enemy.hp / duel.enemy.maxHp) ? 'win' : 'lose';
    setTimeout(() => onRoundEnd(outcome), 800);
    duel.timerLeft = 999;    // 재트리거 방지
  }

  if (keys['KeyR']) { keys['KeyR']=false; onRoundEnd('lose'); }
}

function renderDuel() {
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, W*PX, H*PX);
  // 방
  const r = duel.room;
  ctx.fillStyle = '#20143a';
  ctx.fillRect(r.x*PX, r.y*PX, r.w*PX, r.h*PX);
  ctx.fillStyle = '#2e1a4a';
  for (let x = r.x; x < r.x + r.w; x += 16) {
    for (let y = r.y; y < r.y + r.h; y += 16) {
      if (((x/16 + y/16) & 1) === 0) ctx.fillRect(x*PX, y*PX, 16*PX, 16*PX);
    }
  }
  // 결투장 링
  ctx.strokeStyle = 'rgba(232, 197, 71, 0.4)';
  ctx.lineWidth = PX;
  ctx.beginPath();
  ctx.arc((r.x+r.w/2)*PX, (r.y+r.h/2)*PX, 55*PX, 0, Math.PI*2);
  ctx.stroke();
  // 벽
  ctx.fillStyle = '#5a2e8c';
  ctx.fillRect((r.x-4)*PX, (r.y-4)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, (r.y+r.h)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, r.y*PX, 4*PX, r.h*PX);
  ctx.fillRect((r.x+r.w)*PX, r.y*PX, 4*PX, r.h*PX);

  // 발사체
  for (const b of entities.ebullets) {
    pxDraw(b.x - 2, b.y - 2, 5, 5, '#3a1a5c');
    pxDraw(b.x - 1, b.y - 1, 3, 3, '#7d4dbf');
  }
  for (const b of entities.bullets) drawBullet(b);
  if (typeof drawFx === 'function') drawFx();

  // 상대 렌더링 - 반전된 플레이어 스프라이트
  const o = duel.enemy;
  if (o.hitFlash > 0) {
    // 히트 플래시
    const pal = {};
    for (const k in PLAYER_PAL) pal[k] = '#fff';
    drawSprite(o.animT % 0.4 < 0.2 ? SPR_PLAYER_S1 : SPR_PLAYER_S2, pal, o.x - 6, o.y - 7, true);
  } else {
    // 상대 팔레트 (붉은 계열)
    const pal = { ...PLAYER_PAL, '7':'#5a1a1a', '9':'#c81616', '4':'#8a2a2a', '8':'#ffaaaa' };
    drawSprite(o.animT % 0.4 < 0.2 ? SPR_PLAYER_S1 : SPR_PLAYER_S2, pal, o.x - 6, o.y - 7, true);
  }
  // 상대 이름
  drawText(o.name, o.x - textWidth(o.name)/2, o.y - 14, '#c81616');

  // 플레이어
  drawPlayer(player.x, player.y, true);

  // 파티클
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

  // HUD
  pxDraw(0, 0, W, 18, 'rgba(0,0,0,0.7)');
  // 플레이어 HP 바
  drawText('YOU', 4, 3, '#8bd8ff');
  pxDraw(4, 11, 100, 4, '#3a0a0a');
  pxDraw(4, 11, 100 * clamp(player.hp/player.maxHp, 0, 1), 4, '#3ac762');
  drawText(Math.max(0,Math.ceil(player.hp)) + '/' + player.maxHp, 108, 10, '#e8d9b0');
  // 상대 HP 바 (우측)
  drawText(o.name, W - textWidth(o.name) - 4, 3, '#c81616');
  pxDraw(W - 104, 11, 100, 4, '#3a0a0a');
  pxDraw(W - 104, 11, 100 * clamp(o.hp/o.maxHp, 0, 1), 4, '#c81616');
  // 타이머
  const tl = Math.max(0, duel.timerLeft);
  const tCol = tl < 10 ? '#c81616' : '#ffefa8';
  drawText('T ' + tl.toFixed(1), W/2 - textWidth('T ' + tl.toFixed(1))/2, 4, tCol);

  // 안내
  drawText('[R] SURRENDER', W/2 - textWidth('[R] SURRENDER')/2, H - 8, '#5a4a80');
}

// 듀얼 종료
function updateDuelEnd(dt) {
  if (keys['Space'] || keys['Enter']) {
    keys['Space']=false; keys['Enter']=false;
    if (duel.seriesOver) {
      // 시리즈 끝: 아레나 메뉴로
      state.scene = 'arena';
      arenaMenu.mode = 'menu';
    } else {
      // 다음 라운드
      startNextRound();
      state.scene = 'arenaAI';
    }
  }
}

// 라운드 종료 시 호출 (updateDuel의 승/패 판정 부분에서)
function onRoundEnd(outcome) {
  duel.outcome = outcome;
  if (outcome === 'win') duel.playerWins++;
  else duel.enemyWins++;
  // 시리즈 승패 결정
  if (duel.playerWins >= duel.seriesTarget || duel.enemyWins >= duel.seriesTarget) {
    duel.seriesOver = true;
    const playerWonSeries = duel.playerWins > duel.enemyWins;
    const diffMult = duel.difficulty === 'nightmare' ? 2.0 : duel.difficulty === 'hard' ? 1.4 : duel.difficulty === 'normal' ? 1.0 : 0.6;
    if (playerWonSeries) {
      // 승자: GPA 상승 + 골드
      const gpaGain = 0.15 * diffMult;
      duel.gpaDelta = gpaGain;
      state.gpa = (state.gpa || 0) + gpaGain;
      const gold = Math.floor(80 * diffMult);
      state.gold += gold;
      academy.duelWins = (academy.duelWins || 0) + 1;
    } else {
      // 패자: 패배 보너스 (골드 위주). GPA는 소량 감소.
      const gpaLoss = 0.05 * diffMult;
      duel.gpaDelta = -gpaLoss;
      state.gpa = Math.max(0, (state.gpa || 0) - gpaLoss);
      const gold = Math.floor(120 * diffMult);  // 패배자에게 보너스 골드
      state.gold += gold;
      academy.duelLosses = (academy.duelLosses || 0) + 1;
    }
    saveAccountData();
    // 랭킹 저장
    if (typeof updateLeaderboardEntry === 'function') updateLeaderboardEntry();
  }
  state.scene = 'duelEnd';
}

// 계정별 랭킹 항목 저장 (로컬 + 서버 동기화)
function updateLeaderboardEntry() {
  if (!state.account) return;
  const entry = {
    name: state.account.name,
    gpa: Number((state.gpa || 0).toFixed(2)),
    wins: academy.duelWins || 0,
    losses: academy.duelLosses || 0,
    research: Math.floor(state.research || 0),
    blackHeartDefeated: state.blackHeartDefeated || 0,
    maxDifficulty: state.difficulty || 'normal',
    updated: Date.now(),
  };
  try {
    const raw = localStorage.getItem('gaa_leaderboard') || '{}';
    const lb = JSON.parse(raw);
    lb[state.account.name] = entry;
    localStorage.setItem('gaa_leaderboard', JSON.stringify(lb));
  } catch(e){}
  // 서버 동기화 (다른 기기에서도 보이도록)
  if (state.account.passHash) {
    try {
      fetch('/api/leaderboard/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: state.account.name, passHash: state.account.passHash, entry }),
      }).catch(()=>{});
    } catch(_){}
  }
}

// 서버 랭킹 캐시
const _lbCache = { list: [], t: 0, fetching: false };

function _fetchServerLeaderboard() {
  if (_lbCache.fetching) return;
  if (Date.now() - _lbCache.t < 10000) return;    // 10초 캐시
  _lbCache.fetching = true;
  try {
    fetch('/api/leaderboard/get').then(r => r.json()).then(j => {
      _lbCache.fetching = false;
      if (j && j.ok && Array.isArray(j.list)) {
        _lbCache.list = j.list;
        _lbCache.t = Date.now();
      }
    }).catch(()=>{ _lbCache.fetching = false; });
  } catch(_){ _lbCache.fetching = false; }
}

// 랭킹 조회 (서버 + 로컬 병합, 서버 우선)
function getLeaderboard() {
  _fetchServerLeaderboard();
  const merged = {};
  // 로컬 먼저
  try {
    const raw = localStorage.getItem('gaa_leaderboard') || '{}';
    const lb = JSON.parse(raw);
    for (const k of Object.keys(lb)) merged[k.toLowerCase()] = lb[k];
  } catch(e) {}
  // 서버로 덮어쓰기 (서버가 최신)
  for (const e of _lbCache.list) {
    if (!e || !e.name) continue;
    merged[e.name.toLowerCase()] = e;
  }
  const arr = Object.values(merged);
  arr.sort((a, b) => (b.gpa || 0) - (a.gpa || 0));
  return arr;
}

function renderDuelEnd() {
  bgStars();
  ctx.fillStyle = 'rgba(10,5,30,0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  const win = duel.outcome === 'win';
  // 시리즈 진행 중 vs 시리즈 종료
  if (!duel.seriesOver) {
    // 라운드 결과
    const title = win ? 'ROUND WIN' : 'ROUND LOSS';
    const col = win ? '#3ac762' : '#c81616';
    drawText(title, W/2 - textWidth(title, 2)/2, 30, col, 2);
    drawText('ROUND ' + duel.seriesRound + ' OF BEST OF 5', W/2 - textWidth('ROUND ' + duel.seriesRound + ' OF BEST OF 5')/2, 55, '#c8b898');
    // 스코어
    const score = 'YOU  ' + duel.playerWins + '  -  ' + duel.enemyWins + '  ' + duel.enemy.name;
    drawText(score, W/2 - textWidth(score, 2)/2, 80, '#e8c547', 2);
    // 진행 도트
    for (let i = 0; i < duel.seriesTarget; i++) {
      const dotX = W/2 - 50 + i * 8;
      pxDraw(dotX, 110, 6, 6, i < duel.playerWins ? '#3ac762' : '#3a1e5c');
      pxDraw(dotX + 50, 110, 6, 6, i < duel.enemyWins ? '#c81616' : '#3a1e5c');
    }
    drawText('YOU', W/2 - 60, 122, '#3ac762');
    drawText('OPP', W/2 + 55, 122, '#c81616');
    drawText('[SPACE] NEXT ROUND', W/2 - textWidth('[SPACE] NEXT ROUND')/2, H - 20, '#ffefa8');
  } else {
    // 시리즈 완료
    const playerWon = duel.playerWins > duel.enemyWins;
    const title = playerWon ? 'SERIES VICTORY' : 'SERIES DEFEAT';
    const col = playerWon ? '#ffefa8' : '#c81616';
    drawText(title, W/2 - textWidth(title, 2)/2, 24, col, 2);
    const score = 'FINAL: ' + duel.playerWins + '  -  ' + duel.enemyWins;
    drawText(score, W/2 - textWidth(score, 2)/2, 46, '#e8c547', 2);
    drawText('VS ' + duel.enemy.name, W/2 - textWidth('VS ' + duel.enemy.name)/2, 72, '#e8d9b0');
    // 보상 안내
    if (playerWon) {
      const diffMult = duel.difficulty === 'nightmare' ? 2.0 : duel.difficulty === 'hard' ? 1.4 : duel.difficulty === 'normal' ? 1.0 : 0.6;
      const gold = Math.floor(80 * diffMult);
      const gpaS = (duel.gpaDelta >= 0 ? '+' : '') + duel.gpaDelta.toFixed(2);
      drawText('+' + gold + ' GOLD', W/2 - textWidth('+' + gold + ' GOLD')/2, 92, '#e8c547');
      drawText('GPA: ' + gpaS + '  (NOW ' + state.gpa.toFixed(2) + ')', W/2 - textWidth('GPA: ' + gpaS + '  (NOW ' + state.gpa.toFixed(2) + ')')/2, 104, '#3ac762');
    } else {
      const diffMult = duel.difficulty === 'nightmare' ? 2.0 : duel.difficulty === 'hard' ? 1.4 : duel.difficulty === 'normal' ? 1.0 : 0.6;
      const gold = Math.floor(120 * diffMult);
      drawText('LOSER BONUS: +' + gold + ' GOLD', W/2 - textWidth('LOSER BONUS: +' + gold + ' GOLD')/2, 92, '#e8c547');
      drawText('GPA: ' + duel.gpaDelta.toFixed(2) + '  (NOW ' + state.gpa.toFixed(2) + ')', W/2 - textWidth('GPA: ' + duel.gpaDelta.toFixed(2) + '  (NOW ' + state.gpa.toFixed(2) + ')')/2, 104, '#c81616');
    }
    // 랭킹 힌트
    drawText('CHECK RANKINGS IN ARENA MENU', W/2 - textWidth('CHECK RANKINGS IN ARENA MENU')/2, 130, '#8bd8ff');
    if (Math.floor(state.time * 2) % 2 === 0) {
      drawText('[SPACE] LEAVE', W/2 - textWidth('[SPACE] LEAVE')/2, H - 20, '#ffefa8');
    }
  }
}

