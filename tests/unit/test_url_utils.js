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

  // Test 3: Normalization
  assert.strictEqual(UrlUtils.normalizeInput('example.com'), 'https://example.com');
  assert.strictEqual(UrlUtils.normalizeInput('https://google.com'), 'https://google.com');
  assert.strictEqual(UrlUtils.normalizeInput('javascript:alert(1)'), '', 'Unsafe normalized to empty');
  assert.ok(UrlUtils.normalizeInput('latest movies', 'duckduckgo').indexOf('duckduckgo.com/?q=latest%20movies') !== -1);
  assert.strictEqual(UrlUtils.normalizeInput('   '), '', 'Whitespace does not open an empty search');
  assert.strictEqual(UrlUtils.normalizeInput('example.com?q=tv#results'), 'https://example.com?q=tv#results');
  assert.strictEqual(UrlUtils.normalizeInput('https://'), '', 'Malformed web address is rejected');
  assert.strictEqual(UrlUtils.normalizeInput('youtube', 'google'), 'https://www.google.com/search?q=youtube');
  console.log('  ✓ Normalization and search engine query construction verified');

  // Test 4: Host extraction
  assert.strictEqual(UrlUtils.extractHost('https://sub.domain.org/path?q=1#hash'), 'sub.domain.org');
  assert.strictEqual(UrlUtils.extractOrigin('https://sub.domain.org:8080/path'), 'https://sub.domain.org:8080');
  console.log('  ✓ Host and origin extraction verified');
}

module.exports = { run };
if (require.main === module) run();
