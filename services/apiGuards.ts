import { GeminiCandidate, GeminiResponse, ReplicatePrediction } from '../types/api';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseGeminiResponse(data: unknown): GeminiResponse {
  if (!isRecord(data)) {
    throw new Error('Gemini 응답 형식이 올바르지 않습니다.');
  }

  const response: GeminiResponse = {};

  if (Array.isArray(data.candidates)) {
    response.candidates = data.candidates
      .filter((candidate) => isRecord(candidate))
      .map((candidate) => {
        const typedCandidate: GeminiCandidate = {};
        if (isRecord(candidate.content) && Array.isArray(candidate.content.parts)) {
          typedCandidate.content = {
            parts: candidate.content.parts
              .filter((part) => isRecord(part))
              .map((part) => ({ text: typeof part.text === 'string' ? part.text : undefined })),
          };
        }
        return typedCandidate;
      });
  }

  if (typeof data.error === 'string') {
    response.error = data.error;
  }

  return response;
}

export function getGeminiEnhancedText(data: GeminiResponse): string | null {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

export function parseReplicatePrediction(data: unknown): ReplicatePrediction {
  if (!isRecord(data)) {
    throw new Error('Replicate 응답 형식이 올바르지 않습니다.');
  }

  const prediction: ReplicatePrediction = {};

  if (typeof data.status === 'string') {
    prediction.status = data.status;
  }

  if (typeof data.output === 'string' || isStringArray(data.output)) {
    prediction.output = data.output;
  }

  if (isRecord(data.urls) && typeof data.urls.get === 'string') {
    prediction.urls = { get: data.urls.get };
  }

  if (typeof data.error === 'string') {
    prediction.error = data.error;
  }

  if (typeof data.detail === 'string') {
    prediction.detail = data.detail;
  }

  return prediction;
}

export function getReplicateErrorMessage(prediction: ReplicatePrediction): string {
  return prediction.error || prediction.detail || JSON.stringify(prediction);
}
