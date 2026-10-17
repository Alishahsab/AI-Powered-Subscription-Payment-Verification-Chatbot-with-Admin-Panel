"use client";

import { useState } from "react";
import { useNow } from "@/hooks/useNow";
import { createSampleReceipt } from "@/lib/demo/receipt";
import { formatCountdown } from "@/lib/format";
import { submitPaymentProof } from "@/lib/store/customer";
import { getActiveOrder } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import ImagePicker from "../ImagePicker";
import Sheet from "./Sheet";

type UploadProofSheetProps = {
  customerId: string;
  onClose: () => void;
};

export default function UploadProofSheet({ customerId, onClose }: UploadProofSheetProps) {
  const state = useAppState();
  const now = useNow(1000);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [senderName, setSenderName] = useState("");
  const [error, setError] = useState("");

  const order = getActiveOrder(state, customerId);
  if (!order) return null;

  const updateSenderName = (value: string) => {
    setSenderName(value.replace(/[^A-Za-z .'-]/g, "").replace(/\s{2,}/g, " "));
  };

  const fillSampleReceipt = () => {
    const name = senderName.trim() || "Ali Raza";
    setSenderName(name);
    setScreenshot(createSampleReceipt(order.amount, name, order.methodName, now));
  };

  const submit = () => {
    if (!screenshot) {
      setError("Please attach your payment screenshot.");
      return;
    }
    const problem = submitPaymentProof(customerId, screenshot, senderName);
    if (problem) setError(problem);
    else onClose();
  };

  return (
    <Sheet title="Upload payment proof" subtitle={`Order ${order.id} · Rs ${order.amount.toLocaleString()} · ${formatCountdown(order.expiresAt - now)} left`} onClose={onClose}>
      <ImagePicker image={screenshot} onChange={setScreenshot} />

      <label className="block mt-4">
        <span className="text-[13px] font-medium">Sender account name</span>
        <input
          value={senderName}
          onChange={(event) => updateSenderName(event.target.value)}
          placeholder="Name on the account you paid from"
          className="mt-1.5 w-full h-12 rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 text-[15px] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] placeholder:text-[#9aa1ab]"
        />
        <span className="text-[11.5px] text-[var(--muted)] mt-1 block">Letters only, exactly as shown on your receipt. Not the account number.</span>
      </label>

      {error && <div className="mt-3 text-[13px] text-red-700 bg-red-500/10 rounded-lg px-3 py-2">{error}</div>}

      <button onClick={submit} className="mt-5 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px]">
        Submit for verification
      </button>
      <button onClick={fillSampleReceipt} className="mt-3 w-full text-[12px] text-[var(--muted)] hover:text-[var(--text)]">
        Use a sample receipt (demo)
      </button>
    </Sheet>
  );
}
