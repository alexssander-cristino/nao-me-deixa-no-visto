const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("gameSaveBridge", Object.freeze({
  list: () => ipcRenderer.sendSync("game-saves:list"),
  read: slot => ipcRenderer.sendSync("game-saves:read", slot),
  write: request => ipcRenderer.sendSync("game-saves:write", request),
  delete: slot => ipcRenderer.sendSync("game-saves:delete", slot)
}));
