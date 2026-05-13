@echo off
cd /d "c:\Users\visha\Downloads\wallpaper project\livewall"
set PATH=c:\Users\visha\Downloads\wallpaper project\livewall\.node\node-v20.18.0-win-x64;%PATH%
call npm run build > build_elevated_2.log 2>&1
