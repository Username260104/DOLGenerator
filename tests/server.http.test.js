const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchWithTimeout, readJsonBody } = require('../server/http');

const originalFetch = global.fetch;

test.afterEach(() => {
  global.fetch = originalFetch;
});

test('readJsonBody parses JSON text and returns object', async () => {
  const response = {
    text: async () => '{"ok":true}',
  };

  const data = await readJsonBody(response);
  assert.deepEqual(data, { ok: true });
});

test('readJsonBody returns raw payload when body is not valid JSON', async () => {
  const response = {
    text: async () => 'plain-text',
  };

  const data = await readJsonBody(response);
  assert.deepEqual(data, { raw: 'plain-text' });
});

test('fetchWithTimeout forwards fetch result', async () => {
  const fakeResponse = { ok: true };
  global.fetch = async () => fakeResponse;

  const result = await fetchWithTimeout('https://example.com', {}, 100);
  assert.equal(result, fakeResponse);
});
