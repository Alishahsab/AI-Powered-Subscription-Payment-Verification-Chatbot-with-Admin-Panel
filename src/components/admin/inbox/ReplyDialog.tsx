"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { compressImage } from "@/lib/browser";
import { sendAdminImage, sendAdminMessage } from "@/lib/store/admin";
import { limits } from "@/lib/validation";
import Modal from "../ui/Modal";
import { textareaClass } from "../ui/styles";

const MAX_ATTACHMENTS = 3;

type ReplyDialogProps = {
  customerId: string;
  onClose: () => void;
};

export default function ReplyDialog({ customerId, onClose }: ReplyDialogProps) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const addImage = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const image = await compressImage(file);
    setImages((current) => [...current, image].slice(0, MAX_ATTACHMENTS));
    if (fileInput.current) fileInput.current.value = "";
  };

  const send = async () => {
    if (!text.trim() && images.length === 0) return;
    setBusy(true);
    if (text.trim()) sendAdminMessage(customerId, text.trim(), false);
    for (const image of images) {
      const problem = await sendAdminImage(customerId, image);
      if (problem) {
        setError(problem);
        setBusy(false);
        return;
      }
    }
    onClose();
  };

  return (
    <Modal title="Reply" description="Write a message, attach images, or both." onClose={onClose}>
      <textarea autoFocus rows={4} value={text} maxLength={limits.adminMessageMax} onChange={(event) => setText(event.target.value)} placeholder="Type your reply" className={textareaClass} />

      <div className="mt-3 flex flex-wrap gap-2">
        {images.map((image, index) => (
          <div key={index} className="relative">
            <img src={image} alt={`Attachment ${index + 1}`} className="size-16 rounded-lg border border-zinc-200 object-cover" />
            <button onClick={() => setImages(images.filter((_, position) => position !== index))} className="absolute -top-2 -right-2 size-5 rounded-full bg-zinc-900 text-white grid place-items-center" aria-label="Remove attachment">
              <X size={12} />
            </button>
          </div>
        ))}
        {images.length < MAX_ATTACHMENTS && (
          <>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => addImage(event.target.files?.[0])} />
            <button onClick={() => fileInput.current?.click()} className="size-16 rounded-lg border border-dashed border-zinc-300 text-zinc-500 hover:bg-zinc-50 grid place-items-center" aria-label="Attach an image">
              <ImagePlus size={18} />
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button onClick={onClose} className="h-11 rounded-xl border border-zinc-200 text-[14px] font-semibold text-zinc-700 hover:bg-zinc-50 transition">
          Cancel
        </button>
        <button
          onClick={send}
          disabled={busy || (!text.trim() && images.length === 0)}
          className="h-11 rounded-xl bg-[#0C2660] hover:bg-[#0a1f52] text-white text-[14px] font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          {busy ? "Sending…" : "Send reply"}
        </button>
      </div>
    </Modal>
  );
}
