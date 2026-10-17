import { createOrder, showHowItWorks } from "@/lib/store/customer";
import BackToMenuButton from "./BackToMenuButton";
import { primaryButtonClass, secondaryButtonClass } from "./buttonStyles";

export default function TermsActions({ customerId }: { customerId: string }) {
  return (
    <div className="max-w-[560px] mx-auto space-y-2">
      <button onClick={() => createOrder(customerId)} className={primaryButtonClass}>
        I agree, create order
      </button>
      <button onClick={() => showHowItWorks(customerId)} className={secondaryButtonClass}>
        How does it work?
      </button>
      <BackToMenuButton customerId={customerId} showBack />
    </div>
  );
}
