import React, { useState, useEffect, useRef, PointerEvent, WheelEvent, DragEvent } from 'react';
import { SourceImage } from '../types';
import { UploadIcon, ResetIcon } from './icons';

interface OutpaintEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    original: SourceImage;
    sourceForGen: SourceImage;
    maskForGen: string;
    frame: { x: number; y: number; width: number; height: number };
    imagePos: { x: number; y: number; width: number; height: number };
  }) => void;
  initialImage: SourceImage | null;
}

type AspectRatio = 'free' | 'original' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
type ActiveHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'image' | null;
interface Rect { x: number; y: number; width: number; height: number; }

const ASPECT_RATIOS: Record<AspectRatio, number | null> = {
    'free': null, 'original': null, '1:1': 1, '16:9': 16/9, '9:16': 9/16, '4:3': 4/3, '3:4': 3/4
};

export const OutpaintEditorModal: React.FC<OutpaintEditorModalProps> = ({ isOpen, onClose, onSave, initialImage }) => {
    const [source, setSource] = useState<SourceImage | null>(initialImage);
    const [sourceElement, setSourceElement] = useState<HTMLImageElement | null>(null);
    const [frame, setFrame] = useState<Rect | null>(null);
    const [imagePos, setImagePos] = useState<Rect | null>(null);
    const [viewTransform, setViewTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [dragState, setDragState] = useState<{ type: ActiveHandle, startMouse: {x:number, y:number}, initialFrame: Rect, initialImagePos: Rect } | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isOpen && initialImage && !source) {
            setSource(initialImage);
        }
        if (!isOpen) {
            // Reset state when closing, except for the initial image if it's there
            setSource(initialImage);
            setSourceElement(null);
            setFrame(null);
            setImagePos(null);
        }
    }, [isOpen, initialImage, source]);

    useEffect(() => {
        if (source) {
            const img = new Image();
            img.src = source.base64;
            img.onload = () => setSourceElement(img);
        } else {
            setSourceElement(null);
        }
    }, [source]);
    
    const initializePositions = (img: HTMLImageElement) => {
        const container = containerRef.current;
        if (!container) return;

        const containerW = container.clientWidth;
        const containerH = container.clientHeight;

        const imgAspectRatio = img.naturalWidth / img.naturalHeight;
        
        const padding = 0.8;
        let w, h;
        if (containerW / containerH > imgAspectRatio) {
            h = containerH * padding;
            w = h * imgAspectRatio;
        } else {
            w = containerW * padding;
            h = w / imgAspectRatio;
        }
        
        const centerX = containerW / 2;
        const centerY = containerH / 2;

        const newImagePos = { x: centerX - w/2, y: centerY - h/2, width: w, height: h };
        setImagePos(newImagePos);
        setFrame({ ...newImagePos }); // Initially frame is same as image
        setViewTransform({ scale: 1, x: 0, y: 0 });
    };

    useEffect(() => {
        if (sourceElement && !imagePos) {
            initializePositions(sourceElement);
        }
    }, [sourceElement, imagePos]);

    // Main drawing loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const draw = () => {
            const container = containerRef.current;
            if(!container) return;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#111827';
            ctx.fillRect(0,0,canvas.width, canvas.height);

            ctx.save();
            ctx.translate(viewTransform.x, viewTransform.y);
            ctx.scale(viewTransform.scale, viewTransform.scale);
            
            // Draw checkerboard
            const patternCanvas = document.createElement('canvas');
            patternCanvas.width = 20;
            patternCanvas.height = 20;
            const pctx = patternCanvas.getContext('2d');
            if(pctx){
                pctx.fillStyle = '#374151'; pctx.fillRect(0,0,10,10); pctx.fillRect(10,10,10,10);
                pctx.fillStyle = '#4B5563'; pctx.fillRect(10,0,10,10); pctx.fillRect(0,10,10,10);
                ctx.fillStyle = ctx.createPattern(patternCanvas, 'repeat')!;
                ctx.fillRect(-5000, -5000, 10000, 10000); // A large area
            }

            // Draw the source image
            if (imagePos && sourceElement) {
                ctx.drawImage(sourceElement, imagePos.x, imagePos.y, imagePos.width, imagePos.height);
            }

            // Draw the semi-transparent white overlay for the outpaint area
            if (frame && imagePos) {
                ctx.save();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                // Create a clipping region that is the frame minus the image
                ctx.beginPath();
                ctx.rect(frame.x, frame.y, frame.width, frame.height);
                // Create a hole for the image using counter-clockwise winding
                ctx.moveTo(imagePos.x, imagePos.y);
                ctx.lineTo(imagePos.x, imagePos.y + imagePos.height);
                ctx.lineTo(imagePos.x + imagePos.width, imagePos.y + imagePos.height);
                ctx.lineTo(imagePos.x + imagePos.width, imagePos.y);
                ctx.closePath();
                
                ctx.fill('evenodd');
                ctx.restore();
            }

            if (frame) {
                ctx.strokeStyle = '#F97316';
                ctx.lineWidth = 2 / viewTransform.scale;
                ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);

                // Draw handles
                const handleSize = 10 / viewTransform.scale;
                ctx.fillStyle = '#F97316';
                const handles = {
                    tl: {x: frame.x, y: frame.y}, tr: {x: frame.x + frame.width, y: frame.y},
                    bl: {x: frame.x, y: frame.y + frame.height}, br: {x: frame.x + frame.width, y: frame.y + frame.height},
                    t: {x: frame.x + frame.width/2, y: frame.y}, b: {x: frame.x + frame.width/2, y: frame.y + frame.height},
                    l: {x: frame.x, y: frame.y + frame.height/2}, r: {x: frame.x + frame.width, y: frame.y + frame.height/2},
                }
                Object.values(handles).forEach(h => ctx.fillRect(h.x-handleSize/2, h.y-handleSize/2, handleSize, handleSize));
            }
            ctx.restore();
        };
        requestAnimationFrame(draw);
    }, [frame, imagePos, sourceElement, viewTransform]);

    // Interaction handlers
    const getMousePos = (e: PointerEvent | WheelEvent): {x: number, y: number} => {
        const canvas = canvasRef.current; if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - viewTransform.x) / viewTransform.scale,
            y: (e.clientY - rect.top - viewTransform.y) / viewTransform.scale,
        };
    };

    const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
        if (!frame || !imagePos) return;
        const mouse = getMousePos(e);
        const handleThreshold = 15 / viewTransform.scale;
        
        const handles: Record<NonNullable<ActiveHandle>, Rect> = {
            tl: {x: frame.x - handleThreshold, y: frame.y - handleThreshold, width: 2 * handleThreshold, height: 2 * handleThreshold},
            tr: {x: frame.x + frame.width - handleThreshold, y: frame.y - handleThreshold, width: 2 * handleThreshold, height: 2 * handleThreshold},
            bl: {x: frame.x - handleThreshold, y: frame.y + frame.height - handleThreshold, width: 2 * handleThreshold, height: 2 * handleThreshold},
            br: {x: frame.x + frame.width - handleThreshold, y: frame.y + frame.height - handleThreshold, width: 2 * handleThreshold, height: 2 * handleThreshold},
            t: {x: frame.x + handleThreshold, y: frame.y - handleThreshold, width: frame.width - 2 * handleThreshold, height: 2 * handleThreshold},
            b: {x: frame.x + handleThreshold, y: frame.y + frame.height - handleThreshold, width: frame.width - 2 * handleThreshold, height: 2 * handleThreshold},
            l: {x: frame.x - handleThreshold, y: frame.y + handleThreshold, width: 2 * handleThreshold, height: frame.height - 2 * handleThreshold},
            r: {x: frame.x + frame.width - handleThreshold, y: frame.y + handleThreshold, width: 2 * handleThreshold, height: frame.height - 2 * handleThreshold},
            image: imagePos
        };

        for (const [key, rect] of Object.entries(handles)) {
            if (mouse.x > rect.x && mouse.x < rect.x + rect.width && mouse.y > rect.y && mouse.y < rect.y + rect.height) {
                setDragState({ type: key as ActiveHandle, startMouse: mouse, initialFrame: frame, initialImagePos: imagePos });
                return;
            }
        }
    };

    const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
        if (!dragState) return;
        const mouse = getMousePos(e);
        const dx = mouse.x - dragState.startMouse.x;
        const dy = mouse.y - dragState.startMouse.y;
        let newFrame = { ...dragState.initialFrame };

        if (dragState.type === 'image') {
            setImagePos({ ...dragState.initialImagePos, x: dragState.initialImagePos.x + dx, y: dragState.initialImagePos.y + dy });
            return;
        }
        
        // Frame manipulation logic
        if (dragState.type.includes('l')) { newFrame.x += dx; newFrame.width -= dx; }
        if (dragState.type.includes('r')) { newFrame.width += dx; }
        if (dragState.type.includes('t')) { newFrame.y += dy; newFrame.height -= dy; }
        if (dragState.type.includes('b')) { newFrame.height += dy; }
        
        // Aspect Ratio lock
        let ar = ASPECT_RATIOS[aspectRatio];
        if (aspectRatio === 'original' && sourceElement) { ar = sourceElement.naturalWidth / sourceElement.naturalHeight; }

        if (ar) {
            if (dragState.type === 't' || dragState.type === 'b') {
                const newWidth = newFrame.height * ar;
                newFrame.x = dragState.initialFrame.x + (dragState.initialFrame.width - newWidth) / 2;
                newFrame.width = newWidth;
            } else {
                const newHeight = newFrame.width / ar;
                if (dragState.type === 'l' || dragState.type === 'r') {
                    newFrame.y = dragState.initialFrame.y + (dragState.initialFrame.height - newHeight) / 2;
                    newFrame.height = newHeight;
                } else { // Corner drag
                    if (dragState.type.includes('t')) newFrame.y = newFrame.y + newFrame.height - newHeight;
                    newFrame.height = newHeight;
                }
            }
        }
        
        setFrame(newFrame);
    };

    const handlePointerUp = () => setDragState(null);

    const handleSaveClick = () => {
        if (!frame || !imagePos || !source || !sourceElement) return;

        // Create the composite image
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = frame.width;
        compositeCanvas.height = frame.height;
        const compCtx = compositeCanvas.getContext('2d');
        if(!compCtx) return;
        
        // Position of image relative to the frame's top-left corner
        const relX = imagePos.x - frame.x;
        const relY = imagePos.y - frame.y;
        compCtx.drawImage(sourceElement, relX, relY, imagePos.width, imagePos.height);
        const sourceForGen: SourceImage = {
            base64: compositeCanvas.toDataURL('image/png'),
            mimeType: 'image/png'
        };

        // Create the mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = frame.width;
        maskCanvas.height = frame.height;
        const maskCtx = maskCanvas.getContext('2d');
        if(!maskCtx) return;
        maskCtx.fillStyle = 'white';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(relX, relY, imagePos.width, imagePos.height);
        const maskForGen = maskCanvas.toDataURL('image/png');

        onSave({ original: source, sourceForGen, maskForGen, frame, imagePos });
    };
    
    const handleFileChange = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            const base64 = e.target.result as string;
            setSource({ base64, mimeType: file.type });
            setImagePos(null); // Force re-initialization
            setFrame(null);
        };
        reader.readAsDataURL(file);
    };

    if (!isOpen) return null;

    return (
        <div style={styles.backdrop}>
            <div style={styles.modalContent}>
                <header style={styles.header}>
                    <h2 style={styles.title}>Trình Mở Rộng Ảnh</h2>
                    <div style={styles.actions}>
                        <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Hủy</button>
                        <button onClick={handleSaveClick} style={{...styles.button, ...styles.saveButton}} disabled={!source}>Lưu và Đóng</button>
                    </div>
                </header>
                <main style={styles.editorWrapper}>
                    {source ? (
                        <div ref={containerRef} style={styles.canvasContainer}>
                            <canvas
                                ref={canvasRef}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerLeave={handlePointerUp}
                            />
                            <div style={styles.toolbar}>
                                {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map(ar => (
                                    <button key={ar} onClick={() => setAspectRatio(ar)} style={aspectRatio === ar ? {...styles.toolbarButton, ...styles.toolbarButtonActive} : styles.toolbarButton}>
                                        {ar === 'original' ? 'Gốc' : ar === 'free' ? 'Tự do' : ar}
                                    </button>
                                ))}
                                <button onClick={() => sourceElement && initializePositions(sourceElement)} style={styles.toolbarButton} title="Đặt lại bố cục">
                                    <ResetIcon style={{width:16, height: 16}} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={styles.uploadPlaceholder} onDrop={(e: DragEvent) => { e.preventDefault(); handleFileChange(e.dataTransfer.files[0]) }} onDragOver={(e:DragEvent) => e.preventDefault()}>
                            <UploadIcon style={{width: 48, height: 48}} />
                            <span>Kéo thả hoặc nhấn để tải ảnh lên</span>
                            <input type="file" accept="image/*" style={styles.fileInput} onChange={e => e.target.files && handleFileChange(e.target.files[0])} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 24, 39, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' },
  modalContent: { backgroundColor: '#111827', width: 'calc(100vw - 4rem)', height: 'calc(100vh - 4rem)', borderRadius: '1rem', border: '1px solid #374151', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #374151', flexShrink: 0 },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#E5E7EB', margin: 0 },
  actions: { display: 'flex', gap: '1rem' },
  button: { padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.3s ease' },
  cancelButton: { backgroundColor: '#4B5563', color: '#FFFFFF' },
  saveButton: { backgroundColor: '#3B82F6', color: '#FFFFFF' },
  editorWrapper: { flex: 1, padding: '1.5rem', overflow: 'hidden', display: 'flex', position: 'relative' },
  canvasContainer: { flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '0.5rem' },
  toolbar: { position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(31, 41, 55, 0.8)', borderRadius: '0.5rem', border: '1px solid #4B5563' },
  toolbarButton: { padding: '0.5rem 1rem', background: '#374151', border: '1px solid #4B5563', color: '#D1D5DB', borderRadius: '0.375rem', cursor: 'pointer' },
  toolbarButtonActive: { backgroundColor: '#F97316', borderColor: '#F97316', color: 'white' },
  uploadPlaceholder: { flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', border: '2px dashed #4B5563', borderRadius: '0.75rem', color: '#9CA3AF', position: 'relative' },
  fileInput: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' },
};