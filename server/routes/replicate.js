const express = require('express');
const { createHttpError, asyncHandler } = require('../errors');
const { fetchWithTimeout, readJsonBody } = require('../http');
const { REPLICATE_HOST, parseHttpUrl } = require('../validators');

function createReplicateRouter({ replicateApiKey }) {
  const router = express.Router();

  router.post('/replicate', asyncHandler(async (req, res) => {
    const { url, method = 'POST', version, input, headers: extraHeaders } = req.body;

    if (!url) throw createHttpError(400, 'url is required');
    if (!replicateApiKey) throw createHttpError(500, 'REPLICATE_API_KEY not configured');

    const parsedUrl = parseHttpUrl(url);
    if (!parsedUrl || parsedUrl.hostname !== REPLICATE_HOST) {
      throw createHttpError(400, 'Invalid replicate url');
    }

    const fetchHeaders = {
      Authorization: `Bearer ${replicateApiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
      ...(extraHeaders || {}),
    };

    const fetchOptions = {
      method,
      headers: fetchHeaders,
    };

    if (method === 'POST' && input !== undefined) {
      const body = { input };
      if (version) body.version = version;
      fetchOptions.body = JSON.stringify(body);
    }

    const apiRes = await fetchWithTimeout(parsedUrl.toString(), fetchOptions);
    const data = await readJsonBody(apiRes);

    res.status(apiRes.status).json(data);
  }));

  router.get('/replicate/poll', asyncHandler(async (req, res) => {
    const { url } = req.query;
    if (!url) throw createHttpError(400, 'url query param is required');
    if (!replicateApiKey) throw createHttpError(500, 'REPLICATE_API_KEY not configured');

    const parsedUrl = parseHttpUrl(url);
    if (!parsedUrl || parsedUrl.hostname !== REPLICATE_HOST) {
      throw createHttpError(400, 'Invalid replicate poll url');
    }

    const apiRes = await fetchWithTimeout(parsedUrl.toString(), {
      headers: { Authorization: `Bearer ${replicateApiKey}` },
    });
    const data = await readJsonBody(apiRes);

    res.status(apiRes.status).json(data);
  }));

  return router;
}

module.exports = {
  createReplicateRouter,
};
