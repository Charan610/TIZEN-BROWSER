using System;
using System.Collections.Generic;
using System.IO;

namespace TVBrowser
{
    internal sealed class BookmarkItem
    {
        public string Url { get; set; }
        public string Title { get; set; }

        public BookmarkItem(string url, string title)
        {
            Url = url;
            Title = string.IsNullOrEmpty(title) ? url : title;
        }
    }

    internal sealed class HistoryItem
    {
        public string Url { get; set; }
        public string Title { get; set; }
        public DateTime VisitedAt { get; set; } = DateTime.UtcNow;

        public HistoryItem(string url, string title)
        {
            Url = url;
            Title = string.IsNullOrEmpty(title) ? url : title;
        }
    }

    /// <summary>
    /// Persistent preferences and cache storage bounded for low-memory TV hardware.
    /// </summary>
    internal static class Store
    {
        private const int MaxHistory = 100;
        private static string _dataDir;
        private static readonly List<BookmarkItem> Bookmarks = new List<BookmarkItem>();
        private static readonly List<HistoryItem> History = new List<HistoryItem>();

        public static string SearchEngine { get; set; } = "google";
        public static bool AdBlockEnabled { get; set; } = true;

        public static void Init(string dataDir)
        {
            _dataDir = dataDir ?? string.Empty;
            Load();
        }

        public static IReadOnlyList<BookmarkItem> GetBookmarks() => Bookmarks.AsReadOnly();
        public static IReadOnlyList<HistoryItem> GetHistory() => History.AsReadOnly();

        public static void AddBookmark(string url, string title)
        {
            if (string.IsNullOrEmpty(url)) return;
            for (int i = 0; i < Bookmarks.Count; i++)
            {
                if (Bookmarks[i].Url.Equals(url, StringComparison.OrdinalIgnoreCase))
                {
                    Bookmarks[i].Title = title;
                    Save();
                    return;
                }
            }
            Bookmarks.Add(new BookmarkItem(url, title));
            Save();
        }

        public static void RemoveBookmark(string url)
        {
            if (string.IsNullOrEmpty(url)) return;
            Bookmarks.RemoveAll(b => b.Url.Equals(url, StringComparison.OrdinalIgnoreCase));
            Save();
        }

        public static bool IsBookmarked(string url)
        {
            if (string.IsNullOrEmpty(url)) return false;
            return Bookmarks.Exists(b => b.Url.Equals(url, StringComparison.OrdinalIgnoreCase));
        }

        public static void AddHistory(string url, string title)
        {
            if (string.IsNullOrEmpty(url)) return;
            if (url.StartsWith("file:", StringComparison.OrdinalIgnoreCase) ||
                url.StartsWith("about:", StringComparison.OrdinalIgnoreCase)) return;

            History.RemoveAll(h => h.Url.Equals(url, StringComparison.OrdinalIgnoreCase));
            History.Insert(0, new HistoryItem(url, title));

            // Bound history to prevent unbounded file growth
            if (History.Count > MaxHistory)
            {
                History.RemoveRange(MaxHistory, History.Count - MaxHistory);
            }
            Save();
        }

        private static void Load()
        {
            try
            {
                if (string.IsNullOrEmpty(_dataDir) || !Directory.Exists(_dataDir)) return;
                string bFile = Path.Combine(_dataDir, "bookmarks.tsv");
                if (File.Exists(bFile))
                {
                    Bookmarks.Clear();
                    foreach (string line in File.ReadAllLines(bFile))
                    {
                        string[] parts = line.Split('\t');
                        if (parts.Length >= 1 && !string.IsNullOrWhiteSpace(parts[0]))
                        {
                            Bookmarks.Add(new BookmarkItem(parts[0], parts.Length > 1 ? parts[1] : parts[0]));
                        }
                    }
                }
            }
            catch {}
        }

        private static void Save()
        {
            try
            {
                if (string.IsNullOrEmpty(_dataDir)) return;
                if (!Directory.Exists(_dataDir)) Directory.CreateDirectory(_dataDir);

                string bFile = Path.Combine(_dataDir, "bookmarks.tsv");
                var lines = new List<string>();
                foreach (var b in Bookmarks)
                {
                    lines.Add(b.Url + "\t" + b.Title);
                }
                File.WriteAllLines(bFile, lines);
            }
            catch {}
        }
    }
}
