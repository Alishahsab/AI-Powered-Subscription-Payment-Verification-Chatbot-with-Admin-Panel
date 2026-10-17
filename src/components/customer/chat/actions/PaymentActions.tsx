import { AlertTriangle, BookOpen, Upload, X } from "lucide-react";
import { classNames } from "@/lib/format";
import { cancelOrder } from "@/lib/store/customer";
import type { PaymentMethod } from "@/lib/types";
import type { OpenSheet } from "../ChatScreen";

type PaymentActionsProps = {
  customerId: string;
  method?: PaymentMethod;
  onOpenSheet: (sheet: OpenSheet) => void;
};

const secondaryClass =
  "h-11 px-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[13px] md:text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition whitespace-nowrap";

export default function PaymentActions({ customerId, method, onOpenSheet }: PaymentActionsProps) {
  const hasSteps = Boolean(method?.steps.trim());

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <button
        onClick={() => onOpenSheet("proof")}
        className="h-12 md:h-11 md:flex-1 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px] flex items-center justify-center gap-2 shadow-[0_10px_24px_-14px_var(--accent)] hover:brightness-110 transition"
      >
        <Upload size={17} /> Upload payment proof
      </button>
      <div className={classNames("grid gap-2 md:flex", hasSteps ? "grid-cols-3" : "grid-cols-2")}>
        {hasSteps && (
          <button onClick={() => onOpenSheet("steps")} className={classNames(secondaryClass, "text-[var(--accent)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)]")}>
            <BookOpen size={15} /> How to pay
          </button>
        )}
        <button onClick={() => onOpenSheet("issue")} className={classNames(secondaryClass, "text-amber-700 hover:border-amber-500/50 hover:bg-amber-500/5")}>
          <AlertTriangle size={15} /> Problem?
        </button>
        <button onClick={() => cancelOrder(customerId)} className={classNames(secondaryClass, "text-[var(--muted)] hover:text-red-700 hover:border-red-300")}>
          <X size={15} /> Cancel
        </button>
      </div>
    </div>
  );
}
