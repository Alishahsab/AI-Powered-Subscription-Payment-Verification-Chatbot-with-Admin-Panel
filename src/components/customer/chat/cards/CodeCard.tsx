"use client";

import { useState } from "react";
import { BookOpen, KeyRound, ShieldCheck } from "lucide-react";
import { codeHeading, stepLines } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Message } from "@/lib/types";
import CopyButton from "../CopyButton";
import Sheet from "../sheets/Sheet";

type Guide = "activation" | "next_time";

export default function CodeCard({ message }: { message: Message }) {
  const state = useAppState();
  const [guide, setGuide] = useState<Guide | null>(null);
  const order = state.orders.find((item) => item.id === message.orderId);
  const { activationGuide, nextTimeGuide } = state.settings;
  const heading = codeHeading(state, order);

  return (
    <div className="w-[310px] md:w-[400px] max-w-full rounded-2xl rounded-bl-md overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-[0_8px_24px_-14px_rgba(15,23,42,0.25)]">
      {heading && <div className="px-4 pt-3.5 text-[13.5px] leading-relaxed">{heading}</div>}

      <div className="mx-4 mt-4 rounded-xl bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-3.5 py-3">
        <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--muted)]">
          <KeyRound size={12} /> Your premium code
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="font-bold text-[18px] tracking-wider break-all">{message.text}</div>
          <CopyButton value={message.text} label="Copy code" />
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-2">
        <GuideButton icon={<BookOpen size={14} />} label="How to activate it" onClick={() => setGuide("activation")} />
        <GuideButton icon={<ShieldCheck size={14} />} label="Instructions for next time" onClick={() => setGuide("next_time")} />
      </div>

      {guide && (
        <Sheet title={guide === "activation" ? "How to activate it" : "Instructions for next time"} onClose={() => setGuide(null)}>
          <ol className="space-y-2.5">
            {stepLines(guide === "activation" ? activationGuide : nextTimeGuide).map((line, index) => (
              <li key={line} className="flex items-start gap-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 py-3 text-[14px] leading-snug">
                <span className="size-6 shrink-0 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] text-[12px] font-bold grid place-items-center">{index + 1}</span>
                <span className="pt-0.5">{line.replace(/^[•\-]\s*/, "")}</span>
              </li>
            ))}
          </ol>
          <button onClick={() => setGuide(null)} className="mt-5 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px]">
            Got it
          </button>
        </Sheet>
      )}
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
