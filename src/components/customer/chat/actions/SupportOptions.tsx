import { useState } from "react";
import { useNow } from "@/hooks/useNow";
import { chooseOtherIssue, findMenuLock, type MenuLock } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import type { Faq } from "@/lib/types";
import FaqSheet from "../sheets/FaqSheet";
import LockSheet from "../sheets/LockSheet";
import BackToMenuButton from "./BackToMenuButton";
import { primaryButtonClass } from "./buttonStyles";

export default function SupportOptions({ customerId }: { customerId: string }) {
  const state = useAppState();
  const [openFaq, setOpenFaq] = useState<Faq | null>(null);
  const [shownLock, setShownLock] = useState<MenuLock | null>(null);
  // While the store is closed, common questions stay open and only new requests close.
  const lock = findMenuLock(state, customerId, "other_issues", useNow(1000));

  return (
    <div>
      <div className="text-[12px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold mb-2.5 text-center">Common questions</div>
      <div className="flex flex-wrap justify-center gap-2">
        {state.faqs.map((faq) => (
          <button
            key={faq.id}
            onClick={() => setOpenFaq(faq)}
            className="px-3.5 md:px-4 py-1.5 md:py-2 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[13px] md:text-[13.5px] font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))] active:scale-[0.98] transition"
          >
            {faq.question}
          </button>
        ))}
      </div>
      <div className="max-w-[560px] mx-auto mt-3.5">
        <button
          onClick={() => (lock ? setShownLock(lock) : chooseOtherIssue(customerId))}
          aria-disabled={Boolean(lock)}
          className={`${primaryButtonClass} ${lock ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Other issues
        </button>
        <BackToMenuButton customerId={customerId} />
      </div>
      {openFaq && <FaqSheet faq={openFaq} onClose={() => setOpenFaq(null)} />}
      {shownLock && <LockSheet lock={shownLock} onClose={() => setShownLock(null)} />}
    </div>
  );
}
