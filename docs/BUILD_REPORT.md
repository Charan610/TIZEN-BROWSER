# TV Browser: Build & Implementation Report

## 1. Executive Summary

- **Project Working Name**: TV Browser
- **Target Platform**: Samsung Smart TV (2022 Models)
- **Target Operating System**: Tizen 6.5 (`tv-samsung-6.5`)
- **Underlying Web Engine**: Chromium M85 (85.0.4183.93)
- **Primary Package**: `dist/TVBrowser.wgt` (Signed Tizen Web Application Package)
- **Package Size**: ~97 KB
- **Verification Status**: 4/4 Unit Test Suites Passed; Platform Feasibility POC Executed & Verified.

---

## 2. Mandatory Research Findings & Architectural Decisions

### 2.1 Overscan Research (.tpk Native Host vs .wgt Web Application)
An investigation of the Overscan repository and `docs/INTERNALS.md` revealed that Samsung retail firmwares from 2019 through 2023 enforce **SFD (Samsung Firmware Defenses)** in the kernel.
On retail TVs, non-Samsung native binaries calling `dlopen("/usr/lib/libchromium-ewk.so")` fail with `EPERM (Operation not permitted)` because the files require a proprietary UEP signature issued only by Samsung's internal release signing service.
**Architectural Decision**: Path A (Official Tizen Web Application `.wgt`) was selected as the primary production architecture. It guarantees installation and crash-free execution on all retail 2022 TVs using standard Samsung developer signing.

### 2.2 TizenPortal & TizenBrew Research
TizenPortal achieves arbitrary script injection only by relying on **TizenBrew**, an external hooking framework installed separately on the television.
Within an official standalone `.wgt` sandbox, third-party iframes cannot be accessed directly by parent scripts due to the browser's Same-Origin Policy.
**Architectural Decision**: To handle websites with `X-Frame-Options: SAMEORIGIN/DENY`, TV Browser implements a **Tri-Mode Viewport Engine**:
1. Direct Embed Mode (for compatible sites)
2. Reader Mode (fetches and extracts sanitized article text and imagery via CORS permissions, bypassing X-Frame-Options)
3. Local Web Portals & Test Suite.

### 2.3 Ghostery Adblocker Feasibility
`@ghostery/adblocker` is designed for browser extensions (`chrome.webRequest`) or headless automation. Because Tizen Web Apps do not expose network request interception hooks for child frames, bundling a 25 MB serialized filter trie in TV memory would be wasteful and non-functional.
**Architectural Decision**: Implemented a lightweight **5-Layer Tailored Protection Engine**:
- Layer 1: Navigation scheme guard (blocks dangerous schemes and malicious tracking redirects)
- Layer 2: Strict iframe sandbox (`allow-scripts allow-forms allow-same-origin`, omitting `allow-modals` and `allow-popups-to-escape-sandbox`)
- Layer 3: High-speed cosmetic hiding stylesheet (250+ verified selectors) + debounced MutationObserver
- Layer 4: Popup & redirect loop shield (neutralizes unprompted `window.open`)
- Layer 5: Per-site allowlist and strict mode settings.

---

## 3. Subsystem Implementation Summary

1. **Remote Control Subsystem**: Full Samsung keycode mapping (`Return` 10009, Color Keys, Media Keys, D-pad). Includes a 2D Spatial Focus Navigation Engine, Virtual Pointer with delta-time velocity acceleration, and an On-Screen TV Virtual Keyboard.
2. **Download Subsystem**: Integrated with native `tizen.download` API (`DownloadRequest`), tracking progress, completion, and local storage ledger.
3. **Tab & Session Subsystem**: Enforces a Single Active Surface rule (maximum 3 tabs). Inactive tabs are detached from the DOM to conserve TV RAM.
4. **User Interface**: Minimalist, Arc/Safari-inspired dark interface in 1920x1080 resolution with an auto-hiding header toolbar, bookmarks, history, and live Telemetry HUD.

---

## 4. Verification Evidence

- Unit Tests: 4 suites passed (`test_url_utils.js`, `test_spatial_nav.js`, `test_adblock.js`, `test_tab_manager.js`).
- M85 Syntax Linter: Verified full compliance with Chromium M85 / ES2020.
- WGT Packaging: Validated with Samsung Tizen CLI (`tz pack`), signed with author and distributor signatures in `dist/TVBrowser.wgt`.
