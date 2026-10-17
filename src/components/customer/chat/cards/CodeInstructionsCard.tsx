import { ShieldAlert } from "lucide-react";
import type { Message } from "@/lib/types";

export default function CodeInstructionsCard({ message }: { message: Message }) {
  const [howTo, warning] = message.text.split(/\n\s*\n/);

  return (
    <div className="w-[320px] md:w-[380px] max-w-full rounded-2xl rounded-bl-md border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[var(--surface)] overflow-hidden">
      <div className="px-4 py-3.5 text-[13.5px] leading-relaxed whitespace-pre-line">{howTo}</div>
      {warning && (
        <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20 text-[13px] leading-relaxed text-amber-900 flex gap-2.5">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span className="whitespace-pre-line">{warning}</span>
        </div>
      )}
    </div>
  );
}
