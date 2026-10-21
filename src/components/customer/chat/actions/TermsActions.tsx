import { createOrder, showHowItWorks } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import BackToMenuButton from "./BackToMenuButton";
import { primaryButtonClass, secondaryButtonClass } from "./buttonStyles";

const HOW_IT_WORKS_LABEL = "How does it work?";

export default function TermsActions({ customerId }: { customerId: string }) {
  const state = useAppState();
  // Once the steps are shown for these terms, the button is not offered again.
  const lastTap = state.messages.findLast((message) => message.customerId === customerId && message.sender === "customer");
  const stepsShown = lastTap?.text === HOW_IT_WORKS_LABEL;

  return (
    <div className="max-w-[560px] mx-auto space-y-2">
      <button onClick={() => createOrder(customerId)} className={primaryButtonClass}>
        I agree, create order
      </button>
      {!stepsShown && (
        <button onClick={() => showHowItWorks(customerId)} className={secondaryButtonClass}>
          {HOW_IT_WORKS_LABEL}
        </button>
      )}
      <BackToMenuButton customerId={customerId} showBack />
    </div>
  );
}
