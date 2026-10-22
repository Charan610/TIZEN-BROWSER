/**
 * Unit Tests: SystemBrowser
 * Validates Samsung Internet launch via Tizen ApplicationControl API,
 * URL validation, and error fallback reporting.
 */

const assert = require('assert');
const SystemBrowser = require('../../src/browser/system_browser');

function run(done) {
  console.log('Testing SystemBrowser:');

  var originalTizen = global.tizen;

  // Test 1: Rejection of invalid or unsafe URLs
  SystemBrowser.open('ftp://unsafe.com/file', function(err) {
    assert.ok(err instanceof Error);
    assert.strictEqual(err.message, 'Enter a valid web address or search phrase.');
    console.log('  ✓ Invalid/non-HTTP scheme rejected before launch');

    testNonTizenFallback();
  });

  // Test 2: Error when executed outside Samsung Tizen TV environment
  function testNonTizenFallback() {
    delete global.tizen;
    SystemBrowser.open('https://example.com', function(err) {
      assert.ok(err instanceof Error);
      assert.strictEqual(err.message, 'Samsung Internet can only be opened on a supported Samsung TV.');
      console.log('  ✓ Non-Tizen desktop environment handled with transparent explanation');

      testMockTizenSuccess();
    });
  }

  // Test 3: Successful launch via mock Tizen ApplicationControl
  function testMockTizenSuccess() {
    var launchedControl = null;
    global.tizen = {
      ApplicationControl: function(operation, uri) {
        this.operation = operation;
        this.uri = uri;
      },
      application: {
        launchAppControl: function(control, appId, successCb, errorCb) {
          launchedControl = control;
          // Asynchronous success
          setTimeout(function() {
            successCb();
          }, 5);
        }
      }
    };

    SystemBrowser.open('https://duckduckgo.com', function(err) {
      assert.strictEqual(err, null, 'Launch succeeds without error');
      assert.ok(launchedControl, 'ApplicationControl dispatched');
      assert.strictEqual(launchedControl.operation, 'http://tizen.org/appcontrol/operation/view');
      assert.strictEqual(launchedControl.uri, 'https://duckduckgo.com/');
      console.log('  ✓ Tizen launchAppControl successfully triggered with view operation');

      testMockTizenFailure();
    });
  }

  // Test 4: Launch failure from Tizen platform
  function testMockTizenFailure() {
    global.tizen.application.launchAppControl = function(control, appId, successCb, errorCb) {
      setTimeout(function() {
        errorCb({ name: 'NotFoundError', message: 'Application not found on device' });
      }, 5);
    };

    SystemBrowser.open('https://wikipedia.org', function(err) {
      assert.ok(err instanceof Error);
      assert.ok(err.message.indexOf('NotFoundError') !== -1);
      console.log('  ✓ Tizen launchAppControl failure cleanly surfaced with diagnostics');

      // Cleanup
      if (originalTizen) {
        global.tizen = originalTizen;
      } else {
        delete global.tizen;
      }

      if (done) done();
    });
  }
}

module.exports = { run };
if (require.main === module) {
  run(function() {
    console.log('All SystemBrowser tests passed.');
  });
}
