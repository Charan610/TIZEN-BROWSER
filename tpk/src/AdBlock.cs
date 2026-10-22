using System;
using System.Collections.Generic;

namespace TVBrowser
{
    internal sealed class BlockEvent
    {
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Type { get; set; }
        public string Url { get; set; }
        public string Reason { get; set; }

        public BlockEvent(string type, string url, string reason)
        {
            Type = type;
            Url = url;
            Reason = reason;
        }
    }

    /// <summary>
    /// Layered Ad, Tracker, and Popup Protection Engine.
    /// Operates without freezing the TV hardware.
    /// </summary>
    internal sealed class AdBlock
    {
        private static readonly HashSet<string> KnownAdDomains = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "doubleclick.net",
            "googleadservices.com",
            "googlesyndication.com",
            "adservice.google.com",
            "adnxs.com",
            "criteo.com",
            "outbrain.com",
            "taboola.com",
            "rubiconproject.com",
            "pubmatic.com",
            "openx.net",
            "popcash.net",
            "popads.net",
            "adsterra.com",
            "propellerads.com"
        };

        private readonly HashSet<string> _allowlist = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        private readonly List<BlockEvent> _blockedEvents = new List<BlockEvent>();
        private readonly Dictionary<string, int> _redirectHops = new Dictionary<string, int>();

        public bool Enabled { get; set; } = true;
        public bool StrictMode { get; set; } = false;

        public IReadOnlyList<BlockEvent> BlockedEvents => _blockedEvents.AsReadOnly();

        public bool IsAllowlisted(string url)
        {
            if (string.IsNullOrEmpty(url)) return false;
            string host = ExtractHost(url);
            return _allowlist.Contains(host);
        }

        public void AddToAllowlist(string url)
        {
            string host = ExtractHost(url);
            if (!string.IsNullOrEmpty(host))
            {
                _allowlist.Add(host);
            }
        }

        public void RemoveFromAllowlist(string url)
        {
            string host = ExtractHost(url);
            if (!string.IsNullOrEmpty(host))
            {
                _allowlist.Remove(host);
            }
        }

        /// <summary>
        /// Validates navigation against known malicious/advertising domains.
        /// </summary>
        public bool ValidateNavigation(string url, out string reason)
        {
            reason = string.Empty;
            if (!Enabled) return true;
            if (string.IsNullOrEmpty(url)) return true;
            if (IsAllowlisted(url)) return true;

            string host = ExtractHost(url);
            foreach (string adDomain in KnownAdDomains)
            {
                if (host.Equals(adDomain, StringComparison.OrdinalIgnoreCase) ||
                    host.EndsWith("." + adDomain, StringComparison.OrdinalIgnoreCase))
                {
                    reason = "Known advertising or tracker domain: " + adDomain;
                    LogBlock("DOMAIN", url, reason);
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Checks for excessive redirect chains to stop redirect loops.
        /// </summary>
        public bool CheckRedirectLoop(string url)
        {
            string host = ExtractHost(url);
            if (string.IsNullOrEmpty(host)) return true;

            if (!_redirectHops.ContainsKey(host))
                _redirectHops[host] = 1;
            else
                _redirectHops[host]++;

            if (_redirectHops[host] > 4)
            {
                LogBlock("REDIRECT_LOOP", url, "Exceeded 4 rapid redirects on " + host);
                return false;
            }

            return true;
        }

        public void ResetRedirectTracking()
        {
            _redirectHops.Clear();
        }

        public void LogBlock(string type, string url, string reason)
        {
            var evt = new BlockEvent(type, url, reason);
            _blockedEvents.Add(evt);
            if (_blockedEvents.Count > 100)
            {
                _blockedEvents.RemoveAt(0);
            }
        }

        private static string ExtractHost(string url)
        {
            try
            {
                if (Uri.TryCreate(url, UriKind.Absolute, out Uri uri))
                {
                    return uri.Host;
                }
            }
            catch {}
            return string.Empty;
        }
    }
}
