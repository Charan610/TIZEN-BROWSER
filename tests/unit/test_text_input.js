/**
 * Unit Tests: TextInput
 * Verifies Samsung IME Done (65376), Cancel (65385), physical Enter (13),
 * composition handling, and single submission guarantees.
 */

const assert = require('assert');
const TextInput = require('../../src/input/text_input');

function createMockInput(initialValue) {
  var listeners = {};
  var focused = false;
  return {
    value: initialValue || '',
    tagName: 'INPUT',
    isContentEditable: false,
    focus: function() { focused = true; },
    blur: function() { focused = false; },
    isFocused: function() { return focused; },
    addEventListener: function(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    dispatchEvent: function(event) {
      var fns = listeners[event.type] || [];
      for (var i = 0; i < fns.length; i++) {
        fns[i](event);
      }
    }
  };
}

function createMockButton() {
  var listeners = {};
  var focused = false;
  return {
    tagName: 'BUTTON',
    focus: function() { focused = true; },
    isFocused: function() { return focused; },
    addEventListener: function(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    click: function() {
      var fns = listeners['click'] || [];
      for (var i = 0; i < fns.length; i++) {
        fns[i]({ type: 'click' });
      }
    }
  };
}

function run(done) {
  console.log('Testing TextInput:');

  // Test 1: Editing detection
  assert.strictEqual(TextInput.isEditing({ tagName: 'INPUT' }), true);
  assert.strictEqual(TextInput.isEditing({ tagName: 'TEXTAREA' }), true);
  assert.strictEqual(TextInput.isEditing({ tagName: 'BUTTON' }), false);
  assert.strictEqual(TextInput.isEditing(null), false);
  console.log('  ✓ Input editing element detection accurate');

  // Test 2: Samsung IME Done keycode (65376) commits and submits exactly once
  (function testSamsungDone() {
    var input = createMockInput('samsung smart tv');
    var button = createMockButton();
    var submittedValues = [];

    TextInput.bind(input, button, function(val) {
      submittedValues.push(val);
    });

    var stopped = false;
    input.dispatchEvent({
      type: 'keydown',
      keyCode: 65376,
      repeat: false,
      stopPropagation: function() { stopped = true; },
      preventDefault: function() {}
    });

    assert.strictEqual(stopped, true, 'Done key stops event propagation');

    setTimeout(function() {
      assert.strictEqual(submittedValues.length, 1, 'Submitted exactly once');
      assert.strictEqual(submittedValues[0], 'samsung smart tv');
      assert.strictEqual(button.isFocused(), true, 'Focus transferred to Go button');
      console.log('  ✓ Samsung TV Done (65376) committed text and submitted once');

      testPhysicalEnter();
    }, 15);
  })();

  // Test 3: Physical keyboard Enter key (13) commits when input is non-empty
  function testPhysicalEnter() {
    var input = createMockInput('duckduckgo');
    var button = createMockButton();
    var submittedValues = [];

    TextInput.bind(input, button, function(val) {
      submittedValues.push(val);
    });

    var prevented = false;
    input.dispatchEvent({
      type: 'keydown',
      keyCode: 13,
      repeat: false,
      isComposing: false,
      stopPropagation: function() {},
      preventDefault: function() { prevented = true; }
    });

    assert.strictEqual(prevented, true, 'Physical Enter prevents default form action');

    setTimeout(function() {
      assert.strictEqual(submittedValues.length, 1);
      assert.strictEqual(submittedValues[0], 'duckduckgo');
      console.log('  ✓ Physical keyboard Enter (13) commits and submits once');

      testEmptyEnter();
    }, 15);
  }

  // Test 4: Enter (13) on empty input does NOT submit or prevent default (allows IME activation)
  function testEmptyEnter() {
    var input = createMockInput('   ');
    var button = createMockButton();
    var submittedValues = [];

    TextInput.bind(input, button, function(val) {
      submittedValues.push(val);
    });

    var prevented = false;
    input.dispatchEvent({
      type: 'keydown',
      keyCode: 13,
      repeat: false,
      isComposing: false,
      stopPropagation: function() {},
      preventDefault: function() { prevented = true; }
    });

    assert.strictEqual(prevented, false, 'Empty input Enter does NOT prevent default');

    setTimeout(function() {
      assert.strictEqual(submittedValues.length, 0, 'Empty input does not submit');
      console.log('  ✓ Empty input Enter (13) preserves native IME activation');

      testCancelKey();
    }, 15);
  }

  // Test 5: Samsung IME Cancel (65385) closes editing without submitting
  function testCancelKey() {
    var input = createMockInput('typing in progress');
    input.focus();
    var button = createMockButton();
    var submittedValues = [];

    TextInput.bind(input, button, function(val) {
      submittedValues.push(val);
    });

    var stopped = false;
    input.dispatchEvent({
      type: 'keydown',
      keyCode: 65385,
      stopPropagation: function() { stopped = true; }
    });

    assert.strictEqual(stopped, true, 'Cancel stops event propagation');
    assert.strictEqual(input.isFocused(), false, 'Input blurred on Cancel');
    assert.strictEqual(button.isFocused(), true, 'Focus transferred away to button');

    setTimeout(function() {
      assert.strictEqual(submittedValues.length, 0, 'Cancel did not submit');
      console.log('  ✓ Samsung Cancel (65385) dismissed editing without submitting');

      testCompositionSafety();
    }, 15);
  }

  // Test 6: Composition safety - Enter during active composition does NOT submit
  function testCompositionSafety() {
    var input = createMockInput('한글');
    var button = createMockButton();
    var submittedValues = [];

    TextInput.bind(input, button, function(val) {
      submittedValues.push(val);
    });

    // Start composition
    input.dispatchEvent({ type: 'compositionstart' });

    input.dispatchEvent({
      type: 'keydown',
      keyCode: 13,
      repeat: false,
      isComposing: true,
      stopPropagation: function() {},
      preventDefault: function() {}
    });

    setTimeout(function() {
      assert.strictEqual(submittedValues.length, 0, 'No submission during composition');

      // End composition and then commit
      input.dispatchEvent({ type: 'compositionend' });
      input.dispatchEvent({
        type: 'keydown',
        keyCode: 65376,
        repeat: false,
        stopPropagation: function() {},
        preventDefault: function() {}
      });

      setTimeout(function() {
        assert.strictEqual(submittedValues.length, 1);
        assert.strictEqual(submittedValues[0], '한글');
        console.log('  ✓ Composition safety correctly guarded against premature commit');

        testGoButtonClick();
      }, 15);
    }, 15);
  }

  // Test 7: Visible Search/Go button click submits input
  function testGoButtonClick() {
    var input = createMockInput('bbc news');
    var button = createMockButton();
    var submittedValues = [];

    TextInput.bind(input, button, function(val) {
      submittedValues.push(val);
    });

    button.click();

    setTimeout(function() {
      assert.strictEqual(submittedValues.length, 1);
      assert.strictEqual(submittedValues[0], 'bbc news');
      console.log('  ✓ Visible Search / Go button submits committed text');

      if (done) done();
    }, 15);
  }
}

module.exports = { run };
if (require.main === module) {
  run(function() {
    console.log('All TextInput tests passed.');
  });
}
