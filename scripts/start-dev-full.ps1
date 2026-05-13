# Set the path to the portable Node.js directory
$nodeDir = Join-Path $PSScriptRoot ".node\node-v20.18.0-win-x64"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "------------------------------------------" -ForegroundColor Cyan
Write-Host "  LIVEWALL: STARTING DEVELOPMENT MODE     " -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# 1. Start Vite dev server in its own window
Write-Host "[1/2] Launching Vite Dev Server in new window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$nodeDir;$env:PATH'; npm run dev"

# 2. Give Vite a few seconds to warm up
Write-Host "[2/2] Waiting 5 seconds for UI to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 3. Start Electron app in this window
Write-Host ">>> Launching LiveWall App in Dev Mode..." -ForegroundColor Green
npm start -- --dev

Write-Host "------------------------------------------" -ForegroundColor Cyan
Write-Host "App closed. You can now close the Vite terminal." -ForegroundColor Gray
pause
