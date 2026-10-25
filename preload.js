const { contextBridge, ipcRenderer } = require('electron');
// live quotes go through the main process (no browser CORS limits)
contextBridge.exposeInMainWorld('quotes', {
  get: (symbol) => ipcRenderer.invoke('quote', symbol)
});
