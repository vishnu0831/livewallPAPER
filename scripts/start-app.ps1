# Use script's parent directory as project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Set the path to the portable Node.js directory
$nodeDir = Join-Path $projectRoot ".node\node-v20.18.0-win-x64"
$env:PATH = "$nodeDir;$env:PATH"

Set-Location $projectRoot

if (-not (Test-Path "dist\index.html")) {
    Write-Host "Building UI for the first time... This may take a minute." -ForegroundColor Yellow
    npm run build:ui
}

Write-Host "Starting LiveWall App..." -ForegroundColor Green
$env:NODE_ENV="production"
npm start
pause
