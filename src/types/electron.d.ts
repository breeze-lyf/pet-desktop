declare global {
  interface Window {
    electronAPI?: {
      generateModel: (photoBase64: string) => Promise<string>;
      onTimerStateChange: (cb: (status: string) => void) => () => void;
      movePetWindow: (x: number, y: number) => void;
      syncTimerState: (status: string) => void;
      showPetOverlay: (cartoonPath?: string) => void;
    };
  }
}

export {};
