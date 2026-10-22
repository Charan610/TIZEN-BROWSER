/**
 * Settings Manager
 * Manages reactive retrieval, updates, and persistence of browser settings.
 */

(function(global) {
  'use strict';

  var Storage = typeof module !== 'undefined' && module.exports 
    ? require('../storage/storage_service') 
    : global.StorageService;

  var Schema = typeof module !== 'undefined' && module.exports 
    ? require('./settings_schema') 
    : global.SettingsSchema;

  var STORAGE_KEY = 'settings';
  var currentSettings = null;
  var listeners = [];

  var SettingsManager = {
    /**
     * Initialize settings from persistent storage
     */
    init: function() {
      var saved = Storage.get(STORAGE_KEY, {});
      currentSettings = Object.assign({}, Schema.DEFAULT_SETTINGS, saved);
      this.applyTheme(currentSettings);
      return currentSettings;
    },

    /**
     * Get all current settings
     * @returns {Object}
     */
    getAll: function() {
      if (!currentSettings) {
        this.init();
      }
      return Object.assign({}, currentSettings);
    },

    /**
     * Get a specific setting value
     * @param {string} key
     * @returns {*}
     */
    get: function(key) {
      if (!currentSettings) {
        this.init();
      }
      return currentSettings.hasOwnProperty(key) 
        ? currentSettings[key] 
        : Schema.DEFAULT_SETTINGS[key];
    },

    /**
     * Update one or more settings
     * @param {Object} partialSettings
     */
    set: function(partialSettings) {
      if (!currentSettings) {
        this.init();
      }

      for (var key in partialSettings) {
        if (partialSettings.hasOwnProperty(key)) {
          currentSettings[key] = partialSettings[key];
        }
      }

      Storage.set(STORAGE_KEY, currentSettings);
      this.applyTheme(currentSettings);
      this.notifyListeners(currentSettings);
    },

    /**
     * Reset all settings to defaults
     */
    resetToDefaults: function() {
      currentSettings = Object.assign({}, Schema.DEFAULT_SETTINGS);
      Storage.set(STORAGE_KEY, currentSettings);
      this.applyTheme(currentSettings);
      this.notifyListeners(currentSettings);
      return currentSettings;
    },

    /**
     * Apply active theme and text scale to the document root
     * @param {Object} settings
     */
    applyTheme: function(settings) {
      if (typeof document === 'undefined') return;

      var docEl = document.documentElement;
      if (!docEl) return;

      // Theme attribute
      docEl.setAttribute('data-theme', settings.theme || 'dark');

      // Accent color
      docEl.style.setProperty('--accent-color', settings.accentColor || '#38bdf8');

      // Text scaling
      var scale = settings.textScale || 100;
      docEl.style.fontSize = (scale / 100 * 16) + 'px';

      // Animation suppression
      if (settings.disableAnimations) {
        docEl.classList.add('disable-animations');
      } else {
        docEl.classList.remove('disable-animations');
      }
    },

    /**
     * Subscribe to settings changes
     * @param {Function} callback
     */
    subscribe: function(callback) {
      if (typeof callback === 'function') {
        listeners.push(callback);
      }
    },

    /**
     * Unsubscribe from settings changes
     * @param {Function} callback
     */
    unsubscribe: function(callback) {
      listeners = listeners.filter(function(fn) {
        return fn !== callback;
      });
    },

    /**
     * Notify all registered listeners
     * @param {Object} settings
     */
    notifyListeners: function(settings) {
      for (var i = 0; i < listeners.length; i++) {
        try {
          listeners[i](settings);
        } catch (err) {
          console.error('[Settings] Listener error:', err);
        }
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
  } else {
    global.SettingsManager = SettingsManager;
  }
})(typeof window !== 'undefined' ? window : this);
