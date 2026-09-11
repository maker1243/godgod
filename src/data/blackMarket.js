// =====================================================================
// Black Market & Workshop - 3-in-1 hub scene.
//   INFO   : 기밀 정보 브로커 - 하루 재고 4-5개 회전. G 소비 + rep 변동.
//   REPAIR : 장비 내구도 확인/수리. 장비: staff, robe. 던전마다 마모.
//   TOOLS  : 마도구 제작. 영구 스탯 상승 아이템. 각 5개까지 스택.
//
// 접근 조건: 뒷골목 rep >= 10 또는 가문=commoner 또는 방문한 적 있음.
// =====================================================================

// -------------------------- INFO 아이템 정의 --------------------------
const INFO_ITEMS = [
  { id:'exam_ans',   name:'시험 답안 사본',       col:'#e8c547',
    desc:'+0.3 GPA 즉시', price:200,
    buy:()=>{ state.gpa = (state.gpa||0) + 0.3; if (typeof repAdd==='function') { repAdd('underground', 3); repAdd('academy', -2); } } },
  { id:'prof_weak',  name:'교수 약점 자료',       col:'#c81616',
    desc:'다음 던전 보스 HP -20% (1회)', price:500,
    buy:()=>{ state.buffs = state.buffs || {}; state.buffs.bossHpDown = 1; if (typeof repAdd==='function') { repAdd('underground', 4); repAdd('academy', -3); } } },
  { id:'rival_spec', name:'라이벌 학생 스펙표',   col:'#8bd8ff',
    desc:'다음 결투에서 시작 +30% DMG', price:400,
    buy:()=>{ state.buffs = state.buffs || {}; state.buffs.duelBonus = 0.3; if (typeof repAdd==='function') repAdd('underground', 3); } },
  { id:'council_doc',name:'학생회 내부 문서',     col:'#c86ade',
    desc:'뒷골목 +8, 학원 -5', price:300,
    buy:()=>{ if (typeof repAdd==='function') { repAdd('underground', 8); repAdd('academy', -5); } } },
  { id:'seal_frag',  name:'봉인 조각 정보',       col:'#ff2d80',
    desc:'허공 데미지 +25% (영구)', price:1000,
    buy:()=>{ state.marketVoidBonus = (state.marketVoidBonus||1) + 0.25; if (typeof repAdd==='function') repAdd('underground', 6); } },
  { id:'contraband', name:'금서 사본',             col:'#ff9c3d',
    desc:'스토리 조각 + 아티팩트 슬롯 +1 확률', price:800,
    buy:()=>{ if (typeof unlockStoryFragment==='function') unlockStoryFragment('wanderer_evt'); state.gold = (state.gold||0) + 100; } },
  { id:'noble_ledger',name:'명문가 장부',         col:'#e8c547',
    desc:'명문가 -10, 골드 +500', price:250,
    buy:()=>{ state.gold = (state.gold||0) + 500; if (typeof repAdd==='function') { repAdd('noble', -10); repAdd('underground', 4); } } },
  { id:'chrono_map', name:'크로노 코어 지도',     col:'#5affff',
    desc:'추가 시련 슬롯 열기 + 방랑자 +5', price:600,
    buy:()=>{ state.trialBanUntil = 0; if (typeof repAdd==='function') repAdd('wanderer', 5); } },
];
const INFO_BY_ID = Object.fromEntries(INFO_ITEMS.map(i => [i.id, i]));

// 오늘의 재고 - 날짜 시드 기반 4개 회전
function todaysInfoStock() {
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const arr = [];
  const pool = INFO_ITEMS.slice();
  let s = seed;
  for (let i = 0; i < 4 && pool.length; i++) {
    s = (s * 9301 + 49297) % 233280;
    const idx = s % pool.length;
    arr.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return arr;
}

// -------------------------- 장비 내구도 -------------------------------
const EQUIPMENT_DEFS = {
  staff: { name:'지팡이',  maxDur:100, dmgPct:0.30, dmgPen:0.20,
    desc:'마법 데미지의 30%를 담당. 파손 시 -20% DMG.' },
  robe:  { name:'로브',    maxDur:100, dmgPct:0.20, dmgPen:0.15,
    desc:'HP 방어의 20%를 담당. 파손 시 받는 데미지 +15%.' },
};

function _equipEnsure() {
  if (!state.equipment) state.equipment = { staff:{dur:100, level:0}, robe:{dur:100, level:0} };
  for (const k of Object.keys(EQUIPMENT_DEFS)) {
    if (!state.equipment[k]) state.equipment[k] = { dur: EQUIPMENT_DEFS[k].maxDur, level:0 };
    if (typeof state.equipment[k].dur !== 'number') state.equipment[k].dur = EQUIPMENT_DEFS[k].maxDur;
    if (typeof state.equipment[k].level !== 'number') state.equipment[k].level = 0;
  }
}

// 던전 종료 시 마모 (5~15).
function wearEquipmentAfterRun() {
  _equipEnsure();
  for (const k of Object.keys(EQUIPMENT_DEFS)) {
    const wear = 5 + Math.floor(Math.random() * 11);
    state.equipment[k].dur = Math.max(0, state.equipment[k].dur - wear);
  }
}

// 수리 (골드) - 100 골드당 20 두르 회복.
function repairEquipment(kind, spendGold) {
  _equipEnsure();
  const eq = state.equipment[kind];
  if (!eq) return false;
  const def = EQUIPMENT_DEFS[kind];
  const needed = def.maxDur - eq.dur;
  if (needed <= 0) { showMsg('이미 완벽함', 2); return false; }
  const cost = Math.min(spendGold, needed * 5);   // 100gold per 20dur
  if ((state.gold||0) < cost) { showMsg('골드 부족', 2); return false; }
  state.gold -= cost;
  eq.dur = Math.min(def.maxDur, eq.dur + Math.floor(cost / 5));
  if (typeof saveAccountData==='function') saveAccountData();
  return true;
}

// 완전 수리 (모든 장비, 총합 골드).
function fullRepair() {
  _equipEnsure();
  let totalCost = 0;
  for (const k of Object.keys(EQUIPMENT_DEFS)) {
    totalCost += (EQUIPMENT_DEFS[k].maxDur - state.equipment[k].dur) * 5;
  }
  if (totalCost === 0) { showMsg('수리할 곳 없음', 2); return; }
  if ((state.gold||0) < totalCost) { showMsg('골드 ' + totalCost + '필요', 3); return; }
  state.gold -= totalCost;
  for (const k of Object.keys(EQUIPMENT_DEFS)) state.equipment[k].dur = EQUIPMENT_DEFS[k].maxDur;
  showMsg('모든 장비 완전 수리 (-' + totalCost + 'G)', 3);
  if (typeof saveAccountData==='function') saveAccountData();
}

// 강화 (연금술): 1레벨당 500 RP. 최대 lv 10. lv 하나당 +5% 성능 + +20 maxDur.
function upgradeEquipment(kind) {
  _equipEnsure();
  const eq = state.equipment[kind];
  if (!eq) return;
  if (eq.level >= 10) { showMsg('최대 강화', 2); return; }
  const cost = 500 * (eq.level + 1);
  if ((state.research||0) < cost) { showMsg('RP ' + cost + ' 필요', 3); return; }
  state.research -= cost;
  eq.level += 1;
  showMsg(EQUIPMENT_DEFS[kind].name + ' +' + eq.level + ' 강화! (-' + cost + ' RP)', 3);
  if (typeof sfx==='function') sfx('level');
  if (typeof saveAccountData==='function') saveAccountData();
}

// 장비 페널티/보너스를 플레이어에 적용
function applyEquipmentToPlayer(p) {
  _equipEnsure();
  const st = state.equipment.staff;
  const rb = state.equipment.robe;
  const sDef = EQUIPMENT_DEFS.staff, rDef = EQUIPMENT_DEFS.robe;
  // 강화 보너스
  if (typeof p.baseDmg === 'number') p.baseDmg *= (1 + st.level * 0.05);
  if (typeof p.maxHp === 'number') { p.maxHp += rb.level * 20; p.hp += rb.level * 20; }
  // 파손 페널티
  if (st.dur <= 0 && typeof p.baseDmg === 'number') p.baseDmg *= (1 - sDef.dmgPen);
  if (rb.dur <= 0) p.dmgTakenMult = (p.dmgTakenMult || 1) * (1 + rDef.dmgPen);
}

// -------------------------- 마도구 제작 -------------------------------
const MAGIC_TOOLS = [
  { id:'mana_circ',  name:'마력 순환기',   desc:'최대 MP +20 per stack', maxStack:5,
    gold:500, rp:500, apply:(p, cnt)=>{ if (p.maxMp) { p.maxMp += 20 * cnt; p.mp += 20 * cnt; } } },
  { id:'staff_tip',  name:'강화 지팡이 촉', desc:'DMG +10% per stack',   maxStack:5,
    gold:1000, rp:1000, apply:(p, cnt)=>{ p.baseDmg *= (1 + 0.10 * cnt); } },
  { id:'robe_line',  name:'보호 로브 안감', desc:'최대 HP +50 per stack', maxStack:5,
    gold:800, rp:800, apply:(p, cnt)=>{ if (p.maxHp) { p.maxHp += 50 * cnt; p.hp += 50 * cnt; } } },
  { id:'crit_lens',  name:'크리티컬 렌즈', desc:'+5% 크리티컬 per stack', maxStack:5,
    gold:1500, rp:1500, apply:(p, cnt)=>{ p.crit = (p.crit || 0) + 0.05 * cnt; } },
  { id:'vamp_amulet',name:'흡혈 부적',    desc:'+2% 라이프스틸 per stack', maxStack:5,
    gold:2000, rp:2000, apply:(p, cnt)=>{ p.lifestealPct = (p.lifestealPct || 0) + 0.02 * cnt; } },
  { id:'shard_focus',name:'파편 집속기',  desc:'CD -5% per stack',        maxStack:5,
    gold:1200, rp:1200, apply:(p, cnt)=>{ p.cdMult = (p.cdMult || 1) * Math.pow(0.95, cnt); } },
  { id:'aegis',      name:'수호 각인',    desc:'받는 데미지 -3% per stack',maxStack:5,
    gold:1500, rp:1500, apply:(p, cnt)=>{ p.dmgReduction = (p.dmgReduction || 0) + 0.03 * cnt; } },
  { id:'phase_ring', name:'상변환 반지',  desc:'회피 +2% per stack',      maxStack:5,
    gold:2200, rp:2200, apply:(p, cnt)=>{ p.dodge = (p.dodge || 0) + 0.02 * cnt; } },
];
const TOOL_BY_ID = Object.fromEntries(MAGIC_TOOLS.map(t => [t.id, t]));

function _toolEnsure() {
  if (!state.magicTools) state.magicTools = {};
}

function craftMagicTool(id) {
  _toolEnsure();
  const t = TOOL_BY_ID[id];
  if (!t) return false;
  const cur = state.magicTools[id] || 0;
  if (cur >= t.maxStack) { showMsg('최대 스택', 2); return false; }
  if ((state.gold||0) < t.gold || (state.research||0) < t.rp) { showMsg('자원 부족: -' + t.gold + 'G, -' + t.rp + 'RP', 3); return false; }
  state.gold -= t.gold;
  state.research -= t.rp;
  state.magicTools[id] = cur + 1;
  showAchievementBanner('마도구 제작', t.name + ' +' + state.magicTools[id], '#c86ade');
  if (typeof sfx==='function') sfx('jackpot');
  if (typeof saveAccountData==='function') saveAccountData();
  return true;
}

function applyMagicToolsToPlayer(p) {
  _toolEnsure();
  for (const t of MAGIC_TOOLS) {
    const cnt = state.magicTools[t.id] || 0;
    if (cnt > 0 && typeof t.apply === 'function') try { t.apply(p, cnt); } catch(_){}
  }
}
