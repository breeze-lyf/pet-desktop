const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("node:path");
const https = require("node:https");
const fs = require("node:fs");

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    }).on("error", reject);
  });
}

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function generateMeshyModel(photoBase64) {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) throw new Error("MESHY_API_KEY not set");

  const headers = { Authorization: `Bearer ${apiKey}` };

  // Submit task
  const submitRes = await httpsPost(
    "https://api.meshy.ai/v2/image-to-3d",
    headers,
    { image_url: photoBase64, enable_pbr: false }
  );
  const submitData = JSON.parse(submitRes.body.toString());
  if (!submitData.result) throw new Error(`Meshy submit failed: ${submitRes.body}`);
  const taskId = submitData.result;

  // Poll until SUCCEEDED or timeout
  const deadline = Date.now() + 3 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await httpsGet(`https://api.meshy.ai/v2/image-to-3d/${taskId}`, headers);
    const pollData = JSON.parse(pollRes.body.toString());
    if (pollData.status === "SUCCEEDED") {
      const glbUrl = pollData.model_urls?.glb;
      if (!glbUrl) throw new Error("No GLB URL in response");

      // Download GLB
      const dlRes = await httpsGet(glbUrl, {});
      const dest = path.join(app.getPath("userData"), `pet-${taskId}.glb`);
      fs.writeFileSync(dest, dlRes.body);
      return dest;
    }
    if (pollData.status === "FAILED" || pollData.status === "EXPIRED") {
      throw new Error(`Meshy task ${pollData.status}`);
    }
  }
  throw new Error("Meshy generation timed out");
}

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

let overlayWindow = null;

function registerIpcHandlers() {
  ipcMain.handle("generate-3d-model", async (_event, photoBase64) => {
    return generateMeshyModel(photoBase64);
  });

  ipcMain.on("timer-state-changed", (event, status) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("timer-state-update", status);
    });
  });

  ipcMain.on("move-pet-window", (event, x, y) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setPosition(Math.round(x), Math.round(y));
  });

  ipcMain.on("show-pet-overlay", () => {
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

    if (process.env.VITE_DEV_SERVER_URL) {
      overlayWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}overlay.html`);
    } else {
      overlayWindow.loadFile(path.join(__dirname, "../dist/overlay.html"));
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
