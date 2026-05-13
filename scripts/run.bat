@echo off
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "NODE_PATH=%PROJECT_ROOT%\.node\node-v20.18.0-win-x64\node.exe"
set "NPM_PATH=%PROJECT_ROOT%\.node\node-v20.18.0-win-x64\node_modules\npm\bin\npm-cli.js"

echo Installing dependencies...
"%NODE_PATH%" "%NPM_PATH%" install
echo Finished!
pause
