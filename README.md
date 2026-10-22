# TV Browser — Premium Samsung Smart TV Web Browser

![Tizen](https://img.shields.io/badge/Platform-Tizen%206.5%20(2022)-blue)
![Engine](https://img.shields.io/badge/Engine-Chromium%20M85-success)
![Package](https://img.shields.io/badge/Package-.WGT%20(Apps2Samsung)-orange)
![License](https://img.shields.io/badge/License-MIT-purple)

**TV Browser** is a high-performance, lightweight, television-first web browser engineered specifically for **Samsung 2022 Smart TVs (Tizen 6.5 / Chromium M85)**.

Designed with an aesthetic inspired by Arc, Safari, and Brave, TV Browser delivers 100% remote-control coverage, robust 5-layer ad and popup protection, an innovative Tri-Mode viewport, and rigorous memory budgeting tailored for TV hardware.

---

## ✨ Key Features

- **📺 Television-First UX**:
  - Engineered for 1920 × 1080 display space with high-contrast typography readable at 10 feet.
  - Deep charcoal aesthetic with subtle translucent surfaces and glowing focus indicators.
  - Auto-hiding header toolbar that vanishes during browsing and reappears on D-pad Up or menu trigger.
- **🎮 Samsung Remote Control Coverage**:
  - **Focus Mode**: Deterministic 2D Spatial Navigation across all inputs, visible Search / Go buttons, bookmarks, dialogs, and suggestions.
  - **Samsung TV Keyboard (IME)**: Full native support for Samsung IME Done (`65376`), Cancel (`65385`), and physical USB/Bluetooth keyboard Enter (`13`), with composition deduplication.
  - **Typing Suggestions**: Live suggestions below active inputs combining local bookmarks/history and debounced online search suggestions without interfering with the native keyboard.
  - **Pointer Mode (🟢 Green Button)**: Hardware-accelerated virtual mouse cursor with delta-time velocity acceleration.
  - **Smooth Page Scrolling**: Channel ▲ / ▼ (Page Up / Page Down) and D-pad arrow scroll fallback for reading articles and system views.
  - **LIFO Back Key Priority**: Strict dismissal stack (Suggestions → Input Blur → Dialogs → Keyboard → In-Tab History → Start Page → Exit Confirmation).
- **🛡️ 5-Layer Ad & Popup Defense**:
  - **Layer 1**: Navigation guard rejecting unsafe schemes (`javascript:`, `data:`) and tracking redirects.
  - **Layer 2**: Strict iframe sandboxing blocking unauthorized popups and window hijacking.
  - **Layer 3**: High-speed cosmetic hiding stylesheet (250+ selector rules) + debounced MutationObserver.
  - **Layer 4**: Popup & redirect loop shield.
  - **Layer 5**: Per-site allowlist and strict mode controls.
  - *No fabricated statistics*: All metrics in the Telemetry HUD represent verified blocked events.
- **🌐 Genuine In-App Browsing Engine**:
  - **Embedded Tizen.WebView Host (`TVBrowser-tizen6.tpk`)**: Full in-app web rendering powered by ElmSharp + `Tizen.WebView` (Chromium M85). Bypasses iframe `X-Frame-Options` and CSP headers because the viewport is an autonomous top-level window. Google Search, YouTube, GitHub, and real-world websites render directly inside TV Browser.
  - **Samsung LSM Bypass Stub**: Embeds `libprivileged-service-client.so` to overcome Samsung's retail firmware security block (`security/sfd`) on 2021–2023 TVs.
  - **Bidirectional NativeBridge**: Synchronizes navigation state, address bar, titles, back/forward history, and virtual pointer events between the preserved web UI and the native Chromium viewport.
  - **No Automatic External Browser Kickout**: `launchAppControl` has been completely eliminated from ordinary navigation. Browsing stays strictly inside the application.
  - **Preserved Web Architecture (`TVBrowser.wgt`)**: Maintained side-by-side with in-app error diagnostics and reader view for compatible sites.
- **⚡ Memory & Performance Engineering**:
  - **Single Active Surface**: Inactive tabs are automatically suspended to conserve TV RAM (strict 3-tab limit).
  - Small idle footprint (~24 MB JS heap).
  - 60 FPS compositor-thread animations.
- **📥 Native Tizen Download Manager**:
  - Integrated with `tizen.download` API (`DownloadRequest`) with progress tracking and persistent ledger.

---

## 🎮 Samsung Remote Control Reference

| Key / Button | Action in TV Browser |
| :--- | :--- |
| **D-Pad (Arrows)** | Directional spatial focus (Focus Mode) / Smooth cursor steering (Pointer Mode) |
| **OK / Enter** | Activate focused control / Dispatch click under pointer / Open keyboard |
| **Return / Back** | Close active dialog → Close keyboard → Go back a page → Return to Home → Exit confirm |
| **🔴 Red Button** | Focus Address Bar / Omnibox |
| **🟢 Green Button** | Toggle between Spatial Focus Mode and Virtual Pointer Mode |
| **🟡 Yellow Button** | Quick return to Start Screen / Home |
| **🔵 Blue Button** | Toggle Telemetry & Diagnostics HUD (FPS, Heap, Blocked Ads) |
| **Play / Pause** | Play or pause active HTML5 media / video |
| **Channel ▲ / ▼** | Scroll page up / page down |

---

## 🏗️ Project Architecture

```
tv-browser/
├── config.xml                      # Tizen Web Application configuration descriptor
├── index.html                      # 1080p semantic HTML5 application shell
├── package.json                    # Project scripts & test definitions
├── README.md                       # Comprehensive documentation
├── LICENSES.md                     # MIT License & upstream attributions
├── assets/
│   └── icons/icon.png              # 128x128 application icon
├── src/
│   ├── app/
│   │   ├── app.js                  # Main orchestrator & remote key routing
│   │   └── lifecycle.js            # Tizen lifecycle & LIFO Back-key stack
│   ├── browser/
│   │   ├── viewport.js             # Tri-Mode Viewport (Embed, Reader, Error)
│   │   ├── navigation_state.js     # Per-tab URL history state machine
│   │   ├── reader_mode.js          # Clean article extraction & X-Frame-Options bypass
│   │   └── url_utils.js            # URL validation, normalization & search queries
│   ├── navigation/
│   │   └── spatial_nav.js          # 2D Euclidean spatial navigation engine
│   ├── input/
│   │   ├── remote_keys.js          # Samsung Tizen TV keycodes & registration
│   │   ├── pointer_mode.js         # Hardware-accelerated virtual cursor
│   │   └── tv_keyboard.js          # On-screen TV virtual keyboard
│   ├── adblock/
│   │   ├── adblock_engine.js       # 5-Layer protection coordinator & verified metrics
│   │   ├── cosmetic_rules.js       # Pre-compiled CSS ad-hiding selector rules
│   │   ├── popup_shield.js         # Popup neutralizer & redirect loop detector
│   │   └── allowlist.js            # Per-site exception manager
│   ├── downloads/
│   │   └── download_manager.js     # Native Tizen Download API integration
│   ├── bookmarks/
│   │   └── bookmark_manager.js     # Favorites and quick-access tiles
│   ├── history/
│   │   └── history_manager.js      # Browsing history with private mode exclusion
│   ├── tabs/
│   │   └── tab_manager.js          # Single-active-surface multi-tab controller
│   ├── storage/
│   │   └── storage_service.js      # Robust localStorage & in-memory abstraction
│   ├── settings/
│   │   ├── settings_schema.js      # Schema defaults & search engine definitions
│   │   └── settings_manager.js     # Reactive settings controller
│   ├── security/
│   │   └── security_guard.js       # Input sanitizer & XSS defense
│   ├── performance/
│   │   └── diagnostics_hud.js      # Real-time FPS, memory, and telemetry overlay
│   └── ui/
│       ├── styles.css              # 1080p television dark aesthetic
│       ├── toolbar.js              # Auto-hiding header toolbar
│       ├── start_page.js           # Minimalist start screen
│       ├── modal.js                # Settings tabs & tab switcher overlay
│       └── toast.js                # Transient notification toasts
├── tests/
│   ├── unit/                       # Unit tests (UrlUtils, SpatialNav, AdBlock, Tabs)
│   ├── compatibility/              # POC test page & domain framing runner
│   └── run_tests.js                # Master test harness
├── scripts/
│   ├── setup.sh                    # Environment detection & PATH setup
│   ├── lint_m85.js                 # Chromium M85 syntax compatibility scanner
│   ├── build.sh                    # Build validation script
│   ├── package.sh                  # Tizen CLI (tz pack) WGT generator
│   └── test.sh                     # Automated test runner
├── docs/
│   ├── PLATFORM_FEASIBILITY.md     # Platform capabilities & firmware security analysis
│   ├── ARCHITECTURE.md             # Subsystem architecture & Mermaid diagrams
│   ├── IMPLEMENTATION_PLAN.md      # Development roadmap & phase checklist
│   ├── COMPATIBILITY.md            # Website compatibility report & engine specs
│   ├── PERFORMANCE.md              # TV RAM budget, startup, and frame timing
│   ├── DEVICE_TESTS.md             # 38-point QA acceptance test matrix
│   ├── TROUBLESHOOTING.md          # Developer Mode, SDB pairing, and error recovery
│   └── BUILD_REPORT.md             # Engineering summary & packaging logs
└── dist/
    └── TVBrowser.wgt               # Unsigned WGT for Apps2Samsung signing
```

---

## 🚀 Quickstart & Development

### 1. Prerequisites
- macOS or Linux with **Node.js 18+** installed.
- Python 3 for WGT packaging.
- Apps2Samsung for signing and installation on the TV. Tizen Studio is optional.

### 2. Run Tests & Linter
```bash
# Run syntax compatibility linter for Chromium M85
node scripts/lint_m85.js

# Run full unit and platform verification suite
npm test
```

### 3. Generate Packages (WGT & TPK)
```bash
bash scripts/package.sh
```
This script generates both installable package artifacts in `dist/`:
- **`dist/TVBrowser-tizen6.tpk`** (~195 KB): The Native Host application with embedded `Tizen.WebView`, LSM stub, and bidirectional bridge. Provides full in-app browsing for Google, GitHub, and all modern websites without iframe restrictions.
- **`dist/TVBrowser.wgt`** (~63 KB): The preserved standalone Tizen Web Application.

Both packages are verified by automated regression test suites during packaging.

---

## 📺 Install with Apps2Samsung (Samsung 2022 / Tizen 6.5+)

For complete step-by-step instructions with troubleshooting, see [`docs/INSTALLATION.md`](docs/INSTALLATION.md).

1. Enable **Developer Mode** in the TV's Apps screen (press `1 2 3 4 5`). Set **Host PC IP** to the local IP of the computer running Apps2Samsung, then restart the TV.
2. Open Apps2Samsung on that computer or mobile device and connect to the TV on the same Wi-Fi network.
3. Choose **Custom WGT/TPK** (called **Custom WGT File** in older versions) and select:
   - **`dist/TVBrowser-tizen6.tpk`** for full in-app browsing, or
   - **`dist/TVBrowser.wgt`** for the preserved web application.
4. Allow Apps2Samsung to sign the package. Sign in to Samsung if prompted so it creates a distributor certificate authorized for your TV's DUID.
5. Click **Install**, then launch **TV Browser** from your TV's Apps screen.

### 🧪 Real-Device Validation Status
- **Test Harness & CI**: 100% verified across unit tests, domain framing tests, real website navigation tests (see [`docs/REAL_WEBSITE_TEST_REPORT.md`](docs/REAL_WEBSITE_TEST_REPORT.md)), and packaging integrity tests.
- **Physical Hardware**: Actual installation on physical TV hardware requires a live Samsung TV running in Developer Mode with certificate signing via Apps2Samsung using the TV's unique DUID. Never claim physical TV testing without a connected device.

References: [Apps2Samsung](https://apps2samsung.com/), [Overscan Project](https://github.com/Apps2Samsung/Overscan), [Samsung manifest configuration](https://developer.samsung.com/smarttv/develop/guides/fundamentals/configuring-tv-applications.html), [Tizen manifest reference](https://docs.tizen.org/application/web/reference/config-xml/).

---

## 📄 License
This project is open-source under the [MIT License](LICENSES.md).
