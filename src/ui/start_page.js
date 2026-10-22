/**
 * Start Page Controller
 * Renders the minimalist start screen with search, favorite tiles,
 * recent history, and live privacy protection status.
 */

(function(global) {
  'use strict';

  var BookmarkManager = typeof module !== 'undefined' && module.exports
    ? require('../bookmarks/bookmark_manager')
    : global.BookmarkManager;

  var AdBlockEngine = typeof module !== 'undefined' && module.exports
    ? require('../adblock/adblock_engine')
    : global.AdBlockEngine;

  var StartPage = {
    containerEl: null,
    onNavigate: null,

    init: function(containerId, onNavigate) {
      this.containerEl = document.getElementById(containerId);
      this.onNavigate = onNavigate || null;
      if (!this.containerEl) return;

      this.render();
    },

    render: function() {
      if (!this.containerEl) return;

      var bookmarks = BookmarkManager ? BookmarkManager.getAll() : [];
      var metrics = AdBlockEngine ? AdBlockEngine.getMetrics() : {};

      var html = 
        '<div class="start-header">' +
          '<div class="brand-badge">🛡️ Shield Active • Tizen 6.5</div>' +
          '<h1 class="start-title">TV Browser</h1>' +
        '</div>' +

        '<div class="start-search-box">' +
          '<input type="text" id="start-search-input" class="start-search-input" placeholder="Search the web or enter address..." autocomplete="off" />' +
        '</div>' +

        '<div class="tiles-section-title">FAVORITE WEBSITES</div>' +
        '<div class="tiles-grid">';

      for (var i = 0; i < bookmarks.length; i++) {
        var b = bookmarks[i];
        html += '<button type="button" class="tile-card" data-url="' + this.escapeHtml(b.url) + '">' +
                  '<div class="tile-icon">' + (b.icon || '🌐') + '</div>' +
                  '<div class="tile-name">' + this.escapeHtml(b.title) + '</div>' +
                '</button>';
      }

      // Add a dedicated tile for the POC Test Fixture
      html += '<button type="button" class="tile-card" data-url="tests/compatibility/poc_controlled_page.html">' +
                '<div class="tile-icon">🧪</div>' +
                '<div class="tile-name">POC Test Suite</div>' +
              '</button>';

      html += '</div>';

      this.containerEl.innerHTML = html;
      this.bindEvents();
    },

    bindEvents: function() {
      var self = this;
      var input = document.getElementById('start-search-input');

      if (input) {
        input.addEventListener('keydown', function(e) {
          if (e.keyCode === 13) { // Enter
            if (self.onNavigate) self.onNavigate(input.value);
          }
        });
      }

      var tiles = this.containerEl.querySelectorAll('.tile-card');
      for (var i = 0; i < tiles.length; i++) {
        tiles[i].addEventListener('click', function() {
          var url = this.getAttribute('data-url');
          if (self.onNavigate && url) {
            self.onNavigate(url);
          }
        });
      }
    },

    show: function() {
      if (this.containerEl) {
        this.render();
        this.containerEl.classList.remove('hidden');
      }
    },

    hide: function() {
      if (this.containerEl) {
        this.containerEl.classList.add('hidden');
      }
    },

    escapeHtml: function(text) {
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StartPage;
  } else {
    global.StartPage = StartPage;
  }
})(typeof window !== 'undefined' ? window : this);
