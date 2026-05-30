# Pet Rest Companion Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop MVP where a user can upload a pet photo, create a lightweight companion, run a focus timer, receive a pet-themed rest reminder, choose a rest activity, and play calming sound inside an Electron desktop app.

**Architecture:** Use Electron for the desktop shell and Vite + React + TypeScript for the UI. Keep the first desktop MVP client-only: uploaded images, settings, timer state, and generated companion data stay in local browser storage, while Electron provides a real desktop window and a path to later always-on-top/floating pet behavior.

**Tech Stack:** Electron, Vite, React, TypeScript, Vitest, React Testing Library, lucide-react, browser `localStorage`, browser Web Audio API.

---

## File Structure

- `package.json` - scripts, dependencies, Electron entry metadata.
- `index.html` - Vite HTML entry.
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` - TypeScript and Vite configuration.
- `electron/main.ts` - Electron main process, desktop window creation.
- `electron/preload.ts` - safe preload bridge for app metadata.
- `src/main.tsx` - React bootstrap.
- `src/App.tsx` - top-level workflow orchestration.
- `src/styles.css` - finished responsive desktop UI styling.
- `src/domain/pet.ts` - pet profile and companion types.
- `src/domain/rest.ts` - rest activity presets and timer duration presets.
- `src/lib/storage.ts` - localStorage JSON helpers.
- `src/lib/petGeneration.ts` - MVP companion generation from uploaded image.
- `src/hooks/usePersistentState.ts` - typed localStorage-backed state.
- `src/hooks/useFocusTimer.ts` - focus timer and reminder state machine.
- `src/hooks/useAmbientSound.ts` - Web Audio ambient sound controller.
- `src/components/OnboardingPanel.tsx` - pet photo upload and naming.
- `src/components/CompanionStage.tsx` - animated pet portrait and mood display.
- `src/components/FocusControls.tsx` - timer controls and presets.
- `src/components/RestOverlay.tsx` - reminder modal, rest activities, and sounds.
- `src/test/setup.ts` - test environment setup.

## Task 1: Bootstrap Electron + Vite + React

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create project configuration**

Create `package.json`:

```json
{
  "name": "pet-rest-companion-desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "concurrently -k \"vite --host 127.0.0.1\" \"wait-on http://127.0.0.1:5173 && cross-env VITE_DEV_SERVER_URL=http://127.0.0.1:5173 electron .\"",
    "build": "tsc -b && vite build && tsc -p tsconfig.node.json",
    "start": "electron .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.0.0",
    "typescript": "^5.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.468.0",
    "electron": "^33.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "concurrently": "^9.0.0",
    "cross-env": "^7.0.3",
    "jsdom": "^25.0.0",
    "wait-on": "^8.0.0",
    "vitest": "^2.0.0"
  }
}
```

Create `index.html`, `tsconfig.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, and `src/test/setup.ts` using the same contents from the original Web plan Task 1.

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist-electron",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts", "electron/**/*.ts"]
}
```

Create `electron/main.ts`:

```ts
import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const window = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    title: "Pet Rest Companion",
    backgroundColor: "#f4f7fb",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    void window.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

Create `electron/preload.ts`:

```ts
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("petDesktop", {
  platform: process.platform,
});
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and npm exits with code 0.

- [ ] **Step 3: Verify bootstrap**

Run:

```bash
npm run build
npm test
```

Expected: build succeeds and tests exit successfully.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts electron src
git commit -m "chore: bootstrap electron pet companion app"
```

## Task 2: Build MVP Domain and State

**Files:**
- Create: `src/domain/pet.ts`
- Create: `src/domain/rest.ts`
- Create: `src/domain/rest.test.ts`
- Create: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`
- Create: `src/hooks/usePersistentState.ts`
- Create: `src/hooks/usePersistentState.test.tsx`

- [ ] **Step 1: Implement and test domain presets**

Use the domain and storage files from the original Web plan Tasks 2 and 3. Run:

```bash
npm test -- src/domain/rest.test.ts src/lib/storage.test.ts src/hooks/usePersistentState.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Commit**

```bash
git add src/domain src/lib src/hooks/usePersistentState.ts src/hooks/usePersistentState.test.tsx
git commit -m "feat: add desktop companion domain state"
```

## Task 3: Build Pet Creation Flow

**Files:**
- Create: `src/lib/petGeneration.ts`
- Create: `src/lib/petGeneration.test.ts`
- Create: `src/components/OnboardingPanel.tsx`
- Create: `src/components/OnboardingPanel.test.tsx`

- [ ] **Step 1: Implement photo-based companion creation**

Use the pet generation helper and onboarding component from the original Web plan Task 4. Run:

```bash
npm test -- src/lib/petGeneration.test.ts src/components/OnboardingPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Commit**

```bash
git add src/lib/petGeneration.ts src/lib/petGeneration.test.ts src/components/OnboardingPanel.tsx src/components/OnboardingPanel.test.tsx
git commit -m "feat: create desktop pet companion from photo"
```

## Task 4: Build Timer, Rest Overlay, and Sound

**Files:**
- Create: `src/hooks/useFocusTimer.ts`
- Create: `src/hooks/useFocusTimer.test.tsx`
- Create: `src/hooks/useAmbientSound.ts`
- Create: `src/components/FocusControls.tsx`
- Create: `src/components/FocusControls.test.tsx`
- Create: `src/components/RestOverlay.tsx`
- Create: `src/components/RestOverlay.test.tsx`

- [ ] **Step 1: Implement timer and rest flow**

Use the focus timer, ambient sound, focus controls, and rest overlay from the original Web plan Tasks 5 and 6. Run:

```bash
npm test -- src/hooks/useFocusTimer.test.tsx src/components/FocusControls.test.tsx src/components/RestOverlay.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useFocusTimer.ts src/hooks/useFocusTimer.test.tsx src/hooks/useAmbientSound.ts src/components/FocusControls.tsx src/components/FocusControls.test.tsx src/components/RestOverlay.tsx src/components/RestOverlay.test.tsx
git commit -m "feat: add desktop timer rest reminder"
```

## Task 5: Wire Desktop App UI

**Files:**
- Create: `src/components/CompanionStage.tsx`
- Create: `src/components/CompanionStage.test.tsx`
- Create: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Implement companion stage and app workflow**

Use the companion stage, app wiring, app smoke test, and finished responsive styling from the original Web plan Tasks 7 and 8.

Run:

```bash
npm test
npm run build
```

Expected: all tests PASS and Electron/Vite build succeeds.

- [ ] **Step 2: Verify desktop app manually**

Run:

```bash
npm run dev
```

Expected: Electron opens a desktop window. Verify:

- Onboarding appears on first launch.
- Submitting without a pet name shows validation.
- Uploading an image shows a preview.
- Creating a pet opens the companion stage.
- Starting the timer changes the pet mood to focus.
- Reducing the interval for test purposes can trigger the rest overlay.
- Rest activities and sound buttons are visible and do not overlap.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/styles.css src/components/CompanionStage.tsx src/components/CompanionStage.test.tsx
git commit -m "feat: wire desktop pet companion workflow"
```

## Task 6: Add Desktop Roadmap Hooks

**Files:**
- Modify: `electron/main.ts`
- Create: `docs/desktop-roadmap.md`

- [ ] **Step 1: Add future-ready window settings**

Modify `electron/main.ts` so `createWindow` includes comments and stable defaults for future floating mode:

```ts
const window = new BrowserWindow({
  width: 1180,
  height: 760,
  minWidth: 980,
  minHeight: 640,
  title: "Pet Rest Companion",
  backgroundColor: "#f4f7fb",
  // Future floating-pet mode can switch these to true/transparent settings
  // after the MVP reminder loop is validated.
  alwaysOnTop: false,
  transparent: false,
  frame: true,
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
  },
});
```

Create `docs/desktop-roadmap.md`:

```md
# Desktop Roadmap

## MVP

- Normal Electron desktop window.
- Pet photo upload and local companion portrait.
- Focus timer and rest reminder.
- Rest suggestions and ambient sound.

## Next

- Floating compact pet window.
- Always-on-top toggle.
- Transparent background mode.
- Draggable pet position.
- Screen-corner idle mode.
- Optional launch-at-login setting.
```

- [ ] **Step 2: Verify and commit**

Run:

```bash
npm run build
```

Expected: build PASS.

Commit:

```bash
git add electron/main.ts docs/desktop-roadmap.md
git commit -m "docs: add desktop pet roadmap"
```

## Self-Review Notes

- Spec coverage: this plan keeps photo upload, pet name, companion portrait, light animation, default/custom timer, rest suggestions, ambient sound, and the full reminder loop.
- Route change: this supersedes the earlier Web-first plan by making Electron the first deliverable.
- Environment fit: Electron is chosen because Node/npm are available locally and Rust/Cargo are not installed.
- Exclusions remain unchanged: no full 3D pet, no system dynamic wallpaper, no automatic device usage detection, no complex AI chat, and no pet-raising system in MVP.
