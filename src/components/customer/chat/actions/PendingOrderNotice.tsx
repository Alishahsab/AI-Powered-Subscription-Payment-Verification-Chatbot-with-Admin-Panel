import { Clock } from "lucide-react";
import type { Order } from "@/lib/types";
import BackToMenuButton from "./BackToMenuButton";

export default function PendingOrderNotice({ customerId, order }: { customerId: string; order: Order }) {
  return (
    <div className="max-w-[560px] mx-auto">
      <div className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))] px-4 py-3.5 text-[13.5px] leading-snug">
        <Clock size={17} className="shrink-0 text-[var(--accent)]" />
        <span>Your order {order.id} is being reviewed by our admin. You will get a reply here soon.</span>
      </div>
      <BackToMenuButton customerId={customerId} />
    </div>
  );
}
