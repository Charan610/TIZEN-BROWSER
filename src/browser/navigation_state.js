/**
 * Navigation State Machine
 * Manages URL history stacks, back/forward availability, and page loading states.
 */

(function(global) {
  'use strict';

  function NavigationState(initialUrl) {
    this.history = initialUrl ? [initialUrl] : [];
    this.currentIndex = initialUrl ? 0 : -1;
    this.title = 'New Tab';
    this.isLoading = false;
    this.loadProgress = 0;
    this.lastError = null;
    this.listeners = [];
  }

  NavigationState.prototype = {
    /**
     * Navigate to a new URL, truncating forward history
     * @param {string} url
     */
    navigate: function(url) {
      if (!url) return;

      // Truncate any forward history
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1);
      }

      this.history.push(url);
      this.currentIndex = this.history.length - 1;
      this.lastError = null;
      this.notify();
    },

    /**
     * Check if back navigation is possible
     * @returns {boolean}
     */
    canGoBack: function() {
      return this.currentIndex > 0;
    },

    /**
     * Check if forward navigation is possible
     * @returns {boolean}
     */
    canGoForward: function() {
      return this.currentIndex < this.history.length - 1;
    },

    /**
     * Navigate backward in history
     * @returns {string|null} Previous URL or null
     */
    goBack: function() {
      if (this.canGoBack()) {
        this.currentIndex--;
        this.lastError = null;
        this.notify();
        return this.getCurrentUrl();
      }
      return null;
    },

    /**
     * Navigate forward in history
     * @returns {string|null} Next URL or null
     */
    goForward: function() {
      if (this.canGoForward()) {
        this.currentIndex++;
        this.lastError = null;
        this.notify();
        return this.getCurrentUrl();
      }
      return null;
    },

    /**
     * Get the current active URL
     * @returns {string}
     */
    getCurrentUrl: function() {
      if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
        return this.history[this.currentIndex];
      }
      return '';
    },

    /**
     * Update page title
     * @param {string} newTitle
     */
    setTitle: function(newTitle) {
      this.title = newTitle || 'Untitled';
      this.notify();
    },

    /**
     * Update loading status and progress
     * @param {boolean} loading
     * @param {number} [progress=0]
     */
    setLoading: function(loading, progress) {
      this.isLoading = !!loading;
      this.loadProgress = progress !== undefined ? progress : (loading ? 30 : 100);
      this.notify();
    },

    /**
     * Set a navigation error
     * @param {Object} errorObj
     */
    setError: function(errorObj) {
      this.isLoading = false;
      this.lastError = errorObj;
      this.notify();
    },

    /**
     * Clear error state
     */
    clearError: function() {
      this.lastError = null;
      this.notify();
    },

    /**
     * Subscribe to navigation changes
     * @param {Function} callback
     */
    subscribe: function(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
      }
    },

    /**
     * Notify listeners of state change
     */
    notify: function() {
      var stateSnapshot = {
        currentUrl: this.getCurrentUrl(),
        canGoBack: this.canGoBack(),
        canGoForward: this.canGoForward(),
        title: this.title,
        isLoading: this.isLoading,
        loadProgress: this.loadProgress,
        lastError: this.lastError
      };

      for (var i = 0; i < this.listeners.length; i++) {
        try {
          this.listeners[i](stateSnapshot);
        } catch (e) {
          console.error('[NavigationState] Listener error:', e);
        }
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationState;
  } else {
    global.NavigationState = NavigationState;
  }
})(typeof window !== 'undefined' ? window : this);
