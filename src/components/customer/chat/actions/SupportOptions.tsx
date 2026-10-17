import { MessageSquareText } from "lucide-react";
import { askFaq, chooseOtherIssue } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import BackToMenuButton from "./BackToMenuButton";
import OptionButton from "./OptionButton";

export default function SupportOptions({ customerId }: { customerId: string }) {
  const state = useAppState();

  return (
    <div className="grid md:grid-cols-2 gap-2">
      {state.faqs.map((faq) => (
        <OptionButton key={faq.id} onClick={() => askFaq(customerId, faq.id)}>
          <span className="text-[13.5px]">{faq.question}</span>
        </OptionButton>
      ))}
      <button
        onClick={() => chooseOtherIssue(customerId)}
        className="md:col-span-2 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[14.5px] flex items-center justify-center gap-2"
      >
        <MessageSquareText size={17} /> Other issues
      </button>
      <BackToMenuButton customerId={customerId} />
    </div>
  );
}
