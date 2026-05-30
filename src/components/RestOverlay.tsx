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
  { id: "none", label: "安静" }
];

export function RestOverlay({
  petName,
  activities,
  isResting,
  onStartRest,
  onDismiss,
  onFinishRest
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
