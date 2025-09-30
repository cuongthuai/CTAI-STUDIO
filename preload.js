const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, limited API to the renderer process.
contextBridge.exposeInMainWorld('electronAPI', {
  // The renderer can call this function to get the API key.
  // This invokes the 'get-api-key' handler in the main process (electron.js).
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
});
