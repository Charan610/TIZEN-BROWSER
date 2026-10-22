# Website Compatibility & Engine Report

## 1. Target Engine Characteristics
- **Platform**: Samsung Smart TV (2022 Models)
- **Operating System**: Tizen 6.5 (`tv-samsung-6.5`)
- **Web Engine**: Chromium M85 (85.0.4183.x)
- **JavaScript Standard**: ECMAScript 2020 (ES11)
- **CSS Features**: CSS Grid, Flexbox, Custom Properties (variables), Media Queries, WebGL 2.0
- **Excluded / Unsupported Modern Web APIs**:
  - `String.prototype.replaceAll` (Chrome 85 partially supported; replaced with regex global replace `/g`)
  - `Array.prototype.at` (Introduced in Chrome 92)
  - `Object.hasOwn` (Introduced in Chrome 93)
  - Logical assignment operators `&&=`, `||=`, `??=` (Restricted to standard ES2020 syntax)
  - WebExtension APIs (`chrome.webRequest`, `chrome.declarativeNetRequest` — not exposed in Tizen Web Apps)

---

## 2. Real-World Domain Compatibility Matrix

| Website / Service | Category | Direct Embed Support | X-Frame-Options / CSP Header | Reader Mode Support | Navigation / Interaction Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wikipedia** (`wikipedia.org`) | Reference | **PASS** | `None` (Embed allowed) | **PASS** (Optimal) | Full article reading, clean navigation, images display cleanly. |
| **Hacker News** (`news.ycombinator.com`) | Forum / Tech | **PASS** | `None` (Embed allowed) | **PASS** | Lightweight text loads instantly; links and comments work. |
| **Example Domain** (`example.com`) | Test Page | **PASS** | `None` | **PASS** | Clean baseline connectivity test. |
| **DuckDuckGo** (`duckduckgo.com`) | Search Engine | **PARTIAL** | `X-Frame-Options: SAMEORIGIN` | **PASS** | Query submission handled via omnibox search generator; embeds DuckDuckGo lite. |
| **Google Search** (`google.com`) | Search Engine | **BLOCKED** | `X-Frame-Options: SAMEORIGIN` | **PASS** | Direct framing rejected by Google; queries routed via omnibox to external/reader view. |
| **YouTube** (`youtube.com`) | Video / Media | **BLOCKED** | `X-Frame-Options: SAMEORIGIN` | N/A | Full desktop/mobile site blocks framing; YouTube TV web portal or direct video links used. |
| **GitHub** (`github.com`) | Developer | **BLOCKED** | `X-Frame-Options: deny` | **PASS** | Code repositories, READMEs, and Markdown rendered via Reader Mode. |
| **BBC News** (`bbc.com`) | News / Media | **BLOCKED** | `frame-ancestors 'self'` | **PASS** (Excellent) | Article text, headlines, and photography extracted seamlessly in TV Reader Mode. |
| **Reuters** (`reuters.com`) | News / Financial | **BLOCKED** | `frame-ancestors 'none'` | **PASS** | Reader Mode strips paywalls and sponsored widgets. |
| **POC Test Fixture** (Local) | Verification Suite | **PASS** | `Same-Origin` | **PASS** | Full DOM access, interactive buttons, inputs, HTML5 video, cosmetic filter testing. |

---

## 3. Viewport Mode Handling Strategy

1. **Direct Embed Mode**:
   - Used for compatible sites and local portals.
   - Enforces strict sandboxing: `sandbox="allow-scripts allow-forms allow-same-origin"` to prevent hostile page scripts from hijacking top-level navigation.
2. **Reader Mode (Clean Web Extraction)**:
   - For all news, documentation, blogs, and reference sites that send `X-Frame-Options: DENY` or `SAMEORIGIN`.
   - Fetches page markup via Tizen's cross-origin access permission (`<access origin="*" subdomains="true"/>`).
   - Extracts semantic elements (`h1`, `p`, `blockquote`, `img`), removes all tracking scripts and ads, and formats with 1080p high-contrast TV typography.
3. **Actionable Error Fallback**:
   - When a framed URL refuses embedding, TV Browser detects the stoppage and displays an informative card with options to read in Reader Mode, retry, or return to Start Page.
