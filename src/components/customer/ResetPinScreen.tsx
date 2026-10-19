"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";
import SecretInput from "@/components/SecretInput";
import { useAuthUser } from "@/hooks/useAuthUser";
import { signOut, updatePin } from "@/lib/store/customer";
import { cleanDigits, limits, validatePin } from "@/lib/validation";

const inputClass =
  "mt-1.5 w-full h-12 rounded-xl bg-[#f6f7f9] border border-black/10 px-4 text-[15.5px] tracking-[0.3em] outline-none focus:bg-white focus:border-[#0C2660] focus:ring-4 focus:ring-[#0C2660]/10 transition";

export default function ResetPinScreen() {
  const { user, checking } = useAuthUser("customer");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem = validatePin(pin);
    if (problem) {
      setError(problem);
      return;
    }
    if (pin !== confirmPin) {
      setError("The two PINs do not match.");
      return;
    }

    setBusy(true);
    const result = await updatePin(pin);
    if (result.error) {
      setBusy(false);
      setError(result.error);
      return;
    }
    await signOut();
    setBusy(false);
    setDone(true);
  };

  return (
    <div className="min-h-dvh grid place-items-center px-4 bg-[#eceef2]">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-black/10 shadow-sm p-7">
        <img src="/logo-wordmark-dark.png" alt="Premium Store" className="h-11 w-auto" />

        {done ? (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 size={18} /> Your PIN has been changed
            </div>
            <p className="mt-1.5 text-[14px] text-zinc-500">Log in again with your email and new PIN.</p>
            <Link href="/" className="mt-5 w-full h-12 rounded-xl bg-[#0C2660] text-white font-semibold grid place-items-center">
              Back to login
            </Link>
          </div>
        ) : checking ? (
          <p className="mt-6 text-[14px] text-zinc-500">Checking your reset link…</p>
        ) : !user ? (
          <div className="mt-6 text-[14px] text-zinc-600">
            This reset link is invalid or has expired.
            <Link href="/" className="block mt-4 text-[#0C2660] font-semibold">
              Go back and request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6">
            <h1 className="text-[22px] font-bold">Choose a new PIN</h1>
            <p className="text-[14px] text-zinc-500 mt-1">For {user.email}</p>

            <label className="block mt-5">
              <span className="text-[13.5px] font-semibold">New 6-digit PIN</span>
              <SecretInput value={pin} onChange={(event) => setPin(cleanDigits(event.target.value, limits.pinLength))} inputMode="numeric" autoComplete="new-password" className={inputClass} />
            </label>
            <label className="block mt-4">
              <span className="text-[13.5px] font-semibold">Confirm PIN</span>
              <SecretInput value={confirmPin} onChange={(event) => setConfirmPin(cleanDigits(event.target.value, limits.pinLength))} inputMode="numeric" autoComplete="new-password" className={inputClass} />
            </label>

            {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

            <button disabled={busy} className="mt-6 w-full h-12 rounded-xl bg-[#0C2660] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              <Lock size={16} /> {busy ? "Saving…" : "Save new PIN"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
