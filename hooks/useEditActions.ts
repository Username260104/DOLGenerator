import * as React from 'react';
import { EDIT_MODEL_PATHS } from '../constants/config';
import { blobToDataUrl, dataUrlToPngBytes, fetchImageBlobFromProxy } from '../services/image';
import { applyImageToCanvas } from '../services/plugin';
import { callReplicateEditModel } from '../services/replicate';

export function useEditActions() {
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [isUpscaling, setIsUpscaling] = React.useState(false);
  const [isRemovingBG, setIsRemovingBG] = React.useState(false);
  const [isRefining, setIsRefining] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);
  const [refinePrompt, setRefinePrompt] = React.useState('');
  const [rotateAngle, setRotateAngle] = React.useState(0);

  const editLoading = isUpscaling || isRemovingBG || isRefining || isRotating;

  const handleClearImage = () => {
    setUploadedImage(null);
  };

  const handleEditApply = async () => {
    if (!uploadedImage) return;

    try {
      const bytes = await dataUrlToPngBytes(uploadedImage);
      applyImageToCanvas(bytes);
    } catch (error) {
      console.error('Apply 실패:', error);
      alert('캔버스에 이미지를 적용하지 못했습니다.');
    }
  };

  const applyResultImageFromUrl = async (resultUrl: string) => {
    const blob = await fetchImageBlobFromProxy(resultUrl);
    const dataUrl = await blobToDataUrl(blob);
    setUploadedImage(dataUrl);
  };

  const handleUpscale = async () => {
    if (!uploadedImage) return;
    setIsUpscaling(true);

    try {
      const resultUrl = await callReplicateEditModel(EDIT_MODEL_PATHS.upscale, {
        image: uploadedImage,
        scale: 2,
      });
      await applyResultImageFromUrl(resultUrl);
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
      const resultUrl = await callReplicateEditModel(EDIT_MODEL_PATHS.removeBackground, {
        image: uploadedImage,
      });
      await applyResultImageFromUrl(resultUrl);
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
      const resultUrl = await callReplicateEditModel(EDIT_MODEL_PATHS.refine, {
        input_image: uploadedImage,
        prompt: refinePrompt,
      });
      await applyResultImageFromUrl(resultUrl);
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

      const resultUrl = await callReplicateEditModel(EDIT_MODEL_PATHS.rotate, {
        image: [uploadedImage],
        prompt: rotatePrompt,
      });
      await applyResultImageFromUrl(resultUrl);
    } catch (error) {
      console.error('Rotate 실패:', error);
      alert('3D 회전에 실패했습니다. 콘솔을 확인해주세요.');
    } finally {
      setIsRotating(false);
    }
  };

  return {
    uploadedImage,
    setUploadedImage,
    isUpscaling,
    isRemovingBG,
    isRefining,
    isRotating,
    editLoading,
    refinePrompt,
    setRefinePrompt,
    rotateAngle,
    setRotateAngle,
    handleClearImage,
    handleEditApply,
    handleUpscale,
    handleRemoveBG,
    handleRefine,
    handleRotate,
  };
}
