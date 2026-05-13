# check-and-fix.ps1
# This is a one-click troubleshooting and repair script for LiveWall.

# 1. Kill any existing LiveWall processes to ensure a fresh start
Write-Host "Killing existing processes..." -ForegroundColor Yellow
$procs = Get-Process -Name LiveWall -ErrorAction SilentlyContinue
if ($procs) {
    foreach ($proc in $procs) {
        $proc.Kill()
    }
}

# 2. Check for .NET Framework 4.5 or higher (required for attach.exe)
Write-Host "Checking system dependencies..." -ForegroundColor Cyan
$netPath = "HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full"
if (Test-Path $netPath) {
    $release = Get-ItemPropertyValue -LiteralPath $netPath -Name Release
    if ($release -lt 378389) {
        Write-Host "ERROR: .NET Framework 4.5 or higher is NOT installed." -ForegroundColor Red
        Write-Host "Please download and install it here: https://dotnet.microsoft.com/en-us/download/dotnet-framework/net48" -ForegroundColor Yellow
    } else {
        Write-Host "SUCCESS: .NET Framework dependency is satisfied." -ForegroundColor Green
    }
} else {
    Write-Host "ERROR: .NET Framework 4.5 or higher is NOT detected." -ForegroundColor Red
    Write-Host "Please download and install it here: https://dotnet.microsoft.com/en-us/download/dotnet-framework/net48" -ForegroundColor Yellow
}

# 3. Check for Admin Permissions
Write-Host "Checking permissions..." -ForegroundColor Cyan
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if ($currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "SUCCESS: Running as Administrator." -ForegroundColor Green
} else {
    Write-Host "WARNING: Not running as Administrator. The app may fail to attach to the desktop background." -ForegroundColor Yellow
    Write-Host "To fix: Right-click the app and select 'Run as Administrator'." -ForegroundColor Magenta
}

# 4. Clean up corrupted state (optional)
# Remove-Item -Path "$env:LOCALAPPDATA\livewall\livewall-state.json" -ErrorAction SilentlyContinue

Write-Host "`nTroubleshooting complete!" -ForegroundColor Cyan
Write-Host "Please try running the app again. If it still fails, send the 'debug.log' file back to me." -ForegroundColor Yellow
