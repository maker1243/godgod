// =====================================================================
// Trial bosses - 시련의 방(도서관 Z 진입) 전용, 5 종파마다 다른 보스와 패턴.
// 훨씬 강하고 3페이즈 × 여러 공격 패턴.
// =====================================================================

// 페이즈 임계값: hp 비율 [phase0 시작, phase1 시작, phase2 시작]
// phase 0: HP > 0.66,   phase 1: 0.33 < HP <= 0.66,   phase 2: HP <= 0.33
function _phaseOf(e) {
  const p = e.hp / e.maxHp;
  if (p > 0.66) return 0;
  if (p > 0.33) return 1;
  return 2;
}

// 패턴 헬퍼: 원형 볼트 발사 (적 → 플레이어 방향 기준 회전)
function _ringShot(e, count, speed, dmg, kind, opts) {
  opts = opts || {};
  const off = opts.offset || 0;
  for (let i = 0; i < count; i++) {
    const a = off + (i / count) * Math.PI * 2;
    entities.ebullets.push({
      x: e.x, y: e.y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      r: opts.r || 3, dmg, life: opts.life || 3, kind: kind || 'fire',
      homing: opts.homing || false,
      bossVis: e._trialCat || null,     // 렌더에서 카테고리별 커스텀 그림용
    });
  }
}
function _aimedShot(e, count, spread, speed, dmg, kind, opts) {
  opts = opts || {};
  const ang = angleTo(e, player);
  for (let i = 0; i < count; i++) {
    const a = ang + (i - (count-1)/2) * spread;
    entities.ebullets.push({
      x: e.x, y: e.y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      r: opts.r || 3, dmg, life: opts.life || 3, kind: kind || 'fire',
      homing: opts.homing || false,
      bossVis: e._trialCat || null,
    });
  }
}
function _teleport(e, room) {
  spawnParticle(e.x, e.y, '#c86ade', 0.5, 20, 100);
  e.x = room.x + 20 + Math.random() * (room.w - 40);
  e.y = room.y + 20 + Math.random() * (room.h - 40);
  spawnParticle(e.x, e.y, '#c86ade', 0.5, 20, 100);
  sfx('parry');
}
function _summonAdd(e, kind, room) {
  const a = Math.random() * Math.PI * 2;
  const x = clamp(e.x + Math.cos(a) * 40, room.x + 10, room.x + room.w - 10);
  const y = clamp(e.y + Math.sin(a) * 40, room.y + 10, room.y + room.h - 10);
  const add = { x, y, vx: 0, vy: 0, hitFlash: 0, kind, freeze: 0, slow: 0, stun: 0, attackCd: 0,
    r: 5, hp: 200, maxHp: 200, dmg: Math.floor((e.dmg || 20) * 0.6), speed: 40, xp: 0, gold: 0 };
  if (kind === 'skeleton') add.shootCd = rand(1, 2.5);
  else if (kind === 'wraith') add.teleCd = rand(2, 4);
  else if (kind === 'imp') add.chargeCd = 0;
  else if (kind === 'cultist') add.spellCd = rand(1.5, 3);
  else if (kind === 'spider') { /* default */ }
  entities.enemies.push(add);
}

// =====================================================================
// 카테고리별 보스 정의
// baseHp/dmg 는 매우 큼. 난이도 티어의 bossHpMult 도 그대로 곱해짐.
// =====================================================================
// spriteKind: 렌더링 시 사용할 스프라이트 baseKind (커스텀 렌더에서 override).
// aura: 보스 주변 색상 오라 (rgba)
// glyph: 보스 위쪽에 그릴 상징 (아이콘 문자/도트) - drawEnemy 커스텀 브랜치가 그림
const TRIAL_BOSS_DEFS = {
  magic: {
    name: 'ARCHMAGE OMEGA', color: '#8bd8ff', r: 14, baseHp: 500000, baseDmg: 120,
    spriteKind: 'lich', aura: 'rgba(139, 216, 255, 0.30)', accent: '#3b7fd6', glyph: '★',
    // 3페이즈, 각 페이즈별 CD 다른 공격들
    update(e, dt, sm, room) {
      const ang = angleTo(e, player);
      const phase = _phaseOf(e);
      // 이동: 원 그리며 유지 거리 100
      const d = dist(e, player);
      const desired = 100;
      const mv = (d < desired ? -1 : 1);
      e.x += Math.cos(ang) * mv * e.speed * sm * dt * 0.6;
      e.y += Math.sin(ang) * mv * e.speed * sm * dt * 0.6;
      // 패턴 CD
      e._p1 = (e._p1 || 0) - dt;
      e._p2 = (e._p2 || 0) - dt;
      e._p3 = (e._p3 || 0) - dt;
      // 파이어 노바
      if (e._p1 <= 0) {
        _ringShot(e, 12 + phase*4, 120, e.dmg, 'fire', { offset: Math.random() * 6.28 });
        sfx('boss');
        e._p1 = 2.6 - phase * 0.5;
      }
      // 아이스 스프레드 (조준)
      if (e._p2 <= 0) {
        _aimedShot(e, 3 + phase*2, 0.22, 160, Math.floor(e.dmg * 1.3), 'ice', { r: 4, life: 3 });
        sfx('ice');
        e._p2 = 1.8 - phase * 0.3;
      }
      // 페이즈 2+: 텔레포트
      if (phase >= 1 && e._p3 <= 0) {
        _teleport(e, room);
        // 텔레포트 후 즉시 광역 얼음 링
        _ringShot(e, 16, 100, Math.floor(e.dmg * 0.9), 'ice', {});
        e._p3 = 4.5;
      }
      // 페이즈 3: 주기적 시간 정지
      e._stopCd = (e._stopCd || 8) - dt;
      if (phase === 2 && e._stopCd <= 0) {
        timeStopT = 2.5;
        showMsg('ARCHMAGE STOPS TIME', 1.5);
        state.shake = 8;
        e._stopCd = 10;
        // 시간정지 중 링 발사 (플레이어 회피 어려움)
        _ringShot(e, 24, 150, e.dmg, 'fire', {});
      }
    }
  },

  engineering: {
    name: 'WARMACHINE PRIME', color: '#e8c547', r: 15, baseHp: 800000, baseDmg: 100,
    spriteKind: 'golem', aura: 'rgba(232, 197, 71, 0.28)', accent: '#8a7a2a', glyph: '⚙',
    update(e, dt, sm, room) {
      const ang = angleTo(e, player);
      const phase = _phaseOf(e);
      // 이동: 느리게 접근
      e.x += Math.cos(ang) * e.speed * sm * dt * 0.4;
      e.y += Math.sin(ang) * e.speed * sm * dt * 0.4;
      // 패턴들
      e._gat = (e._gat || 0) - dt;
      e._mis = (e._mis || 0) - dt;
      e._tur = (e._tur || 0) - dt;
      e._rail = (e._rail || 0) - dt;
      // 페이즈 0+: 개틀링 (짧은 쿨다운 다중 사격)
      if (e._gat <= 0) {
        _aimedShot(e, 2 + phase, 0.15, 240, Math.floor(e.dmg * 0.7), 'fire', { r: 2, life: 2 });
        sfx('fire');
        e._gat = 0.35;
      }
      // 페이즈 0+: 유도 미사일 스프레드
      if (e._mis <= 0) {
        _aimedShot(e, 4 + phase*2, 0.4, 140, Math.floor(e.dmg * 1.1), 'fire', { r: 3, life: 3, homing: true });
        sfx('boss');
        e._mis = 3.2 - phase * 0.4;
      }
      // 페이즈 1+: 터렛 배치 (skeleton add)
      if (phase >= 1 && e._tur <= 0) {
        _summonAdd(e, 'skeleton', room);
        _summonAdd(e, 'skeleton', room);
        e._tur = 8;
        showMsg('TURRETS DEPLOYED', 1.5);
      }
      // 페이즈 2: 레일건 관통 (매우 빠른 관통탄 여러 발)
      if (phase === 2 && e._rail <= 0) {
        for (let i = 0; i < 3; i++) {
          const a = ang + (i - 1) * 0.08;
          entities.ebullets.push({
            x: e.x, y: e.y, vx: Math.cos(a) * 480, vy: Math.sin(a) * 480,
            r: 3, dmg: Math.floor(e.dmg * 1.6), life: 2, kind: 'fire', bossVis: e._trialCat,
          });
        }
        sfx('parry');
        state.shake = 6;
        e._rail = 2.8;
      }
    }
  },

  nature: {
    name: 'ELDER TITAN', color: '#3ac762', r: 16, baseHp: 1000000, baseDmg: 110,
    spriteKind: 'colossus', aura: 'rgba(58, 199, 98, 0.30)', accent: '#1a6a2a', glyph: '❦',
    update(e, dt, sm, room) {
      const ang = angleTo(e, player);
      const phase = _phaseOf(e);
      // 매우 느림
      e.x += Math.cos(ang) * e.speed * sm * dt * 0.25;
      e.y += Math.sin(ang) * e.speed * sm * dt * 0.25;
      e._vine = (e._vine || 0) - dt;
      e._wolf = (e._wolf || 0) - dt;
      e._quake = (e._quake || 0) - dt;
      e._regen = (e._regen || 0) - dt;
      // 넓은 원형 가시 볼트
      if (e._vine <= 0) {
        _ringShot(e, 10 + phase*4, 80, Math.floor(e.dmg * 0.9), 'fire', { r: 4, life: 4, offset: Math.random()*6.28 });
        sfx('boss');
        e._vine = 2.0;
      }
      // 페이즈 1+: 늑대 소환 (spider add)
      if (phase >= 1 && e._wolf <= 0) {
        _summonAdd(e, 'spider', room);
        _summonAdd(e, 'spider', room);
        _summonAdd(e, 'spider', room);
        e._wolf = 6;
        showMsg('WOLVES SUMMONED', 1.5);
      }
      // 페이즈 2: 지진 (지연 광역 - 여러 지점에서 나오는 큰 볼트)
      if (phase === 2 && e._quake <= 0) {
        for (let i = 0; i < 8; i++) {
          const rx = room.x + 20 + Math.random() * (room.w - 40);
          const ry = room.y + 20 + Math.random() * (room.h - 40);
          for (let j = 0; j < 6; j++) {
            const a = (j/6) * Math.PI * 2;
            entities.ebullets.push({
              x: rx, y: ry, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90,
              r: 4, dmg: Math.floor(e.dmg * 1.2), life: 2.5, kind: 'fire', bossVis: e._trialCat,
            });
          }
          spawnParticle(rx, ry, '#3ac762', 0.5, 12, 60);
        }
        state.shake = 10;
        sfx('parry');
        e._quake = 8;
      }
      // 전 페이즈: HP 리젠 (매우 위협적 - 빠른 딜 강요)
      if (e._regen <= 0) {
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.005);
        e._regen = 0.3;
      }
    }
  },

  chaos: {
    name: 'VOID ENTITY', color: '#c86ade', r: 13, baseHp: 700000, baseDmg: 140,
    spriteKind: 'seer', aura: 'rgba(200, 106, 222, 0.35)', accent: '#4a1a70', glyph: '✧',
    update(e, dt, sm, room) {
      const ang = angleTo(e, player);
      const phase = _phaseOf(e);
      // 완전 랜덤 이동
      e._wanderT = (e._wanderT || 0) - dt;
      if (e._wanderT <= 0) {
        e._wanderA = Math.random() * Math.PI * 2;
        e._wanderT = rand(0.5, 1.2);
      }
      e.x += Math.cos(e._wanderA) * e.speed * sm * dt * 0.7;
      e.y += Math.sin(e._wanderA) * e.speed * sm * dt * 0.7;
      e._blink = (e._blink || 0) - dt;
      e._chaos = (e._chaos || 0) - dt;
      e._tear = (e._tear || 0) - dt;
      // 자주 텔레포트
      if (e._blink <= 0) {
        _teleport(e, room);
        // 텔레포트 후 3중 링 (각도 다름)
        _ringShot(e, 10, 130, Math.floor(e.dmg * 0.8), 'fire', { offset: 0 });
        _ringShot(e, 10, 130, Math.floor(e.dmg * 0.8), 'ice',  { offset: 0.31 });
        e._blink = 3 - phase * 0.5;
      }
      // 카오스 스프레드 (랜덤 각도 볼트)
      if (e._chaos <= 0) {
        for (let i = 0; i < 6 + phase * 3; i++) {
          const a = Math.random() * Math.PI * 2;
          entities.ebullets.push({
            x: e.x, y: e.y, vx: Math.cos(a) * (100 + Math.random() * 100),
            vy: Math.sin(a) * (100 + Math.random() * 100),
            r: 3, dmg: e.dmg, life: 3, kind: Math.random() < 0.5 ? 'fire' : 'ice',
            bossVis: e._trialCat,
          });
        }
        sfx('fire');
        e._chaos = 1.4;
      }
      // 페이즈 2: 리얼리티 티어 (관통 대형 빔 스프레드)
      if (phase === 2 && e._tear <= 0) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          entities.ebullets.push({
            x: e.x, y: e.y, vx: Math.cos(a) * 350, vy: Math.sin(a) * 350,
            r: 5, dmg: Math.floor(e.dmg * 1.5), life: 2, kind: 'fire', bossVis: e._trialCat,
          });
        }
        showMsg('REALITY TEAR', 1.5);
        state.shake = 12;
        sfx('parry');
        e._tear = 5;
      }
    }
  },

  order: {
    name: 'JUDGMENT ANGEL', color: '#ffefa8', r: 14, baseHp: 900000, baseDmg: 115,
    spriteKind: 'wraith', aura: 'rgba(255, 239, 168, 0.35)', accent: '#ffefa8', glyph: '✝',
    update(e, dt, sm, room) {
      const ang = angleTo(e, player);
      const phase = _phaseOf(e);
      // 방 중앙으로 서서히 회귀 (성스러운 위치)
      const cx = room.x + room.w/2, cy = room.y + room.h/2;
      const toC = angleTo(e, {x:cx, y:cy});
      const dC = dist(e, {x:cx, y:cy});
      if (dC > 20) { e.x += Math.cos(toC) * e.speed * sm * dt * 0.5; e.y += Math.sin(toC) * e.speed * sm * dt * 0.5; }
      e._lance = (e._lance || 0) - dt;
      e._cross = (e._cross || 0) - dt;
      e._verdict = (e._verdict || 0) - dt;
      // 신성한 창 볼리 (조준, 관통)
      if (e._lance <= 0) {
        _aimedShot(e, 3 + phase, 0.12, 260, Math.floor(e.dmg * 1.2), 'fire', { r: 3, life: 3 });
        sfx('boss');
        e._lance = 1.6;
      }
      // 페이즈 1+: 십자 레이저 (4방향 대형 빔 회전)
      if (phase >= 1 && e._cross <= 0) {
        const base = (e._crossPhase || 0);
        for (let i = 0; i < 4; i++) {
          const a = base + i * Math.PI / 2;
          for (let k = 0; k < 5; k++) {
            entities.ebullets.push({
              x: e.x + Math.cos(a) * (10 + k*6), y: e.y + Math.sin(a) * (10 + k*6),
              vx: Math.cos(a) * 200, vy: Math.sin(a) * 200,
              r: 3, dmg: Math.floor(e.dmg * 1.0), life: 3, kind: 'fire', bossVis: e._trialCat,
            });
          }
        }
        e._crossPhase = (e._crossPhase || 0) + 0.4;
        sfx('ice');
        e._cross = 2.2;
      }
      // 페이즈 2: 심판 (전 방향 다중 링 - 회피 어려움)
      if (phase === 2 && e._verdict <= 0) {
        _ringShot(e, 24, 100, Math.floor(e.dmg * 1.4), 'fire', { offset: 0 });
        setTimeout(() => { if (e.hp > 0) _ringShot(e, 24, 130, Math.floor(e.dmg * 1.4), 'fire', { offset: 0.13 }); }, 250);
        setTimeout(() => { if (e.hp > 0) _ringShot(e, 24, 160, Math.floor(e.dmg * 1.4), 'fire', { offset: 0.26 }); }, 500);
        showMsg('FINAL JUDGMENT', 1.5);
        state.shake = 10;
        sfx('parry');
        e._verdict = 6;
      }
    }
  },
};

// 카테고리 → 보스 정의 조회 (없으면 magic 폴백)
function trialBossDefFor(cat) {
  return TRIAL_BOSS_DEFS[cat] || TRIAL_BOSS_DEFS.magic;
}

// === 2단계 시련 보스 ===
// MAX 스킬 트리를 모두 max 로 찍은 카테고리에서만 도전 가능. 40초 제한.
// HP = 1e7 (1천만). MAX 스킬 풀 세팅으로 40초 안에 뚫을 수 있는 수준.
const ULTRA_TRIAL_HP = 1e7;
const ULTRA_TRIAL_TIME_SEC = 40;
const ULTRA_TRIAL_BAN_MS = 10 * 60 * 1000;   // 실패 시 10분 쿨다운

// 2단계 보스는 1단계 것을 강화한 버전. 이름/색만 다르게 하고 패턴 CD 를 압축, DMG 증가.
function _makeUltraDef(baseDef, extra) {
  extra = extra || {};
  return Object.assign({}, baseDef, {
    name: 'ULTRA ' + baseDef.name,
    r: baseDef.r + 4,
    baseHp: ULTRA_TRIAL_HP,
    baseDmg: Math.round(baseDef.baseDmg * 3),   // DMG 3배 (플레이어도 ULTRA MAX 로 강해짐 전제)
    aura: extra.aura || 'rgba(255, 45, 45, 0.45)',
    accent: extra.accent || '#ff2d2d',
    // 원래 update 를 그대로 쓰되, 프레임마다 아이템 타이머 CD 절반화 훅으로 감쌈
    update(e, dt, sm, room) {
      // 패턴 속도 1.6배 (dt 부풀리기)
      baseDef.update(e, dt * 1.6, sm, room);
    },
  });
}
const ULTRA_TRIAL_BOSS_DEFS = {
  magic:       null, engineering: null, nature: null, chaos: null, order: null,
};
for (const cat of Object.keys(TRIAL_BOSS_DEFS)) {
  ULTRA_TRIAL_BOSS_DEFS[cat] = _makeUltraDef(TRIAL_BOSS_DEFS[cat]);
}

function ultraTrialBossDefFor(cat) {
  return ULTRA_TRIAL_BOSS_DEFS[cat] || ULTRA_TRIAL_BOSS_DEFS.magic;
}

// === 3단계: 초월의 시련 (TRANSCEND) - ULTRA 위 ===
// HP + DMG × 1e30 (사용자 요청). 초월 스킬 해금.
// 극단 밸런스: HP 추가 x100, DMG 추가 x100, 40초 제한, 부활 x2, HP 재생, 무적 페이즈.
const TRANSCEND_TRIAL_HP = ULTRA_TRIAL_HP * 1e32;      // 1e39 (기존 1e37 → x100)
const TRANSCEND_TRIAL_TIME_SEC = 40;                    // 60 → 40 초 압박
const TRANSCEND_TRIAL_BAN_MS = 60 * 60 * 1000;          // 30분 → 60분 쿨다운
const TRANSCEND_REGEN_PER_SEC = 0.005;                  // 매 초 최대 HP 0.5% 재생
const TRANSCEND_REBIRTH_HP_PCT = 0.30;                  // 30% 부활 (2 페이즈)

function _makeTranscendDef(baseDef) {
  return Object.assign({}, baseDef, {
    name: 'TRANSCEND ' + baseDef.name,
    r: baseDef.r + 12,
    baseHp: TRANSCEND_TRIAL_HP,
    baseDmg: Math.round(baseDef.baseDmg * 1e17),        // DMG 1e17 배 (기존 1e15 → x100)
    aura: 'rgba(255, 0, 255, 0.75)',
    accent: '#ff00ff',
    update(e, dt, sm, room) {
      // 페이즈 2 는 dt 왜곡을 x3 로 (기존 x2.2 대비 급격히 빨라짐)
      const warp = (e._trPhase === 2) ? 3.0 : 2.4;
      baseDef.update(e, dt * warp, sm, room);
      // HP 재생 - 초당 최대 HP의 0.5%
      if (!e._trInvuln || e._trInvuln <= 0) {
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * TRANSCEND_REGEN_PER_SEC * dt);
      } else {
        e._trInvuln -= dt;
        e.hitFlash = Math.max(e.hitFlash || 0, 0.15);
      }
      // 부활 트리거 - 30% HP 도달 시 무적 3초 + HP 유지 + DMG x3 + speed x2
      if (!e._trRebirthed && e.hp <= e.maxHp * TRANSCEND_REBIRTH_HP_PCT) {
        e._trRebirthed = true;
        e._trPhase = 2;
        e._trInvuln = 3.0;                              // 3초 완전 무적
        e.hp = e.maxHp * TRANSCEND_REBIRTH_HP_PCT;      // 유지
        e.dmg = Math.round(e.dmg * 3);
        e.speed = (e.speed || 40) * 2;
        state.shake = 40;
        state._slowMoUntil = performance.now() + 2000;
        if (typeof showMsg === 'function') showMsg('★★★ TRANSCEND 부활 - 완전 무적 3초 · DMG x3 · SPD x2 ★★★', 5);
        if (typeof sfx === 'function') sfx('bosskill');
        // 대폭발 이펙트
        if (typeof entities !== 'undefined' && entities.fx) {
          entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 1.5, max: 1.5, r0: 8, r1: 160, col: '#ff00ff' });
        }
        for (let i = 0; i < 100; i++) {
          const a = Math.random() * Math.PI * 2;
          const s2 = 80 + Math.random() * 120;
          if (typeof spawnParticle === 'function') spawnParticle(e.x, e.y, i % 2 ? '#ff00ff' : '#ffefa8', 1.5, 4, s2);
        }
      }
    },
  });
}
const TRANSCEND_TRIAL_BOSS_DEFS = {};
for (const cat of Object.keys(TRIAL_BOSS_DEFS)) {
  TRANSCEND_TRIAL_BOSS_DEFS[cat] = _makeTranscendDef(TRIAL_BOSS_DEFS[cat]);
}
function transcendTrialBossDefFor(cat) {
  return TRANSCEND_TRIAL_BOSS_DEFS[cat] || TRANSCEND_TRIAL_BOSS_DEFS.magic;
}

// 시련 보스 스폰 (buildRoom→spawnBoss 에서 trial 모드일 때 호출)
function spawnTrialBoss(room) {
  const cat = state.trialCategory || 'magic';
  const isStage2 = state.trialStage === 2;
  const isStage3 = state.trialStage === 3;
  const def = isStage3 ? transcendTrialBossDefFor(cat) : (isStage2 ? ultraTrialBossDefFor(cat) : trialBossDefFor(cat));
  const boss = {
    x: room.x + room.w/2, y: room.y + 50, vx: 0, vy: 0,
    r: def.r, kind: 'trial',           // 렌더 커스텀 브랜치가 처리 (drawEnemy 참조)
    hp: def.baseHp, maxHp: def.baseHp,
    dmg: def.baseDmg, speed: 40, xp: 0, gold: 0,
    hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
    isBoss: true, isTrialBoss: true,
    _trialUpdate: def.update,
    _trialName: def.name,
    _trialColor: def.color,
    _trialAccent: def.accent,
    _trialAura: def.aura,
    _trialGlyph: def.glyph,
    _trialSpriteKind: def.spriteKind,
    _trialCat: cat,
    _trialStage: isStage3 ? 3 : (isStage2 ? 2 : 1),
  };
  // 난이도 티어 배율 적용 (bossHpMult, dmgMult). 2단계 보스는 이미 1e44 HP 라 곱해도 큰 차이 없음.
  if (typeof currentDifficulty === 'function') {
    const diff = currentDifficulty();
    boss.hp *= (diff.bossHpMult || 1);
    boss.dmg = Math.round(boss.dmg * (diff.dmgMult || 1));
  }
  boss.maxHp = boss.hp;
  entities.enemies.push(boss);
  showMsg(def.name + ' 등장!', 2.5);
  sfx('boss');
  state.shake = isStage2 ? 20 : 12;
}

// updateEnemies 에서 dispatch (enemies.js 훅). 벽 클램프/사망 처리는 원본 루프가 담당.
function updateTrialBoss(e, dt, sm) {
  if (!e._trialUpdate) return;
  const room = rooms[currentRoom];
  if (!room) return;
  e._trialUpdate(e, dt, sm, room);
}
