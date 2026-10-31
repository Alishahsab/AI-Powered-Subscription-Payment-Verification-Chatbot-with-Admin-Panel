import { Clock } from "lucide-react";

export default function ClosingOrderNotice() {
  return (
    <div className="max-w-[560px] mx-auto flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))] px-4 py-3.5 text-[13.5px] leading-snug">
      <Clock size={17} className="shrink-0 text-[var(--accent)]" />
      <span>Payment time is over. Closing this order, please wait a few seconds.</span>
    </div>
  );
}
