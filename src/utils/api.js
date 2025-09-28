// This file is a simple wrapper for the Electron IPC API exposed in preload.js.
// It provides a clean, promise-based interface for your React components.

// Check for the global API injection (which is only available in Electron)
const electronAPI = window.electronAPI;

/**
 * Retrieves the current active window information from the Electron main process.
 * @returns {Promise<{title: string, app: string}>}
 */
export async function fetchActiveWindow() {
  if (!electronAPI) {
    console.warn("Electron API not available. Running in browser mode.");
    return { title: 'Browser Preview', app: 'N/A' };
  }
  
  return electronAPI.invoke('collector:activeWindow');
}

// Define placeholders for future collectors
export async function runPingTest(target) {
  if (!electronAPI) return `Pinging ${target} in browser mode...`;
  return electronAPI.invoke('collector:pingTest', target);
}

export async function fetchWifiInfo() {
  if (!electronAPI) return { ssid: 'WIFI-SIM', signal: '100%' };
  return electronAPI.invoke('collector:wifiInfo');
}
