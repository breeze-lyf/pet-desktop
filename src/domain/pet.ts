export type CompanionMood = "idle" | "focus" | "reminding" | "resting";

export interface PetProfile {
  id: string;
  name: string;
  photoDataUrl: string;
  createdAt: string;
}

export interface CompanionPet {
  profile: PetProfile;
  portraitDataUrl: string;
  mood: CompanionMood;
  modelPath?: string;
}
