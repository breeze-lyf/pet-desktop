# 动态 3D 宠物 + 悬浮窗口设计

**日期**：2026-05-30  
**范围**：Meshy AI 生成 3D 模型、Three.js 渲染与程序化动画、Electron 悬浮窗口、跨窗口状态同步

---

## 目标

用户上传宠物照片后，调用 Meshy AI 生成真实 3D GLB 模型，用 Three.js 在 Electron 透明悬浮窗口中渲染，根据专注计时器状态实时切换动画行为，让宠物作为桌面常驻陪伴。

---

## 一、图像处理流程

### 3D 模型生成

- 调用腾讯云混元生3D API（`tencentcloud-sdk-nodejs-ai3d`）
- `SubmitHunyuanTo3DProJob` 提交图片，获得 `JobId`
- 主进程每 5 秒轮询 `QueryHunyuanTo3DProJob`，直到 `Status === 'DONE'`
- 从 `ResultFile3Ds` 中取 `Type === 'GLB'` 的下载 URL，保存到 Electron `userData` 目录
- `TENCENTCLOUD_SECRET_ID` / `TENCENTCLOUD_SECRET_KEY` 从 `process.env` 读取，只存在主进程

### 进度 UI

- onboarding 提交后进入等待页面，显示假进度条（30s 到 90%，完成跳 100%）
- 提示文案："通常需要 30 秒到 2 分钟"

### 降级策略

超时（3 分钟）或 API 失败时，降级到 Remove.bg 去背 + CSS 动画方案，提示用户"3D 生成失败，使用平面模式"。不阻塞 onboarding 流程。

### 数据变更

`CompanionPet` 新增字段 `modelPath: string`（本地 GLB 文件绝对路径）。`portraitDataUrl` 保留，用于降级和缩略图展示。

---

## 二、3D 渲染与动画系统

### 技术栈

新增依赖：`three`、`@react-three/fiber`、`@react-three/drei`

### 程序化动画

Meshy 生成的模型不带骨骼动画，使用 `useFrame` 驱动模型整体变换：

| mood | 动画 | 实现 |
|------|------|------|
| `idle` | 缓慢上下浮动 + 轻微自转 | `position.y` 正弦 + `rotation.y` 递增 |
| `focus` | 静止，偶尔小幅点头 | 低频随机 `rotation.x` 微扰 |
| `reminding` | 快速跳动 | `position.y` 快速弹跳 |
| `resting` | 左右摇摆 | `rotation.z` 正弦摆动 |

**点击交互**：点击模型触发一次性 `jump`（`position.y` 快速上抛后落下）

### 渲染组件结构

```tsx
<Canvas>
  <ambientLight />
  <directionalLight position={[5, 5, 5]} />
  <PetModel modelPath={modelPath} mood={mood} onClick={handleJump} />
  <OrbitControls enabled={false} />  {/* 预留，后续开启交互 */}
</Canvas>
```

### 新增文件

- `src/components/PetModel.tsx`：GLB 加载 + `useFrame` 动画逻辑
- `src/components/PetOverlay.tsx`：悬浮窗口根组件，包含 Canvas

---

## 三、悬浮窗口（Electron）

### 窗口配置

```js
{
  width: 160,
  height: 160,
  transparent: true,
  frame: false,
  alwaysOnTop: true,
  hasShadow: false,
  resizable: false,
  skipTaskbar: true
}
```

默认位置：屏幕右下角（`screenWidth - 176, screenHeight - 176`）。

### 双窗口架构

- **主窗口**（现有）：完整的专注计时器 UI，加载 `index.html`
- **悬浮窗口**：加载 `overlay.html`，仅渲染 `PetOverlay` 组件

主窗口 ready 后发送 IPC `show-pet-overlay` 创建悬浮窗口。主窗口关闭时悬浮窗同步关闭。

### 拖拽

渲染进程监听 `mousedown` + `mousemove`，通过 `electronAPI.movePetWindow(x, y)` 调用主进程 `win.setPosition()`。

### 前端入口

Vite 构建新增 `overlay.html` + `src/overlay.tsx` 作为独立入口，不加载主 App 依赖。

---

## 四、状态同步

### 数据流

```
主窗口 useFocusTimer
  → status 变化时 electronAPI.syncTimerState(status)
  → 主进程广播 timer-state-update 给所有窗口
  → PetOverlay onTimerStateChange 回调更新本地 mood
  → PetModel useFrame 切换动画行为
```

### preload.cjs 新增 API

```js
generateModel: (photoBase64) => ipcRenderer.invoke('generate-3d-model', photoBase64)
syncTimerState: (status) => ipcRenderer.send('timer-state-changed', status)
onTimerStateChange: (cb) => ipcRenderer.on('timer-state-update', (_, status) => cb(status))
movePetWindow: (x, y) => ipcRenderer.send('move-pet-window', x, y)
showPetOverlay: () => ipcRenderer.send('show-pet-overlay')
```

---

## 五、文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `electron/main.cjs` | 修改 | 新增 `generate-3d-model` IPC handler（Meshy 轮询）、悬浮窗口创建、状态广播、窗口拖拽 |
| `electron/preload.cjs` | 修改 | 新增 `generateModel`、`syncTimerState`、`onTimerStateChange`、`movePetWindow`、`showPetOverlay` |
| `overlay.html` | 新增 | 悬浮窗口 HTML 入口 |
| `src/overlay.tsx` | 新增 | 悬浮窗口 React 入口 |
| `src/components/PetOverlay.tsx` | 新增 | 悬浮窗口根组件，Canvas 容器，状态订阅 |
| `src/components/PetModel.tsx` | 新增 | GLB 加载 + useFrame 程序化动画 |
| `src/components/OnboardingPanel.tsx` | 修改 | 接入 `generateModel` IPC，进度等待 UI，降级处理 |
| `src/domain/pet.ts` | 修改 | `CompanionPet` 新增 `modelPath` 字段 |
| `src/hooks/useFocusTimer.ts` | 修改 | status 变化时调用 `syncTimerState` |
| `vite.config.ts` | 修改 | 新增 overlay 构建入口 |
| `package.json` | 修改 | 新增 `three`、`@react-three/fiber`、`@react-three/drei` 依赖 |

---

## 六、不在本次范围内

- 宠物模型的骨骼绑定与关键帧动画（程序化动画作为替代）
- 悬浮窗口位置持久化
- 3D 模型交互旋转（`OrbitControls` 预留，后续开启）
- 环境变量管理 UI（用户手动配置 `.env` 中的 `MESHY_API_KEY`）
