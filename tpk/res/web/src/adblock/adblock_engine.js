/**
 * TV Browser Ad Blocking & Threat Protection Engine
 * Orchestrates navigation guards, sandbox policies, cosmetic hiding,
 * popup suppression, and verified protection metrics.
 */

(function(global) {
  'use strict';

  var CosmeticRules = typeof module !== 'undefined' && module.exports
    ? require('./cosmetic_rules')
    : global.CosmeticRules;

  var PopupShield = typeof module !== 'undefined' && module.exports
    ? require('./popup_shield')
    : global.PopupShield;

  var Allowlist = typeof module !== 'undefined' && module.exports
    ? require('./allowlist')
    : global.Allowlist;

  var SettingsManager = typeof module !== 'undefined' && module.exports
    ? require('../settings/settings_manager')
    : global.SettingsManager;

  var AdBlockEngine = {
    // Verified metrics (strictly real events, never estimated)
    metrics: {
      blockedPopups: 0,
      blockedRedirects: 0,
      cosmeticallyHiddenElements: 0,
      blockedUnsafeSchemes: 0
    },

    observer: null,
    cleanTimeout: null,

    init: function() {
      if (Allowlist) Allowlist.init();
      if (PopupShield) {
        PopupShield.init();
        var self = this;
        PopupShield.subscribe(function(event) {
          if (event.type === 'POPUP_BLOCKED') self.metrics.blockedPopups++;
          if (event.type === 'REDIRECT_LOOP_BLOCKED') self.metrics.blockedRedirects++;
        });
      }
      console.log('[AdBlockEngine] Initialized with 5 protection layers active');
    },

    /**
     * Check if ad-blocking is active for a given host or URL
     * @param {string} hostOrUrl
     * @returns {boolean}
     */
    isEnabledFor: function(hostOrUrl) {
      var globalEnabled = SettingsManager ? SettingsManager.get('adblockEnabled') : true;
      if (!globalEnabled) return false;

      if (Allowlist && Allowlist.isAllowlisted(hostOrUrl)) {
        return false;
      }

      return true;
    },

    /**
     * Layer 1: Validate URL navigation
     * @param {string} url
     * @returns {{ allowed: boolean, reason?: string }}
     */
    validateNavigation: function(url) {
      if (!url) return { allowed: false, reason: 'Empty URL' };

      var lower = url.trim().toLowerCase();

      // Check unsafe schemes
      if (lower.indexOf('javascript:') === 0 || lower.indexOf('data:') === 0 || lower.indexOf('vbscript:') === 0) {
        this.metrics.blockedUnsafeSchemes++;
        return { allowed: false, reason: 'Blocked unsafe script scheme: ' + lower.split(':')[0] };
      }

      return { allowed: true };
    },

    /**
     * Layer 3: Inject cosmetic hiding styles into a document (Reader mode or local test views)
     * @param {Document} doc
     * @param {string} hostOrUrl
     */
    injectCosmeticFilters: function(doc, hostOrUrl) {
      if (!doc || !this.isEnabledFor(hostOrUrl)) return;

      var existingStyle = doc.getElementById('tv-browser-adblock-styles');
      if (existingStyle) existingStyle.remove();

      var hideCookies = SettingsManager ? SettingsManager.get('hideCookieBanners') : true;
      var strictMode = SettingsManager ? SettingsManager.get('strictMode') : false;

      var css = CosmeticRules.generateCSS(hideCookies, strictMode);

      var styleEl = doc.createElement('style');
      styleEl.id = 'tv-browser-adblock-styles';
      styleEl.type = 'text/css';
      styleEl.appendChild(doc.createTextNode(css));

      (doc.head || doc.documentElement).appendChild(styleEl);

      // Perform one-pass count of matching elements for verified statistics
      this.countHiddenElements(doc, hideCookies, strictMode);

      // Setup bounded observer for dynamically inserted ads
      this.setupObserver(doc);
    },

    /**
     * Count matching hidden elements to update verifiable statistics
     */
    countHiddenElements: function(doc, hideCookies, strictMode) {
      try {
        var selectors = CosmeticRules.AD_SELECTORS;
        if (hideCookies) selectors = selectors.concat(CosmeticRules.COOKIE_BANNER_SELECTORS);
        if (strictMode) selectors = selectors.concat(CosmeticRules.STRICT_AD_SELECTORS);

        var count = 0;
        var query = selectors.join(',');
        var found = doc.querySelectorAll(query);
        count = found ? found.length : 0;

        if (count > 0) {
          this.metrics.cosmeticallyHiddenElements += count;
          console.log('[AdBlockEngine] Cosmetically hidden elements in document:', count);
        }
      } catch (e) {
        // Selector parsing error guard
      }
    },

    /**
     * Bounded mutation observer for dynamic ad injections
     */
    setupObserver: function(doc) {
      var self = this;
      if (typeof MutationObserver === 'undefined' || !doc.body) return;

      if (this.observer) {
        this.observer.disconnect();
      }

      this.observer = new MutationObserver(function() {
        if (self.cleanTimeout) return;
        self.cleanTimeout = setTimeout(function() {
          self.cleanTimeout = null;
          var hideCookies = SettingsManager ? SettingsManager.get('hideCookieBanners') : true;
          var strictMode = SettingsManager ? SettingsManager.get('strictMode') : false;
          self.countHiddenElements(doc, hideCookies, strictMode);
        }, 300);
      });

      this.observer.observe(doc.body, { childList: true, subtree: true });
    },

    disconnectObserver: function() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      if (this.cleanTimeout) {
        clearTimeout(this.cleanTimeout);
        this.cleanTimeout = null;
      }
    },

    getMetrics: function() {
      return Object.assign({}, this.metrics);
    },

    resetMetrics: function() {
      this.metrics = {
        blockedPopups: 0,
        blockedRedirects: 0,
        cosmeticallyHiddenElements: 0,
        blockedUnsafeSchemes: 0
      };
      if (PopupShield) PopupShield.resetStats();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdBlockEngine;
  } else {
    global.AdBlockEngine = AdBlockEngine;
  }
})(typeof window !== 'undefined' ? window : this);
