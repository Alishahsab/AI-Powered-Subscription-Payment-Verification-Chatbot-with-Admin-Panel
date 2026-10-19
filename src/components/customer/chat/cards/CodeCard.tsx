"use client";

import { useState } from "react";
import { BookOpen, KeyRound, ShieldCheck } from "lucide-react";
import { useAppState } from "@/lib/store/state";
import type { Message } from "@/lib/types";
import { extractCode } from "@/lib/validation";
import CopyButton from "../CopyButton";
import GuideSheet, { guideTitles, type Guide } from "../sheets/GuideSheet";

export default function CodeCard({ message }: { message: Message }) {
  const state = useAppState();
  const [guide, setGuide] = useState<Guide | null>(null);
  const order = state.orders.find((item) => item.id === message.orderId);
  const code = order?.code ?? extractCode(message.text);
  const showsFullMessage = message.text.trim() !== code;

  return (
    <div className="w-[310px] md:w-[400px] max-w-full rounded-2xl rounded-bl-md overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-[0_8px_24px_-14px_rgba(15,23,42,0.25)]">
      {showsFullMessage && <div className="px-4 pt-3.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words">{message.text}</div>}

      {code && (
        <div className="mx-4 mt-3.5 rounded-xl bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--muted)]">
            <KeyRound size={12} /> Your premium code
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-bold text-[18px] tracking-[0.15em]">{code}</span>
            <CopyButton value={code} label="Copy" />
          </div>
        </div>
      )}

      <div className="p-4 grid grid-cols-2 gap-2">
        <GuideButton icon={<BookOpen size={14} />} label={guideTitles.usage} onClick={() => setGuide("usage")} />
        <GuideButton icon={<ShieldCheck size={14} />} label={guideTitles.next_time} onClick={() => setGuide("next_time")} />
      </div>

      {guide && <GuideSheet guide={guide} onClose={() => setGuide(null)} />}
    </div>
  );
}

function GuideButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="min-h-10 px-2.5 py-2 rounded-xl border border-[var(--line)] text-[12.5px] font-semibold text-[var(--accent)] flex items-center justify-center gap-1.5 text-center leading-tight hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))] transition"
    >
      {icon} {label}
    </button>
  );
}
