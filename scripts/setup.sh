#!/usr/bin/env bash
set -e

echo "============================================="
echo "TV Browser: Development Environment Setup"
echo "============================================="

# Detect Tizen CLI path
TIZEN_CLI_PATH="/Users/charan/.tizen-extension-platform/server/sdktools/data/tools/tizen-core"
SDB_PATH="/Users/charan/.tizen-extension-platform/server/sdktools/data/tools"

if [ -f "$TIZEN_CLI_PATH/tz" ]; then
    echo "✓ Found Tizen CLI (tz) at: $TIZEN_CLI_PATH/tz"
    export PATH="$TIZEN_CLI_PATH:$SDB_PATH:$PATH"
else
    echo "⚠ Tizen CLI not found at default extension path. Checking standard PATH..."
fi

echo "✓ Node.js version: $(node -v)"
echo "✓ NPM version: $(npm -v)"
if command -v tz &> /dev/null; then
    echo "✓ Tizen CLI: $(tz --version)"
fi
if command -v sdb &> /dev/null; then
    echo "✓ Smart Development Bridge (SDB): $(sdb version)"
fi

echo ""
echo "Setup complete. Run 'npm test' or 'bash scripts/build.sh' to verify."
