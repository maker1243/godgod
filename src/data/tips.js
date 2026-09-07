// =====================================================================
// Random Tips - 아카데미 하단에 랜덤 팁 순환 표시.
// 30초마다 자동 순환. 40개의 팁.
// =====================================================================

const TIPS = [
  'ESC 로 던전에서 일시정지 할 수 있어요.',
  '상자는 SPACE 로 열어요. 5% 확률 잭팟!',
  '축복 3개를 특정 조합으로 모으면 시너지가 발동해요.',
  '엘라라와 대화하면 유대 조건 힌트를 볼 수 있어요.',
  '트레잇 (트레인) 은 5슬롯 자유 스왑이니 자주 바꿔보세요.',
  'APEX 티어는 플레이어 데미지에 몹 HP 가 맞춰져요.',
  '주간 도전은 매주 월요일 리셋. CODEX 의 WEEKLY 탭에서 확인.',
  '보스전 전에 훈련장(TRAIN) 에서 DPS 를 확인하세요.',
  '커스터마이즈(STYLE) 문에서 트레일을 사면 눈에 띄어요.',
  '무피격으로 방 클리어하면 +100 RP 보너스!',
  '콤보는 3초 안에 연속 킬. 티어 진입 시 추가 RP.',
  '축복 카드는 층 이동 시 3개 중 1개 선택.',
  'CIPHER 문에서 시저/아핀 암호 풀면 PROF 문 해금.',
  '교수 격파 후 계열 로비 재진입 시 후일담 자동 재생.',
  '엘라라 유대 10 단계에서 ARCANA CROWN 아티팩트 획득.',
  '아침 이벤트는 매일 다름. 상단 티커 확인.',
  'RENN 은 스토리 조각을 좋아해요. 5개 이상이면 +500 RP.',
  'VESK 는 GPA 4.5 이상이면 존경심으로 +100 G.',
  'LYRA 는 아레나 30웨이브 이상이면 +3000 RP.',
  'THORNE 는 총 RP 1억 이상이면 +100만 RP.',
  'MURA 는 커스터마이즈 5개 이상이면 BLOOD TRAIL 선물.',
  '몹 접두 (5% 확률) 는 색상 링으로 표시돼요.',
  '접두 폭발성 몹은 사망 시 12발 폭발 조심!',
  '접두 그림자 분신 몹은 절반 HP 로 부활 1회.',
  '접두 맹독은 히트 시 4초 독 DoT.',
  '레거시 관록은 로그 스케일 비용. 계속 사도 끝이 없어요.',
  '아티팩트는 매일 5개 로테이션. 오늘의 오퍼 확인!',
  '축복 GLASS CANNON: DMG x3 · HP -50%. 리스크 vs 리워드.',
  '축복 WILDCARD: 다음 층 축복 3개 랜덤 획득.',
  '축복 ORBITAL: 궤도를 도는 오브 2개 자동 공격.',
  '스킬 트리를 MAX 로 채우면 시련 도전 자격 획득.',
  'ULTRA 시련은 40초 제한. 실패 시 10분 밴.',
  '휴학 (Retreat) 하면 진행 RP 는 획득. 죽으면 반은 손실.',
  '죽은 자리에 유품 파우치. 다음 던전에서 회수하세요.',
  'AUTO POUCH 아티팩트 있으면 유품 자동 회수.',
  '엘리트 몹 (5%) 은 금색 링. RP 조각 확정 드롭.',
  '보스 킬 시 슬로모! 화려한 순간을 즐기세요.',
  '축복 IMMORTAL: HP 10 이하 안 떨어짐 (60s CD).',
  '축복 LAST WARD: HP 1 이하 사망 무효 (60s CD).',
  '게임 모드는 CODEX 의 MODES 탭에서 토글. Hardcore 는 x3 RP!',
];

const tipsState = {
  currentIdx: 0,
  changeT: 0,
};

function tickTips(dt) {
  tipsState.changeT += dt;
  if (tipsState.changeT >= 30) {   // 30초마다
    tipsState.changeT = 0;
    tipsState.currentIdx = Math.floor(Math.random() * TIPS.length);
  }
}

function currentTip() {
  return TIPS[tipsState.currentIdx] || '';
}

// 아카데미 하단에 팁 렌더
function drawTipHud() {
  const tip = currentTip();
  if (!tip) return;
  const s = '💡 ' + tip;
  const tw = textWidth(s);
  const bx = W/2 - tw/2 - 4;
  const by = H - 22;
  pxDraw(bx, by, tw + 8, 8, '#0a0512');
  pxDraw(bx, by, tw + 8, 1, '#3a1e5c');
  pxDraw(bx, by + 7, tw + 8, 1, '#3a1e5c');
  drawText(s, W/2 - tw/2, by + 1, '#8bd8ff');
}
