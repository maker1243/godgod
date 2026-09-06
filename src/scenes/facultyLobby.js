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
    profs: [
      { key:'kor',   name:'李 교수', dept:'국어국문학과',   spriteKind:'lich',   color:'#c8a888', slots:{ lmb:'m01', q:'m05', e:'m14' },
        visual:'dept_hangeul', signature:'burst',   rewardSkills:['m01','m02','m03'] },
      { key:'eng',   name:'金 교수', dept:'영어영문학과',   spriteKind:'wraith', color:'#a88860', slots:{ lmb:'m11', q:'m22', e:'m18' },
        visual:'dept_ink',     signature:'spread',  rewardSkills:['m05','m06'] },
    ]
  },
  social: {
    name:'사회과학계열', title:'SOCIAL SCIENCE', color:'#8bd8ff',
    profs: [
      { key:'biz',   name:'朴 교수', dept:'경영학과',       spriteKind:'lich',    color:'#8bd8ff', slots:{ lmb:'e21', q:'e22', e:'e29' },
        visual:'dept_chart',   signature:'volley',  rewardSkills:['e01','e02','e03'] },
      { key:'psy',   name:'崔 교수', dept:'심리학과',       spriteKind:'seer',    color:'#5aa0dc', slots:{ lmb:'c01', q:'c05', e:'c09' },
        visual:'dept_brain',   signature:'wave',    rewardSkills:['c01','c02'] },
    ]
  },
  natural: {
    name:'자연과학계열', title:'NATURAL SCIENCE', color:'#5adcdc',
    profs: [
      { key:'phys',  name:'鄭 교수', dept:'물리학과',       spriteKind:'wraith',  color:'#8bd8ff', slots:{ lmb:'m11', q:'m22', e:'m10' },
        visual:'dept_atom',    signature:'orbit',   rewardSkills:['m11','m12'] },
      { key:'chem',  name:'姜 교수', dept:'화학과',         spriteKind:'seer',    color:'#5adcac', slots:{ lmb:'n01', q:'n06', e:'e25' },
        visual:'dept_benzene', signature:'ring',    rewardSkills:['n01','n02','n06'] },
    ]
  },
  engineering: {
    name:'공학계열', title:'ENGINEERING', color:'#e8c547',
    profs: [
      { key:'cs',    name:'趙 교수', dept:'컴퓨터공학과',   spriteKind:'colossus', color:'#8bd8ff', slots:{ lmb:'e15', q:'e34', e:'e46' },
        visual:'dept_binary',  signature:'stream',  rewardSkills:['e15','e21','e28'] },
      { key:'robot', name:'尹 교수', dept:'로봇공학과',     spriteKind:'colossus', color:'#e8c547', slots:{ lmb:'e16', q:'e22', e:'e29' },
        visual:'dept_gear',    signature:'saw',     rewardSkills:['e16','e22'] },
    ]
  },
  medicine: {
    name:'의약계열', title:'MEDICINE', color:'#3ac762',
    profs: [
      { key:'med',   name:'林 교수', dept:'의예과',         spriteKind:'wraith',   color:'#ffffff', slots:{ lmb:'o01', q:'o06', e:'o11' },
        visual:'dept_medcross',signature:'cross',   rewardSkills:['o01','o02'] },
      { key:'phar',  name:'吳 교수', dept:'약학과',         spriteKind:'seer',     color:'#5adc2a', slots:{ lmb:'n01', q:'n06', e:'n11' },
        visual:'dept_pill',    signature:'toss',    rewardSkills:['n01','n06','n11'] },
    ]
  },
  education: {
    name:'사범계열', title:'EDUCATION', color:'#c86ade',
    profs: [
      { key:'math',  name:'韓 교수', dept:'수학교육과',     spriteKind:'lich',     color:'#c86ade', slots:{ lmb:'m07', q:'m22', e:'m14' },
        visual:'dept_infinity',signature:'infloop', rewardSkills:['m07','m22'] },
      { key:'pe',    name:'徐 교수', dept:'체육교육과',     spriteKind:'colossus', color:'#e8c547', slots:{ lmb:'n01', q:'n06', e:'n11' },
        visual:'dept_ball',    signature:'bounce',  rewardSkills:['n01','n06'] },
    ]
  },
  arts: {
    name:'예체능계열', title:'ARTS', color:'#ff80ff',
    profs: [
      { key:'paint', name:'黃 교수', dept:'회화과',         spriteKind:'seer',     color:'#ff80ff', slots:{ lmb:'m13', q:'m07', e:'m18' },
        visual:'dept_paint',   signature:'splash',  rewardSkills:['m13','m07'],
        achievements:['국제 미술제 3회 대상','현대미술관 개인전 5회','시공간의 색채 이론 저술'] },
      { key:'vocal', name:'申 교수', dept:'성악과',         spriteKind:'wraith',   color:'#ffefa8', slots:{ lmb:'o05', q:'o06', e:'o11' },
        visual:'dept_note',    signature:'chord',   rewardSkills:['o01','o05','o06'],
        achievements:['국립 오페라단 수석 소프라노','벨칸토 창법 마스터','국제 성악 콩쿠르 우승'] },
    ]
  },
  divinity: {
    name:'종교철학계열', title:'DIVINITY & PHILOSOPHY', color:'#c8b898',
    profs: [
      { key:'phil',  name:'黃 교수', dept:'철학과',         spriteKind:'lich',     color:'#c8b898', slots:{ lmb:'m01', q:'c05', e:'m14' },
        visual:'dept_hangeul', signature:'burst',   rewardSkills:['c01','c05','c09'],
        achievements:['형이상학 3부작 저자','스콜라 철학 재해석','존재론 국제 학회장'] },
      { key:'rel',   name:'洪 교수', dept:'종교학과',       spriteKind:'wraith',   color:'#a89848', slots:{ lmb:'o01', q:'o06', e:'o11' },
        visual:'dept_medcross',signature:'cross',   rewardSkills:['o01','o02','o03'],
        achievements:['비교종교학 학회 창설자','세계 종교 백과사전 편찬','종교 대화 UN 자문위원'] },
    ]
  },
  info: {
    name:'정보통신계열', title:'INFO & COMMUNICATION', color:'#5adcff',
    profs: [
      { key:'lib',   name:'白 교수', dept:'문헌정보학과',   spriteKind:'seer',     color:'#5adcff', slots:{ lmb:'e15', q:'e22', e:'e46' },
        visual:'dept_binary',  signature:'stream',  rewardSkills:['e15','e21'],
        achievements:['국립도서관 디지털 아카이브 설계','정보 검색 알고리즘 특허 12건','디지털 도서관 국제상 수상'] },
      { key:'media', name:'孫 교수', dept:'미디어커뮤니케이션학과', spriteKind:'lich', color:'#8bd8ff', slots:{ lmb:'m11', q:'c05', e:'e29' },
        visual:'dept_chart',   signature:'volley',  rewardSkills:['c01','e21'],
        achievements:['방송 저널리즘 이론서 저술','뉴미디어 대상 3회','SNS 여론 형성 연구 권위자'] },
    ]
  },
  design: {
    name:'미술디자인계열', title:'ART & DESIGN', color:'#ffb8ff',
    profs: [
      { key:'sculpt',name:'柳 교수', dept:'조소과',         spriteKind:'colossus', color:'#a08050', slots:{ lmb:'e16', q:'e22', e:'e50' },
        visual:'dept_gear',    signature:'saw',     rewardSkills:['n06','e22'],
        achievements:['공공 조형물 대상 5회','청동 캐스팅 마스터','국제 조각 심포지엄 상임회장'] },
      { key:'vdesign',name:'高 교수', dept:'시각디자인학과', spriteKind:'seer',    color:'#ff80ff', slots:{ lmb:'m13', q:'m07', e:'m18' },
        visual:'dept_paint',   signature:'splash',  rewardSkills:['m13','m18'],
        achievements:['글로벌 브랜드 아이덴티티 100+ 프로젝트','타이포그래피 정본 저술','레드닷 디자인 어워드 다수 수상'] },
    ]
  },
  language: {
    name:'외국어문학계열', title:'FOREIGN LITERATURE', color:'#dcac60',
    profs: [
      { key:'chn',   name:'呂 교수', dept:'중어중문학과',   spriteKind:'lich',    color:'#e8c547', slots:{ lmb:'m01', q:'m22', e:'m10' },
        visual:'dept_hangeul', signature:'spread',  rewardSkills:['m01','m05'],
        achievements:['논어 · 도덕경 완역','고전 한문 학회장','중국 사회과학원 명예교수'] },
      { key:'jpn',   name:'秋 교수', dept:'일어일문학과',   spriteKind:'wraith',  color:'#ff9c3d', slots:{ lmb:'m11', q:'m22', e:'m18' },
        visual:'dept_ink',     signature:'wave',    rewardSkills:['m11','m22'],
        achievements:['헤이안 시대 문학 전문가','겐지모노가타리 새 번역','일한 비교문학 정론 발표'] },
    ]
  },
};

// 기존 7 계열에도 achievements 필드 추가 (없는 곳은 spawn 시 폴백)
(function _addAchievements(){
  const ACH = {
    kor:  ['국립국어원 자문위원','한국 고전문학 연구 30년','국제 한국학 학회장'],
    eng:  ['셰익스피어 전집 새 번역','현대 영문학 이론서 3권','옥스포드 방문 교수'],
    biz:  ['글로벌 500대 기업 컨설팅','전략경영 표준 교재 집필','MBA 최우수 강의상 5회'],
    psy:  ['인지행동치료 국내 도입','임상심리 학회장','트라우마 치료 매뉴얼 저술'],
    phys: ['양자장론 국제 논문 200편','노벨 물리학상 후보 지명','LIGH 협력 연구원'],
    chem: ['유기합성 신반응 발견','왕립화학회 명예회원','친환경 촉매 특허 40건'],
    cs:   ['분산 시스템 표준 저술','ACM 튜링상 수상 후보','오픈소스 커널 커미터'],
    robot:['휴머노이드 국제 대회 1위','로봇 팔 특허 25건','산업로봇 표준 위원'],
    med:  ['외과 수술법 세 가지 개발','WHO 자문의사','국내 최다 이식 수술 집도'],
    phar: ['신약 임상 3상 성공 2회','부작용 데이터베이스 구축','약제학회 학술상 수상'],
    math: ['정수론 미해결 문제 부분 증명','필즈상 최종 후보','수학 올림피아드 대표팀 감독'],
    pe:   ['국가대표 축구 전 감독','스포츠과학 학회장','아시안게임 금메달 3개'],
  };
  for (const facKey of Object.keys(FACULTY_PROFESSORS)) {
    const fac = FACULTY_PROFESSORS[facKey];
    for (const p of fac.profs) {
      if (!p.achievements && ACH[p.key]) p.achievements = ACH[p.key];
      if (!p.achievements) p.achievements = ['우수 강의상 다수','국제 학회 초청 강연','산학 협력 프로젝트 리더'];
    }
  }
})();

const FACULTY_KEYS = ['humanities','social','natural','engineering','medicine','education','arts','divinity','info','design','language'];

const facultyLobby = {
  cursor: 0,        // 어떤 계열에 커서 (또는 -1 = 중앙 교장)
  hoverT: 0,
  rewardPopup: null,   // 열린 보상 팝업 { facKey, cursor }
};

// 교장 정의 - 모든 계열 클리어 시 오염된 트리 중앙에 등장
const PRINCIPAL_DEF = {
  key: 'principal',
  name: '崔 총장',
  dept: '교장 · 아카데미 총장',
  faculty: '아카데미 최고 권위',
  spriteKind: 'lich',
  color: '#ff0080',
  slots: { lmb: 'm11', q: 'e50', e: 'm14' },   // LIGHTNING / ANNIHILATE / TIMESTOP
  visual: 'omega_shot',
  signature: 'ring',
  rewardSkills: ['e50','m14','n11','c09','o11'],
  achievements: [
    '아카데미 총장 재임 20년',
    '7 계열 통합 학제 창설자',
    '노벨상 수상자 12명 지도',
    '금지된 스킬 트리 봉인 해제',
    '오염된 마법 이론의 최고 권위',
  ],
};

function allFacultiesCleared() {
  if (!state.facultyCleared) return false;
  for (const k of FACULTY_KEYS) {
    if (!state.facultyCleared[k]) return false;
  }
  return true;
}
function principalDefeated() { return state.principalDefeated > 0; }

function facultyDeg(idx) {
  // 7 계열을 원형으로 배치. 12시 방향부터 시계 방향.
  const n = FACULTY_KEYS.length;
  return -Math.PI/2 + (idx / n) * Math.PI * 2;
}

function updateFacultyLobby(dt) {
  facultyLobby.hoverT += dt;
  const n = FACULTY_KEYS.length;

  // === 보상 팝업 활성 시: 팝업 내 조작만 처리하고 나머지 잠금 ===
  if (facultyLobby.rewardPopup) {
    _updateRewardPopup(dt);
    return;
  }

  // 방향키/WS 로 커서 순환
  if (keys['KeyA'] || keys['ArrowLeft'])  { keys['KeyA']=false; keys['ArrowLeft']=false; facultyLobby.cursor = (facultyLobby.cursor - 1 + n) % n; sfx('hit'); }
  if (keys['KeyD'] || keys['ArrowRight']) { keys['KeyD']=false; keys['ArrowRight']=false; facultyLobby.cursor = (facultyLobby.cursor + 1) % n; sfx('hit'); }
  if (keys['KeyW'] || keys['ArrowUp'])    { keys['KeyW']=false; keys['ArrowUp']=false; facultyLobby.cursor = (facultyLobby.cursor - 1 + n) % n; sfx('hit'); }
  if (keys['KeyS'] || keys['ArrowDown'])  { keys['KeyS']=false; keys['ArrowDown']=false; facultyLobby.cursor = (facultyLobby.cursor + 1) % n; sfx('hit'); }

  // SPACE/Enter/노드 클릭 → 시련 시작
  const cx = W/2, cy = H/2 + 6, R = 60;
  let clickedIdx = -1;
  let clickedPrincipal = false;
  if (mouse.down) {
    for (let i = 0; i < n; i++) {
      const a = facultyDeg(i);
      const nx = cx + Math.cos(a) * R;
      const ny = cy + Math.sin(a) * R;
      if (Math.hypot(mouse.x - nx, mouse.y - ny) < 12) { clickedIdx = i; break; }
    }
    // 중앙 교장 노드 (전 계열 클리어 후 등장)
    if (clickedIdx < 0 && allFacultiesCleared() && Math.hypot(mouse.x - cx, mouse.y - cy) < 14) {
      clickedPrincipal = true;
    }
  }
  const enter = keys['Space'] || keys['Enter'] || clickedIdx >= 0 || clickedPrincipal;
  if (enter) {
    keys['Space']=false; keys['Enter']=false;
    if (clickedIdx >= 0) { facultyLobby.cursor = clickedIdx; mouse.down = false; }
    if (clickedPrincipal || facultyLobby.cursor === -1) {
      // 교장 전투 진입 - 모든 계열 클리어 필요
      if (!allFacultiesCleared()) {
        if (typeof showMsg === 'function') showMsg('모든 계열을 먼저 정복해야 합니다', 3);
        sfx('hurt');
        return;
      }
      mouse.down = false;
      state.facultyKey = 'principal';
      state.dungeonMode = 'professor';
      if (typeof showMsg === 'function') showMsg('교장 ' + PRINCIPAL_DEF.name + ' 등장!', 4);
      sfx('boss');
      goTo('dungeon');
      return;
    }
    const key = FACULTY_KEYS[facultyLobby.cursor];
    // 이미 이 계열을 클리어했다면 → 사기 스킬 4개 보상 팝업 열기
    if (state.facultyCleared && state.facultyCleared[key] > 0 && typeof FACULTY_REWARD_SKILLS !== 'undefined' && FACULTY_REWARD_SKILLS[key]) {
      facultyLobby.rewardPopup = { facKey: key, cursor: 0 };
      if (typeof showMsg === 'function') showMsg(FACULTY_PROFESSORS[key].name + ' 보상 열람', 2);
      sfx('door');
      return;
    }
    // 아직 클리어 안 됨 → 시련 진입
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

  // 중앙 코어 (오염된 심장 / 교장 노드)
  const allCleared = allFacultiesCleared();
  const pulse = 0.4 + Math.sin(facultyLobby.hoverT * (allCleared ? 6 : 3)) * (allCleared ? 0.5 : 0.3);
  if (allCleared) {
    // 교장 노드 활성 - 붉게 타오르는 심장
    ctx.fillStyle = 'rgba(255, 0, 60, ' + (pulse + 0.2).toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(cx * PX, cy * PX, 20 * PX, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a0510';
    ctx.beginPath(); ctx.arc(cx * PX, cy * PX, 12 * PX, 0, Math.PI * 2); ctx.fill();
    // 외곽 반짝이는 링
    ctx.strokeStyle = '#ff0060';
    ctx.lineWidth = PX * 3;
    ctx.beginPath(); ctx.arc(cx * PX, cy * PX, 16 * PX, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + pulse.toFixed(2) + ')';
    ctx.lineWidth = PX;
    ctx.beginPath(); ctx.arc(cx * PX, cy * PX, 22 * PX, 0, Math.PI * 2); ctx.stroke();
    // "PRINCIPAL" 라벨
    drawText('교장 崔', cx - textWidth('교장 崔')/2, cy - 3, '#ffefa8');
    // 아래 힌트
    const hint = principalDefeated() ? '재도전' : '[SPACE] 도전!';
    drawText(hint, cx - textWidth(hint)/2, cy + R + 12, '#ff2d80');
  } else {
    ctx.fillStyle = 'rgba(255, 45, 128, ' + pulse.toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(cx * PX, cy * PX, 14 * PX, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a0e2e';
    ctx.beginPath(); ctx.arc(cx * PX, cy * PX, 8 * PX, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff2d80';
    ctx.lineWidth = PX * 2;
    ctx.beginPath(); ctx.arc(cx * PX, cy * PX, 12 * PX, 0, Math.PI * 2); ctx.stroke();
    // 진행 상황 표시
    let done = 0;
    for (const k of FACULTY_KEYS) if (state.facultyCleared && state.facultyCleared[k]) done++;
    drawText(done + '/' + FACULTY_KEYS.length, cx - textWidth(done + '/' + FACULTY_KEYS.length)/2, cy - 3, '#c8a8c8');
  }

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
  drawText('WASD/화살표 SELECT   SPACE 시련/보상   R/ESC BACK', W/2 - textWidth('WASD/화살표 SELECT   SPACE 시련/보상   R/ESC BACK')/2, H - 2, '#8a7ab5');

  // 보상 팝업이 열려있으면 위에 오버레이
  if (facultyLobby.rewardPopup) _renderRewardPopup();
}

// === 사기 스킬 보상 팝업 ===
const _REWARD_SLOTS = ['lmb','q','e','passive'];
const _REWARD_LABELS = { lmb:'일반 공격', q:'스킬', e:'궁극기', passive:'패시브' };

function _updateRewardPopup(dt) {
  const pop = facultyLobby.rewardPopup;
  const set = FACULTY_REWARD_SKILLS[pop.facKey];
  if (!set) { facultyLobby.rewardPopup = null; return; }
  const n = _REWARD_SLOTS.length;
  // 커서 이동
  if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; pop.cursor = (pop.cursor - 1 + n) % n; sfx('hit'); }
  if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; pop.cursor = (pop.cursor + 1) % n; sfx('hit'); }
  // 클릭으로 커서 이동 + 두 번째 클릭 = 구매
  let clickIdx = -1;
  if (mouse.down && Array.isArray(window._rewardPopupRows)) {
    for (const r of window._rewardPopupRows) {
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        clickIdx = r.idx; break;
      }
    }
  }
  if (clickIdx >= 0) {
    mouse.down = false;
    if (pop.cursor === clickIdx) { _buyReward(set, _REWARD_SLOTS[pop.cursor]); }
    else { pop.cursor = clickIdx; sfx('hit'); }
  }
  // SPACE/Enter 로 구매
  if (keys['Space'] || keys['Enter']) {
    keys['Space']=false; keys['Enter']=false;
    _buyReward(set, _REWARD_SLOTS[pop.cursor]);
  }
  // F 로 장착 (이미 소유한 스킬만)
  if (keys['KeyF']) {
    keys['KeyF']=false;
    _equipReward(set, _REWARD_SLOTS[pop.cursor]);
  }
  // ESC/R 닫기
  if (keys['Escape'] || keys['KeyR']) {
    keys['Escape']=false; keys['KeyR']=false;
    facultyLobby.rewardPopup = null;
  }
}

function _equipReward(set, slotKey) {
  const s = set[slotKey];
  if (!s) return;
  const lv = state.ownedSkills[s.id] || 0;
  if (lv <= 0) { if (typeof showMsg === 'function') showMsg('먼저 구매 필요', 1.5); sfx('hurt'); return; }
  if (s.slot === 'passive') { if (typeof showMsg === 'function') showMsg('패시브는 자동 적용', 1.5); return; }
  // 장착 토글
  if (state.equippedSlots[s.slot] === s.id) {
    state.equippedSlots[s.slot] = null;
    if (typeof showMsg === 'function') showMsg('장착 해제: ' + s.name, 1.8);
  } else {
    state.equippedSlots[s.slot] = s.id;
    if (typeof showMsg === 'function') showMsg('장착: ' + s.name + ' [' + s.slot.toUpperCase() + ']', 1.8);
  }
  if (typeof saveAccountData === 'function') saveAccountData();
  sfx('hit');
}

function _buyReward(set, slotKey) {
  const s = set[slotKey];
  if (!s) return;
  const lv = state.ownedSkills[s.id] || 0;
  const maxLv = s.maxLv || 1;
  if (lv >= maxLv) { if (typeof showMsg === 'function') showMsg('이미 소유', 1.5); sfx('hurt'); return; }
  if ((state.research || 0) < s.cost) { if (typeof showMsg === 'function') showMsg('RP 부족 (필요: ' + s.cost + ')', 2); sfx('hurt'); return; }
  state.research -= s.cost;
  state.ownedSkills[s.id] = maxLv;
  // 액티브 스킬이면 자동 장착
  if (s.slot !== 'passive' && !state.equippedSlots[s.slot]) state.equippedSlots[s.slot] = s.id;
  if (typeof saveAccountData === 'function') saveAccountData();
  if (typeof showMsg === 'function') showMsg('구매 완료: ' + s.name, 2.5);
  sfx('level');
}

function _renderRewardPopup() {
  const pop = facultyLobby.rewardPopup;
  if (!pop) { window._rewardPopupRows = null; return; }
  const set = FACULTY_REWARD_SKILLS[pop.facKey];
  const fac = FACULTY_PROFESSORS[pop.facKey];
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);
  const bx = 20, by = 18, bw = W - 40, bh = H - 36;
  pxDraw(bx, by, bw, bh, '#1a0e2e');
  pxDraw(bx, by, bw, 1, fac.color);
  pxDraw(bx, by + bh - 1, bw, 1, fac.color);
  pxDraw(bx, by, 1, bh, fac.color);
  pxDraw(bx + bw - 1, by, 1, bh, fac.color);
  // 헤더
  const title = fac.name + ' — 사기 스킬 보상';
  drawText(title, bx + bw/2 - textWidth(title)/2, by + 4, fac.color);
  const rpText = '보유 RP: ' + (state.research || 0);
  drawText(rpText, bx + bw - textWidth(rpText) - 6, by + 4, '#8bd8ff');
  pxDraw(bx + 4, by + 14, bw - 8, 1, '#3a1e5c');

  // 4 슬롯 행
  window._rewardPopupRows = [];
  const rowY0 = by + 20, rowH = 30;
  for (let i = 0; i < _REWARD_SLOTS.length; i++) {
    const slotKey = _REWARD_SLOTS[i];
    const s = set[slotKey];
    const ry = rowY0 + i * rowH;
    const isSel = pop.cursor === i;
    const owned = (state.ownedSkills[s.id] || 0) >= (s.maxLv || 1);
    const canBuy = !owned && (state.research || 0) >= s.cost;
    if (isSel) pxDraw(bx + 4, ry, bw - 8, rowH - 2, '#2a1548');
    // 카테고리 라벨 (일반 공격 / 스킬 / 궁극기 / 패시브)
    drawText('[' + _REWARD_LABELS[slotKey] + ']', bx + 8, ry + 2, fac.color);
    // 이름
    drawText(s.name, bx + 62, ry + 2, owned ? '#3ac762' : (isSel ? '#ffefa8' : '#e8d9b0'));
    // 설명
    drawText(s.desc, bx + 8, ry + 12, '#c8a8c8');
    // 비용 + 상태
    let stat = '';
    let statCol = '#5a4a80';
    if (owned)      { stat = '✓ 소유';        statCol = '#3ac762'; }
    else if (canBuy){ stat = s.cost + ' RP';  statCol = '#ffefa8'; }
    else            { stat = s.cost + ' RP';  statCol = '#c81616'; }
    drawText(stat, bx + bw - textWidth(stat) - 8, ry + 6, statCol);
    window._rewardPopupRows.push({ idx: i, x: bx + 4, y: ry, w: bw - 8, h: rowH - 2 });
  }

  // 하단 안내
  drawText('WS/TAP SELECT   SPACE BUY   F EQUIP   ESC/R BACK',
    bx + bw/2 - textWidth('WS/TAP SELECT   SPACE BUY   F EQUIP   ESC/R BACK')/2,
    by + bh - 9, '#8a7ab5');
}

// buildRoom 에서 professor 모드일 때 호출: 선택된 계열의 두 교수를 좌/우로 스폰
function spawnFacultyProfessors(room) {
  const key = state.facultyKey || 'humanities';
  if (key === 'principal') { spawnPrincipal(room); return true; }
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

// === 교장 스폰 ===
function spawnPrincipal(room) {
  const def = PRINCIPAL_DEF;
  const HP = 75000000000;    // 75B - 교수의 5배 × 15배 상향
  const boss = {
    x: room.x + room.w/2, y: room.y + 60, vx: 0, vy: 0,
    r: 15,
    kind: 'professor',
    hp: HP, maxHp: HP,
    dmg: 3750, speed: 60, xp: 0, gold: 0,
    hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
    isBoss: true, isProfessor: true,
    _isPrincipal: true,
    baseDmg: 180, cdMult: 0.45, mods: { fire: 2, ice: 2, lmbCd: 0.4, lmbDmg: 2 },
    slots: def.slots, cd: {},
    dmgReduction: 0.65, lifesteal: 0, thorns: 0, crit: 0.35, critMult: 3, mpCostMult: 0.25,
    perks: [], mp: 500, maxMp: 500, mpRegenBonus: 80,
    _profDef: {
      name: def.name,
      title: def.dept,
      color: def.color,
      spriteKind: def.spriteKind,
      key: def.key,
      faculty: def.faculty,
      visual: def.visual,
      signature: def.signature,
      rewardSkills: def.rewardSkills,
      achievements: def.achievements,
    },
    _profEntryT: 6,       // 교장 등장은 훨씬 김 (업적 많음)
    _profEntryTotal: 6,
    _profDeathT: 0,
    _profShootCd: 0.2,
    _profSigCd: 2,
    _profMoveAng: 0,
    _profMoveT: 0,
    _profPhase: 1,
    _profPhaseT: 0,
  };
  entities.enemies.push(boss);
  showMsg('교장 ' + def.name + ' 등장! — 극한의 적', 4);
  sfx('boss');
  state.shake = 25;
  if (entities.fx) {
    entities.fx.push({ type:'ring', x: boss.x, y: boss.y, life: 2.0, max: 2.0, r0: 4, r1: 80, col: '#ff0060' });
    entities.fx.push({ type:'ring', x: boss.x, y: boss.y, life: 2.4, max: 2.4, r0: 8, r1: 120, col: '#ffffff' });
  }
}

function spawnFacultyProfessor(pos, def, fac, idx) {
  // 두 교수 동시 등장이므로 각자 개별 HP 도 상향. 총합 = PROFESSOR_HP × 2 근처.
  const HP = (typeof PROFESSOR_HP !== 'undefined') ? PROFESSOR_HP : 1000000000;
  const boss = {
    x: pos.x, y: pos.y, vx: 0, vy: 0,
    r: 11,
    kind: 'professor',
    hp: HP, maxHp: HP,
    dmg: 1500, speed: 50, xp: 0, gold: 0,
    hitFlash: 0, freeze: 0, slow: 0, stun: 0, attackCd: 0,
    isBoss: true, isProfessor: true,
    baseDmg: 75, cdMult: 0.65, mods: { fire:1.4, ice:1.4, lmbCd:0.65, lmbDmg:1.4 },
    slots: def.slots, cd: {},
    dmgReduction: 0.55, lifesteal: 0, thorns: 0, crit: 0.15, critMult: 2.5, mpCostMult: 0.5,
    perks: [], mp: 300, maxMp: 300, mpRegenBonus: 45,
    _profDef: {
      name: def.name,
      title: def.dept,
      color: def.color || fac.color,
      spriteKind: def.spriteKind || 'lich',
      key: def.key,
      faculty: fac.name,
      visual: def.visual || null,
      signature: def.signature || null,
      rewardSkills: def.rewardSkills || [],
      achievements: def.achievements || [],
    },
    _profSigCd: 3 + Math.random() * 2,
    _profPhase: 1,        // 현재 페이즈 (1 또는 2)
    _profPhaseT: 0,       // 페이즈 전환 배너 남은 시간
    _profEntryT: 4.5,     // 업적 소개 애니메이션 시간 (기본 1.6 → 4.5)
    _profEntryTotal: 4.5,
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
