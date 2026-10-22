/**
 * Reader Mode & Content Extraction Engine
 * Fetches page markup, removes ads, trackers, and scripts,
 * and formats clean article text for comfortable 10-foot TV viewing.
 */

(function(global) {
  'use strict';

  var AdBlockEngine = typeof module !== 'undefined' && module.exports
    ? require('../adblock/adblock_engine')
    : global.AdBlockEngine;

  var ReaderMode = {
    /**
     * Check if a URL is likely an article suitable for reader view
     * @param {string} url
     * @returns {boolean}
     */
    isLikelyArticle: function(url) {
      if (!url) return false;
      return /wikipedia\.org|news|blog|article|post|\.html?/i.test(url);
    },

    /**
     * Fetch and parse an article into clean readable HTML
     * @param {string} url
     * @param {Function} callback (error, articleData)
     */
    extractArticle: function(url, callback) {
      var self = this;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = 10000;

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 400) {
          try {
            var article = self.parseHtml(xhr.responseText, url);
            callback(null, article);
          } catch (e) {
            callback(new Error('Failed to parse article content: ' + e.message));
          }
        } else {
          callback(new Error('HTTP ' + xhr.status + ': Could not load article'));
        }
      };

      xhr.onerror = function() {
        callback(new Error('Network error loading article. Site may enforce CORS restrictions.'));
      };

      xhr.ontimeout = function() {
        callback(new Error('Connection timed out while loading article.'));
      };

      xhr.send();
    },

    /**
     * Parse raw HTML string into clean article structure
     * @param {string} htmlText
     * @param {string} baseUrl
     * @returns {Object} Article structure { title, byline, contentHtml }
     */
    parseHtml: function(htmlText, baseUrl) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(htmlText, 'text/html');

      // 1. Extract Title
      var title = '';
      var titleEl = doc.querySelector('h1, title, meta[property="og:title"]');
      if (titleEl) {
        title = titleEl.getAttribute('content') || titleEl.textContent || '';
      }
      if (!title) title = 'Article';

      // 2. Strip unwanted clutter (scripts, styles, ads, iframes, nav, footer)
      var removeSelectors = [
        'script', 'style', 'noscript', 'iframe', 'header', 'footer', 'nav',
        '.ad', '.ads', '.adsbygoogle', '.advertisement', '#cookie-notice',
        '.social-share', '.sidebar', 'aside', '.newsletter-signup'
      ];
      var nodesToRemove = doc.querySelectorAll(removeSelectors.join(','));
      for (var i = 0; i < nodesToRemove.length; i++) {
        nodesToRemove[i].remove();
      }

      // 3. Find primary content container
      var contentRoot = doc.querySelector('article, main, .article-body, .entry-content, #mw-content-text, .post-content') || doc.body;

      // Extract paragraphs and headings
      var textBlocks = [];
      var elements = contentRoot.querySelectorAll('p, h2, h3, blockquote, ul, ol, img');

      for (var j = 0; j < elements.length; j++) {
        var el = elements[j];
        var tag = el.tagName.toLowerCase();

        if (tag === 'p') {
          var pText = el.textContent.trim();
          if (pText.length > 20) {
            textBlocks.push('<p class="reader-paragraph">' + this.escapeHtml(pText) + '</p>');
          }
        } else if (tag === 'h2' || tag === 'h3') {
          var hText = el.textContent.trim();
          if (hText.length > 0) {
            textBlocks.push('<' + tag + ' class="reader-subheading">' + this.escapeHtml(hText) + '</' + tag + '>');
          }
        } else if (tag === 'blockquote') {
          textBlocks.push('<blockquote class="reader-quote">' + this.escapeHtml(el.textContent.trim()) + '</blockquote>');
        } else if (tag === 'img' && el.src && el.src.indexOf('data:') !== 0) {
          // Keep key article images
          var src = this.resolveUrl(el.src, baseUrl);
          textBlocks.push('<div class="reader-image-wrap"><img src="' + src + '" alt="Article Image" class="reader-img" loading="lazy" /></div>');
        }
      }

      var contentHtml = textBlocks.join('\n');
      if (!contentHtml) {
        contentHtml = '<p class="reader-paragraph">Could not extract readable article text from this page.</p>';
      }

      return {
        title: title.trim(),
        contentHtml: contentHtml,
        url: baseUrl
      };
    },

    resolveUrl: function(relativeUrl, baseUrl) {
      try {
        return new URL(relativeUrl, baseUrl).href;
      } catch (e) {
        return relativeUrl;
      }
    },

    escapeHtml: function(text) {
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReaderMode;
  } else {
    global.ReaderMode = ReaderMode;
  }
})(typeof window !== 'undefined' ? window : this);
