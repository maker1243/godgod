// =====================================================================
// Rooms / dungeon gen / scene transitions / spawn
// =====================================================================

// ---------- 방/던전 ----------
const rooms = [];
let currentRoom = 0;
let entities = {
  enemies: [],
  bullets: [],       // 아군 발사체
  ebullets: [],      // 적 발사체
  particles: [],
  floats: [],        // 데미지 숫자
  pickups: [],
  doors: [],
  fx: [],            // 화면 효과 (시간정지 등)
};

// 층 데이터
let floor = 1;
let cleared = 0;

// 시간 정지 상태
let timeStopT = 0;

// 층별 설정 (테마, 보스, 팔레트) - 10층
const FLOOR_DATA = [
  { name:'CRYPT OF ROOTS',    subtitle:'THE FORGOTTEN GARDEN', boss:'knight',   bossName:'THE ROTTEN KNIGHT',
    wall:'#3a1e5c', wallLight:'#5a2e8c', floor:'#1a0e2e', floorAlt:'#241442', enemies:['slime','slime','bat'] },
  { name:'HALL OF BONES',     subtitle:'WHERE OLD KINGS SLEEP', boss:'colossus', bossName:'BONE COLOSSUS',
    wall:'#4a3a2a', wallLight:'#6a5a3a', floor:'#1a1610', floorAlt:'#241f14', enemies:['skeleton','skeleton','imp'] },
  { name:'SHADOW ARCHIVE',    subtitle:'THE UNREAD PAGES', boss:'seer',    bossName:'THE SHADOW SEER',
    wall:'#1a1a3a', wallLight:'#2a2a5a', floor:'#0a0a20', floorAlt:'#141430', enemies:['wraith','skeleton','spider'] },
  { name:'THE LICH VAULT',    subtitle:'A CIRCLE STILL BURNS', boss:'lich',    bossName:'THE LICH',
    wall:'#4a1a1a', wallLight:'#6a2a2a', floor:'#1a0a0a', floorAlt:'#241010', enemies:['wraith','cultist','wraith'] },
  { name:'THE CHRONO CORE',   subtitle:'THE HEART OF TIME', boss:'core',    bossName:'THE CHRONO CORE',
    wall:'#3a2a5c', wallLight:'#7a5abc', floor:'#0a0512', floorAlt:'#14082a', enemies:['wraith','golem','cultist'] },
  { name:'BLIGHTED GARDEN',   subtitle:'GROWTH TURNED HUNGRY', boss:'knight',   bossName:'BLIGHTED KNIGHT',
    wall:'#2a4a1a', wallLight:'#3a6a2a', floor:'#0a1a0a', floorAlt:'#142010', enemies:['slime','spider','imp'] },
  { name:'THE OSSUARY DEEP',  subtitle:'MARROW MEMORIES',      boss:'colossus', bossName:'GREATER OSSUARY',
    wall:'#5a4a3a', wallLight:'#8a7a5a', floor:'#20180f', floorAlt:'#2a2018', enemies:['skeleton','imp','golem'] },
  { name:'VOID LIBRARY',      subtitle:'PAGES WRITTEN IN VOID', boss:'seer',    bossName:'VOID SEER',
    wall:'#0a1a3a', wallLight:'#1a2a5a', floor:'#050a20', floorAlt:'#0a1030', enemies:['wraith','cultist','bat'] },
  { name:'NECROPOLIS',        subtitle:'CITY OF THE STILL',    boss:'lich',    bossName:'ARCHLICH',
    wall:'#6a1a1a', wallLight:'#8a2a2a', floor:'#2a0505', floorAlt:'#3a0a0a', enemies:['wraith','imp','cultist'] },
  { name:'THE TIME FRACTURE', subtitle:'ALL MOMENTS AT ONCE',  boss:'core',    bossName:'PRIME CHRONO CORE',
    wall:'#5a3a7a', wallLight:'#9a7adc', floor:'#150822', floorAlt:'#20103a', enemies:['golem','cultist','wraith'] },
];

// === 엑스트라 모드 - 일반 클리어(finalCleared > 0) 후 해금 ===
// === 익스트림 하드 모드 - 엑스트라 클리어(finalCleared >= 2) 후 해금 ===
// - 모든 적이 방 진입 시 랜덤 버프 (더 강함/빠름/큼)
// - 적 처치 시 XP 안 주고 골드만
// - 신규 보스, 신규 잡몹 등장
const EXTREME_FLOOR_DATA = [
  { name:'BLOOD SANCTUM',      subtitle:'THE FIRST TRIAL',        boss:'dragonlord',   bossName:'BLOOD DRAGONLORD',
    wall:'#6a0a0a', wallLight:'#a01515', floor:'#1a0000', floorAlt:'#2a0505', enemies:['imp','spider','cultist','bat'] },
  { name:'VOID CATACOMBS',     subtitle:'THE SECOND TRIAL',       boss:'voidempress',  bossName:'PRIMAL EMPRESS',
    wall:'#1a0a4a', wallLight:'#3a1a8a', floor:'#050015', floorAlt:'#0a0525', enemies:['wraith','cultist','imp','spider'] },
  { name:'ETERNAL FORGE',      subtitle:'THE THIRD TRIAL',        boss:'chronomancer', bossName:'ETERNAL AEON',
    wall:'#4a4a1a', wallLight:'#8a8a2a', floor:'#1a1a05', floorAlt:'#252510', enemies:['golem','cultist','imp','bat'] },
  { name:'THE BROKEN GATE',    subtitle:'BEYOND THE VEIL',        boss:'lich',         bossName:'GATE LICH',
    wall:'#5a1a5a', wallLight:'#9a2a9a', floor:'#15051a', floorAlt:'#2a0a2a', enemies:['wraith','voidempress','cultist','spider'] },
  { name:'ANNIHILATION',       subtitle:'YOU SHOULD NOT BE HERE', boss:'chronomancer', bossName:'THE END',
    wall:'#0a0a0a', wallLight:'#3a3a3a', floor:'#000000', floorAlt:'#050505', enemies:['dragonlord','voidempress','chronomancer','golem'] },
];

// === 전역 난이도 (모든 던전/아레나 모드 위에 곱해지는 배율) ===
// state.difficulty 는 아카데미에서 사이클 가능. 잡몹 기본 HP 를 tier.hpBase 로 오버라이드하고
// 데미지/보스 HP 는 배율로 스케일.
// rpPerKill:   잡몹 처치 시 얻는 연구(RP)
// gpaPerKill:  잡몹 처치 시 얻는 GPA (상한 없음)
// rpBossMult:  층 보스 클리어 시 기본 RP(=5*floor) 에 곱해지는 배율
// gpaFinalMult: 최종 클리어 시 기본 GPA 보상(+0.6) 에 곱해지는 배율
const DIFFICULTY_TIERS = [
  { id:'normal',    name:'일반',            color:'#8bd8ff', hpBase:0,           dmgMult:1.0,    bossHpMult:1.0,    rpPerKill:0,    gpaPerKill:0,     rpBossMult:1,    gpaFinalMult:1    },
  { id:'hard',      name:'하드',            color:'#e8c547', hpBase:400,         dmgMult:1.8,    bossHpMult:2.5,    rpPerKill:1,    gpaPerKill:0.005, rpBossMult:1.5,  gpaFinalMult:1.5  },
  { id:'brutal',    name:'브루탈',          color:'#ff9c3d', hpBase:2500,        dmgMult:3.5,    bossHpMult:6.0,    rpPerKill:3,    gpaPerKill:0.01,  rpBossMult:2.5,  gpaFinalMult:2.5  },
  { id:'hell',      name:'지옥의 수문지기', color:'#ff2d2d', hpBase:35000,       dmgMult:8.0,    bossHpMult:15.0,   rpPerKill:8,    gpaPerKill:0.02,  rpBossMult:5,    gpaFinalMult:5    },
  { id:'nightmare', name:'악몽',            color:'#c86ade', hpBase:40000,       dmgMult:14.0,   bossHpMult:25.0,   rpPerKill:15,   gpaPerKill:0.04,  rpBossMult:10,   gpaFinalMult:8    },
  { id:'abyss',     name:'심연',            color:'#7a3adc', hpBase:80000,       dmgMult:24.0,   bossHpMult:40.0,   rpPerKill:30,   gpaPerKill:0.08,  rpBossMult:20,   gpaFinalMult:15   },
  { id:'apocalypse',name:'종말',            color:'#ff00ff', hpBase:200000,      dmgMult:45.0,   bossHpMult:80.0,   rpPerKill:60,   gpaPerKill:0.15,  rpBossMult:40,   gpaFinalMult:25   },
  { id:'oblivion',  name:'망각',            color:'#ff2d80', hpBase:500000,      dmgMult:80.0,   bossHpMult:150.0,  rpPerKill:120,  gpaPerKill:0.3,   rpBossMult:80,   gpaFinalMult:50   },
  { id:'godslayer', name:'신 학살자',       color:'#ffefa8', hpBase:1500000,     dmgMult:150.0,  bossHpMult:300.0,  rpPerKill:250,  gpaPerKill:0.6,   rpBossMult:150,  gpaFinalMult:100  },
  { id:'primalfear',name:'태초의 공포',     color:'#ff5a1a', hpBase:5000000,     dmgMult:280.0,  bossHpMult:600.0,  rpPerKill:500,  gpaPerKill:1.2,   rpBossMult:300,  gpaFinalMult:200  },
  { id:'cosmicend', name:'우주의 종말',     color:'#5affff', hpBase:15000000,    dmgMult:500.0,  bossHpMult:1200.0, rpPerKill:1000, gpaPerKill:2.5,   rpBossMult:600,  gpaFinalMult:400  },
  { id:'infabyss',  name:'무한의 심연',     color:'#9a00ff', hpBase:50000000,    dmgMult:1000.0, bossHpMult:2500.0, rpPerKill:2000, gpaPerKill:5.0,   rpBossMult:1200, gpaFinalMult:800  },
  { id:'absolute',  name:'절대자',          color:'#ffaa00', hpBase:200000000,   dmgMult:2200.0, bossHpMult:5500.0, rpPerKill:4500, gpaPerKill:12.0,  rpBossMult:2800, gpaFinalMult:1800 },
  { id:'void',      name:'무',              color:'#ffffff', hpBase:1000000000,     dmgMult:5000.0,   bossHpMult:12000,   rpPerKill:10000,   gpaPerKill:30.0,   rpBossMult:6500,   gpaFinalMult:4000   },
  { id:'singular',  name:'특이점',          color:'#0affaa', hpBase:5000000000,     dmgMult:12000.0,  bossHpMult:28000,   rpPerKill:25000,   gpaPerKill:75.0,   rpBossMult:15000,  gpaFinalMult:10000  },
  { id:'omega',     name:'오메가',          color:'#ff008a', hpBase:25000000000,    dmgMult:28000.0,  bossHpMult:65000,   rpPerKill:60000,   gpaPerKill:180.0,  rpBossMult:35000,  gpaFinalMult:25000  },
  { id:'ragnarok',  name:'라그나로크',      color:'#ffb84a', hpBase:100000000000,   dmgMult:65000.0,  bossHpMult:150000,  rpPerKill:140000,  gpaPerKill:420.0,  rpBossMult:80000,  gpaFinalMult:60000  },
  { id:'eldergod',  name:'태고의 신',       color:'#7affff', hpBase:500000000000,   dmgMult:150000.0, bossHpMult:350000,  rpPerKill:320000,  gpaPerKill:1000.0, rpBossMult:180000, gpaFinalMult:140000 },
  { id:'creator',   name:'창조주',          color:'#fff8a0', hpBase:2500000000000,      dmgMult:350000,   bossHpMult:800000,    rpPerKill:750000,   gpaPerKill:2400,   rpBossMult:420000,  gpaFinalMult:320000  },
  { id:'destroyer', name:'파괴자',          color:'#ff3333', hpBase:1e13,               dmgMult:800000,   bossHpMult:2000000,   rpPerKill:1.8e6,    gpaPerKill:5500,   rpBossMult:1e6,     gpaFinalMult:750000  },
  { id:'devourer',  name:'포식자',          color:'#8000ff', hpBase:5e13,               dmgMult:1.8e6,    bossHpMult:5000000,   rpPerKill:4e6,      gpaPerKill:12500,  rpBossMult:2.5e6,   gpaFinalMult:1.8e6   },
  { id:'transcend', name:'초월자',          color:'#00ffcc', hpBase:2e14,               dmgMult:4.2e6,    bossHpMult:1.2e7,     rpPerKill:9e6,      gpaPerKill:28000,  rpBossMult:5.5e6,   gpaFinalMult:4e6     },
  { id:'ancient',   name:'태고의 존재',     color:'#ff0080', hpBase:1e15,               dmgMult:1e7,      bossHpMult:3e7,       rpPerKill:2e7,      gpaPerKill:65000,  rpBossMult:1.3e7,   gpaFinalMult:9e6     },
  { id:'infinity',  name:'무한',            color:'#f0ffff', hpBase:5e15,               dmgMult:2.5e7,    bossHpMult:8e7,       rpPerKill:5e7,      gpaPerKill:150000, rpBossMult:3e7,     gpaFinalMult:2e7     },
  { id:'primeone',  name:'원초의 자',       color:'#ff00c0', hpBase:2.5e16,             dmgMult:6e7,      bossHpMult:2e8,       rpPerKill:1.2e8,    gpaPerKill:350000, rpBossMult:7e7,     gpaFinalMult:5e7     },
  { id:'unmaker',   name:'파훼자',          color:'#000000', hpBase:1e17,               dmgMult:1.5e8,    bossHpMult:5e8,       rpPerKill:3e8,      gpaPerKill:800000, rpBossMult:1.7e8,   gpaFinalMult:1.2e8   },
];
function currentDifficulty() {
  const id = state.difficulty || 'normal';
  return DIFFICULTY_TIERS.find(d => d.id === id) || DIFFICULTY_TIERS[0];
}
function cycleDifficulty() {
  const idx = DIFFICULTY_TIERS.findIndex(d => d.id === (state.difficulty || 'normal'));
  const next = DIFFICULTY_TIERS[(idx + 1) % DIFFICULTY_TIERS.length];
  state.difficulty = next.id;
  if (typeof showMsg === 'function') showMsg('DIFFICULTY: ' + next.name.toUpperCase(), 2);
  if (typeof saveAccountData === 'function') saveAccountData();
}

// === 인페르노 모드 - 익스트림 클리어(finalCleared >= 3) 후 해금 ===
// - 방 진입 시 랜덤 버프 3개 중첩
// - 기본 HP/DMG 3배 프리스케일 (버프 적용 이전에)
// - 신규 층 순서 + 최종보스는 chronomancer/voidempress 혼합 스폰
// - 층 수 7 (익스트림의 5 초과)
const INFERNO_FLOOR_DATA = [
  { name:'ASHEN THRESHOLD',   subtitle:'ONLY ASH REMAINS',    boss:'dragonlord',   bossName:'ASHEN DRAGONLORD',
    wall:'#7a0505', wallLight:'#c81616', floor:'#150000', floorAlt:'#250505', enemies:['imp','spider','cultist','bat','wraith'] },
  { name:'BROKEN CATHEDRAL',  subtitle:'THE ALTAR SCREAMS',   boss:'voidempress',  bossName:'EMPRESS OF NOTHING',
    wall:'#3a0a5a', wallLight:'#7a1adc', floor:'#0a0015', floorAlt:'#150525', enemies:['wraith','cultist','voidempress','spider'] },
  { name:'GEAR HELL',         subtitle:'TIME IS A WOUND',     boss:'chronomancer', bossName:'GEAR CHRONOMANCER',
    wall:'#6a5a1a', wallLight:'#c8a02a', floor:'#1a1500', floorAlt:'#252005', enemies:['golem','cultist','imp','bat','spider'] },
  { name:'DEAD GARDEN',       subtitle:'ROOT AND ROT',        boss:'lich',         bossName:'GARDEN LICH',
    wall:'#0a3a1a', wallLight:'#1a7a3a', floor:'#001a05', floorAlt:'#052510', enemies:['wraith','skeleton','imp','spider','cultist'] },
  { name:'HELLGATE',          subtitle:'IT OPENS INWARD',     boss:'dragonlord',   bossName:'HELLGATE KEEPER',
    wall:'#8a0a0a', wallLight:'#e02a2a', floor:'#200000', floorAlt:'#300505', enemies:['dragonlord','voidempress','cultist','wraith'] },
  { name:'THE DEAD SKY',      subtitle:'STARS AS SCARS',      boss:'voidempress',  bossName:'STARLESS EMPRESS',
    wall:'#0a0a2a', wallLight:'#2a2a5a', floor:'#000010', floorAlt:'#050525', enemies:['voidempress','wraith','chronomancer','golem'] },
  { name:'INFERNO',           subtitle:'THIS IS THE FLOOR',   boss:'chronomancer', bossName:'INFERNO AEON',
    wall:'#000000', wallLight:'#5a0000', floor:'#000000', floorAlt:'#0a0000', enemies:['chronomancer','dragonlord','voidempress','lich'] },
];

// 인페르노 모드에서 방 진입 시 몹에 3개 중첩되는 강력 버프
const INFERNO_ROOM_BUFFS = [
  { id:'ruin',       name:'RUIN',       desc:'x2 DMG',        apply:e=>{ e.dmg = Math.floor(e.dmg * 2.0); } },
  { id:'blitz',      name:'BLITZ',      desc:'x2 SPD',        apply:e=>{ e.speed = Math.floor(e.speed * 2.0); } },
  { id:'titan',      name:'TITAN',      desc:'x2 HP + LARGE', apply:e=>{ e.hp = Math.floor(e.hp * 2.0); e.maxHp = e.hp; e.r = Math.floor(e.r * 1.4); } },
  { id:'frenzy',     name:'FRENZY',     desc:'ATTACK x3',     apply:e=>{ if (e.shootCd) e.shootCd /= 3; if (e.attackCd) e.attackCd /= 3; if (e.spellCd) e.spellCd /= 3; if (e.smashCd) e.smashCd /= 3; } },
  { id:'revival',    name:'REVIVAL',    desc:'HEAVY REGEN',   apply:e=>{ e._regen = 1 + e.maxHp * 0.04; } },
  { id:'spikes',     name:'SPIKES',     desc:'THORNS x2',     apply:e=>{ e._thorns = Math.ceil(e.dmg * 0.6); } },
  { id:'volatile',   name:'VOLATILE',   desc:'EXPLODE',       apply:e=>{ e._explode = true; } },
  { id:'shielded',   name:'SHIELDED',   desc:'25% RES',       apply:e=>{ e._dmgRed = (e._dmgRed || 0) + 0.25; } },
];

// 익스트림 모드에서 방 진입 시 몹에 적용되는 랜덤 버프 종류
const EXTREME_ROOM_BUFFS = [
  { id:'brutal',    name:'BRUTAL',    desc:'ENEMIES DEAL x1.5 DMG',   apply:e=>{ e.dmg = Math.floor(e.dmg * 1.5); } },
  { id:'swift',     name:'SWIFT',     desc:'ENEMIES MOVE x1.5 SPEED', apply:e=>{ e.speed = Math.floor(e.speed * 1.5); } },
  { id:'tough',     name:'TOUGH',     desc:'ENEMIES HAVE x1.5 HP',    apply:e=>{ e.hp = Math.floor(e.hp * 1.5); e.maxHp = e.hp; } },
  { id:'giant',     name:'GIANT',     desc:'ENEMIES ARE LARGER',       apply:e=>{ e.r = Math.floor(e.r * 1.5); e.hp = Math.floor(e.hp * 1.3); e.maxHp = e.hp; } },
  { id:'fast_att',  name:'FRENZIED',  desc:'ENEMIES ATTACK 2X',        apply:e=>{ if (e.shootCd) e.shootCd *= 0.5; if (e.attackCd) e.attackCd *= 0.5; if (e.spellCd) e.spellCd *= 0.5; if (e.smashCd) e.smashCd *= 0.5; } },
  { id:'regen',     name:'REGEN',     desc:'ENEMIES REGENERATE',       apply:e=>{ e._regen = 0.5 + e.maxHp * 0.02; } },
  { id:'thorny',    name:'THORNY',    desc:'ENEMIES REFLECT DMG',      apply:e=>{ e._thorns = Math.ceil(e.dmg * 0.3); } },
  { id:'exploding', name:'EXPLOSIVE', desc:'ENEMIES EXPLODE ON DEATH', apply:e=>{ e._explode = true; } },
];

const EXTRA_FLOOR_DATA = [
  { name:'CRIMSON ROOST',      subtitle:'DRAGONS OLD AND NEW',   boss:'dragonlord',   bossName:'DRAGONLORD ATROX',
    wall:'#4a1010', wallLight:'#7a2020', floor:'#1a0505', floorAlt:'#2a0a0a', enemies:['imp','bat','spider'] },
  { name:'THE HOLLOW COURT',   subtitle:'WHERE JUDGES DIE',      boss:'voidempress',  bossName:'VOID EMPRESS NYX',
    wall:'#2a0a4a', wallLight:'#4a1a7a', floor:'#0a051a', floorAlt:'#150a2a', enemies:['wraith','cultist','wraith'] },
  { name:'CLOCKWORK GRAVE',    subtitle:'TIME EATS ITSELF',      boss:'chronomancer', bossName:'CHRONOMANCER AEON',
    wall:'#3a3a5a', wallLight:'#6a6a9a', floor:'#0a0a1a', floorAlt:'#1a1a2a', enemies:['golem','cultist','spider'] },
  { name:'ABYSSAL DEPTH',      subtitle:'BENEATH ALL FLOORS',    boss:'dragonlord',   bossName:'ANCIENT ATROX',
    wall:'#1a3a4a', wallLight:'#2a5a7a', floor:'#050f1a', floorAlt:'#0a1a2a', enemies:['cultist','imp','golem'] },
  { name:'THE UNMAKING',       subtitle:'END OF ENDS',           boss:'chronomancer', bossName:'PRIMAL AEON',
    wall:'#5a0a5a', wallLight:'#9a2a9a', floor:'#1a051a', floorAlt:'#2a0a2a', enemies:['voidempress','cultist','wraith'] },
];

// === 시련의 방 (MAX 트리 해금 특별 던전) ===
// 1층 · 1방(=보스방). 60초 안에 잡으면 MAX 트리 해금.
const TRIAL_FLOOR_DATA = [
  { name:'시련의 방', subtitle:'THE TRIAL', boss:'chronomancer', bossName:'TRIAL GUARDIAN',
    wall:'#4a0a4a', wallLight:'#9a2a9a', floor:'#100010', floorAlt:'#20052a',
    enemies:['imp','wraith','cultist'], isTrial: true },
];

// === 교수 층 (Floor 2) - CIPHER 문 통과 후 PROF 문으로 진입 ===
const PROFESSOR_FLOOR_DATA = [
  { name:'2층: 교수 연구실', subtitle:'THE FACULTY WING', boss:'professor', bossName:'THE FACULTY',
    wall:'#3a3a5a', wallLight:'#6a6a9a', floor:'#0a0a1a', floorAlt:'#1a1a2a', enemies:['imp'] },
];

function currentFloorData() {
  if (state.dungeonMode === 'professor') return PROFESSOR_FLOOR_DATA[0];
  if (state.dungeonMode === 'trial')   return TRIAL_FLOOR_DATA[0];
  if (state.dungeonMode === 'inferno') return INFERNO_FLOOR_DATA[floor - 1];
  if (state.dungeonMode === 'extreme') return EXTREME_FLOOR_DATA[floor - 1];
  if (state.dungeonMode === 'extra')   return EXTRA_FLOOR_DATA[floor - 1];
  return FLOOR_DATA[floor - 1];
}
function currentFloorTotal() {
  if (state.dungeonMode === 'professor') return PROFESSOR_FLOOR_DATA.length;
  if (state.dungeonMode === 'trial')   return TRIAL_FLOOR_DATA.length;   // 1
  if (state.dungeonMode === 'inferno') return INFERNO_FLOOR_DATA.length;
  if (state.dungeonMode === 'extreme') return EXTREME_FLOOR_DATA.length;
  if (state.dungeonMode === 'extra')   return EXTRA_FLOOR_DATA.length;
  return FLOOR_DATA.length;
}

function newDungeon() {
  floor = 1;
  cleared = 0;
  rooms.length = 0;
  currentRoom = 0;
  timeStopT = 0;
  clearEntities();
  buildRoom(1);
  state.cam.x = 0; state.cam.y = 0;
  // MAX 스킬 해금 판정용: 던전 진입 시각
  state.dungeonStart = performance.now();
  // 죽음 파우치 재획득: 같은 mode+floor 에서 죽었으면 그 자리에 골드 파우치 스폰
  if (state.deathPouch && state.deathPouch.gold > 0 && state.deathPouch.mode === (state.dungeonMode || 'normal') && state.deathPouch.floor === floor) {
    const room = rooms[currentRoom];
    if (room) {
      const px = clamp(state.deathPouch.x, room.x + 8, room.x + room.w - 8);
      const py = clamp(state.deathPouch.y, room.y + 8, room.y + room.h - 8);
      entities.pickups.push({ x: px, y: py, kind: 'pouch', life: 9999, bob: 0, amount: state.deathPouch.gold });
      showMsg('당신의 유품이 있습니다. 회수하세요.', 3);
    }
  }
}

function nextFloor() {
  floor++;
  currentRoom = 0;
  rooms.length = 0;
  timeStopT = 0;
  clearEntities();
  buildRoom(1);
  state.cam.x = 0; state.cam.y = 0;
  const fd = currentFloorData();
  showMsg('FLOOR ' + floor + ' - ' + fd.name, 3);
}

function clearEntities() {
  entities.enemies = [];
  entities.bullets = [];
  entities.ebullets = [];
  entities.particles = [];
  entities.floats = [];
  entities.pickups = [];
  entities.doors = [];
  entities.fx = [];
}

// 방 구조: 벽으로 둘러싸인 사각형 방, 문은 벽에 위치
function buildRoom(roomIndex) {
  clearEntities();
  // 시련/교수 모드: 방 하나 = 보스방. 5방 대신 즉시 보스.
  const isTrial = state.dungeonMode === 'trial';
  const isProf  = state.dungeonMode === 'professor';
  const isBoss = (isTrial || isProf) ? true : (roomIndex === 5);
  const w = isBoss ? 300 : 260 + randi(0, 40);
  const h = isBoss ? 180 : 150 + randi(0, 30);

  // 방 데이터
  const room = {
    x: (W - w) / 2 + randi(-10, 10),
    y: (H - h) / 2 + randi(-10, 10),
    w, h,
    isBoss,
    cleared: false,
    index: roomIndex,
  };
  rooms[roomIndex - 1] = room;

  // 플레이어 배치 (왼쪽 문 근처)
  player.x = room.x + 20;
  player.y = room.y + h/2;
  player.vx = 0; player.vy = 0;
  player.rolling = 0;
  player.invuln = 0.6;

  // 적 스폰
  if (isBoss) {
    if (state.dungeonMode === 'professor' && state.facultyKey && typeof spawnFacultyProfessors === 'function') {
      // 계열 시련 - 두 교수 동시 스폰
      spawnFacultyProfessors(room);
    } else if (state.dungeonMode === 'professor' && typeof spawnProfessor === 'function') {
      spawnProfessor(room, roomIndex);
    } else if (state.dungeonMode === 'trial' && typeof spawnTrialBoss === 'function') {
      spawnTrialBoss(room);
    } else {
      spawnBoss(room);
    }
  } else {
    const enemyCount = 3 + roomIndex;
    for (let i = 0; i < enemyCount; i++) {
      const kind = pickEnemyKind(roomIndex);
      spawnEnemy(kind, room);
    }
  }
  // 익스트림 모드: 방 진입 시 이 방의 모든 몹에 랜덤 버프 하나 부여
  if (state.dungeonMode === 'extreme' && entities.enemies.length > 0) {
    const buff = EXTREME_ROOM_BUFFS[randi(0, EXTREME_ROOM_BUFFS.length)];
    for (const e of entities.enemies) {
      buff.apply(e);
      e._extremeBuff = buff.id;
    }
    showMsg('ROOM BUFF: ' + buff.name + ' - ' + buff.desc, 3);
    sfx('hurt');
  }
  // 인페르노 모드: 몹 스탯 프리스케일(HP x3, DMG x2, SPD x1.3) + 랜덤 버프 3개 중첩
  if (state.dungeonMode === 'inferno' && entities.enemies.length > 0) {
    for (const e of entities.enemies) {
      e.hp = Math.floor(e.hp * 3);
      e.maxHp = e.hp;
      e.dmg = Math.floor((e.dmg || 0) * 2);
      e.speed = Math.floor((e.speed || 0) * 1.3);
    }
    const pool = [...INFERNO_ROOM_BUFFS];
    const chosen = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = randi(0, pool.length);
      chosen.push(pool[idx]);
      pool.splice(idx, 1);
    }
    for (const e of entities.enemies) for (const b of chosen) b.apply(e);
    showMsg('INFERNO: ' + chosen.map(b=>b.name).join(' + '), 3);
    sfx('hurt');
  }
}

function pickEnemyKind(roomIndex) {
  const fd = currentFloorData();
  const pool = fd.enemies;
  // 방이 깊어질수록 강한 적 비중
  const r = Math.random();
  if (roomIndex <= 2) return pool[randi(0, pool.length)];
  // 3-4방: 강한 쪽으로 편향
  return pool[Math.min(pool.length - 1, randi(1, pool.length + 1))];
}

function spawnEnemy(kind, room) {
  const margin = 25;
  let x, y, tries = 0;
  do {
    x = room.x + margin + Math.random() * (room.w - margin * 2);
    y = room.y + margin + Math.random() * (room.h - margin * 2);
    tries++;
  } while (dist({x,y}, player) < 50 && tries < 20);

  const base = { x, y, vx: 0, vy: 0, hitFlash: 0, kind, freeze: 0, slow: 0, stun: 0, attackCd: 0 };
  if (kind === 'slime') {
    Object.assign(base, { r: 5, hp: 12 + floor*4, dmg: 8, speed: 22, xp: 2, gold: 1 });
  } else if (kind === 'skeleton') {
    Object.assign(base, { r: 5, hp: 20 + floor*6, dmg: 12, speed: 34, xp: 4, gold: 2, shootCd: rand(1, 2.5) });
  } else if (kind === 'wraith') {
    Object.assign(base, { r: 6, hp: 30 + floor*8, dmg: 16, speed: 44, xp: 6, gold: 3, teleCd: rand(2, 4) });
  } else if (kind === 'bat') {
    // 빠른 지그재그 - HP 낮음, 스피드 높음
    Object.assign(base, { r: 4, hp: 8 + floor*3, dmg: 6, speed: 70, xp: 3, gold: 1, zigT: rand(0, 6.28) });
  } else if (kind === 'imp') {
    // 근접 러쉬 - 중간 HP, 접근 시 폭발
    Object.assign(base, { r: 5, hp: 18 + floor*5, dmg: 18, speed: 50, xp: 4, gold: 2, chargeCd: 0 });
  } else if (kind === 'golem') {
    // 느리고 강함 - HP 매우 높음, 근접 스매시
    Object.assign(base, { r: 8, hp: 80 + floor*20, dmg: 22, speed: 14, xp: 12, gold: 6, smashCd: rand(2, 3.5) });
  } else if (kind === 'spider') {
    // 매우 빠름 - HP 매우 낮음, 러쉬
    Object.assign(base, { r: 3, hp: 6 + floor*2, dmg: 10, speed: 90, xp: 3, gold: 1 });
  } else if (kind === 'cultist') {
    // 원거리 마법 - 중간 HP, 자주색 볼트 3-way
    Object.assign(base, { r: 5, hp: 25 + floor*7, dmg: 14, speed: 20, xp: 5, gold: 3, spellCd: rand(1.5, 3) });
  }
  // 전역 난이도 적용: hpBase 지정된 티어면 잡몹 HP 를 그 값으로 오버라이드.
  const diff = currentDifficulty();
  if (diff.hpBase > 0) base.hp = diff.hpBase;
  if (diff.dmgMult !== 1) base.dmg = Math.round((base.dmg || 0) * diff.dmgMult);
  // 엘리트 몹: 5% 확률. HP×3, DMG×1.5, 크게 그림, 처치 시 RP 조각 확정 드롭.
  if (Math.random() < 0.05) {
    base.isElite = true;
    base.hp = Math.floor(base.hp * 3);
    base.dmg = Math.floor(base.dmg * 1.5);
    base.r = Math.max(4, Math.floor(base.r * 1.4));
    base.speed = Math.max(10, Math.floor((base.speed || 0) * 0.9));
    base._eliteRp = Math.max(50, Math.floor(20 * Math.pow(2, DIFFICULTY_TIERS.findIndex(d => d.id === (state.difficulty || 'normal')))));
  }
  base.maxHp = base.hp;
  entities.enemies.push(base);
}

function spawnBoss(room) {
  const fd = currentFloorData();
  const kind = fd.boss;
  const cx = room.x + room.w/2;
  const cy = room.y + 50;
  // 층 스케일 (레벨 상승에 따른 배율)
  const scale = 1 + (floor - 1) * 0.25;

  let boss;
  if (kind === 'knight') {
    boss = { x:cx, y:cy, vx:0, vy:0, r:8, kind, hp:220*scale, dmg:16, speed:38, xp:30, gold:20,
             chargeT:0, chargeCd:2.5, slamCd:3.5, phase:0 };
  } else if (kind === 'colossus') {
    boss = { x:cx, y:cy, vx:0, vy:0, r:12, kind, hp:380*scale, dmg:22, speed:14, xp:45, gold:30,
             stompCd:3, rainCd:5, phase:0 };
  } else if (kind === 'seer') {
    boss = { x:cx, y:cy, vx:0, vy:0, r:7, kind, hp:340*scale, dmg:18, speed:24, xp:55, gold:35,
             teleCd:1.6, volleyCd:2.6, cloneCd:8, phase:0 };
  } else if (kind === 'lich') {
    boss = { x:cx, y:cy, vx:0, vy:0, r:10, kind, hp:460*scale, dmg:20, speed:20, xp:70, gold:45,
             attackCd:2, phaseT:0, phase:0 };
  } else if (kind === 'dragonlord') {
    // 엑스트라 보스 - 화염 브레스 + 유성
    boss = { x:cx, y:cy, vx:0, vy:0, r:14, kind, hp:900*scale, dmg:26, speed:22, xp:120, gold:100,
             breathCd:3, meteorCd:5, phase:0 };
  } else if (kind === 'voidempress') {
    // 엑스트라 보스 - 텔레포트 + 소환
    boss = { x:cx, y:cy, vx:0, vy:0, r:11, kind, hp:800*scale, dmg:24, speed:22, xp:130, gold:110,
             teleCd:2, volleyCd:3, summonCd:10, phase:0 };
  } else if (kind === 'chronomancer') {
    // 엑스트라 보스 - 시간 조작 + 링 볼트
    boss = { x:cx, y:cy, vx:0, vy:0, r:10, kind, hp:1000*scale, dmg:26, speed:18, xp:150, gold:130,
             ringCd:3, warpCd:6, stopCd:12, ringPhase:0, phase:0 };
  } else { // core
    boss = { x:cx, y:cy, vx:0, vy:0, r:14, kind, hp:700*scale, dmg:24, speed:12, xp:100, gold:80,
             beamCd:4, ringCd:3, warpCd:8, phase:0, phaseT:0 };
  }
  // 전역 난이도 적용: 보스 HP/DMG 스케일
  const diff = currentDifficulty();
  if (diff.bossHpMult !== 1) boss.hp *= diff.bossHpMult;
  if (diff.dmgMult !== 1) boss.dmg = Math.round((boss.dmg || 0) * diff.dmgMult);
  boss.maxHp = boss.hp;
  boss.hitFlash = 0; boss.freeze = 0; boss.slow = 0; boss.stun = 0;
  boss.isBoss = true;
  boss.attackCd = boss.attackCd || 2;
  entities.enemies.push(boss);
  sfx('boss');
}

// 문 스폰 (방 클리어 시)
function spawnExitDoor(room) {
  const door = { x: room.x + room.w - 20, y: room.y + room.h/2 - 6, w: 12, h: 18, kind: 'exit' };
  entities.doors.push(door);
}
function spawnRetreatDoor(room) {
  const door = { x: room.x + 8, y: room.y + room.h/2 - 6, w: 12, h: 18, kind: 'retreat' };
  entities.doors.push(door);
}

// ---------- 스폰 헬퍼 ----------
function spawnParticle(x, y, color, life = 0.4, count = 6, spd = 40) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(spd * 0.4, spd);
    entities.particles.push({
      x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s,
      life, max: life, color, size: 1 + randi(0,2),
    });
  }
}
function spawnFloat(x, y, text, color = '#ffefa8') {
  entities.floats.push({ x, y, vy: -20, text, color, life: 0.8 });
}
function spawnPickup(x, y, kind) {
  entities.pickups.push({ x, y, kind, life: 8, bob: rand(0, Math.PI*2) });
}

// ---------- 씬 전환 ----------
function goTo(scene) {
  state.scene = scene;
  // 로그인 씬 진입 시 실제 input에 포커스 (한글 IME 대응)
  if (scene === 'login') {
    // 마지막 필드 상태로 포커스 세팅. 초기값은 name.
    if (typeof loginSyncFocus === 'function') setTimeout(loginSyncFocus, 0);
  } else {
    // 다른 씬으로 이동 시 input 포커스 해제 (WASD 키가 텍스트로 흡수되지 않도록)
    if (typeof loginInput !== 'undefined') { loginInput.blur(); loginPass.blur(); }
  }
  if (scene === 'dungeon') {
    player = createPlayer();
    newDungeon();
    state.runResult = null;
    const fd = currentFloorData();
    showMsg('F' + floor + ' - ' + fd.name + ' - CHAMBER 1', 3);
  }
  if (scene === 'academy') {
    state.day++;
    player = createPlayer();
    player.x = academy.room.x + 40;
    player.y = academy.room.y + academy.room.h - 20;
    state.cam.x = 0; state.cam.y = 0;
    if (state.gpa <= 0.5) {
      showMsg('EXPELLED - GAME OVER', 6);
    }
  }
  if (scene === 'library') {
    library.cursor = 0;
  }
  if (scene === 'shop') {
    shop.cursor = 0;
  }
  if (scene === 'classroom') {
    startClass();
  }
  if (scene === 'arena') {
    arenaMenu.cursor = 0;
    arenaMenu.mode = 'menu';
    arenaMenu.roomCode = '';
    arenaMenu.roomInput = '';
  }
  if (scene === 'arenaWave')  startArena();
  if (scene === 'arenaAI')    startAIDuel(arenaMenu.aiDifficulty || 'normal');
  if (scene === 'arenaRoom')  startRoomDuel(arenaMenu.roomCode);
}

