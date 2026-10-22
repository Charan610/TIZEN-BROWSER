/**
 * Unit Tests: UrlUtils
 */

const assert = require('assert');
const UrlUtils = require('../../src/browser/url_utils');

function run() {
  console.log('Testing UrlUtils:');

  // Test 1: Dangerous scheme rejection
  assert.strictEqual(UrlUtils.isUnsafeScheme('javascript:alert(1)'), true, 'Rejects javascript:');
  assert.strictEqual(UrlUtils.isUnsafeScheme('data:text/html,test'), true, 'Rejects data:');
  assert.strictEqual(UrlUtils.isUnsafeScheme('vbscript:msgbox'), true, 'Rejects vbscript:');
  assert.strictEqual(UrlUtils.isUnsafeScheme('https://example.com'), false, 'Allows https:');
  assert.strictEqual(UrlUtils.isUnsafeScheme('http://example.com'), false, 'Allows http:');
  console.log('  ✓ Dangerous schemes correctly identified and rejected');

  // Test 2: URL detection
  assert.strictEqual(UrlUtils.isUrl('https://example.com'), true, 'Full URL');
  assert.strictEqual(UrlUtils.isUrl('example.com'), true, 'Domain without scheme');
  assert.strictEqual(UrlUtils.isUrl('192.168.1.1:8080'), true, 'IP with port');
  assert.strictEqual(UrlUtils.isUrl('hello world'), false, 'Search terms with space');
  assert.strictEqual(UrlUtils.isUrl('news articles today'), false, 'Query phrase');
  console.log('  ✓ URL vs search query classification accurate');

  // Test 3: Normalization (STEP 4 Requirements)
  assert.strictEqual(UrlUtils.normalizeInput('google.com'), 'https://google.com', 'google.com -> https://google.com');
  assert.strictEqual(UrlUtils.normalizeInput('https://github.com'), 'https://github.com', 'https://github.com preserves exact URL');
  assert.strictEqual(UrlUtils.normalizeInput('wikipedia.org'), 'https://wikipedia.org', 'wikipedia.org -> https://wikipedia.org');
  assert.strictEqual(UrlUtils.normalizeInput('best laptops'), 'https://www.google.com/search?q=best%20laptops', 'best laptops -> search query');
  assert.strictEqual(UrlUtils.normalizeInput('python fastapi tutorial'), 'https://www.google.com/search?q=python%20fastapi%20tutorial', 'python fastapi tutorial -> search query');
  assert.strictEqual(UrlUtils.normalizeInput('192.168.1.1'), 'http://192.168.1.1', '192.168.1.1 -> http://192.168.1.1');
  assert.strictEqual(UrlUtils.normalizeInput('localhost:8000'), 'http://localhost:8000', 'localhost:8000 -> http://localhost:8000');
  assert.strictEqual(UrlUtils.normalizeInput('example.com/path?q=1'), 'https://example.com/path?q=1', 'example.com/path?q=1 preserves path and query');
  assert.strictEqual(UrlUtils.normalizeInput('javascript:alert(1)'), '', 'Unsafe scheme blocked');
  assert.strictEqual(UrlUtils.normalizeInput('   '), '', 'Whitespace input returns empty');
  assert.strictEqual(UrlUtils.normalizeInput('https://'), '', 'Malformed URL scheme returns empty');
  assert.strictEqual(UrlUtils.normalizeInput('best laptops', 'duckduckgo'), 'https://duckduckgo.com/?q=best%20laptops', 'DuckDuckGo search query');
  assert.strictEqual(UrlUtils.normalizeInput('best laptops', 'bing'), 'https://www.bing.com/search?q=best%20laptops', 'Bing search query');
  console.log('  ✓ Step 4 normalization requirements (all 8 cases + search engines) verified');

  // Test 4: Host extraction
  assert.strictEqual(UrlUtils.extractHost('https://sub.domain.org/path?q=1#hash'), 'sub.domain.org');
  assert.strictEqual(UrlUtils.extractOrigin('https://sub.domain.org:8080/path'), 'https://sub.domain.org:8080');
  console.log('  ✓ Host and origin extraction verified');
}

module.exports = { run };
if (require.main === module) run();
