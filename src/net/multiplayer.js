// =====================================================================
// Multiplayer relay
// =====================================================================

// =====================================================================
// MULTIPLAYER
// =====================================================================
// Simple relay-based multiplayer:
//   - Client-authoritative movement (each player owns their wizard)
//   - Server just relays messages to other clients in the same room
//   - No coop combat yet (each client is a shared social space)
//
// UI flow:  title -> [M] -> mplobby -> (create|join) -> mproom
// The room is a lit chamber where everyone sees each other move.

// 현재 페이지가 http(s)://호스트:포트 로 서빙되고 있으면 그 origin의 ws(s)://를 기본으로 사용.
// file:// 로 열었으면 localhost:8080 폴백.
function _defaultMpUrl() {
  try {
    const loc = window.location;
    if (loc && (loc.protocol === 'http:' || loc.protocol === 'https:') && loc.host) {
      const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      return proto + '//' + loc.host;
    }
  } catch(e) {}
  return 'ws://localhost:8080';
}
const MP_DEFAULT_URL = _defaultMpUrl();

// URL 쿼리스트링에서 자동 방 참가 파라미터 (?room=ABCDE) 추출
let _autoJoinRoom = null;
try {
  const qs = (window.location && window.location.search) || '';
  const m = qs.match(/[?&]room=([A-Za-z0-9]{3,8})/);
  if (m) _autoJoinRoom = m[1].toUpperCase();
} catch(e){}
const MP_TICK_HZ = 15;                    // send our state 15x/sec
const MP_TICK_MS = 1000 / MP_TICK_HZ;

const mp = {
  ws: null,
  connected: false,
  connecting: false,
  serverUrl: MP_DEFAULT_URL,
  serverHosts: null,
  serverPort: null,
  roomCode: null,
  myId: null,
  hostId: null,
  playerName: 'WIZARD',
  peers: new Map(),
  err: '',
  errT: 0,
  lastSent: 0,
  lobbyMode: 'menu',
  urlInput: MP_DEFAULT_URL,
  codeInput: '',
  nameInput: '',
  cursor: 0,
  room: { x: 20, y: 30, w: 280, h: 150 },
  // === PvP 매치 상태 ===
  pvp: {
    active: false,          // 지금 매치 진행 중
    myWins: 0,
    oppWins: 0,
    target: 3,              // 3승제
    round: 1,
    roundOver: false,
    seriesOver: false,
    oppName: '',
    oppHp: 100,
    oppMaxHp: 100,
    myRoundResult: null,    // 'win' | 'lose' | null
    postRoundT: 0,          // 라운드 종료 후 대기
  },
  // === Coop 프리센스 ===
  // presence[peerId] = { name, scene, difficulty, ts }  — 다른 플레이어의 현재 상태 스냅샷.
  presence: {},
  lastPresenceSent: 0,
  // coop 초대: 최근 5초 이내에 같은 mode+difficulty 로 던전 진입한 다른 플레이어가 있으면 자동 매칭.
  coop: {
    active: false,
    partner: null,    // { id, name }
    invites: {},      // invites[peerId] = { mode, difficulty, ts }
    lastInviteMs: 0,
    isHost: false,    // 이 클라이언트가 mob 시뮬 권위자인지
    lastMobSent: 0,
    nextSyncId: 1,
  },
};

// 코업 호스트 판정: myId 와 partner.id 알파벳순으로 낮은 쪽이 host.
function _coopComputeHost() {
  if (!mp.coop.active || !mp.coop.partner) return false;
  return (mp.myId + '') < (mp.coop.partner.id + '');
}

// Try to remember prefs
try {
  const saved = localStorage.getItem('gaa_mp');
  if (saved) {
    const d = JSON.parse(saved);
    if (d.url) mp.serverUrl = mp.urlInput = d.url;
    if (d.name) mp.playerName = mp.nameInput = d.name;
  }
} catch(e){}
// If logged in, prefer the account name
if (state.account && state.account.name) {
  mp.playerName = state.account.name.toUpperCase().slice(0, 12);
  mp.nameInput = mp.playerName;
}
function mpSavePrefs() {
  try { localStorage.setItem('gaa_mp', JSON.stringify({ url: mp.serverUrl, name: mp.playerName })); } catch(e){}
}

function mpFlash(msg, dur) { mp.err = msg; mp.errT = dur || 3; }

function mpConnect(url, onReady) {
  if (mp.ws) { try { mp.ws.close(); } catch(e){} mp.ws = null; }
  mp.connected = false;
  mp.connecting = true;
  mp.serverUrl = url;
  let ws;
  try { ws = new WebSocket(url); }
  catch(e) { mp.connecting = false; mpFlash('BAD URL: ' + e.message); return; }
  mp.ws = ws;
  ws.onopen = () => {
    mp.connected = true;
    mp.connecting = false;
    if (onReady) onReady();
  };
  ws.onmessage = (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch(e){ return; }
    mpHandleMessage(m);
  };
  ws.onclose = () => {
    mp.connected = false;
    mp.connecting = false;
    mp.ws = null;
    if (state.scene === 'mproom') {
      mpFlash('DISCONNECTED FROM SERVER', 4);
      mp.roomCode = null;
      mp.peers.clear();
      state.scene = 'mplobby';
    }
  };
  ws.onerror = () => {
    mp.connecting = false;
    mpFlash('CONNECTION FAILED', 4);
  };
}

function mpSend(msg) {
  if (!mp.ws || !mp.connected) return;
  try { mp.ws.send(JSON.stringify(msg)); } catch(e){}
}

function mpHandleMessage(m) {
  if (m.type === 'welcome') {
    // 서버가 자기 LAN 주소를 알려줌 → 호스트 화면에서 자동 공유 코드 조립
    if (Array.isArray(m.hosts)) mp.serverHosts = m.hosts;
    if (typeof m.port === 'number') mp.serverPort = m.port;
  } else if (m.type === 'created') {
    mp.roomCode = m.room;
    mp.myId = m.id;
    mp.hostId = m.id;
    mp.peers.clear();
    // 씬 그대로 유지: arena 메뉴의 mpHost 모드에서 대기 → 사용자가 SPACE로 시작
    sfx('level');
  } else if (m.type === 'joined') {
    mp.roomCode = m.room;
    mp.myId = m.id;
    mp.hostId = m.hostId;
    mp.peers.clear();
    for (const p of m.players) {
      mp.peers.set(p.id, { name: p.name, x: 0, y: 0,
        hp: 100, facing: 1, animT: 0, lastSeen: performance.now(), casting: 0 });
    }
    // 게스트는 바로 아레나로 진입
    if (mpJoinInputEl) mpJoinInputEl.blur();
    arenaMenu.mode = 'menu';
    goTo('arenaWave');
    sfx('door');
  } else if (m.type === 'error') {
    mpFlash(String(m.msg || 'ERROR'), 3);
    arenaFlash(String(m.msg || 'ERROR'));
    sfx('hurt');
  } else if (m.type === 'peer_join') {
    mp.peers.set(m.id, { name: m.name, x: 0, y: 0,
      hp: 100, facing: 1, animT: 0, lastSeen: performance.now(), casting: 0 });
    mpFlash(m.name + ' JOINED', 2.2);
    showMsg(m.name + ' JOINED', 2);
    sfx('pickup');
  } else if (m.type === 'peer_leave') {
    const p = mp.peers.get(m.id);
    mp.peers.delete(m.id);
    if (p) { mpFlash(p.name + ' LEFT', 2.2); showMsg(p.name + ' LEFT', 2); sfx('hurt'); }
  } else if (m.type === 'host_change') {
    mp.hostId = m.id;
    if (m.id === mp.myId) { mpFlash('YOU ARE NOW HOST', 2.5); showMsg('YOU ARE HOST', 2); }
  } else if (m.type === 'state') {
    const p = mp.peers.get(m.id);
    if (p) {
      p.x = m.x; p.y = m.y; p.hp = m.hp;
      if (typeof m.facing === 'number') p.facing = m.facing;
      if (typeof m.animT === 'number') p.animT = m.animT;
      p.lastSeen = performance.now();
    }
  } else if (m.type === 'cast') {
    const p = mp.peers.get(m.id);
    if (p) { p.casting = 0.4; }
    if (p) {
      const isPvp = mp.pvp.active && !mp.pvp.roundOver;
      // 신규 포맷: 발사체 배열을 sender 가 그대로 직렬화 → 상대 위치에 상대적으로 재현
      if (Array.isArray(m.bullets) && m.bullets.length) {
        for (const b of m.bullets) {
          entities.bullets.push({
            x: p.x + (b.dx || 0), y: p.y + (b.dy || 0),
            vx: b.vx, vy: b.vy,
            r: b.r || 3,
            dmg: b.dmg || 0,           // pvpHit 로 sender 가 데미지 처리하므로 로컬 dmg 는 표시용
            life: b.li || 1.2,
            kind: b.k || 'fire',
            visual: b.v || null,
            hits: 0,
            pierce: !!b.pi,
            freeze: b.fr || 0,
            knockback: b.kb || 0,
            explosive: !!b.ex,
            explodeR: b.er || 0,
            homing: !!b.ho,
            bounces: b.bo || 0,
            remote: true,
            hostileToMe: isPvp,
          });
        }
        sfx((m.bullets[0] && m.bullets[0].k === 'ice') ? 'ice' : 'fire');
      } else if (typeof m.ang === 'number') {
        // 구 포맷 폴백 (구버전 클라이언트 호환)
        entities.bullets.push({
          x: p.x, y: p.y,
          vx: Math.cos(m.ang) * 140, vy: Math.sin(m.ang) * 140,
          r: 3, dmg: isPvp ? (m.dmg || 8) : 0, life: 1.2, kind: m.kind || 'fire',
          visual: m.visual || null, hits: 0, remote: true,
          hostileToMe: isPvp,
        });
        sfx(m.kind === 'ice' ? 'ice' : 'fire');
      }
    }
  } else if (m.type === 'presence') {
    // 다른 플레이어의 현재 상태 (아카데미/난이도 등)
    mp.presence[m.id] = { name: m.name || 'PLAYER', scene: m.scene || '?', difficulty: m.difficulty || 'normal', ts: performance.now() };
  } else if (m.type === 'coopInvite') {
    // 같은 mode+difficulty 로 던전 진입 - 5초 안에 나도 같은 조건이면 함께 진입
    mp.coop.invites[m.id] = { mode: m.mode, difficulty: m.difficulty, ts: performance.now() };
    if (typeof showMsg === 'function') showMsg('coop 초대: ' + (m.name || 'PLAYER') + ' (' + m.difficulty + ')  5초 안에 같은 문으로!', 4);
  } else if (m.type === 'coopStart') {
    // 상대가 coop 매칭 성공 알림 → 나도 coop 활성
    mp.coop.active = true;
    mp.coop.partner = { id: m.id, name: m.name || 'PARTNER' };
    mp.coop.isHost = _coopComputeHost();
    mp.coop.nextSyncId = 1;
    if (typeof showMsg === 'function') showMsg('COOP 매칭: ' + (m.name || 'PARTNER') + '  (' + (mp.coop.isHost ? 'HOST' : 'GUEST') + ')', 4);
    // 이미 던전에 있으면 (초대자 쪽) — 몹을 sync id 로 다시 만들도록 재진입
    if (state.scene === 'dungeon' && typeof goTo === 'function') {
      // 방/몹 초기화 후 재진입
      entities.enemies = []; entities.bullets = []; entities.ebullets = [];
      goTo('dungeon');
    }
  } else if (m.type === 'mobState') {
    // 호스트가 몹 스냅샷 브로드캐스트 → 게스트는 로컬 entities.enemies 를 미러링
    if (mp.coop.active && !mp.coop.isHost && Array.isArray(m.enemies)) {
      const byId = {};
      for (const e of entities.enemies) if (e._syncId != null) byId[e._syncId] = e;
      const nextList = [];
      for (const e of m.enemies) {
        let target = byId[e.i];
        if (!target) {
          // 신규 미러 엔티티 생성 (렌더/피격 판정용 최소 필드)
          target = { _syncId: e.i, kind: e.k || 'slime', hitFlash: 0, freeze: 0, slow: 0, stun: 0,
                     r: e.r || 5, isBoss: !!e.b, isProfessor: !!e.p, isElite: !!e.el };
          if (target.isProfessor) {
            // 교수 미러: 임시 def (색만) - 화면상 스프라이트 그림용
            target._profDef = { name: e.n || '', title: '', color: e.c || '#ffefa8', spriteKind: 'lich', key: '', faculty: '', achievements: [] };
            target._profEntryT = 0; target._profEntryTotal = 0; target._profDeathT = 0; target._profPhase = 1;
          }
        }
        target.x = e.x; target.y = e.y; target.hp = e.hp; target.maxHp = e.mx || target.hp || 100;
        target.r = e.r || target.r || 5;
        target._synced = true;
        nextList.push(target);
      }
      entities.enemies = nextList;
    }
  } else if (m.type === 'mobHit') {
    // 게스트가 로컬에서 mob 을 맞췄음을 통지 → 호스트가 실제 데미지 적용
    if (mp.coop.active && mp.coop.isHost) {
      const target = entities.enemies.find(e => e._syncId === m.i);
      if (target && target.hp > 0) target.hp -= (m.dmg || 0);
    }
  } else if (m.type === 'pvpHit') {
    // 상대가 "너 맞았어(id=X, dmg=D)" 통지. 대상이 나면 자기 HP 감소.
    // (권위 위임 - 사수(shooter) 가 본 히트를 신뢰. anti-cheat 은 프로토타입 밖의 문제.)
    if (mp.pvp.active && !mp.pvp.roundOver && m.targetId === mp.myId) {
      if (typeof damagePlayer === 'function') damagePlayer(m.dmg || 6, null);
      else player.hp -= (m.dmg || 6);
    }
  } else if (m.type === 'pvpRoundLose') {
    // 상대가 이번 라운드 졌다고 통지 → 나는 승리
    if (mp.pvp.active && !mp.pvp.roundOver) {
      mp.pvp.roundOver = true;
      mp.pvp.myRoundResult = 'win';
      mp.pvp.myWins++;
      mp.pvp.postRoundT = 2.5;
      showMsg('ROUND WON! ' + mp.pvp.myWins + '-' + mp.pvp.oppWins, 3);
      sfx('level');
    }
  } else if (m.type === 'pvpOppHp') {
    // 상대 HP 브로드캐스트
    mp.pvp.oppHp = m.hp;
    mp.pvp.oppMaxHp = m.maxHp;
  } else if (m.type === 'pvpStart') {
    // 상대(호스트)가 매치 시작 신호를 보냄
    if (!mp.pvp.active) startPvpMatch();
  }
}

function mpLeaveRoom() {
  if (mp.ws && mp.connected && mp.roomCode) mpSend({ type: 'leave' });
  mp.roomCode = null;
  mp.hostId = null;
  mp.peers.clear();
  mp.pvp.active = false;
  mp.pvp.seriesOver = false;
}

// === PvP 매치 시작 (2인 방에서 호스트가 스타트) ===
function startPvpMatch() {
  mp.pvp.active = true;
  mp.pvp.myWins = 0;
  mp.pvp.oppWins = 0;
  mp.pvp.round = 1;
  mp.pvp.roundOver = false;
  mp.pvp.seriesOver = false;
  mp.pvp.myRoundResult = null;
  mp.pvp.postRoundT = 0;
  // 상대 이름
  for (const p of mp.peers.values()) { mp.pvp.oppName = p.name || 'OPPONENT'; break; }
  goTo('arenaWave');  // 아레나 씬 재사용 (이미 mp 룸 렌더 있음)
  // 플레이어 초기화
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.x = mp.room.x + 30;
  player.y = mp.room.y + mp.room.h/2;
  showMsg('PVP MATCH START! ROUND 1', 3);
  sfx('boss');
}

function startPvpNextRound() {
  mp.pvp.round++;
  mp.pvp.roundOver = false;
  mp.pvp.myRoundResult = null;
  mp.pvp.postRoundT = 0;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.x = mp.room.x + 30;
  player.y = mp.room.y + mp.room.h/2;
  // ebullets 청소
  entities.bullets.length = 0;
  entities.ebullets.length = 0;
  showMsg('ROUND ' + mp.pvp.round + ' - FIGHT!', 2);
  sfx('boss');
}

function endPvpSeries() {
  mp.pvp.seriesOver = true;
  const won = mp.pvp.myWins > mp.pvp.oppWins;
  if (won) {
    const gpaGain = 0.30;
    state.gpa = (state.gpa || 0) + gpaGain;
    state.gold += 200;
    academy.duelWins = (academy.duelWins || 0) + 1;
    showMsg('SERIES WON! +GPA ' + gpaGain.toFixed(2) + '  +200 GOLD', 5);
  } else {
    const gpaLoss = 0.10;
    state.gpa = Math.max(0, (state.gpa || 0) - gpaLoss);
    state.gold += 250;
    academy.duelLosses = (academy.duelLosses || 0) + 1;
    showMsg('SERIES LOST - LOSER BONUS +250 GOLD', 5);
  }
  saveAccountData();
  if (typeof updateLeaderboardEntry === 'function') updateLeaderboardEntry();
  // 3초 후 아레나 메뉴로
  setTimeout(() => {
    if (mp && mp.roomCode) mpLeaveRoom();
    mp.pvp.active = false;
    state.scene = 'arena';
    arenaMenu.mode = 'menu';
  }, 3500);
}

// 매 프레임 PvP 상태 업데이트 (플레이어 사망 감지 + 라운드 진행)
function updatePvp(dt) {
  if (!mp.pvp.active || mp.pvp.seriesOver) return;
  // 라운드 진행 중: 자기 HP 0 확인
  if (!mp.pvp.roundOver) {
    if (player.hp <= 0) {
      mp.pvp.roundOver = true;
      mp.pvp.myRoundResult = 'lose';
      mp.pvp.oppWins++;
      mp.pvp.postRoundT = 2.5;
      // 상대에게 "이번 라운드 졌음" 통지
      mpSend({ type: 'pvpRoundLose' });
      showMsg('ROUND LOST! ' + mp.pvp.myWins + '-' + mp.pvp.oppWins, 3);
      sfx('die');
    }
  } else {
    // 라운드 종료 후 대기
    mp.pvp.postRoundT -= dt;
    if (mp.pvp.postRoundT <= 0) {
      // 시리즈 종료 여부
      if (mp.pvp.myWins >= mp.pvp.target || mp.pvp.oppWins >= mp.pvp.target) {
        endPvpSeries();
      } else {
        startPvpNextRound();
      }
    }
  }
  // 5Hz로 내 HP 브로드캐스트
  const now = performance.now();
  if (!mp.pvp._lastHpSent || now - mp.pvp._lastHpSent > 200) {
    mp.pvp._lastHpSent = now;
    mpSend({ type: 'pvpOppHp', hp: Math.max(0, Math.ceil(player.hp)), maxHp: player.maxHp });
  }
}

// -------- 아레나 통합 진입 --------
function _mpPlayerName() {
  if (state.account && state.account.name) return state.account.name.toUpperCase().slice(0, 12);
  return (mp.playerName || 'WIZARD').toUpperCase().slice(0, 12);
}

// 호스트: 자동으로 localhost:8080 에 연결하고 방 생성
function startMpHost() {
  mp.err = ''; mp.errT = 0;
  mp.roomCode = null;
  mp.peers.clear();
  const nm = _mpPlayerName();
  const url = mp.serverUrl || 'ws://localhost:8080';
  const doCreate = () => mpSend({ type: 'create', name: nm });
  if (mp.connected) doCreate();
  else mpConnect(url, doCreate);
}

// 게스트: URL + 코드로 방 참가
function startMpJoin(url, code) {
  mp.err = ''; mp.errT = 0;
  mp.roomCode = null;
  mp.peers.clear();
  mp.serverUrl = url;
  mpSavePrefs();
  const nm = _mpPlayerName();
  const doJoin = () => mpSend({ type: 'join', room: code, name: nm });
  if (mp.connected && mp.ws && mp.ws.url === url) doJoin();
  else mpConnect(url, doJoin);
}

// Join 화면용 텍스트 입력 (코드 입력 전용 - 알파벳/숫자 최대 8자)
const mpJoinInputEl = document && document.createElement ? document.createElement('input') : null;
if (mpJoinInputEl) {
  mpJoinInputEl.type = 'text';
  mpJoinInputEl.autocomplete = 'off';
  mpJoinInputEl.autocapitalize = 'characters';
  mpJoinInputEl.spellcheck = false;
  mpJoinInputEl.inputMode = 'text';
  mpJoinInputEl.style.position = 'fixed';
  mpJoinInputEl.style.opacity = '0';
  mpJoinInputEl.style.pointerEvents = 'none';
  mpJoinInputEl.style.left = '-9999px';
  mpJoinInputEl.style.top = '60px';
  mpJoinInputEl.maxLength = 8;
  document.body && document.body.appendChild(mpJoinInputEl);
  mpJoinInputEl.addEventListener('input', () => {
    // 대문자로 정규화하고 영숫자만 남김. 최대 8자.
    const cleaned = (mpJoinInputEl.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    arenaMenu.joinInput = cleaned;
    if (mpJoinInputEl.value !== cleaned) mpJoinInputEl.value = cleaned;
  });
  mpJoinInputEl.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter')  { ev.preventDefault(); keys['Enter']  = true; }
    if (ev.key === 'Escape') { ev.preventDefault(); keys['Escape'] = true; }
    // R/기타 문자는 그대로 <input>이 흡수 → 코드 문자로 처리됨
  });
}
function mpJoinFocus() {
  if (mpJoinInputEl) {
    mpJoinInputEl.value = arenaMenu.joinInput;
    mpJoinInputEl.focus();
  }
}

// -------- Lobby scene --------
const MP_MENU = ['HOST NEW ROOM', 'JOIN BY CODE', 'CHANGE SERVER URL', 'CHANGE PLAYER NAME', 'BACK TO TITLE'];

function updateMpLobby(dt) {
  if (mp.errT > 0) mp.errT -= dt;

  if (mp.lobbyMode === 'menu') {
    if (keys['KeyW'] || keys['ArrowUp'])   { keys['KeyW']=false; keys['ArrowUp']=false; mp.cursor = (mp.cursor - 1 + MP_MENU.length) % MP_MENU.length; sfx('hit'); }
    if (keys['KeyS'] || keys['ArrowDown']) { keys['KeyS']=false; keys['ArrowDown']=false; mp.cursor = (mp.cursor + 1) % MP_MENU.length; sfx('hit'); }
    if (keys['Space'] || keys['Enter']) {
      keys['Space']=false; keys['Enter']=false;
      const c = mp.cursor;
      if (c === 0) {
        // HOST
        mp.playerName = (mp.nameInput || mp.playerName || 'WIZARD').toUpperCase().slice(0, 12) || 'WIZARD';
        mpSavePrefs();
        if (!mp.connected) mpConnect(mp.serverUrl, () => mpSend({ type: 'create', name: mp.playerName }));
        else mpSend({ type: 'create', name: mp.playerName });
      } else if (c === 1) {
        // JOIN
        mp.lobbyMode = 'joinCode';
        mp.codeInput = '';
      } else if (c === 2) {
        mp.lobbyMode = 'url';
        mp.urlInput = mp.serverUrl;
      } else if (c === 3) {
        mp.lobbyMode = 'name';
        mp.nameInput = mp.playerName;
      } else if (c === 4) {
        state.scene = 'title';
      }
    }
    if (keys['Escape']) { keys['Escape']=false; state.scene = 'title'; }
  } else if (mp.lobbyMode === 'url' || mp.lobbyMode === 'joinCode' || mp.lobbyMode === 'name') {
    // Text input consumed by keydown handler; here handle submit/cancel
    if (keys['Enter']) {
      keys['Enter']=false;
      if (mp.lobbyMode === 'url') {
        mp.serverUrl = (mp.urlInput || MP_DEFAULT_URL).trim();
        mpSavePrefs();
        // Try to connect immediately
        mpConnect(mp.serverUrl);
        mp.lobbyMode = 'menu';
      } else if (mp.lobbyMode === 'name') {
        mp.playerName = (mp.nameInput || 'WIZARD').toUpperCase().slice(0, 12) || 'WIZARD';
        mpSavePrefs();
        mp.lobbyMode = 'menu';
      } else if (mp.lobbyMode === 'joinCode') {
        const code = (mp.codeInput || '').toUpperCase().trim();
        if (code.length < 3) { mpFlash('ENTER A CODE', 2); return; }
        mp.playerName = (mp.nameInput || mp.playerName || 'WIZARD').toUpperCase().slice(0, 12) || 'WIZARD';
        mpSavePrefs();
        if (!mp.connected) mpConnect(mp.serverUrl, () => mpSend({ type: 'join', room: code, name: mp.playerName }));
        else mpSend({ type: 'join', room: code, name: mp.playerName });
        mp.lobbyMode = 'menu';
      }
    }
    if (keys['Escape']) { keys['Escape']=false; mp.lobbyMode = 'menu'; }
  }
}

function renderMpLobby() {
  bgStars();
  ctx.fillStyle = 'rgba(10, 5, 30, 0.85)';
  ctx.fillRect(0, 0, W*PX, H*PX);

  // Title
  const t = 'MULTIPLAYER LOBBY';
  drawText(t, W/2 - textWidth(t, 2)/2, 12, '#e8c547', 2);

  // Connection status
  let stat;
  if (mp.connecting) stat = 'CONNECTING...';
  else if (mp.connected) stat = 'CONNECTED';
  else stat = 'NOT CONNECTED';
  const statCol = mp.connected ? '#3ac762' : mp.connecting ? '#e8c547' : '#c81616';
  drawText(stat, W/2 - textWidth(stat)/2, 32, statCol);
  drawText('SERVER: ' + mp.serverUrl, W/2 - textWidth('SERVER: ' + mp.serverUrl)/2, 42, '#8a7ab5');
  drawText('NAME:   ' + mp.playerName, W/2 - textWidth('NAME:   ' + mp.playerName)/2, 51, '#8a7ab5');

  if (mp.lobbyMode === 'menu') {
    // Menu
    for (let i = 0; i < MP_MENU.length; i++) {
      const y = 72 + i * 14;
      const isSel = mp.cursor === i;
      const label = MP_MENU[i];
      const col = isSel ? '#ffefa8' : '#8bd8ff';
      const prefix = isSel ? '> ' : '  ';
      const suffix = isSel ? ' <' : '  ';
      const s = prefix + label + suffix;
      drawText(s, W/2 - textWidth(s)/2, y, col);
    }
    drawText('W/S NAVIGATE   [SPACE] SELECT   [ESC] BACK', W/2 - textWidth('W/S NAVIGATE   [SPACE] SELECT   [ESC] BACK')/2, H - 12, '#5a4a80');
  } else {
    // Text input
    let prompt = '', val = '';
    if (mp.lobbyMode === 'url')      { prompt = 'SERVER URL (ws://host:port):'; val = mp.urlInput; }
    else if (mp.lobbyMode === 'joinCode') { prompt = 'ROOM CODE:'; val = mp.codeInput; }
    else if (mp.lobbyMode === 'name'){ prompt = 'PLAYER NAME (LETTERS/DIGITS):'; val = mp.nameInput; }
    drawText(prompt, W/2 - textWidth(prompt)/2, 90, '#e8d9b0');

    // Input box
    const boxW = 240, boxX = W/2 - boxW/2, boxY = 106;
    pxDraw(boxX, boxY, boxW, 14, '#1a0e2e');
    pxDraw(boxX, boxY, boxW, 1, '#e8c547');
    pxDraw(boxX, boxY + 13, boxW, 1, '#e8c547');
    // Cursor blink
    const showCursor = Math.floor(state.time * 3) % 2 === 0;
    const display = val + (showCursor ? '_' : '');
    drawText(display, boxX + 4, boxY + 4, '#ffefa8');
    drawText('[ENTER] CONFIRM    [ESC] CANCEL', W/2 - textWidth('[ENTER] CONFIRM    [ESC] CANCEL')/2, 130, '#8a7ab5');
  }

  if (mp.errT > 0 && mp.err) {
    ctx.globalAlpha = Math.min(1, mp.errT);
    const tw = textWidth(mp.err);
    pxDraw(W/2 - tw/2 - 4, H - 40, tw + 8, 10, '#1a0e2e');
    drawText(mp.err, W/2 - tw/2, H - 37, '#ffefa8');
    ctx.globalAlpha = 1;
  }
}

// -------- Room scene (shared chamber) --------
function updateMpRoom(dt) {
  if (mp.errT > 0) mp.errT -= dt;

  // Cheap local player: reuse createPlayer/playerless movement
  if (!player || player._mpInitialized !== true) {
    player = createPlayer();
    player.x = mp.room.x + mp.room.w/2;
    player.y = mp.room.y + mp.room.h/2;
    player._mpInitialized = true;
    state.cam.x = 0; state.cam.y = 0;
  }

  const p = player;
  p.animT += dt;
  if (p.hitFlash > 0) p.hitFlash -= dt;
  if (p.invuln > 0) p.invuln -= dt;

  // Movement (no combat, no shielding)
  let mx = 0, my = 0;
  if (keys['KeyA']) mx -= 1;
  if (keys['KeyD']) mx += 1;
  if (keys['KeyW']) my -= 1;
  if (keys['KeyS']) my += 1;
  const len = Math.hypot(mx, my);
  if (len > 0) { mx/=len; my/=len; }
  p.x += mx * 60 * dt;
  p.y += my * 60 * dt;
  const r = mp.room;
  p.x = clamp(p.x, r.x + 8, r.x + r.w - 8);
  p.y = clamp(p.y, r.y + 8, r.y + r.h - 8);

  const aimX = mouse.x + state.cam.x, aimY = mouse.y + state.cam.y;
  const ang = angleTo(p, { x: aimX, y: aimY });
  p.facing = Math.cos(ang) >= 0 ? 1 : -1;

  // LMB fires visual-only bullet + broadcasts a cast
  if (mouse.down && (!p._lmbCd || p._lmbCd <= 0)) {
    p._lmbCd = 0.35;
    // Local visual
    entities.bullets.push({
      x: p.x + Math.cos(ang)*6, y: p.y + Math.sin(ang)*6,
      vx: Math.cos(ang)*140, vy: Math.sin(ang)*140,
      r: 3, dmg: 0, life: 1.2, kind: 'fire', hits: 0, mine: true,
    });
    sfx('fire');
    // Broadcast
    mpSend({ type: 'cast', kind: 'fire', ang });
  }
  if (p._lmbCd > 0) p._lmbCd -= dt;

  // Update our visual bullets (no collision, just travel)
  const rm = mp.room;
  for (let i = entities.bullets.length - 1; i >= 0; i--) {
    const b = entities.bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.life -= dt;
    if (b.x < rm.x || b.x > rm.x + rm.w || b.y < rm.y || b.y > rm.y + rm.h) b.life = 0;
    if (b.life <= 0) entities.bullets.splice(i, 1);
  }
  // Fade peer casting flash
  for (const peer of mp.peers.values()) if (peer.casting > 0) peer.casting -= dt;

  // Broadcast our state at fixed rate
  const now = performance.now();
  if (now - mp.lastSent > MP_TICK_MS) {
    mp.lastSent = now;
    mpSend({ type: 'state', x: Math.round(p.x*10)/10, y: Math.round(p.y*10)/10, hp: Math.ceil(p.hp), facing: p.facing, animT: p.animT });
  }

  // Leave room
  if (keys['KeyR'] || keys['Escape']) {
    keys['KeyR']=false; keys['Escape']=false;
    mpLeaveRoom();
    state.scene = 'mplobby';
    mp.lobbyMode = 'menu';
  }
}

function renderMpRoom() {
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, W*PX, H*PX);

  // Room floor and walls (echo the academy chamber style)
  const r = mp.room;
  ctx.fillStyle = '#1a0e2e';
  ctx.fillRect(r.x*PX, r.y*PX, r.w*PX, r.h*PX);
  ctx.fillStyle = '#241442';
  for (let x = r.x; x < r.x + r.w; x += 16) {
    for (let y = r.y; y < r.y + r.h; y += 16) {
      if (((x/16 + y/16) & 1) === 0) ctx.fillRect(x*PX, y*PX, 16*PX, 16*PX);
    }
  }
  // Walls
  ctx.fillStyle = '#3a1e5c';
  ctx.fillRect((r.x-4)*PX, (r.y-4)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, (r.y+r.h)*PX, (r.w+8)*PX, 4*PX);
  ctx.fillRect((r.x-4)*PX, r.y*PX, 4*PX, r.h*PX);
  ctx.fillRect((r.x+r.w)*PX, r.y*PX, 4*PX, r.h*PX);
  ctx.fillStyle = '#5a2e8c';
  for (let x = r.x; x < r.x + r.w; x += 12) ctx.fillRect(x*PX, (r.y-2)*PX, 10*PX, PX);

  // Central rune ring
  ctx.strokeStyle = 'rgba(139, 216, 255, 0.25)';
  ctx.lineWidth = PX;
  ctx.beginPath();
  ctx.arc((r.x + r.w/2)*PX, (r.y + r.h/2)*PX, 30*PX, 0, Math.PI*2);
  ctx.stroke();

  // Bullets (visual)
  for (const b of entities.bullets) drawBullet(b);

  // Peers (draw with alternate palette so we can tell them apart)
  const now = performance.now();
  for (const [id, peer] of mp.peers) {
    // Stale peers (>3s no update) fade
    const age = now - peer.lastSeen;
    if (age > 3000) ctx.globalAlpha = 0.4;
    drawPlayer(peer.x, peer.y, peer.facing >= 0);
    ctx.globalAlpha = 1;
    // Name tag
    drawText(peer.name, peer.x - textWidth(peer.name)/2, peer.y - 18, id === mp.hostId ? '#ffefa8' : '#8bd8ff');
    // Casting flash
    if (peer.casting > 0) {
      ctx.strokeStyle = 'rgba(232, 197, 71, ' + peer.casting.toFixed(2) + ')';
      ctx.lineWidth = PX;
      ctx.beginPath();
      ctx.arc(peer.x*PX, peer.y*PX, 10*PX, 0, Math.PI*2);
      ctx.stroke();
    }
  }

  // Local player (last so on top)
  drawPlayer(player.x, player.y, player.facing >= 0);
  drawText(mp.playerName + ' (YOU)', player.x - textWidth(mp.playerName + ' (YOU)')/2, player.y - 18, '#3ac762');

  // HUD strip
  pxDraw(0, 0, W, 14, 'rgba(0,0,0,0.7)');
  drawText('ROOM ' + mp.roomCode, 4, 3, '#e8c547');
  drawText('PLAYERS ' + (mp.peers.size + 1) + '/4', 60, 3, '#8bd8ff');
  if (mp.hostId === mp.myId) drawText('YOU ARE HOST', 130, 3, '#ffefa8');
  drawText('[R] LEAVE', W - textWidth('[R] LEAVE') - 4, 3, '#8a7ab5');

  // Roster (right side)
  const rosterX = W - 70, rosterY = 20;
  drawText('IN ROOM:', rosterX, rosterY, '#8a7ab5');
  drawText('- ' + mp.playerName + ' *', rosterX, rosterY + 10, '#3ac762');
  let i = 2;
  for (const peer of mp.peers.values()) {
    drawText('- ' + peer.name, rosterX, rosterY + i * 10, '#e8d9b0');
    i++;
  }

  // Flash message
  if (mp.errT > 0 && mp.err) {
    ctx.globalAlpha = Math.min(1, mp.errT);
    const tw = textWidth(mp.err);
    pxDraw(W/2 - tw/2 - 4, H - 24, tw + 8, 10, '#1a0e2e');
    drawText(mp.err, W/2 - tw/2, H - 21, '#ffefa8');
    ctx.globalAlpha = 1;
  }

  drawText('WASD MOVE   LMB CAST (VISUAL)   [R] LEAVE', W/2 - textWidth('WASD MOVE   LMB CAST (VISUAL)   [R] LEAVE')/2, H - 8, '#5a4a80');
}

// -------- Text input handler for lobby --------
// We hook into the existing keydown handler by adding a document-level listener
// that fires only in the lobby text-input modes.
window.addEventListener('keydown', (ev) => {
  if (state.scene !== 'mplobby') return;
  if (mp.lobbyMode === 'menu') return;
  const target = mp.lobbyMode === 'url' ? 'urlInput' : mp.lobbyMode === 'joinCode' ? 'codeInput' : 'nameInput';
  const maxLen = mp.lobbyMode === 'url' ? 60 : mp.lobbyMode === 'joinCode' ? 8 : 12;
  if (ev.key === 'Backspace') {
    mp[target] = mp[target].slice(0, -1);
    ev.preventDefault();
  } else if (ev.key.length === 1 && mp[target].length < maxLen) {
    // Allow all printable for URL, uppercase alnum for others
    let ch = ev.key;
    if (mp.lobbyMode !== 'url') ch = ch.toUpperCase();
    if (mp.lobbyMode === 'joinCode' && !/[A-Z0-9]/.test(ch)) return;
    if (mp.lobbyMode === 'name' && !/[A-Z0-9 ]/.test(ch)) return;
    mp[target] += ch;
    ev.preventDefault();
  }
});

