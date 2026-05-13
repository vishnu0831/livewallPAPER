# Set the path to the portable Node.js directory
$nodeDir = Join-Path $PSScriptRoot ".node\node-v20.18.0-win-x64"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "Starting LiveWall Development Server..." -ForegroundColor Green
$env:NODE_ENV = "development"
npm run dev
pause
