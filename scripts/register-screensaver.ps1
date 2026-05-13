# register-screensaver.ps1
# This script sets LiveWall as your Windows screensaver.

$projectName = "LiveWall"
$currentDir = Get-Location
$buildOutputDir = Join-Path $currentDir "build-output"
$exePath = Join-Path $buildOutputDir "$projectName Setup 1.0.0.exe"

# If the setup exe exists, use the installed one or the temp one.
# For screensavers, it's best to use a standalone EXE renamed to .scr
# We'll assume the user has already built the app.

$installedExe = Join-Path $env:LOCALAPPDATA "Programs\livewall\LiveWall.exe"
$scrPath = Join-Path $env:LOCALAPPDATA "Programs\livewall\LiveWall.scr"

if (!(Test-Path $installedExe)) {
    Write-Host "Error: LiveWall not found. Please run the installer first!" -ForegroundColor Red
    exit
}

Write-Host "Registering LiveWall Screensaver..." -ForegroundColor Cyan

# 1. Copy EXE to .SCR
Copy-Item -Path $installedExe -Destination $scrPath -Force

# 2. Update Registry
$regPath = "HKCU:\Control Panel\Desktop"
Set-ItemProperty -Path $regPath -Name "SCRNSAVE.EXE" -Value $scrPath -Force
Set-ItemProperty -Path $regPath -Name "ScreenSaveActive" -Value "1" -Force
Set-ItemProperty -Path $regPath -Name "ScreenSaverIsSecure" -Value "1" -Force
Set-ItemProperty -Path $regPath -Name "ScreenSaveTimeOut" -Value "600" -Force # 10 minutes

Write-Host "Successfully registered LiveWall as your screensaver!" -ForegroundColor Green
Write-Host "Your computer will now show the live wallpaper when idle and lock automatically." -ForegroundColor Green
Write-Host "Press any key or move mouse to exit the screensaver (will return to login screen)." -ForegroundColor Yellow
