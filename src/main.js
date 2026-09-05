// =====================================================================
// Bootstrap
// =====================================================================

// ---------- 시작 ----------
// 이미 자동 로그인된 상태에서 ?room=CODE 로 접속한 경우 자동 참가 트리거
if (state.account && _autoJoinRoom && typeof _tryAutoJoin === 'function') {
  _tryAutoJoin();
}
requestAnimationFrame(frame);
