using System;
using System.Text;
using System.Text.RegularExpressions;

namespace TVBrowser
{
    internal static class Urls
    {
        public const string DefaultSearchUrl = "https://www.google.com/search?q=";
        public const string DuckDuckGoSearchUrl = "https://duckduckgo.com/?q=";
        public const string BingSearchUrl = "https://www.bing.com/search?q=";

        private static readonly Regex IpRegex = new Regex(@"^(\d{1,3}\.){3}\d{1,3}(:\d+)?([/?#].*)?$", RegexOptions.Compiled);
        private static readonly Regex LocalhostRegex = new Regex(@"^localhost(:\d+)?([/?#].*)?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private static readonly Regex DomainRegex = new Regex(@"^([a-z0-9\u00a1-\uffff]([a-z0-9\u00a1-\uffff-]*[a-z0-9\u00a1-\uffff])?\.)+[a-z\u00a1-\uffff]{2,}(:\d+)?([/?#].*)?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        /// <summary>
        /// Validates whether a scheme is safe for TV browsing.
        /// Rejects javascript:, file:, data:, vbscript:.
        /// </summary>
        public static bool IsUnsafeScheme(string url)
        {
            if (string.IsNullOrWhiteSpace(url)) return true;
            string lower = url.Trim().ToLowerInvariant();
            return lower.StartsWith("javascript:", StringComparison.Ordinal) ||
                   lower.StartsWith("data:", StringComparison.Ordinal) ||
                   lower.StartsWith("vbscript:", StringComparison.Ordinal) ||
                   lower.StartsWith("file:", StringComparison.Ordinal);
        }

        /// <summary>
        /// Checks whether the string is a local network IP address or localhost.
        /// </summary>
        public static bool IsLocalOrIp(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return false;
            string clean = input.Trim();
            if (clean.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
                clean = clean.Substring(7);
            else if (clean.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                clean = clean.Substring(8);

            return IpRegex.IsMatch(clean) || LocalhostRegex.IsMatch(clean);
        }

        /// <summary>
        /// Distinguishes direct URLs from search phrases.
        /// </summary>
        public static bool IsUrl(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return false;
            string trimmed = input.Trim();

            // Explicit scheme
            if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var uri = new Uri(trimmed);
                    return !string.IsNullOrEmpty(uri.Host);
                }
                catch
                {
                    return false;
                }
            }

            // Contains spaces -> search query phrase
            if (trimmed.IndexOf(' ') >= 0)
            {
                return false;
            }

            // Local IP address or localhost
            if (IpRegex.IsMatch(trimmed) || LocalhostRegex.IsMatch(trimmed))
            {
                return true;
            }

            // Public domain name (with optional port/path/query)
            if (DomainRegex.IsMatch(trimmed))
            {
                return true;
            }

            return false;
        }

        /// <summary>
        /// Normalizes user input into a navigable URL.
        /// IP addresses and localhost default to http://.
        /// Standard domains default to https://.
        /// Search phrases default to the configured search engine query.
        /// </summary>
        public static string Normalize(string input, string engine = "google")
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            string trimmed = input.Trim();

            if (IsUnsafeScheme(trimmed))
            {
                return string.Empty;
            }

            if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                return IsUrl(trimmed) ? trimmed : string.Empty;
            }

            if (IsUrl(trimmed))
            {
                if (IsLocalOrIp(trimmed))
                {
                    return "http://" + trimmed;
                }
                return "https://" + trimmed;
            }

            // Build search engine query
            string searchBase = DefaultSearchUrl;
            if (string.Equals(engine, "duckduckgo", StringComparison.OrdinalIgnoreCase))
                searchBase = DuckDuckGoSearchUrl;
            else if (string.Equals(engine, "bing", StringComparison.OrdinalIgnoreCase))
                searchBase = BingSearchUrl;

            return searchBase + Uri.EscapeDataString(trimmed);
        }

        /// <summary>
        /// Quotes a string safely for JavaScript injection.
        /// </summary>
        public static string QuoteJs(string value)
        {
            var sb = new StringBuilder("\"");
            foreach (char c in value ?? string.Empty)
            {
                switch (c)
                {
                    case '\\': sb.Append("\\\\"); break;
                    case '"': sb.Append("\\\""); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < 0x20 || c == '\u2028' || c == '\u2029')
                            sb.Append("\\u").Append(((int)c).ToString("x4"));
                        else
                            sb.Append(c);
                        break;
                }
            }
            return sb.Append('"').ToString();
        }
    }
}
