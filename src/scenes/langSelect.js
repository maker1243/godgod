// =====================================================================
// Language select
// =====================================================================

// =====================================================================
// LANGUAGE SELECT SCENE
// =====================================================================
const langSel = {
  cursor: 0,
  options: [
    { code: 'en', label: 'ENGLISH', native: 'English' },
    { code: 'ko', label: 'KOREAN',  native: '한국어' },
  ],
};

function updateLangSelect(dt) {
  if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; langSel.cursor = (langSel.cursor - 1 + langSel.options.length) % langSel.options.length; sfx('hit'); }
  if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; langSel.cursor = (langSel.cursor + 1) % langSel.options.length; sfx('hit'); }
  if (keys['Space'] || keys['Enter']) {
    initAudio();
    keys['Space']=false; keys['Enter']=false;
    state.lang = langSel.options[langSel.cursor].code;
    try { localStorage.setItem('gaa_lang', state.lang); } catch(e){}
    state.scene = state.account ? 'title' : 'login';
    sfx('level');
  }
}

function renderLangSelect() {
  bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  // Show title in both languages so user sees it before choosing
  const t1 = 'GRAND ARCANA ACADEMY';
  drawText(t1, W/2 - textWidth(t1, 2)/2, 30, '#e8c547', 2);
  const t2 = '그랜드 아르카나 아카데미';
  drawText(t2, W/2 - textWidth(t2)/2, 55, '#8bd8ff');

  // Header (uses currently-selected language for live preview)
  const previewLang = langSel.options[langSel.cursor].code;
  const oldLang = state.lang;
  state.lang = previewLang;
  const header = t('lang.title');
  drawText(header, W/2 - textWidth(header, 2)/2, 85, '#ffefa8', 2);
  state.lang = oldLang;

  for (let i = 0; i < langSel.options.length; i++) {
    const opt = langSel.options[i];
    const y = 115 + i * 18;
    const isSel = langSel.cursor === i;
    const label = opt.native + '  (' + opt.label + ')';
    const col = isSel ? '#ffefa8' : '#8bd8ff';
    const prefix = isSel ? '>  ' : '   ';
    const suffix = isSel ? '  <' : '   ';
    const s = prefix + label + suffix;
    drawText(s, W/2 - textWidth(s)/2, y, col);
  }

  // Hint (in currently-highlighted language)
  state.lang = previewLang;
  const hint = t('lang.hint');
  drawText(hint, W/2 - textWidth(hint)/2, H - 20, '#5a4a80');
  state.lang = oldLang;
}

