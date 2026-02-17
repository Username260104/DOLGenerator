const express = require('express');
const cors = require('cors');
const { errorHandler, notFoundHandler } = require('./errors');
const { createReplicateRouter } = require('./routes/replicate');
const { createGeminiRouter } = require('./routes/gemini');
const { createProxyImageRouter } = require('./routes/proxyImage');

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const elapsedMs = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${elapsedMs}ms)`);
  });
  next();
}

function createApp({ replicateApiKey, geminiApiKey }) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(requestLogger);

  app.use('/api', createReplicateRouter({ replicateApiKey }));
  app.use('/api', createGeminiRouter({ geminiApiKey }));
  app.use('/api', createProxyImageRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
