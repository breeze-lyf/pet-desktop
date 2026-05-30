const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("node:path");
const https = require("node:https");
const fs = require("node:fs");
const { ai3d } = require("tencentcloud-sdk-nodejs-ai3d");

function createHunyuanClient() {
  const secretId = process.env.TENCENTCLOUD_SECRET_ID;
  const secretKey = process.env.TENCENTCLOUD_SECRET_KEY;
  if (!secretId || !secretKey) throw new Error("TENCENTCLOUD_SECRET_ID / TENCENTCLOUD_SECRET_KEY not set");
  return new ai3d.v20250513.Client({
    credential: { secretId, secretKey },
    region: "ap-guangzhou",
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const MAX_BYTES = 50 * 1024 * 1024;
    https.get(url, (res) => {
      if (res.statusCode >= 400) {
        reject(new Error(`GLB download failed with status ${res.statusCode}`));
        res.resume();
        return;
      }
      const chunks = [];
      let total = 0;
      res.on("data", (c) => {
        total += c.length;
        if (total > MAX_BYTES) { reject(new Error("GLB file exceeds 50 MB limit")); res.destroy(); return; }
        chunks.push(c);
      });
      res.on("end", () => fs.promises.writeFile(dest, Buffer.concat(chunks)).then(resolve).catch(reject));
    }).on("error", reject);
  });
}

async function generateHunyuanModel(photoBase64) {
  const client = createHunyuanClient();

  const imageBase64 = photoBase64.startsWith("data:")
    ? photoBase64.replace(/^data:[^;]+;base64,/, "")
    : photoBase64;

  const { JobId } = await client.SubmitHunyuanTo3DProJob({
    ImageBase64: imageBase64,
    Model: "3.0",
    EnablePBR: false,
  });

  const deadline = Date.now() + 3 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await client.QueryHunyuanTo3DProJob({ JobId });
    if (res.Status === "DONE") {
      const glb = (res.ResultFile3Ds || []).find((f) => f.Type === "GLB");
      if (!glb?.Url) throw new Error("Hunyuan3D returned no GLB URL");
      const dest = path.join(app.getPath("userData"), `pet-${JobId}.glb`);
      await downloadFile(glb.Url, dest);
      return dest;
    }
    if (res.Status === "FAIL") throw new Error(`Hunyuan3D failed: ${res.ErrorMessage || "unknown error"}`);
  }
  throw new Error("Hunyuan3D generation timed out");
}

let overlayWindow = null;

function createWindow() {
  const window = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    title: "Pet Rest Companion",
    backgroundColor: "#f4f7fb",
    alwaysOnTop: false,
    transparent: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    window.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  window.on("closed", () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.close();
    }
  });
}

function registerIpcHandlers() {
  ipcMain.handle("generate-3d-model", async (_event, photoBase64) => {
    return generateHunyuanModel(photoBase64);
  });

  ipcMain.on("timer-state-changed", (event, status) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win.webContents !== event.sender) {
        win.webContents.send("timer-state-update", status);
      }
    });
  });

  ipcMain.on("move-pet-window", (event, x, y) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setPosition(Math.round(x), Math.round(y));
  });

  ipcMain.on("show-pet-overlay", (event, modelPath) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.show();
      return;
    }
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    overlayWindow = new BrowserWindow({
      width: 160,
      height: 160,
      x: width - 176,
      y: height - 176,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      hasShadow: false,
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    const encodedPath = modelPath ? `?modelPath=${encodeURIComponent(modelPath)}` : "";
    if (process.env.VITE_DEV_SERVER_URL) {
      overlayWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}overlay.html${encodedPath}`);
    } else {
      overlayWindow.loadFile(path.join(__dirname, "../dist/overlay.html"), {
        query: modelPath ? { modelPath } : undefined
      });
    }

    overlayWindow.on("closed", () => { overlayWindow = null; });
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
