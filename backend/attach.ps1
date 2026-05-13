param($handle)

Add-Type -TypeDefinition @"
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

    public static void Attach(long electronHandle) {
        IntPtr progman = FindWindow("Progman", null);
        UIntPtr result = UIntPtr.Zero;

        SendMessageTimeout(progman, 0x052C, UIntPtr.Zero, IntPtr.Zero, 0x0000, 1000, out result);

        IntPtr workerw = IntPtr.Zero;
        EnumWindows(new EnumWindowsProc((tophandle, topparamhandle) =>
        {
            IntPtr p = FindWindowEx(tophandle, IntPtr.Zero, "SHELLDLL_DefView", null);
            if (p != IntPtr.Zero)
            {
                // Windows 10/11 classic behavior: Desktop WorkerW is a top-level sibling
                workerw = FindWindowEx(IntPtr.Zero, tophandle, "WorkerW", null);

                // Windows 11 (22H2+) behavior: Desktop WorkerW is a child alongside SHELLDLL_DefView
                if (workerw == IntPtr.Zero) 
                {
                    workerw = FindWindowEx(tophandle, IntPtr.Zero, "WorkerW", null);
                }
            }
            return true;
        }), IntPtr.Zero);

        IntPtr electronWindowHandle = new IntPtr(electronHandle);
        SetParent(electronWindowHandle, workerw);
    }
}
"@ -PassThru | Out-Null

[WallpaperEngine]::Attach([long]$handle)
