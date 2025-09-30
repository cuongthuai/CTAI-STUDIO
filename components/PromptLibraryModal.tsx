import React, { useEffect } from 'react';
import { SavedPrompt } from '../types';
import { PromptLibrary } from './PromptLibrary';
import { CloseIcon } from './icons';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: SavedPrompt[];
  onUse: (prompt: string) => void;
  onDelete: (id: number) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({ isOpen, onClose, ...props }) => {
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
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose} aria-label="Close prompt library">
          <CloseIcon />
        </button>
        <PromptLibrary {...props} />
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
    backgroundColor: '#1F2937',
    borderRadius: '1rem',
    border: '1px solid #374151',
    width: '90vw',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    padding: '2rem',
  },
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'transparent',
    border: 'none',
    color: '#9CA3AF',
    cursor: 'pointer',
    padding: '0.25rem',
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