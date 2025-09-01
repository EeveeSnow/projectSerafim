const { app, BrowserWindow, ipcMain, shell, webFrameMain, dialog  } = require('electron');
const path = require('path');

let mainWindow;

// IPC handlers for browser functionality
ipcMain.handle('navigate', async (event, url) => {
  try {
    // Add protocol if not present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('search', async (event, query) => {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return { success: true, url: searchUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Window control handlers
ipcMain.on('window-control', (event, action) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  if (action === 'minimize') win.minimize();
  else if (action === 'maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
  else if (action === 'close') win.close();
});

ipcMain.handle('get-window-state', async (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return { isMaximized: false };
  
  return { isMaximized: win.isMaximized() };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden', 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webviewTag: true,
      resizable: true,
      movable: true,
      enableBlinkFeatures: 'PictureInPicture',

      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'Serafim Browser'
  });

  mainWindow.loadFile('static/index.html');

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle new window requests
  mainWindow.webContents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  console.log(`Certificate error for ${url}: ${error}`);
  event.preventDefault();
  callback(true); // Временный обход ошибки
});

ipcMain.on("toggle-devtools", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    if (window.webContents.isDevToolsOpened()) {
      window.webContents.closeDevTools();
    } else {
      window.webContents.openDevTools({ mode: "detach" });
    }
  }
});

let overlayWindow;

ipcMain.on("toggle-overlay", async () => {
  // открыть диалог выбора
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Media", extensions: ["jpg", "png", "gif", "mp4", "webm"] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) return;
  const filePath = result.filePaths[0];

  if (!overlayWindow) {
    overlayWindow = new BrowserWindow({
      width: 300,
      height: 300,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      backgroundColor: "#00000000",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    overlayWindow.loadFile("static/overlay.html");
  }

  overlayWindow.webContents.send("load-media", filePath);
});
