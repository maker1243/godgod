// =====================================================================
// Outer Map - 봉인 파괴 후 광대한 바깥 세계.
// 800x600 월드, 플레이어 카메라 팔로우. 여러 랜드마크에서 축복/조각 획득.
// 검은 심장 (동쪽 끝) 도달 → 최종전.
// =====================================================================

const OUTER_W = 800;
const OUTER_H = 600;

const outerMap = {
  playerX: 100, playerY: 300,
  camX: 0, camY: 0,
  arrowAng: 0,
  bhX: 720, bhY: 300,      // 검은 심장 위치 (동쪽 끝)
  visited: {},              // {landmark id: true}
  msg: '', msgT: 0,
  eventT: 12,               // 다음 이벤트 카운트다운
  eventQueue: [],           // 활성 이벤트 최대 3개
  storm: 0,                 // 폭풍 종료 시각 (performance.now())
  meteor: 0,                // 유성 활성 종료
  dayNight: 0,              // 낮/밤 사이클 0..1
};

// =====================================================================
// 지상 랜덤 이벤트 - 20~35초 간격.
// =====================================================================
const OUTER_EVENTS = [
  // === 자연 현상 (env) ===
  { title:'대지의 진동',       kind:'env',   life:15, effect:(p)=>{ if (p) p.speed = (p.speed||100) * 0.75; return 'SPD -25% (15초)'; } },
  { title:'붉은 폭풍',         kind:'env',   life:20, effect:(p)=>{ outerMap.storm = performance.now() + 20000; return '20초간 시야 감소 + 초당 -3 HP'; } },
  { title:'유성 낙하',         kind:'env',   life:15, effect:(p)=>{ outerMap.meteor = performance.now() + 15000; return '15초간 랜덤 낙석'; } },
  { title:'밤이 온다',         kind:'env',   life:20, effect:(p)=>{ outerMap.dayNight = performance.now() + 20000; if (p) p.crit = (p.crit||0) + 0.05; return '어둠 · 크리 +5%'; } },
  { title:'봉인의 여진',       kind:'env',   life:12, effect:(p)=>{ state.shake = 20; return '지반 흔들림'; } },

  // === 유익 (buff) ===
  { title:'유령의 축복',       kind:'buff',  life:20, effect:(p)=>{ if (p) { p.baseDmg *= 1.10; } return 'DMG +10%'; } },
  { title:'황폐의 활력',       kind:'buff',  life:20, effect:(p)=>{ if (p) { p.maxHp += 50; p.hp = Math.min(p.maxHp, p.hp + 50); } return '+50 최대 HP'; } },
  { title:'죽은 자의 기록',    kind:'buff',  life:15, effect:(p)=>{ state.research = (state.research||0) + 1000; return '+1000 RP'; } },
  { title:'바람의 인도',       kind:'buff',  life:15, effect:(p)=>{ if (p) p.speed = (p.speed||100) * 1.30; return 'SPD +30% (30초)'; } },
  { title:'봉인 파편의 축복',  kind:'buff',  life:15, effect:(p)=>{ if (p) { p.crit = (p.crit||0) + 0.10; } return '크리 +10% (영구)'; } },

  // === 자원 (loot) ===
  { title:'황금 유물 발견',    kind:'loot',  life:12, effect:(p)=>{ const g = 500 + Math.floor(Math.random()*1500); state.gold = (state.gold||0) + g; return '+' + g + ' G'; } },
  { title:'봉인의 조각',       kind:'loot',  life:12, effect:(p)=>{ const rp = 2000 + Math.floor(Math.random()*3000); state.research = (state.research||0) + rp; return '+' + rp + ' RP'; } },
  { title:'재의 아티팩트',     kind:'loot',  life:12, effect:(p)=>{ if (typeof _ensureArtifactsState==='function') _ensureArtifactsState(); if (state.artifacts && typeof ARTIFACT_DEFS!=='undefined' && ARTIFACT_DEFS.length) { const pick = ARTIFACT_DEFS[Math.floor(Math.random()*ARTIFACT_DEFS.length)]; if (!state.artifacts.owned[pick.id]) { state.artifacts.owned[pick.id] = true; return '아티팩트 ' + pick.name; } } return '재만 남았다'; } },
  { title:'빈 술병',           kind:'loot',  life:8,  effect:(p)=>{ academy.inventory.mana = (academy.inventory.mana||0) + 3; if (typeof recomputeHotkeys==='function') recomputeHotkeys(); return '마나 물약 +3'; } },

  // === 조우 (encounter) ===
  { title:'검은 그림자 무리',  kind:'encounter', life:8, effect:(p)=>{
      const boss = { x: outerMap.playerX + rand(-80, 80), y: outerMap.playerY + rand(-80, 80), r: 8,
        hp: 100 + (state.finalCleared||0)*100, dmg: 12, hitT: 0, kind: 'outer_shadow' };
      outerMap.mobs = outerMap.mobs || []; outerMap.mobs.push(boss);
      return '어둠이 다가온다';
    } },
  { title:'거대 유령',         kind:'encounter', life:8, effect:(p)=>{
      const boss = { x: outerMap.playerX + rand(-100, 100), y: outerMap.playerY + rand(-100, 100), r: 12,
        hp: 300 + (state.finalCleared||0)*150, dmg: 25, hitT: 0, kind: 'outer_giant', isElite: true };
      outerMap.mobs = outerMap.mobs || []; outerMap.mobs.push(boss);
      return '거대 유령 (엘리트)';
    } },

  // === 스토리 (story) ===
  { title:'엘라라의 잔영',     kind:'story', life:15, effect:(p)=>{ if (typeof unlockStoryFragment==='function') unlockStoryFragment('elara_true'); return '엘라라의 진짜 이름'; } },
  { title:'봉인 관리인의 유해',kind:'story', life:15, effect:(p)=>{ if (typeof unlockStoryFragment==='function') unlockStoryFragment('principal'); return '교장의 유해'; } },
  { title:'거울 속의 나',      kind:'story', life:15, effect:(p)=>{ if (typeof unlockStoryFragment==='function') unlockStoryFragment('mirror_evt'); return '다른 나의 세계'; } },

  // === 도박 (gamble) ===
  { title:'검은 심장의 시선',  kind:'gamble',life:10, effect:(p)=>{ const r = Math.random(); if (r < 0.4) { if (p) p.baseDmg *= 1.20; return 'DMG +20% (영구)'; } if (p) { p.maxHp = Math.max(1, Math.floor(p.maxHp * 0.85)); p.hp = Math.min(p.hp, p.maxHp); } return '최대 HP -15%'; } },
  { title:'봉인 잔재를 삼킴',  kind:'gamble',life:10, effect:(p)=>{ const r = Math.random(); if (r < 0.5) { state.research = (state.research||0) + 5000; return '+5000 RP'; } if (p) p.hp = Math.max(1, p.hp - 40); return '-40 HP'; } },

  // === 평판 (rep) ===
  { title:'방랑자와 대화',     kind:'rep',   life:10, effect:(p)=>{ if (typeof repAdd==='function') repAdd('wanderer', 12); return '방랑자 +12'; } },
  { title:'뒷골목 밀사',       kind:'rep',   life:10, effect:(p)=>{ if (typeof repAdd==='function') { repAdd('underground', 10); repAdd('noble', -6); } return '뒷골목 +10 / 명문가 -6'; } },
];

// 랜드마크: 각기 다른 위치 + 방문 시 보상
const LANDMARKS = [
  { id:'ruin_temple', x: 200, y: 150, r: 20, name:'무너진 신전', color:'#c8b898',
    desc:'봉인 이전 시대의 신전. 재단 위에 유리병이 있다.',
    reward:(s)=>{ s.research = (s.research||0) + 5000; return '+5000 RP (고대 지혜)'; } },
  { id:'ghost_village', x: 350, y: 100, r: 22, name:'유령 마을', color:'#8bd8ff',
    desc:'봉인 붕괴 이후 아이들만 남은 마을. 그들의 눈은 텅 비어있다.',
    reward:(s)=>{ s.gold = (s.gold||0) + 10000; return '+10000 G (아이들의 저축)'; } },
  { id:'ash_forest', x: 500, y: 450, r: 25, name:'재의 숲', color:'#ff9c3d',
    desc:'모든 나무가 검게 타버린 숲. 그러나 나무 하나가 아직 붉게 빛난다.',
    reward:(s)=>{
      if (typeof unlockStoryFragment === 'function') unlockStoryFragment('mirror_evt');
      return '스토리 조각 획득';
    } },
  { id:'iron_tower', x: 250, y: 500, r: 24, name:'철의 탑', color:'#c86ade',
    desc:'거대한 검은 탑. 정상에서 봉인의 마지막 유지자가 잠들어 있다고 한다.',
    reward:(s)=>{
      if (typeof _ensureArtifactsState === 'function') _ensureArtifactsState();
      if (s.artifacts) s.artifacts.owned['god_iron'] = true;
      return '아티팩트 획득 (있으면)';
    } },
  { id:'bloody_lake', x: 600, y: 150, r: 22, name:'피의 호수', color:'#ff2d2d',
    desc:'검은 심장의 피로 물든 호수. 물결이 심장 박동에 맞춰 뛴다.',
    reward:(s)=>{ if (player) { player.maxHp += 100; player.hp += 100; } return '+100 MAX HP (피의 은총)'; } },
  { id:'crossroads', x: 450, y: 300, r: 18, name:'교차로', color:'#e8c547',
    desc:'네 방향으로 이어지는 갈림길. 표지판이 모두 지워져 있다.',
    reward:(s)=>{ s.gpa = (s.gpa||0) + 0.5; return '+0.5 GPA (여행 경험)'; } },
  { id:'lost_library', x: 130, y: 480, r: 20, name:'잃어버린 도서관', color:'#5affff',
    desc:'모든 책이 스스로 페이지를 넘기고 있다. 아무도 읽지 않는데.',
    reward:(s)=>{ s.research = (s.research||0) + 20000; if (typeof unlockStoryFragment === 'function') unlockStoryFragment('wanderer_evt'); return '+20000 RP + 조각'; } },
  // 추가 랜드마크
  { id:'obsidian_pyramid', x: 380, y: 550, r: 26, name:'흑요석 피라미드', color:'#3a1e5c',
    desc:'검은 유리로 만들어진 삼각뿔. 내부에서 낮은 진동이 새어나온다.',
    reward:(s)=>{ if (player) { player.baseDmg *= 1.15; } s.research = (s.research||0) + 8000; return 'DMG +15% (영구) · +8000 RP'; } },
  { id:'wanderers_camp', x: 90, y: 200, r: 18, name:'방랑자의 야영지', color:'#e8c547',
    desc:'꺼진 모닥불과 다양한 흔적. 방랑하는 자만이 아는 지도가 있다.',
    reward:(s)=>{ if (typeof repAdd==='function') repAdd('wanderer', 15); s.gold = (s.gold||0) + 3000; return '방랑자 +15 · +3000G'; } },
  { id:'phase_gate', x: 620, y: 400, r: 22, name:'상변환 문',       color:'#00ffcc',
    desc:'세계의 균열이 아직 닫히지 않은 곳. 다른 층의 자원이 흘러온다.',
    reward:(s)=>{ if (typeof _toolEnsure==='function') _toolEnsure(); if (state.magicTools) { state.magicTools['phase_ring'] = Math.min(5, (state.magicTools['phase_ring']||0) + 1); } return '상변환 반지 +1 (자동 제작)'; } },
  { id:'clock_ruin', x: 200, y: 350, r: 20, name:'시계탑 잔해',     color:'#ff9c3d',
    desc:'시계가 여전히 돌고 있다. 다만 시간이 거꾸로.',
    reward:(s)=>{ if (player) player.cdMult = (player.cdMult||1) * 0.85; return 'CD -15% (영구)'; } },
  { id:'ghost_market', x: 480, y: 90, r: 22, name:'유령 시장',       color:'#c86ade',
    desc:'죽은 자들이 거래를 이어간다. 산 자의 골드도 받는다.',
    reward:(s)=>{ if (typeof unlockStoryFragment==='function') unlockStoryFragment('timetraveler_evt'); s.gold = (s.gold||0) + 5000; return '스토리 조각 + 5000G'; } },
  { id:'moon_altar',  x: 700, y: 500, r: 24, name:'달의 재단',       color:'#8bd8ff',
    desc:'달빛만이 이곳을 밝힌다. 밤에 온 대가로 힘을 준다.',
    reward:(s)=>{ if (player) { player.crit = (player.crit||0) + 0.08; player.critMult = (player.critMult||2) + 0.5; } return '크리 +8% & 크리 배율 +0.5'; } },
  { id:'burnt_academy', x: 60, y: 400, r: 22, name:'불탄 별관',      color:'#c81616',
    desc:'아카데미의 옛 별관. 검은 그을음 사이에 룬이 새겨져 있다.',
    reward:(s)=>{ if (typeof unlockStoryFragment==='function') unlockStoryFragment('renn_bond'); if (typeof repAdd==='function') repAdd('academy', 10); return '학원 +10 · 조각 획득'; } },
];

function _initOuterMap() {
  outerMap.playerX = 80;
  outerMap.playerY = 300;
  outerMap.camX = 0;
  outerMap.camY = 0;
}

function updateOuterMap(dt) {
  if (outerMap.msgT > 0) outerMap.msgT -= dt;

  // 이벤트 큐 & 발동
  if (!outerMap.eventQueue) outerMap.eventQueue = [];
  outerMap.eventT = (outerMap.eventT || 12) - dt;
  if (outerMap.eventT <= 0) {
    const ev = OUTER_EVENTS[Math.floor(Math.random() * OUTER_EVENTS.length)];
    let result;
    try { result = ev.effect(player); } catch(e) { result = '(효과 실패)'; }
    const eventCol = { buff:'#3ac762', loot:'#e8c547', hazard:'#c81616', encounter:'#ff2d80', env:'#8bd8ff', story:'#c86ade', gamble:'#ff9c3d', rep:'#ffefa8' }[ev.kind] || '#e8c547';
    outerMap.eventQueue.push({ title: ev.title, result, life: ev.life, max: ev.life, col: eventCol, kind: ev.kind });
    if (outerMap.eventQueue.length > 3) outerMap.eventQueue.shift();
    outerMap.eventT = 20 + Math.random() * 15;
    if (typeof sfx === 'function') sfx(ev.kind === 'hazard' ? 'hurt' : (ev.kind === 'gamble' ? 'jackpot' : 'level'));
    if (ev.kind === 'story' && typeof showAchievementBanner === 'function') showAchievementBanner('바깥의 발견', ev.title, eventCol);
  }
  for (let i = outerMap.eventQueue.length - 1; i >= 0; i--) {
    outerMap.eventQueue[i].life -= dt;
    if (outerMap.eventQueue[i].life <= 0) outerMap.eventQueue.splice(i, 1);
  }

  // 환경 지속 효과
  const nowP = performance.now();
  if (outerMap.storm && nowP < outerMap.storm) {
    if (Math.random() < 0.5 * dt && player) { player.hp = Math.max(1, player.hp - 3); }
  } else if (outerMap.storm && nowP >= outerMap.storm) outerMap.storm = 0;
  if (outerMap.meteor && nowP < outerMap.meteor) {
    if (Math.random() < 0.15 * dt * 20 && player) {
      const dmg = 20 + Math.floor(Math.random()*30);
      player.hp = Math.max(1, player.hp - dmg);
      if (typeof spawnFloat==='function') spawnFloat(outerMap.playerX, outerMap.playerY - 8, '-' + dmg + ' 유성', '#c81616');
    }
  } else if (outerMap.meteor && nowP >= outerMap.meteor) outerMap.meteor = 0;

  // 방랑 몹 이동/접촉
  if (outerMap.mobs) {
    for (let i = outerMap.mobs.length - 1; i >= 0; i--) {
      const m = outerMap.mobs[i];
      const a = Math.atan2(outerMap.playerY - m.y, outerMap.playerX - m.x);
      const spd = m.isElite ? 60 : 40;
      m.x += Math.cos(a) * spd * dt;
      m.y += Math.sin(a) * spd * dt;
      const d = Math.hypot(outerMap.playerX - m.x, outerMap.playerY - m.y);
      if (d < m.r + 6 && player && (!player.invuln || player.invuln <= 0)) {
        player.hp = Math.max(1, player.hp - (m.dmg || 10));
        player.invuln = 0.5;
        m.hp -= 50;
      }
      if (m.hp <= 0) outerMap.mobs.splice(i, 1);
    }
  }

  // 이동
  let mx = 0, my = 0;
  if (keys['KeyA'] || keys['ArrowLeft'])  mx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
  if (keys['KeyW'] || keys['ArrowUp'])    my -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  my += 1;
  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; }
  const spd = 90 * (keys['ShiftLeft'] || keys['ShiftRight'] ? 2.2 : 1);
  outerMap.playerX = clamp(outerMap.playerX + mx * spd * dt, 8, OUTER_W - 8);
  outerMap.playerY = clamp(outerMap.playerY + my * spd * dt, 8, OUTER_H - 8);

  // 카메라 - 플레이어 중앙 유지, 월드 경계 clamp
  outerMap.camX = clamp(outerMap.playerX - W/2, 0, OUTER_W - W);
  outerMap.camY = clamp(outerMap.playerY - H/2, 0, OUTER_H - H);

  // 나침반 (검은 심장 향)
  outerMap.arrowAng = Math.atan2(outerMap.bhY - outerMap.playerY, outerMap.bhX - outerMap.playerX);

  // 랜드마크 상호작용
  for (const lm of LANDMARKS) {
    const d = Math.hypot(outerMap.playerX - lm.x, outerMap.playerY - lm.y);
    if (d < lm.r && (keys['Space'] || keys['Enter'])) {
      keys['Space']=false; keys['Enter']=false;
      if (outerMap.visited[lm.id]) {
        outerMap.msg = lm.name + ' - 이미 방문한 곳'; outerMap.msgT = 2.5;
      } else {
        outerMap.visited[lm.id] = true;
        const rwd = lm.reward(state) || '';
        outerMap.msg = lm.name + ' 도착! ' + rwd;
        outerMap.msgT = 4;
        if (typeof sfx === 'function') sfx('level');
        if (typeof saveAccountData === 'function') saveAccountData();
      }
      return;
    }
  }

  // 검은 심장 도달
  const d = Math.hypot(outerMap.bhX - outerMap.playerX, outerMap.bhY - outerMap.playerY);
  if (d < 20 && (keys['Space'] || keys['Enter'])) {
    keys['Space']=false; keys['Enter']=false;
    state.dungeonMode = 'blackheart';
    if (typeof sfx === 'function') sfx('boss');
    goTo('dungeon');
    return;
  }

  if (keys['Escape'] || keys['KeyR']) {
    keys['Escape']=false; keys['KeyR']=false;
    goTo('academy');
  }
}

function renderOuterMap() {
  // 배경
  ctx.fillStyle = '#0a0510'; ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();

  const camX = outerMap.camX, camY = outerMap.camY;

  // 지형 - 타일 그라디언트 (붉은 오염이 동쪽으로 갈수록 심해짐)
  for (let ty = 0; ty < OUTER_H; ty += 40) {
    for (let tx = 0; tx < OUTER_W; tx += 40) {
      const sx = tx - camX, sy = ty - camY;
      if (sx < -40 || sx > W || sy < -40 || sy > H) continue;
      const corrupt = tx / OUTER_W;  // 0 to 1
      const r = Math.floor(20 + corrupt * 60);
      const g = Math.floor(10 + Math.sin(tx * 0.01 + ty * 0.01) * 5);
      const b = Math.floor(30 - corrupt * 20);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(sx*PX, sy*PX, 40*PX, 40*PX);
    }
  }

  // 지평선 산 (배경, 전 세계)
  ctx.fillStyle = '#1a0510';
  for (let x = -camX % 24; x < W + 24; x += 24) {
    const wx = x + camX;
    const h = 15 + Math.sin(wx * 0.15) * 8 + Math.cos(wx * 0.4) * 5;
    ctx.fillRect(x*PX, (H - h - 10)*PX, 24*PX, (h + 10)*PX);
  }

  // 아카데미 실루엣 (서쪽, 세계 원점 근처)
  if (0 - camX < W && 0 - camX > -80) {
    const acadX = 10 - camX;
    const acadY = 200 - camY;
    const quake = Math.sin(state.time * 4) * 1.5;
    pxDraw(acadX + quake, acadY, 20, 40, '#1a0e2e');
    pxDraw(acadX + 3 + quake, acadY - 8, 12, 8, '#1a0e2e');
    if (acadY > -20 && acadY < H) drawText('아카데미', acadX - 4, acadY - 10, '#5a4a80');
  }

  // 랜드마크
  for (const lm of LANDMARKS) {
    const sx = lm.x - camX, sy = lm.y - camY;
    if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;
    const visited = outerMap.visited[lm.id];
    const glow = 0.4 + Math.sin(state.time * 2 + lm.x * 0.01) * 0.3;
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (glow * 0.15).toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(sx*PX, sy*PX, lm.r*PX, 0, Math.PI*2); ctx.fill();
    // 아이콘 (마름모)
    ctx.fillStyle = visited ? '#3a2e5c' : lm.color;
    ctx.beginPath();
    ctx.moveTo(sx*PX, (sy-6)*PX);
    ctx.lineTo((sx+6)*PX, sy*PX);
    ctx.lineTo(sx*PX, (sy+6)*PX);
    ctx.lineTo((sx-6)*PX, sy*PX);
    ctx.closePath(); ctx.fill();
    if (visited) drawText('✓', sx - 2, sy - 3, '#e8c547');
    // 이름 (근접 시)
    const d = Math.hypot(outerMap.playerX - lm.x, outerMap.playerY - lm.y);
    if (d < 50) drawText(lm.name, sx - textWidth(lm.name)/2, sy - lm.r - 6, '#ffefa8');
    if (d < lm.r) drawText('[SPACE]', sx - textWidth('[SPACE]')/2, sy + lm.r + 4, '#8bd8ff');
  }

  // 검은 심장 (동쪽 끝)
  const bhSx = outerMap.bhX - camX, bhSy = outerMap.bhY - camY;
  if (bhSx > -50 && bhSx < W + 50) {
    const bhPulse = 0.6 + Math.sin(state.time * 2) * 0.4;
    ctx.fillStyle = 'rgba(200, 22, 22, ' + bhPulse.toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(bhSx*PX, bhSy*PX, 28*PX, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(120, 0, 30, 0.9)';
    ctx.beginPath(); ctx.arc(bhSx*PX, bhSy*PX, 18*PX, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#050510';
    ctx.beginPath(); ctx.arc(bhSx*PX, bhSy*PX, 10*PX, 0, Math.PI*2); ctx.fill();
    drawText('검은 심장', bhSx - textWidth('검은 심장')/2, bhSy - 26, '#ff2d2d');
    const d = Math.hypot(outerMap.bhX - outerMap.playerX, outerMap.bhY - outerMap.playerY);
    if (d < 20) drawText('[SPACE] 최종전 진입', bhSx - textWidth('[SPACE] 최종전 진입')/2, bhSy + 30, '#ffefa8');
  }

  // 플레이어
  const psx = outerMap.playerX - camX, psy = outerMap.playerY - camY;
  const pa = (typeof activePlayerPal === 'function') ? activePlayerPal() : null;
  if (pa && typeof SPR_PLAYER_S1 !== 'undefined' && typeof drawSprite === 'function') {
    drawSprite(SPR_PLAYER_S1, pa, psx - 6, psy - 7);
  } else {
    pxDraw(psx - 4, psy - 4, 8, 8, '#ffefa8');
  }

  // 나침반 화살표
  const ax = psx + Math.cos(outerMap.arrowAng) * 20;
  const ay = psy + Math.sin(outerMap.arrowAng) * 20;
  const tx = psx + Math.cos(outerMap.arrowAng) * 26;
  const ty = psy + Math.sin(outerMap.arrowAng) * 26;
  ctx.strokeStyle = '#ff2d2d'; ctx.lineWidth = PX * 2;
  ctx.beginPath(); ctx.moveTo(ax*PX, ay*PX); ctx.lineTo(tx*PX, ty*PX); ctx.stroke();

  // HUD
  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('BROKEN LANDS   [' + Math.floor(outerMap.playerX) + ',' + Math.floor(outerMap.playerY) + ']', 4, 3, '#ff2d2d');
  drawText('[R/ESC] 아카데미', W - textWidth('[R/ESC] 아카데미') - 4, 3, '#8a7ab5');

  // 미니맵
  const mmW = 60, mmH = 45, mmX = W - mmW - 4, mmY = 15;
  pxDraw(mmX - 1, mmY - 1, mmW + 2, mmH + 2, '#000');
  pxDraw(mmX, mmY, mmW, mmH, '#1a0e2e');
  // 오염 그라디언트
  for (let mx = 0; mx < mmW; mx++) {
    ctx.fillStyle = 'rgba(200, 22, 22, ' + (mx / mmW * 0.3).toFixed(2) + ')';
    ctx.fillRect((mmX + mx)*PX, mmY*PX, PX, mmH*PX);
  }
  // 랜드마크 점
  for (const lm of LANDMARKS) {
    const dx = mmX + Math.floor((lm.x / OUTER_W) * mmW);
    const dy = mmY + Math.floor((lm.y / OUTER_H) * mmH);
    pxDraw(dx, dy, 1, 1, outerMap.visited[lm.id] ? '#3a2e5c' : lm.color);
  }
  // 검은 심장
  const bhMx = mmX + Math.floor((outerMap.bhX / OUTER_W) * mmW);
  const bhMy = mmY + Math.floor((outerMap.bhY / OUTER_H) * mmH);
  pxDraw(bhMx, bhMy, 2, 2, '#ff2d2d');
  // 플레이어
  const pMx = mmX + Math.floor((outerMap.playerX / OUTER_W) * mmW);
  const pMy = mmY + Math.floor((outerMap.playerY / OUTER_H) * mmH);
  pxDraw(pMx, pMy, 1, 1, '#ffefa8');

  // 방문 상태
  const visitCount = Object.keys(outerMap.visited).length;
  drawText('탐사: ' + visitCount + '/' + LANDMARKS.length, mmX, mmY + mmH + 2, '#c8b898');

  // 이벤트 큐 (좌하단 3개 스택)
  const queue = outerMap.eventQueue || [];
  const eBoxW = 180, eBoxH = 20;
  for (let i = 0; i < Math.min(3, queue.length); i++) {
    const ev = queue[queue.length - 1 - i];
    if (!ev) continue;
    const bx = 4, by = H - 44 - i * (eBoxH + 2);
    const fadeIn = ev.life > ev.max - 0.4 ? (ev.max - ev.life) / 0.4 : 1;
    const fadeOut = ev.life < 0.6 ? (ev.life / 0.6) : 1;
    ctx.globalAlpha = Math.min(1, Math.min(fadeIn, fadeOut));
    pxDraw(bx, by, eBoxW, eBoxH, '#1a0e2e');
    pxDraw(bx, by, eBoxW, 1, ev.col);
    pxDraw(bx, by + eBoxH - 1, eBoxW, 1, ev.col);
    drawText('◈ ' + ev.title, bx + 6, by + 3, ev.col);
    drawText(ev.result + '  (' + ev.life.toFixed(1) + 's)', bx + 6, by + 12, '#ffefa8');
    ctx.globalAlpha = 1;
  }

  // 폭풍 오버레이 (붉은 시야 감소)
  if (outerMap.storm && performance.now() < outerMap.storm) {
    ctx.fillStyle = 'rgba(200, 40, 40, 0.22)';
    ctx.fillRect(0, 12*PX, W*PX, (H - 12)*PX);
    // 붉은 먼지 파티클
    for (let i = 0; i < 5; i++) {
      const px = ((state.time * 40) + i * 100) % (W + 40) - 20;
      const py = 30 + (i * 30) % (H - 60);
      ctx.fillStyle = 'rgba(255, 80, 80, 0.20)';
      ctx.fillRect(px*PX, py*PX, 30*PX, 8*PX);
    }
    drawText('★ 붉은 폭풍 - 시야 감소 · HP 손실 ★', W/2 - textWidth('★ 붉은 폭풍 - 시야 감소 · HP 손실 ★')/2, 22, '#ffff00');
  }
  // 유성 낙하 경고
  if (outerMap.meteor && performance.now() < outerMap.meteor) {
    const t = state.time * 5;
    ctx.fillStyle = 'rgba(255, 120, 40, ' + (0.15 + Math.sin(t) * 0.10) + ')';
    ctx.fillRect(0, 12*PX, W*PX, 6*PX);
    drawText('☄ 유성 낙하 활성 ☄', W/2 - textWidth('☄ 유성 낙하 활성 ☄')/2, 14, '#ff9c3d');
  }
  // 밤 오버레이
  if (outerMap.dayNight && performance.now() < outerMap.dayNight) {
    ctx.fillStyle = 'rgba(10, 10, 30, 0.35)';
    ctx.fillRect(0, 12*PX, W*PX, (H - 12)*PX);
  } else if (outerMap.dayNight && performance.now() >= outerMap.dayNight) {
    outerMap.dayNight = 0;
  }

  // 방랑 몹 렌더 (월드 좌표. 카메라 오프셋 반영 필요)
  if (outerMap.mobs) {
    for (const m of outerMap.mobs) {
      const sx = m.x - outerMap.camX, sy = m.y - outerMap.camY;
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
      const col = m.kind === 'outer_giant' ? '#ff2d80' : '#c81616';
      ctx.globalAlpha = 0.6 + Math.sin(state.time * 4 + m.x) * 0.3;
      pxDraw(sx - m.r, sy - m.r, m.r * 2, m.r * 2, col);
      pxDraw(sx - 1, sy - 1, 2, 2, '#ffefa8');
      ctx.globalAlpha = 1;
      if (m.isElite) drawText('ELITE', sx - textWidth('ELITE')/2, sy - m.r - 8, '#ff2d80');
    }
  }

  // 하단 안내
  drawText('WASD 이동   SHIFT 달리기   SPACE 조사', W/2 - textWidth('WASD 이동   SHIFT 달리기   SPACE 조사')/2, H - 12, '#8a7ab5');

  // 메시지
  if (outerMap.msgT > 0) {
    const alpha = outerMap.msgT < 1 ? outerMap.msgT : 1;
    ctx.globalAlpha = alpha;
    const boxW = textWidth(outerMap.msg) + 16;
    pxDraw(W/2 - boxW/2, H - 30, boxW, 12, '#1a0e2e');
    drawText(outerMap.msg, W/2 - textWidth(outerMap.msg)/2, H - 26, '#ffefa8');
    ctx.globalAlpha = 1;
  }
}
