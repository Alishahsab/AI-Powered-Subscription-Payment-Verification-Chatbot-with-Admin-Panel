import { createOrder, showHowItWorks } from "@/lib/store/customer";
import BackToMenuButton from "./BackToMenuButton";

export default function TermsActions({ customerId }: { customerId: string }) {
  return (
    <div className="space-y-2">
      <button onClick={() => createOrder(customerId)} className="w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px]">
        I agree, create order
      </button>
      <button onClick={() => showHowItWorks(customerId)} className="w-full h-11 rounded-xl bg-[var(--surface)] border border-[var(--line)] font-semibold text-[14px]">
        How does it work?
      </button>
      <BackToMenuButton customerId={customerId} />
    </div>
  );
}
