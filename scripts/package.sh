#!/usr/bin/env bash
set -e

echo "============================================="
echo "TV Browser: Tizen WGT Package Generator"
echo "============================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
mkdir -p "$DIST_DIR"

TZ_BIN="/Users/charan/.tizen-extension-platform/server/sdktools/data/tools/tizen-core/tz"

if [ -f "$TZ_BIN" ]; then
    echo "✓ Using Samsung Tizen CLI (tz) for signed WGT packaging"
    
    TEMP_PROFILE_DIR="$PROJECT_DIR/.temp_profile_build"
    mkdir -p "$TEMP_PROFILE_DIR"

    # Generate isolated packaging certificate
    "$TZ_BIN" cert -n "TVBrowserBuilder" -p "TvBuilderPass123!" -f "$TEMP_PROFILE_DIR/builder.p12" > /dev/null 2>&1
    
    # Register signing profile
    "$TZ_BIN" security-profiles add -n "tv-pkg-profile" \
        -a "$TEMP_PROFILE_DIR/builder.p12" \
        -p "TvBuilderPass123!" \
        -x "$TEMP_PROFILE_DIR/profiles.xml" \
        -A > /dev/null 2>&1

    # Pack WGT
    echo "Packaging WGT..."
    "$TZ_BIN" pack "$PROJECT_DIR" -t wgt -s "tv-pkg-profile" -p "$TEMP_PROFILE_DIR/profiles.xml" > /dev/null 2>&1
    
    if [ -f "$PROJECT_DIR/Debug/TIZEN-BROWSER.wgt" ]; then
        mv "$PROJECT_DIR/Debug/TIZEN-BROWSER.wgt" "$DIST_DIR/TVBrowser.wgt"
        rm -rf "$PROJECT_DIR/Debug"
    fi

    # Clean up temporary build certificate
    rm -rf "$TEMP_PROFILE_DIR"
else
    echo "⚠ Tizen CLI not found. Generating unsigned WGT archive using zip..."
    cd "$PROJECT_DIR"
    zip -r "$DIST_DIR/TVBrowser.wgt" config.xml index.html assets src -x "*.DS_Store" > /dev/null
fi

if [ -f "$DIST_DIR/TVBrowser.wgt" ]; then
    echo ""
    echo "✓ WGT Package Successfully Generated:"
    ls -lh "$DIST_DIR/TVBrowser.wgt"
    echo ""
    echo "To install on your Samsung TV in Developer Mode:"
    echo "  sdb connect <TV_IP>:26101"
    echo "  sdb install dist/TVBrowser.wgt"
else
    echo "❌ Packaging failed: $DIST_DIR/TVBrowser.wgt was not created"
    exit 1
fi
