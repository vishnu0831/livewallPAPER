# Require Administrator privileges to create a Scheduled Task with Highest Privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Please right-click this script and select 'Run with PowerShell' as Administrator!"
    Write-Host "This is required to give LiveWall the highest permissions to start immediately after restart."
    Write-Host "Press any key to exit..."
    $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
    exit
}

# Use script's parent directory as project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

$taskName = "LiveWall_Startup"
$actionPath = Join-Path $projectRoot "scripts\start-app.cmd"
$actionArgs = "--hidden"
$workingDir = $projectRoot

# 1. CLEANUP: Remove redundant and slow startup entries
$startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$vbsPath = Join-Path $startupFolder "LiveWall.vbs"
$batPath = Join-Path $startupFolder "LiveWall.bat"

if (Test-Path $vbsPath) {
    Remove-Item $vbsPath -Force
    Write-Host "Cleaned up old slow VBS startup script." -ForegroundColor Green
}
if (Test-Path $batPath) {
    Remove-Item $batPath -Force
    Write-Host "Cleaned up old startup BAT script." -ForegroundColor Green
}

# 2. PREREQUISITES: Ensure app is ready for startup
Write-Host "Verifying installation at $workingDir..." -ForegroundColor Gray
if (-not (Test-Path "$workingDir\node_modules")) {
    Write-Host "node_modules missing! Please run scripts\setup.ps1 first." -ForegroundColor Red
    Pause
    exit
}
if (-not (Test-Path "$workingDir\frontend\dist\index.html") -and -not (Test-Path "$workingDir\dist\index.html")) {
    Write-Host "UI Build missing! Building now..." -ForegroundColor Yellow
    Set-Location $workingDir
    npm run build:ui
}

# 3. CONFIGURE: Create a Fast, High-Privilege Scheduled Task
$action = New-ScheduledTaskAction -Execute $actionPath -Argument $actionArgs -WorkingDirectory $workingDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
# Disable the 3-day process limit and allow running on battery
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 0) -StartWhenAvailable
# Run with Highest Permissions to avoid UAC prompts and permission issues
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force

# 4. Set High Priority (Level 4-6 are high, 7 is normal)
$task = Get-ScheduledTask -TaskName $taskName
$task.Settings.Priority = 4
Set-ScheduledTask -InputObject $task

Write-Host ""
Write-Host "=========================================================="
Write-Host "SUCCESS! LiveWall startup configured."
Write-Host "LiveWall will now start instantly with highest permissions."
Write-Host "=========================================================="
Write-Host ""
Pause
