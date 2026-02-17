import { SERVER_URL } from '../constants/config';
import { getGeminiEnhancedText, parseGeminiResponse } from './apiGuards';

export async function enhancePromptWithGemini(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch(`${SERVER_URL}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [{
        parts: [{ text: prompt }],
      }],
    }),
  });

  const rawData: unknown = await response.json();
  const data = parseGeminiResponse(rawData);

  if (!response.ok) {
    throw new Error(data.error || 'Gemini API 요청 실패');
  }

  const enhancedText = getGeminiEnhancedText(data);
  if (!enhancedText) {
    throw new Error('Gemini 응답에서 프롬프트를 추출할 수 없습니다.');
  }

  return enhancedText;
}
