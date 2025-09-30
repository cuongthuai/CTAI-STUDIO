
import React, { useEffect } from 'react';
import { CloseIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Xóa', cancelText = 'Hủy' }) => {
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

    const handleConfirm = () => {
        onConfirm();
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
                <h3 style={styles.title}>{title}</h3>
                <p style={styles.message}>{message}</p>
                <div style={styles.buttonGroup}>
                    <button style={{...styles.button, ...styles.cancelButton}} onClick={onClose}>{cancelText}</button>
                    <button style={{...styles.button, ...styles.confirmButton}} onClick={handleConfirm} autoFocus>{confirmText}</button>
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
    zIndex: 1050,
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
    maxWidth: '450px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    textAlign: 'center',
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
  },
  message: {
      fontSize: '1rem',
      color: '#D1D5DB',
      margin: '0.5rem 0',
      lineHeight: 1.5,
  },
  buttonGroup: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '1.5rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
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
  confirmButton: {
      backgroundColor: '#EF4444',
  }
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
