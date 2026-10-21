"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import BrandIcon from "@/components/BrandIcon";

const NOTE = "Private chat. Messages are deleted after 15 days.";

type DisappearingLogoProps = {
  size: number;
  className?: string;
};

// The store logo with a small timer badge, like disappearing messages in chat apps.
// Tapping it explains that the chat is cleared after 15 days.
export default function DisappearingLogo({ size, className = "" }: DisappearingLogoProps) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const badge = Math.round(size * 0.46);

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

  return (
    <div ref={wrapper} className="relative shrink-0" style={{ width: size, height: size }}>
      <button type="button" onClick={() => setOpen(!open)} className="block" aria-label="Disappearing messages" aria-expanded={open}>
        <BrandIcon size={size} className={className} />
        <span
          className="absolute -bottom-1 -right-1 grid place-items-center rounded-full bg-[var(--surface)] text-[var(--accent)] ring-2 ring-[var(--surface)] shadow-sm"
          style={{ width: badge, height: badge }}
        >
          <Timer size={Math.round(badge * 0.72)} strokeWidth={2.4} />
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
