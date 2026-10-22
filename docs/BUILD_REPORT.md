# TV Browser 1.0.3 — Build & Verification Report

Target: Samsung 2022 TV (Tizen 6.5 / Chromium M85), installed through Apps2Samsung.

## Confirmed Defects & Root Causes

1. **Samsung Keyboard Done Inaction**:
   - The Samsung TV virtual keyboard sends keycode `65376` on "Done", not Enter (`13`). Cancel sends `65385`.
   - The original app only listened for keycode `13`, causing Done on the TV keyboard to do nothing.
   - Home and toolbar inputs had inconsistent listeners and lacked visible Search / Go buttons.

2. **Global Remote Handler Interception**:
   - Window-level D-pad handlers intercepted arrow keys while the native Samsung keyboard was editing, breaking character navigation.

3. **URL vs. Search Query Normalization**:
   - Bare addresses with query strings (e.g. `example.com?q=tv#results`) were incorrectly categorized as search queries, while malformed schemes (e.g. `https://`) failed to be rejected.

4. **Iframe Web Incompatibilities**:
   - Major websites (`google.com`, `youtube.com`, `github.com`) explicitly send `X-Frame-Options: SAMEORIGIN/DENY` or `Content-Security-Policy: frame-ancestors`, blocking direct iframe embedding.
   - Standalone `.wgt` containers cannot override third-party response headers, and retail TV firmware blocks author-signed native Chromium-EFL hosting.

5. **Lack of Typing Suggestions**:
   - No autocomplete or search suggestions existed during text input.

## Implemented Fixes in Version 1.0.3

### 1. Unified Keyboard & Search Input (`src/input/text_input.js`)
- Handled Samsung TV virtual keyboard Done (`65376`), Cancel (`65385`), and physical USB/Bluetooth keyboard Enter (`13`).
- Added IME composition tracking (`compositionstart` / `compositionend` / `isComposing`) to guarantee exactly one submission upon commit.
- Empty input Enter allows remote OK to activate/open the native IME without premature submission or blur.
- Cancel closes editing and blurs without submitting or triggering app exit.
- Added visible primary "Search / Go" buttons to both Start Page (`#start-search-go`) and Toolbar (`#toolbar-search-go`).
- Isolated D-pad arrow keys so the native Samsung keyboard retains full directional navigation.
- Fixed `src/browser/url_utils.js` to accurately differentiate URLs with queries/fragments from search queries.

### 2. Typing Suggestions Engine (`src/ui/suggestions.js`)
- Aggregates local bookmarks (`BookmarkManager.getAll()`) and browsing history (`HistoryManager.getAll()`).
- Deduplicates matching entries by URL.
- Debounces (200ms) online search suggestions via DuckDuckGo autocomplete API (`https://duckduckgo.com/ac/?q=...&type=list`).
- Discards stale asynchronous responses via incrementing `activeRequestId`.
- Gracefully handles network failures, retaining local suggestions.
- Supports remote D-pad Down from input into suggestions, Up/Down selection, OK/Enter navigation, and Back dismissal.

### 3. Remote Control & Navigation Engine
- Deterministic 2D Spatial Navigation across all inputs, Go buttons, bookmarks, dialogs, and suggestions.
- High-contrast glowing focus indicators (`:focus` and `.focused`).
- Channel ▲ / ▼ (Page Up / Page Down) and directional D-pad scroll fallback for Reader View and system error surfaces.
- Clickable links in Reader Mode navigating via `loadUrl`.
- Strict LIFO Back-key priority in `src/app/lifecycle.js`:
  1. Custom back handlers
  2. Typing suggestions dropdown dismissal
  3. Modal dialog close
  4. On-screen TV keyboard close
  5. Active input blur (exit editing)
  6. In-tab history back
  7. Return to Start Page
  8. Exit confirmation toast -> Clean Tizen application exit (`tizen.application.getCurrentApplication().exit()`).

### 4. Honest Browsing Architecture (`src/browser/system_browser.js` & `src/browser/viewport.js`)
- Transparently delegates full external web browsing to Samsung Internet via Tizen `launchAppControl('http://tizen.org/appcontrol/operation/view', url)`.
- Discloses the handoff honestly in the UI rather than pretending an iframe can bypass `X-Frame-Options`.
- Displays loading status, informative launch error handling, retry button, Home button, and an explicitly labeled "Embedded view (limited)" fallback.
- Retains Reader Mode for clean text/article extraction.

### 5. Packaging & Clean Distribution (`scripts/package_wgt.py`)
- Version bumped to `1.0.3` across `config.xml` and `package.json`.
- Restored `http://tizen.org/privilege/application.launch` and declared `use.keypad.without.useraction`.
- Packages atomic, runtime-only unsigned `dist/TVBrowser.wgt` (57 KB) containing all runtime assets and zero private keys, temporary profiles, or obsolete signatures.

## Verification Suite Results

1. **Unit Tests (`npm run test:unit`)**:
   - `test_url_utils`: Unsafe scheme rejection, URL detection, query construction, query/fragment normalization (4/4 passed).
   - `test_spatial_nav`: Directional quadrant filtering, overlap weighting, projection geometry (2/2 passed).
   - `test_adblock`: Cosmetic rules compilation, per-site allowlist, redirect defense (4/4 passed).
   - `test_tab_manager`: Initial tab creation, tab switching/suspension, boundary enforcement, closure (4/4 passed).
   - `test_lifecycle`: 7-level Back-key priority stack (7/7 passed).
   - `test_text_input`: Editing detection, Done (65376), Enter (13), empty input IME activation, Cancel (65385), composition safety, Go button click (7/7 passed).
   - `test_suggestions`: Local bookmark/history matching, deduplication, online query aggregation, stale response cancellation, network fallback, item selection (6/6 passed).
   - `test_system_browser`: Invalid scheme rejection, non-Tizen fallback, mock launchAppControl success, failure diagnostic surfacing (4/4 passed).
   - **Result**: 8/8 suites passed.

2. **Platform POC (`npm run test:poc`)**:
   - Verified 5/6 top domains block iframes via `X-Frame-Options` / CSP. Confirmed need for system browser delegation.

3. **M85 Syntax Compatibility (`npm run lint`)**:
   - 100% compliance across all source files for Chromium M85 / ES2020.

4. **WGT Packaging Integrity (`npm run test:package`)**:
   - 7/7 tests passed: manifest package ID format, launch page & resources existence, navigation policy text, clean runtime file filtering, no private keys/signatures, atomic rebuilds, invalid manifest rejection.

## Apps2Samsung Installation Instructions

1. Put the Samsung TV in **Developer Mode** (Apps screen -> press `1 2 3 4 5`, toggle ON, set Host PC IP to the machine/phone IP, reboot TV).
2. Open Apps2Samsung on that device and connect to the TV.
3. Select **Custom WGT/TPK** and choose `dist/TVBrowser.wgt`.
4. Allow Apps2Samsung to sign the package with a Samsung author and distributor certificate matching the TV's DUID.
5. Install and launch **TV Browser** on the Samsung Smart TV.
