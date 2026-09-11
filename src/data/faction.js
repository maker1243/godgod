// =====================================================================
// Faction - 가문 (House) + 학파 (School) + 평판 (Reputation)
// state.faction = { house: 'noble'|'commoner'|... , school: 'elemental'|..., rep: {noble:0, ...} }
// 최초 접근 시 선택 강제. 이후 상태 확인/평판 조회 가능.
// =====================================================================

const HOUSES = [
  { id:'noble',    name:'명문가',        color:'#e8c547',
    desc:'대대로 마법을 이어온 귀족. 학원 안에서 유리, 뒷골목에는 문전박대.',
    perks:'시작 골드 +500, 상점가 -10%, 골드 획득 x1.15',
    apply:(p, s)=>{ if (!s._factionInit) { state.gold = (state.gold||0) + 500; s._factionInit = true; } p.shopDiscount = (p.shopDiscount||0) + 0.10; p.goldMult = (p.goldMult||1) * 1.15; p.blockedFactions = ['underground']; },
    startRep:{ noble: 30, commoner: -10, royal: 10, underground: -20 } },
  { id:'commoner', name:'평민',          color:'#8bd8ff',
    desc:'뒷골목에서 배운 마법. 학원 정치엔 서툴지만 암시장이 열려 있다.',
    perks:'RP 획득 x1.20, 암시장 접근, 학원 상점 -5% 페널티',
    apply:(p, s)=>{ p.rpMult = (p.rpMult||1) * 1.20; p.shopDiscount = (p.shopDiscount||0) - 0.05; p.hasUnderground = true; },
    startRep:{ noble: -10, commoner: 30, underground: 25 } },
  { id:'wanderer', name:'방랑자',        color:'#c86ade',
    desc:'집도 스승도 없는 자유인. 이벤트와 만남이 잦고, 발이 빠르다.',
    perks:'이동속도 +15%, 랜덤 이벤트 x2, 시작 HP -20',
    apply:(p, s)=>{ p.speed = (p.speed||100) * 1.15; if (p.maxHp) { p.maxHp -= 20; p.hp = Math.min(p.hp, p.maxHp); } p.eventChanceMult = 2; },
    startRep:{ wanderer: 40, underground: 15 } },
  { id:'royal',    name:'왕실 근위대',   color:'#ff2d80',
    desc:'왕실이 파견한 감시자. 육체 훈련은 완벽하지만 정통 마법 외의 것엔 서투르다.',
    perks:'최대 HP +50, 물리 방어 감소, 마법 데미지 -10%',
    apply:(p, s)=>{ if (p.maxHp) { p.maxHp += 50; p.hp += 50; } p.baseDmg = (p.baseDmg||10) * 0.9; p.dmgReduction = (p.dmgReduction||0) + 0.10; },
    startRep:{ royal: 40, noble: 10, underground: -30 } },
];
const HOUSE_BY_ID = Object.fromEntries(HOUSES.map(h => [h.id, h]));

const SCHOOLS = [
  { id:'elemental', name:'원소학파', color:'#ff9c3d',
    desc:'화염과 냉기의 정통 계열. 순수한 파괴력을 추구한다.',
    perks:'화염 데미지 +20%, 냉기 데미지 +20%',
    apply:(p)=>{ p.mods.fire = (p.mods.fire||1) * 1.2; p.mods.ice = (p.mods.ice||1) * 1.2; } },
  { id:'chrono',    name:'시공학파', color:'#8bd8ff',
    desc:'시간을 다루는 학문. 마법의 리듬을 지배한다.',
    perks:'스킬 CD -15%, MP 회복 +2/s',
    apply:(p)=>{ p.cdMult = (p.cdMult||1) * 0.85; p.mpRegenBonus = (p.mpRegenBonus||0) + 2; } },
  { id:'summon',    name:'소환학파', color:'#3ac762',
    desc:'다른 세계에서 부르는 자. 조력자를 곁에 둔다.',
    perks:'미니언 데미지 +50%, 발사체 수 +1',
    apply:(p)=>{ p.minionDmgMult = (p.minionDmgMult||1) * 1.5; p.projMult = (p.projMult||1) + 1; } },
  { id:'necro',     name:'흑마법학파', color:'#c86ade',
    desc:'금기의 학문. 강력하지만 오염된다.',
    perks:'허공 데미지 +40%, 신성 데미지 -30%, 저주 지속 +50%',
    apply:(p)=>{ p.voidDmgMult = 1.4; p.holyDmgMult = 0.7; p.curseDurMult = 1.5; } },
  { id:'holy',      name:'신성학파',  color:'#ffefa8',
    desc:'빛의 학문. 회복과 정화를 다룬다.',
    perks:'회복 +30%, 신성 데미지 +40%, 허공 데미지 -30%',
    apply:(p)=>{ p.healMult = (p.healMult||1) * 1.3; p.holyDmgMult = 1.4; p.voidDmgMult = 0.7; } },
];
const SCHOOL_BY_ID = Object.fromEntries(SCHOOLS.map(s => [s.id, s]));

// 평판 티어 - 표시용
function repTier(v) {
  if (v >= 100) return { name:'전설', color:'#ff00ff' };
  if (v >=  50) return { name:'존경', color:'#ffefa8' };
  if (v >=  20) return { name:'우호', color:'#3ac762' };
  if (v >=   0) return { name:'중립', color:'#c8b898' };
  if (v >= -20) return { name:'냉대', color:'#ff9c3d' };
  if (v >= -50) return { name:'적대', color:'#c81616' };
  return             { name:'말살 대상', color:'#ff2d80' };
}

function _factionEnsure() {
  if (!state.faction) state.faction = null;
}

function hasFaction() {
  _factionEnsure();
  return !!(state.faction && state.faction.house && state.faction.school);
}

function initFaction(houseId, schoolId) {
  const h = HOUSE_BY_ID[houseId];
  const s = SCHOOL_BY_ID[schoolId];
  if (!h || !s) return false;
  state.faction = {
    house: houseId,
    school: schoolId,
    rep: Object.assign({ noble:0, commoner:0, wanderer:0, royal:0, underground:0, academy:0 }, h.startRep || {}),
    createdAt: Date.now(),
    _factionInit: false,
  };
  if (typeof showAchievementBanner === 'function') showAchievementBanner('가문/학파 확정', h.name + ' / ' + s.name, h.color);
  if (typeof sfx === 'function') sfx('level');
  if (typeof saveAccountData === 'function') saveAccountData();
  return true;
}

function factionApplyBuffs(p) {
  _factionEnsure();
  if (!state.faction) return;
  const h = HOUSE_BY_ID[state.faction.house];
  const s = SCHOOL_BY_ID[state.faction.school];
  if (h && h.apply) try { h.apply(p, state.faction); } catch(_){}
  if (s && s.apply) try { s.apply(p); } catch(_){}
}

// 평판 증감. 특정 진영 rep +/- amount.
function repAdd(facId, amount) {
  _factionEnsure();
  if (!state.faction) return;
  const r = state.faction.rep;
  const prev = r[facId] || 0;
  const next = Math.max(-100, Math.min(200, prev + amount));
  r[facId] = next;
  if (Math.abs(next - prev) >= 1 && typeof showMsg === 'function') {
    const sign = amount > 0 ? '+' : '';
    showMsg('[평판] ' + facId + ': ' + sign + amount + ' (' + next + ')', 2);
  }
  if (typeof saveAccountData === 'function') saveAccountData();
}

function repGet(facId) {
  _factionEnsure();
  if (!state.faction) return 0;
  return state.faction.rep[facId] || 0;
}

function getFactionInfo() {
  _factionEnsure();
  if (!state.faction) return null;
  return {
    house: HOUSE_BY_ID[state.faction.house],
    school: SCHOOL_BY_ID[state.faction.school],
    rep: state.faction.rep,
  };
}
