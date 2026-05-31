const dotenvResult = require("dotenv").config({ path: require("node:path").join(process.cwd(), ".env") });
console.log("[env] dotenv path:", require("node:path").join(process.cwd(), ".env"));
console.log("[env] ARK_API_KEY:", process.env.ARK_API_KEY ? process.env.ARK_API_KEY.slice(0, 12) + "..." : "NOT SET");
if (dotenvResult.error) console.error("[env] dotenv error:", dotenvResult.error.message);
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("node:path");
const https = require("node:https");
const fs = require("node:fs");

async function downloadToFile(url, dest) {
  return new Promise((resolve, reject) => {
    const MAX_BYTES = 20 * 1024 * 1024;
    https.get(url, (res) => {
      if (res.statusCode >= 400) { reject(new Error(`Download failed: ${res.statusCode}`)); res.resume(); return; }
      const chunks = [];
      let total = 0;
      res.on("data", (c) => {
        total += c.length;
        if (total > MAX_BYTES) { reject(new Error("Image exceeds 20 MB")); res.destroy(); return; }
        chunks.push(c);
      });
      res.on("end", () => fs.promises.writeFile(dest, Buffer.concat(chunks)).then(resolve).catch(reject));
    }).on("error", reject);
  });
}

async function generateCartoonPortrait(photoBase64) {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) throw new Error("ARK_API_KEY not set");

  const imageData = photoBase64.startsWith("data:") ? photoBase64 : `data:image/jpeg;base64,${photoBase64}`;

  const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "doubao-seedream-5-0-260128",
      prompt: `以下图片中的宠物，转换为可爱日系卡通贴纸风格，保留宠物脸部特征，白色简洁背景`,
      image: imageData,
      response_format: "url",
      size: "2K",
      watermark: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ark API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const imageUrl = json.data?.[0]?.url;
  if (!imageUrl) throw new Error("No image URL in response");

  const dest = path.join(app.getPath("userData"), `pet-cartoon-${Date.now()}.png`);
  await downloadToFile(imageUrl, dest);
  return dest;
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
  ipcMain.handle("read-file-as-base64", async (_event, filePath) => {
    const data = await fs.promises.readFile(filePath);
    return `data:image/png;base64,${data.toString("base64")}`;
  });

  ipcMain.handle("generate-3d-model", async (_event, photoBase64) => {
    try {
      const result = await generateCartoonPortrait(photoBase64);
      console.log("[generateCartoonPortrait] success:", result);
      return result;
    } catch (err) {
      console.error("[generateCartoonPortrait] error:", err.message);
      throw err;
    }
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

  ipcMain.on("show-pet-overlay", (event, cartoonPath) => {
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

    const encodedPath = cartoonPath ? `?cartoonPath=${encodeURIComponent(cartoonPath)}` : "";
    if (process.env.VITE_DEV_SERVER_URL) {
      overlayWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}overlay.html${encodedPath}`);
    } else {
      overlayWindow.loadFile(path.join(__dirname, "../dist/overlay.html"), {
        query: cartoonPath ? { cartoonPath } : undefined
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
