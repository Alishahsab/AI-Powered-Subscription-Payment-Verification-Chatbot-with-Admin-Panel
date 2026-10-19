"use client";

import { createPortal } from "react-dom";
import { useAppState } from "@/lib/store/state";
import { CHAT_ROOT_ID } from "../chatRoot";
import Sheet from "./Sheet";

export type Guide = "usage" | "next_time";

export const guideTitles: Record<Guide, string> = {
  usage: "How to use",
  next_time: "Instructions for next time",
};

export default function GuideSheet({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  const { usageSteps, nextTimeSteps } = useAppState().settings;
  const steps = guide === "usage" ? usageSteps : nextTimeSteps;

  return createPortal(
    <Sheet title={guideTitles[guide]} onClose={onClose}>
      <ol className="space-y-2.5">
        {steps.map((step, index) => (
          <li key={step.id} className="rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 py-3 text-[14px] leading-snug">
            <div className="flex items-start gap-3">
              <span className="size-6 shrink-0 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] text-[12px] font-bold grid place-items-center">{index + 1}</span>
              <span className="pt-0.5">{step.text}</span>
            </div>
            {step.image && (
              <a href={step.image} target="_blank" rel="noreferrer" className="mt-2.5 ml-9 block">
                <img src={step.image} alt={`Step ${index + 1}`} className="max-h-56 rounded-lg border border-[var(--line)] object-contain bg-white" />
              </a>
            )}
          </li>
        ))}
      </ol>
      <button onClick={onClose} className="mt-5 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px]">
        Got it
      </button>
    </Sheet>,
    document.getElementById(CHAT_ROOT_ID) ?? document.body
  );
}
