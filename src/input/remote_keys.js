/**
 * Samsung TV Remote Key Mapping & Registration Engine
 * Binds hardware keycodes, registers Tizen TV input keys, and dispatches normalized actions.
 */

(function(global) {
  'use strict';

  var RemoteKeys = {
    // Standard W3C & Tizen KeyCodes
    KEY_LEFT: 37,
    KEY_UP: 38,
    KEY_RIGHT: 39,
    KEY_DOWN: 40,
    KEY_ENTER: 13,
    KEY_RETURN: 10009, // Samsung TV Return/Back
    KEY_ESC: 27,

    // Color Keys
    KEY_RED: 403,     // ColorF0Red
    KEY_GREEN: 404,   // ColorF1Green
    KEY_YELLOW: 405,  // ColorF2Yellow
    KEY_BLUE: 406,    // ColorF3Blue

    // Media Keys
    KEY_PLAY: 415,
    KEY_PAUSE: 19,
    KEY_PLAY_PAUSE: 10252,
    KEY_STOP: 413,
    KEY_FAST_FORWARD: 417,
    KEY_REWIND: 412,

    // Channel & Misc
    KEY_CHANNEL_UP: 427,
    KEY_CHANNEL_DOWN: 428,
    KEY_INFO: 457,
    KEY_TOOLS: 10135,
    KEY_SEARCH: 10225,

    // Tizen TV Key Registration Names
    TIZEN_REGISTER_KEYS: [
      'ColorF0Red',
      'ColorF1Green',
      'ColorF2Yellow',
      'ColorF3Blue',
      'MediaPlay',
      'MediaPause',
      'MediaPlayPause',
      'MediaStop',
      'MediaFastForward',
      'MediaRewind',
      'ChannelUp',
      'ChannelDown',
      'Info',
      'Tools',
      'Search',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
    ],

    /**
     * Initialize Tizen TV key registration
     */
    init: function() {
      if (typeof window !== 'undefined' && window.tizen && window.tizen.tvinputdevice) {
        console.log('[RemoteKeys] Registering Tizen hardware keys...');
        for (var i = 0; i < this.TIZEN_REGISTER_KEYS.length; i++) {
          var keyName = this.TIZEN_REGISTER_KEYS[i];
          try {
            window.tizen.tvinputdevice.registerKey(keyName);
          } catch (e) {
            // Key may not be supported on this remote model (e.g. Smart Remote lacks physical color keys)
          }
        }
      } else {
        console.log('[RemoteKeys] Non-Tizen environment: using standard keyboard events');
      }
    },

    /**
     * Normalize key event to a human-readable action string
     * @param {KeyboardEvent} event
     * @returns {string} Action name or 'UNKNOWN'
     */
    getAction: function(event) {
      var code = event.keyCode || event.which;

      switch (code) {
        case this.KEY_LEFT: return 'LEFT';
        case this.KEY_UP: return 'UP';
        case this.KEY_RIGHT: return 'RIGHT';
        case this.KEY_DOWN: return 'DOWN';
        case this.KEY_ENTER: return 'ENTER';
        case this.KEY_RETURN:
        case this.KEY_ESC: return 'BACK';

        case this.KEY_RED: return 'COLOR_RED';
        case this.KEY_GREEN: return 'COLOR_GREEN';
        case this.KEY_YELLOW: return 'COLOR_YELLOW';
        case this.KEY_BLUE: return 'COLOR_BLUE';

        case this.KEY_PLAY:
        case this.KEY_PLAY_PAUSE: return 'PLAY_PAUSE';
        case this.KEY_PAUSE: return 'PAUSE';
        case this.KEY_STOP: return 'STOP';
        case this.KEY_FAST_FORWARD: return 'FAST_FORWARD';
        case this.KEY_REWIND: return 'REWIND';

        case this.KEY_CHANNEL_UP: return 'PAGE_UP';
        case this.KEY_CHANNEL_DOWN: return 'PAGE_DOWN';
        case this.KEY_INFO: return 'INFO';
        case this.KEY_TOOLS: return 'MENU';
        case this.KEY_SEARCH: return 'SEARCH';

        default:
          if (code >= 48 && code <= 57) {
            return 'NUM_' + (code - 48);
          }
          return 'UNKNOWN';
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RemoteKeys;
  } else {
    global.RemoteKeys = RemoteKeys;
  }
})(typeof window !== 'undefined' ? window : this);
