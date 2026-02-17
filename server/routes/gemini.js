const express = require('express');
const { asyncHandler, createHttpError } = require('../errors');
const { fetchWithTimeout, readJsonBody } = require('../http');

function createGeminiRouter({ geminiApiKey }) {
  const router = express.Router();

  router.post('/gemini', asyncHandler(async (req, res) => {
    if (!geminiApiKey) throw createHttpError(500, 'GEMINI_API_KEY not configured');

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const apiRes = await fetchWithTimeout(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await readJsonBody(apiRes);

    res.status(apiRes.status).json(data);
  }));

  return router;
}

module.exports = {
  createGeminiRouter,
};
