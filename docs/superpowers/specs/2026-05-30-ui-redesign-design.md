# UI 重设计设计文档

**日期**：2026-05-30
**范围**：主界面、Onboarding 页面的视觉重设计

---

## 设计方向

**调性**：温暖可爱风
**配色**：薰衣草紫系
**布局**：单卡片聚焦

---

## 设计令牌

### 颜色

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--color-primary` | `#8B5CF6` | 主按钮、选中态、强调色 |
| `--color-primary-dark` | `#7C3AED` | 按钮渐变终止色 |
| `--color-primary-light` | `#C4B5FD` | 头像渐变、装饰 |
| `--color-primary-muted` | `#EDE4FF` | 未选中芯片、输入框背景、分割线 |
| `--color-bg-app` | `linear-gradient(145deg, #F8F3FF, #EDE4FF, #E8D8FF)` | App 背景渐变 |
| `--color-bg-card` | `rgba(255,255,255,0.82)` | 卡片背景（玻璃磨砂） |
| `--color-bg-window` | `#2A1452` | 窗口标题栏 |
| `--color-text-title` | `#2D1470` | 标题文字 |
| `--color-text-body` | `#4C2A8A` | 正文、标签 |
| `--color-text-muted` | `#9D8AC7` | 次要文字 |
| `--color-text-eyebrow` | `#A78BFA` | 小标签/eyebrow |
| `--color-border` | `#D8CCF5` | 输入框边框 |
| `--color-status-online` | `#34D399` | 在线状态绿点 |

### 圆角

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--radius-card` | `24px` | 主卡片 |
| `--radius-button` | `14px` | 主按钮 |
| `--radius-chip` | `10px` | 时长芯片 |
| `--radius-input` | `12px` | 输入框 |
| `--radius-upload` | `16px` | 上传区 |
| `--radius-badge` | `100px` | 宠物名字徽章（全圆） |

### 阴影

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--shadow-card` | `0 4px 24px rgba(139,92,246,0.08)` | 普通卡片 |
| `--shadow-avatar` | `0 16px 48px rgba(139,92,246,0.35), 0 0 0 16px rgba(196,181,253,0.2)` | 宠物头像光晕 |
| `--shadow-button` | `0 6px 20px rgba(139,92,246,0.4)` | 主按钮 |
| `--shadow-window` | `0 32px 80px rgba(0,0,0,0.5)` | 窗口整体 |

---

## 主界面

### 布局

两栏布局：`grid-template-columns: 1fr 360px; gap: 20px`

**左栏：宠物展示区（`PetStage`）**

- 背景：玻璃磨砂白卡（`rgba(255,255,255,0.45)`），`border-radius: 24px`
- 内部光晕：`::before` 伪元素，`radial-gradient` 紫色光圈，居中顶部
- 宠物头像：`200×200px` 圆形，紫色渐变背景，白色 `6px` 边框，双层阴影（实影 + 光晕环）
- 浮动动画：`translateY(0) → translateY(-10px)`，3s ease-in-out 循环
- 名字徽章：胶囊形，白底，绿色在线状态点 + 宠物名 + 状态文字
- 底部消息气泡：绝对定位 bottom 20px，白底圆角，紫色文字

**右栏：控制面板**

由两个卡片堆叠：

卡片 1 — 信息卡
- eyebrow 文字（`#A78BFA`，全大写，`11px`）
- 标题（`#2D1470`，`18px 800`）
- 副标题（`#9D8AC7`，`13px`）

卡片 2 — 计时器卡
- 倒计时数字：`56px 900`，`letter-spacing: -2px`，颜色 `#2D1470`
- 时长芯片行：4 个芯片，选中态紫色填充 + 阴影，未选中淡紫底
- 按钮行：主按钮（flex:2，渐变紫，`height:48px`）+ 重置按钮（flex:1，淡紫底）

---

## Onboarding 页面

### 布局

App 背景居中，单张主卡（`width: min(480px, 100%)`，`padding: 36px 40px`）

### 状态一：填写表单

卡片内容从上到下：
1. **品牌行**：`52×52` 圆角图标（渐变紫 + 爪印 emoji）+ 右侧 eyebrow + 标题 + 副标题
2. **分割线**：`1px #EDE4FF`
3. **名字字段**：标签 + 圆角输入框（`faf7ff` 底色，focus 时紫色描边 + `box-shadow`）
4. **上传区**：虚线边框（`2px dashed #C4B5FD`），hover 变实紫，内含上传图标 + 文字提示
5. **提交按钮**：全宽，`height: 52px`，渐变紫，`✨ 生成陪伴宠物`

### 状态二：AI 生成中

卡片内容从上到下：
1. **品牌行**（eyebrow 改为"正在生成"）
2. **分割线**
3. **生成动画区**：
   - 脉冲图标：`72×72` 圆形渐变，`scale(1)→scale(1.06)` 1.8s 循环
   - 标题 + 副标题（"即梦 AI 正在为 XX 绘制专属形象"）
   - 进度条：`8px` 高，圆角，紫色渐变填充 + shimmer 光效（`::after` 伪元素）
   - 进度标签行：左侧状态文字 + 右侧百分比

---

## 组件变更清单

| 组件/文件 | 变更内容 |
|-----------|---------|
| `src/styles.css` | 全部重写：令牌变量、新组件样式、动画 |
| `src/components/CompanionStage.tsx` | 保留文件名，重写内部 DOM 结构和 className，不改组件名（避免影响测试和引用） |
| `src/components/FocusControls.tsx` | 更新芯片 + 按钮样式类名 |
| `src/components/OnboardingPanel.tsx` | 新增品牌行、更新上传区 DOM 结构 |
| `src/App.tsx` | 调整布局 class，移除旧 side-panel 文案 |

---

## 不在本次范围内

- RestOverlay（休息提醒弹窗）的视觉改版
- 响应式适配（移动端）
- 深色模式
