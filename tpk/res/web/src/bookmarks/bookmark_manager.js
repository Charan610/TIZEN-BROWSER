/**
 * Bookmark Manager
 * Handles user bookmarks, quick-access favorites, and metadata persistence.
 */

(function(global) {
  'use strict';

  var Storage = typeof module !== 'undefined' && module.exports
    ? require('../storage/storage_service')
    : global.StorageService;

  var STORAGE_KEY = 'bookmarks';

  var DEFAULT_BOOKMARKS = [
    { title: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🔍' },
    { title: 'Wikipedia', url: 'https://www.wikipedia.org', icon: '📚' },
    { title: 'Hacker News', url: 'https://news.ycombinator.com', icon: '📰' },
    { title: 'Example Domain', url: 'https://example.com', icon: '🌐' }
  ];

  var BookmarkManager = {
    bookmarks: [],

    init: function() {
      var saved = Storage ? Storage.get(STORAGE_KEY, null) : null;
      if (!saved || !Array.isArray(saved) || saved.length === 0) {
        this.bookmarks = DEFAULT_BOOKMARKS.slice(0);
        this.persist();
      } else {
        this.bookmarks = saved;
      }
      return this.bookmarks;
    },

    getAll: function() {
      return this.bookmarks.slice(0);
    },

    isBookmarked: function(url) {
      if (!url) return false;
      var clean = url.trim().toLowerCase();
      for (var i = 0; i < this.bookmarks.length; i++) {
        if (this.bookmarks[i].url.trim().toLowerCase() === clean) {
          return true;
        }
      }
      return false;
    },

    add: function(title, url, icon) {
      if (!url) return false;
      if (this.isBookmarked(url)) return false;

      this.bookmarks.push({
        title: title || url,
        url: url,
        icon: icon || '🔖',
        createdAt: Date.now()
      });

      this.persist();
      return true;
    },

    remove: function(url) {
      if (!url) return false;
      var clean = url.trim().toLowerCase();
      var initialLen = this.bookmarks.length;
      this.bookmarks = this.bookmarks.filter(function(b) {
        return b.url.trim().toLowerCase() !== clean;
      });

      if (this.bookmarks.length !== initialLen) {
        this.persist();
        return true;
      }
      return false;
    },

    toggle: function(title, url, icon) {
      if (this.isBookmarked(url)) {
        this.remove(url);
        return false;
      } else {
        this.add(title, url, icon);
        return true;
      }
    },

    persist: function() {
      if (Storage) {
        Storage.set(STORAGE_KEY, this.bookmarks);
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookmarkManager;
  } else {
    global.BookmarkManager = BookmarkManager;
  }
})(typeof window !== 'undefined' ? window : this);
