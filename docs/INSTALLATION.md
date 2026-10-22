# TV Browser Installation & Sideloading Guide

This guide details how to install TV Browser on a **Samsung 2022 Smart TV (Tizen 6.5 / Chromium M85)** using **Apps2Samsung** or **Tizen Studio CLI**.

---

## 📦 Available Package Artifacts

TV Browser is maintained as a dual-architecture project located in `dist/`:

| Package Artifact | Type | Description | In-App Browsing Capability |
| :--- | :--- | :--- | :--- |
| **`dist/TVBrowser-tizen6.tpk`** | **Native .NET / ElmSharp Host** | Embedded `Tizen.WebView` with Samsung LSM bypass stub (`libprivileged-service-client.so`). Preserves 100% of the existing web UI and settings. | **Full Chrome-like In-App Browsing** (Google, GitHub, Wikipedia, arbitrary modern websites render inside the app). |
| **`dist/TVBrowser.wgt`** | **Standard Tizen Web App** | Preserved HTML5/JavaScript application. | Restricted to embeddable domains (`example.com`, `wikipedia.org`, local test portals). Sites with `X-Frame-Options: SAMEORIGIN` or CSP display in-app diagnostic. |

> [!IMPORTANT]
> To browse arbitrary websites (including Google search, YouTube, GitHub, and news portals) directly inside your TV application without kicking out to Samsung Internet, install **`TVBrowser-tizen6.tpk`**.

---

## 📺 Sideloading via Apps2Samsung (Recommended)

Apps2Samsung allows signing and sideloading applications over your local Wi-Fi network without requiring a complex Tizen Studio command-line setup.

### Step 1: Enable Developer Mode on the Samsung TV
1. On your Samsung TV remote, press the **Home** or **Smart Hub** button.
2. Navigate to **Apps**.
3. On the Apps screen, enter the numeric sequence **`1 2 3 4 5`** on your physical remote control (or via the SmartThings app numeric keypad).
4. A **Developer Mode Configuration** popup will appear.
5. Toggle **Developer Mode** to **ON**.
6. In the **Host PC IP** field, enter the local IP address of your computer running Apps2Samsung (e.g. `192.168.1.105`).
7. Select **OK**, then press and hold the **Power** button on your remote until the TV restarts (or turn the TV off, unplug it from the wall for 10 seconds, and plug it back in).

### Step 2: Connect Apps2Samsung to the TV
1. Launch **Apps2Samsung** on your computer or mobile device.
2. Ensure both the computer/phone and the Samsung TV are connected to the same local Wi-Fi / Ethernet subnet.
3. In Apps2Samsung, enter your TV's local IP address and click **Connect**.
4. Confirm the connection prompt if one appears on the TV screen.

### Step 3: Install TVBrowser-tizen6.tpk
1. In Apps2Samsung, click **Custom WGT/TPK** (or **Install File**).
2. Browse and select:
   ```
   dist/TVBrowser-tizen6.tpk
   ```
3. Apps2Samsung will read the package manifest (`api-version: 6.0`, profile: `tv`).
4. When prompted, select **Sign with Samsung Certificate**.
   - If prompted, sign in to your free Samsung Developer account.
   - Apps2Samsung will automatically generate a distributor certificate containing your TV's unique Device Unique Identifier (DUID).
5. Click **Install**.
6. Once installation completes, **TV Browser** will appear on your TV's Apps screen.

---

## 🛠️ Alternative: Manual Installation via Tizen Studio CLI

If you have Tizen Studio installed with the Samsung TV Extension:

```bash
# 1. Connect to the TV via Smart Development Bridge (SDB)
sdb connect <TV_IP_ADDRESS>:26101

# 2. Verify TV connection and obtain DUID
sdb devices

# 3. Sign the TPK with your Samsung TV profile
tizen package -t tpk -s <YOUR_SAMSUNG_TV_PROFILE> -- dist/TVBrowser-tizen6.tpk

# 4. Install onto the TV
tizen install -n dist/TVBrowser-tizen6.tpk -t <TV_DEVICE_NAME>
```

---

## 🔍 Verification & Diagnostics

Once launched on the TV:
- Press **🔴 Red Button** to focus the address bar.
- Type `google.com` or a query like `best laptops` and press **Done** on the remote keyboard.
- The web page will render inside the TV Browser interface.
- Press **🟢 Green Button** to toggle between Spatial Navigation and the Virtual Pointer.
- Press **🔵 Blue Button** to display the Telemetry HUD showing FPS, memory, and blocked ad counters.
- To view blocked popups and ad domains, check the Telemetry HUD.
