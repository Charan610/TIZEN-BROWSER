# TV Browser — Premium Samsung Smart TV Web Browser

![Tizen](https://img.shields.io/badge/Platform-Tizen%206.5%20(2022)-blue)
![Engine](https://img.shields.io/badge/Engine-Chromium%20M85-success)
![Package](https://img.shields.io/badge/Package-.WGT%20(Signed)-orange)
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
  - **Focus Mode**: Deterministic 2D Spatial Navigation using Euclidean geometric projection.
  - **Pointer Mode (🟢 Green Button)**: Hardware-accelerated virtual mouse cursor with delta-time velocity acceleration.
  - **On-Screen TV Keyboard**: Custom D-pad driven virtual keyboard with QWERTY, numeric row, symbols, and URL shortcuts.
  - **LIFO Back Key Priority**: Prevents accidental app termination (Dialogs → Keyboard → Fullscreen → Toolbar → History → Start Page → Exit Confirmation).
- **🛡️ 5-Layer Ad & Popup Defense**:
  - **Layer 1**: Navigation guard rejecting unsafe schemes (`javascript:`, `data:`) and tracking redirects.
  - **Layer 2**: Strict iframe sandboxing blocking unauthorized popups and window hijacking.
  - **Layer 3**: High-speed cosmetic hiding stylesheet (250+ selector rules) + debounced MutationObserver.
  - **Layer 4**: Popup & redirect loop shield.
  - **Layer 5**: Per-site allowlist and strict mode controls.
  - *No fabricated statistics*: All metrics in the Telemetry HUD represent verified blocked events.
- **🌐 Tri-Mode Viewport Engine**:
  - **Direct Embed Mode**: Sandboxed frame for compatible web applications and tools.
  - **Reader Mode**: Extracts clean article text and photography for news, blogs, and documentation, bypassing `X-Frame-Options` embedding blocks.
  - **Local Portals**: Curated favorites and built-in POC test suite.
- **⚡ Memory & Performance Engineering**:
  - **Single Active Surface**: Inactive tabs are automatically detached from the DOM to conserve TV RAM.
  - Small idle footprint (~24 MB JS heap, ~97 KB WGT package size).
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
    └── TVBrowser.wgt               # Signed production WGT package (~97 KB)
```

---

## 🚀 Quickstart & Development

### 1. Prerequisites
- macOS or Linux with **Node.js 18+** installed.
- Samsung Tizen CLI (`tz`) and Smart Development Bridge (`sdb`).

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
The output package will be generated at `dist/TVBrowser.wgt`.

---

## 📺 Installation on Samsung 2022 Smart TV

### Step 1: Enable Developer Mode on TV
1. On the TV, open **Apps**.
2. Press **`1` `2` `3` `4` `5`** on your remote.
3. In the Developer Mode popup, toggle to **ON**.
4. Enter your Mac's IP address under **Host PC IP**.
5. Press **OK** and restart the TV by holding the remote **Power** button for 5 seconds.

### Step 2: Connect SDB over Network
```bash
# Connect to your TV's IP address (port 26101 is standard for Tizen)
sdb connect <TV_IP>:26101

# Verify the device is connected
sdb devices
```

### Step 3: Install Package
```bash
sdb install dist/TVBrowser.wgt
```
The **TV Browser** app will appear in your TV's **Apps** menu, ready to launch with your Samsung remote!

---

## 📄 License
This project is open-source under the [MIT License](LICENSES.md).
