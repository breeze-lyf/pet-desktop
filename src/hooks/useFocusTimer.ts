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
