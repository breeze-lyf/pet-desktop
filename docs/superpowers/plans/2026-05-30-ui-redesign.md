# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the app's visual design to a warm可爱 lavender-purple theme with single-card layout.

**Architecture:** Pure CSS redesign — replace all CSS variables and component styles; no business logic changes.

**Tech Stack:** CSS custom properties, no new dependencies.

---

## File Map

| File | Change |
|------|--------|
| `src/styles.css` | Complete rewrite: design tokens, component styles, animations |
| `src/components/CompanionStage.tsx` | Internal DOM rewrite: new class names matching new CSS, keep file/component name |
| `src/components/FocusControls.tsx` | Chip/button className updates to match new CSS |
| `src/components/OnboardingPanel.tsx` | Add brand row, update upload zone DOM structure |
| `src/App.tsx` | Layout className updates, remove old side-panel text |

---

## Task 1 — Rewrite `src/styles.css`

**Steps:**

- [ ] 1. Replace the entire file content with the new design tokens and styles below.

```css
:root {
  /* ── Colors ── */
  --color-primary: #8B5CF6;
  --color-primary-dark: #7C3AED;
  --color-primary-light: #C4B5FD;
  --color-primary-muted: #EDE4FF;
  --color-bg-app: linear-gradient(145deg, #F8F3FF, #EDE4FF, #E8D8FF);
  --color-bg-card: rgba(255, 255, 255, 0.82);
  --color-bg-window: #2A1452;
  --color-text-title: #2D1470;
  --color-text-body: #4C2A8A;
  --color-text-muted: #9D8AC7;
  --color-text-eyebrow: #A78BFA;
  --color-border: #D8CCF5;
  --color-status-online: #34D399;
  --color-input-bg: #FAF7FF;
  --color-chip-bg: #EDE4FF;
  --color-chip-text: #6D3BBF;

  /* ── Radii ── */
  --radius-card: 24px;
  --radius-button: 14px;
  --radius-chip: 10px;
  --radius-input: 12px;
  --radius-upload: 16px;
  --radius-badge: 100px;

  /* ── Shadows ── */
  --shadow-card: 0 4px 24px rgba(139, 92, 246, 0.08);
  --shadow-avatar: 0 16px 48px rgba(139, 92, 246, 0.35), 0 0 0 16px rgba(196, 181, 253, 0.2);
  --shadow-button: 0 6px 20px rgba(139, 92, 246, 0.4);
  --shadow-window: 0 32px 80px rgba(0, 0, 0, 0.5);

  color: var(--color-text-title);
  font-family: -apple-system, "SF Pro Display", "PingFang SC", ui-sans-serif, system-ui, sans-serif;
}

* { box-sizing: border-box; }

body { margin: 0; min-width: 320px; }

button, input { font: inherit; }
button { cursor: pointer; }

/* ── App Shell ── */
.app-shell {
  min-height: 100vh;
  background: var(--color-bg-app);
  padding: 28px;
}

.centered-shell {
  display: grid;
  place-items: center;
}

/* ── Main Layout ── */
.app-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  max-width: 1180px;
  margin: 0 auto;
}

.side-panel {
  display: grid;
  gap: 16px;
  align-content: start;
}

/* ── Card (shared) ── */
.panel {
  background: var(--color-bg-card);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-card);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-card);
  padding: 22px;
}

/* ── Eyebrow / Typography ── */
.eyebrow {
  margin: 0 0 4px;
  color: var(--color-text-eyebrow);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

h1, h2, p { margin-top: 0; }
.muted {
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.5;
}

/* ── FocusControls panel ── */
.focus-controls { display: grid; gap: 18px; }

.focus-controls .timer-display {
  font-size: 56px;
  font-weight: 900;
  letter-spacing: -2px;
  color: var(--color-text-title);
  line-height: 1;
  margin: 12px 0;
}

/* ── Chips ── */
.preset-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.chip {
  border: 0;
  border-radius: var(--radius-chip);
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: var(--color-chip-bg);
  color: var(--color-chip-text);
  transition: background 0.15s, box-shadow 0.15s;
}

.chip.selected {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
}

/* ── Buttons ── */
.control-row {
  display: flex;
  gap: 10px;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: var(--radius-button);
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
}

.primary-button {
  flex: 2;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  font-size: 15px;
  box-shadow: var(--shadow-button);
}

.secondary-button {
  flex: 1;
  height: 48px;
  background: var(--color-chip-bg);
  color: var(--color-chip-text);
  font-size: 14px;
}

/* ── CompanionStage ── */
.companion-stage {
  position: relative;
  min-height: calc(100vh - 56px);
  border-radius: var(--radius-card);
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  overflow: hidden;
  display: grid;
  place-items: center;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
}

.companion-stage::before {
  content: '';
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(196, 181, 253, 0.4) 0%, transparent 70%);
  pointer-events: none;
}

.companion-status {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(196, 181, 253, 0.4);
  border-radius: var(--radius-chip);
  padding: 10px 16px;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.companion-status strong {
  display: block;
  font-size: 14px;
  color: var(--color-text-title);
  font-weight: 800;
}

.companion-status span {
  display: block;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* ── Pet Orbit / Avatar ── */
.pet-orbit {
  width: min(46vw, 420px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
}

.pet-portrait {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ddd6fe, #a78bfa);
  border: 6px solid rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-avatar);
  object-fit: cover;
  animation: pet-float 3s ease-in-out infinite;
}

.mood-reminding .pet-portrait {
  animation: pet-bounce 0.6s ease-in-out infinite;
}

/* ── Pet Name Badge ── */
.pet-name-badge {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(196, 181, 253, 0.5);
  border-radius: var(--radius-badge);
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.12);
  margin-top: 16px;
}

.pet-name-badge .dot-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-status-online);
  box-shadow: 0 0 6px var(--color-status-online);
  flex-shrink: 0;
}

.pet-name-badge strong {
  font-size: 14px;
  color: var(--color-text-title);
  font-weight: 800;
}

.pet-name-badge span {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ── Pet Message ── */
.pet-message {
  position: absolute;
  bottom: 20px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(196, 181, 253, 0.4);
  border-radius: 12px;
  padding: 10px 18px;
  font-size: 13px;
  color: var(--color-text-body);
  z-index: 1;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

/* ── Onboarding ── */
.onboarding-panel {
  width: min(480px, 100%);
  display: grid;
  gap: 22px;
  padding: 36px 40px;
}

/* Brand row */
.brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.brand-text .eyebrow {
  margin-bottom: 3px;
}

.brand-text h2 {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-title);
  line-height: 1.2;
}

.brand-text p {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 3px;
}

/* Divider */
.onboarding-divider {
  height: 1px;
  background: var(--color-primary-muted);
}

/* Field */
.field {
  display: grid;
  gap: 8px;
  color: var(--color-text-body);
  font-weight: 700;
  font-size: 13px;
}

.field input {
  width: 100%;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-input);
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text-title);
  background: var(--color-input-bg);
  outline: none;
  font-family: inherit;
}

.field input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
}

.field input::placeholder {
  color: var(--color-primary-light);
}

/* Upload zone */
.upload-box {
  position: relative;
  border: 2px dashed var(--color-primary-light);
  border-radius: var(--radius-upload);
  background: var(--color-input-bg);
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.upload-box:hover {
  border-color: var(--color-primary);
  background: #F5F0FF;
}

.upload-box input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.upload-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-primary-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.upload-box strong {
  font-size: 14px;
  color: var(--color-text-body);
  font-weight: 700;
}

.upload-box span {
  font-size: 12px;
  color: var(--color-text-eyebrow);
}

.upload-box img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: calc(var(--radius-upload) - 2px);
}

/* Submit button */
.primary-button.full-width {
  width: 100%;
  height: 52px;
  font-size: 15px;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.form-error {
  color: #b42318;
  margin: 0;
  font-size: 13px;
}

/* ── Generating state ── */
.generating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 12px 0;
}

.gen-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  box-shadow: 0 8px 28px rgba(139, 92, 246, 0.35);
  animation: gen-pulse 1.8s ease-in-out infinite;
}

@keyframes gen-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 28px rgba(139, 92, 246, 0.35);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 12px 36px rgba(139, 92, 246, 0.5);
  }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-primary-muted);
  border-radius: 100px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: 62%;
  background: linear-gradient(90deg, var(--color-text-eyebrow), var(--color-primary));
  border-radius: 100px;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer { to { left: 100%; } }

.progress-label {
  font-size: 12px;
  color: var(--color-text-eyebrow);
  align-self: flex-end;
}

/* ── Rest overlay (unchanged — out of scope) ── */
.rest-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.42);
}

.rest-card {
  position: relative;
  width: min(720px, 100%);
  border-radius: 8px;
  background: #ffffff;
  padding: 24px;
  box-shadow: 0 24px 70px rgba(16, 24, 40, 0.22);
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
}

.icon-button {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #344054;
  background: #eef2f7;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

/* ── Pet overlay animations ── */
@keyframes pet-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes pet-bounce {
  0%, 100% { transform: translateY(0px); }
  30% { transform: translateY(-16px); }
  60% { transform: translateY(-6px); }
}
@keyframes pet-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes pet-sway {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}
@keyframes pet-jump {
  0% { transform: translateY(0px) scale(1); }
  30% { transform: translateY(-24px) scale(0.95, 1.05); }
  60% { transform: translateY(-8px) scale(1); }
  80% { transform: translateY(-2px); }
  100% { transform: translateY(0px); }
}

.pet-overlay-img { display: block; }
.pet-float { animation: pet-float 3s ease-in-out infinite; }
.pet-breathe { animation: pet-breathe 2.5s ease-in-out infinite; }
.pet-bounce { animation: pet-bounce 0.6s ease-in-out infinite; }
.pet-sway { animation: pet-sway 2s ease-in-out infinite; }
.pet-jump { animation: pet-jump 0.6s ease-out forwards; }

/* ── Responsive ── */
@media (max-width: 860px) {
  .app-shell { padding: 14px; }
  .app-layout { grid-template-columns: 1fr; }
  .companion-stage { min-height: 480px; }
  .pet-orbit { width: min(78vw, 360px); }
}
```

**Verify:** `npm test` passes.

---

## Task 2 — Update `src/components/CompanionStage.tsx`

**Steps:**

- [ ] 1. Edit `src/components/CompanionStage.tsx` to match the new DOM structure from the mockup.

Replace the entire component body (the JSX after `return`) with:

```tsx
export function CompanionStage({ petName, portraitDataUrl, mood }: CompanionStageProps) {
  return (
    <section className={`companion-stage mood-${mood}`} aria-label="宠物陪伴区">
      <div className="companion-status">
        <strong>{petName}</strong>
        <span>{moodText[mood]}</span>
      </div>
      <div className="pet-orbit">
        <img className="pet-portrait" src={portraitDataUrl} alt={`${petName} 的陪伴头像`} />
        <div className="pet-name-badge">
          <div className="dot-status" />
          <strong>{petName}</strong>
          <span>{moodText[mood]}</span>
        </div>
      </div>
      <p className="pet-message">
        {mood === "reminding" ? "已经陪你很久啦，休息一下吧。" : "我在这里，慢慢来。✨"}
      </p>
    </section>
  );
}
```

**Verify:** `npm test` passes.

---

## Task 3 — Update `src/components/FocusControls.tsx`

**Steps:**

- [ ] 1. Edit `src/components/FocusControls.tsx` — update class names on chip buttons and buttons.

In the chip row div, update className:

```tsx
<div className="preset-row" aria-label="提醒间隔">
  {timerPresets.map((preset) => (
    <button
      className={preset === minutes ? "chip selected" : "chip"}
      key={preset}
      onClick={() => onMinutesChange(preset)}
      type="button"
    >
      {preset} 分钟
    </button>
  ))}
</div>
```

In the control row, update className:

```tsx
<div className="control-row">
  <button className="primary-button" onClick={isRunning ? onPause : onStart} type="button">
    {isRunning ? <Pause size={18} /> : <Play size={18} />}
    {isRunning ? "暂停" : "开始陪伴"}
  </button>
  <button className="secondary-button" onClick={onReset} type="button">
    <RotateCcw size={18} />
    重置
  </button>
</div>
```

**Verify:** `npm test` passes.

---

## Task 4 — Update `src/components/OnboardingPanel.tsx`

**Steps:**

- [ ] 1. Edit `src/components/OnboardingPanel.tsx` — add brand row, update upload zone DOM, update generating state.

In the `stage === "generating"` return block, replace with:

```tsx
if (stage === "generating") {
  return (
    <div className="panel onboarding-panel">
      <div className="brand-row">
        <div className="brand-icon">✨</div>
        <div className="brand-text">
          <p className="eyebrow">正在生成</p>
          <h2>为{name}创建卡通形象</h2>
          <p>即梦 AI 正在处理，通常需要 20–60 秒</p>
        </div>
      </div>
      <div className="onboarding-divider" />
      <div className="generating">
        <div className="gen-icon">✨</div>
        <div style={{ textAlign: "center" }}>
          <div className="gen-title" style={{ fontSize: "18px", fontWeight: "800", color: "#2D1470" }}>正在生成卡通形象...</div>
          <div className="muted" style={{ marginTop: "4px" }}>即梦 AI 正在为{name}绘制专属形象</div>
        </div>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "#A78BFA" }}>风格转换中</span>
            <span className="progress-label">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] 2. In the form state return block, replace the header div with brand row:

```tsx
<form className="panel onboarding-panel" onSubmit={handleSubmit}>
  <div className="brand-row">
    <div className="brand-icon">🐾</div>
    <div className="brand-text">
      <p className="eyebrow">第一步</p>
      <h2>创建你的陪伴宠物</h2>
      <p>上传照片，AI 生成专属卡通形象</p>
    </div>
  </div>
  <div className="onboarding-divider" />
```

- [ ] 3. Replace the upload box label DOM to use new upload zone structure:

```tsx
<label className="upload-box">
  <input type="file" accept="image/*" onChange={handlePhotoChange} />
  {photoDataUrl ? (
    <img src={photoDataUrl} alt="宠物预览" />
  ) : (
    <>
      <div className="upload-icon">📷</div>
      <strong>点击上传照片</strong>
      <span>支持 JPG / PNG · 建议清晰正面照</span>
    </>
  )}
</label>
```

- [ ] 4. Update submit button to have `full-width` className:

```tsx
<button className="primary-button full-width" type="submit">
  ✨ 生成陪伴宠物
</button>
```

**Verify:** `npm test` passes.

---

## Task 5 — Update `src/App.tsx`

**Steps:**

- [ ] 1. Edit `src/App.tsx` — update layout class and remove side-panel descriptive text from the first card.

In the main layout, keep the two-column structure but update class names and text:

```tsx
<aside className="side-panel">
  <section className="panel">
    <p className="eyebrow">桌面陪伴</p>
    <h1>{companion.profile.name} 会提醒你休息</h1>
    <p className="muted">生成完卡通形象后，{companion.profile.name}会在屏幕角落陪伴你专注。</p>
  </section>
  <FocusControls
```

**Verify:** `npm test` passes.

---

## Final Verification

After all tasks are complete:

```bash
npm test
```

All tests must pass. The app should now display the lavender-purple theme with the single-card layout as shown in the mockup files under `.superpowers/brainstorm/`.