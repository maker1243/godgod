// =====================================================================
// Grand Arcana Academy - Multiplayer Server (modular project layout)
// Native Node.js WebSocket server (no npm dependencies).
// Serves static files from this folder (index.html, css/, src/, ...).
// Run: node server.js  (or use start-server.sh / start-server.bat)
// =====================================================================

const http = require('http');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8080');
const MAX_ROOM_SIZE = 4;
const ROOM_CODE_LEN = 5;
const MAX_MESSAGE_BYTES = 16 * 1024;
const RATE_LIMIT_PER_SEC = 60;

const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.map':  'application/json; charset=utf-8',
};

// ---------- State ----------
const rooms = new Map();
const clients = new Map();
let nextClientId = 1;

function log(...args) {
  const t = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + t + ']', ...args);
}

function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < ROOM_CODE_LEN; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

// ---------- WebSocket framing ----------
function sendFrame(sock, data) {
  if (sock.destroyed || !sock.writable) return;
  const buf = Buffer.from(JSON.stringify(data), 'utf-8');
  const len = buf.length;
  let frame;
  if (len < 126) {
    frame = Buffer.concat([Buffer.from([0x81, len]), buf]);
  } else if (len < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81; header[1] = 126;
    header.writeUInt16BE(len, 2);
    frame = Buffer.concat([header, buf]);
  } else {
    const header = Buffer.alloc(10);
    header[0] = 0x81; header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
    frame = Buffer.concat([header, buf]);
  }
  try { sock.write(frame); } catch (e) {}
}

function sendClose(sock, reason) {
  try {
    const buf = Buffer.from(reason || '', 'utf-8');
    const header = Buffer.from([0x88, buf.length]);
    sock.write(Buffer.concat([header, buf]));
    sock.end();
  } catch (e) {}
}

function broadcast(roomCode, data, exceptSock) {
  const room = rooms.get(roomCode);
  if (!room) return;
  for (const sock of room.clients) {
    if (sock === exceptSock) continue;
    sendFrame(sock, data);
  }
}

function leaveRoom(sock) {
  const cd = clients.get(sock);
  if (!cd || !cd.room) return;
  const room = rooms.get(cd.room);
  if (room) {
    room.clients.delete(sock);
    broadcast(cd.room, { type: 'peer_leave', id: cd.id, name: cd.name });
    log('leave', cd.id, cd.name || '?', 'from', cd.room, '(' + room.clients.size + ' left)');
    if (room.clients.size === 0) {
      rooms.delete(cd.room);
      log('room deleted', cd.room);
    } else if (room.hostId === cd.id) {
      const nextHost = room.clients.values().next().value;
      const nd = clients.get(nextHost);
      if (nd) {
        room.hostId = nd.id;
        broadcast(cd.room, { type: 'host_change', id: nd.id });
        log('host reassigned in', cd.room, 'to', nd.id);
      }
    }
  }
  cd.room = null;
}

function handleMessage(sock, msg) {
  const cd = clients.get(sock);
  if (!cd) return;

  const now = Date.now();
  if (now - cd.lastRateReset > 1000) { cd.msgsThisSec = 0; cd.lastRateReset = now; }
  cd.msgsThisSec++;
  if (cd.msgsThisSec > RATE_LIMIT_PER_SEC) return;

  const t = msg.type;
  if (!t || typeof t !== 'string') return;

  if (t === 'create') {
    if (cd.room) { sendFrame(sock, { type: 'error', msg: 'ALREADY IN ROOM' }); return; }
    let code = makeRoomCode();
    let tries = 0;
    while (rooms.has(code) && tries < 20) { code = makeRoomCode(); tries++; }
    if (rooms.has(code)) { sendFrame(sock, { type: 'error', msg: 'TRY AGAIN' }); return; }
    cd.name = String(msg.name || 'PLAYER').slice(0, 12).toUpperCase();
    cd.room = code;
    rooms.set(code, { clients: new Set([sock]), hostId: cd.id, createdAt: now });
    sendFrame(sock, { type: 'created', room: code, id: cd.id, name: cd.name });
    log('create', code, 'by', cd.id, cd.name);

  } else if (t === 'join') {
    if (cd.room) { sendFrame(sock, { type: 'error', msg: 'ALREADY IN ROOM' }); return; }
    const roomCode = String(msg.room || '').toUpperCase().slice(0, 8);
    const room = rooms.get(roomCode);
    if (!room) { sendFrame(sock, { type: 'error', msg: 'ROOM NOT FOUND' }); return; }
    if (room.clients.size >= MAX_ROOM_SIZE) { sendFrame(sock, { type: 'error', msg: 'ROOM FULL' }); return; }
    cd.name = String(msg.name || 'PLAYER').slice(0, 12).toUpperCase();
    cd.room = roomCode;
    const others = [];
    for (const other of room.clients) {
      const od = clients.get(other);
      if (od) others.push({ id: od.id, name: od.name });
    }
    room.clients.add(sock);
    sendFrame(sock, { type: 'joined', room: roomCode, id: cd.id, name: cd.name, hostId: room.hostId, players: others });
    broadcast(roomCode, { type: 'peer_join', id: cd.id, name: cd.name }, sock);
    log('join', cd.id, cd.name, 'to', roomCode, '(' + room.clients.size + ' now)');

  } else if (t === 'leave') {
    leaveRoom(sock);
    sendFrame(sock, { type: 'left' });

  } else if (cd.room) {
    const relay = Object.assign({}, msg, { id: cd.id });
    broadcast(cd.room, relay, sock);
  }
}

// ---------- WebSocket handshake ----------
function handleUpgrade(req, sock, head) {
  const key = req.headers['sec-websocket-key'];
  if (!key) { sock.end(); return; }
  const accept = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  sock.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );

  const clientId = 'p' + (nextClientId++);
  clients.set(sock, { id: clientId, room: null, name: null, msgsThisSec: 0, lastRateReset: Date.now() });
  log('connect', clientId, 'from', sock.remoteAddress);
  sendFrame(sock, { type: 'welcome', id: clientId, hosts: localAddresses(), port: PORT });

  let buffer = Buffer.alloc(0);

  sock.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    if (buffer.length > MAX_MESSAGE_BYTES * 4) { sendClose(sock, 'too big'); return; }

    while (buffer.length >= 2) {
      const b1 = buffer[0];
      const b2 = buffer[1];
      const fin = (b1 & 0x80) !== 0;
      const opcode = b1 & 0x0f;
      const masked = (b2 & 0x80) !== 0;
      let payloadLen = b2 & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (buffer.length < 4) break;
        payloadLen = buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (buffer.length < 10) break;
        payloadLen = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }
      if (payloadLen > MAX_MESSAGE_BYTES) { sendClose(sock, 'frame too big'); return; }
      if (!masked) { sendClose(sock, 'must mask'); return; }
      if (buffer.length < offset + 4 + payloadLen) break;

      const mask = buffer.slice(offset, offset + 4);
      offset += 4;
      const payload = Buffer.alloc(payloadLen);
      for (let i = 0; i < payloadLen; i++) payload[i] = buffer[offset + i] ^ mask[i % 4];
      buffer = buffer.slice(offset + payloadLen);

      if (opcode === 0x8) { sendClose(sock, ''); return; }
      else if (opcode === 0x9) {
        try {
          const pongHeader = Buffer.from([0x8a, payload.length]);
          sock.write(Buffer.concat([pongHeader, payload]));
        } catch (e) {}
      } else if (opcode === 0x1) {
        if (!fin) continue;
        let msg;
        try { msg = JSON.parse(payload.toString('utf-8')); }
        catch (e) { continue; }
        handleMessage(sock, msg);
      }
    }
  });

  sock.on('close', () => { leaveRoom(sock); clients.delete(sock); log('disconnect', clientId); });
  sock.on('error', () => {});
}

// ---------- Static file server ----------
function serveFile(res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const httpServer = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);

  if (urlPath === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok', clients: clients.size, rooms: rooms.size,
      uptime: Math.floor(process.uptime()), hosts: localAddresses(), port: PORT,
    }));
    return;
  }

  // Map "/" to /index.html
  let rel = urlPath === '/' ? '/index.html' : urlPath;

  // Prevent path traversal
  const safe = path.normalize(rel).replace(/^([\/\\])+/, '');
  const full = path.join(ROOT, safe);
  if (!full.startsWith(ROOT)) {
    res.writeHead(403); res.end('forbidden'); return;
  }
  serveFile(res, full);
});
httpServer.on('upgrade', handleUpgrade);

setInterval(() => {
  for (const [code, room] of rooms) {
    if (room.clients.size === 0) rooms.delete(code);
  }
}, 30000);

function localAddresses() {
  const addrs = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const info of nets[name]) {
      if (info.family === 'IPv4' && !info.internal) addrs.push(info.address);
    }
  }
  return addrs;
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('======================================================');
  console.log('  GRAND ARCANA ACADEMY  -  MULTIPLAYER SERVER');
  console.log('======================================================');
  console.log('  Listening on 0.0.0.0:' + PORT);
  console.log('  Play here:   http://localhost:' + PORT + '/');
  const addrs = localAddresses();
  if (addrs.length) {
    console.log('  LAN play:    ' + addrs.map(a => 'http://' + a + ':' + PORT + '/').join('  '));
  }
  console.log('  Status: http://localhost:' + PORT + '/status');
  console.log('  Press Ctrl+C to stop');
  console.log('======================================================');
  console.log('');
});

process.on('SIGINT', () => { console.log('\nShutting down...'); process.exit(0); });
process.on('SIGTERM', () => { process.exit(0); });
