$ErrorActionPreference = "Stop"
$nodeVersion = "v20.18.0"
$nodeZipUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
$zipPath = "$env:TEMP\node-$nodeVersion.zip"

# Use script's parent directory as project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

$extractPath = Join-Path $projectRoot ".node"
$nodeDir = Join-Path $extractPath "node-$nodeVersion-win-x64"
$npmCmd = Join-Path $nodeDir "npm.cmd"

if (-not (Test-Path $nodeDir)) {
    Write-Host "Downloading Node.js $nodeVersion (Portable)..."
    Invoke-WebRequest -Uri $nodeZipUrl -OutFile $zipPath
    Write-Host "Extracting Node.js..."
    New-Item -ItemType Directory -Path $extractPath -Force -ErrorAction SilentlyContinue
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
} else {
    Write-Host "Node.js portable already downloaded."
}

Write-Host "Installing project dependencies..."
Set-Location $projectRoot
& $npmCmd install

Write-Host "Done!"
