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

  console.log('\nALL TESTS EXECUTED AND PASSED.');
} catch (e) {
  console.error('Test run failed:', e.message);
  process.exit(1);
}
