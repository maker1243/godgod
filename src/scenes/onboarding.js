// =====================================================================
// Onboarding (H 키 도움말) - 5 페이지 튜토리얼.
// 첫 계정 진입 시 자동 표시. 이후 H 로 언제든 재열람.
// =====================================================================

const onboarding = {
  active: false,
  page: 0,
};

const ONBOARDING_PAGES = [
  { title:'그랜드 아르카나 아카데미에 오신 것을 환영합니다',
    lines:[
      'WASD 로 이동, 마우스로 조준, 좌클릭으로 파이어볼 발사.',
      '아카데미 로비의 문 앞에서 [SPACE] 로 상호작용.',
      '먼저 [LIBRARY] 문으로 도서관을 방문해 보세요.',
      '',
      '이 도움말은 언제든 [H] 키로 다시 열 수 있습니다.',
    ] },
  { title:'도서관과 스킬 트리',
    lines:[
      'RESEARCH 포인트(RP)로 스킬을 구매합니다.',
      '5개 종파 (MAGIC / ENGIN / NATURE / CHAOS / ORDER).',
      '탭 클릭 또는 [1~5] 로 종파 전환, WASD 로 노드 이동.',
      '[SPACE] 로 구매, [F] 로 슬롯 장착.',
      '슬롯: LMB(좌클릭) / Q / E + 3개 포션 슬롯.',
    ] },
  { title:'던전과 난이도',
    lines:[
      '[DUNGEON] 문으로 5개 방을 클리어하면 최종 보스.',
      '아카데미 중앙 상단 배너 클릭 (또는 [C]) 으로 난이도 조절.',
      '높은 티어는 잡몹 HP/DMG 폭증 대신 RP·GPA 보상 대폭 증가.',
      '[EXTRA] / [EXTREME] / [INFERNO] 는 최종 클리어 후 순차 해금.',
    ] },
  { title:'시련과 MAX/ULTRA 스킬',
    lines:[
      '종파의 모든 기본 스킬을 MAX 로 찍으면 도서관에서 [Z] 로 시련 입장.',
      '60초 안에 시련 보스 처치 시 MAX 트리 해금 (25개 강력 스킬).',
      '모든 MAX 스킬 MAX 후 [Z] 로 2단계 시련 (40초, HP 1e7 보스).',
      '2단계 통과 시 ULTRA 트리 해금 (20개 최상위 스킬).',
    ] },
  { title:'CIPHER 문과 계열 시련 (Floor 2)',
    lines:[
      '로비 붉은 문 [CIPHER] 로 시저/아핀 암호 퀴즈 → RP 획득.',
      '암호 1회 성공 시 푸른 문 [PROF] 해금 → 오염된 스킬 트리 로비.',
      '11 계열 각각 두 명의 교수 태그팀 시련. 통과 시 계열 4개 사기 스킬 열람.',
      '모든 계열 정복 후 로비 중앙에서 [교장 崔 총장] 3페이즈 최종전.',
      '',
      '아카데미 좌상단 [?] 클릭 또는 [H] 키로 도움말 재열람.',
    ] },
];

function toggleOnboarding() {
  onboarding.active = !onboarding.active;
  onboarding.page = 0;
}

function updateOnboarding(dt) {
  if (!onboarding.active) return false;
  const n = ONBOARDING_PAGES.length;
  if (keys['ArrowRight'] || keys['KeyD'] || keys['Space'] || keys['Enter']) {
    keys['ArrowRight']=false; keys['KeyD']=false; keys['Space']=false; keys['Enter']=false;
    if (onboarding.page < n - 1) { onboarding.page++; sfx('hit'); }
    else { onboarding.active = false; state.tutorialSeen = true; if (typeof saveAccountData === 'function') saveAccountData(); }
    return true;
  }
  if (keys['ArrowLeft'] || keys['KeyA']) {
    keys['ArrowLeft']=false; keys['KeyA']=false;
    if (onboarding.page > 0) { onboarding.page--; sfx('hit'); }
    return true;
  }
  if (keys['Escape'] || keys['KeyH']) {
    keys['Escape']=false; keys['KeyH']=false;
    onboarding.active = false;
    state.tutorialSeen = true;
    if (typeof saveAccountData === 'function') saveAccountData();
    return true;
  }
  // 클릭으로 다음/이전
  if (mouse.down && Array.isArray(window._onboardingBtns)) {
    for (const b of window._onboardingBtns) {
      if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) {
        mouse.down = false;
        if (b.act === 'prev' && onboarding.page > 0) { onboarding.page--; sfx('hit'); }
        else if (b.act === 'next') {
          if (onboarding.page < n - 1) { onboarding.page++; sfx('hit'); }
          else { onboarding.active = false; state.tutorialSeen = true; if (typeof saveAccountData === 'function') saveAccountData(); }
        }
        else if (b.act === 'close') { onboarding.active = false; state.tutorialSeen = true; if (typeof saveAccountData === 'function') saveAccountData(); }
        return true;
      }
    }
  }
  return true;   // 활성 중엔 항상 나머지 조작 잠금
}

function renderOnboarding() {
  if (!onboarding.active) { window._onboardingBtns = null; return; }
  const page = ONBOARDING_PAGES[onboarding.page];
  const n = ONBOARDING_PAGES.length;
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);
  const bx = 20, by = 20, bw = W - 40, bh = H - 40;
  pxDraw(bx, by, bw, bh, '#1a0e2e');
  pxDraw(bx, by, bw, 1, '#ffefa8');
  pxDraw(bx, by + bh - 1, bw, 1, '#ffefa8');
  pxDraw(bx, by, 1, bh, '#ffefa8');
  pxDraw(bx + bw - 1, by, 1, bh, '#ffefa8');
  // 헤더
  drawText('도움말  ' + (onboarding.page + 1) + '/' + n, bx + bw/2 - textWidth('도움말  ' + (onboarding.page + 1) + '/' + n)/2, by + 4, '#ffefa8');
  pxDraw(bx + 4, by + 14, bw - 8, 1, '#3a1e5c');
  // 제목
  drawText(page.title, bx + bw/2 - textWidth(page.title)/2, by + 20, '#e8c547');
  // 본문 라인
  for (let i = 0; i < page.lines.length; i++) {
    drawText(page.lines[i], bx + 12, by + 34 + i * 10, '#e8d9b0');
  }
  // 하단 버튼들
  const btnY = by + bh - 14;
  window._onboardingBtns = [];
  if (onboarding.page > 0) {
    const bl = { x: bx + 8, y: btnY - 2, w: 42, h: 10, act:'prev' };
    pxDraw(bl.x, bl.y, bl.w, bl.h, '#2a1548');
    drawText('◀ 이전', bl.x + 4, bl.y + 2, '#ffefa8');
    window._onboardingBtns.push(bl);
  }
  const closeBtn = { x: bx + bw/2 - 24, y: btnY - 2, w: 48, h: 10, act:'close' };
  pxDraw(closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h, '#3a1548');
  drawText('닫기 (ESC)', closeBtn.x + 4, closeBtn.y + 2, '#ffefa8');
  window._onboardingBtns.push(closeBtn);
  const nextLabel = (onboarding.page < n - 1) ? '다음 ▶' : '시작하기';
  const nb = { x: bx + bw - 8 - 48, y: btnY - 2, w: 48, h: 10, act:'next' };
  pxDraw(nb.x, nb.y, nb.w, nb.h, '#2a1548');
  drawText(nextLabel, nb.x + 4, nb.y + 2, '#ffefa8');
  window._onboardingBtns.push(nb);
  // 진행 도트
  const dotY = by + bh - 24;
  const dotW = 4, dotGap = 4;
  const totalW = n * dotW + (n - 1) * dotGap;
  const dsx = bx + bw/2 - totalW/2;
  for (let i = 0; i < n; i++) {
    pxDraw(dsx + i * (dotW + dotGap), dotY, dotW, dotW, i === onboarding.page ? '#ffefa8' : '#5a4a80');
  }
}
