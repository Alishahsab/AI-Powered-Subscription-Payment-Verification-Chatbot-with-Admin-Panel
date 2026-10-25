"use client";

import { useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { isImageFile, prepareImage } from "@/lib/browser";

type ImagePickerProps = {
  image: string | null;
  onChange: (image: string | null) => void;
  label?: string;
};

export default function ImagePicker({ image, onChange, label = "Choose screenshot" }: ImagePickerProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pickFile = async (file?: File) => {
    // Cleared so the same picture can be chosen again after removing it.
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    if (!isImageFile(file)) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      onChange(await prepareImage(file));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "This picture couldn't be opened. Please choose it again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => pickFile(event.target.files?.[0])} />
      <button
        type="button"
        disabled={loading}
        onClick={() => fileInput.current?.click()}
        className="w-full rounded-2xl border border-dashed border-black/15 bg-[var(--bg)]/50 hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] transition overflow-hidden"
      >
        {image ? (
          <img src={image} alt="Selected screenshot" className="w-full max-h-64 object-contain bg-black/5" />
        ) : (
          <div className="py-8 flex flex-col items-center gap-2 text-[var(--muted)]">
            <div className="size-11 rounded-full bg-black/[0.04] grid place-items-center text-[var(--text)]">
              <ImageIcon size={19} />
            </div>
            <div className="text-[14px] font-semibold text-[var(--text)]">{loading ? "Loading…" : label}</div>
            <div className="text-[12px]">PNG or JPG from your gallery</div>
          </div>
        )}
      </button>
      {image && (
        <button type="button" onClick={() => onChange(null)} className="mt-2 text-[12.5px] text-[var(--muted)] hover:text-[var(--text)]">
          Remove screenshot
        </button>
      )}
      {error && <p className="mt-2 text-[12.5px] text-red-600">{error}</p>}
    </div>
  );
}
