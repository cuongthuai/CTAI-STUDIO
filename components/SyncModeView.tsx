import React, { useState, useRef } from 'react';
import { SourceImage, ResultItem } from '../types';
import { UploadIcon, Camera as CameraIcon, Wand2, Loader2, FileText } from './icons';

interface SyncModeViewProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setResults: (results: ResultItem[]) => void;
  openCamera: (onCapture: (capturedImage: { base64: string; mimeType: string; }) => void) => void;
  executeGeneration: (
    finalPrompt: string,
    sourceImage: { base64: string, mimeType: string },
    maskImage: { base64: string, mimeType: string } | null,
    backgroundImage?: SourceImage | null
  ) => Promise<string | null>;
}

const ImageSlot: React.FC<{
    image: SourceImage | null;
    onImageChange: (image: SourceImage | null) => void;
    onCameraClick: () => void;
    index: number;
}> = ({ image, onImageChange, onCameraClick, index }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
                alert('Please select a valid image file (PNG, JPG, etc.) under 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                const [mimeHeader, base64Data] = dataUrl.split(';base64,');
                onImageChange({ base64: base64Data, mimeType: mimeHeader.split(':')[1] });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-2">
            <label className="text-center font-medium text-gray-300">Ảnh {index + 1}</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="sr-only" />
            <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-40 rounded-xl border-2 border-dashed transition duration-300 flex items-center justify-center relative overflow-hidden bg-gray-700 cursor-pointer
                ${image ? 'border-green-500 p-0' : 'border-gray-500 hover:border-blue-400 p-4'}`}
            >
                {image ? (
                    <img src={`data:${image.mimeType};base64,${image.base64}`} alt={`Input ${index + 1}`} className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-gray-400">
                        <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <button onClick={onCameraClick} className="flex-1 py-2 px-2 rounded-md font-semibold text-xs transition bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center gap-1">
                    <CameraIcon className="w-4 h-4" /> Camera
                </button>
                 {image && <button onClick={() => onImageChange(null)} className="flex-1 py-2 px-2 rounded-md font-semibold text-xs transition bg-red-600 hover:bg-red-500 text-white">Xóa</button>}
            </div>
        </div>
    );
};


export const SyncModeView: React.FC<SyncModeViewProps> = ({ isLoading, setIsLoading, setError, setResults, openCamera, executeGeneration }) => {
    const [images, setImages] = useState<(SourceImage | null)[]>([null, null, null]);
    const [prompt, setPrompt] = useState('');

    const handleImageChange = (index: number, image: SourceImage | null) => {
        const newImages = [...images];
        newImages[index] = image;
        setImages(newImages);
    };

    const handleGenerate = async () => {
        const validImages = images.filter((img): img is SourceImage => img !== null);
        if (validImages.length === 0) {
            setError("Vui lòng tải lên ít nhất một ảnh.");
            return;
        }
        if (!prompt.trim()) {
            setError("Vui lòng nhập mô tả chung.");
            return;
        }

        setIsLoading(true);
        setError('');
        setResults([]);

        const generationTasks = validImages.map(img => executeGeneration(prompt, img, null));

        try {
            const results = await Promise.all(generationTasks);
            const successfulResults = results
                .map((url, i) => (url ? { 
                    type: 'image' as const, 
                    url, 
                    sourceImage: `data:${validImages[i].mimeType};base64,${validImages[i].base64}` 
                } : null))
                // FIX: Removed incorrect type predicate `item is ResultItem` which caused a type error.
                // TypeScript can correctly infer the non-null type after filtering.
                .filter((item) => item !== null);
            
            if (successfulResults.length === 0) {
                setError('Không thể tạo bất kỳ ảnh nào. Vui lòng thử lại.');
            }
            setResults(successfulResults);

        } catch(e: any) {
            setError(e.message || "An error occurred during generation.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-lg font-medium mb-3 text-gray-300 uppercase">1. Các ảnh đầu vào</label>
                <div className="flex flex-col md:flex-row gap-4">
                    {images.map((img, i) => (
                        <ImageSlot 
                            key={i}
                            index={i}
                            image={img}
                            onImageChange={(newImg) => handleImageChange(i, newImg)}
                            onCameraClick={() => openCamera((capImg) => handleImageChange(i, capImg))}
                        />
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor="sync-prompt-input" className="block text-lg font-medium mb-2 text-gray-300 flex items-center uppercase">
                    <FileText className="w-5 h-5 mr-2" /> 2. Mô tả chung
                </label>
                <textarea
                    id="sync-prompt-input"
                    rows={5}
                    className="prompt-input w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Mô tả này sẽ được áp dụng cho tất cả các ảnh đầu vào..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                ></textarea>
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading || images.every(img => img === null) || !prompt.trim()}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-300 ease-in-out flex items-center justify-center
                    ${isLoading || images.every(img => img === null) || !prompt.trim()
                    ? 'bg-blue-600/70 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50'
                    }`}
                >
                {isLoading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />ĐANG ĐỒNG BỘ...</>) : (<><Wand2 className="w-5 h-5 mr-2" />3. Đồng bộ các ảnh</>)}
            </button>
        </div>
    );
};