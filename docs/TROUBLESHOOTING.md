# Samsung TV Browser: Troubleshooting & Operations Guide

## 1. Samsung TV Developer Mode Setup

To sideload and test applications on your Samsung 2022 Smart TV:
1. Turn on the TV and press the **Home** button on the remote.
2. Navigate to **Apps**.
3. On the remote, press the sequence: **`1` `2` `3` `4` `5`**.
4. The **Developer Mode Configuration** popup will appear.
5. Toggle Developer Mode to **ON**.
6. In **Host PC IP**, enter the local IP address of your Mac (find via `ipconfig getifaddr en0`).
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

### Error `[12, -7]` (Certificate verification failed)
- **Cause**: The package was signed with a certificate that does not register the TV's DUID (Device Unique ID).
- **Fix**:
  1. Retrieve your TV's DUID via `sdb capability | grep duid`.
  2. Create a Samsung Certificate in Tizen Studio Certificate Manager or register your DUID with Samsung Developer Portal.
  3. Re-sign the package:
     ```bash
     bash scripts/package.sh
     ```

### Website fails to load inside iframe (`X-Frame-Options` error)
- **Symptom**: Page remains blank or displays embedding refusal error.
- **Root Cause**: Many major sites (`google.com`, `youtube.com`, `github.com`) send `X-Frame-Options: SAMEORIGIN` or CSP `frame-ancestors 'self'`. This is a standard browser security policy enforced by Chromium M85.
- **Resolution**:
  - Click **Read in Reader Mode** on the error card.
  - Reader Mode directly fetches the article text and imagery via CORS-permissive network access, completely bypassing X-Frame-Options framing blocks.

### Remote Back button exits the app unexpectedly
- **Root Cause**: An event handler failed to call `e.preventDefault()`.
- **Resolution**: TV Browser's `src/app/lifecycle.js` registers a strict LIFO stack where Back closes modals, keyboard, toolbar, or navigation before prompting a 3-second exit confirmation toast ("Press Back again to exit TV Browser").
