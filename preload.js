const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Method that matches what your App.jsx expects
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  
  // Specific methods (alternative approach)
  getActiveWindow: () => ipcRenderer.invoke('collector:activeWindow'),
  pingTest: () => ipcRenderer.invoke('collector:pingTest'),
});