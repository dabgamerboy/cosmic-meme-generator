
export type Alignment = 'left' | 'center' | 'right';
export type MemeFilter = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'saturate';

export type AIProvider = 'pollinations' | 'aihorde' | 'gemini' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  customEndpoint?: string;
  apiKey?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface MemeTemplate {
  id: string;
  url: string;
  name: string;
}

export interface MemeCanvasState {
  imageUrl: string | null;
  topText: string;
  bottomText: string;
  topTextPos: Position;
  bottomTextPos: Position;
  topFontSize: number;
  bottomFontSize: number;
  topFont: string;
  bottomFont: string;
  topAlign: Alignment;
  bottomAlign: Alignment;
  topTextColor: string;
  bottomTextColor: string;
  topOutlineColor: string;
  topOutlineWidth: number;
  bottomOutlineColor: string;
  bottomOutlineWidth: number;
  // Layering
  topZIndex: number;
  bottomZIndex: number;
  imageZIndex: number;
  // Adaptive Background Properties
  topBgColor: string;
  topBgOpacity: number;
  bottomBgColor: string;
  bottomBgOpacity: number;
  topBgPadding: number;
  bottomBgPadding: number;
  zoom: number;
  pan: Position;
  filter: MemeFilter;
  // Effects
  canvasShadow: boolean;
  showGrid: boolean;
}

export interface MemeState extends MemeCanvasState {
  isGeneratingCaptions: boolean;
  isEditingImage: boolean;
  isAnalyzingColors: boolean;
  suggestions: string[];
  aiConfig: AIConfig;
}

export enum EditMode {
  MANUAL = 'MANUAL',
  AI = 'AI'
}
