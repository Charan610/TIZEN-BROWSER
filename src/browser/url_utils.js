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

      // IP Address format: e.g. 192.168.1.1:8080 with optional path/query/fragment
      if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?([/?#].*)?$/.test(trimmed)) {
        return true;
      }

      // Domain pattern (e.g. example.com, bbc.co.uk) with optional port and path/query/fragment
      if (/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(:\d+)?([/?#].*)?$/i.test(trimmed)) {
        return true;
      }

      // Localhost with optional port and path/query/fragment
      if (/^localhost(:\d+)?([/?#].*)?$/i.test(trimmed)) {
        return true;
      }

      return false;
    },

    /**
     * Normalize user input into a navigable URL
     * If user typed a search term, wraps with active search engine URL
     * @param {string} input
     * @param {string} [searchEngineKey='duckduckgo']
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

      // Explicit scheme check: reject if malformed
      if (/^https?:\/\//i.test(trimmed)) {
        if (!this.isUrl(trimmed)) {
          return '';
        }
        return trimmed;
      }

      if (this.isUrl(trimmed)) {
        return 'https://' + trimmed;
      }

      // Search engine fallback
      var engineKey = searchEngineKey || 'duckduckgo';
      var engines = SettingsSchema ? SettingsSchema.SEARCH_ENGINES : {};
      var engine = engines[engineKey] || engines.duckduckgo || { searchUrl: 'https://duckduckgo.com/?q=' };

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
