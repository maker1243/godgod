// =====================================================================
// Run Events (던전 랜덤 이벤트 방) - exit 문 진입 시 20% 확률로 이벤트.
// 2~3 선택지 → 즉시 효과 적용 후 다음 방으로.
// =====================================================================

const RUN_EVENT_DEFS = [
  { id:'ev_altar',
    title:'잊힌 제단', color:'#c86ade',
    body:'낡은 제단에서 검은 연기가 피어오른다. 손을 대면 무언가가 반응할 것 같다.',
    choices:[
      { label:'제물을 바친다 (HP 50%)',    apply:()=>{ player.hp = Math.max(1, Math.floor(player.hp * 0.5)); const off = _pickRandomOwnedArtifactOrGrant(); return '제단이 밝게 빛났다. ' + off; } },
      { label:'무시하고 지나간다',         apply:()=>{ return '연기가 사라진다...'; } },
    ] },
  { id:'ev_shrine',
    title:'회복의 샘', color:'#3ac762',
    body:'맑은 물이 흐른다. 마시면 상처가 아물 것 같다.',
    choices:[
      { label:'물을 마신다',              apply:()=>{ player.hp = player.maxHp; player.mp = player.maxMp; return 'HP/MP 완전 회복!'; } },
      { label:'병에 담아 판다 (+300 RP)', apply:()=>{ state.research = (state.research||0) + 300; return '+300 RP'; } },
    ] },
  { id:'ev_merchant',
    title:'수수께끼의 상인', color:'#e8c547',
    body:'후드를 뒤집어쓴 상인이 상품을 펼쳐 놓았다. 값이 비싸지만 흥미롭다.',
    choices:[
      { label:'축복 구매 (1000 RP)',      apply:()=>{ if ((state.research||0) < 1000) return 'RP 부족'; state.research -= 1000; if (typeof openBlessingPick === 'function') { openBlessingPick(_returnToDungeon); return '축복을 고르시오...'; } return '축복 정의 없음'; } },
      { label:'포션 5개 구매 (500 RP)',    apply:()=>{ if ((state.research||0) < 500) return 'RP 부족'; state.research -= 500; academy.inventory.heal += 3; academy.inventory.mana += 2; if (typeof recomputeHotkeys === 'function') recomputeHotkeys(); return '+3 힐포션, +2 마나포션'; } },
      { label:'거절',                      apply:()=>{ return '상인이 사라진다...'; } },
    ] },
  { id:'ev_cursedbook',
    title:'저주받은 책', color:'#7d4dbf',
    body:'책이 저절로 펼쳐진다. 내용은 읽을 수 없지만 힘이 느껴진다.',
    choices:[
      { label:'책을 읽는다 (다음 보스 x2 HP, x3 보상)',
        apply:()=>{ player._nextBossBuff = true; return '다음 보스가 더 강해진다!'; } },
      { label:'책을 태운다 (+500 RP)',
        apply:()=>{ state.research = (state.research||0) + 500; return '+500 RP'; } },
    ] },
  { id:'ev_wanderer',
    title:'떠도는 교수', color:'#8bd8ff',
    body:'낯익은 얼굴의 교수가 지친 표정으로 앉아 있다. 무언가 이야기를 나누고 싶어 한다.',
    choices:[
      { label:'대화한다 (스토리 조각)',   apply:()=>{ if (typeof unlockStoryFragment === 'function') unlockStoryFragment('wanderer_evt'); return '이야기의 조각을 얻었다.'; } },
      { label:'금화를 준다 (-100G, +DMG +10%)', apply:()=>{ if ((state.gold||0) < 100) return '금 부족'; state.gold -= 100; player.baseDmg *= 1.1; return 'DMG +10% (이 런)'; } },
      { label:'지나친다',                  apply:()=>{ return '교수는 어둠 속으로 사라진다.'; } },
    ] },
  { id:'ev_gambler',
    title:'도박사의 주사위', color:'#ff00ff',
    body:'거대한 주사위가 놓여 있다. 굴려서 운을 시험할 수 있다.',
    choices:[
      { label:'굴린다',
        apply:()=>{ const r = Math.floor(Math.random()*6)+1;
          if (r <= 2) { player.baseDmg *= 0.9; return '주사위: ' + r + ' - DMG -10%'; }
          if (r <= 4) { state.research += 500; return '주사위: ' + r + ' - +500 RP'; }
          if (r === 5) { player.baseDmg *= 1.3; return '주사위: 5 - DMG +30%!'; }
          player.baseDmg *= 2; return '주사위: 6 - JACKPOT! DMG x2!!'; } },
      { label:'포기',                      apply:()=>{ return '유혹을 이겨냈다.'; } },
    ] },
  { id:'ev_forge',
    title:'고대 대장간', color:'#ff9c3d',
    body:'식지 않는 불꽃이 타오른다. 무기를 단련할 수 있을 것 같다.',
    choices:[
      { label:'단련 (LMB DMG +50%)',       apply:()=>{ player.mods.lmbDmg = (player.mods.lmbDmg||1) * 1.5; return 'LMB DMG +50%'; } },
      { label:'단련 (전 스킬 CD -20%)',    apply:()=>{ player.cdMult *= 0.8; return 'CD -20%'; } },
    ] },
  { id:'ev_shrine_fate',
    title:'운명의 신전', color:'#ffefa8',
    body:'신전 안에서 세 개의 빛이 흔들린다. 하나를 골라라.',
    choices:[
      { label:'빛(적) - HP +30%',          apply:()=>{ const add = Math.floor(player.maxHp*0.3); player.maxHp += add; player.hp += add; return 'MAX HP +30%'; } },
      { label:'빛(청) - MP +50%, MP REGEN', apply:()=>{ const add = Math.floor(player.maxMp*0.5); player.maxMp += add; player.mp += add; player.mpRegenBonus = (player.mpRegenBonus||0)+5; return 'MP +50%, REGEN +5'; } },
      { label:'빛(황) - RP DROP +50% (런)', apply:()=>{ player.rpMult = (player.rpMult||1) * 1.5; return 'RP DROP +50%'; } },
    ] },
  { id:'ev_arena',
    title:'투기장의 유령', color:'#ff2d2d',
    body:'유령 검투사가 도전을 청한다. 이기면 보상, 지면 대가.',
    choices:[
      { label:'수락 (즉시 20% HP, +1000 RP)', apply:()=>{ player.hp = Math.max(1, Math.floor(player.hp * 0.8)); state.research = (state.research||0) + 1000; return '유령을 물리쳤다! +1000 RP'; } },
      { label:'거절',                       apply:()=>{ return '유령이 조롱하며 사라진다.'; } },
    ] },
  { id:'ev_treasure',
    title:'보물 상자', color:'#e8c547',
    body:'화려한 상자. 함정이 있을 수도, 보물이 있을 수도.',
    choices:[
      { label:'연다',
        apply:()=>{ const r = Math.random();
          if (r < 0.3) { player.hp = Math.max(1, Math.floor(player.hp * 0.6)); return '함정! HP -40%'; }
          if (r < 0.8) { state.research += 800; state.gold += 50; return '보물! +800 RP, +50G'; }
          const add = Math.floor(player.maxHp*0.2); player.maxHp += add; player.hp += add; return '전설의 보물! MAX HP +20%'; } },
      { label:'그냥 지나간다',              apply:()=>{ return '아쉬움을 남긴다...'; } },
    ] },
  { id:'ev_witch',
    title:'변신의 마녀', color:'#c86ade',
    body:'주름진 마녀가 병을 흔들며 미소짓는다.',
    choices:[
      { label:'약을 마신다 (스탯 랜덤 재분배)',
        apply:()=>{ const total = (player.baseDmg||1) + (player.maxHp||100)/100 + (player.speed||60)/50;
          const w1 = Math.random(), w2 = Math.random(), w3 = Math.random(); const s = w1+w2+w3;
          player.baseDmg = total * (w1/s);
          const newHp = total * (w2/s) * 100; player.maxHp = Math.max(1, Math.floor(newHp)); player.hp = Math.min(player.hp, player.maxHp);
          player.speed = Math.max(20, total * (w3/s) * 50);
          return '스탯이 재분배되었다!'; } },
      { label:'거절',                       apply:()=>{ return '마녀의 웃음소리가 남는다.'; } },
    ] },
  { id:'ev_pact',
    title:'악마와의 계약', color:'#c81616',
    body:'뜨거운 손이 종이를 내민다. 서명할 것인가.',
    choices:[
      { label:'서명 (MAX HP -30%, DMG x2)',
        apply:()=>{ const cut = Math.floor(player.maxHp*0.3); player.maxHp -= cut; player.hp = Math.min(player.hp, player.maxHp); player.baseDmg *= 2; return '계약 완료.'; } },
      { label:'거절',                       apply:()=>{ return '악마가 사라진다.'; } },
    ] },
  { id:'ev_scholar',
    title:'현자의 도서관', color:'#8bd8ff',
    body:'무수한 책이 쌓여 있다. 하나를 읽을 시간이 있다.',
    choices:[
      { label:'전투술 서적 (CRIT +25%)',    apply:()=>{ player.crit = (player.crit||0) + 0.25; return 'CRIT +25%'; } },
      { label:'회복술 서적 (REGEN +4/s)',   apply:()=>{ player.hpRegen = (player.hpRegen||0) + 4; return 'REGEN +4/s'; } },
      { label:'금서 (사기 스킬, 잘못하면 HP -50%)',
        apply:()=>{ if (Math.random() < 0.5) { player.baseDmg *= 1.6; return '금서! DMG +60%'; } player.hp = Math.max(1, Math.floor(player.hp*0.5)); return '금서의 저주! HP -50%'; } },
    ] },
  { id:'ev_wisp',
    title:'길잡이 위습', color:'#8bd8ff',
    body:'푸른 불꽃이 앞장선다.',
    choices:[
      { label:'따라간다 (다음 방 축복)',    apply:()=>{ if (typeof openBlessingPick === 'function') { openBlessingPick(_returnToDungeon); return '축복의 방으로...'; } return '축복 정의 없음'; } },
      { label:'무시',                       apply:()=>{ return '위습이 사라진다.'; } },
    ] },
  { id:'ev_mirror',
    title:'거울의 방', color:'#ffefa8',
    body:'거대한 거울에 다른 자신이 비친다.',
    choices:[
      { label:'거울을 깬다 (THORNS +30)',   apply:()=>{ player.thorns = (player.thorns||0) + 30; return 'THORNS +30'; } },
      { label:'거울과 대화 (스토리)',        apply:()=>{ if (typeof unlockStoryFragment === 'function') unlockStoryFragment('mirror_evt'); return '자신의 진실을 엿본다.'; } },
    ] },
  { id:'ev_wounded',
    title:'다친 학생', color:'#3ac762',
    body:'교복이 찢어진 학생이 쓰러져 있다.',
    choices:[
      { label:'치료해준다 (-30 HP, +300 RP)', apply:()=>{ player.hp = Math.max(1, player.hp - 30); state.research = (state.research||0) + 300; return '학생이 감사인사와 함께 사라진다. +300 RP'; } },
      { label:'무시하고 지나간다',            apply:()=>{ return '뒤에서 흐느낌이 들린다...'; } },
    ] },
  { id:'ev_starmap',
    title:'별의 지도', color:'#ffefa8',
    body:'천장에 별자리가 실시간으로 움직인다.',
    choices:[
      { label:'별을 읽는다',
        apply:()=>{ const r = Math.floor(Math.random()*5);
          if (r === 0) { player.baseDmg *= 1.2; return '전사의 별 - DMG +20%'; }
          if (r === 1) { const add = Math.floor(player.maxHp*0.2); player.maxHp += add; player.hp += add; return '수호의 별 - HP +20%'; }
          if (r === 2) { player.speed *= 1.2; return '바람의 별 - 속도 +20%'; }
          if (r === 3) { player.crit = (player.crit||0) + 0.2; return '예리의 별 - CRIT +20%'; }
          player.cdMult *= 0.85; return '시간의 별 - CD -15%'; } },
    ] },
  { id:'ev_challenge',
    title:'수련의 시련', color:'#e8c547',
    body:'허공에 훈련용 표적이 나타난다. 짧은 시간 안에 부술 수 있을까.',
    choices:[
      { label:'수락 (성공 시 +2000 RP, +XP)', apply:()=>{ state.research = (state.research||0) + 2000; player.xp += Math.max(10, player.xpNext-1); return '표적 격파! +2000 RP + BIG XP'; } },
      { label:'포기',                          apply:()=>{ return '수련의 기회를 놓쳤다.'; } },
    ] },
  { id:'ev_offering',
    title:'봉헌', color:'#c86ade',
    body:'조용한 재단. RP를 바치면 보답이 있다는 소문.',
    choices:[
      { label:'500 RP 바친다',                 apply:()=>{ if ((state.research||0) < 500) return 'RP 부족'; state.research -= 500; player.baseDmg *= 1.15; return 'DMG +15%'; } },
      { label:'2000 RP 바친다',                apply:()=>{ if ((state.research||0) < 2000) return 'RP 부족'; state.research -= 2000; player.baseDmg *= 1.5; const add = Math.floor(player.maxHp*0.25); player.maxHp += add; player.hp += add; return 'DMG +50%, HP +25%'; } },
      { label:'봉헌하지 않는다',                apply:()=>{ return '침묵.'; } },
    ] },
  { id:'ev_phoenix',
    title:'불사조의 깃털', color:'#ff9c3d',
    body:'붉은 깃털 하나가 공중에 떠 있다.',
    choices:[
      { label:'집어든다 (부활 +1)',            apply:()=>{ player.reviveCharges = (player.reviveCharges||0) + 1; return '이번 런에서 1회 부활!'; } },
    ] },

  // 추가 이벤트 (5개)
  { id:'ev_timetrav',
    title:'시간 여행자', color:'#c86ade',
    body:'후드 쓴 인물이 회중시계를 흔들며 미소짓는다.',
    choices:[
      { label:'다음 층으로 스킵 (5000 RP)', apply:()=>{ if ((state.research||0) < 5000) return 'RP 부족'; state.research -= 5000; if (typeof nextFloor === 'function') { nextFloor(); return '한 층 스킵!'; } return '실패'; } },
      { label:'대화만 (스토리 조각)',       apply:()=>{ if (typeof unlockStoryFragment === 'function') unlockStoryFragment('timetraveler_evt'); return '시간의 조각을 얻었다.'; } },
      { label:'거절',                       apply:()=>{ return '그는 시간 속으로 사라진다.'; } },
    ] },
  { id:'ev_orb',
    title:'수정 구슬', color:'#ffefa8',
    body:'허공에 반짝이는 수정이 떠 있다. 소원을 빌 수 있을 것 같다.',
    choices:[
      { label:'힘 (DMG +25% 영구, 이번 런)',    apply:()=>{ player.baseDmg *= 1.25; return 'DMG +25%'; } },
      { label:'속도 (SPD +25% 영구, 이번 런)',  apply:()=>{ player.speed *= 1.25; return 'SPD +25%'; } },
      { label:'지혜 (MP MAX +50%, REGEN +5)',   apply:()=>{ const add = Math.floor(player.maxMp*0.5); player.maxMp += add; player.mp += add; player.mpRegenBonus = (player.mpRegenBonus||0)+5; return 'MP MAX +50%'; } },
    ] },
  { id:'ev_dice',
    title:'저주받은 주사위', color:'#c81616',
    body:'검은 주사위가 저절로 회전하고 있다. 던져볼 수 있을까.',
    choices:[
      { label:'2회 굴리기',
        apply:()=>{
          const r1 = Math.floor(Math.random()*6)+1;
          const r2 = Math.floor(Math.random()*6)+1;
          const sum = r1 + r2;
          if (sum <= 4) { player.hp = Math.max(1, Math.floor(player.hp * 0.5)); return '' + r1 + '+' + r2 + '=' + sum + ' - 저주! HP -50%'; }
          if (sum <= 8) { const amt = Math.floor(sum * 100); state.research = (state.research||0) + amt; return '' + r1 + '+' + r2 + '=' + sum + ' - +' + amt + ' RP'; }
          if (sum <= 11) { player.baseDmg *= 1.2; return '' + r1 + '+' + r2 + '=' + sum + ' - 축복! DMG +20%'; }
          state.research = (state.research||0) + 10000; return '★★ 12! 잭팟 +10000 RP ★★';
        } },
      { label:'거절',                       apply:()=>{ return '주사위가 사라진다.'; } },
    ] },
  { id:'ev_puzzle',
    title:'수수께끼', color:'#8bd8ff',
    body:'"오늘도 새 아침이지만 하나 부족한 것이 있다. 정답은?"',
    choices:[
      { label:'커피',                        apply:()=>{ state.research = (state.research||0) + 1500; return '정답! (사실 뭐든 맞음) +1500 RP'; } },
      { label:'잠',                          apply:()=>{ state.research = (state.research||0) + 1500; return '정답! (사실 뭐든 맞음) +1500 RP'; } },
      { label:'답 없음',                     apply:()=>{ state.research = (state.research||0) + 500; return '역시 답 없음. +500 RP'; } },
    ] },
  { id:'ev_shrine_dark',
    title:'어두운 사당', color:'#050510',
    body:'검은 얼굴의 상 앞에 촛불 3개. 무엇을 바치는가.',
    choices:[
      { label:'스킬 하나 (오히려 강화)',     apply:()=>{ const keys = Object.keys(state.ownedSkills||{}); if (!keys.length) return '가진 스킬 없음'; player.baseDmg *= 1.15; return '어둠이 힘을 준다. DMG +15%'; } },
      { label:'포션 3개 (레벨업)',           apply:()=>{ let cnt = 0; for (const k of POTION_ORDER) if (academy.inventory[k] >= 1) cnt++; if (cnt < 3) return '포션 3개 필요'; for (const k of POTION_ORDER) if (academy.inventory[k] >= 1) { academy.inventory[k]--; cnt--; if (cnt === 0) break; } player.xp = Math.max(player.xp, player.xpNext); return '즉시 레벨업 준비'; } },
      { label:'거절',                        apply:()=>{ return '어둠이 조용히 웃는다.'; } },
    ] },
];

function _pickRandomOwnedArtifactOrGrant() {
  const owned = state.artifacts ? Object.keys(state.artifacts.owned || {}) : [];
  if (owned.length && Math.random() < 0.5) {
    const id = owned[Math.floor(Math.random()*owned.length)];
    const a = (typeof ARTIFACT_BY_ID !== 'undefined') ? ARTIFACT_BY_ID[id] : null;
    if (a && typeof a.apply === 'function') { try { a.apply(player); return a.name + ' 효과 임시 발동!'; } catch(_){} }
  }
  state.research = (state.research||0) + 500;
  return '+500 RP';
}

// ---------- Scene ----------
const runEvent = {
  active: false,
  def: null,
  cursor: 0,
  message: '',
  messageT: 0,
};

function openRunEvent(defId) {
  const def = defId ? RUN_EVENT_DEFS.find(d => d.id === defId) : RUN_EVENT_DEFS[Math.floor(Math.random()*RUN_EVENT_DEFS.length)];
  if (!def) return;
  runEvent.def = def; runEvent.cursor = 0; runEvent.message = ''; runEvent.messageT = 0;
  runEvent.active = true;
  state.scene = 'runEvent';
}

function updateRunEvent(dt) {
  if (runEvent.messageT > 0) runEvent.messageT -= dt;
  const def = runEvent.def; if (!def) { _returnToDungeon(); return; }
  const n = def.choices.length;

  if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false;  runEvent.cursor = (runEvent.cursor - 1 + n) % n; sfx('hit'); }
  if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false;runEvent.cursor = (runEvent.cursor + 1) % n; sfx('hit'); }
  for (let i = 0; i < n; i++) if (keys['Digit' + (i+1)]) { keys['Digit'+(i+1)]=false; runEvent.cursor = i; _confirmEvent(); }
  if (keys['Space'] || keys['Enter']) { keys['Space']=false; keys['Enter']=false; _confirmEvent(); }
  if (keys['Escape']) { keys['Escape']=false; _returnToDungeon(); }
  if (mouse.down && Array.isArray(window._eventRects)) {
    for (const r of window._eventRects) {
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        mouse.down = false; runEvent.cursor = r.idx; _confirmEvent(); return;
      }
    }
  }
}

function _confirmEvent() {
  const def = runEvent.def; if (!def) return;
  const ch = def.choices[runEvent.cursor]; if (!ch) return;
  const msg = (typeof ch.apply === 'function') ? (ch.apply() || '완료') : '완료';
  runEvent.message = msg; runEvent.messageT = 1.5;
  sfx('level');
  // 축복 픽커가 이 흐름 안에서 자동 열리면 그쪽이 _returnToDungeon 을 콜백으로 씀
  if (state.scene === 'runEvent') {
    setTimeout(_returnToDungeon, 1000);
  }
}

function _returnToDungeon() {
  runEvent.active = false;
  runEvent.def = null;
  state.scene = 'dungeon';
}

function renderRunEvent() {
  ctx.fillStyle = '#050310'; ctx.fillRect(0, 0, W*PX, H*PX);
  if (typeof bgStars === 'function') bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)'; ctx.fillRect(0, 0, W*PX, H*PX);

  const def = runEvent.def; if (!def) return;
  // 제목
  drawText(def.title, W/2 - textWidth(def.title, 2)/2, 20, def.color, 2);
  // 본문
  const words = def.body.split(' ');
  let line = '', ry = 50, maxW = 280;
  for (const w of words) {
    const tr = line ? line + ' ' + w : w;
    if (textWidth(tr) > maxW) { drawText(line, W/2 - textWidth(line)/2, ry, '#e8d9b0'); ry += 10; line = w; }
    else line = tr;
  }
  if (line) drawText(line, W/2 - textWidth(line)/2, ry, '#e8d9b0');

  // 선택지
  window._eventRects = [];
  const startY = ry + 20;
  const rowH = 14;
  for (let i = 0; i < def.choices.length; i++) {
    const c = def.choices[i];
    const y = startY + i * rowH;
    const isSel = runEvent.cursor === i;
    const bw = 260, bx = W/2 - bw/2;
    if (isSel) pxDraw(bx, y - 2, bw, rowH, '#2a1548');
    pxDraw(bx, y - 2, bw, 1, isSel ? def.color : '#3a1e5c');
    pxDraw(bx, y + rowH - 3, bw, 1, isSel ? def.color : '#3a1e5c');
    const label = '[' + (i+1) + '] ' + c.label;
    drawText(label, bx + 6, y, isSel ? '#ffefa8' : '#c8b898');
    window._eventRects.push({ idx: i, x: bx, y: y - 2, w: bw, h: rowH });
  }

  // 결과 메시지
  if (runEvent.messageT > 0) {
    ctx.globalAlpha = Math.min(1, runEvent.messageT / 0.5);
    const s = runEvent.message;
    drawText(s, W/2 - textWidth(s)/2, H - 30, '#ffefa8');
    ctx.globalAlpha = 1;
  }
  drawText('WS/1-3 SELECT   SPACE 확정   ESC 나가기', 4, H - 10, '#5a4a80');
}
