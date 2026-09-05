// =====================================================================
// Update loop, scene updaters, potions
// =====================================================================

// ---------- 업데이트 ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  state.time += dt;

  try {
    if (typeof updateTouchInput === 'function') updateTouchInput();
    update(dt);
    render();
    if (typeof renderTouchOverlay === 'function') renderTouchOverlay();
  } catch (err) {
    // 프레임 루프가 통째로 죽지 않도록 하는 마지막 방어선.
    // 근본 원인(shot/nova/castSlot 에서 opts.count 등을 함수로만 호출하던 문제)은 skillTree.js
    // 의 _resolve 헬퍼로 수정됨. 여기 로그가 다시 뜨면 새 스킬 정의에 결함이 있는 것.
    console.error('[frame] uncaught error, continuing:', err);
  }

  requestAnimationFrame(frame);
}

function update(dt) {
  if (state.msgTimer > 0) state.msgTimer -= dt;
  state.shake = Math.max(0, state.shake - dt * 60);

  switch(state.scene) {
    case 'langSelect': updateLangSelect(dt); break;
    case 'login':      updateLogin(dt); break;
    case 'title':     updateTitle(dt); break;
    case 'intro':     updateIntro(dt); break;
    case 'academy':   updateAcademy(dt); break;
    case 'dungeon':   updateDungeon(dt); break;
    case 'levelup':   updateLevelUp(dt); break;
    case 'dead':      updateDead(dt); break;
    case 'ending':    updateEnding(dt); break;
    case 'library':   updateLibrary(dt); break;
    case 'shop':      updateShop(dt); break;
    case 'classroom': updateClassroom(dt); break;
    case 'arena':     updateArenaMenu(dt); break;
    case 'arenaWave': updateArena(dt); break;
    case 'arenaAI':   updateAIDuel(dt); break;
    case 'arenaRoom': updateAIDuel(dt); break;
    case 'arenaEnd':  updateArenaEnd(dt); break;
    case 'duelEnd':   updateDuelEnd(dt); break;
    case 'mplobby':   updateMpLobby(dt); break;
    case 'mproom':    updateMpRoom(dt); break;
  }
}

// ---------- Title ----------
function updateTitle(dt) {
  // 터치 UI 토글 버튼 클릭 판정 (마우스/터치)
  if (mouse.down && window._titleTouchBtn) {
    const b = window._titleTouchBtn;
    if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) {
      mouse.down = false;
      toggleTouchMode();
      return;
    }
  }
  if (keys['Space'] || keys['Enter']) {
    initAudio();
    keys['Space'] = false; keys['Enter'] = false;
    goTo('intro');
  }
}

// ---------- Intro ----------
let introT = 0;
const INTRO_LINES = [
  '     GRAND ARCANA ACADEMY',
  '',
  'YOU WOKE WITH NO NAME, NO PAST,',
  'ONLY A LETTER OF ADMISSION.',
  '',
  'BY DAY, YOU WEAR THE UNIFORM.',
  'BY NIGHT, YOU DESCEND ALONE',
  'INTO THE SEALED HALLS BELOW,',
  '',
  'WHERE THE CHRONO CORE STILL BEATS.',
  '',
  '   [SPACE] TO BEGIN',
];
function updateIntro(dt) {
  introT += dt;
  if (keys['Space'] || keys['Enter']) {
    keys['Space'] = false; keys['Enter'] = false;
    introT = 0;
    goTo('academy');
    showMsg('DAY ' + state.day + ' - MORNING BELL', 2.5);
  }
}

// ---------- 포션 시스템 ----------
const POTIONS = {
  heal:  { name:'HEAL POTION',  desc:'RESTORE 40 HP',        cost:15, color:'#c81616',
           use:(p)=>{ if(p.hp>=p.maxHp) return false; p.hp=Math.min(p.maxHp,p.hp+40); return true; } },
  mana:  { name:'MANA POTION',  desc:'RESTORE 40 MP',        cost:15, color:'#3b7fd6',
           use:(p)=>{ if(p.mp>=p.maxMp) return false; p.mp=Math.min(p.maxMp,p.mp+40); return true; } },
  swift: { name:'SWIFT POTION', desc:'+40% SPEED, 12S',      cost:25, color:'#3ac762',
           use:(p)=>{ p.speed*=1.4; setTimeout(()=>{ if(player===p) p.speed/=1.4; }, 12000); return true; } },
  fury:  { name:'FURY POTION',  desc:'+50% DMG, 15S',        cost:35, color:'#ff9c3d',
           use:(p)=>{ p.baseDmg*=1.5; setTimeout(()=>{ if(player===p) p.baseDmg/=1.5; }, 15000); return true; } },
  guard: { name:'GUARD POTION', desc:'INVULN, 3S',           cost:40, color:'#ffefa8',
           use:(p)=>{ p.invuln=Math.max(p.invuln,3); return true; } },
};
const POTION_ORDER = ['heal','mana','swift','fury','guard'];

// ---------- Academy ----------
// 학원 허브: 문 4개 (던전/도서관/교실/아레나) + NPC들
const academy = {
  room: { x: 20, y: 30, w: 280, h: 150 },
  npcs: [
    { x: 80,  y: 110, name: 'ELARA',   msgs: [
        'THE SEAL WEAKENED AGAIN LAST NIGHT.',
        'THE CORE HUMS BEHIND MY DREAMS.',
        'YOU LOOK STRONGER TODAY.',
        'MY FAMILY THINKS I STUDY POTIONS.',
        'ELARA: I TRUST YOU.',
      ], color: NPC_PAL, bond: 0 },
    { x: 220, y: 100, name: 'MERCHANT', color: NPC_SHOP_PAL, shop: true },
  ],
  door:      { x: 268, y: 45,  w: 12, h: 18, kind: 'dungeon',   label: 'DUNGEON'  },
  libDoor:   { x: 42,  y: 45,  w: 12, h: 18, kind: 'library',   label: 'LIBRARY'  },
  classDoor: { x: 140, y: 45,  w: 12, h: 18, kind: 'classroom', label: 'CLASS'    },
  arenaDoor: { x: 268, y: 152, w: 12, h: 18, kind: 'arena',     label: 'ARENA'    },
  extraDoor: { x: 42,  y: 152, w: 12, h: 18, kind: 'extra',     label: 'EXTRA'    },
  extremeDoor:{x: 140, y: 152, w: 12, h: 18, kind: 'extreme',   label: 'EXTREME'  },
  infernoDoor:{x: 204, y: 152, w: 12, h: 18, kind: 'inferno',   label: 'INFERNO'  },
  inventory: { heal: 0, mana: 0, swift: 0, fury: 0, guard: 0 },
  hotkeys: [null, null, null],  // 1,2,3 슬롯에 할당된 포션 종류
  bestArena: 0,
  duelWins: 0,
};

function recomputeHotkeys() {
  const owned = POTION_ORDER.filter(k => academy.inventory[k] > 0);
  academy.hotkeys = [owned[0]||null, owned[1]||null, owned[2]||null];
}

function usePotionSlot(slot) {
  const kind = academy.hotkeys[slot];
  if (!kind) return false;
  if (academy.inventory[kind] <= 0) return false;
  const p = POTIONS[kind];
  if (!p.use(player)) return false;
  academy.inventory[kind]--;
  recomputeHotkeys();
  sfx('pickup');
  showMsg(p.name + ' USED');
  spawnFloat(player.x, player.y - 8, p.name, p.color);
  return true;
}

// (구 gaa_bestArena / gaa_duelWins / gaa_inv 로드 제거 - 계정별 blob에서 로드함)

function savePotions() {
  // 계정별 통합 저장으로 리다이렉트
  saveAccountData();
}

// 페이지 로드 시: 자동 로그인된 계정이 있으면 그 계정 데이터 로드.
// academy가 정의된 뒤 실행되어야 함 (loadAccountData가 academy.* 를 채우므로).
if (state.account) {
  if (!loadAccountData()) resetGameData();
}

function updateAcademy(dt) {
  // 암호 퀘스트: 팝업 활성이거나 벽 접촉 카운트 진행 중이면 그 결과에 따라 나머지 잠금
  if (typeof updateCipherQuestAcademy === 'function') {
    const blocked = updateCipherQuestAcademy(dt);
    if (blocked) return;
  }
  // 난이도 피커 팝업 UI: window._diffPickerOpen 이 true 면 티어 목록에서 직접 선택
  if (window._diffPickerOpen) {
    const tiers = DIFFICULTY_TIERS;
    const curIdx = tiers.findIndex(t => t.id === (state.difficulty || 'normal'));
    if (window._diffPickerCursor == null) window._diffPickerCursor = Math.max(0, curIdx);
    // 키보드 위/아래
    if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; window._diffPickerCursor = (window._diffPickerCursor - 1 + tiers.length) % tiers.length; sfx('hit'); }
    if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; window._diffPickerCursor = (window._diffPickerCursor + 1) % tiers.length; sfx('hit'); }
    // 마우스 휠 스크롤 (커서 자체를 이동)
    if (mouse.wheel) {
      window._diffPickerCursor = Math.max(0, Math.min(tiers.length - 1, window._diffPickerCursor + mouse.wheel));
      mouse.wheel = 0;
    }
    // 페이지 점프
    if (keys['PageUp'])   { keys['PageUp']=false;   window._diffPickerCursor = Math.max(0, window._diffPickerCursor - 5); sfx('hit'); }
    if (keys['PageDown']) { keys['PageDown']=false; window._diffPickerCursor = Math.min(tiers.length - 1, window._diffPickerCursor + 5); sfx('hit'); }
    if (keys['Home'])     { keys['Home']=false;     window._diffPickerCursor = 0; sfx('hit'); }
    if (keys['End'])      { keys['End']=false;      window._diffPickerCursor = tiers.length - 1; sfx('hit'); }
    if (keys['Space'] || keys['Enter']) {
      keys['Space']=false; keys['Enter']=false;
      const pick = tiers[window._diffPickerCursor];
      state.difficulty = pick.id;
      if (typeof saveAccountData === 'function') saveAccountData();
      if (typeof showMsg === 'function') showMsg('DIFFICULTY: ' + pick.name.toUpperCase(), 2);
      sfx('level');
      window._diffPickerOpen = false;
    }
    if (keys['Escape'] || keys['KeyC']) { keys['Escape']=false; keys['KeyC']=false; window._diffPickerOpen = false; }
    // 스크롤 버튼(▲▼) 클릭 처리 - 커서를 5칸씩 이동
    if (mouse.down && window._diffPickerScrollBtns) {
      const btns = window._diffPickerScrollBtns;
      if (btns.up && mouse.x >= btns.up.x && mouse.x <= btns.up.x + btns.up.w && mouse.y >= btns.up.y && mouse.y <= btns.up.y + btns.up.h) {
        mouse.down = false;
        window._diffPickerCursor = Math.max(0, window._diffPickerCursor - 5);
        sfx('hit');
        return;
      }
      if (btns.down && mouse.x >= btns.down.x && mouse.x <= btns.down.x + btns.down.w && mouse.y >= btns.down.y && mouse.y <= btns.down.y + btns.down.h) {
        mouse.down = false;
        window._diffPickerCursor = Math.min(tiers.length - 1, window._diffPickerCursor + 5);
        sfx('hit');
        return;
      }
    }
    // 클릭으로 티어 선택 (렌더가 window._diffPickerRows 에 idx/좌표 저장)
    if (mouse.down && Array.isArray(window._diffPickerRows)) {
      for (const r of window._diffPickerRows) {
        if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
          mouse.down = false;
          const idx = r.idx;
          state.difficulty = tiers[idx].id;
          window._diffPickerCursor = idx;
          if (typeof saveAccountData === 'function') saveAccountData();
          if (typeof showMsg === 'function') showMsg('DIFFICULTY: ' + tiers[idx].name.toUpperCase(), 2);
          sfx('level');
          window._diffPickerOpen = false;
          return;
        }
      }
    }
    return;   // 피커 열려있는 동안 아카데미 이동/상호작용 잠금
  }
  // C: 피커 열기. 배너 클릭도 동일하게 피커 열기.
  if (keys['KeyC']) { keys['KeyC'] = false; window._diffPickerOpen = true; window._diffPickerCursor = null; }
  if (mouse.down && window._academyDiffBtn) {
    const b = window._academyDiffBtn;
    if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) {
      mouse.down = false;
      window._diffPickerOpen = true; window._diffPickerCursor = null;
      return;
    }
  }

  // 이동
  let mx = 0, my = 0;
  if (keys['KeyA']) mx -= 1;
  if (keys['KeyD']) mx += 1;
  if (keys['KeyW']) my -= 1;
  if (keys['KeyS']) my += 1;
  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; }

  const spd = 55;
  player.x += mx * spd * dt;
  player.y += my * spd * dt;

  // 방 벽 클램프
  const r = academy.room;
  player.x = clamp(player.x, r.x + 8, r.x + r.w - 8);
  player.y = clamp(player.y, r.y + 8, r.y + r.h - 8);
  if (mx < 0) player.facing = -1;
  if (mx > 0) player.facing = 1;
  player.animT += dt * (len > 0 ? 6 : 2);

  // 상호작용
  if (keys['Space']) {
    keys['Space'] = false;
    // NPC
    for (const n of academy.npcs) {
      if (dist(player, n) < 15) {
        if (n.shop) {
          goTo('shop');
        } else {
          const msg = n.msgs[Math.min(n.bond, n.msgs.length - 1)];
          showMsg(msg, 3);
          n.bond++;
          if (n.bond === 3) {
            showMsg(n.name + ' TRUSTS YOU. +15 GOLD!', 3);
            state.gold += 15;
          }
        }
        return;
      }
    }
    // 문들
    const doors = [academy.door, academy.libDoor, academy.classDoor, academy.arenaDoor, academy.extraDoor, academy.extremeDoor, academy.infernoDoor];
    for (const d of doors) {
      if (Math.abs(player.x - (d.x + d.w/2)) < 10 && Math.abs(player.y - (d.y + d.h/2)) < 12) {
        // 잠금 확인
        if (d.kind === 'extra' && !(state.finalCleared >= 1)) {
          showMsg('CLEAR THE NORMAL DUNGEON FIRST', 3);
          sfx('hurt'); return;
        }
        if (d.kind === 'extreme' && !(state.finalCleared >= 2)) {
          showMsg('CLEAR THE EXTRA DUNGEON FIRST', 3);
          sfx('hurt'); return;
        }
        if (d.kind === 'inferno' && !(state.finalCleared >= 3)) {
          showMsg('CLEAR THE EXTREME DUNGEON FIRST', 3);
          sfx('hurt'); return;
        }
        sfx('door');
        if (d.kind === 'dungeon')      { state.dungeonMode = 'normal';  goTo('dungeon'); }
        else if (d.kind === 'extra')   { state.dungeonMode = 'extra';   goTo('dungeon'); }
        else if (d.kind === 'extreme') { state.dungeonMode = 'extreme'; goTo('dungeon'); }
        else if (d.kind === 'inferno') { state.dungeonMode = 'inferno'; goTo('dungeon'); }
        else if (d.kind === 'library')   goTo('library');
        else if (d.kind === 'classroom') goTo('classroom');
        else if (d.kind === 'arena')     goTo('arena');
        return;
      }
    }
  }
}

// (구 openLibrary 제거 - 새 도서관 씬으로 대체됨)

// ---------- Dungeon ----------
function updateDungeon(dt) {
  // 시련 모드: 단계별 타이머. 시간 초과 시 추방.
  if (state.dungeonMode === 'trial' && state.dungeonStart) {
    const isStage2 = state.trialStage === 2;
    const elapsed = (performance.now() - state.dungeonStart) / 1000;
    const limit = isStage2
      ? ((typeof ULTRA_TRIAL_TIME_SEC !== 'undefined') ? ULTRA_TRIAL_TIME_SEC : 40)
      : ((typeof MAX_TRIAL_TIME_SEC !== 'undefined') ? MAX_TRIAL_TIME_SEC : 60);
    if (elapsed >= limit) {
      if (isStage2) {
        const banMs = (typeof ULTRA_TRIAL_BAN_MS !== 'undefined') ? ULTRA_TRIAL_BAN_MS : 10*60*1000;
        state.ultraTrialBanUntil = Date.now() + banMs;
      } else {
        const banMs = (typeof MAX_TRIAL_BAN_MS !== 'undefined') ? MAX_TRIAL_BAN_MS : 5*60*1000;
        state.trialBanUntil = Date.now() + banMs;
      }
      if (typeof saveAccountData === 'function') saveAccountData();
      showMsg('시련 실패 - 추방됨. ' + (isStage2 ? '10' : '5') + '분 후 재도전 가능.', 5);
      sfx('die');
      state.dungeonMode = 'normal';
      state.dungeonStart = 0;
      state.trialStage = 1;
      goTo('academy');
      return;
    }
  }

  const dtLogic = dt;                        // 플레이어는 실제 dt
  const dtEnemy = timeStopT > 0 ? 0 : dt;    // 적/발사체는 시간정지 시 정지
  if (timeStopT > 0) timeStopT -= dt;

  updatePlayer(dtLogic);
  updateEnemies(dtEnemy);
  updateBullets(dtEnemy);
  updateEBullets(dtEnemy);
  updateParticles(dt);
  updateFloats(dt);
  updatePickups(dt);
  updateDoors(dt);

  // 카메라 (약간 오프셋)
  const targetX = clamp(player.x - W/2, -20, 20);
  const targetY = clamp(player.y - H/2, -20, 20);
  state.cam.x = lerp(state.cam.x, targetX, dt * 4);
  state.cam.y = lerp(state.cam.y, targetY, dt * 4);

  // 방 클리어 체크
  const room = rooms[currentRoom];
  if (!room.cleared && entities.enemies.length === 0) {
    room.cleared = true;
    if (room.isBoss) {
      // 보스 클리어
      const fd = currentFloorData();
      state.gold += 30 * floor;
      // 난이도 티어에 따라 층 보스 RP 보상 스케일
      const diffBoss = (typeof currentDifficulty === 'function') ? currentDifficulty() : { rpBossMult: 1 };
      const bossRp = Math.round(5 * floor * (diffBoss.rpBossMult || 1));
      state.research += bossRp;
      showMsg(fd.bossName + ' DEFEATED! +' + bossRp + ' RESEARCH', 3);
      sfx('level');
      state.shake = 12;
      if (floor >= currentFloorTotal()) {
        // 시련 클리어: 단계별로 다른 해금
        if (state.dungeonMode === 'trial') {
          const cat = state.trialCategory || 'magic';
          const isStage2 = state.trialStage === 2;
          if (isStage2) {
            state.ultraCleared = state.ultraCleared || {};
            state.ultraCleared[cat] = true;
            state.ultraTrialBanUntil = 0;
            showMsg(cat.toUpperCase() + ' ULTRA 스킬 해금!', 4);
          } else {
            state.trialCleared = state.trialCleared || {};
            state.trialCleared[cat] = true;
            state.maxUnlocked = true;
            state.trialBanUntil = 0;
            showMsg(cat.toUpperCase() + ' MAX 해금!', 4);
          }
          state.trialStage = 1;
          if (typeof saveAccountData === 'function') saveAccountData();
          setTimeout(() => { state.dungeonMode = 'normal'; goTo('academy'); }, 1500);
          return;
        }
        // 최종 승리
        if (state.dungeonMode === 'inferno') {
          state.finalCleared = Math.max(state.finalCleared || 0, 4);
          saveAccountData();
        } else if (state.dungeonMode === 'extreme') {
          state.finalCleared = Math.max(state.finalCleared || 0, 3);
          saveAccountData();
        } else if (state.dungeonMode === 'extra') {
          state.finalCleared = Math.max(state.finalCleared || 0, 2);
          saveAccountData();
        }
        state.runResult = 'final';
        setTimeout(() => goTo('ending'), 1200);
        return;
      }
      // 다음 층 문 + 귀환 문
      spawnNextFloorDoor(room);
      spawnRetreatDoor(room);
      return;
    }
    showMsg('CLEARED - EXIT UNLOCKED', 2);
    sfx('level');
    spawnExitDoor(room);
    spawnRetreatDoor(room);
  }

  // 후퇴 키
  if (keys['KeyR']) {
    keys['KeyR'] = false;
    state.runResult = 'retreat';
    goTo('ending');
  }
}

function spawnNextFloorDoor(room) {
  const door = { x: room.x + room.w - 20, y: room.y + room.h/2 - 6, w: 12, h: 18, kind: 'nextfloor' };
  entities.doors.push(door);
}

// 플레이어 이동 속도 상한. 기본 60 기준, 최대 +250% 증가 = 60 * 3.5 = 210.
// 여러 패시브/포션이 p.speed 를 곱해도 실제 이동 계산에서는 이 값으로 캡됨.
const PLAYER_BASE_SPEED = 60;
const PLAYER_SPEED_MAX_MULT = 3.5;
function effectiveSpeed(p) {
  const cap = PLAYER_BASE_SPEED * PLAYER_SPEED_MAX_MULT;
  return Math.min(p.speed || PLAYER_BASE_SPEED, cap);
}

function updatePlayer(dt) {
  const p = player;
  p.animT += dt;
  if (p.rollCd > 0) p.rollCd -= dt;
  if (p.hitFlash > 0) p.hitFlash -= dt;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.parryWindow > 0) p.parryWindow -= dt;

  // 쿨다운
  for (const k in p.cd) p.cd[k] = Math.max(0, p.cd[k] - dt);

  // MP 리젠
  const mpr = 4 + (p.mpRegenBonus || 0);
  p.mp = Math.min(p.maxMp, p.mp + mpr * dt);
  // HP 리젠
  if (p.hpRegen) p.hp = Math.min(p.maxHp, p.hp + p.hpRegen * dt);
  // 반사 상태 감쇠
  if (p.reflectT > 0) p.reflectT -= dt;

  // 이동 입력
  let mx = 0, my = 0;
  if (keys['KeyA']) mx -= 1;
  if (keys['KeyD']) mx += 1;
  if (keys['KeyW']) my -= 1;
  if (keys['KeyS']) my += 1;
  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; }

  // 방어 / 구르기
  const shieldKey = mouse.right || keys['ShiftLeft'] || keys['ShiftRight'];
  if (p.rolling > 0) {
    p.rolling -= dt;
    // 구르기 중 이동
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.invuln = Math.max(p.invuln, 0.02);
  } else if (shieldKey) {
    if (!p.shielding) {
      p.shielding = true;
      p.parryWindow = 0.18; // 방패를 든 직후 0.18초 패리 창
    }
    // 방패 상태에서 이동키 누르면 구르기
    if (len > 0 && p.rollCd <= 0) {
      p.rolling = 0.28;
      const rollSpd = hasPerk('multiroll') ? 220 : 200;
      p.vx = mx * rollSpd;
      p.vy = my * rollSpd;
      p.rollCd = hasPerk('multiroll') ? 0.5 : 1.0;
      p.shielding = false;
      p.parryWindow = 0;
      p.invuln = 0.28;
      sfx('roll');
    } else {
      const spd = effectiveSpeed(p);
      p.x += mx * spd * 0.3 * dt;
      p.y += my * spd * 0.3 * dt;
    }
  } else {
    p.shielding = false;
    p.parryWindow = 0;
    const spd = effectiveSpeed(p);
    p.x += mx * spd * dt;
    p.y += my * spd * dt;
  }

  // 방 벽 클램프
  const room = rooms[currentRoom];
  p.x = clamp(p.x, room.x + 8, room.x + room.w - 8);
  p.y = clamp(p.y, room.y + 8, room.y + room.h - 8);

  // 조준: 마우스 커서 (카메라 반영)
  const aimX = mouse.x + state.cam.x;
  const aimY = mouse.y + state.cam.y;
  const ang = angleTo(p, {x: aimX, y: aimY});
  p.facing = Math.cos(ang) >= 0 ? 1 : -1;

  // 스킬 시전 (슬롯 기반)
  if (mouse.down && !p.shielding && p.rolling <= 0) {
    castSlot(p, 'lmb', ang);
  }
  if (keys['KeyQ'] && !p.shielding && p.rolling <= 0) {
    keys['KeyQ'] = false;
    castSlot(p, 'q', ang);
  }
  if (keys['KeyE'] && p.rolling <= 0) {
    keys['KeyE'] = false;
    castSlot(p, 'e', ang);
  }

  // 픽업 자석 처리 (플레이어 접촉)
  const magnetR = hasPerk('magnet') ? 40 : 20;
  for (let i = entities.pickups.length - 1; i >= 0; i--) {
    const it = entities.pickups[i];
    const d = dist(it, p);
    if (d < magnetR) {
      const a = angleTo(it, p);
      it.x += Math.cos(a) * 80 * dt;
      it.y += Math.sin(a) * 80 * dt;
    }
    if (d < 6) {
      const mult = hasPerk('bountiful') ? 2 : 1;
      if (it.kind === 'hp') p.hp = Math.min(p.maxHp, p.hp + 15 * mult);
      else if (it.kind === 'mp') p.mp = Math.min(p.maxMp, p.mp + 20 * mult);
      else if (it.kind === 'gold') state.gold += 1 * mult;
      entities.pickups.splice(i, 1);
      sfx('pickup');
      spawnFloat(p.x, p.y - 6,
        it.kind === 'hp' ? '+HP' : it.kind === 'mp' ? '+MP' : '+G',
        it.kind === 'hp' ? '#ff8888' : it.kind === 'mp' ? '#88c8ff' : '#e8c547');
    }
  }

  // 데스위시: 저HP 시 속도 증가 시각화
  // (이동 계산 자체에는 이미 speed 사용, 여기서 임시 반영)

  // 사망
  if (p.hp <= 0) {
    state.runResult = 'dead';
    goTo('ending');
  }

  // 문 통과
  for (const d of entities.doors) {
    if (Math.abs(p.x - (d.x + d.w/2)) < 8 && Math.abs(p.y - (d.y + d.h/2)) < 10) {
      if (d.kind === 'exit') {
        sfx('door');
        currentRoom++;
        if (currentRoom >= 4) {
          buildRoom(5);   // 보스방
          const fd = currentFloorData();
          showMsg('*** BOSS: ' + fd.bossName + ' ***', 3);
          sfx('boss');
        } else {
          buildRoom(currentRoom + 1);
          showMsg('CHAMBER ' + (currentRoom + 1), 2);
        }
      } else if (d.kind === 'nextfloor') {
        sfx('door');
        nextFloor();
      } else if (d.kind === 'retreat') {
        state.runResult = 'retreat';
        goTo('ending');
      }
      return;
    }
  }

  // 포션 슬롯 1/2/3
  if (keys['Digit1']) { keys['Digit1'] = false; usePotionSlot(0); }
  if (keys['Digit2']) { keys['Digit2'] = false; usePotionSlot(1); }
  if (keys['Digit3']) { keys['Digit3'] = false; usePotionSlot(2); }
}

function castFire(p, ang) {
  const s = SKILLS.fire;
  let cd = s.cd;
  if (hasPerk('firecd')) cd *= 0.7;
  if (hasPerk('chain') && Math.random() < 0.2) cd = 0;
  p.cd.fire = cd * p.cdMult;
  p.mp -= s.cost;
  let dmg = s.dmg * p.baseDmg;
  if (hasPerk('firedmg')) dmg *= 1.4;

  const count = hasPerk('firemult') ? 3 : 1;
  const spread = count > 1 ? 0.22 : 0;
  for (let i = 0; i < count; i++) {
    const a = ang + (i - (count-1)/2) * spread;
    entities.bullets.push({
      x: p.x + Math.cos(a) * 6, y: p.y + Math.sin(a) * 6,
      vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed,
      r: s.radius, dmg, life: 1.4, kind: 'fire', hits: 0,
    });
  }
  sfx('fire');
}

function castIce(p, ang) {
  const s = SKILLS.ice;
  p.cd.ice = s.cd * p.cdMult;
  p.mp -= s.cost;
  let dmg = s.dmg * p.baseDmg;
  entities.bullets.push({
    x: p.x + Math.cos(ang) * 6, y: p.y + Math.sin(ang) * 6,
    vx: Math.cos(ang) * s.speed, vy: Math.sin(ang) * s.speed,
    r: s.radius, dmg, life: 1.8, kind: 'ice',
    pierce: hasPerk('icepierce'), freeze: hasPerk('icefreeze') ? 1.2 : 0.4, hits: 0,
  });
  sfx('ice');
}

