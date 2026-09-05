// =====================================================================
// Faculty Reward Skills - 계열 시련 통과 후 로비에서 SPACE 로 열람 가능한
// 사기(broken) 스킬 4개 세트. 각 계열마다 LMB / Q / E / PASSIVE 하나씩.
// 매우 비싸지만 압도적 성능. 구매 시 state.ownedSkills 에 등록되어 도서관
// / 아레나 / 던전 어디서든 슬롯 장착 가능.
// =====================================================================

// 계열 → { lmb, q, e, passive } 스킬 4개.
// id 는 fr_ 접두어로 통일. 카테고리는 원래 SKILL_TREE 색을 최대한 재사용하되
// 도서관 뷰에서 눈에 띄게 하려고 tier=11, isMax=true, isFaculty=true 로 표기.

function _frMk(id, name, slot, cost, castFn, effectFn, opts) {
  opts = opts || {};
  return {
    id, name, slot, tier: 11, pos: opts.pos || [0,0], cost,
    req: [],
    maxLv: opts.maxLv || 1,
    cd: typeof opts.cd === 'function' ? opts.cd : (lv => opts.cd == null ? 3 : opts.cd),
    mp: typeof opts.mp === 'function' ? opts.mp : (lv => opts.mp == null ? 20 : opts.mp),
    desc: opts.desc || '',
    cast: castFn || undefined,
    effect: effectFn || undefined,
    isMax: true, isFaculty: true, isBroken: true,
    faculty: opts.faculty || null,
    visual: opts.visual || null,
  };
}

// 각 계열의 4개 스킬 세트. 스킬 이름과 desc 는 학과 테마에 맞게 지어놓음.
// 데미지/스탯은 사기급 (기본 스킬의 100배 이상).
const FACULTY_REWARD_SKILLS = {
  humanities: {
    lmb: _frMk('fr_hum_lmb', '문학의 정수', 'lmb', 8000,
      shot('fire', {dmg:l=>150000, speed:400, r:3, life:1.2, count:6, spread:0.4, pierce:true}), null,
      {cd:0.2, mp:5, desc:'한글 자소 6발 관통. 사기.', visual:'dept_hangeul', faculty:'humanities'}),
    q: _frMk('fr_hum_q', '언어의 시가', 'q', 15000,
      shot('ice', {dmg:l=>2500000, speed:280, r:5, life:2.5, count:4, spread:0.3, freeze:5, pierce:true}), null,
      {cd:1.6, mp:35, desc:'구절 4발 파도. 5초 얼음.', visual:'dept_ink', faculty:'humanities'}),
    e: _frMk('fr_hum_e', '언어의 창조', 'e', 30000,
      shot('fire', {dmg:l=>50000000, speed:200, r:8, life:3, count:24, spread:6.28, explosive:true, explodeR:100, homing:true}), null,
      {cd:10, mp:120, desc:'24방향 언어 창조. 5천만.', visual:'dept_hangeul', faculty:'humanities'}),
    passive: _frMk('fr_hum_passive', '고전 통찰', 'passive', 20000, null,
      (p,lv)=>{ p.baseDmg *= 8; p.cdMult = (p.cdMult||1) * 0.3; },
      {desc:'DMG x8, CD -70%.', faculty:'humanities'}),
  },
  social: {
    lmb: _frMk('fr_soc_lmb', '자본의 화살', 'lmb', 8000,
      shot('fire', {dmg:l=>180000, speed:500, r:2, life:1.0, count:8, spread:0.3, instant:true, pierce:true}), null,
      {cd:0.25, mp:6, desc:'8방향 자본 화살. 관통 즉시.', visual:'dept_chart', faculty:'social'}),
    q: _frMk('fr_soc_q', '심층 분석', 'q', 15000,
      shot('ice', {dmg:l=>3000000, speed:350, r:4, life:2, count:5, spread:0.25, freeze:3}), null,
      {cd:1.4, mp:30, desc:'뇌파 5발 얼음.', visual:'dept_brain', faculty:'social'}),
    e: _frMk('fr_soc_e', '사회의 붕괴', 'e', 30000,
      shot('fire', {dmg:l=>60000000, speed:250, r:10, life:3, count:32, spread:6.28, homing:true, explosive:true, explodeR:80}), null,
      {cd:12, mp:130, desc:'전 사회 붕괴 32방향.', visual:'dept_chart', faculty:'social'}),
    passive: _frMk('fr_soc_passive', '자본 축적', 'passive', 20000, null,
      (p,lv)=>{ p.maxHp += 8000; p.hp += 8000; p.baseDmg *= 6; p.lifesteal = (p.lifesteal||0) + 40; },
      {desc:'HP+8k, DMGx6, LS+40.', faculty:'social'}),
  },
  natural: {
    lmb: _frMk('fr_nat_lmb', '전자 사출', 'lmb', 8000,
      shot('fire', {dmg:l=>200000, speed:700, r:2, life:0.9, count:4, spread:0.1, instant:true, pierce:true}), null,
      {cd:0.2, mp:5, desc:'원자 4발 즉시 관통.', visual:'dept_atom', faculty:'natural'}),
    q: _frMk('fr_nat_q', '화학 반응', 'q', 15000,
      shot('ice', {dmg:l=>3500000, speed:300, r:5, life:2.5, count:6, spread:0.35, explosive:true, explodeR:50}), null,
      {cd:1.5, mp:32, desc:'벤젠 6개 폭발.', visual:'dept_benzene', faculty:'natural'}),
    e: _frMk('fr_nat_e', '핵융합', 'e', 30000,
      shot('fire', {dmg:l=>80000000, speed:200, r:12, life:3.5, count:20, spread:6.28, explosive:true, explodeR:120, pierce:true}), null,
      {cd:12, mp:140, desc:'핵융합 20방향.', visual:'dept_atom', faculty:'natural'}),
    passive: _frMk('fr_nat_passive', '자연 법칙', 'passive', 20000, null,
      (p,lv)=>{ p.baseDmg *= 10; p.mods.fire = (p.mods.fire||1) * 2; p.mods.ice = (p.mods.ice||1) * 2; },
      {desc:'DMG x10, 원소 x2.', faculty:'natural'}),
  },
  engineering: {
    lmb: _frMk('fr_eng_lmb', '연쇄 코드', 'lmb', 8000,
      shot('fire', {dmg:l=>170000, speed:900, r:2, life:0.7, count:5, spread:0.2, instant:true, pierce:true}), null,
      {cd:0.15, mp:5, desc:'0/1 스트림 5발 즉시.', visual:'dept_binary', faculty:'engineering'}),
    q: _frMk('fr_eng_q', '레일건 프로토', 'q', 15000,
      shot('fire', {dmg:l=>4000000, speed:1000, r:3, life:1.5, pierce:true, instant:true, count:3, spread:0.05}), null,
      {cd:1.4, mp:32, desc:'프로토 레일건 3연발.', visual:'dept_gear', faculty:'engineering'}),
    e: _frMk('fr_eng_e', '기계혁명', 'e', 30000,
      shot('fire', {dmg:l=>100000000, speed:300, r:10, life:3, count:36, spread:6.28, pierce:true, explosive:true, explodeR:80}), null,
      {cd:11, mp:150, desc:'기계 혁명 36방향.', visual:'dept_gear', faculty:'engineering'}),
    passive: _frMk('fr_eng_passive', '알고리즘 최적화', 'passive', 20000, null,
      (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.15; p.mods.lmbCd = (p.mods.lmbCd||1) * 0.15; p.baseDmg *= 5; },
      {desc:'CD -85%, LMB CD -85%, DMG x5.', faculty:'engineering'}),
  },
  medicine: {
    lmb: _frMk('fr_med_lmb', '수술칼', 'lmb', 8000,
      shot('fire', {dmg:l=>220000, speed:600, r:3, life:1.0, count:5, spread:0.15, pierce:true}), null,
      {cd:0.2, mp:5, desc:'십자 수술칼 5발.', visual:'dept_medcross', faculty:'medicine'}),
    q: _frMk('fr_med_q', '치명 처방', 'q', 15000,
      shot('fire', {dmg:l=>3000000, speed:400, r:4, life:2, count:4, spread:0.2, homing:true, explosive:true, explodeR:40}), null,
      {cd:1.5, mp:32, desc:'약병 4발 유도 폭발.', visual:'dept_pill', faculty:'medicine'}),
    e: _frMk('fr_med_e', '히포크라테스 심판', 'e', 30000, null, null,
      {cd:12, mp:150, desc:'전 몹 대량 DMG + 풀 힐.',
       cast:(p,ang,lv)=>{ const D = 80000000 * p.baseDmg; for (const e of entities.enemies) { e.hp -= D; e.hitFlash = 0.3; spawnFloat(e.x, e.y-6, Math.ceil(D), '#ffefa8'); } p.hp = p.maxHp; state.shake = 20; sfx('level'); },
       faculty:'medicine'}),
    passive: _frMk('fr_med_passive', '의료 기적', 'passive', 20000, null,
      (p,lv)=>{ p.maxHp += 15000; p.hp += 15000; p.hpRegen = (p.hpRegen||0) + 300; p.perks.push('divinity'); p.divinityReady = true; p.perks.push('rebirth'); p.rebirthReady = true; },
      {desc:'+15k HP, +300 REGEN, 이중 부활.', faculty:'medicine'}),
  },
  education: {
    lmb: _frMk('fr_edu_lmb', '무한 방정식', 'lmb', 8000,
      shot('fire', {dmg:l=>180000, speed:500, r:3, life:1.2, count:6, spread:0.3, bounces:5}), null,
      {cd:0.2, mp:5, desc:'∞ 6발 반사.', visual:'dept_infinity', faculty:'education'}),
    q: _frMk('fr_edu_q', '체력 훈련', 'q', 15000,
      shot('fire', {dmg:l=>2800000, speed:350, r:5, life:2, count:5, spread:0.35, homing:true, knockback:20}), null,
      {cd:1.5, mp:32, desc:'공 5발 유도 넉백.', visual:'dept_ball', faculty:'education'}),
    e: _frMk('fr_edu_e', '스승의 격노', 'e', 30000,
      shot('fire', {dmg:l=>70000000, speed:250, r:10, life:3, count:28, spread:6.28, explosive:true, explodeR:80, homing:true}), null,
      {cd:11, mp:135, desc:'∞ 28방향 격노.', visual:'dept_infinity', faculty:'education'}),
    passive: _frMk('fr_edu_passive', '통찰 훈련', 'passive', 20000, null,
      (p,lv)=>{ p.crit = (p.crit||0) + 2; p.critMult = (p.critMult||2) * 3; p.baseDmg *= 5; },
      {desc:'CRIT+200%, x3 MULT, DMGx5.', faculty:'education'}),
  },
  arts: {
    lmb: _frMk('fr_art_lmb', '캔버스 스플래시', 'lmb', 8000,
      shot('fire', {dmg:l=>190000, speed:400, r:3, life:1.4, count:10, spread:0.6, bounces:2}), null,
      {cd:0.25, mp:6, desc:'랜덤 색 10발.', visual:'dept_paint', faculty:'arts'}),
    q: _frMk('fr_art_q', '오페라 아리아', 'q', 15000,
      shot('fire', {dmg:l=>3200000, speed:350, r:4, life:2.5, count:5, spread:0.3, homing:true}), null,
      {cd:1.5, mp:32, desc:'음표 5발 유도.', visual:'dept_note', faculty:'arts'}),
    e: _frMk('fr_art_e', '예술의 파괴미', 'e', 30000,
      shot('fire', {dmg:l=>90000000, speed:200, r:12, life:3.5, count:40, spread:6.28, explosive:true, explodeR:100, bounces:3, homing:true}), null,
      {cd:12, mp:150, desc:'파괴미 40방향.', visual:'dept_paint', faculty:'arts'}),
    passive: _frMk('fr_art_passive', '창조성 폭발', 'passive', 20000, null,
      (p,lv)=>{ p.baseDmg *= 7; p.perks.push('splitshot'); p.perks.push('splitshot'); p.perks.push('firemult'); },
      {desc:'DMGx7, SPLIT x2, FIREMULT.', faculty:'arts'}),
  },
  divinity: {
    lmb: _frMk('fr_div_lmb', '진리 사출', 'lmb', 8000,
      shot('fire', {dmg:l=>200000, speed:500, r:3, life:1.2, count:5, spread:0.2, pierce:true}), null,
      {cd:0.2, mp:5, desc:'ㅁ자 진리 5발 관통.', visual:'dept_hangeul', faculty:'divinity'}),
    q: _frMk('fr_div_q', '경전의 무게', 'q', 15000,
      shot('fire', {dmg:l=>3500000, speed:300, r:5, life:2.5, count:4, spread:0.25, homing:true}), null,
      {cd:1.5, mp:35, desc:'십자 4발 유도.', visual:'dept_medcross', faculty:'divinity'}),
    e: _frMk('fr_div_e', '존재의 부정', 'e', 30000,
      shot('fire', {dmg:l=>100000000, speed:200, r:14, life:3.5, count:24, spread:6.28, pierce:true, explosive:true, explodeR:120}), null,
      {cd:14, mp:160, desc:'존재 부정 24방향.', visual:'dept_medcross', faculty:'divinity'}),
    passive: _frMk('fr_div_passive', '초월적 사유', 'passive', 20000, null,
      (p,lv)=>{ p.baseDmg *= 8; p.dmgReduction = (p.dmgReduction||0) + 0.5; p.cdMult = (p.cdMult||1) * 0.3; },
      {desc:'DMGx8, RES+50%, CD-70%.', faculty:'divinity'}),
  },
  info: {
    lmb: _frMk('fr_info_lmb', '데이터 스트림', 'lmb', 8000,
      shot('fire', {dmg:l=>170000, speed:800, r:2, life:0.9, count:8, spread:0.25, instant:true, pierce:true}), null,
      {cd:0.15, mp:5, desc:'0/1 8발 즉시 관통.', visual:'dept_binary', faculty:'info'}),
    q: _frMk('fr_info_q', '검색 알고리즘', 'q', 15000,
      shot('fire', {dmg:l=>3200000, speed:500, r:4, life:2, count:6, spread:0.3, homing:true, pierce:true}), null,
      {cd:1.4, mp:32, desc:'화살 6발 유도 관통.', visual:'dept_chart', faculty:'info'}),
    e: _frMk('fr_info_e', '정보 폭발', 'e', 30000,
      shot('fire', {dmg:l=>85000000, speed:400, r:10, life:3, count:48, spread:6.28, pierce:true, homing:true}), null,
      {cd:11, mp:140, desc:'데이터 48방향 유도 관통.', visual:'dept_binary', faculty:'info'}),
    passive: _frMk('fr_info_passive', '집단 지성', 'passive', 20000, null,
      (p,lv)=>{ p.cdMult = (p.cdMult||1) * 0.1; p.mpCostMult = (p.mpCostMult||1) * 0.1; p.baseDmg *= 4; },
      {desc:'CD -90%, MP -90%, DMGx4.', faculty:'info'}),
  },
  design: {
    lmb: _frMk('fr_des_lmb', '기하학 조각', 'lmb', 8000,
      shot('fire', {dmg:l=>200000, speed:500, r:3, life:1.4, count:6, spread:0.3, bounces:3, pierce:true}), null,
      {cd:0.2, mp:5, desc:'톱니 6발 반사 관통.', visual:'dept_gear', faculty:'design'}),
    q: _frMk('fr_des_q', '색채의 폭풍', 'q', 15000,
      shot('fire', {dmg:l=>3300000, speed:400, r:4, life:2.5, count:8, spread:0.4}), null,
      {cd:1.4, mp:32, desc:'물감 8발 스플래시.', visual:'dept_paint', faculty:'design'}),
    e: _frMk('fr_des_e', '완벽한 형태', 'e', 30000,
      shot('fire', {dmg:l=>95000000, speed:280, r:12, life:3.5, count:36, spread:6.28, explosive:true, explodeR:110, homing:true}), null,
      {cd:12, mp:150, desc:'완벽 형태 36방향.', visual:'dept_gear', faculty:'design'}),
    passive: _frMk('fr_des_passive', '미적 감각', 'passive', 20000, null,
      (p,lv)=>{ p.baseDmg *= 6; p.crit = (p.crit||0) + 1.5; p.critMult = (p.critMult||2) * 2.5; },
      {desc:'DMGx6, CRIT+150%, x2.5 MULT.', faculty:'design'}),
  },
  language: {
    lmb: _frMk('fr_lang_lmb', '고전 시가', 'lmb', 8000,
      shot('fire', {dmg:l=>190000, speed:400, r:3, life:1.3, count:5, spread:0.2, pierce:true, homing:true}), null,
      {cd:0.2, mp:5, desc:'한자 5발 유도 관통.', visual:'dept_hangeul', faculty:'language'}),
    q: _frMk('fr_lang_q', '음운의 파동', 'q', 15000,
      shot('ice', {dmg:l=>3400000, speed:350, r:5, life:2.5, count:5, spread:0.3, freeze:4}), null,
      {cd:1.5, mp:32, desc:'잉크 5발 파도.', visual:'dept_ink', faculty:'language'}),
    e: _frMk('fr_lang_e', '천 년의 문학', 'e', 30000,
      shot('fire', {dmg:l=>100000000, speed:250, r:10, life:3, count:32, spread:6.28, pierce:true, explosive:true, explodeR:90}), null,
      {cd:12, mp:150, desc:'천년 문학 32방향.', visual:'dept_ink', faculty:'language'}),
    passive: _frMk('fr_lang_passive', '언어 통달', 'passive', 20000, null,
      (p,lv)=>{ p.baseDmg *= 7; p.mods.fire = (p.mods.fire||1) * 1.6; p.mods.ice = (p.mods.ice||1) * 1.6; p.cdMult = (p.cdMult||1) * 0.4; },
      {desc:'DMGx7, 원소x1.6, CD-60%.', faculty:'language'}),
  },
};

// SKILL_TREE 에 등록 - 각 스킬을 자기 학과에 맞는 category 에 넣음
const FACULTY_TO_CATEGORY = {
  humanities: 'chaos', social: 'engineering', natural: 'magic',
  engineering: 'engineering', medicine: 'order', education: 'nature',
  arts: 'chaos', divinity: 'order', info: 'engineering',
  design: 'chaos', language: 'magic',
};
for (const facKey of Object.keys(FACULTY_REWARD_SKILLS)) {
  const set = FACULTY_REWARD_SKILLS[facKey];
  const cat = FACULTY_TO_CATEGORY[facKey] || 'magic';
  for (const slot of Object.keys(set)) {
    const s = set[slot];
    s.category = cat;
    if (typeof SKILL_TREE !== 'undefined' && SKILL_TREE[cat]) SKILL_TREE[cat].skills.push(s);
    if (typeof SKILL_BY_ID !== 'undefined') SKILL_BY_ID[s.id] = s;
  }
}

// canBuySkill 게이트: 이 계열 시련 통과했으면 구매 가능
if (typeof canBuySkill === 'function') {
  const _origCanBuy = canBuySkill;
  canBuySkill = function(s) {
    if (s.isFaculty && s.faculty) {
      if (!(state.facultyCleared && state.facultyCleared[s.faculty])) return false;
      // 게이트 통과했다면 나머지는 표준 검사와 동일 (cost 등만)
      const lv = skillLevel(s.id);
      const maxLv = s.maxLv || 1;
      if (lv >= maxLv) return false;
      if (state.research < s.cost) return false;
      return true;
    }
    return _origCanBuy(s);
  };
}
