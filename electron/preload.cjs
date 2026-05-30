const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("petDesktop", {
  platform: process.platform
});
