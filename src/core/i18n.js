// =====================================================================
// I18N (en/ko)
// =====================================================================

// =====================================================================
// I18N - Language system
// =====================================================================
const I18N = {
  en: {
    // Language select
    'lang.title': 'CHOOSE LANGUAGE',
    'lang.hint': 'W/S SELECT   [SPACE] CONFIRM',

    // Login
    'login.title': 'ENTER THE ACADEMY',
    'login.subtitle': 'PICK A NAME AND PASSWORD TO CONTINUE',
    'login.name': 'PLAYER NAME',
    'login.pass': 'PASSWORD',
    'login.nameHint': '3-12 CHARACTERS (LETTERS, NUMBERS, HANGUL...)',
    'login.passHint': '4+ CHARACTERS',
    'login.new': 'CREATE NEW',
    'login.enter': 'SIGN IN',
    'login.switch': '[TAB] SWITCH FIELD',
    'login.confirm': '[ENTER] CONFIRM',
    'login.wrongPass': 'WRONG PASSWORD',
    'login.tooShort': 'PASSWORD TOO SHORT (4+ CHARACTERS)',
    'login.invalidName': 'NAME MUST BE 3-12 CHARACTERS, NO SPACES',
    'login.exists': 'NAME TAKEN - SIGN IN OR CHOOSE ANOTHER',
    'login.notFound': 'NOT FOUND - SWITCH TO NEW ACCOUNT MODE',
    'login.mode.new': 'NEW ACCOUNT',
    'login.mode.exist': 'EXISTING ACCOUNT',
    'login.toggleMode': 'CLICK OR PRESS F2 TO SWITCH MODE',
    'login.welcome': 'WELCOME, ',
    'login.created': 'ACCOUNT CREATED',
    'login.signedIn': 'SIGNED IN',
    'login.logout': '[F1] SIGN OUT',
    'login.clickField': 'CLICK A FIELD TO TYPE  -  TYPING WORKS WITH ALL LANGUAGES',

    // Title
    'title.sub': 'A PIXEL ACTION RPG PROTOTYPE',
    'title.enter': '[SPACE] START  -  MULTIPLAYER IS INSIDE THE ARENA',
    'title.playing': 'PLAYING AS ',
    'title.footer': 'WASD MOVE  MOUSE AIM  LMB FIRE  SHIFT SHIELD/ROLL',

    // Common
    'common.back': 'BACK',
    'common.confirm': 'CONFIRM',
    'common.cancel': 'CANCEL',
  },
  ko: {
    'lang.title': '언어 선택',
    'lang.hint': 'W/S 이동   [SPACE] 결정',

    'login.title': '아카데미 입장',
    'login.subtitle': '닉네임과 비밀번호를 정하세요',
    'login.name': '닉네임',
    'login.pass': '비밀번호',
    'login.nameHint': '3-12자 (한글/영문/숫자 가능, 공백 불가)',
    'login.passHint': '4자 이상',
    'login.new': '새로 만들기',
    'login.enter': '로그인',
    'login.switch': '[TAB] 다음 칸',
    'login.confirm': '[ENTER] 확인',
    'login.wrongPass': '비밀번호가 틀렸습니다',
    'login.tooShort': '비밀번호가 너무 짧습니다 (4자 이상)',
    'login.invalidName': '닉네임은 3-12자, 공백 없이 입력하세요',
    'login.exists': '이미 사용 중인 닉네임입니다',
    'login.notFound': '없는 계정입니다 - 신규 가입 모드로 바꾸세요',
    'login.mode.new': '신규 가입',
    'login.mode.exist': '기존 계정',
    'login.toggleMode': '클릭 또는 F2 로 모드 전환',
    'login.welcome': '어서 오세요, ',
    'login.created': '계정 생성 완료',
    'login.signedIn': '로그인 완료',
    'login.logout': '[F1] 로그아웃',
    'login.clickField': '입력 칸을 클릭한 뒤 입력하세요 - 모든 언어 지원',

    'title.sub': '픽셀 아트 액션 RPG 프로토타입',
    'title.enter': '[SPACE] 시작  -  멀티플레이는 아레나에서',
    'title.playing': '플레이어: ',
    'title.footer': 'WASD 이동  마우스 조준  LMB 발사  SHIFT 방어/구르기',

    'common.back': '뒤로',
    'common.confirm': '확인',
    'common.cancel': '취소',
  },
};
function t(key) {
  const lang = (state && state.lang) || 'en';
  return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

