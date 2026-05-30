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
    dismissReminder: () => setStatus("running")
  };
}
