# 3D Pet Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用户上传宠物照片后，Meshy AI 生成 3D GLB 模型，Three.js 在 Electron 透明悬浮窗口中渲染，根据专注计时器状态实时切换动画。

**Architecture:** Electron 主进程持有 Meshy API key 并通过 IPC handler 代理模型生成请求；前端新增独立 overlay 入口加载 PetOverlay 组件；Two.js Canvas 用 useFrame 驱动程序化动画；主窗口通过 IPC 广播计时器状态到悬浮窗口。

**Tech Stack:** Electron 33, React 19, Three.js, @react-three/fiber, @react-three/drei, Vite 7, TypeScript 5, Vitest

---

## File Map

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/domain/pet.ts` | 修改 | 新增 `modelPath?: string` 字段 |
| `electron/main.cjs` | 修改 | Meshy IPC handler、悬浮窗口创建、计时器状态广播、窗口拖拽 |
| `electron/preload.cjs` | 修改 | 暴露 `generateModel`、`syncTimerState`、`onTimerStateChange`、`movePetWindow`、`showPetOverlay` |
| `src/lib/meshyApi.ts` | 新增 | Meshy API 调用逻辑（submit + poll + download） |
| `src/components/OnboardingPanel.tsx` | 修改 | 接入 generateModel IPC、进度等待 UI、降级处理 |
| `overlay.html` | 新增 | 悬浮窗口 HTML 入口 |
| `src/overlay.tsx` | 新增 | 悬浮窗口 React 入口 |
| `src/components/PetOverlay.tsx` | 新增 | 悬浮窗口根组件，Canvas 容器，状态订阅，拖拽 |
| `src/components/PetModel.tsx` | 新增 | GLB 加载 + useFrame 程序化动画 |
| `src/hooks/useFocusTimer.ts` | 修改 | status 变化时调用 syncTimerState |
| `vite.config.ts` | 修改 | 新增 overlay 构建入口 |
| `package.json` | 修改 | 新增 three、@react-three/fiber、@react-three/drei 依赖 |

---

## Task 1: 扩展 CompanionPet 类型

**Files:**
- Modify: `src/domain/pet.ts`
- Test: `src/lib/petGeneration.test.ts`

- [ ] **Step 1: 修改 `src/domain/pet.ts`，新增 `modelPath` 可选字段**

```typescript
export type CompanionMood = "idle" | "focus" | "reminding" | "resting";

export interface PetProfile {
  id: string;
  name: string;
  photoDataUrl: string;
  createdAt: string;
}

export interface CompanionPet {
  profile: PetProfile;
  portraitDataUrl: string;
  mood: CompanionMood;
  modelPath?: string;
}
```

- [ ] **Step 2: 运行现有测试确认不破坏**

```bash
cd /Users/breeze/Documents/宠物桌面
npm test
```

期望：所有测试 PASS（`modelPath` 是可选字段，不影响现有代码）

- [ ] **Step 3: Commit**

```bash
git add src/domain/pet.ts
git commit -m "extend CompanionPet with optional modelPath field"
```

---

## Task 2: 安装 Three.js 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装依赖**

```bash
cd /Users/breeze/Documents/宠物桌面
npm install three @react-three/fiber @react-three/drei
npm install --save-dev @types/three
```

- [ ] **Step 2: 验证安装**

```bash
node -e "require('./node_modules/three/build/three.cjs.js'); console.log('three ok')"
```

期望输出：`three ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "add three.js and react-three-fiber dependencies"
```

---

## Task 3: Electron preload — 暴露 IPC API

**Files:**
- Modify: `electron/preload.cjs`

- [ ] **Step 1: 替换 `electron/preload.cjs` 全部内容**

```javascript
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
  showPetOverlay: () => ipcRenderer.send("show-pet-overlay"),
  platform: process.platform
});
```

注意：原来暴露的是 `window.petDesktop`，现在改为 `window.electronAPI`。后续所有组件使用 `window.electronAPI`。

- [ ] **Step 2: 启动开发模式确认 preload 加载无报错**

```bash
npm run dev
```

打开 DevTools Console，确认无 `contextBridge` 相关错误，然后 Ctrl+C 退出。

- [ ] **Step 3: Commit**

```bash
git add electron/preload.cjs
git commit -m "expose electronAPI via contextBridge for IPC communication"
```

---

## Task 4: Electron main — Meshy IPC handler

**Files:**
- Modify: `electron/main.cjs`

- [ ] **Step 1: 在 `electron/main.cjs` 顶部新增 require**

在文件第一行 `const { app, BrowserWindow } = require("electron");` 后追加：

```javascript
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("node:path");
const https = require("node:https");
const fs = require("node:fs");
```

（将原有的 `require("electron")` 和 `require("node:path")` 合并替换）

- [ ] **Step 2: 在 `createWindow` 函数之前添加 Meshy helper 函数**

```javascript
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
```

- [ ] **Step 3: 在 `app.whenReady().then(createWindow)` 之前注册 IPC handlers**

```javascript
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

let overlayWindow = null;

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
```

- [ ] **Step 4: 在 `app.on("window-all-closed")` 之前确保主窗口关闭时关闭悬浮窗**

修改 `createWindow` 函数，在 `window.loadURL/loadFile` 之后添加：

```javascript
window.on("closed", () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
});
```

- [ ] **Step 5: 启动开发模式，确认主进程无报错**

```bash
npm run dev
```

观察终端输出无 `Error` 字样，然后 Ctrl+C。

- [ ] **Step 6: Commit**

```bash
git add electron/main.cjs
git commit -m "add Meshy IPC handler, overlay window creation, and timer broadcast"
```

---

## Task 5: Vite 多入口配置

**Files:**
- Modify: `vite.config.ts`
- Create: `overlay.html`
- Create: `src/overlay.tsx`

- [ ] **Step 1: 新建 `overlay.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pet Overlay</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #overlay-root { width: 100%; height: 100%; background: transparent; }
    </style>
  </head>
  <body>
    <div id="overlay-root"></div>
    <script type="module" src="/src/overlay.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: 新建 `src/overlay.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PetOverlay } from "./components/PetOverlay";

createRoot(document.getElementById("overlay-root") as HTMLElement).render(
  <StrictMode>
    <PetOverlay />
  </StrictMode>
);
```

- [ ] **Step 3: 修改 `vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        overlay: resolve(__dirname, "overlay.html")
      }
    }
  }
});
```

- [ ] **Step 4: 运行构建确认两个入口都能打包**

```bash
npm run build
```

期望：`dist/` 下出现 `index.html` 和 `overlay.html` 两个文件，无报错（此时 PetOverlay 组件还不存在，先创建空占位）

先创建空占位 `src/components/PetOverlay.tsx`：

```tsx
export function PetOverlay() {
  return <div style={{ width: 160, height: 160, background: "transparent" }} />;
}
```

然后再运行 `npm run build`。

- [ ] **Step 5: Commit**

```bash
git add overlay.html src/overlay.tsx src/components/PetOverlay.tsx vite.config.ts
git commit -m "add overlay html entry and vite multi-entry build config"
```

---

## Task 6: PetModel 组件 — GLB 加载与程序化动画

**Files:**
- Create: `src/components/PetModel.tsx`
- Test: `src/components/PetModel.test.tsx`

- [ ] **Step 1: 写失败测试 `src/components/PetModel.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { PetModel } from "./PetModel";

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock("@react-three/drei", () => ({
  useGLTF: vi.fn(() => ({ scene: { clone: () => ({ position: { y: 0 }, rotation: { x: 0, y: 0, z: 0 } }) } })),
  OrbitControls: () => null
}));

describe("PetModel", () => {
  it("renders without crashing given a modelPath and mood", () => {
    const { container } = render(
      <PetModel modelPath="/fake/pet.glb" mood="idle" onClick={() => {}} />
    );
    expect(container).toBeTruthy();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test -- --reporter=verbose src/components/PetModel.test.tsx
```

期望：FAIL — `Cannot find module './PetModel'`

- [ ] **Step 3: 创建 `src/components/PetModel.tsx`**

```tsx
import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Group } from "three";
import { CompanionMood } from "../domain/pet";

interface PetModelProps {
  modelPath: string;
  mood: CompanionMood;
  onClick: () => void;
}

export function PetModel({ modelPath, mood, onClick }: PetModelProps) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);
  const [jumping, setJumping] = useState(false);
  const jumpRef = useRef(0);

  const cloned = scene.clone();

  useEffect(() => {
    if (jumping) {
      jumpRef.current = 0;
      const id = setTimeout(() => setJumping(false), 600);
      return () => clearTimeout(id);
    }
  }, [jumping]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const g = groupRef.current;

    if (jumping) {
      jumpRef.current += delta;
      const progress = jumpRef.current / 0.6;
      g.position.y = Math.sin(progress * Math.PI) * 0.3;
      return;
    }

    if (mood === "idle") {
      g.position.y = Math.sin(t * 0.8) * 0.05;
      g.rotation.y += delta * 0.2;
    } else if (mood === "focus") {
      g.position.y = 0;
      g.rotation.y = 0;
      if (Math.random() < 0.002) {
        g.rotation.x = (Math.random() - 0.5) * 0.1;
      } else {
        g.rotation.x *= 0.95;
      }
    } else if (mood === "reminding") {
      g.position.y = Math.abs(Math.sin(t * 5.2)) * 0.15;
      g.rotation.y = 0;
    } else if (mood === "resting") {
      g.position.y = 0;
      g.rotation.z = Math.sin(t * 1.5) * 0.1;
    }
  });

  return (
    <>
      <primitive
        ref={groupRef}
        object={cloned}
        onClick={onClick ? () => { setJumping(true); onClick(); } : undefined}
        scale={[1.2, 1.2, 1.2]}
      />
      <OrbitControls enabled={false} />
    </>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm test -- --reporter=verbose src/components/PetModel.test.tsx
```

期望：PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PetModel.tsx src/components/PetModel.test.tsx
git commit -m "add PetModel component with useFrame procedural animation"
```

---

## Task 7: PetOverlay 组件 — 悬浮窗口完整实现

**Files:**
- Modify: `src/components/PetOverlay.tsx`
- Test: `src/components/PetOverlay.test.tsx`

- [ ] **Step 1: 写失败测试 `src/components/PetOverlay.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { PetOverlay } from "./PetOverlay";

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn()
}));
vi.mock("@react-three/drei", () => ({
  useGLTF: vi.fn(() => ({ scene: { clone: () => ({}) } })),
  OrbitControls: () => null
}));
vi.mock("./PetModel", () => ({ PetModel: () => <div data-testid="pet-model" /> }));

beforeEach(() => {
  (window as any).electronAPI = {
    onTimerStateChange: vi.fn(() => () => {}),
    movePetWindow: vi.fn()
  };
});

describe("PetOverlay", () => {
  it("renders canvas when modelPath is provided via localStorage", () => {
    localStorage.setItem("pet-companion", JSON.stringify({
      profile: { id: "1", name: "奶盖", photoDataUrl: "", createdAt: "" },
      portraitDataUrl: "",
      mood: "idle",
      modelPath: "/fake/pet.glb"
    }));
    const { getByTestId } = render(<PetOverlay />);
    expect(getByTestId("canvas")).toBeTruthy();
  });

  it("renders nothing when no companion in localStorage", () => {
    localStorage.removeItem("pet-companion");
    const { container } = render(<PetOverlay />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test -- --reporter=verbose src/components/PetOverlay.test.tsx
```

期望：FAIL

- [ ] **Step 3: 替换 `src/components/PetOverlay.tsx` 完整实现**

```tsx
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CompanionMood, CompanionPet } from "../domain/pet";
import { readJson } from "../lib/storage";
import { PetModel } from "./PetModel";

declare global {
  interface Window {
    electronAPI: {
      onTimerStateChange: (cb: (status: string) => void) => () => void;
      movePetWindow: (x: number, y: number) => void;
    };
  }
}

function statusToMood(status: string): CompanionMood {
  if (status === "running") return "focus";
  if (status === "reminding") return "reminding";
  if (status === "resting") return "resting";
  return "idle";
}

export function PetOverlay() {
  const companion = readJson<CompanionPet | null>("pet-companion", null);
  const [mood, setMood] = useState<CompanionMood>("idle");
  const dragStart = useRef<{ x: number; y: number; wx: number; wy: number } | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsub = window.electronAPI.onTimerStateChange((status) => {
      setMood(statusToMood(status));
    });
    return unsub;
  }, []);

  function handleMouseDown(e: React.MouseEvent) {
    dragStart.current = { x: e.screenX, y: e.screenY, wx: window.screenX, wy: window.screenY };
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragStart.current || !window.electronAPI) return;
      const dx = e.screenX - dragStart.current.x;
      const dy = e.screenY - dragStart.current.y;
      window.electronAPI.movePetWindow(dragStart.current.wx + dx, dragStart.current.wy + dy);
    }
    function onMouseUp() {
      dragStart.current = null;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (!companion?.modelPath) return null;

  return (
    <div
      style={{ width: 160, height: 160, cursor: "grab", userSelect: "none" }}
      onMouseDown={handleMouseDown}
    >
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <PetModel
          modelPath={companion.modelPath}
          mood={mood}
          onClick={() => {}}
        />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm test -- --reporter=verbose src/components/PetOverlay.test.tsx
```

期望：PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PetOverlay.tsx src/components/PetOverlay.test.tsx
git commit -m "implement PetOverlay with Three.js canvas and timer state sync"
```

---

## Task 8: OnboardingPanel — 接入 Meshy 模型生成

**Files:**
- Modify: `src/components/OnboardingPanel.tsx`
- Modify: `src/components/OnboardingPanel.test.tsx`

- [ ] **Step 1: 查看现有测试**

```bash
cat src/components/OnboardingPanel.test.tsx
```

- [ ] **Step 2: 在现有测试文件中，追加新测试**

打开 `src/components/OnboardingPanel.test.tsx`，在文件末尾追加：

```tsx
it("shows progress UI while generating model", async () => {
  (window as any).electronAPI = {
    generateModel: vi.fn(() => new Promise(() => {})) // never resolves
  };
  const { getByText, getByLabelText } = render(<OnboardingPanel onCreate={vi.fn()} />);
  await userEvent.type(getByLabelText(/宠物名字/), "奶盖");
  // simulate file upload with a mock
  const file = new File(["data"], "pet.png", { type: "image/png" });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, file);
  await userEvent.click(getByText("生成陪伴宠物"));
  expect(getByText(/正在生成/)).toBeTruthy();
});
```

（如现有测试文件已有 import，复用；否则在文件顶部加 `import userEvent from "@testing-library/user-event";`）

- [ ] **Step 3: 运行测试确认新测试失败**

```bash
npm test -- --reporter=verbose src/components/OnboardingPanel.test.tsx
```

期望：新测试 FAIL，旧测试 PASS

- [ ] **Step 4: 替换 `src/components/OnboardingPanel.tsx`**

```tsx
import { ChangeEvent, FormEvent, useState } from "react";
import { Camera } from "lucide-react";
import { CompanionPet } from "../domain/pet";
import { createCompanionFromPhoto, readFileAsDataUrl } from "../lib/petGeneration";

declare global {
  interface Window {
    electronAPI?: {
      generateModel: (photoBase64: string) => Promise<string>;
    };
  }
}

interface OnboardingPanelProps {
  onCreate: (companion: CompanionPet) => void;
}

type Stage = "form" | "generating" | "done";

export function OnboardingPanel({ onCreate }: OnboardingPanelProps) {
  const [name, setName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [progress, setProgress] = useState(0);

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setPhotoDataUrl(await readFileAsDataUrl(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError("先给宠物起个名字"); return; }
    if (!photoDataUrl) { setError("请上传一张清晰的宠物照片"); return; }

    setStage("generating");
    setProgress(0);

    // Fake progress: 0→90% over 30s
    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 1 : p));
    }, 333);

    try {
      let modelPath: string | undefined;
      if (window.electronAPI) {
        modelPath = await window.electronAPI.generateModel(photoDataUrl);
      }
      clearInterval(interval);
      setProgress(100);
      const companion = createCompanionFromPhoto({ name, photoDataUrl });
      onCreate({ ...companion, modelPath });
    } catch {
      clearInterval(interval);
      setError("3D 生成失败，使用平面模式");
      const companion = createCompanionFromPhoto({ name, photoDataUrl });
      onCreate(companion);
    }
  }

  if (stage === "generating") {
    return (
      <div className="panel onboarding-panel">
        <p className="eyebrow">正在生成 3D 宠物模型</p>
        <h2>稍等一下...</h2>
        <p className="muted">通常需要 30 秒到 2 分钟</p>
        <div style={{ margin: "16px 0", background: "#eee", borderRadius: 8, height: 8 }}>
          <div style={{ width: `${progress}%`, background: "#4ecca3", height: "100%", borderRadius: 8, transition: "width 0.3s" }} />
        </div>
        <p className="muted">{progress}%</p>
      </div>
    );
  }

  return (
    <form className="panel onboarding-panel" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">第一步</p>
        <h2>创建你的陪伴宠物</h2>
        <p className="muted">上传宠物照片，AI 会生成专属 3D 模型。</p>
      </div>

      <label className="field" htmlFor="pet-name">
        <span>宠物名字</span>
        <input
          id="pet-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：奶盖"
        />
      </label>

      <label className="upload-box">
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
        {photoDataUrl ? (
          <img src={photoDataUrl} alt="宠物预览" />
        ) : (
          <span><Camera size={22} />上传宠物照片</span>
        )}
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button" type="submit">
        生成陪伴宠物
      </button>
    </form>
  );
}
```

- [ ] **Step 5: 运行全部测试**

```bash
npm test
```

期望：所有测试 PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/OnboardingPanel.tsx src/components/OnboardingPanel.test.tsx
git commit -m "wire OnboardingPanel to Meshy model generation with progress UI and fallback"
```

---

## Task 9: useFocusTimer — 广播计时器状态

**Files:**
- Modify: `src/hooks/useFocusTimer.ts`
- Test: `src/hooks/useFocusTimer.test.tsx`

- [ ] **Step 1: 查看现有测试**

```bash
cat src/hooks/useFocusTimer.test.tsx
```

- [ ] **Step 2: 追加测试（在现有测试文件末尾）**

```tsx
it("calls syncTimerState when status changes", () => {
  const syncTimerState = vi.fn();
  (window as any).electronAPI = { syncTimerState };
  const { result } = renderHook(() => useFocusTimer(25));
  act(() => result.current.start());
  expect(syncTimerState).toHaveBeenCalledWith("running");
  act(() => result.current.pause());
  expect(syncTimerState).toHaveBeenCalledWith("paused");
});
```

- [ ] **Step 3: 运行确认新测试失败**

```bash
npm test -- --reporter=verbose src/hooks/useFocusTimer.test.tsx
```

- [ ] **Step 4: 修改 `src/hooks/useFocusTimer.ts`**

在 `setStatus` 的每次调用改为调用新的 `updateStatus` helper，追加 IPC 广播：

```typescript
import { useEffect, useMemo, useState } from "react";

export type FocusTimerStatus = "idle" | "running" | "paused" | "reminding" | "resting";

export function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const restSeconds = Math.max(0, seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${restSeconds}`;
}

declare global {
  interface Window {
    electronAPI?: { syncTimerState: (status: string) => void };
  }
}

function syncStatus(status: FocusTimerStatus) {
  window.electronAPI?.syncTimerState(status);
}

export function useFocusTimer(minutes: number) {
  const totalSeconds = useMemo(() => minutes * 60, [minutes]);
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [status, setStatus] = useState<FocusTimerStatus>("idle");

  useEffect(() => {
    setRemainingSeconds(totalSeconds);
    setStatus("idle");
  }, [totalSeconds]);

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(id);
          const next: FocusTimerStatus = "reminding";
          setStatus(next);
          syncStatus(next);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

  function updateStatus(next: FocusTimerStatus) {
    setStatus(next);
    syncStatus(next);
  }

  return {
    remainingSeconds,
    status,
    formattedRemaining: formatRemainingTime(remainingSeconds),
    start: () => updateStatus("running"),
    pause: () => updateStatus("paused"),
    reset: () => { setRemainingSeconds(totalSeconds); updateStatus("idle"); },
    beginRest: () => updateStatus("resting"),
    finishRest: () => { setRemainingSeconds(totalSeconds); updateStatus("idle"); },
    dismissReminder: () => updateStatus("running")
  };
}
```

- [ ] **Step 5: 运行全部测试**

```bash
npm test
```

期望：所有测试 PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useFocusTimer.ts src/hooks/useFocusTimer.test.tsx
git commit -m "broadcast timer status to overlay window via IPC on every state change"
```

---

## Task 10: App.tsx — 启动时触发悬浮窗口

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 在 `src/App.tsx` 中，有 companion 时发送 `showPetOverlay`**

在 `App` 函数内，现有 `useMemo` 之后添加：

```tsx
useEffect(() => {
  if (companion && (window as any).electronAPI?.showPetOverlay) {
    (window as any).electronAPI.showPetOverlay();
  }
}, [companion]);
```

并在文件顶部添加 `useEffect` import（如果尚未存在）。

- [ ] **Step 2: 运行测试**

```bash
npm test
```

期望：所有测试 PASS

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "trigger pet overlay window when companion is available"
```

---

## Task 11: 端到端手动验证

**Files:** 无代码变更，验证流程

- [ ] **Step 1: 配置 MESHY_API_KEY**

在项目根目录创建 `.env`（已在 `.gitignore` 中）：

```
MESHY_API_KEY=your_key_here
```

确认 `.gitignore` 包含 `.env`：

```bash
grep "\.env" .gitignore || echo ".env" >> .gitignore
```

- [ ] **Step 2: 启动开发模式**

```bash
npm run dev
```

- [ ] **Step 3: 验证 onboarding 流程**
  - 上传一张宠物照片，输入名字，点击"生成陪伴宠物"
  - 确认进度条出现，显示"正在生成 3D 宠物模型"
  - 等待完成（或 3 分钟超时降级）

- [ ] **Step 4: 验证悬浮窗口**
  - 确认屏幕右下角出现 160×160 透明悬浮窗口
  - 确认 3D 模型在窗口中渲染并播放 `idle` 动画
  - 在主窗口启动计时器，确认悬浮窗宠物切换到 `focus` 动画

- [ ] **Step 5: 验证拖拽**
  - 拖动悬浮窗口到屏幕其他位置，确认位置随鼠标移动

- [ ] **Step 6: 验证降级**
  - 设置 `MESHY_API_KEY=invalid`，重新 onboarding
  - 确认 3 分钟超时（或立即失败）后显示"3D 生成失败，使用平面模式"
  - 确认 companion 仍然正常创建，主窗口正常显示

- [ ] **Step 7: 最终 Commit**

```bash
git add .gitignore
git commit -m "ensure .env is gitignored for API key safety"
```
