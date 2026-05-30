const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  generateModel: (photoBase64) => ipcRenderer.invoke("generate-3d-model", photoBase64),
  syncTimerState: (status) => ipcRenderer.send("timer-state-changed", status),
  onTimerStateChange: (cb) => {
    const handler = (_, status) => cb(status);
    ipcRenderer.on("timer-state-update", handler);
    return () => ipcRenderer.removeListener("timer-state-update", handler);
  },
  movePetWindow: (x, y) => ipcRenderer.send("move-pet-window", x, y),
  showPetOverlay: (modelPath) => ipcRenderer.send("show-pet-overlay", modelPath),
  platform: process.platform
});
