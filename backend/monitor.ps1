Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using System.Text;

public class DesktopMonitor {
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();
    
    [DllImport("user32.dll", SetLastError = true)]
    static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    
    [DllImport("user32.dll", SetLastError = true, CharSet=CharSet.Auto)]
    static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public static void Run() {
        while(true) {
            bool isOccluded = false;
            IntPtr hwnd = GetForegroundWindow();
            
            if (hwnd != IntPtr.Zero) {
                StringBuilder sb = new StringBuilder(256);
                GetClassName(hwnd, sb, 256);
                string className = sb.ToString();
                
                // Allow interactions with the desktop layer without pausing
                if (className != "WorkerW" && className != "Progman") {
                    RECT rect;
                    if (GetWindowRect(hwnd, out rect)) {
                        int w = rect.Right - rect.Left;
                        int h = rect.Bottom - rect.Top;
                        
                        // Check if the foreground window equals or exceeds monitor bounds
                        foreach (Screen screen in Screen.AllScreens) {
                            if (w >= screen.WorkingArea.Width && h >= screen.WorkingArea.Height) {
                                isOccluded = true;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (isOccluded) {
                Console.WriteLine("1"); // PAUSE 
            } else {
                Console.WriteLine("0"); // PLAY
            }
            
            Thread.Sleep(1000);
        }
    }
}
"@ -ReferencedAssemblies "System.Windows.Forms", "System.Drawing"

[DesktopMonitor]::Run()
