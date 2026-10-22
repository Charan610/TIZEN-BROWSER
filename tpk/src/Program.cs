using System;

namespace TVBrowser
{
    internal static class Program
    {
        private static void Main(string[] args)
        {
            var app = new BrowserApp();
            app.Run(args);
        }
    }
}
