"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ title, description, onClose, children }: ModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[#061639]/50 backdrop-blur-[2px] fade-in" onClick={onClose} />
      <div className="relative w-full max-w-[460px] rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(6,22,57,0.45)] rise-in">
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-[17px] font-bold text-zinc-900">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
          </div>
          <button onClick={onClose} className="size-8 -mr-2 grid place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label="Close">
            <X size={17} />
          </button>
        </div>
        <div className="px-6 pt-4 pb-6">{children}</div>
      </div>
    </div>
  );
}
