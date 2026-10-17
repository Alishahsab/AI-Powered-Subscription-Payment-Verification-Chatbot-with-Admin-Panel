import { Check } from "lucide-react";
import { createOrder, showHowItWorks } from "@/lib/store/customer";
import BackToMenuButton from "./BackToMenuButton";

export default function TermsActions({ customerId }: { customerId: string }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row gap-2">
        <button
          onClick={() => createOrder(customerId)}
          className="h-12 md:h-11 md:flex-1 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px] flex items-center justify-center gap-2 shadow-[0_10px_24px_-14px_var(--accent)] hover:brightness-110 transition"
        >
          <Check size={17} /> I agree, create order
        </button>
        <button onClick={() => showHowItWorks(customerId)} className="h-11 md:px-6 rounded-xl bg-[var(--surface)] border border-[var(--line)] font-semibold text-[14px] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition">
          How does it work?
        </button>
      </div>
      <BackToMenuButton customerId={customerId} showBack />
    </div>
  );
}
