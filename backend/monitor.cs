using System;
using System.Runtime.InteropServices;
using System.Threading;

public class UserMonitor {
    [DllImport("shell32.dll")]
    static extern int SHQueryUserNotificationState(out int pquns);

    // User Notification States
    const int QUNS_NOT_PRESENT = 1;
    const int QUNS_BUSY = 2;
    const int QUNS_RUNNING_D3D_FULL_SCREEN = 3;
    const int QUNS_PRESENTATION_MODE = 4;
    const int QUNS_ACCEPTS_NOTIFICATIONS = 5;
    const int QUNS_QUIET_TIME = 6;
    const int QUNS_APP = 7;

    public static void Main(string[] args) {
        int lastState = -1;

        while (true) {
            int currentState = 0;
            int hResult = SHQueryUserNotificationState(out currentState);

            if (hResult == 0) { // S_OK
                // We want to "Pause" (output 1) if the user is in Full Screen or in Presentation mode.
                // Do NOT pause on QUNS_BUSY because that gets triggered by simple Do Not Disturb mode.
                bool isFullOrBusy = (currentState == QUNS_RUNNING_D3D_FULL_SCREEN || 
                                     currentState == QUNS_PRESENTATION_MODE);

                int outputState = isFullOrBusy ? 1 : 0;

                if (outputState != lastState) {
                    Console.WriteLine(outputState);
                    lastState = outputState;
                }
            }

            Thread.Sleep(2000); // Check every 2 seconds to keep CPU extremely low
        }
    }
}
