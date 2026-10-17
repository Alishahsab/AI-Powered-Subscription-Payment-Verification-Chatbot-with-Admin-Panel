import { BookOpen } from "lucide-react";
import { useAppState } from "@/lib/store/state";
import type { Message } from "@/lib/types";

export default function WalletStepsCard({ message }: { message: Message }) {
  const state = useAppState();
  const order = state.orders.find((item) => item.id === message.orderId);
  const steps = message.text.split("\n").filter(Boolean);

  return (
    <div className="w-[320px] md:w-[380px] max-w-full rounded-2xl rounded-bl-md border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[var(--surface)] px-4 py-3.5">
      <div className="flex items-center gap-2 font-semibold text-[14.5px]">
        <BookOpen size={16} className="text-[var(--accent)]" />
        Steps for {order?.methodName ?? "your wallet"}
      </div>
      <ol className="mt-2.5 space-y-1.5 text-[13.5px] leading-snug text-[var(--text)]/85">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
