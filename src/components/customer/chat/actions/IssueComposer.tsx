"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { submitSupportIssue } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import { limits, validateMessage } from "@/lib/validation";
import ImagePicker from "../ImagePicker";
import BackToMenuButton from "./BackToMenuButton";
import { primaryButtonClass } from "./buttonStyles";

export default function IssueComposer({ customerId }: { customerId: string }) {
  const state = useAppState();
  const screenshotRequired = state.settings.support.issueScreenshotRequired;
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const problem = validateMessage(description, limits.issueMin, limits.messageMax);
    if (problem) {
      setError(problem);
      return;
    }
    if (screenshotRequired && !screenshot) {
      setError("Please attach a screenshot so our team can see the problem.");
      return;
    }
    setBusy(true);
    await submitSupportIssue(customerId, description.trim(), screenshot ?? undefined);
  };

  return (
    <div className="max-w-[560px] mx-auto space-y-2.5">
      <textarea
        autoFocus
        value={description}
        maxLength={limits.messageMax}
        onChange={(event) => {
          setDescription(event.target.value);
          setError("");
        }}
        placeholder="Describe your issue. If it's about a code, include the code and the email you use in the app."
        rows={3}
        className="w-full resize-none rounded-2xl bg-[var(--surface)] border border-[var(--line)] px-4 py-3 text-[14.5px] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] placeholder:text-[#9aa1ab]"
      />

      <ImagePicker image={screenshot} onChange={setScreenshot} label={screenshotRequired ? "Attach a screenshot" : "Attach a screenshot (optional)"} />

      <div className="flex justify-between text-[12px]">
        <span className="text-red-600">{error}</span>
        <span className="text-[var(--muted)]">
          {description.length}/{limits.messageMax}
        </span>
      </div>

      <button onClick={submit} disabled={busy} className={`${primaryButtonClass} disabled:opacity-50`}>
        <Send size={16} /> {busy ? "Sending…" : "Send to our team"}
      </button>
      <BackToMenuButton customerId={customerId} showBack />
    </div>
  );
}
