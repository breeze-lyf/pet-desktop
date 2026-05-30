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
            <p className="eyebrow">桌面陪伴</p>
            <h1>{companion.profile.name} 会提醒你休息</h1>
            <p className="muted">现在先从桌面窗口开始，后续可以升级成悬浮宠物和屏幕角落待机。</p>
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
