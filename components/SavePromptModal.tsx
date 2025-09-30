
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface SavePromptModalProps {
  isOpen: boolean;
  prompt: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const SavePromptModal: React.FC<SavePromptModalProps> = ({ isOpen, prompt, onClose, onSave }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Generate a default name from the prompt
      const defaultName = prompt.trim().split(/\s+/).slice(0, 5).join(' ') || 'Prompt Mới';
      setName(defaultName);
    }
  }, [isOpen, prompt]);
  
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

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose} aria-label="Đóng">
          <CloseIcon />
        </button>
        <h3 style={styles.title}>Lưu Prompt</h3>
        <p style={styles.promptLabel}>Prompt bạn đang lưu:</p>
        <div style={styles.promptTextContainer}>
            <p style={styles.promptText}>{prompt}</p>
        </div>
        <div style={styles.formGroup}>
            <label htmlFor="prompt-name" style={styles.nameLabel}>Tên Prompt:</label>
            <input
                id="prompt-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="Nhập tên cho prompt..."
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                        e.preventDefault();
                        handleSave();
                    }
                }}
            />
        </div>
        <div style={styles.buttonGroup}>
            <button style={{...styles.button, ...styles.cancelButton}} onClick={onClose}>Hủy</button>
            <button style={styles.button} onClick={handleSave} disabled={!name.trim()}>Lưu</button>
        </div>
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
    maxWidth: '500px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
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
  title: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#E5E7EB',
      margin: 0,
      textAlign: 'center',
  },
  promptLabel: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#D1D5DB',
      margin: '0.5rem 0 0.25rem 0',
  },
  promptTextContainer: {
      maxHeight: '150px',
      overflowY: 'auto',
      backgroundColor: '#374151',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #4B5563',
  },
  promptText: {
      color: '#F9FAFB',
      margin: 0,
      fontSize: '0.9rem',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
  },
  formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      marginTop: '0.5rem',
  },
  nameLabel: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#D1D5DB',
  },
  input: {
      backgroundColor: '#374151',
      border: '1px solid #4B5563',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      color: '#F9FAFB',
      fontFamily: 'inherit',
      fontSize: '1rem',
  },
  buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
      marginTop: '1.5rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#F97316',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  cancelButton: {
      backgroundColor: '#4B5563',
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