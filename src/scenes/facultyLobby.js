// =====================================================================
// Faculty Lobby (오염된 스킬 트리) - 파란 PROF 문 통과 후 나오는 로비.
// 7 계열의 교수들이 오염된 스킬 트리 모양으로 배치. 노드 선택 시 그 계열의
// 두 교수와 동시에 싸우는 시련이 시작됨.
// =====================================================================

// 7 계열 × 각 2명 교수 = 14명. 각 교수는 학과 테마에 맞는 스킬 셋을 사용.
// slots 는 실제 SKILL_TREE 의 스킬 id — 존재하지 않으면 castSlot 이 조용히 스킵.
const FACULTY_PROFESSORS = {
  humanities: {
    name:'인문계열', title:'HUMANITIES', color:'#c8a888',
    // 원형 배치용 각도(rad). 0 = 오른쪽, PI/2 = 아래
    profs: [
      { key:'kor',   name:'李 교수', dept:'국어국문학과',   spriteKind:'lich',   color:'#c8a888', slots:{ lmb:'m01', q:'m05', e:'m14' } },
      { key:'eng',   name:'金 교수', dept:'영어영문학과',   spriteKind:'wraith', color:'#a88860', slots:{ lmb:'m11', q:'m22', e:'m18' } },
    ]
  },
  social: {
    name:'사회과학계열', title:'SOCIAL SCIENCE', color:'#8bd8ff',
    profs: [
      { key:'biz',   name:'朴 교수', dept:'경영학과',       spriteKind:'lich',    color:'#8bd8ff', slots:{ lmb:'e21', q:'e22', e:'e29' } },
      { key:'psy',   name:'崔 교수', dept:'심리학과',       spriteKind:'seer',    color:'#5aa0dc', slots:{ lmb:'c01', q:'c05', e:'c09' } },
    ]
  },
  natural: {
    name:'자연과학계열', title:'NATURAL SCIENCE', color:'#5adcdc',
    profs: [
      { key:'phys',  name:'鄭 교수', dept:'물리학과',       spriteKind:'wraith',  color:'#8bd8ff', slots:{ lmb:'m11', q:'m22', e:'m10' } },
      { key:'chem',  name:'姜 교수', dept:'화학과',         spriteKind:'seer',    color:'#5adcac', slots:{ lmb:'n01', q:'n06', e:'e25' } },
    ]
  },
  engineering: {
    name:'공학계열', title:'ENGINEERING', color:'#e8c547',
    profs: [
      { key:'cs',    name:'趙 교수', dept:'컴퓨터공학과',   spriteKind:'colossus', color:'#8bd8ff', slots:{ lmb:'e15', q:'e34', e:'e46' } },
      { key:'robot', name:'尹 교수', dept:'로봇공학과',     spriteKind:'colossus', color:'#e8c547', slots:{ lmb:'e16', q:'e22', e:'e29' } },
    ]
  },
  medicine: {
    name:'의약계열', title:'MEDICINE', color:'#3ac762',
    profs: [
      { key:'med',   name:'林 교수', dept:'의예과',         spriteKind:'wraith',   color:'#ffffff', slots:{ lmb:'o01', q:'o06', e:'o11' } },
      { key:'phar',  name:'吳 교수', dept:'약학과',         spriteKind:'seer',     color:'#5adc2a', slots:{ lmb:'n01', q:'n06', e:'n11' } },
    ]
  },
  education: {
    name:'사범계열', title:'EDUCATION', color:'#c86ade',
    profs: [
      { key:'math',  name:'韓 교수', dept:'수학교육과',     spriteKind:'lich',     color:'#c86ade', slots:{ lmb:'m07', q:'m22', e:'m14' } },
      { key:'pe',    name:'徐 교수', dept:'체육교육과',     spriteKind:'colossus', color:'#e8c547', slots:{ lmb:'n01', q:'n06', e:'n11' } },
    ]
  },
  arts: {
    name:'예체능계열', title:'ARTS', color:'#ff80ff',
    profs: [
      { key:'paint', name:'黃 교수', dept:'회화과',         spriteKind:'seer',     color:'#ff80ff', slots:{ lmb:'m13', q:'m07', e:'m18' } },
      { key:'vocal', name:'申 교수', dept:'성악과',         spriteKind:'wraith',   color:'#ffefa8', slots:{ lmb:'o05', q:'o06', e:'o11' } },
    ]
  },
};

const FACULTY_KEYS = ['humanities','social','natural','engineering','medicine','education','arts'];

const facultyLobby = {
  cursor: 0,        // 어떤 계열에 커서
  hoverT: 0,
};

function facultyDeg(idx) {
  // 7 계열을 원형으로 배치. 12시 방향부터 시계 방향.
  const n = FACULTY_KEYS.length;
  return -Math.PI/2 + (idx / n) * Math.PI * 2;
}

function updateFacultyLobby(dt) {
  facultyLobby.hoverT += dt;
  const n = FACULTY_KEYS.length;

  // 방향키/WS 로 커서 순환
  if (keys['KeyA'] || keys['ArrowLeft'])  { keys['KeyA']=false; keys['ArrowLeft']=false; facultyLobby.cursor = (facultyLobby.cursor - 1 + n) % n; sfx('hit'); }
  if (keys['KeyD'] || keys['ArrowRight']) { keys['KeyD']=false; keys['ArrowRight']=false; facultyLobby.cursor = (facultyLobby.cursor + 1) % n; sfx('hit'); }
  if (keys['KeyW'] || keys['ArrowUp'])    { keys['KeyW']=false; keys['ArrowUp']=false; facultyLobby.cursor = (facultyLobby.cursor - 1 + n) % n; sfx('hit'); }
  if (keys['KeyS'] || keys['ArrowDown'])  { keys['KeyS']=false; keys['ArrowDown']=false; facultyLobby.cursor = (facultyLobby.cursor + 1) % n; sfx('hit'); }

  // SPACE/Enter/노드 클릭 → 시련 시작
  const cx = W/2, cy = H/2 + 6, R = 60;
  let clickedIdx = -1;
  if (mouse.down) {
    for (let i = 0; i < n; i++) {
      const a = facultyDeg(i);
      const nx = cx + Math.cos(a) * R;
      const ny = cy + Math.sin(a) * R;
      if (Math.hypot(mouse.x - nx, mouse.y - ny) < 12) { clickedIdx = i; break; }
    }
  }
  const enter = keys['Space'] || keys['Enter'] || clickedIdx >= 0;
  if (enter) {
    keys['Space']=false; keys['Enter']=false;
    if (clickedIdx >= 0) { facultyLobby.cursor = clickedIdx; mouse.down = false; }
    const key = FACULTY_KEYS[facultyLobby.cursor];
    state.facultyKey = key;
    state.dungeonMode = 'professor';
    if (typeof showMsg === 'function') showMsg(FACULTY_PROFESSORS[key].name + ' 시련 시작!', 3);
    sfx('boss');
    goTo('dungeon');
    return;
  }
  // R/ESC → 아카데미로 복귀
  if (keys['KeyR'] || keys['Escape']) {
    keys['KeyR']=false; keys['Escape']=false;
    goTo('academy');
  }
}

function renderFacultyLobby() {
  // 어두운 오염된 배경
  ctx.fillStyle = '#0a0510';
  ctx.fillRect(0, 0, W*PX, H*PX);
  // 배경 별
  if (typeof bgStars === 'function') bgStars();
  // 오염된 톤
  ctx.fillStyle = 'rgba(80, 20, 80, 0.4)';
  ctx.fillRect(0, 0, W*PX, H*PX);
  // 노이즈 스캔라인
  for (let y = 0; y < H; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, y*PX, W*PX, PX);
  }

  // 헤더
  pxDraw(0, 0, W, 14, '#1a0e2e');
  drawText('CORRUPTED SKILL TREE', W/2 - textWidth('CORRUPTED SKILL TREE')/2, 4, '#ff2d80');
  drawText('오염된 스킬 트리 - 계열을 선택하세요', W/2 - textWidth('오염된 스킬 트리 - 계열을 선택하세요')/2, 4 + 8, '#c8a8c8');

  const cx = W/2, cy = H/2 + 6, R = 60;

  // 중앙 코어 (오염된 심장)
  const pulse = 0.4 + Math.sin(facultyLobby.hoverT * 3) * 0.3;
  ctx.fillStyle = 'rgba(255, 45, 128, ' + pulse.toFixed(2) + ')';
  ctx.beginPath();
  ctx.arc(cx * PX, cy * PX, 14 * PX, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0e2e';
  ctx.beginPath();
  ctx.arc(cx * PX, cy * PX, 8 * PX, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff2d80';
  ctx.lineWidth = PX * 2;
  ctx.beginPath();
  ctx.arc(cx * PX, cy * PX, 12 * PX, 0, Math.PI * 2);
  ctx.stroke();

  // 코어 → 각 노드 연결선
  for (let i = 0; i < FACULTY_KEYS.length; i++) {
    const a = facultyDeg(i);
    const nx = cx + Math.cos(a) * R;
    const ny = cy + Math.sin(a) * R;
    const key = FACULTY_KEYS[i];
    const fac = FACULTY_PROFESSORS[key];
    ctx.strokeStyle = fac.color + '80';
    ctx.lineWidth = PX;
    ctx.beginPath();
    ctx.moveTo(cx * PX, cy * PX);
    ctx.lineTo(nx * PX, ny * PX);
    ctx.stroke();
  }

  // 각 계열 노드
  for (let i = 0; i < FACULTY_KEYS.length; i++) {
    const a = facultyDeg(i);
    const nx = cx + Math.cos(a) * R;
    const ny = cy + Math.sin(a) * R;
    const key = FACULTY_KEYS[i];
    const fac = FACULTY_PROFESSORS[key];
    const isSel = facultyLobby.cursor === i;
    // 노드 배경
    pxDraw(nx - 10, ny - 10, 20, 20, '#0a0510');
    // 컬러 링
    const ringPulse = isSel ? (0.7 + Math.sin(facultyLobby.hoverT * 6) * 0.3) : 0.6;
    ctx.strokeStyle = fac.color;
    ctx.lineWidth = PX * (isSel ? 3 : 2);
    ctx.globalAlpha = ringPulse;
    ctx.beginPath();
    ctx.arc(nx * PX, ny * PX, 10 * PX, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // 내부 도트 (교수 2명 표시)
    pxDraw(nx - 4, ny - 2, 3, 4, fac.color);
    pxDraw(nx + 1, ny - 2, 3, 4, fac.color);
    // 계열 이름 (원형 배치 - 각도에 따라 라벨 위치)
    const labelDist = 22;
    const lx = nx + Math.cos(a) * labelDist;
    const ly = ny + Math.sin(a) * labelDist;
    const label = fac.title;
    drawText(label, lx - textWidth(label)/2, ly - 3, isSel ? '#ffefa8' : fac.color);
    // 한국어 계열명
    drawText(fac.name, lx - textWidth(fac.name)/2, ly + 4, isSel ? '#ffefa8' : '#8a7ab5');
  }

  // 하단: 선택된 계열의 두 교수 프리뷰
  const selKey = FACULTY_KEYS[facultyLobby.cursor];
  const selFac = FACULTY_PROFESSORS[selKey];
  const py = H - 22;
  pxDraw(4, py, W - 8, 18, '#1a0e2e');
  pxDraw(4, py, W - 8, 1, selFac.color);
  drawText(selFac.name + ' — ' + selFac.title, 8, py + 2, selFac.color);
  const pList = selFac.profs.map(p => p.name + '(' + p.dept + ')').join('  &  ');
  drawText(pList, 8, py + 10, '#e8d9b0');

  // 안내
  drawText('WASD/화살표 SELECT   SPACE 시련 시작   R/ESC BACK', W/2 - textWidth('WASD/화살표 SELECT   SPACE 시련 시작   R/ESC BACK')/2, H - 2, '#8a7ab5');
}

// buildRoom 에서 professor 모드일 때 호출: 선택된 계열의 두 교수를 좌/우로 스폰
function spawnFacultyProfessors(room) {
  const key = state.facultyKey || 'humanities';
  const fac = FACULTY_PROFESSORS[key];
  if (!fac) return false;
  const positions = [
    { x: room.x + room.w * 0.30, y: room.y + 50 },
    { x: room.x + room.w * 0.70, y: room.y + 50 },
  ];
  for (let i = 0; i < fac.profs.length; i++) {
    const def = fac.profs[i];
    const pos = positions[i] || positions[0];
    spawnFacultyProfessor(pos, def, fac, i);
  }
  showMsg(fac.name + ' 교수진 등장!', 3);
  return true;
}

function spawnFacultyProfessor(pos, def, fac, idx) {
  // 두 교수 동시 등장이므로 각자 개별 HP 도 상향. 총합 = PROFESSOR_HP × 2 근처.
  const HP = (typeof PROFESSOR_HP !== 'undefined') ? PROFESSOR_HP : 1000000000;
  const boss = {
    x: pos.x, y: pos.y, vx: 0, vy: 0,
    r: 11,
    kind: 'professor',
    hp: HP, maxHp: HP,
    dmg: 100, speed: 50, xp: 0, gold: 0,
    hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
    isBoss: true, isProfessor: true,
    baseDmg: 5, cdMult: 0.65, mods: { fire:1.4, ice:1.4, lmbCd:0.65, lmbDmg:1.4 },
    slots: def.slots, cd: {},
    dmgReduction: 0.55, lifesteal: 0, thorns: 0, crit: 0.15, critMult: 2.5, mpCostMult: 0.5,
    perks: [], mp: 300, maxMp: 300, mpRegenBonus: 45,
    _profDef: {
      name: def.name,
      title: def.dept,        // 학과명을 title 로 노출 (기존 drawProfessor 에서 사용)
      color: def.color || fac.color,
      spriteKind: def.spriteKind || 'lich',
      key: def.key,
      faculty: fac.name,
    },
    _profEntryT: (typeof PROFESSOR_ENTRY_SEC !== 'undefined' ? PROFESSOR_ENTRY_SEC : 1.6),
    _profDeathT: 0,
    _profShootCd: 0.3 + idx * 0.15,   // 두 교수의 시전 타이밍 어긋나게 (더 빠르게)
    _profMoveAng: 0,
    _profMoveT: 0,
  };
  entities.enemies.push(boss);
  // 등장 링 이펙트 + 학과명 배너
  if (entities.fx) {
    entities.fx.push({ type:'ring', x: boss.x, y: boss.y, life: 1.2, max: 1.2, r0: 4, r1: 40, col: boss._profDef.color });
    entities.fx.push({ type:'ring', x: boss.x, y: boss.y, life: 1.6, max: 1.6, r0: 8, r1: 60, col: '#ffffff' });
  }
  state.shake = 12;
  sfx('boss');
}
