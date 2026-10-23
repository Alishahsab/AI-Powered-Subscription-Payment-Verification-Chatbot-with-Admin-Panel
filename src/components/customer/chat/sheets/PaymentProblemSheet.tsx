import Sheet from "./Sheet";

const steps = [
  "Cancel your order.",
  "Go to Customer Support and select Other issues.",
  "Submit your issue along with a screenshot.",
  "We will review the issue.",
];

// What to do when sending the payment does not work. Problems are reported as an app issue from Customer Support.
export default function PaymentProblemSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Facing a problem?" subtitle="If you are facing any problem while sending payment:" onClose={onClose}>
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
