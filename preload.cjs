const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("gameWindowBridge", Object.freeze({
  toggleFullscreen: () => ipcRenderer.send("game-window:toggle-fullscreen"),
  setResolution: size => ipcRenderer.send("game-window:set-resolution", size)
}));
contextBridge.exposeInMainWorld("gameSaveBridge", Object.freeze({
  list: () => ipcRenderer.sendSync("game-saves:list"),
  read: slot => ipcRenderer.sendSync("game-saves:read", slot),
  write: request => ipcRenderer.sendSync("game-saves:write", request),
  delete: slot => ipcRenderer.sendSync("game-saves:delete", slot)
}));
