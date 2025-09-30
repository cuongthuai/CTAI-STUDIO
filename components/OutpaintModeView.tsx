
import React, { useState, useCallback, useEffect } from 'react';
import { SourceImage, HistoryEntry } from '../types';
import { Slider } from '../Slider';
// FIX: The imported component is named Sparkles, not SparklesIcon. The usage has been updated accordingly.
import { SaveIcon, Sparkles, CameraIcon, Spinner, ExpandIcon } from './icons';
import { suggestPrompt } from '../services/geminiService';
import { OutpaintEditorModal } from './OutpaintEditorModal';
import { NumberStepper } from './NumberStepper';

interface OutpaintModeViewProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  creativity: number;
  setCreativity: (creativity: number) => void;
  isLoading: boolean;
  onGenerate: (sourceForGen: SourceImage, originalSource: SourceImage, maskForGen: string | null, options: any) => void;
  handleSavePrompt: () => void;
  itemToRestore: HistoryEntry | null;
  onItemRestored: () => void;
  numberOfImages: number;
  setNumberOfImages: (n: number) => void;
}

interface OutpaintSetup {
    sourceForGen: SourceImage;
    maskForGen: string;
    frame: { x: number, y: number, width: number, height: number };
    imagePos: { x: number, y: number, width: number, height: number };
}

export const OutpaintModeView: React.FC<OutpaintModeViewProps> = ({
  prompt,
  setPrompt,
  creativity,
  setCreativity,
  isLoading,
  onGenerate,
  handleSavePrompt,
  itemToRestore,
  onItemRestored,
  numberOfImages,
  setNumberOfImages,
}) => {
  const [originalImage, setOriginalImage] = useState<SourceImage | null>(null);
  const [outpaintSetup, setOutpaintSetup] = useState<OutpaintSetup | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [previewAspectRatio, setPreviewAspectRatio] = useState('16 / 9');
  
  useEffect(() => {
    if (itemToRestore && itemToRestore.mode === 'outpaint') {
      setOriginalImage(itemToRestore.source);
      // We don't automatically restore the outpaint setup as it's complex,
      // but we load the original image, allowing the user to start a new outpaint from it.
      setOutpaintSetup(null); 
      onItemRestored();
    }
  }, [itemToRestore, onItemRestored]);

  useEffect(() => {
    if (outpaintSetup) {
        const img = new Image();
        img.onload = () => {
            if (img.height > 0) {
                setPreviewAspectRatio(`${img.width} / ${img.height}`);
            }
        };
        img.src = outpaintSetup.sourceForGen.base64;
    } else {
        setPreviewAspectRatio('16 / 9');
    }
  }, [outpaintSetup]);

  const handleClear = () => {
    setOriginalImage(null);
    setOutpaintSetup(null);
  };
  
  const handleSaveFromModal = (data: OutpaintSetup & { original: SourceImage }) => {
    setOriginalImage(data.original);
    setOutpaintSetup(data);
    setIsEditorOpen(false);
  };

  const handleSuggestClick = useCallback(async () => {
    if (!outpaintSetup) return;
    setIsSuggesting(true);
    try {
      const context = "This is an image that needs to be extended into the surrounding empty space. Suggest a creative prompt to fill the void and create a larger, cohesive scene.";
      const suggestion = await suggestPrompt(outpaintSetup.sourceForGen.base64, outpaintSetup.sourceForGen.mimeType, context);
      setPrompt(suggestion);
    } catch (error) {
      console.error("Failed to get prompt suggestion:", error);
    } finally {
      setIsSuggesting(false);
    }
  }, [outpaintSetup, setPrompt]);
  
  const isGenerateButtonDisabled = isLoading || !outpaintSetup || !originalImage;

  const handleGenerate = () => {
    if (outpaintSetup && originalImage) {
      onGenerate(outpaintSetup.sourceForGen, originalImage, outpaintSetup.maskForGen, {
        outpaintFrameForHistory: outpaintSetup.frame,
        originalImagePositionForHistory: outpaintSetup.imagePos,
      });
    }
  };

  return (
    <>
      <OutpaintEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveFromModal}
        initialImage={originalImage}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={styles.controlGroup}>
          <label style={styles.label}>1. Bố cục mở rộng</label>
          {outpaintSetup ? (
              <div style={{...styles.previewContainer, aspectRatio: previewAspectRatio}}>
                  <div style={styles.previewOverlay}></div>
                  <img 
                      src={outpaintSetup.sourceForGen.base64} 
                      alt="Bố cục mở rộng" 
                      style={styles.previewImage}
                      onClick={() => setIsEditorOpen(true)}
                      title="Nhấn để chỉnh sửa lại"
                  />
                  <div style={styles.previewActions}>
                      <button onClick={() => setIsEditorOpen(true)} style={styles.previewActionButton}>Chỉnh sửa</button>
                      <button onClick={handleClear} style={{...styles.previewActionButton, ...styles.previewActionDeleteButton}}>Xóa</button>
                  </div>
              </div>
          ) : (
              <button 
                  onClick={() => setIsEditorOpen(true)} 
                  style={styles.openEditorButton}
              >
                  <ExpandIcon />
                  Mở Trình Mở Rộng Ảnh
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
            <span>Ít sáng tạo</span>
            <span>Sáng tạo nhiều</span>
          </div>
        </div>
        
        <div style={styles.controlGroup}>
          <label htmlFor="prompt" style={styles.label}>3. Mô tả cho vùng mở rộng</label>
          <div style={{ position: 'relative' }}>
            <textarea
              id="prompt"
              style={styles.textarea}
              placeholder="ví dụ: một bãi biển rộng lớn với bầu trời hoàng hôn, kéo dài ngọn núi về phía bên trái..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div style={styles.promptActions}>
              <button
                  style={styles.promptActionButton}
                  onClick={handleSuggestClick}
                  title={isSuggesting ? "AI đang phân tích..." : "Gợi ý prompt"}
                  disabled={isSuggesting || !outpaintSetup}
              >
                  {isSuggesting ? <Spinner /> : <Sparkles />}
              </button>
              <button
                style={styles.promptActionButton}
                onClick={handleSavePrompt}
                title="Lưu prompt vào thư viện"
                disabled={!prompt.trim()}
              >
                <SaveIcon />
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
              Mở rộng ảnh
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
    openEditorButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: '#4B5563', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.3s ease' },
    previewContainer: { position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #4B5563', backgroundColor: '#111827' },
    previewImage: { position: 'relative', zIndex: 1, display: 'block', width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' },
    previewOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.5)', zIndex: 0 },
    previewActions: { position: 'absolute', bottom: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem', zIndex: 2 },
    previewActionButton: { padding: '0.5rem 1rem', backgroundColor: 'rgba(31, 41, 55, 0.8)', color: '#FFFFFF', border: '1px solid #4B5563', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.3s ease', backdropFilter: 'blur(4px)' },
    previewActionDeleteButton: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444', color: '#F87171' },
    creativityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    creativityInput: { backgroundColor: '#374151', border: '1px solid #4B5563', borderRadius: '0.5rem', color: '#F9FAFB', fontFamily: 'inherit', fontSize: '1rem', width: '70px', padding: '0.5rem', textAlign: 'center', WebkitAppearance: 'none', margin: 0, MozAppearance: 'textfield' as const },
    sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#9CA3AF' },
    textarea: { backgroundColor: '#374151', border: '1px solid #4B5563', borderRadius: '0.5rem', padding: '0.75rem 5rem 0.75rem 0.75rem', color: '#F9FAFB', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
    promptActions: { position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' },
    promptActionButton: { background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px' },
    button: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: '#F97316', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.3s ease', flexShrink: 0 },
    buttonDisabled: { backgroundColor: '#4B5563', cursor: 'not-allowed' },
};
