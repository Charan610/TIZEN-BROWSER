/**
 * Unit Tests: Lifecycle & Back-Key Priority Stack
 * Verifies strict LIFO dismissal order:
 * suggestions -> modal -> keyboard -> input blur -> tab back -> start page -> exit confirmation -> clean exit.
 */

const assert = require('assert');
const Lifecycle = require('../../src/app/lifecycle');

function run() {
  console.log('Testing Lifecycle Back-Key Stack:');

  // Reset state
  Lifecycle.backHandlers = [];
  Lifecycle.exitConfirmPending = false;

  // Test 1: Suggestions dropdown dismissal has top priority over modals/tabs
  var suggestionsClosed = false;
  global.Suggestions = {
    isOpen: function() { return true; },
    hide: function() { suggestionsClosed = true; }
  };

  var handled = Lifecycle.handleBackKey({ isStartPage: false });
  assert.strictEqual(handled, true);
  assert.strictEqual(suggestionsClosed, true, 'Suggestions dropdown closed first on Back');
  console.log('  ✓ Priority 1: Suggestions dropdown dismissed before modal or navigation');

  // Test 2: Active Modal dismissal when suggestions are closed
  global.Suggestions.isOpen = function() { return false; };
  var modalClosed = false;
  global.Modal = {
    isOpen: function() { return true; },
    close: function() { modalClosed = true; }
  };

  handled = Lifecycle.handleBackKey({ isStartPage: false });
  assert.strictEqual(handled, true);
  assert.strictEqual(modalClosed, true, 'Modal closed on Back');
  console.log('  ✓ Priority 2: Modal closed before keyboard or tab navigation');

  // Test 3: Input editing blur when modal is closed
  global.Modal.isOpen = function() { return false; };
  var inputBlurred = false;
  var mockActiveElement = {
    tagName: 'INPUT',
    blur: function() { inputBlurred = true; }
  };
  global.document = { activeElement: mockActiveElement };
  global.TextInput = {
    isEditing: function(el) { return el === mockActiveElement; }
  };

  handled = Lifecycle.handleBackKey({ isStartPage: false });
  assert.strictEqual(handled, true);
  assert.strictEqual(inputBlurred, true, 'Focused input blurred on Back');
  console.log('  ✓ Priority 3: Active input editing dismissed on Back');

  // Test 4: Tab navigation back
  global.TextInput.isEditing = function() { return false; };
  var navigatedBackUrl = null;
  var mockContext = {
    activeTab: {
      navState: {
        canGoBack: function() { return true; },
        goBack: function() { return 'https://previous-page.com'; }
      }
    },
    isStartPage: false,
    onNavigateBack: function(url) { navigatedBackUrl = url; },
    onReturnHome: function() {}
  };

  handled = Lifecycle.handleBackKey(mockContext);
  assert.strictEqual(handled, true);
  assert.strictEqual(navigatedBackUrl, 'https://previous-page.com');
  console.log('  ✓ Priority 4: Tab in-page history back navigation verified');

  // Test 5: Return to Start Page when cannot go back in history
  var returnedHome = false;
  mockContext.activeTab.navState.canGoBack = function() { return false; };
  mockContext.onReturnHome = function() { returnedHome = true; };

  handled = Lifecycle.handleBackKey(mockContext);
  assert.strictEqual(handled, true);
  assert.strictEqual(returnedHome, true);
  console.log('  ✓ Priority 5: Return to Start Page from web surface verified');

  // Test 6: Exit confirmation toast on Start Page
  var toastMessage = null;
  global.Toast = {
    show: function(msg) { toastMessage = msg; }
  };
  var appExited = false;
  global.tizen = {
    application: {
      getCurrentApplication: function() {
        return {
          exit: function() { appExited = true; }
        }
      }
    }
  };

  mockContext.isStartPage = true;
  handled = Lifecycle.handleBackKey(mockContext);
  assert.strictEqual(handled, true);
  assert.ok(toastMessage && toastMessage.indexOf('Press Back again to exit') !== -1);
  assert.strictEqual(appExited, false, 'First back on start page shows confirmation toast');
  console.log('  ✓ Priority 6: Accidental termination guard and exit confirmation verified');

  // Test 7: Second Back press exits application cleanly
  handled = Lifecycle.handleBackKey(mockContext);
  assert.strictEqual(handled, true);
  assert.strictEqual(appExited, true, 'Second Back press cleanly exited Tizen application');
  console.log('  ✓ Priority 7: Clean Tizen application exit verified');
}

module.exports = { run };
if (require.main === module) {
  run();
  console.log('All Lifecycle tests passed.');
}
