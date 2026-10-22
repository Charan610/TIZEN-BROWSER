using System;
using System.Collections.Generic;

namespace TVBrowser
{
    internal sealed class TabItem
    {
        public string Id { get; set; }
        public string Url { get; set; }
        public string Title { get; set; }
        public bool IsActive { get; set; }

        public TabItem(string id, string url, string title)
        {
            Id = id;
            Url = url ?? string.Empty;
            Title = string.IsNullOrEmpty(title) ? "New Tab" : title;
            IsActive = false;
        }
    }

    /// <summary>
    /// Enforces the Single Active Surface and Max 3 Tabs constraint
    /// to preserve RAM and CPU on Samsung Smart TV hardware.
    /// </summary>
    internal sealed class TabManager
    {
        public const int MaxTabs = 3;
        private readonly List<TabItem> _tabs = new List<TabItem>();
        private int _activeIndex = 0;

        public event Action<TabItem> ActiveTabChanged;
        public event Action<int> TabsUpdated;

        public TabManager(string initialUrl = "")
        {
            var initialTab = new TabItem("tab_1", initialUrl, "Start Page") { IsActive = true };
            _tabs.Add(initialTab);
        }

        public IReadOnlyList<TabItem> Tabs => _tabs.AsReadOnly();
        public int Count => _tabs.Count;
        public int ActiveIndex => _activeIndex;

        public TabItem ActiveTab
        {
            get
            {
                if (_activeIndex >= 0 && _activeIndex < _tabs.Count)
                    return _tabs[_activeIndex];
                return _tabs.Count > 0 ? _tabs[0] : null;
            }
        }

        public bool CanCreateTab => _tabs.Count < MaxTabs;

        public bool NewTab(string url = "", string title = "")
        {
            if (_tabs.Count >= MaxTabs)
            {
                return false;
            }

            foreach (var t in _tabs) t.IsActive = false;

            string id = "tab_" + (Environment.TickCount & 0x7FFFFFFF);
            var newTab = new TabItem(id, url, string.IsNullOrEmpty(title) ? "New Tab" : title)
            {
                IsActive = true
            };

            _tabs.Add(newTab);
            _activeIndex = _tabs.Count - 1;

            ActiveTabChanged?.Invoke(newTab);
            TabsUpdated?.Invoke(_tabs.Count);
            return true;
        }

        public bool SwitchTab(int index)
        {
            if (index < 0 || index >= _tabs.Count || index == _activeIndex)
            {
                return false;
            }

            for (int i = 0; i < _tabs.Count; i++)
            {
                _tabs[i].IsActive = (i == index);
            }

            _activeIndex = index;
            ActiveTabChanged?.Invoke(_tabs[_activeIndex]);
            TabsUpdated?.Invoke(_tabs.Count);
            return true;
        }

        public bool CloseTab(int index)
        {
            if (index < 0 || index >= _tabs.Count)
            {
                return false;
            }

            _tabs.RemoveAt(index);

            if (_tabs.Count == 0)
            {
                // Always maintain at least one tab (Start Page)
                var homeTab = new TabItem("tab_1", "", "Start Page") { IsActive = true };
                _tabs.Add(homeTab);
                _activeIndex = 0;
            }
            else
            {
                if (_activeIndex >= _tabs.Count)
                {
                    _activeIndex = _tabs.Count - 1;
                }
                _tabs[_activeIndex].IsActive = true;
            }

            ActiveTabChanged?.Invoke(_tabs[_activeIndex]);
            TabsUpdated?.Invoke(_tabs.Count);
            return true;
        }

        public void UpdateActiveTab(string url, string title)
        {
            var tab = ActiveTab;
            if (tab != null)
            {
                if (!string.IsNullOrEmpty(url)) tab.Url = url;
                if (!string.IsNullOrEmpty(title)) tab.Title = title;
            }
        }
    }
}
