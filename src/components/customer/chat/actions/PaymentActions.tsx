import { AlertTriangle, Upload, X } from "lucide-react";
import { cancelOrder } from "@/lib/store/customer";
import type { OpenSheet } from "../ChatScreen";

type PaymentActionsProps = {
  customerId: string;
  onOpenSheet: (sheet: OpenSheet) => void;
};

export default function PaymentActions({ customerId, onOpenSheet }: PaymentActionsProps) {
  return (
    <div className="space-y-2">
      <button onClick={() => onOpenSheet("proof")} className="w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px] flex items-center justify-center gap-2">
        <Upload size={17} /> Upload payment proof
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onOpenSheet("issue")} className="h-11 rounded-xl border border-amber-500/40 bg-amber-500/5 text-amber-800 text-[13.5px] font-semibold flex items-center justify-center gap-1.5">
          <AlertTriangle size={15} /> Report payment issue
        </button>
        <button onClick={() => cancelOrder(customerId)} className="h-11 rounded-xl border border-[var(--line)] text-[13.5px] font-semibold text-[var(--muted)] hover:text-red-700 flex items-center justify-center gap-1.5">
          <X size={15} /> Cancel order
        </button>
      </div>
    </div>
  );
}
