# Samsung TV Browser: Troubleshooting & Operations Guide

## 1. Samsung TV Developer Mode Setup

To sideload and test applications on your Samsung 2022 Smart TV:
1. Turn on the TV and press the **Home** button on the remote.
2. Navigate to **Apps**.
3. On the remote, press the sequence: **`1` `2` `3` `4` `5`**.
4. The **Developer Mode Configuration** popup will appear.
5. Toggle Developer Mode to **ON**.
6. In **Host PC IP**, enter the local IP address of the computer or phone running Apps2Samsung.
7. Select **OK**.
8. Power-cycle the TV by holding down the **Power** button on the remote for 5 seconds until the Samsung logo reappears.

---

## 2. Connecting with SDB over Network

1. Obtain your TV's IP address: **Settings -> General -> Network -> Network Status -> IP Settings**.
2. On your Mac terminal:
   ```bash
   sdb connect <TV_IP>:26101
   ```
3. Verify connection:
   ```bash
   sdb devices
   ```
   Output should list:
   ```
   List of devices attached
   <TV_IP>:26101   device   <TV_MODEL>
   ```

---

## 3. Common Error Codes & Solutions

### Error `[118, -4]` (api-version refusal)
- **Cause**: The package manifest declares an `api-version` higher than the TV firmware supports.
- **Fix**: In `config.xml`, `required_version` must be set to `6.5` or lower for 2022 TVs (`tv-samsung-6.5`).

### Apps2Samsung cannot identify or install the package
- Rebuild with `npm run package`, then select `dist/TVBrowser.wgt` using **Custom WGT/TPK**. Do not select an old copy from Downloads.
- The manifest must declare `package="g8k2m4p9q1"`, application ID `g8k2m4p9q1.TVBrowser`, and `<content src="index.html"/>`. The packaging tests check these in the actual WGT.
- The distribution WGT is unsigned. Let Apps2Samsung sign it before installing.

### Certificate verification fails
- Use Apps2Samsung's Samsung sign-in/certificate flow for the connected TV. A Samsung distributor certificate must authorize that TV's DUID; a generic self-signed development certificate is insufficient.
- Verify the TV date/time and certificate validity dates.
- `npm run package` creates the unsigned input for Apps2Samsung; it does **not** create a Samsung TV certificate.
- For a signature mismatch while updating an existing installation, use its original signing identity. If you choose to uninstall the old app and install again, its saved browser settings, bookmarks, and history may be lost.
- Export **Apps2Samsung → Settings → Diagnostics** for the exact installer error if it still fails.

### Website fails to load inside iframe (`X-Frame-Options` error)
- **Symptom**: Page remains blank or displays embedding refusal error.
- **Root Cause**: Many major sites (`google.com`, `youtube.com`, `github.com`) send `X-Frame-Options: SAMEORIGIN` or CSP `frame-ancestors 'self'`. This is a standard browser security policy enforced by Chromium M85.
- **Resolution**:
  - Click **Read in Reader Mode** on the error card.
  - Reader Mode attempts to fetch article content outside the iframe. It can still fail if the website blocks cross-origin requests, authentication is required, or the page relies on JavaScript to render content.

### Remote Back button exits the app unexpectedly
- **Root Cause**: An event handler failed to call `e.preventDefault()`.
- **Resolution**: TV Browser's `src/app/lifecycle.js` registers a strict LIFO stack where Back closes suggestions, modals, keyboard, input editing, or tab history before prompting a 3-second exit confirmation toast ("Press Back again to exit TV Browser").

### Samsung Keyboard Done / Cancel Behavior
- **Symptom**: Pressing Done on the native Samsung on-screen keyboard submitted nothing in earlier builds.
- **Root Cause**: The Samsung TV IME dispatches keycode `65376` for Done and `65385` for Cancel, whereas standard desktop browsers dispatch Enter (`13`).
- **Resolution**: In v1.0.3, `src/input/text_input.js` intercepts keycode `65376` to commit and submit text once, while `65385` cancels editing and blurs without submitting. Visible "Search / Go" buttons are also provided on both inputs.

### Website Navigation & Samsung Internet Launch
- **Behavior**: When navigating to a web address or search query, TV Browser opens the target in Samsung Internet via Tizen ApplicationControl (`http://tizen.org/appcontrol/operation/view`).
- **Why**: Modern websites (`google.com`, `youtube.com`, etc.) block iframe embedding via `X-Frame-Options` and CSP headers. Standalone `.wgt` applications cannot override these security headers. Launching Samsung Internet provides full browsing capabilities with native rendering, tabs, and logins. TV Browser provides an "Embedded view (limited)" option for compatible pages.
