import * as React from 'react';
import { uiStyles } from '../constants/uiStyles';
import type { EditTabProps } from '../types/ui';
import { Spinner } from './Spinner';

export function EditTab({
  uploadedImage,
  rotateAngle,
  setRotateAngle,
  editLoading,
  isRotating,
  isUpscaling,
  isRemovingBG,
  isRefining,
  refinePrompt,
  setRefinePrompt,
  onClearImage,
  onRotate,
  onUpscale,
  onRemoveBG,
  onRefine,
  onApply,
}: EditTabProps) {
  return (
    <div style={uiStyles.editPreviewContainer}>
      {!uploadedImage ? (
        <div style={uiStyles.selectionZone}>
          <span style={uiStyles.selectionZoneText}>Select an image on the Figma canvas</span>
        </div>
      ) : (
        <div style={uiStyles.editImageWrapper}>
          <img src={uploadedImage} alt="Uploaded" style={uiStyles.editImage} />
          <button onClick={onClearImage} style={uiStyles.editCloseButton}>
            ✕
          </button>
        </div>
      )}

      <div
        style={{
          width: '100%',
          marginTop: '12px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#999',
            marginTop: '2px',
          }}
        >
          <span>-180°</span>
          <span>0°</span>
          <span>+180°</span>
        </div>
        <button
          style={{
            ...uiStyles.editActionButton,
            width: '100%',
            marginTop: '6px',
            opacity: editLoading || !uploadedImage ? 0.5 : 1,
          }}
          onClick={onRotate}
          disabled={editLoading || !uploadedImage}
        >
          {isRotating ? <Spinner /> : '🧊 회전 적용 (Rotate View)'}
        </button>
      </div>

      <div style={uiStyles.editActionRow}>
        <button
          style={{ ...uiStyles.editActionButton, opacity: editLoading || !uploadedImage ? 0.5 : 1 }}
          onClick={onUpscale}
          disabled={editLoading || !uploadedImage}
        >
          {isUpscaling ? <Spinner /> : '✨ Upscale'}
        </button>
        <button
          style={{ ...uiStyles.editActionButton, opacity: editLoading || !uploadedImage ? 0.5 : 1 }}
          onClick={onRemoveBG}
          disabled={editLoading || !uploadedImage}
        >
          {isRemovingBG ? <Spinner /> : '✂️ Remove BG'}
        </button>
      </div>

      <div style={{ width: '100%', marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
        <textarea
          value={refinePrompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRefinePrompt(e.target.value)}
          placeholder="수정할 내용 입력 (예: 파란색을 빨간색으로 변경)"
          style={{ ...uiStyles.textarea, minHeight: '48px', fontSize: '12px', marginBottom: '6px' }}
          disabled={editLoading || !uploadedImage}
          rows={2}
        />
        <button
          style={{
            ...uiStyles.editActionButton,
            width: '100%',
            opacity: editLoading || !refinePrompt || !uploadedImage ? 0.5 : 1,
          }}
          onClick={onRefine}
          disabled={editLoading || !refinePrompt || !uploadedImage}
        >
          {isRefining ? <Spinner /> : '🔄 수정하기 (Refine)'}
        </button>
      </div>

      <button
        style={{ ...uiStyles.buttonPrimary, marginTop: '8px', opacity: editLoading || !uploadedImage ? 0.5 : 1 }}
        onClick={onApply}
        disabled={editLoading || !uploadedImage}
      >
        Apply to Canvas
      </button>
    </div>
  );
}
