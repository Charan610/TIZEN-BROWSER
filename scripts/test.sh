#!/usr/bin/env bash
set -e

echo "Running TV Browser test suite..."
node scripts/lint_m85.js
npm test
echo "All tests passed."
