const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Simple flag to check if we're in development
const isDev = process.env.NODE_ENV === 'development';

app.commandLine.appendSwitch('disable-gpu');


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.isResizable = false;
  mainWindow.setMenuBarVisibility(false);

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

// Simple IPC handlers for testing
ipcMain.handle('collector:pingTest', async () => {
  return `Pong! Response from Main Process at ${new Date().toLocaleTimeString()}`;
});

// Simple active window handler (mock data for now)
ipcMain.handle('collector:activeWindow', async () => {
  try {
    // For now, return mock data since we don't have the active-window module set up
    return {
      title: 'Digital Detangler Dashboard',
      app: 'Electron',
      success: true
    };
  } catch (error) {
    console.error('Error fetching active window data:', error);
    return { 
      title: 'System Error', 
      app: 'N/A', 
      success: false,
      error: error.message 
    };
  }
});

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