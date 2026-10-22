using System;
using System.IO;
using System.Runtime.InteropServices;

namespace TVBrowser
{
    internal static class NativeEngine
    {
        private const int RtldNow = 2;
        private const int RtldGlobal = 0x100;

        [DllImport("libdl.so.2")]
        private static extern IntPtr dlopen(string file, int mode);

        [DllImport("libdl.so.2")]
        private static extern IntPtr dlsym(IntPtr handle, string symbol);

        [DllImport("libdl.so.2")]
        private static extern string dlerror();

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void EwkSetArgumentsDelegate(int argc, IntPtr[] argv);

        public static string LoadedFrom { get; private set; }

        /// <summary>
        /// Explicitly dlopens libchromium-ewk.so before P/Invoke binds to it.
        /// Resolves issues where .NET Core loader fails on specific Tizen firmwares.
        /// </summary>
        public static bool Preload()
        {
            string[] searchPaths = new[]
            {
                "/usr/lib/libchromium-ewk.so",
                "/usr/lib/libchromium-ewk.so.0",
                "/usr/share/chromium-efl/lib/libchromium-ewk.so"
            };

            foreach (string path in searchPaths)
            {
                if (File.Exists(path))
                {
                    IntPtr handle = dlopen(path, RtldNow | RtldGlobal);
                    if (handle != IntPtr.Zero)
                    {
                        LoadedFrom = path;
                        return true;
                    }
                }
            }

            // Fallback by soname
            IntPtr fallback = dlopen("libchromium-ewk.so", RtldNow | RtldGlobal);
            if (fallback != IntPtr.Zero)
            {
                LoadedFrom = "libchromium-ewk.so (soname)";
                return true;
            }

            return false;
        }

        /// <summary>
        /// Configures initial arguments for the Chromium engine before ewk_init().
        /// </summary>
        public static bool SetArguments()
        {
            try
            {
                IntPtr handle = dlopen("libchromium-ewk.so", RtldNow | RtldGlobal);
                if (handle == IntPtr.Zero) return false;

                IntPtr funcPtr = dlsym(handle, "ewk_set_arguments");
                if (funcPtr == IntPtr.Zero) return false;

                var setArgs = Marshal.GetDelegateForFunctionPointer<EwkSetArgumentsDelegate>(funcPtr);
                string[] args = new[] { "tvbrowser", "--enable-viewport", "--no-sandbox" };
                IntPtr[] argv = new IntPtr[args.Length];
                for (int i = 0; i < args.Length; i++)
                {
                    argv[i] = Marshal.StringToHGlobalAnsi(args[i]);
                }

                setArgs(args.Length, argv);

                for (int i = 0; i < args.Length; i++)
                {
                    Marshal.FreeHGlobal(argv[i]);
                }
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
