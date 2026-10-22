/**
 * Unit Tests: TabManager
 */

const assert = require('assert');
const TabManager = require('../../src/tabs/tab_manager');

function run() {
  console.log('Testing TabManager:');

  // Test 1: Initialization
  var tab1 = TabManager.init('https://duckduckgo.com');
  assert.ok(tab1 && tab1.id, 'Creates initial tab');
  assert.strictEqual(TabManager.getAllTabs().length, 1);
  assert.strictEqual(TabManager.getActiveTab().id, tab1.id);
  console.log('  ✓ Initial tab creation verified');

  // Test 2: Opening second tab and suspension of first tab
  var tab2 = TabManager.openTab('https://wikipedia.org');
  assert.ok(tab2 && tab2.id);
  assert.strictEqual(TabManager.getAllTabs().length, 2);
  assert.strictEqual(TabManager.getActiveTab().id, tab2.id);
  assert.strictEqual(TabManager.getTab(tab1.id).isSuspended, true, 'Inactive tab suspended to save RAM');
  console.log('  ✓ Multi-tab switching and background tab suspension verified');

  // Test 3: Tab limit enforcement (max 3)
  var tab3 = TabManager.openTab('https://example.com');
  assert.ok(tab3);
  assert.strictEqual(TabManager.getAllTabs().length, 3);
  var tab4 = TabManager.openTab('https://blocked.com');
  assert.strictEqual(tab4, null, 'Reject opening 4th tab beyond max limit of 3');
  console.log('  ✓ Max tab limit boundary enforced');

  // Test 4: Tab closure and active tab migration
  TabManager.closeTab(tab3.id);
  assert.strictEqual(TabManager.getAllTabs().length, 2);
  console.log('  ✓ Tab closure verified');
}

module.exports = { run };
if (require.main === module) run();
