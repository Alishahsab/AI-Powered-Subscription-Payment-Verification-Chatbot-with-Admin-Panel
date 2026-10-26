"use client";

import { useState } from "react";
import { NO_INTERNET_MESSAGE, isOnline } from "@/lib/store/connection";
import { saveWhatsApp } from "@/lib/store/customer";
import { cleanDigits, limits, validateWhatsApp } from "@/lib/validation";

type WhatsAppScreenProps = {
  customerId: string;
  onSignOut: () => void;
};

export default function WhatsAppScreen({ customerId, onSignOut }: WhatsAppScreenProps) {
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem = validateWhatsApp(whatsapp);
    if (problem) {
      setError(problem);
      return;
    }
    if (!isOnline()) {
      setError(NO_INTERNET_MESSAGE);
      return;
    }

    setError("");
    setBusy(true);
    const result = await saveWhatsApp(customerId, whatsapp);
    setBusy(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="flex-1 grid place-items-center px-5 py-10">
      <form onSubmit={submit} noValidate className="w-full max-w-[420px] rounded-3xl bg-[var(--surface)] border border-[var(--line)] p-6 md:p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)]">
        <img src="/logo-icon.png" alt="Premium Store" className="size-12 rounded-2xl" />
        <h1 className="mt-5 font-[family-name:var(--font-display)] font-bold text-[24px] leading-tight">Add your WhatsApp number</h1>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">We use it to help you quickly if there is a problem with your order.</p>

        <label className="mt-6 block">
          <span className="text-[13.5px] font-semibold">WhatsApp number</span>
          <input
            autoFocus
            value={whatsapp}
            onChange={(event) => setWhatsapp(cleanDigits(event.target.value, limits.whatsappLength))}
            placeholder="03001234567"
            inputMode="numeric"
            autoComplete="tel"
            className="mt-1.5 w-full h-12 rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 text-[15.5px] outline-none placeholder:text-[#9aa1ab] focus:bg-[var(--surface)] focus:border-[var(--accent)] transition"
          />
          <span className="mt-1 block text-[12px] text-[var(--muted)]">Enter your valid 11-digit WhatsApp number</span>
        </label>

        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

        <button disabled={busy} className="mt-6 w-full h-[52px] rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[16px] hover:brightness-110 transition disabled:opacity-60">
          {busy ? "Please wait…" : "Continue"}
        </button>
        <button type="button" onClick={onSignOut} className="mt-3 w-full text-[13px] font-medium text-[var(--muted)] hover:text-[var(--text)]">
          Sign out
        </button>
      </form>
    </div>
  );
}
