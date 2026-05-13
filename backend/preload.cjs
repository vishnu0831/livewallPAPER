const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectVideo: () => ipcRenderer.invoke('select-video'),
  updateState: (updates) => ipcRenderer.invoke('update-state', updates),
  requestState: () => ipcRenderer.invoke('request-state'),
  onStateUpdate: (callback) => ipcRenderer.on('state-update', (_event, state) => callback(state)),
  saveWallpaperFrame: (dataUrl) => ipcRenderer.invoke('save-wallpaper-frame', dataUrl),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  exitScreensaver: () => ipcRenderer.invoke('exit-screensaver'),
  notifyWallpaperReady: () => ipcRenderer.send('wallpaper-ready')
});
