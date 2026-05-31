import { useEffect, useState } from "react";
import { CompanionMood } from "../domain/pet";

interface CompanionStageProps {
  petName: string;
  portraitDataUrl: string;
  cartoonPath?: string;
  mood: CompanionMood;
}

const moodText: Record<CompanionMood, string> = {
  idle: "安静陪伴中",
  focus: "陪你专注中",
  reminding: "在提醒你休息",
  resting: "等你休息回来"
};

export function CompanionStage({ petName, portraitDataUrl, cartoonPath, mood }: CompanionStageProps) {
  const [cartoonDataUrl, setCartoonDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!cartoonPath || !(window as any).electronAPI?.readFileAsBase64) return;
    (window as any).electronAPI.readFileAsBase64(cartoonPath).then(setCartoonDataUrl).catch(() => {});
  }, [cartoonPath]);

  const imgSrc = cartoonDataUrl ?? portraitDataUrl;
  return (
    <section className={`companion-stage mood-${mood}`} aria-label="宠物陪伴区">
      <div className="companion-status">
        <strong>{petName}</strong>
        <span>{moodText[mood]}</span>
      </div>
      <div className="pet-orbit">
        <img className="pet-portrait" src={imgSrc} alt={`${petName} 的陪伴头像`} />
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