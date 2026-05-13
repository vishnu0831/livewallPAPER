using System;
using System.Runtime.InteropServices;

public class WallpaperEngine {
    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr FindWindowEx(IntPtr parentHandle, IntPtr childAfter, string className, string windowTitle);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

    [DllImport("user32.dll")]
    static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    static readonly IntPtr HWND_BOTTOM = new IntPtr(1);
    const uint SW_SHOW = 5;
    const uint SWP_NOMOVE = 0x0002;
    const uint SWP_NOSIZE = 0x0001;
    const uint SWP_NOACTIVATE = 0x0010;

    public static void Main(string[] args) {
        if (args.Length == 0) {
            Console.WriteLine("No handle provided.");
            return;
        }

        long handle;
        if (!long.TryParse(args[0], out handle)) return;
        IntPtr electronWindow = new IntPtr(handle);

        IntPtr progman = FindWindow("Progman", null);
        UIntPtr result = UIntPtr.Zero;

        // Force desktop to split/spawn WorkerW
        SendMessageTimeout(progman, 0x052C, UIntPtr.Zero, IntPtr.Zero, 0x0000, 1000, out result);

        IntPtr wallpaperWorkerW = IntPtr.Zero;

        // Find the WorkerW window that is the sibling of SHELLDLL_DefView
        EnumWindows(new EnumWindowsProc((tophandle, topparamhandle) =>
        {
            IntPtr shelf = FindWindowEx(tophandle, IntPtr.Zero, "SHELLDLL_DefView", null);
            if (shelf != IntPtr.Zero)
            {
                // On most Win10/11 versions, the wallpaper WorkerW is the next sibling
                wallpaperWorkerW = FindWindowEx(IntPtr.Zero, tophandle, "WorkerW", null);
            }
            return true;
        }), IntPtr.Zero);

        // Fallback: If still not found, try common Win11 variants
        if (wallpaperWorkerW == IntPtr.Zero)
        {
            wallpaperWorkerW = FindWindowEx(progman, IntPtr.Zero, "WorkerW", null);
        }

        if (wallpaperWorkerW != IntPtr.Zero)
        {
            SetParent(electronWindow, wallpaperWorkerW);
            Console.WriteLine("Attached to WorkerW: " + wallpaperWorkerW.ToString());
        }
        else
        {
            // Ultimate Fallback: Parent directly to Progman if WorkerW fails
            SetParent(electronWindow, progman);
            Console.WriteLine("Attached to Progman: " + progman.ToString());
        }

        // Always force to bottom z-order just in case
        SetWindowPos(electronWindow, HWND_BOTTOM, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
    }
}
