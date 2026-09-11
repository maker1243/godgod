// =====================================================================
// Underground - 5층 던전. 각 층마다 별도 방/몹/미니보스. 계단으로 이동.
// 1200x800 월드, 카메라 팔로우. 22개 교수 방을 층별 분배.
// =====================================================================

const UNDER_W = 1200;
const UNDER_H = 800;
const UNDER_MAX_FLOOR = 5;

// 층별 배치 - 각 층에 어떤 교수 방(key)들과 계단(stair) 위치
const UNDER_FLOOR_LAYOUTS = [
  // Floor 1 (기초 학과 5)
  { rooms:['kor','eng','biz','psy','phys'],       stair:{x: 1130, y: 700}, mobHp:1.0, mobDmg:1.0, mobCap:5, name:'지하 1층 - 기초의 홀' },
  // Floor 2 (자연/공학 5)
  { rooms:['chem','cs','robot','med','phar'],      stair:{x: 1130, y: 700}, mobHp:2.0, mobDmg:1.6, mobCap:7, name:'지하 2층 - 실험의 홀' },
  // Floor 3 (교육/예술 4)
  { rooms:['math','pe','paint','vocal'],           stair:{x: 1130, y: 700}, mobHp:3.5, mobDmg:2.4, mobCap:8, name:'지하 3층 - 창조의 홀' },
  // Floor 4 (인문 심층 4)
  { rooms:['phil','rel','lib','media'],            stair:{x: 1130, y: 700}, mobHp:6.0, mobDmg:3.5, mobCap:10, name:'지하 4층 - 사유의 홀' },
  // Floor 5 (심연 4 + 미니보스)
  { rooms:['sculpt','vdesign','chn','jpn'],        stair:null,              mobHp:12.0, mobDmg:5.0, mobCap:12, name:'지하 5층 - 심연', hasBoss:true },
];

// 방 좌표 매핑 - key 만 층별 분배, 좌표는 원본 유지
const _PROF_ROOM_XY = {
  kor:{x:200,y:180}, eng:{x:400,y:180}, biz:{x:600,y:180}, psy:{x:800,y:180}, phys:{x:1000,y:180},
  chem:{x:200,y:180}, cs:{x:400,y:180}, robot:{x:600,y:180}, med:{x:800,y:180}, phar:{x:1000,y:180},
  math:{x:250,y:220}, pe:{x:500,y:220}, paint:{x:750,y:220}, vocal:{x:1000,y:220},
  phil:{x:250,y:220}, rel:{x:500,y:220}, lib:{x:750,y:220}, media:{x:1000,y:220},
  sculpt:{x:250,y:250}, vdesign:{x:500,y:250}, chn:{x:750,y:250}, jpn:{x:1000,y:250},
};

// 각 교수 방 정보 - 하위 호환 (미니맵/힌트 등이 참조)
const PROF_ROOMS = [
  // humanities (2)
  { key:'kor',    name:'李 교수의 방 (국문학과)',   x: 120, y: 140, col:'#c8a888' },
  { key:'eng',    name:'金 교수의 방 (영문학과)',   x: 280, y: 140, col:'#a88860' },
  // social (2)
  { key:'biz',    name:'朴 교수의 방 (경영학과)',   x: 440, y: 140, col:'#8bd8ff' },
  { key:'psy',    name:'崔 교수의 방 (심리학과)',   x: 600, y: 140, col:'#5aa0dc' },
  // natural (2)
  { key:'phys',   name:'鄭 교수의 방 (물리학과)',   x: 760, y: 140, col:'#8bd8ff' },
  { key:'chem',   name:'姜 교수의 방 (화학과)',     x: 920, y: 140, col:'#5adcac' },
  // engineering (2)
  { key:'cs',     name:'趙 교수의 방 (전산과)',     x: 1080,y: 140, col:'#8bd8ff' },
  { key:'robot',  name:'尹 교수의 방 (로봇과)',     x: 120, y: 300, col:'#e8c547' },
  // medicine (2)
  { key:'med',    name:'林 교수의 방 (의예과)',     x: 280, y: 300, col:'#ffffff' },
  { key:'phar',   name:'吳 교수의 방 (약학과)',     x: 440, y: 300, col:'#5adc2a' },
  // education (2)
  { key:'math',   name:'韓 교수의 방 (수학교육과)', x: 600, y: 300, col:'#c86ade' },
  { key:'pe',     name:'徐 교수의 방 (체육교육과)', x: 760, y: 300, col:'#e8c547' },
  // arts (2)
  { key:'paint',  name:'黃 교수의 방 (회화과)',     x: 920, y: 300, col:'#ff80ff' },
  { key:'vocal',  name:'申 교수의 방 (성악과)',     x: 1080,y: 300, col:'#ffefa8' },
  // divinity (2)
  { key:'phil',   name:'黃 교수의 방 (철학과)',     x: 120, y: 460, col:'#c8b898' },
  { key:'rel',    name:'洪 교수의 방 (종교학과)',   x: 280, y: 460, col:'#a89848' },
  // info (2)
  { key:'lib',    name:'白 교수의 방 (문헌정보학과)',x: 440, y: 460, col:'#5adcff' },
  { key:'media',  name:'孫 교수의 방 (미디어)',     x: 600, y: 460, col:'#8bd8ff' },
  // design (2)
  { key:'sculpt', name:'柳 교수의 방 (조소과)',     x: 760, y: 460, col:'#a08050' },
  { key:'vdesign',name:'高 교수의 방 (시각디자인)', x: 920, y: 460, col:'#ff80ff' },
  // language (2)
  { key:'chn',    name:'呂 교수의 방 (중어중문)',   x: 1080,y: 460, col:'#e8c547' },
  { key:'jpn',    name:'秋 교수의 방 (일어일문)',   x: 600, y: 620, col:'#ff9c3d' },
];

// 지하 상태
const underground = {
  playerX: 100, playerY: 700,
  camX: 0, camY: 0,
  claimed: {},              // {profKey: true} - 방 보상 수령 기록
  enemies: [],              // 방랑 몹
  eventT: 0,                // 다음 랜덤 이벤트까지
  activeEvent: null,
  msg: '', msgT: 0,
  spawnT: 0,
  floor: 1,                 // 현재 층
  descentT: 0,              // 계단 상호작용 쿨다운
  boss: null,               // 5층 미니보스
  bossDown: {},              // {층번호: true} - 층별 보스 격파 여부
};

function _currentLayout() {
  return UNDER_FLOOR_LAYOUTS[Math.max(0, Math.min(UNDER_MAX_FLOOR - 1, (underground.floor || 1) - 1))];
}

// 현재 층에 표시되는 방 배열 반환 (좌표 + key + col)
function _floorRooms() {
  const layout = _currentLayout();
  const rooms = [];
  for (const k of layout.rooms) {
    const src = PROF_ROOMS.find(r => r.key === k);
    if (!src) continue;
    const pos = _PROF_ROOM_XY[k] || { x: src.x, y: src.y };
    rooms.push({ key: k, name: src.name, x: pos.x, y: pos.y, col: src.col });
  }
  return rooms;
}

function _initUnderground() {
  underground.playerX = 100;
  underground.playerY = 700;
  underground.camX = 0;
  underground.camY = 0;
  underground.enemies = [];
  underground.eventT = 15;
  underground.spawnT = 3;
  underground.activeEvent = null;
  underground.floor = 1;
  underground.descentT = 0;
  underground.boss = null;
}

// 층 이동
function _underDescend() {
  if (underground.floor >= UNDER_MAX_FLOOR) return;
  underground.floor += 1;
  underground.playerX = 100;
  underground.playerY = 700;
  underground.enemies = [];
  underground.boss = null;
  underground.eventT = 8;
  underground.msg = _currentLayout().name + ' 진입!';
  underground.msgT = 4;
  if (typeof sfx === 'function') sfx('boss');
  if (typeof showAchievementBanner === 'function') showAchievementBanner('지하 하강', _currentLayout().name, '#c86ade');
  // 5층은 미니보스 스폰
  if (_currentLayout().hasBoss && !underground.bossDown[underground.floor]) {
    underground.boss = {
      x: 600, y: 400, r: 20,
      hp: 5000 * (1 + (state.finalCleared||0)),
      maxHp: 5000 * (1 + (state.finalCleared||0)),
      dmg: 50, patternT: 0, phase: 1, hitT: 0,
    };
  }
  if (typeof saveAccountData === 'function') saveAccountData();
}
function _underAscend() {
  if (underground.floor <= 1) return;
  underground.floor -= 1;
  underground.playerX = _currentLayout().stair ? _currentLayout().stair.x - 30 : 200;
  underground.playerY = _currentLayout().stair ? _currentLayout().stair.y : 200;
  underground.enemies = [];
  underground.msg = _currentLayout().name + ' 복귀';
  underground.msgT = 3;
}

function isProfBeaten(key) {
  const b = state.professorsBeaten || {};
  return !!(b[key + '_a'] || b[key + '_b'] || b[key]);
}

// 지하 랜덤 이벤트 - 20~40초마다 발동. 종류: buff/loot/hazard/encounter/story/environmental.
const UNDER_EVENTS = [
  // === 회복/버프 (긍정) ===
  { title:'유령의 노래',       life:20, kind:'buff',   effect:(p)=>{ p.mp = Math.min(p.maxMp, p.mp + 30); return '+30 MP'; } },
  { title:'옛 마도사의 축복', life:20, kind:'buff',   effect:(p)=>{ p.hp = Math.min(p.maxHp, p.hp + 40); return '+40 HP'; } },
  { title:'봉인의 반향',       life:12, kind:'buff',   effect:(p)=>{ p.baseDmg *= 1.05; return 'DMG +5%'; } },
  { title:'폐허의 기계',       life:15, kind:'buff',   effect:(p)=>{ p.speed = (p.speed||100) * 1.10; return 'SPD +10%'; } },
  { title:'천장의 촛불',       life:18, kind:'buff',   effect:(p)=>{ p.critAdd = (p.critAdd||0) + 0.05; return '크리 +5%'; } },
  { title:'수맥의 활력',       life:25, kind:'buff',   effect:(p)=>{ p.maxHp += 30; p.hp += 30; return '최대 HP +30'; } },
  { title:'박쥐의 감각',       life:15, kind:'buff',   effect:(p)=>{ p.dodge = (p.dodge||0) + 0.08; return '회피 +8%'; } },
  { title:'선조의 지혜',       life:20, kind:'buff',   effect:(p)=>{ p.cdMult = (p.cdMult||1) * 0.90; return 'CD -10%'; } },
  { title:'봉인 사슬',         life:15, kind:'buff',   effect:(p)=>{ p.pierceAdd = (p.pierceAdd||0) + 1; return '관통 +1'; } },

  // === 획득 (자원) ===
  { title:'잊혀진 금고',       life:15, kind:'loot',   effect:(p)=>{ state.gold = (state.gold||0) + 50; return '+50 G'; } },
  { title:'금서 조각',         life:15, kind:'loot',   effect:(p)=>{ state.research = (state.research||0) + 200; return '+200 RP'; } },
  { title:'거대 금고 발견',    life:10, kind:'loot',   effect:(p)=>{ const g = 200 + Math.floor(Math.random()*300); state.gold = (state.gold||0) + g; return '+' + g + ' G'; } },
  { title:'교수의 유품',       life:12, kind:'loot',   effect:(p)=>{ const rp = 500 + Math.floor(Math.random()*1500); state.research = (state.research||0) + rp; return '+' + rp + ' RP'; } },
  { title:'봉인의 부적',       life:12, kind:'loot',   effect:(p)=>{ if (typeof _ensureArtifactsState==='function') _ensureArtifactsState(); if (state.artifacts && typeof ARTIFACT_DEFS!=='undefined' && ARTIFACT_DEFS.length && Math.random()<0.3) { const pick = ARTIFACT_DEFS[Math.floor(Math.random()*ARTIFACT_DEFS.length)]; if (!state.artifacts.owned[pick.id]) { state.artifacts.owned[pick.id] = true; return '아티팩트 ' + pick.name + '!'; } } return '아무것도 없음'; } },
  { title:'풀리지 않은 룬',    life:15, kind:'loot',   effect:(p)=>{ if (typeof unlockStoryFragment==='function') { const pool = ['wanderer_evt','mirror_evt','timetraveler_evt','renn_bond','elara_true','chronoheart']; const pick = pool[Math.floor(Math.random()*pool.length)]; unlockStoryFragment(pick); return '스토리 조각'; } return '+300 RP'; } },
  { title:'포션 상자',         life:10, kind:'loot',   effect:(p)=>{ academy.inventory.heal = (academy.inventory.heal||0) + 2; academy.inventory.mana = (academy.inventory.mana||0) + 2; if (typeof recomputeHotkeys==='function') recomputeHotkeys(); return '힐 +2, 마나 +2'; } },

  // === 위험 (부정) ===
  { title:'저주받은 지반',     life:10, kind:'hazard', effect:(p)=>{ p.hp = Math.max(1, p.hp - 20); return '-20 HP'; } },
  { title:'가스 누출',         life:15, kind:'hazard', effect:(p)=>{ p.hp = Math.max(1, p.hp - Math.floor(p.maxHp * 0.15)); return '-15% HP (독)'; } },
  { title:'중력 왜곡',         life:15, kind:'hazard', effect:(p)=>{ p.speed = (p.speed||100) * 0.7; return 'SPD -30%'; } },
  { title:'마력 봉쇄',         life:12, kind:'hazard', effect:(p)=>{ p.mp = 0; return 'MP 전부 소진'; } },
  { title:'저주 인장',         life:20, kind:'hazard', effect:(p)=>{ p.baseDmg *= 0.85; return 'DMG -15% (한 방문)'; } },
  { title:'실체 없는 손',      life:12, kind:'hazard', effect:(p)=>{ const g = Math.min(100, Math.floor((state.gold||0) * 0.05)); state.gold = Math.max(0, (state.gold||0) - g); return '-' + g + ' G (도둑맞음)'; } },

  // === 조우 (몹 스폰) ===
  { title:'유령 무리 등장!',   life:8,  kind:'encounter', effect:(p)=>{ for (let i = 0; i < 4; i++) _spawnUnderEnemy(); return '유령 4마리 스폰'; } },
  { title:'그림자 왕의 방문',  life:6,  kind:'encounter', effect:(p)=>{ for (let i = 0; i < 2; i++) { _spawnUnderEnemy(); const e = underground.enemies[underground.enemies.length-1]; if (e) { e.hp *= 4; e.dmg *= 2; e.r = 8; e.kind = 'shadow_king'; } } return '그림자 왕 2마리'; } },
  { title:'교수의 잔영',       life:8,  kind:'encounter', effect:(p)=>{ for (let i = 0; i < 3; i++) { _spawnUnderEnemy(); const e = underground.enemies[underground.enemies.length-1]; if (e) { e.hp *= 2; e.dmg = Math.floor(e.dmg * 1.5); e.kind = 'prof_echo'; } } return '교수의 잔영 3마리'; } },

  // === 환경 / 지형 ===
  { title:'천장 균열',         life:25, kind:'env',    effect:(p)=>{ underground.rainStones = performance.now() + 25000; return '25초간 낙석 위험'; } },
  { title:'푸른 안개',         life:20, kind:'env',    effect:(p)=>{ underground.foggy = performance.now() + 20000; return '시야 감소'; } },
  { title:'포털 발견',         life:8,  kind:'env',    effect:(p)=>{ const rm = PROF_ROOMS.filter(r => isProfBeaten(r.key)); if (rm.length) { const t = rm[Math.floor(Math.random()*rm.length)]; underground.playerX = t.x; underground.playerY = t.y - 30; return '순간이동!'; } return '포털이 사라졌다'; } },
  { title:'빛의 웅덩이',       life:15, kind:'env',    effect:(p)=>{ p.hp = p.maxHp; p.mp = p.maxMp; return '완전 회복'; } },
  { title:'시간 왜곡',         life:15, kind:'env',    effect:(p)=>{ underground.spawnT += 20; return '20초간 몹 스폰 정지'; } },

  // === 스토리 / 특수 ===
  { title:'엘라라의 속삭임',   life:12, kind:'story',  effect:(p)=>{ if (typeof unlockStoryFragment==='function') unlockStoryFragment('elara_true'); return '엘라라의 진짜 이름'; } },
  { title:'교장의 유령',       life:12, kind:'story',  effect:(p)=>{ if (typeof unlockStoryFragment==='function') unlockStoryFragment('principal'); state.research = (state.research||0) + 1000; return '+1000 RP + 조각'; } },
  { title:'봉인의 심장',       life:15, kind:'story',  effect:(p)=>{ if (typeof unlockStoryFragment==='function') unlockStoryFragment('chronoheart'); if (typeof repAdd==='function') repAdd('underground', 5); return '뒷골목 +5'; } },
  { title:'시간의 방랑자',     life:12, kind:'story',  effect:(p)=>{ if (typeof unlockStoryFragment==='function') unlockStoryFragment('timetraveler_evt'); return '시간 여행자와 조우'; } },

  // === 도박 (양날의 검) ===
  { title:'금화 세 개',        life:10, kind:'gamble', effect:(p)=>{ const r = Math.random(); if (r < 0.3) { state.gold = (state.gold||0) + 1000; return '대박! +1000 G'; } if (r < 0.7) { state.gold = (state.gold||0) + 100; return '보통. +100 G'; } state.gold = Math.max(0, (state.gold||0) - 200); return '실패. -200 G'; } },
  { title:'저주받은 서약',     life:12, kind:'gamble', effect:(p)=>{ p.baseDmg *= 1.25; p.maxHp = Math.floor(p.maxHp * 0.8); p.hp = Math.min(p.hp, p.maxHp); return 'DMG +25%, 최대 HP -20%'; } },
  { title:'악마의 계약',       life:12, kind:'gamble', effect:(p)=>{ state.gold = (state.gold||0) + 500; p.hp = Math.max(1, p.hp - 30); return '+500 G · -30 HP'; } },
  { title:'행운의 룬',         life:15, kind:'gamble', effect:(p)=>{ const rp = Math.random() < 0.5 ? 500 : -200; state.research = Math.max(0, (state.research||0) + rp); return (rp > 0 ? '+' : '') + rp + ' RP'; } },

  // === 평판 / 소셜 ===
  { title:'뒷골목 접선',       life:10, kind:'rep',    effect:(p)=>{ if (typeof repAdd==='function') { repAdd('underground', 8); repAdd('academy', -3); } return '뒷골목 +8, 학원 -3'; } },
  { title:'학원 첩자',         life:10, kind:'rep',    effect:(p)=>{ if (typeof repAdd==='function') { repAdd('academy', 6); repAdd('underground', -4); } state.gold = (state.gold||0) + 200; return '학원 +6, 뒷골목 -4, +200 G'; } },
  { title:'방랑자의 지도',     life:10, kind:'rep',    effect:(p)=>{ if (typeof repAdd==='function') repAdd('wanderer', 10); return '방랑자 +10'; } },
];

function _spawnUnderEnemy() {
  let x, y, tries = 0;
  do {
    x = 40 + Math.random() * (UNDER_W - 80);
    y = 40 + Math.random() * (UNDER_H - 80);
    tries++;
  } while (Math.hypot(x - underground.playerX, y - underground.playerY) < 120 && tries < 10);
  const L = _currentLayout();
  const baseHp = 30 + (state.finalCleared||0) * 20;
  const baseDmg = 5 + (state.finalCleared||0) * 2;
  underground.enemies.push({
    x, y, vx: 0, vy: 0, r: 5 + Math.min(4, Math.floor(underground.floor / 2)),
    hp: Math.floor(baseHp * L.mobHp),
    dmg: Math.floor(baseDmg * L.mobDmg),
    hitT: 0,
    kind: Math.random() < 0.3 ? 'ghost' : 'shade',
  });
}

function updateUnderground(dt) {
  if (underground.msgT > 0) underground.msgT -= dt;

  // 이동
  let mx = 0, my = 0;
  if (keys['KeyA'] || keys['ArrowLeft'])  mx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
  if (keys['KeyW'] || keys['ArrowUp'])    my -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  my += 1;
  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; }
  const sprint = (keys['ShiftLeft'] || keys['ShiftRight']) ? 2.2 : 1;
  const spd = 100 * sprint;
  underground.playerX = clamp(underground.playerX + mx * spd * dt, 10, UNDER_W - 10);
  underground.playerY = clamp(underground.playerY + my * spd * dt, 10, UNDER_H - 10);

  // 카메라
  underground.camX = clamp(underground.playerX - W/2, 0, UNDER_W - W);
  underground.camY = clamp(underground.playerY - H/2, 0, UNDER_H - H);

  // 방 상호작용 - 현재 층 방만
  const _rooms = _floorRooms();
  // 계단 상호작용
  const layout = _currentLayout();
  if (layout.stair) {
    const sd = Math.hypot(underground.playerX - layout.stair.x, underground.playerY - layout.stair.y);
    if (sd < 22 && (keys['Space'] || keys['Enter']) && underground.descentT <= 0) {
      keys['Space']=false; keys['Enter']=false;
      // 미니보스 층은 보스 격파해야 하강 가능
      if (layout.hasBoss && !underground.bossDown[underground.floor]) {
        underground.msg = '미니보스를 먼저 격파해야 합니다';
        underground.msgT = 3;
      } else {
        _underDescend();
        underground.descentT = 0.6;
        return;
      }
    }
  }
  // 상승 계단 (플레이어 시작 지점에 항상 있음: 층 > 1)
  if (underground.floor > 1) {
    const ud = Math.hypot(underground.playerX - 60, underground.playerY - 700);
    if (ud < 20 && (keys['Space'] || keys['Enter']) && underground.descentT <= 0) {
      keys['Space']=false; keys['Enter']=false;
      _underAscend();
      underground.descentT = 0.6;
      return;
    }
  }
  if (underground.descentT > 0) underground.descentT -= dt;

  // 미니보스 (5층)
  if (underground.boss) {
    const b = underground.boss;
    const a = Math.atan2(underground.playerY - b.y, underground.playerX - b.x);
    b.x += Math.cos(a) * 20 * dt;
    b.y += Math.sin(a) * 20 * dt;
    b.patternT -= dt;
    if (b.patternT <= 0) {
      // 8방향 발사
      if (typeof entities !== 'undefined' && entities.ebullets) {
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + state.time;
          entities.ebullets.push({ x: b.x, y: b.y, vx: Math.cos(ang) * 120, vy: Math.sin(ang) * 120, r: 4, dmg: b.dmg, life: 3, kind: 'shadow' });
        }
      }
      b.patternT = 2.5;
    }
    if (b.hitT > 0) b.hitT -= dt;
    // 접촉 데미지
    const bd = Math.hypot(underground.playerX - b.x, underground.playerY - b.y);
    if (bd < b.r + 6 && player && (!player.invuln || player.invuln <= 0)) {
      player.hp = Math.max(1, player.hp - b.dmg * 2);
      player.invuln = 0.6;
    }
    // 격파: 플레이어 발사체 스캔 (근사)
    if (typeof entities !== 'undefined' && entities.bullets) {
      for (const pb of entities.bullets) {
        if (Math.hypot(pb.x - b.x, pb.y - b.y) < pb.r + b.r) {
          b.hp -= pb.dmg;
          pb.life = 0;
          b.hitT = 0.15;
        }
      }
    }
    if (b.hp <= 0) {
      underground.bossDown[underground.floor] = true;
      underground.msg = '★ 지하 ' + underground.floor + '층 심연의 보스 격파!';
      underground.msgT = 5;
      state.research = (state.research||0) + 50000;
      state.gold = (state.gold||0) + 5000;
      if (typeof showAchievementBanner === 'function') showAchievementBanner('심연의 보스 격파', '지하 5층 정복', '#ff2d80');
      if (typeof sfx === 'function') sfx('bosskill');
      underground.boss = null;
      if (typeof saveAccountData === 'function') saveAccountData();
    }
  }

  for (const rm of _rooms) {
    const d = Math.hypot(underground.playerX - rm.x, underground.playerY - rm.y);
    if (d < 22 && (keys['Space'] || keys['Enter'])) {
      keys['Space']=false; keys['Enter']=false;
      if (!isProfBeaten(rm.key)) {
        underground.msg = '잠겨 있음 - 해당 교수를 격파해야 함';
        underground.msgT = 3;
      } else if (underground.claimed[rm.key]) {
        underground.msg = rm.name + ' - 이미 수령한 방';
        underground.msgT = 3;
      } else {
        // 보상: RP + Gold + Story Fragment + 아티팩트 확률
        underground.claimed[rm.key] = true;
        const rp = 2000, g = 300;
        state.research = (state.research||0) + rp;
        state.gold = (state.gold||0) + g;
        // 관련 스토리 조각
        if (typeof unlockStoryFragment === 'function') {
          try { unlockStoryFragment(rm.key); } catch(_){}
        }
        // 20% 확률 아티팩트 슬롯 획득
        let bonus = '';
        if (Math.random() < 0.2 && typeof _ensureArtifactsState === 'function') {
          _ensureArtifactsState();
          bonus = ' + 아티팩트!';
          if (typeof ARTIFACT_DEFS !== 'undefined' && ARTIFACT_DEFS.length) {
            const pick = ARTIFACT_DEFS[Math.floor(Math.random() * ARTIFACT_DEFS.length)];
            if (state.artifacts && !state.artifacts.owned[pick.id]) state.artifacts.owned[pick.id] = true;
          }
        }
        underground.msg = rm.name + ' 수령! +' + rp + ' RP · +' + g + ' G' + bonus;
        underground.msgT = 4;
        if (typeof sfx === 'function') sfx('level');
        if (typeof showAchievementBanner === 'function') showAchievementBanner('교수의 방 개방', rm.name, rm.col);
        if (typeof repAdd === 'function') { repAdd('academy', 5); repAdd('underground', 3); }
        if (typeof saveAccountData === 'function') saveAccountData();
      }
      return;
    }
  }

  // 방랑 몹 스폰 - 층별 개수 제한
  const capL = _currentLayout();
  underground.spawnT -= dt;
  if (underground.spawnT <= 0 && underground.enemies.length < capL.mobCap) {
    _spawnUnderEnemy();
    underground.spawnT = 4 + Math.random() * 4;
  }
  // 몹 이동/접촉 데미지
  for (let i = underground.enemies.length - 1; i >= 0; i--) {
    const e = underground.enemies[i];
    const a = Math.atan2(underground.playerY - e.y, underground.playerX - e.x);
    e.x += Math.cos(a) * 30 * dt;
    e.y += Math.sin(a) * 30 * dt;
    if (e.hitT > 0) e.hitT -= dt;
    const d = Math.hypot(underground.playerX - e.x, underground.playerY - e.y);
    if (d < e.r + 6 && player && (!player.invuln || player.invuln <= 0)) {
      player.hp = Math.max(1, player.hp - e.dmg);
      if (typeof spawnFloat === 'function') spawnFloat(underground.playerX, underground.playerY - 8, '-' + e.dmg, '#c81616');
      player.invuln = 0.5;
      e.hp = 0;
    }
    if (e.hp <= 0) underground.enemies.splice(i, 1);
  }

  // 랜덤 이벤트 (20~40초마다). 여러 이벤트가 겹칠 수 있도록 큐잉.
  if (!underground.eventQueue) underground.eventQueue = [];
  underground.eventT -= dt;
  if (underground.eventT <= 0) {
    const ev = UNDER_EVENTS[Math.floor(Math.random() * UNDER_EVENTS.length)];
    let result;
    try { result = ev.effect(player); } catch(e) { result = '(효과 실패)'; }
    const eventCol = { buff:'#3ac762', loot:'#e8c547', hazard:'#c81616', encounter:'#ff2d80', env:'#8bd8ff', story:'#c86ade', gamble:'#ff9c3d', rep:'#ffefa8' }[ev.kind] || '#e8c547';
    underground.eventQueue.push({ title: ev.title, result, life: ev.life, max: ev.life, col: eventCol, kind: ev.kind });
    // 최대 3개까지만 유지
    if (underground.eventQueue.length > 3) underground.eventQueue.shift();
    underground.eventT = 20 + Math.random() * 20;
    if (typeof sfx === 'function') sfx(ev.kind === 'hazard' ? 'hurt' : ev.kind === 'gamble' ? 'jackpot' : 'level');
    if (ev.kind === 'story' && typeof showAchievementBanner === 'function') showAchievementBanner('지하의 발견', ev.title, eventCol);
  }
  // 이벤트 큐 tick
  for (let i = underground.eventQueue.length - 1; i >= 0; i--) {
    underground.eventQueue[i].life -= dt;
    if (underground.eventQueue[i].life <= 0) underground.eventQueue.splice(i, 1);
  }
  // 환경 효과 tick
  const now = performance.now();
  if (underground.rainStones && now < underground.rainStones) {
    // 5% 초당 낙석 = 낙석 발생 확률
    if (Math.random() < 0.05 * dt * 20) {
      const dmg = 15 + Math.floor(Math.random() * 25);
      if (player) { player.hp = Math.max(1, player.hp - dmg); }
      if (typeof spawnFloat === 'function') spawnFloat(underground.playerX, underground.playerY - 8, '-' + dmg + ' 낙석', '#c81616');
    }
  }
  if (underground.rainStones && now >= underground.rainStones) underground.rainStones = 0;
  if (underground.foggy && now >= underground.foggy) underground.foggy = 0;

  if (keys['Escape'] || keys['KeyR']) {
    keys['Escape']=false; keys['KeyR']=false;
    goTo('academy');
  }
}

function renderUnderground() {
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W*PX, H*PX);
  const camX = underground.camX, camY = underground.camY;

  ctx.save();
  ctx.translate(-camX * PX, -camY * PX);

  // 벽돌 바닥 (2 tone)
  for (let ty = 0; ty < UNDER_H; ty += 24) {
    for (let tx = 0; tx < UNDER_W; tx += 24) {
      const sx = tx - camX, sy = ty - camY;
      if (sx < -24 || sx > W || sy < -24 || sy > H) continue;
      ctx.fillStyle = ((Math.floor(tx/24) + Math.floor(ty/24)) & 1) ? '#1a0a1a' : '#100510';
      ctx.fillRect(tx*PX, ty*PX, 24*PX, 24*PX);
    }
  }
  // 세로 기둥 - 격자 사이
  for (let cx = 200; cx < UNDER_W; cx += 200) {
    ctx.fillStyle = '#2a1a3a';
    ctx.fillRect(cx*PX, 0, 4*PX, UNDER_H*PX);
  }
  for (let cy = 200; cy < UNDER_H; cy += 200) {
    ctx.fillStyle = '#2a1a3a';
    ctx.fillRect(0, cy*PX, UNDER_W*PX, 4*PX);
  }
  // 외곽 벽
  ctx.fillStyle = '#0a0510';
  ctx.fillRect(0, 0, UNDER_W*PX, 6*PX);
  ctx.fillRect(0, (UNDER_H-6)*PX, UNDER_W*PX, 6*PX);
  ctx.fillRect(0, 0, 6*PX, UNDER_H*PX);
  ctx.fillRect((UNDER_W-6)*PX, 0, 6*PX, UNDER_H*PX);

  // 계단 (하강)
  const layoutR = _currentLayout();
  if (layoutR.stair) {
    const sx = layoutR.stair.x, sy = layoutR.stair.y;
    // 미니보스 층이면 보스 격파 안 되었을 때 잠금
    const stairLocked = layoutR.hasBoss && !underground.bossDown[underground.floor];
    ctx.fillStyle = stairLocked ? '#3a2a4a' : '#c86ade';
    ctx.fillRect((sx - 12)*PX, (sy - 12)*PX, 24*PX, 24*PX);
    ctx.fillStyle = '#0a0510';
    for (let i = 0; i < 6; i++) ctx.fillRect((sx - 10 + i * 4)*PX, (sy - 10 + i * 4)*PX, 2*PX, 2*PX);
    drawText('↓', sx - 3, sy - 3, stairLocked ? '#5a4a80' : '#ffefa8');
    if (Math.hypot(underground.playerX - sx, underground.playerY - sy) < 40) {
      drawText('하강 계단 (F' + (underground.floor + 1) + ')', sx - textWidth('하강 계단 (F' + (underground.floor + 1) + ')')/2, sy - 26, stairLocked ? '#c81616' : '#ffefa8');
      if (Math.hypot(underground.playerX - sx, underground.playerY - sy) < 22) {
        drawText(stairLocked ? '[보스 격파 필요]' : '[SPACE 하강]', sx - textWidth(stairLocked ? '[보스 격파 필요]' : '[SPACE 하강]')/2, sy + 26, stairLocked ? '#c81616' : '#ffefa8');
      }
    }
  }
  // 상승 계단 (플레이어 시작 지점, 층 > 1)
  if (underground.floor > 1) {
    const ax = 60, ay = 700;
    ctx.fillStyle = '#8bd8ff';
    ctx.fillRect((ax - 10)*PX, (ay - 10)*PX, 20*PX, 20*PX);
    drawText('↑', ax - 3, ay - 3, '#0a0510');
    if (Math.hypot(underground.playerX - ax, underground.playerY - ay) < 40) {
      drawText('상승 계단 (F' + (underground.floor - 1) + ')', ax - textWidth('상승 계단 (F' + (underground.floor - 1) + ')')/2, ay - 24, '#8bd8ff');
      if (Math.hypot(underground.playerX - ax, underground.playerY - ay) < 20) {
        drawText('[SPACE 상승]', ax - textWidth('[SPACE 상승]')/2, ay + 24, '#8bd8ff');
      }
    }
  }

  // 미니보스 (5층)
  if (underground.boss) {
    const b = underground.boss;
    ctx.fillStyle = 'rgba(255, 45, 128, ' + (0.4 + Math.sin(state.time * 3) * 0.3) + ')';
    ctx.beginPath(); ctx.arc(b.x*PX, b.y*PX, (b.r + 6)*PX, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = b.hitT > 0 ? '#ffefa8' : '#c81616';
    ctx.beginPath(); ctx.arc(b.x*PX, b.y*PX, b.r*PX, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#050505';
    ctx.beginPath(); ctx.arc(b.x*PX, b.y*PX, (b.r - 4)*PX, 0, Math.PI*2); ctx.fill();
    drawText('심연의 지배자', b.x - textWidth('심연의 지배자')/2, b.y - b.r - 10, '#ff2d80');
    // HP 바
    const bw = 60, ratio = b.hp / b.maxHp;
    pxDraw(b.x - bw/2, b.y + b.r + 4, bw, 4, '#1a0e2e');
    pxDraw(b.x - bw/2, b.y + b.r + 4, Math.floor(bw * ratio), 4, '#c81616');
  }

  // 방 - 현재 층만
  const roomsR = _floorRooms();
  for (const rm of roomsR) {
    const locked = !isProfBeaten(rm.key);
    const claimed = underground.claimed[rm.key];
    // 방 - 원형 (28px 반경)
    ctx.fillStyle = locked ? 'rgba(20, 10, 30, 0.9)' : (claimed ? 'rgba(40, 20, 60, 0.6)' : 'rgba(60, 30, 100, 0.85)');
    ctx.beginPath(); ctx.arc(rm.x*PX, rm.y*PX, 24*PX, 0, Math.PI*2); ctx.fill();
    // 문 표식
    ctx.fillStyle = locked ? '#3a2a4a' : rm.col;
    ctx.beginPath(); ctx.arc(rm.x*PX, rm.y*PX, 6*PX, 0, Math.PI*2); ctx.fill();
    if (locked) {
      drawText('🔒', rm.x - 4, rm.y - 3, '#5a4a80');
    } else if (claimed) {
      drawText('✓', rm.x - 2, rm.y - 3, '#5a4a80');
    } else {
      // 미청구 - 반짝임
      const glow = 0.5 + Math.sin(state.time * 3 + rm.x) * 0.3;
      ctx.strokeStyle = rm.col;
      ctx.globalAlpha = glow;
      ctx.lineWidth = PX * 2;
      ctx.beginPath(); ctx.arc(rm.x*PX, rm.y*PX, 22*PX, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // 근접 시 이름
    const d = Math.hypot(underground.playerX - rm.x, underground.playerY - rm.y);
    if (d < 40) {
      drawText(rm.name, rm.x - textWidth(rm.name)/2, rm.y - 30, rm.col);
      if (d < 22) {
        const hint = locked ? '[LOCKED]' : (claimed ? '[수령 완료]' : '[SPACE 수령]');
        drawText(hint, rm.x - textWidth(hint)/2, rm.y + 30, locked ? '#c81616' : (claimed ? '#5a4a80' : '#ffefa8'));
      }
    }
  }

  // 방랑 몹
  for (const e of underground.enemies) {
    const col = e.kind === 'ghost' ? '#c86ade' : '#5a4a80';
    ctx.globalAlpha = 0.6 + Math.sin(state.time * 4 + e.x) * 0.3;
    pxDraw(e.x - 3, e.y - 3, 6, 6, col);
    pxDraw(e.x - 1, e.y - 1, 2, 2, '#ffefa8');
    ctx.globalAlpha = 1;
  }

  // 플레이어
  const pa = (typeof activePlayerPal === 'function') ? activePlayerPal() : null;
  if (pa && typeof SPR_PLAYER_S1 !== 'undefined' && typeof drawSprite === 'function') {
    drawSprite(SPR_PLAYER_S1, pa, underground.playerX - 6, underground.playerY - 7);
  } else {
    pxDraw(underground.playerX - 4, underground.playerY - 4, 8, 8, '#ffefa8');
  }

  ctx.restore();

  // HUD (화면 좌표)
  pxDraw(0, 0, W, 12, '#1a0e2e');
  const claimedCnt = Object.keys(underground.claimed).length;
  const unlockedCnt = PROF_ROOMS.filter(r => isProfBeaten(r.key)).length;
  drawText('★ ' + _currentLayout().name + '  ·  F' + underground.floor + '/' + UNDER_MAX_FLOOR + '  ·  수령 ' + claimedCnt + '/' + PROF_ROOMS.length, 4, 3, '#c86ade');
  drawText('HP ' + Math.floor(player ? player.hp : 0) + '/' + Math.floor(player ? player.maxHp : 100), W - 100, 3, '#ff6666');
  drawText('[R/ESC] 나가기', W - textWidth('[R/ESC] 나가기') - 4, H - 10, '#5a4a80');
  drawText('WASD 이동 · SHIFT 달리기 · SPACE 상호작용', W/2 - textWidth('WASD 이동 · SHIFT 달리기 · SPACE 상호작용')/2, H - 10, '#8a7ab5');

  // 미니맵
  const mmW = 88, mmH = 60, mmX = W - mmW - 4, mmY = 14;
  pxDraw(mmX - 1, mmY - 1, mmW + 2, mmH + 2, '#000');
  pxDraw(mmX, mmY, mmW, mmH, '#100510');
  // 현재 층 방만 미니맵 표시
  for (const rm of _floorRooms()) {
    const dx = mmX + Math.floor((rm.x / UNDER_W) * mmW);
    const dy = mmY + Math.floor((rm.y / UNDER_H) * mmH);
    const c = !isProfBeaten(rm.key) ? '#3a2a4a' : (underground.claimed[rm.key] ? '#5a4a80' : rm.col);
    pxDraw(dx - 1, dy - 1, 2, 2, c);
  }
  // 계단 미니맵
  const layoutM = _currentLayout();
  if (layoutM.stair) {
    const sMx = mmX + Math.floor((layoutM.stair.x / UNDER_W) * mmW);
    const sMy = mmY + Math.floor((layoutM.stair.y / UNDER_H) * mmH);
    pxDraw(sMx - 1, sMy - 1, 3, 3, '#c86ade');
  }
  if (underground.boss) {
    const bMx = mmX + Math.floor((underground.boss.x / UNDER_W) * mmW);
    const bMy = mmY + Math.floor((underground.boss.y / UNDER_H) * mmH);
    pxDraw(bMx - 1, bMy - 1, 3, 3, '#ff2d80');
  }
  // 플레이어 마커
  const pMx = mmX + Math.floor((underground.playerX / UNDER_W) * mmW);
  const pMy = mmY + Math.floor((underground.playerY / UNDER_H) * mmH);
  pxDraw(pMx - 1, pMy - 1, 2, 2, '#ffefa8');
  // 카메라 뷰포트
  const vx = mmX + Math.floor((camX / UNDER_W) * mmW);
  const vy = mmY + Math.floor((camY / UNDER_H) * mmH);
  const vw = Math.max(3, Math.floor(W / UNDER_W * mmW));
  const vh = Math.max(3, Math.floor(H / UNDER_H * mmH));
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = PX;
  ctx.strokeRect(vx*PX, vy*PX, vw*PX, vh*PX);

  // 이벤트 큐 (좌하단에서 위로 스택 - 최근이 위)
  const queue = underground.eventQueue || [];
  const boxW = 180, boxH = 20;
  for (let i = 0; i < Math.min(3, queue.length); i++) {
    const ev = queue[queue.length - 1 - i];
    if (!ev) continue;
    const bx = 4, by = H - 44 - i * (boxH + 2);
    const fadeIn = ev.life > ev.max - 0.4 ? (ev.max - ev.life) / 0.4 : 1;
    const fadeOut = ev.life < 0.6 ? (ev.life / 0.6) : 1;
    ctx.globalAlpha = Math.min(1, Math.min(fadeIn, fadeOut));
    pxDraw(bx, by, boxW, boxH, '#1a0e2e');
    pxDraw(bx, by, boxW, 1, ev.col);
    pxDraw(bx, by + boxH - 1, boxW, 1, ev.col);
    drawText('◈ ' + ev.title, bx + 6, by + 3, ev.col);
    drawText(ev.result + '  (' + ev.life.toFixed(1) + 's)', bx + 6, by + 12, '#ffefa8');
    ctx.globalAlpha = 1;
  }

  // 환경 효과 오버레이 (푸른 안개, 낙석 경고)
  if (underground.foggy && performance.now() < underground.foggy) {
    ctx.fillStyle = 'rgba(140, 220, 255, 0.18)';
    ctx.fillRect(0, 0, W*PX, H*PX);
    // 안개 파티클
    for (let i = 0; i < 4; i++) {
      const x = (state.time * 20 + i * 100) % (W + 60) - 30;
      const y = 30 + (i * 40) % (H - 60);
      ctx.fillStyle = 'rgba(200, 240, 255, 0.15)';
      ctx.fillRect(x*PX, y*PX, 40*PX, 20*PX);
    }
  }
  if (underground.rainStones && performance.now() < underground.rainStones) {
    // 상단에 붉은 경고
    const t = state.time * 4;
    ctx.fillStyle = 'rgba(200, 22, 22, ' + (0.15 + Math.sin(t) * 0.10) + ')';
    ctx.fillRect(0, 12*PX, W*PX, 6*PX);
    drawText('★ 낙석 경고 ★', W/2 - textWidth('★ 낙석 경고 ★')/2, 14, '#ffff00');
  }

  // 메시지
  if (underground.msgT > 0) {
    ctx.globalAlpha = Math.min(1, underground.msgT);
    const boxW = textWidth(underground.msg) + 16;
    pxDraw(W/2 - boxW/2, H - 30, boxW, 12, '#1a0e2e');
    drawText(underground.msg, W/2 - textWidth(underground.msg)/2, H - 26, '#ffefa8');
    ctx.globalAlpha = 1;
  }
}
