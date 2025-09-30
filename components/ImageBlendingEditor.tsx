
import React, { useState, useRef, useEffect, DragEvent, PointerEvent, WheelEvent } from 'react';
import { SourceImage, Point, Corners } from '../types';
import { ImageIcon, ObjectIcon, TrashIcon, ZoomInIcon, ZoomOutIcon, RotateIcon, TransformIcon, PerspectiveIcon, FlipHorizontalIcon, FlipVerticalIcon, LinkIcon, UploadIcon } from './icons';

interface ImageBlendingEditorProps {
    background: SourceImage | null;
    design: SourceImage | null;
    onBackgroundChange: (image: SourceImage | null) => void;
    onDesignChange: (image: SourceImage | null) => void;
    onCompositeUpdate: (image: SourceImage | null) => void;
    generatedImage: string | null;
    corners: Corners | null;
    onCornersChange: (corners: Corners | null) => void;
}

type TransformMode = 'transform' | 'perspective';
type ActiveHandle = keyof Corners | 'image' | 'rotate' | 'scale-t' | 'scale-b' | 'scale-l' | 'scale-r' | null;

// Strongly-typed state for drag operations
type DragState =
  | { type: 'pan'; startX: number; startY: number }
  | { type: 'image'; startMouse: Point; initialCorners: Corners }
  | { type: 'rotate'; startMouse: Point; initialCorners: Corners; center: Point }
  | { type: 'scale-corner'; pivot: Point; startMouse: Point; initialCorners: Corners; handle: keyof Corners }
  | { type: 'scale-edge'; handle: 'scale-t' | 'scale-b' | 'scale-l' | 'scale-r'; startMouse: Point; initialCorners: Corners }
  | { type: 'perspective'; handle: keyof Corners; startMouse: Point; initialCorners: Corners };


const LayerUploader: React.FC<{
    onImageUpload: (image: SourceImage | null) => void;
    currentImage: SourceImage | null;
    icon: React.ReactNode;
    label: string;
    isRemovable?: boolean;
}> = ({ onImageUpload, currentImage, icon, label, isRemovable = true }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [dimensions, setDimensions] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    useEffect(() => {
        if (currentImage) {
            const img = new Image();
            img.onload = () => {
                setDimensions(`${img.naturalWidth} x ${img.naturalHeight}`);
            };
            img.src = currentImage.base64;
        } else {
            setDimensions(null);
        }
    }, [currentImage]);

    const handleFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                onImageUpload({ base64, mimeType: file.type });
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
                } catch (e) {
                    console.error("CORS Error:", e);
                    alert("Không thể tải ảnh từ trang web khác do hạn chế bảo mật (CORS).");
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
                handleFile(imageFile);
                return;
            }
        }
    
        // 2. Check for pasted URL as plain text
        const plainText = dataTransfer.getData('text/plain');
        if (plainText && plainText.startsWith('http')) {
          try {
            const url = new URL(plainText);
            if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url.pathname)) {
                handleImageUrlDrop(plainText);
                return;
            }
          } catch (_) {
            // Not a valid URL, continue
          }
        }
    
        // 3. Check for dragged images from web
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
    
    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        setIsDragging(false);
        processDataTransfer(e.dataTransfer);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.stopPropagation();
        processDataTransfer(e.clipboardData);
    };
    
    const containerStyles = {...styles.layerUploader};
    if (isDragging) Object.assign(containerStyles, styles.layerUploaderDragging);
    if (isFocused) Object.assign(containerStyles, styles.layerUploaderFocused);

    return (
        <div 
            style={containerStyles}
            onClick={() => inputRef.current?.click()}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            tabIndex={0}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        >
            {isDragging && currentImage && (
                <div style={styles.layerReplaceOverlay}>
                    <UploadIcon style={{ width: 24, height: 24, color: '#FFFFFF' }} />
                </div>
            )}
            <input
                type="file"
                ref={inputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
             <div style={styles.layerThumbnail}>
                {currentImage ? (
                    <img src={currentImage.base64} style={styles.thumbnail} alt={label} />
                ) : (
                    icon
                )}
                {dimensions && <span style={styles.dimensionBadge}>{dimensions}</span>}
            </div>
            <div style={styles.layerLabel}>{label}</div>
            <div style={styles.layerButtons}>
                {currentImage && isRemovable && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onImageUpload(null); }} 
                        style={styles.layerActionButton} 
                        title={`Xóa ${label}`}
                    >
                        <TrashIcon style={{width: 14, height: 14}} />
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Helper Functions ---
const getCenter = (c: Corners): Point => ({
    x: (c.tl.x + c.tr.x + c.bl.x + c.br.x) / 4,
    y: (c.tl.y + c.tr.y + c.bl.y + c.br.y) / 4,
});

const rotatePoint = (point: Point, center: Point, angle: number): Point => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nx = (cos * (point.x - center.x)) - (sin * (point.y - center.y)) + center.x;
    const ny = (sin * (point.x - center.x)) + (cos * (point.y - center.y)) + center.y;
    return { x: nx, y: ny };
};

// FIX: Add explicit return type to ensure correct type inference for midpoints.
const getMidpoints = (corners: Corners): { t: Point; b: Point; l: Point; r: Point; } => ({
    t: { x: (corners.tl.x + corners.tr.x) / 2, y: (corners.tl.y + corners.tr.y) / 2 },
    b: { x: (corners.bl.x + corners.br.x) / 2, y: (corners.bl.y + corners.br.y) / 2 },
    l: { x: (corners.tl.x + corners.bl.x) / 2, y: (corners.tl.y + corners.bl.y) / 2 },
    r: { x: (corners.tr.x + corners.br.x) / 2, y: (corners.tr.y + corners.br.y) / 2 },
});


// A more accurate function to draw a transformed image by splitting it into two triangles
// and performing an affine transformation on each. This prevents visual artifacts.
function drawPerspectiveImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, corners: Corners) {
    const { tl, tr, bl, br } = corners;
    const w = img.width;
    const h = img.height;

    // Define the two triangles that make up the source image and destination quad
    const triangles = [
        // Top-left half
        { src: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: 0, y: h }], dst: [tl, tr, bl] },
        // Bottom-right half
        { src: [{ x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }], dst: [tr, br, bl] }
    ];

    triangles.forEach(tri => {
        const { src, dst } = tri;
        const [src0, src1, src2] = src;
        const [dst0, dst1, dst2] = dst;

        ctx.save();

        // Clip to the destination triangle
        ctx.beginPath();
        ctx.moveTo(dst0.x, dst0.y);
        ctx.lineTo(dst1.x, dst1.y);
        ctx.lineTo(dst2.x, dst2.y);
        ctx.closePath();
        ctx.clip();
        
        // Calculate the affine transformation matrix that maps the source triangle to the destination triangle.
        // The matrix is [a, b, c, d, e, f] for ctx.transform(a, b, c, d, e, f)
        const { x: x0, y: y0 } = src0;
        const { x: x1, y: y1 } = src1;
        const { x: x2, y: y2 } = src2;

        const { x: u0, y: v0 } = dst0;
        const { x: u1, y: v1 } = dst1;
        const { x: u2, y: v2 } = dst2;

        const delta = (x0 - x2) * (y1 - y2) - (x1 - x2) * (y0 - y2);
        if (Math.abs(delta) < 1e-6) { // Avoid division by zero
            ctx.restore();
            return;
        }

        const a = ((u0 - u2) * (y1 - y2) - (u1 - u2) * (y0 - y2)) / delta;
        const b = ((v0 - v2) * (y1 - y2) - (v1 - v2) * (y0 - y2)) / delta;
        const c = ((u1 - u2) * (x0 - x2) - (u0 - u2) * (x1 - x2)) / delta;
        const d = ((v1 - v2) * (x0 - x2) - (v0 - v2) * (x1 - x2)) / delta;
        const e = u2 - a * x2 - c * y2;
        const f = v2 - b * x2 - d * y2;
        
        ctx.transform(a, b, c, d, e, f);
        ctx.drawImage(img, 0, 0);

        ctx.restore();
    });
}


export const ImageBlendingEditor: React.FC<ImageBlendingEditorProps> = ({
    background,
    design,
    onBackgroundChange,
    onDesignChange,
    onCompositeUpdate,
    generatedImage,
    corners,
    onCornersChange,
}) => {
    const [backgroundImageElement, setBackgroundImageElement] = useState<HTMLImageElement | null>(null);
    const [designImageElement, setDesignImageElement] = useState<HTMLImageElement | null>(null);
    const [generatedImageElement, setGeneratedImageElement] = useState<HTMLImageElement | null>(null);

    const [opacity, setOpacity] = useState(1);
    const [viewTransform, setViewTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
    
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [transformMode, setTransformMode] = useState<TransformMode>('transform');
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (background) {
            const img = new Image();
            img.src = background.base64;
            img.onload = () => setBackgroundImageElement(img);
        } else {
            setBackgroundImageElement(null);
            onCompositeUpdate(null);
        }
    }, [background]);

    useEffect(() => {
        if (design) {
            const img = new Image();
            img.src = design.base64;
            img.onload = () => setDesignImageElement(img);
        } else {
            setDesignImageElement(null);
        }
    }, [design]);

    // Effect to initialize corners for a new design image
    useEffect(() => {
        if (design && !corners && designImageElement && backgroundImageElement && canvasRef.current) {
            const canvas = canvasRef.current;
            const img = designImageElement;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const w = Math.min(img.naturalWidth * 0.5, canvas.width * 0.5);
            const h = (w / img.naturalWidth) * img.naturalHeight;
            onCornersChange({
                tl: { x: centerX - w / 2, y: centerY - h / 2 },
                tr: { x: centerX + w / 2, y: centerY - h / 2 },
                bl: { x: centerX - w / 2, y: centerY + h / 2 },
                br: { x: centerX + w / 2, y: centerY + h / 2 },
            });
        }
    }, [design, corners, designImageElement, backgroundImageElement, onCornersChange]);


    useEffect(() => {
        if(generatedImage) {
            const img = new Image();
            img.src = generatedImage;
            img.onload = () => setGeneratedImageElement(img);
        } else {
            setGeneratedImageElement(null);
            setShowResult(false);
        }
    }, [generatedImage]);

    // Main drawing logic
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!ctx || !canvas || !backgroundImageElement) {
            if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const updateComposite = setTimeout(() => {
            if (backgroundImageElement && designImageElement && corners) {
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = backgroundImageElement.naturalWidth;
                offscreenCanvas.height = backgroundImageElement.naturalHeight;
                const offscreenCtx = offscreenCanvas.getContext('2d');
                if (offscreenCtx) {
                    offscreenCtx.drawImage(backgroundImageElement, 0, 0);
                    const scaleX = offscreenCanvas.width / canvas.width;
                    const scaleY = offscreenCanvas.height / canvas.height;
                    const scaledCorners: Corners = {
                        tl: { x: corners.tl.x * scaleX, y: corners.tl.y * scaleY },
                        tr: { x: corners.tr.x * scaleX, y: corners.tr.y * scaleY },
                        bl: { x: corners.bl.x * scaleX, y: corners.bl.y * scaleY },
                        br: { x: corners.br.x * scaleX, y: corners.br.y * scaleY },
                    };
                    drawPerspectiveImage(offscreenCtx, designImageElement, scaledCorners);
                    onCompositeUpdate({ base64: offscreenCanvas.toDataURL('image/png'), mimeType: 'image/png' });
                }
            } else if (backgroundImageElement) {
                 onCompositeUpdate({ base64: backgroundImageElement.src, mimeType: background?.mimeType || 'image/png' });
            }
        }, 200);

        const draw = () => {
            const container = containerRef.current;
            if (!container || !canvas || !backgroundImageElement || !ctx) return;
            
            // --- Aspect Ratio Correction ---
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const imgAspectRatio = backgroundImageElement.naturalWidth / backgroundImageElement.naturalHeight;
            const containerAspectRatio = containerWidth / containerHeight;
            
            let targetCanvasWidth, targetCanvasHeight;
            if (imgAspectRatio > containerAspectRatio) {
                targetCanvasWidth = containerWidth;
                targetCanvasHeight = containerWidth / imgAspectRatio;
            } else {
                targetCanvasHeight = containerHeight;
                targetCanvasWidth = containerHeight * imgAspectRatio;
            }
            if (canvas.width !== targetCanvasWidth) canvas.width = targetCanvasWidth;
            if (canvas.height !== targetCanvasHeight) canvas.height = targetCanvasHeight;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(viewTransform.offsetX, viewTransform.offsetY);
            ctx.scale(viewTransform.scale, viewTransform.scale);
            ctx.drawImage(backgroundImageElement, 0, 0, canvas.width, canvas.height);
            
            if (showResult && generatedImageElement) {
                ctx.drawImage(generatedImageElement, 0, 0, canvas.width, canvas.height);
            } else if (designImageElement && corners) {
                ctx.save();
                ctx.globalAlpha = opacity;
                drawPerspectiveImage(ctx, designImageElement, corners);
                ctx.restore();

                // Draw handles and bounding box
                const handleSize = 8 / viewTransform.scale;
                const halfHandle = handleSize / 2;

                if (transformMode === 'transform') {
                    ctx.beginPath();
                    ctx.moveTo(corners.tl.x, corners.tl.y);
                    ctx.lineTo(corners.tr.x, corners.tr.y);
                    ctx.lineTo(corners.br.x, corners.br.y);
                    ctx.lineTo(corners.bl.x, corners.bl.y);
                    ctx.closePath();
                    ctx.strokeStyle = '#F97316';
                    ctx.lineWidth = 1 / viewTransform.scale;
                    ctx.stroke();
                    
                    const midpoints = getMidpoints(corners);
                    // FIX: Explicitly type `p` as `Point` to resolve TypeScript error where it's inferred as `unknown`.
                    Object.values(midpoints).forEach((p: Point) => ctx.strokeRect(p.x - halfHandle, p.y - halfHandle, handleSize, handleSize));
                    
                    // Rotation handle
                    const rotationHandleYOffset = 30 / viewTransform.scale;
                    ctx.beginPath();
                    ctx.moveTo(midpoints.t.x, midpoints.t.y);
                    ctx.lineTo(midpoints.t.x, midpoints.t.y - rotationHandleYOffset);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(midpoints.t.x, midpoints.t.y - rotationHandleYOffset, handleSize / 2, 0, 2 * Math.PI);
                    ctx.fillStyle = '#F97316';
                    ctx.fill();
                }

                // FIX: Explicitly type `corner` as `Point` to resolve TypeScript error where it's inferred as `unknown`.
                Object.values(corners).forEach((corner: Point) => {
                    ctx.fillStyle = '#F97316';
                    ctx.fillRect(corner.x - halfHandle, corner.y - halfHandle, handleSize, handleSize);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1.5 / viewTransform.scale;
                    ctx.strokeRect(corner.x - halfHandle, corner.y - halfHandle, handleSize, handleSize);
                });
            }
            ctx.restore();
        };

        const animationFrame = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(animationFrame); clearTimeout(updateComposite); }
    }, [background, backgroundImageElement, designImageElement, generatedImageElement, corners, opacity, viewTransform, onCompositeUpdate, showResult, transformMode]);

    const getMousePos = (e: PointerEvent | WheelEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - viewTransform.offsetX) / viewTransform.scale,
            y: (e.clientY - rect.top - viewTransform.offsetY) / viewTransform.scale,
        };
    };

    const isInside = (point: Point, vs: Point[]) => {
        const { x, y } = point; let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i].x, yi = vs[i].y; const xj = vs[j].x, yj = vs[j].y;
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
        } return inside;
    };
    
    const handleFlip = (direction: 'horizontal' | 'vertical') => {
        if (!corners) return;
        if (direction === 'horizontal') {
            onCornersChange({ tl: corners.tr, tr: corners.tl, bl: corners.br, br: corners.bl });
        } else {
            onCornersChange({ tl: corners.bl, bl: corners.tl, tr: corners.br, br: corners.tr });
        }
    };

    const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
        if (e.altKey) { 
            setDragState({ type: 'pan', startX: e.clientX - viewTransform.offsetX, startY: e.clientY - viewTransform.offsetY }); 
            return; 
        }
        if (!corners) return;

        const mousePos = getMousePos(e);
        const handleThreshold = 12 / viewTransform.scale;
        
        // Check handles based on mode
        if (transformMode === 'transform') {
            const midpoints = getMidpoints(corners);
            const rotationHandlePos = { x: midpoints.t.x, y: midpoints.t.y - 30 / viewTransform.scale };
            if (Math.hypot(mousePos.x - rotationHandlePos.x, mousePos.y - rotationHandlePos.y) < handleThreshold) {
                setDragState({ type: 'rotate', initialCorners: corners, center: getCenter(corners), startMouse: mousePos }); 
                return;
            }

            const edgeHandles: ('scale-t' | 'scale-b' | 'scale-l' | 'scale-r')[] = ['scale-t', 'scale-b', 'scale-l', 'scale-r'];
            const midpointKeys: ('t' | 'b' | 'l' | 'r')[] = ['t', 'b', 'l', 'r'];
            for(let i=0; i<midpointKeys.length; i++) {
                const handle = edgeHandles[i];
                const midpoint = midpoints[midpointKeys[i]];
                if (Math.hypot(mousePos.x - midpoint.x, mousePos.y - midpoint.y) < handleThreshold) {
                    setDragState({ type: 'scale-edge', handle, startMouse: mousePos, initialCorners: corners });
                    return;
                }
            }
        }

        const cornerKeys = Object.keys(corners) as (keyof Corners)[];
        for (const key of cornerKeys) {
            const corner = corners[key];
            if (Math.hypot(mousePos.x - corner.x, mousePos.y - corner.y) < handleThreshold) {
                if (transformMode === 'transform') {
                    const pivotKey = { tl: 'br', tr: 'bl', bl: 'tr', br: 'tl' }[key] as keyof Corners;
                    setDragState({ type: 'scale-corner', handle: key, pivot: corners[pivotKey], startMouse: mousePos, initialCorners: corners });
                } else {
                    setDragState({ type: 'perspective', handle: key, startMouse: mousePos, initialCorners: corners });
                }
                return;
            }
        }
        
        if (isInside(mousePos, Object.values(corners))) {
            setDragState({ type: 'image', startMouse: mousePos, initialCorners: corners });
        }
    };
    
const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!dragState) return;

    const mousePos = getMousePos(e);

    switch (dragState.type) {
        case 'pan':
            setViewTransform(prev => ({ ...prev, offsetX: e.clientX - dragState.startX, offsetY: e.clientY - dragState.startY }));
            return;
        case 'image': {
            const dx = mousePos.x - dragState.startMouse.x;
            const dy = mousePos.y - dragState.startMouse.y;
            onCornersChange({
                tl: { x: dragState.initialCorners.tl.x + dx, y: dragState.initialCorners.tl.y + dy },
                tr: { x: dragState.initialCorners.tr.x + dx, y: dragState.initialCorners.tr.y + dy },
                bl: { x: dragState.initialCorners.bl.x + dx, y: dragState.initialCorners.bl.y + dy },
                br: { x: dragState.initialCorners.br.x + dx, y: dragState.initialCorners.br.y + dy },
            });
            break;
        }
        case 'perspective': {
            const dx = mousePos.x - dragState.startMouse.x;
            const dy = mousePos.y - dragState.startMouse.y;
            onCornersChange({ ...dragState.initialCorners, [dragState.handle]: { x: dragState.initialCorners[dragState.handle].x + dx, y: dragState.initialCorners[dragState.handle].y + dy } });
            break;
        }
        case 'scale-corner': {
            const originalDist = Math.hypot(dragState.startMouse.x - dragState.pivot.x, dragState.startMouse.y - dragState.pivot.y);
            if (originalDist < 1) break;
            const newDist = Math.hypot(mousePos.x - dragState.pivot.x, mousePos.y - dragState.pivot.y);
            const scale = newDist / originalDist;
            onCornersChange({
                tl: { x: dragState.pivot.x + (dragState.initialCorners.tl.x - dragState.pivot.x) * scale, y: dragState.pivot.y + (dragState.initialCorners.tl.y - dragState.pivot.y) * scale },
                tr: { x: dragState.pivot.x + (dragState.initialCorners.tr.x - dragState.pivot.x) * scale, y: dragState.pivot.y + (dragState.initialCorners.tr.y - dragState.pivot.y) * scale },
                bl: { x: dragState.pivot.x + (dragState.initialCorners.bl.x - dragState.pivot.x) * scale, y: dragState.pivot.y + (dragState.initialCorners.bl.y - dragState.pivot.y) * scale },
                br: { x: dragState.pivot.x + (dragState.initialCorners.br.x - dragState.pivot.x) * scale, y: dragState.pivot.y + (dragState.initialCorners.br.y - dragState.pivot.y) * scale },
            });
            break;
        }
        case 'rotate': {
            const startAngle = Math.atan2(dragState.startMouse.y - dragState.center.y, dragState.startMouse.x - dragState.center.x);
            const currentAngle = Math.atan2(mousePos.y - dragState.center.y, mousePos.x - dragState.center.x);
            const angle = currentAngle - startAngle;
            onCornersChange({
                tl: rotatePoint(dragState.initialCorners.tl, dragState.center, angle),
                tr: rotatePoint(dragState.initialCorners.tr, dragState.center, angle),
                bl: rotatePoint(dragState.initialCorners.bl, dragState.center, angle),
                br: rotatePoint(dragState.initialCorners.br, dragState.center, angle),
            });
            break;
        }
        case 'scale-edge': {
            const dx = mousePos.x - dragState.startMouse.x;
            const dy = mousePos.y - dragState.startMouse.y;
            switch (dragState.handle) {
                case 'scale-t':
                    onCornersChange({
                        ...dragState.initialCorners,
                        tl: { x: dragState.initialCorners.tl.x, y: dragState.initialCorners.tl.y + dy },
                        tr: { x: dragState.initialCorners.tr.x, y: dragState.initialCorners.tr.y + dy },
                    });
                    break;
                case 'scale-b':
                    onCornersChange({
                        ...dragState.initialCorners,
                        bl: { x: dragState.initialCorners.bl.x, y: dragState.initialCorners.bl.y + dy },
                        br: { x: dragState.initialCorners.br.x, y: dragState.initialCorners.br.y + dy },
                    });
                    break;
                case 'scale-l':
                    onCornersChange({
                        ...dragState.initialCorners,
                        tl: { x: dragState.initialCorners.tl.x + dx, y: dragState.initialCorners.tl.y },
                        bl: { x: dragState.initialCorners.bl.x + dx, y: dragState.initialCorners.bl.y },
                    });
                    break;
                case 'scale-r':
                    onCornersChange({
                        ...dragState.initialCorners,
                        tr: { x: dragState.initialCorners.tr.x + dx, y: dragState.initialCorners.tr.y },
                        br: { x: dragState.initialCorners.br.x + dx, y: dragState.initialCorners.br.y },
                    });
                    break;
            }
            break;
        }
    }
};

    const handlePointerUp = () => { setDragState(null); };

    const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.1, viewTransform.scale + scaleAmount), 10);
        const rect = e.currentTarget.getBoundingClientRect();
        const mousePos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        const newOffsetX = mousePos.x - (mousePos.x - viewTransform.offsetX) * (newScale / viewTransform.scale);
        const newOffsetY = mousePos.y - (mousePos.y - viewTransform.offsetY) * (newScale / viewTransform.scale);
        setViewTransform({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    };

    const handleZoom = (direction: number) => {
        const scaleAmount = direction * 0.2;
        const newScale = Math.min(Math.max(0.1, viewTransform.scale + scaleAmount), 10);
        const canvas = canvasRef.current; if (!canvas) return; const rect = canvas.getBoundingClientRect();
        const center = {x: rect.width / 2, y: rect.height / 2};
        const newOffsetX = center.x - (center.x - viewTransform.offsetX) * (newScale / viewTransform.scale);
        const newOffsetY = center.y - (center.y - viewTransform.offsetY) * (newScale / viewTransform.scale);
        setViewTransform({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    }

    return (
        <div style={styles.editorLayout}>
            <aside style={styles.sidebar}>
                <div style={styles.sidebarSection}>
                    <h3 style={styles.sidebarTitle}>Lớp ảnh (Layers)</h3>
                    <LayerUploader onImageUpload={onBackgroundChange} currentImage={background} icon={<ImageIcon style={{ color: '#9CA3AF' }} />} label="Ảnh nền" isRemovable={false}/>
                    <LayerUploader onImageUpload={onDesignChange} currentImage={design} icon={<ObjectIcon style={{ color: '#9CA3AF' }}/>} label="Ảnh thiết kế" />
                </div>
                 {design && (
                    <>
                        <div style={styles.sidebarSection}>
                            <h3 style={styles.sidebarTitle}>Công cụ</h3>
                            <div style={styles.toolSelector}>
                                <button 
                                    onClick={() => setTransformMode('transform')} 
                                    style={transformMode === 'transform' ? {...styles.toolButton, ...styles.activeToolButton} : styles.toolButton}
                                    title="Co giãn & Xoay"
                                >
                                    <TransformIcon/>
                                    <span>Biến đổi</span>
                                </button>
                                <button 
                                    onClick={() => setTransformMode('perspective')} 
                                    style={transformMode === 'perspective' ? {...styles.toolButton, ...styles.activeToolButton} : styles.toolButton}
                                    title="Phối cảnh"
                                >
                                    <PerspectiveIcon/>
                                    <span>Phối cảnh</span>
                                </button>
                            </div>
                             <div style={styles.transformActions}>
                                <button onClick={() => handleFlip('horizontal')} style={styles.actionButton}><FlipHorizontalIcon style={{width: 16, height: 16}}/><span>Lật ngang</span></button>
                                <button onClick={() => handleFlip('vertical')} style={styles.actionButton}><FlipVerticalIcon style={{width: 16, height: 16}}/><span>Lật dọc</span></button>
                            </div>
                        </div>

                        <div style={styles.sidebarSection}>
                             <h3 style={styles.sidebarTitle}>Thuộc tính</h3>
                            <div style={styles.opacityControl}>
                                <label htmlFor="opacity-slider" style={{fontSize: '0.9rem', color: '#D1D5DB'}}>Độ mờ:</label>
                                <input id="opacity-slider" type="range" min="0" max="1" step="0.01" value={opacity} onChange={e => setOpacity(Number(e.target.value))} style={{flex: 1}} />
                                <span style={{width: '35px', textAlign: 'right', fontSize: '0.9rem', color: '#D1D5DB'}}>{Math.round(opacity * 100)}%</span>
                            </div>
                        </div>
                    </>
                )}
            </aside>
            
            <main ref={containerRef} style={styles.canvasContainer}>
                {!background && <div style={styles.canvasPlaceholder}><p>Tải lên ảnh nền để bắt đầu</p></div>}
                <canvas 
                    ref={canvasRef}
                    style={{...styles.canvas, visibility: background ? 'visible' : 'hidden', cursor: dragState?.type === 'pan' ? 'grabbing' : (dragState ? 'crosshair' : 'default')}}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onWheel={handleWheel}
                />
                 <div style={styles.canvasControls}>
                    <button onClick={() => handleZoom(1)} title="Phóng to" style={styles.controlButton}><ZoomInIcon /></button>
                    <button onClick={() => handleZoom(-1)} title="Thu nhỏ" style={styles.controlButton}><ZoomOutIcon /></button>
                    {generatedImageElement && (
                        <button onClick={() => setShowResult(s => !s)} style={showResult ? {...styles.controlButton, ...styles.activeControlButton} : styles.controlButton}>Xem so sánh</button>
                    )}
                 </div>
            </main>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    editorLayout: { display: 'flex', gap: '1.5rem', width: '100%', height: '100%' },
    sidebar: { width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    sidebarSection: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    sidebarTitle: { fontSize: '1rem', fontWeight: 500, color: '#D1D5DB', margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid #374151' },
    layerUploader: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', backgroundColor: '#1F2937', borderRadius: '0.5rem', border: '1px solid #4B5563', cursor: 'pointer', transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s', position: 'relative', outline: 'none' },
    layerUploaderDragging: { borderColor: '#F97316', backgroundColor: '#374151' },
    layerUploaderFocused: {
        borderColor: '#F97316',
        boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.4)',
    },
    layerThumbnail: { width: '50px', height: '50px', borderRadius: '0.25rem', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' },
    thumbnail: { width: '100%', height: '100%', objectFit: 'contain' },
    layerLabel: { flex: 1, color: '#E5E7EB', fontWeight: 500, fontSize: '0.9rem' },
    layerButtons: { display: 'flex', gap: '0.25rem' },
    layerActionButton: { background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background-color 0.2s' },
    canvasContainer: { width: '100%', flex: 1, backgroundColor: '#1F2937', borderRadius: '0.75rem', position: 'relative', border: '1px solid #4B5563', overflow: 'hidden', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    canvas: { display: 'block', maxWidth: '100%', maxHeight: '100%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)' },
    canvasPlaceholder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', textAlign: 'center' },
    opacityControl: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#1F2937', borderRadius: '0.5rem', border: '1px solid #4B5563' },
    canvasControls: { position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(31, 41, 55, 0.8)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #4B5563' },
    controlButton: { background: 'transparent', border: 'none', color: '#D1D5DB', padding: '0.5rem', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s, color 0.2s' },
    activeControlButton: { backgroundColor: '#F97316', color: 'white' },
    toolSelector: { display: 'flex', gap: '0.5rem', backgroundColor: '#111827', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #4B5563' },
    toolButton: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', background: 'transparent', border: 'none', color: '#9CA3AF', borderRadius: '0.375rem', cursor: 'pointer', transition: 'background-color 0.2s, color 0.2s', fontSize: '0.9rem' },
    activeToolButton: { backgroundColor: '#F97316', color: 'white' },
    transformActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
    actionButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', background: '#374151', border: '1px solid #4B5563', color: '#D1D5DB', borderRadius: '0.375rem', cursor: 'pointer', transition: 'background-color 0.2s', fontSize: '0.9rem' },
    dimensionBadge: {
        position: 'absolute',
        bottom: '4px',
        left: '4px',
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        color: '#D1D5DB',
        padding: '1px 4px',
        borderRadius: '3px',
        fontSize: '0.65rem',
        fontFamily: 'monospace',
        zIndex: 1,
    },
    layerReplaceOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        borderRadius: '0.5rem',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        pointerEvents: 'none',
    },
};
