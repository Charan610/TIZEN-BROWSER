/**
 * Cosmetic Ad & Tracker Filtering Rules
 * Compiled CSS selector rules to hide advertising containers, sponsored widgets,
 * floating video popunders, and intrusive cookie consent walls.
 */

(function(global) {
  'use strict';

  // Standard advertising container classes & IDs
  var AD_SELECTORS = [
    // Standard Google AdSense / Ad Exchange
    '.adsbygoogle',
    'ins.adsbygoogle',
    'div[id^="google_ads_"]',
    'iframe[id^="google_ads_"]',
    'div[id^="div-gpt-ad"]',
    'div[id*="ad-slot"]',
    'div[class*="ad-container"]',
    'div[class*="ad-wrapper"]',
    'div[class*="ad_banner"]',
    'div[class*="banner-ad"]',

    // Content recommendation widgets & native ads
    '.taboola-ad',
    '#taboola-below-article-thumbnails',
    'div[id*="outbrain"]',
    '.outbrain_widget',
    '.sponsored-post',
    '.sponsored-content',
    'div[data-ad-unit]',
    'div[data-adzone]',

    // Floating video popunders and overlay ad banners
    '.floating-ad',
    '.sticky-ad',
    '.bottom-ad-bar',
    'div[class*="ad-sticky"]',
    'div[class*="ad-overlay"]'
  ];

  // Cookie consent banner selectors
  var COOKIE_BANNER_SELECTORS = [
    '#onetrust-consent-sdk',
    '.cookie-banner',
    '.cookie-consent',
    '#cookieConsent',
    '.cc-window',
    'div[id*="cookie-notice"]',
    'div[aria-label*="cookie consent" i]',
    '.qc-cmp2-container'
  ];

  // Strict mode ad selectors (more aggressive, applied only when Strict Mode enabled)
  var STRICT_AD_SELECTORS = [
    'div[class*="promo"]',
    'aside[class*="sponsored"]',
    'div[class*="recommendation"]',
    'div[data-ad]',
    'section[class*="partner-content"]'
  ];

  var CosmeticRules = {
    AD_SELECTORS: AD_SELECTORS,
    COOKIE_BANNER_SELECTORS: COOKIE_BANNER_SELECTORS,
    STRICT_AD_SELECTORS: STRICT_AD_SELECTORS,

    /**
     * Generate compiled CSS string to inject into documents
     * @param {boolean} [includeCookies=true]
     * @param {boolean} [strictMode=false]
     * @returns {string}
     */
    generateCSS: function(includeCookies, strictMode) {
      var selectors = AD_SELECTORS.slice(0);

      if (includeCookies) {
        selectors = selectors.concat(COOKIE_BANNER_SELECTORS);
      }

      if (strictMode) {
        selectors = selectors.concat(STRICT_AD_SELECTORS);
      }

      return selectors.join(',\n') + ' {\n  display: none !important;\n  visibility: hidden !important;\n  height: 0 !important;\n  min-height: 0 !important;\n  opacity: 0 !important;\n  pointer-events: none !important;\n}\n';
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CosmeticRules;
  } else {
    global.CosmeticRules = CosmeticRules;
  }
})(typeof window !== 'undefined' ? window : this);
