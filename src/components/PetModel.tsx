import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Group } from "three";
import { CompanionMood } from "../domain/pet";

interface PetModelProps {
  modelPath: string;
  mood: CompanionMood;
  onClick: () => void;
}

export function PetModel({ modelPath, mood, onClick }: PetModelProps) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);
  const [jumping, setJumping] = useState(false);
  const jumpRef = useRef(0);

  const cloned = scene.clone();

  useEffect(() => {
    if (jumping) {
      jumpRef.current = 0;
      const id = setTimeout(() => setJumping(false), 600);
      return () => clearTimeout(id);
    }
  }, [jumping]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const g = groupRef.current;

    if (jumping) {
      jumpRef.current += delta;
      const progress = jumpRef.current / 0.6;
      g.position.y = Math.sin(progress * Math.PI) * 0.3;
      return;
    }

    if (mood === "idle") {
      g.position.y = Math.sin(t * 0.8) * 0.05;
      g.rotation.y += delta * 0.2;
    } else if (mood === "focus") {
      g.position.y = 0;
      g.rotation.y = 0;
      if (Math.random() < 0.002) {
        g.rotation.x = (Math.random() - 0.5) * 0.1;
      } else {
        g.rotation.x *= 0.95;
      }
    } else if (mood === "reminding") {
      g.position.y = Math.abs(Math.sin(t * 5.2)) * 0.15;
      g.rotation.y = 0;
    } else if (mood === "resting") {
      g.position.y = 0;
      g.rotation.z = Math.sin(t * 1.5) * 0.1;
    }
  });

  return (
    <>
      <primitive
        ref={groupRef}
        object={cloned}
        onClick={onClick ? () => { setJumping(true); onClick(); } : undefined}
        scale={[1.2, 1.2, 1.2]}
      />
      <OrbitControls enabled={false} />
    </>
  );
}
