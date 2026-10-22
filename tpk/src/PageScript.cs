using System;

namespace TVBrowser
{
    internal static class PageScript
    {
        public const string BridgeName = "sbnative";

        /// <summary>
        /// Injected script providing in-page virtual cursor, click dispatch,
        /// text field detection, popup interception, and cosmetic ad filtering.
        /// </summary>
        public static string GetInjectionScript(string bridgeName = BridgeName, bool adblockEnabled = true)
        {
            string cosmeticCss = adblockEnabled
                ? ".ad, .ads, .ad-container, .adsbygoogle, div[id^='google_ads'], [data-ad-slot], .sponsored-post { display: none !important; }"
                : string.Empty;

            return @"(function() {
  if (window.__tvb_injected) return;
  window.__tvb_injected = true;

  var bridge = window." + bridgeName + @";
  var cursorX = window.innerWidth / 2;
  var cursorY = window.innerHeight / 2;
  var cursorEl = null;
  var lastTarget = null;
  var redirectCount = 0;
  var redirectTimer = null;

  // 1. Popup & Window.Open Protection
  var origOpen = window.open;
  window.open = function(url, target, features) {
    if (bridge && typeof bridge.postMessage === 'function') {
      bridge.postMessage('popup\u0001' + (url || ''));
    }
    // Return a dummy window object to satisfy scripts without popping external windows
    return {
      closed: false,
      close: function() {},
      focus: function() {},
      blur: function() {},
      location: { href: url || '' }
    };
  };

  // 2. Redirect Loop Protection
  function trackRedirect() {
    redirectCount++;
    if (redirectTimer) clearTimeout(redirectTimer);
    redirectTimer = setTimeout(function() { redirectCount = 0; }, 4000);
    if (redirectCount > 4) {
      if (bridge && typeof bridge.postMessage === 'function') {
        bridge.postMessage('redirect_loop_detected\u0001' + location.href);
      }
      return false;
    }
    return true;
  }

  // 3. Cosmetic Ad Blocking Injection
  try {
    var css = '" + cosmeticCss + @"';
    if (css) {
      var style = document.createElement('style');
      style.id = '__tvb_adblock_style';
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }
  } catch(e) {}

  // 4. Cursor Element Creation
  function createCursor() {
    if (cursorEl) return;
    cursorEl = document.createElement('div');
    cursorEl.id = '__tvb_cursor';
    cursorEl.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;' +
      'pointer-events:none;border-style:solid;' +
      'border-width:24px 14px 0 0;' +
      'border-color:#38bdf8 transparent transparent transparent;' +
      '-webkit-filter:drop-shadow(1px 2px 2px rgba(0,0,0,0.8));' +
      'filter:drop-shadow(1px 2px 2px rgba(0,0,0,0.8));' +
      'transform:translate(' + cursorX + 'px,' + cursorY + 'px);' +
      'transition:transform 60ms linear;';
    (document.body || document.documentElement).appendChild(cursorEl);
  }

  function pulse() {
    try {
      var p = document.createElement('div');
      p.style.cssText =
        'position:fixed;left:0;top:0;width:16px;height:16px;margin:-8px 0 0 -8px;' +
        'border:3px solid #38bdf8;border-radius:50%;z-index:2147483646;pointer-events:none;' +
        'transform:translate(' + cursorX + 'px,' + cursorY + 'px) scale(1);' +
        'transition:all 300ms ease-out;';
      (document.body || document.documentElement).appendChild(p);
      setTimeout(function() {
        p.style.opacity = '0';
        p.style.transform = 'translate(' + cursorX + 'px,' + cursorY + 'px) scale(3)';
      }, 15);
      setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, 350);
    } catch(e) {}
  }

  function getInteractive(node) {
    var clickables = 'a,button,input,select,textarea,summary,label,[role=button],[role=link],[tabindex],[onclick]';
    if (!node) return null;
    try {
      if (node.closest) return node.closest(clickables);
    } catch(e) {}
    var cur = node;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      try {
        if (cur.matches && cur.matches(clickables)) return cur;
      } catch(e) {}
      cur = cur.parentElement;
    }
    return node;
  }

  function fireMouse(type, target, x, y) {
    if (!target) return;
    var evt;
    try {
      evt = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: (type === 'mousedown' ? 1 : 0)
      });
    } catch(e) {
      evt = document.createEvent('MouseEvents');
      evt.initMouseEvent(type, true, true, window, (type === 'click' ? 1 : 0), 0, 0, x, y, false, false, false, false, 0, null);
    }
    try { target.dispatchEvent(evt); } catch(e) {}
  }

  // 5. Global Bridge API
  window.__tvb = {
    init: function() {
      createCursor();
    },

    move: function(fx, fy) {
      cursorX = Math.max(0, Math.min(window.innerWidth - 1, fx * window.innerWidth));
      cursorY = Math.max(0, Math.min(window.innerHeight - 1, fy * window.innerHeight));
      if (!cursorEl) createCursor();
      if (cursorEl) {
        cursorEl.style.transform = 'translate(' + cursorX + 'px,' + cursorY + 'px)';
      }

      var el = null;
      try { el = document.elementFromPoint(cursorX, cursorY); } catch(e) {}
      if (el !== lastTarget) {
        if (lastTarget) { fireMouse('mouseout', lastTarget, cursorX, cursorY); }
        if (el) { fireMouse('mouseover', el, cursorX, cursorY); }
        lastTarget = el;
      }
      if (el) fireMouse('mousemove', el, cursorX, cursorY);
    },

    click: function() {
      pulse();
      var el = null;
      try { el = document.elementFromPoint(cursorX, cursorY); } catch(e) {}
      if (!el) return 'NO_TARGET';

      // Check for iframe boundary
      if (el.tagName === 'IFRAME' || el.tagName === 'FRAME') {
        if (bridge && typeof bridge.postMessage === 'function') {
          bridge.postMessage('frame_click\u0001' + Math.round(cursorX) + '\u0001' + Math.round(cursorY));
        }
        return 'FRAME';
      }

      var target = getInteractive(el) || el;
      var isField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      fireMouse('mousedown', target, cursorX, cursorY);
      fireMouse('mouseup', target, cursorX, cursorY);
      fireMouse('click', target, cursorX, cursorY);

      if (isField) {
        try {
          target.style.outline = '3px solid #38bdf8';
        } catch(e) {}
        if (bridge && typeof bridge.postMessage === 'function') {
          bridge.postMessage('field_clicked\u0001' + (target.value || target.textContent || ''));
        }
        return 'FIELD';
      }

      if (target.href && bridge && typeof bridge.postMessage === 'function') {
        bridge.postMessage('link_clicked\u0001' + target.href);
      }

      return 'CLICKED';
    },

    typeText: function(text) {
      var el = null;
      try { el = document.elementFromPoint(cursorX, cursorY); } catch(e) {}
      var target = getInteractive(el);
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        target.value = text;
        try {
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
        } catch(e) {}
      }
    },

    scroll: function(deltaY) {
      window.scrollBy({ top: deltaY, behavior: 'smooth' });
    }
  };

  createCursor();
})();";
        }
    }
}
