// --- TypeScript interface for the API exposed by preload.js ---
export interface ElectronAPI {
  getApiKey: () => Promise<string | undefined>;
}

// FIX: Add and export the Idea interface to be used across the application.
export interface Idea {
  title: string;
  description: string;
}

// FIX: Add missing type definitions.
export interface Point {
  x: number;
  y: number;
}

export interface Corners {
  tl: Point;
  tr: Point;
  bl: Point;
  br: Point;
}

export interface SourceImage {
  base64: string;
  mimeType: string;
}

export interface Path {
  points: Point[];
  brushSize: number;
  color: string;
  tool: 'brush' | 'lasso';
  isClosed?: boolean;
}

export type GenerationMode = 'inpaint' | 'outpaint' | 'blending' | 'generate';

export interface HistoryEntry {
  id: number;
  image: string; // base64 data URL
  prompt: string;
  creativity: number;
  mode: GenerationMode;
  source: SourceImage;
  // Inpaint specific
  maskPaths?: Path[];
  styleReference?: SourceImage | null;
  styleInfluence?: number;
  // Blending specific
  blendBackground?: SourceImage;
  blendDesign?: SourceImage | null;
  blendCorners?: Corners | null;
  // Outpaint specific
  outpaintFrame?: { x: number, y: number, width: number, height: number };
  originalImagePosition?: { x: number, y: number, width: number, height: number };
}

export interface SavedPrompt {
    id: number;
    name: string;
    prompt: string;
}

export type ResultItem = {
  type: 'image' | 'video';
  url: string;
  originalUrl?: string; // For videos, to track the URI from the API
  annotation?: string;
  annotationLoading?: boolean;
  evaluation?: 'liked' | 'disliked';
  sourceImage?: string; // base64 data URL of the original image for comparison
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}