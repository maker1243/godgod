// =====================================================================
// Bullet rendering + level-up UI + ending UI
// =====================================================================

// =====================================================================
// 총알 렌더링 - visual 태그별로 완전히 다른 그림/궤적
// =====================================================================
function drawBullet(b) {
  const v = b.visual || (b.kind === 'ice' ? 'icebolt' : 'fireball');
  const ang = Math.atan2(b.vy, b.vx);

  // 궤적 파티클 스폰 (렌더 시점이지만 시각 효과라 여기서)
  if (b.trailChance && Math.random() < b.trailChance) {
    spawnParticle(b.x, b.y, b.trail || '#ffefa8', 0.25, 2, 8);
  }

  // === 전체 총알에 애프터이미지 (모션 강조) ===
  if (b.vx || b.vy) {
    const trailCol = b.color || (b.kind === 'ice' ? '#8bd8ff' : (b.kind === 'fire' ? '#ff9c3d' : '#c86ade'));
    ctx.globalAlpha = 0.35;
    pxDraw(b.x - Math.cos(ang)*3, b.y - Math.sin(ang)*3, (b.r || 3) - 1 || 2, (b.r || 3) - 1 || 2, trailCol);
    ctx.globalAlpha = 0.2;
    pxDraw(b.x - Math.cos(ang)*6, b.y - Math.sin(ang)*6, Math.max(1, (b.r || 3) - 2), Math.max(1, (b.r || 3) - 2), trailCol);
    ctx.globalAlpha = 1;
  }

  // 스킬 이름 → visual 자동 매핑 카탈로그 (100+ 종). 등록된 항목이면 그걸로 그리고 종료.
  if (typeof BULLET_VISUALS !== 'undefined' && BULLET_VISUALS[v]) {
    BULLET_VISUALS[v].draw(b, ang);
    return;
  }

  switch (v) {
    case 'fireball':
      // 큰 오렌지 파이어볼 + 노란 궤적 잔상
      if (Math.random() < 0.5) spawnParticle(b.x - Math.cos(ang)*3, b.y - Math.sin(ang)*3, '#ffbb55', 0.35, 3, 15);
      drawSprite(SPR_FIRE, FIRE_PAL, b.x - 3, b.y - 3);
      break;

    case 'spark':
      // 작고 빠른 노란 스파크 - 늘어진 라인
      ctx.strokeStyle = '#ffefa8';
      ctx.lineWidth = PX * 2;
      ctx.beginPath();
      ctx.moveTo((b.x - Math.cos(ang)*5)*PX, (b.y - Math.sin(ang)*5)*PX);
      ctx.lineTo(b.x*PX, b.y*PX);
      ctx.stroke();
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffff88');
      break;

    case 'lightning':
      // 즉시 명중 지그재그 - 얇은 밝은 파랑
      ctx.strokeStyle = '#8bd8ff';
      ctx.lineWidth = PX;
      ctx.beginPath();
      let lx = b.x - Math.cos(ang)*20, ly = b.y - Math.sin(ang)*20;
      ctx.moveTo(lx*PX, ly*PX);
      for (let i = 0; i < 4; i++) {
        lx += Math.cos(ang)*5 + (Math.random()-0.5)*3;
        ly += Math.sin(ang)*5 + (Math.random()-0.5)*3;
        ctx.lineTo(lx*PX, ly*PX);
      }
      ctx.stroke();
      pxDraw(b.x - 2, b.y - 2, 4, 4, '#ffffff');
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#8bd8ff');
      break;

    case 'icebolt':
      // 얼음 조각 + 반짝임
      drawSprite(SPR_ICE, ICE_PAL, b.x - 2, b.y - 4);
      if (Math.random() < 0.4) spawnParticle(b.x, b.y, '#ddf5ff', 0.3, 2, 8);
      break;

    case 'blizzard':
      // 파란 눈송이 조각
      pxDraw(b.x - 2, b.y - 2, 4, 4, '#8bd8ff');
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffffff');
      break;

    case 'arcane':
      // 자주색 미사일
      pxDraw(b.x - 2, b.y - 2, 4, 4, '#c86ade');
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffb8ff');
      if (Math.random() < 0.4) spawnParticle(b.x, b.y, '#e8a0ff', 0.35, 2, 12);
      break;

    case 'meteor':
      // 큰 오렌지 + 붉은 궤적
      pxDraw(b.x - 3, b.y - 3, 6, 6, '#ff4d1a');
      pxDraw(b.x - 2, b.y - 2, 4, 4, '#ff9c3d');
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffefa8');
      if (Math.random() < 0.6) spawnParticle(b.x, b.y, '#ff5a2a', 0.4, 3, 15);
      break;

    case 'prism':
      // 무지개 - 색이 계속 변함
      const hues = ['#ff6666','#ff9c3d','#ffefa8','#88ff88','#8bd8ff','#c86ade'];
      const c = hues[Math.floor(state.time * 20) % hues.length];
      pxDraw(b.x - 2, b.y - 2, 4, 4, c);
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffffff');
      break;

    case 'bolt':
      // 회색 금속 볼트 - 짧은 라인
      ctx.strokeStyle = '#c8c8c8';
      ctx.lineWidth = PX;
      ctx.beginPath();
      ctx.moveTo((b.x - Math.cos(ang)*3)*PX, (b.y - Math.sin(ang)*3)*PX);
      ctx.lineTo(b.x*PX, b.y*PX);
      ctx.stroke();
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffefa8');
      break;

    case 'laser':
      // 붉은 얇은 광선 - 뒤로 늘어진 궤적
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = PX * 2;
      ctx.beginPath();
      ctx.moveTo((b.x - Math.cos(ang)*10)*PX, (b.y - Math.sin(ang)*10)*PX);
      ctx.lineTo(b.x*PX, b.y*PX);
      ctx.stroke();
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffcccc');
      break;

    case 'rocket':
      // 회색 로켓 + 오렌지 궤적
      pxDraw(b.x - 2, b.y - 2, 4, 4, '#8a7a5a');
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#c8b898');
      if (Math.random() < 0.8) spawnParticle(b.x - Math.cos(ang)*4, b.y - Math.sin(ang)*4, '#ff9c3d', 0.4, 3, 15);
      if (Math.random() < 0.6) spawnParticle(b.x - Math.cos(ang)*6, b.y - Math.sin(ang)*6, '#888888', 0.5, 2, 8);
      break;

    case 'railgun':
      // 강력한 광선 + 흰빛
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = PX * 3;
      ctx.beginPath();
      ctx.moveTo((b.x - Math.cos(ang)*12)*PX, (b.y - Math.sin(ang)*12)*PX);
      ctx.lineTo(b.x*PX, b.y*PX);
      ctx.stroke();
      ctx.strokeStyle = '#8bd8ff';
      ctx.lineWidth = PX;
      ctx.stroke();
      pxDraw(b.x - 2, b.y - 2, 4, 4, '#ffffff');
      break;

    case 'seed':
      // 초록색 씨앗
      pxDraw(b.x - 2, b.y - 2, 4, 4, '#2a7a2a');
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#88dd88');
      if (Math.random() < 0.3) spawnParticle(b.x, b.y, '#7de88c', 0.3, 2, 10);
      break;

    case 'thorn':
      // 뾰족한 초록 가시
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#3ac762');
      pxDraw(b.x - 3, b.y, 6, 1, '#2a7a2a');
      pxDraw(b.x, b.y - 3, 1, 6, '#2a7a2a');
      break;

    case 'bee':
      // 노랑 벌 - 진동
      const bx = b.x + Math.sin(state.time * 20 + b.x) * 1;
      const by = b.y + Math.cos(state.time * 20 + b.y) * 1;
      pxDraw(bx - 1, by - 1, 2, 2, '#e8c547');
      pxDraw(bx - 2, by, 1, 1, '#000000');
      pxDraw(bx + 1, by, 1, 1, '#000000');
      break;

    case 'chaos':
      // 무작위 색 반짝임
      const cc = ['#ff2d2d','#c86ade','#ff9c3d','#3ac762','#8bd8ff','#ffefa8'];
      const chosen = cc[Math.floor(Math.random() * cc.length)];
      pxDraw(b.x - 2, b.y - 2, 4, 4, chosen);
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffffff');
      if (Math.random() < 0.5) spawnParticle(b.x, b.y, cc[Math.floor(Math.random()*cc.length)], 0.3, 2, 15);
      break;

    case 'holy':
      // 노란빛 신성 화살
      pxDraw(b.x - 2, b.y - 2, 4, 4, '#e8c547');
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffffff');
      if (Math.random() < 0.3) spawnParticle(b.x, b.y, '#ffefa8', 0.4, 2, 8);
      break;

    case 'spear':
      // 관통 창 - 긴 선
      ctx.strokeStyle = '#ffefa8';
      ctx.lineWidth = PX * 2;
      ctx.beginPath();
      ctx.moveTo((b.x - Math.cos(ang)*6)*PX, (b.y - Math.sin(ang)*6)*PX);
      ctx.lineTo((b.x + Math.cos(ang)*3)*PX, (b.y + Math.sin(ang)*3)*PX);
      ctx.stroke();
      pxDraw(b.x - 1, b.y - 1, 2, 2, '#ffffff');
      break;

    case 'sunray':
      // 태양 광선 - 여러 라인
      ctx.strokeStyle = '#ffefa8';
      ctx.lineWidth = PX * 3;
      ctx.beginPath();
      ctx.moveTo((b.x - Math.cos(ang)*15)*PX, (b.y - Math.sin(ang)*15)*PX);
      ctx.lineTo(b.x*PX, b.y*PX);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = PX;
      ctx.stroke();
      pxDraw(b.x - 3, b.y - 3, 6, 6, 'rgba(255, 239, 168, 0.4)');
      break;

    default:
      // Fallback: 기본 스프라이트
      if (b.kind === 'ice') drawSprite(SPR_ICE, ICE_PAL, b.x - 2, b.y - 4);
      else drawSprite(SPR_FIRE, FIRE_PAL, b.x - 3, b.y - 3);
  }
}

function drawEnemy(e) {
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(e.x*PX, (e.y + e.r)*PX, (e.r + 2)*PX, 2*PX, 0, 0, Math.PI*2);
  ctx.fill();
  // 엘리트 몹 - 금색 후광 링
  if (e.isElite) {
    const t = state.time * 3;
    const glow = 0.5 + Math.sin(t + e.x * 0.1) * 0.3;
    ctx.strokeStyle = 'rgba(232, 197, 71, ' + glow.toFixed(2) + ')';
    ctx.lineWidth = PX * 2;
    ctx.beginPath();
    ctx.arc(e.x*PX, e.y*PX, (e.r + 3)*PX, 0, Math.PI*2);
    ctx.stroke();
  }
  // 접두 - 색상 링 + 이름표
  if (e.affix) {
    const t2 = state.time * 4;
    const glow2 = 0.4 + Math.sin(t2 + e.x * 0.1) * 0.3;
    const col = e.affixColor || '#ffffff';
    // rgba conv
    ctx.strokeStyle = col;
    ctx.globalAlpha = glow2;
    ctx.lineWidth = PX;
    ctx.beginPath();
    ctx.arc(e.x*PX, e.y*PX, (e.r + 5)*PX, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (e.affixName && !e.isBoss) {
      drawText(e.affixName, e.x - textWidth(e.affixName)/2, e.y - e.r - 12, col);
    }
  }

  if (e.hitFlash > 0) {
    // 화이트 아웃
    ctx.globalCompositeOperation = 'source-over';
  }

  // === 검은 심장 ===
  if (e.kind === 'blackheart' && typeof drawBlackHeart === 'function') {
    drawBlackHeart(e);
    return;
  }

  // === 교수: 등장/사망 애니메이션 + 종파 오라 ===
  if (e.isProfessor && typeof drawProfessor === 'function') {
    drawProfessor(e);
    return;
  }

  // === 시련 보스: 카테고리별 시각적으로 완전히 다르게 ===
  if (e.isTrialBoss) {
    const t = state.time;
    const aura = e._trialAura || 'rgba(255,255,255,0.25)';
    const accent = e._trialAccent || e._trialColor || '#ffefa8';
    const col = e._trialColor || '#ffefa8';
    const sk = e._trialSpriteKind || 'chronomancer';
    const cat = e._trialCat || 'magic';

    // 카테고리별 오라 & 데코
    if (cat === 'magic') {
      // 회전하는 3중 룬 링 + 별
      ctx.fillStyle = aura;
      ctx.fillRect((e.x - 22)*PX, (e.y - 22)*PX, 44*PX, 44*PX);
      ctx.strokeStyle = accent;
      ctx.lineWidth = PX;
      for (let i = 0; i < 3; i++) {
        const rot = t * (0.7 + i * 0.3) + i;
        ctx.beginPath();
        ctx.ellipse(e.x*PX, e.y*PX, (18+i*4)*PX, (7+i*2)*PX, rot, 0, Math.PI*2);
        ctx.stroke();
      }
      // 부유하는 4개 오브
      for (let i = 0; i < 4; i++) {
        const a = t * 1.5 + i * Math.PI/2;
        const ox = e.x + Math.cos(a) * 20, oy = e.y + Math.sin(a) * 20;
        pxDraw(ox - 1, oy - 1, 3, 3, col);
      }
    } else if (cat === 'engineering') {
      // 정사각형 프레임 + 기어 각인 + 파일럿 라이트
      ctx.fillStyle = aura;
      ctx.fillRect((e.x - 20)*PX, (e.y - 20)*PX, 40*PX, 40*PX);
      // 외곽 강화판
      pxDraw(e.x - 18, e.y - 14, 36, 3, accent);
      pxDraw(e.x - 18, e.y + 12, 36, 3, accent);
      pxDraw(e.x - 20, e.y - 12, 3, 26, accent);
      pxDraw(e.x + 17, e.y - 12, 3, 26, accent);
      // 붉은 눈 스캔
      const scan = (Math.sin(t * 4) + 1) / 2;
      pxDraw(e.x - 6 + scan*12, e.y - 6, 2, 2, '#ff2d2d');
      // 밑에서 연기 파티클
      if (Math.random() < 0.5) spawnParticle(e.x + rand(-6, 6), e.y + 12, '#5a4a80', 0.6, 2, 20);
    } else if (cat === 'nature') {
      // 넝쿨 아우라 + 잎사귀 스팟
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(e.x*PX, e.y*PX, 26*PX, 0, Math.PI*2); ctx.fill();
      // 넝쿨 팔 3개 (회전하는 곡선)
      ctx.strokeStyle = accent;
      ctx.lineWidth = PX * 2;
      for (let i = 0; i < 3; i++) {
        const a = t * 0.8 + i * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(e.x*PX, e.y*PX);
        for (let k = 1; k <= 6; k++) {
          const dx = Math.cos(a + k * 0.3) * (k * 4);
          const dy = Math.sin(a + k * 0.3) * (k * 4);
          ctx.lineTo((e.x + dx) * PX, (e.y + dy) * PX);
        }
        ctx.stroke();
      }
      // 잎 파티클
      if (Math.random() < 0.4) spawnParticle(e.x + rand(-14, 14), e.y + rand(-14, 14), col, 0.6, 2, 10);
    } else if (cat === 'chaos') {
      // 깜박이는 잔상 3개 + 보이드 오라
      ctx.fillStyle = aura;
      ctx.fillRect((e.x - 24)*PX, (e.y - 24)*PX, 48*PX, 48*PX);
      // 무작위 위치 잔상
      for (let i = 0; i < 3; i++) {
        const jx = Math.sin(t * 5 + i * 2) * 6;
        const jy = Math.cos(t * 4 + i * 3) * 6;
        ctx.globalAlpha = 0.35;
        drawSprite(SPR_SEER, SEER_PAL, e.x - 8 + jx, e.y - 11 + jy);
      }
      ctx.globalAlpha = 1;
      // 방사형 균열
      ctx.strokeStyle = accent;
      ctx.lineWidth = PX;
      for (let i = 0; i < 6; i++) {
        const a = t * 2 + i * (Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo((e.x + Math.cos(a) * 14) * PX, (e.y + Math.sin(a) * 14) * PX);
        ctx.lineTo((e.x + Math.cos(a) * 22) * PX, (e.y + Math.sin(a) * 22) * PX);
        ctx.stroke();
      }
    } else if (cat === 'order') {
      // 십자 광선 + 후광 원
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(e.x*PX, (e.y - 4)*PX, 22*PX, 0, Math.PI*2); ctx.fill();
      // 후광
      ctx.strokeStyle = accent;
      ctx.lineWidth = PX * 2;
      ctx.beginPath(); ctx.arc(e.x*PX, (e.y - 10)*PX, 10*PX, 0, Math.PI*2); ctx.stroke();
      // 세로 십자
      pxDraw(e.x - 1, e.y - 20, 2, 30, accent);
      pxDraw(e.x - 6, e.y - 10, 12, 2, accent);
      // 부유 애니메이션
    }

    // 공통: 밑 스프라이트 (카테고리별 다른 kind)
    const oy = Math.sin(t * 2) * 2;
    if (sk === 'lich')     drawSprite(SPR_LICH,     LICH_PAL,   e.x - 10, e.y - 12 + oy);
    else if (sk === 'golem')    drawSprite(SPR_COLOSSUS, GOLEM_PAL,  e.x - 11, e.y - 12);
    else if (sk === 'colossus') drawSprite(SPR_COLOSSUS, DRAGON_PAL, e.x - 11, e.y - 12);
    else if (sk === 'seer')     drawSprite(SPR_SEER,     SEER_PAL,   e.x - 8,  e.y - 11 + oy);
    else if (sk === 'wraith')   drawSprite(SPR_WRAITH,   WRAITH_PAL, e.x - 6,  e.y - 8 + oy);
    else                        drawSprite(SPR_SEER,     SEER_PAL,   e.x - 8,  e.y - 11);

    // 이름 태그
    if (e._trialName) {
      const nm = e._trialName;
      drawText(nm, e.x - textWidth(nm)/2, e.y - e.r - 16, col);
    }
    return;
  }

  if (e.kind === 'slime') {
    drawSprite(SPR_SLIME, SLIME_PAL, e.x - 6, e.y - 5);
  } else if (e.kind === 'skeleton') {
    drawSprite(SPR_SKELETON, SKELE_PAL, e.x - 5, e.y - 8);
  } else if (e.kind === 'wraith' || e.kind === 'shade') {
    const oy = Math.sin(state.time * 3 + e.x) * 1;
    drawSprite(SPR_WRAITH, WRAITH_PAL, e.x - 6, e.y - 8 + oy);
  } else if (e.kind === 'bat') {
    // 슬라임 스프라이트 재사용 + 어두운 팔레트, 부유 애니메이션
    const oy = Math.sin(state.time * 8 + e.x) * 2;
    drawSprite(SPR_SLIME, BAT_PAL, e.x - 6, e.y - 5 + oy);
  } else if (e.kind === 'imp') {
    // 스켈레톤 스프라이트 재사용 + 붉은 팔레트
    drawSprite(SPR_SKELETON, IMP_PAL, e.x - 5, e.y - 8);
  } else if (e.kind === 'golem') {
    // 콜로수스 스프라이트 재사용 + 회색 팔레트
    drawSprite(SPR_COLOSSUS, GOLEM_PAL, e.x - 11, e.y - 12);
  } else if (e.kind === 'spider') {
    // 슬라임 스프라이트 재사용 + 검정 팔레트, 축소
    drawSprite(SPR_SLIME, SPIDER_PAL, e.x - 6, e.y - 5);
  } else if (e.kind === 'cultist') {
    // 렌치 스프라이트 재사용 + 다른 팔레트
    const oy = Math.sin(state.time * 2 + e.x) * 1;
    drawSprite(SPR_WRAITH, CULTIST_PAL, e.x - 6, e.y - 8 + oy);
  } else if (e.kind === 'venomspit') {
    // 초록 슬라임 크게. 위에 침 방울 반짝임
    const VENOM_PAL = { '1':'#0a2a10', '2':'#1a5a20', '3':'#3ac762', '4':'#8bff8b', '5':'#050505' };
    drawSprite(SPR_SLIME, VENOM_PAL, e.x - 6, e.y - 5);
    // 초록 오라
    ctx.fillStyle = 'rgba(58, 199, 98, 0.15)';
    ctx.fillRect((e.x - 8)*PX, (e.y - 6)*PX, 16*PX, 12*PX);
    // 위 침 방울
    if (Math.sin(state.time * 3 + e.x) > 0) pxDraw(e.x - 1, e.y - 8, 2, 2, '#3ac762');
  } else if (e.kind === 'healer') {
    // 흰 로브 유령. 위에 십자가.
    const HEAL_PAL = { '1':'#e8d9b0', '2':'#ffffff', '3':'#c8c8c8', '4':'#c8b898', '5':'#5a4a80', '6':'#3ac762', '7':'#f5d3a3', '8':'#050505' };
    drawSprite(SPR_WRAITH, HEAL_PAL, e.x - 6, e.y - 8);
    // 십자가
    pxDraw(e.x - 1, e.y - 12, 2, 4, '#3ac762');
    pxDraw(e.x - 2, e.y - 11, 4, 2, '#3ac762');
    // 힐 오라
    const p = 0.5 + Math.sin(state.time * 4) * 0.3;
    ctx.strokeStyle = 'rgba(58, 199, 98, ' + p.toFixed(2) + ')';
    ctx.lineWidth = PX;
    ctx.beginPath();
    ctx.arc(e.x*PX, e.y*PX, 20*PX, 0, Math.PI*2);
    ctx.stroke();
  } else if (e.kind === 'dragonlord') {
    // 콜로수스 스프라이트 + 붉은 팔레트, 아우라
    ctx.fillStyle = 'rgba(255, 45, 45, 0.25)';
    ctx.fillRect((e.x - 16)*PX, (e.y - 16)*PX, 32*PX, 32*PX);
    drawSprite(SPR_COLOSSUS, DRAGON_PAL, e.x - 11, e.y - 12);
    // 불꽃 파티클
    if (Math.random() < 0.4) spawnParticle(e.x + rand(-8, 8), e.y - 8, '#ff9c3d', 0.4, 1, 20);
  } else if (e.kind === 'voidempress') {
    // 리치 + 검정 자주 팔레트, 부유
    const oy = Math.sin(state.time * 2) * 2;
    ctx.fillStyle = 'rgba(125, 77, 191, 0.25)';
    ctx.fillRect((e.x - 14)*PX, (e.y - 16)*PX, 28*PX, 32*PX);
    drawSprite(SPR_LICH, VOID_PAL, e.x - 10, e.y - 12 + oy);
    if (Math.random() < 0.3) spawnParticle(e.x + rand(-6, 6), e.y + rand(-4, 4), '#c86ade', 0.5, 1, 30);
  } else if (e.kind === 'chronomancer') {
    // 시계 링 3개 회전
    const oy = Math.sin(state.time * 1.5) * 3;
    ctx.strokeStyle = 'rgba(255, 239, 168, 0.5)';
    ctx.lineWidth = PX;
    for (let i = 0; i < 3; i++) {
      const rot = state.time * (0.8 + i * 0.4) + i;
      ctx.beginPath();
      ctx.ellipse(e.x*PX, (e.y+oy)*PX, (16+i*4)*PX, (5+i*2)*PX, rot, 0, Math.PI*2);
      ctx.stroke();
    }
    drawSprite(SPR_SEER, SEER_PAL, e.x - 8, e.y - 11 + oy);
  } else if (e.kind === 'lich') {
    const oy = Math.sin(state.time * 2) * 2;
    drawSprite(SPR_LICH, LICH_PAL, e.x - 10, e.y - 12 + oy);
  } else if (e.kind === 'knight') {
    // 돌진 준비 시 붉은 오라
    if (e.phase === 1) {
      ctx.fillStyle = 'rgba(255,45,45,0.3)';
      ctx.fillRect((e.x - 12)*PX, (e.y - 14)*PX, 24*PX, 24*PX);
      // 돌진 방향 화살표
      const ang = e.chargeAng;
      for (let i = 1; i < 4; i++) {
        const px = e.x + Math.cos(ang) * (10 + i*4);
        const py = e.y + Math.sin(ang) * (10 + i*4);
        pxDraw(px - 1, py - 1, 2, 2, '#ff2d2d');
      }
    }
    if (e.phase === 3) {
      // 슬램 예고 원
      const r = 4 + (0.7 - e.chargeT) * 30;
      ctx.strokeStyle = 'rgba(255, 45, 45, 0.7)';
      ctx.lineWidth = PX;
      ctx.beginPath();
      ctx.arc(e.x*PX, e.y*PX, r*PX, 0, Math.PI*2);
      ctx.stroke();
    }
    drawSprite(SPR_KNIGHT, KNIGHT_PAL, e.x - 8, e.y - 11);
  } else if (e.kind === 'colossus') {
    drawSprite(SPR_COLOSSUS, COLOSSUS_PAL, e.x - 11, e.y - 12);
  } else if (e.kind === 'seer') {
    const oy = Math.sin(state.time * 2 + e.x) * 2;
    drawSprite(SPR_SEER, SEER_PAL, e.x - 8, e.y - 11 + oy);
  } else if (e.kind === 'core') {
    const oy = Math.sin(state.time * 1.5) * 3;
    // 회전 링
    ctx.strokeStyle = 'rgba(232, 197, 71, 0.4)';
    ctx.lineWidth = PX;
    for (let i = 0; i < 3; i++) {
      const rot = state.time * (0.5 + i * 0.3) + i;
      ctx.beginPath();
      ctx.ellipse(e.x*PX, (e.y+oy)*PX, (18+i*4)*PX, (6+i*2)*PX, rot, 0, Math.PI*2);
      ctx.stroke();
    }
    drawSprite(SPR_CORE, CORE_PAL, e.x - 11, e.y - 11 + oy);
  }

  // 히트 플래시
  if (e.hitFlash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.6;
    let sprite, ox, oy;
    switch(e.kind) {
      case 'slime':    sprite = SPR_SLIME;    ox=-6;  oy=-5;  break;
      case 'skeleton': sprite = SPR_SKELETON; ox=-5;  oy=-8;  break;
      case 'wraith':
      case 'shade':    sprite = SPR_WRAITH;   ox=-6;  oy=-8;  break;
      case 'knight':   sprite = SPR_KNIGHT;   ox=-8;  oy=-11; break;
      case 'colossus': sprite = SPR_COLOSSUS; ox=-11; oy=-12; break;
      case 'seer':     sprite = SPR_SEER;     ox=-8;  oy=-11; break;
      case 'lich':     sprite = SPR_LICH;     ox=-10; oy=-12; break;
      case 'core':     sprite = SPR_CORE;     ox=-11; oy=-11; break;
      default:         sprite = SPR_SLIME;    ox=-6;  oy=-5;
    }
    drawSpriteFlash(sprite, e.x + ox, e.y + oy, false, '#ffffff');
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // 얼음
  if (e.freeze > 0) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#8bd8ff';
    ctx.fillRect((e.x - e.r - 1)*PX, (e.y - e.r - 1)*PX, (e.r*2 + 2)*PX, (e.r*2 + 2)*PX);
    ctx.globalAlpha = 1;
  }

  // HP 바 (일반 몹)
  if (!e.isBoss && e.hp < e.maxHp) {
    const w = e.r * 2;
    pxDraw(e.x - w/2, e.y - e.r - 4, w, 1, '#3a0a0a');
    pxDraw(e.x - w/2, e.y - e.r - 4, w * (e.hp / e.maxHp), 1, '#c81616');
  }
}

function renderDungeonHUD() {
  // 상단 좌: HP/MP
  pxDraw(0, 0, W, 20, 'rgba(0,0,0,0.6)');
  const hpPct = clamp(player.hp / player.maxHp, 0, 1);
  const mpPct = clamp(player.mp / player.maxMp, 0, 1);
  drawText('HP', 4, 3, '#c81616');
  pxDraw(16, 2, 80, 5, '#3a0a0a');
  pxDraw(16, 2, 80 * hpPct, 5, '#c81616');
  pxDraw(16, 2, 80 * hpPct, 1, '#ff6666');
  const hpFmt = (n)=>{ if(n>=1e6)return (n/1e6).toFixed(1)+'M'; if(n>=1e3)return (n/1e3).toFixed(1)+'k'; return String(Math.ceil(n)); };
  drawText(hpFmt(Math.max(0, player.hp)) + '/' + hpFmt(player.maxHp), 100, 3, '#e8d9b0');

  drawText('MP', 4, 11, '#3b7fd6');
  pxDraw(16, 10, 80, 5, '#0a1a3a');
  pxDraw(16, 10, 80 * mpPct, 5, '#3b7fd6');
  pxDraw(16, 10, 80 * mpPct, 1, '#8bd8ff');

  // 레벨 & XP (숫자 표시 추가)
  drawText('LV ' + player.level, 150, 3, '#ffefa8');
  pxDraw(150, 10, 60, 4, '#2a1548');
  pxDraw(150, 10, 60 * (player.xp / player.xpNext), 4, '#e8c547');
  const xpStr = player.xp + '/' + player.xpNext;
  drawText(xpStr, 213, 3, '#c8b898');
  // 콤보 HUD (중앙)
  if (typeof drawComboHud === 'function') drawComboHud();
  // 축복 리스트 (좌하단)
  if (player && player.blessings && player.blessings.length && typeof BLESSING_BY_ID !== 'undefined') {
    const list = player.blessings.slice(-6);
    let bx = 4;
    for (const id of list) {
      const b = BLESSING_BY_ID[id]; if (!b) continue;
      pxDraw(bx, H - 8, 8, 4, b.color);
      bx += 10;
    }
    drawText('BLESS ' + player.blessings.length, 4, H - 16, '#8bd8ff');
  }

  // 우측: 층/방 이름 + 골드 + 적 수 (짧게, HP 숫자와 겹치지 않도록)
  const fd = currentFloorData();
  const infoStr = 'F' + floor + '  R' + (currentRoom + 1) + '/5';
  drawText(infoStr, W - textWidth(infoStr) - 4, 3, '#e8d9b0');
  const enStr = 'GOLD ' + state.gold + '  ENEMIES ' + entities.enemies.length;
  drawText(enStr, W - textWidth(enStr) - 4, 11, '#c8b898');
  // 층 이름은 별도 라인 (상단 중앙, 짧게)
  drawText(fd.name, W/2 - textWidth(fd.name)/2, 19, '#8a7ab5');

  // 현재 난이도 뱃지 (좌상단 HUD 아래)
  if (typeof currentDifficulty === 'function') {
    const d = currentDifficulty();
    const s = 'DIFF: ' + d.name.toUpperCase();
    drawText(s, 4, 19, d.color);
  }

  // 시련 모드: 중앙에 큰 카운트다운 표시 (1단계=60s, 2단계 ULTRA=40s)
  if (state.dungeonMode === 'trial' && state.dungeonStart) {
    const isS2 = state.trialStage === 2;
    const limit = isS2
      ? ((typeof ULTRA_TRIAL_TIME_SEC !== 'undefined') ? ULTRA_TRIAL_TIME_SEC : 40)
      : ((typeof MAX_TRIAL_TIME_SEC !== 'undefined') ? MAX_TRIAL_TIME_SEC : 60);
    const left = Math.max(0, limit - (performance.now() - state.dungeonStart) / 1000);
    const tag = isS2 ? 'ULTRA' : 'TRIAL';
    const s = tag + '  ' + left.toFixed(1) + 's';
    const col = left < 10 ? '#c81616' : (left < 30 ? '#e8c547' : (isS2 ? '#ff2d80' : '#ffefa8'));
    drawText(s, W/2 - textWidth(s, 2)/2, 22, col, 2);
  }

  // 하단 스킬 슬롯 - 새 슬롯 시스템 (LMB/Q/E + ROLL) + 포션 3개
  const slotY = H - 22;
  // 스킬 슬롯
  const slotList = [];
  for (const sName of ['lmb','q','e']) {
    const skillId = player.slots[sName];
    const s = skillId ? SKILL_BY_ID[skillId] : null;
    const lv = skillId ? (state.ownedSkills[skillId] || 1) : 0;
    let cat = s ? SKILL_TREE[s.category] : null;
    slotList.push({
      key: sName === 'lmb' ? 'LMB' : sName.toUpperCase(),
      name: s ? s.name.slice(0, 5) : '---',
      cd: s ? (player.cd[skillId] || 0) : 0,
      max: s ? _resolve(s.cd, lv, 1) * (player.cdMult||1) * (sName==='lmb'?(player.mods.lmbCd||1):1) : 1,
      cost: s ? Math.ceil(_resolve(s.mp, lv, 0) * (player.mpCostMult||1)) : 0,
      col: cat ? cat.color : '#5a4a80',
    });
  }
  slotList.push({ key: 'SHF', name: 'ROLL', cd: player.rollCd, max: hasPerk('multiroll') ? 0.5 : 1.0, cost: 0, col: '#c8b898' });
  // 포션 슬롯 3개
  for (let i = 0; i < 3; i++) {
    const kind = academy.hotkeys[i];
    const pot = kind ? POTIONS[kind] : null;
    slotList.push({
      key: String(i+1),
      name: pot ? pot.name.split(' ')[0].slice(0, 4) : '---',
      cd: 0, max: 1, cost: 0,
      col: pot ? pot.color : '#3a1e5c',
      count: kind ? academy.inventory[kind] : 0,
      isPot: true,
    });
  }

  const slotW = 24, gap = 3;
  const totalW = slotList.length * slotW + (slotList.length - 1) * gap;
  const startX = W/2 - totalW/2;
  for (let i = 0; i < slotList.length; i++) {
    const s = slotList[i];
    const x = startX + i * (slotW + gap);
    pxDraw(x, slotY, slotW, 20, '#1a0e2e');
    pxDraw(x, slotY, slotW, 1, s.col);
    pxDraw(x, slotY + 19, slotW, 1, '#3a1e5c');
    if (s.max > 0 && s.cd > 0) {
      const cdPct = s.cd / s.max;
      pxDraw(x, slotY + 20 - 20 * cdPct, slotW, 20 * cdPct, 'rgba(0,0,0,0.6)');
      // CD 남은 초 표시
      const cdSec = s.cd.toFixed(1);
      drawText(cdSec, x + slotW/2 - textWidth(cdSec)/2, slotY + 7, '#ffefa8');
    }
    // 색상 도트 (좌상단)
    pxDraw(x + 1, slotY + 1, 3, 3, s.col);
    drawText(s.name, x + slotW/2 - textWidth(s.name)/2, slotY + 3, s.cd > 0 ? '#5a4a80' : s.col);
    drawText('[' + s.key + ']', x + slotW/2 - textWidth('[' + s.key + ']')/2, slotY + 12, '#8a7ab5');
    if (s.count !== undefined) {
      drawText('x' + s.count, x + slotW - textWidth('x' + s.count) - 1, slotY + 12, s.count > 0 ? '#ffefa8' : '#5a4a80');
    }
    if (s.isPot && s.count === 0) { ctx.globalAlpha = 0.4; pxDraw(x, slotY, slotW, 20, '#000'); ctx.globalAlpha = 1; }
    if (s.cost > 0 && player.mp < s.cost) { ctx.globalAlpha = 0.5; pxDraw(x, slotY, slotW, 20, '#000'); ctx.globalAlpha = 1; }
  }

  // 미니맵 (우하단) - 층 진행 표시
  const mmX = W - 60, mmY = H - 52;
  pxDraw(mmX, mmY, 56, 26, '#000');
  pxDraw(mmX, mmY, 56, 1, '#5a4a80');
  pxDraw(mmX, mmY + 25, 56, 1, '#5a4a80');
  pxDraw(mmX, mmY, 1, 26, '#5a4a80');
  pxDraw(mmX + 55, mmY, 1, 26, '#5a4a80');
  // 층 (좌측 컬럼) - endless 모드일 때는 최대 5개만 표시
  const displayFloors = Math.min(currentFloorTotal(), 5);
  for (let i = 0; i < displayFloors; i++) {
    const fy = mmY + 3 + i * 4;
    const isFloor = i === floor - 1;
    pxDraw(mmX + 3, fy, 3, 3, isFloor ? '#e8c547' : (i < floor - 1 ? '#3ac762' : '#3a1e5c'));
  }
  // 방 5개 (수평)
  for (let i = 0; i < 5; i++) {
    const rx = mmX + 12 + i * 8;
    const ry = mmY + 10;
    const isCur = i === currentRoom;
    const isBoss = i === 4;
    const done = i < currentRoom;
    pxDraw(rx, ry, 6, 5, isBoss ? '#5a1a1a' : '#2a1548');
    if (done) pxDraw(rx, ry, 6, 5, '#1a3a1a');
    if (isCur) pxDraw(rx, ry, 6, 5, '#e8c547');
    if (i < 4) pxDraw(rx + 6, ry + 2, 2, 1, '#3a1e5c');
  }
  const totalFloors = currentFloorTotal();
  const floorLabel = totalFloors >= 999 ? ('F' + floor + '/∞') : ('F' + floor + '/' + totalFloors);
  drawText(floorLabel, mmX + 2, mmY - 8, '#8a7ab5');
  drawText('ROOMS', mmX + 22, mmY - 8, '#8a7ab5');

  // 시간 정지 표시
  if (timeStopT > 0) {
    const s = 'TIME STOP ' + timeStopT.toFixed(1);
    drawText(s, W/2 - textWidth(s)/2, 32, '#8bd8ff');
  }

  // 보스 HP 바
  const boss = entities.enemies.find(e => e.isBoss);
  if (boss) {
    const bossName = currentFloorData().bossName;
    const bossPct = clamp(boss.hp / boss.maxHp, 0, 1);
    pxDraw(30, 35, W - 60, 6, '#1a0e2e');
    pxDraw(30, 35, (W - 60) * bossPct, 6, '#c81616');
    pxDraw(30, 35, (W - 60) * bossPct, 1, '#ff6666');
    drawText(bossName, W/2 - textWidth(bossName)/2, 26, '#ffefa8');
  }

  // 힌트
  if (currentRoom === 0 && state.time < 8) {
    drawText('WASD MOVE - LMB FIRE - SHIFT SHIELD - SHIFT+WASD ROLL', 4, H - 30, '#5a4a80');
  }
}

// ---------- 레벨업 화면 ----------
function renderLevelUp() {
  // 어두운 오버레이
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  const title = 'LEVEL ' + player.level + ' - CHOOSE A GIFT';
  drawText(title, W/2 - textWidth(title)/2, 30, '#e8c547');
  drawText('PRESS [1] [2] [3]', W/2 - textWidth('PRESS [1] [2] [3]')/2, 42, '#8a7ab5');

  const cardW = 92, cardH = 78, gap = 8;
  const total = perkChoices.length * cardW + (perkChoices.length - 1) * gap;
  const sx = W/2 - total/2;
  for (let i = 0; i < perkChoices.length; i++) {
    const p = perkChoices[i];
    const x = sx + i * (cardW + gap);
    const y = 70;
    // 카드
    pxDraw(x, y, cardW, cardH, '#1a0e2e');
    pxDraw(x, y, cardW, 1, '#e8c547');
    pxDraw(x, y + cardH - 1, cardW, 1, '#e8c547');
    pxDraw(x, y, 1, cardH, '#e8c547');
    pxDraw(x + cardW - 1, y, 1, cardH, '#e8c547');
    // 번호
    drawText('[' + (i+1) + ']', x + cardW/2 - textWidth('[' + (i+1) + ']')/2, y + 6, '#ffefa8');
    // 이름
    drawText(p.name, x + cardW/2 - textWidth(p.name)/2, y + 22, '#e8d9b0');
    // 구분선
    pxDraw(x + 8, y + 32, cardW - 16, 1, '#3a1e5c');
    // 설명 (줄바꿈)
    const desc = p.desc;
    const words = desc.split(' ');
    let line = '';
    let ly = y + 40;
    for (const w of words) {
      const test = line + (line ? ' ' : '') + w;
      if (textWidth(test) > cardW - 8) {
        drawText(line, x + cardW/2 - textWidth(line)/2, ly, '#c8b898');
        ly += 9;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) drawText(line, x + cardW/2 - textWidth(line)/2, ly, '#c8b898');

    // 이미 가진 스택 수 표시 (있으면)
    const stack = countPerk(p.id);
    if (stack > 0) {
      const stackText = 'OWNED x' + stack;
      pxDraw(x + 4, y + cardH - 10, cardW - 8, 8, '#3a1e5c');
      drawText(stackText, x + cardW/2 - textWidth(stackText)/2, y + cardH - 9, '#ffefa8');
    }
  }
}

// ---------- 사망 ----------
function renderDeath() {
  ctx.fillStyle = 'rgba(60, 0, 0, 0.6)';
  ctx.fillRect(0, 0, W*PX, H*PX);
  const t = 'YOU FELL IN THE DARK';
  drawText(t, W/2 - textWidth(t, 2)/2, 80, '#c81616', 2);
}

// ---------- 엔딩 (한 판 결과) ----------
function renderEnding() {
  bgStars();
  let title, sub, col;
  if (state.runResult === 'final') {
    title = 'THE CORE FALLS'; col = '#e8c547';
    sub = '+50 RESEARCH   +200 GOLD   +0.6 GPA';
  } else if (state.runResult === 'clear') {
    title = 'BOSS DEFEATED'; col = '#3ac762';
    sub = '+' + (10*floor) + ' RESEARCH   +' + (30*floor) + ' GOLD   +0.2 GPA';
  } else if (state.runResult === 'retreat') {
    title = 'RETREATED SAFELY'; col = '#8bd8ff';
    sub = '+' + Math.max(1, floor) + ' RESEARCH   +0.1 GPA';
  } else {
    title = 'YOU FELL IN THE DARK'; col = '#c81616';
    sub = 'HALF GOLD LOST   -0.4 GPA';
  }
  drawText(title, W/2 - textWidth(title, 2)/2, 55, col, 2);
  drawText(sub, W/2 - textWidth(sub)/2, 85, '#c8b898');

  // 상세 정산 표
  const rows = [
    ['층', 'F' + floor],
    ['레벨', String(player.level)],
    ['골드', String(state.gold)],
    ['축복', ((player.blessings && player.blessings.length) || 0) + ' 개'],
    ['최대 콤보', 'x' + ((typeof combo !== 'undefined' && combo.maxThisRun) || 0)],
  ];
  // 게임 모드: 스피드런이면 시간 추가
  if (typeof isModeActive === 'function' && isModeActive('speedrun') && player._runStart) {
    const sec = Math.floor((Date.now() - player._runStart) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    rows.push(['시간', m + ':' + String(s).padStart(2, '0')]);
  }
  // 시너지 활성화 개수
  if (player._synActivated && player._synActivated.size > 0) {
    rows.push(['시너지', String(player._synActivated.size) + ' 개']);
  }
  const rowH = 10;
  const startY = 105;
  for (let i = 0; i < rows.length; i++) {
    const label = rows[i][0];
    const val = rows[i][1];
    const lx = W/2 - 60;
    const rx = W/2 + 60;
    drawText(label, lx, startY + i * rowH, '#8a7ab5');
    drawText(val, rx - textWidth(val), startY + i * rowH, '#ffefa8');
  }
  const endY = startY + rows.length * rowH;

  if (state.runResult === 'final') {
    drawText('YOU HAVE CLEARED THE ACADEMY.', W/2 - textWidth('YOU HAVE CLEARED THE ACADEMY.')/2, endY + 4, '#e8c547');
  }

  if (Math.floor(state.time * 2) % 2 === 0) {
    const s = '[SPACE] RETURN TO ACADEMY';
    drawText(s, W/2 - textWidth(s)/2, H - 15, '#ffefa8');
  }
}

