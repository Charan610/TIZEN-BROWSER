using System;
using System.IO;
using System.Runtime.InteropServices;
using Tizen.Applications;

namespace TVBrowser
{
    internal static class EngineStub
    {
        private const int RtldNow = 2;
        private const int RtldGlobal = 0x100;

        [DllImport("libdl.so.2")]
        private static extern IntPtr dlopen(string file, int mode);

        [DllImport("libdl.so.2")]
        private static extern IntPtr dlsym(IntPtr handle, string symbol);

        public static string Status { get; private set; } = "(not loaded)";

        /// <summary>
        /// Preloads the libprivileged-service-client.so stub from the app package res/ folder.
        /// This satisfies the DT_NEEDED dependency in libchromium-impl.so on retail Tizen 6.0/6.5
        /// TVs where the system libprivileged-service-client is inaccessible to user applications.
        /// </summary>
        public static bool Preload()
        {
            try
            {
                string resDir = Application.Current != null && Application.Current.DirectoryInfo != null
                    ? Application.Current.DirectoryInfo.Resource
                    : string.Empty;

                string stubPath = Path.Combine(resDir, "libprivileged-service-client.so");
                if (!File.Exists(stubPath))
                {
                    Status = "stub not found at " + stubPath;
                    return false;
                }

                IntPtr handle = dlopen(stubPath, RtldNow | RtldGlobal);
                if (handle == IntPtr.Zero)
                {
                    Status = "dlopen failed for " + stubPath;
                    return false;
                }

                // Verify symbol resolution
                IntPtr mountFunc = dlsym(handle, "PS_Mount");
                if (mountFunc != IntPtr.Zero)
                {
                    Status = "loaded successfully with PS_Mount verified";
                    return true;
                }

                Status = "loaded handle without PS_Mount";
                return true;
            }
            catch (Exception ex)
            {
                Status = "exception: " + ex.Message;
                return false;
            }
        }
    }
}
