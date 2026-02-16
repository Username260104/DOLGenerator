# 📋 기능 명세서 (Specification)

## 1. 개요
'DOLGenerator'는 Figma 내에서 AI 기반 3D 에셋 이미지를 생성·편집하는 플러그인입니다.
Create 탭에서 프롬프트 기반 이미지를 생성하고, Edit 탭에서 캔버스 이미지를 Upscale/배경 제거/수정/3D 회전할 수 있습니다.

## 2. 주요 기능

### 2.1 Create 탭
- **Prompt Enhancer**: ✨ Enhance 버튼 → Gemini Flash로 DOL 스타일 영문 프롬프트 자동 생성
- **이미지 생성**: Generate 버튼 → Replicate Flux-Schnell로 1024×1024 이미지 생성 → 프리뷰 후 Apply to Canvas
- **프리뷰 표시**: 생성 결과를 미리보기 후 Apply/Retry 선택

### 2.2 Edit 탭
Figma 캔버스에서 이미지를 선택하면 자동 로드. 아래 기능 버튼은 이미지 선택 전에도 항상 표시 (미선택 시 비활성).
- **3D 회전**: 슬라이더(-180°~+180°)로 각도 설정 → Qwen Image Edit Plus 모델로 시점 회전
- **Upscale**: Real-ESRGAN 모델로 2배 업스케일
- **Remove BG**: Recraft 모델로 배경 제거 (투명 PNG)
- **Refine**: Flux Kontext Pro 모델로 자연어 지시에 따른 이미지 수정
- **Apply to Canvas**: 편집 결과를 Figma 캔버스에 삽입 (WebP→PNG 자동 변환)

## 3. 기술 스택
- **Frontend**: React + TypeScript, Inline Styles (Figma CSP 대응)
- **Bundler**: Webpack
- **프록시 서버**: Express.js (`server.js`, 포트 3001)
  - API 키를 서버 `.env`에서만 관리하여 UI에 노출 방지
  - 4개 엔드포인트: `/api/replicate`, `/api/replicate/poll`, `/api/gemini`, `/api/proxy-image`
- **AI 모델**:
  - Gemini 2.5 Flash — 프롬프트 강화
  - DOL LoRA (username260104/dolfluxlora) — 이미지 생성 (Flux 기반 커스텀 학습 모델)
  - Real-ESRGAN — 업스케일
  - Recraft Remove Background — 배경 제거
  - Flux Kontext Pro — 이미지 수정 (Refine)
  - Qwen Image Edit Plus — 3D 회전
- **UI 테마**: 흑백(B&W) 모노크롬, Inter 폰트

## 4. 파일 구조
- `ui.tsx` — React UI + API 호출 로직 (Create/Edit 탭)
- `code.ts` — Figma Plugin API (이미지 삽입, 캔버스 선택 감지)
- `server.js` — 로컬 프록시 서버 (API 키 보안 관리)
- `webpack.config.js` — 빌드 설정
- `.env` — API 키 (Git 미추적)
- `.env.example` — 환경변수 템플릿
- `manifest.json` — Figma 플러그인 매니페스트
