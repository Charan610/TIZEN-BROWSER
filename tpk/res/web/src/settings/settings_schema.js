/**
 * Default Settings Schema and Constants
 */

(function(global) {
  'use strict';

  var DEFAULT_SETTINGS = {
    // Appearance
    theme: 'dark', // 'dark' | 'deep-black' | 'slate'
    accentColor: '#38bdf8', // sky-400
    textScale: 100, // 100 | 115 | 130
    autoHideToolbar: true,
    toolbarHideDelaySeconds: 4,

    // Browsing
    defaultSearchEngine: 'duckduckgo', // 'duckduckgo' | 'google' | 'bing' | 'startpage'
    defaultStartPage: 'local', // 'local' | 'search' | 'blank'
    userAgentMode: 'auto', // 'auto' | 'tv' | 'desktop' | 'mobile'
    maxTabs: 3, // 1 | 2 | 3
    restoreSession: true,

    // Privacy & Security
    adblockEnabled: true,
    strictMode: false,
    blockPopups: true,
    hideCookieBanners: true,
    privateBrowsing: false,

    // Performance
    liteMode: false,
    disableAnimations: false,
    tabSuspension: true,

    // Diagnostics
    diagnosticsHud: false
  };

  var SEARCH_ENGINES = {
    duckduckgo: {
      name: 'DuckDuckGo',
      searchUrl: 'https://duckduckgo.com/?q=',
      homeUrl: 'https://duckduckgo.com'
    },
    google: {
      name: 'Google',
      searchUrl: 'https://www.google.com/search?q=',
      homeUrl: 'https://www.google.com'
    },
    bing: {
      name: 'Bing',
      searchUrl: 'https://www.bing.com/search?q=',
      homeUrl: 'https://www.bing.com'
    },
    startpage: {
      name: 'Startpage',
      searchUrl: 'https://www.startpage.com/sp/search?query=',
      homeUrl: 'https://www.startpage.com'
    }
  };

  var USER_AGENTS = {
    auto: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/5.0 Chrome/85.0.4183.93 TV Safari/537.36',
    tv: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/5.0 Chrome/85.0.4183.93 TV Safari/537.36',
    desktop: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.93 Safari/537.36',
    mobile: 'Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.93 Mobile Safari/537.36'
  };

  var SettingsSchema = {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    SEARCH_ENGINES: SEARCH_ENGINES,
    USER_AGENTS: USER_AGENTS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsSchema;
  } else {
    global.SettingsSchema = SettingsSchema;
  }
})(typeof window !== 'undefined' ? window : this);
