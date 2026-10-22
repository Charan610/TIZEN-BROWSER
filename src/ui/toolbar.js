/**
 * Header Toolbar Controller
 * Manages browser controls (Back, Forward, Reload, Home, Omnibox, Actions),
 * auto-hide animations, and remote keyboard integration.
 */

(function(global) {
  'use strict';

  var Toolbar = {
    toolbarEl: null,
    addressInputEl: null,
    btnBack: null,
    btnForward: null,
    btnReload: null,
    btnHome: null,
    btnBookmark: null,
    btnReader: null,
    btnPointer: null,
    btnTabs: null,
    btnSettings: null,
    hideTimer: null,
    isAutoHidden: false,
    callbacks: {},

    init: function(callbacks) {
      this.callbacks = callbacks || {};
      this.toolbarEl = document.getElementById('app-toolbar');
      if (!this.toolbarEl) return;

      this.addressInputEl = document.getElementById('toolbar-address-input');
      this.btnBack = document.getElementById('btn-nav-back');
      this.btnForward = document.getElementById('btn-nav-forward');
      this.btnReload = document.getElementById('btn-nav-reload');
      this.btnHome = document.getElementById('btn-nav-home');
      this.btnBookmark = document.getElementById('btn-nav-bookmark');
      this.btnReader = document.getElementById('btn-nav-reader');
      this.btnPointer = document.getElementById('btn-nav-pointer');
      this.btnTabs = document.getElementById('btn-nav-tabs');
      this.btnSettings = document.getElementById('btn-nav-settings');

      this.bindEvents();
    },

    bindEvents: function() {
      var self = this;

      if (this.btnBack) {
        this.btnBack.addEventListener('click', function() {
          if (self.callbacks.onBack) self.callbacks.onBack();
        });
      }

      if (this.btnForward) {
        this.btnForward.addEventListener('click', function() {
          if (self.callbacks.onForward) self.callbacks.onForward();
        });
      }

      if (this.btnReload) {
        this.btnReload.addEventListener('click', function() {
          if (self.callbacks.onReload) self.callbacks.onReload();
        });
      }

      if (this.btnHome) {
        this.btnHome.addEventListener('click', function() {
          if (self.callbacks.onHome) self.callbacks.onHome();
        });
      }

      if (this.btnBookmark) {
        this.btnBookmark.addEventListener('click', function() {
          if (self.callbacks.onBookmark) self.callbacks.onBookmark();
        });
      }

      if (this.btnReader) {
        this.btnReader.addEventListener('click', function() {
          if (self.callbacks.onToggleReader) self.callbacks.onToggleReader();
        });
      }

      if (this.btnPointer) {
        this.btnPointer.addEventListener('click', function() {
          if (self.callbacks.onTogglePointer) self.callbacks.onTogglePointer();
        });
      }

      if (this.btnTabs) {
        this.btnTabs.addEventListener('click', function() {
          if (self.callbacks.onOpenTabs) self.callbacks.onOpenTabs();
        });
      }

      if (this.btnSettings) {
        this.btnSettings.addEventListener('click', function() {
          if (self.callbacks.onOpenSettings) self.callbacks.onOpenSettings();
        });
      }

      if (global.TextInput) {
        global.TextInput.bind(this.addressInputEl, document.getElementById('toolbar-search-go'), function(value) {
          if (self.callbacks.onNavigate) self.callbacks.onNavigate(value);
        });
      }

      if (global.Suggestions && this.addressInputEl) {
        global.Suggestions.attach(this.addressInputEl, function(value) {
          if (self.callbacks.onNavigate) self.callbacks.onNavigate(value);
        });
      }
    },

    updateNavigationState: function(navState) {
      if (this.btnBack) this.btnBack.disabled = !navState.canGoBack;
      if (this.btnForward) this.btnForward.disabled = !navState.canGoForward;
      if (this.addressInputEl && !this.isFocused(this.addressInputEl)) {
        this.addressInputEl.value = navState.currentUrl || '';
      }
    },

    updateBookmarkState: function(isBookmarked) {
      if (!this.btnBookmark) return;
      if (isBookmarked) {
        this.btnBookmark.classList.add('bookmarked');
        this.btnBookmark.style.color = '#f59e0b';
      } else {
        this.btnBookmark.classList.remove('bookmarked');
        this.btnBookmark.style.color = '';
      }
    },

    updateTabCount: function(count) {
      var counter = document.getElementById('tab-counter-badge');
      if (counter) counter.textContent = count;
    },

    show: function() {
      if (!this.toolbarEl) return;
      this.isAutoHidden = false;
      this.toolbarEl.classList.remove('auto-hidden');
    },

    hide: function() {
      if (!this.toolbarEl) return;
      // Do not hide if address bar is focused
      if (this.addressInputEl && document.activeElement === this.addressInputEl) return;
      this.isAutoHidden = true;
      this.toolbarEl.classList.add('auto-hidden');
    },

    scheduleAutoHide: function(delaySeconds) {
      var self = this;
      if (this.hideTimer) clearTimeout(this.hideTimer);
      var delay = (delaySeconds || 4) * 1000;
      this.hideTimer = setTimeout(function() {
        self.hide();
      }, delay);
    },

    cancelAutoHide: function() {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
      this.show();
    },

    isFocused: function(el) {
      return typeof document !== 'undefined' && document.activeElement === el;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Toolbar;
  } else {
    global.Toolbar = Toolbar;
  }
})(typeof window !== 'undefined' ? window : this);
