import { Clock } from "lucide-react";
import BackToMenuButton from "./BackToMenuButton";

const PENDING_ORDER_NOTICE = "Your order is still waiting for approval. You can place a new order once we approve or cancel it.";

export default function PendingOrderNotice({ customerId }: { customerId: string }) {
  return (
    <div className="max-w-[560px] mx-auto">
      <div className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))] px-4 py-3.5 text-[13.5px] leading-snug">
        <Clock size={17} className="shrink-0 text-[var(--accent)]" />
        <span>{PENDING_ORDER_NOTICE}</span>
      </div>
      <BackToMenuButton customerId={customerId} />
    </div>
  );
}
