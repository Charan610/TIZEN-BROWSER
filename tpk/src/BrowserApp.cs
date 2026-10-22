using System;
using System.IO;
using ElmSharp;
using Tizen.Applications;
using Tizen.WebView;

namespace TVBrowser
{
    internal sealed class BrowserApp : CoreUIApplication
    {
        public const string LogTag = "TVBrowser";
        public const string BridgeName = "sbnative";

        private Window _window;
        private WebView _web;
        private TabManager _tabManager;
        private AdBlock _adBlock;

        // Floating UI Elements
        private Rectangle _barBg;
        private Rectangle _barEdge;
        private Label _urlLabel;
        private Label _statusLabel;
        private Rectangle _progress;
        private bool _chromeVisible = true;
        private bool _loading = false;
        private int _marquee = 0;
        private DateTime _lastActivity = DateTime.UtcNow;
        private IntPtr _timer;

        // Kinematic cursor coordinates
        private float _cursorFx = 0.5f;
        private float _cursorFy = 0.5f;
        private const float CursorStep = 0.025f;

        private string _startPageUrl;
        private bool _isAtStartPage = true;

        protected override void OnCreate()
        {
            base.OnCreate();

            // 1. Initialize persistent stores & subsystem managers
            Store.Init(DirectoryInfo.Data);
            _adBlock = new AdBlock { Enabled = Store.AdBlockEnabled };

            string resDir = DirectoryInfo.Resource ?? string.Empty;
            _startPageUrl = "file://" + Path.Combine(resDir, "web", "index.html");

            _tabManager = new TabManager(_startPageUrl);

            // 2. Preload native engine and LSM stub library
            NativeEngine.Preload();
            EngineStub.Preload();

            // 3. Initialize Window
            _window = new Window("TVBrowser")
            {
                AvailableRotations = DisplayRotation.Degree_0
            };
            _window.Show();
            _window.Active();

            var background = new Background(_window)
            {
                Color = Color.FromRgb(15, 23, 42) // slate-900
            };
            background.Show();
            _window.AddResizeObject(background);

            // 4. Initialize Chromium engine
            int refCount = 0;
            try
            {
                refCount = Chromium.Initialize();
            }
            catch (Exception ex)
            {
                Console.WriteLine("[TVBrowser] Engine init exception: " + ex.Message);
            }

            if (refCount <= 0)
            {
                NativeEngine.SetArguments();
                try { refCount = Chromium.Initialize(); } catch {}
            }

            // 5. Create WebView surface
            Size screen = _window.ScreenSize;
            _web = new WebView(_window)
            {
                Geometry = new Rect(0, 0, screen.Width, screen.Height)
            };
            _web.Show();
            _web.SetFocus(true);

            ConfigureWebView();
            BuildFloatingChrome();

            // 6. Bind Remote Controls
            _window.KeyDown += OnKeyDown;
            _window.BackButtonPressed += (s, e) => GoBack();

            // Grab standard Samsung TV remote keys
            string[] keysToGrab = new[]
            {
                "XF86AudioRaiseVolume", "XF86AudioLowerVolume", "XF86AudioMute",
                "XF86Send", "XF86ChannelUp", "XF86ChannelDown",
                "XF86Red", "XF86Green", "XF86Yellow", "XF86Blue",
                "XF86Info", "XF86Menu", "XF86Search"
            };
            foreach (string key in keysToGrab)
            {
                try { _window.KeyGrabEx(key); } catch {}
            }

            // 7. Timer for progress animation and auto-hide toolbar
            _timer = EcoreMainloop.AddTimer(0.15, OnTick);

            // 8. Load initial Start Page
            Navigate(_startPageUrl);
        }

        protected override void OnTerminate()
        {
            // Omit Chromium.Shutdown() to prevent hanging Samsung platform exit sequence
            base.OnTerminate();
        }

        private void ConfigureWebView()
        {
            Settings settings = _web.GetSettings();
            if (settings != null)
            {
                settings.JavaScriptEnabled = true;
                settings.LoadImageAutomatically = true;
            }

            // Register bidirectional message bridge with injected scripts
            _web.AddJavaScriptMessageHandler(BridgeName, OnBridgeMessage);

            _web.LoadStarted += (s, e) =>
            {
                _loading = true;
                ShowChrome();
            };

            _web.LoadFinished += (s, e) =>
            {
                _loading = false;
                _progress.Hide();

                string current = _web.Url ?? string.Empty;
                string title = _web.Title ?? string.Empty;

                _isAtStartPage = current.StartsWith("file:", StringComparison.OrdinalIgnoreCase);

                if (!_isAtStartPage)
                {
                    // Inject interaction, virtual pointer, and adblock filters into live websites
                    _web.Eval(PageScript.GetInjectionScript(BridgeName, _adBlock.Enabled));
                    Store.AddHistory(current, title);
                    _adBlock.ResetRedirectTracking();
                }

                _tabManager.UpdateActiveTab(current, title);
                UpdateChromeUI(current, title);
            };

            _web.LoadError += (s, e) =>
            {
                _loading = false;
                _progress.Hide();
                UpdateChromeUI(_web.Url, "Failed to load: " + e.Description);
            };

            _web.UrlChanged += (s, e) =>
            {
                string url = e.GetAsString();
                _tabManager.UpdateActiveTab(url, _web.Title);
                UpdateChromeUI(url, _web.Title);
            };

            _web.TitleChanged += (s, e) =>
            {
                string title = e.GetAsString();
                _tabManager.UpdateActiveTab(_web.Url, title);
                UpdateChromeUI(_web.Url, title);
            };

            // Persistent Cookies
            try
            {
                Context ctx = _web.GetContext();
                CookieManager cookies = ctx?.GetCookieManager();
                if (cookies != null)
                {
                    cookies.SetCookieAcceptPolicy(CookieAcceptPolicy.Always);
                    cookies.SetPersistentStorage(DirectoryInfo.Data, CookiePersistentStorage.SqlLite);
                }
            }
            catch {}
        }

        private void BuildFloatingChrome()
        {
            Size screen = _window.ScreenSize;
            int barHeight = 64;

            _barBg = new Rectangle(_window)
            {
                Color = Color.FromRgba(15, 23, 42, 235), // slate-900 translucent
                Geometry = new Rect(0, 0, screen.Width, barHeight)
            };

            _barEdge = new Rectangle(_window)
            {
                Color = Color.FromRgba(56, 189, 248, 180), // sky-400 accent
                Geometry = new Rect(0, barHeight, screen.Width, 2)
            };

            int urlWidth = screen.Width * 65 / 100;
            _urlLabel = new Label(_window)
            {
                Geometry = new Rect(32, 10, urlWidth, barHeight - 20)
            };

            _statusLabel = new Label(_window)
            {
                Geometry = new Rect(32 + urlWidth, 10, screen.Width - urlWidth - 64, barHeight - 20)
            };

            _progress = new Rectangle(_window)
            {
                Color = Color.FromRgb(56, 189, 248),
                Geometry = new Rect(0, barHeight - 2, 0, 4)
            };

            ShowChrome();
        }

        private void ShowChrome()
        {
            _lastActivity = DateTime.UtcNow;
            if (_chromeVisible) return;

            _chromeVisible = true;
            _barBg.Show();
            _barEdge.Show();
            _urlLabel.Show();
            _statusLabel.Show();
            RaiseChrome();
        }

        private void HideChrome()
        {
            if (_isAtStartPage) return; // Keep visible on Start Page
            _chromeVisible = false;
            _barBg.Hide();
            _barEdge.Hide();
            _urlLabel.Hide();
            _statusLabel.Hide();
            _progress.Hide();
        }

        private void RaiseChrome()
        {
            _barBg.RaiseTop();
            _barEdge.RaiseTop();
            _urlLabel.RaiseTop();
            _statusLabel.RaiseTop();
            if (_loading) _progress.RaiseTop();
        }

        private void UpdateChromeUI(string url, string title)
        {
            string displayUrl = string.IsNullOrEmpty(url) || url.StartsWith("file:", StringComparison.OrdinalIgnoreCase)
                ? "TV Browser Home"
                : url;

            string displayTitle = string.IsNullOrEmpty(title) ? displayUrl : title;

            _urlLabel.Text = "<span font_size=20 color=#f8fafc font_weight=Bold>" +
                             EscapeMarkup(displayTitle) + "</span> <span font_size=16 color=#94a3b8>(" +
                             EscapeMarkup(displayUrl) + ")</span>";

            string tabInfo = $"Tab {_tabManager.ActiveIndex + 1}/{_tabManager.Count}";
            string adStatus = _adBlock.Enabled ? "🛡️ Shield ON" : "Shield OFF";

            _statusLabel.Text = $"<span font_size=18 color=#38bdf8 align=right>{tabInfo}  •  {adStatus}</span>";
        }

        private bool OnTick()
        {
            // Progress Bar Marquee Animation
            if (_loading && _chromeVisible)
            {
                Size screen = _window.ScreenSize;
                int span = screen.Width / 4;
                _marquee = (_marquee + (span / 4)) % (screen.Width + span);
                int x = _marquee - span;
                int width = span;
                if (x < 0) { width += x; x = 0; }
                if (width > 0)
                {
                    _progress.Geometry = new Rect(x, 62, width, 4);
                    _progress.Show();
                    _progress.RaiseTop();
                }
            }

            // Auto-hide toolbar countdown
            if (_chromeVisible && !_isAtStartPage && !_loading &&
                (DateTime.UtcNow - _lastActivity).TotalSeconds > 4.0)
            {
                HideChrome();
            }

            return true;
        }

        // --- STEP 5: In-App Navigation APIs ---

        public void Navigate(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return;

            string target = input.StartsWith("file:", StringComparison.OrdinalIgnoreCase)
                ? input
                : Urls.Normalize(input, Store.SearchEngine);

            if (string.IsNullOrEmpty(target)) return;

            // Step 6: Navigation Guard Check
            if (!_adBlock.ValidateNavigation(target, out string reason))
            {
                UpdateChromeUI(target, "Navigation Blocked: " + reason);
                return;
            }

            if (!_adBlock.CheckRedirectLoop(target))
            {
                UpdateChromeUI(target, "Redirect loop halted");
                return;
            }

            _tabManager.UpdateActiveTab(target, "");
            ShowChrome();
            _web.LoadUrl(target);

            // Re-center virtual cursor
            _cursorFx = 0.5f;
            _cursorFy = 0.5f;
        }

        public void GoBack()
        {
            if (!_isAtStartPage && _web.CanGoBack())
            {
                _web.GoBack();
                return;
            }

            if (!_isAtStartPage)
            {
                // Return to Start Page
                Navigate(_startPageUrl);
                return;
            }

            // At Start Page: exit cleanly
            Exit();
        }

        public void GoForward()
        {
            if (_web.CanGoForward())
            {
                _web.GoForward();
            }
        }

        public void Reload()
        {
            _web.Reload();
        }

        public void StopLoading()
        {
            _web.Stop();
            _loading = false;
            _progress.Hide();
        }

        // --- Bridge & Remote Key Handling ---

        private void OnBridgeMessage(JavaScriptMessage msg)
        {
            string body = msg.GetBodyAsString() ?? string.Empty;
            string[] parts = body.Split('\u0001');
            string cmd = parts[0];

            switch (cmd)
            {
                case "navigate":
                    if (parts.Length > 1) Navigate(parts[1]);
                    break;
                case "back":
                    GoBack();
                    break;
                case "forward":
                    GoForward();
                    break;
                case "reload":
                    Reload();
                    break;
                case "stop":
                    StopLoading();
                    break;
                case "tab_switch":
                    if (parts.Length > 1 && int.TryParse(parts[1], out int idx))
                    {
                        if (_tabManager.SwitchTab(idx))
                        {
                            Navigate(_tabManager.ActiveTab.Url);
                        }
                    }
                    break;
                case "tab_new":
                    string newUrl = parts.Length > 1 && !string.IsNullOrEmpty(parts[1]) ? parts[1] : _startPageUrl;
                    if (_tabManager.NewTab(newUrl))
                    {
                        Navigate(newUrl);
                    }
                    break;
                case "tab_close":
                    if (parts.Length > 1 && int.TryParse(parts[1], out int cIdx))
                    {
                        _tabManager.CloseTab(cIdx);
                        Navigate(_tabManager.ActiveTab.Url);
                    }
                    break;
                case "frame_click":
                    // Cross-origin iframe clicked: route through native Evas mouse feed
                    if (parts.Length >= 3 &&
                        int.TryParse(parts[1], out int fx) &&
                        int.TryParse(parts[2], out int fy))
                    {
                        NativeMouse.Click(_web, fx, fy);
                    }
                    break;
                case "popup":
                    // Step 6: Map user-initiated popups to current tab or tab 2/3
                    if (parts.Length > 1 && !string.IsNullOrEmpty(parts[1]))
                    {
                        if (_tabManager.CanCreateTab)
                            _tabManager.NewTab(parts[1]);
                        else
                            Navigate(parts[1]);
                    }
                    break;
            }
        }

        private void OnKeyDown(object sender, EvasKeyEventArgs e)
        {
            string key = e.KeyName;
            ShowChrome();

            // When browsing external websites, D-pad drives virtual pointer & scroll
            if (!_isAtStartPage)
            {
                switch (key)
                {
                    case "Left":
                        _cursorFx = Math.Max(0f, _cursorFx - CursorStep);
                        _web.Eval($"__tvb.move({_cursorFx}, {_cursorFy})");
                        e.Flags |= EvasEventFlag.OnHold;
                        return;

                    case "Right":
                        _cursorFx = Math.Min(1f, _cursorFx + CursorStep);
                        _web.Eval($"__tvb.move({_cursorFx}, {_cursorFy})");
                        e.Flags |= EvasEventFlag.OnHold;
                        return;

                    case "Up":
                        _cursorFy = Math.Max(0f, _cursorFy - CursorStep);
                        _web.Eval($"__tvb.move({_cursorFx}, {_cursorFy})");
                        e.Flags |= EvasEventFlag.OnHold;
                        return;

                    case "Down":
                        _cursorFy = Math.Min(1f, _cursorFy + CursorStep);
                        _web.Eval($"__tvb.move({_cursorFx}, {_cursorFy})");
                        e.Flags |= EvasEventFlag.OnHold;
                        return;

                    case "Return":
                    case "Select":
                        _web.Eval("__tvb.click()");
                        e.Flags |= EvasEventFlag.OnHold;
                        return;

                    case "XF86ChannelUp":
                    case "Page_Up":
                        _web.Eval("__tvb.scroll(-350)");
                        e.Flags |= EvasEventFlag.OnHold;
                        return;

                    case "XF86ChannelDown":
                    case "Page_Down":
                        _web.Eval("__tvb.scroll(350)");
                        e.Flags |= EvasEventFlag.OnHold;
                        return;
                }
            }

            // Color Shortcut Keys
            if (key == "XF86Red")
            {
                // Red: Focus Omnibox / Return to Start Page search
                Navigate(_startPageUrl);
                e.Flags |= EvasEventFlag.OnHold;
                return;
            }

            if (key == "XF86Green")
            {
                // Green: Switch next tab
                int next = (_tabManager.ActiveIndex + 1) % _tabManager.Count;
                _tabManager.SwitchTab(next);
                Navigate(_tabManager.ActiveTab.Url);
                e.Flags |= EvasEventFlag.OnHold;
                return;
            }

            if (key == "XF86Yellow")
            {
                // Yellow: Toggle bookmark for current page
                string url = _web.Url;
                if (!string.IsNullOrEmpty(url) && !url.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
                {
                    if (Store.IsBookmarked(url))
                        Store.RemoveBookmark(url);
                    else
                        Store.AddBookmark(url, _web.Title);
                    UpdateChromeUI(url, _web.Title);
                }
                e.Flags |= EvasEventFlag.OnHold;
                return;
            }

            if (key == "XF86Blue")
            {
                // Blue: Reload current page
                Reload();
                e.Flags |= EvasEventFlag.OnHold;
                return;
            }

            if (key == "XF86Menu")
            {
                // Menu: Return home
                Navigate(_startPageUrl);
                e.Flags |= EvasEventFlag.OnHold;
                return;
            }
        }

        private static string EscapeMarkup(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            return text.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");
        }
    }
}
