const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('AppBridge', {
goto: (page) => ipcRenderer.send('goto', page)
});