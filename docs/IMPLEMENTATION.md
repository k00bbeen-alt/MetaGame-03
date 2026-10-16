# MetaGame-03 구현·검증 기록

## 환경과 보존

- 작업 경로: `/Users/doubleme/Documents/MetaGame-03`
- 시작 작업 트리: clean. 기존 체크포인트 `2d0d5e663aede3aa9aaaa8e9f292123e1f5e5000` (`Initialize minimal Vite TypeScript project`). 기존 커밋 수정·삭제 없음.
- MiniTask, Still Point, DINO RUN에 접근하거나 수정하지 않음. 새 프로젝트/중첩 앱 폴더 없음.
- GitHub remote 생성·연결 없음. 직선형 Toolkit 구현 체크포인트 `130626a`도 수정·삭제하지 않고 보존했다.
- Figma MCP `whoami`: 강원빈(조형예술대학 디자인학부), `k00bbeen@ewha.ac.kr`, Starter / View seat / team admin.
- Make key `kOW9r6EOD4BM1RSqlh8Ujk`, `get_design_context(0:1)` 및 소스 리소스 읽기 성공.
- Make는 `get_screenshot` 미지원. 원본 화면을 이미지로 시각 비교하지 못했으며, 원본 소스 기반 분석만 수행함.

## 실제 Make 분석

읽은 파일: `App.tsx`, `ColorCarousel.tsx`, `index.css`, `palette.ts`, `useCarousel.ts`, `color.ts`.

원본은 정사각형 display 안에 상단 COLOR PALETTE, 중앙 색상 카드 캐러셀, 색상 이름/HEX/선택 표시, 하단 키 안내로 구성된다. display 폭은 `min(100vw,100svh,760px)`이다. 600 기준 중앙 카드는 **144×216, 4:6 세로형**이며, 최초 요청의 6:4와 달랐으나, 최신 수정 지시의 **4:6 세로형**과 일치한다.

| 단계 | 수평 이동(600 기준) | 아래 이동 | 배율 | 회전 |
|---|---:|---:|---:|---:|
| 중앙 | 0 | 0 | 1 | 0° |
| ±1 | ±83 | 7 | .87 | ±1.5° |
| ±2 | ±150 | 23 | .74 | ±3° |
| ±3 | ±204 | 43 | .61 | ±4.5° |

원본은 21개 버튼을 모두 마운트하고 거리 3 이하의 7개만 불투명하게 표시한다. 중앙 z-index 10에서 거리별로 감소한다. 원본 이동은 `300ms cubic-bezier(.22,.7,.25,1)`, 선택 펄스 320ms, 선택 라벨 150ms이다. 원본 선택은 같은 색을 다시 선택하면 해제되며, 위 키로 명도 조절·포인터 스와이프·종료 후 다시 열기를 지원한다.

폰트는 Helvetica Neue/Arial/system monospace이며 외부 폰트 요청은 없다. 600 기준 색상 이름 약26.4, HEX12, 하단 안내10.8의 컨테이너 단위 텍스트다. 420px 이하 별도 텍스트 규칙이 있다. 읽은 화면 코드에 이미지 리소스 참조나 외부 아이콘 의존성은 없다. MCP가 PNG 10개를 열거했지만 이 화면에서 사용하는 에셋으로 확인되지 않아 가져오지 않았다. 체크/키 안내는 원본에서 텍스트 문자다.

재사용한 것은 21색의 id/name/HEX 데이터, 모듈러 인덱스 계산 원리, 입력 대기열 원리이다. React 생성 코드를 통째로 덮어쓰지 않았다.

## 현재 구현: 승인된 커스텀 UI

사용자는 Toolkit Carousel 사용 생략에 명시적으로 동의하고 아치형 디자인 복원을 지시했다. `wearables.config.json`에 공식 초기화 스크립트와 같은 `custom-explicit-opt-out` 설정으로 기록했다. 초기화 스크립트를 실행하거나 프로젝트를 재생성하지 않았다. 기존 Vite/TypeScript 설정과21색 데이터를 유지하고, React/Toolkit 런타임 의존성을 제거했다.

메인 화면은 Figma의 중앙144×216, x83/150/204, y7/23/43, 배율1/.87/.74/.61, 회전0/±1.5/±3/±4.5°, z-index10부터 거리별 감소를 사용한다. 카드의 가로:세로는4:6이다. 화면과 텍스트가 공간을 제한하면 전체 아치만 비례 축소하며 좌표·깊이 단계의 관계는 유지한다.600 기준 정사각 스테이지에 viewport 크기의 반응형 상한을 적용해600×500/500×600에서도 안전 여백을 유지한다. 전체 기본 배경은#000000이다.

**메인 캐러셀에는 DOM 카드도, 표시 카드도 정확히7개만 있다.** 같은 색의 노드를 보존하고, 이동마다 떠나는 한 장을 제거해 들어오는 한 장으로 교체한다. 남은6개와 새 가장자리 카드가300ms `cubic-bezier(.22,.7,.25,1)`으로 이동한다. 새 카드는 Make의4번째 깊이 단계(.5/6°/y66)를 사용하고 초기 x만252→240으로 줄여 윤곽의 안전 여백과 첫 프레임의 노출 영역을 확보한다. 여덟 번째 카드나 복제 팔레트를 겹쳐 렌더링하지 않는다. 모듈러 인덱스로21↔1 경계도 같은 한 장 이동을 사용한다.

중앙만 활성 포커스/선택 대상이다. 선택된 색의 윤곽·체크·텍스트를 표시한다. 같은 색을 다시 선택해도 해제되지 않으며, 다른 색 선택으로 교체된다. 선택과 현재 탐색 위치는 화면을 왕복해도 유지한다. `prefers-reduced-motion`에서는 CSS 모션을 생략한다.

## 선택 색상 명도 조절

carousel에서 색상을 선택한 뒤 ↑를 누르면 선택된 색의 HSL 명도가5%p씩 증가한다. 최초21색은L50%이므로10단계에서흰색으로 포화된다. 선택이 없거나start/ending 상태면 동작하지 않는다. held/repeat 입력은 한 번만 처리된다. 탐색 위치와 별개로 선택한 색을 조정하고, 같은 색 재선택/화면 왕복 시 유지하며 새 색 선택 시0단계로 초기화한다.

원본palette는 수정하지 않는다. `src/color.ts`가 원본HEX와 단계로 표시색을 계산해 누적 RGB 반올림 오차를 피한다. 카드 배경/접근성 이름/중앙HEX/종료 스와치와HEX에 동일하게 반영한다. 선택 후에만 ↑ 명도 안내를 표시한다. 테스트는색조 보존, 흰색 상한, 원본 불변, 선택/상태별 입력, 유지/초기화, 반복 키와 브라우저 표시를 포함한다.

## 시작·종료 화면과 상태

앱 상태는 `start`, `carousel`, `ending`으로 구분한다.

- 시작: 둥글고 볼드한 큰 `21`, 바로 아래 `color card`, 중앙 정렬. 별도 시각적 시작 버튼 없이 화면 전체가 입력 영역이다.
- 종료: 같은21/타이포/검정 배경을 유지하며 선택색이 있으면 작은 세로 스와치와 이름/HEX만 표시한다. 선택이 없으면 조용한 휴식 문구를 표시한다.
- 시작·종료 화면은 접근 가능한 투명한 전체 화면 semantic button이다. 중앙 카드도 native button이며 Enter/Space의 기본 클릭을 한 번만 사용한다. 버튼과 별도의 키 활성화가 중복 실행되지 않는다.
-180ms의 절제된 화면 전환 동안 상태 변경 입력을 막고, held/repeat 키는 화면 변경 후에도 재활성화되지 않는다.
- 점수/정답/실패/순위/진행률/타이머 HUD/별도 종료 버튼은 없다.

| 현재 상태 | 입력 | 동작 |
|---|---|---|
| start | 화면 터치·클릭, Enter, Space | carousel 진입 |
| carousel | ← / → | 한 색씩 이동, 입력 대기열로 순서 보존 |
| carousel | Enter / 중앙 카드 터치·클릭 | 현재 색상 선택 |
| carousel | ↑ | 선택된 색상 명도5%p 증가 |
| carousel | ↓ / Escape / 내부 종료 요청 | ending 진입, 이동 대기열·타이머 취소 |
| ending | 화면 터치·클릭 / Enter | start로 복귀 |
| ending | 방향키 / Space | 상태 변경 없음 |

## 코드 구조와 생명주기

- `src/palette.ts`: 기존 Make21색 데이터. 이번 수정에서 변경 없음.
- `src/circular.ts`: 원형 인덱스와7개 이웃 계산.
- `src/carousel-state.ts`: 세 화면, 현재/선택 색상, 이동/화면 전환 상태, 입력 대기열과 타이머 정리.
- `src/input.ts`: phase별 표준 키보드 어댑터, native click 단일 활성화, repeat/held/blur 처리.
- `src/layout.ts`: Make 아치 좌표, 깊이 단계, 반응형 크기와 안전 여백.
- `src/ColorCard.ts`: 카드 생성/갱신, 선택 윤곽과 체크, 중앙 포커스.
- `src/SelectionFeedback.ts`: 이름/HEX/선택 정보의 live region.
- `src/exit.ts`: 중복 방지 내부 종료 요청. `window.close()` 사용 없음.
- `src/lifecycle.ts`: 표준 Page Visibility/pagehide 이벤트에서 이동 작업 취소.
- `src/main.ts`: vanilla DOM 렌더러,7개 노드 보존, 화면 전체 클릭, ResizeObserver, focus 및 해제.

화면 해제/HMR에서 keydown/keyup/blur/click/visibilitychange/pagehide 리스너, ResizeObserver, 상태 구독 및 타이머를 해제한다. 백그라운드 진입 시 대기 입력을 취소하고 선택·현재 위치는 유지한다. 지속적인 앱 RAF/게임 루프는 없다.

## Meta 공식 API 확인 범위

설치된 Meta device/UI/build/test 스킬과 공개 공식 자료를 확인했다. 공식 웹앱 안내: https://developers.meta.com/wearables/web-apps/ . 공식 저장소의 방향키/Enter 시뮬레이션 안내: https://github.com/facebook/meta-wearables-webapp .

표준 키보드·클릭·Page Visibility 이벤트를 사용한다. 별도의 SDK나 전용 Glass 이벤트를 추측해 만들지 않았다. 이번 세션에서 전용 host 종료 API는 확인되지 않았으므로 브라우저에서 ending 상태에 안전하게 머문다. 실제 Glass D-pad/Select/EMG 전달과 host 종료 API 연결은 별도 TODO다. 브라우저 테스트를 실기기 검증으로 간주하지 않는다.

## 최종 검증

- `npm run typecheck`: 통과.
- `npm test`:12개 통과.21색·7이웃, Figma geometry,3상태 전환 잠금, 양방향 순환/65회 입력, 선택 유지·교체, 중복 종료, 타이머·구독·리스너·생명주기 정리.
- `npm run build`: 통과. 런타임 React/Toolkit 없이14모듈, JS 약10.99KB(압축4.20KB), CSS 약4.41KB(압축1.63KB).
- `tests/browser.mjs`:600×600/600×500/500×600, 세 화면의 일반/200% 텍스트, held Enter/Space, 클릭·터치, 중앙 선택, 빠른 입력, 모든21개 위치, 양방향 경계, reduced motion, 배경 진입 취소를 검증했다.
- 이동 중 animation frame마다7개 카드의 DOM 개수·불투명도·화면 내 bounds와 hit testing을 통한 노출 영역을 검사했다. 정지 화면에서는4:6 비율·중앙 z-index10·중앙 하나만 활성인 것도 검사했다.
- 공식 `check-webapp.mjs`: **통과**, warnings0/failures0. 공식 custom-explicit-opt-out 프로필, Chrome CDP, 요청3개, 호스트 로드84ms/힙약3.25MB. 이 값은 로컬 호스트 수치이며 기기 성능 증명이 아니다.
- 생성 스크린샷은 `.wearables-test/`에 보관한다. 개발 서버/프로덕션 미리보기 검증 결과는 `docs/browser-results.json`, 전체 게이트 결과는 `docs/quality-gate.json`에 기록한다.

실제 Glass/Android WebView는 아직 미검증이다. 다음 기기 테스트는 D-pad/Select/EMG 단일 입력과 지연, rounded font fallback, 밝은 실제 배경에서의 additive 대비, 실제 시스템 텍스트 확대, 화면 가장자리 윤곽, 중단/복귀, host Back·종료 동작이다. 외부 배포와 GitHub remote 연결은 하지 않았다.

로컬 개발 서버: http://127.0.0.1:5175/ . 최신 프로덕션 미리보기: http://127.0.0.1:4174/ . 두 서버를 실행 상태로 유지한다. 프로덕션 미리보기에서도 기능별 Chrome 검증을 다시 통과했다.

## 원본21색

| id | name | HEX |
|---|---|---|
| red | Red | #FF0000 |
| vermilion | Vermilion | #FF4900 |
| orange | Orange | #FF9200 |
| amber | Amber | #FFDB00 |
| yellow-lime | Yellow Lime | #DBFF00 |
| lime | Lime | #92FF00 |
| chartreuse | Chartreuse | #49FF00 |
| green | Green | #00FF00 |
| spring | Spring Green | #00FF49 |
| mint | Mint | #00FF92 |
| turquoise | Turquoise | #00FFDB |
| cyan-blue | Cyan Blue | #00DBFF |
| azure | Azure | #0092FF |
| cobalt | Cobalt | #0049FF |
| blue | Blue | #0000FF |
| violet | Violet | #4900FF |
| purple | Purple | #9200FF |
| orchid | Orchid | #DB00FF |
| fuchsia | Fuchsia | #FF00DB |
| pink | Pink | #FF0092 |
| rose | Rose | #FF0049 |

## Display extension QA remediation

The document has exactly one viewport meta: `width=600, height=600, initial-scale=1.0`. The 600-unit stage stays 600 by 600 in a 1440 by 900 desktop window.

Shared supporting typography now uses `--text-support-size: max(18px, 1.125rem)`, including inherited text, captions, HEX, selection feedback, key glyphs, and ending metadata. The selected check compensates for card depth scaling so its rendered font size also stays at least 18px.

`tests/display-qa.mjs` verifies actual DOM metadata and computed/rendered text sizes. Start, carousel, selection, edge selection, and ending pass at 18px minimum, and 36px under 200% text scaling. Text bounds, overlap, card containment, and desktop stage independence pass. Results: `docs/display-qa.json`. The extension itself was not modified or bypassed; these are independent browser assertions, not an automated rerun inside the user's extension session. Typecheck, 12 unit tests and production build pass. Current CSS bundle: 4.68KB (gzip 1.67KB).
