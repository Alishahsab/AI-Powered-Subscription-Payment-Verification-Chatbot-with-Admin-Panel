"use client";

import { createPortal } from "react-dom";
import type { Faq } from "@/lib/types";
import { CHAT_ROOT_ID } from "../chatRoot";
import Sheet from "./Sheet";

// A question's answer in a small pop-up. Nothing is added to the chat or saved.
export default function FaqSheet({ faq, onClose }: { faq: Faq; onClose: () => void }) {
  return createPortal(
    <Sheet title={faq.question} onClose={onClose}>
      <p className="text-[14.5px] leading-relaxed whitespace-pre-line text-[var(--text)]">{faq.answer}</p>
      <button onClick={onClose} className="mt-5 w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px]">
        Got it
      </button>
    </Sheet>,
    document.getElementById(CHAT_ROOT_ID) ?? document.body
  );
}
