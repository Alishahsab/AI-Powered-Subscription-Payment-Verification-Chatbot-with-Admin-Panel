"use client";

import { useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { submitSupportIssue } from "@/lib/store/customer";
import { limits, validateMessage } from "@/lib/validation";
import ImagePicker from "../ImagePicker";
import BackToMenuButton from "./BackToMenuButton";

export default function IssueComposer({ customerId }: { customerId: string }) {
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const problem = validateMessage(description, limits.issueMin, limits.messageMax);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    await submitSupportIssue(customerId, description.trim(), screenshot ?? undefined);
  };

  return (
    <div className="space-y-2.5">
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

      <div className="flex justify-between text-[12px]">
        <span className="text-red-600">{error}</span>
        <span className="text-[var(--muted)]">
          {description.length}/{limits.messageMax}
        </span>
      </div>

      {showPicker ? (
        <ImagePicker image={screenshot} onChange={setScreenshot} label="Attach a screenshot (optional)" />
      ) : (
        <button onClick={() => setShowPicker(true)} className="text-[13px] font-medium text-[var(--accent)] flex items-center gap-1.5">
          <Paperclip size={14} /> Attach a screenshot (optional)
        </button>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send size={16} /> {busy ? "Sending…" : "Send to our team"}
      </button>
      <BackToMenuButton customerId={customerId} showBack />
    </div>
  );
}
