const { app, BrowserWindow, screen, ipcMain, dialog, Tray, Menu, nativeImage, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const urlModule = require('url');
const { exec, execSync, spawn } = require('child_process');
const { attachWindow } = require('./wallpaper.cjs');
const { extractExecutable } = require('./utils.cjs');


const logPath = path.join(app.getPath('userData'), 'debug.log');
function logToFile(msg) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
}
logToFile('App starting...');

const args = process.argv;
const isScreensaverStart = args.some(arg => arg.toLowerCase() === '/s');
const isScreensaverConfig = args.some(arg => arg.toLowerCase() === '/c');
const isScreensaverPreview = args.some(arg => arg.toLowerCase().startsWith('/p'));
const isHidden = args.some(arg => arg.includes('--hidden'));

let wallpaperWindowsMap = new Map(); // displayId -> BrowserWindow
let wallpaperWindows = [];
let settingsWindow = null;
let tray = null;

// Add switches to prevent occlusion pausing and autoplay blocking
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,HardwareMediaKeyHandling,MediaSessionService');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

// Hardware acceleration and performance optimization switches to reduce laptop heat
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-hardware-overlays');

// Use local folder for data in development to avoid permission issues
if (!app.isPackaged) {
  const userDataPath = path.join(__dirname, '../.userdata');
  if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath);
  app.setPath('userData', userDataPath);
}

// Block navigation outside of our local app entry point.
// This prevents drag-and-dropping a file from opening the default OS app
// (like Photos for videos not supported by Chromium).
app.on('web-contents-created', (e, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    event.preventDefault();
    logToFile(`Prevented navigation to: ${navigationUrl}`);
  });
});

// Global State
let appState = {
  videoSrc: null,
  isPlaying: true,
  isMuted: true,
  loop: true,
  brightness: 100,
  blur: 0,
  saturation: 100,
  contrast: 100,
  playbackRate: 1,
  isOnBattery: false,
  isOccluded: false
};

const statePath = path.join(app.getPath('userData'), 'livewall-state.json');
try {
  if (fs.existsSync(statePath)) {
    const saved = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    appState = { ...appState, ...saved };
  }
} catch (e) {
  console.error('Failed to load state', e);
}

function saveState() {
  const stateToSave = { ...appState };
  delete stateToSave.isOnBattery;
  delete stateToSave.isOccluded;
  fs.writeFileSync(statePath, JSON.stringify(stateToSave, null, 2));
}

function broadcastState() {
  const allWindows = [...wallpaperWindows];
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    allWindows.push(settingsWindow);
  }
  
  allWindows.forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('state-update', appState);
    }
  });
}

function createSingleWallpaperWindow(display) {
  const win = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    frame: false,
    transparent: false,
    backgroundColor: '#000000',
    skipTaskbar: true,
    enableLargerThanScreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      webSecurity: false
    }
  });

  let finalUrl;
  const distHtmlPath = path.join(__dirname, '../dist/index.html');
  const isDev = process.argv.includes('--dev');
  if (app.isPackaged || (!isDev && fs.existsSync(distHtmlPath))) {
    finalUrl = urlModule.pathToFileURL(distHtmlPath).toString();
  } else {
    finalUrl = 'http://localhost:5173';
  }

  const urlObj = new URL(finalUrl);
  urlObj.searchParams.set('mode', 'wallpaper');
  win.loadURL(urlObj.toString());

  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[UI CONSOLE Wallpaper Display ${display.id}]: ${message}`);
  });

  return win;
}

function syncWallpaperWindows() {
  if (isScreensaverStart || isScreensaverConfig) return;

  const displays = screen.getAllDisplays();
  const currentDisplayIds = new Set(displays.map(d => d.id));

  logToFile(`Syncing wallpaper windows. Displays found: ${displays.length}`);

  // 1. Clean up stale windows
  for (const [displayId, win] of wallpaperWindowsMap.entries()) {
    if (!currentDisplayIds.has(displayId)) {
      logToFile(`Removing window for display ${displayId}`);
      if (!win.isDestroyed()) win.close();
      wallpaperWindowsMap.delete(displayId);
      wallpaperWindows = wallpaperWindows.filter(w => w !== win);
    }
  }

  // 2. Ensure every display has a window
  displays.forEach((display) => {
    let win = wallpaperWindowsMap.get(display.id);

    if (!win || win.isDestroyed()) {
      logToFile(`Adding new window for display ${display.id}`);
      win = createSingleWallpaperWindow(display);
      wallpaperWindowsMap.set(display.id, win);
      wallpaperWindows.push(win);
    } else {
      // Update bounds if they changed (resolution change)
      const currentBounds = win.getBounds();
      const targetBounds = display.bounds;
      
      if (currentBounds.width !== targetBounds.width || 
          currentBounds.height !== targetBounds.height || 
          currentBounds.x !== targetBounds.x || 
          currentBounds.y !== targetBounds.y) {
        
        logToFile(`Adjusting bounds for display ${display.id}: ${JSON.stringify(targetBounds)}`);
        win.setBounds(targetBounds);
        // Force a resize event in the renderer
        win.webContents.send('display-metrics-changed');
        // Reset attachment flag so it can re-attach if needed (though usually not necessary for WorkerW)
      }
    }
  });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 450,
    height: 600,
    frame: true,
    transparent: false,
    backgroundColor: '#1E1E24',
    resizable: true,
    alwaysOnTop: true, // Make sure user sees it
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Automatically open devtools to see if React is throwing an error
  settingsWindow.webContents.openDevTools({ mode: 'detach' });

  let finalUrl;
  const distHtmlPath = path.join(__dirname, '../dist/index.html');
  const isDev = process.argv.includes('--dev');
  if (app.isPackaged || (!isDev && fs.existsSync(distHtmlPath))) {
    finalUrl = urlModule.pathToFileURL(distHtmlPath).toString();
  } else {
    finalUrl = 'http://localhost:5173';
  }
  console.log("FINAL URL SETTINGS:", finalUrl);

  const urlObj = new URL(finalUrl);
  urlObj.searchParams.set('mode', 'settings');
  settingsWindow.loadURL(urlObj.toString());

  settingsWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[UI CONSOLE Settings]: ${message}`);
  });
}

function setupTray() {
  const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAcSURBVDhPY3hAIP8PwkxA+B+EGAHGAIzh0N/9AGg61uP9E+fIAAAAAElFTkSuQmCC');
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Settings', click: () => createSettingsWindow() },
    { 
      label: 'Refresh Wallpaper', 
      click: () => {
        wallpaperWindows.forEach(win => {
          if (!win.isDestroyed()) {
            win.hasAttachedToWorkerW = false;
            win.webContents.send('wallpaper-ready'); 
          }
        });
      } 
    },
    { type: 'separator' },
    { 
      label: 'Play/Pause', 
      click: () => {
        appState.isPlaying = !appState.isPlaying;
        broadcastState();
        saveState();
      } 
    },
    { type: 'separator' },
    { 
      label: 'Quit LiveWall', 
      click: () => {
        app.quit();
      } 
    }
  ]);
  tray.setToolTip('LiveWall');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => createSettingsWindow());
}

function createScreensaverWindows() {
  const displays = screen.getAllDisplays();

  displays.forEach((display) => {
    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      transparent: false,
      backgroundColor: '#000000',
      skipTaskbar: true,
      alwaysOnTop: true,
      kiosk: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
        webSecurity: false
      }
    });

    let finalUrl;
    const distHtmlPath = path.join(__dirname, '../dist/index.html');
    const isDev = args.includes('--dev');
    if (app.isPackaged || (!isDev && fs.existsSync(distHtmlPath))) {
      finalUrl = urlModule.pathToFileURL(distHtmlPath).toString();
    } else {
      finalUrl = 'http://localhost:5173';
    }

    const urlObj = new URL(finalUrl);
    urlObj.searchParams.set('mode', 'screensaver');
    win.loadURL(urlObj.toString());
    
    wallpaperWindows.push(win);
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our settings window.
    createSettingsWindow();
  });

  app.whenReady().then(() => {
    // Start Native Optimization Engine (Smart Pausing)
    const monitorExe = extractExecutable('monitor.exe', __dirname, app.isPackaged, logToFile);
    if (fs.existsSync(monitorExe)) {
      logToFile(`Starting Native Optimization Engine from: ${monitorExe}`);
      const monitor = spawn(monitorExe, [], { windowsHide: true });
      monitor.stdout.on('data', (data) => {
        const out = data.toString().trim();
        logToFile(`Monitor state change: ${out === '1' ? 'FULLSCREEN/BUSY' : 'NORMAL'}`);
        appState.isOccluded = (out === '1');
        broadcastState();
      });
      monitor.stderr.on('data', err => logToFile(`Monitor Error: ${err.toString()}`));
      monitor.on('error', err => logToFile(`Monitor Spawn Error: ${err.message}`));
    } else {
      logToFile(`Warning: Native Optimization Engine executable not found at: ${monitorExe}`);
    }

    // Wallpaper Watchdog: Periodically check and re-attach to ensure perfection
    setInterval(() => {
      if (appState.isPlaying && !isScreensaverStart && !isScreensaverConfig) {
        wallpaperWindows.forEach(win => {
          if (!win.isDestroyed() && !win.hasAttachedToWorkerW) {
             logToFile('Watchdog: Re-attachment needed');
             win.webContents.send('wallpaper-ready'); 
          }
        });
      }
    }, 10000);

    // Display adjustment listeners
    screen.on('display-added', () => {
      logToFile('Display ADDED detected');
      syncWallpaperWindows();
    });
    screen.on('display-removed', () => {
      logToFile('Display REMOVED detected');
      syncWallpaperWindows();
    });
    screen.on('display-metrics-changed', () => {
      logToFile('Display METRICS/RESOLUTION changed');
      syncWallpaperWindows();
    });

    setupTray();

    if (isScreensaverStart) {
      createScreensaverWindows();
    } else if (isScreensaverConfig) {
      createSettingsWindow();
    } else if (isScreensaverPreview) {
      createSettingsWindow();
    } else {
      syncWallpaperWindows();
      if (!isHidden) {
        createSettingsWindow();
      }
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWallpaperWindows();
      }
    });
  });

  app.on('window-all-closed', () => {
  });
}

ipcMain.handle('select-video', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'webm', 'ogg', 'avi'] }]
  });
  
  if (!canceled && filePaths.length > 0) {
    return filePaths[0];
  }
  return null;
});

ipcMain.handle('update-state', (event, updates) => {
  appState = { ...appState, ...updates };
  broadcastState();
  saveState();
  
  // If we just updated the video source, tell all wallpaper windows to re-attach
  if (updates.videoSrc) {
    wallpaperWindows.forEach(win => {
      if (!win.isDestroyed()) {
        win.hasAttachedToWorkerW = false; // Reset so they can re-attach
        win.webContents.send('wallpaper-ready'); 
      }
    });
  }
  return true;
});

ipcMain.handle('request-state', (event) => {
  event.sender.send('state-update', appState);
});

ipcMain.handle('exit-screensaver', () => {
  if (isScreensaverStart) {
    app.quit();
  }
});

ipcMain.on('wallpaper-ready', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  logToFile(`Wallpaper ready received from window: ${win ? 'exists' : 'null'}`);
  if (win && wallpaperWindows.includes(win) && !win.hasAttachedToWorkerW) {
    const tryAttach = () => {
      logToFile('Attempting WorkerW attachment...');
      attachWindow(win).then(() => {
        logToFile('WorkerW attachment SUCCESS');
        win.hasAttachedToWorkerW = true;
      }).catch(e => {
        logToFile(`WorkerW attachment ERROR: ${e.message}`);
        console.error('WorkerW error, retrying in 2s...', e);
        setTimeout(tryAttach, 2000);
      });
    };
    tryAttach();
  }
});

ipcMain.handle('save-wallpaper-frame', async (event, dataUrl) => {
  try {
    const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
    const imagePath = path.join(app.getPath('userData'), 'latest-frame.jpg');
    fs.writeFileSync(imagePath, base64Data, 'base64');
    
    // 1. Set Desktop Wallpaper Registry (Silent, for next boot)
    const psDesktop = `Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name 'Wallpaper' -Value '${imagePath.replace(/\\/g, '\\\\')}' -Force`;
    exec(`powershell -ExecutionPolicy Bypass -Command "${psDesktop}"`, { windowsHide: true });

    return true;


    return true;
  } catch (err) {
    console.error('Failed to save wallpaper frame:', err);
    return false;
  }
});



// Run on Startup implementation
if (app.isPackaged) {
  // Use standard, reliable Windows Registry auto-start method
  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
    args: ['--hidden']
  });
}
