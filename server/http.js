const { createHttpError } = require('./errors');

const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.UPSTREAM_TIMEOUT_MS || '15000', 10);

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw createHttpError(504, 'Upstream request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function readJsonBody(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { raw: text };
  }
}

module.exports = {
  fetchWithTimeout,
  readJsonBody,
  DEFAULT_TIMEOUT_MS,
};
