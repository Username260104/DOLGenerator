import { CREATE_MODEL_VERSION, SERVER_URL } from '../constants/config';
import { ReplicatePrediction } from '../types/api';
import { getReplicateErrorMessage, parseReplicatePrediction } from './apiGuards';

const POLL_INTERVAL_MS = 1500;

interface ReplicateProxyRequest {
  url: string;
  method?: 'POST' | 'GET';
  version?: string;
  input?: Record<string, unknown>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestReplicate(req: ReplicateProxyRequest): Promise<{ prediction: ReplicatePrediction; status: number }> {
  const response = await fetch(`${SERVER_URL}/api/replicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  const rawData: unknown = await response.json();
  const prediction = parseReplicatePrediction(rawData);
  return { prediction, status: response.status };
}

async function pollPrediction(url: string): Promise<ReplicatePrediction> {
  const response = await fetch(`${SERVER_URL}/api/replicate/poll?url=${encodeURIComponent(url)}`);
  const rawData: unknown = await response.json();
  return parseReplicatePrediction(rawData);
}

async function waitUntilFinished(prediction: ReplicatePrediction): Promise<ReplicatePrediction> {
  let current = prediction;

  while (current.status === 'starting' || current.status === 'processing') {
    if (!current.urls?.get) {
      throw new Error('폴링 URL이 없습니다.');
    }

    await sleep(POLL_INTERVAL_MS);
    current = await pollPrediction(current.urls.get);
  }

  return current;
}

function extractOutputUrl(prediction: ReplicatePrediction): string {
  if (prediction.status === 'failed') {
    throw new Error('Processing failed');
  }

  const outputUrl = typeof prediction.output === 'string'
    ? prediction.output
    : prediction.output?.[0];

  if (!outputUrl) {
    throw new Error('No output URL received');
  }

  return outputUrl;
}

function withDolStylePrompt(prompt: string): string {
  return prompt.toLowerCase().includes('in the style of dol')
    ? prompt
    : `${prompt}, in the style of DOL`;
}

export async function generateDolImage(prompt: string): Promise<string> {
  const { prediction, status } = await requestReplicate({
    url: 'https://api.replicate.com/v1/predictions',
    method: 'POST',
    version: CREATE_MODEL_VERSION,
    input: {
      prompt: withDolStylePrompt(prompt),
      model: 'schnell',
      lora_scale: 1,
      num_inference_steps: 4,
      megapixels: '1',
      num_outputs: 1,
      aspect_ratio: '1:1',
      output_format: 'jpg',
      output_quality: 100,
    },
  });

  if (status === 429) {
    throw new Error('API 요청 제한 초과! 잠시(30초~1분) 후 다시 시도해주세요.');
  }

  if (status < 200 || status >= 300) {
    throw new Error(`API 요청 실패: ${status} - ${getReplicateErrorMessage(prediction)}`);
  }

  const finalPrediction = await waitUntilFinished(prediction);
  return extractOutputUrl(finalPrediction);
}

export async function callReplicateEditModel(modelPath: string, input: Record<string, unknown>): Promise<string> {
  const { prediction, status } = await requestReplicate({
    url: `https://api.replicate.com/v1/models/${modelPath}/predictions`,
    method: 'POST',
    input,
  });

  if (status === 429) {
    throw new Error('Replicate API 요청 제한 초과. 잠시 후 다시 시도해주세요.');
  }

  if (status < 200 || status >= 300) {
    throw new Error(`API Request Failed: ${status} - ${getReplicateErrorMessage(prediction)}`);
  }

  const finalPrediction = await waitUntilFinished(prediction);
  return extractOutputUrl(finalPrediction);
}
