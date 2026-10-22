/**
 * Security Guard
 * Sanitizes untrusted strings, validates URLs, and prevents script injection.
 */

(function(global) {
  'use strict';

  var SecurityGuard = {
    /**
     * Escape HTML entities to prevent XSS
     * @param {string} str
     * @returns {string}
     */
    escapeHtml: function(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /**
     * Sanitize a URL to prevent javascript: or data: injection
     * @param {string} url
     * @returns {string} Safe URL or empty string
     */
    sanitizeUrl: function(url) {
      if (!url || typeof url !== 'string') return '';
      var trimmed = url.trim();
      var lower = trimmed.toLowerCase();

      if (lower.indexOf('javascript:') === 0 || lower.indexOf('data:') === 0 || lower.indexOf('vbscript:') === 0) {
        console.warn('[SecurityGuard] Disallowed URL scheme:', trimmed);
        return '';
      }

      return trimmed;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityGuard;
  } else {
    global.SecurityGuard = SecurityGuard;
  }
})(typeof window !== 'undefined' ? window : this);
