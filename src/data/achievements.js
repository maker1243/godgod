// =====================================================================
// Achievements (업적) + Daily Challenges (일일 도전)
// - state.achievementsUnlocked = { id: timestampMs }
// - state.dailyDone            = { 'YYYYMMDD': { idx: true } }
// - checkAchievements() 를 주요 이벤트(잡몹 킬, 시련 통과, 스킬 구매 등)
//   후 호출하면 조건을 만족한 것을 잠금 해제.
// =====================================================================

// 편의: state 에 필요한 필드가 없으면 초기화
function _achEnsureState() {
  state.achievementsUnlocked = state.achievementsUnlocked || {};
  state.dailyDone            = state.dailyDone            || {};
  state.stats                = state.stats                || {
    totalKills: 0, bossKills: 0, critHits: 0, deaths: 0,
    dungeonsCleared: 0, trialWins: 0, ultraTrialWins: 0,
    skillsBought: 0, ciphersSolved: 0,
    profsBeaten: 0, principalKills: 0,
    maxTierBeaten: 0,          // 던전에서 클리어한 최고 티어 인덱스 (DIFFICULTY_TIERS)
    highestArenaWave: 0,
    goldEarnedTotal: 0, rpEarnedTotal: 0,
    playtimeSec: 0,
  };
}

// 통계 증분 헬퍼 (다른 파일에서 편하게 사용)
function statAdd(key, n) {
  _achEnsureState();
  state.stats[key] = (state.stats[key] || 0) + (n == null ? 1 : n);
}
function statMax(key, v) {
  _achEnsureState();
  if (v > (state.stats[key] || 0)) state.stats[key] = v;
}

// 25 업적. cond(state, stats) → bool. rewardRp / rewardGold 는 첫 달성 시 지급.
const ACHIEVEMENTS = [
  { id:'a01', name:'첫 걸음',            desc:'잡몹 1마리 처치',                       rewardRp:10,   cond:s=>s.stats.totalKills>=1 },
  { id:'a02', name:'초심자',             desc:'잡몹 100마리 처치',                     rewardRp:50,   cond:s=>s.stats.totalKills>=100 },
  { id:'a03', name:'베테랑',             desc:'잡몹 1,000마리 처치',                   rewardRp:200,  cond:s=>s.stats.totalKills>=1000 },
  { id:'a04', name:'대량 학살자',        desc:'잡몹 10,000마리 처치',                  rewardRp:1000, cond:s=>s.stats.totalKills>=10000 },
  { id:'a05', name:'보스 킬러',          desc:'보스 10회 처치',                        rewardRp:200,  cond:s=>s.stats.bossKills>=10 },
  { id:'a06', name:'던전 정복자',        desc:'던전 최종 클리어 1회',                  rewardRp:100,  cond:s=>(s.finalCleared||0)>=1 },
  { id:'a07', name:'익스트림 정복',      desc:'익스트림 던전 클리어',                  rewardRp:500,  cond:s=>(s.finalCleared||0)>=3 },
  { id:'a08', name:'인페르노 정복',      desc:'인페르노 던전 클리어',                  rewardRp:1500, cond:s=>(s.finalCleared||0)>=4 },
  { id:'a09', name:'첫 시련',            desc:'1단계 시련 통과 1회',                   rewardRp:300,  cond:s=>s.stats.trialWins>=1 },
  { id:'a10', name:'ULTRA 각성',         desc:'2단계 ULTRA 시련 통과 1회',             rewardRp:2000, cond:s=>s.stats.ultraTrialWins>=1 },
  { id:'a11', name:'암호 해독자',        desc:'CIPHER 5회 성공',                       rewardRp:150,  cond:s=>(s.cipherSolvedCount||0)>=5 },
  { id:'a12', name:'교수 사냥꾼',        desc:'교수 5명 처치',                         rewardRp:500,  cond:s=>s.stats.profsBeaten>=5 },
  { id:'a13', name:'교수 정복자',        desc:'모든 계열 시련 통과 (11)',              rewardRp:5000, cond:s=>{
      if(!s.facultyCleared) return false;
      const keys=['humanities','social','natural','engineering','medicine','education','arts','divinity','info','design','language'];
      return keys.every(k=>s.facultyCleared[k]);
    } },
  { id:'a14', name:'교장 격파',          desc:'교장 崔 총장 처치',                     rewardRp:10000, cond:s=>(s.principalDefeated||0)>=1 },
  { id:'a15', name:'만점 학생',          desc:'GPA 4.5 도달',                          rewardRp:300,  cond:s=>(s.gpa||0)>=4.5 },
  { id:'a16', name:'수석 학생',          desc:'GPA 100 도달',                          rewardRp:3000, cond:s=>(s.gpa||0)>=100 },
  { id:'a17', name:'부호',               desc:'골드 10,000 보유',                      rewardRp:100,  cond:s=>(s.gold||0)>=10000 },
  { id:'a18', name:'대부호',             desc:'골드 100,000 보유',                     rewardRp:500,  cond:s=>(s.gold||0)>=100000 },
  { id:'a19', name:'스킬 수집가',        desc:'스킬 20종 소유',                        rewardRp:400,  cond:s=>Object.keys(s.ownedSkills||{}).length>=20 },
  { id:'a20', name:'MAX 트리 개봉',      desc:'MAX 뷰 활성 (한 계열 통과)',            rewardRp:200,  cond:s=>!!s.maxUnlocked },
  { id:'a21', name:'아레나 챔피언',      desc:'아레나 웨이브 20 도달',                 rewardRp:400,  cond:s=>{ const arn=(typeof academy!=='undefined'&&academy)?academy.bestArena:0; return arn>=20; } },
  { id:'a22', name:'듀얼 마스터',        desc:'AI 듀얼 시리즈 10승',                   rewardRp:400,  cond:s=>{ const w=(typeof academy!=='undefined'&&academy)?academy.duelWins:0; return w>=10; } },
  { id:'a23', name:'크리티컬 명수',      desc:'크리티컬 100회',                        rewardRp:150,  cond:s=>s.stats.critHits>=100 },
  { id:'a24', name:'불사조',             desc:'사망 후 부활 (LAST STAND/REBIRTH/DIVINITY)', rewardRp:250, cond:s=>s.stats.deaths>=1 && Object.keys(s.ownedSkills||{}).some(id=>['e40','m20','n17','o22'].includes(id)) },
  { id:'a25', name:'전설',               desc:'a1~a24 모든 24개 업적 달성',            rewardRp:20000, cond:s=>{
      const done = s.achievementsUnlocked||{};
      let n = 0;
      for (let i = 1; i <= 24; i++) if (done['a'+i]) n++;
      return n >= 24;
    } },
  // 신규 업적 (버전 2)
  { id:'a26', name:'콤보 마스터',         desc:'단일 콤보 x40 달성',                     rewardRp:5000,  cond:s=>(typeof combo !== 'undefined' && combo.maxThisRun >= 40) },
  { id:'a27', name:'상자 사냥꾼',         desc:'잭팟 상자 획득',                          rewardRp:5000,  cond:s=>(s._chestJackpot) },
  { id:'a28', name:'무피격 5회',          desc:'PERFECT! 5회 달성',                      rewardRp:3000,  cond:s=>((s.weekly && s.weekly.progress && s.weekly.progress.weekly_perfect || 0) >= 5) },
  { id:'a29', name:'시너지 3개',          desc:'축복 시너지 3회 발동',                   rewardRp:8000,  cond:s=>((s.weekly && s.weekly.progress && s.weekly.progress.weekly_synergies || 0) >= 3) },
  { id:'a30', name:'ENDLESS F10',         desc:'ENDLESS 모드 10층 도달',                 rewardRp:15000, cond:s=>((s.endlessBest || 0) >= 10) },
  { id:'a31', name:'ENDLESS F25',         desc:'ENDLESS 모드 25층 도달',                 rewardRp:50000, cond:s=>((s.endlessBest || 0) >= 25) },
  { id:'a32', name:'주간 완주',           desc:'주간 도전 3개 모두 완료',                rewardRp:20000, cond:s=>(s.weekly && s.weekly.ids && s.weekly.ids.every(id => s.weekly.done && s.weekly.done[id])) },
  { id:'a33', name:'7일 연속',            desc:'로그인 7일 연속',                        rewardRp:12000, cond:s=>(s.dailyLogin && s.dailyLogin.streak >= 7) },
  { id:'a34', name:'스타일리스트',        desc:'로브 5종 이상 소유',                     rewardRp:5000,  cond:s=>{
      if (!s.customize || !s.customize.owned || !s.customize.owned.robe) return false;
      return Object.keys(s.customize.owned.robe).length >= 5;
    } },
];

function checkAchievements() {
  _achEnsureState();
  for (const a of ACHIEVEMENTS) {
    if (state.achievementsUnlocked[a.id]) continue;
    let ok = false;
    try { ok = !!a.cond(state); } catch(e){}
    if (ok) {
      state.achievementsUnlocked[a.id] = Date.now();
      if (a.rewardRp)   state.research = (state.research||0) + a.rewardRp;
      if (a.rewardGold) state.gold     = (state.gold||0)     + a.rewardGold;
      if (typeof spawnFloat === 'function' && typeof player !== 'undefined' && player) {
        spawnFloat(player.x, player.y - 12, '★ ' + a.name, '#ffefa8');
      }
      if (typeof showAchievementBanner === 'function') showAchievementBanner(a.name, '+' + (a.rewardRp||0) + ' RP', '#ffefa8');
      if (typeof sfx === 'function') sfx('level');
    }
  }
  if (typeof saveAccountData === 'function') saveAccountData();
}

// =====================================================================
// Daily Challenges (일일 도전) - 3개 랜덤. 자정 KST 기준 로컬 시각으로 갱신.
// =====================================================================
function dailyDateKey() {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), da = String(d.getDate()).padStart(2,'0');
  return '' + y + m + da;
}
// 시드 기반 결정적 랜덤
function _seedRand(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

const DAILY_POOL = [
  { id:'d01', name:'토벌',        desc:'잡몹 200마리 처치',       goal:200,  metric:'kills',   rewardRp:500 },
  { id:'d02', name:'보스 토벌',   desc:'보스 3회 처치',           goal:3,    metric:'bossKills', rewardRp:400 },
  { id:'d03', name:'크리티컬',    desc:'크리티컬 50회',           goal:50,   metric:'critHits', rewardRp:300 },
  { id:'d04', name:'스피드런',    desc:'던전 1회 클리어',         goal:1,    metric:'dungeonsCleared', rewardRp:500 },
  { id:'d05', name:'교수 사냥',   desc:'교수 2명 처치',           goal:2,    metric:'profsBeaten', rewardRp:800 },
  { id:'d06', name:'암호 해독',   desc:'CIPHER 3회 성공',         goal:3,    metric:'ciphersSolved', rewardRp:400 },
  { id:'d07', name:'스킬 구매',   desc:'스킬 5회 구매',           goal:5,    metric:'skillsBought', rewardRp:400 },
  { id:'d08', name:'금 수확',     desc:'골드 5000 획득',          goal:5000, metric:'goldEarnedTotal', rewardRp:400 },
  { id:'d09', name:'RP 수확',     desc:'RP 3000 획득',            goal:3000, metric:'rpEarnedTotal', rewardRp:400 },
];

function todaysDailies() {
  _achEnsureState();
  const key = dailyDateKey();
  const rnd = _seedRand(parseInt(key, 10));
  // 3개 뽑기 (셔플)
  const pool = DAILY_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, 3);
  // baseline 기록 (오늘 자정 시각의 카운터). 없으면 지금 값 저장.
  if (!state.dailyDone[key]) state.dailyDone[key] = { _base: {} };
  const day = state.dailyDone[key];
  for (const d of picked) {
    if (day._base[d.metric] == null) day._base[d.metric] = state.stats[d.metric] || 0;
  }
  return picked;
}

function dailyProgress(d) {
  _achEnsureState();
  const key = dailyDateKey();
  const day = state.dailyDone[key] || (state.dailyDone[key] = { _base: {} });
  const base = day._base[d.metric] || 0;
  const cur  = state.stats[d.metric] || 0;
  return Math.max(0, cur - base);
}

function checkDailies() {
  _achEnsureState();
  const key = dailyDateKey();
  const day = state.dailyDone[key] || (state.dailyDone[key] = { _base: {} });
  const picked = todaysDailies();
  for (const d of picked) {
    if (day[d.id]) continue;
    if (dailyProgress(d) >= d.goal) {
      day[d.id] = Date.now();
      state.research = (state.research||0) + (d.rewardRp||0);
      if (typeof showMsg === 'function') showMsg('일일 도전 완료: ' + d.name + '  +' + d.rewardRp + ' RP', 3);
      if (typeof sfx === 'function') sfx('level');
    }
  }
  if (typeof saveAccountData === 'function') saveAccountData();
}
