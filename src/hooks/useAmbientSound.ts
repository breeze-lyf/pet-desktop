import { useEffect, useRef, useState } from "react";

export type AmbientSound = "none" | "soft-tone" | "white-noise";

export function useAmbientSound() {
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

    if (sound === "soft-tone") {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 220;
      gain.gain.value = 0.04;
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      cleanupRef.current = () => {
        oscillator.stop();
        void context.close();
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
        void context.close();
      };
    }

    setCurrentSound(sound);
  }

  useEffect(() => () => stop(), []);

  return { currentSound, play, stop };
}
