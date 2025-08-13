const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (url) => ipcRenderer.invoke('navigate', url),
  search: (query) => ipcRenderer.invoke('search', query),
  windowControl: (action) => ipcRenderer.send('window-control', action),
  getWindowState: () => ipcRenderer.invoke('get-window-state')
});
