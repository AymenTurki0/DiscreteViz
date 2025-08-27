const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');


let win;


function createWindow() {
win = new BrowserWindow({
width: 1100,
height: 720,
minWidth: 960,
minHeight: 640,
show: false,
backgroundColor: '#0b1220',
webPreferences: {
preload: path.join(__dirname, 'preload.js'),
contextIsolation: true,
nodeIntegration: false
}
});


win.once('ready-to-show', () => win.show());
win.loadFile(path.join(__dirname, 'src', 'input.html'));
}


app.whenReady().then(() => {
createWindow();
app.on('activate', () => {
if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
});


app.on('window-all-closed', () => {
if (process.platform !== 'darwin') app.quit();
});


ipcMain.on('goto', (_evt, page) => {
if (!win) return;
const target = path.join(__dirname, 'src', page);
win.loadFile(target);
});