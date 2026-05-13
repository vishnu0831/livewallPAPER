@echo off
SET PATH=%~dp0.node\node-v20.18.0-win-x64;%PATH%
echo Building LiveWall Executable...
npm run build
pause
