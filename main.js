// main.js (Enhanced)

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const activeWindow = require('active-win');
const collectWifiInfo = require('./collectors/wifiInfo'); 
const collectSystemLoad = require('./collectors/systemLoad'); // Import the systemLoad collector

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

// =========================================================================
// 4. WINDOW SETUP (Remains the same)
// =========================================================================

function createWindow() {
    // ... (Your BrowserWindow code)
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 800,
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