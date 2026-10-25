"use client";

import { createPortal } from "react-dom";
import { Lock } from "lucide-react";
import type { MenuLock } from "@/lib/store/customer";
import { CHAT_ROOT_ID } from "../chatRoot";
import Sheet from "./Sheet";

// Tapping a closed button explains why, in a small pop-up. Nothing is added to the chat.
export default function LockSheet({ lock, onClose }: { lock: MenuLock; onClose: () => void }) {
  return createPortal(
    <Sheet title={lock.title} onClose={onClose}>
      <p className="flex gap-2.5 text-[14.5px] leading-relaxed whitespace-pre-line text-[var(--text)]">
        <Lock size={16} className="shrink-0 mt-1 text-[var(--muted)]" />
        {lock.message}
      </p>
      <button onClick={onClose} className="mt-5 w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px]">
        Got it
      </button>
    </Sheet>,
    document.getElementById(CHAT_ROOT_ID) ?? document.body
  );
}
