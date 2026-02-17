import * as React from 'react';
import { uiStyles } from '../constants/uiStyles';
import type { CreateTabProps } from '../types/ui';
import { Spinner } from './Spinner';

export function CreateTab({
  previewUrl,
  prompt,
  loading,
  isEnhancing,
  onApply,
  onRetry,
  onPromptChange,
  onGenerate,
  onEnhance,
}: CreateTabProps) {
  if (previewUrl) {
    return (
      <div style={uiStyles.previewContainer}>
        <img src={previewUrl} alt="Generated Preview" style={uiStyles.previewImage} />
        <div style={uiStyles.previewButtonRow}>
          <button onClick={onApply} style={uiStyles.buttonApply}>
            Apply to Canvas
          </button>
          <button onClick={onRetry} style={uiStyles.buttonRetry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={uiStyles.formGroup}>
      <textarea
        value={prompt}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onPromptChange(e.target.value)}
        placeholder="Enter prompt"
        style={{ ...uiStyles.textarea, flex: 1 }}
        disabled={loading || isEnhancing}
        rows={6}
      />
      <div style={{ flex: 0 }} />

      <div style={{ display: 'flex', gap: '6px', width: '100%', alignItems: 'stretch' }}>
        <button
          onClick={onGenerate}
          style={{
            ...uiStyles.buttonPrimary,
            flex: 1,
            marginTop: 0,
            fontSize: '13px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading || isEnhancing}
        >
          {loading ? <Spinner variant="light" /> : 'Generate'}
        </button>
        <button
          onClick={onEnhance}
          style={{
            ...uiStyles.buttonEnhance,
            fontSize: '13px',
            height: '36px',
            minWidth: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isEnhancing ? 0.7 : 1,
          }}
          disabled={isEnhancing || loading || !prompt}
        >
          {isEnhancing ? <Spinner /> : '✨ Enhance'}
        </button>
      </div>
    </div>
  );
}
