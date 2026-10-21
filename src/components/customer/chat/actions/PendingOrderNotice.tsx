import { Clock } from "lucide-react";
import { botText } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Order } from "@/lib/types";
import BackToMenuButton from "./BackToMenuButton";

export default function PendingOrderNotice({ customerId, order }: { customerId: string; order: Order }) {
  const state = useAppState();

  return (
    <div className="max-w-[560px] mx-auto">
      <div className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))] px-4 py-3.5 text-[13.5px] leading-snug">
        <Clock size={17} className="shrink-0 text-[var(--accent)]" />
        <span>{botText(state, "orderPendingReview", { order_id: order.id })}</span>
      </div>
      <BackToMenuButton customerId={customerId} />
    </div>
  );
}
