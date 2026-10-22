/**
 * URL Utilities & Search Query Builder
 * Validates URLs, blocks unsafe schemes, and formats search engine queries.
 */

(function(global) {
  'use strict';

  var SettingsSchema = typeof module !== 'undefined' && module.exports
    ? require('../settings/settings_schema')
    : global.SettingsSchema;

  var UNSAFE_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:blank'];

  var UrlUtils = {
    /**
     * Check if a scheme is unsafe or prohibited
     * @param {string} urlString
     * @returns {boolean}
     */
    isUnsafeScheme: function(urlString) {
      if (!urlString) return true;
      var trimmed = urlString.trim().toLowerCase();
      for (var i = 0; i < UNSAFE_SCHEMES.length; i++) {
        if (trimmed.indexOf(UNSAFE_SCHEMES[i]) === 0) {
          return true;
        }
      }
      return false;
    },

    /**
     * Check whether an input string is a valid URL or a search phrase
     * @param {string} input
     * @returns {boolean}
     */
    isUrl: function(input) {
      if (!input) return false;
      var trimmed = input.trim();
      if (!trimmed) return false;

      // Explicit scheme
      if (/^https?:\/\//i.test(trimmed)) {
        var withoutScheme = trimmed.replace(/^https?:\/\//i, '');
        var host = withoutScheme.split(/[/?#]/)[0];
        if (!host || host.length === 0) return false;
        try {
          var u = new URL(trimmed);
          return !!u.hostname;
        } catch (e) {
          return false;
        }
      }

      // Contains spaces -> search query
      if (/\s/.test(trimmed)) {
        return false;
      }

      // IP Address format: e.g. 192.168.1.1 or 192.168.1.1:8080 with optional path/query/fragment
      if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?([/?#].*)?$/.test(trimmed)) {
        return true;
      }

      // Domain pattern (e.g. example.com, bbc.co.uk, xn--...) with optional port and path/query/fragment
      if (/^([a-z0-9\u00a1-\uffff]([a-z0-9\u00a1-\uffff-]*[a-z0-9\u00a1-\uffff])?\.)+[a-z\u00a1-\uffff]{2,}(:\d+)?([/?#].*)?$/i.test(trimmed)) {
        return true;
      }

      // Localhost with optional port and path/query/fragment
      if (/^localhost(:\d+)?([/?#].*)?$/i.test(trimmed)) {
        return true;
      }

      return false;
    },

    /**
     * Check if a target string is a local network address or localhost
     * @param {string} target
     * @returns {boolean}
     */
    isLocalOrIp: function(target) {
      if (!target) return false;
      var clean = target.replace(/^https?:\/\//i, '').trim();
      return /^((\d{1,3}\.){3}\d{1,3}|localhost)(:\d+)?([/?#].*)?$/i.test(clean);
    },

    /**
     * Normalize user input into a navigable URL
     * If user typed a search term, wraps with active search engine URL
     * @param {string} input
     * @param {string} [searchEngineKey] Optional search engine key (defaults to google or schema default)
     * @returns {string} Safe navigable URL
     */
    normalizeInput: function(input, searchEngineKey) {
      if (!input) return '';
      var trimmed = input.trim();
      if (!trimmed) return '';

      if (this.isUnsafeScheme(trimmed)) {
        console.warn('[UrlUtils] Blocked unsafe URL scheme:', trimmed);
        return '';
      }

      // Explicit scheme check: validate and return if sound
      if (/^https?:\/\//i.test(trimmed)) {
        if (!this.isUrl(trimmed)) {
          return '';
        }
        return trimmed;
      }

      if (this.isUrl(trimmed)) {
        // Local IPs and localhost default to http:// scheme
        if (this.isLocalOrIp(trimmed)) {
          return 'http://' + trimmed;
        }
        return 'https://' + trimmed;
      }

      // Search query fallback: construct search URL
      var engineKey = searchEngineKey || 'google';
      var engines = SettingsSchema ? SettingsSchema.SEARCH_ENGINES : {};
      var engine = engines[engineKey] || engines.google || engines.duckduckgo || { searchUrl: 'https://www.google.com/search?q=' };

      return engine.searchUrl + encodeURIComponent(trimmed);
    },

    /**
     * Extract hostname from a URL string
     * @param {string} urlString
     * @returns {string} Hostname or empty string
     */
    extractHost: function(urlString) {
      if (!urlString) return '';
      try {
        var match = urlString.match(/^https?:\/\/([^/?#]+)/i);
        return match ? match[1].toLowerCase() : '';
      } catch (e) {
        return '';
      }
    },

    /**
     * Extract base origin (protocol + host)
     * @param {string} urlString
     * @returns {string}
     */
    extractOrigin: function(urlString) {
      if (!urlString) return '';
      try {
        var match = urlString.match(/^(https?:\/\/[^/?#]+)/i);
        return match ? match[1] : '';
      } catch (e) {
        return '';
      }
    },

    /**
     * Format a display URL (stripping protocol and query for clean UI display)
     * @param {string} urlString
     * @returns {string}
     */
    formatDisplayUrl: function(urlString) {
      if (!urlString) return '';
      return urlString
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UrlUtils;
  } else {
    global.UrlUtils = UrlUtils;
  }
})(typeof window !== 'undefined' ? window : this);
