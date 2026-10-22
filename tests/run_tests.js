/**
 * Comprehensive Test Harness
 * Runs unit tests and POC platform tests
 */

const { execSync } = require('child_process');

console.log('Running TV Browser Verification Suite...\n');

try {
  console.log('1. Unit Tests:');
  execSync('node tests/unit/run_unit_tests.js', { stdio: 'inherit' });

  console.log('\n2. Platform Feasibility POC Test:');
  execSync('node tests/compatibility/poc_runner.js', { stdio: 'inherit' });

  console.log('\n3. Real Website & In-App Navigation Test Suite (Step 9):');
  execSync('node tests/test_real_websites.js', { stdio: 'inherit' });

  console.log('\n4. Package Artifacts Verification (WGT & TPK):');
  execSync('python3 -m unittest tests/packaging/test_wgt.py tests/packaging/test_tpk.py', { stdio: 'inherit' });

  console.log('\n=============================================');
  console.log('ALL VERIFICATION SUITES EXECUTED AND PASSED.');
  console.log('=============================================');
} catch (e) {
  console.error('\nTest run failed:', e.message);
  process.exit(1);
}
