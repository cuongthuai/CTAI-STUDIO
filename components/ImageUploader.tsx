


import React, { useState, useCallback, DragEvent, useRef, useEffect, PointerEvent, useImperativeHandle, forwardRef } from 'react';
import { SourceImage, Path } from '../types';
import { UploadIcon, BrushIcon, EraserIcon, UndoIcon, RedoIcon, ResetIcon, TrashIcon, LassoIcon } from './icons';

interface ImageEditorProps {
  onImageUpload: (image: SourceImage) => void;
  sourceImage: string | null;
  onMaskChange: (mask: string | null) => void;
  onClearImage: () => void;
  initialPaths?: Path[];
  allowClear?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export interface ImageEditorRef {
    getPaths: () => Path[];
    getMask: () => string | null;
}

const hexToRgba = (hex: string, opacity: number = 0.5): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${opacity})`;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const Toolbar: React.FC<{
  isHorizontalLayout: boolean;
  activeTool: 'brush' | 'lasso';
  onToolChange: (tool: 'brush' | 'lasso') => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  undoDisabled: boolean;
  onRedo: () => void;
  redoDisabled: boolean;
  onClearMask: () => void;
  clearMaskDisabled: boolean;
  // FIX: Correct the type for onResetView to align with the passed handleResetView function.
  onResetView: () => void;
}> = ({
  isHorizontalLayout, activeTool, onToolChange, brushColor, onBrushColorChange, brushSize, onBrushSizeChange, onUndo, undoDisabled, onRedo, redoDisabled, onClearMask, clearMaskDisabled, onResetView
}) => {
    const colorInputRef = useRef<HTMLInputElement>(null);
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => onBrushColorChange(e.target.value);

    if (isHorizontalLayout) {
        return (
            <div style={styles.sidebar}>
                <div style={styles.sidebarSection}>
                    <h3 style={styles.sidebarTitle}>Công cụ</h3>
                    <div style={styles.toolSelectorVertical}>
                        <button onClick={() => onToolChange('brush')} style={activeTool === 'brush' ? {...styles.actionButton, ...styles.toolButtonActive, justifyContent: 'flex-start'} : {...styles.actionButton, justifyContent: 'flex-start'}} title="Cọ vẽ">
                            <BrushIcon /><span>Cọ vẽ</span>
                        </button>
                         <button onClick={() => onToolChange('lasso')} style={activeTool === 'lasso' ? {...styles.actionButton, ...styles.toolButtonActive, justifyContent: 'flex-start'} : {...styles.actionButton, justifyContent: 'flex-start'}} title="Lasso">
                            <LassoIcon /><span>Lasso</span>
                        </button>
                    </div>
                </div>

                {activeTool === 'brush' && (
                    <div style={styles.sidebarSection}>
                        <h3 style={styles.sidebarTitle}>Thuộc tính Cọ</h3>
                        <div style={styles.colorPickerWrapper}>
                             <input
                                type="color"
                                ref={colorInputRef}
                                onChange={handleColorChange}
                                style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }}
                            />
                            <button
                                onClick={() => colorInputRef.current?.click()}
                                style={{...styles.actionButton, justifyContent: 'space-between', width: '100%'}}
                                title="Màu cọ"
                            >
                                <span>Màu sắc</span>
                                <div style={{ ...styles.colorPreview, backgroundColor: brushColor }} />
                            </button>
                        </div>
                        <div style={styles.sliderContainerVertical}>
                            <div style={styles.sliderGroupVertical}>
                                <label htmlFor="brush-size" style={styles.sliderLabel}>Kích thước: {brushSize}</label>
                                <input 
                                    type="range" id="brush-size" min="1" max="100" value={brushSize}
                                    onChange={e => onBrushSizeChange(Number(e.target.value))}
                                    style={styles.brushSlider}
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                <div style={styles.sidebarSection}>
                    <h3 style={styles.sidebarTitle}>Thao tác</h3>
                    <div style={styles.actionsGrid}>
                        <button onClick={onUndo} disabled={undoDisabled} style={styles.actionButton} title="Hoàn tác (Ctrl+Z)"><UndoIcon /><span>Hoàn tác</span></button>
                        <button onClick={onRedo} disabled={redoDisabled} style={styles.actionButton} title="Làm lại"><RedoIcon /><span>Làm lại</span></button>
                        <button onClick={onClearMask} disabled={clearMaskDisabled} style={styles.actionButton} title="Xóa vùng chọn"><EraserIcon /><span>Xóa Mask</span></button>
                        {/* FIX: The onClick handler should call the onResetView prop inside an arrow function to prevent passing the event object and ensure the function is called with the correct number of arguments. */}
                        <button onClick={() => onResetView()} style={styles.actionButton} title="Đặt lại góc nhìn"><ResetIcon /><span>Reset View</span></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
      <div style={styles.toolbar}>
          <div style={styles.toolGroup}>
              <button onClick={() => onToolChange('brush')} style={activeTool === 'brush' ? {...styles.toolButton, ...styles.toolButtonActive} : styles.toolButton} title="Cọ vẽ"><BrushIcon /></button>
              <button onClick={() => onToolChange('lasso')} style={activeTool === 'lasso' ? {...styles.toolButton, ...styles.toolButtonActive} : styles.toolButton} title="Lasso"><LassoIcon /></button>
          </div>
           {activeTool === 'brush' && (
            <div style={styles.sliderContainer}>
                <div style={{ position: 'relative' }}>
                    <input
                        type="color"
                        ref={colorInputRef}
                        onChange={handleColorChange}
                        style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                    <button
                        onClick={() => colorInputRef.current?.click()}
                        style={{ ...styles.toolButton, padding: '0.25rem', marginRight: '0.5rem' }}
                        title="Màu cọ"
                    >
                        <div style={{ ...styles.colorPreview, backgroundColor: brushColor }} />
                    </button>
                </div>
                <div style={styles.sliderGroup}>
                    <label htmlFor="brush-size" style={styles.sliderLabel}>Kích thước: {brushSize}</label>
                    <input 
                        type="range" id="brush-size" min="1" max="100" value={brushSize}
                        onChange={e => onBrushSizeChange(Number(e.target.value))}
                        style={styles.brushSlider}
                    />
                </div>
            </div>
           )}
          <div style={styles.toolGroup}>
              <button onClick={onUndo} disabled={undoDisabled} style={styles.toolButton} title="Hoàn tác"><UndoIcon /></button>
              <button onClick={onRedo} disabled={redoDisabled} style={styles.toolButton} title="Làm lại"><RedoIcon /></button>
              <button onClick={onClearMask} disabled={clearMaskDisabled} style={styles.toolButton} title="Xóa vùng chọn"><EraserIcon /></button>
              <button onClick={() => onResetView()} style={styles.toolButton} title="Đặt lại góc nhìn"><ResetIcon /></button>
          </div>
      </div>
    );
}


export const ImageEditor = forwardRef<ImageEditorRef, ImageEditorProps>(({ 
    onImageUpload, 
    sourceImage, 
    onMaskChange,
    onClearImage,
    initialPaths = [],
    allowClear = true,
    layout = 'vertical',
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeTool, setActiveTool] = useState<'brush' | 'lasso'>('brush');
  const [brushSize, setBrushSize] = useState(30);
  const [paths, setPaths] = useState<Path[]>(initialPaths);
  const [redoStack, setRedoStack] = useState<Path[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState<string>('rgba(249, 115, 22, 0.5)');
  
  // New state for Polygonal Lasso
  const [previewPoint, setPreviewPoint] = useState<{ x: number; y: number } | null>(null);
  const [isCloseHovered, setIsCloseHovered] = useState(false);


  const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);
  const animationFrameRef = useRef<number>();

  // FIX: Refactor to capture `paths` from closure and update dependency array.
  const generateFunctionalMask = useCallback((): string | null => {
    const visualCanvas = drawingCanvasRef.current;
    if (!visualCanvas || paths.length === 0) {
        return null;
    }

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = visualCanvas.width;
    maskCanvas.height = visualCanvas.height;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';

    paths.forEach(path => {
        ctx.beginPath();
        if (path.points.length > 0) {
            ctx.moveTo(path.points[0].x, path.points[0].y);
            path.points.forEach(point => ctx.lineTo(point.x, point.y));
            if (path.tool === 'brush') {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = path.brushSize;
                ctx.stroke();
            } else if (path.tool === 'lasso' && path.isClosed) {
                ctx.closePath();
                ctx.fill();
            }
        }
    });

    return maskCanvas.toDataURL('image/png');
  }, [paths]);
  
  useImperativeHandle(ref, () => ({
      getPaths: () => paths,
      getMask: () => generateFunctionalMask(),
  }));

  const drawAllPaths = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let lassoAnimationOffset = 0;
    const animateMarchingAnts = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Redraw brush strokes if any
        paths.filter(p => p.tool === 'brush').forEach(path => {
            ctx.beginPath();
            if(path.points.length > 0) {
                ctx.moveTo(path.points[0].x, path.points[0].y);
                path.points.forEach(point => ctx.lineTo(point.x, point.y));
            }
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = path.brushSize;
            ctx.strokeStyle = path.color;
            ctx.stroke();
        });

        const lassoPath = paths.find(p => p.tool === 'lasso' && p.isClosed);
        if(lassoPath) {
            ctx.beginPath();
            if(lassoPath.points.length > 0) {
                ctx.moveTo(lassoPath.points[0].x, lassoPath.points[0].y);
                lassoPath.points.forEach(point => ctx.lineTo(point.x, point.y));
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
            ctx.fill();
            // Marching ants effect
            ctx.save();
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = -lassoAnimationOffset;
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.lineDashOffset = -lassoAnimationOffset + 5;
            ctx.strokeStyle = 'black';
            ctx.stroke();
            ctx.restore();
        }

        lassoAnimationOffset = (lassoAnimationOffset + 0.5) % 10;
        animationFrameRef.current = requestAnimationFrame(animateMarchingAnts);
    };

    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    
    const hasClosedLasso = paths.some(p => p.tool === 'lasso' && p.isClosed);
    if(hasClosedLasso) {
        animateMarchingAnts();
        return; // Don't draw anything else if we're animating
    }
    
    // Default drawing for brushes and in-progress lasso
    paths.forEach(path => {
        ctx.beginPath();
         if(path.points.length > 0) {
            ctx.moveTo(path.points[0].x, path.points[0].y);
            path.points.forEach(point => ctx.lineTo(point.x, point.y));
        }
        if(path.tool === 'brush') {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = path.brushSize;
            ctx.strokeStyle = path.color;
            ctx.stroke();
        } else if (path.tool === 'lasso' && !path.isClosed) {
             ctx.strokeStyle = '#FFFFFF';
             ctx.lineWidth = 1 / transform.scale;
             ctx.setLineDash([4, 4]);
             ctx.stroke();
             
             // Draw the live preview line to cursor
             if (previewPoint && path.points.length > 0) {
                const lastPoint = path.points[path.points.length - 1];
                ctx.beginPath();
                ctx.moveTo(lastPoint.x, lastPoint.y);
                ctx.lineTo(previewPoint.x, previewPoint.y);
                ctx.stroke();
             }
             ctx.setLineDash([]);

            // Draw vertices
            path.points.forEach((point, index) => {
                ctx.beginPath();
                const radius = (index === 0 ? 5 : 3) / transform.scale;
                ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = index === 0 ? '#F97316' : '#FFFFFF';
                ctx.fill();
            });
             
            // Draw hover indicator on start point
            if (isCloseHovered && path.points.length > 2) {
                const startPoint = path.points[0];
                ctx.beginPath();
                ctx.arc(startPoint.x, startPoint.y, 10 / transform.scale, 0, 2 * Math.PI);
                ctx.strokeStyle = '#F97316';
                ctx.lineWidth = 2 / transform.scale;
                ctx.stroke();
            }
        }
    });
  }, [paths, previewPoint, isCloseHovered, transform.scale]);
  
  useEffect(() => {
    drawAllPaths(); 
    const functionalMask = generateFunctionalMask();
    onMaskChange(functionalMask);

    return () => {
        if(animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    }
  }, [paths, drawAllPaths, onMaskChange, generateFunctionalMask]);
  
  const getCanvasCoordinates = (e: PointerEvent | globalThis.PointerEvent): {x: number, y: number} => {
    const canvas = drawingCanvasRef.current;
    const wrapper = canvasWrapperRef.current;
    if (!canvas || !wrapper) return { x: 0, y: 0 };
    
    const wrapperRect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - wrapperRect.left;
    const mouseY = e.clientY - wrapperRect.top;

    const scaleX = canvas.width / wrapperRect.width;
    const scaleY = canvas.height / wrapperRect.height;

    return {
      x: mouseX * scaleX,
      y: mouseY * scaleY,
    };
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.altKey || e.button === 1 || e.button === 2) { // 1 is middle mouse, 2 is right
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - transform.offsetX, y: e.clientY - transform.offsetY });
        e.currentTarget.style.cursor = 'grabbing';
        return;
    }
    
    if (e.button !== 0) return; // Only main button (left click) from here
    
    const { x, y } = getCanvasCoordinates(e);

    if (activeTool === 'brush') {
        setIsDrawing(true);
        setPaths(prev => [...prev, { points: [{ x, y }], brushSize, color: brushColor, tool: 'brush' }]);
        setRedoStack([]);
        return;
    }
    
    if (activeTool === 'lasso') {
        const currentLasso = paths.find(p => p.tool === 'lasso' && !p.isClosed);

        if (!currentLasso) {
            // Start a new lasso path. Since only one selection is allowed, clear previous paths.
            setPaths([{ points: [{ x, y }], brushSize: 0, color: '', tool: 'lasso', isClosed: false }]);
            setIsDrawing(true);
            setRedoStack([]);
            return;
        }

        const startPoint = currentLasso.points[0];
        const CLOSE_THRESHOLD = 10 / transform.scale;
        
        // Check for closing the path
        if (currentLasso.points.length > 2 && Math.hypot(x - startPoint.x, y - startPoint.y) < CLOSE_THRESHOLD) {
            currentLasso.isClosed = true;
            setIsDrawing(false);
            setPreviewPoint(null);
            setIsCloseHovered(false);
            setPaths([...paths]);
        } else {
            // Add a new point
            currentLasso.points.push({ x, y });
            setPaths([...paths]);
        }
    }
  };
  
  const handlePointerMove = (e: globalThis.PointerEvent) => {
    if (isPanning) {
        const newOffsetX = e.clientX - panStart.x;
        const newOffsetY = e.clientY - panStart.y;
        setTransform(prev => ({...prev, offsetX: newOffsetX, offsetY: newOffsetY}));
        return;
    }
    if (!isDrawing) return;
    
    const { x, y } = getCanvasCoordinates(e);

    if (activeTool === 'brush') {
        setPaths(prev => {
            const newPaths = [...prev];
            const lastPath = newPaths[newPaths.length - 1];
            if (lastPath) {
                lastPath.points.push({ x, y });
            }
            return newPaths;
        });
    } else if (activeTool === 'lasso') {
        setPreviewPoint({ x, y });
        const currentLasso = paths.find(p => p.tool === 'lasso' && !p.isClosed);
        if (currentLasso && currentLasso.points.length > 0) {
            const startPoint = currentLasso.points[0];
            const CLOSE_THRESHOLD = 10 / transform.scale;
            setIsCloseHovered(Math.hypot(x - startPoint.x, y - startPoint.y) < CLOSE_THRESHOLD);
        }
    }
  };

  const handlePointerUp = (e: globalThis.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      const viewport = viewportRef.current;
      if (viewport) {
        viewport.style.cursor = e.altKey ? 'grab' : 'crosshair';
      }
    }

    if (activeTool === 'brush' && isDrawing) {
        setIsDrawing(false);
    }
  };
  
  const cancelLasso = useCallback(() => {
    setPaths(prev => prev.filter(p => p.tool !== 'lasso' || p.isClosed));
    setIsDrawing(false);
    setPreviewPoint(null);
    setIsCloseHovered(false);
  }, []);

  useEffect(() => {
    if (isDrawing || isPanning) {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cancelLasso();
        }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawing, isPanning, handlePointerMove, handlePointerUp, cancelLasso]);


  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!sourceImage) return;
    e.preventDefault();
    
    const viewport = viewportRef.current;
    if (!viewport) return;
    const viewportRect = viewport.getBoundingClientRect();

    const zoomIntensity = 0.1;
    const newScale = transform.scale * (1 - e.deltaY * zoomIntensity * 0.1);
    const clampedScale = Math.max(0.1, Math.min(newScale, 10));
    const scaleRatio = clampedScale / transform.scale;
    
    const mouseX = e.clientX - viewportRect.left;
    const mouseY = e.clientY - viewportRect.top;

    const newOffsetX = mouseX - (mouseX - transform.offsetX) * scaleRatio;
    const newOffsetY = mouseY - (mouseY - transform.offsetY) * scaleRatio;
    
    setTransform({ scale: clampedScale, offsetX: newOffsetX, offsetY: newOffsetY });
  };

  const handleUndo = () => {
    if (paths.length === 0) return;
    
    const currentLasso = paths.find(p => p.tool === 'lasso' && !p.isClosed);
    if(activeTool === 'lasso' && currentLasso && currentLasso.points.length > 0) {
        currentLasso.points.pop();
        setRedoStack([]); // Simple undo for now, disable redo for point removal.
        if (currentLasso.points.length === 0) {
            setPaths([]);
            setIsDrawing(false);
        } else {
            setPaths([...paths]);
        }
        return;
    }

    const lastPath = paths[paths.length - 1];
    setRedoStack(prev => [...prev, lastPath]);
    setPaths(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const lastRedoPath = redoStack[redoStack.length - 1];
    setPaths(prev => [...prev, lastRedoPath]);
    setRedoStack(prev => prev.slice(0, -1));
  };
  
  const handleClearMask = () => {
    setPaths([]);
    setRedoStack([]);
    setIsDrawing(false);
    setPreviewPoint(null);
    setIsCloseHovered(false);
  };

  const handleResetView = (newImageSource?: string) => {
    const imageCanvas = imageCanvasRef.current;
    const container = containerRef.current || viewportRef.current;
    const imageToLoad = newImageSource || sourceImage;
    if(imageCanvas && container && imageToLoad){
        const img = new Image();
        img.src = imageToLoad;
        img.onload = () => {
            const containerWidth = container.clientWidth;
            const containerStyle = window.getComputedStyle(container);
            const maxHeight = parseInt(containerStyle.maxHeight, 10) || container.clientHeight;
            const containerHeight = Math.min(container.clientHeight, maxHeight);
            
            const imgAspectRatio = img.naturalWidth / img.naturalHeight;
            const containerAspectRatio = containerWidth / containerHeight;
            let width, height;
            if (imgAspectRatio > containerAspectRatio) {
                width = containerWidth;
                height = containerWidth / imgAspectRatio;
            } else {
                height = containerHeight;
                width = containerHeight * imgAspectRatio;
            }
            const initialOffsetX = (containerWidth - width) / 2;
            const initialOffsetY = (containerHeight - height) / 2;
            setTransform({ scale: 1, offsetX: initialOffsetX, offsetY: initialOffsetY });
        }
    }
  }

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước tệp không được vượt quá 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onImageUpload({ base64, mimeType: file.type });
        setPaths([]);
        setRedoStack([]);
        handleResetView(base64);
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
                setPaths([]);
                setRedoStack([]);
                handleResetView(base64);
            } catch (e) {
                console.error("CORS Error:", e);
                alert("Không thể tải ảnh từ trang web khác do hạn chế bảo mật (CORS). Máy chủ của ảnh cần cho phép chia sẻ tài nguyên.");
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
        // Check if it has a common image extension
        if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url.pathname)) {
            handleImageUrlDrop(plainText);
            return;
        }
      } catch (_) {
        // Not a valid URL, continue to other checks
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

  useEffect(() => {
    const imageCanvas = imageCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const ctx = imageCanvas?.getContext('2d');
    const container = containerRef.current;
    const canvasWrapper = canvasWrapperRef.current;
    if (!ctx || !imageCanvas || !drawingCanvas || !container || !canvasWrapper) return;

    if (sourceImage) {
        const img = new Image();
        img.src = sourceImage;
        img.onload = () => {
            const containerWidth = container.clientWidth;
            const containerStyle = window.getComputedStyle(container);
            const maxHeight = parseInt(containerStyle.maxHeight, 10) || container.clientHeight;
            const containerHeight = Math.min(container.clientHeight, maxHeight);

            const imgAspectRatio = img.naturalWidth / img.naturalHeight;
            const containerAspectRatio = containerWidth / containerHeight;
            
            let width, height;
            if (imgAspectRatio > containerAspectRatio) {
                width = containerWidth;
                height = containerWidth / imgAspectRatio;
            } else {
                height = containerHeight;
                width = containerHeight * imgAspectRatio;
            }

            imageCanvas.width = img.naturalWidth;
            imageCanvas.height = img.naturalHeight;
            drawingCanvas.width = img.naturalWidth;
            drawingCanvas.height = img.naturalHeight;
            
            canvasWrapper.style.width = `${width}px`;
            canvasWrapper.style.height = `${height}px`;
            
            ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            ctx.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);
            
            if(paths.length === 0) {
                handleResetView();
            }
            drawAllPaths();
        }
    } else {
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    }
  }, [sourceImage, drawAllPaths]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !sourceImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Alt' && !isPanning && !isDrawing) {
            viewport.style.cursor = 'grab';
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Alt' && !isPanning) {
            viewport.style.cursor = 'crosshair';
        }
    };
    
    viewport.style.cursor = 'crosshair';
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    }
  }, [sourceImage, isPanning, isDrawing]);

  const isHorizontalLayout = layout === 'horizontal';
  
  const dropzoneStyles = {...styles.dropzone};
  if (isDragging) Object.assign(dropzoneStyles, styles.dropzoneDragging);
  if (isFocused) Object.assign(dropzoneStyles, styles.dropzoneFocused);
  
  const mainContainerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: isHorizontalLayout ? 'row' : 'column',
      gap: isHorizontalLayout ? '1.5rem' : '1rem',
      height: '100%',
      width: '100%',
  };
  
  const dropzoneComponentStyles = { ...dropzoneStyles };
  if (isHorizontalLayout) {
      Object.assign(dropzoneComponentStyles, {
          flex: 1,
          minHeight: 0,
          padding: 0,
          border: `1px solid ${styles.dropzone.borderColor}`,
          backgroundColor: '#111827',
      });
  }

  const handleToolChange = (tool: 'brush' | 'lasso') => {
    cancelLasso(); // Cancel any in-progress lasso when switching
    setActiveTool(tool);
    // Clear paths when changing tool to avoid mixing selection types
    setPaths([]);
    setRedoStack([]);
  }

  const toolbarProps = {
      isHorizontalLayout,
      activeTool,
      onToolChange: handleToolChange,
      brushColor,
      onBrushColorChange: (color: string) => setBrushColor(hexToRgba(color)),
      brushSize,
      onBrushSizeChange: setBrushSize,
      onUndo: handleUndo,
      undoDisabled: paths.length === 0,
      onRedo: handleRedo,
      redoDisabled: redoStack.length === 0,
      onClearMask: handleClearMask,
      clearMaskDisabled: paths.length === 0,
      // FIX: The onResetView prop was being passed incorrectly. It is now wrapped in a function to ensure it is called with no arguments, matching the updated prop type in the Toolbar component. This prevents potential type errors and aligns with the component's intended usage.
      onResetView: () => handleResetView(),
  };

  return (
    <div style={mainContainerStyle}>
        {isHorizontalLayout && sourceImage && <Toolbar {...toolbarProps} />}
        
        <div 
            ref={containerRef}
            style={dropzoneComponentStyles}
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
              type="file" id="image-upload" accept="image/*" style={styles.input}
              onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
          />
          {isDragging && sourceImage && (
              <div style={styles.replaceOverlay}>
                  <UploadIcon style={{ width: 48, height: 48, color: '#FFFFFF' }}/>
                  <span style={{ marginTop: '1rem', fontSize: '1.2rem', color: '#FFFFFF', fontWeight: 500 }}>Thả để thay thế</span>
              </div>
          )}
          {sourceImage && allowClear && (
              <button
                  onClick={onClearImage}
                  style={styles.clearButton}
                  title="Xóa ảnh gốc"
              >
                  <TrashIcon />
              </button>
          )}
          {sourceImage ? (
              <div 
                ref={viewportRef}
                style={styles.canvasViewport}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
              >
                  <div 
                    ref={canvasWrapperRef}
                    style={{
                      position: 'relative',
                      transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                      <canvas ref={imageCanvasRef} style={styles.canvasBase} />
                      <canvas ref={drawingCanvasRef} style={styles.drawingCanvas} />
                  </div>
              </div>
          ) : (
              <label htmlFor="image-upload" style={styles.label}>
              <UploadIcon />
              <span>Kéo thả, dán, hoặc <strong>nhấn để tải ảnh lên</strong></span>
              <span style={styles.infoText}>PNG, JPG, GIF, WEBP | Tối đa 5MB</span>
              </label>
          )}
        </div>

        {!isHorizontalLayout && sourceImage && <Toolbar {...toolbarProps} />}
    </div>
  );
});

const styles: { [key: string]: React.CSSProperties } = {
  dropzone: {
    border: '2px dashed #4B5563',
    borderRadius: '0.75rem',
    padding: '0.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.3s, background-color 0.3s, box-shadow 0.3s',
    backgroundColor: '#374151',
    minHeight: '200px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
    outline: 'none',
  },
  dropzoneDragging: { borderColor: '#F97316', backgroundColor: '#4B5563' },
  dropzoneFocused: {
    borderColor: '#F97316',
    boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.4)',
  },
  input: { display: 'none' },
  label: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#9CA3AF', cursor: 'pointer' },
  infoText: { fontSize: '0.875rem', color: '#6B7280' },
  canvasViewport: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'crosshair',
    touchAction: 'none'
  },
  canvasBase: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: '0.5rem',
  },
  drawingCanvas: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  toolbar: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', backgroundColor: '#374151', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #4B5563', flexShrink: 0 },
  toolGroup: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  toolButton: { background: 'transparent', border: '1px solid #4B5563', color: '#D1D5DB', padding: '0.5rem', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s, border-color 0.2s', },
  toolButtonActive: { backgroundColor: '#F97316', borderColor: '#F97316', color: 'white' },
  sliderContainer: {
    display: 'flex',
    flex: 1,
    gap: '0.5rem',
    alignItems: 'center',
    minWidth: '150px',
  },
  sliderGroup: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9CA3AF', flex: 1},
  sliderLabel: {
    fontSize: '0.9rem',
    color: '#D1D5DB',
    whiteSpace: 'nowrap'
  },
  brushSlider: { flex: 1 },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: '4px',
    border: '2px solid #1F2937',
    transition: 'background-color 0.2s',
    flexShrink: 0,
  },
  clearButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    zIndex: 10,
    background: 'rgba(55, 65, 81, 0.8)',
    border: '1px solid #4B5563',
    color: '#F9FAFB',
    padding: '0.5rem',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, transform 0.2s',
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
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    pointerEvents: 'none',
  },
  // Styles for horizontal layout (vertical sidebar)
  sidebar: { 
    width: '280px', 
    flexShrink: 0, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1.5rem',
    backgroundColor: '#1F2937',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    border: '1px solid #374151',
  },
  sidebarSection: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  sidebarTitle: { fontSize: '1rem', fontWeight: 500, color: '#D1D5DB', margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid #374151' },
  toolSelectorVertical: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  colorPickerWrapper: { position: 'relative' },
  sliderContainerVertical: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sliderGroupVertical: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  actionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
  actionButton: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    gap: '0.75rem', 
    padding: '0.75rem', 
    background: '#374151', 
    border: '1px solid #4B5563', 
    color: '#D1D5DB', 
    borderRadius: '0.375rem', 
    cursor: 'pointer', 
    transition: 'background-color 0.2s', 
    fontSize: '0.9rem' 
  },
};
