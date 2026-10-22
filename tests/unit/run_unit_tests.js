/**
 * Unit Test Master Runner
 */

const testUrlUtils = require('./test_url_utils');
const testSpatialNav = require('./test_spatial_nav');
const testAdBlock = require('./test_adblock');
const testTabManager = require('./test_tab_manager');
const testTextInput = require('./test_text_input');
const testSuggestions = require('./test_suggestions');
const testSystemBrowser = require('./test_system_browser');
const testLifecycle = require('./test_lifecycle');

console.log('=============================================');
console.log('TV BROWSER — UNIT TEST SUITE (TIZEN 6.5)');
console.log('=============================================\n');

function runAll() {
  try {
    testUrlUtils.run();
    console.log('');
    testSpatialNav.run();
    console.log('');
    testAdBlock.run();
    console.log('');
    testTabManager.run();
    console.log('');
    testLifecycle.run();
    console.log('');

    testTextInput.run(function() {
      console.log('');
      testSuggestions.run(function() {
        console.log('');
        testSystemBrowser.run(function() {
          console.log('\n=============================================');
          console.log('ALL UNIT TESTS PASSED SUCCESSFULLY (8/8 suites)');
          console.log('=============================================');
        });
      });
    });
  } catch (err) {
    console.error('\n❌ UNIT TEST FAILURE:', err);
    process.exit(1);
  }
}

runAll();
