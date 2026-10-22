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
- **🌐 Honest Browsing Architecture**:
  - **Samsung Internet Launcher**: Transparently opens full web pages directly in the TV's official browser via Tizen `launchAppControl('http://tizen.org/appcontrol/operation/view', url)`, outside iframe headers (`X-Frame-Options` / CSP) and without risking firmware LSM blocks.
  - **Direct Embed Mode (Limited)**: Sandboxed frame explicitly labeled as limited for compatible embeds and local tests.
  - **Reader Mode**: Extracts clean article text and photography for news, blogs, and documentation, with clickable links.
  - **Local Portals**: Curated favorites, quick search, and built-in POC test suite.
- **⚡ Memory & Performance Engineering**:
  - **Single Active Surface**: Inactive tabs are automatically detached from the DOM to conserve TV RAM.
  - Small idle footprint (~24 MB JS heap, runtime-only WGT package).
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

### 3. Generate WGT Package
```bash
bash scripts/package.sh
```
The output package is `dist/TVBrowser.wgt`. The packager replaces the old archive, validates the manifest, and includes only runtime files. It does not generate certificates or include private keys. Packaging also runs the WGT regression checks (`npm run test:package`).

---

## 📺 Install with Apps2Samsung (Samsung 2022 / Tizen 6.5+)

1. Enable **Developer Mode** in the TV's Apps screen (press `1 2 3 4 5`). Set **Host PC IP** to the local IP of the computer or phone running Apps2Samsung, then restart the TV.
2. Open Apps2Samsung on that device and connect to the TV on the same network.
3. Choose **Custom WGT/TPK** (called **Custom WGT File** in some versions) and select the newly generated **`dist/TVBrowser.wgt`**.
4. Allow Apps2Samsung to sign the app. Sign in to Samsung if requested so it can create a distributor certificate authorized for this TV's DUID.
5. Install, then launch **TV Browser** from Apps2Samsung or the TV's Apps screen.

This WGT is intentionally **unsigned**. It becomes installable after Apps2Samsung signs it for your TV. Do not install the unsigned archive directly with SDB. For a manual Tizen Studio installation, use a Samsung TV signing profile authorized for the TV and install the resulting signed WGT with `tizen install -n <signed-package.wgt> -t <device-name>`.

Version 1.0.3 fixes Samsung TV keyboard Done (`65376`) and Cancel (`65385`) handling, physical keyboard Enter (`13`), visible Search/Go buttons, live typing suggestions (local bookmarks/history + debounced DuckDuckGo search suggestions), D-pad focus indicators and arrow navigation isolation, smooth page scrolling via Channel Up/Down, transparent Samsung Internet launching via Tizen `launchAppControl`, and strict Back-key priority. The application ID remains `g8k2m4p9q1.TVBrowser`. The required version remains **Tizen 6.5** (Samsung 2022 Smart TVs).

If installation fails, export **Settings → Diagnostics** in Apps2Samsung and check `docs/TROUBLESHOOTING.md`. Certificate and Developer Mode problems require installer/TV setup; changing JavaScript cannot resolve them.

Installation on physical TV hardware requires Samsung certificate signing via Apps2Samsung with the TV's unique DUID. Desktop tests run against mocked Tizen APIs and node test harnesses. Because the web browser delegates real-world web browsing to Samsung Internet, websites load without iframe restrictions, while TV Browser serves as the home portal, search bar, bookmark manager, and clean reader.

References: [Apps2Samsung](https://apps2samsung.com/), [Samsung manifest configuration](https://developer.samsung.com/smarttv/develop/guides/fundamentals/configuring-tv-applications.html), [Tizen manifest reference](https://docs.tizen.org/application/web/reference/config-xml/).

---

## 📄 License
This project is open-source under the [MIT License](LICENSES.md).
