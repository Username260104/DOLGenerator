import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './ui.css';
import { CreateTab } from './components/CreateTab';
import { EditTab } from './components/EditTab';
import { uiStyles as styles } from './constants/uiStyles';
import { useCreateActions } from './hooks/useCreateActions';
import { useEditActions } from './hooks/useEditActions';
import { notifyEditTabActive, onSelectionImage } from './services/plugin';
import { ActiveTab } from './types/plugin';

function App() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('create');

  const {
    prompt,
    setPrompt,
    loading,
    isEnhancing,
    previewUrl,
    handleEnhancePrompt,
    onGenerate,
    handleApply,
    handleRetry,
  } = useCreateActions();

  const {
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
  } = useEditActions();

  React.useEffect(() => {
    return onSelectionImage((dataUrl) => {
      setUploadedImage(dataUrl);
    });
  }, [setUploadedImage]);

  React.useEffect(() => {
    notifyEditTabActive(activeTab === 'edit');
  }, [activeTab]);

  return (
    <div style={styles.container}>
      <div style={styles.tabHeader}>
        <button style={styles.tabButton(activeTab === 'create')} onClick={() => setActiveTab('create')}>
          Create
        </button>
        <button style={styles.tabButton(activeTab === 'edit')} onClick={() => setActiveTab('edit')}>
          Edit
        </button>
      </div>

      <div style={styles.contentArea}>
        {activeTab === 'create' && (
          <CreateTab
            previewUrl={previewUrl}
            prompt={prompt}
            loading={loading}
            isEnhancing={isEnhancing}
            onApply={handleApply}
            onRetry={handleRetry}
            onPromptChange={setPrompt}
            onGenerate={onGenerate}
            onEnhance={handleEnhancePrompt}
          />
        )}

        {activeTab === 'edit' && (
          <EditTab
            uploadedImage={uploadedImage}
            rotateAngle={rotateAngle}
            setRotateAngle={setRotateAngle}
            editLoading={editLoading}
            isRotating={isRotating}
            isUpscaling={isUpscaling}
            isRemovingBG={isRemovingBG}
            isRefining={isRefining}
            refinePrompt={refinePrompt}
            setRefinePrompt={setRefinePrompt}
            onClearImage={handleClearImage}
            onRotate={handleRotate}
            onUpscale={handleUpscale}
            onRemoveBG={handleRemoveBG}
            onRefine={handleRefine}
            onApply={handleEditApply}
          />
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
