const express = require('express');
const { asyncHandler, createHttpError } = require('../errors');
const { fetchWithTimeout } = require('../http');
const { isBlockedHostname, parseHttpUrl } = require('../validators');

function createProxyImageRouter() {
  const router = express.Router();

  router.get('/proxy-image', asyncHandler(async (req, res) => {
    const { url } = req.query;
    if (!url) throw createHttpError(400, 'url query param is required');

    const parsedUrl = parseHttpUrl(url);
    if (!parsedUrl || isBlockedHostname(parsedUrl.hostname)) {
      throw createHttpError(400, 'Invalid image url');
    }

    const imageRes = await fetchWithTimeout(parsedUrl.toString());
    if (!imageRes.ok) {
      return res.status(imageRes.status).json({ error: `Image fetch failed: ${imageRes.status}` });
    }

    const contentType = imageRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const buffer = await imageRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  }));

  return router;
}

module.exports = {
  createProxyImageRouter,
};
