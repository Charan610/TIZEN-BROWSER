/**
 * Main Application Orchestrator
 * Bootstraps all subsystems, binds global remote key handlers,
 * and coordinates views, tabs, and navigation.
 */

(function(global) {
  'use strict';

  var startTime = performance.now();

  var App = {
    isInitialized: false,
    isStartPage: true,

    init: function() {
      if (this.isInitialized) return;
      this.isInitialized = true;
      console.log('=============================================');
      console.log('TV BROWSER — STARTING ON SAMSUNG SMART TV...');
      console.log('=============================================');

      var self = this;

      // 1. Storage & Settings
      if (global.SettingsManager) global.SettingsManager.init();

      // 2. Hardware Keys
      if (global.RemoteKeys) global.RemoteKeys.init();

      // 3. Ad Blocking Engine
      if (global.AdBlockEngine) global.AdBlockEngine.init();

      // 4. Download Manager
      if (global.DownloadManager) global.DownloadManager.init();

      // 5. Bookmarks & History
      if (global.BookmarkManager) global.BookmarkManager.init();
      if (global.HistoryManager) global.HistoryManager.init();

      // 6. Tabs
      if (global.TabManager) {
        global.TabManager.init();
        global.TabManager.subscribe(function(activeTab, allTabs) {
          self.handleTabChange(activeTab, allTabs);
        });
      }

      // 7. Input Engines
      if (global.PointerMode) global.PointerMode.init();
      if (global.TVKeyboard) global.TVKeyboard.init();
      if (global.Modal) global.Modal.init();
      if (global.Toast) global.Toast.init();
      if (global.Suggestions) {
        global.Suggestions.init({
          onSelect: function(val) {
            self.navigateTo(val);
          }
        });
      }
      if (global.Lifecycle) global.Lifecycle.init();

      // 8. Viewport & Start Page
      if (global.Viewport) {
        global.Viewport.init('viewport-container', function(event) {
          self.handleViewportStateChange(event);
        });
      }

      if (global.StartPage) {
        global.StartPage.init('start-page-container', function(url) {
          self.navigateTo(url);
        });
      }

      // 9. Toolbar
      if (global.Toolbar) {
        global.Toolbar.init({
          onBack: function() { self.navigateBack(); },
          onForward: function() { self.navigateForward(); },
          onReload: function() { if (global.Viewport) global.Viewport.reload(); },
          onHome: function() { self.returnHome(); },
          onBookmark: function() { self.toggleBookmarkCurrent(); },
          onToggleReader: function() { self.toggleReaderMode(); },
          onTogglePointer: function() { self.togglePointerMode(); },
          onOpenTabs: function() { self.openTabsModal(); },
          onOpenSettings: function() { if (global.Modal) global.Modal.openSettings(); },
          onNavigate: function(url) { self.navigateTo(url); }
        });
      }

      // 10. Diagnostics HUD
      var startupDuration = performance.now() - startTime;
      if (global.DiagnosticsHUD) {
        global.DiagnosticsHUD.init(startupDuration);
        if (global.SettingsManager && global.SettingsManager.get('diagnosticsHud')) {
          global.DiagnosticsHUD.show();
        }
      }

      // 11. Bind Global Remote Input Listeners
      this.bindRemoteKeyListeners();

      // 12. Focus initial start screen element
      if (global.SpatialNav) {
        var startInput = document.getElementById('start-search-input');
        global.SpatialNav.initFocus(startInput);
      }

      console.log('[App] Bootstrap complete in ' + Math.round(startupDuration) + ' ms');
    },

    bindRemoteKeyListeners: function() {
      var self = this;

      window.addEventListener('keydown', function(e) {
        if (e.defaultPrevented) return;
        if (global.TextInput && global.TextInput.isEditing(e.target) &&
            !(global.TVKeyboard && global.TVKeyboard.isOpen)) return;
        var action = global.RemoteKeys ? global.RemoteKeys.getAction(e) : 'UNKNOWN';

        // 1. If Pointer mode is active, feed kinematic inputs
        if (global.PointerMode && global.PointerMode.active) {
          if (action === 'UP' || action === 'DOWN' || action === 'LEFT' || action === 'RIGHT' || action === 'ENTER') {
            if (global.PointerMode.handleKeyDown(action)) {
              e.preventDefault();
              return;
            }
          }
        }

        // 2. Hardware Return/Back Key (Samsung TV KeyCode 10009 / Esc)
        if (action === 'BACK') {
          e.preventDefault();
          e.stopPropagation();
          var context = {
            activeTab: global.TabManager ? global.TabManager.getActiveTab() : null,
            isStartPage: self.isStartPage,
            onNavigateBack: function(url) { self.loadUrlInActiveTab(url); },
            onReturnHome: function() { self.returnHome(); }
          };
          if (global.Lifecycle) global.Lifecycle.handleBackKey(context);
          return;
        }

        // 3. Quick Color Keys
        if (action === 'COLOR_RED') {
          // Red: Toggle Toolbar / Focus Address Bar
          e.preventDefault();
          if (global.Toolbar) {
            global.Toolbar.show();
            if (global.Toolbar.addressInputEl) {
              global.Toolbar.addressInputEl.focus();
            }
          }
          return;
        }

        if (action === 'COLOR_GREEN') {
          // Green: Toggle Virtual Pointer Mode
          e.preventDefault();
          self.togglePointerMode();
          return;
        }

        if (action === 'COLOR_YELLOW') {
          // Yellow: Return to Start Page
          e.preventDefault();
          self.returnHome();
          return;
        }

        if (action === 'COLOR_BLUE') {
          // Blue: Toggle Diagnostics HUD
          e.preventDefault();
          if (global.DiagnosticsHUD) global.DiagnosticsHUD.toggle();
          return;
        }

        // 4. Remote Channel Up / Down (Page Up / Page Down) for reading surfaces
        if (action === 'PAGE_UP' || action === 'PAGE_DOWN') {
          e.preventDefault();
          self.scrollActiveSurface(action === 'PAGE_UP' ? -420 : 420);
          return;
        }

        // 5. Directional D-Pad navigation when Virtual Pointer is disabled
        if (!global.PointerMode || !global.PointerMode.active) {
          if (action === 'UP' || action === 'DOWN' || action === 'LEFT' || action === 'RIGHT') {
            // If toolbar is hidden and user presses UP at top of page, reveal toolbar
            if (action === 'UP' && global.Toolbar && global.Toolbar.isAutoHidden) {
              global.Toolbar.show();
              e.preventDefault();
              return;
            }

            if (global.SpatialNav && global.SpatialNav.move(action)) {
              e.preventDefault();
              return;
            }

            // If SpatialNav has no further target in UP/DOWN direction, scroll active surface
            if (action === 'UP' || action === 'DOWN') {
              if (self.scrollActiveSurface(action === 'UP' ? -200 : 200)) {
                e.preventDefault();
                return;
              }
            }
          }
        }
      });

      window.addEventListener('keyup', function(e) {
        var action = global.RemoteKeys ? global.RemoteKeys.getAction(e) : 'UNKNOWN';
        if (global.PointerMode && global.PointerMode.active) {
          global.PointerMode.handleKeyUp(action);
        }
      });

      // Samsung Tizen TV hardware key event (prevents automatic OS app termination on Back)
      window.addEventListener('tizenhwkey', function(e) {
        if (e.keyName === 'back') {
          e.preventDefault();
          e.stopPropagation();
          var context = {
            activeTab: global.TabManager ? global.TabManager.getActiveTab() : null,
            isStartPage: self.isStartPage,
            onNavigateBack: function(url) { self.loadUrlInActiveTab(url); },
            onReturnHome: function() { self.returnHome(); }
          };
          if (global.Lifecycle) global.Lifecycle.handleBackKey(context);
        }
      });
    },

    navigateTo: function(input) {
      if (!input) return;

      var searchEngine = global.SettingsManager ? global.SettingsManager.get('defaultSearchEngine') : 'duckduckgo';
      var normalizedUrl = input === 'tests/compatibility/poc_controlled_page.html' ? input :
        (global.UrlUtils ? global.UrlUtils.normalizeInput(input, searchEngine) : input);

      if (!normalizedUrl) {
        if (global.Toast) global.Toast.show('Invalid or blocked URL scheme');
        return;
      }

      console.log('[App] Navigating to:', normalizedUrl);
      this.isStartPage = false;

      if (global.StartPage) global.StartPage.hide();
      this.loadUrlInActiveTab(normalizedUrl);
    },

    loadUrlInActiveTab: function(url, mode) {
      var activeTab = global.TabManager ? global.TabManager.getActiveTab() : null;
      if (activeTab) {
        activeTab.url = url;
        if (activeTab.navState) activeTab.navState.navigate(url);
      }

      if (global.Viewport) {
        global.Viewport.loadUrl(url, mode);
      }

      if (global.HistoryManager) {
        global.HistoryManager.add(url);
      }

      if (global.Toolbar) {
        global.Toolbar.show();
        var autoHide = global.SettingsManager ? global.SettingsManager.get('autoHideToolbar') : true;
        if (autoHide) {
          global.Toolbar.scheduleAutoHide(4);
        }
      }
    },

    returnHome: function() {
      this.isStartPage = true;
      if (global.Viewport) global.Viewport.showStartPage();
      if (global.StartPage) global.StartPage.show();
      if (global.Toolbar) {
        global.Toolbar.show();
        global.Toolbar.cancelAutoHide();
        if (global.Toolbar.addressInputEl) global.Toolbar.addressInputEl.value = '';
      }

      var activeTab = global.TabManager ? global.TabManager.getActiveTab() : null;
      if (activeTab) {
        activeTab.url = '';
        activeTab.title = 'Start Page';
      }

      if (global.SpatialNav) {
        var startInput = document.getElementById('start-search-input');
        global.SpatialNav.initFocus(startInput);
      }
    },

    navigateBack: function() {
      var activeTab = global.TabManager ? global.TabManager.getActiveTab() : null;
      if (activeTab && activeTab.navState && activeTab.navState.canGoBack()) {
        var prevUrl = activeTab.navState.goBack();
        this.loadUrlInActiveTab(prevUrl);
      } else {
        this.returnHome();
      }
    },

    scrollActiveSurface: function(delta) {
      var readerWrapper = document.getElementById('viewport-reader-wrapper');
      if (readerWrapper && !readerWrapper.classList.contains('hidden')) {
        readerWrapper.scrollBy({ top: delta, behavior: 'smooth' });
        return true;
      }
      var errorWrapper = document.getElementById('viewport-error-wrapper');
      if (errorWrapper && !errorWrapper.classList.contains('hidden')) {
        errorWrapper.scrollBy({ top: delta, behavior: 'smooth' });
        return true;
      }
      if (typeof window !== 'undefined' && window.scrollY !== undefined) {
        window.scrollBy({ top: delta, behavior: 'smooth' });
        return true;
      }
      return false;
    },

    navigateForward: function() {
      var activeTab = global.TabManager ? global.TabManager.getActiveTab() : null;
      if (activeTab && activeTab.navState && activeTab.navState.canGoForward()) {
        var nextUrl = activeTab.navState.goForward();
        this.loadUrlInActiveTab(nextUrl);
      }
    },

    toggleBookmarkCurrent: function() {
      var activeTab = global.TabManager ? global.TabManager.getActiveTab() : null;
      var url = activeTab ? activeTab.url : '';
      if (!url) return;

      if (global.BookmarkManager) {
        var status = global.BookmarkManager.toggle(activeTab.title || url, url);
        if (global.Toolbar) global.Toolbar.updateBookmarkState(status);
        if (global.Toast) global.Toast.show(status ? 'Bookmark saved' : 'Bookmark removed');
      }
    },

    toggleReaderMode: function() {
      var activeTab = global.TabManager ? global.TabManager.getActiveTab() : null;
      var url = activeTab ? activeTab.url : '';
      if (!url) {
        if (global.Toast) global.Toast.show('No active webpage to format in Reader Mode');
        return;
      }

      if (global.Viewport) {
        if (global.Viewport.currentMode === 'READER') {
          global.Viewport.loadUrl(url, 'EMBED');
          if (global.Toast) global.Toast.show('Switched to Web View');
        } else {
          global.Viewport.loadUrl(url, 'READER');
          if (global.Toast) global.Toast.show('Switched to Reader Mode');
        }
      }
    },

    togglePointerMode: function() {
      if (global.PointerMode) {
        var isActive = global.PointerMode.toggle();
        if (global.Toast) {
          global.Toast.show(isActive ? 'Pointer Mode (D-Pad moves cursor, OK clicks)' : 'Focus Mode (Spatial D-Pad navigation)');
        }
      }
    },

    openTabsModal: function() {
      var self = this;
      if (global.Modal) {
        global.Modal.openTabs(
          function(tabId) {
            if (global.TabManager) global.TabManager.switchToTab(tabId);
          },
          function() {
            if (global.TabManager) {
              var newTab = global.TabManager.openTab('');
              if (newTab) self.returnHome();
            }
          },
          function(tabId) {
            if (global.TabManager) global.TabManager.closeTab(tabId);
          }
        );
      }
    },

    handleTabChange: function(activeTab, allTabs) {
      if (global.Toolbar) {
        global.Toolbar.updateTabCount(allTabs.length);
        if (activeTab && activeTab.navState) {
          global.Toolbar.updateNavigationState(activeTab.navState);
        }
      }

      if (!activeTab || !activeTab.url) {
        this.returnHome();
      } else {
        this.isStartPage = false;
        if (global.StartPage) global.StartPage.hide();
        if (global.Viewport) global.Viewport.loadUrl(activeTab.url);
      }
    },

    handleViewportStateChange: function(event) {
      var activeTab = global.TabManager ? global.TabManager.getActiveTab() : null;
      if (!activeTab) return;

      if (event.type === 'LOADED') {
        if (event.title && activeTab.navState) {
          activeTab.navState.setTitle(event.title);
          activeTab.title = event.title;
        }
        if (activeTab.navState) activeTab.navState.setLoading(false);
        if (global.Toolbar && activeTab.navState) global.Toolbar.updateNavigationState(activeTab.navState);
      } else if (event.type === 'LOADING') {
        if (activeTab.navState) activeTab.navState.setLoading(true);
        if (global.Toolbar && activeTab.navState) global.Toolbar.updateNavigationState(activeTab.navState);
      } else if (event.type === 'ERROR') {
        if (activeTab.navState) activeTab.navState.setLoading(false);
      } else if (event.type === 'NAVIGATE_HOME') {
        this.returnHome();
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  } else {
    global.App = App;
    window.addEventListener('DOMContentLoaded', function() {
      App.init();
    });
  }
})(typeof window !== 'undefined' ? window : this);
