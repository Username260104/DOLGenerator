import * as React from 'react';
import { ENHANCER_SYSTEM_PROMPT } from '../constants/prompts';
import { enhancePromptWithGemini } from '../services/gemini';
import { blobToBytes, fetchImageBlobFromProxy } from '../services/image';
import { applyImageToCanvas } from '../services/plugin';
import { generateDolImage } from '../services/replicate';

export function useCreateActions() {
  const [prompt, setPrompt] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewData, setPreviewData] = React.useState<Uint8Array | null>(null);

  const handleEnhancePrompt = async () => {
    if (!prompt) return;
    setIsEnhancing(true);

    try {
      const enhancedText = await enhancePromptWithGemini(prompt, ENHANCER_SYSTEM_PROMPT);
      setPrompt(enhancedText);
    } catch (error) {
      console.error(error);
      alert('프롬프트 강화에 실패했습니다. 콘솔을 확인해주세요.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const onGenerate = async () => {
    if (!prompt) return;
    setLoading(true);

    try {
      const imageUrl = await generateDolImage(prompt);
      const imageBlob = await fetchImageBlobFromProxy(imageUrl);
      const uint8Array = await blobToBytes(imageBlob);
      const blobUrl = URL.createObjectURL(imageBlob);

      setPreviewUrl(blobUrl);
      setPreviewData(uint8Array);
    } catch (error) {
      console.error(error);
      alert('Failed to generate image. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!previewData) return;

    applyImageToCanvas(previewData);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewData(null);
  };

  const handleRetry = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewData(null);
  };

  return {
    prompt,
    setPrompt,
    loading,
    isEnhancing,
    previewUrl,
    handleEnhancePrompt,
    onGenerate,
    handleApply,
    handleRetry,
  };
}
