"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import BrandIcon from "@/components/BrandIcon";

const NOTE = "Private chat. Messages are deleted after 15 days.";

type DisappearingLogoProps = {
  size: number;
  className?: string;
  keepsChat?: boolean;
};

// The store logo with a small timer badge, like disappearing messages in chat apps.
// Tapping it explains that the chat is cleared after 15 days.
export default function DisappearingLogo({ size, className = "", keepsChat = false }: DisappearingLogoProps) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const badge = Math.round(size * 0.55);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  if (keepsChat) return <BrandIcon size={size} className={className} />;

  return (
    <div ref={wrapper} className="relative shrink-0" style={{ width: size, height: size }}>
      <button type="button" onClick={() => setOpen(!open)} className="block" aria-label="Disappearing messages" aria-expanded={open}>
        <BrandIcon size={size} className={className} />
        <span
          className="absolute -bottom-1.5 -right-1.5 grid place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] ring-2 ring-[var(--surface)] shadow-md"
          style={{ width: badge, height: badge }}
        >
          <Timer size={Math.round(badge * 0.66)} strokeWidth={2.6} />
        </span>
      </button>
      {open && (
        <div role="status" className="absolute left-0 top-full mt-2.5 z-30 w-60 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-[12.5px] leading-snug shadow-lg fade-in flex gap-2">
          <Timer size={15} className="shrink-0 mt-px text-[var(--accent)]" />
          <span>{NOTE}</span>
        </div>
      )}
    </div>
  );
}
