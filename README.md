# 🧊 DOLGenerator (Figma Plugin)

**DOLGenerator**는 Figma 환경 내에서 AI를 활용해 고품질 3D 에셋을 생성하고 편집할 수 있는 전문 플러그인입니다.
DOL 브랜드의 독창적인 디자인 언어를 반영한 3D 아이콘과 오브젝트를 손쉽게 제작할 수 있도록 설계되었습니다.

---

## 🚀 주요 기능 (Key Features)

이 플러그인은 크게 **생성(Create)** 탭과 **편집(Edit)** 탭으로 구성되어 있습니다.

### 1. Create 탭 (이미지 생성)
사용자의 아이디어를 고품질 3D 렌더링 이미지로 변환합니다.

*   **✨ Prompt Enhancer (프롬프트 강화)**
    *   사용자가 입력한 간단한 키워드나 문장을 **Gemini 2.5 Flash**가 분석하여, DOL 스타일(High-fidelity, 3D render, glossy textures 등)에 최적화된 상세 영문 프롬프트로 자동 변환합니다.
    *   *System Prompt*: "High-fidelity 3D render icon, Data Moshing, floating white squares..." 등 DOL 전용 스타일 가이드가 적용됩니다.

*   **🎨 A.I Image Generation (DOL LoRA)**
    *   **Replicate Flux** 기반의 커스텀 파인튜닝 모델(`username260104/dolfluxlora`)을 사용하여 이미지를 생성합니다.
    *   트리거 워드 "in the style of DOL"이 자동으로 주입되어 브랜드 일관성을 유지합니다.

*   **🖼️ Preview & Apply**
    *   생성된 이미지를 즉시 캔버스에 넣지 않고, 미리보기(Preview)를 통해 확인 후 **Apply to Canvas** 버튼으로 확정할 수 있습니다.

### 2. Edit 탭 (이미지 편집)
Figma 캔버스에 있는 이미지를 선택하여 다양한 후처리를 수행합니다.

*   **🧊 3D Rotation (시점 회전)**
    *   **Qwen Image Edit Plus** 모델을 사용하여 2D 이미지를 3D 물체처럼 인식하고, 원하는 각도(-180° ~ +180°)로 회전시킵니다.
*   **✨ Upscale (고해상도 변환)**
    *   **Real-ESRGAN** 모델을 사용해 이미지 해상도를 2배로 선명하게 확대합니다.
*   **✂️ Remove Background (배경 제거)**
    *   **Recraft** 모델을 활용하여 배경을 투명(Transparent)하게 제거합니다.
*   **🔄 Refine (자연어 수정)**
    *   **Flux Kontext Pro** 모델을 이용해 텍스트 명령어로 이미지의 특정 부분을 수정하거나 디테일을 보강합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend (Plugin UI)
*   **React 19**: 최신 리액트 훅을 활용한 컴포넌트 기반 UI 개발.
*   **TypeScript**: 정적 타입 시스템을 통한 안정적인 코드 구현.
*   **Inline Styles**: Figma 플러그인의 엄격한 CSP(Content Security Policy) 준수를 위해 CSS-in-JS 패턴(Inline Styles) 사용. (Tailwind CDN 미사용)
*   **Webpack 5**: `inline-chunk-html-plugin`을 통해 JS/CSS를 단일 HTML 파일로 번들링하여 Figma 샌드박스 환경에 배포.

### Backend (Local Proxy Server)
*   **Node.js & Express.js**: 로컬 프록시 서버(`server.js`) 운영.
*   **Security**: API Key(Replicate, Gemini)를 클라이언트(UI)에 노출하지 않고 서버 환경변수(`.env`)로 안전하게 관리.
*   **Proxy Features**:
    *   **CORS 우회**: 브라우저 보안 정책을 우회하여 외부 AI API 호출.
    *   **Binary Proxy**: `arrayBuffer` 처리를 통해 외부 이미지 URL을 바이너리 데이터(Uint8Array)로 변환하여 Figma로 전달.

### AI Models (via Replicate & Google)
*   **Generator**: `username260104/dolfluxlora` (Flux-Schnell based LoRA)
*   **Enhancer**: Google `Gemini 2.5 Flash`
*   **Upscaler**: `nightmareai/real-esrgan`
*   **Remover**: `recraft-ai/recraft-remove-background`
*   **Refiner**: `black-forest-labs/flux-kontext-pro`
*   **Rotator**: `qwen/qwen-image-edit-plus`

---

## ⚙️ 설치 및 실행 방법

### 1. 환경 설정
프로젝트 루트에 `.env` 파일을 생성하고 API 키를 입력합니다.
```env
REPLICATE_API_KEY=your_replicate_key
GEMINI_API_KEY=your_gemini_key
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 로컬 프록시 서버 실행
플러그인 사용 중에는 반드시 로컬 서버가 켜져 있어야 합니다.
```bash
npm run server
# http://localhost:3001 에서 실행됨
```

### 4. 플러그인 빌드
```bash
npm run build
# dist/ui.html 생성
```

### 5. Figma에서 실행
1.  Figma 실행 > **Plugins** > **Development** > **Import plugin from manifest...**
2.  `manifest.json` 파일 선택.
3.  플러그인 실행 (Run).

---

## 🧱 현재 아키텍처 (Refactored)

### Frontend 구조
- `ui.tsx`: App 조합/탭 전환/훅 연결
- `components/`: `CreateTab`, `EditTab`, `Spinner`
- `hooks/`: `useCreateActions`, `useEditActions`
- `services/`: API 호출/이미지 변환/메시지 브리지/응답 가드
- `constants/`: 모델/프롬프트/스타일
- `types/`: API, UI, Plugin 메시지 타입

### Backend 구조
- `server.js`: 엔트리 포인트(환경변수 + 앱 부팅)
- `server/app.js`: Express 앱 조립
- `server/routes/`: `replicate`, `gemini`, `proxyImage` 라우트
- `server/validators.js`: URL/호스트 검증 유틸

### 데이터 흐름
1. UI에서 사용자 액션 발생
2. `hooks`가 `services` 호출
3. `services`가 로컬 프록시(`/api/*`) 경유로 외부 API 호출
4. 결과 이미지를 DataURL/Uint8Array로 변환
5. `plugin` 메시지 브리지로 `code.ts`에 전달
6. `code.ts`가 Figma 캔버스에 삽입/선택 이미지 추출

---

## 📌 리팩토링 진행 현황

기준 계획(8개 축) 대비 현재 진행도: **약 95%**

1. 구조 분리: 완료
2. 네트워크 계층 공통화: 완료
3. 타입 강화: 완료 (메시지 타입/응답 가드 적용)
4. 서버 하드닝: 완료 (URL 검증 + 타임아웃 + 공통 에러 처리 + 로깅)
5. 상태 관리 단순화: 완료 (Create/Edit 훅 분리)
6. 스타일 정리: 완료 (스타일/뷰 분리)
7. 테스트 체계 도입: 완료 (Node test + 서버 라우트/유틸 테스트 추가)
8. 빌드/운영 설정 정리: 완료 (dev/prod 분리, source map 정책 분리)

### 다음 배치 작업
- CI 환경에서 `npm install` 후 `npm run lint`, `npm run test`, `npm run build` 실행 검증
- E2E 수준의 실제 Figma 플러그인 동작 검증(로컬 프록시 연동)
