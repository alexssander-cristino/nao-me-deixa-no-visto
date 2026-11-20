const { app, BrowserWindow, Menu, shell, ipcMain } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const SAVE_VERSION = 2;
const SAVE_SLOTS = 5;
function validSaveSlot(slot) { return Number.isInteger(slot) && slot >= 1 && slot <= SAVE_SLOTS; }
function saveDir() { return path.join(app.getPath("userData"), "saves"); }
function readSlots() {
  return Array.from({ length: SAVE_SLOTS }, (_, index) => {
    const slot = index + 1, file = path.join(saveDir(), "slot-" + slot + ".json");
    try { const data = JSON.parse(fs.readFileSync(file, "utf8")); if (!data || data.version !== SAVE_VERSION || !data.payload || typeof data.payload !== "object") throw new Error("Formato inválido"); return { slot, occupied: true, savedAt: data.savedAt, metadata: data.metadata || {}, payload: data.payload }; }
    catch (_) { return { slot, occupied: false, corrupted: fs.existsSync(file) }; }
  });
}
ipcMain.on("game-window:toggle-fullscreen", event => { const win = BrowserWindow.fromWebContents(event.sender); if (win && !win.isDestroyed()) win.setFullScreen(!win.isFullScreen()); });
ipcMain.on("game-window:set-resolution", (event, size) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const allowed = { "960x600": [960, 600], "1280x800": [1280, 800], "1600x900": [1600, 900], "1920x1080": [1920, 1080] };
  if (win && !win.isDestroyed() && allowed[size] && !win.isFullScreen()) { win.setSize(allowed[size][0], allowed[size][1], true); win.center(); }
});
ipcMain.on("game-saves:list", event => { event.returnValue = readSlots().map(({ payload, ...slot }) => slot); });
ipcMain.on("game-saves:read", (event, slot) => { if (!validSaveSlot(slot)) { event.returnValue = { ok: false, error: "Slot inválido" }; return; } const item = readSlots()[slot - 1]; event.returnValue = item.occupied ? { ok: true, ...item } : { ok: false, error: item.corrupted ? "Salvamento corrompido" : "Slot vazio" }; });
ipcMain.on("game-saves:write", (event, request) => { try { if (!request || !validSaveSlot(request.slot) || !request.payload || typeof request.payload !== "object" || Array.isArray(request.payload)) throw new Error("Dados inválidos"); const dir = saveDir(); fs.mkdirSync(dir, { recursive: true }); const target = path.join(dir, "slot-" + request.slot + ".json"), temp = target + ".tmp"; const record = { version: SAVE_VERSION, savedAt: new Date().toISOString(), metadata: request.metadata || {}, payload: request.payload }; fs.writeFileSync(temp, JSON.stringify(record), { encoding: "utf8", mode: 0o600 }); fs.renameSync(temp, target); event.returnValue = { ok: true }; } catch (error) { event.returnValue = { ok: false, error: error.message }; } });
ipcMain.on("game-saves:delete", (event, slot) => { try { if (!validSaveSlot(slot)) throw new Error("Slot inválido"); const file = path.join(saveDir(), "slot-" + slot + ".json"); if (fs.existsSync(file)) fs.unlinkSync(file); event.returnValue = { ok: true }; } catch (error) { event.returnValue = { ok: false, error: error.message }; } });

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: "Não Me Deixa no Visto",
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  Menu.setApplicationMenu(null);

  win.loadFile(path.join(__dirname, "index.html"));
  win.once("ready-to-show", () => win.show());

  // Links externos abrem no navegador padrão, não dentro do jogo.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Atalho para alternar tela cheia.
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
