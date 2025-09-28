// preload.js

const { contextBridge, ipcRenderer } = require('electron');

const api = {
  invoke: (channel, data) => {
    // Only allow specific channels to be invoked
    const validChannels = [
      'collector:activeWindow', 
      'collector:pingTest', 
      'collector:wifiInfo', 
      'collector:getHistory', 
      'collector:systemLoad', 
      'collector:runningProcesses',
      'collector:privacyInfo',
      'collector:networkMetrics'  // Added network metrics channel
    ]; 
    
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);