# TV Browser: Implementation Plan

This implementation plan outlines the sequential phases, verification gates, and deliverables for the Samsung 2022 TV Browser.

---

## Phase Checklist & Milestones

- [x] **Phase 0: Environment Audit & SDK Configuration**
  - [x] Inspect OS architecture (macOS Darwin ARM64).
  - [x] Audit Tizen tools (`tz` v10.3.9, `sdb` v4.2.36 found in `~/.tizen-extension-platform`).
  - [x] Audit target platform version: `tv-samsung-6.5` (2022 models, Chromium M85).
  - [x] Set up project directory structure.

- [x] **Phase 1: Platform Feasibility & Research**
  - [x] Inspect Overscan repository, internals documentation, and native firmware constraints (SFD/SMACK).
  - [x] Inspect TizenPortal shell architecture, TizenBrew dependencies, and adblock module.
  - [x] Analyze Ghostery adblocker memory requirements vs Tizen Web App limitations.
  - [x] Study official Samsung TV Web Engine, Download, and TV Input Device specifications.
  - [x] Publish `docs/PLATFORM_FEASIBILITY.md` and `docs/ARCHITECTURE.md`.

- [ ] **Phase 2: Core Browser Foundation**
  - [ ] Implement `config.xml` with required Tizen privileges (`tv.inputdevice`, `download`, `filesystem.read`, `filesystem.write`).
  - [ ] Implement URL handling, normalization, and search query builder (DuckDuckGo, Google, Bing, Startpage).
  - [ ] Implement Navigation State Machine (CanGoBack, CanGoForward, Loading, Error, CurrentURL).
  - [ ] Build local Start Page with quick-access tiles, search bar, and privacy status.
  - [ ] Build graceful error pages for failed connections, timeout, and X-Frame-Options embedding limitations.

- [ ] **Phase 3: Remote Control & Navigation System**
  - [ ] Implement Samsung TV Keycode mapping & `tizen.tvinputdevice.registerKey` listener.
  - [ ] Implement 2D Spatial Focus Engine with nearest-neighbor Euclidean distance algorithm.
  - [ ] Implement Virtual Pointer Mode with frame-time velocity ramping and viewport bounds.
  - [ ] Implement TV-friendly On-Screen Keyboard with QWERTY, numbers, symbols, and URL helpers.
  - [ ] Implement LIFO Back Key priority stack (Dialog -> Keyboard -> Fullscreen -> Toolbar -> History -> Start Page -> Exit Dialog).

- [ ] **Phase 4: Ad & Popup Protection Engine**
  - [ ] Layer 1: Navigation Guard (scheme validation, malicious redirect prevention).
  - [ ] Layer 2: Strict iframe sandbox policy.
  - [ ] Layer 3: High-speed cosmetic ad-block stylesheet (250+ selector rules) + debounced MutationObserver.
  - [ ] Layer 4: Anti-popup & redirect loop shield.
  - [ ] Layer 5: Site allowlist, Strict Mode, and verifiable metrics telemetry (no fabricated numbers).

- [ ] **Phase 5: User Interface & Experience (Arc / Safari Inspired)**
  - [ ] Auto-hiding modern header toolbar (Back, Forward, Reload, Home, Address Bar, Bookmark, AdBlock, Tabs, Settings).
  - [ ] Deep charcoal / warm dark aesthetic with restrained glassmorphic layer and clean typography.
  - [ ] Multi-Tab Switcher overlay (Max 3 tabs, suspension indicators).
  - [ ] Bookmark manager and Browsing History viewer.
  - [ ] Settings panel with appearance, browsing, privacy, performance, and advanced diagnostics.

- [ ] **Phase 6: Download & Storage Subsystem**
  - [ ] Native `tizen.download` integration with progress callbacks, pause, cancel, and retry.
  - [ ] Local storage persistence for bookmarks, history, settings, and download ledger.
  - [ ] Private browsing session cleaner.

- [ ] **Phase 7: Performance Optimization & Chromium M85 Compatibility**
  - [ ] Transpile / ensure JavaScript ES2020 compatibility (no unsupported modern syntax).
  - [ ] CSS GPU acceleration (`transform`, `opacity`, `will-change`).
  - [ ] Startup latency optimization (< 800ms to interactive start page).
  - [ ] Memory leak checks & background tab detachment.

- [ ] **Phase 8: Automated Test Suite & Validation**
  - [ ] Unit tests for URL parser, spatial navigation, adblock rule matching, and tab manager.
  - [ ] Integration test fixture for popup blocking, redirect loops, and cosmetic filtering.
  - [ ] Automated browser / device test harness.
  - [ ] Publish `docs/DEVICE_TESTS.md`, `docs/COMPATIBILITY.md`, `docs/PERFORMANCE.md`.

- [ ] **Phase 9: Packaging & Release Deliverables**
  - [ ] Configure build scripts (`scripts/build.sh`, `scripts/package.sh`, `scripts/setup.sh`, `scripts/test.sh`).
  - [ ] Package production `.wgt` using Tizen CLI (`tz pack`).
  - [ ] Document Mac setup, Samsung TV Developer Mode, SDB connection, and certificate signing in `docs/BUILD_REPORT.md` and `README.md`.
