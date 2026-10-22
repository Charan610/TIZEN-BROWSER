/**
 * Popup & Redirect Loop Shield
 * Intercepts unwanted popups, blocks aggressive new-window attempts,
 * and tracks redirect loops.
 */

(function(global) {
  'use strict';

  var PopupShield = {
    blockedPopupsCount: 0,
    blockedRedirectsCount: 0,
    recentRedirects: [],
    MAX_REDIRECT_CHAIN: 3,
    REDIRECT_WINDOW_MS: 3000,
    listeners: [],

    init: function() {
      var self = this;
      if (typeof window !== 'undefined') {
        // Protect parent window against unprompted window.open attempts
        var originalOpen = window.open;
        window.open = function(url, target, features) {
          console.warn('[PopupShield] Blocked unauthorized window.open:', url);
          self.blockedPopupsCount++;
          self.notify('POPUP_BLOCKED', url);
          return null;
        };
      }
    },

    /**
     * Check if a redirect should be allowed or blocked due to looping/hijacking
     * @param {string} fromUrl
     * @param {string} toUrl
     * @returns {boolean} True if allowed, false if blocked
     */
    evaluateRedirect: function(fromUrl, toUrl) {
      var now = Date.now();
      
      // Prune old redirects
      this.recentRedirects = this.recentRedirects.filter(function(item) {
        return now - item.timestamp < PopupShield.REDIRECT_WINDOW_MS;
      });

      this.recentRedirects.push({
        from: fromUrl,
        to: toUrl,
        timestamp: now
      });

      if (this.recentRedirects.length > this.MAX_REDIRECT_CHAIN) {
        console.warn('[PopupShield] Blocked aggressive redirect chain (' + this.recentRedirects.length + ' hops):', toUrl);
        this.blockedRedirectsCount++;
        this.notify('REDIRECT_LOOP_BLOCKED', toUrl);
        return false;
      }

      return true;
    },

    /**
     * Subscribe to popup and redirect events
     * @param {Function} callback
     */
    subscribe: function(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
      }
    },

    notify: function(type, url) {
      for (var i = 0; i < this.listeners.length; i++) {
        try {
          this.listeners[i]({
            type: type,
            url: url,
            blockedPopups: this.blockedPopupsCount,
            blockedRedirects: this.blockedRedirectsCount
          });
        } catch (e) {
          console.error('[PopupShield] Listener error:', e);
        }
      }
    },

    resetStats: function() {
      this.blockedPopupsCount = 0;
      this.blockedRedirectsCount = 0;
      this.recentRedirects = [];
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PopupShield;
  } else {
    global.PopupShield = PopupShield;
  }
})(typeof window !== 'undefined' ? window : this);
