// main.js (Enhanced)

const { app, BrowserWindow, ipcMain } = require('electron');
const si = require('systeminformation');const path = require('path');
const activeWindow = require('active-win');
const collectWifiInfo = require('./collectors/wifiInfo'); 
const collectSystemLoad = require('./collectors/systemLoad'); // Import the systemLoad collector
const collectRunningProcesses = require('./collectors/runningProcesses');
const registerPrivacyHandler = require('./handlers/privacyHandler');

// Simple flag to check if we're in development
const isDev = process.env.NODE_ENV === 'development';

app.commandLine.appendSwitch('disable-gpu');

// =========================================================================
// 1. GLOBAL STATE FOR PROCESS TRACKING
// =========================================================================

// Stores the total time spent (in milliseconds) for each application name.
/** @type {Object<string, number>} */
const processHistory = {};



// Tracks the currently active application and the last time it was checked.
/** @type {{ name: string | null, startTime: number | null }} */
let currentActiveApp = {
    name: null,
    startTime: null,
};

/**
 * Updates the process history with the time spent on the *previous* active app.
 * @param {string} newAppName The name of the application that is now active.
 */
function updateProcessHistory(newAppName) {
    const { name: previousAppName, startTime: previousStartTime } = currentActiveApp;
    const now = Date.now();

    // 1. If we have a previous app and it's different from the new one, record the time.
    if (previousAppName && previousAppName !== newAppName && previousStartTime !== null) {
        const timeSpent = now - previousStartTime; // Time in milliseconds
        
        // Add the time spent to the total history
        processHistory[previousAppName] = (processHistory[previousAppName] || 0) + timeSpent;
        
        console.log(`[Tracker] Logged ${timeSpent}ms for: ${previousAppName}`);
        
        // Update context switch history for focus score
        try {
            const window = BrowserWindow.getAllWindows()[0];
            if (window && window.webContents) {
                window.webContents.send('context-switch', {
                    timestamp: now,
                    fromApp: previousAppName,
                    toApp: newAppName,
                    timeSpent: timeSpent
                });
            }
        } catch (e) {
            console.error('Error sending context switch event:', e);
        }
    }

    // 2. Update the current active app tracking data
    // Only reset the timer if the app has actually changed.
    if (previousAppName !== newAppName) {
        currentActiveApp.name = newAppName;
        currentActiveApp.startTime = now;
    }
}


// =========================================================================
// 2. IPC HANDLERS
// =========================================================================

ipcMain.handle('collector:networkMetrics', async () => {
  try {
    // Initialize default values
    let bandwidthMbps = 100; // Default bandwidth
    let latencyMs = 50; // Default latency
    let defaultInterface = null;
    
    try {
      // Try to get network stats
      const stats = await si.networkStats();
      defaultInterface = stats.find(iface => 
        iface.iface === 'Wi-Fi' || 
        iface.iface === 'Ethernet' || 
        iface.iface.startsWith('eth') || 
        iface.iface.startsWith('en')
      );
      
      // If we found an interface, use its speed
      if (defaultInterface && defaultInterface.speed) {
        bandwidthMbps = defaultInterface.speed;
      }
    } catch (e) {
      console.warn('Error getting network stats, using defaults:', e.message);
    }
    
    // Try to get latency if we have an active interface
    if (defaultInterface) {
      try {
        const pingData = await si.inetLatency('8.8.8.8');
        latencyMs = pingData;
      } catch (e) {
        console.warn('Could not measure latency, using default:', e.message);
      }
    }
    
    return {
      success: true,
      latencyMs,
      bandwidthMbps,
      packetLossPct: 0 // Not directly available, default to 0
    };
  } catch (e) {
    console.error("Failed to get network metrics:", e);
    return { 
      success: false,
      latencyMs: -1,
      bandwidthMbps: 0,
      packetLossPct: 100 
    };
  }
});
ipcMain.handle('collector:pingTest', async () => {
    return `Pong! Response from Main Process at ${new Date().toLocaleTimeString()}`;
});


ipcMain.handle('collector:activeWindow', async () => {
    try {
        const result = await activeWindow();
        let activeAppName = 'Background Activity'; // Default

        if (result) {
            activeAppName = result.owner.name;

            // 🛑 CRUCIAL STEP: Update the global state with the new active app
            updateProcessHistory(activeAppName);

            return {
                title: result.title,
                app: activeAppName,
                success: true,
                details: {
                    pid: result.owner.processId,
                    path: result.owner.path
                }
            };
        }

        // If no result (e.g., desktop is clicked), update history with the generic name
        updateProcessHistory(activeAppName); 

        return {
            title: 'No Active Window',
            app: activeAppName,
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

ipcMain.handle('collector:wifiInfo', async () => {
    const wifiData = await collectWifiInfo();
    
    if (wifiData && wifiData.length > 0) {
        // systeminformation returns an array. We search for the connected network.
        // A connected network usually has an SSID and is often the first item.
        const currentNetwork = wifiData.find(network => network.ssid);

        if (currentNetwork) {
            return {
                ssid: currentNetwork.ssid,
                quality: currentNetwork.quality, // Signal quality in %
                success: true,
            };
        }
    }
    
    // Fallback if no network is found or if the adapter is disabled
    return { 
        ssid: 'Not Connected', 
        quality: 0, 
        success: false 
    };
});

ipcMain.handle('collector:getHistory', async () => {
    // Before returning, finalize the current session's time
    // This is important because the timer is only updated when a *new* app starts.
    // If the same app is active, this manually updates the running total.
    if (currentActiveApp.name && currentActiveApp.startTime !== null) {
        // Calculate the running time for the current active app (but don't reset the timer)
        const runningTime = Date.now() - currentActiveApp.startTime;
        
        // Add it to the total, but temporarily for the return data
        const tempHistory = { 
            ...processHistory, 
            [currentActiveApp.name]: (processHistory[currentActiveApp.name] || 0) + runningTime 
        };

        // Convert ms to seconds/minutes and sort for display
        const formattedHistory = Object.entries(tempHistory)
            .map(([app, ms]) => ({
                app,
                totalMs: ms,
                totalMinutes: (ms / 60000).toFixed(2) // Convert ms to minutes
            }))
            .sort((a, b) => b.totalMs - a.totalMs); // Sort by highest time first

        return formattedHistory;
    }

    return []; // Return empty array if no data
});

ipcMain.handle('collector:systemLoad', async () => {
    try {
        return await collectSystemLoad();
    } catch (error) {
        console.error('System load collection error:', error);
        return null;
    }
});

// Add this with your other IPC handlers
ipcMain.handle('collector:runningProcesses', async () => {
  try {
    return await collectRunningProcesses();
  } catch (error) {
    console.error('Process collection error:', error);
    return null;
  }
});

// =========================================================================
// 4. WINDOW SETUP (Remains the same)
// =========================================================================

function createWindow() {
    // ... (Your BrowserWindow code)
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.setMenuBarVisibility(false);

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
}

app.whenReady().then(() => {
    registerPrivacyHandler();  // Register privacy handler
    createWindow();
});

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