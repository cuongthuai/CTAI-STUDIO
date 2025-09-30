import React, { useState, useRef } from 'react';
import { SourceImage, ResultItem } from '../types';
import { generateVideo, getVideosOperation } from '../services/geminiService';
import { Wand2, Loader2, UploadIcon, Camera as CameraIcon, SaveIcon, LibraryIcon } from './icons';

interface VideoModeViewProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setResults: (results: ResultItem[]) => void;
  openCamera: (onCapture: (capturedImage: { base64: string; mimeType: string; }) => void) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSavePrompt: () => void;
  onOpenLibrary: () => void;
}

// Helper to poll for video operation status
const pollOperation = async (operation: any, updateMessage: (msg: string) => void): Promise<any> => {
    let currentOperation = operation;
    const messages = [
        "Đang khởi tạo tác vụ video...",
        "Máy chủ đang làm nóng...",
        "Đang render các khung hình đầu tiên...",
        "AI đang sáng tạo...",
        "Sắp xếp các phân cảnh...",
        "Thêm các chi tiết cuối cùng...",
        "Gần xong rồi, chờ một chút nhé!"
    ];
    let messageIndex = 0;
    
    updateMessage(messages[messageIndex]);

    while (!currentOperation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        
        messageIndex = (messageIndex + 1) % messages.length;
        updateMessage(messages[messageIndex]);

        currentOperation = await getVideosOperation(currentOperation);
    }
    return currentOperation;
};


export const VideoModeView: React.FC<VideoModeViewProps> = ({ isLoading, setIsLoading, setError, setResults, openCamera, prompt, setPrompt, onSavePrompt, onOpenLibrary }) => {
    const [inputImage, setInputImage] = useState<SourceImage | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
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
                setInputImage({ base64: base64Data, mimeType: mimeHeader.split(':')[1] });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraCapture = (capturedImage: { base64: string; mimeType: string; }) => {
        setInputImage(capturedImage);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Vui lòng nhập mô tả cho video.");
            return;
        }

        setIsLoading(true);
        setError('');
        setResults([]);

        try {
            const initialOperation = await generateVideo(prompt, inputImage);
            const finalOperation = await pollOperation(initialOperation, setLoadingMessage);

            if (finalOperation.error) {
                throw new Error(finalOperation.error.message || 'Video generation failed.');
            }

            const videoUri = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
            if (videoUri) {
                 // The URI requires the API key to be appended for access.
                 // We will pass this to the parent to handle fetching.
                setResults([{ type: 'video', url: videoUri, originalUrl: videoUri }]);
            } else {
                throw new Error('Không tìm thấy video URI trong phản hồi.');
            }

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Đã xảy ra lỗi không xác định khi tạo video.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-lg font-medium mb-3 text-gray-300 uppercase">1. Ảnh đầu vào (Tùy chọn)</label>
                <div className="flex gap-4">
                    <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="sr-only" disabled={isLoading} />
                    <div
                        onClick={() => !isLoading && fileInputRef.current?.click()}
                        className={`flex-grow h-40 rounded-xl border-2 border-dashed transition duration-300 flex items-center justify-center relative overflow-hidden bg-gray-700 
                        ${inputImage ? 'border-green-500 p-0' : 'border-gray-500 hover:border-blue-400 p-4'}
                        ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {inputImage ? (
                            <img src={`data:${inputImage.mimeType};base64,${inputImage.base64}`} alt="Input Preview" className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-center text-gray-400">
                                <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                                <p className="font-semibold">Nhấn để tải ảnh lên</p>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => openCamera(handleCameraCapture)}
                        disabled={isLoading}
                        className="h-40 w-40 rounded-xl border-2 border-dashed border-gray-500 hover:border-blue-400 bg-gray-700 flex flex-col items-center justify-center text-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CameraIcon className="w-8 h-8 mb-2" />
                        <span>Dùng Camera</span>
                    </button>
                </div>
                 {inputImage && <button onClick={() => setInputImage(null)} disabled={isLoading} className="mt-2 text-sm text-red-400 hover:text-red-300 disabled:opacity-50">Xóa ảnh</button>}
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor="video-prompt-input" className="block text-lg font-medium text-gray-300 uppercase">2. Mô tả video</label>
                    <div className="flex items-center gap-2">
                        <button onClick={onOpenLibrary} disabled={isLoading} className="p-2 rounded-md font-semibold text-sm transition duration-300 ease-in-out bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-50" title="Mở thư viện prompt"><LibraryIcon /></button>
                        <button onClick={() => onSavePrompt()} disabled={isLoading || !prompt.trim()} className="p-2 rounded-md font-semibold text-sm transition duration-300 ease-in-out bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-50" title="Lưu prompt"><SaveIcon /></button>
                    </div>
                </div>
                <textarea
                    id="video-prompt-input"
                    rows={5}
                    className="prompt-input w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Mô tả video bạn muốn tạo, ví dụ: 'Một con mèo ba tư đang lướt ván trên đại dương, phong cách điện ảnh'..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                ></textarea>
            </div>
            
            <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-300 ease-in-out flex items-center justify-center
                    ${isLoading || !prompt.trim()
                    ? 'bg-blue-600/70 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50'
                    }`}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        <span>{loadingMessage || 'ĐANG TẠO VIDEO...'}</span>
                    </>
                ) : (
                    <><Wand2 className="w-5 h-5 mr-2" />Tạo Video</>
                )}
            </button>
        </div>
    );
};