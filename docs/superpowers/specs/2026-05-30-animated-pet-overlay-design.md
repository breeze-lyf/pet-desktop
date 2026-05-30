# 动态宠物 + 悬浮窗口设计

**日期**：2026-05-30  
**范围**：照片去背处理、2.5D 动画系统、Electron 悬浮窗口、跨窗口状态同步

---

## 目标

用户上传宠物照片后，经 AI 去背处理生成透明 PNG，配合丰富的 CSS 动画系统让宠物"活起来"。同时新增一个透明圆形悬浮窗口贴在屏幕角落，始终可见，与主窗口计时器状态实时同步。

---

## 一、图像处理流程

### 去背

- 调用 Remove.bg API（`api.remove.bg/v1.0/removebg`）
- 由 Electron **主进程**发起 HTTP 请求，API key 从 `process.env.REMOVE_BG_API_KEY` 读取
- 渲染进程通过 IPC handler `remove-background` 触发，传入原图 base64，返回透明 PNG base64
- API key 不暴露到任何渲染进程代码

### 降级策略

Remove.bg 请求失败时，OnboardingPanel 使用原图 + 圆形 `clip-path` 裁剪作为兜底，不阻塞 onboarding 流程。界面提示"去背失败，使用原图"。

### 数据影响

`CompanionPet.portraitDataUrl` 存储去背后的透明 PNG base64（或降级时的原图）。`profile.photoDataUrl` 保留原始照片不变。

---

## 二、动画系统

### 状态动画

全部使用 CSS keyframes，无 JS 动画库。`CompanionStage` 根据 `mood` prop 切换 className。

| mood | 动画名 | 描述 |
|------|--------|------|
| `idle` | `breathing` | 缓慢缩放 0.97→1.03，2.5s 循环 |
| `focus` | `floating` | 上下浮动 ±4px，3s 循环 |
| `reminding` | `bouncing` | 快速弹跳，0.6s 循环 |
| `resting` | `swaying` | 左右摇摆 ±6deg，2s 循环 |

### 交互动画

- **点击**：触发 `jump` 动画（跳起落下，播放一次），通过临时添加/移除 class 实现
- **hover**：scale 1.08 + tooltip 渐显（CSS transition）
- **随机小动作**：`useRandomPetAction` hook，每隔 25~40s 随机触发 `headtilt` class，持续 1s 后移除

### 新增文件

- `src/styles/animations.css`：所有 keyframe 定义
- `src/hooks/useRandomPetAction.ts`：随机动作 hook

---

## 三、悬浮窗口（Electron）

### 窗口配置

```js
{
  width: 96,
  height: 96,
  transparent: true,
  frame: false,
  alwaysOnTop: true,
  hasShadow: false,
  resizable: false,
  skipTaskbar: true
}
```

默认位置：屏幕右下角（`screenWidth - 112, screenHeight - 112`）。

### 双窗口架构

- **主窗口**（现有）：完整的专注计时器 UI
- **悬浮窗口**：加载 `/overlay` 路由，仅渲染 `PetOverlay` 组件

主窗口 ready 后，通过 IPC `show-pet-overlay` 通知主进程创建悬浮窗口。主窗口关闭时悬浮窗同步关闭。

### 拖拽

渲染进程监听 `mousedown` + `mousemove`，通过 `window.electronAPI.movePetWindow(x, y)` 调用主进程 `win.setPosition()`。

### 前端路由

Vite 构建新增 `/overlay` 入口（`src/overlay.tsx`），独立 HTML 文件 `overlay.html`，避免加载主 App 的全部依赖。

---

## 四、状态同步

### 数据流

```
主窗口 useFocusTimer
  → status 变化时 electronAPI.syncTimerState(status)
  → 主进程收到，广播给悬浮窗口
  → PetOverlay 的 onTimerStateChange 回调更新本地 mood state
```

### preload.cjs 新增 API

```js
syncTimerState: (status) => ipcRenderer.send('timer-state-changed', status)
onTimerStateChange: (cb) => ipcRenderer.on('timer-state-update', (_, status) => cb(status))
```

---

## 五、文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `electron/main.cjs` | 修改 | 新增 `remove-background` IPC handler，悬浮窗口创建逻辑，状态广播 |
| `electron/preload.cjs` | 修改 | 新增 `removeBackground`、`syncTimerState`、`onTimerStateChange`、`movePetWindow` |
| `overlay.html` | 新增 | 悬浮窗口 HTML 入口 |
| `src/overlay.tsx` | 新增 | 悬浮窗口 React 入口 |
| `src/components/PetOverlay.tsx` | 新增 | 悬浮窗口宠物组件 |
| `src/hooks/useRandomPetAction.ts` | 新增 | 随机小动作 hook |
| `src/styles/animations.css` | 新增 | 所有 keyframe 定义 |
| `src/lib/petGeneration.ts` | 修改 | 新增 `removeBackground()` 调用逻辑 |
| `src/components/OnboardingPanel.tsx` | 修改 | 接入去背流程，处理降级 |
| `src/components/CompanionStage.tsx` | 修改 | 动画 className 切换，点击/hover 交互 |
| `src/hooks/useFocusTimer.ts` | 修改 | status 变化时调用 syncTimerState |
| `vite.config.ts` | 修改 | 新增 overlay 构建入口 |

---

## 六、不在本次范围内

- 宠物照片的 AI 风格化（卡通化）处理
- 悬浮窗口的位置持久化（下一迭代）
- 环境变量管理 UI（用户在 `.env` 文件中手动配置 `REMOVE_BG_API_KEY`）
