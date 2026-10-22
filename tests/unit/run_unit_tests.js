/**
 * Unit Test Master Runner
 */

const testUrlUtils = require('./test_url_utils');
const testSpatialNav = require('./test_spatial_nav');
const testAdBlock = require('./test_adblock');
const testTabManager = require('./test_tab_manager');

console.log('=============================================');
console.log('TV BROWSER — UNIT TEST SUITE (TIZEN 6.5)');
console.log('=============================================\n');

try {
  testUrlUtils.run();
  console.log('');
  testSpatialNav.run();
  console.log('');
  testAdBlock.run();
  console.log('');
  testTabManager.run();

  console.log('\n=============================================');
  console.log('ALL UNIT TESTS PASSED SUCCESSFULLY (4/4 suites)');
  console.log('=============================================');
} catch (err) {
  console.error('\n❌ UNIT TEST FAILURE:', err);
  process.exit(1);
}
