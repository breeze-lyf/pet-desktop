import { ChangeEvent, FormEvent, useState } from "react";
import { Camera } from "lucide-react";
import { CompanionPet } from "../domain/pet";
import { createCompanionFromPhoto, readFileAsDataUrl } from "../lib/petGeneration";

interface OnboardingPanelProps {
  onCreate: (companion: CompanionPet) => void;
}

export function OnboardingPanel({ onCreate }: OnboardingPanelProps) {
  const [name, setName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [error, setError] = useState("");

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setPhotoDataUrl(await readFileAsDataUrl(file));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setError("先给宠物起个名字");
      return;
    }

    if (!photoDataUrl) {
      setError("请上传一张清晰的宠物照片");
      return;
    }

    onCreate(createCompanionFromPhoto({ name, photoDataUrl }));
  }

  return (
    <form className="panel onboarding-panel" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">第一步</p>
        <h2>创建你的陪伴宠物</h2>
        <p className="muted">先上传一张宠物照片。MVP 会把它作为轻动态陪伴头像。</p>
      </div>

      <label className="field">
        <span>宠物名字</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：奶盖" />
      </label>

      <label className="upload-box">
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
        {photoDataUrl ? (
          <img src={photoDataUrl} alt="宠物预览" />
        ) : (
          <span>
            <Camera size={22} />
            上传宠物照片
          </span>
        )}
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button" type="submit">
        生成陪伴宠物
      </button>
    </form>
  );
}
