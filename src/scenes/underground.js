// =====================================================================
// Underground - 아카데미 지하 던전형 대형 맵.
// 1200x800 월드, 카메라 팔로우. 22개 교수 방 (격파 시 해금).
// 방마다 1회성 보상 + 스토리 조각. 방랑 몹 + 30초마다 랜덤 이벤트.
// =====================================================================

const UNDER_W = 1200;
const UNDER_H = 800;

// 각 교수 방 정보 - 위치 + 보상 정의
// 방 개수 = 22 (FACULTY_PROFESSORS 총합). 격자로 배치.
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
  activeEvent: null,        // {title, effect, life}
  msg: '', msgT: 0,
  spawnT: 0,
};

function _initUnderground() {
  underground.playerX = 100;
  underground.playerY = 700;
  underground.camX = 0;
  underground.camY = 0;
  underground.enemies = [];
  underground.eventT = 15;
  underground.spawnT = 3;
  underground.activeEvent = null;
}

function isProfBeaten(key) {
  const b = state.professorsBeaten || {};
  return !!(b[key + '_a'] || b[key + '_b'] || b[key]);
}

// 지하 랜덤 이벤트 - 30초마다.
const UNDER_EVENTS = [
  { title:'유령의 노래',   life:20, effect:(p)=>{ p.mp = Math.min(p.maxMp, p.mp + 30); return '+30 MP'; } },
  { title:'옛 마도사의 축복', life:20, effect:(p)=>{ p.hp = Math.min(p.maxHp, p.hp + 40); return '+40 HP'; } },
  { title:'잊혀진 금고',   life:15, effect:(p)=>{ state.gold = (state.gold||0) + 50; return '+50 G'; } },
  { title:'금서 조각',     life:15, effect:(p)=>{ state.research = (state.research||0) + 200; return '+200 RP'; } },
  { title:'봉인의 반향',   life:12, effect:(p)=>{ p.baseDmg *= 1.05; return 'DMG +5%'; } },
  { title:'저주받은 지반', life:10, effect:(p)=>{ p.hp = Math.max(1, p.hp - 20); return '-20 HP' } },
  { title:'폐허의 기계',   life:15, effect:(p)=>{ p.speed = (p.speed||100) * 1.10; return 'SPD +10%'; } },
];

function _spawnUnderEnemy() {
  // 플레이어 근처가 아닌 지점에 스폰
  let x, y, tries = 0;
  do {
    x = 40 + Math.random() * (UNDER_W - 80);
    y = 40 + Math.random() * (UNDER_H - 80);
    tries++;
  } while (Math.hypot(x - underground.playerX, y - underground.playerY) < 120 && tries < 10);
  underground.enemies.push({
    x, y, vx: 0, vy: 0, r: 5,
    hp: 30 + (state.finalCleared||0) * 20,
    dmg: 5 + (state.finalCleared||0) * 2,
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

  // 방 상호작용
  for (const rm of PROF_ROOMS) {
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

  // 방랑 몹 스폰 (최대 6마리)
  underground.spawnT -= dt;
  if (underground.spawnT <= 0 && underground.enemies.length < 6) {
    _spawnUnderEnemy();
    underground.spawnT = 6 + Math.random() * 6;
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

  // 랜덤 이벤트 (30초마다)
  underground.eventT -= dt;
  if (underground.eventT <= 0 && !underground.activeEvent) {
    const ev = UNDER_EVENTS[Math.floor(Math.random() * UNDER_EVENTS.length)];
    const result = ev.effect(player);
    underground.activeEvent = { title: ev.title, result, life: ev.life, max: ev.life };
    underground.eventT = 30 + Math.random() * 15;
    if (typeof sfx === 'function') sfx('level');
  }
  if (underground.activeEvent) {
    underground.activeEvent.life -= dt;
    if (underground.activeEvent.life <= 0) underground.activeEvent = null;
  }

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

  // 방
  for (const rm of PROF_ROOMS) {
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
  drawText('학원 지하  ·  개방된 방 ' + unlockedCnt + '/' + PROF_ROOMS.length + '  ·  수령 ' + claimedCnt, 4, 3, '#c86ade');
  drawText('HP ' + Math.floor(player ? player.hp : 0) + '/' + Math.floor(player ? player.maxHp : 100), W - 100, 3, '#ff6666');
  drawText('[R/ESC] 나가기', W - textWidth('[R/ESC] 나가기') - 4, H - 10, '#5a4a80');
  drawText('WASD 이동 · SHIFT 달리기 · SPACE 상호작용', W/2 - textWidth('WASD 이동 · SHIFT 달리기 · SPACE 상호작용')/2, H - 10, '#8a7ab5');

  // 미니맵
  const mmW = 88, mmH = 60, mmX = W - mmW - 4, mmY = 14;
  pxDraw(mmX - 1, mmY - 1, mmW + 2, mmH + 2, '#000');
  pxDraw(mmX, mmY, mmW, mmH, '#100510');
  for (const rm of PROF_ROOMS) {
    const dx = mmX + Math.floor((rm.x / UNDER_W) * mmW);
    const dy = mmY + Math.floor((rm.y / UNDER_H) * mmH);
    const c = !isProfBeaten(rm.key) ? '#3a2a4a' : (underground.claimed[rm.key] ? '#5a4a80' : rm.col);
    pxDraw(dx - 1, dy - 1, 2, 2, c);
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

  // 활성 이벤트 배너
  if (underground.activeEvent) {
    const ev = underground.activeEvent;
    const boxW = 200, bx = W/2 - boxW/2, by = 26;
    pxDraw(bx, by, boxW, 20, '#1a0e2e');
    pxDraw(bx, by, boxW, 1, '#e8c547');
    pxDraw(bx, by + 19, boxW, 1, '#e8c547');
    drawText('◈ ' + ev.title, bx + 6, by + 3, '#e8c547');
    drawText(ev.result + '  (' + ev.life.toFixed(1) + 's)', bx + 6, by + 12, '#ffefa8');
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
