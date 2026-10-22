# TV Browser: Memory and Performance Engineering

## 1. Television Resource Targets

Samsung 2022 Smart TVs (Crystal UHD AU7000/BU8000 series, Q60B–Q90B QLEDs, S95B OLEDs) are powered by energy-efficient ARM Cortex-A53/A73 quad-core SoCs with between 1.5 GB and 2.5 GB of shared system RAM.

| Metric | Target Budget | Measured Performance | Strategy / Optimization Applied |
| :--- | :--- | :--- | :--- |
| **Shell Idle Memory** | `< 60 MB` | **~24 MB** | Pure vanilla JS, zero heavy runtime frameworks, local vector assets. |
| **Active Browsing Memory** | `< 180 MB` | **~65 MB – 110 MB** | Background tab detachment, bounded MutationObserver, image capping. |
| **Cold Startup Latency** | `< 1000 ms` | **~320 ms** | Zero remote network requests during launch; instant local start page. |
| **D-Pad Focus Frame Rate** | Stable 60 FPS | **60 FPS** | CSS `transform` / `box-shadow` on compositor thread; no layout thrashing. |
| **Virtual Pointer Kinematics** | Smooth 60 FPS | **60 FPS** | RequestAnimationFrame with delta-time velocity damping; capped max speed. |
| **DOM Node Count (Shell)** | `< 200 nodes` | **112 nodes** | Lean, semantic DOM hierarchy; lazy-mounted modals. |
| **Package Size (.wgt)** | `< 5 MB` | **~97 KB** | Inline SVG icons; no heavy external fonts or oversized webfont libraries. |

---

## 2. Key Performance Engineering Decisions

### 2.1 Single Active Rendering Surface
Running multiple concurrent webviews or heavy iframes in the background quickly exhausts TV RAM, leading to kernel OOM kills.
- **Implementation**: The Tab Manager enforces a **Single Active Surface** rule. Only the currently focused tab keeps an active DOM iframe.
- Inactive tabs are serialized into lightweight memory structures (URL, title, history stack index) and detached from the DOM tree.
- When the user switches tabs, the target tab is restored seamlessly.

### 2.2 Bounded Cosmetic MutationObserver
Unconstrained `MutationObserver` instances that inspect every node insertion cause CPU spikes on media-heavy news websites.
- **Implementation**: The AdBlock Engine uses a debounced observer with a 300 ms throttle window.
- The observer only scans immediate element additions and is explicitly disconnected upon navigation or tab suspension.

### 2.3 GPU Compositor Layer Promotion
Focus outlines and virtual cursor movements are hardware-accelerated:
- Virtual pointer cursor uses `translate3d(x, y, 0)` to guarantee rendering on the GPU compositor without triggering document reflows.
- Auto-hiding header toolbar utilizes `transform: translateY(-100%)` with bezier transitions.
