# LiveWall - Desktop Video Wallpaper

A Windows desktop application that plays videos as your wallpaper, directly behind your desktop icons, using Electron and React.

## Prerequisites

1. **Install Node.js**: You need Node.js installed on your computer to run and build this app. Download it from [nodejs.org](https://nodejs.org/).
2. **Install .NET Framework**: (Most Windows 10/11 PCs already have this) Required for `electron-edge-js` to execute the Windows API calls.

## Setup Instructions

1. Open PowerShell (as Administrator) or Command Prompt.
2. Navigate to this folder:
   ```cmd
   cd "c:\Users\visha\Downloads\wallpaper project\livewall"
   ```
3. Run the setup script to download Node.js and install dependencies:
   ```powershell
   .\setup.ps1
   ```

## Running the App

To launch the application:
- **PowerShell**: `.\start-app.ps1`
- **Command Prompt**: `start-app.cmd`

This will automatically set up the environment using the portable Node.js version and launch the app.

## Running the App (Development)

1. Start the Vite dev server:
   - **PowerShell**: `.\start-dev.ps1` (if available) or `.\start-app.ps1` and change the command to `npm run dev`.
   - **Command Prompt**: `start-dev.cmd`
2. Once the server is running, open a **new** terminal and run the app:
   - **PowerShell**: `.\start-app.ps1`
   - **Command Prompt**: `start-app.cmd`

## Building the `.exe` Installer

To package the application into a standalone Windows installer:
```cmd
npm run build
```
Once finished, you will find the `LiveWall Setup 1.0.0.exe` file inside the `dist-electron` folder.

## Troubleshooting
If you get an error regarding `edge-js`, ensure you ran `npm install` completely and that you have the standard Windows build tools installed. `electron-edge-js` provides pre-compiled binaries for most Node versions, making it much easier than `ffi-napi`.
