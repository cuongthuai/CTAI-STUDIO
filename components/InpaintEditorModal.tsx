
import React, { useEffect, useRef } from 'react';
import { SourceImage, Path } from '../types';
import { ImageEditor, ImageEditorRef } from './ImageUploader';

interface InpaintEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    paths: Path[];
    mask: string | null;
  }) => void;
  initialSourceImage: SourceImage | null;
  initialPaths: Path[];
}

export const InpaintEditorModal: React.FC<InpaintEditorModalProps> = ({
  isOpen, onClose, onSave, initialSourceImage, initialPaths
}) => {
  const editorRef = useRef<ImageEditorRef>(null);

  const handleSave = () => {
    if (editorRef.current) {
      const paths = editorRef.current.getPaths();
      const mask = editorRef.current.getMask();
      onSave({ paths, mask });
    }
    onClose();
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
            <h2 style={styles.title}>Trình Chỉnh Sửa & Vẽ Mask</h2>
            <div style={styles.actions}>
                <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Hủy</button>
                <button onClick={handleSave} style={{...styles.button, ...styles.saveButton}}>Lưu và Đóng</button>
            </div>
        </header>
        <main style={styles.editorWrapper}>
            <ImageEditor
                ref={editorRef}
                sourceImage={initialSourceImage?.base64 || null}
                initialPaths={initialPaths}
                onImageUpload={() => {}} // No-op
                onMaskChange={() => {}} // No-op, mask is retrieved on save
                onClearImage={() => {}} // No-op
                allowClear={false}
                layout="horizontal"
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