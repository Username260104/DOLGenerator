import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './ui.css';

// 버튼 내부에 표시할 인라인 스피너 컴포넌트
// variant='light': 어두운 배경(Primary 버튼)에서 흰색 스피너
const Spinner = ({ variant = 'default' }: { variant?: 'default' | 'light' }) => (
    <span className={`spinner${variant === 'light' ? ' spinner--light' : ''}`} />
);

// DOL 브랜드 스타일 System Prompt (Gemini에 전달)
const ENHANCER_SYSTEM_PROMPT = `역할: 너는 'DOL' 브랜드의 3D 에셋 프롬프트 엔지니어다.

입력: 사용자의 날것의 아이디어 (예: "깨진 유리", "사이버 폁크 의자").

출력: Replicate Flux 모델에 넣을 영문 프롬프트 단 하나.

스타일 규칙: 3D render, fragmented terrain chunks floating in a white background #ffffff, dystopian atmosphere, high contrast, cinematic lighting, sharp edges, rough rock and sparse grass, jagged landmasses, isolated pieces of ground, dark environment, detailed weathering.

출력 형식: 설명 없이 오직 프롬프트 텍스트만 반환할 것.`;

function App() {
    const [prompt, setPrompt] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [isEnhancing, setIsEnhancing] = React.useState(false);
    // 프리뷰 모드: 생성된 이미지 URL과 바이너리 데이터를 보관
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [previewData, setPreviewData] = React.useState<Uint8Array | null>(null);
    // 탭 전환 상태
    const [activeTab, setActiveTab] = React.useState<'create' | 'edit'>('create');
    // Edit 탭: Figma 캔버스 이미지 상태
    const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
    // Edit 탭: API 로딩 상태
    // Edit 탭: 각 기능별 개별 로딩 상태
    const [isUpscaling, setIsUpscaling] = React.useState(false);
    const [isRemovingBG, setIsRemovingBG] = React.useState(false);
    const [isRefining, setIsRefining] = React.useState(false);
    const [isRotating, setIsRotating] = React.useState(false);
    // 어떤 Edit 기능이든 로딩 중인지 판별하는 파생 값
    const editLoading = isUpscaling || isRemovingBG || isRefining || isRotating;
    // Edit 탭: Refine 프롬프트
    const [refinePrompt, setRefinePrompt] = React.useState('');
    // Edit 탭: 3D 회전 각도
    const [rotateAngle, setRotateAngle] = React.useState(0);

    // --- Edit 탭: Figma 캔버스 선택 감지 ---
    // code.ts로부터 selection-image 메시지를 수신하여 이미지 표시
    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const msg = event.data?.pluginMessage;
            if (msg?.type === 'selection-image') {
                setUploadedImage(msg.data);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // 탭 전환 시 code.ts에 Edit 탭 활성 상태 알림
    React.useEffect(() => {
        window.parent.postMessage({
            pluginMessage: { type: 'edit-tab-active', active: activeTab === 'edit' }
        }, '*');
    }, [activeTab]);
    // --- 로컬 프록시 서버 URL ---
    const SERVER_URL = 'http://localhost:3001';

    // Gemini API를 통해 사용자의 간단한 프롬프트를 DOL 브랜드 스타일에 맞는
    // 상세한 영문 프롬프트로 강화. ENHANCER_SYSTEM_PROMPT가 변환 규칙을 정의함.
    const handleEnhancePrompt = async () => {
        if (!prompt) return;
        setIsEnhancing(true);

        try {
            const res = await fetch(`${SERVER_URL}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: ENHANCER_SYSTEM_PROMPT }]
                    },
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gemini API 요청 실패');

            // Gemini 응답 구조: candidates[0].content.parts[0].text
            const enhancedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!enhancedText) throw new Error('Gemini 응답에서 프롬프트를 추출할 수 없습니다.');

            setPrompt(enhancedText.trim());
        } catch (error) {
            console.error(error);
            alert('프롬프트 강화에 실패했습니다. 콘솔을 확인해주세요.');
        } finally {
            setIsEnhancing(false);
        }
    };

    // Replicate flux-schnell 모델로 이미지 생성.
    // 흐름: 1) API 호출 → 2) 폴링(미완료 시) → 3) 이미지 다운로드 → 4) 프리뷰 표시
    const onGenerate = async () => {
        if (!prompt) return;
        setLoading(true);

        try {
            // 1단계: Replicate API로 이미지 생성 요청 (로컬 프록시 경유)
            const res = await fetch(`${SERVER_URL}/api/replicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: 'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
                    method: 'POST',
                    input: {
                        prompt: prompt,
                        go_fast: true,
                        megapixels: '1',
                        num_outputs: 1,
                        aspect_ratio: '1:1',
                        output_format: 'jpg',
                        output_quality: 100,
                    }
                }),
            });

            let prediction = await res.json();
            let imageUrl = null;

            // 2단계: Prefer: wait 헤더로 즉시 응답을 기대하지만,
            // 아직 처리 중이면 폴링으로 완료 대기
            if (prediction.status === 'succeeded' && prediction.output) {
                imageUrl = prediction.output[0];
            } else if (prediction.status === 'starting' || prediction.status === 'processing') {
                while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
                    await new Promise(r => setTimeout(r, 1000));
                    const pollRes = await fetch(
                        `${SERVER_URL}/api/replicate/poll?url=${encodeURIComponent(prediction.urls.get)}`
                    );
                    prediction = await pollRes.json();
                }
                if (prediction.status === 'failed') throw new Error('Generation Failed');
                imageUrl = prediction.output[0];
            } else {
                throw new Error('Generation Failed or Timed Out');
            }

            if (!imageUrl) throw new Error('No image URL received');

            // 3단계: 생성된 이미지를 로컬 프록시로 다운로드 (CORS 우회)
            const imageRes = await fetch(
                `${SERVER_URL}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
            );
            if (!imageRes.ok) throw new Error('Image Fetch Failed');

            const imageBlob = await imageRes.blob();
            const arrayBuffer = await imageBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const blobUrl = URL.createObjectURL(imageBlob);

            // 4단계: 프리뷰 모드로 전환 (Apply 전 미리보기)
            setPreviewUrl(blobUrl);
            setPreviewData(uint8Array);

        } catch (error) {
            console.error(error);
            alert('Failed to generate image. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    // Apply to Canvas: 프리뷰 이미지를 Figma 캔버스에 삽입
    const handleApply = () => {
        if (!previewData) return;
        window.parent.postMessage({
            pluginMessage: {
                type: 'create-image',
                data: previewData
            }
        }, '*');
        // 프리뷰 초기화
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewData(null);
    };

    // Retry: 프리뷰를 닫고 입력 화면으로 복귀
    const handleRetry = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewData(null);
    };

    const onCancel = () => {
        window.parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
    };

    const handleClearImage = () => {
        setUploadedImage(null);
    };

    // --- Edit 탭: 편집된 이미지를 Figma 캔버스에 적용 ---
    // WebP 등 Figma 미지원 포맷을 Canvas를 통해 PNG로 변환
    const handleEditApply = async () => {
        if (!uploadedImage) return;
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('이미지 로드 실패'));
                img.src = uploadedImage;
            });

            // Canvas를 통해 PNG로 변환
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);

            const pngBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('PNG 변환 실패'));
                }, 'image/png');
            });

            const arrayBuffer = await pngBlob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);

            window.parent.postMessage({
                pluginMessage: {
                    type: 'create-image',
                    data: bytes
                }
            }, '*');
        } catch (error) {
            console.error('Apply 실패:', error);
            alert('캔버스에 이미지를 적용하지 못했습니다.');
        }
    };

    // Edit 탭의 모든 편집 기능(Upscale, RemoveBG, Refine, Rotate)이 공유하는
    // Replicate API 호출 헬퍼. 모델 경로와 input을 받아 결과 이미지 URL을 반환.
    // 로컬 프록시 서버를 경유하여 API 키 노출을 방지.
    const callReplicateEditModel = async (modelPath: string, input: Record<string, any>): Promise<string> => {
        const apiUrl = `https://api.replicate.com/v1/models/${modelPath}/predictions`;
        const res = await fetch(`${SERVER_URL}/api/replicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: apiUrl, method: 'POST', input }),
        });

        let prediction = await res.json();
        if (!res.ok) {
            if (res.status === 429) throw new Error('Replicate API 요청 제한 초과. 잠시 후 다시 시도해주세요.');
            throw new Error(`API Request Failed: ${res.status} - ${prediction.error || prediction.detail || JSON.stringify(prediction)}`);
        }

        // Prefer: wait 헤더로 대부분 즉시 완료되지만, 처리 중이면 폴링
        if (prediction.status === 'starting' || prediction.status === 'processing') {
            while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
                await new Promise(r => setTimeout(r, 1500));
                const pollRes = await fetch(
                    `${SERVER_URL}/api/replicate/poll?url=${encodeURIComponent(prediction.urls.get)}`
                );
                prediction = await pollRes.json();
            }
        }

        if (prediction.status === 'failed') throw new Error('Processing failed');

        // 모델마다 output 형식이 다름: string 또는 string[] 처리
        const outputUrl = typeof prediction.output === 'string'
            ? prediction.output
            : prediction.output?.[0];

        if (!outputUrl) throw new Error('No output URL received');
        return outputUrl;
    };

    const handleUpscale = async () => {
        if (!uploadedImage) return;
        setIsUpscaling(true);
        try {
            const resultUrl = await callReplicateEditModel(
                'nightmareai/real-esrgan',
                { image: uploadedImage, scale: 2 }
            );
            const imageRes = await fetch(
                `${SERVER_URL}/api/proxy-image?url=${encodeURIComponent(resultUrl)}`
            );
            const blob = await imageRes.blob();
            const reader = new FileReader();
            reader.onload = (e) => setUploadedImage(e.target?.result as string);
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Upscale 실패:', error);
            alert('Upscale에 실패했습니다. 콘솔을 확인해주세요.');
        } finally {
            setIsUpscaling(false);
        }
    };

    const handleRemoveBG = async () => {
        if (!uploadedImage) return;
        setIsRemovingBG(true);
        try {
            const resultUrl = await callReplicateEditModel(
                'recraft-ai/recraft-remove-background',
                { image: uploadedImage }
            );
            const imageRes = await fetch(
                `${SERVER_URL}/api/proxy-image?url=${encodeURIComponent(resultUrl)}`
            );
            const blob = await imageRes.blob();
            const reader = new FileReader();
            reader.onload = (e) => setUploadedImage(e.target?.result as string);
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Remove BG 실패:', error);
            alert('배경 제거에 실패했습니다. 콘솔을 확인해주세요.');
        } finally {
            setIsRemovingBG(false);
        }
    };

    const handleRefine = async () => {
        if (!uploadedImage || !refinePrompt) return;
        setIsRefining(true);
        try {
            const resultUrl = await callReplicateEditModel(
                'black-forest-labs/flux-kontext-pro',
                {
                    input_image: uploadedImage,
                    prompt: refinePrompt,
                }
            );
            const imageRes = await fetch(
                `${SERVER_URL}/api/proxy-image?url=${encodeURIComponent(resultUrl)}`
            );
            const blob = await imageRes.blob();
            const reader = new FileReader();
            reader.onload = (e) => setUploadedImage(e.target?.result as string);
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Refine 실패:', error);
            alert('이미지 수정에 실패했습니다. 콘솔을 확인해주세요.');
        } finally {
            setIsRefining(false);
        }
    };

    const handleRotate = async () => {
        if (!uploadedImage) return;
        setIsRotating(true);
        try {
            const direction = rotateAngle >= 0 ? 'right' : 'left';
            const absAngle = Math.abs(rotateAngle);
            const rotatePrompt = `Rotate the object ${absAngle} degrees to the ${direction} horizontally. Keep the same background and lighting.`;

            const resultUrl = await callReplicateEditModel(
                'qwen/qwen-image-edit-plus',
                {
                    image: [uploadedImage],
                    prompt: rotatePrompt,
                }
            );
            const imageRes = await fetch(
                `${SERVER_URL}/api/proxy-image?url=${encodeURIComponent(resultUrl)}`
            );
            const blob = await imageRes.blob();
            const reader = new FileReader();
            reader.onload = (e) => setUploadedImage(e.target?.result as string);
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Rotate 실패:', error);
            alert('3D 회전에 실패했습니다. 콘솔을 확인해주세요.');
        } finally {
            setIsRotating(false);
        }
    };

    const styles = {
        container: {
            padding: '8px 16px 16px',
            backgroundColor: 'white',
            height: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            color: 'black',
            fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box' as const,
            overflowX: 'hidden' as const,
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '12px',
            marginTop: '8px',
        },
        // --- 탭 헤더 스타일 ---
        tabHeader: {
            display: 'flex',
            width: '100%',
            maxWidth: '320px',
            marginBottom: '8px',
            borderBottom: '1px solid #e5e7eb',
        },
        tabButton: (isActive: boolean) => ({
            flex: 1,
            padding: '10px 0',
            background: 'none',
            border: 'none',
            borderBottom: isActive ? '2px solid #000000' : '2px solid transparent',
            color: isActive ? '#000000' : '#999999',
            fontSize: '13px',
            fontWeight: 700 as const,
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.5px',
        }),
        // --- 컨텐츠 영역 ---
        contentArea: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'flex-start',
            flex: 1,
            width: '100%',
            overflowY: 'auto' as const,
        },
        formGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '8px',
            width: '100%',
            maxWidth: '320px',
            flex: 1,
        },
        label: {
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '4px',
        },
        textarea: {
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '8px',
            color: 'black',
            fontSize: '14px',
            width: '100%',
            boxSizing: 'border-box' as const,
            resize: 'vertical' as const,
            minHeight: '140px',
            fontFamily: 'Inter, sans-serif',
        },
        // 입력창 + Enhance 버튼을 감싸는 컨테이너
        inputWrapper: {
            position: 'relative' as const,
            width: '100%',
        },
        // ✨ Enhance 버튼: B&W 스타일
        buttonEnhance: {
            backgroundColor: 'transparent',
            color: '#333333',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '9px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap' as const,
            boxSizing: 'border-box' as const,
        },
        buttonPrimary: {
            backgroundColor: 'black',
            color: 'white',
            borderRadius: '4px',
            padding: '10px',
            marginTop: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            width: '100%',
            boxSizing: 'border-box' as const,
        },
        buttonSecondary: {
            color: '#6b7280',
            fontSize: '12px',
            marginTop: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center' as const,
        },
        // --- Preview Mode 스타일 ---
        previewContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            maxWidth: '320px',
        },
        previewImage: {
            width: '100%',
            borderRadius: '6px',
            border: '2px solid #000000',
        },
        previewButtonRow: {
            display: 'flex',
            gap: '8px',
            width: '100%',
        },
        buttonApply: {
            flex: 1,
            backgroundColor: '#000000',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
        },
        buttonRetry: {
            flex: 1,
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
        },
        // --- Edit 탭 스타일 ---
        selectionZone: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '320px',
            minHeight: '200px',
            border: '2px dashed #333333',
            borderRadius: '8px',
            backgroundColor: '#111111',
            color: '#666666',
            fontSize: '14px',
            gap: '8px',
        },
        selectionZoneIcon: {
            fontSize: '32px',
        },
        selectionZoneText: {
            fontStyle: 'italic' as const,
            textAlign: 'center' as const,
            padding: '0 20px',
            lineHeight: '1.5',
        },
        // Edit 탭: 이미지 프리뷰 + 액션 영역
        editPreviewContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box' as const,
            overflowX: 'hidden' as const,
        },
        editImageWrapper: {
            position: 'relative' as const,
            width: '100%',
        },
        editImage: {
            width: '100%',
            borderRadius: '6px',
            border: '2px solid #000000',
            display: 'block' as const,
        },
        editCloseButton: {
            position: 'absolute' as const,
            top: '8px',
            right: '8px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#ffffff',
            border: '1px solid #333',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
        },
        editActionRow: {
            display: 'flex',
            gap: '6px',
            width: '100%',
        },
        editActionButton: {
            flex: 1,
            backgroundColor: '#000000',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 4px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center' as const,
        }
    };

    return (
        <div style={styles.container}>

            {/* 탭 헤더 */}
            <div style={styles.tabHeader}>
                <button
                    style={styles.tabButton(activeTab === 'create')}
                    onClick={() => setActiveTab('create')}
                >
                    Create
                </button>
                <button
                    style={styles.tabButton(activeTab === 'edit')}
                    onClick={() => setActiveTab('edit')}
                >
                    Edit
                </button>
            </div>

            <div style={styles.contentArea}>
                {/* ===== Create 탭 ===== */}
                {activeTab === 'create' && (
                    <>
                        {/* (A) Preview Mode */}
                        {previewUrl ? (
                            <div style={styles.previewContainer}>
                                <img
                                    src={previewUrl}
                                    alt="Generated Preview"
                                    style={styles.previewImage}
                                />
                                <div style={styles.previewButtonRow}>
                                    <button onClick={handleApply} style={styles.buttonApply}>
                                        Apply to Canvas
                                    </button>
                                    <button onClick={handleRetry} style={styles.buttonRetry}>
                                        Retry
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* (B) Input Mode */
                            <div style={styles.formGroup}>
                                <textarea
                                    value={prompt}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                                    placeholder="Enter prompt"
                                    style={{ ...styles.textarea, flex: 1 }}
                                    disabled={loading || isEnhancing}
                                    rows={6}
                                />
                                <div style={{ flex: 0 }} />

                                <div style={{ display: 'flex', gap: '6px', width: '100%', alignItems: 'stretch' }}>
                                    <button
                                        onClick={onGenerate}
                                        style={{ ...styles.buttonPrimary, flex: 1, marginTop: 0, fontSize: '13px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                                        disabled={loading || isEnhancing}
                                    >
                                        {loading ? <Spinner variant="light" /> : 'Generate'}
                                    </button>
                                    <button
                                        onClick={handleEnhancePrompt}
                                        style={{ ...styles.buttonEnhance, fontSize: '13px', height: '36px', minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isEnhancing ? 0.7 : 1 }}
                                        disabled={isEnhancing || loading || !prompt}
                                    >
                                        {isEnhancing ? <Spinner /> : '✨ Enhance'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ===== Edit 탭 ===== */}
                {activeTab === 'edit' && (
                    <div style={styles.editPreviewContainer}>
                        {/* 이미지 프리뷰 영역: 이미지 있을 때만 표시 */}
                        {!uploadedImage ? (
                            <div style={styles.selectionZone}>
                                <span style={styles.selectionZoneText}>
                                    Select an image on the Figma canvas
                                </span>
                            </div>
                        ) : (
                            <div style={styles.editImageWrapper}>
                                <img
                                    src={uploadedImage}
                                    alt="Uploaded"
                                    style={styles.editImage}
                                />
                                <button
                                    onClick={handleClearImage}
                                    style={styles.editCloseButton}
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* 3D 회전 섹션 — 항상 표시 */}
                        <div style={{ width: '100%', marginTop: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                                🧊 3D 회전: {rotateAngle}°
                            </label>
                            <input
                                type="range"
                                min={-180}
                                max={180}
                                step={5}
                                value={rotateAngle}
                                onChange={(e) => setRotateAngle(Number(e.target.value))}
                                disabled={editLoading || !uploadedImage}
                                style={{ width: '100%', accentColor: '#000000', cursor: 'pointer' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999', marginTop: '2px' }}>
                                <span>-180°</span>
                                <span>0°</span>
                                <span>+180°</span>
                            </div>
                            <button
                                style={{ ...styles.editActionButton, width: '100%', marginTop: '6px', opacity: (editLoading || !uploadedImage) ? 0.5 : 1 }}
                                onClick={handleRotate}
                                disabled={editLoading || !uploadedImage}
                            >
                                {isRotating ? <Spinner /> : '🧊 회전 적용 (Rotate View)'}
                            </button>
                        </div>

                        {/* Upscale / Remove BG — 항상 표시 */}
                        <div style={styles.editActionRow}>
                            <button
                                style={{ ...styles.editActionButton, opacity: (editLoading || !uploadedImage) ? 0.5 : 1 }}
                                onClick={handleUpscale}
                                disabled={editLoading || !uploadedImage}
                            >
                                {isUpscaling ? <Spinner /> : '✨ Upscale'}
                            </button>
                            <button
                                style={{ ...styles.editActionButton, opacity: (editLoading || !uploadedImage) ? 0.5 : 1 }}
                                onClick={handleRemoveBG}
                                disabled={editLoading || !uploadedImage}
                            >
                                {isRemovingBG ? <Spinner /> : '✂️ Remove BG'}
                            </button>
                        </div>

                        {/* Refine 입력 영역 — 항상 표시 */}
                        <div style={{ width: '100%', marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                            <textarea
                                value={refinePrompt}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRefinePrompt(e.target.value)}
                                placeholder="수정할 내용 입력 (예: 파란색을 빨간색으로 변경)"
                                style={{
                                    ...styles.textarea,
                                    minHeight: '48px',
                                    fontSize: '12px',
                                    marginBottom: '6px',
                                }}
                                disabled={editLoading || !uploadedImage}
                                rows={2}
                            />
                            <button
                                style={{ ...styles.editActionButton, width: '100%', opacity: (editLoading || !refinePrompt || !uploadedImage) ? 0.5 : 1 }}
                                onClick={handleRefine}
                                disabled={editLoading || !refinePrompt || !uploadedImage}
                            >
                                {isRefining ? <Spinner /> : '🔄 수정하기 (Refine)'}
                            </button>
                        </div>

                        {/* Apply to Canvas — 항상 표시 */}
                        <button
                            style={{ ...styles.buttonPrimary, marginTop: '8px', opacity: (editLoading || !uploadedImage) ? 0.5 : 1 }}
                            onClick={handleEditApply}
                            disabled={editLoading || !uploadedImage}
                        >
                            Apply to Canvas
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('react-page');
    if (container) {
        const root = ReactDOM.createRoot(container);
        root.render(<App />);
    } else {
        console.error('Failed to find #react-page element');
    }
});
