"use client";

import { useState } from "react";
import { reportPaymentIssue } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import { limits, validateMessage } from "@/lib/validation";
import ImagePicker from "../ImagePicker";
import Sheet from "./Sheet";

type ReportIssueSheetProps = {
  customerId: string;
  onClose: () => void;
};

export default function ReportIssueSheet({ customerId, onClose }: ReportIssueSheetProps) {
  const state = useAppState();
  const screenshotRequired = state.settings.support.problemScreenshotRequired;
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const problem = validateMessage(description, limits.issueMin, limits.messageMax);
    if (problem) {
      setError(problem);
      return;
    }
    if (screenshotRequired && !screenshot) {
      setError("Please attach a screenshot of the error.");
      return;
    }
    setBusy(true);
    await reportPaymentIssue(customerId, description, screenshot ?? undefined);
    onClose();
  };

  return (
    <Sheet title="Report a problem" subtitle="Tell us what went wrong while sending the payment" onClose={onClose}>
      <textarea
        autoFocus
        value={description}
        maxLength={limits.messageMax}
        onChange={(event) => {
          setDescription(event.target.value);
          setError("");
        }}
        placeholder="Describe the problem, for example the error your bank app shows."
        rows={4}
        className="w-full resize-none rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 py-3 text-[14.5px] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] placeholder:text-[#9aa1ab]"
      />

      <div className="mt-3">
        <ImagePicker image={screenshot} onChange={setScreenshot} label={screenshotRequired ? "Attach the error screenshot" : "Attach the error screenshot (optional)"} />
      </div>

      {error && <p className="mt-2 text-[12.5px] text-red-600">{error}</p>}

      <button onClick={submit} disabled={busy} className="mt-5 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px] disabled:opacity-60">
        {busy ? "Sending…" : "Send report"}
      </button>
    </Sheet>
  );
}
