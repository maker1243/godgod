// =====================================================================
// Professor Floor (교수 층) - CIPHER 문 통과 후 PROF 문으로 진입.
// 5명의 종파별 교수. HP=100M, 실제 SKILL_TREE 의 스킬을 castSlot 으로 시전.
// 등장 모션(투명→불투명 + 링 이펙트) / 사망 모션(폭발 파티클 + 페이드아웃).
// =====================================================================

const PROFESSOR_HP = 15000000000;       // 15B (기존 1B → 15배)
const PROFESSOR_ENTRY_SEC = 1.6;        // 등장 애니메이션 시간
const PROFESSOR_DEATH_SEC = 1.5;        // 사망 애니메이션 시간

// 5 종파의 교수 정의. slots 는 실제 SKILL_TREE 의 스킬 id.
// (기본/MAX/ULTRA 중 임팩트 있는 걸로. 없으면 skillTree.js 확인해 조정.)
const PROFESSOR_DEFS = [
  { key:'ignis',  name:'PROF. IGNIS',   title:'MAGIC',       cat:'magic',
    color:'#ff9c3d', spriteKind:'lich',
    slots:{ lmb:'m11', q:'m22', e:'m14' } },     // LIGHTNING / FROSTLANCE / TIMESTOP
  { key:'cog',    name:'PROF. COG',     title:'ENGINEERING', cat:'engineering',
    color:'#e8c547', spriteKind:'colossus',
    slots:{ lmb:'e16', q:'e22', e:'e29' } },     // RAILGUN / CANNON / MISSILE POD
  { key:'verdant',name:'PROF. VERDANT', title:'NATURE',      cat:'nature',
    color:'#3ac762', spriteKind:'colossus',
    slots:{ lmb:'n01', q:'n06', e:'n11' } },     // SEED / EARTH / EARTHQUAKE
  { key:'void',   name:'PROF. NULL',    title:'CHAOS',       cat:'chaos',
    color:'#c86ade', spriteKind:'seer',
    slots:{ lmb:'c01', q:'c05', e:'c09' } },     // CHAOS bolts
  { key:'sanctus',name:'PROF. SANCTUS', title:'ORDER',       cat:'order',
    color:'#ffefa8', spriteKind:'wraith',
    slots:{ lmb:'o01', q:'o06', e:'o11' } },     // HOLY family
];

function professorDefByRoom(idx) {
  return PROFESSOR_DEFS[idx % PROFESSOR_DEFS.length];
}

function spawnProfessor(room, roomIndex) {
  const def = professorDefByRoom((roomIndex || 1) - 1);
  const boss = {
    x: room.x + room.w/2, y: room.y + 50, vx: 0, vy: 0,
    r: 12,
    kind: 'professor',
    hp: PROFESSOR_HP, maxHp: PROFESSOR_HP,
    dmg: 1800, speed: 55, xp: 0, gold: 0,
    hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
    isBoss: true, isProfessor: true,
    baseDmg: 90, cdMult: 0.6, mods: { fire:1.5, ice:1.5, lmbCd:0.6, lmbDmg:1.5 },
    slots: def.slots, cd: {},
    dmgReduction: 0.55, lifesteal: 0, thorns: 0, crit: 0.2, critMult: 2.5, mpCostMult: 0.5,
    perks: [], mp: 300, maxMp: 300, mpRegenBonus: 50,
    // 커스텀 필드
    _profDef: def,
    _profEntryT: PROFESSOR_ENTRY_SEC,     // 등장 애니메이션 남은 시간
    _profDeathT: 0,                       // 0 = 살아있음, > 0 = 사망 애니메이션 진행 중
    _profShootCd: 0.5,
    _profMoveAng: 0,
    _profMoveT: 0,
  };
  entities.enemies.push(boss);
  showMsg(def.name + ' — ' + def.title + ' 교수 등장!', 3);
  sfx('boss');
  state.shake = 12;
  // 등장 링 이펙트
  if (entities.fx) {
    entities.fx.push({ type:'ring', x: boss.x, y: boss.y, life: 1.2, max: 1.2, r0: 4, r1: 40, col: def.color });
    entities.fx.push({ type:'ring', x: boss.x, y: boss.y, life: 1.6, max: 1.6, r0: 8, r1: 60, col: '#ffffff' });
  }
}

// updateEnemies dispatch 훅. 사망/등장 애니메이션 + AI.
// 반환값: true 면 표준 사망 처리 건너뛰기 (이 함수가 사망 애니를 다룸).
function updateProfessor(e, dt, sm) {
  // 페이즈 전환 배너 카운트다운
  if (e._profPhaseT > 0) e._profPhaseT -= dt;
  // 등장 애니메이션 - 무적, 이동/시전 없음
  if (e._profEntryT > 0) {
    e._profEntryT -= dt;
    e.invuln = 0.05;
    return;
  }
  // 페이즈 2 전환: HP 50% 이하 + 아직 phase 1이면 → phase 2 진입
  if (e._profPhase === 1 && e.hp > 0 && e.hp <= e.maxHp * 0.5) {
    e._profPhase = 2;
    e._profPhaseT = 2.5;
    // 페이즈 버프: DMG +50%, 시전 속도 +50%
    e.baseDmg *= 1.5;
    e.cdMult *= 0.6;
    if (e.mods) { e.mods.fire = (e.mods.fire || 1) * 1.4; e.mods.ice = (e.mods.ice || 1) * 1.4; }
    e.dmgReduction = Math.min(0.8, (e.dmgReduction || 0) + 0.15);
    e.invuln = 0.6;   // 짧은 무적으로 임팩트
    // 폭발 이펙트
    if (entities.fx) {
      entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 0.8, max: 0.8, r0: 4, r1: 40, col: e._profDef.color });
      entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 1.0, max: 1.0, r0: 8, r1: 60, col: '#ff2d80' });
    }
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      spawnParticle(e.x, e.y, i % 2 ? e._profDef.color : '#ff2d80', 0.7, 3, 80);
    }
    state.shake = 14;
    sfx('boss');
    if (typeof showMsg === 'function') showMsg(e._profDef.name + ' — PHASE 2!', 2.5);
  }
  // 교장은 페이즈 3까지
  if (e._isPrincipal && e._profPhase === 2 && e.hp > 0 && e.hp <= e.maxHp * 0.25) {
    e._profPhase = 3;
    e._profPhaseT = 3;
    e.baseDmg *= 1.8;
    e.cdMult *= 0.5;
    if (e.mods) { e.mods.fire = (e.mods.fire || 1) * 1.6; e.mods.ice = (e.mods.ice || 1) * 1.6; }
    e.invuln = 1.0;
    e.hp = Math.max(e.hp, e.maxHp * 0.25);   // 잠깐 무적으로 최소 유지
    if (entities.fx) {
      entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 1.4, max: 1.4, r0: 6, r1: 80, col: '#ff0000' });
      entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 1.8, max: 1.8, r0: 10, r1: 120, col: '#ffffff' });
    }
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      spawnParticle(e.x, e.y, i % 2 ? '#ff2020' : '#ffffff', 1.2, 4, 120);
    }
    state.shake = 24;
    sfx('boss');
    if (typeof showMsg === 'function') showMsg(e._profDef.name + ' — FINAL PHASE!', 3);
  }
  // 사망 애니메이션 진행 중이면 위치/AI 정지, 카운트만 감소
  if (e._profDeathT > 0) {
    e._profDeathT -= dt;
    // 파티클 계속 뿌리기
    if (Math.random() < 0.6) {
      spawnParticle(e.x + rand(-8, 8), e.y + rand(-8, 8), e._profDef.color, 0.6, 3, 60);
    }
    return;
  }

  // 사망 판정 (여기서 시작 - 정상 splice 를 막고 애니메이션 진입)
  if (e.hp <= 0) {
    e._profDeathT = PROFESSOR_DEATH_SEC;
    e.hp = 0;
    // 큰 폭발 + 링 두 개
    if (entities.fx) {
      entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 0.7, max: 0.7, r0: 4, r1: 50, col: e._profDef.color });
      entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 1.0, max: 1.0, r0: 6, r1: 80, col: '#ffffff' });
    }
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      spawnParticle(e.x, e.y, i % 2 ? e._profDef.color : '#ffffff', 1.0, 3 + Math.random()*3, 40 + Math.random()*80);
    }
    state.shake = 18;
    sfx('level');
    if (typeof showMsg === 'function') showMsg(e._profDef.name + ' 격파!', 3);
    return;
  }

  // === 정상 AI ===
  const room = rooms[currentRoom];
  if (!room) return;
  const d = dist(e, player);
  const ang = angleTo(e, player);
  // MP 리젠
  e.mp = Math.min(e.maxMp, e.mp + (e.mpRegenBonus || 10) * dt);
  for (const k in e.cd) e.cd[k] = Math.max(0, e.cd[k] - dt);

  // 이동: 유지 거리 90 - 원 그리며 조금씩 회전
  e._profMoveT += dt;
  if (e._profMoveT > 1.5) { e._profMoveT = 0; e._profMoveAng = Math.random() < 0.5 ? 1 : -1; }
  const desired = 90;
  let mvAng;
  if (d < desired - 10) mvAng = ang + Math.PI;
  else if (d > desired + 10) mvAng = ang;
  else mvAng = ang + Math.PI/2 * e._profMoveAng;
  e.x = clamp(e.x + Math.cos(mvAng) * e.speed * sm * dt, room.x + 8, room.x + room.w - 8);
  e.y = clamp(e.y + Math.sin(mvAng) * e.speed * sm * dt, room.y + 8, room.y + room.h - 8);

  // 시전: castSlot 을 그대로 사용 (실제 스킬트리의 shot/nova 로직 재사용)
  e._profShootCd -= dt;
  if (e._profShootCd <= 0) {
    // 우선순위: e > q > lmb. 랜덤 흔들림 소량.
    const shootAng = ang + (Math.random() - 0.5) * 0.15;
    const before = entities.bullets.length;
    if (typeof castSlot === 'function') {
      // castSlot 은 player.slots/cd 를 씀. 교수도 같은 필드를 갖고 있음.
      let cast = false;
      try {
        cast = castSlot(e, 'e', shootAng) || castSlot(e, 'q', shootAng) || castSlot(e, 'lmb', shootAng);
      } catch(err) { /* 무시 */ }
      // 새로 만든 bullets 는 아군 → 적으로 반대편이 되도록 ebullets 로 이동시키고 dmg 축소
      if (cast) {
        for (let i = entities.bullets.length - 1; i >= before; i--) {
          const b = entities.bullets[i];
          // ebullets 로 변환. visual 은 학과 테마로 override (있으면).
          entities.ebullets.push({
            x: b.x, y: b.y, vx: b.vx, vy: b.vy,
            r: b.r,
            dmg: Math.min(6000, Math.max(500, Math.floor((b.dmg || 10) * 0.15))),
            life: b.life, kind: b.kind,
            visual: (e._profDef && e._profDef.visual) || b.visual || null,
          });
          entities.bullets.splice(i, 1);
        }
      }
    }
    e._profShootCd = 0.35 + Math.random() * 0.25;
  }

  // === 시그니처 스킬 (교수 학과 테마 독특 공격) ===
  e._profSigCd = (e._profSigCd || 4) - dt;
  if (e._profSigCd <= 0 && e._profDef && e._profDef.signature) {
    _profSignatureCast(e, e._profDef.signature, angleTo(e, player));
    // 페이즈 2+ 이거나 20% 확률로 추가 랜덤 패턴
    if ((e._profPhase >= 2) || Math.random() < 0.2) _profExtraPattern(e);
    // 교장은 매번 추가 패턴
    if (e._isPrincipal) _profExtraPattern(e);
    e._profSigCd = e._isPrincipal ? (2.5 + Math.random()) : (4 + Math.random() * 2);
  }
}

// 학과별 시그니처 공격 - 각각 완전히 다른 패턴. 발사체는 학과 테마 visual 로.
function _profSignatureCast(e, sig, ang) {
  const vis = (e._profDef && e._profDef.visual) || null;
  const col = (e._profDef && e._profDef.color) || '#ffefa8';
  const dmg = 750 + Math.floor(Math.random() * 450);
  const push = (opts) => entities.ebullets.push(Object.assign({
    x: e.x, y: e.y, r: 3, dmg, life: 3, kind: 'fire', visual: vis
  }, opts));

  if (sig === 'burst' || sig === 'ring') {
    // 방사형 8발
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      push({ vx: Math.cos(a) * 140, vy: Math.sin(a) * 140 });
    }
  } else if (sig === 'spread' || sig === 'volley') {
    // 조준 5발 부채꼴
    for (let i = -2; i <= 2; i++) {
      const a = ang + i * 0.18;
      push({ vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, r: 4 });
    }
  } else if (sig === 'wave' || sig === 'infloop') {
    // 파도 3발 (물리 wave 로직은 visual 이 알아서)
    for (let i = -1; i <= 1; i++) {
      const a = ang + i * 0.12;
      push({ vx: Math.cos(a) * 130, vy: Math.sin(a) * 130, r: 3, life: 4 });
    }
  } else if (sig === 'orbit') {
    // 궤도 8발 (visual atom 이 spiral 이면 시각적으로 궤도 형태)
    for (let i = 0; i < 8; i++) {
      const a = ang + (i - 3.5) * 0.15;
      push({ vx: Math.cos(a) * 160, vy: Math.sin(a) * 160 });
    }
  } else if (sig === 'stream') {
    // 3연발 순차 (같은 각도, 짧은 딜레이는 시각적)
    for (let i = 0; i < 3; i++) {
      push({ vx: Math.cos(ang) * (180 + i*40), vy: Math.sin(ang) * (180 + i*40), r: 2 });
    }
  } else if (sig === 'saw') {
    // 톱니바퀴 회전탄 - 원형 배치 + spin 회전 시각
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      push({ vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, r: 4, dmg: dmg * 1.2 });
    }
  } else if (sig === 'cross') {
    // 4방향 대형 십자
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      push({ vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 5, dmg: dmg * 1.3 });
    }
  } else if (sig === 'toss') {
    // 3방향 캡슐 (약병 던지기)
    for (let i = -1; i <= 1; i++) {
      const a = ang + i * 0.35;
      push({ vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, r: 4, life: 2.5 });
    }
  } else if (sig === 'bounce') {
    // 공 세 개 지그재그
    for (let i = -1; i <= 1; i++) {
      const a = ang + i * 0.25;
      push({ vx: Math.cos(a) * 130, vy: Math.sin(a) * 130, r: 4, life: 3.5 });
    }
  } else if (sig === 'splash') {
    // 방사형 랜덤 색상 12발
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      push({ vx: Math.cos(a) * (80 + Math.random()*120), vy: Math.sin(a) * (80 + Math.random()*120), r: 3 });
    }
  } else if (sig === 'chord') {
    // 음표 화음 - 3개의 조준탄 다른 간격
    for (const off of [-0.3, 0, 0.3]) {
      const a = ang + off;
      push({ vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 3, life: 3 });
    }
  } else {
    // 폴백 - 8방향 링
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      push({ vx: Math.cos(a) * 140, vy: Math.sin(a) * 140 });
    }
  }
  spawnParticle(e.x, e.y, col, 0.5, 12, 60);
  if (entities.fx) entities.fx.push({ type:'ring', x: e.x, y: e.y, life: 0.4, max: 0.4, r0: 6, r1: 20, col });
  sfx('boss');

  // === 교장 전용 추가 패턴 (phase 별 다르게) ===
  if (e._isPrincipal) {
    const phase = e._profPhase || 1;
    if (phase >= 2) {
      // 페이즈 2+: 방사형 링 2배 + 지연 두번째 링
      for (let i = 0; i < 16; i++) {
        const a2 = (i / 16) * Math.PI * 2 + Math.PI / 16;
        push({ vx: Math.cos(a2) * 220, vy: Math.sin(a2) * 220, r: 4, dmg: dmg * 1.2 });
      }
      setTimeout(() => {
        if (e.hp <= 0 || !entities.enemies.includes(e)) return;
        for (let i = 0; i < 20; i++) {
          const a3 = (i / 20) * Math.PI * 2;
          entities.ebullets.push({
            x: e.x, y: e.y, vx: Math.cos(a3) * 160, vy: Math.sin(a3) * 160,
            r: 4, dmg: dmg * 1.3, life: 3, kind: 'fire', visual: vis,
          });
        }
      }, 400);
    }
    if (phase >= 3) {
      // 페이즈 3: 화면 전체 대각 십자 라이트닝 4방향 관통
      for (let dir = 0; dir < 4; dir++) {
        const a4 = dir * Math.PI / 2 + Math.PI / 4;
        push({ vx: Math.cos(a4) * 500, vy: Math.sin(a4) * 500, r: 6, dmg: dmg * 2, life: 3 });
      }
      state.shake = Math.max(state.shake || 0, 18);
    }
  }
}

// 교수 다양성용 랜덤 서브 패턴 (일반 시전에도 20% 확률로 추가 발동)
function _profExtraPattern(e) {
  const sig = (e._profDef && e._profDef.signature) || null;
  const vis = (e._profDef && e._profDef.visual) || null;
  const dmg = 300 + Math.floor(Math.random() * 200);
  const ang = angleTo(e, player);
  const rand = Math.random();
  const push = (opts) => entities.ebullets.push(Object.assign({
    x: e.x, y: e.y, r: 3, dmg, life: 3, kind: 'fire', visual: vis
  }, opts));
  if (rand < 0.25) {
    // 십자 4발
    for (let d = 0; d < 4; d++) {
      const a = d * Math.PI / 2;
      push({ vx: Math.cos(a) * 200, vy: Math.sin(a) * 200 });
    }
  } else if (rand < 0.5) {
    // 나선 8발 - 각도 회전
    for (let d = 0; d < 8; d++) {
      const a = ang + d * 0.4;
      push({ vx: Math.cos(a) * (100 + d * 15), vy: Math.sin(a) * (100 + d * 15) });
    }
  } else if (rand < 0.75) {
    // 뒷쪽까지 포함 8방향
    for (let d = 0; d < 8; d++) {
      const a = (d / 8) * Math.PI * 2;
      push({ vx: Math.cos(a) * 130, vy: Math.sin(a) * 130 });
    }
  } else {
    // 조준 3발 + 좌우로 스프레드 각 2발 = 7발
    for (let i = -3; i <= 3; i++) {
      push({ vx: Math.cos(ang + i * 0.12) * 180, vy: Math.sin(ang + i * 0.12) * 180 });
    }
  }
}

// enemies 렌더에서 hook. 등장/사망 애니메이션 오버레이 + 스프라이트.
function drawProfessor(e) {
  const def = e._profDef;
  const t = state.time;
  // 등장: alpha 0→1, 스케일 1.6→1.0
  let alpha = 1;
  if (e._profEntryT > 0) {
    const p = 1 - (e._profEntryT / PROFESSOR_ENTRY_SEC);   // 0→1
    alpha = p;
    // 등장 오라 - pulsing
    ctx.fillStyle = 'rgba(255,255,255,' + (0.4 * (1 - p)).toFixed(2) + ')';
    ctx.fillRect((e.x - 30 + 30*p)*PX, (e.y - 30 + 30*p)*PX, (60 - 60*p)*PX, (60 - 60*p)*PX);
  }
  // 사망: alpha 1→0
  if (e._profDeathT > 0) {
    alpha = e._profDeathT / PROFESSOR_DEATH_SEC;
    // 사망 링 (계속 확장)
    const dp = 1 - alpha;
    ctx.strokeStyle = def.color;
    ctx.lineWidth = PX * 2;
    ctx.beginPath();
    ctx.arc(e.x * PX, e.y * PX, (10 + dp * 30) * PX, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = alpha;
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect((e.x - e.r)*PX, (e.y + e.r - 1)*PX, (e.r*2)*PX, PX);
  // 종파 오라
  ctx.fillStyle = def.color;
  ctx.globalAlpha = alpha * (0.15 + Math.sin(t*3)*0.08);
  ctx.fillRect((e.x - 18)*PX, (e.y - 18)*PX, 36*PX, 36*PX);
  ctx.globalAlpha = alpha;
  // 스프라이트
  const sk = def.spriteKind;
  const oy = Math.sin(t * 2) * 2;
  if (sk === 'lich')          drawSprite(SPR_LICH,     LICH_PAL,   e.x - 10, e.y - 12 + oy);
  else if (sk === 'colossus') drawSprite(SPR_COLOSSUS, DRAGON_PAL, e.x - 11, e.y - 12);
  else if (sk === 'seer')     drawSprite(SPR_SEER,     SEER_PAL,   e.x - 8,  e.y - 11 + oy);
  else if (sk === 'wraith')   drawSprite(SPR_WRAITH,   WRAITH_PAL, e.x - 6,  e.y - 8 + oy);
  else                        drawSprite(SPR_LICH,     LICH_PAL,   e.x - 10, e.y - 12 + oy);
  // 이름표
  drawText(def.name, e.x - textWidth(def.name)/2, e.y - e.r - 16, def.color);
  drawText('[' + def.title + ']', e.x - textWidth('[' + def.title + ']')/2, e.y - e.r - 8, '#c8b898');
  // 페이즈 배너 (전환 순간)
  if (e._profPhaseT > 0) {
    const p = 'PHASE ' + e._profPhase;
    ctx.globalAlpha = Math.min(1, e._profPhaseT / 0.6);
    drawText(p, e.x - textWidth(p, 2)/2, e.y - e.r - 26, '#ff2d80', 2);
  }
  ctx.globalAlpha = 1;

  // === 업적 소개 애니메이션 (등장 페이즈) ===
  if (e._profEntryT > 0 && e._profDef.achievements && e._profDef.achievements.length) {
    const total = e._profEntryTotal || PROFESSOR_ENTRY_SEC;
    const elapsed = total - e._profEntryT;
    // 화면 하단 중앙에 업적 카드 UI
    const cardX = 24, cardY = H - 68, cardW = W - 48, cardH = 62;
    // 카드 반투명 슬라이드 인 (0.4s)
    const inA = Math.min(1, elapsed / 0.4);
    ctx.globalAlpha = inA;
    pxDraw(cardX, cardY, cardW, cardH, '#050310');
    pxDraw(cardX, cardY, cardW, 1, def.color);
    pxDraw(cardX, cardY + cardH - 1, cardW, 1, def.color);
    pxDraw(cardX, cardY, 1, cardH, def.color);
    pxDraw(cardX + cardW - 1, cardY, 1, cardH, def.color);
    // 헤더: 이름 · 학과 · 계열
    drawText(def.name + ' — ' + def.title, cardX + 6, cardY + 4, def.color);
    drawText('[' + (def.faculty || '') + ']', cardX + cardW - textWidth('[' + (def.faculty || '') + ']') - 6, cardY + 4, '#8a7ab5');
    pxDraw(cardX + 4, cardY + 12, cardW - 8, 1, '#3a1e5c');
    // 업적 리스트 - 순차적으로 fade-in
    const perLine = Math.max(0.35, (total - 0.4) / (e._profDef.achievements.length + 1));
    let ly = cardY + 16;
    for (let i = 0; i < e._profDef.achievements.length; i++) {
      const showAt = 0.4 + i * perLine;
      if (elapsed < showAt) break;
      const lineA = Math.min(1, (elapsed - showAt) / 0.35);
      ctx.globalAlpha = inA * lineA;
      drawText('• ' + e._profDef.achievements[i], cardX + 8, ly, '#e8d9b0');
      ly += 9;
    }
    ctx.globalAlpha = inA;
    // "출강 준비 중..." 하단 안내
    if (elapsed > 0.6) {
      const eta = Math.max(0, e._profEntryT);
      const s = eta > 0.1 ? '전투 시작까지... ' + eta.toFixed(1) + 's' : '전투 시작!';
      drawText(s, cardX + cardW/2 - textWidth(s)/2, cardY + cardH - 9, '#ffefa8');
    }
    ctx.globalAlpha = 1;
  } else if (e._profEntryT > 0) {
    // 폴백 (업적 없음): 기존 배너
    const s = 'ENTERING...';
    drawText(s, e.x - textWidth(s)/2, e.y + e.r + 6, '#ffefa8');
  }
}
