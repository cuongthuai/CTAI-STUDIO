
import React, { useState, useEffect } from 'react';
import { SourceImage, Corners } from '../types';
import { ImageBlendingEditor } from './ImageBlendingEditor';

interface ImageBlendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    background: SourceImage | null;
    design: SourceImage | null;
    composite: SourceImage | null;
    corners: Corners | null;
  }) => void;
  initialBackground: SourceImage | null;
  initialDesign: SourceImage | null;
  initialCorners: Corners | null;
  generatedImage: string | null;
}

export const ImageBlendingModal: React.FC<ImageBlendingModalProps> = ({
  isOpen, onClose, onSave, initialBackground, initialDesign, initialCorners, generatedImage
}) => {
  const [background, setBackground] = useState<SourceImage | null>(null);
  const [design, setDesign] = useState<SourceImage | null>(null);
  const [composite, setComposite] = useState<SourceImage | null>(null);
  const [corners, setCorners] = useState<Corners | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBackground(initialBackground);
      setDesign(initialDesign);
      setCorners(initialCorners);
    }
  }, [isOpen, initialBackground, initialDesign, initialCorners]);

  const handleSave = () => {
    onSave({ background, design, composite, corners });
  };

  const handleDesignChange = (newDesign: SourceImage | null) => {
    setDesign(newDesign);
    // When the user uploads a new design or clears the existing one,
    // we reset the corners to null. This signals the editor to
    // either remove the transform handles or create a new default transform.
    setCorners(null);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  if (!isOpen) {
    return null;
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.modalContent}>
        <header style={styles.header}>
            <h2 style={styles.title}>Trình Chỉnh Sửa Ghép Ảnh</h2>
            <div style={styles.actions}>
                <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Hủy</button>
                <button onClick={handleSave} style={{...styles.button, ...styles.saveButton}}>Lưu và Đóng</button>
            </div>
        </header>
        <main style={styles.editorWrapper}>
            <ImageBlendingEditor
                background={background}
                design={design}
                onBackgroundChange={setBackground}
                onDesignChange={handleDesignChange}
                onCompositeUpdate={setComposite}
                generatedImage={generatedImage}
                corners={corners}
                onCornersChange={setCorners}
            />
        </main>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    backgroundColor: '#111827',
    width: 'calc(100vw - 4rem)',
    height: 'calc(100vh - 4rem)',
    borderRadius: '1rem',
    border: '1px solid #374151',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #374151',
    flexShrink: 0,
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#E5E7EB',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '1rem',
  },
  button: {
    padding: '0.5rem 1.25rem',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  cancelButton: {
    backgroundColor: '#4B5563',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#F97316',
    color: '#FFFFFF',
  },
  editorWrapper: {
    flex: 1,
    padding: '1.5rem',
    overflow: 'hidden',
    display: 'flex',
  },
};

const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = keyframes;
document.head.appendChild(styleSheet);