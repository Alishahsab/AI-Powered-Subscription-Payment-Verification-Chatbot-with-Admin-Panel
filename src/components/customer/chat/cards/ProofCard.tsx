import { Check, ImageIcon } from "lucide-react";
import { formatTime } from "@/lib/format";
import { useAppState } from "@/lib/store/state";
import type { Message } from "@/lib/types";

export default function ProofCard({ message }: { message: Message }) {
  const state = useAppState();
  const order = state.orders.find((item) => item.id === message.orderId);

  return (
    <div className="w-[240px] md:w-[280px] rounded-2xl rounded-br-md overflow-hidden bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)]">
      {order?.screenshot ? (
        <img src={order.screenshot} alt="Payment screenshot" className="w-full h-36 object-cover object-top" />
      ) : (
        <div className="h-20 grid place-items-center text-[12px] text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <ImageIcon size={14} /> Screenshot removed
          </span>
        </div>
      )}
      <div className="px-3 py-2.5 text-[12.5px]">
        <div className="font-semibold flex items-center gap-1.5">
          <Check size={13} className="text-[var(--accent)]" /> Payment proof submitted
        </div>
        <div className="text-[var(--muted)] mt-0.5">
          From {order?.senderName ?? "N/A"} · {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
