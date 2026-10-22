/**
 * Modal Dialog Controller
 * Manages Settings, Tab Switcher, Downloads, and History modals
 * with spatial navigation focus traps and remote Back-key dismissal.
 */

(function(global) {
  'use strict';

  var SettingsManager = typeof module !== 'undefined' && module.exports
    ? require('../settings/settings_manager')
    : global.SettingsManager;

  var TabManager = typeof module !== 'undefined' && module.exports
    ? require('../tabs/tab_manager')
    : global.TabManager;

  var DownloadManager = typeof module !== 'undefined' && module.exports
    ? require('../downloads/download_manager')
    : global.DownloadManager;

  var HistoryManager = typeof module !== 'undefined' && module.exports
    ? require('../history/history_manager')
    : global.HistoryManager;

  var SpatialNav = typeof module !== 'undefined' && module.exports
    ? require('../navigation/spatial_nav')
    : global.SpatialNav;

  var Modal = {
    overlayEl: null,
    activeModalType: null,
    activeSettingsTab: 'appearance',
    previousFocusedElement: null,

    init: function() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('modal-overlay')) {
        this.overlayEl = document.getElementById('modal-overlay');
        return;
      }

      this.overlayEl = document.createElement('div');
      this.overlayEl.id = 'modal-overlay';
      this.overlayEl.className = 'modal-overlay hidden';
      document.body.appendChild(this.overlayEl);

      var self = this;
      this.overlayEl.addEventListener('click', function(e) {
        if (e.target === self.overlayEl) {
          self.close();
        }
      });
    },

    isOpen: function() {
      return this.activeModalType !== null;
    },

    close: function() {
      if (!this.isOpen()) return;
      this.activeModalType = null;
      this.overlayEl.classList.add('hidden');
      this.overlayEl.innerHTML = '';

      if (SpatialNav) {
        SpatialNav.setContainer(null);
        if (this.previousFocusedElement) {
          SpatialNav.focus(this.previousFocusedElement);
        }
      }
    },

    /**
     * Open Settings Modal
     */
    openSettings: function() {
      this.activeModalType = 'SETTINGS';
      this.previousFocusedElement = document.activeElement;
      this.renderSettings();
      this.overlayEl.classList.remove('hidden');

      if (SpatialNav) {
        SpatialNav.setContainer(this.overlayEl);
        SpatialNav.initFocus(this.overlayEl.querySelector('button.active') || this.overlayEl.querySelector('button'));
      }
    },

    renderSettings: function() {
      var settings = SettingsManager ? SettingsManager.getAll() : {};
      var self = this;

      var html = 
        '<div class="modal-card">' +
          '<div class="modal-header">' +
            '<div class="modal-title">Browser Settings</div>' +
            '<button type="button" class="btn btn-secondary" id="btn-modal-close">✕ Close</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div class="settings-nav">' +
              '<button type="button" class="settings-nav-btn ' + (this.activeSettingsTab === 'appearance' ? 'active' : '') + '" data-tab="appearance">Appearance</button>' +
              '<button type="button" class="settings-nav-btn ' + (this.activeSettingsTab === 'browsing' ? 'active' : '') + '" data-tab="browsing">Browsing</button>' +
              '<button type="button" class="settings-nav-btn ' + (this.activeSettingsTab === 'privacy' ? 'active' : '') + '" data-tab="privacy">Privacy & Security</button>' +
              '<button type="button" class="settings-nav-btn ' + (this.activeSettingsTab === 'performance' ? 'active' : '') + '" data-tab="performance">Performance</button>' +
              '<button type="button" class="settings-nav-btn ' + (this.activeSettingsTab === 'advanced' ? 'active' : '') + '" data-tab="advanced">Advanced</button>' +
            '</div>' +
            '<div class="settings-tab-content">';

      if (this.activeSettingsTab === 'appearance') {
        html += 
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Theme</div><div class="settings-row-desc">Select dark palette style</div></div>' +
            '<select id="set-theme" class="select-control">' +
              '<option value="dark"' + (settings.theme === 'dark' ? ' selected' : '') + '>Modern Dark (Default)</option>' +
              '<option value="deep-black"' + (settings.theme === 'deep-black' ? ' selected' : '') + '>Deep Black (OLED)</option>' +
              '<option value="slate"' + (settings.theme === 'slate' ? ' selected' : '') + '>Slate Charcoal</option>' +
            '</select>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Text Scale</div><div class="settings-row-desc">Adjust UI scaling for distance</div></div>' +
            '<select id="set-text-scale" class="select-control">' +
              '<option value="100"' + (settings.textScale === 100 ? ' selected' : '') + '>100% (Standard)</option>' +
              '<option value="115"' + (settings.textScale === 115 ? ' selected' : '') + '>115% (Comfortable)</option>' +
              '<option value="130"' + (settings.textScale === 130 ? ' selected' : '') + '>130% (Large Text)</option>' +
            '</select>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Auto-Hide Toolbar</div><div class="settings-row-desc">Automatically hide toolbar during browsing</div></div>' +
            '<button type="button" class="btn ' + (settings.autoHideToolbar ? 'btn-primary' : 'btn-secondary') + '" id="set-autohide">' +
              (settings.autoHideToolbar ? 'Enabled' : 'Disabled') +
            '</button>' +
          '</div>';
      } else if (this.activeSettingsTab === 'browsing') {
        html += 
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Default Search Engine</div><div class="settings-row-desc">Used when typing queries in omnibox</div></div>' +
            '<select id="set-search-engine" class="select-control">' +
              '<option value="duckduckgo"' + (settings.defaultSearchEngine === 'duckduckgo' ? ' selected' : '') + '>DuckDuckGo</option>' +
              '<option value="google"' + (settings.defaultSearchEngine === 'google' ? ' selected' : '') + '>Google</option>' +
              '<option value="bing"' + (settings.defaultSearchEngine === 'bing' ? ' selected' : '') + '>Bing</option>' +
              '<option value="startpage"' + (settings.defaultSearchEngine === 'startpage' ? ' selected' : '') + '>Startpage</option>' +
            '</select>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">User-Agent Identity</div><div class="settings-row-desc">Identifies engine to websites</div></div>' +
            '<select id="set-ua-mode" class="select-control">' +
              '<option value="auto"' + (settings.userAgentMode === 'auto' ? ' selected' : '') + '>Auto TV (Chromium M85)</option>' +
              '<option value="desktop"' + (settings.userAgentMode === 'desktop' ? ' selected' : '') + '>Desktop Chrome</option>' +
              '<option value="mobile"' + (settings.userAgentMode === 'mobile' ? ' selected' : '') + '>Mobile Web</option>' +
            '</select>' +
          '</div>';
      } else if (this.activeSettingsTab === 'privacy') {
        html += 
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Ad & Tracker Blocking</div><div class="settings-row-desc">Suppress advertisements and tracking scripts</div></div>' +
            '<button type="button" class="btn ' + (settings.adblockEnabled ? 'btn-primary' : 'btn-secondary') + '" id="set-adblock">' +
              (settings.adblockEnabled ? 'Active' : 'Disabled') +
            '</button>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Strict Protection Mode</div><div class="settings-row-desc">Apply aggressive cosmetic filters</div></div>' +
            '<button type="button" class="btn ' + (settings.strictMode ? 'btn-primary' : 'btn-secondary') + '" id="set-strict">' +
              (settings.strictMode ? 'Enabled' : 'Disabled') +
            '</button>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Block Popups & Redirects</div><div class="settings-row-desc">Prevent unauthorized window openings</div></div>' +
            '<button type="button" class="btn ' + (settings.blockPopups ? 'btn-primary' : 'btn-secondary') + '" id="set-popups">' +
              (settings.blockPopups ? 'Active' : 'Disabled') +
            '</button>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Private Browsing</div><div class="settings-row-desc">Do not record history or session state</div></div>' +
            '<button type="button" class="btn ' + (settings.privateBrowsing ? 'btn-danger' : 'btn-secondary') + '" id="set-private">' +
              (settings.privateBrowsing ? 'On (Private)' : 'Off') +
            '</button>' +
          '</div>';
      } else if (this.activeSettingsTab === 'performance') {
        html += 
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Tab Memory Suspension</div><div class="settings-row-desc">Detach background tabs to save TV RAM</div></div>' +
            '<button type="button" class="btn ' + (settings.tabSuspension ? 'btn-primary' : 'btn-secondary') + '" id="set-tabsusp">' +
              (settings.tabSuspension ? 'Active' : 'Disabled') +
            '</button>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Disable UI Animations</div><div class="settings-row-desc">Maximizes performance on lower-tier hardware</div></div>' +
            '<button type="button" class="btn ' + (settings.disableAnimations ? 'btn-primary' : 'btn-secondary') + '" id="set-anims">' +
              (settings.disableAnimations ? 'Disabled' : 'Enabled') +
            '</button>' +
          '</div>';
      } else if (this.activeSettingsTab === 'advanced') {
        html += 
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Telemetry & Diagnostics HUD</div><div class="settings-row-desc">Display live FPS, memory, and blocked event overlay</div></div>' +
            '<button type="button" class="btn ' + (settings.diagnosticsHud ? 'btn-primary' : 'btn-secondary') + '" id="set-hud">' +
              (settings.diagnosticsHud ? 'Visible' : 'Hidden') +
            '</button>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div><div class="settings-row-label">Reset Application Preferences</div><div class="settings-row-desc">Restore all browser settings to factory defaults</div></div>' +
            '<button type="button" class="btn btn-danger" id="btn-reset-settings">Reset to Defaults</button>' +
          '</div>';
      }

      html += '</div></div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-primary" id="btn-modal-done">Done</button>' +
              '</div></div>';

      this.overlayEl.innerHTML = html;
      this.bindSettingsEvents();
    },

    bindSettingsEvents: function() {
      var self = this;
      var closeBtn = document.getElementById('btn-modal-close');
      if (closeBtn) closeBtn.addEventListener('click', function() { self.close(); });
      var doneBtn = document.getElementById('btn-modal-done');
      if (doneBtn) doneBtn.addEventListener('click', function() { self.close(); });

      // Tab switcher buttons
      var navBtns = this.overlayEl.querySelectorAll('.settings-nav-btn');
      for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].addEventListener('click', function() {
          self.activeSettingsTab = this.getAttribute('data-tab');
          self.renderSettings();
        });
      }

      // Settings controls
      var themeSelect = document.getElementById('set-theme');
      if (themeSelect) {
        themeSelect.addEventListener('change', function() {
          SettingsManager.set({ theme: this.value });
        });
      }

      var textScaleSelect = document.getElementById('set-text-scale');
      if (textScaleSelect) {
        textScaleSelect.addEventListener('change', function() {
          SettingsManager.set({ textScale: parseInt(this.value, 10) });
        });
      }

      var autohideBtn = document.getElementById('set-autohide');
      if (autohideBtn) {
        autohideBtn.addEventListener('click', function() {
          var cur = SettingsManager.get('autoHideToolbar');
          SettingsManager.set({ autoHideToolbar: !cur });
          self.renderSettings();
        });
      }

      var searchSelect = document.getElementById('set-search-engine');
      if (searchSelect) {
        searchSelect.addEventListener('change', function() {
          SettingsManager.set({ defaultSearchEngine: this.value });
        });
      }

      var uaSelect = document.getElementById('set-ua-mode');
      if (uaSelect) {
        uaSelect.addEventListener('change', function() {
          SettingsManager.set({ userAgentMode: this.value });
        });
      }

      var adblockBtn = document.getElementById('set-adblock');
      if (adblockBtn) {
        adblockBtn.addEventListener('click', function() {
          var cur = SettingsManager.get('adblockEnabled');
          SettingsManager.set({ adblockEnabled: !cur });
          self.renderSettings();
        });
      }

      var strictBtn = document.getElementById('set-strict');
      if (strictBtn) {
        strictBtn.addEventListener('click', function() {
          var cur = SettingsManager.get('strictMode');
          SettingsManager.set({ strictMode: !cur });
          self.renderSettings();
        });
      }

      var popupsBtn = document.getElementById('set-popups');
      if (popupsBtn) {
        popupsBtn.addEventListener('click', function() {
          var cur = SettingsManager.get('blockPopups');
          SettingsManager.set({ blockPopups: !cur });
          self.renderSettings();
        });
      }

      var privateBtn = document.getElementById('set-private');
      if (privateBtn) {
        privateBtn.addEventListener('click', function() {
          var cur = SettingsManager.get('privateBrowsing');
          SettingsManager.set({ privateBrowsing: !cur });
          self.renderSettings();
        });
      }

      var tabSuspBtn = document.getElementById('set-tabsusp');
      if (tabSuspBtn) {
        tabSuspBtn.addEventListener('click', function() {
          var cur = SettingsManager.get('tabSuspension');
          SettingsManager.set({ tabSuspension: !cur });
          self.renderSettings();
        });
      }

      var animsBtn = document.getElementById('set-anims');
      if (animsBtn) {
        animsBtn.addEventListener('click', function() {
          var cur = SettingsManager.get('disableAnimations');
          SettingsManager.set({ disableAnimations: !cur });
          self.renderSettings();
        });
      }

      var hudBtn = document.getElementById('set-hud');
      if (hudBtn) {
        hudBtn.addEventListener('click', function() {
          var cur = SettingsManager.get('diagnosticsHud');
          SettingsManager.set({ diagnosticsHud: !cur });
          if (global.DiagnosticsHUD) {
            global.DiagnosticsHUD.toggle();
          }
          self.renderSettings();
        });
      }

      var resetBtn = document.getElementById('btn-reset-settings');
      if (resetBtn) {
        resetBtn.addEventListener('click', function() {
          if (confirm('Reset all browser settings to factory defaults?')) {
            SettingsManager.resetToDefaults();
            self.renderSettings();
          }
        });
      }
    },

    /**
     * Open Tab Switcher Overlay
     * @param {Function} onSelectTab
     * @param {Function} onNewTab
     * @param {Function} onCloseTab
     */
    openTabs: function(onSelectTab, onNewTab, onCloseTab) {
      this.activeModalType = 'TABS';
      this.previousFocusedElement = document.activeElement;
      var tabs = TabManager ? TabManager.getAllTabs() : [];
      var activeTab = TabManager ? TabManager.getActiveTab() : null;
      var self = this;

      var html = 
        '<div class="modal-card" style="width: 720px;">' +
          '<div class="modal-header">' +
            '<div class="modal-title">Tabs (' + tabs.length + ' / 3)</div>' +
            '<button type="button" class="btn btn-secondary" id="btn-modal-close">✕</button>' +
          '</div>' +
          '<div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">';

      for (var i = 0; i < tabs.length; i++) {
        var t = tabs[i];
        var isActive = activeTab && activeTab.id === t.id;
        html += 
          '<div class="tab-list-item ' + (isActive ? 'active-tab-item' : '') + '" style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-card); padding:16px; border-radius:8px; border:1px solid var(--border-color);">' +
            '<button type="button" class="btn-select-tab" data-id="' + t.id + '" style="background:transparent; border:none; color:var(--text-primary); text-align:left; flex:1; font-size:17px; font-weight:600; cursor:pointer;">' +
              (isActive ? '▶ ' : '') + self.escapeHtml(t.title || 'Start Page') +
              '<div style="font-size:13px; color:var(--text-muted); font-weight:normal;">' + self.escapeHtml(t.url || 'Home Screen') + '</div>' +
            '</button>' +
            '<button type="button" class="btn btn-secondary btn-close-tab" data-id="' + t.id + '" style="margin-left:12px; padding:6px 12px;">✕ Close</button>' +
          '</div>';
      }

      html += '</div>' +
              '<div class="modal-footer" style="justify-content:space-between;">' +
                '<button type="button" class="btn btn-primary" id="btn-new-tab" ' + (tabs.length >= 3 ? 'disabled' : '') + '>+ Open New Tab</button>' +
                '<button type="button" class="btn btn-secondary" id="btn-modal-done">Done</button>' +
              '</div></div>';

      this.overlayEl.innerHTML = html;
      this.overlayEl.classList.remove('hidden');

      var closeBtn = document.getElementById('btn-modal-close');
      if (closeBtn) closeBtn.addEventListener('click', function() { self.close(); });
      var doneBtn = document.getElementById('btn-modal-done');
      if (doneBtn) doneBtn.addEventListener('click', function() { self.close(); });

      var newTabBtn = document.getElementById('btn-new-tab');
      if (newTabBtn) {
        newTabBtn.addEventListener('click', function() {
          self.close();
          if (onNewTab) onNewTab();
        });
      }

      var selectBtns = this.overlayEl.querySelectorAll('.btn-select-tab');
      for (var j = 0; j < selectBtns.length; j++) {
        selectBtns[j].addEventListener('click', function() {
          var id = this.getAttribute('data-id');
          self.close();
          if (onSelectTab) onSelectTab(id);
        });
      }

      var closeTabBtns = this.overlayEl.querySelectorAll('.btn-close-tab');
      for (var k = 0; k < closeTabBtns.length; k++) {
        closeTabBtns[k].addEventListener('click', function(e) {
          e.stopPropagation();
          var id = this.getAttribute('data-id');
          if (onCloseTab) onCloseTab(id);
          self.openTabs(onSelectTab, onNewTab, onCloseTab);
        });
      }

      if (SpatialNav) {
        SpatialNav.setContainer(this.overlayEl);
        SpatialNav.initFocus(this.overlayEl.querySelector('button'));
      }
    },

    escapeHtml: function(text) {
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
  } else {
    global.Modal = Modal;
  }
})(typeof window !== 'undefined' ? window : this);
