import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CloseIcon } from './icons';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (capturedImage: { base64: string; mimeType: string }) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const startCamera = async () => {
        try {
          setError(null);
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          setError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập trong trình duyệt của bạn.");
          cleanupStream();
        }
      };
      startCamera();
    } else {
      cleanupStream();
    }
    // Cleanup on component unmount
    return cleanupStream;
  }, [isOpen, cleanupStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const [mimeHeader, base64Data] = dataUrl.split(';base64,');
        onCapture({ base64: base64Data, mimeType: mimeHeader.split(':')[1] });
        onClose();
      }
    }
  };
  
  if (!isOpen) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose} aria-label="Đóng camera"><CloseIcon /></button>
        <h3 style={styles.title}>Chụp ảnh từ Camera</h3>
        <div style={styles.cameraContainer}>
          {error ? (
            <div style={styles.errorContainer}>{error}</div>
          ) : (
            <video ref={videoRef} autoPlay playsInline style={styles.video} />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        <button onClick={handleCapture} disabled={!!error} style={styles.captureButton}>
          <Camera className="w-5 h-5 mr-2" /> Chụp ảnh
        </button>
      </div>
    </div>
  );
};
// Styles for the modal
const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(17, 24, 39, 0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1050,
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    },
    modalContent: {
      position: 'relative', backgroundColor: '#1F2937', borderRadius: '1rem',
      border: '1px solid #374151', width: '90vw', maxWidth: '800px',
      padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
    },
    closeButton: {
      position: 'absolute', top: '1rem', right: '1rem', background: 'transparent',
      border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0.25rem', zIndex: 1,
    },
    title: { fontSize: '1.5rem', fontWeight: 700, color: '#E5E7EB', margin: 0, textAlign: 'center' },
    cameraContainer: { width: '100%', aspectRatio: '16 / 9', backgroundColor: '#111827', borderRadius: '0.5rem', overflow: 'hidden' },
    video: { width: '100%', height: '100%', objectFit: 'cover' },
    errorContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#F87171', padding: '1rem' },
    captureButton: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0.75rem 1.5rem', backgroundColor: '#F97316', color: '#FFFFFF',
      border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700,
      cursor: 'pointer', transition: 'background-color 0.3s ease',
    },
};
