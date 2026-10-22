/**
 * Tri-Mode Viewport Engine
 * Manages active web rendering surface (Direct Embed, Reader Mode, Error/Fallback),
 * handles load events, sandbox isolation, and fullscreen video state.
 */

(function(global) {
  'use strict';

  var AdBlockEngine = typeof module !== 'undefined' && module.exports
    ? require('../adblock/adblock_engine')
    : global.AdBlockEngine;

  var ReaderMode = typeof module !== 'undefined' && module.exports
    ? require('./reader_mode')
    : global.ReaderMode;

  var Viewport = {
    containerEl: null,
    iframeEl: null,
    readerEl: null,
    errorEl: null,
    currentMode: 'START', // 'START' | 'EMBED' | 'READER' | 'ERROR'
    currentUrl: '',
    loadTimeoutId: null,
    onStateChange: null,

    init: function(containerId, onStateChange) {
      this.containerEl = document.getElementById(containerId);
      this.onStateChange = onStateChange || null;

      if (!this.containerEl) return;

      this.containerEl.innerHTML = 
        '<div id="viewport-iframe-wrapper" class="viewport-surface hidden">' +
          '<iframe id="web-surface" ' +
                  'sandbox="allow-scripts allow-forms allow-same-origin" ' +
                  'allow="fullscreen; autoplay; encrypted-media" ' +
                  'referrerpolicy="no-referrer-when-downgrade"></iframe>' +
        '</div>' +
        '<div id="viewport-reader-wrapper" class="viewport-surface reader-view hidden"></div>' +
        '<div id="viewport-error-wrapper" class="viewport-surface error-view hidden"></div>';

      this.iframeEl = document.getElementById('web-surface');
      this.readerEl = document.getElementById('viewport-reader-wrapper');
      this.errorEl = document.getElementById('viewport-error-wrapper');

      this.bindIframeEvents();
    },

    bindIframeEvents: function() {
      var self = this;
      if (!this.iframeEl) return;

      this.iframeEl.addEventListener('load', function() {
        if (self.loadTimeoutId) {
          clearTimeout(self.loadTimeoutId);
          self.loadTimeoutId = null;
        }

        console.log('[Viewport] Iframe load event fired for:', self.currentUrl);

        // Check if we can inject cosmetic ad-block rules (only works if same-origin)
        try {
          var iframeDoc = self.iframeEl.contentDocument || self.iframeEl.contentWindow.document;
          if (iframeDoc && AdBlockEngine) {
            AdBlockEngine.injectCosmeticFilters(iframeDoc, self.currentUrl);
          }
        } catch (crossOriginErr) {
          // Expected for cross-origin third-party pages due to Same-Origin Policy
        }

        if (self.onStateChange) {
          self.onStateChange({ type: 'LOADED', url: self.currentUrl });
        }
      });
    },

    /**
     * Navigate viewport to a target URL
     * @param {string} url
     * @param {string} [mode='EMBED'] 'EMBED' or 'READER'
     */
    loadUrl: function(url, mode) {
      if (!url) {
        this.showStartPage();
        return;
      }

      this.currentUrl = url;

      // Layer 1: Navigation Guard check
      if (AdBlockEngine) {
        var navCheck = AdBlockEngine.validateNavigation(url);
        if (!navCheck.allowed) {
          this.showError('Navigation Blocked', navCheck.reason || 'Unsafe destination', url);
          return;
        }
      }

      if (mode === 'READER') {
        this.loadReaderView(url);
      } else {
        this.loadEmbedView(url);
      }
    },

    loadEmbedView: function(url) {
      var self = this;
      this.currentMode = 'EMBED';
      this.hideAllSurfaces();
      document.getElementById('viewport-iframe-wrapper').classList.remove('hidden');

      if (this.onStateChange) {
        this.onStateChange({ type: 'LOADING', url: url });
      }

      // 12-second load timeout watchdog
      if (this.loadTimeoutId) clearTimeout(this.loadTimeoutId);
      this.loadTimeoutId = setTimeout(function() {
        self.handlePotentialFrameBlock(url);
      }, 12000);

      this.iframeEl.src = url;
    },

    handlePotentialFrameBlock: function(url) {
      console.warn('[Viewport] Page load timeout or frame refusal detected for:', url);
      this.showError(
        'Site Embedding Limitation',
        'This website specifies X-Frame-Options or CSP headers that prevent embedding directly inside an application frame.<br><br>' +
        'You can view sanitized text and images using <b>Reader Mode</b>, or try a different website.',
        url,
        true // offer reader mode button
      );
    },

    loadReaderView: function(url) {
      var self = this;
      this.currentMode = 'READER';
      this.hideAllSurfaces();
      this.readerEl.classList.remove('hidden');
      this.readerEl.innerHTML = '<div class="reader-loading"><div class="spinner"></div><p>Extracting clean article text...</p></div>';

      if (this.onStateChange) {
        this.onStateChange({ type: 'LOADING', url: url });
      }

      ReaderMode.extractArticle(url, function(err, article) {
        if (err) {
          self.showError('Reader Mode Unavailable', err.message, url);
          return;
        }

        self.readerEl.innerHTML = 
          '<article class="reader-card">' +
            '<header class="reader-header">' +
              '<h1 class="reader-title">' + self.escapeHtml(article.title) + '</h1>' +
              '<div class="reader-meta">Clean TV Reader View • ' + self.escapeHtml(url) + '</div>' +
            '</header>' +
            '<div class="reader-body">' + article.contentHtml + '</div>' +
          '</article>';

        // Inject cosmetic ad filter to ensure clean reader display
        if (AdBlockEngine) {
          AdBlockEngine.injectCosmeticFilters(document, url);
        }

        if (self.onStateChange) {
          self.onStateChange({ type: 'LOADED', url: url, title: article.title });
        }
      });
    },

    showError: function(title, description, url, allowReaderFallback) {
      this.currentMode = 'ERROR';
      this.hideAllSurfaces();
      this.errorEl.classList.remove('hidden');

      var html = 
        '<div class="error-card">' +
          '<div class="error-icon">⚠️</div>' +
          '<h2 class="error-title">' + this.escapeHtml(title) + '</h2>' +
          '<div class="error-description">' + description + '</div>' +
          '<div class="error-url">' + this.escapeHtml(url || '') + '</div>' +
          '<div class="error-actions">';

      if (allowReaderFallback) {
        html += '<button type="button" class="btn btn-primary" id="btn-switch-reader">Read in Reader Mode</button>';
      }
      html += '<button type="button" class="btn btn-secondary" id="btn-error-retry">Retry Loading</button>' +
              '<button type="button" class="btn btn-secondary" id="btn-error-home">Back to Start Page</button>' +
            '</div>' +
        '</div>';

      this.errorEl.innerHTML = html;

      var self = this;
      var btnReader = document.getElementById('btn-switch-reader');
      if (btnReader) {
        btnReader.addEventListener('click', function() {
          self.loadUrl(url, 'READER');
        });
      }

      var btnRetry = document.getElementById('btn-error-retry');
      if (btnRetry) {
        btnRetry.addEventListener('click', function() {
          self.loadUrl(url, 'EMBED');
        });
      }

      var btnHome = document.getElementById('btn-error-home');
      if (btnHome) {
        btnHome.addEventListener('click', function() {
          if (self.onStateChange) {
            self.onStateChange({ type: 'NAVIGATE_HOME' });
          }
        });
      }

      if (this.onStateChange) {
        this.onStateChange({ type: 'ERROR', url: url, error: title });
      }
    },

    showStartPage: function() {
      this.currentMode = 'START';
      this.currentUrl = '';
      this.hideAllSurfaces();
      if (this.iframeEl) this.iframeEl.src = 'about:blank';
    },

    hideAllSurfaces: function() {
      if (this.loadTimeoutId) {
        clearTimeout(this.loadTimeoutId);
        this.loadTimeoutId = null;
      }
      var surfaces = this.containerEl.querySelectorAll('.viewport-surface');
      for (var i = 0; i < surfaces.length; i++) {
        surfaces[i].classList.add('hidden');
      }
    },

    reload: function() {
      if (this.currentUrl) {
        this.loadUrl(this.currentUrl, this.currentMode);
      }
    },

    escapeHtml: function(text) {
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Viewport;
  } else {
    global.Viewport = Viewport;
  }
})(typeof window !== 'undefined' ? window : this);
