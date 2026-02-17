const REPLICATE_HOST = 'api.replicate.com';

function parseHttpUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch (_error) {
    return null;
  }
}

function isBlockedHostname(hostname) {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '0.0.0.0' || lower === '::1' || lower.endsWith('.local')) {
    return true;
  }
  if (lower.startsWith('127.') || lower.startsWith('10.') || lower.startsWith('192.168.')) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) {
    return true;
  }
  return false;
}

module.exports = {
  REPLICATE_HOST,
  parseHttpUrl,
  isBlockedHostname,
};
