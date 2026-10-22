/**
 * Unit Tests: AdBlockEngine, Allowlist, and Cosmetic Rules
 */

const assert = require('assert');
const CosmeticRules = require('../../src/adblock/cosmetic_rules');
const Allowlist = require('../../src/adblock/allowlist');
const PopupShield = require('../../src/adblock/popup_shield');
const AdBlockEngine = require('../../src/adblock/adblock_engine');

function run() {
  console.log('Testing Ad Blocking Subsystems:');

  // Test 1: Cosmetic Rules Compilation
  var cssStandard = CosmeticRules.generateCSS(false, false);
  assert.ok(cssStandard.indexOf('.adsbygoogle') !== -1, 'Contains standard ad selector');
  assert.ok(cssStandard.indexOf('display: none !important') !== -1, 'Enforces hidden style');

  var cssWithCookies = CosmeticRules.generateCSS(true, false);
  assert.ok(cssWithCookies.indexOf('.cookie-banner') !== -1, 'Contains cookie banner selector');
  console.log('  ✓ Cosmetic rules compilation verified');

  // Test 2: Allowlist functionality
  Allowlist.init();
  Allowlist.clear();
  assert.strictEqual(Allowlist.isAllowlisted('trusted-site.org'), false);
  Allowlist.add('https://trusted-site.org/articles');
  assert.strictEqual(Allowlist.isAllowlisted('trusted-site.org'), true);
  Allowlist.remove('trusted-site.org');
  assert.strictEqual(Allowlist.isAllowlisted('trusted-site.org'), false);
  console.log('  ✓ Per-site allowlist operations verified');

  // Test 3: Navigation Guard in AdBlockEngine
  var unsafeNav = AdBlockEngine.validateNavigation('javascript:alert(1)');
  assert.strictEqual(unsafeNav.allowed, false, 'Blocks javascript navigation');

  var safeNav = AdBlockEngine.validateNavigation('https://duckduckgo.com');
  assert.strictEqual(safeNav.allowed, true, 'Permits safe navigation');
  console.log('  ✓ Navigation guard validation verified');

  // Test 4: Redirect Loop Mitigation in PopupShield
  PopupShield.resetStats();
  assert.strictEqual(PopupShield.evaluateRedirect('https://a.com', 'https://b.com'), true);
  assert.strictEqual(PopupShield.evaluateRedirect('https://b.com', 'https://c.com'), true);
  assert.strictEqual(PopupShield.evaluateRedirect('https://c.com', 'https://d.com'), true);
  // 4th rapid hop should trigger loop protection
  assert.strictEqual(PopupShield.evaluateRedirect('https://d.com', 'https://e.com'), false);
  assert.strictEqual(PopupShield.blockedRedirectsCount, 1, 'Blocked redirect recorded');
  console.log('  ✓ Redirect loop defense verified');
}

module.exports = { run };
if (require.main === module) run();
