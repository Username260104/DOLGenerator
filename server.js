/**
 * DOLGenerator 로컬 프록시 서버
 *
 * Figma 플러그인 UI에서 외부 API(Replicate, Gemini)를 호출할 때
 * CORS/보안 문제를 우회하기 위한 로컬 중계 서버.
 * API 키는 서버(.env)에서만 관리하여 UI에 노출되지 않음.
 *
 * 시작: npm run server
 */
require('dotenv').config();
const { createApp } = require('./server/app');

const PORT = process.env.SERVER_PORT || 3001;
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const app = createApp({
  replicateApiKey: REPLICATE_API_KEY,
  geminiApiKey: GEMINI_API_KEY,
});

app.listen(PORT, () => {
  console.log(`\n🚀 DOLGenerator 프록시 서버 실행 중: http://localhost:${PORT}`);
  console.log('   POST /api/replicate    — Replicate API 중계');
  console.log('   GET  /api/replicate/poll — Replicate 폴링');
  console.log('   POST /api/gemini       — Gemini API 중계');
  console.log('   GET  /api/proxy-image  — 이미지 프록시\n');
});
