const test = require('node:test');
const assert = require('node:assert/strict');
const { parseHttpUrl, isBlockedHostname, REPLICATE_HOST } = require('../server/validators');

test('parseHttpUrl returns null for invalid URL', () => {
  assert.equal(parseHttpUrl('not-a-url'), null);
});

test('parseHttpUrl accepts http/https and rejects other schemes', () => {
  assert.equal(parseHttpUrl('https://example.com')?.hostname, 'example.com');
  assert.equal(parseHttpUrl('http://example.com')?.hostname, 'example.com');
  assert.equal(parseHttpUrl('ftp://example.com'), null);
});

test('isBlockedHostname blocks private/local hosts', () => {
  assert.equal(isBlockedHostname('localhost'), true);
  assert.equal(isBlockedHostname('127.0.0.1'), true);
  assert.equal(isBlockedHostname('10.0.0.1'), true);
  assert.equal(isBlockedHostname('192.168.1.20'), true);
  assert.equal(isBlockedHostname('172.16.0.3'), true);
  assert.equal(isBlockedHostname('172.31.255.255'), true);
  assert.equal(isBlockedHostname('example.local'), true);
  assert.equal(isBlockedHostname('api.replicate.com'), false);
});

test('replicate host constant is fixed', () => {
  assert.equal(REPLICATE_HOST, 'api.replicate.com');
});
