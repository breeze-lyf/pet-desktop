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
  onReset
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
