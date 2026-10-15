# MetaGame-03 구현·검증 기록

## 환경과 보존

- 작업 경로: `/Users/doubleme/Documents/MetaGame-03`
- 시작 작업 트리: clean. 기존 체크포인트 `2d0d5e663aede3aa9aaaa8e9f292123e1f5e5000` (`Initialize minimal Vite TypeScript project`). 기존 커밋 수정·삭제 없음.
- MiniTask, Still Point, DINO RUN에 접근하거나 수정하지 않음. 새 프로젝트/중첩 앱 폴더 없음.
- GitHub remote 생성·연결 없음.
- Figma MCP `whoami`: 강원빈(조형예술대학 디자인학부), `k00bbeen@ewha.ac.kr`, Starter / View seat / team admin.
- Make key `kOW9r6EOD4BM1RSqlh8Ujk`, `get_design_context(0:1)` 및 소스 리소스 읽기 성공.
- Make는 `get_screenshot` 미지원. 원본 화면을 이미지로 시각 비교하지 못했으며, 원본 소스 기반 분석만 수행함.

## 실제 Make 분석

읽은 파일: `App.tsx`, `ColorCarousel.tsx`, `index.css`, `palette.ts`, `useCarousel.ts`, `color.ts`.

원본은 정사각형 display 안에 상단 COLOR PALETTE, 중앙 색상 카드 캐러셀, 색상 이름/HEX/선택 표시, 하단 키 안내로 구성된다. display 폭은 `min(100vw,100svh,760px)`이다. 600 기준 중앙 카드는 **144×216, 4:6 세로형**이며, 요청서의 **6:4 가로형**과 다르다.

| 단계 | 수평 이동(600 기준) | 아래 이동 | 배율 | 회전 |
|---|---:|---:|---:|---:|
| 중앙 | 0 | 0 | 1 | 0° |
| ±1 | ±83 | 7 | .87 | ±1.5° |
| ±2 | ±150 | 23 | .74 | ±3° |
| ±3 | ±204 | 43 | .61 | ±4.5° |

원본은 21개 버튼을 모두 마운트하고 거리 3 이하의 7개만 불투명하게 표시한다. 중앙 z-index 10에서 거리별로 감소한다. 원본 이동은 `300ms cubic-bezier(.22,.7,.25,1)`, 선택 펄스 320ms, 선택 라벨 150ms이다. 원본 선택은 같은 색을 다시 선택하면 해제되며, 위 키로 명도 조절·포인터 스와이프·종료 후 다시 열기를 지원한다.

폰트는 Helvetica Neue/Arial/system monospace이며 외부 폰트 요청은 없다. 600 기준 색상 이름 약26.4, HEX12, 하단 안내10.8의 컨테이너 단위 텍스트다. 420px 이하 별도 텍스트 규칙이 있다. 읽은 화면 코드에 이미지 리소스 참조나 외부 아이콘 의존성은 없다. MCP가 PNG 10개를 열거했지만 이 화면에서 사용하는 에셋으로 확인되지 않아 가져오지 않았다. 체크/키 안내는 원본에서 텍스트 문자다.

재사용한 것은 21색의 id/name/HEX 데이터, 모듈러 인덱스 계산 원리, 입력 대기열 원리이다. React 생성 코드를 통째로 덮어쓰지 않았다.

## 승인된 Toolkit 디자인 조정

사용자는 추가 질문에서 **공식 Toolkit을 사용하도록 디자인 조정**을 선택했다. 기존 Vite/TypeScript에 React와 공식 npm 패키지를 추가했다. 공식 `App > Page > ScrollView > Carousel > Card`를 사용한다. Toolkit 기본 테마·포커스·확대·모션이 우선하며, 아치/카드별 깊이 단계/원본 글꼴/원본 300ms easing의 시각적 복제는 구현하지 않았다.

카드 비율은 6:4이다. 팔레트 도메인은21색이며, 양끝에 이웃색3개씩을 추가 렌더링해 첫/끝 색에서도 정지 화면에 7장이 보이도록 했다. DOM 카드 수는27개이고 화면 표시 목표는7개다. 좌우 한 번마다 논리 인덱스를 한 단계 이동한다. 경계에서는 Toolkit 공개 `scrollToPosition`으로 반대편 중앙 항목을 지정한다. **경계에서 이어지는 연속 무한 스크롤 모션과 이동 중 매 프레임 정확히7장 조건은 보장하지 않는다.** 정지 화면의 중앙 카드가 Toolkit 기본 포커스 확대를 받는다. 주변 카드는 비활성 상태의 기본 표현을 사용한다.

300ms 상태 타이머는 앱의 입력 대기열 처리 시간이며 Toolkit의 실제 애니메이션 완료 신호는 아니다. 점수/실패/정답/타이머 표시/진행률/종료 버튼은 없다. Toolkit 페이지네이션도 비활성화했다. 화면 배경 토큰은 Chrome에서 `rgb(0,0,0)`으로 확인했다. 선택은 유지되며 새 선택으로 교체되고, 같은 색 재선택으로 해제되지 않는다.

## 구조와 입력

- `src/palette.ts`: 원본21색의 단일 데이터 경계.
- `src/circular.ts`: 순환 인덱스와7개 이웃 계산.
- `src/carousel-state.ts`: 현재 색, 선택, 입력 대기열, 이동중/종료 상태, 타이머/구독 정리.
- `src/input.ts`: 브라우저 키보드 어댑터. repeat 무시, Enter 기본 클릭 방지, capture 리스너 정리.
- `src/layout.ts`: 가용 폭/Toolkit 간격 기반 크기 계산. 아치는 승인된 Toolkit 직선 배치로 대체.
- `src/ColorCard.tsx`: 공식 Card, 단일 팔레트 색상, 선택 윤곽, 중앙만 활성화.
- `src/SelectionFeedback.tsx`: 이름/HEX/선택 결과의 live region.
- `src/exit.ts`: 중복 방지 내부 종료 요청. `window.close()` 사용 없음.
- `src/main.tsx`: Toolkit 구성, ResizeObserver/visibility/unmount 정리.

| 브라우저 입력 | 동작 | Glass 상태 |
|---|---|---|
| ← / → | 색상 한 단계 이동 | 실제 방향 입력 미검증, 별도 adapter TODO |
| Enter | 현재 색상 선택 | 실제 Select/EMG pinch 미검증 |
| 중앙 카드 클릭 | 현재 색상 선택 | 위치 기반 포인터를 Glass 입력으로 가정하지 않음 |
| ↓ / Escape | 내부 세션 종료 | 공식 host 종료 API 미확인, TODO |

설치된 `ai-glasses-webapp-device`, `ai-glasses-webapp-ui`, `ai-glasses-webapp-build`, `ai-glasses-webapp-test` 및 공식 Toolkit 지침을 확인했다. 공식 Meta 웹 문서: https://developers.meta.com/wearables/web-apps/ . 원격 Meta 문서 MCP는 이번 세션에 확인되지 않았다. 별도 SDK/전용 이벤트를 추측하지 않았다.

## 검증과 한계

- `npm run typecheck`: 통과.
- `npm test`: Node 단위 테스트6개 통과.21색/7이웃, 양방향 순환,65개 연속 입력, 선택 유지·교체, 단일 종료, 타이머/구독/이벤트 리스너 해제를 검증.
- `npm run build`: 통과. Toolkit 의존성의 `use client` 지시어를 Vite가 무시한다는 경고는 발생하지만 빌드는 성공.
- 공식 Toolkit 구조 검사: zero findings.
- `node tests/browser.mjs`: 설치된 Chrome,600×600/600×500/500×600. 양방향 순환,5회 빠른 입력, Enter와 중앙 클릭, 유지/교체, 종료 후 입력, 정지 화면 정확히7장,6:4,검정 배경,수평 넘침 없음,주요 텍스트200% 확대를 검증. `.wearables-test/`에 캡처/결과 저장(생성 아티팩트는 Git 제외).
- 공식 전체 `check-webapp.mjs`: **미통과**. Carousel 내부 list의 접근성 이름 없음1개, 내부 listitem 포커스 대상의 화면 밖 위치21개, 종료 후 버튼 재탐색 시간 초과를 보고함. 공개 `ariaLabel`/`disabled` 사용 후에도 Toolkit가 생성하는 list/listitem 관련 판정이 남음. 라이브러리 내부 DOM이나 검증기를 수정하지 않음. 요청 기능별 테스트 통과를 전체 게이트 통과로 간주하지 않음.
- 초기 게이트가 요구한 구버전 테스트 의존성의 npm 취약점 발견 후 최신 개발 의존성으로 업데이트. 이후 설치 audit0건. 런타임 Toolkit 패키지에 직접 패치 없음.
- 실제 Glass, Android WebView, 밝은 주변 환경의 additive display, 기기 입력 지연/중복/Back·종료 동작, 성능 throttling은 미검증. 배포나 출시 준비 완료로 주장하지 않음.

다음 기기 테스트: 실제 D-pad/Select 신호 확인 후 어댑터 연결, 연속/장시간 조작과 경계 전환, EMG 선택 중복,200% 시스템 텍스트, 화면 가장자리 윤곽, 밝은 배경 대비,백그라운드/재진입, host 종료/Back 확인. 전체 게이트의 Toolkit 접근성/포커스 보고도 출시 전에 해결해야 한다.

개발 서버: `npm run dev -- --host 127.0.0.1 --port 5174` (기본5173은 이미 사용중이어서5174 사용). 생산 빌드 검토는 `npm run preview -- --host 127.0.0.1 --port 4173`.

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
