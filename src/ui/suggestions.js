/**
 * Typing Suggestions Engine
 * Aggregates local bookmarks, history, and debounced online search suggestions.
 * Manages TV D-pad selection, ARIA attributes, and non-conflicting keyboard interactions.
 */

(function(global) {
  'use strict';

  var BookmarkManager = typeof module !== 'undefined' && module.exports
    ? require('../bookmarks/bookmark_manager')
    : global.BookmarkManager;

  var HistoryManager = typeof module !== 'undefined' && module.exports
    ? require('../history/history_manager')
    : global.HistoryManager;

  var Suggestions = {
    dropdownEl: null,
    activeInputEl: null,
    onSelectCallback: null,
    currentItems: [],
    debounceTimer: null,
    activeRequestId: 0,
    selectedIndex: -1,

    init: function(options) {
      options = options || {};
      this.onSelectCallback = options.onSelect || null;

      if (typeof document === 'undefined') return;

      if (document.getElementById('suggestions-dropdown')) {
        this.dropdownEl = document.getElementById('suggestions-dropdown');
      } else {
        this.dropdownEl = document.createElement('div');
        this.dropdownEl.id = 'suggestions-dropdown';
        this.dropdownEl.className = 'suggestions-dropdown hidden';
        this.dropdownEl.setAttribute('role', 'listbox');
        this.dropdownEl.setAttribute('aria-label', 'Search and address suggestions');
        document.body.appendChild(this.dropdownEl);
      }
    },

    /**
     * Attach suggestions to a text input
     * @param {HTMLInputElement} inputEl
     * @param {Function} [onSelect]
     */
    attach: function(inputEl, onSelect) {
      if (!inputEl) return;
      var self = this;
      if (onSelect) this.onSelectCallback = onSelect;

      inputEl.addEventListener('input', function() {
        self.activeInputEl = inputEl;
        self.handleInputChange(inputEl.value);
      });

      inputEl.addEventListener('focus', function() {
        self.activeInputEl = inputEl;
        if (inputEl.value.trim().length > 0) {
          self.handleInputChange(inputEl.value);
        }
      });
    },

    handleInputChange: function(value) {
      var self = this;
      var query = (value || '').trim();

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }

      if (!query) {
        this.hide();
        return;
      }

      this.debounceTimer = setTimeout(function() {
        self.fetchSuggestions(query);
      }, 200);
    },

    /**
     * Gather local suggestions and query online autocomplete
     * @param {string} query
     * @param {Function} [done] Optional callback for unit tests
     */
    fetchSuggestions: function(query, done) {
      var self = this;
      var qLower = query.toLowerCase();
      var localItems = [];
      var seenUrls = {};

      // 1. Match Bookmarks
      try {
        var bm = global.BookmarkManager || BookmarkManager;
        var bookmarks = (bm && typeof bm.getAll === 'function')
          ? bm.getAll()
          : [];
        for (var i = 0; i < bookmarks.length; i++) {
          var b = bookmarks[i];
          var title = b.title || '';
          var url = b.url || '';
          if (title.toLowerCase().indexOf(qLower) !== -1 || url.toLowerCase().indexOf(qLower) !== -1) {
            localItems.push({
              type: 'bookmark',
              label: title || url,
              value: url,
              url: url,
              icon: '⭐️',
              badge: 'Bookmark'
            });
            seenUrls[url] = true;
            if (localItems.length >= 3) break;
          }
        }
      } catch (err) {
        console.warn('[Suggestions] Bookmark matching error:', err);
      }

      // 2. Match History
      try {
        var hm = global.HistoryManager || HistoryManager;
        var history = (hm && typeof hm.getAll === 'function')
          ? hm.getAll()
          : [];
        for (var j = 0; j < history.length; j++) {
          var h = history[j];
          var hTitle = h.title || '';
          var hUrl = h.url || '';
          if (seenUrls[hUrl]) continue;
          if (hTitle.toLowerCase().indexOf(qLower) !== -1 || hUrl.toLowerCase().indexOf(qLower) !== -1) {
            localItems.push({
              type: 'history',
              label: hTitle || hUrl,
              value: hUrl,
              url: hUrl,
              icon: '🕒',
              badge: 'History'
            });
            seenUrls[hUrl] = true;
            if (localItems.length >= 5) break;
          }
        }
      } catch (err) {
        console.warn('[Suggestions] History matching error:', err);
      }

      // If already has local items, render immediately while fetching online
      if (localItems.length > 0 && typeof document !== 'undefined') {
        this.render(localItems);
      }

      // 3. Online Search Suggestions via DuckDuckGo
      var requestId = ++this.activeRequestId;
      var onlineUrl = 'https://duckduckgo.com/ac/?q=' + encodeURIComponent(query) + '&type=list';

      if (typeof fetch === 'function') {
        fetch(onlineUrl)
          .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          })
          .then(function(data) {
            if (requestId !== self.activeRequestId) return; // Stale response discarded
            var searchItems = [];
            if (Array.isArray(data) && Array.isArray(data[1])) {
              var terms = data[1];
              for (var k = 0; k < terms.length && k < 5; k++) {
                var term = terms[k];
                if (typeof term === 'string' && term.trim()) {
                  searchItems.push({
                    type: 'search',
                    label: term,
                    value: term,
                    icon: '🔍',
                    badge: 'Search'
                  });
                }
              }
            }

            var combined = localItems.slice(0, 3).concat(searchItems);
            self.render(combined);
            if (done) done(null, combined);
          })
          .catch(function(error) {
            if (requestId !== self.activeRequestId) return;
            // Online failed (offline or network error), display local matches only
            if (localItems.length > 0) {
              self.render(localItems);
            } else {
              self.hide();
            }
            if (done) done(error, localItems);
          });
      } else {
        if (localItems.length > 0) {
          self.render(localItems);
        } else {
          self.hide();
        }
        if (done) done(null, localItems);
      }
    },

    render: function(items) {
      this.currentItems = items || [];
      if (!this.dropdownEl) return;

      if (this.currentItems.length === 0) {
        this.hide();
        return;
      }

      this.positionDropdown();

      var html = '';
      for (var i = 0; i < this.currentItems.length; i++) {
        var item = this.currentItems[i];
        html += '<button type="button" class="suggestion-item focusable" role="option" data-index="' + i + '">' +
                  '<span class="suggestion-icon">' + item.icon + '</span>' +
                  '<div class="suggestion-content">' +
                    '<span class="suggestion-title">' + this.escapeHtml(item.label) + '</span>' +
                    (item.url ? '<span class="suggestion-url">' + this.escapeHtml(item.url) + '</span>' : '') +
                  '</div>' +
                  '<span class="suggestion-badge ' + item.type + '">' + item.badge + '</span>' +
                '</button>';
      }

      this.dropdownEl.innerHTML = html;
      this.dropdownEl.classList.remove('hidden');
      this.bindItemEvents();
    },

    positionDropdown: function() {
      if (!this.dropdownEl || !this.activeInputEl) return;
      var rect = this.activeInputEl.getBoundingClientRect();
      var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;

      this.dropdownEl.style.top = (rect.bottom + scrollY + 8) + 'px';
      this.dropdownEl.style.left = (rect.left + scrollX) + 'px';
      this.dropdownEl.style.width = Math.max(rect.width, 520) + 'px';
    },

    bindItemEvents: function() {
      var self = this;
      if (!this.dropdownEl) return;

      var buttons = this.dropdownEl.querySelectorAll('.suggestion-item');
      for (var i = 0; i < buttons.length; i++) {
        (function(index, btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.selectItem(index);
          });

          btn.addEventListener('keydown', function(e) {
            var code = e.keyCode || e.which;

            // Down Arrow
            if (code === 40) {
              e.preventDefault();
              e.stopPropagation();
              var next = buttons[index + 1] || buttons[0];
              next.focus();
              return;
            }

            // Up Arrow
            if (code === 38) {
              e.preventDefault();
              e.stopPropagation();
              if (index === 0) {
                if (self.activeInputEl) self.activeInputEl.focus();
              } else {
                buttons[index - 1].focus();
              }
              return;
            }

            // Enter / OK (13)
            if (code === 13) {
              e.preventDefault();
              e.stopPropagation();
              self.selectItem(index);
              return;
            }

            // Back / Cancel / Escape
            if (code === 10009 || code === 27 || code === 65385) {
              e.preventDefault();
              e.stopPropagation();
              self.hide();
              if (self.activeInputEl) self.activeInputEl.focus();
            }
          });
        })(i, buttons[i]);
      }
    },

    selectItem: function(index) {
      var item = this.currentItems[index];
      if (!item) return;

      if (this.activeInputEl) {
        this.activeInputEl.value = item.value;
      }

      var val = item.value;
      this.hide();

      if (this.onSelectCallback) {
        this.onSelectCallback(val);
      }
    },

    focusFirst: function() {
      if (!this.dropdownEl) return;
      var first = this.dropdownEl.querySelector('.suggestion-item');
      if (first) {
        first.focus();
      }
    },

    isOpen: function() {
      return !!(this.dropdownEl && !this.dropdownEl.classList.contains('hidden') && this.currentItems.length > 0);
    },

    hide: function() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      this.activeRequestId++;
      this.currentItems = [];
      this.selectedIndex = -1;
      if (this.dropdownEl) {
        this.dropdownEl.classList.add('hidden');
        this.dropdownEl.innerHTML = '';
      }
    },

    escapeHtml: function(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Suggestions;
  } else {
    global.Suggestions = Suggestions;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
