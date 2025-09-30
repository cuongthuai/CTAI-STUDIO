

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Path, SourceImage, ResultItem, HistoryEntry, SavedPrompt } from './types'; 
import { InpaintEditorModal } from './components/InpaintEditorModal';
import {
    Wand2, Download, Loader2, Sparkles, AlertTriangle, Image, FileText, Home, Lamp,
    Cloud, Sun, Clock, Zap, Lock, LogIn, Maximize, Camera, CompareIcon, VideoIcon,
    MessageSquareIcon, LikeIcon, UnlikeIcon, UploadIcon, SaveIcon, LibraryIcon
} from './components/icons';
import { Slider } from './Slider';
import { BlendingModeView } from './BlendingModeView';
import { RestoreModeView } from './components/RestoreModeView';
import { NumberStepper } from './components/NumberStepper';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { VideoModeView } from './components/VideoModeView';
import { annotateImage, suggestPrompt } from './services/geminiService';
import { ImageModal } from './components/ImageModal';
import { SavePromptModal } from './components/SavePromptModal';
import { PromptLibraryModal } from './components/PromptLibraryModal';

const MAX_RETRIES = 5;

// Định nghĩa các hằng số đăng nhập
const AUTH_USERNAME = 'CTAI';
const AUTH_PASSWORD = 'manhcuong';

type AppMode = 'generate' | 'blend' | 'restore' | 'video';

// Định nghĩa các phong cách
const ARCHITECTURE_STYLES = [
  { name: 'Không', value: '' },
  { name: 'Tân Cổ Điển', value: 'Neoclassical architectural style' },
  { name: 'Hiện Đại', value: 'Modern architectural style' },
  { name: 'Indochina', value: 'Indochina architectural style' },
];

const INTERIOR_STYLES = [
  { name: 'Không', value: '' },
  { name: 'Hiện Đại', value: 'Modern interior design' },
  { name: 'Indochina', value: 'Indochina interior design' },
  { name: 'Tân Cổ Điển', value: 'Neoclassical interior design' },
];

const CONTEXT_STYLES = [
  { name: 'Không', value: '' },
  { name: 'Thành thị', value: 'Urban cityscape setting' },
  { name: 'Nông thôn', value: 'Rural countryside setting' },
  { name: 'Trên núi', value: 'Mountainous landscape setting' },
];

const WEATHER_STYLES = [
  { name: 'Không', value: '' },
  { name: 'Mùa hè (Nắng ấm)', value: 'Sunny summer day' },
  { name: 'Mùa thu (Lá vàng)', value: 'Autumn with golden foliage' },
  { name: 'Mùa xuân (Mưa nhẹ)', value: 'Mild spring with light rain' },
  { name: 'Mùa đông (Tuyết)', value: 'Snowy winter scene' },
];

const TIME_STYLES = [
  { name: 'Không', value: '' },
  { name: 'Buổi sáng', value: 'Soft morning light' },
  { name: 'Buổi chiều', value: 'Golden hour sunset light' },
  { name: 'Buổi tối', value: 'Dramatic night lighting' },
];

const VIEW_ANGLE_STYLES = [
  { name: 'Không', value: '' },
  { name: 'Chính diện', value: 'Front view, eye-level shot' },
  { name: 'Từ trên xuống', value: 'High-angle shot, bird\'s-eye view' },
  { name: 'Góc 3/4 phải', value: '3/4 view from the right' },
  { name: 'Góc 3/4 trái', value: '3/4 view from the left' },
];


/**
 * Hàm tiện ích để chuyển đổi từ base64 sang ArrayBuffer (dùng cho việc tải xuống ảnh)
 */
const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Component Màn hình Đăng nhập
 */
const LoginComponent: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
            onLoginSuccess();
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không đúng.');
            setPassword('');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 font-sans p-4">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl border border-blue-700">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-400 flex items-center justify-center">
                    <Lock className="w-6 h-6 mr-2" />
                    
                    CTAI STUDIO
                </h2>
                {error && (
                    <div className="p-3 mb-4 bg-red-800 border border-red-600 text-red-100 rounded-lg flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Tên đăng nhập</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nhập tên đăng nhập"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nhập mật khẩu"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition duration-300 flex items-center justify-center shadow-lg shadow-blue-500/50"
                    >
                        <LogIn className="w-5 h-5 mr-2" />
                        Đăng Nhập
                    </button>
                </form>
            </div>
        </div>
    );
};

// Create a promise for the AI instance so we can await it
const initializeAi = async (): Promise<GoogleGenAI> => {
    if (!window.electronAPI) {
        throw new Error("Electron API not found. This app must be run in Electron.");
    }
    const apiKey = await window.electronAPI.getApiKey();
    if (!apiKey) {
        throw new Error("API_KEY could not be retrieved. Ensure it is set in the environment where you run the app.");
    }
    return new GoogleGenAI({ apiKey });
};
const aiPromise = initializeAi();

const ImageSlot: React.FC<{
    image: SourceImage | null;
    onImageChange: (image: SourceImage | null) => void;
    onCameraClick: () => void;
    disabled: boolean;
}> = ({ image, onImageChange, onCameraClick, disabled }) => {
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
            <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="sr-only" disabled={disabled} />
            <div
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`w-full h-40 rounded-xl border-2 border-dashed transition duration-300 flex items-center justify-center relative overflow-hidden bg-gray-700
                ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                ${image ? 'border-green-500 p-0' : 'border-gray-500 hover:border-blue-400 p-4'}`}
            >
                {image ? (
                    <img src={`data:${image.mimeType};base64,${image.base64}`} alt={`Input`} className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-gray-400">
                        <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                {/* FIX: The onClick handler should call the onCameraClick prop inside an arrow function to prevent passing the event object and ensure the function is called with the correct number of arguments. */}
                <button onClick={() => onCameraClick()} disabled={disabled} className="flex-1 py-2 px-2 rounded-md font-semibold text-xs transition bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Camera className="w-4 h-4" /> Camera
                </button>
                 {image && <button onClick={() => onImageChange(null)} disabled={disabled} className="flex-1 py-2 px-2 rounded-md font-semibold text-xs transition bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed">Xóa</button>}
            </div>
        </div>
    );
};


/**
 * Component chính của Ứng dụng Tạo Ảnh
 */
const ImageGeneratorApp = () => {
  const [mode, setMode] = useState<AppMode>('generate');
  
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscalingIndex, setUpscalingIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [inputImages, setInputImages] = useState<(SourceImage | null)[]>([null, null]);

  const [architectureStyle, setArchitectureStyle] = useState('');
  const [interiorStyle, setInteriorStyle] = useState('');
  const [contextStyle, setContextStyle] = useState('');
  const [weatherStyle, setWeatherStyle] = useState('');
  const [timeStyle, setTimeStyle] = useState('');
  const [viewAngle, setViewAngle] = useState('');

  const [creativity, setCreativity] = useState(50);
  const [numberOfImages, setNumberOfImages] = useState(1); 
  const [syncAngles, setSyncAngles] = useState(false);
  const [itemToRestore, setItemToRestore] = useState<HistoryEntry | null>(null);

  // State for auto prompt suggestion
  const [isSuggestingPrompt, setIsSuggestingPrompt] = useState(false);
  
  // Advanced Adjustments State
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  const [vignette, setVignette] = useState(0);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const cameraCaptureCallbackRef = useRef<(capturedImage: { base64: string; mimeType: string; }) => void>();
  
  // Comparison Modal State
  const [comparisonImages, setComparisonImages] = useState<{ before: string; after: string } | null>(null);

  // Prompt Library State
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isSavePromptModalOpen, setIsSavePromptModalOpen] = useState(false);
  const [promptToSave, setPromptToSave] = useState('');

  // Load prompts from local storage on initial render
  useEffect(() => {
    try {
        const storedPrompts = localStorage.getItem('ctai-studio-prompts');
        if (storedPrompts) {
            setSavedPrompts(JSON.parse(storedPrompts));
        }
    } catch (e) {
        console.error("Failed to load prompts from local storage:", e);
    }
  }, []);

  // Save prompts to local storage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem('ctai-studio-prompts', JSON.stringify(savedPrompts));
    } catch (e) {
        console.error("Failed to save prompts to local storage:", e);
    }
  }, [savedPrompts]);

  useEffect(() => {
    const fetchVideo = async () => {
        const videoResult = results.find(r => r.type === 'video' && r.url === r.originalUrl);
        if (videoResult && videoResult.originalUrl) {
            try {
                const apiKey = await window.electronAPI.getApiKey();
                if (!apiKey) throw new Error("API key not available for fetching video.");

                const response = await fetch(`${videoResult.originalUrl}&key=${apiKey}`);
                if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
                
                const videoBlob = await response.blob();
                const blobUrl = URL.createObjectURL(videoBlob);

                setResults(prevResults => prevResults.map(r => 
                    r.originalUrl === videoResult.originalUrl ? { ...r, url: blobUrl } : r
                ));
            } catch (e: any) {
                console.error("Error fetching video blob:", e);
                setError(e.message);
            }
        }
    };
    fetchVideo();
  }, [results]);


  const getAdjustmentInstruction = useCallback(() => {
    let instructions = [];
    if (brightness > 70) instructions.push("significantly increase brightness");
    else if (brightness > 30) instructions.push("moderately increase brightness");
    else if (brightness > 0) instructions.push("slightly increase brightness");
    else if (brightness < -70) instructions.push("significantly decrease brightness");
    else if (brightness < -30) instructions.push("moderately decrease brightness");
    else if (brightness < 0) instructions.push("slightly decrease brightness");

    if (contrast > 70) instructions.push("dramatic high contrast");
    else if (contrast > 30) instructions.push("high contrast");
    else if (contrast > 0) instructions.push("slightly increased contrast");
    else if (contrast < -70) instructions.push("very low contrast, washed out look");
    else if (contrast < -30) instructions.push("low contrast");
    else if (contrast < 0) instructions.push("slightly decreased contrast");

    if (saturation > 70) instructions.push("extremely vibrant and saturated colors");
    else if (saturation > 30) instructions.push("vibrant, saturated colors");
    else if (saturation > 0) instructions.push("slightly increased color saturation");
    else if (saturation < -70) instructions.push("monochrome or black and white");
    else if (saturation < -30) instructions.push("desaturated colors, muted tones");
    else if (saturation < 0) instructions.push("slightly desaturated colors");

    if (temperature > 70) instructions.push("very warm color temperature, strong orange/yellow cast");
    else if (temperature > 30) instructions.push("warm color temperature, golden tones");
    else if (temperature > 0) instructions.push("slightly warm color temperature");
    else if (temperature < -70) instructions.push("very cool color temperature, strong blue cast");
    else if (temperature < -30) instructions.push("cool color temperature, blueish tones");
    else if (temperature < 0) instructions.push("slightly cool color temperature");

    if (sharpness > 70) instructions.push("extremely sharp, hyper-detailed");
    else if (sharpness > 30) instructions.push("sharp and crisp details");
    else if (sharpness > 0) instructions.push("slightly sharpened details");

    if (vignette > 70) instructions.push("heavy, dark vignette effect on the edges");
    else if (vignette > 30) instructions.push("moderate vignette effect");
    else if (vignette > 0) instructions.push("subtle, light vignette effect");

    if (instructions.length === 0) return "";
    return ` Image adjustments: ${instructions.join(', ')}.`;
  }, [brightness, contrast, saturation, temperature, sharpness, vignette]);
    
  const handleSuggestPrompt = async () => {
    const firstImage = inputImages.find(img => img !== null);
    if (!firstImage) {
      setError("Vui lòng tải ảnh đầu vào trước khi tạo prompt.");
      return;
    }
    setIsSuggestingPrompt(true);
    setError('');
    try {
      const suggested = await suggestPrompt(
        firstImage.base64,
        firstImage.mimeType,
        "Based on this architectural sketch or 3D render, suggest a detailed and creative prompt for an AI image generator to turn it into a photorealistic final image. Describe the architectural style, materials, textures, lighting (e.g., time of day, weather), context (e.g., urban, rural), and overall atmosphere. Make it sound professional and inspiring."
      );
      setPrompt(suggested);
    } catch (e: any) {
      setError(`Lỗi khi tạo prompt: ${e.message}`);
    } finally {
      setIsSuggestingPrompt(false);
    }
  };

  const executeGeneration = useCallback(async (
    finalPrompt: string,
    sourceImage: { base64: string, mimeType: string },
    maskImage: { base64: string, mimeType: string } | null,
    backgroundImage?: SourceImage | null
  ): Promise<string | null> => {
    const sourceData = sourceImage.base64.includes(',') ? sourceImage.base64.split(',')[1] : sourceImage.base64;
    const imagePart = { inlineData: { mimeType: sourceImage.mimeType, data: sourceData } };
    const textPart = { text: finalPrompt };
    const parts: any[] = [textPart, imagePart];

    if (backgroundImage) {
      const backgroundData = backgroundImage.base64.includes(',') ? backgroundImage.base64.split(',')[1] : backgroundImage.base64;
      const backgroundPart = { inlineData: { mimeType: backgroundImage.mimeType, data: backgroundData } };
      parts.push(backgroundPart);
    }
    
    if (maskImage) {
      const maskData = maskImage.base64.includes(',') ? maskImage.base64.split(',')[1] : maskImage.base64;
      const maskPart = { inlineData: { mimeType: maskImage.mimeType, data: maskData } };
      parts.push(maskPart);
    }
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const ai = await aiPromise;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: { parts: parts },
          config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
        });

        let base64Data = null;
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    base64Data = part.inlineData.data;
                    break;
                }
            }
        }

        if (base64Data) {
          return `data:image/png;base64,${base64Data}`;
        } else {
          throw new Error("Không nhận được dữ liệu ảnh hoặc lỗi không xác định từ API.");
        }
      } catch (e: any) {
        console.error(`Lỗi lần thử ${attempt + 1} (Tạo Ảnh):`, e.message);
        if (attempt === MAX_RETRIES - 1) {
            setError(`Lỗi khi tạo ảnh sau ${MAX_RETRIES} lần thử: ${e.message}`);
        }
        else {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    return null;
  }, [setError]);


  const handleGenerateFromGeneratorTab = useCallback(async () => {
    const validImages = inputImages.filter((img): img is SourceImage => img !== null);
    if (!prompt.trim() || validImages.length === 0) {
      setError('Vui lòng tải lên ít nhất một ảnh và đảm bảo mô tả không trống trước khi tạo ảnh.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setResults([]);

    const adjustmentInstruction = getAdjustmentInstruction();
    let basePrompt = prompt.trim() + adjustmentInstruction;

    if (creativity <= 30) {
        basePrompt += " (Tuân thủ nghiêm ngặt mô tả, diễn giải nghệ thuật ở mức độ thấp)";
    } else if (creativity >= 75) {
        basePrompt += " (Tự do nghệ thuật cao, diễn giải mô tả một cách sáng tạo)";
    }
    
    const generationTasks: Promise<{ url: string | null, sourceImage: string }>[] = [];

    for (const validImage of validImages) {
        const source = { base64: validImage.base64, mimeType: validImage.mimeType };
        const sourceDataUrl = `data:${validImage.mimeType};base64,${validImage.base64}`;

        if (syncAngles) {
            const SYNC_ANGLES = [
                { name: 'Chính diện', value: 'Front view, eye-level shot' },
                { name: 'Góc 3/4 phải', value: '3/4 view from the right' },
                { name: 'Từ trên xuống', value: 'High-angle shot, bird\'s-eye view' },
            ];
            for (const angle of SYNC_ANGLES) {
                const finalPrompt = `${basePrompt} The camera perspective is a ${angle.value}.`;
                for (let i = 0; i < numberOfImages; i++) {
                    generationTasks.push(executeGeneration(finalPrompt, source, null).then(url => ({ url, sourceImage: sourceDataUrl })));
                }
            }
        } else {
            const finalPrompt = basePrompt + (viewAngle ? ` The camera perspective is a ${viewAngle}.` : '');
            for (let i = 0; i < numberOfImages; i++) {
                generationTasks.push(executeGeneration(finalPrompt, source, null).then(url => ({ url, sourceImage: sourceDataUrl })));
            }
        }
    }

    const results = await Promise.all(generationTasks);
    const successfulResults: ResultItem[] = results
        .filter((r): r is { url: string; sourceImage: string } => r.url !== null)
        .map(r => ({ type: 'image', url: r.url, sourceImage: r.sourceImage }));
    
    if (successfulResults.length === 0 && !error) {
        setError('Không thể tạo bất kỳ ảnh nào. Vui lòng thử lại.');
    }
    setResults(successfulResults);
    setIsLoading(false);

  }, [prompt, inputImages, creativity, getAdjustmentInstruction, executeGeneration, syncAngles, numberOfImages, viewAngle, error, setResults, setIsLoading, setError]);


  const handleGenerateFromBlendingTab = useCallback(async (
    sourceForGen: SourceImage, 
    _originalSource: SourceImage, 
    _mask: string | null, 
    _options: any
  ) => {
    if (!prompt.trim()) {
      setError('Vui lòng nhập mô tả để ghép ảnh.');
      return;
    }
    let finalPrompt = prompt.trim();
    if (creativity <= 30) {
        finalPrompt += " (blend the images with minimal artistic changes)";
    } else if (creativity >= 75) {
        finalPrompt += " (blend the images with high artistic creativity, reimagining the composition)";
    }
    
    setIsLoading(true);
    setResults([]);
    const tasks = [];
    for (let i = 0; i < numberOfImages; i++) {
        tasks.push(executeGeneration(finalPrompt, sourceForGen, null));
    }
    const results = await Promise.all(tasks);
    setResults(results.filter(r => r).map(url => ({ type: 'image', url: url as string, sourceImage: sourceForGen.base64 })));
    setIsLoading(false);

  }, [prompt, creativity, numberOfImages, executeGeneration, setError, setResults, setIsLoading]);
  

  const handleGenerateFromRestoreTab = useCallback(async (
    sourceImage: SourceImage,
    finalPrompt: string,
    backgroundImage: SourceImage | null,
    syncAngles: boolean,
    numberOfImages: number,
  ) => {
      setIsLoading(true);
      setResults([]);
      setError('');
  
      const sourceDataUrl = `data:${sourceImage.mimeType};base64,${sourceImage.base64}`;
      const generationTasks: Promise<{ url: string | null, sourceImage: string }>[] = [];
  
      if (syncAngles) {
          const SYNC_ANGLES = [
              { name: 'Chính diện', value: 'front-facing view' },
              { name: 'Góc 3/4 phải', value: '3/4 view from the right' },
              { name: 'Góc 3/4 trái', value: '3/4 view from the left' },
          ];
  
          for (const angle of SYNC_ANGLES) {
              const promptForAngle = `${finalPrompt} The portrait is taken from a ${angle.value}.`;
  
              for (let i = 0; i < numberOfImages; i++) {
                  generationTasks.push(
                      executeGeneration(promptForAngle, sourceImage, null, backgroundImage)
                          .then(url => ({ url, sourceImage: sourceDataUrl }))
                  );
              }
          }
      } else {
          for (let i = 0; i < numberOfImages; i++) {
              generationTasks.push(
                  executeGeneration(finalPrompt, sourceImage, null, backgroundImage)
                      .then(url => ({ url, sourceImage: sourceDataUrl }))
              );
          }
      }
  
      const results = await Promise.all(generationTasks);
      const successfulResults: ResultItem[] = results
          .filter((r): r is { url: string; sourceImage: string } => r.url !== null)
          .map(r => ({ type: 'image', url: r.url, sourceImage: r.sourceImage }));
  
      if (successfulResults.length === 0 && !error) {
          setError('Không thể tạo bất kỳ ảnh nào. Vui lòng thử lại.');
      }
      setResults(successfulResults);
      setIsLoading(false);
  
  }, [executeGeneration, error, setResults, setIsLoading, setError]);

  const handleAnnotateImage = useCallback(async (index: number) => {
    const result = results[index];
    if (result.type !== 'image' || !result.url) return;

    setResults(prev => prev.map((r, i) => i === index ? { ...r, annotationLoading: true } : r));

    try {
        const [mimeHeader, base64Data] = result.url.split(';base64,');
        const mimeType = mimeHeader.split(':')[1];
        const annotation = await annotateImage(base64Data, mimeType);
        setResults(prev => prev.map((r, i) => i === index ? { ...r, annotation, annotationLoading: false } : r));
    } catch (e: any) {
        setError(`Lỗi khi ghi chú ảnh: ${e.message}`);
        setResults(prev => prev.map((r, i) => i === index ? { ...r, annotationLoading: false } : r));
    }
  }, [results]);

  const handleCompareImage = useCallback((sourceImage: string | undefined, resultUrl: string) => {
    if (!sourceImage) {
        setError("Không tìm thấy ảnh gốc để so sánh.");
        return;
    }
    setComparisonImages({ before: sourceImage, after: resultUrl });
  }, []);

  const handleEvaluateImage = useCallback((index: number, evaluation: 'liked' | 'disliked') => {
    setResults(prev => prev.map((r, i) => {
        if (i === index) {
            // Toggle off if clicking the same evaluation again
            return { ...r, evaluation: r.evaluation === evaluation ? undefined : evaluation };
        }
        return r;
    }));
  }, []);


  const upscaleImage = useCallback(async (urlToUpscale: string, index: number) => {
    if (!urlToUpscale) {
        setError('Không có ảnh để nâng cấp.');
        return;
    }

    setIsUpscaling(true);
    setUpscalingIndex(index);
    setError('');

    try {
        const [mimeHeader, base64Data] = urlToUpscale.split(';base64,');
        const mimeType = mimeHeader.split(':')[1];

        const textPart = { text: "Upscale this image to a higher resolution, enhancing details and maintaining photorealistic quality. Do not change the content or style of the image." };
        const imagePart = { inlineData: { mimeType: mimeType, data: base64Data } };

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const ai = await aiPromise;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image-preview',
                    contents: { parts: [textPart, imagePart] },
                    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
                });

                let newBase64Data = null;
                if (response.candidates && response.candidates.length > 0) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                            newBase64Data = part.inlineData.data;
                            break;
                        }
                    }
                }

                if (newBase64Data) {
                    const newUrl = `data:image/png;base64,${newBase64Data}`;
                    setResults(prevResults => {
                        const newResults = [...prevResults];
                        newResults[index] = { ...newResults[index], url: newUrl };
                        return newResults;
                    });
                    return;
                } else {
                    throw new Error("Không nhận được dữ liệu ảnh nâng cấp từ API.");
                }
            } catch (e: any) {
                console.error(`Lỗi lần thử ${attempt + 1} (Nâng cấp Ảnh):`, e.message);
                if (attempt === MAX_RETRIES - 1) setError(`Lỗi khi nâng cấp ảnh sau ${MAX_RETRIES} lần thử: ${e.message}`);
                else await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    } catch (e: any) {
        setError(`Lỗi khi chuẩn bị nâng cấp ảnh: ${e.message}`);
    } finally {
        setIsUpscaling(false);
        setUpscalingIndex(null);
    }
  }, [setResults, setError]);

  const downloadContent = (result: ResultItem) => {
    if (!result.url) return;
    try {
        const link = document.createElement('a');
        link.href = result.url;
        const fileExtension = result.type === 'video' ? 'mp4' : 'png';
        link.download = `ctai-studio-${Date.now()}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // For blob URLs, it's good practice to revoke them after use, but since the user might want to re-download, we can leave it.
    } catch (e: any) {
        console.error("Lỗi khi tải xuống:", e);
        setError("Không thể tải tệp xuống. Vui lòng kiểm tra console.");
    }
  };
  
  const openCamera = (onCapture: (capturedImage: { base64: string; mimeType: string; }) => void) => {
      cameraCaptureCallbackRef.current = onCapture;
      setIsCameraOpen(true);
  };

  const handleCameraCapture = (capturedImage: { base64: string; mimeType: string; }) => {
      if (cameraCaptureCallbackRef.current) {
          cameraCaptureCallbackRef.current(capturedImage);
      }
      setIsCameraOpen(false);
  };
  
  const handleImageChange = (index: number, image: SourceImage | null) => {
    setInputImages(prev => {
        const newImages = [...prev];
        newImages[index] = image;
        return newImages;
    });
  };

  const openCameraForSlot = (index: number) => {
      openCamera(capturedImage => {
          handleImageChange(index, capturedImage);
      });
  };

  const handleSaveCurrentPrompt = (currentPrompt: string) => {
    if (currentPrompt.trim()) {
        setPromptToSave(currentPrompt);
        setIsSavePromptModalOpen(true);
    } else {
        setError("Không thể lưu một prompt trống.");
    }
  };

  const handleConfirmSavePrompt = (name: string) => {
    const newPrompt: SavedPrompt = {
        id: Date.now(),
        name,
        prompt: promptToSave.trim(),
    };
    setSavedPrompts(prev => [newPrompt, ...prev]);
    setIsSavePromptModalOpen(false);
    setPromptToSave('');
  };

  const handleUsePromptFromLibrary = (promptText: string) => {
    setPrompt(promptText);
    setIsPromptLibraryOpen(false);
  };

  const handleDeletePrompt = (id: number) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
  };

  const handleExportPrompts = () => {
    try {
        const dataStr = JSON.stringify(savedPrompts, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'ctai-studio-prompts.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    } catch (e) {
        console.error("Failed to export prompts:", e);
        setError("Không thể xuất thư viện prompt.");
    }
  };

  const handleImportPrompts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const importedPrompts = JSON.parse(text);
            // Basic validation
            if (Array.isArray(importedPrompts) && importedPrompts.every(p => 'id' in p && 'name' in p && 'prompt' in p)) {
                setSavedPrompts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newPrompts = importedPrompts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newPrompts];
                });
            } else {
                throw new Error("Invalid prompt library file format.");
            }
        } catch (err) {
            console.error("Failed to import prompts:", err);
            setError("Tệp thư viện prompt không hợp lệ hoặc bị hỏng.");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input to allow re-importing same file
  };


  const validImagesCount = inputImages.filter(Boolean).length;
  const isAnyLoading = isLoading || isSuggestingPrompt || isUpscaling;
  const activeTabClass = "tab-button tab-button-active";
  const inactiveTabClass = "tab-button";

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8 font-sans">
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
      {comparisonImages && (
        <ImageModal
            beforeSrc={comparisonImages.before}
            afterSrc={comparisonImages.after}
            onClose={() => setComparisonImages(null)}
        />
      )}
      <SavePromptModal
        isOpen={isSavePromptModalOpen}
        prompt={promptToSave}
        onClose={() => setIsSavePromptModalOpen(false)}
        onSave={handleConfirmSavePrompt}
      />
      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        prompts={savedPrompts}
        onUse={handleUsePromptFromLibrary}
        onDelete={handleDeletePrompt}
        onImport={handleImportPrompts}
        onExport={handleExportPrompts}
      />
      
      <div className="w-full max-w-7xl bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden flex-grow">
        <div className="p-6 md:p-8 pb-4 border-b border-gray-700 flex-shrink-0">
          <h1 className="text text-5xl md:text-6xl font-bold mb-6 text-center flex-shrink-0">CTAI STUDIO</h1>
          <p className="text-center text-gray-400 text-lg"><b>Biến ý tưởng của bạn thành hiện thực</b></p>
        </div>
        
        <div className="flex flex-col lg:flex-row flex-grow min-h-0">
          
          <div className="lg:w-1/2 flex-shrink-0 flex flex-col p-6 md:p-8 border-r border-gray-700">
            <div className="flex border-b border-gray-700 -mx-6 px-6 flex-wrap">
                <button className={mode === 'generate' ? activeTabClass : inactiveTabClass} onClick={() => setMode('generate')}>
                    KIẾN TRÚC
                </button>
                <button className={mode === 'blend' ? activeTabClass : inactiveTabClass} onClick={() => setMode('blend')}>
                    GHÉP ẢNH
                </button>
                <button className={mode === 'restore' ? activeTabClass : inactiveTabClass} onClick={() => setMode('restore')}>
                    PHỤC CHẾ ẢNH
                </button>
                <button className={mode === 'video' ? activeTabClass : inactiveTabClass} onClick={() => setMode('video')}>
                    VIDEO
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto pt-6 pr-2 -mr-4">
                {mode === 'generate' && (
                    <div className="space-y-6">
                        <div>
                        <label className="block text-lg font-medium mb-3 text-gray-300 flex items-center uppercase">
                            <Image className="w-5 h-5 mr-2" />
                            1. Ảnh Đầu Vào
                        </label>
                        <div className="flex flex-col md:flex-row gap-4">
                           {inputImages.map((image, index) => (
                               <ImageSlot
                                    key={index}
                                    image={image}
                                    onImageChange={(img) => handleImageChange(index, img)}
                                    onCameraClick={() => openCameraForSlot(index)}
                                    disabled={isAnyLoading}
                                />
                           ))}
                        </div>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-300 -mb-2 uppercase">2. Tùy chỉnh Phong cách & Môi trường</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="architecture-select" className="block text-sm font-medium mb-1 text-gray-300 flex items-center"><Home className="w-4 h-4 mr-1" />Kiến trúc:</label>
                                <select id="architecture-select" value={architectureStyle} onChange={(e) => { setArchitectureStyle(e.target.value); }} disabled={isAnyLoading} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500">
                                    {ARCHITECTURE_STYLES.map(style => (<option key={style.value} value={style.value}>{style.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="interior-select" className="block text-sm font-medium mb-1 text-gray-300 flex items-center"><Lamp className="w-4 h-4 mr-1" />Nội thất:</label>
                                <select id="interior-select" value={interiorStyle} onChange={(e) => { setInteriorStyle(e.target.value); }} disabled={isAnyLoading} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500">
                                    {INTERIOR_STYLES.map(style => (<option key={style.value} value={style.value}>{style.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="context-select" className="block text-sm font-medium mb-1 text-gray-300 flex items-center"><Cloud className="w-4 h-4 mr-1" />Bối cảnh:</label>
                                <select id="context-select" value={contextStyle} onChange={(e) => { setContextStyle(e.target.value); }} disabled={isAnyLoading} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-blue-500 focus:border-blue-500">
                                    {CONTEXT_STYLES.map(style => (<option key={style.value} value={style.value}>{style.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="weather-select" className="block text-sm font-medium mb-1 text-gray-300 flex items-center"><Sun className="w-4 h-4 mr-1" />Thời tiết:</label>
                                <select id="weather-select" value={weatherStyle} onChange={(e) => { setWeatherStyle(e.target.value); }} disabled={isAnyLoading} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-blue-500 focus:border-blue-500">
                                    {WEATHER_STYLES.map(style => (<option key={style.value} value={style.value}>{style.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="time-select" className="block text-sm font-medium mb-1 text-gray-300 flex items-center"><Clock className="w-4 h-4 mr-1" />Thời điểm:</label>
                                <select id="time-select" value={timeStyle} onChange={(e) => { setTimeStyle(e.target.value); }} disabled={isAnyLoading} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-blue-500 focus:border-blue-500">
                                    {TIME_STYLES.map(style => (<option key={style.value} value={style.value}>{style.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="view-angle-select" className="block text-sm font-medium mb-1 text-gray-300 flex items-center"><Camera className="w-4 h-4 mr-1" />Hướng nhìn:</label>
                                <select id="view-angle-select" value={viewAngle} onChange={(e) => { setViewAngle(e.target.value); }} disabled={isAnyLoading || syncAngles} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50">
                                    {VIEW_ANGLE_STYLES.map(style => (<option key={style.value} value={style.value}>{style.name}</option>))}
                                </select>
                            </div>
                        </div>

                        <details className="bg-gray-700/50 border border-gray-600 rounded-lg overflow-hidden">
                            <summary className="px-4 py-3 text-lg font-medium text-gray-300 cursor-pointer hover:bg-gray-700 uppercase">TÙY CHỈNH ẢNH NÂNG CAO</summary>
                            <div className="p-4 border-t border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="brightness-slider" className="flex items-center gap-2 text-sm font-medium text-gray-300"><Sun className="w-4 h-4" /> Độ sáng</label>
                                        <span className="font-semibold text-blue-400 text-sm">{brightness}</span>
                                    </div>
                                    <Slider id="brightness-slider" min="-100" max="100" value={brightness} onChange={e => { setBrightness(Number(e.target.value)); }} disabled={isAnyLoading} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="contrast-slider" className="flex items-center gap-2 text-sm font-medium text-gray-300"><CompareIcon className="w-4 h-4" /> Độ tương phản</label>
                                        <span className="font-semibold text-blue-400 text-sm">{contrast}</span>
                                    </div>
                                    <Slider id="contrast-slider" min="-100" max="100" value={contrast} onChange={e => { setContrast(Number(e.target.value)); }} disabled={isAnyLoading} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="saturation-slider" className="text-sm font-medium text-gray-300">Độ bão hòa</label>
                                        <span className="font-semibold text-blue-400 text-sm">{saturation}</span>
                                    </div>
                                    <Slider id="saturation-slider" min="-100" max="100" value={saturation} onChange={e => { setSaturation(Number(e.target.value)); }} disabled={isAnyLoading} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="temperature-slider" className="text-sm font-medium text-gray-300">Nhiệt độ màu</label>
                                        <span className="font-semibold text-blue-400 text-sm">{temperature}</span>
                                    </div>
                                    <Slider id="temperature-slider" min="-100" max="100" value={temperature} onChange={e => { setTemperature(Number(e.target.value)); }} disabled={isAnyLoading} />
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Lạnh</span>
                                        <span>Ấm</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="sharpness-slider" className="text-sm font-medium text-gray-300">Độ sắc nét</label>
                                        <span className="font-semibold text-blue-400 text-sm">{sharpness}</span>
                                    </div>
                                    <Slider id="sharpness-slider" min="0" max="100" value={sharpness} onChange={e => { setSharpness(Number(e.target.value)); }} disabled={isAnyLoading} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="vignette-slider" className="text-sm font-medium text-gray-300">Hiệu ứng mờ viền</label>
                                        <span className="font-semibold text-blue-400 text-sm">{vignette}</span>
                                    </div>
                                    <Slider id="vignette-slider" min="0" max="100" value={vignette} onChange={e => { setVignette(Number(e.target.value)); }} disabled={isAnyLoading} />
                                </div>
                            </div>
                        </details>
                        
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="prompt-input" className="block text-lg font-medium text-gray-300 uppercase">3. Mô tả (Prompt):</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsPromptLibraryOpen(true)} disabled={isAnyLoading} className="p-2 rounded-md font-semibold text-sm transition duration-300 ease-in-out bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-50" title="Mở thư viện prompt"><LibraryIcon /></button>
                                    <button onClick={() => handleSaveCurrentPrompt(prompt)} disabled={isAnyLoading || !prompt.trim()} className="p-2 rounded-md font-semibold text-sm transition duration-300 ease-in-out bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-50" title="Lưu prompt"><SaveIcon /></button>
                                    <button
                                        onClick={handleSuggestPrompt}
                                        disabled={isAnyLoading || validImagesCount === 0}
                                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-md font-semibold text-sm transition duration-300 ease-in-out bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                                    >
                                        {isSuggestingPrompt ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4" />
                                        )}
                                        <span>Tạo tự động</span>
                                    </button>
                                </div>
                            </div>
                            <textarea
                                id="prompt-input"
                                rows={5}
                                className="prompt-input w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                placeholder={"Mô tả các thay đổi bạn muốn..."}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isAnyLoading}
                            ></textarea>
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="creativity-slider" className="block text-lg font-medium text-gray-300 uppercase">
                                    4. Mức Độ Sáng Tạo
                                </label>
                                <span className="font-semibold text-blue-400 text-lg">{creativity}</span>
                            </div>
                            <Slider
                                id="creativity-slider"
                                min="0"
                                max="100"
                                value={creativity}
                                onChange={(e) => setCreativity(Number(e.target.value))}
                                disabled={isAnyLoading}
                            />
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Bám sát mô tả</span>
                                <span>Tự do sáng tạo</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-700">
                            <div className="flex justify-between items-center">
                                <label htmlFor="sync-angles-toggle" className="text-lg font-medium text-gray-300 uppercase">Đồng bộ các góc khác nhau</label>
                                <label className="toggle-switch">
                                    <input id="sync-angles-toggle" type="checkbox" checked={syncAngles} onChange={(e) => setSyncAngles(e.target.checked)} disabled={isAnyLoading} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div>
                                <NumberStepper
                                    label="Số lượng ảnh"
                                    value={numberOfImages}
                                    onChange={setNumberOfImages}
                                    min={1}
                                    max={5}
                                    disabled={isAnyLoading}
                                />
                            </div>
                             {syncAngles && <p className="text-xs text-gray-400 -mt-2">{`Sẽ tạo ${numberOfImages} ảnh cho mỗi góc nhìn (tổng cộng ${numberOfImages * 3} ảnh).`}</p>}
                        </div>
                        
                        <button
                        onClick={handleGenerateFromGeneratorTab}
                        disabled={isAnyLoading || !prompt.trim() || validImagesCount === 0}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-300 ease-in-out flex items-center justify-center
                            ${isAnyLoading || !prompt.trim() || validImagesCount === 0
                            ? 'bg-blue-600/70 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50'
                            }`}
                        >
                        {isLoading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />5. ĐANG TẠO ẢNH MỚI...</>) : (<><Wand2 className="w-5 h-5 mr-2" />5. TẠO ẢNH MỚI</>)}
                        </button>

                        {error && (
                        <div className="p-3 bg-red-800 border border-red-600 text-red-100 rounded-lg flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            {error}
                        </div>
                        )}
                    </div>
                )}
                {mode === 'blend' && (
                    <BlendingModeView
                        prompt={prompt}
                        setPrompt={setPrompt}
                        creativity={creativity}
                        setCreativity={setCreativity}
                        isLoading={isAnyLoading}
                        generatedImage={results.length > 0 && results[0].type === 'image' ? results[0].url : null}
                        onGenerate={handleGenerateFromBlendingTab}
                        itemToRestore={itemToRestore}
                        onItemRestored={() => setItemToRestore(null)}
                        numberOfImages={numberOfImages}
                        setNumberOfImages={setNumberOfImages}
                        onSavePrompt={() => handleSaveCurrentPrompt(prompt)}
                        onOpenLibrary={() => setIsPromptLibraryOpen(true)}
                    />
                )}
                {mode === 'restore' && (
                    <RestoreModeView
                        isLoading={isAnyLoading}
                        onGenerate={handleGenerateFromRestoreTab}
                        prompt={prompt}
                        setPrompt={setPrompt}
                        onSavePrompt={() => handleSaveCurrentPrompt(prompt)}
                        onOpenLibrary={() => setIsPromptLibraryOpen(true)}
                        syncAngles={syncAngles}
                        setSyncAngles={setSyncAngles}
                        numberOfImages={numberOfImages}
                        setNumberOfImages={setNumberOfImages}
                    />
                )}
                {mode === 'video' && (
                    <VideoModeView
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        setError={setError}
                        setResults={setResults}
                        openCamera={openCamera}
                        prompt={prompt}
                        setPrompt={setPrompt}
                        onSavePrompt={() => handleSaveCurrentPrompt(prompt)}
                        onOpenLibrary={() => setIsPromptLibraryOpen(true)}
                    />
                )}
            </div>
          </div>
          
          <div className="flex-grow flex flex-col p-6 md:p-8">
            
            <div className="flex-grow min-h-[400px] bg-gray-700 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner border border-gray-600">
              {isLoading && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex flex-col items-center justify-center z-10">
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                  <p className="mt-3 text-lg text-blue-300">
                    {mode === 'video' ? "Mô hình đang tạo video..." : "Mô hình đang tạo ảnh..."}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">(Quá trình này có thể mất vài giây đến vài phút)</p>
                </div>
              )}
              
              {!isLoading && results.length > 0 ? (
                <div className="w-full h-full p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
                    {results.map((result, index) => (
                        <div key={index} className="relative group bg-gray-900/50 rounded-lg flex flex-col overflow-hidden">
                            <div className="relative aspect-square">
                                {result.type === 'image' ? (
                                    <img src={result.url} alt={`Kết quả ${index + 1}`} className="w-full h-full object-contain" />
                                ) : (
                                    <video src={result.url} controls autoPlay loop className="w-full h-full object-contain" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-t-lg"></div>
                                {isUpscaling && upscalingIndex === index && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 rounded-lg">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        <p className="text-white mt-2 text-sm">Đang nâng cấp...</p>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                    <button onClick={() => handleEvaluateImage(index, 'liked')} className={`p-2 bg-black/40 hover:bg-black/70 text-white rounded-full shadow-lg transition duration-200 ${result.evaluation === 'liked' ? 'bg-green-500' : ''}`} title="Thích">
                                        <LikeIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleEvaluateImage(index, 'disliked')} className={`p-2 bg-black/40 hover:bg-black/70 text-white rounded-full shadow-lg transition duration-200 ${result.evaluation === 'disliked' ? 'bg-red-500' : ''}`} title="Không thích">
                                        <UnlikeIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                    {result.type === 'image' && (
                                      <>
                                        <button onClick={() => handleCompareImage(result.sourceImage, result.url)} className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transition" title="So sánh" disabled={isAnyLoading}>
                                            <CompareIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleAnnotateImage(index)} className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg transition" title="AI Ghi chú" disabled={isAnyLoading}>
                                            <MessageSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => upscaleImage(result.url, index)} className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition" title="Nâng cấp ảnh" disabled={isAnyLoading}>
                                            <Maximize className="w-5 h-5" />
                                        </button>
                                      </>
                                    )}
                                    <button onClick={() => downloadContent(result)} className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition" title="Tải xuống" disabled={isAnyLoading}>
                                      <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                             {(result.annotation || result.annotationLoading) && (
                                <div className="p-2 text-xs bg-gray-800 border-t border-gray-600">
                                    {result.annotationLoading ? (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>AI đang phân tích...</span>
                                        </div>
                                    ) : (
                                        <p className="text-gray-300">{result.annotation}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
              ) : (
                !isLoading && (
                    <div className="text-center text-gray-500">
                        {mode === 'video' ? <VideoIcon className="w-12 h-12 mx-auto mb-4" /> : <Sparkles className="w-12 h-12 mx-auto mb-4" />}
                        <p className="text-lg font-medium">Kết quả sẽ xuất hiện ở đây</p>
                    </div>
                )
              )}
            </div>
          </div>

        </div>
      </div>
      <footer className="text-center text-gray-500 mt-8 flex-shrink-0">
        FB: <a href="https://www.facebook.com/ktscuongnm?locale=vi_VN" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">KTS NGUYỄN CƯỜNG</a>
        <p className="text-center text-gray-400 text-lg">Zalo: 0589338888</p>
        
      </footer>
    </div>
  );
};

// Component chính quản lý trạng thái đăng nhập
const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    if (!isLoggedIn) {
        return <LoginComponent onLoginSuccess={() => setIsLoggedIn(true)} />;
    }

    return <ImageGeneratorApp />;
}

export default App;
