"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { galleryAccept, isImageFile, MAX_ORIGINAL_BYTES, prepareImageWithStatus } from "@/lib/browser";

const WAIT_FOR_FILE_MS = 1500;

type Source = "gallery" | "files";

type ImagePickerProps = {
  image: string | null;
  onChange: (image: string | null) => void;
  label?: string;
};

export default function ImagePicker({ image, onChange, label = "Choose screenshot" }: ImagePickerProps) {
  const galleryInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);
  const stopWaiting = useRef<(() => void) | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // An old browser could not make the picture smaller; the picture still goes, with a hint to update.
  const [outdated, setOutdated] = useState(false);
  const [missed, setMissed] = useState<Source[]>([]);

  useEffect(() => () => stopWaiting.current?.(), []);

  // Some browsers come back from the picker without giving the page a file, and without any error.
  const waitForFile = (source: Source) => {
    stopWaiting.current?.();
    let timer: number | undefined;

    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        stopWaiting.current?.();
        setMissed((list) => (list.includes(source) ? list : [...list, source]));
      }, WAIT_FOR_FILE_MS);
    };

    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    stopWaiting.current = () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
      window.clearTimeout(timer);
      stopWaiting.current = null;
    };
  };

  const openPicker = (source: Source) => {
    const input = source === "gallery" ? galleryInput.current : filesInput.current;
    if (!input) return;
    if (source === "gallery") input.accept = galleryAccept();
    setError("");
    waitForFile(source);
    input.click();
  };

  const pickFile = async (input: HTMLInputElement, maxBytes = Infinity) => {
    const file = input.files?.[0];
    // Cleared so the same picture can be chosen again after removing it.
    input.value = "";
    if (!file) return;
    stopWaiting.current?.();
    setMissed([]);
    if (!isImageFile(file)) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > maxBytes) {
      setError("This picture is too large. Please choose a screenshot under 1 MB.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const prepared = await prepareImageWithStatus(file);
      setOutdated(prepared.original);
      onChange(prepared.image);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "This picture couldn't be opened. Please choose it again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <input ref={galleryInput} type="file" accept="image/*" hidden onChange={(event) => pickFile(event.target)} />
      <input ref={filesInput} type="file" hidden onChange={(event) => pickFile(event.target, MAX_ORIGINAL_BYTES)} />
      <button
        type="button"
        disabled={loading}
        onClick={() => openPicker("gallery")}
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
      {image ? (
        <button type="button" onClick={() => onChange(null)} className="mt-2 text-[12.5px] text-[var(--muted)] hover:text-[var(--text)]">
          Remove screenshot
        </button>
      ) : (
        <button type="button" disabled={loading} onClick={() => openPicker("files")} className="mt-2 text-[12.5px] text-[var(--muted)] hover:text-[var(--text)]">
          <span className="font-semibold text-[var(--text)] underline">Choose from Files</span> · under 1 MB
        </button>
      )}
      {error && <p className="mt-2 text-[12.5px] text-red-600">{error}</p>}
      {!image && !error && missed.length > 0 && (
        <p className="mt-2 text-[12.5px] text-red-600">
          {missed.length > 1 ? "Picture still wasn't added. Please update Chrome, then try again." : "Picture wasn't added. Please try again, or use Choose from Files."}
        </p>
      )}
      {image && outdated && <p className="mt-2 text-[12.5px] text-amber-700">Your browser is out of date. Please update it for a smoother experience.</p>}
    </div>
  );
}
