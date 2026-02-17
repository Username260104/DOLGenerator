export const SERVER_URL = 'http://localhost:3001';

export const CREATE_MODEL_VERSION = '2cd10ef9753da87b7b691018bcdcd695c844a02e75542db7950cd19cb7be71f6';

export const EDIT_MODEL_PATHS = {
  upscale: 'nightmareai/real-esrgan',
  removeBackground: 'recraft-ai/recraft-remove-background',
  refine: 'black-forest-labs/flux-kontext-pro',
  rotate: 'qwen/qwen-image-edit-plus',
} as const;
