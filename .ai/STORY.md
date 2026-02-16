# 📜 변경 이력 (History)

## 2026-02-17
### 🎨 DOL LoRA 모델 적용 (Custom Fine-tuned Model)
- **변경**: Create 탭 이미지 생성 모델을 `black-forest-labs/flux-schnell`에서 DOL 전용 LoRA 모델(`username260104/dolfluxlora`)로 교체.
- **파라미터 변경**: `go_fast` 제거, `model: 'schnell'`, `lora_scale: 1`, `num_inference_steps: 4` 추가.
- **파일**: `ui.tsx` — `onGenerate` 함수의 API 엔드포인트 및 input 파라미터 수정.


### 🧹 코드 마무리 정리 (Production Cleanup)
- **디버그 로그 제거**: `ui.tsx`(9개), `code.ts`(4개), `server.js`(디버그 블록) — 모든 `console.log` 삭제. `console.error`는 에러 핸들링용으로 유지.
- **주석 보강**: API 호출부(Gemini, Replicate), Figma 메시지 처리부, 각 Edit 핸들러에 "왜 이 코드가 필요한지" 설명 주석 추가.
- **Secrets 확인**: `secrets.ts` 미존재 확인. API 키는 `server.js`의 `process.env`로만 참조. `.gitignore`에 `.env`/`secrets.ts` 포함 확인.
- **SPEC.md 전면 갱신**: 현재 기능 상태(Edit 탭 5개 기능, B&W UI, 로컬 프록시) 반영.

### 🎨 UI 스타일 리디자인 (B&W Monochrome)
- **색상**: 모든 포인트 컬러(#00FF41) → 흑백(B&W) 변경. 탭, 버튼, 이미지 보더, 슬라이더 등.
- **레이아웃**: 타이틀 제거, 프롬프트 높이 증가(140px), "Prompt" 라벨 제거, 탭 위치 상향.
- **버튼**: Enhance를 Generate 옆에 작게 배치 (동일 높이), Cancel 버튼 제거.
- **Edit 탭 구조 개선**: 기능 버튼(3D 회전, Upscale, RemoveBG, Refine, Apply)을 이미지 선택 여부와 무관하게 항상 표시. 미선택 시 비활성(disabled).
- **스크롤**: Edit 탭 좌우 스크롤 제거, `contentArea`에 세로 스크롤 적용.

### 🧊 3D 회전 기능 추가 (Qwen Image Edit Plus)
- **UI**: 슬라이더(-180°~+180°) + "회전 적용" 버튼.
- **로직**: 각도를 자연어 프롬프트로 변환 → `qwen/qwen-image-edit-plus` 모델 호출.

### 🔄 Refine 기능 추가 (Flux Kontext Pro)
- **UI**: 텍스트 입력 + "수정하기" 버튼.
- **로직**: `black-forest-labs/flux-kontext-pro` 모델, `input_image` + `prompt` 파라미터.

### 🖥️ 로컬 Node.js 프록시 서버 도입
- **목적**: 외부 프록시(corsproxy) 의존 제거 + API 키 보안 + 대용량 이미지 413 에러 해결.
- **server.js**: Express 기반 로컬 서버 (포트 3001). 4개 엔드포인트:
  - `POST /api/replicate` — Replicate API 중계 (Authorization 자동 주입)
  - `GET /api/replicate/poll` — Replicate 폴링 중계
  - `POST /api/gemini` — Gemini API 중계 (key 파라미터 자동 주입)
  - `GET /api/proxy-image` — 이미지 바이너리 프록시
- **ui.tsx**: postMessage 기반 → `fetch(localhost:3001/...)` 직접 호출로 교체.
- **code.ts**: API 프록시 코드 전체 제거. Figma 전용 기능만 유지.
- **manifest.json**: 외부 도메인 제거, `http://localhost:3001`만 허용.
- **의존성**: `express`, `cors`, `dotenv` 추가. `npm run server`로 시작.

## 2026-02-15
### 🔗 Edit 탭 API 연동 (Upscale, Remove BG)
- **Upscale**: `nightmareai/real-esrgan` 모델, scale: 2. 결과를 프록시→fetch→base64로 변환하여 프리뷰 교체.
- **Remove BG**: `cjwbw/rembg` 모델. 동일 패턴으로 배경 제거 결과 프리뷰 교체.
- **공통**: `callReplicateEditModel` 헬퍼 함수(Prefer: wait + 폴링). `editLoading`/`editLoadingAction` 상태 관리.

### 📂 Edit 탭: Figma 캔버스 이미지 연동
- **방식**: OS 파일 드래그 → Figma `selectionchange` API 기반으로 변경. 캔버스에서 이미지를 선택하면 자동으로 플러그인에 로드.
- **code.ts**: `selectionchange` 리스너 + `exportAsync(PNG)` → Base64 변환 → UI 전달. `isEditTabActive` 플래그로 Edit 탭에서만 동작.
- **ui.tsx**: `useEffect`로 `selection-image` 메시지 수신, 탭 전환 시 `edit-tab-active` 메시지 전송.
- **UI**: 선택 안내 영역(🖼️ + "Select an image on the Figma canvas") + 이미지 프리뷰 + Upscale/Remove BG/Refine 버튼.

### 🗂️ Create / Edit 탭 구조 도입
- **변경**: 단일 화면 UI → `Create`/`Edit` 탭 구조로 분리.
- **Create 탭**: 기존 프롬프트 입력, Enhance, Generate, Preview 등 생성 로직 전체 포함.
- **Edit 탭**: 향후 편집 기능을 위한 placeholder ("Drag an image from Figma to edit").
- **스타일**: 활성 탭 Matrix Green(`#00FF41`) 텍스트/밑줄, 비활성 `#666`, Bold Uppercase.

### 🖼️ Preview & Apply 워크플로우 전환
- **변경**: 이미지 생성 후 즉시 Figma에 삽입(Direct Insert) → 프리뷰 표시 후 사용자 확인(Preview & Apply) 방식으로 전환.
- **UI**: Preview Mode에서 Matrix Green 테두리 이미지 + `Apply to Canvas` / `Retry` 버튼 표시.
- **로직**: `previewUrl`/`previewData` 상태로 Blob URL과 바이너리 데이터 분리 보관, Apply 시 Figma에 전송.

### ♻️ Prompt Enhancer UI 리팩토링 (독립 버튼 방식)
- **변경**: Generate 클릭 시 자동 강화 → 독립 '✨ Enhance' 버튼으로 분리.
- **UI**: 입력 필드를 `<textarea>`로 변경, 우측 하단에 Matrix Green(`#00FF41`) 스타일 Enhance 버튼 배치.
- **상태**: `isEnhancing` 상태 추가, 강화 중 버튼 비활성화 및 텍스트 변경.
- **동작**: Enhance 클릭 → Gemini Flash로 강화 → 결과를 입력창에 교체 → 사용자가 확인/수정 후 Generate.

### ✨ Prompt Enhancer 기능 추가 (Gemini Flash Integration)
- **기능**: 사용자 입력(한글 포함)을 Gemini 2.0 Flash API에 전송하여 DOL 브랜드 스타일의 영문 3D 에셋 프롬프트로 자동 변환.
- **변경 사항**:
  - `ui.tsx`: `enhancePrompt()` 함수 신규 구현, `onGenerate` 파이프라인 연결.
  - `manifest.json`: `generativelanguage.googleapis.com` 도메인 허용 추가.
  - `.env` / `.env.example`: `GEMINI_API_KEY` 환경변수 추가.
  - 로딩 버튼에 단계별 상태 표시 (`Enhancing...` → `Generating...`).

### 🔒 API Key 보안 리팩토링 (Environment Variable Migration)
- **문제**: `ui.tsx`에 Replicate API Key가 평문으로 하드코딩되어 Git 이력에 노출 위험.
- **해결**:
  - `.env` 파일로 API Key를 분리하고, `.gitignore`에 추가하여 Git 추적 방지.
  - `dotenv-webpack` 플러그인을 도입하여 빌드 시 `process.env`로 환경변수 주입.
  - API Key 미설정 시 사용자 경고 방어 로직 추가.
  - `.env.example` 템플릿 파일 제공.

### 🚑 이미지 포맷 수정 (Image Format Fix)
- **버그**: Replicate API가 기본적으로 `WebP` 포맷을 반환하나, Figma `createImage` API는 `WebP`를 지원하지 않아 `Image type is unsupported` 에러 발생.
- **해결**: `ui.tsx`의 API 요청 파라미터 `output_format`을 `webp`에서 `png`로 변경하여 호환성 확보.

### 🛠️ 백엔드 디버깅 로직 강화 (Backend Debugging)
- **증상**: 이미지 데이터 전송 후 캔버스에 이미지가 보이지 않는 현상 지속.
- **조치**: `code.ts` 로직 전면 개편.
  - **로그 강화**: 메시지 수신, 데이터 크기, 이미지 생성 성공 여부 등 단계별 로그 출력.
  - **유효성 검사**: 수신된 `Uint8Array` 데이터가 비어있는지 확인.
  - **뷰포트 강제 이동**: `figma.viewport.scrollAndZoomIntoView()`를 사용하여 생성된 이미지 위치로 화면 이동.
  - **에러 핸들링**: `try-catch` 블록으로 감싸 예외 발생 시 플러그인 알림(`figma.notify`) 및 에러 로그 출력.

### 🐞 이미지 렌더링 버그 수정 (Image Handling Fix)
- **증상**: API 호출은 성공했으나, Figma 캔버스에 이미지가 렌더링되지 않음.
- **원인**: 이미지 URL을 단순히 전달하면 Figma 플러그인 샌드박스에서 외부 이미지를 직접 로드할 수 없음.
- **해결**:
  - `ui.tsx`: `corsproxy.io`를 통해 이미지를 직접 Fetch하고, `ArrayBuffer` -> `Uint8Array`로 변환하여 바이너리 데이터 자체를 플러그인 Backend로 전송하도록 수정.
  - 디버깅을 위한 `console.log` 추가.

### ⚡ API 로직 최적화 (API Refinement)
- **CORS 해결 심화**: `corsproxy.io` 사용 시 URL Encoding 적용 (`encodeURIComponent`).
- **속도 최적화**: `Prefer: wait` 헤더를 추가하여 `flux-schnell`의 빠른 생성 결과를 Polling 없이 동기적으로 수신하도록 개선.

### 🌐 CORS 프록시 적용 (CORS Proxy Support)
- **증상**: Replicate API 호출 시 브라우저 보안 정책(CORS)으로 인해 요청이 차단될 가능성 제기.
- **해결**: `corsproxy.io`를 중간 프록시로 사용하여 우회.
  - `manifest.json`: `https://corsproxy.io` 도메인 허용 추가.
  - `ui.tsx`: API 호출 및 이미지 데이터 Fetch 시 프록시 URL(`https://corsproxy.io/?`)을 경유하도록 로직 수정.

### 🚀 배포 준비 완료 (Final Polish)
- **API Key 통합**: 사용자로부터 제공받은 Replicate API Key를 `ui.tsx`에 통합 완료.
- **코드 복구**: 실수로 삭제된 `code.ts` 로직을 복구하여 정상 동작 확인.
- **빌드 검증**: `npm run build` 성공, 모든 기능 정상 작동 대기 상태.

### 🎨 이미지 생성 기능 구현 (Replicate API)
- **기능**: 사용자가 입력한 프롬프트를 기반으로 고품질 이미지를 생성하고 Figma 캔버스에 배치.
- **변경 사항**:
  - `manifest.json`: `api.replicate.com`, `replicate.delivery` 도메인 허용.
  - `ui.tsx`:
    - `black-forest-labs/flux-schnell` 모델 호출 로직 구현.
    - 프롬프트 스타일 강제 주입 ("...dystopian mood, octane render").
    - 이미지 URL을 `fetch`하여 `Uint8Array` 바이너리 데이터로 변환 후 전송.
  - `code.ts`:
    - `create-image` 메시지 핸들러 추가.
    - 1024x1024 크기 사각형 생성 및 이미지 채우기 (`figma.createImage`).
    - 뷰포트 중앙 배치 로직 적용.

### 🔧 스크립트 인라인 적용 (Script Inlining)
- **증상**: Figma 내부 로그확인 결과, 로컬 스크립트 파일(`ui.js`) 로딩 실패로 인한 White Screen 지속.
- **해결**: `inline-chunk-html-plugin`을 도입하여 Webpack 빌드 시 JS 코드를 `ui.html` 내부에 직접 주입하도록 수정.

### 🛠️ Webpack 설정 안정화 (Production Config)
- **배경**: HMR(Hot Module Replacement) 및 DevServer가 Figma 보안 정책과 충돌하여 스크립트 실행이 차단됨.
- **변경 사항**:
  - `mode`: `'production'`으로 고정 (개발 모드 비활성화).
  - `devtool`: `'inline-source-map'` 사용 ('eval' 사용 중지).
  - `optimization`: 가독성 확보 및 디버깅을 위해 `minimize: false` 설정.
  - `plugins`: 개발 전용 플러그인 제거, `HtmlWebpackPlugin`만 유지.

### 🐛 버그 수정 (White Screen Fix)
- **증상**: 플러그인 실행 시 하얀 화면만 나타나는 현상.
- **원인**: Webpack 번들 스크립트가 DOM 렌더링 전에 실행되거나, 올바르게 주입되지 않음.
- **해결**:
  - `webpack.config.js`: `HtmlWebpackPlugin` 옵션을 `inject: 'body'`로 변경하여 스크립트가 `<body>` 끝에 주입되도록 수정.
  - `ui.html`: 불필요한 스크립트 제거 및 `<div id="react-page">` 존재 확인.
  - `ui.tsx`: `DOMContentLoaded` 이벤트 리스너를 추가하여 DOM 로드 완료 후 React가 마운트되도록 안전장치 추가.

### ♻️ UI 스타일 리팩토링 (Tailwind CDN -> Inline Styles)
- **배경**: Figma CSP 정책으로 인해 Tailwind CDN 사용이 제한됨.
- **변경 사항**:
  - `ui.html`: Tailwind CDN 스크립트 제거.
  - `manifest.json`: `allowedDomains`에서 CDN 도메인 제거 및 초기화.
  - `ui.tsx`: Tailwind 유틸리티 클래스를 모두 React Inline Styles 객체로 변환.

### ✨ 플러그인 초기 구현 (React + Webpack)
- **환경 설정**:
  - `package.json`: React, Webpack, TypeScript 관련 의존성 추가.
  - `webpack.config.js`: React(JSX) 및 TypeScript 빌드 설정, HTML 플러그인 구성.
  - `tsconfig.json`: JSX(`react`) 및 DOM 라이브러리 지원 설정.
  - `manifest.json`: 빌드 결과물(`dist/`)을 참조하도록 경로 수정.
- **UI 구현**:
  - `ui.tsx`: React 기반 UI 컴포넌트 구현 (Input, Button).
  - `ui.html`: Tailwind CSS (CDN) 적용 및 React 마운트 포인트 추가.
- **로직 구현**:
  - `code.ts`: `create-rect` 메시지 수신 시 100x100px 빨간색 사각형 생성 로직 구현.
