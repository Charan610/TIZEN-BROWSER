/**
 * Bidirectional JavaScript Bridge between Web UI and Native Tizen.WebView Host
 */

(function(global) {
  'use strict';

  var NativeBridge = {
    /**
     * Checks if the Native C# Tizen.WebView host bridge is active
     * @returns {boolean}
     */
    isAvailable: function() {
      return typeof global.sbnative !== 'undefined' && typeof global.sbnative.postMessage === 'function';
    },

    /**
     * Request the native browser host to navigate to a target URL
     * @param {string} url
     * @returns {boolean}
     */
    navigate: function(url) {
      if (this.isAvailable()) {
        global.sbnative.postMessage('navigate\u0001' + url);
        return true;
      }
      return false;
    },

    /**
     * Request the native browser to navigate back
     * @returns {boolean}
     */
    goBack: function() {
      if (this.isAvailable()) {
        global.sbnative.postMessage('back');
        return true;
      }
      return false;
    },

    /**
     * Request the native browser to navigate forward
     * @returns {boolean}
     */
    goForward: function() {
      if (this.isAvailable()) {
        global.sbnative.postMessage('forward');
        return true;
      }
      return false;
    },

    /**
     * Request the native browser to reload current page
     * @returns {boolean}
     */
    reload: function() {
      if (this.isAvailable()) {
        global.sbnative.postMessage('reload');
        return true;
      }
      return false;
    },

    /**
     * Request the native browser to stop loading
     * @returns {boolean}
     */
    stopLoading: function() {
      if (this.isAvailable()) {
        global.sbnative.postMessage('stop');
        return true;
      }
      return false;
    },

    /**
     * Switch active tab in native host
     * @param {number} index
     * @returns {boolean}
     */
    switchTab: function(index) {
      if (this.isAvailable()) {
        global.sbnative.postMessage('tab_switch\u0001' + index);
        return true;
      }
      return false;
    },

    /**
     * Open new tab in native host
     * @param {string} [url]
     * @returns {boolean}
     */
    newTab: function(url) {
      if (this.isAvailable()) {
        global.sbnative.postMessage('tab_new\u0001' + (url || ''));
        return true;
      }
      return false;
    },

    /**
     * Close tab in native host
     * @param {number} index
     * @returns {boolean}
     */
    closeTab: function(index) {
      if (this.isAvailable()) {
        global.sbnative.postMessage('tab_close\u0001' + index);
        return true;
      }
      return false;
    },

    /**
     * Notify native host of bookmark toggle
     * @param {string} url
     * @param {string} [title]
     * @returns {boolean}
     */
    toggleBookmark: function(url, title) {
      if (this.isAvailable()) {
        global.sbnative.postMessage('bookmark_toggle\u0001' + url + '\u0001' + (title || ''));
        return true;
      }
      return false;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NativeBridge;
  } else {
    global.NativeBridge = NativeBridge;
  }
})(typeof window !== 'undefined' ? window : this);
