@echo off
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
cd /d "%PROJECT_ROOT%"

SET PATH=%PROJECT_ROOT%\.node\node-v20.18.0-win-x64;%PATH%

:: 1. Zero-Lag Visual Handoff: Set static wallpaper to last frame before app starts
if exist ".userdata\latest-frame.jpg" (
    powershell -ExecutionPolicy Bypass -Command "Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class WP { [DllImport(\"user32.dll\", CharSet = CharSet.Auto)] public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni); }'; [WP]::SystemParametersInfo(0x0014, 0, '%PROJECT_ROOT%\.userdata\latest-frame.jpg', 3)" >nul 2>&1
)

:: 2. Fast startup: bypass npm start and run electron binary directly
SET NODE_ENV=production
if exist "node_modules\electron\dist\electron.exe" (
    start "" /B "node_modules\electron\dist\electron.exe" "." %*
) else if exist "node_modules\.bin\electron.cmd" (
    start "" /B call "node_modules\.bin\electron.cmd" . %*
) else (
    npm start -- %*
)

exit
