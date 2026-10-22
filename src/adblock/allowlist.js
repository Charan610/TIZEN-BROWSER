/**
 * Ad-Block Allowlist & Site-Exception Manager
 * Maintains per-origin rules and user exceptions.
 */

(function(global) {
  'use strict';

  var Storage = typeof module !== 'undefined' && module.exports
    ? require('../storage/storage_service')
    : global.StorageService;

  var STORAGE_KEY = 'adblock_allowlist';

  var Allowlist = {
    sites: [],

    init: function() {
      this.sites = Storage.get(STORAGE_KEY, []);
      return this.sites;
    },

    /**
     * Check if a host or URL is allowlisted
     * @param {string} hostOrUrl
     * @returns {boolean}
     */
    isAllowlisted: function(hostOrUrl) {
      if (!hostOrUrl) return false;
      var clean = hostOrUrl.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      return this.sites.indexOf(clean) !== -1;
    },

    /**
     * Add a host to the allowlist
     * @param {string} hostOrUrl
     */
    add: function(hostOrUrl) {
      if (!hostOrUrl) return;
      var clean = hostOrUrl.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      if (this.sites.indexOf(clean) === -1) {
        this.sites.push(clean);
        Storage.set(STORAGE_KEY, this.sites);
      }
    },

    /**
     * Remove a host from the allowlist
     * @param {string} hostOrUrl
     */
    remove: function(hostOrUrl) {
      if (!hostOrUrl) return;
      var clean = hostOrUrl.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      this.sites = this.sites.filter(function(s) { return s !== clean; });
      Storage.set(STORAGE_KEY, this.sites);
    },

    /**
     * Toggle allowlist status for a host
     * @param {string} hostOrUrl
     * @returns {boolean} New allowlist status
     */
    toggle: function(hostOrUrl) {
      if (this.isAllowlisted(hostOrUrl)) {
        this.remove(hostOrUrl);
        return false;
      } else {
        this.add(hostOrUrl);
        return true;
      }
    },

    getAll: function() {
      return this.sites.slice(0);
    },

    clear: function() {
      this.sites = [];
      Storage.set(STORAGE_KEY, []);
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Allowlist;
  } else {
    global.Allowlist = Allowlist;
  }
})(typeof window !== 'undefined' ? window : this);
