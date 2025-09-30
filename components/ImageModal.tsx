import React, { useEffect } from 'react';
import { CloseIcon } from './icons';
import ImageComparisonSlider from './ImageComparisonSlider';

interface ImageModalProps {
  afterSrc: string | null;
  beforeSrc?: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ afterSrc, beforeSrc, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!afterSrc) {
    return null;
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose} aria-label="Đóng xem ảnh">
          <CloseIcon />
        </button>
        {beforeSrc ? (
          <ImageComparisonSlider beforeImage={beforeSrc} afterImage={afterSrc} />
        ) : (
          <img src={afterSrc} alt="Ảnh phóng to" style={styles.image} />
        )}
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
    position: 'relative',
    padding: '1rem',
    borderRadius: '1rem',
    width: '90vw',
    height: '90vh',
    display: 'flex',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: '0.75rem',
  },
  closeButton: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    background: '#374151',
    border: '1px solid #4B5563',
    borderRadius: '50%',
    color: '#F9FAFB',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
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