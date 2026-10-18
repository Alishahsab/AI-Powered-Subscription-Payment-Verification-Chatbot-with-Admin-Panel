import { fillPlaceholders, getActiveOrder, orderBank, stepLines } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { PaymentMethod } from "@/lib/types";
import MethodLogo from "../MethodLogo";
import Sheet from "./Sheet";

type PaymentStepsSheetProps = {
  customerId: string;
  method: PaymentMethod;
  onClose: () => void;
};

export default function PaymentStepsSheet({ customerId, method, onClose }: PaymentStepsSheetProps) {
  const state = useAppState();
  const bank = orderBank(state, getActiveOrder(state, customerId));
  const steps = stepLines(fillPlaceholders(method.steps, state, bank));

  return (
    <Sheet title={`How to pay with ${method.name}`} subtitle="Follow these steps in your app" onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <MethodLogo methodId={method.id} className="size-12" />
        <span className="font-semibold text-[15px]">{method.name}</span>
      </div>
      <ol className="space-y-2.5">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 py-3 text-[14px] leading-snug">
            <span className="size-6 shrink-0 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] text-[12px] font-bold grid place-items-center">{index + 1}</span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <button onClick={onClose} className="mt-5 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px]">
        Got it
      </button>
    </Sheet>
  );
}
