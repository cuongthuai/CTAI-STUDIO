import React, { useState, useCallback, DragEvent, useRef } from 'react';
import { SourceImage } from '../types';
import { ImageIcon, TrashIcon, Spinner, LinkIcon, UploadIcon } from './icons';

interface StyleReferenceUploaderProps {
  onImageUpload: (image: SourceImage | null) => void;
  sourceImage: SourceImage | null;
  isAnalyzing?: boolean;
}

export const StyleReferenceUploader: React.FC<StyleReferenceUploaderProps> = ({ onImageUpload, sourceImage, isAnalyzing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onImageUpload({ base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImageUrlDrop = (imageUrl: string) => {
    const draggedImg = new Image();
    draggedImg.crossOrigin = "Anonymous";
    
    draggedImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = draggedImg.naturalWidth;
        canvas.height = draggedImg.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(draggedImg, 0, 0);
            try {
                const base64 = canvas.toDataURL();
                const mimeType = base64.substring(5, base64.indexOf(';'));
                onImageUpload({ base64, mimeType });
            } catch (e) {
                console.error("CORS Error:", e);
                alert("Không thể tải ảnh từ trang web khác do hạn chế bảo mật (CORS).");
            }
        }
    };
    
    draggedImg.onerror = () => {
        console.error("Failed to load dragged image from URL:", imageUrl);
        alert(`Không thể tải ảnh từ URL: ${imageUrl}`);
    };
    
    draggedImg.src = imageUrl;
  };

  const processDataTransfer = (dataTransfer: DataTransfer) => {
    // 1. Check for local files (or copied image data)
    if (dataTransfer.files && dataTransfer.files.length > 0) {
      const imageFile = Array.from(dataTransfer.files).find(f => f.type.startsWith('image/'));
      if (imageFile) {
        handleFileChange(imageFile);
        return;
      }
    }
    
    // 2. Check for pasted URL as plain text
    const plainText = dataTransfer.getData('text/plain');
    if (plainText && plainText.startsWith('http')) {
      try {
        const url = new URL(plainText);
        if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url.pathname)) {
            handleImageUrlDrop(plainText);
            return;
        }
      } catch (_) {
        // Not a valid URL, continue
      }
    }

    // 3. Check for dragged images from web (as HTML)
    const html = dataTransfer.getData('text/html');
    if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const img = doc.querySelector('img');
        if (img && img.src) {
            handleImageUrlDrop(img.src);
            return;
        }
    }

    // 4. Check for dragged link
    const uri = dataTransfer.getData('text/uri-list');
    if (uri && /\.(jpg|jpeg|png|gif|webp)$/i.test(uri)) {
        handleImageUrlDrop(uri);
        return;
    }
  };

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    processDataTransfer(e.dataTransfer);
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    processDataTransfer(e.clipboardData);
  };

  const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onImageUpload(null);
      if(inputRef.current) inputRef.current.value = "";
  }

  const dropzoneStyles = {...styles.dropzone};
  if (isDragging) Object.assign(dropzoneStyles, styles.dropzoneDragging);
  if (isFocused) Object.assign(dropzoneStyles, styles.dropzoneFocused);
  if (isAnalyzing) dropzoneStyles.cursor = 'wait';

  return (
    <div
      style={dropzoneStyles}
      onClick={() => !isAnalyzing && inputRef.current?.click()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      tabIndex={0}
      onPaste={handlePaste}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
        disabled={isAnalyzing}
      />
      {isAnalyzing && (
        <div style={styles.loadingOverlay}>
            <Spinner />
            <span style={{color: '#D1D5DB', marginTop: '0.5rem'}}>Đang phân tích...</span>
        </div>
      )}
      {isDragging && !isAnalyzing && sourceImage && (
        <div style={styles.replaceOverlay}>
            <UploadIcon style={{ width: 24, height: 24, color: '#FFFFFF' }} />
            <span style={{ marginTop: '0.5rem', color: '#FFFFFF', fontSize: '0.9rem' }}>Thả để thay thế</span>
        </div>
      )}
      {!isAnalyzing && sourceImage ? (
        <>
          <img src={sourceImage.base64} alt="Ảnh tham chiếu" style={styles.previewImage} />
          <button onClick={handleClear} style={styles.clearButton} title="Xóa ảnh tham chiếu">
            <TrashIcon style={{width: 16, height: 16}} />
          </button>
        </>
      ) : !isAnalyzing && (
        <div style={styles.placeholder}>
          <ImageIcon style={{width: 24, height: 24, color: '#6B7280'}}/>
          <span style={styles.placeholderText}>Kéo thả, dán, hoặc click</span>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  dropzone: {
    border: '2px dashed #4B5563',
    borderRadius: '0.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.3s, background-color 0.3s, box-shadow 0.3s',
    backgroundColor: '#374151',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    outline: 'none',
  },
  dropzoneDragging: { borderColor: '#3B82F6', backgroundColor: '#4B5563' },
  dropzoneFocused: {
    borderColor: '#3B82F6',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.4)',
  },
  previewImage: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
  },
  clearButton: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    zIndex: 10,
    background: 'rgba(55, 65, 81, 0.8)',
    border: '1px solid #4B5563',
    color: '#F9FAFB',
    padding: '0.25rem',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  placeholder: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
  },
  placeholderText: {
      color: '#9CA3AF',
      fontSize: '0.875rem'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
  replaceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderRadius: '0.5rem',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    pointerEvents: 'none',
  },
};