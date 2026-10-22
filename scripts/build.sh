#!/usr/bin/env bash
set -e

echo "============================================="
echo "TV Browser: Production Build Validation"
echo "============================================="

# 1. Run M85 syntax linter
node scripts/lint_m85.js

# 2. Run unit and platform tests
npm test

# 3. Verify critical assets
if [ ! -f "config.xml" ]; then
    echo "❌ Error: config.xml missing"
    exit 1
fi

if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html missing"
    exit 1
fi

if [ ! -f "assets/icons/icon.png" ]; then
    echo "❌ Error: assets/icons/icon.png missing"
    exit 1
fi

echo ""
echo "✓ Build verification passed. Ready for packaging."
