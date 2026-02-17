import type { CSSProperties } from 'react';

export interface CreateTabProps {
  previewUrl: string | null;
  prompt: string;
  loading: boolean;
  isEnhancing: boolean;
  onApply: () => void;
  onRetry: () => void;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onEnhance: () => void;
}

export interface EditTabProps {
  uploadedImage: string | null;
  rotateAngle: number;
  setRotateAngle: (value: number) => void;
  editLoading: boolean;
  isRotating: boolean;
  isUpscaling: boolean;
  isRemovingBG: boolean;
  isRefining: boolean;
  refinePrompt: string;
  setRefinePrompt: (value: string) => void;
  onClearImage: () => void;
  onRotate: () => void;
  onUpscale: () => void;
  onRemoveBG: () => void;
  onRefine: () => void;
  onApply: () => void;
}

export interface UiStyles {
  container: CSSProperties;
  title: CSSProperties;
  tabHeader: CSSProperties;
  tabButton: (isActive: boolean) => CSSProperties;
  contentArea: CSSProperties;
  formGroup: CSSProperties;
  label: CSSProperties;
  textarea: CSSProperties;
  inputWrapper: CSSProperties;
  buttonEnhance: CSSProperties;
  buttonPrimary: CSSProperties;
  buttonSecondary: CSSProperties;
  previewContainer: CSSProperties;
  previewImage: CSSProperties;
  previewButtonRow: CSSProperties;
  buttonApply: CSSProperties;
  buttonRetry: CSSProperties;
  selectionZone: CSSProperties;
  selectionZoneIcon: CSSProperties;
  selectionZoneText: CSSProperties;
  editPreviewContainer: CSSProperties;
  editImageWrapper: CSSProperties;
  editImage: CSSProperties;
  editCloseButton: CSSProperties;
  editActionRow: CSSProperties;
  editActionButton: CSSProperties;
}
