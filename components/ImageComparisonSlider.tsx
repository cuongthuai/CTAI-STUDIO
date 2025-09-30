import React, { useState, useRef, PointerEvent, useEffect } from 'react';

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
}

const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handlePointerMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    e.currentTarget.style.cursor = 'grabbing';
    // Capture pointer to handle dragging outside the element
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    e.currentTarget.style.cursor = 'grab';
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    handlePointerMove(e.clientX);
  };

  return (
    <div 
        ref={containerRef} 
        style={styles.container}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={handleDrag}
    >
      <img src={beforeImage} alt="Trước" style={styles.image} draggable={false} />
      <div style={{...styles.image, ...styles.afterImageWrapper, clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
        <img src={afterImage} alt="Sau" style={styles.image} draggable={false} />
      </div>
      <div style={{...styles.sliderLine, left: `${sliderPosition}%` }} />
      <div style={{...styles.sliderHandle, left: `${sliderPosition}%` }}>
        <div style={styles.handleArrowLeft} />
        <div style={styles.handleArrowRight} />
      </div>
      <div style={{...styles.label, left: '1rem' }}>Trước</div>
      <div style={{...styles.label, right: '1rem' }}>Sau</div>
    </div>
  );
};

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'grab',
        userSelect: 'none',
        borderRadius: '0.5rem',
    },
    image: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none',
    },
    afterImageWrapper: {
        width: '100%',
        height: '100%',
    },
    sliderLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '2px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        transform: 'translateX(-1px)',
        pointerEvents: 'none',
        boxShadow: '0px 0px 10px rgba(0,0,0,0.5)',
        zIndex: 5,
    },
    sliderHandle: {
        position: 'absolute',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        boxShadow: '0px 0px 10px rgba(0,0,0,0.5)',
        zIndex: 5,
    },
    handleArrowLeft: {
        width: 0,
        height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: '8px solid #111827',
    },
    handleArrowRight: {
        width: 0,
        height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderLeft: '8px solid #111827',
    },
    label: {
        position: 'absolute',
        top: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: 'rgba(17, 24, 39, 0.7)',
        color: 'white',
        borderRadius: '0.5rem',
        fontWeight: 500,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 5,
    }
}

export default ImageComparisonSlider;
