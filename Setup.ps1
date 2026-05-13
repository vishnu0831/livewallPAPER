$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         LiveWall One-Click Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = $PSScriptRoot

# 1. Install Node.js (Portable) and Dependencies
Write-Host "[1/2] Installing environment and dependencies..." -ForegroundColor Yellow
& "$scriptDir\scripts\setup.ps1"

# 2. Configure Startup
Write-Host ""
Write-Host "[2/2] Configuring startup (Requires Administrator)..." -ForegroundColor Yellow
& "$scriptDir\scripts\create-startup.ps1"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Setup Complete! You can now use LiveWall." -ForegroundColor Green
Write-Host "To start the app manually, use scripts\start-app.cmd" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

Pause
