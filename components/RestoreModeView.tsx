
import React, { useState, useRef } from 'react';
import { SourceImage } from '../types';
import { Slider } from '../Slider';
import { UploadIcon, Wand2, Sun, CompareIcon, SaveIcon, LibraryIcon } from './icons';
import { NumberStepper } from './NumberStepper';

interface RestoreModeViewProps {
  isLoading: boolean;
  onGenerate: (sourceImage: SourceImage, finalPrompt: string, backgroundImage: SourceImage | null, syncAngles: boolean, numberOfImages: number) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSavePrompt: () => void;
  onOpenLibrary: () => void;
  syncAngles: boolean;
  setSyncAngles: (sync: boolean) => void;
  numberOfImages: number;
  setNumberOfImages: (n: number) => void;
}

const BackgroundUploader: React.FC<{
  image: SourceImage | null;
  onImageChange: (image: SourceImage | null) => void;
  disabled: boolean;
}> = ({ image, onImageChange, disabled }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleFile = (file: File) => {
        if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const [mimeHeader, base64Data] = dataUrl.split(';base64,');
                onImageChange({ base64: base64Data, mimeType: mimeHeader.split(':')[1] });
            };
            reader.readAsDataURL(file);
        } else {
            alert('Vui lòng chọn tệp ảnh hợp lệ (PNG, JPG, v.v.) và nhỏ hơn 5MB.');
        }
    };
    
    return (
        <div 
            onClick={() => !disabled && inputRef.current?.click()}
            className={`w-full h-32 rounded-lg border-2 border-dashed transition duration-300 flex items-center justify-center relative overflow-hidden bg-gray-700/50
            ${image ? 'border-blue-500 p-0' : 'border-gray-500 hover:border-blue-400 p-4'}
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <input 
                type="file" 
                accept="image/*" 
                ref={inputRef} 
                className="sr-only" 
                disabled={disabled}
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
            {image ? (
                <>
                    <img src={`data:${image.mimeType};base64,${image.base64}`} alt="Background Preview" className="w-full h-full object-cover" />
                    <div 
                        onClick={(e) => { e.stopPropagation(); onImageChange(null); }}
                        className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-300 text-white font-bold text-center p-2 cursor-pointer">
                        Xóa ảnh nền
                    </div>
                </>
            ) : (
                <div className="text-center text-gray-400 text-sm">
                    <UploadIcon className="w-6 h-6 mx-auto mb-1" />
                    <p>Tải ảnh nền</p>
                </div>
            )}
        </div>
    );
}

export const RestoreModeView: React.FC<RestoreModeViewProps> = ({ isLoading, onGenerate, prompt, setPrompt, onSavePrompt, onOpenLibrary, syncAngles, setSyncAngles, numberOfImages, setNumberOfImages }) => {
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [damageLevel, setDamageLevel] = useState(50);
  const [angle, setAngle] = useState('');
  const [background, setBackground] = useState('');
  const [aspectRatio, setAspectRatio] = useState('');
  const [idPhotoBackground, setIdPhotoBackground] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<SourceImage | null>(null);

  // Advanced Adjustments State
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  const [vignette, setVignette] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        alert('Vui lòng chọn tệp ảnh hợp lệ (PNG, JPG, v.v.) và nhỏ hơn 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const [mimeHeader, base64Data] = dataUrl.split(';base64,');
        setSourceImage({ base64: base64Data, mimeType: mimeHeader.split(':')[1] });
      };
      reader.readAsDataURL(file);
    }
  };

  const getAdjustmentInstruction = () => {
    let instructions = [];
    if (brightness > 0) instructions.push(`increase brightness by ${brightness}%`);
    if (brightness < 0) instructions.push(`decrease brightness by ${-brightness}%`);
    if (contrast > 0) instructions.push(`increase contrast by ${contrast}%`);
    if (contrast < 0) instructions.push(`decrease contrast by ${-contrast}%`);
    if (saturation > 0) instructions.push(`increase saturation by ${saturation}%`);
    if (saturation < 0) instructions.push(`decrease saturation by ${-saturation}%`);
    if (temperature > 0) instructions.push(`add a warm color temperature (${temperature}%)`);
    if (temperature < 0) instructions.push(`add a cool color temperature (${-temperature}%)`);
    if (sharpness > 0) instructions.push(`increase sharpness by ${sharpness}%`);
    if (vignette > 0) instructions.push(`add a ${vignette > 50 ? 'strong' : 'subtle'} vignette effect`);
    if (instructions.length === 0) return "";
    return ` Apply the following image adjustments: ${instructions.join(', ')}.`;
  }

  const handleGenerateClick = () => {
    if (!sourceImage) {
      alert('Vui lòng tải lên ảnh đầu vào.');
      return;
    }

    let finalPrompt = "";

    if (backgroundImage) {
        finalPrompt = "Using the first image as a reference for the person's face and upper body, restore and colorize them. Then, seamlessly place the restored person into the second image, which is the new background. Ensure the lighting, shadows, and perspective on the person match the new background perfectly to create a single, cohesive, photorealistic image. The final image aspect ratio should match the new background.";
    } else {
        finalPrompt = "Restore and colorize this old, damaged portrait into a clear, high-quality, photorealistic photograph. Fix scratches, tears, and discoloration. Enhance details in the face and clothing. ";
        
        const isIdPhotoRequest = aspectRatio || idPhotoBackground;

        if (isIdPhotoRequest) {
            finalPrompt += "The final image should be a professional-style portrait, suitable for an ID photo. The subject should be centered and looking directly at the camera. ";
            if (aspectRatio) {
                finalPrompt += `It must have a strict ${aspectRatio} aspect ratio. `;
            }
            if (idPhotoBackground) {
                finalPrompt += `The background must be a solid, uniform ${idPhotoBackground} color. `;
            }
        } else {
            // Only use the general background setting if it's not an ID photo request
            if (background) finalPrompt += `The background should be a simple, non-distracting ${background} setting. `;
        }
    }
    
    if (gender) finalPrompt += `The subject is ${gender}. `;
    if (age) finalPrompt += `They are approximately ${age} years old. `;
    if (angle) finalPrompt += `The portrait is taken from a ${angle}. `;

    finalPrompt += `The original photo has a damage level of ${damageLevel} out of 100. `;
    
    finalPrompt += getAdjustmentInstruction();

    if (prompt.trim()) {
        finalPrompt += ` Additional user instructions: "${prompt.trim()}".`
    }

    onGenerate(sourceImage, finalPrompt, backgroundImage, syncAngles, numberOfImages);
  };

  return (
    <div className="space-y-6">
        <div>
            <label className="block text-lg font-medium mb-3 text-gray-300 flex items-center uppercase">Hình ảnh đầu vào</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="sr-only" disabled={isLoading} />
            <div
                onClick={() => !isLoading && fileInputRef.current?.click()}
                className={`w-full h-48 sm:h-64 rounded-xl border-2 border-dashed transition duration-300 flex items-center justify-center relative overflow-hidden bg-gray-700
                ${sourceImage ? 'border-green-500 p-0' : 'border-gray-500 hover:border-blue-400 p-4 cursor-pointer'}
                ${isLoading && 'opacity-60 cursor-not-allowed'}
                `}
            >
                {sourceImage ? (
                    <img src={`data:${sourceImage.mimeType};base64,${sourceImage.base64}`} alt="Input Preview" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-gray-400">
                        <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-semibold">Nhấn hoặc kéo thả ảnh vào đây</p>
                        <p className="text-sm">Tối đa 5MB</p>
                    </div>
                )}
            </div>
        </div>

        <h3 className="text-lg font-medium text-gray-300 uppercase -mb-2">Tuỳ chỉnh</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="gender-select" className="block text-sm font-medium mb-1 text-gray-300">Nhân vật:</label>
                <select id="gender-select" value={gender} onChange={(e) => setGender(e.target.value)} disabled={isLoading} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Không xác định</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                </select>
            </div>
             <div>
                <label htmlFor="age-select" className="block text-sm font-medium mb-1 text-gray-300">Độ tuổi:</label>
                <select id="age-select" value={age} onChange={(e) => setAge(e.target.value)} disabled={isLoading} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Không xác định</option>
                    <option value="child (1-10)">Trẻ em (1-10)</option>
                    <option value="teenager (13-19)">Thanh niên (13-19)</option>
                    <option value="young adult (20-35)">Người trẻ (20-35)</option>
                    <option value="middle-aged (40-60)">Trung niên (40-60)</option>
                    <option value="elderly (65+)">Người già (65+)</option>
                </select>
            </div>
             <div>
                <label htmlFor="angle-select" className="block text-sm font-medium mb-1 text-gray-300">Góc nghiêng của nhân vật:</label>
                <select id="angle-select" value={angle} onChange={(e) => setAngle(e.target.value)} disabled={isLoading || syncAngles} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50">
                    <option value="">Không xác định</option>
                    <option value="front-facing view">Chính diện</option>
                    <option value="3/4 view from the right">Góc 3/4 phải</option>
                    <option value="3/4 view from the left">Góc 3/4 trái</option>
                    <option value="profile view">Nhìn nghiêng</option>
                </select>
            </div>
            <div>
                <label htmlFor="background-select" className="block text-sm font-medium mb-1 text-gray-300">Bối cảnh:</label>
                <select id="background-select" value={background} onChange={(e) => setBackground(e.target.value)} disabled={isLoading || !!backgroundImage || !!idPhotoBackground} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50">
                    <option value="">Không xác định</option>
                    <option value="indoor">Trong nhà</option>
                    <option value="outdoor">Ngoài trời</option>
                </select>
            </div>
        </div>

        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="damage-slider" className="block text-sm font-medium text-gray-300">Chỉnh sửa độ hư hỏng:</label>
                <span className="font-semibold text-blue-400 text-sm">{damageLevel}</span>
            </div>
            <Slider id="damage-slider" min="0" max="100" value={damageLevel} onChange={(e) => setDamageLevel(Number(e.target.value))} disabled={isLoading} />
             <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Ít hư hỏng</span>
                <span>Hư hỏng nặng</span>
            </div>
        </div>
        
        <div className="space-y-2">
            <h3 className="block text-lg font-medium text-gray-300 uppercase">Tạo ảnh thẻ</h3>
            <label className="block text-sm font-medium text-gray-300">Tỷ lệ ảnh thẻ:</label>
            <div className="flex gap-2">
                {['2x3', '3x4', '4x6'].map(ratio => (
                    <button key={ratio} onClick={() => setAspectRatio(ratio)} disabled={isLoading} className={`py-2 px-4 rounded-md font-semibold transition ${aspectRatio === ratio ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        {ratio}
                    </button>
                ))}
                <button onClick={() => setAspectRatio('')} disabled={isLoading} className={`py-2 px-4 rounded-md font-semibold transition ${aspectRatio === '' ? 'bg-gray-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    X
                </button>
            </div>
            <label className="block text-sm font-medium text-gray-300 pt-2">Phông nền:</label>
            <div className="flex gap-2">
                <button onClick={() => setIdPhotoBackground('white')} disabled={isLoading} className={`py-2 px-4 rounded-md font-semibold transition ${idPhotoBackground === 'white' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    Trắng
                </button>
                <button onClick={() => setIdPhotoBackground('blue')} disabled={isLoading} className={`py-2 px-4 rounded-md font-semibold transition ${idPhotoBackground === 'blue' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    Xanh
                </button>
                <button onClick={() => setIdPhotoBackground('')} disabled={isLoading} className={`py-2 px-4 rounded-md font-semibold transition ${idPhotoBackground === '' ? 'bg-gray-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    X
                </button>
            </div>
        </div>

        <div className="space-y-2">
             <h3 className="block text-lg font-medium text-gray-300 uppercase">Ghép ảnh nền</h3>
             <BackgroundUploader image={backgroundImage} onImageChange={setBackgroundImage} disabled={isLoading} />
        </div>

        <details className="bg-gray-700/50 border border-gray-600 rounded-lg overflow-hidden">
            <summary className="px-4 py-3 font-medium text-gray-300 cursor-pointer hover:bg-gray-700 uppercase">Tuỳ chỉnh nâng cao</summary>
            <div className="p-4 border-t border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label htmlFor="brightness-slider" className="flex items-center gap-2 text-sm font-medium text-gray-300"><Sun className="w-4 h-4" /> Độ sáng</label>
                        <span className="font-semibold text-blue-400 text-sm">{brightness}</span>
                    </div>
                    <Slider id="brightness-slider" min="-100" max="100" value={brightness} onChange={e => setBrightness(Number(e.target.value))} disabled={isLoading} />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label htmlFor="contrast-slider" className="flex items-center gap-2 text-sm font-medium text-gray-300"><CompareIcon className="w-4 h-4" /> Độ tương phản</label>
                        <span className="font-semibold text-blue-400 text-sm">{contrast}</span>
                    </div>
                    <Slider id="contrast-slider" min="-100" max="100" value={contrast} onChange={e => setContrast(Number(e.target.value))} disabled={isLoading} />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label htmlFor="saturation-slider" className="text-sm font-medium text-gray-300">Độ bão hòa</label>
                        <span className="font-semibold text-blue-400 text-sm">{saturation}</span>
                    </div>
                    <Slider id="saturation-slider" min="-100" max="100" value={saturation} onChange={e => setSaturation(Number(e.target.value))} disabled={isLoading} />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label htmlFor="temperature-slider" className="text-sm font-medium text-gray-300">Nhiệt độ màu</label>
                        <span className="font-semibold text-blue-400 text-sm">{temperature}</span>
                    </div>
                    <Slider id="temperature-slider" min="-100" max="100" value={temperature} onChange={e => setTemperature(Number(e.target.value))} disabled={isLoading} />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label htmlFor="sharpness-slider" className="text-sm font-medium text-gray-300">Độ sắc nét</label>
                        <span className="font-semibold text-blue-400 text-sm">{sharpness}</span>
                    </div>
                    <Slider id="sharpness-slider" min="0" max="100" value={sharpness} onChange={e => setSharpness(Number(e.target.value))} disabled={isLoading} />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label htmlFor="vignette-slider" className="text-sm font-medium text-gray-300">Hiệu ứng mờ viền</label>
                        <span className="font-semibold text-blue-400 text-sm">{vignette}</span>
                    </div>
                    <Slider id="vignette-slider" min="0" max="100" value={vignette} onChange={e => setVignette(Number(e.target.value))} disabled={isLoading} />
                </div>
            </div>
        </details>

        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="restore-prompt-input" className="block text-lg font-medium text-gray-300 uppercase">Mô tả</label>
                <div className="flex items-center gap-2">
                    <button onClick={onOpenLibrary} disabled={isLoading} className="p-2 rounded-md font-semibold text-sm transition duration-300 ease-in-out bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-50" title="Mở thư viện prompt"><LibraryIcon /></button>
                    <button onClick={onSavePrompt} disabled={isLoading || !prompt.trim()} className="p-2 rounded-md font-semibold text-sm transition duration-300 ease-in-out bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-50" title="Lưu prompt"><SaveIcon /></button>
                </div>
            </div>
            <textarea
                id="restore-prompt-input"
                rows={3}
                className="prompt-input w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Thêm các yêu cầu chi tiết khác ở đây..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
            ></textarea>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center">
                <label htmlFor="restore-sync-angles-toggle" className="text-lg font-medium text-gray-300 uppercase">Đồng bộ các góc khác nhau</label>
                <label className="toggle-switch">
                    <input id="restore-sync-angles-toggle" type="checkbox" checked={syncAngles} onChange={(e) => setSyncAngles(e.target.checked)} disabled={isLoading} />
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
                    disabled={isLoading}
                />
            </div>
            {syncAngles && <p className="text-xs text-gray-400 -mt-2">{`Sẽ tạo ${numberOfImages} ảnh cho mỗi góc nhìn (tổng cộng ${numberOfImages * 3} ảnh).`}</p>}
        </div>

        <button
            onClick={handleGenerateClick}
            disabled={isLoading || !sourceImage}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-300 ease-in-out flex items-center justify-center
                ${isLoading || !sourceImage
                ? 'bg-blue-600/70 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50'
                }`}
            >
            {isLoading ? (<>...</>) : (<><Wand2 className="w-5 h-5 mr-2" />Tạo ảnh mới</>)}
        </button>
    </div>
  );
};
