import { CompanionPet } from "../domain/pet";

interface CreateCompanionInput {
  name: string;
  photoDataUrl: string;
  now?: string;
}

export function createCompanionFromPhoto({
  name,
  photoDataUrl,
  now = new Date().toISOString()
}: CreateCompanionInput): CompanionPet {
  return {
    profile: {
      id: crypto.randomUUID(),
      name: name.trim(),
      photoDataUrl,
      createdAt: now
    },
    portraitDataUrl: photoDataUrl,
    mood: "idle"
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("无法读取图片文件"));
    reader.readAsDataURL(file);
  });
}
