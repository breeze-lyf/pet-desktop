import { ChangeEvent, FormEvent, useState } from "react";
import { Camera } from "lucide-react";
import { CompanionPet } from "../domain/pet";
import { createCompanionFromPhoto, readFileAsDataUrl } from "../lib/petGeneration";

interface OnboardingPanelProps {
  onCreate: (companion: CompanionPet) => void;
}

type Stage = "form" | "generating";

export function OnboardingPanel({ onCreate }: OnboardingPanelProps) {
  const [name, setName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [progress, setProgress] = useState(0);

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setPhotoDataUrl(await readFileAsDataUrl(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError("先给宠物起个名字"); return; }
    if (!photoDataUrl) { setError("请上传一张清晰的宠物照片"); return; }

    setStage("generating");
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 1 : p));
    }, 333);

    try {
      let cartoonPath: string | undefined;
      if (window.electronAPI) {
        cartoonPath = await window.electronAPI.generateModel(photoDataUrl);
      }
      clearInterval(interval);
      setProgress(100);
      const companion = createCompanionFromPhoto({ name, photoDataUrl });
      onCreate({ ...companion, cartoonPath });
    } catch (err) {
      console.error("[3D generation failed]", err);
      clearInterval(interval);
      setError("AI 生成失败，请检查 ARK_API_KEY 是否正确配置");
      setStage("form");
    }
  }

  if (stage === "generating") {
    return (
      <div className="panel onboarding-panel">
        <div className="brand-row">
          <div className="brand-icon">✨</div>
          <div className="brand-text">
            <p className="eyebrow">正在生成</p>
            <h2>为{name}创建卡通形象</h2>
            <p>即梦 AI 正在处理，通常需要 20–60 秒</p>
          </div>
        </div>
        <div className="onboarding-divider" />
        <div className="generating">
          <div className="gen-icon">✨</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#2D1470" }}>正在生成卡通形象...</div>
            <div className="muted" style={{ marginTop: "4px" }}>即梦 AI 正在为{name}绘制专属形象</div>
          </div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "#A78BFA" }}>风格转换中</span>
              <span className="progress-label">{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="panel onboarding-panel" onSubmit={handleSubmit}>
      <div className="brand-row">
        <div className="brand-icon">🐾</div>
        <div className="brand-text">
          <p className="eyebrow">第一步</p>
          <h2>创建你的陪伴宠物</h2>
          <p>上传照片，AI 生成专属卡通形象</p>
        </div>
      </div>
      <div className="onboarding-divider" />

      <label className="field" htmlFor="pet-name">
        <span>宠物名字</span>
        <input
          id="pet-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：奶盖"
        />
      </label>

      <label className="upload-box">
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
        {photoDataUrl ? (
          <img src={photoDataUrl} alt="宠物预览" />
        ) : (
          <>
            <div className="upload-icon">📷</div>
            <strong>点击上传照片</strong>
            <span>支持 JPG / PNG · 建议清晰正面照</span>
          </>
        )}
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button full-width" type="submit">
        ✨ 生成陪伴宠物
      </button>
    </form>
  );
}
