// =====================================================================
// Living Academy - 아카데미가 살아있는 학교처럼 느껴지도록.
// 5명의 새 NPC + 일일 아침 이벤트 + 상태 반응 대사.
// =====================================================================

// NPC 팔레트 (SPR_NPC 로 그림, 색상 오버라이드로 개성)
const _NPC_PAL_LIB = { '1':'#050510', '2':'#1a3a5c', '3':'#3b7fd6', '4':'#f5d3a3', '5':'#b88855', '6':'#8bd8ff', '7':'#0e2a5c', '8':'#050510', '9':'#ffffff' };
const _NPC_PAL_CLS = { '1':'#050510', '2':'#3a1a1a', '3':'#c86ade', '4':'#f5d3a3', '5':'#b88855', '6':'#c86ade', '7':'#3a0a0a', '8':'#050510', '9':'#ffffff' };
const _NPC_PAL_ARN = { '1':'#050510', '2':'#7a0a0a', '3':'#ff2d2d', '4':'#f5d3a3', '5':'#b88855', '6':'#ffefa8', '7':'#5a0a0a', '8':'#050510', '9':'#ffffff' };
const _NPC_PAL_LEG = { '1':'#050510', '2':'#3a2a10', '3':'#e8c547', '4':'#f5d3a3', '5':'#b88855', '6':'#ffefa8', '7':'#1a0e2e', '8':'#050510', '9':'#ffffff' };
const _NPC_PAL_STL = { '1':'#050510', '2':'#7a1a4a', '3':'#ff2d80', '4':'#f5d3a3', '5':'#b88855', '6':'#ff00ff', '7':'#5a1a3a', '8':'#050510', '9':'#ffffff' };

// 각 NPC 는 state 를 읽어 상황별 대사를 반환. 화자 이름은 UI 에서 붙임.
const ACADEMY_NPC_DEFS = [
  {
    key: 'renn', name: 'RENN', x: 60, y: 125, color: _NPC_PAL_LIB,
    hint: '도서관 학생',
    lines: (s) => {
      const frags = Object.keys(s.storyFragments || {}).length;
      if (s.academyTruthSeen)      return '넌 진실을 봤구나. 어떤 기분이야?';
      if (frags >= 10)             return '이야기 조각을 모으면서, 도서관이 나를 알아보기 시작했어.';
      if (frags >= 5)              return '이 도서관에는 아직 읽지 못한 책이 너무 많아.';
      if (frags >= 1)              return '너도 조각을 봤어? 나도 하나 찾았어.';
      return '이 학교의 진짜 역사는 도서관 깊숙히 있어. 아직 아무도 못 봤을 뿐.';
    },
    reward: (s) => {
      const frags = Object.keys(s.storyFragments || {}).length;
      if (frags >= 5 && !s._rennGift) { s._rennGift = true; state.research = (state.research||0) + 500; return '(RENN 이 낡은 책갈피를 건넨다: +500 RP)'; }
      return '';
    },
  },
  {
    key: 'vesk', name: 'VESK', x: 115, y: 125, color: _NPC_PAL_CLS,
    hint: '만년 낙제생',
    lines: (s) => {
      const gpa = s.gpa || 0;
      if (gpa >= 4.5)              return '너처럼 되고 싶어. 그런데 어떻게 하는거야?';
      if (gpa >= 3.0)              return '나는 이번에도 낙제야. 너는 어떻게 그렇게 잘 해?';
      if (gpa >= 1.5)              return '나도 3점만 되면 좋겠다.';
      return '나는 벌써 5번째 재수강이야. 교수님들은 나를 잊어버렸겠지.';
    },
    reward: (s) => {
      if ((s.gpa||0) >= 4.5 && !s._veskGift) { s._veskGift = true; state.gold = (state.gold||0) + 100; return '(VESK 가 존경의 눈으로: +100G)'; }
      return '';
    },
  },
  {
    key: 'lyra', name: 'LYRA', x: 245, y: 125, color: _NPC_PAL_ARN,
    hint: '아레나 챔피언',
    lines: (s) => {
      const wins = (typeof academy !== 'undefined' && academy) ? (academy.duelWins||0) : 0;
      const bestArena = (typeof academy !== 'undefined' && academy) ? (academy.bestArena||0) : 0;
      if (bestArena >= 30)         return '너를 처음 봤을 때 알아봤어. 우리는 다른 종족이야.';
      if (bestArena >= 15)         return '너 진짜 웨이브 몇까지 갔지? 아, 이미 물어봤나.';
      if (wins >= 5)               return '어제 밤 결투는 잘 봤어. 너는 진짜다.';
      if (bestArena >= 5)          return '가끔은 그냥 즐겨. 아레나 밖에도 세상이 있어.';
      return '언젠가 나랑도 한 판. 봐줄 필요 없어.';
    },
    reward: (s) => {
      const bestArena = (typeof academy !== 'undefined' && academy) ? (academy.bestArena||0) : 0;
      if (bestArena >= 30 && !s._lyraGift) { s._lyraGift = true; state.research = (state.research||0) + 3000; return '(LYRA 의 존경: +3000 RP)'; }
      return '';
    },
  },
  {
    key: 'thorne', name: 'THORNE', x: 155, y: 125, color: _NPC_PAL_LEG,
    hint: '냉소적 대학원생',
    lines: (s) => {
      const rp = s.research || 0;
      if (rp >= 1e10)              return '너 정도 되면 이제 이 학교가 필요없지. 왜 아직 남아 있어?';
      if (rp >= 1e8)               return '관록 시스템이 재밌지? 나는 그거 만든 사람이야. 아, 놀랐어?';
      if (rp >= 1e6)               return '연구 포인트는 결국 종잇조각이야. 하지만 종이가 없으면 아무것도 못 사.';
      return '연구는 배신하지 않아. 재능은 배신하지만.';
    },
    reward: (s) => {
      if ((s.research||0) >= 1e8 && !s._thorneGift) { s._thorneGift = true; state.research += 1e6; return '(THORNE 의 논문 사본: +1M RP)'; }
      return '';
    },
  },
  {
    key: 'mura', name: 'MURA', x: 200, y: 125, color: _NPC_PAL_STL,
    hint: '패션 디자이너',
    lines: (s) => {
      const owned = s.customize && s.customize.owned ? (
        Object.keys(s.customize.owned.robe||{}).length +
        Object.keys(s.customize.owned.hat||{}).length +
        Object.keys(s.customize.owned.trail||{}).length +
        Object.keys(s.customize.owned.star||{}).length
      ) : 0;
      if (owned >= 15)             return '네 스타일은 이제 하나의 브랜드야. 학교 밖에서도 알아볼걸.';
      if (owned >= 8)              return '너의 로브 색이 오늘 다르네. 눈이 즐거워.';
      if (owned >= 3)              return '외모도 마법의 일부야. 힘없어 보이는 마법사는 실제로 힘이 없어.';
      return '검은 로브만 입는 사람은 자기가 없는거야. 색을 골라봐.';
    },
    reward: (s) => {
      const owned = s.customize && s.customize.owned ? Object.keys(s.customize.owned.robe||{}).length : 0;
      if (owned >= 5 && !s._muraGift) { s._muraGift = true; if (state.customize && state.customize.owned) { state.customize.owned.trail = state.customize.owned.trail || {}; state.customize.owned.trail[3] = 1; } return '(MURA 의 선물: BLOOD TRAIL 잠금 해제!)'; }
      return '';
    },
  },
];

// 아카데미 진입 시 NPC 리스트에 병합. 기존 ELARA + MERCHANT 는 유지.
function ensureLivingAcademyNpcs() {
  if (typeof academy === 'undefined' || !academy) return;
  if (!Array.isArray(academy.npcs)) academy.npcs = [];
  const existing = new Set(academy.npcs.map(n => n.name));
  for (const def of ACADEMY_NPC_DEFS) {
    if (existing.has(def.name)) continue;
    academy.npcs.push({
      x: def.x, y: def.y, name: def.name, color: def.color,
      _livingKey: def.key, bond: 0, msgs: [],
      _livingHint: def.hint,
    });
  }
}

// 새 NPC 상호작용. 반환: true 면 처리됨 (기본 NPC 경로 스킵).
function livingNpcInteract(npc) {
  if (!npc || !npc._livingKey) return false;
  const def = ACADEMY_NPC_DEFS.find(d => d.key === npc._livingKey);
  if (!def) return false;
  const line = def.lines(state);
  const reward = def.reward(state);
  showMsg(def.name + ': ' + line + (reward ? '  ' + reward : ''), 5);
  npc.bond = (npc.bond || 0) + 1;
  if (typeof saveAccountData === 'function') saveAccountData();
  return true;
}

// =====================================================================
// Morning Event - 매일 (state.day 단위) 결정론적 랜덤 이벤트.
// 아카데미 첫 진입 시 상단에 이벤트 문구 + 관련 문 강조.
// =====================================================================
const MORNING_EVENTS = [
  { id:'ev_libnoise',  text:'아침에 도서관에서 이상한 소리가 들렸다.',           highlight:'libDoor',    color:'#8bd8ff' },
  { id:'ev_arena',     text:'아레나 관중석이 오늘따라 붐빈다.',                    highlight:'arenaDoor',  color:'#e8c547' },
  { id:'ev_merchant',  text:'상인이 오늘 특가라며 소리치고 있다.',                 highlight:null,         color:'#e8c547' },
  { id:'ev_prof',      text:'복도에서 격퇴된 교수의 초상화가 흔들린다.',            highlight:'profDoor',   color:'#00c8ff' },
  { id:'ev_fog',       text:'교정에 낮은 안개가 깔렸다. 오늘의 몹은 더 위험할지도.', highlight:null,         color:'#8a7ab5' },
  { id:'ev_lab',       text:'실험동에서 붉은 불빛이 새어나왔다.',                  highlight:'infernoDoor',color:'#ff2d2d' },
  { id:'ev_cipher',    text:'벽의 낙서가 밤새 늘어났다. 누군가가 수수께끼를 낸다.', highlight:'cipherDoor', color:'#ff6666' },
  { id:'ev_train',     text:'훈련장의 더미가 어제보다 커진 것 같다.',              highlight:'trainDoor',  color:'#3ac762' },
  { id:'ev_style',     text:'MURA 가 새 시즌 컬렉션을 자랑하고 있다.',             highlight:'customDoor', color:'#ff2d80' },
  { id:'ev_legacy',    text:'THORNE 이 새 연구 논문을 게시했다.',                  highlight:'legacyDoor', color:'#ffefa8' },
  { id:'ev_quiet',     text:'오늘 아카데미는 조용하다. 무언가 이상하다.',            highlight:null,         color:'#5a4a80' },
  { id:'ev_festival',  text:'축제일이다. 오늘 몹 처치 시 RP +50%.',                highlight:null,         color:'#ffefa8' },
  { id:'ev_saleday',   text:'상인이 50% 할인 세일! 오늘의 특가.',                    highlight:null,         color:'#e8c547' },
  { id:'ev_alumni',    text:'졸업생이 방문했다. NPC 유대 +50% 획득.',                 highlight:null,         color:'#3ac762' },
  { id:'ev_bloodmoon', text:'붉은 달이 뜬다. 몹이 더 강하지만 드롭 x2.',              highlight:null,         color:'#c81616' },
];

const morningEvent = {
  today: null,      // {id, text, highlight, color}
  seenDay: -1,      // state.day
};

function _seedRandForDay(day) {
  let h = day * 2654435761 | 0;
  h = (h ^ (h >>> 16)) | 0;
  h = Math.imul(h, 2246822519) | 0;
  h = (h ^ (h >>> 13)) | 0;
  return Math.abs(h) % MORNING_EVENTS.length;
}

// 아카데미 씬 진입/업데이트 시점에 호출. 하루가 넘어갔으면 새 이벤트 세팅.
function checkMorningEvent() {
  const day = state.day || 1;
  if (morningEvent.seenDay === day) return;
  morningEvent.seenDay = day;
  const idx = _seedRandForDay(day);
  morningEvent.today = MORNING_EVENTS[idx];
  if (morningEvent.today.apply) { try { morningEvent.today.apply(); } catch(_){} }
  // showMsg 는 티커와 중복되므로 생략 (상단 티커가 지속 표시).
}

// 문 강조 그리기 (renderAcademy 에서 호출)
function drawMorningEventHighlight() {
  if (!morningEvent.today || !morningEvent.today.highlight) return;
  const d = academy[morningEvent.today.highlight];
  if (!d || d.hidden) return;
  const glow = 0.5 + Math.sin(state.time * 5) * 0.4;
  ctx.strokeStyle = morningEvent.today.color;
  ctx.globalAlpha = glow;
  ctx.lineWidth = PX * 3;
  ctx.strokeRect((d.x - 6)*PX, (d.y - 6)*PX, (d.w + 12)*PX, (d.h + 12)*PX);
  ctx.globalAlpha = 1;
  // 별표 위
  drawText('★', d.x + 6 - textWidth('★')/2, d.y - 24, morningEvent.today.color);
}

// 아카데미 상단에 이벤트 뉴스 티커 그리기
function drawMorningEventTicker() {
  if (!morningEvent.today) return;
  const s = '☼ ' + morningEvent.today.text;
  const tw = textWidth(s);
  const bx = W/2 - tw/2 - 4;
  const ty = 25;
  pxDraw(bx, ty, tw + 8, 10, '#1a0e2e');
  pxDraw(bx, ty, tw + 8, 1, morningEvent.today.color);
  pxDraw(bx, ty + 9, tw + 8, 1, morningEvent.today.color);
  drawText(s, W/2 - tw/2, ty + 3, morningEvent.today.color);
}
