/**
 * Toast Notification Service
 */

(function(global) {
  'use strict';

  var Toast = {
    toastEl: null,
    timeoutId: null,

    init: function() {
      if (typeof document === 'undefined') return;
      if (!document.getElementById('toast-container')) {
        this.toastEl = document.createElement('div');
        this.toastEl.id = 'toast-container';
        this.toastEl.className = 'toast-container';
        document.body.appendChild(this.toastEl);
      } else {
        this.toastEl = document.getElementById('toast-container');
      }
    },

    show: function(message, durationMs) {
      this.init();
      if (!this.toastEl) return;

      this.toastEl.textContent = message;
      this.toastEl.classList.add('visible');

      if (this.timeoutId) clearTimeout(this.timeoutId);
      var duration = durationMs || 3000;
      var self = this;

      this.timeoutId = setTimeout(function() {
        if (self.toastEl) self.toastEl.classList.remove('visible');
      }, duration);
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Toast;
  } else {
    global.Toast = Toast;
  }
})(typeof window !== 'undefined' ? window : this);
