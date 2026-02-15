
// Figma 플러그인 UI 초기화. width/height는 플러그인 패널 크기.
figma.showUI(__html__, { width: 300, height: 400 });

// Edit 탭이 활성화된 동안만 캔버스 선택 변경을 감지하기 위한 플래그
let isEditTabActive = false;

// --- Base64 인코딩 헬퍼 (메인 스레드에 btoa 없음) ---
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64 = '';
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i);
    const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
    const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
    base64 += BASE64_CHARS[a >> 2];
    base64 += BASE64_CHARS[((a & 3) << 4) | (b >> 4)];
    base64 += i + 1 < binary.length ? BASE64_CHARS[((b & 15) << 2) | (c >> 6)] : '=';
    base64 += i + 2 < binary.length ? BASE64_CHARS[c & 63] : '=';
  }
  return base64;
}

// UI로부터 받은 메시지를 처리하는 메인 핸들러.
// 'edit-tab-active': Edit 탭 전환 시 선택 감지 on/off
// 'create-image': 생성/편집된 이미지를 Figma 캔버스에 삽입
// 'cancel': 플러그인 종료
figma.ui.onmessage = async (msg) => {

  // Edit 탭 활성/비활성 전환 시 선택 감지 플래그 업데이트
  if (msg.type === 'edit-tab-active') {
    isEditTabActive = msg.active;
    return;
  }

  // UI에서 전달받은 Uint8Array 이미지 데이터를 Figma 캔버스에 삽입
  if (msg.type === 'create-image') {
    try {
      if (!msg.data || msg.data.length === 0) {
        throw new Error("이미지 데이터(Uint8Array)가 비어있습니다.");
      }

      // figma.createImage로 이미지 에셋 생성 후 사각형에 채움
      const image = figma.createImage(msg.data);

      const rect = figma.createRectangle();
      rect.resize(1024, 1024);

      rect.fills = [
        {
          type: 'IMAGE',
          scaleMode: 'FILL',
          imageHash: image.hash,
        }
      ];

      // 뷰포트 중앙에 배치
      const { x, y, width, height } = figma.viewport.bounds;
      rect.x = x + width / 2 - 512;
      rect.y = y + height / 2 - 512;

      figma.currentPage.appendChild(rect);
      figma.currentPage.selection = [rect];
      figma.viewport.scrollAndZoomIntoView([rect]);

    } catch (error) {
      console.error("이미지 생성 실패:", error);
      figma.notify("이미지 생성에 실패했습니다. 콘솔을 확인해주세요.", { error: true });
    }
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Edit 탭이 활성화된 동안, 사용자가 캔버스에서 노드를 선택하면
// 해당 노드를 PNG로 추출하여 UI에 전달. Base64 DataURL 형식으로 전송.
figma.on('selectionchange', async () => {
  if (!isEditTabActive) return;

  const selection = figma.currentPage.selection;
  if (selection.length !== 1) return;

  const node = selection[0];

  try {
    const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } });

    // Figma 메인 스레드에는 btoa가 없으므로 커스텀 Base64 인코더 사용
    const base64 = uint8ToBase64(bytes);
    const dataUrl = 'data:image/png;base64,' + base64;
    figma.ui.postMessage({ type: 'selection-image', data: dataUrl });
  } catch (error) {
    console.error("노드 이미지 추출 실패:", error);
  }
});
