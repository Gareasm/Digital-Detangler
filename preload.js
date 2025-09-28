// preload.js

const { contextBridge, ipcRenderer } = require('electron');

const api = {
  invoke: (channel, data) => {
   // Only allow specific channels to be invoked
    // 🛑 ADD THE NEW CHANNEL HERE 🛑
    const validChannels = ['collector:activeWindow', 'collector:pingTest', 'collector:wifiInfo', 'collector:getHistory']; 
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);