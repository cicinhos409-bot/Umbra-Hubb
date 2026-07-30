const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs seguras para o renderer (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // Versão do app
  getVersion: () => ipcRenderer.invoke('get-version'),
  // Plataforma
  platform: process.platform,
  // Indica que está rodando dentro do Electron
  isElectron: true,
  // Deep link
  onDeepLink: (callback) => ipcRenderer.on('on-deep-link', (_event, url) => callback(url)),
});
