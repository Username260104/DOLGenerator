const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../server/app');

const originalFetch = global.fetch;

function jsonResponse(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => 'application/json' },
    text: async () => JSON.stringify(payload),
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(payload)).buffer,
  };
}

test.afterEach(() => {
  global.fetch = originalFetch;
});

test('POST /api/replicate rejects non-replicate URL', async () => {
  const app = createApp({ replicateApiKey: 'test-key', geminiApiKey: 'gemini-key' });

  const res = await request(app)
    .post('/api/replicate')
    .send({ url: 'https://example.com', method: 'POST', input: {} });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Invalid replicate url');
});

test('POST /api/gemini returns 500 when key is missing', async () => {
  const app = createApp({ replicateApiKey: 'test-key', geminiApiKey: '' });

  const res = await request(app)
    .post('/api/gemini')
    .send({ contents: [] });

  assert.equal(res.status, 500);
  assert.equal(res.body.error, 'GEMINI_API_KEY not configured');
});

test('GET /api/proxy-image blocks localhost URL', async () => {
  const app = createApp({ replicateApiKey: 'test-key', geminiApiKey: 'gemini-key' });

  const res = await request(app)
    .get('/api/proxy-image')
    .query({ url: 'http://localhost/test.png' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Invalid image url');
});

test('POST /api/replicate proxies upstream response', async () => {
  global.fetch = async () => jsonResponse(201, { status: 'starting', urls: { get: 'https://api.replicate.com/v1/predictions/1' } });

  const app = createApp({ replicateApiKey: 'test-key', geminiApiKey: 'gemini-key' });

  const res = await request(app)
    .post('/api/replicate')
    .send({ url: 'https://api.replicate.com/v1/predictions', method: 'POST', input: { prompt: 'test' } });

  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'starting');
});
