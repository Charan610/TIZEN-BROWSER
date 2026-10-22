/**
 * Unit Tests: Suggestions
 * Verifies local bookmark/history matching, online query parsing,
 * debouncing, stale response discarding, and failure fallback.
 */

const assert = require('assert');
const Suggestions = require('../../src/ui/suggestions');

function run(done) {
  console.log('Testing Suggestions:');

  // Setup mock storage and managers
  var mockBookmarks = [
    { title: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
    { title: 'DuckDuckGo Search', url: 'https://duckduckgo.com', icon: '🦆' },
    { title: 'GitHub', url: 'https://github.com', icon: '🐙' }
  ];

  var mockHistory = [
    { title: 'DuckDuckGo Search', url: 'https://duckduckgo.com', timestamp: 1000 },
    { title: 'Samsung Smart TV Developers', url: 'https://developer.samsung.com', timestamp: 2000 },
    { title: 'Wikipedia Free Encyclopedia', url: 'https://wikipedia.org', timestamp: 3000 }
  ];

  global.BookmarkManager = {
    getAll: function() { return mockBookmarks; }
  };

  global.HistoryManager = {
    getAll: function() { return mockHistory; }
  };

  // Mock document and DOM elements
  var createdElements = {};
  global.document = {
    createElement: function(tag) {
      var classes = [];
      var listeners = {};
      var el = {
        tagName: tag.toUpperCase(),
        id: '',
        className: '',
        style: {},
        innerHTML: '',
        classList: {
          contains: function(cls) { return classes.indexOf(cls) !== -1; },
          add: function(cls) { if (classes.indexOf(cls) === -1) classes.push(cls); },
          remove: function(cls) {
            var idx = classes.indexOf(cls);
            if (idx !== -1) classes.splice(idx, 1);
          }
        },
        setAttribute: function() {},
        getAttribute: function() { return ''; },
        querySelectorAll: function() { return []; },
        querySelector: function() { return null; },
        addEventListener: function(event, fn) {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(fn);
        }
      };
      return el;
    },
    getElementById: function(id) {
      return createdElements[id] || null;
    },
    body: {
      appendChild: function(el) {
        if (el.id) createdElements[el.id] = el;
      }
    }
  };

  global.window = {
    scrollY: 0,
    scrollX: 0
  };

  Suggestions.init();
  var originalFetch = global.fetch;

  // Test 1: Local bookmark matching (fetch null for local-only path)
  global.fetch = null;
  Suggestions.fetchSuggestions('git', function(err, items) {
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].type, 'bookmark');
    assert.strictEqual(items[0].value, 'https://github.com');
    console.log('  ✓ Local bookmark substring matching verified');

    testHistoryAndDeduplication();
  });

  // Test 2: Local history matching and URL deduplication
  function testHistoryAndDeduplication() {
    // 'duck' matches both bookmark and history with same URL: https://duckduckgo.com
    Suggestions.fetchSuggestions('duck', function(err, items) {
      assert.strictEqual(items.length, 1, 'Duplicate URL deduplicated');
      assert.strictEqual(items[0].type, 'bookmark', 'Bookmark prioritized over history');
      assert.strictEqual(items[0].value, 'https://duckduckgo.com');
      console.log('  ✓ History matching and bookmark/history deduplication verified');

      testOnlineSearchParsing();
    });
  }

  // Test 3: Online autocomplete query parsing and combination
  function testOnlineSearchParsing() {
    var originalFetch = global.fetch;
    global.fetch = function(url) {
      assert.ok(url.indexOf('duckduckgo.com/ac') !== -1, 'Calls DuckDuckGo AC API');
      return Promise.resolve({
        ok: true,
        json: function() {
          return Promise.resolve([
            'samsung',
            ['samsung tv', 'samsung display', 'samsung remote']
          ]);
        }
      });
    };

    Suggestions.fetchSuggestions('samsung', function(err, items) {
      assert.strictEqual(err, null);
      // Local history has 'Samsung Smart TV Developers' (1 local match) + 3 online search terms = 4 items
      assert.strictEqual(items.length, 4);
      assert.strictEqual(items[0].type, 'history');
      assert.strictEqual(items[0].value, 'https://developer.samsung.com');
      assert.strictEqual(items[1].type, 'search');
      assert.strictEqual(items[1].value, 'samsung tv');
      assert.strictEqual(items[2].value, 'samsung display');
      assert.strictEqual(items[3].value, 'samsung remote');
      console.log('  ✓ Online search suggestion aggregation verified');

      testStaleResponseDiscarding(originalFetch);
    });
  }

  // Test 4: Stale response discarding
  function testStaleResponseDiscarding(originalFetch) {
    var slowResolve;
    global.fetch = function(url) {
      if (url.indexOf('q=slow') !== -1) {
        return new Promise(function(resolve) {
          slowResolve = function() {
            resolve({
              ok: true,
              json: function() { return Promise.resolve(['slow', ['stale suggestion']]); }
            });
          };
        });
      }
      return Promise.resolve({
        ok: true,
        json: function() { return Promise.resolve(['fast', ['fresh suggestion']]); }
      });
    };

    // First issue a slow query
    Suggestions.fetchSuggestions('slow', function() {
      assert.fail('Stale callback should not fire or update state');
    });

    // Immediately issue a fast query (overrides activeRequestId)
    Suggestions.fetchSuggestions('fast', function(err, items) {
      assert.strictEqual(items[0].value, 'fresh suggestion');

      // Now resolve the slow query late - it should be silently discarded
      if (slowResolve) slowResolve();

      setTimeout(function() {
        assert.strictEqual(Suggestions.currentItems[0].value, 'fresh suggestion', 'Stale response discarded');
        console.log('  ✓ Stale asynchronous responses correctly discarded');

        testNetworkFailureFallback(originalFetch);
      }, 20);
    });
  }

  // Test 5: Network failure fallback
  function testNetworkFailureFallback(originalFetch) {
    global.fetch = function() {
      return Promise.reject(new Error('Network offline'));
    };

    // 'wiki' matches Wikipedia in history
    Suggestions.fetchSuggestions('wiki', function(err, items) {
      assert.ok(err instanceof Error, 'Error handled gracefully');
      assert.strictEqual(items.length, 1, 'Preserved local matches on network failure');
      assert.strictEqual(items[0].value, 'https://wikipedia.org');
      console.log('  ✓ Network failure gracefully handled, retaining local matches');

      // Cleanup
      global.fetch = originalFetch;
      testSelectionAndHide();
    });
  }

  // Test 6: Selection and hide
  function testSelectionAndHide() {
    var selectedValue = null;
    Suggestions.onSelectCallback = function(val) {
      selectedValue = val;
    };

    var mockInput = { value: 'initial' };
    Suggestions.activeInputEl = mockInput;
    Suggestions.currentItems = [
      { type: 'search', value: 'samsung neo qled' }
    ];

    Suggestions.selectItem(0);
    assert.strictEqual(mockInput.value, 'samsung neo qled');
    assert.strictEqual(selectedValue, 'samsung neo qled');
    assert.strictEqual(Suggestions.isOpen(), false, 'Closed on selection');
    console.log('  ✓ Item selection commits value, calls callback, and closes dropdown');

    if (done) done();
  }
}

module.exports = { run };
if (require.main === module) {
  run(function() {
    console.log('All Suggestions tests passed.');
  });
}
