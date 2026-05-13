@echo off
SET PATH=%~dp0.node\node-v20.18.0-win-x64;%PATH%
echo Starting LiveWall Development Server...
set NODE_ENV=development
npm run dev
pause
