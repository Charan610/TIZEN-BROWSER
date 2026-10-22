/**
 * Download Manager
 * Interfaces with Tizen Download API (tizen.download) on TV hardware,
 * provides download ledger, progress tracking, and development simulation.
 */

(function(global) {
  'use strict';

  var Storage = typeof module !== 'undefined' && module.exports
    ? require('../storage/storage_service')
    : global.StorageService;

  var STORAGE_KEY = 'downloads_ledger';

  var DownloadManager = {
    isTizenSupported: false,
    activeDownloads: {},
    history: [],
    listeners: [],

    init: function() {
      this.history = Storage ? Storage.get(STORAGE_KEY, []) : [];

      if (typeof window !== 'undefined' && window.tizen && window.tizen.download) {
        try {
          if (window.tizen.systeminfo) {
            this.isTizenSupported = window.tizen.systeminfo.getCapability('http://tizen.org/feature/download');
          } else {
            this.isTizenSupported = true;
          }
        } catch (e) {
          this.isTizenSupported = true;
        }
      }

      console.log('[DownloadManager] Initialized. Tizen Download API native support:', this.isTizenSupported);
    },

    /**
     * Start downloading a file
     * @param {string} url
     * @param {string} [suggestedFileName]
     * @returns {string} Download ID
     */
    startDownload: function(url, suggestedFileName) {
      var id = 'dl_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      var fileName = suggestedFileName || this.extractFileName(url);

      var downloadRecord = {
        id: id,
        url: url,
        fileName: fileName,
        receivedBytes: 0,
        totalBytes: 0,
        progressPercent: 0,
        state: 'DOWNLOADING', // 'DOWNLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELED'
        startTime: Date.now(),
        finishTime: null,
        error: null,
        fullPath: null
      };

      this.activeDownloads[id] = downloadRecord;
      this.history.unshift(downloadRecord);
      this.persist();
      this.notify(downloadRecord);

      var self = this;

      if (this.isTizenSupported && window.tizen && window.tizen.download) {
        try {
          var request = new window.tizen.DownloadRequest(url, 'downloads');
          var tizenId = window.tizen.download.start(request, {
            onprogress: function(tId, received, total) {
              downloadRecord.receivedBytes = received;
              downloadRecord.totalBytes = total;
              downloadRecord.progressPercent = total > 0 ? Math.round((received / total) * 100) : 0;
              self.notify(downloadRecord);
            },
            onpaused: function() {
              downloadRecord.state = 'PAUSED';
              self.notify(downloadRecord);
            },
            oncanceled: function() {
              downloadRecord.state = 'CANCELED';
              downloadRecord.finishTime = Date.now();
              delete self.activeDownloads[id];
              self.persist();
              self.notify(downloadRecord);
            },
            oncompleted: function(tId, fullPath) {
              downloadRecord.state = 'COMPLETED';
              downloadRecord.progressPercent = 100;
              downloadRecord.finishTime = Date.now();
              downloadRecord.fullPath = fullPath;
              delete self.activeDownloads[id];
              self.persist();
              self.notify(downloadRecord);
            },
            onfailed: function(tId, error) {
              downloadRecord.state = 'FAILED';
              downloadRecord.finishTime = Date.now();
              downloadRecord.error = error ? (error.message || JSON.stringify(error)) : 'Download failed';
              delete self.activeDownloads[id];
              self.persist();
              self.notify(downloadRecord);
            }
          });
          downloadRecord.tizenDownloadId = tizenId;
        } catch (err) {
          downloadRecord.state = 'FAILED';
          downloadRecord.error = err.message;
          delete self.activeDownloads[id];
          self.persist();
          self.notify(downloadRecord);
        }
      } else {
        // Development / Mock Simulation when running locally in browser
        console.log('[DownloadManager] Running simulated download for development:', fileName);
        var progress = 0;
        var total = 2048576; // 2 MB
        var interval = setInterval(function() {
          progress += 256000;
          if (progress >= total) {
            clearInterval(interval);
            downloadRecord.receivedBytes = total;
            downloadRecord.totalBytes = total;
            downloadRecord.progressPercent = 100;
            downloadRecord.state = 'COMPLETED';
            downloadRecord.finishTime = Date.now();
            downloadRecord.fullPath = 'downloads/' + fileName;
            delete self.activeDownloads[id];
            self.persist();
            self.notify(downloadRecord);
          } else {
            downloadRecord.receivedBytes = progress;
            downloadRecord.totalBytes = total;
            downloadRecord.progressPercent = Math.round((progress / total) * 100);
            self.notify(downloadRecord);
          }
        }, 300);
        downloadRecord._mockInterval = interval;
      }

      return id;
    },

    cancelDownload: function(id) {
      var item = this.activeDownloads[id];
      if (!item) return;

      if (item._mockInterval) {
        clearInterval(item._mockInterval);
      }

      if (this.isTizenSupported && item.tizenDownloadId && window.tizen && window.tizen.download) {
        try {
          window.tizen.download.cancel(item.tizenDownloadId);
        } catch (e) {}
      }

      item.state = 'CANCELED';
      item.finishTime = Date.now();
      delete this.activeDownloads[id];
      this.persist();
      this.notify(item);
    },

    extractFileName: function(url) {
      if (!url) return 'download.bin';
      try {
        var cleanUrl = url.split('?')[0].split('#')[0];
        var parts = cleanUrl.split('/');
        var last = parts[parts.length - 1];
        return last && last.indexOf('.') !== -1 ? decodeURIComponent(last) : 'download_' + Date.now() + '.bin';
      } catch (e) {
        return 'download_' + Date.now() + '.bin';
      }
    },

    getHistory: function() {
      return this.history.slice(0);
    },

    clearHistory: function() {
      this.history = [];
      this.persist();
    },

    persist: function() {
      if (Storage) {
        // Keep last 50 entries
        var trimmed = this.history.slice(0, 50);
        Storage.set(STORAGE_KEY, trimmed);
      }
    },

    subscribe: function(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
      }
    },

    notify: function(record) {
      for (var i = 0; i < this.listeners.length; i++) {
        try {
          this.listeners[i](record, this.history);
        } catch (e) {
          console.error('[DownloadManager] Listener error:', e);
        }
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DownloadManager;
  } else {
    global.DownloadManager = DownloadManager;
  }
})(typeof window !== 'undefined' ? window : this);
