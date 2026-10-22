/**
 * Shared Samsung IME and Keyboard Submission Controller
 * Handles Samsung TV virtual keyboard Done (65376), Cancel (65385),
 * physical keyboard Enter (13), IME composition, and single commit submission.
 */
(function(global) {
  'use strict';

  var TextInput = {
    isEditing: function(element) {
      return !!element && (/^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName) || !!element.isContentEditable);
    },

    bind: function(input, button, onSubmit) {
      if (!input) return;
      var pending = false;
      var composing = false;

      function submit() {
        if (pending) return;
        var value = input.value.trim();
        if (!value) return;
        pending = true;

        // Commit after IME final character commit
        setTimeout(function() {
          pending = false;
          var committed = input.value.trim();
          if (!committed) return;
          input.blur();
          if (global.Suggestions && typeof global.Suggestions.hide === 'function') {
            global.Suggestions.hide();
          }
          if (button) button.focus();
          if (onSubmit) onSubmit(committed);
        }, 0);
      }

      input.addEventListener('compositionstart', function() {
        composing = true;
      });

      input.addEventListener('compositionend', function() {
        composing = false;
      });

      input.addEventListener('keydown', function(event) {
        var code = event.keyCode || event.which;

        // Samsung IME Cancel / Escape / Hardware Back: dismiss editing without navigating or exiting
        if (code === 65385 || code === 10009 || code === 27) {
          event.stopPropagation();
          input.blur();
          if (global.Suggestions && typeof global.Suggestions.hide === 'function') {
            global.Suggestions.hide();
          }
          if (button) button.focus();
          return;
        }

        // Down Arrow: if suggestions list is open, move focus into suggestions
        if (code === 40 && global.Suggestions && typeof global.Suggestions.isOpen === 'function' && global.Suggestions.isOpen()) {
          event.preventDefault();
          event.stopPropagation();
          global.Suggestions.focusFirst();
          return;
        }

        // Samsung TV IME Done keycode
        if (code === 65376) {
          event.stopPropagation();
          if (!event.repeat) {
            submit();
          }
          return;
        }

        // Physical Keyboard Enter (13)
        if (code === 13 && !composing && !event.isComposing) {
          // If input is empty, allow remote OK to activate / open native IME
          if (!input.value.trim()) {
            return;
          }
          event.stopPropagation();
          event.preventDefault();
          if (!event.repeat) {
            submit();
          }
        }
      });

      if (button) {
        button.addEventListener('click', function() {
          submit();
        });
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextInput;
  } else {
    global.TextInput = TextInput;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
