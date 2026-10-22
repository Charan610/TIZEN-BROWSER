/**
 * On-Screen TV Virtual Keyboard
 * Designed specifically for television distance and remote D-pad navigation.
 * Features QWERTY, numeric row, symbols page, URL shortcuts, and input binding.
 */

(function(global) {
  'use strict';

  var SpatialNav = typeof module !== 'undefined' && module.exports
    ? require('../navigation/spatial_nav')
    : global.SpatialNav;

  var QWERTY_LAYOUT = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'BACKSPACE'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '-'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '.', '/'],
    ['SHIFT', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '@', ':', 'CLEAR'],
    ['SYM', '.com', '.org', 'https://', 'SPACE', 'ENTER']
  ];

  var SYMBOLS_LAYOUT = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'BACKSPACE'],
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_'],
    ['~', '`', '+', '=', '{', '}', '[', ']', '|', '\\', '?'],
    ['ABC', '<', '>', ';', '\'', '"', ',', '.', '/', 'CLEAR'],
    ['.net', '.io', 'http://', 'SPACE', 'ENTER']
  ];

  var TVKeyboard = {
    isOpen: false,
    targetInput: null,
    isShift: false,
    isSymbols: false,
    containerEl: null,
    previousFocusedElement: null,
    onSubmitCallback: null,

    init: function() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('tv-keyboard-container')) {
        this.containerEl = document.getElementById('tv-keyboard-container');
        return;
      }

      this.containerEl = document.createElement('div');
      this.containerEl.id = 'tv-keyboard-container';
      this.containerEl.className = 'tv-keyboard-container hidden';
      document.body.appendChild(this.containerEl);
    },

    /**
     * Open keyboard bound to a specific text input or URL field
     * @param {HTMLInputElement} inputEl
     * @param {Function} [onSubmit]
     */
    open: function(inputEl, onSubmit) {
      this.targetInput = inputEl;
      this.onSubmitCallback = onSubmit || null;
      this.isOpen = true;
      this.previousFocusedElement = document.activeElement;

      this.render();
      this.containerEl.classList.remove('hidden');

      if (SpatialNav) {
        SpatialNav.setContainer(this.containerEl);
        // Default focus on space or first key
        var defaultKey = this.containerEl.querySelector('[data-key="q"]') || this.containerEl.querySelector('button');
        SpatialNav.initFocus(defaultKey);
      }
    },

    /**
     * Close the virtual keyboard
     */
    close: function() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.containerEl.classList.add('hidden');

      if (SpatialNav) {
        SpatialNav.setContainer(null);
        if (this.previousFocusedElement) {
          SpatialNav.focus(this.previousFocusedElement);
        }
      }
    },

    render: function() {
      var layout = this.isSymbols ? SYMBOLS_LAYOUT : QWERTY_LAYOUT;
      var html = '<div class="tv-keyboard-card">';
      
      // Input Preview Bar
      var currentVal = this.targetInput ? this.targetInput.value : '';
      html += '<div class="tv-keyboard-preview">' +
                '<span class="preview-text">' + (this.escapeHtml(currentVal) || '<span class="placeholder">Type with D-pad...</span>') + '</span>' +
                '<button type="button" class="keyboard-btn-close" data-action="CLOSE">✕</button>' +
              '</div>';

      // Rows
      html += '<div class="tv-keyboard-grid">';
      for (var r = 0; r < layout.length; r++) {
        html += '<div class="keyboard-row">';
        for (var c = 0; c < layout[r].length; c++) {
          var key = layout[r][c];
          var displayKey = key;
          var keyClass = 'keyboard-key';

          if (this.isShift && key.length === 1 && !this.isSymbols) {
            displayKey = key.toUpperCase();
          }

          if (key === 'SPACE') {
            displayKey = 'Space';
            keyClass += ' key-space';
          } else if (key === 'ENTER') {
            displayKey = 'Go / Enter';
            keyClass += ' key-enter';
          } else if (key === 'BACKSPACE') {
            displayKey = '⌫';
            keyClass += ' key-backspace';
          } else if (key === 'SHIFT') {
            displayKey = this.isShift ? '⬆ Shift (On)' : '⇧ Shift';
            keyClass += ' key-action';
          } else if (key === 'SYM' || key === 'ABC') {
            displayKey = key;
            keyClass += ' key-action';
          } else if (key === 'CLEAR') {
            displayKey = 'Clear';
            keyClass += ' key-action';
          } else if (key.indexOf('.') === 0 || key.indexOf('http') === 0) {
            keyClass += ' key-helper';
          }

          html += '<button type="button" class="' + keyClass + '" data-key="' + key + '">' + displayKey + '</button>';
        }
        html += '</div>';
      }
      html += '</div></div>';

      this.containerEl.innerHTML = html;
      this.bindEvents();
    },

    bindEvents: function() {
      var self = this;
      var buttons = this.containerEl.querySelectorAll('button');

      for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function(e) {
          e.stopPropagation();
          var key = this.getAttribute('data-key');
          var action = this.getAttribute('data-action');
          if (action === 'CLOSE') {
            self.close();
            return;
          }
          self.handleKeyPress(key);
        });
      }
    },

    handleKeyPress: function(key) {
      if (!this.targetInput) return;

      var val = this.targetInput.value;

      if (key === 'BACKSPACE') {
        if (val.length > 0) {
          this.targetInput.value = val.substring(0, val.length - 1);
        }
      } else if (key === 'CLEAR') {
        this.targetInput.value = '';
      } else if (key === 'SPACE') {
        this.targetInput.value = val + ' ';
      } else if (key === 'SHIFT') {
        this.isShift = !this.isShift;
        this.render();
        return;
      } else if (key === 'SYM') {
        this.isSymbols = true;
        this.render();
        return;
      } else if (key === 'ABC') {
        this.isSymbols = false;
        this.render();
        return;
      } else if (key === 'ENTER') {
        var finalValue = this.targetInput.value;
        this.close();
        if (typeof this.onSubmitCallback === 'function') {
          this.onSubmitCallback(finalValue);
        }
        return;
      } else {
        var charToAdd = key;
        if (this.isShift && charToAdd.length === 1 && !this.isSymbols) {
          charToAdd = charToAdd.toUpperCase();
        }
        this.targetInput.value = val + charToAdd;
      }

      // Trigger standard input event so bound listeners update
      var event = new Event('input', { bubbles: true });
      this.targetInput.dispatchEvent(event);

      // Update preview text
      var previewText = this.containerEl.querySelector('.preview-text');
      if (previewText) {
        previewText.textContent = this.targetInput.value || '';
      }
    },

    escapeHtml: function(text) {
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TVKeyboard;
  } else {
    global.TVKeyboard = TVKeyboard;
  }
})(typeof window !== 'undefined' ? window : this);
