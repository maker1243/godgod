// =====================================================================
// Professor Floor (교수 층) - CIPHER 문 통과 후 PROF 문으로 진입.
// 5명의 종파별 교수. HP=100M, 실제 SKILL_TREE 의 스킬을 castSlot 으로 시전.
// 등장 모션(투명→불투명 + 링 이펙트) / 사망 모션(폭발 파티클 + 페이드아웃).
// =====================================================================

const PROFESSOR_HP = 525000000000;      // 525B (기존 15B → 35배)

// =====================================================================
// 교수 등장 서사 애니메이션 — 각 교수가 살았던 시대의 짧은 실루엣 씬.
// 학과 키 → 배경(setting) 매핑. 실루엣은 pxDraw 로 그리는 간단한 픽셀 아트.
// 4.5s(교장 6s) 동안 STORY_FRAGMENTS 의 라인이 아래쪽에 순차 나레이션.
// =====================================================================
const PROF_ERA_SETTING = {
  kor:'library', eng:'library', chn:'library', jpn:'library',
  biz:'court', media:'court',
  psy:'chapel', phil:'chapel', rel:'chapel',
  phys:'lab', chem:'lab',
  cs:'workshop', robot:'workshop', vdesign:'workshop', info:'workshop', lib:'library',
  math:'observatory',
  pe:'gym',
  paint:'studio', sculpt:'studio', vocal:'chapel',
  med:'chapel', phar:'chapel',
  principal:'throne',
};

// 실루엣 씬 렌더러 — 배경 + 소품 + 교수 실루엣. (cx, cy)는 씬 중앙.
// t: 0..1 진행률. def: 교수 정의 (색 사용).
function _drawEraScene(setting, cx, cy, w, h, t, def) {
  // 어두운 배경 그라디언트
  const grad = ctx.createLinearGradient(0, cy*PX, 0, (cy + h/2)*PX);
  grad.addColorStop(0, '#050310');
  grad.addColorStop(1, '#1a0e2e');
  ctx.fillStyle = grad;
  ctx.fillRect((cx - w/2)*PX, (cy - h/2)*PX, w*PX, h*PX);

  const col = def && def.color || '#8bd8ff';
  const acc = def && def.accent || col;
  const dark = '#0a0510';

  // 배경별 실루엣
  if (setting === 'library') {
    // 책장 줄줄이 + 촛불
    for (let i = 0; i < 4; i++) {
      const bx = cx - w/2 + 8 + i * (w/4);
      pxDraw(bx, cy - h/2 + 8, w/4 - 4, h - 20, dark);
      for (let r = 0; r < 4; r++) pxDraw(bx + 1, cy - h/2 + 10 + r * 6, w/4 - 6, 1, col);
    }
    // 촛불 (깜박임)
    const flick = Math.sin(t * 30) * 0.5 + 0.5;
    pxDraw(cx - w/2 + 4, cy + h/2 - 12, 2, 6, acc);
    pxDraw(cx - w/2 + 4, cy + h/2 - 14 - flick, 2, 2, '#ffefa8');
    pxDraw(cx + w/2 - 6, cy + h/2 - 12, 2, 6, acc);
    pxDraw(cx + w/2 - 6, cy + h/2 - 14 - flick, 2, 2, '#ffefa8');
  } else if (setting === 'lab') {
    // 실험 테이블 + 플라스크 + 방울
    pxDraw(cx - w/2 + 6, cy + h/2 - 12, w - 12, 3, dark);
    for (let i = 0; i < 3; i++) {
      const fx = cx - w/2 + 12 + i * (w/3);
      pxDraw(fx, cy + h/2 - 20, 5, 6, col);
      pxDraw(fx + 1, cy + h/2 - 22, 3, 2, acc);
      if (Math.random() < 0.4) spawnParticle(fx + 2, cy + h/2 - 24, acc, 0.5, 1, 20);
    }
    // 배경 격자
    for (let i = 0; i < 6; i++) pxDraw(cx - w/2 + i * (w/6), cy - h/2 + 4, 1, h - 12, dark);
  } else if (setting === 'workshop') {
    // 톱니바퀴 + 회로 라인
    const t2 = t * 6;
    for (let i = 0; i < 3; i++) {
      const gx = cx - w/2 + 8 + i * (w/3);
      const gy = cy;
      for (let g = 0; g < 4; g++) {
        const ga = t2 + g * Math.PI/2;
        pxDraw(gx + Math.cos(ga) * 4 - 1, gy + Math.sin(ga) * 4 - 1, 2, 2, col);
      }
      pxDraw(gx - 1, gy - 1, 2, 2, acc);
    }
    // 회로 라인
    for (let y = cy - h/2 + 6; y < cy + h/2 - 6; y += 6) pxDraw(cx - w/2 + 4, y, w - 8, 1, dark);
  } else if (setting === 'studio') {
    // 이젤 + 팔레트 + 물감 방울
    pxDraw(cx - 6, cy - 4, 12, 14, dark);
    for (let i = 0; i < 4; i++) {
      const px = cx - 5 + i * 3;
      pxDraw(px, cy - 2, 2, 2, i % 2 ? col : acc);
    }
    // 이젤 다리
    pxDraw(cx - 2, cy + 10, 1, 8, dark);
    pxDraw(cx + 1, cy + 10, 1, 8, dark);
    // 물감 파티클
    if (Math.random() < 0.5) spawnParticle(cx + rand(-w/2, w/2), cy + rand(-h/2, h/2), Math.random() < 0.5 ? col : acc, 0.5, 2, 20);
  } else if (setting === 'chapel') {
    // 십자가 + 아치 + 촛불
    pxDraw(cx - 1, cy - h/2 + 6, 2, 20, col);
    pxDraw(cx - 5, cy - h/2 + 12, 10, 2, col);
    // 아치 (외곽)
    for (let a = 0; a < Math.PI; a += 0.2) {
      pxDraw(cx + Math.cos(a) * (w/2 - 6) - 0.5, cy - h/2 + 6 - Math.sin(a) * 8 - 0.5, 1, 1, dark);
    }
    // 광배
    const glow = (Math.sin(t * 4) + 1) * 0.3 + 0.2;
    ctx.fillStyle = 'rgba(255, 239, 168, ' + glow.toFixed(2) + ')';
    ctx.fillRect((cx - 8) * PX, (cy - h/2 + 4) * PX, 16 * PX, 12 * PX);
  } else if (setting === 'observatory') {
    // 밤하늘 + 별 + 망원경
    for (let i = 0; i < 20; i++) {
      const sx = cx - w/2 + Math.random() * w;
      const sy = cy - h/2 + Math.random() * (h - 10);
      pxDraw(sx, sy, 1, 1, Math.random() < 0.5 ? col : '#ffefa8');
    }
    // 망원경 (기울어진 관)
    pxDraw(cx - 8, cy + h/2 - 6, 16, 3, dark);
    pxDraw(cx + 4, cy + h/2 - 12, 6, 6, dark);
  } else if (setting === 'gym') {
    // 트랙 라인 + 러너 실루엣
    pxDraw(cx - w/2 + 4, cy + h/2 - 4, w - 8, 1, col);
    for (let i = 0; i < 3; i++) pxDraw(cx - w/2 + 6 + i * (w/3), cy + h/2 - 8, 4, 4, dark);
  } else if (setting === 'court') {
    // 법정/이사회 - 사각 테이블 + 의자 + 판사석
    pxDraw(cx - w/2 + 6, cy, w - 12, 4, dark);   // 테이블
    for (let i = 0; i < 5; i++) {
      pxDraw(cx - w/2 + 8 + i * (w/5), cy + 6, 3, 6, dark);   // 의자
    }
    pxDraw(cx - 4, cy - h/2 + 6, 8, 4, col);   // 판사봉/문양
  } else if (setting === 'throne') {
    // 옥좌 + 붉은 카펫 + 어두운 왕관
    pxDraw(cx - 8, cy, 16, 14, dark);   // 옥좌
    pxDraw(cx - 2, cy - 4, 4, 4, '#ff0060');   // 왕관 심장
    pxDraw(cx - 6, cy - 8, 12, 2, dark);   // 왕관 밴드
    pxDraw(cx - 5, cy - 10, 1, 2, dark);
    pxDraw(cx, cy - 12, 1, 4, dark);
    pxDraw(cx + 4, cy - 10, 1, 2, dark);
    // 붉은 카펫
    pxDraw(cx - w/2 + 4, cy + h/2 - 3, w - 8, 3, '#7a1010');
  }

  // 좌하단 시대 배경 안내 텍스트 (부제)
  const settingLabel = (state.lang === 'en') ? _ERA_LABEL_EN[setting] : _ERA_LABEL_KO[setting];
  if (settingLabel) drawText(settingLabel, cx - w/2 + 4, cy + h/2 - 8, '#8a7ab5');

  // 교수 실루엣 (씬 중앙, 흔들림)
  const swayX = Math.sin(t * 3) * 2;
  const sil = _profPalette(def);
  // 실루엣 톤 (더 어둡게)
  const shadow = Object.assign({}, sil);
  for (const k of Object.keys(shadow)) shadow[k] = _shade(sil[k], -60);
  // 실루엣 백라이트
  ctx.fillStyle = col + '55';
  ctx.fillRect((cx - 8 + swayX) * PX, (cy - 12) * PX, 16 * PX, 16 * PX);
  drawSprite(SPR_PLAYER_S1, shadow, cx - 6 + swayX, cy - 7);
}

const _ERA_LABEL_KO = {
  library:'~ 도서관에서 ~', lab:'~ 실험실에서 ~', workshop:'~ 공방에서 ~',
  studio:'~ 아틀리에에서 ~', chapel:'~ 예배당에서 ~', observatory:'~ 천문대에서 ~',
  gym:'~ 훈련장에서 ~', court:'~ 이사회에서 ~', throne:'~ 총장실에서 ~',
};
const _ERA_LABEL_EN = {
  library:'~ In the Library ~', lab:'~ In the Laboratory ~', workshop:'~ In the Workshop ~',
  studio:'~ In the Atelier ~', chapel:'~ In the Chapel ~', observatory:'~ In the Observatory ~',
  gym:'~ In the Training Hall ~', court:'~ In the Boardroom ~', throne:'~ In the Principal\'s Office ~',
};

// hex 색상을 약간 어둡게/밝게 조정 (팔레트용).
function _shade(hex, amt) {
  const c = hex.replace('#','');
  const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
  const nr = Math.max(0, Math.min(255, Math.round(r + amt)));
  const ng = Math.max(0, Math.min(255, Math.round(g + amt)));
  const nb = Math.max(0, Math.min(255, Math.round(b + amt)));
  return '#' + nr.toString(16).padStart(2,'0') + ng.toString(16).padStart(2,'0') + nb.toString(16).padStart(2,'0');
}

// 교수 팔레트: PLAYER_PAL 기반에 로브(2/3)와 별(6) 을 def.color 로 대체.
// 모자(7) 는 로브 어두운 톤. 피부 등 나머지 원본 유지.
function _profPalette(def) {
  const base = def.color || '#7d4dbf';
  const p = Object.assign({}, PLAYER_PAL);
  p['2'] = _shade(base, -50);   // 로브 (어두운 톤)
  p['3'] = base;                // 로브 하이라이트 (원색)
  p['6'] = (def.accent || def.color || '#e8c547');   // 별/장식
  p['7'] = _shade(base, -80);   // 모자
  p['1'] = _shade(base, -100);  // 로브 외곽
  return p;
}

// 학과 심볼 - 로브 위에 4x4 미니 문양. def.key 별로 다른 도트 패턴.
const _EMBLEM_MAP = {
  // hangul jamo
  kor:  [[0,0],[1,0],[2,0],[0,1],[0,2],[1,2],[2,2]],
  eng:  [[0,0],[1,0],[2,0],[0,1],[1,1],[0,2],[2,2]],
  biz:  [[0,2],[1,1],[2,0]],                                  // 상승 화살표
  psy:  [[0,0],[2,0],[0,1],[1,1],[2,1],[0,2],[2,2]],          // 뇌
  phys: [[1,0],[0,1],[2,1],[1,2]],                            // 원자
  chem: [[0,1],[1,0],[2,1],[2,2],[1,3],[0,2]],                // 벤젠
  cs:   [[0,0],[2,0],[0,2],[2,2]],                            // 픽셀
  robot:[[0,0],[1,0],[2,0],[1,1],[0,2],[2,2]],                // 로봇 헤드
  med:  [[1,0],[0,1],[1,1],[2,1],[1,2]],                      // 십자
  phar: [[0,1],[1,0],[1,1],[1,2],[2,1]],                      // 알약
  math: [[0,0],[2,0],[1,1],[0,2],[2,2]],                      // 무한
  pe:   [[1,0],[0,1],[2,1],[1,2]],                            // 공
  paint:[[0,0],[2,0],[1,1],[0,2],[2,2]],                      // 팔레트
  vocal:[[0,0],[0,1],[1,2],[2,2]],                            // 음표
  phil: [[0,0],[1,0],[2,0],[1,1],[1,2]],                      // T (진리)
  rel:  [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]],                // 십자 확장
  lib:  [[0,0],[0,1],[0,2],[1,0],[2,0],[2,1],[2,2]],          // 책
  media:[[0,1],[1,1],[2,1],[1,0],[1,2]],                      // 안테나
  sculpt:[[1,0],[0,1],[2,1],[1,2],[1,3]],                     // 흉상
  vdesign:[[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]],  // 사각 프레임
  chn:  [[0,0],[1,0],[2,0],[1,1],[0,2],[1,2],[2,2]],          // 中
  jpn:  [[0,0],[1,0],[2,0],[1,1],[1,2],[1,3]],                // 日
  principal:[[0,0],[2,0],[1,1],[0,2],[2,2],[1,3]],            // 왕관/불꽃
};

function _drawProfEmblem(def, cx, cy) {
  const pat = _EMBLEM_MAP[def.key];
  if (!pat) return;
  const col = def.accent || def.color || '#ffefa8';
  // 오프셋: 로브 중앙 위쪽 (플레이어는 cx-6 부터 12px 폭). 문양은 로브 정중앙.
  const ox = cx - 2, oy = cy - 1;
  for (const [x, y] of pat) pxDraw(ox + x, oy + y, 1, 1, col);
}
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
    dmg: 63000, speed: 55, xp: 0, gold: 0,
    hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
    isBoss: true, isProfessor: true,
    baseDmg: 3150, cdMult: 0.6, mods: { fire:1.5, ice:1.5, lmbCd:0.6, lmbDmg:1.5 },
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
    const before = e._profEntryT;
    e._profEntryT -= dt;
    e.invuln = 0.05;
    // 페이즈 전환 시점에 사운드
    const total = e._profEntryTotal || PROFESSOR_ENTRY_SEC;
    const pBefore = 1 - (before / total);
    const pAfter  = 1 - (e._profEntryT / total);
    if (pBefore < 0.3 && pAfter >= 0.3) sfx('door');       // 포털 열림
    if (pBefore < 0.7 && pAfter >= 0.7) sfx('parry');      // 착지
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
            dmg: Math.min(210000, Math.max(17500, Math.floor((b.dmg || 10) * 5.25))),
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
  const dmg = 26250 + Math.floor(Math.random() * 15750);
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
  } else if (sig === 'psy_brain') {
    // 심리: 뇌 파동 3발 (파도) + 좌우 2발
    for (let i = -1; i <= 1; i++) push({ vx: Math.cos(ang + i * 0.15) * 160, vy: Math.sin(ang + i * 0.15) * 160, r: 3, life: 4 });
    for (let s = -1; s <= 1; s += 2) push({ vx: Math.cos(ang + s * Math.PI/4) * 200, vy: Math.sin(ang + s * Math.PI/4) * 200, r: 4 });
  } else if (sig === 'lit_ripple') {
    // 국문/영문: 자소가 파도처럼 퍼져 - 3중 원
    for (let ring = 0; ring < 3; ring++) {
      const cnt = 6 + ring * 3;
      const speed = 100 + ring * 40;
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * Math.PI * 2 + ring * 0.2;
        push({ vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 3 - ring * 0.3 });
      }
    }
  } else if (sig === 'ink_spread') {
    // 잉크가 조준+양쪽 확산: 조준 3발 + 좌우 부채꼴 각 3발
    for (let i = -1; i <= 1; i++) push({ vx: Math.cos(ang + i * 0.05) * 240, vy: Math.sin(ang + i * 0.05) * 240, r: 3 });
    for (let s = -1; s <= 1; s += 2) {
      const base = ang + s * Math.PI / 3;
      for (let i = -1; i <= 1; i++) push({ vx: Math.cos(base + i * 0.15) * 160, vy: Math.sin(base + i * 0.15) * 160 });
    }
  } else if (sig === 'atom_orbit') {
    // 물리: 궤도 파동 (8발이 나선 시작)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      push({ vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, r: 3 });
    }
    setTimeout(() => {
      if (!entities.enemies.includes(e)) return;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        entities.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, r: 3, dmg: dmg * 1.2, life: 3, kind: 'fire', visual: vis });
      }
    }, 300);
  } else if (sig === 'benzene_hex') {
    // 화학: 육각형 6점 + 중앙 확산
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      push({ vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, r: 4 });
    }
    push({ vx: Math.cos(ang) * 260, vy: Math.sin(ang) * 260, r: 5, dmg: dmg * 1.5 });
  } else if (sig === 'binary_stream_x') {
    // 컴퓨터: 매우 빠른 3발 연속 + 후속 2발
    for (let i = 0; i < 3; i++) push({ vx: Math.cos(ang) * (280 + i * 60), vy: Math.sin(ang) * (280 + i * 60), r: 2 });
    for (let i = -1; i <= 1; i += 2) push({ vx: Math.cos(ang + i * 0.2) * 200, vy: Math.sin(ang + i * 0.2) * 200 });
  } else if (sig === 'gear_saw') {
    // 로봇: 회전 6발 + 4방향 대각 십자
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + state.time;
      push({ vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, r: 4, dmg: dmg * 1.2 });
    }
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      push({ vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, r: 3 });
    }
  } else if (sig === 'med_cross_big') {
    // 의예: 4방향 크게 관통 십자
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      push({ vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, r: 6, dmg: dmg * 1.5, life: 4 });
    }
  } else if (sig === 'pill_toss3') {
    // 약학: 유도 3발 캡슐
    for (let i = -1; i <= 1; i++) push({ vx: Math.cos(ang + i * 0.35) * 140, vy: Math.sin(ang + i * 0.35) * 140, r: 4, life: 3.5 });
  } else if (sig === 'math_infinite') {
    // 수학교육: 뒤로 무한 루프 (앞뒤로 3발 씩)
    for (const dir of [ang, ang + Math.PI]) {
      for (let i = -1; i <= 1; i++) push({ vx: Math.cos(dir + i * 0.12) * 160, vy: Math.sin(dir + i * 0.12) * 160, r: 3, life: 4 });
    }
  } else if (sig === 'pe_bounce3') {
    // 체육: 3방향 공 + 벽 반사
    for (let i = -1; i <= 1; i++) push({ vx: Math.cos(ang + i * 0.3) * 180, vy: Math.sin(ang + i * 0.3) * 180, r: 4, life: 4 });
  } else if (sig === 'paint_splash15') {
    // 회화: 랜덤 15방향
    for (let i = 0; i < 15; i++) {
      const a = Math.random() * Math.PI * 2;
      push({ vx: Math.cos(a) * (60 + Math.random() * 160), vy: Math.sin(a) * (60 + Math.random() * 160), r: 3 });
    }
  } else if (sig === 'vocal_chord5') {
    // 성악: 5화음 조준 (음표)
    for (let i = -2; i <= 2; i++) push({ vx: Math.cos(ang + i * 0.1) * 200, vy: Math.sin(ang + i * 0.1) * 200, r: 3, life: 3 });
  } else if (sig === 'philosophy_void') {
    // 철학: 8방향 반전 (뒤에서 앞으로)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      push({ x: e.x + Math.cos(a) * 40, y: e.y + Math.sin(a) * 40, vx: -Math.cos(a) * 150, vy: -Math.sin(a) * 150 });
    }
  } else if (sig === 'religion_cross_x2') {
    // 종교: 십자 두 번 (회전 오프셋)
    for (const off of [0, Math.PI / 4]) {
      for (let i = 0; i < 4; i++) {
        const a = off + i * Math.PI / 2;
        push({ vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 5 });
      }
    }
  } else if (sig === 'library_burst16') {
    // 문헌정보: 16방향 방사형 (책이 쏟아짐)
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      push({ vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, r: 3 });
    }
  } else if (sig === 'media_broadcast') {
    // 미디어: 부채꼴 넓게 (안테나 방출)
    for (let i = -4; i <= 4; i++) push({ vx: Math.cos(ang + i * 0.1) * 240, vy: Math.sin(ang + i * 0.1) * 240, r: 3 });
  } else if (sig === 'sculpt_chisel') {
    // 조소: 무거운 2발 + 파편 6개
    for (let i = -1; i <= 1; i += 2) push({ vx: Math.cos(ang + i * 0.1) * 240, vy: Math.sin(ang + i * 0.1) * 240, r: 6, dmg: dmg * 1.8 });
    for (let i = 0; i < 6; i++) {
      const a = ang + (i - 2.5) * 0.4;
      push({ vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, r: 2, dmg: dmg * 0.6 });
    }
  } else if (sig === 'design_frame') {
    // 시각디자인: 4방향 대각 프레임 - 4구석에서 중앙으로 회귀
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      push({ x: e.x + Math.cos(a) * 30, y: e.y + Math.sin(a) * 30, vx: -Math.cos(a) * 180, vy: -Math.sin(a) * 180, r: 4 });
    }
  } else if (sig === 'chinese_char') {
    // 중어중문: 十(십)자 방향 8발
    for (const d of [0, Math.PI/2, Math.PI, -Math.PI/2]) {
      push({ vx: Math.cos(d) * 200, vy: Math.sin(d) * 200, r: 4 });
      push({ vx: Math.cos(d) * 130, vy: Math.sin(d) * 130, r: 3 });
    }
  } else if (sig === 'japanese_haiku') {
    // 일어일문: 5-7-5 느낌 (5+7+5 파도)
    for (const off of [-0.3, 0, 0.3]) {
      const cnt = off === 0 ? 7 : 5;
      for (let i = 0; i < cnt; i++) {
        const a = ang + off + (i - (cnt-1)/2) * 0.06;
        push({ vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, r: 3 });
      }
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
  const dmg = 10500 + Math.floor(Math.random() * 7000);
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
  // === 등장 서사 애니메이션 (프레임당 1회) ===
  // 이 교수가 이 프레임의 첫 professor 이면 화면 전체 배경으로 시대 씬을 그린다.
  if (e._profEntryT > 0 && e._profEntryTotal) {
    const first = entities.enemies.find(x => x.isProfessor && x._profEntryT > 0);
    if (first === e) {
      const setting = PROF_ERA_SETTING[def.key] || 'library';
      const p = 1 - (e._profEntryT / e._profEntryTotal);   // 0 → 1
      // 화면 전체 커버 (방 크기 기준)
      const rm = rooms[currentRoom] || { x: 0, y: 0, w: W, h: H };
      _drawEraScene(setting, rm.x + rm.w/2, rm.y + rm.h/2, rm.w, rm.h - 20, p, def);
      // 상단 헤더: 학과명 · 이름 (크게)
      const headerY = rm.y + 6;
      drawText(def.name + ' — ' + def.title, rm.x + rm.w/2 - textWidth(def.name + ' — ' + def.title)/2, headerY, def.color);
      // 나레이션 - STORY_FRAGMENTS 의 라인을 phase 별로 순차 표시
      const frag = (typeof _pickStoryLang === 'function') ? _pickStoryLang(def.key) : null;
      if (frag && frag.lines && frag.lines.length) {
        const lineCount = frag.lines.length;
        const perLine = 1 / (lineCount + 0.4);
        const idx = Math.min(lineCount - 1, Math.floor(p / perLine));
        const line = frag.lines[idx];
        const lineY = rm.y + rm.h - 26;
        // 반투명 박스
        const tw = textWidth(line);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect((rm.x + rm.w/2 - tw/2 - 4) * PX, (lineY - 2) * PX, (tw + 8) * PX, 10 * PX);
        drawText(line, rm.x + rm.w/2 - tw/2, lineY, '#e8d9b0');
      }
    }
  }
  // 등장 애니메이션: 3단계 시네마틱 인트로
  //  A: 포털 오픈 (0~30% 진행) - 어두운 오버레이 + 확장 링 + 하강 광선
  //  B: 소환 (30~70%) - 스프라이트 페이드 인 + 회전 파티클 + 위로 튀는 광채
  //  C: 정착 (70~100%) - alpha 1 + 흰 후광 축소 + 스탠딩 오라
  let alpha = 1;
  if (e._profEntryT > 0 && e._profEntryTotal) {
    const p = 1 - (e._profEntryT / e._profEntryTotal);  // 0 → 1
    // === A: 포털 오픈 ===
    if (p < 0.3) {
      const pa = p / 0.3;
      // 어두운 방 오버레이
      const rm = rooms[currentRoom];
      if (rm) {
        ctx.fillStyle = 'rgba(0,0,0,' + (0.5 * (1 - pa * 0.5)).toFixed(2) + ')';
        ctx.fillRect(rm.x * PX, rm.y * PX, rm.w * PX, rm.h * PX);
      }
      // 포털 확장 링 3개
      for (let i = 0; i < 3; i++) {
        const ring = (pa + i * 0.15) % 1;
        ctx.strokeStyle = def.color + Math.floor((1 - ring) * 200).toString(16).padStart(2, '0');
        ctx.lineWidth = PX * 2;
        ctx.beginPath();
        ctx.arc(e.x * PX, e.y * PX, (5 + ring * 30) * PX, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 위→아래 하강 광선
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - pa)).toFixed(2) + ')';
      ctx.lineWidth = PX * 3;
      ctx.beginPath();
      ctx.moveTo(e.x * PX, 0);
      ctx.lineTo(e.x * PX, e.y * PX);
      ctx.stroke();
      // 하강 파티클
      if (Math.random() < 0.6) spawnParticle(e.x + rand(-4, 4), e.y - rand(10, 40), def.color, 0.4, 2, 50);
    }
    // === B: 소환 ===
    if (p >= 0.3 && p < 0.7) {
      const pb = (p - 0.3) / 0.4;
      alpha = pb;
      // 회전 파티클 원 6개 (수축)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + state.time * 8;
        const r = 20 * (1 - pb) + 6;
        pxDraw(e.x + Math.cos(a) * r - 0.5, e.y + Math.sin(a) * r - 0.5, 1, 1, def.color);
      }
      // 위로 튀는 광채
      if (Math.random() < 0.5) spawnParticle(e.x + rand(-4, 4), e.y + 6, def.accent || def.color, 0.5, 2, 60);
      // 흰 후광 (아직 존재)
      ctx.fillStyle = 'rgba(255,255,255,' + (0.4 * (1 - pb)).toFixed(2) + ')';
      const halo = 18 * (1 - pb) + 6;
      ctx.fillRect((e.x - halo) * PX, (e.y - halo) * PX, halo * 2 * PX, halo * 2 * PX);
    }
    // === C: 정착 ===
    if (p >= 0.7) {
      const pc = (p - 0.7) / 0.3;
      alpha = 1;
      // 흰 후광 축소
      ctx.fillStyle = 'rgba(255,255,255,' + (0.3 * (1 - pc)).toFixed(2) + ')';
      const halo = 8 * (1 - pc) + 2;
      ctx.fillRect((e.x - halo) * PX, (e.y - halo) * PX, halo * 2 * PX, halo * 2 * PX);
      // 스탠딩 오라 링 (완전 확장 후 사라짐)
      ctx.strokeStyle = def.color + 'aa';
      ctx.lineWidth = PX;
      ctx.beginPath();
      ctx.arc(e.x * PX, e.y * PX, (10 + pc * 8) * PX, 0, Math.PI * 2);
      ctx.stroke();
    }
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
  // === 플레이어 스프라이트 + 학과별 팔레트 변형 ===
  // 로브 색(2/3) 은 def.color 기반, 모자(7) 는 어두운 톤, 별(6) 은 accent.
  const pal = _profPalette(def);
  const anim = Math.floor(t * 4) % 2 === 0 ? SPR_PLAYER_S1 : SPR_PLAYER_S2;
  let oy = Math.sin(t * 2) * 1;
  // 등장 시 위→아래 튀는 애니메이션 오프셋 (phase A~C)
  if (e._profEntryT > 0 && e._profEntryTotal) {
    const p = 1 - (e._profEntryT / e._profEntryTotal);
    if (p < 0.3) {
      // 아직 소환 안 됨 - 스프라이트 숨김
      ctx.globalAlpha = 0;
    } else if (p < 0.7) {
      // 위에서 낙하 (약 20px 위)
      const pb = (p - 0.3) / 0.4;
      oy -= (1 - pb) * 20;
    } else {
      // 착지 바운스 (사인 감쇠)
      const pc = (p - 0.7) / 0.3;
      oy += Math.sin(pc * Math.PI * 3) * 3 * (1 - pc);
    }
  }
  drawSprite(anim, pal, e.x - 6, e.y - 7 + oy);
  // 학과 심볼: 로브 위에 작은 문양 오버레이 (모자 아래 왼쪽)
  ctx.globalAlpha = alpha;
  _drawProfEmblem(def, e.x, e.y + oy);
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
