export interface GeminiPart {
  text?: string;
}

export interface GeminiContent {
  parts?: GeminiPart[];
}

export interface GeminiCandidate {
  content?: GeminiContent;
}

export interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: string;
}

export interface ReplicateUrls {
  get: string;
}

export interface ReplicatePrediction {
  status?: 'starting' | 'processing' | 'succeeded' | 'failed' | string;
  output?: string | string[];
  urls?: ReplicateUrls;
  error?: string;
  detail?: string;
}
