// =====================================================================
// Professor Floor (교수 층) - CIPHER 문 통과 후 PROF 문으로 진입.
// 5명의 종파별 교수. HP=100M, 실제 SKILL_TREE 의 스킬을 castSlot 으로 시전.
// 등장 모션(투명→불투명 + 링 이펙트) / 사망 모션(폭발 파티클 + 페이드아웃).
// =====================================================================

const PROFESSOR_HP = 1000000000;        // 1B (10배 상향)
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
    dmg: 120, speed: 55, xp: 0, gold: 0,
    hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
    isBoss: true, isProfessor: true,
    baseDmg: 6, cdMult: 0.6, mods: { fire:1.5, ice:1.5, lmbCd:0.6, lmbDmg:1.5 },
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
  // 등장 애니메이션 - 무적, 이동/시전 없음
  if (e._profEntryT > 0) {
    e._profEntryT -= dt;
    e.invuln = 0.05;
    return;
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
          // ebullets 로 변환 (플레이어 피격 판정에 편입) - 데미지 대폭 상향
          entities.ebullets.push({
            x: b.x, y: b.y, vx: b.vx, vy: b.vy,
            r: b.r, dmg: Math.min(400, Math.max(35, Math.floor((b.dmg || 10) * 0.15))),
            life: b.life, kind: b.kind,
          });
          entities.bullets.splice(i, 1);
        }
      }
    }
    e._profShootCd = 0.35 + Math.random() * 0.25;   // 시전 주기 단축
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
  // 등장 시 "APPEARING" 배너
  if (e._profEntryT > 0) {
    const s = 'ENTERING...';
    drawText(s, e.x - textWidth(s)/2, e.y + e.r + 6, '#ffefa8');
  }
  ctx.globalAlpha = 1;
}
