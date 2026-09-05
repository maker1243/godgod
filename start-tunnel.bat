@echo off
REM cloudflared 임시 터널 - 게스트 Wi-Fi 등 AP 격리 환경에서 폰이 붙을 수 있게 인터넷으로 노출.
REM 실행 전제: 서버가 8080 에서 이미 돌고 있어야 함 (start-server.bat 로 먼저 실행).
REM cloudflared 가 설치돼 있지 않으면 winget 으로 설치 시도 후 재시도.

setlocal
set PORT=8080

where cloudflared >nul 2>nul
if errorlevel 1 (
  echo cloudflared 가 설치돼 있지 않습니다. winget 으로 설치 시도합니다...
  winget install --id=Cloudflare.cloudflared --silent --accept-source-agreements --accept-package-agreements
  if errorlevel 1 (
    echo.
    echo 자동 설치 실패. 수동 설치 링크: https://github.com/cloudflare/cloudflared/releases
    pause
    exit /b 1
  )
)

echo.
echo === cloudflared 터널 시작 ===
echo 서버(localhost:%PORT%)를 인터넷으로 임시 노출합니다.
echo 아래 트래픽 로그 사이에 "https://xxx-yyy.trycloudflare.com" 형태의 URL 이 출력됩니다.
echo 그 URL 을 폰 브라우저에 입력하면 접속 가능합니다 (게스트 Wi-Fi 에서도 작동).
echo Ctrl+C 로 터널 종료.
echo.

cloudflared tunnel --url http://localhost:%PORT%
endlocal
