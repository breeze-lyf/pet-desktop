# Pet Rest Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Web MVP where a user can upload a pet photo, create a lightweight companion, run a focus timer, receive a pet-themed rest reminder, choose a rest activity, and play calming sound.

**Architecture:** Use a client-only React app with focused domain modules for pet data, timer state, rest suggestions, and ambient audio. Keep generation local in MVP by turning the uploaded image into a companion portrait, while leaving a clean interface for future AI image editing.

**Tech Stack:** Vite, React, TypeScript, Vitest, React Testing Library, CSS modules/plain CSS, browser `localStorage`, browser Web Audio API.

---

## File Structure

- `package.json` - project scripts and dependencies.
- `index.html` - Vite HTML entry.
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` - TypeScript and Vite configuration.
- `src/main.tsx` - React bootstrap.
- `src/App.tsx` - top-level app state and workflow orchestration.
- `src/styles.css` - global visual system and responsive layout.
- `src/domain/pet.ts` - pet profile and companion generation types.
- `src/domain/rest.ts` - rest activity presets and timer duration presets.
- `src/lib/storage.ts` - localStorage read/write helpers.
- `src/lib/petGeneration.ts` - MVP companion generation from uploaded image.
- `src/hooks/usePersistentState.ts` - typed localStorage-backed state.
- `src/hooks/useFocusTimer.ts` - focus timer and reminder state machine.
- `src/hooks/useAmbientSound.ts` - Web Audio ambient sound controller.
- `src/components/OnboardingPanel.tsx` - first-run photo upload and pet naming.
- `src/components/CompanionStage.tsx` - pet portrait, animated states, and current mode.
- `src/components/FocusControls.tsx` - timer duration, start/pause/reset controls.
- `src/components/RestOverlay.tsx` - reminder modal, rest activities, and sound choices.
- `src/test/setup.ts` - test environment setup.
- `src/**/*.test.ts(x)` - unit and component tests beside implementation files.

## Task 1: Bootstrap Vite React TypeScript App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create package and config files**

Create `package.json`:

```json
{
  "name": "pet-rest-companion",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.0.0",
    "typescript": "^5.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^25.0.0",
    "vitest": "^2.0.0"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pet Rest Companion</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Create minimal React entry**

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="app-header">
        <p className="eyebrow">Pet Rest Companion</p>
        <h1>让自己的宠物提醒你休息</h1>
        <p>上传宠物照片，设置提醒时间，让它在你工作太久时温柔地叫你休息。</p>
      </section>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #182230;
  background: #f4f7fb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 32px;
}

.app-header {
  max-width: 920px;
  margin: 0 auto;
}

.eyebrow {
  margin: 0 0 8px;
  color: #475467;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.app-header h1 {
  margin: 0;
  font-size: 40px;
  line-height: 1.1;
}

.app-header p {
  max-width: 640px;
  color: #667085;
}
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and npm exits with code 0.

- [ ] **Step 4: Verify bootstrap**

Run:

```bash
npm run build
npm test
```

Expected: build succeeds; test command succeeds with no tests or a no-test warning only if Vitest exits successfully.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src
git commit -m "chore: bootstrap pet companion app"
```

## Task 2: Add Domain Models and Presets

**Files:**
- Create: `src/domain/pet.ts`
- Create: `src/domain/rest.ts`
- Create: `src/domain/rest.test.ts`

- [ ] **Step 1: Write failing tests for rest presets**

Create `src/domain/rest.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getDefaultTimerMinutes, restActivities, timerPresets } from "./rest";

describe("rest domain presets", () => {
  it("uses 60 minutes as the default timer", () => {
    expect(getDefaultTimerMinutes()).toBe(60);
  });

  it("includes the MVP rest activities", () => {
    expect(restActivities.map((activity) => activity.id)).toEqual([
      "eyes",
      "water",
      "stretch",
      "breathing",
      "walk",
    ]);
  });

  it("keeps timer presets user-friendly", () => {
    expect(timerPresets).toEqual([25, 45, 60, 90]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/domain/rest.test.ts
```

Expected: FAIL because `src/domain/rest.ts` does not exist.

- [ ] **Step 3: Implement domain files**

Create `src/domain/pet.ts`:

```ts
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
}
```

Create `src/domain/rest.ts`:

```ts
export type RestActivityId = "eyes" | "water" | "stretch" | "breathing" | "walk";

export interface RestActivity {
  id: RestActivityId;
  title: string;
  durationMinutes: number;
  suggestion: string;
}

export const timerPresets = [25, 45, 60, 90] as const;

export const restActivities: RestActivity[] = [
  {
    id: "eyes",
    title: "护眼休息",
    durationMinutes: 3,
    suggestion: "看向远处，慢慢眨眼，让眼睛离开屏幕一会儿。",
  },
  {
    id: "water",
    title: "喝水",
    durationMinutes: 2,
    suggestion: "离开座位喝一口水，回来再继续。",
  },
  {
    id: "stretch",
    title: "肩颈拉伸",
    durationMinutes: 4,
    suggestion: "放松肩膀，轻轻转动脖子和手腕。",
  },
  {
    id: "breathing",
    title: "深呼吸",
    durationMinutes: 3,
    suggestion: "吸气四拍，停一拍，呼气六拍，重复三到五轮。",
  },
  {
    id: "walk",
    title: "走动一下",
    durationMinutes: 5,
    suggestion: "站起来走几步，让身体从久坐里醒过来。",
  },
];

export function getDefaultTimerMinutes() {
  return 60;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/domain/rest.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat: add pet and rest domain presets"
```

## Task 3: Add Persistent State Helpers

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`
- Create: `src/hooks/usePersistentState.ts`
- Create: `src/hooks/usePersistentState.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/lib/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { readJson, writeJson } from "./storage";

describe("storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns fallback when a key is missing", () => {
    expect(readJson("missing", { value: 1 })).toEqual({ value: 1 });
  });

  it("round-trips JSON values", () => {
    writeJson("pet", { name: "Momo" });
    expect(readJson("pet", { name: "" })).toEqual({ name: "Momo" });
  });

  it("uses fallback for malformed JSON", () => {
    localStorage.setItem("broken", "{");
    expect(readJson("broken", { ok: true })).toEqual({ ok: true });
  });
});
```

Create `src/hooks/usePersistentState.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { usePersistentState } from "./usePersistentState";

describe("usePersistentState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists updates to localStorage", () => {
    const { result } = renderHook(() => usePersistentState("name", "Momo"));

    act(() => {
      result.current[1]("Lucky");
    });

    expect(result.current[0]).toBe("Lucky");
    expect(localStorage.getItem("name")).toBe("\"Lucky\"");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/lib/storage.test.ts src/hooks/usePersistentState.test.tsx
```

Expected: FAIL because implementation files do not exist.

- [ ] **Step 3: Implement storage and hook**

Create `src/lib/storage.ts`:

```ts
export function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
```

Create `src/hooks/usePersistentState.ts`:

```ts
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { readJson, writeJson } from "../lib/storage";

export function usePersistentState<T>(
  key: string,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readJson(key, fallback));

  useEffect(() => {
    writeJson(key, value);
  }, [key, value]);

  return [value, setValue];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- src/lib/storage.test.ts src/hooks/usePersistentState.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib src/hooks
git commit -m "feat: persist pet companion state"
```

## Task 4: Implement MVP Pet Generation

**Files:**
- Create: `src/lib/petGeneration.ts`
- Create: `src/lib/petGeneration.test.ts`
- Create: `src/components/OnboardingPanel.tsx`
- Create: `src/components/OnboardingPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/lib/petGeneration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createCompanionFromPhoto } from "./petGeneration";

describe("createCompanionFromPhoto", () => {
  it("creates a companion profile from a photo data URL", () => {
    const companion = createCompanionFromPhoto({
      name: "Momo",
      photoDataUrl: "data:image/png;base64,abc",
      now: "2026-05-30T00:00:00.000Z",
    });

    expect(companion.profile.name).toBe("Momo");
    expect(companion.profile.photoDataUrl).toBe("data:image/png;base64,abc");
    expect(companion.portraitDataUrl).toBe("data:image/png;base64,abc");
    expect(companion.mood).toBe("idle");
  });
});
```

Create `src/components/OnboardingPanel.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingPanel } from "./OnboardingPanel";

describe("OnboardingPanel", () => {
  it("requires a pet name before continuing", () => {
    const onCreate = vi.fn();
    render(<OnboardingPanel onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "生成陪伴宠物" }));

    expect(screen.getByText("先给宠物起个名字")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/lib/petGeneration.test.ts src/components/OnboardingPanel.test.tsx
```

Expected: FAIL because implementation files do not exist.

- [ ] **Step 3: Implement generation helper and onboarding component**

Create `src/lib/petGeneration.ts`:

```ts
import { CompanionPet } from "../domain/pet";

interface CreateCompanionInput {
  name: string;
  photoDataUrl: string;
  now?: string;
}

export function createCompanionFromPhoto({
  name,
  photoDataUrl,
  now = new Date().toISOString(),
}: CreateCompanionInput): CompanionPet {
  return {
    profile: {
      id: crypto.randomUUID(),
      name: name.trim(),
      photoDataUrl,
      createdAt: now,
    },
    portraitDataUrl: photoDataUrl,
    mood: "idle",
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("无法读取图片文件"));
    reader.readAsDataURL(file);
  });
}
```

Create `src/components/OnboardingPanel.tsx`:

```tsx
import { ChangeEvent, FormEvent, useState } from "react";
import { Camera } from "lucide-react";
import { CompanionPet } from "../domain/pet";
import { createCompanionFromPhoto, readFileAsDataUrl } from "../lib/petGeneration";

interface OnboardingPanelProps {
  onCreate: (companion: CompanionPet) => void;
}

export function OnboardingPanel({ onCreate }: OnboardingPanelProps) {
  const [name, setName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [error, setError] = useState("");

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setPhotoDataUrl(await readFileAsDataUrl(file));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setError("先给宠物起个名字");
      return;
    }

    if (!photoDataUrl) {
      setError("请上传一张清晰的宠物照片");
      return;
    }

    onCreate(createCompanionFromPhoto({ name, photoDataUrl }));
  }

  return (
    <form className="panel onboarding-panel" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">第一步</p>
        <h2>创建你的陪伴宠物</h2>
        <p className="muted">先上传一张宠物照片。MVP 会把它作为轻动态陪伴头像。</p>
      </div>

      <label className="field">
        <span>宠物名字</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：奶盖" />
      </label>

      <label className="upload-box">
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
        {photoDataUrl ? (
          <img src={photoDataUrl} alt="宠物预览" />
        ) : (
          <span>
            <Camera size={22} />
            上传宠物照片
          </span>
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

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- src/lib/petGeneration.test.ts src/components/OnboardingPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/petGeneration.ts src/lib/petGeneration.test.ts src/components
git commit -m "feat: create companion from pet photo"
```

## Task 5: Implement Focus Timer State Machine

**Files:**
- Create: `src/hooks/useFocusTimer.ts`
- Create: `src/hooks/useFocusTimer.test.tsx`
- Create: `src/components/FocusControls.tsx`
- Create: `src/components/FocusControls.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useFocusTimer.test.tsx`:

```tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFocusTimer } from "./useFocusTimer";

describe("useFocusTimer", () => {
  it("moves to reminder state when remaining time reaches zero", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFocusTimer(1));

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.status).toBe("reminding");
    expect(result.current.remainingSeconds).toBe(0);
    vi.useRealTimers();
  });
});
```

Create `src/components/FocusControls.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FocusControls } from "./FocusControls";

describe("FocusControls", () => {
  it("starts the focus timer", () => {
    const onStart = vi.fn();
    render(
      <FocusControls
        minutes={60}
        remainingSeconds={3600}
        status="idle"
        onMinutesChange={vi.fn()}
        onStart={onStart}
        onPause={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "开始陪伴" }));
    expect(onStart).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/hooks/useFocusTimer.test.tsx src/components/FocusControls.test.tsx
```

Expected: FAIL because implementation files do not exist.

- [ ] **Step 3: Implement hook and controls**

Create `src/hooks/useFocusTimer.ts`:

```ts
import { useEffect, useMemo, useState } from "react";

export type FocusTimerStatus = "idle" | "running" | "paused" | "reminding" | "resting";

export function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const restSeconds = Math.max(0, seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${restSeconds}`;
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
          setStatus("reminding");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [status]);

  return {
    remainingSeconds,
    status,
    formattedRemaining: formatRemainingTime(remainingSeconds),
    start: () => setStatus("running"),
    pause: () => setStatus("paused"),
    reset: () => {
      setRemainingSeconds(totalSeconds);
      setStatus("idle");
    },
    beginRest: () => setStatus("resting"),
    finishRest: () => {
      setRemainingSeconds(totalSeconds);
      setStatus("idle");
    },
    dismissReminder: () => setStatus("running"),
  };
}
```

Create `src/components/FocusControls.tsx`:

```tsx
import { Pause, Play, RotateCcw } from "lucide-react";
import { timerPresets } from "../domain/rest";
import { FocusTimerStatus, formatRemainingTime } from "../hooks/useFocusTimer";

interface FocusControlsProps {
  minutes: number;
  remainingSeconds: number;
  status: FocusTimerStatus;
  onMinutesChange: (minutes: number) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function FocusControls({
  minutes,
  remainingSeconds,
  status,
  onMinutesChange,
  onStart,
  onPause,
  onReset,
}: FocusControlsProps) {
  const isRunning = status === "running";

  return (
    <section className="panel focus-controls" aria-label="专注计时">
      <div>
        <p className="eyebrow">专注计时</p>
        <div className="timer-display">{formatRemainingTime(remainingSeconds)}</div>
      </div>

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
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- src/hooks/useFocusTimer.test.tsx src/components/FocusControls.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useFocusTimer.ts src/hooks/useFocusTimer.test.tsx src/components/FocusControls.tsx src/components/FocusControls.test.tsx
git commit -m "feat: add focus timer reminder flow"
```

## Task 6: Implement Ambient Sound and Rest Overlay

**Files:**
- Create: `src/hooks/useAmbientSound.ts`
- Create: `src/components/RestOverlay.tsx`
- Create: `src/components/RestOverlay.test.tsx`

- [ ] **Step 1: Write failing component test**

Create `src/components/RestOverlay.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { restActivities } from "../domain/rest";
import { RestOverlay } from "./RestOverlay";

describe("RestOverlay", () => {
  it("lets the user start a rest activity", () => {
    const onStartRest = vi.fn();
    render(
      <RestOverlay
        petName="Momo"
        activities={restActivities}
        onStartRest={onStartRest}
        onDismiss={vi.fn()}
        onFinishRest={vi.fn()}
        isResting={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "开始护眼休息" }));
    expect(onStartRest).toHaveBeenCalledWith(restActivities[0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/components/RestOverlay.test.tsx
```

Expected: FAIL because `RestOverlay.tsx` does not exist.

- [ ] **Step 3: Implement sound hook and overlay**

Create `src/hooks/useAmbientSound.ts`:

```ts
import { useEffect, useRef, useState } from "react";

export type AmbientSound = "none" | "soft-tone" | "white-noise";

export function useAmbientSound() {
  const contextRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [currentSound, setCurrentSound] = useState<AmbientSound>("none");

  function stop() {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setCurrentSound("none");
  }

  function play(sound: AmbientSound) {
    stop();
    if (sound === "none") return;

    const context = new AudioContext();
    contextRef.current = context;

    if (sound === "soft-tone") {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 220;
      gain.gain.value = 0.04;
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      cleanupRef.current = () => {
        oscillator.stop();
        context.close();
      };
    }

    if (sound === "white-noise") {
      const bufferSize = context.sampleRate * 2;
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < bufferSize; index += 1) {
        data[index] = Math.random() * 2 - 1;
      }
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = 0.025;
      source.connect(gain).connect(context.destination);
      source.start();
      cleanupRef.current = () => {
        source.stop();
        context.close();
      };
    }

    setCurrentSound(sound);
  }

  useEffect(() => stop, []);

  return { currentSound, play, stop };
}
```

Create `src/components/RestOverlay.tsx`:

```tsx
import { Music, X } from "lucide-react";
import { RestActivity } from "../domain/rest";
import { AmbientSound, useAmbientSound } from "../hooks/useAmbientSound";

interface RestOverlayProps {
  petName: string;
  activities: RestActivity[];
  isResting: boolean;
  onStartRest: (activity: RestActivity) => void;
  onDismiss: () => void;
  onFinishRest: () => void;
}

const soundOptions: { id: AmbientSound; label: string }[] = [
  { id: "soft-tone", label: "轻音乐" },
  { id: "white-noise", label: "白噪音" },
  { id: "none", label: "安静" },
];

export function RestOverlay({
  petName,
  activities,
  isResting,
  onStartRest,
  onDismiss,
  onFinishRest,
}: RestOverlayProps) {
  const sound = useAmbientSound();

  return (
    <section className="rest-overlay" role="dialog" aria-modal="true" aria-label="休息提醒">
      <div className="rest-card">
        <button className="icon-button close-button" onClick={onDismiss} type="button" aria-label="稍后提醒">
          <X size={18} />
        </button>

        <p className="eyebrow">{petName} 在提醒你</p>
        <h2>{isResting ? "慢慢休息一下" : "已经专注很久啦"}</h2>
        <p className="muted">选一个短休息方式，我在这里等你回来。</p>

        <div className="activity-grid">
          {activities.map((activity) => (
            <button
              className="activity-button"
              key={activity.id}
              onClick={() => onStartRest(activity)}
              type="button"
            >
              <strong>{activity.title}</strong>
              <span>{activity.suggestion}</span>
              <em>{activity.durationMinutes} 分钟</em>
            </button>
          ))}
        </div>

        <div className="sound-row" aria-label="放松声音">
          <Music size={18} />
          {soundOptions.map((option) => (
            <button
              className={sound.currentSound === option.id ? "chip selected" : "chip"}
              key={option.id}
              onClick={() => (option.id === "none" ? sound.stop() : sound.play(option.id))}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {isResting && (
          <button className="primary-button" onClick={onFinishRest} type="button">
            我休息好了
          </button>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/components/RestOverlay.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAmbientSound.ts src/components/RestOverlay.tsx src/components/RestOverlay.test.tsx
git commit -m "feat: add rest overlay and ambient sound"
```

## Task 7: Implement Companion Stage and App Wiring

**Files:**
- Create: `src/components/CompanionStage.tsx`
- Create: `src/components/CompanionStage.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing stage test**

Create `src/components/CompanionStage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompanionStage } from "./CompanionStage";

describe("CompanionStage", () => {
  it("shows the pet name and reminder mood", () => {
    render(
      <CompanionStage
        petName="Momo"
        portraitDataUrl="data:image/png;base64,abc"
        mood="reminding"
      />,
    );

    expect(screen.getByText("Momo")).toBeInTheDocument();
    expect(screen.getByText("在提醒你休息")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/components/CompanionStage.test.tsx
```

Expected: FAIL because `CompanionStage.tsx` does not exist.

- [ ] **Step 3: Implement CompanionStage**

Create `src/components/CompanionStage.tsx`:

```tsx
import { CompanionMood } from "../domain/pet";

interface CompanionStageProps {
  petName: string;
  portraitDataUrl: string;
  mood: CompanionMood;
}

const moodText: Record<CompanionMood, string> = {
  idle: "安静陪伴中",
  focus: "陪你专注中",
  reminding: "在提醒你休息",
  resting: "等你休息回来",
};

export function CompanionStage({ petName, portraitDataUrl, mood }: CompanionStageProps) {
  return (
    <section className={`companion-stage mood-${mood}`} aria-label="宠物陪伴区">
      <div className="companion-status">
        <strong>{petName}</strong>
        <span>{moodText[mood]}</span>
      </div>
      <div className="pet-orbit">
        <img className="pet-portrait" src={portraitDataUrl} alt={`${petName} 的陪伴头像`} />
      </div>
      <p className="pet-message">
        {mood === "reminding" ? "已经陪你很久啦，休息一下吧。" : "我在这里，慢慢来。"}
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Wire App workflow**

Replace `src/App.tsx` with:

```tsx
import { useMemo } from "react";
import { CompanionMood, CompanionPet } from "./domain/pet";
import { getDefaultTimerMinutes, restActivities } from "./domain/rest";
import { CompanionStage } from "./components/CompanionStage";
import { FocusControls } from "./components/FocusControls";
import { OnboardingPanel } from "./components/OnboardingPanel";
import { RestOverlay } from "./components/RestOverlay";
import { useFocusTimer } from "./hooks/useFocusTimer";
import { usePersistentState } from "./hooks/usePersistentState";

export default function App() {
  const [companion, setCompanion] = usePersistentState<CompanionPet | null>("pet-companion", null);
  const [minutes, setMinutes] = usePersistentState("pet-focus-minutes", getDefaultTimerMinutes());
  const timer = useFocusTimer(minutes);

  const mood = useMemo<CompanionMood>(() => {
    if (timer.status === "running") return "focus";
    if (timer.status === "reminding") return "reminding";
    if (timer.status === "resting") return "resting";
    return "idle";
  }, [timer.status]);

  if (!companion) {
    return (
      <main className="app-shell centered-shell">
        <OnboardingPanel onCreate={setCompanion} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="app-layout">
        <CompanionStage
          petName={companion.profile.name}
          portraitDataUrl={companion.portraitDataUrl}
          mood={mood}
        />
        <aside className="side-panel">
          <section className="panel">
            <p className="eyebrow">今日陪伴</p>
            <h1>{companion.profile.name} 会提醒你休息</h1>
            <p className="muted">先从手动开始计时验证体验，后续再接入桌面使用时长检测。</p>
          </section>
          <FocusControls
            minutes={minutes}
            remainingSeconds={timer.remainingSeconds}
            status={timer.status}
            onMinutesChange={setMinutes}
            onStart={timer.start}
            onPause={timer.pause}
            onReset={timer.reset}
          />
        </aside>
      </section>

      {(timer.status === "reminding" || timer.status === "resting") && (
        <RestOverlay
          petName={companion.profile.name}
          activities={restActivities}
          isResting={timer.status === "resting"}
          onStartRest={timer.beginRest}
          onDismiss={timer.dismissReminder}
          onFinishRest={timer.finishRest}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- src/components/CompanionStage.test.tsx
npm run build
```

Expected: test and build PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/CompanionStage.tsx src/components/CompanionStage.test.tsx
git commit -m "feat: wire companion rest workflow"
```

## Task 8: Finish Responsive Visual Design and Verification

**Files:**
- Modify: `src/styles.css`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Add app-level smoke test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with onboarding", () => {
    render(<App />);
    expect(screen.getByText("创建你的陪伴宠物")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify current app behavior**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS if Task 7 app wiring is correct.

- [ ] **Step 3: Replace CSS with finished responsive styling**

Replace `src/styles.css` with:

```css
:root {
  color: #182230;
  background: #f4f7fb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
  padding: 28px;
}

.centered-shell {
  display: grid;
  place-items: center;
}

.app-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 20px;
  max-width: 1180px;
  margin: 0 auto;
}

.side-panel {
  display: grid;
  gap: 16px;
  align-content: start;
}

.panel {
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #ffffff;
  padding: 20px;
  box-shadow: 0 12px 32px rgba(16, 24, 40, 0.08);
}

.eyebrow {
  margin: 0 0 8px;
  color: #475467;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

.muted {
  color: #667085;
  line-height: 1.55;
}

.field {
  display: grid;
  gap: 8px;
  color: #344054;
  font-weight: 700;
}

.field input {
  width: 100%;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  padding: 12px;
  color: #182230;
}

.upload-box {
  display: grid;
  place-items: center;
  min-height: 220px;
  border: 1px dashed #98a2b3;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
}

.upload-box input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.upload-box span {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: #475467;
  font-weight: 700;
}

.upload-box img {
  width: 100%;
  height: 260px;
  object-fit: cover;
}

.form-error {
  color: #b42318;
  margin: 0;
}

.primary-button,
.secondary-button,
.chip,
.icon-button,
.activity-button {
  border: 0;
  border-radius: 8px;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  font-weight: 800;
}

.primary-button {
  color: #ffffff;
  background: #1d4ed8;
}

.secondary-button {
  color: #344054;
  background: #eef2f7;
}

.companion-stage {
  position: relative;
  min-height: calc(100vh - 56px);
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 35%, rgba(125, 211, 252, 0.34), transparent 34%),
    linear-gradient(180deg, #f9fbff, #e8eef7);
  overflow: hidden;
  display: grid;
  place-items: center;
  padding: 32px;
}

.companion-status {
  position: absolute;
  top: 20px;
  left: 20px;
  display: grid;
  gap: 4px;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  padding: 12px 14px;
}

.companion-status span {
  color: #667085;
  font-size: 13px;
}

.pet-orbit {
  width: min(46vw, 420px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.48);
}

.pet-portrait {
  width: 72%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 46%;
  border: 8px solid #ffffff;
  box-shadow: 0 20px 60px rgba(16, 24, 40, 0.2);
  animation: breathe 4s ease-in-out infinite;
}

.mood-reminding .pet-portrait {
  animation: remind 1.4s ease-in-out infinite;
}

.pet-message {
  position: absolute;
  bottom: 24px;
  max-width: 420px;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 16px;
  color: #344054;
}

.timer-display {
  font-size: 54px;
  font-weight: 900;
  letter-spacing: 0;
  color: #101828;
}

.preset-row,
.control-row,
.sound-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.chip {
  min-height: 36px;
  padding: 0 12px;
  color: #344054;
  background: #eef2f7;
}

.chip.selected {
  color: #ffffff;
  background: #1d4ed8;
}

.focus-controls {
  display: grid;
  gap: 18px;
}

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
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 18px 0;
}

.activity-button {
  display: grid;
  gap: 6px;
  text-align: left;
  padding: 14px;
  color: #344054;
  background: #f8fafc;
  border: 1px solid #e4e7ec;
}

.activity-button strong {
  color: #182230;
}

.activity-button span {
  color: #667085;
  line-height: 1.45;
}

.activity-button em {
  color: #1d4ed8;
  font-style: normal;
  font-weight: 800;
}

@keyframes breathe {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-8px) scale(1.025);
  }
}

@keyframes remind {
  0%,
  100% {
    transform: translateY(0) scale(1.04);
  }
  50% {
    transform: translateY(-14px) scale(1.08);
  }
}

@media (max-width: 860px) {
  .app-shell {
    padding: 14px;
  }

  .app-layout {
    grid-template-columns: 1fr;
  }

  .companion-stage {
    min-height: 480px;
  }

  .pet-orbit {
    width: min(78vw, 360px);
  }

  .activity-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test
npm run build
npm run dev
```

Expected: tests PASS, build PASS, dev server prints a localhost URL.

- [ ] **Step 5: Browser verification**

Open the dev server URL in Browser. Verify:

- Onboarding appears on first load.
- Pet name validation appears if submitting without a name.
- A pet image upload shows a preview.
- After creating a pet, the companion stage and timer controls appear.
- Starting the timer changes the pet mood to focus.
- A short test interval can trigger the reminder overlay.
- Mobile viewport around 390px wide does not overlap text or controls.

- [ ] **Step 6: Commit**

```bash
git add src/App.test.tsx src/styles.css
git commit -m "feat: polish pet companion MVP interface"
```

## Self-Review Notes

- Spec coverage: photo upload, pet name, companion portrait, light animation, default/custom timer, rest suggestions, ambient sound, and full reminder loop are each covered by tasks.
- Scope check: system wallpaper, full 3D pet, automatic device usage detection, complex AI chat, and pet raising mechanics remain excluded from this MVP.
- Type consistency: `CompanionPet`, `CompanionMood`, `RestActivity`, `FocusTimerStatus`, and ambient sound ids are defined before use and reused consistently.
- Verification: unit tests, build, dev-server browser checks, and mobile layout checks are included before completion.
