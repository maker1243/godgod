"use strict";

// =====================================================================
// Canvas, math, input state
// =====================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const PX = 3;                 // 1 게임 픽셀 = 3 캔버스 픽셀
const W = canvas.width / PX;  // 320
const H = canvas.height / PX; // 200

// ---------- 유틸 ----------
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- 입력 ----------
const keys = {};
const mouse = { x: W/2, y: H/2, down: false, right: false };

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space','KeyR','KeyE','KeyQ','ShiftLeft','ShiftRight','Backspace','Tab'].includes(e.code)) e.preventDefault();
  // 텍스트 입력 (clan / spell name 등)
  if (typeof clanKeyPressed === 'function' && e.key && e.key.length === 1) {
    if (clanKeyPressed(e.key)) e.preventDefault();
  }
});
addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (canvas.width / r.width) / PX;
  mouse.y = (e.clientY - r.top) * (canvas.height / r.height) / PX;
});
canvas.addEventListener('mousedown', e => {
  if (e.button === 0) mouse.down = true;
  if (e.button === 2) mouse.right = true;
});
canvas.addEventListener('mouseup', e => {
  if (e.button === 0) mouse.down = false;
  if (e.button === 2) mouse.right = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

// 마우스 휠: 짧게 유지되는 이벤트 카운터. 소비하는 쪽이 mouse.wheel 을 읽고 0 으로 리셋.
mouse.wheel = 0;
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  mouse.wheel += Math.sign(e.deltaY);
}, { passive: false });
