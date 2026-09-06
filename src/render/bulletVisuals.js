// =====================================================================
// Bullet visuals - 100+ named projectile styles.
// 각 스킬 이름에서 키워드로 자동 매핑되거나 opts.visual 로 명시.
// 각 visual: { draw(b, ang), move?(b, dt) } — move 는 vx*dt 이후 추가 위치 오프셋.
// =====================================================================

// --- 색 팔레트 (팔레트 이름 → [dark, mid, light]) ---
const V_PAL = {
  fire:      ['#c81616', '#ff9c3d', '#ffefa8'],
  ember:     ['#a02020', '#ff5a2a', '#ffbb55'],
  flame:     ['#8a0a0a', '#ff2d2d', '#ffefa8'],
  ice:       ['#1a3a5a', '#8bd8ff', '#ffffff'],
  frost:     ['#0a2a5a', '#a8e0ff', '#e0f5ff'],
  glacier:   ['#0a1a3a', '#3b7fd6', '#c8e0ff'],
  nature:    ['#0a3a1a', '#3ac762', '#a8ffb8'],
  root:      ['#3a2010', '#7a5030', '#b8a880'],
  leaf:      ['#0a4a1a', '#5adc7a', '#c8ffd0'],
  chaos:     ['#3a0a5a', '#c86ade', '#ffb8ff'],
  madness:   ['#2a0a3a', '#a03adc', '#ff80ff'],
  void:      ['#0a0510', '#5a1a7a', '#c86ade'],
  order:     ['#4a3a0a', '#ffefa8', '#ffffff'],
  holy:      ['#4a3a0a', '#ffe870', '#ffffff'],
  divine:    ['#6a5a20', '#fff8a0', '#ffffff'],
  lightning: ['#0a1a3a', '#ffee00', '#ffffff'],
  storm:     ['#1a2a3a', '#8bd8ff', '#ffee80'],
  gold:      ['#5a4a20', '#e8c547', '#ffefa8'],
  silver:    ['#3a3a4a', '#a0a0a0', '#e0e0e0'],
  poison:    ['#0a3a0a', '#5adc2a', '#c8ff80'],
  blood:     ['#4a0505', '#c81616', '#ff6666'],
  metal:     ['#3a3020', '#8a7a4a', '#e8c547'],
  plasma:    ['#0a3a4a', '#3adcff', '#ffffff'],
  arcane:    ['#4a1070', '#c86ade', '#ffb8ff'],
  shadow:    ['#0a0510', '#4a2070', '#8a5adc'],
  angel:     ['#5a5a20', '#fff5a0', '#ffffff'],
  dragon:    ['#4a0a0a', '#c81616', '#ffbb55'],
  crystal:   ['#1a1a3a', '#8bd8ff', '#f0f0ff'],
  necro:     ['#1a0a1a', '#5a0a5a', '#c86ade'],
  earth:     ['#2a1a10', '#6a4a30', '#a08050'],
  wind:      ['#1a3a3a', '#5adcdc', '#c8ffff'],
  moon:      ['#1a1a3a', '#7a7abd', '#ffefff'],
  sun:       ['#5a3a10', '#ffbb00', '#ffffff'],
  star:      ['#1a1a3a', '#8bd8ff', '#ffefa8'],
  omega:     ['#2a0a3a', '#ff2d80', '#ffffff'],
  nether:    ['#1a0505', '#8a1a5a', '#ff2d80'],
};

// --- 도형 헬퍼 --- (모두 b 위치 기준)
function _sDot(b, col)                { pxDraw(b.x - 1, b.y - 1, 2, 2, col); }
function _sBig(b, col)                { pxDraw(b.x - 2, b.y - 2, 4, 4, col); }
function _sSquare(b, size, col)       { pxDraw(b.x - size/2, b.y - size/2, size, size, col); }
function _sLozenge(b, c1, c2)         { pxDraw(b.x - 1, b.y - 2, 2, 1, c1); pxDraw(b.x - 2, b.y - 1, 4, 2, c1); pxDraw(b.x - 1, b.y + 1, 2, 1, c1); pxDraw(b.x - 1, b.y - 1, 2, 2, c2); }
function _sCross(b, c1, c2)           { pxDraw(b.x - 3, b.y, 7, 1, c1); pxDraw(b.x, b.y - 3, 1, 7, c1); _sDot(b, c2); }
function _sStar4(b, c1, c2)           { pxDraw(b.x - 3, b.y - 1, 7, 2, c1); pxDraw(b.x - 1, b.y - 3, 2, 7, c1); pxDraw(b.x - 1, b.y - 1, 2, 2, c2); }
function _sBurst(b, c1, c2, c3)       { pxDraw(b.x - 3, b.y - 3, 6, 6, c1); pxDraw(b.x - 2, b.y - 2, 4, 4, c2); pxDraw(b.x - 1, b.y - 1, 2, 2, c3); }
function _sCrystal(b, c1, c2)         { pxDraw(b.x, b.y - 3, 1, 1, c1); pxDraw(b.x - 1, b.y - 2, 2, 1, c1); pxDraw(b.x - 2, b.y - 1, 4, 2, c1); pxDraw(b.x - 1, b.y + 1, 2, 1, c1); pxDraw(b.x, b.y + 2, 1, 1, c1); pxDraw(b.x - 1, b.y - 1, 2, 2, c2); }
function _sRing(b, c)                 { ctx.strokeStyle = c; ctx.lineWidth = PX; ctx.beginPath(); ctx.arc(b.x*PX, b.y*PX, 3*PX, 0, Math.PI*2); ctx.stroke(); _sDot(b, c); }
function _sStreak(b, ang, len, c)     { ctx.strokeStyle = c; ctx.lineWidth = PX*2; ctx.beginPath(); ctx.moveTo((b.x - Math.cos(ang)*len)*PX, (b.y - Math.sin(ang)*len)*PX); ctx.lineTo(b.x*PX, b.y*PX); ctx.stroke(); }
function _sFang(b, ang, c1, c2)       { const nx = Math.cos(ang), ny = Math.sin(ang); pxDraw(b.x + nx*2 - 1, b.y + ny*2 - 1, 2, 2, c2); pxDraw(b.x - nx - 1, b.y - ny - 1, 3, 3, c1); }
function _sTriangle(b, ang, c1, c2)   { const nx = Math.cos(ang), ny = Math.sin(ang); pxDraw(b.x + nx*2, b.y + ny*2, 1, 1, c2); pxDraw(b.x - 1, b.y - 1, 3, 3, c1); _sDot(b, c2); }
function _sHex(b, c1, c2)             { pxDraw(b.x - 2, b.y - 1, 4, 1, c1); pxDraw(b.x - 3, b.y, 6, 1, c1); pxDraw(b.x - 2, b.y + 1, 4, 1, c1); pxDraw(b.x - 1, b.y - 1, 2, 3, c2); }
function _sSparkle(b, c1, c2)         { const p = Math.floor(state.time * 20) % 2 ? c1 : c2; _sDot({x:b.x-2, y:b.y}, p); _sDot({x:b.x+2, y:b.y}, p); _sDot({x:b.x, y:b.y-2}, p); _sDot({x:b.x, y:b.y+2}, p); _sDot(b, c2); }
function _sRune(b, c1, c2)            { pxDraw(b.x - 2, b.y - 2, 5, 5, c1); pxDraw(b.x - 1, b.y - 1, 3, 3, c2); pxDraw(b.x, b.y, 1, 1, c1); }
function _sOrb(b, c1, c2, c3)         { pxDraw(b.x - 3, b.y - 3, 6, 6, c1); pxDraw(b.x - 2, b.y - 2, 4, 4, c2); pxDraw(b.x, b.y - 1, 1, 1, c3); }

// --- 모션 헬퍼 --- (base b.x += vx*dt 이후 추가 오프셋)
function _mWave(b, dt)   { const t = (b._age = (b._age||0) + dt); const ang = Math.atan2(b.vy, b.vx) + Math.PI/2; const off = Math.sin(t*14) * 20 * dt; b.x += Math.cos(ang) * off; b.y += Math.sin(ang) * off; }
function _mSpiral(b, dt) { const t = (b._age = (b._age||0) + dt); const ang = Math.atan2(b.vy, b.vx) + Math.PI/2 + t*8; const off = 30 * dt; b.x += Math.cos(ang) * off; b.y += Math.sin(ang) * off; }
function _mPulse(b, dt)  { b._age = (b._age||0) + dt; }   // 시각만 (draw 에서 age 사용)
function _mAccel(b, dt)  { b.vx *= 1 + 1.2*dt; b.vy *= 1 + 1.2*dt; }
function _mDecel(b, dt)  { b.vx *= 1 - 0.6*dt; b.vy *= 1 - 0.6*dt; }
function _mZigzag(b, dt) { const t = (b._age = (b._age||0) + dt); const ang = Math.atan2(b.vy, b.vx) + Math.PI/2; const off = ((Math.floor(t*10) % 2) ? 1 : -1) * 40 * dt; b.x += Math.cos(ang) * off; b.y += Math.sin(ang) * off; }
function _mOrbit(b, dt)  { const t = (b._age = (b._age||0) + dt); const cx = b._ox = b._ox || b.x, cy = b._oy = b._oy || b.y; const r = 8, sp = 6; b.x = cx + Math.cos(t*sp) * r; b.y = cy + Math.sin(t*sp) * r; b._ox += b.vx * dt; b._oy += b.vy * dt; }

// --- 팩토리: shape + palette + motion 조합으로 visual 만듦 ---
function _V(shape, palName, motion) {
  const p = V_PAL[palName] || V_PAL.fire;
  return { draw: (b, ang) => shape(b, ang, p[0], p[1], p[2]), move: motion };
}
// shape 어댑터 (인자 개수 통일)
const S = {
  dot:      (b,ang,c1,c2,c3) => _sDot(b, c2),
  big:      (b,ang,c1,c2,c3) => _sBig(b, c2),
  square:   (b,ang,c1,c2,c3) => _sSquare(b, 6, c2),
  lozenge:  (b,ang,c1,c2,c3) => _sLozenge(b, c1, c3),
  cross:    (b,ang,c1,c2,c3) => _sCross(b, c2, c3),
  star:     (b,ang,c1,c2,c3) => _sStar4(b, c2, c3),
  burst:    (b,ang,c1,c2,c3) => _sBurst(b, c1, c2, c3),
  crystal:  (b,ang,c1,c2,c3) => _sCrystal(b, c1, c3),
  ring:     (b,ang,c1,c2,c3) => _sRing(b, c2),
  streak:   (b,ang,c1,c2,c3) => { _sStreak(b, ang, 6, c2); _sDot(b, c3); },
  fang:     (b,ang,c1,c2,c3) => _sFang(b, ang, c1, c3),
  tri:      (b,ang,c1,c2,c3) => _sTriangle(b, ang, c1, c3),
  hex:      (b,ang,c1,c2,c3) => _sHex(b, c1, c3),
  sparkle:  (b,ang,c1,c2,c3) => _sSparkle(b, c2, c3),
  rune:     (b,ang,c1,c2,c3) => _sRune(b, c1, c3),
  orb:      (b,ang,c1,c2,c3) => _sOrb(b, c1, c2, c3),
  pulseOrb: (b,ang,c1,c2,c3) => { const pu = ((b._age||0)*3) % 2 < 1 ? c2 : c3; pxDraw(b.x - 2, b.y - 2, 4, 4, pu); pxDraw(b.x - 1, b.y - 1, 2, 2, c3); },
  double:   (b,ang,c1,c2,c3) => { const nx = Math.cos(ang + Math.PI/2), ny = Math.sin(ang + Math.PI/2); pxDraw(b.x + nx*2 - 1, b.y + ny*2 - 1, 2, 2, c2); pxDraw(b.x - nx*2 - 1, b.y - ny*2 - 1, 2, 2, c2); },
  trail:    (b,ang,c1,c2,c3) => { for (let i = 1; i <= 3; i++) { ctx.globalAlpha = 0.5/i; pxDraw(b.x - Math.cos(ang)*i*3 - 1, b.y - Math.sin(ang)*i*3 - 1, 2, 2, c2); } ctx.globalAlpha = 1; _sDot(b, c3); },
  wisp:     (b,ang,c1,c2,c3) => { const t = state.time * 3 + b.x; pxDraw(b.x - 2 + Math.sin(t)*1, b.y - 2 + Math.cos(t)*1, 4, 4, c1); _sDot(b, c3); },
};

// --- 100+ named visuals ---
const BULLET_VISUALS = {
  // fire family (14)
  fireball_ex:  _V(S.orb,     'fire'),
  emberball:    _V(S.orb,     'ember'),
  flareball:    _V(S.pulseOrb,'flame',   _mPulse),
  pyroblast:    _V(S.burst,   'fire',    _mAccel),
  cinder:       _V(S.dot,     'ember'),
  hellfire:     _V(S.orb,     'flame'),
  scorch:       _V(S.streak,  'ember'),
  sunburst:     _V(S.sparkle, 'sun'),
  solarray:     _V(S.streak,  'sun'),
  dragonbreath: _V(S.orb,     'dragon',  _mAccel),
  phoenix:      _V(S.star,    'sun',     _mSpiral),
  napalm:       _V(S.big,     'ember',   _mDecel),
  inferno:      _V(S.burst,   'flame',   _mWave),
  brimstone:    _V(S.crystal, 'blood'),

  // ice family (14)
  icebolt_ex:   _V(S.crystal, 'ice'),
  frostshard:   _V(S.lozenge, 'frost'),
  icicle:       _V(S.crystal, 'ice',     _mAccel),
  hail:         _V(S.big,     'frost',   _mZigzag),
  blizzard_ex:  _V(S.sparkle, 'frost'),
  glacier_ex:   _V(S.big,     'glacier', _mDecel),
  cryobolt:     _V(S.crystal, 'crystal'),
  frostlance:   _V(S.streak,  'ice'),
  frozenorb:    _V(S.orb,     'crystal', _mDecel),
  snowflake:    _V(S.star,    'frost'),
  polarwind:    _V(S.wisp,    'frost',   _mWave),
  glacialrune:  _V(S.rune,    'glacier'),
  freezing:     _V(S.pulseOrb,'ice',     _mPulse),
  iceray:       _V(S.streak,  'crystal'),

  // lightning family (10)
  lightning_ex: _V(S.streak,  'lightning'),
  thunderbolt:  _V(S.streak,  'lightning',_mAccel),
  storm_bolt:   _V(S.streak,  'storm',    _mZigzag),
  tesla:        _V(S.sparkle, 'lightning'),
  chain_l:      _V(S.streak,  'storm'),
  arclight:     _V(S.cross,   'lightning'),
  voltarc:      _V(S.streak,  'lightning',_mZigzag),
  thunderhead:  _V(S.orb,     'storm'),
  sparkburst:   _V(S.sparkle, 'lightning'),
  gigavolt:     _V(S.burst,   'lightning',_mAccel),

  // arcane / magic (12)
  arcane_ex:    _V(S.orb,     'arcane'),
  arcanepulse:  _V(S.pulseOrb,'arcane',   _mPulse),
  starfall:     _V(S.star,    'star'),
  starshard:    _V(S.lozenge, 'star'),
  prismshot:    _V(S.orb,     'plasma',   _mSpiral),
  runeblast:    _V(S.rune,    'arcane'),
  glyphbolt:    _V(S.rune,    'chaos'),
  spellorb:     _V(S.orb,     'arcane',   _mWave),
  wandshot:     _V(S.dot,     'arcane'),
  mysticbeam:   _V(S.streak,  'arcane'),
  eldritch:     _V(S.burst,   'necro'),
  singularity:  _V(S.orb,     'void',     _mSpiral),

  // engineering / metal (12)
  bullet:       _V(S.dot,     'metal'),
  buckshot:     _V(S.dot,     'silver'),
  slug:         _V(S.big,     'metal'),
  railslug:     _V(S.streak,  'metal',    _mAccel),
  gauss:        _V(S.streak,  'silver',   _mAccel),
  cannonball:   _V(S.orb,     'silver',   _mDecel),
  missile:      _V(S.fang,    'metal'),
  homingmissile:_V(S.fang,    'gold'),
  rocket:       _V(S.fang,    'ember'),
  turret:       _V(S.square,  'metal'),
  plasma_shot:  _V(S.orb,     'plasma'),
  laser_beam:   _V(S.streak,  'plasma'),

  // explosive (8)
  bomb:         _V(S.orb,     'metal',    _mDecel),
  nuke:         _V(S.burst,   'fire',     _mDecel),
  atombomb:     _V(S.orb,     'plasma',   _mDecel),
  grenade:      _V(S.big,     'earth'),
  clusterbomb:  _V(S.burst,   'ember'),
  satchel:      _V(S.square,  'ember'),
  minecharge:   _V(S.square,  'blood'),
  fusion_slug:  _V(S.orb,     'plasma',   _mAccel),

  // nature (14)
  thorn:        _V(S.fang,    'nature'),
  vine:         _V(S.trail,   'root',     _mWave),
  seed:         _V(S.lozenge, 'nature'),
  bloom:        _V(S.star,    'leaf'),
  leaf_shot:    _V(S.tri,     'leaf',     _mWave),
  acorn:        _V(S.orb,     'root'),
  earthspike:   _V(S.crystal, 'earth'),
  woodshard:    _V(S.lozenge, 'root'),
  natureorb:    _V(S.orb,     'nature',   _mPulse),
  spore:        _V(S.dot,     'poison'),
  poisonbolt:   _V(S.orb,     'poison',   _mWave),
  fang:         _V(S.fang,    'blood'),
  clawshot:     _V(S.tri,     'nature'),
  quakebolt:    _V(S.hex,     'earth'),

  // chaos / void (12)
  voidbolt:     _V(S.orb,     'void'),
  voiddart:     _V(S.streak,  'void'),
  chaosorb:     _V(S.pulseOrb,'chaos',    _mPulse),
  madnessorb:   _V(S.orb,     'madness',  _mZigzag),
  entropybolt:  _V(S.orb,     'shadow',   _mSpiral),
  abyssalorb:   _V(S.orb,     'nether',   _mDecel),
  shadowshot:   _V(S.dot,     'shadow'),
  voidtear:     _V(S.streak,  'void',     _mZigzag),
  chaoslance:   _V(S.streak,  'chaos'),
  eyeofchaos:   _V(S.orb,     'chaos',    _mSpiral),
  darkstar:     _V(S.star,    'void'),
  nethershard:  _V(S.crystal, 'nether'),

  // order / holy (14)
  holybolt:     _V(S.streak,  'holy'),
  holycross:    _V(S.cross,   'holy'),
  divinespear: _V(S.streak,  'divine',   _mAccel),
  angelfeather: _V(S.tri,     'angel',    _mWave),
  judgmentray:  _V(S.streak,  'divine'),
  sacredorb:    _V(S.orb,     'divine',   _mPulse),
  hallow:       _V(S.ring,    'holy'),
  seraph:       _V(S.sparkle, 'divine'),
  ordercross:   _V(S.cross,   'gold'),
  righteous:    _V(S.star,    'divine'),
  benediction:  _V(S.orb,     'holy',     _mPulse),
  psalm:        _V(S.rune,    'holy'),
  archangel:    _V(S.star,    'angel',    _mSpiral),
  amen:         _V(S.pulseOrb,'divine'),

  // exotic / ultimate (10)
  bigbang:      _V(S.burst,   'sun',      _mAccel),
  genesis:      _V(S.orb,     'star',     _mSpiral),
  cosmos:       _V(S.sparkle, 'moon'),
  quasar:       _V(S.streak,  'plasma',   _mAccel),
  supernova:    _V(S.burst,   'sun',      _mSpiral),
  omega_shot:   _V(S.orb,     'omega'),
  transcend:    _V(S.pulseOrb,'omega',    _mSpiral),
  ascend:       _V(S.star,    'divine',   _mSpiral),
  primal:       _V(S.orb,     'blood',    _mAccel),
  doomsday:     _V(S.burst,   'nether',   _mAccel),

  // catch-all patterns (2)
  wisp_shot:    _V(S.wisp,    'moon',     _mWave),
  spark_ex:     _V(S.dot,     'gold'),
};

// =====================================================================
// 학과 테마 투사체 (교수 전용). 각 학과의 상징을 픽셀로 표현.
// =====================================================================
function _drawDeptHangeul(b) {
  // 한글 자소 - ㅁ 모양 (사각 테두리)
  pxDraw(b.x - 3, b.y - 3, 7, 1, '#ffefa8');
  pxDraw(b.x - 3, b.y + 2, 7, 1, '#ffefa8');
  pxDraw(b.x - 3, b.y - 2, 1, 4, '#ffefa8');
  pxDraw(b.x + 3, b.y - 2, 1, 4, '#ffefa8');
  pxDraw(b.x - 1, b.y - 1, 2, 2, '#fff');
}
function _drawDeptInk(b) {
  // 잉크방울 - 위쪽 뾰족, 아래쪽 둥근
  pxDraw(b.x - 1, b.y - 3, 2, 1, '#3a1548');
  pxDraw(b.x - 2, b.y - 2, 4, 2, '#4a1a5a');
  pxDraw(b.x - 3, b.y, 6, 3, '#1a0a3a');
  pxDraw(b.x - 1, b.y + 1, 2, 1, '#c86ade');
}
function _drawDeptChart(b, ang) {
  // 상승 화살표 (경영)
  const nx = Math.cos(ang), ny = Math.sin(ang);
  pxDraw(b.x - 3, b.y, 7, 1, '#8bd8ff');
  pxDraw(b.x + nx*2, b.y + ny*2 - 2, 1, 5, '#8bd8ff');
  pxDraw(b.x + nx*3 - 1, b.y + ny*3 - 1, 3, 3, '#ffefa8');
}
function _drawDeptBrain(b) {
  // 뇌 파동 - 세로 물결 3개
  const off = Math.sin(state.time * 8 + b.x) * 1.5;
  pxDraw(b.x - 3, b.y - 2 + off, 1, 5, '#c86ade');
  pxDraw(b.x, b.y - 2 - off, 1, 5, '#ff80ff');
  pxDraw(b.x + 3, b.y - 2 + off, 1, 5, '#c86ade');
  pxDraw(b.x - 1, b.y - 1, 2, 2, '#fff');
}
function _drawDeptAtom(b) {
  // 원자 궤도 - 회전하는 3개 궤도 + 핵
  const t = state.time * 8;
  for (let i = 0; i < 3; i++) {
    const a = t + i * (Math.PI * 2 / 3);
    pxDraw(b.x + Math.cos(a) * 3, b.y + Math.sin(a) * 3, 1, 1, '#8bd8ff');
    pxDraw(b.x + Math.cos(a + Math.PI) * 3, b.y + Math.sin(a + Math.PI) * 3, 1, 1, '#5adcff');
  }
  pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffefa8');
}
function _drawDeptBenzene(b) {
  // 벤젠 링 (육각형)
  const pts = 6;
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    pxDraw(b.x + Math.cos(a) * 3 - 0.5, b.y + Math.sin(a) * 3 - 0.5, 1, 1, '#3ac762');
  }
  pxDraw(b.x - 1, b.y - 1, 2, 2, '#5adc2a');
}
function _drawDeptBinary(b) {
  // 0/1 픽셀
  const bit = Math.floor(state.time * 12 + b.x) % 2;
  pxDraw(b.x - 2, b.y - 3, 5, 6, '#0a0a10');
  if (bit) {
    // "1"
    pxDraw(b.x - 1, b.y - 3, 1, 6, '#3ac762');
    pxDraw(b.x, b.y - 2, 1, 1, '#3ac762');
  } else {
    // "0"
    pxDraw(b.x - 2, b.y - 3, 5, 1, '#8bd8ff');
    pxDraw(b.x - 2, b.y + 2, 5, 1, '#8bd8ff');
    pxDraw(b.x - 2, b.y - 2, 1, 4, '#8bd8ff');
    pxDraw(b.x + 2, b.y - 2, 1, 4, '#8bd8ff');
  }
}
function _drawDeptGear(b) {
  // 톱니바퀴 - 회전하는 사각 이빨 + 중앙 링
  const t = state.time * 6;
  for (let i = 0; i < 4; i++) {
    const a = t + i * Math.PI / 2;
    pxDraw(b.x + Math.cos(a) * 3 - 1, b.y + Math.sin(a) * 3 - 1, 2, 2, '#e8c547');
  }
  pxDraw(b.x - 2, b.y - 2, 4, 4, '#c8b898');
  pxDraw(b.x - 1, b.y - 1, 2, 2, '#5a4a80');
}
function _drawDeptCross(b) {
  // 의료 십자 (빨간 십자)
  pxDraw(b.x - 3, b.y - 1, 7, 2, '#ff2020');
  pxDraw(b.x - 1, b.y - 3, 2, 7, '#ff2020');
  pxDraw(b.x - 1, b.y - 1, 2, 2, '#fff');
}
function _drawDeptPill(b) {
  // 캡슐 (반반 색상)
  pxDraw(b.x - 3, b.y - 1, 3, 3, '#ff9c3d');
  pxDraw(b.x, b.y - 1, 3, 3, '#ffefa8');
  pxDraw(b.x - 1, b.y, 2, 1, '#fff');
}
function _drawDeptInfinity(b) {
  // ∞ 무한 기호
  const t = state.time * 4;
  const w = 2 + Math.sin(t) * 0.5;
  pxDraw(b.x - 3, b.y - 1, 2, 2, '#c86ade');
  pxDraw(b.x + 2, b.y - 1, 2, 2, '#c86ade');
  pxDraw(b.x - 1, b.y, 3, 1, '#ff80ff');
}
function _drawDeptBall(b) {
  // 공 (축구공 스타일 - 오각형 패턴 흉내)
  const t = state.time * 5;
  const c1 = Math.floor(t + b.x) % 2 ? '#fff' : '#1a1a1a';
  pxDraw(b.x - 3, b.y - 3, 7, 7, '#fff');
  pxDraw(b.x - 2, b.y - 2, 5, 5, c1);
  pxDraw(b.x - 1, b.y - 1, 2, 2, '#fff');
}
function _drawDeptPaint(b) {
  // 물감 방울 - 랜덤 색상
  const t = Math.floor(state.time * 8 + b.x);
  const cols = ['#ff2d80','#8bd8ff','#3ac762','#ffefa8','#c86ade','#ff9c3d'];
  const col = cols[t % cols.length];
  pxDraw(b.x - 2, b.y - 2, 4, 4, col);
  pxDraw(b.x - 1, b.y - 1, 2, 2, '#fff');
  // 스플래시
  if (Math.random() < 0.3) spawnParticle(b.x + rand(-3,3), b.y + rand(-3,3), col, 0.4, 2, 30);
}
function _drawDeptNote(b) {
  // 음표 - ♪ 모양
  pxDraw(b.x - 2, b.y + 1, 3, 3, '#ffefa8');    // 머리
  pxDraw(b.x + 1, b.y - 3, 1, 5, '#ffefa8');    // 스템
  pxDraw(b.x + 1, b.y - 3, 3, 1, '#ffefa8');    // 깃발
}

const DEPT_VISUALS = {
  dept_hangeul:  { draw: (b, ang) => _drawDeptHangeul(b) },
  dept_ink:      { draw: (b, ang) => _drawDeptInk(b) },
  dept_chart:    { draw: (b, ang) => _drawDeptChart(b, ang) },
  dept_brain:    { draw: (b, ang) => _drawDeptBrain(b), move: _mWave },
  dept_atom:     { draw: (b, ang) => _drawDeptAtom(b), move: _mSpiral },
  dept_benzene:  { draw: (b, ang) => _drawDeptBenzene(b) },
  dept_binary:   { draw: (b, ang) => _drawDeptBinary(b) },
  dept_gear:     { draw: (b, ang) => _drawDeptGear(b) },
  dept_medcross: { draw: (b, ang) => _drawDeptCross(b), move: _mPulse },
  dept_pill:     { draw: (b, ang) => _drawDeptPill(b) },
  dept_infinity: { draw: (b, ang) => _drawDeptInfinity(b), move: _mWave },
  dept_ball:     { draw: (b, ang) => _drawDeptBall(b), move: _mZigzag },
  dept_paint:    { draw: (b, ang) => _drawDeptPaint(b) },
  dept_note:     { draw: (b, ang) => _drawDeptNote(b), move: _mWave },
};
// BULLET_VISUALS 에 병합
for (const k of Object.keys(DEPT_VISUALS)) BULLET_VISUALS[k] = DEPT_VISUALS[k];

// 학과 visual 의 슬롯 변형: Q 는 파도 모션, E 는 나선 모션 (교수 보상 스킬용).
// 원본 draw 는 그대로 재사용하고 move 만 붙임.
for (const k of Object.keys(DEPT_VISUALS)) {
  const base = DEPT_VISUALS[k];
  BULLET_VISUALS[k + '_q'] = { draw: base.draw, move: _mWave };
  BULLET_VISUALS[k + '_e'] = { draw: base.draw, move: _mSpiral };
}

// --- 스킬 이름 → visual 자동 매핑 ---
// 우선순위: 긴 키워드 먼저. 대문자 비교.
const VIS_KEYWORDS = [
  // ULT / final
  ['GENESIS','genesis'], ['BIG BANG','bigbang'], ['SUPERNOVA','supernova'],
  ['QUASAR','quasar'], ['COSMOS','cosmos'], ['TRANSCEND','transcend'],
  ['ASCEND','ascend'], ['OMEGA','omega_shot'], ['DOOMSDAY','doomsday'],
  ['PRIMAL','primal'], ['SINGULARITY','singularity'],
  // ice
  ['CRYOBLAST','cryobolt'], ['CRYO','cryobolt'], ['FROSTLANCE','frostlance'],
  ['FROSTVOID','frostshard'], ['ICE COMET','frozenorb'], ['ICICLE','icicle'],
  ['GLACIER','glacier_ex'], ['GLACIAL','glacialrune'], ['BLIZZARD','blizzard_ex'],
  ['HAILSTORM','hail'], ['HAIL','hail'], ['SNOWFLAKE','snowflake'],
  ['FROSTSHARD','frostshard'], ['FROST','frostshard'], ['ICE','icebolt_ex'],
  ['CRYSTAL','crystal'], ['TSUNAMI','wisp_shot'],
  // fire
  ['METEOR','pyroblast'], ['PYROMANCY','pyroblast'], ['PYRO','pyroblast'],
  ['INFERNO','inferno'], ['HELLFIRE','hellfire'], ['HELL','hellfire'],
  ['DRAGON','dragonbreath'], ['PHOENIX','phoenix'], ['NAPALM','napalm'],
  ['STARFALL','starfall'], ['CATACLYSM','doomsday'], ['SOL','solarray'],
  ['SUN','sunburst'], ['SCORCH','scorch'], ['EMBER','emberball'],
  ['ETERNAL EMBER','emberball'], ['ELDER FLAME','dragonbreath'],
  ['FLAME','flareball'], ['FIRE','fireball_ex'], ['SPARK','spark_ex'],
  ['CINDER','cinder'], ['BRIMSTONE','brimstone'],
  // lightning
  ['THUNDER','thunderbolt'], ['LIGHTNING','lightning_ex'], ['TESLA','tesla'],
  ['STORM','storm_bolt'], ['ARC','arclight'], ['VOLT','voltarc'],
  ['CHAIN','chain_l'], ['GIGAVOLT','gigavolt'],
  // arcane
  ['ARCANE','arcane_ex'], ['PRISM','prismshot'], ['RUNE','runeblast'],
  ['GLYPH','glyphbolt'], ['SPELL','spellorb'], ['WAND','wandshot'],
  ['MYSTIC','mysticbeam'], ['ELDRITCH','eldritch'], ['STAR','starshard'],
  // engineering
  ['RAILGUN','railslug'], ['RAIL','railslug'], ['GAUSS','gauss'],
  ['GATLING','buckshot'], ['MG','buckshot'], ['SUBMACHINE','bullet'],
  ['CANNON','cannonball'], ['MISSILE POD','missile'], ['MISSILE','homingmissile'],
  ['ROCKET','rocket'], ['TURRET','turret'], ['DRONE','homingmissile'],
  ['PLASMA','plasma_shot'], ['LASER','laser_beam'], ['LASER GRID','laser_beam'],
  ['BEAM','laser_beam'], ['RAY','judgmentray'], ['CHAINGUN','buckshot'],
  ['SLUG','slug'], ['SNIPER','gauss'], ['PROTON','plasma_shot'],
  ['ANTIMATTER','plasma_shot'], ['PARTICLE','plasma_shot'], ['PHOTON','plasma_shot'],
  // explosive
  ['ATOMIC','atombomb'], ['NUKE','nuke'], ['WMD','nuke'],
  ['CLUSTER','clusterbomb'], ['SATCHEL','satchel'], ['MINEFIELD','minecharge'],
  ['MINE','minecharge'], ['BOMB','bomb'], ['GRENADE','grenade'],
  ['FUSION','fusion_slug'], ['ORBITAL','nuke'], ['EMP','sparkburst'],
  // nature
  ['THORN','thorn'], ['VINE','vine'], ['BLOOM','bloom'], ['SEED','seed'],
  ['LEAF','leaf_shot'], ['ACORN','acorn'], ['EARTHQUAKE','quakebolt'],
  ['EARTH','earthspike'], ['ENT','vine'], ['WORLD','vine'],
  ['SPORE','spore'], ['POISON','poisonbolt'], ['NATURE','natureorb'],
  ['GAIA','natureorb'], ['LIFE','natureorb'], ['BEAR','clawshot'],
  ['TIGER','fang'], ['CLAW','clawshot'], ['FANG','fang'],
  ['TITAN','earthspike'], ['ROOT','vine'],
  // chaos / void
  ['ABYSS','abyssalorb'], ['ABYSSAL','abyssalorb'], ['VOID DART','voiddart'],
  ['VOID','voidbolt'], ['CHAOS','chaosorb'], ['MADNESS','madnessorb'],
  ['ENTROPY','entropybolt'], ['ANNIHILATE','doomsday'],
  ['REALITY','voidtear'], ['DIMENSIONAL','voidtear'], ['SHADOW','shadowshot'],
  ['DARK','darkstar'], ['NETHER','nethershard'], ['ENDING','abyssalorb'],
  // order / holy
  ['DIVINE','divinespear'], ['HOLY','holybolt'], ['SACRED','sacredorb'],
  ['JUDGMENT','judgmentray'], ['LAW','ordercross'], ['ANGEL','angelfeather'],
  ['ANGELIC','angelfeather'], ['SERAPH','seraph'], ['ARCH','archangel'],
  ['HEAVENS','judgmentray'], ['RIGHTEOUS','righteous'], ['HALLOW','hallow'],
  ['GOD','divinespear'], ['ORDER','ordercross'], ['JUSTICE','ordercross'],
  ['SPEAR','divinespear'], ['LANCE','frostlance'], ['HAMMER','clawshot'],
  ['VERDICT','judgmentray'], ['FINAL','judgmentray'],
];

// 스킬 이름 → visual 키 결정 (기본값 fallback 포함)
function deriveVisualFromName(name, kind) {
  if (!name) return kind === 'ice' ? 'icebolt_ex' : 'fireball_ex';
  const up = String(name).toUpperCase();
  for (const [kw, viz] of VIS_KEYWORDS) {
    if (up.indexOf(kw) >= 0) return viz;
  }
  return kind === 'ice' ? 'icebolt_ex' : 'fireball_ex';
}

// 초기화: SKILL_TREE 의 모든 스킬에 자동 visual 매핑을 SKILL_VISUAL 에 등록
// (기존 항목은 덮어쓰지 않음)
function _initAutoVisuals() {
  if (typeof SKILL_TREE === 'undefined' || typeof SKILL_VISUAL === 'undefined') return;
  for (const cat of Object.keys(SKILL_TREE)) {
    for (const s of SKILL_TREE[cat].skills) {
      if (SKILL_VISUAL[s.id]) continue;
      // 스킬 opts 의 kind 를 알 방법이 없으니 이름에서 유추
      const guessedKind = /ICE|FROST|GLACIER|CRYO|HAIL|SNOW|BLIZZARD/.test(s.name.toUpperCase()) ? 'ice' : 'fire';
      SKILL_VISUAL[s.id] = deriveVisualFromName(s.name, guessedKind);
    }
  }
}
// 스크립트 로드 순서상 SKILL_TREE 는 이미 채워져 있음. maxSkills / ultraSkills 도 위에서 push 됨.
_initAutoVisuals();

// updateBullets 에서 커스텀 모션 적용
function applyBulletVisualMotion(b, dt) {
  const v = b.visual && BULLET_VISUALS[b.visual];
  if (v && v.move) v.move(b, dt);
}
