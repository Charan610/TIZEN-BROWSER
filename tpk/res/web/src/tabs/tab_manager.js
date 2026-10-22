/**
 * Tab & Session Manager
 * Manages concurrent tabs with strict TV memory budgeting.
 * Employs single-active-surface rendering: inactive tabs are suspended
 * and detached from the DOM to eliminate background CPU/memory drain.
 */

(function(global) {
  'use strict';

  var NavigationState = typeof module !== 'undefined' && module.exports
    ? require('../browser/navigation_state')
    : global.NavigationState;

  var SettingsManager = typeof module !== 'undefined' && module.exports
    ? require('../settings/settings_manager')
    : global.SettingsManager;

  var TabManager = {
    tabs: [],
    activeTabId: null,
    listeners: [],

    init: function(initialUrl) {
      var maxAllowed = SettingsManager ? SettingsManager.get('maxTabs') : 3;
      var defaultUrl = initialUrl || '';

      var initialTab = this.createTabObject(defaultUrl);
      this.tabs = [initialTab];
      this.activeTabId = initialTab.id;

      console.log('[TabManager] Initialized with tab ID:', initialTab.id);
      return initialTab;
    },

    createTabObject: function(url) {
      var id = 'tab_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      var navState = new NavigationState(url);

      return {
        id: id,
        url: url || '',
        title: url ? 'Loading...' : 'Start Page',
        navState: navState,
        isSuspended: false,
        createdAt: Date.now()
      };
    },

    /**
     * Open a new tab
     * @param {string} [url='']
     * @returns {Object|null} Created tab object, or null if tab limit reached
     */
    openTab: function(url) {
      var maxAllowed = SettingsManager ? SettingsManager.get('maxTabs') : 3;

      if (this.tabs.length >= maxAllowed) {
        console.warn('[TabManager] Tab limit reached (' + maxAllowed + ')');
        return null;
      }

      var newTab = this.createTabObject(url || '');
      this.tabs.push(newTab);
      this.switchToTab(newTab.id);
      return newTab;
    },

    /**
     * Switch to a specific tab by ID
     * @param {string} tabId
     */
    switchToTab: function(tabId) {
      var targetTab = this.getTab(tabId);
      if (!targetTab) return;

      var previousTab = this.getActiveTab();
      if (previousTab && previousTab.id !== tabId) {
        // Suspend previous tab to save TV RAM
        previousTab.isSuspended = true;
      }

      targetTab.isSuspended = false;
      this.activeTabId = tabId;
      this.notify();
    },

    /**
     * Close a tab by ID
     * @param {string} tabId
     */
    closeTab: function(tabId) {
      if (this.tabs.length <= 1) {
        // Cannot close the only remaining tab; reset it to start page instead
        var singleTab = this.tabs[0];
        singleTab.url = '';
        singleTab.title = 'Start Page';
        singleTab.navState = new NavigationState('');
        this.notify();
        return;
      }

      var index = -1;
      for (var i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].id === tabId) {
          index = i;
          break;
        }
      }

      if (index === -1) return;

      this.tabs.splice(index, 1);

      // If we closed the active tab, switch to adjacent tab
      if (this.activeTabId === tabId) {
        var newIndex = Math.min(index, this.tabs.length - 1);
        this.activeTabId = this.tabs[newIndex].id;
        this.tabs[newIndex].isSuspended = false;
      }

      this.notify();
    },

    getActiveTab: function() {
      return this.getTab(this.activeTabId);
    },

    getTab: function(tabId) {
      for (var i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].id === tabId) {
          return this.tabs[i];
        }
      }
      return null;
    },

    getAllTabs: function() {
      return this.tabs.slice(0);
    },

    subscribe: function(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
      }
    },

    notify: function() {
      var activeTab = this.getActiveTab();
      for (var i = 0; i < this.listeners.length; i++) {
        try {
          this.listeners[i](activeTab, this.tabs);
        } catch (e) {
          console.error('[TabManager] Listener error:', e);
        }
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabManager;
  } else {
    global.TabManager = TabManager;
  }
})(typeof window !== 'undefined' ? window : this);
