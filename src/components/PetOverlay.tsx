import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CompanionMood, CompanionPet } from "../domain/pet";
import { readJson } from "../lib/storage";
import { PetModel } from "./PetModel";

declare global {
  interface Window {
    electronAPI: {
      onTimerStateChange: (cb: (status: string) => void) => () => void;
      movePetWindow: (x: number, y: number) => void;
    };
  }
}

function statusToMood(status: string): CompanionMood {
  if (status === "running") return "focus";
  if (status === "reminding") return "reminding";
  if (status === "resting") return "resting";
  return "idle";
}

export function PetOverlay() {
  const companion = readJson<CompanionPet | null>("pet-companion", null);
  const [mood, setMood] = useState<CompanionMood>("idle");
  const dragStart = useRef<{ x: number; y: number; wx: number; wy: number } | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsub = window.electronAPI.onTimerStateChange((status) => {
      setMood(statusToMood(status));
    });
    return unsub;
  }, []);

  function handleMouseDown(e: React.MouseEvent) {
    dragStart.current = { x: e.screenX, y: e.screenY, wx: window.screenX, wy: window.screenY };
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragStart.current || !window.electronAPI) return;
      const dx = e.screenX - dragStart.current.x;
      const dy = e.screenY - dragStart.current.y;
      window.electronAPI.movePetWindow(dragStart.current.wx + dx, dragStart.current.wy + dy);
    }
    function onMouseUp() {
      dragStart.current = null;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (!companion?.modelPath) return null;

  return (
    <div
      style={{ width: 160, height: 160, cursor: "grab", userSelect: "none" }}
      onMouseDown={handleMouseDown}
    >
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <PetModel
          modelPath={companion.modelPath}
          mood={mood}
          onClick={() => {}}
        />
      </Canvas>
    </div>
  );
}
