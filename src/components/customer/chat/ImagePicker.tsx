"use client";

import { useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { compressImage } from "@/lib/browser";

type ImagePickerProps = {
  image: string | null;
  onChange: (image: string | null) => void;
  label?: string;
};

export default function ImagePicker({ image, onChange, label = "Choose screenshot" }: ImagePickerProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const pickFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    onChange(await compressImage(file));
  };

  return (
    <div>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => pickFile(event.target.files?.[0])} />
      <button
        type="button"
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
            <div className="text-[14px] font-semibold text-[var(--text)]">{label}</div>
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
