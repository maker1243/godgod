// =====================================================================
// Daily Login Bonus - 매일 첫 접속 시 RP 지급 + 연속 접속 보너스.
// state.dailyLogin = { lastDay: 'YYYYMMDD', streak: N }
// =====================================================================

const DAILY_LOGIN_REWARDS = [
  // streak 1..7 반복
  { rp: 500,   msg:'환영합니다! +500 RP' },
  { rp: 1000,  msg:'연속 2일! +1000 RP' },
  { rp: 2000,  msg:'3일 연속! +2000 RP' },
  { rp: 3500,  msg:'4일 연속! +3500 RP' },
  { rp: 6000,  msg:'5일 연속! +6000 RP' },
  { rp: 10000, msg:'6일 연속! +10000 RP' },
  { rp: 20000, msg:'★ 7일 연속! +20000 RP + JACKPOT ★' },
];

function _dailyToday() {
  const d = new Date();
  return d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
}

function _dailyYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
}

function checkDailyLogin() {
  if (!state.dailyLogin) state.dailyLogin = { lastDay: '', streak: 0 };
  const today = _dailyToday();
  if (state.dailyLogin.lastDay === today) return; // already claimed today
  const yesterday = _dailyYesterday();
  if (state.dailyLogin.lastDay === yesterday) {
    state.dailyLogin.streak++;
  } else {
    state.dailyLogin.streak = 1;
  }
  state.dailyLogin.lastDay = today;
  const idx = Math.min(6, (state.dailyLogin.streak - 1) % 7);
  const reward = DAILY_LOGIN_REWARDS[idx];
  state.research = (state.research || 0) + reward.rp;
  if (typeof showAchievementBanner === 'function') {
    showAchievementBanner('DAILY LOGIN', reward.msg, '#ffefa8');
  } else if (typeof showMsg === 'function') {
    showMsg(reward.msg + '  (' + state.dailyLogin.streak + '일 연속)', 5);
  }
  if (typeof sfx === 'function') sfx('level');
  if (typeof saveAccountData === 'function') saveAccountData();
}
