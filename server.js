/**
 * DOLGenerator 로컬 프록시 서버
 * 
 * Figma 플러그인 UI에서 외부 API(Replicate, Gemini)를 호출할 때
 * CORS/보안 문제를 우회하기 위한 로컬 중계 서버.
 * API 키는 서버(.env)에서만 관리하여 UI에 노출되지 않음.
 * 
 * 시작: npm run server
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// --- 미들웨어 ---
app.use(cors()); // Figma iframe 출처 허용
app.use(express.json({ limit: '50mb' })); // 대용량 base64 이미지 지원

// API 키 (서버에서만 관리)
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ============================================================
//  POST /api/replicate — Replicate API 중계
//  body: { url, method?, version?, input?, headers? }
// ============================================================
app.post('/api/replicate', async (req, res) => {
    try {
        const { url, method = 'POST', version, input, headers: extraHeaders } = req.body;

        if (!url) return res.status(400).json({ error: 'url is required' });
        if (!REPLICATE_API_KEY) return res.status(500).json({ error: 'REPLICATE_API_KEY not configured' });

        const fetchHeaders = {
            'Authorization': `Bearer ${REPLICATE_API_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait',
            ...(extraHeaders || {}),
        };

        const fetchOptions = {
            method,
            headers: fetchHeaders,
        };

        // POST일 때만 body 전달
        // 커스텀 학습 모델은 version 필드가 필요 (/v1/predictions 엔드포인트)
        if (method === 'POST' && input !== undefined) {
            const body = { input };
            if (version) body.version = version;
            fetchOptions.body = JSON.stringify(body);
        }

        const apiRes = await fetch(url, fetchOptions);
        const data = await apiRes.json();

        res.status(apiRes.status).json(data);
    } catch (error) {
        console.error('/api/replicate 에러:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
//  GET /api/replicate/poll — Replicate 폴링 (GET 요청 중계)
//  query: ?url=<prediction_get_url>
// ============================================================
app.get('/api/replicate/poll', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'url query param is required' });
        if (!REPLICATE_API_KEY) return res.status(500).json({ error: 'REPLICATE_API_KEY not configured' });

        const apiRes = await fetch(url, {
            headers: { 'Authorization': `Bearer ${REPLICATE_API_KEY}` },
        });
        const data = await apiRes.json();

        res.status(apiRes.status).json(data);
    } catch (error) {
        console.error('/api/replicate/poll 에러:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
//  POST /api/gemini — Gemini API 중계
//  body: { system_instruction, contents }
// ============================================================
app.post('/api/gemini', async (req, res) => {
    try {
        if (!GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        const apiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        const data = await apiRes.json();

        res.status(apiRes.status).json(data);
    } catch (error) {
        console.error('/api/gemini 에러:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
//  GET /api/proxy-image — 이미지 바이너리 프록시
//  query: ?url=<image_url>
//  응답: 이미지 바이너리를 그대로 파이프 (Content-Type 유지)
// ============================================================
app.get('/api/proxy-image', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'url query param is required' });

        const imageRes = await fetch(url);
        if (!imageRes.ok) {
            return res.status(imageRes.status).json({ error: `Image fetch failed: ${imageRes.status}` });
        }

        // Content-Type 전달
        const contentType = imageRes.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        // Node 18+ ReadableStream → Node.js stream 변환
        const buffer = await imageRes.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error('/api/proxy-image 에러:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
//  서버 시작
// ============================================================
app.listen(PORT, () => {
    console.log(`\n🚀 DOLGenerator 프록시 서버 실행 중: http://localhost:${PORT}`);
    console.log(`   POST /api/replicate    — Replicate API 중계`);
    console.log(`   GET  /api/replicate/poll — Replicate 폴링`);
    console.log(`   POST /api/gemini       — Gemini API 중계`);
    console.log(`   GET  /api/proxy-image  — 이미지 프록시\n`);
});
