import { SERVER_URL } from '../constants/config';

export async function fetchImageBlobFromProxy(url: string): Promise<Blob> {
  const response = await fetch(`${SERVER_URL}/api/proxy-image?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }

  return response.blob();
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert blob to DataURL'));
    reader.readAsDataURL(blob);
  });
}

export async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function dataUrlToPngBytes(dataUrl: string): Promise<Uint8Array> {
  const image = new Image();
  image.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('이미지 로드 실패'));
    image.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context를 생성하지 못했습니다.');
  }

  context.drawImage(image, 0, 0);

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error('PNG 변환 실패'));
    }, 'image/png');
  });

  return blobToBytes(pngBlob);
}
