import { useEffect, useRef, useState } from "react";
import { CompanionMood, CompanionPet } from "../domain/pet";
import { readJson } from "../lib/storage";

function statusToMood(status: string): CompanionMood {
  if (status === "running") return "focus";
  if (status === "reminding") return "reminding";
  if (status === "resting") return "resting";
  return "idle";
}

const moodAnimation: Record<CompanionMood, string> = {
  idle: "pet-float",
  focus: "pet-breathe",
  reminding: "pet-bounce",
  resting: "pet-sway",
};

export function PetOverlay() {
  const companion = readJson<CompanionPet | null>("pet-companion", null);
  const urlCartoonPath = new URLSearchParams(window.location.search).get("cartoonPath") || undefined;
  const cartoonPath = companion?.cartoonPath ?? urlCartoonPath;
  const portraitPath = companion?.portraitDataUrl;

  const [mood, setMood] = useState<CompanionMood>("idle");
  const [jumped, setJumped] = useState(false);
  const dragStart = useRef<{ x: number; y: number; wx: number; wy: number } | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsub = window.electronAPI.onTimerStateChange((status) => {
      setMood(statusToMood(status));
    });
    return unsub;
  }, []);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragStart.current || !window.electronAPI) return;
      const dx = e.screenX - dragStart.current.x;
      const dy = e.screenY - dragStart.current.y;
      window.electronAPI.movePetWindow(dragStart.current.wx + dx, dragStart.current.wy + dy);
    }
    function onMouseUp() { dragStart.current = null; }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function handleClick() {
    setJumped(true);
    setTimeout(() => setJumped(false), 600);
  }

  function handleMouseDown(e: React.MouseEvent) {
    dragStart.current = { x: e.screenX, y: e.screenY, wx: window.screenX, wy: window.screenY };
  }

  const imgSrc = cartoonPath ? `file://${cartoonPath}` : portraitPath;
  if (!imgSrc) return null;

  const animClass = jumped ? "pet-jump" : moodAnimation[mood];

  return (
    <div
      style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", userSelect: "none", background: "transparent" }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <img
        src={imgSrc}
        alt="pet"
        className={`pet-overlay-img ${animClass}`}
        style={{ width: 130, height: 130, objectFit: "contain", borderRadius: "50%" }}
        draggable={false}
      />
    </div>
  );
}
