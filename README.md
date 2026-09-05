# Grand Arcana Academy — Modular Rebuild

원본 `grand-arcana-academy.html` (8211줄 단일 파일)을 논리 섹션별로
분리해서 재구성한 프로젝트입니다. 게임 코드는 그대로이고, 파일 구조만
정리했습니다.

## 실행

```
node server.js
```

또는 Windows 는 `start-server.bat`, Mac/Linux 는 `./start-server.sh`.
브라우저에서 `http://localhost:8080/` 을 엽니다.

## 구조

```
newProject/
├── index.html                # 얇은 껍데기 - <script src> 로 모듈 로드
├── server.js                 # HTTP + WebSocket 릴레이 (정적 파일 서빙)
├── start-server.{bat,sh}     # 런처
├── css/
│   └── style.css             # 원본 <style> 블록 추출
└── src/
    ├── core/                 # 캔버스·유틸·폰트·스프라이트·사운드·i18n
    │   ├── utils.js
    │   ├── font.js
    │   ├── draw.js
    │   ├── sprites.js
    │   ├── sound.js
    │   └── i18n.js
    ├── data/                 # 저장/로드, 스킬, 특성, 스킬 트리
    │   ├── account.js
    │   ├── skills.js
    │   └── skillTree.js
    ├── world/
    │   └── rooms.js          # 방/던전 생성, 씬 전환, 스폰
    ├── entities/
    │   ├── update.js         # 업데이트 루프, 씬별 업데이터
    │   ├── enemies.js        # 적 AI + 4보스
    │   └── bullets.js
    ├── scenes/
    │   ├── library.js        # 도서관 (영구 스킬 트리)
    │   ├── classroom.js      # 수업 미니게임
    │   ├── shop.js
    │   ├── arena.js          # 웨이브 챌린지
    │   ├── arenaMenu.js
    │   ├── duel.js           # 1v1
    │   ├── langSelect.js
    │   ├── login.js
    │   ├── levelup.js
    │   └── ending.js
    ├── render/
    │   ├── render.js         # 씬별 렌더
    │   └── bullets.js        # 총알 렌더 + 레벨업/엔딩 UI
    ├── net/
    │   └── multiplayer.js
    ├── mobile/
    │   └── touch.js
    └── main.js               # 부트스트랩 (원본 마지막 10줄)
```

## 로드 순서

`index.html` 이 위에서 아래로 `<script>` 태그를 차례로 로드합니다.
모든 파일이 최상위 `const` / `function` 선언을 그대로 유지하므로,
원본이 사용하던 전역 참조 (`state`, `keys`, `mouse`, `player`, `world` 등)
가 그대로 동작합니다. **의존성이 있는 파일들은 순서를 바꾸지 마세요.**

## 원본과 다른 점

- 단일 HTML → `index.html` + 29 개 파일
- `server.js` 는 하나의 HTML 캐시가 아니라 폴더 전체를 정적으로 서빙
- 로직 코드는 원본과 바이트 단위로 동일 (섹션 헤더 주석만 추가)

## 참고

원본: `F:\AiAgent\dotGame\grand-arcana-academy\grand-arcana-academy\`
