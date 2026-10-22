using System;
using System.Runtime.InteropServices;
using ElmSharp;

namespace TVBrowser
{
    /// <summary>
    /// Feeds trusted mouse click events into the Evas canvas, allowing interaction
    /// with cross-origin iframes (captchas, external payment widgets) that injected
    /// scripts cannot hit-test across origin boundaries.
    /// </summary>
    internal static class NativeMouse
    {
        private const int RtldNow = 2;
        private const int RtldGlobal = 0x100;
        private const int ButtonFlagsNone = 0;
        private const int LeftButton = 1;

        private static bool _probed;
        private static bool _usable;
        private static bool _entered;
        private static uint _stamp;

        [DllImport("libdl.so.2")]
        private static extern IntPtr dlopen(string file, int mode);

        [DllImport("libevas.so.1")]
        private static extern IntPtr evas_object_evas_get(IntPtr obj);

        [DllImport("libevas.so.1")]
        private static extern void evas_event_feed_mouse_in(IntPtr e, uint timestamp, IntPtr data);

        [DllImport("libevas.so.1")]
        private static extern void evas_event_feed_mouse_move(IntPtr e, int x, int y, uint timestamp, IntPtr data);

        [DllImport("libevas.so.1")]
        private static extern void evas_event_feed_mouse_down(IntPtr e, int button, int flags, uint timestamp, IntPtr data);

        [DllImport("libevas.so.1")]
        private static extern void evas_event_feed_mouse_up(IntPtr e, int button, int flags, uint timestamp, IntPtr data);

        public static bool Click(EvasObject target, int x, int y)
        {
            IntPtr canvas = CanvasOf(target);
            if (canvas == IntPtr.Zero) return false;

            try
            {
                if (!_entered)
                {
                    evas_event_feed_mouse_in(canvas, NextStamp(), IntPtr.Zero);
                    _entered = true;
                }

                evas_event_feed_mouse_move(canvas, x, y, NextStamp(), IntPtr.Zero);
                evas_event_feed_mouse_down(canvas, LeftButton, ButtonFlagsNone, NextStamp(), IntPtr.Zero);
                evas_event_feed_mouse_up(canvas, LeftButton, ButtonFlagsNone, NextStamp(), IntPtr.Zero);
                return true;
            }
            catch
            {
                _usable = false;
                return false;
            }
        }

        private static IntPtr CanvasOf(EvasObject target)
        {
            if (target == null) return IntPtr.Zero;
            if (_probed && !_usable) return IntPtr.Zero;

            IntPtr handle = target.RealHandle != IntPtr.Zero ? target.RealHandle : target.Handle;
            if (handle == IntPtr.Zero) return IntPtr.Zero;

            try
            {
                if (!_probed)
                {
                    _probed = true;
                    dlopen("/usr/lib/libevas.so.1", RtldNow | RtldGlobal);
                }

                IntPtr canvas = evas_object_evas_get(handle);
                _usable = (canvas != IntPtr.Zero);
                return canvas;
            }
            catch
            {
                _usable = false;
                return IntPtr.Zero;
            }
        }

        private static uint NextStamp()
        {
            uint now = unchecked((uint)Environment.TickCount);
            _stamp = now > _stamp ? now : _stamp + 1;
            return _stamp;
        }
    }
}
