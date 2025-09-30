
import React, { useState, useCallback, useEffect } from 'react';
import { SourceImage, Path, HistoryEntry } from '../types';
import { ImageEditor } from './ImageUploader';
import { Slider } from '../Slider';
// FIX: The imported component is named Sparkles, not SparklesIcon. The usage has been updated accordingly.
import { SaveIcon, Sparkles, CameraIcon, Spinner } from './icons';
import { suggestPrompt, analyzeImageStyle } from '../services/geminiService';
import { InpaintEditorModal } from './InpaintEditorModal';
import { NumberStepper } from './NumberStepper';
import { StyleReferenceUploader } from './StyleReferenceUploader';

interface InpaintModeViewProps {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
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

export const InpaintModeView: React.FC<InpaintModeViewProps> = ({
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
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
  const [styleReferenceImage, setStyleReferenceImage] = useState<SourceImage | null>(null);
  const [styleInfluence, setStyleInfluence] = useState<number>(75);
  const [maskPaths, setMaskPaths] = useState<Path[]>([]);
  const [mask, setMask] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [sourceImageDimensions, setSourceImageDimensions] = useState<string | null>(null);
  
  const [creativityInputChanged, setCreativityInputChanged] = useState(false);
  const [styleInfluenceInputChanged, setStyleInfluenceInputChanged] = useState(false);

  useEffect(() => {
    if (creativityInputChanged) {
        const timer = setTimeout(() => setCreativityInputChanged(false), 500);
        return () => clearTimeout(timer);
    }
  }, [creativityInputChanged]);

  useEffect(() => {
    if (styleInfluenceInputChanged) {
        const timer = setTimeout(() => setStyleInfluenceInputChanged(false), 500);
        return () => clearTimeout(timer);
    }
  }, [styleInfluenceInputChanged]);

  useEffect(() => {
    if (itemToRestore && itemToRestore.mode === 'inpaint') {
      const newSource: SourceImage = {
        base64: itemToRestore.image,
        mimeType: itemToRestore.image.substring(5, itemToRestore.image.indexOf(';')),
      };
      setSourceImage(newSource);
      setStyleReferenceImage(itemToRestore.styleReference || null);
      setStyleInfluence(itemToRestore.styleInfluence ?? 75);
      setMaskPaths([]);
      setMask(null);
      onItemRestored();
    }
  }, [itemToRestore, onItemRestored]);

  useEffect(() => {
    if (sourceImage) {
        const img = new Image();
        img.onload = () => {
            setSourceImageDimensions(`${img.naturalWidth} x ${img.naturalHeight}`);
        };
        img.src = sourceImage.base64;
    } else {
        setSourceImageDimensions(null);
    }
  }, [sourceImage]);


  const handleImageUpload = (image: SourceImage) => {
    setSourceImage(image);
    setMaskPaths([]);
    setMask(null);
  };

  const handleClearImage = () => {
    setSourceImage(null);
    setStyleReferenceImage(null);
    setMaskPaths([]);
    setMask(null);
    setPrompt('');
  };

  const handleSaveFromModal = (data: { paths: Path[]; mask: string | null; }) => {
      setMaskPaths(data.paths);
      setMask(data.mask);
      setIsEditorOpen(false);
  };

  const handleStyleReferenceUpload = useCallback(async (image: SourceImage | null) => {
    setStyleReferenceImage(image);
    if (image) {
        setIsAnalyzingStyle(true);
        try {
            const stylePrompt = await analyzeImageStyle(image.base64, image.mimeType);
            setPrompt(prev => {
                const withoutOldStyle = prev.replace(/^Phong cách: .*?\.\s*/, '');
                return `Phong cách: ${stylePrompt}. ${withoutOldStyle}`;
            });
        } catch (error) {
            console.error("Failed to analyze style reference image:", error);
        } finally {
            setIsAnalyzingStyle(false);
        }
    } else {
        setPrompt(prev => prev.replace(/^Phong cách: .*?\.\s*/, ''));
    }
  }, [setPrompt]);

  const handleSuggestClick = useCallback(async () => {
    if (!sourceImage) return;
    setIsSuggesting(true);
    try {
        const context = mask 
            ? "The user has masked a part of this image to replace it. Suggest a creative idea to fill the masked area."
            : "The user wants to transform this entire image. Suggest a creative prompt for a new photorealistic scene based on the input.";
      const suggestion = await suggestPrompt(sourceImage.base64, sourceImage.mimeType, context);
      setPrompt(suggestion);
    } catch (error) {
      console.error("Failed to get prompt suggestion:", error);
    } finally {
      setIsSuggesting(false);
    }
  }, [sourceImage, mask, setPrompt]);
  
  const handleCreativityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreativity(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)));
    setCreativityInputChanged(true);
  };

  const handleStyleInfluenceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStyleInfluence(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)));
    setStyleInfluenceInputChanged(true);
  };

  const isGenerateButtonDisabled = isLoading || !sourceImage;

  return (
    <>
      {sourceImage && (
          <InpaintEditorModal 
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            onSave={handleSaveFromModal}
            initialSourceImage={sourceImage}
            initialPaths={maskPaths}
          />
      )}
      <div style={styles.controlGroup}>
        <label style={styles.label} htmlFor="image-upload">1.Tải ảnh lên</label>
        <div style={styles.compositeControlGroup}>
            {sourceImage ? (
            <div style={styles.previewContainer}>
                    <div style={styles.imageWrapper}>
                        <img src={sourceImage.base64} alt="Ảnh gốc xem trước" style={styles.previewImage} />
                        {mask && <img src={mask} alt="Mask preview" style={{...styles.previewImage, ...styles.maskOverlay}} />}
                        {sourceImageDimensions && (
                            <span style={styles.dimensionBadge}>{sourceImageDimensions}</span>
                        )}
                    </div>
                    <div style={styles.previewActions}>
                        <button onClick={handleClearImage} style={{...styles.previewActionButton, ...styles.previewActionDeleteButton}}>Xóa</button>
                        <button onClick={() => setIsEditorOpen(true)} style={styles.previewActionButton}>Mở Trình Chỉnh Sửa & Vẽ</button>
                    </div>
                </div>
            ) : (
                <ImageEditor 
                    onImageUpload={handleImageUpload} 
                    sourceImage={null} 
                    onMaskChange={() => {}}
                    onClearImage={() => {}}
                />
            )}
             {sourceImage && (
                <>
                     <div style={{...styles.subControlGroup, borderTop: '1px solid #4B5563', paddingTop: '1rem'}}>
                        <div style={styles.creativityHeader}>
                        <label id="creativity-label" htmlFor="creativity-input" style={{...styles.label, fontSize: '1rem'}}>
                            Mức độ sáng tạo
                        </label>
                        <input
                            id="creativity-input"
                            type="number"
                            min="0"
                            max="100"
                            value={creativity}
                            onChange={handleCreativityInputChange}
                            style={{...styles.creativityInput, boxShadow: creativityInputChanged ? '0 0 0 2px #F97316' : 'none' }}
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
                </>
            )}
        </div>
      </div>

      <div style={styles.controlGroup}>
        <label style={styles.label}>2. Ảnh tham chiếu (Style)</label>
        <p style={styles.description}>
          Sử dụng ảnh tham chiếu chỉ như một nguồn cảm hứng phong cách. AI sẽ tự động phân tích và tạo prompt mô tả phong cách cho bạn.
        </p>
        <StyleReferenceUploader 
          sourceImage={styleReferenceImage}
          onImageUpload={handleStyleReferenceUpload}
          isAnalyzing={isAnalyzingStyle}
        />
        {styleReferenceImage && (
          <div style={styles.styleInfluenceContainer}>
            <div style={styles.creativityHeader}>
                <label id="style-influence-label" htmlFor="style-influence-input" style={{...styles.label, fontSize: '1rem'}}>
                    Mức độ ảnh hưởng
                </label>
                <input
                    id="style-influence-input"
                    type="number"
                    min="0"
                    max="100"
                    value={styleInfluence}
                    onChange={handleStyleInfluenceInputChange}
                    style={{...styles.creativityInput, boxShadow: styleInfluenceInputChanged ? '0 0 0 2px #F97316' : 'none' }}
                    aria-label="Mức độ ảnh hưởng"
                />
            </div>
            <Slider
              id="style-influence"
              min="0"
              max="100"
              value={styleInfluence}
              onChange={(e) => setStyleInfluence(Number(e.target.value))}
              aria-labelledby="style-influence-label"
            />
            <div style={styles.sliderLabels}>
              <span>Giữ lại phong cách gốc</span>
              <span>Áp dụng phong cách mới</span>
            </div>
          </div>
        )}
      </div>
      
      <div style={styles.controlGroup}>
        <label htmlFor="prompt" style={styles.label}>
          3. {mask ? 'Mô tả thay đổi cho vùng chọn' : 'Ghi chú (Prompt)'}
        </label>
        <div style={{ position: 'relative' }}>
          <textarea
            id="prompt"
            style={styles.textarea}
            placeholder={
              mask ? "ví dụ: một chiếc xe hơi màu đỏ" : "ví dụ: ánh sáng buổi sáng 10h, màu sắc ấm, không có cây cột điện..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div style={styles.promptActions}>
            <button
              style={styles.promptActionButton}
              onClick={handleSuggestClick}
              title={isSuggesting ? "AI đang phân tích..." : "Gợi ý prompt"}
              disabled={isSuggesting || !sourceImage}
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
          label={`4. Số lượng ảnh`}
          value={numberOfImages}
          onChange={setNumberOfImages}
          min={1}
          max={4}
        />
      </div>

      <button 
        style={isGenerateButtonDisabled ? {...styles.button, ...styles.buttonDisabled} : styles.button}
        onClick={() => sourceImage && onGenerate(sourceImage, sourceImage, mask, { 
            maskPathsForHistory: maskPaths,
            styleReferenceForHistory: styleReferenceImage,
            styleInfluenceForHistory: styleInfluence,
        })}
        disabled={isGenerateButtonDisabled}
      >
        {isLoading ? 'Đang xử lý...' : (
          <>
            <CameraIcon />
            Tạo Ảnh
          </>
        )}
      </button>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    controlGroup: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    compositeControlGroup: { display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #4B5563', borderRadius: '0.75rem', padding: '1rem', backgroundColor: 'rgba(55, 65, 81, 0.3)' },
    subControlGroup: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    label: { fontSize: '1.1rem', fontWeight: 500, color: '#D1D5DB' },
    description: {
        fontSize: '0.875rem',
        color: '#9CA3AF',
        margin: '-0.25rem 0 0.25rem 0',
        fontStyle: 'italic',
        lineHeight: 1.5,
    },
    creativityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    creativityInput: { backgroundColor: '#374151', border: '1px solid #4B5563', borderRadius: '0.5rem', color: '#F9FAFB', fontFamily: 'inherit', fontSize: '1rem', width: '70px', padding: '0.5rem', textAlign: 'center', WebkitAppearance: 'none', margin: 0, MozAppearance: 'textfield' as const, transition: 'box-shadow 0.2s ease-in-out' },
    sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#9CA3AF' },
    textarea: { backgroundColor: '#374151', border: '1px solid #4B5563', borderRadius: '0.5rem', padding: '0.75rem 5rem 0.75rem 0.75rem', color: '#F9FAFB', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
    promptActions: { position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' },
    promptActionButton: { background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px' },
    button: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: '#F97316', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.3s ease', flexShrink: 0 },
    buttonDisabled: { backgroundColor: '#4B5563', cursor: 'not-allowed', opacity: 0.7 },
    styleInfluenceContainer: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem',
        backgroundColor: 'rgba(55, 65, 81, 0.3)',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginTop: '0.5rem',
    },
    errorText: { color: '#F87171', fontSize: '0.875rem', marginTop: '0.25rem' },
    previewContainer: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    imageWrapper: { position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: '#1F2937' },
    previewImage: { display: 'block', width: '100%', height: '100%', objectFit: 'contain' },
    maskOverlay: { position: 'absolute', top: 0, left: 0, opacity: 0.7, pointerEvents: 'none' },
    previewActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' },
    previewActionButton: { padding: '0.5rem 1rem', backgroundColor: '#4B5563', color: '#FFFFFF', border: '1px solid #6B7280', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.3s ease' },
    previewActionDeleteButton: { backgroundColor: 'transparent', borderColor: '#EF4444', color: '#F87171' },
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
    aspectRatioSelector: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    aspectRatioButton: {
        flex: '1 1 auto',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#D1D5DB',
        backgroundColor: '#4B5563',
        border: '1px solid #6B7280',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
    },
    aspectRatioButtonActive: {
        backgroundColor: '#F97316',
        color: '#FFFFFF',
        borderColor: '#F97316',
    }
};
