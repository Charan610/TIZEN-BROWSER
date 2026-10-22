/**
 * Application Lifecycle & Back-Key Priority Stack
 * Enforces structured LIFO dismissal order for Samsung TV remote Return/Back key
 * and coordinates clean Tizen OS application exit.
 */

(function(global) {
  'use strict';

  var Modal = typeof module !== 'undefined' && module.exports
    ? require('../ui/modal')
    : global.Modal;

  var TVKeyboard = typeof module !== 'undefined' && module.exports
    ? require('../input/tv_keyboard')
    : global.TVKeyboard;

  var Lifecycle = {
    backHandlers: [],
    exitConfirmPending: false,

    init: function() {
      var self = this;

      if (typeof window !== 'undefined') {
        // Tizen visibility change & suspension events
        document.addEventListener('visibilitychange', function() {
          if (document.hidden) {
            console.log('[Lifecycle] App suspended / hidden');
          } else {
            console.log('[Lifecycle] App resumed / visible');
          }
        });
      }
    },

    /**
     * Push a custom back handler onto the LIFO stack
     * @param {Function} handler Must return true if it handled the event, false to pass through
     */
    pushBackHandler: function(handler) {
      if (typeof handler === 'function') {
        this.backHandlers.push(handler);
      }
    },

    /**
     * Remove a back handler from the stack
     * @param {Function} handler
     */
    popBackHandler: function(handler) {
      this.backHandlers = this.backHandlers.filter(function(h) {
        return h !== handler;
      });
    },

    /**
     * Process hardware Return/Back key event according to strict LIFO priority
     * @param {Object} context App context { activeTab, isStartPage, isToolbarHidden }
     * @returns {boolean} Whether the back press was handled internally
     */
    handleBackKey: function(context) {
      console.log('[Lifecycle] Handling Back key press...');

      // Priority 1: Custom back handlers (e.g. fullscreen video or transient state)
      for (var i = this.backHandlers.length - 1; i >= 0; i--) {
        try {
          if (this.backHandlers[i]()) {
            return true;
          }
        } catch (e) {
          console.error('[Lifecycle] Custom back handler error:', e);
        }
      }

      // Priority 2: Close active modal dialog (Settings, Tabs, etc.)
      if (Modal && Modal.isOpen()) {
        Modal.close();
        return true;
      }

      // Priority 3: Close on-screen TV Keyboard
      if (TVKeyboard && TVKeyboard.isOpen) {
        TVKeyboard.close();
        return true;
      }

      // Priority 4: History Back in active tab
      if (context && context.activeTab && context.activeTab.navState && context.activeTab.navState.canGoBack()) {
        var prevUrl = context.activeTab.navState.goBack();
        if (context.onNavigateBack) {
          context.onNavigateBack(prevUrl);
        }
        return true;
      }

      // Priority 5: Return to Start Page if currently viewing a website
      if (context && !context.isStartPage) {
        if (context.onReturnHome) {
          context.onReturnHome();
        }
        return true;
      }

      // Priority 6: Exit confirmation to prevent accidental termination
      if (!this.exitConfirmPending) {
        this.exitConfirmPending = true;
        if (global.Toast) {
          global.Toast.show('Press Back again to exit TV Browser', 3000);
        }
        var self = this;
        setTimeout(function() {
          self.exitConfirmPending = false;
        }, 3000);
        return true;
      }

      // Exit application cleanly via Tizen API
      this.exitApp();
      return true;
    },

    /**
     * Terminate application process via Tizen application API
     */
    exitApp: function() {
      console.log('[Lifecycle] Exiting application...');
      try {
        if (typeof window !== 'undefined' && window.tizen && window.tizen.application) {
          var app = window.tizen.application.getCurrentApplication();
          app.exit();
        } else {
          console.log('[Lifecycle] Non-Tizen environment: close window');
          if (typeof window !== 'undefined') window.close();
        }
      } catch (err) {
        console.error('[Lifecycle] Error exiting application:', err);
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lifecycle;
  } else {
    global.Lifecycle = Lifecycle;
  }
})(typeof window !== 'undefined' ? window : this);
