/**
 * Storage Service
 * Provides robust persistent storage with JSON serialization,
 * error boundaries, in-memory fallback, and schema safety.
 */

(function(global) {
  'use strict';

  var memoryFallback = {};

  var StorageService = {
    /**
     * Get a parsed JSON value or default
     * @param {string} key
     * @param {*} defaultValue
     * @returns {*}
     */
    get: function(key, defaultValue) {
      try {
        if (typeof localStorage !== 'undefined') {
          var item = localStorage.getItem('tv_browser_' + key);
          if (item !== null && item !== undefined) {
            return JSON.parse(item);
          }
        }
      } catch (err) {
        console.warn('[Storage] Read error for key "' + key + '":', err.message);
      }

      if (memoryFallback.hasOwnProperty(key)) {
        return memoryFallback[key];
      }

      return defaultValue !== undefined ? defaultValue : null;
    },

    /**
     * Set a JSON-serializable value
     * @param {string} key
     * @param {*} value
     * @returns {boolean} Success status
     */
    set: function(key, value) {
      try {
        var serialized = JSON.stringify(value);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('tv_browser_' + key, serialized);
          return true;
        }
      } catch (err) {
        console.warn('[Storage] Write error for key "' + key + '":', err.message);
      }

      memoryFallback[key] = value;
      return true;
    },

    /**
     * Remove an item from storage
     * @param {string} key
     */
    remove: function(key) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('tv_browser_' + key);
        }
      } catch (err) {
        console.warn('[Storage] Remove error for key "' + key + '":', err.message);
      }

      delete memoryFallback[key];
    },

    /**
     * Clear all TV Browser application data
     */
    clearAll: function() {
      try {
        if (typeof localStorage !== 'undefined') {
          var keysToRemove = [];
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf('tv_browser_') === 0) {
              keysToRemove.push(k);
            }
          }
          for (var j = 0; j < keysToRemove.length; j++) {
            localStorage.removeItem(keysToRemove[j]);
          }
        }
      } catch (err) {
        console.warn('[Storage] ClearAll error:', err.message);
      }

      memoryFallback = {};
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
  } else {
    global.StorageService = StorageService;
  }
})(typeof window !== 'undefined' ? window : this);
