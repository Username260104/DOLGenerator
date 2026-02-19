# ⚡ DOL Generator: 기술 및 AI 스택 소개

**DOL Generator**는 Figma에 완벽하게 통합된 고품질 3D 에셋 생성 도구입니다. 세계 최고 수준(SOTA)의 AI 모델 파이프라인을 활용하여, 단순한 텍스트 아이디어를 DOL 브랜드 스타일에 맞는 프리미엄 3D 비주얼로 변환합니다.

## 🧠 핵심 AI 파이프라인 (Core AI Pipeline)

일관된 품질을 보장하기 위해 정교하게 설계된 다단계 AI 워크플로우를 사용합니다.

### 1. 프롬프트 엔지니어링 에이전트 (Gemini 2.5)
사용자가 복잡한 프롬프트 작성법을 배울 필요가 없도록, **Google Gemini 2.5 Flash**를 지능형 중개자로 활용합니다.
- **역할 (Role)**: 사용자의 날것의 아이디어를 해석하여 생성형 AI가 이해하기 쉬운 전문가 수준의 사진 묘사 프롬프트로 재작성합니다.
- **메커니즘 (Mechanism)**: "DOL" 브랜드의 고유한 미적 기준(고해상도, 광택 있는 질감, 스튜디오 조명 등)을 자동으로 강제 적용합니다.

### 2. 이미지 합성 (Flux.1 Schnell + Custom LoRA)
핵심 생성 엔진은 **Black Forest Labs의 Flux.1 Schnell** 모델을 기반으로 하며, 커스텀 **DOL Data LoRA**로 미세 조정(Fine-tuning)되었습니다.
- **모델 (Model)**: `black-forest-labs/flux-schnell`
- **학습 (Fine-tuning)**: DOL만의 3D 디자인 언어(추상적인 형태, 글래스모피즘, 데이터 모싱 효과)를 학습한 전용 LoRA를 적용했습니다.
- **성능 (Performance)**: Schnell(고속) 아키텍처를 사용하여 고해상도 프로덕션 에셋을 수 초 내에 생성합니다.

---

## 🛠️ 고급 편집 도구 (Advanced Editing Suite)

단순 생성을 넘어, Figma 내에서 에셋을 정교하게 수정할 수 있는 다양한 뉴럴 편집 기능을 제공합니다.

| 기능 | 모델 / 기술 | 설명 |
| :--- | :--- | :--- |
| **✨ 업스케일 (Upscale)** | **Real-ESRGAN**<br>(`nightmareai/real-esrgan`) | 텍스처와 디테일을 복원하며 이미지 해상도를 2배로 확장하여, 웹이나 인쇄 등 어떤 크기에서도 선명한 품질을 보장합니다. |
| **✂️ 배경 제거 (Remove BG)** | **Recraft v3**<br>(`recraft-ai/recraft-remove-background`) | 유리나 연기처럼 처리가 까다로운 반투명 객체나 복잡한 경계선의 배경도 정밀하게 제거하는 업계 최고 수준의 기술입니다. |
| **🧊 3D 회전 (3D Rotate)** | **Qwen Image Edit**<br>(`qwen/qwen-image-edit-plus`) | 시각-언어 모델(VLM)을 사용하여 피사체의 3D 기하구조를 이해하고, 새로운 각도에서 "다시 촬영"한 듯한 결과를 생성합니다. |
| **🛠️ 리파인 (Refine)** | **Flux Kontext**<br>(`flux-kontext-pro`) | 자연어 명령을 통해 이미지의 특정 부분만 지능적으로 수정(In-painting)하거나 디테일을 보강하는 특수 모델입니다. |

---

## 💻 기술 스택 아키텍처 (Tech Stack Architecture)

### 프론트엔드 (Figma Plugin)
- **프레임워크**: **React 19**를 사용하여 빠르고 반응형인 상태 기반 UI를 구현했습니다.
- **스타일링**: DOL 브랜드와 일관된 커스텀 디자인 시스템을 **CSS Modules**로 적용하여 시각적 통일감을 줍니다.
- **통신**: UI 스레드와 Figma 샌드박스 환경 간에 양방향 `postMessage` 브릿지를 구축하여 데이터를 안전하게 교환합니다.

### 백엔드 (Local Proxy)
- **런타임**: **Node.js** & **Express**.
- **보안**: 클라이언트(브라우저)에 API 키(Replicate, Google Cloud)를 노출하지 않고 서버에서 안전하게 관리하는 게이트웨이 역할을 합니다.
- **최적화**: Figma의 엄격한 네트워크 보안 정책(CORS)을 우회하기 위해 이미지 바이너리 스트림 처리 및 프록싱을 담당합니다.
