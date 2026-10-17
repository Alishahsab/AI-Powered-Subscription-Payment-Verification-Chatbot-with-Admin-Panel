"use client";

import { useState } from "react";
import { reportPaymentIssue } from "@/lib/store/customer";
import ImagePicker from "../ImagePicker";
import Sheet from "./Sheet";

const commonProblems = ["Invalid account number", "Bank app shows an error", "Transfer limit reached", "Something else"];

type ReportIssueSheetProps = {
  customerId: string;
  onClose: () => void;
};

export default function ReportIssueSheet({ customerId, onClose }: ReportIssueSheetProps) {
  const [problem, setProblem] = useState(commonProblems[0]);
  const [details, setDetails] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const description = details.trim() ? `${problem}. ${details.trim()}` : problem;
    setBusy(true);
    await reportPaymentIssue(customerId, description, screenshot ?? undefined);
    onClose();
  };

  return (
    <Sheet title="Report payment issue" subtitle="Tell us what went wrong while sending the payment" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {commonProblems.map((item) => (
          <button
            key={item}
            onClick={() => setProblem(item)}
            className={
              item === problem
                ? "rounded-xl px-3 py-2.5 text-[13px] font-semibold text-left bg-[var(--accent)] text-[var(--accent-ink)]"
                : "rounded-xl px-3 py-2.5 text-[13px] font-medium text-left bg-[var(--bg)] border border-[var(--line)]"
            }
          >
            {item}
          </button>
        ))}
      </div>

      <textarea
        value={details}
        maxLength={300}
        onChange={(event) => setDetails(event.target.value)}
        placeholder="More details (optional)"
        rows={2}
        className="mt-3 w-full resize-none rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 py-3 text-[14.5px] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] placeholder:text-[#9aa1ab]"
      />

      <div className="mt-3">
        <ImagePicker image={screenshot} onChange={setScreenshot} label="Attach the error screenshot (optional)" />
      </div>

      <button onClick={submit} disabled={busy} className="mt-5 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px] disabled:opacity-60">
        {busy ? "Sending…" : "Send report"}
      </button>
    </Sheet>
  );
}
