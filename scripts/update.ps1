Write-Host "Forcing an update of LiveWall..." -ForegroundColor Cyan

# Use script's parent directory as project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

# 1. Kill any existing instances immediately
Write-Host "Killing background processes to unlock files..." -ForegroundColor Gray
Stop-Process -Name "LiveWall", "electron", "node" -Force -ErrorAction SilentlyContinue

# 2. Wait a moment for handles to release
Start-Sleep -Seconds 2

# 3. Clean the old electron build so it doesn't fail
Write-Host "Cleaning old build cache..." -ForegroundColor Gray
if (Test-Path "dist-electron") {
    Remove-Item -Recurse -Force "dist-electron\*" -ErrorAction SilentlyContinue
}

# 4. Use the portable Node.js to rebuild the executable with our new startup code
$nodeDir = Join-Path $projectRoot ".node\node-v20.18.0-win-x64"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "Building a new LiveWall Setup..." -ForegroundColor Green
npm run build

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Success! Please check your 'build-output' (or 'dist-electron') folder for the new 'LiveWall Setup 1.0.0.exe'." -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

pause
