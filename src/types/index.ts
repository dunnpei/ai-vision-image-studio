export type AspectRatio = 'A4' | '1:1' | '16:9' | '9:16';

export type ApiProvider = 'openai' | 'replicate';

export interface GenerationConfig {
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  numOutputs: number;
  imageCount: 1 | 2 | 3 | 4; // 每次生成的圖片張數
  strength: number; // 0.1 ~ 1.0 (Image-to-Image 重繪強度)
  provider: ApiProvider;
}

export interface UserApiKeys {
  openaiKey: string;
  replicateToken: string;
  baseUrl?: string;      // 自訂 API 主機位置 (例如 https://api.openai.com 或 https://api.bltcy.ai)
  visionModel?: string;  // 自訂 Vision 分析模型 (預設 gpt-4o)
  imageModel?: string;   // 自訂 圖像生成模型 (預設 dall-e-3)
}

export interface GenerateApiRequest {
  image: string | null; // Base64 Data URL
  config: GenerationConfig;
  userKeys?: Partial<UserApiKeys>;
  analyzedPrompt?: string; // 預先分析好的 Vision 描述
}

export interface GenerateApiResponse {
  success: boolean;
  imageUrls?: string[];
  analyzedPrompt?: string;
  revisedPrompt?: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalImage?: string | null;
  generatedImageUrl: string;
  prompt: string;
  aspectRatio: AspectRatio;
  analyzedPrompt?: string;
}
