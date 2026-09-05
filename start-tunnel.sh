#!/usr/bin/env bash
# cloudflared 임시 터널 (Mac/Linux 용)
# 전제: 서버가 8080 에서 이미 돌고 있어야 함.
PORT=${PORT:-8080}
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared 가 설치돼 있지 않습니다."
  echo "  macOS:  brew install cloudflared"
  echo "  Linux:  https://pkg.cloudflare.com/index.html"
  exit 1
fi
echo "=== cloudflared 터널 시작 (localhost:${PORT}) ==="
echo "출력된 https://xxx.trycloudflare.com URL 을 폰 브라우저에 입력."
cloudflared tunnel --url "http://localhost:${PORT}"
