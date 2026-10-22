/**
 * Diagnostics & Performance HUD
 * Measures real-time frame rates (FPS), memory footprint, startup duration,
 * and displays verified ad-block protection telemetry.
 */

(function(global) {
  'use strict';

  var AdBlockEngine = typeof module !== 'undefined' && module.exports
    ? require('../adblock/adblock_engine')
    : global.AdBlockEngine;

  var TabManager = typeof module !== 'undefined' && module.exports
    ? require('../tabs/tab_manager')
    : global.TabManager;

  var DiagnosticsHUD = {
    hudEl: null,
    visible: false,
    fps: 60,
    frameCount: 0,
    lastFpsTime: 0,
    startupDuration: 0,
    updateInterval: null,

    init: function(startupDuration) {
      this.startupDuration = startupDuration || 0;
      this.lastFpsTime = performance.now();

      if (typeof document === 'undefined') return;

      this.hudEl = document.createElement('div');
      this.hudEl.id = 'diagnostics-hud';
      this.hudEl.className = 'diagnostics-hud hidden';
      document.body.appendChild(this.hudEl);

      this.startFpsCounter();
    },

    toggle: function() {
      if (this.visible) {
        this.hide();
      } else {
        this.show();
      }
      return this.visible;
    },

    show: function() {
      this.visible = true;
      if (this.hudEl) this.hudEl.classList.remove('hidden');
      var self = this;
      this.updateContent();
      this.updateInterval = setInterval(function() {
        self.updateContent();
      }, 1000);
    },

    hide: function() {
      this.visible = false;
      if (this.hudEl) this.hudEl.classList.add('hidden');
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    },

    startFpsCounter: function() {
      var self = this;
      function loop(now) {
        self.frameCount++;
        if (now - self.lastFpsTime >= 1000) {
          self.fps = Math.round((self.frameCount * 1000) / (now - self.lastFpsTime));
          self.frameCount = 0;
          self.lastFpsTime = now;
        }
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    },

    updateContent: function() {
      if (!this.hudEl || !this.visible) return;

      var metrics = AdBlockEngine ? AdBlockEngine.getMetrics() : {};
      var activeTab = TabManager ? TabManager.getActiveTab() : null;
      var totalTabs = TabManager ? TabManager.getAllTabs().length : 1;

      var memText = 'N/A';
      if (typeof performance !== 'undefined' && performance.memory) {
        var usedMb = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        var totalMb = Math.round(performance.memory.totalJSHeapSize / (1024 * 1024));
        memText = usedMb + ' / ' + totalMb + ' MB';
      }

      var html = 
        '<div class="hud-header">TELEMETRY & DIAGNOSTICS</div>' +
        '<div class="hud-grid">' +
          '<div class="hud-item"><span class="hud-label">FPS:</span> <span class="hud-val ' + (this.fps < 45 ? 'warn' : 'good') + '">' + this.fps + '</span></div>' +
          '<div class="hud-item"><span class="hud-label">JS Heap:</span> <span class="hud-val">' + memText + '</span></div>' +
          '<div class="hud-item"><span class="hud-label">Startup:</span> <span class="hud-val">' + Math.round(this.startupDuration) + ' ms</span></div>' +
          '<div class="hud-item"><span class="hud-label">Active Tabs:</span> <span class="hud-val">' + totalTabs + '</span></div>' +
        '</div>' +
        '<div class="hud-divider"></div>' +
        '<div class="hud-section-title">VERIFIED PROTECTION COUNTERS</div>' +
        '<div class="hud-grid">' +
          '<div class="hud-item"><span class="hud-label">Popups Blocked:</span> <span class="hud-val highlight">' + (metrics.blockedPopups || 0) + '</span></div>' +
          '<div class="hud-item"><span class="hud-label">Hidden Ad Containers:</span> <span class="hud-val highlight">' + (metrics.cosmeticallyHiddenElements || 0) + '</span></div>' +
          '<div class="hud-item"><span class="hud-label">Unsafe Redirects Blocked:</span> <span class="hud-val">' + (metrics.blockedRedirects || 0) + '</span></div>' +
          '<div class="hud-item"><span class="hud-label">Unsafe Schemes:</span> <span class="hud-val">' + (metrics.blockedUnsafeSchemes || 0) + '</span></div>' +
        '</div>' +
        '<div class="hud-footer">Tizen 6.5 • Chromium M85 • 1080p Canvas</div>';

      this.hudEl.innerHTML = html;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagnosticsHUD;
  } else {
    global.DiagnosticsHUD = DiagnosticsHUD;
  }
})(typeof window !== 'undefined' ? window : this);
