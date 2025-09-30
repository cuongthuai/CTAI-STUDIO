import React, { useState, useCallback, useEffect } from 'react';
import { SourceImage, Corners, HistoryEntry } from '../types';
import { Slider } from './Slider';
// FIX: The imported component is named Sparkles, not SparklesIcon. The usage has been updated accordingly.
import { SaveIcon, SparklesIcon as Sparkles, CameraIcon, Spinner, LibraryIcon } from './components/icons';
import { suggestPrompt } from '../services/geminiService';
import { ImageBlendingModal } from './components/ImageBlendingModal';
import { NumberStepper } from './components/NumberStepper';

interface BlendingModeViewProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  creativity: number;
  setCreativity: (creativity: number) => void;
  isLoading: boolean;
  generatedImage: string | null;
  onGenerate: (sourceForGen: SourceImage, originalSource: SourceImage, maskForGen: string | null, options: any) => void;
  itemToRestore: HistoryEntry | null;
  onItemRestored: () => void;
  numberOfImages: number;
  setNumberOfImages: (n: number) => void;
  onSavePrompt: () => void;
  onOpenLibrary: () => void;
}

export const BlendingModeView: React.FC<BlendingModeViewProps> = ({
  prompt,
  setPrompt,
  creativity,
  setCreativity,
  isLoading,
  generatedImage,
  onGenerate,
  itemToRestore,
  onItemRestored,
  numberOfImages,
  setNumberOfImages,
  onSavePrompt,
  onOpenLibrary,
}) => {
  const [backgroundImage, setBackgroundImage] = useState<SourceImage | null>(null);
  const [designImage, setDesignImage] = useState<SourceImage | null>(null);
  const [designImageCorners, setDesignImageCorners] = useState<Corners | null>(null);
  const [composedImageForBlending, setComposedImageForBlending] = useState<SourceImage | null>(null);
  const [isBlendingEditorOpen, setIsBlendingEditorOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [composedImageDimensions, setComposedImageDimensions] = useState<string | null>(null);

  useEffect(() => {
    if (itemToRestore && itemToRestore.mode === 'blending') {
      // Use the generated image as the new background for a new composition
      const newBackground: SourceImage = {
        base64: itemToRestore.image,
        mimeType: itemToRestore.image.substring(5, itemToRestore.image.indexOf(';')),
      };
      setBackgroundImage(newBackground);
      setComposedImageForBlending(newBackground); // The initial composite is the background itself

      // Clear the rest of the old blending setup
      setDesignImage(null);
      setDesignImageCorners(null);

      onItemRestored();
    }
  }, [itemToRestore, onItemRestored]);
  
  useEffect(() => {
    if (composedImageForBlending) {
        const img = new Image();
        img.onload = () => {
            setComposedImageDimensions(`${img.naturalWidth} x ${img.naturalHeight}`);
        };
        img.src = `data:${composedImageForBlending.mimeType};base64,${composedImageForBlending.base64}`;
    } else {
        setComposedImageDimensions(null);
    }
  }, [composedImageForBlending]);
  
  const handleClearBlendingImages = () => {
    setBackgroundImage(null);
    setDesignImage(null);
    setDesignImageCorners(null);
    setComposedImageForBlending(null);
  };

  const handleSaveFromBlendingModal = (data: {
    background: SourceImage | null;
    design: SourceImage | null;
    composite: SourceImage | null;
    corners: Corners | null;
  }) => {
      setBackgroundImage(data.background);
      setDesignImage(data.design);
      setComposedImageForBlending(data.composite);
      setDesignImageCorners(data.corners);
      setIsBlendingEditorOpen(false);
  };

  const handleSuggestClick = useCallback(async () => {
    if (!composedImageForBlending) return;
    setIsSuggesting(true);
    try {
      const context = "This is a composite image. Suggest a creative prompt for blending the elements together seamlessly with an artistic touch.";
      const suggestion = await suggestPrompt(composedImageForBlending.base64, composedImageForBlending.mimeType, context);
      setPrompt(suggestion);
    } catch (error) {
      console.error("Failed to get prompt suggestion:", error);
    } finally {
      setIsSuggesting(false);
    }
  }, [composedImageForBlending, setPrompt]);
  
  const isGenerateButtonDisabled = isLoading || !composedImageForBlending;

  const handleGenerate = () => {
    if (composedImageForBlending && backgroundImage) {
      onGenerate(composedImageForBlending, backgroundImage, null, {
        blendBackgroundForHistory: backgroundImage,
        blendDesignForHistory: designImage,
        blendCornersForHistory: designImageCorners,
      });
    }
  };

  return (
    <>
      <ImageBlendingModal
        isOpen={isBlendingEditorOpen}
        onClose={() => setIsBlendingEditorOpen(false)}
        onSave={handleSaveFromBlendingModal}
        initialBackground={backgroundImage}
        initialDesign={designImage}
        initialCorners={designImageCorners}
        generatedImage={generatedImage}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={styles.controlGroup}>
          <label style={styles.label}>1. Bố cục ảnh ghép</label>
          {composedImageForBlending ? (
              <div style={styles.blendingPreviewContainer}>
                  <img 
                      src={`data:${composedImageForBlending.mimeType};base64,${composedImageForBlending.base64}`}
                      alt="Bố cục ảnh ghép" 
                      style={styles.blendingPreviewImage}
                      onClick={() => setIsBlendingEditorOpen(true)}
                      title="Nhấn để chỉnh sửa lại"
                  />
                  {composedImageDimensions && (
                      <span style={styles.dimensionBadge}>{composedImageDimensions}</span>
                  )}
                  <div style={styles.blendingPreviewActions}>
                      <button onClick={() => setIsBlendingEditorOpen(true)} style={styles.previewActionButton}>Chỉnh sửa</button>
                      <button onClick={handleClearBlendingImages} style={{...styles.previewActionButton, ...styles.previewActionDeleteButton}}>Xóa</button>
                  </div>
              </div>
          ) : (
              <button 
                  onClick={() => setIsBlendingEditorOpen(true)} 
                  style={styles.openEditorButton}
              >
                  Mở Trình Chỉnh Sửa Ghép Ảnh
              </button>
          )}
        </div>

        <div style={styles.controlGroup}>
          <div style={styles.creativityHeader}>
            <label id="creativity-label" htmlFor="creativity" style={styles.label}>
              2. Mức độ sáng tạo
            </label>
            <input
              id="creativity-input"
              type="number"
              min="0"
              max="100"
              value={creativity}
              onChange={(e) => setCreativity(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))}
              style={styles.creativityInput}
              aria-label="Mức độ sáng tạo"
            />
          </div>
          <Slider
            id="creativity"
            min="0"
            max="100"
            value={creativity}
            onChange={(e) => setCreativity(Number(e.target.value))}
            aria-labelledby="creativity-label"
          />
          <div style={styles.sliderLabels}>
            <span>Chỉnh sửa tối thiểu</span>
            <span>Sáng tạo nghệ thuật</span>
          </div>
        </div>
        
        <div style={styles.controlGroup}>
          <label htmlFor="prompt" style={styles.label}>3. Mô tả cách ghép ảnh</label>
          <div style={{ position: 'relative' }}>
            <textarea
              id="prompt"
              style={styles.textarea}
              placeholder="ví dụ: ghép tòa nhà vào nền, tạo bóng đổ theo hướng nắng chiều..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div style={styles.promptActions}>
              <button style={styles.promptActionButton} onClick={onOpenLibrary} title="Mở thư viện prompt"><LibraryIcon /></button>
              <button style={styles.promptActionButton} onClick={onSavePrompt} title="Lưu prompt" disabled={!prompt.trim()}><SaveIcon /></button>
              <button
                  style={styles.promptActionButton}
                  onClick={handleSuggestClick}
                  title={isSuggesting ? "AI đang phân tích..." : "Gợi ý prompt"}
                  disabled={isSuggesting || !composedImageForBlending}
              >
                  {isSuggesting ? <Spinner /> : <Sparkles />}
              </button>
            </div>
          </div>
        </div>
        
        <div style={styles.controlGroup}>
          <NumberStepper
            label="4. Số lượng ảnh"
            value={numberOfImages}
            onChange={setNumberOfImages}
            min={1}
            max={4}
          />
        </div>

        <button 
          style={isGenerateButtonDisabled ? {...styles.button, ...styles.buttonDisabled} : styles.button}
          onClick={handleGenerate}
          disabled={isGenerateButtonDisabled}
        >
          {isLoading ? 'Đang xử lý...' : (
            <>
              <CameraIcon />
              Ghép ảnh
            </>
          )}
        </button>
      </div>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    controlGroup: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    label: { fontSize: '1.1rem', fontWeight: 500, color: '#D1D5DB' },
    openEditorButton: { padding: '0.75rem 1.5rem', backgroundColor: '#4B5563', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.3s ease' },
    blendingPreviewContainer: { position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #4B5563' },
    blendingPreviewImage: { display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', cursor: 'pointer', backgroundColor: '#374151' },
    blendingPreviewActions: { position: 'absolute', bottom: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem' },
    previewActionButton: { padding: '0.5rem 1rem', backgroundColor: 'rgba(31, 41, 55, 0.8)', color: '#FFFFFF', border: '1px solid #4B5563', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.3s ease', backdropFilter: 'blur(4px)' },
    previewActionDeleteButton: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444', color: '#F87171' },
    creativityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    creativityInput: { backgroundColor: '#374151', border: '1px solid #4B5563', borderRadius: '0.5rem', color: '#F9FAFB', fontFamily: 'inherit', fontSize: '1rem', width: '70px', padding: '0.5rem', textAlign: 'center', WebkitAppearance: 'none', margin: 0, MozAppearance: 'textfield' as const },
    sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#9CA3AF' },
    textarea: { backgroundColor: '#374151', border: '1px solid #4B5563', borderRadius: '0.5rem', padding: '0.75rem 7rem 0.75rem 0.75rem', color: '#F9FAFB', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
    promptActions: { position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' },
    promptActionButton: { background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px' },
    button: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: '#F97316', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.3s ease', flexShrink: 0 },
    buttonDisabled: { backgroundColor: '#4B5563', cursor: 'not-allowed' },
    dimensionBadge: {
        position: 'absolute',
        bottom: '0.5rem',
        left: '0.5rem',
        backgroundColor: 'rgba(17, 24, 39, 0.7)',
        color: '#D1D5DB',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        zIndex: 1,
    },
    styleRefContainer: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    analyzeButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', backgroundColor: '#4B5563', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.3s ease' },
    errorText: { color: '#F87171', fontSize: '0.875rem', marginTop: '0.25rem' },
};