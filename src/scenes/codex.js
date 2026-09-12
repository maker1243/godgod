// =====================================================================
// Codex (도감) - 특성/스킬/난이도/시련의 모든 효과를 조회.
// 아카데미에서 X 키 또는 상단 [DOCS] 버튼으로 진입.
// =====================================================================

const codex = {
  tab: 'perks',       // 'perks' | 'skills' | 'tiers' | 'trials'
  cursor: 0,
  scroll: 0,
  visibleRows: 12,
  message: '',
  messageT: 0,
};

const CODEX_TABS = [
  { id:'perks',    name:'PERKS'      },
  { id:'skills',   name:'SKILLS'     },
  { id:'tiers',    name:'DIFFICULTY' },
  { id:'trials',   name:'TRIALS'     },
  { id:'visuals',  name:'VISUALS'    },
  { id:'achieve',  name:'ACHIEVE'    },
  { id:'daily',    name:'DAILY'      },
  { id:'story',    name:'STORY'      },
  { id:'bond',     name:'BOND'       },
  { id:'weekly',   name:'WEEKLY'     },
  { id:'memory',   name:'MEMORY'     },
  { id:'modes',    name:'MODES'      },
  { id:'stats',    name:'STATS'      },
];

// 엘라라 미션 진행도 텍스트 - 특정 bond 미션의 현재 상황을 계산
function _elaraProgressText(q) {
  try {
    if (!q) return '';
    const b = q.bond;
    if (b === 1) {
      const npcs = (typeof academy !== 'undefined' && academy.npcs) ? academy.npcs : [];
      let n = 0;
      for (const nc of npcs) { if ((nc.bond || 0) >= 1) n++; }
      return n + ' / 3 NPC 인사';
    }
    if (b === 2) return (state.customizeVisited ? '완료' : '미방문 · STYLE 문');
    if (b === 3) return (typeof hasFaction === 'function' && hasFaction()) ? '가문 결정 완료' : '미결정 · HOUSE 문';
    if (b === 4) return ((state.customSpells||[]).length) + ' / 1 주문 창조';
    if (b === 5) {
      const groups = [ ['kor','eng'],['biz','psy'],['phys','chem'],['cs','robot'],
        ['med','phar'],['math','pe'],['paint','vocal'],['phil','rel'],
        ['lib','media'],['sculpt','vdesign'],['chn','jpn'] ];
      const beaten = state.professorsBeaten || {};
      let n = 0; for (const g of groups) if (g.some(k => beaten[k])) n++;
      return n + ' / 3 계열';
    }
    if (b === 6) {
      const cl = (typeof underground !== 'undefined' && underground.claimed) ? underground.claimed : {};
      const n = Object.keys(cl).filter(k => cl[k]).length;
      return n + ' / 3 방 개방';
    }
    if (b === 7) {
      const v = !!state.blackMarketVisited;
      let toolCnt = 0;
      if (state.magicTools) for (const k of Object.keys(state.magicTools)) toolCnt += state.magicTools[k] || 0;
      return (v ? '방문 완료' : '시장 미방문') + ' · 마도구 ' + toolCnt + '/1';
    }
    if (b === 8) {
      if (!state.clan) return '클랜 미창설';
      return '클랜 XP ' + (state.clan.xp||0) + ' / 2000';
    }
    if (b === 9) {
      const done = !!(typeof underground !== 'undefined' && underground.bossDown && underground.bossDown[5]);
      return done ? '심연 보스 격파' : '심연 F5 미격파';
    }
    if (b === 10) {
      // 교수 + 교장 격파
      const groups = [ ['kor','eng'],['biz','psy'],['phys','chem'],['cs','robot'],
        ['med','phar'],['math','pe'],['paint','vocal'],['phil','rel'],
        ['lib','media'],['sculpt','vdesign'],['chn','jpn'] ];
      const beaten = state.professorsBeaten || {};
      let all = true; let n = 0;
      for (const g of groups) {
        if (g.every(k => !beaten[k])) { all = false; }
        for (const k of g) if (beaten[k]) n++;
      }
      const principal = (state.principalDefeated || 0) >= 1;
      return '교수 ' + n + '/22 · 교장 ' + (principal ? 'O' : 'X');
    }
  } catch(_){}
  return '';
}

function codexSetTab(id) {
  codex.tab = id;
  codex.cursor = 0;
  codex.scroll = 0;
}

// 각 탭이 렌더할 항목 리스트 반환. 각 항목: {title, sub, color}
function codexEntries() {
  const out = [];
  if (codex.tab === 'perks') {
    if (typeof PERK_POOL !== 'undefined') {
      for (const p of PERK_POOL) out.push({ title: p.name, sub: p.desc, color: '#ffefa8' });
    }
  } else if (codex.tab === 'skills') {
    if (typeof SKILL_TREE !== 'undefined') {
      for (const cat of Object.keys(SKILL_TREE)) {
        const tree = SKILL_TREE[cat];
        for (const s of tree.skills) {
          const tag = s.isUltra ? '[U]' : s.isMax ? '[M]' : '';
          const slot = s.slot === 'passive' ? 'PSV' : s.slot.toUpperCase();
          out.push({
            title: (tag ? tag + ' ' : '') + s.name + '  ' + slot,
            sub: (s.desc || '-') + '   COST ' + s.cost + 'R',
            color: tree.color,
            owned: (state.ownedSkills[s.id] || 0),
            maxLv: (s.maxLv || 1),
          });
        }
      }
    }
  } else if (codex.tab === 'tiers') {
    if (typeof DIFFICULTY_TIERS !== 'undefined') {
      for (const t of DIFFICULTY_TIERS) {
        const parts = [];
        if (t.hpBase > 0) parts.push('HP=' + _short(t.hpBase));
        parts.push('DMG x' + t.dmgMult);
        parts.push('BOSS HP x' + t.bossHpMult);
        if (t.rpPerKill > 0) parts.push('+' + _short(t.rpPerKill) + ' RP/kill');
        if (t.gpaPerKill > 0) parts.push('+' + t.gpaPerKill + ' GPA/kill');
        out.push({ title: t.name.toUpperCase() + ' (' + t.id + ')', sub: parts.join('  ·  '), color: t.color });
      }
    }
  } else if (codex.tab === 'visuals') {
    if (typeof BULLET_VISUALS !== 'undefined') {
      const names = Object.keys(BULLET_VISUALS).sort();
      for (const n of names) {
        // 이 visual 을 사용하는 스킬 목록 찾기
        const users = [];
        if (typeof SKILL_TREE !== 'undefined' && typeof SKILL_VISUAL !== 'undefined') {
          for (const cat of Object.keys(SKILL_TREE)) {
            for (const s of SKILL_TREE[cat].skills) {
              if (SKILL_VISUAL[s.id] === n) users.push(s.name);
              if (users.length >= 4) break;
            }
            if (users.length >= 4) break;
          }
        }
        const sub = users.length ? users.slice(0, 3).join(', ') + (users.length > 3 ? ' ...' : '') : 'no skill uses this yet';
        out.push({ title: n, sub, color: '#8bd8ff', isVisual: true, visualName: n });
      }
    }
  } else if (codex.tab === 'achieve') {
    if (typeof ACHIEVEMENTS !== 'undefined') {
      state.achievementsUnlocked = state.achievementsUnlocked || {};
      let done = 0;
      for (const a of ACHIEVEMENTS) {
        const unlocked = !!state.achievementsUnlocked[a.id];
        if (unlocked) done++;
        out.push({
          title: (unlocked ? '★ ' : '☆ ') + a.name,
          sub: a.desc + '   (보상 +' + (a.rewardRp || 0) + ' RP)',
          color: unlocked ? '#3ac762' : '#8a7ab5',
        });
      }
      out.unshift({ title: '진행: ' + done + ' / ' + ACHIEVEMENTS.length, sub: '별 표시된 업적은 이미 달성.', color: '#ffefa8' });
    }
  } else if (codex.tab === 'daily') {
    if (typeof todaysDailies === 'function') {
      const today = todaysDailies();
      const key = dailyDateKey();
      const day = (state.dailyDone && state.dailyDone[key]) || {};
      out.push({ title: '오늘의 도전 (' + key + ')', sub: '자정에 갱신 · 3개 랜덤 · 완료 시 RP 보상.', color: '#ffefa8' });
      for (const d of today) {
        const prog = dailyProgress(d);
        const done = !!day[d.id];
        const pct = Math.min(100, Math.floor(prog * 100 / d.goal));
        out.push({
          title: (done ? '★ ' : '☆ ') + d.name + '  ' + Math.min(prog, d.goal) + ' / ' + d.goal + '  (' + pct + '%)',
          sub: d.desc + '   보상 +' + d.rewardRp + ' RP',
          color: done ? '#3ac762' : '#e8d9b0',
        });
      }
    }
  } else if (codex.tab === 'weekly') {
    if (typeof weeklyStatus === 'function') {
      const list = weeklyStatus();
      const daysLeft = (typeof weeklyDaysLeft === 'function') ? weeklyDaysLeft() : '?';
      out.push({ title: '이번 주 도전 (' + (state.weekly ? state.weekly.week : '?') + ')', sub: '완료 시 큰 RP 보상. ' + daysLeft + '일 후 리셋.', color: '#ffefa8' });
      for (const w of list) {
        const barLen = 20;
        const filled = Math.min(barLen, Math.floor(barLen * (w.cur / w.goal)));
        const bar = '['.padEnd(1) + '#'.repeat(filled) + '.'.repeat(barLen - filled) + ']';
        out.push({
          title: (w.done ? '★ ' : '  ') + w.name + '  ' + bar + '  ' + Math.min(w.cur, w.goal) + '/' + w.goal,
          sub: w.desc + '   보상 +' + w.reward + ' RP' + (w.done ? '   [완료!]' : ''),
          color: w.done ? '#3ac762' : '#e8d9b0',
        });
      }
    }
  } else if (codex.tab === 'stats') {
    const s = state.stats || {};
    const format = (n) => {
      if (n >= 1e12) return (n/1e12).toFixed(1) + 'T';
      if (n >= 1e9)  return (n/1e9).toFixed(1)  + 'B';
      if (n >= 1e6)  return (n/1e6).toFixed(1)  + 'M';
      if (n >= 1e3)  return (n/1e3).toFixed(1)  + 'k';
      return String(n || 0);
    };
    out.push({ title: '전체 통계 (계정 전체)', sub: '누적 카운터. 대부분 스탯은 자동 트래킹.', color:'#ffefa8' });
    out.push({ title: '총 처치',   sub: format(s.totalKills),          color:'#e8c547' });
    out.push({ title: '보스 처치', sub: format(s.bossKills),           color:'#e8c547' });
    out.push({ title: '교수 처치', sub: format(s.profsBeaten),         color:'#e8c547' });
    out.push({ title: '교장 격파', sub: format(s.principalKills),      color:'#ffefa8' });
    out.push({ title: '크리티컬', sub: format(s.critHits),             color:'#ff9c3d' });
    out.push({ title: '사망',     sub: format(s.deaths),               color:'#c81616' });
    out.push({ title: '던전 클리어', sub: format(s.dungeonsCleared),   color:'#3ac762' });
    out.push({ title: '시련 통과 (기본)', sub: format(s.trialWins),    color:'#8bd8ff' });
    out.push({ title: '시련 통과 (ULTRA)', sub: format(s.ultraTrialWins), color:'#ff2d80' });
    out.push({ title: '스킬 구매', sub: format(s.skillsBought),        color:'#c86ade' });
    out.push({ title: '암호 성공', sub: format(s.ciphersSolved),       color:'#ff6666' });
    out.push({ title: '최고 티어 클리어', sub: 'INDEX ' + (s.maxTierBeaten || 0), color:'#ffefa8' });
    out.push({ title: '최고 아레나 웨이브', sub: format(s.highestArenaWave), color:'#8bd8ff' });
    out.push({ title: '총 골드 획득', sub: format(s.goldEarnedTotal),  color:'#e8c547' });
    out.push({ title: '총 RP 획득', sub: format(s.rpEarnedTotal),      color:'#8bd8ff' });
    if (state.dailyLogin) {
      out.push({ title: '연속 로그인', sub: (state.dailyLogin.streak || 0) + ' 일', color:'#3ac762' });
    }
    if (state.endlessBest) {
      out.push({ title: 'ENDLESS 최고 층', sub: 'F' + state.endlessBest, color:'#ffefa8' });
    }
    // 이번 주 최대 콤보 (Weekly progress 에 저장됨)
    const wkMaxCombo = (state.weekly && state.weekly.progress && state.weekly.progress.weekly_maxCombo) || 0;
    if (wkMaxCombo > 0) {
      out.push({ title: '이번 주 최대 콤보', sub: 'x' + wkMaxCombo, color:'#e8c547' });
    }
    // Highlights 개수
    if (state.highlights && state.highlights.length) {
      out.push({ title: '기록된 하이라이트', sub: state.highlights.length + '개', color:'#8bd8ff' });
    }
    // 업적 달성률
    if (typeof ACHIEVEMENTS !== 'undefined') {
      const total = ACHIEVEMENTS.length;
      const done = Object.keys(state.achievementsUnlocked || {}).length;
      const pct = Math.floor(done / total * 100);
      out.push({ title: '업적 달성률', sub: done + '/' + total + ' (' + pct + '%)', color:'#ffefa8' });
    }
    // 스토리 조각 수집률
    if (typeof STORY_FRAGMENTS !== 'undefined') {
      const total = Object.keys(STORY_FRAGMENTS).length;
      const sf = state.storyFragments || {};
      const done = Object.keys(sf).filter(k => STORY_FRAGMENTS[k]).length;
      const pct = Math.floor(done / total * 100);
      out.push({ title: '이야기 조각', sub: done + '/' + total + ' (' + pct + '%)', color:'#c8b898' });
    }
    // 스킬 소유율
    if (typeof SKILL_TREE !== 'undefined') {
      let totalS = 0;
      for (const cat of Object.keys(SKILL_TREE)) totalS += SKILL_TREE[cat].skills.length;
      const done = Object.keys(state.ownedSkills || {}).length;
      out.push({ title: '스킬 소유', sub: done + '/' + totalS, color:'#c86ade' });
    }
    // 축복 획득 종류 (추가로 기록되진 않지만 유용)
    if (typeof BLESSING_DEFS !== 'undefined') {
      out.push({ title: '축복 카드', sub: BLESSING_DEFS.length + '종 존재', color:'#ff6666' });
    }
    // 아티팩트 소유
    if (state.artifacts && state.artifacts.owned) {
      const owned = Object.keys(state.artifacts.owned).length;
      const total = ARTIFACT_DEFS.length;
      out.push({ title: '아티팩트 소유', sub: owned + '/' + total, color:'#e8c547' });
    }
    // 트레잇 소유
    if (state.traits && state.traits.owned) {
      const owned = Object.keys(state.traits.owned).length;
      const total = TRAIT_DEFS.length;
      out.push({ title: '트레잇 소유', sub: owned + '/' + total, color:'#3ac762' });
    }
    // Blessings 활성 시너지 개수 (계정별)
    if (state.stats && s.rpEarnedTotal) {
      out.push({ title: 'RP 획득 총합', sub: format(s.rpEarnedTotal), color:'#8bd8ff' });
    }
  } else if (codex.tab === 'modes') {
    if (typeof GAME_MODES !== 'undefined') {
      out.push({ title: '도전 모드 - 클릭 하여 토글', sub: '활성화 시 다음 던전부터 적용됨. 완료 시 큰 보상.', color:'#ffefa8' });
      for (const m of GAME_MODES) {
        const active = isModeActive(m.id);
        const mult = m.rewardMult ? '  [+RP x' + m.rewardMult + ']' : '';
        out.push({
          title: (active ? '★ ' : '  ') + m.name + mult,
          sub: m.desc,
          color: active ? m.color : '#8a7ab5',
          _modeToggle: m.id,
        });
      }
    }
  } else if (codex.tab === 'memory') {
    if (typeof highlightStatus === 'function') {
      const list = highlightStatus();
      out.push({ title: '메모리 홀 - 최근 하이라이트', sub: '보스 격파, 큰 콤보, 시너지, 첫 격파 등이 자동 저장됩니다.', color: '#ffefa8' });
      if (list.length === 0) {
        out.push({ title: '기록 없음', sub: '큰 순간을 만들어보세요.', color: '#5a4a80' });
      }
      for (const h of list) {
        const color = h.type === 'boss' ? '#c81616' : (h.type === 'synergy' ? '#ff00ff' : (h.type === 'combo' ? '#e8c547' : (h.type === 'principal' ? '#ffefa8' : '#8bd8ff')));
        const time = (typeof _hlTimeStr === 'function') ? _hlTimeStr(h.ts) : '';
        out.push({
          title: h.title + '   [' + time + ']',
          sub: h.subtitle + '   LV ' + h.lv + '   BLESS ' + h.blessCount + '   ' + h.tier.toUpperCase() + (h.maxCombo ? '   MAX COMBO x' + h.maxCombo : ''),
          color: color,
        });
      }
    }
  } else if (codex.tab === 'story') {
    if (typeof STORY_FRAGMENTS !== 'undefined') {
      state.storyFragments = state.storyFragments || {};
      if (typeof _storyEnsure === 'function') _storyEnsure();
      const keys = Object.keys(STORY_FRAGMENTS);
      let owned = 0;
      for (const k of keys) if (state.storyFragments[k]) owned++;
      out.push({ title: '이야기 조각: ' + owned + ' / ' + keys.length + (state.academyTruthSeen ? '  [진실 목격]' : ''), sub: '조각을 모으면 아카데미의 진실이 밝혀집니다.', color: '#ffefa8' });
      for (const k of keys) {
        const frag = (typeof _pickStoryLang === 'function') ? _pickStoryLang(k) : STORY_FRAGMENTS[k];
        const has = !!state.storyFragments[k];
        // 얻지 못한 조각: 힌트 표시 (제목은 ??? 유지, 서브에 힌트)
        let title, sub, col;
        if (has) {
          title = '📖 ' + (frag ? frag.title : k);
          sub = frag ? frag.lines[0] : '';
          col = '#c8b898';
        } else {
          title = '🔒 ???';
          const hint = (typeof getStoryFragmentHint === 'function') ? getStoryFragmentHint(k) : '조건 미기록';
          sub = '힌트: ' + hint;
          col = '#8a7ab5';
        }
        out.push({ title, sub, color: col });
      }
    }
  } else if (codex.tab === 'bond') {
    // 엘라라 유대 미션 힌트 + 상태
    if (typeof ELARA_QUESTS !== 'undefined') {
      const curBond = (state.npcQuests && state.npcQuests.elara) ? (state.npcQuests.elara.bond || 0) : 0;
      out.push({ title: '엘라라 유대: ' + curBond + ' / 10', sub: '아카데미 진입 시 조건 만족한 미션이 자동 승급됩니다', color:'#c86ade' });
      for (const q of ELARA_QUESTS) {
        const done = curBond >= q.bond;
        let curStatus = '';
        if (!done) {
          // 미완: 실시간 진행 지표를 최대한 계산 (조각/교수/방/클랜 등 카운트)
          curStatus = _elaraProgressText(q);
        }
        const title = (done ? '★ ' : '🔒 ') + 'BOND ' + q.bond + '  ·  ' + q.title;
        const sub = done ? '완료' : (q.desc + (curStatus ? '   [' + curStatus + ']' : ''));
        out.push({ title, sub, color: done ? '#3ac762' : '#c8b898' });
      }
    }
  } else if (codex.tab === 'trials') {
    if (typeof TRIAL_BOSS_DEFS !== 'undefined') {
      for (const cat of Object.keys(TRIAL_BOSS_DEFS)) {
        const d = TRIAL_BOSS_DEFS[cat];
        out.push({ title: '[STAGE 1] ' + d.name + ' (' + cat + ')',
          sub: 'HP=' + _short(d.baseHp) + '  DMG=' + d.baseDmg + '  60s 제한',
          color: d.color });
      }
      if (typeof ULTRA_TRIAL_BOSS_DEFS !== 'undefined') {
        for (const cat of Object.keys(ULTRA_TRIAL_BOSS_DEFS)) {
          const d = ULTRA_TRIAL_BOSS_DEFS[cat];
          if (!d) continue;
          out.push({ title: '[STAGE 2] ' + d.name + ' (' + cat + ')',
            sub: 'HP=' + _short(d.baseHp) + '  DMG=' + d.baseDmg + '  40s 제한  실패 시 10분 추방',
            color: '#ff2d2d' });
        }
      }
    }
  }
  return out;
}

function _short(n) {
  if (n >= 1e12) return (n/1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(1)  + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(1)  + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(1)  + 'k';
  return String(n);
}

function updateCodex(dt) {
  if (codex.messageT > 0) codex.messageT -= dt;
  const entries = codexEntries();
  const n = entries.length || 1;
  // 탭 전환
  if (keys['Digit1']) { keys['Digit1']=false; codexSetTab('perks');  sfx('hit'); }
  if (keys['Digit2']) { keys['Digit2']=false; codexSetTab('skills'); sfx('hit'); }
  if (keys['Digit3']) { keys['Digit3']=false; codexSetTab('tiers');  sfx('hit'); }
  if (keys['Digit4']) { keys['Digit4']=false; codexSetTab('trials'); sfx('hit'); }
  if (keys['Digit5']) { keys['Digit5']=false; codexSetTab('visuals'); sfx('hit'); }
  if (keys['Digit6']) { keys['Digit6']=false; codexSetTab('achieve'); sfx('hit'); }
  if (keys['Digit7']) { keys['Digit7']=false; codexSetTab('daily');   sfx('hit'); }
  if (keys['Digit8']) { keys['Digit8']=false; codexSetTab('story');   sfx('hit'); }
  if (keys['Digit9']) { keys['Digit9']=false; codexSetTab('weekly');  sfx('hit'); }
  if (keys['Tab'])    { keys['Tab']=false; const idx = CODEX_TABS.findIndex(t => t.id === codex.tab); codexSetTab(CODEX_TABS[(idx+1) % CODEX_TABS.length].id); sfx('hit'); }
  // 커서/스크롤
  if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; codex.cursor = Math.max(0, codex.cursor - 1); }
  if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; codex.cursor = Math.min(n - 1, codex.cursor + 1); }
  if (keys['PageUp'])   { keys['PageUp']=false;   codex.cursor = Math.max(0, codex.cursor - codex.visibleRows); }
  if (keys['PageDown']) { keys['PageDown']=false; codex.cursor = Math.min(n - 1, codex.cursor + codex.visibleRows); }
  if (keys['Home'])     { keys['Home']=false;     codex.cursor = 0; }
  if (keys['End'])      { keys['End']=false;      codex.cursor = n - 1; }
  if (mouse.wheel) { codex.cursor = Math.max(0, Math.min(n - 1, codex.cursor + mouse.wheel)); mouse.wheel = 0; }
  // 나가기
  if (keys['KeyR'] || keys['Escape'] || keys['KeyX']) {
    keys['KeyR']=false; keys['Escape']=false; keys['KeyX']=false;
    state.scene = 'academy';
  }
  // 마우스 클릭 - 탭 히트 / 항목 클릭
  if (mouse.down && Array.isArray(window._codexTabRects)) {
    for (const r of window._codexTabRects) {
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        mouse.down = false;
        codexSetTab(r.id);
        sfx('hit');
        return;
      }
    }
  }
  if (mouse.down && Array.isArray(window._codexRowRects)) {
    for (const r of window._codexRowRects) {
      if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
        mouse.down = false;
        codex.cursor = r.idx;
        // MODES 탭: 모드 토글
        if (codex.tab === 'modes') {
          const entries = codexEntries();
          const e = entries[r.idx];
          if (e && e._modeToggle) {
            const on = toggleGameMode(e._modeToggle);
            if (typeof showMsg === 'function') showMsg('MODE ' + e._modeToggle.toUpperCase() + (on ? ' ON' : ' OFF'), 2);
            if (typeof sfx === 'function') sfx('level');
          }
        }
        return;
      }
    }
  }
  // Space also toggles current mode row
  if (keys['Space'] && codex.tab === 'modes') {
    keys['Space'] = false;
    const entries = codexEntries();
    const e = entries[codex.cursor];
    if (e && e._modeToggle) {
      const on = toggleGameMode(e._modeToggle);
      if (typeof showMsg === 'function') showMsg('MODE ' + e._modeToggle.toUpperCase() + (on ? ' ON' : ' OFF'), 2);
      if (typeof sfx === 'function') sfx('level');
    }
  }
}

function renderCodex() {
  ctx.fillStyle = '#050310';
  ctx.fillRect(0, 0, W*PX, H*PX);
  bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  // 헤더
  pxDraw(0, 0, W, 12, '#1a0e2e');
  drawText('CODEX - GAME ENCYCLOPEDIA', 4, 3, '#ffefa8');
  drawText('[TAB] SWITCH  [1-9] TAB  [R/ESC/X] BACK', W - textWidth('[TAB] SWITCH  [1-9] TAB  [R/ESC/X] BACK') - 4, 3, '#8a7ab5');

  // 탭 4개
  const tabW = 38, tabY = 14, tabH = 10;
  window._codexTabRects = [];
  for (let i = 0; i < CODEX_TABS.length; i++) {
    const t = CODEX_TABS[i];
    const x = 8 + i * (tabW + 4);
    const active = codex.tab === t.id;
    pxDraw(x, tabY, tabW, tabH, active ? '#3a1e5c' : '#1a0e2e');
    if (active) pxDraw(x, tabY + tabH, tabW, 1, '#ffefa8');
    drawText((i+1) + ' ' + t.name, x + tabW/2 - textWidth((i+1) + ' ' + t.name)/2, tabY + 2, active ? '#ffefa8' : '#8a7ab5');
    window._codexTabRects.push({ id: t.id, x, y: tabY, w: tabW, h: tabH });
  }

  // 내용 영역
  const entries = codexEntries();
  const bodyX = 8, bodyY = 30, bodyW = W - 16;
  const rowH = 13;
  const bodyH = codex.visibleRows * rowH;
  pxDraw(bodyX, bodyY, bodyW, bodyH + 4, '#0a0512');
  pxDraw(bodyX, bodyY, bodyW, 1, '#3a1e5c');
  pxDraw(bodyX, bodyY + bodyH + 3, bodyW, 1, '#3a1e5c');

  // 스크롤 오프셋 자동 정렬
  let scroll = codex.scroll;
  if (codex.cursor < scroll) scroll = codex.cursor;
  if (codex.cursor >= scroll + codex.visibleRows) scroll = codex.cursor - codex.visibleRows + 1;
  scroll = Math.max(0, Math.min(scroll, Math.max(0, entries.length - codex.visibleRows)));
  codex.scroll = scroll;

  window._codexRowRects = [];
  for (let vi = 0; vi < codex.visibleRows; vi++) {
    const i = scroll + vi;
    if (i >= entries.length) break;
    const e = entries[i];
    const ry = bodyY + 2 + vi * rowH;
    const isSel = codex.cursor === i;
    if (isSel) pxDraw(bodyX + 2, ry, bodyW - 4, rowH - 1, '#2a1548');
    // 텍스트: visual 탭이면 좌측 프리뷰 자리 확보
    const textX = e.isVisual ? bodyX + 42 : bodyX + 6;
    drawText(e.title, textX, ry, e.color || '#e8d9b0');
    drawText(e.sub, textX, ry + 6, '#8a7ab5');
    if (typeof e.owned === 'number' && e.maxLv >= 1) {
      const own = 'LV ' + e.owned + '/' + e.maxLv;
      drawText(own, bodyX + bodyW - textWidth(own) - 6, ry, e.owned >= e.maxLv ? '#3ac762' : '#c8b898');
    }
    // === 투사체 미리보기 (visuals 탭) - 왼쪽에 애니메이션 샘플 ===
    if (e.isVisual && typeof BULLET_VISUALS !== 'undefined') {
      const v = BULLET_VISUALS[e.visualName];
      if (v && v.draw) {
        const px = bodyX + 20;
        const py = ry + rowH / 2 - 1;
        // 배경 박스
        pxDraw(bodyX + 6, ry, 30, rowH - 1, '#050510');
        // motion 시각화용 fake bullet (좌→우 이동 궤적 시뮬)
        const t = state.time * 60;
        const travel = (t + i * 7) % 24;   // 좌→우 반복
        const startX = bodyX + 8, endX = bodyX + 32;
        const bx = startX + travel;
        // motion 오프셋 미리보기용 fake bullet 상태
        const fake = { x: bx, y: py, vx: 60, vy: 0, r: 3, kind: 'fire', _age: state.time + i };
        // move 함수가 있으면 y 오프셋을 한 프레임 시뮬해서 보여줌
        if (v.move) {
          const savedY = fake.y;
          try { v.move(fake, 1/60); } catch(_) {}
          fake.y = savedY + (fake.y - savedY) * 3;   // 살짝 과장
        }
        try { v.draw(fake, 0); } catch(_) {}
      }
    }
    window._codexRowRects.push({ idx: i, x: bodyX, y: ry - 1, w: bodyW, h: rowH });
  }

  // 스크롤바
  const trackX = bodyX + bodyW - 3;
  const trackY = bodyY + 2;
  pxDraw(trackX, trackY, 2, bodyH, '#1a0e2e');
  if (entries.length > codex.visibleRows) {
    const thumbH = Math.max(6, Math.floor(bodyH * codex.visibleRows / entries.length));
    const thumbY = trackY + Math.floor((bodyH - thumbH) * scroll / (entries.length - codex.visibleRows));
    pxDraw(trackX, thumbY, 2, thumbH, '#ffefa8');
  }

  // 총 개수 표시
  const total = 'TOTAL ' + entries.length;
  drawText(total, W - textWidth(total) - 4, H - 10, '#8a7ab5');
  drawText('WASD/WHEEL SCROLL   ' + (codex.cursor + 1) + '/' + entries.length, 4, H - 10, '#8a7ab5');
}
