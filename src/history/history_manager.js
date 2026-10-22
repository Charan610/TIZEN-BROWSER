/**
 * History Manager
 * Records visited pages with timestamps, manages storage bounds,
 * and honors Private Browsing restrictions.
 */

(function(global) {
  'use strict';

  var Storage = typeof module !== 'undefined' && module.exports
    ? require('../storage/storage_service')
    : global.StorageService;

  var SettingsManager = typeof module !== 'undefined' && module.exports
    ? require('../settings/settings_manager')
    : global.SettingsManager;

  var STORAGE_KEY = 'browsing_history';
  var MAX_HISTORY_ITEMS = 100;

  var HistoryManager = {
    history: [],

    init: function() {
      this.history = Storage ? Storage.get(STORAGE_KEY, []) : [];
      return this.history;
    },

    /**
     * Record a visited page
     * @param {string} url
     * @param {string} [title]
     */
    add: function(url, title) {
      if (!url) return;

      // Check if private browsing is enabled
      var isPrivate = SettingsManager ? SettingsManager.get('privateBrowsing') : false;
      if (isPrivate) {
        return; // Never persist in private mode
      }

      // Avoid immediate duplicate
      if (this.history.length > 0 && this.history[0].url === url) {
        this.history[0].visitedAt = Date.now();
        if (title) this.history[0].title = title;
        this.persist();
        return;
      }

      this.history.unshift({
        url: url,
        title: title || url,
        visitedAt: Date.now()
      });

      if (this.history.length > MAX_HISTORY_ITEMS) {
        this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
      }

      this.persist();
    },

    getAll: function() {
      return this.history.slice(0);
    },

    clear: function() {
      this.history = [];
      this.persist();
    },

    persist: function() {
      if (Storage) {
        Storage.set(STORAGE_KEY, this.history);
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
  } else {
    global.HistoryManager = HistoryManager;
  }
})(typeof window !== 'undefined' ? window : this);
