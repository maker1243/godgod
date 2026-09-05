// =====================================================================
// WebAudio SFX
// =====================================================================

// ---------- 사운드 (WebAudio 간단 SFX) ----------
let audioCtx = null;
function initAudio() {
  if (audioCtx) return;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  catch(e) { audioCtx = null; }
}
function beep(freq, dur = 0.08, type = 'square', vol = 0.05) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol;
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}
function sfx(name) {
  if (!audioCtx) return;
  switch(name) {
    case 'fire':   beep(660, 0.09, 'square', 0.04); break;
    case 'ice':    beep(880, 0.10, 'triangle', 0.04); break;
    case 'hit':    beep(220, 0.06, 'square', 0.05); break;
    case 'hurt':   beep(140, 0.15, 'sawtooth', 0.06); break;
    case 'die':    beep(100, 0.30, 'sawtooth', 0.06); break;
    case 'parry':  beep(1200, 0.08, 'triangle', 0.06); setTimeout(()=>beep(1600,0.06,'triangle',0.05),40); break;
    case 'pickup': beep(1000, 0.06, 'square', 0.04); setTimeout(()=>beep(1400,0.05,'square',0.04),40); break;
    case 'level':  beep(600,0.06,'triangle',0.05); setTimeout(()=>beep(800,0.06,'triangle',0.05),60); setTimeout(()=>beep(1200,0.10,'triangle',0.05),120); break;
    case 'door':   beep(300, 0.10, 'sawtooth', 0.04); break;
    case 'roll':   beep(400, 0.06, 'triangle', 0.03); break;
    case 'boss':   for (let i=0;i<5;i++) setTimeout(()=>beep(100+i*30,0.15,'sawtooth',0.06),i*80); break;
  }
}

