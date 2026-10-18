"use client";

import { useState } from "react";
import { ArrowRight, History, Lock, ShieldCheck, Zap } from "lucide-react";
import { classNames } from "@/lib/format";
import { logIn, requestPinReset } from "@/lib/store/customer";
import { cleanDigits, cleanEmail, limits, validateEmail, validatePin } from "@/lib/validation";

type Mode = "login" | "forgot";

const features = [
  { icon: <Zap size={17} />, title: "Code in minutes", text: "Pay, upload proof, get your code right in the chat." },
  { icon: <ShieldCheck size={17} />, title: "Private & secure", text: "Only you can see your chat and payment details." },
  { icon: <History size={17} />, title: "Every code saved", text: "Your codes stay safe in your chat." },
];

const titles: Record<Mode, { heading: string; text: string; button: string }> = {
  login: { heading: "Welcome", text: "Enter your email and 6-digit PIN to open your private chat.", button: "Continue" },
  forgot: { heading: "Reset your PIN", text: "Enter your email and we'll send you a link to set a new PIN.", button: "Send reset link" },
};

const inputClass =
  "mt-1.5 w-full h-12 rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 text-[15.5px] outline-none placeholder:text-[#9aa1ab] focus:bg-[var(--surface)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_12%,transparent)] transition";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const validate = () => {
    if (mode === "forgot") return validateEmail(email);
    return validateEmail(email) ?? validatePin(pin);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("");
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setBusy(true);
    if (mode === "forgot") {
      const result = await requestPinReset(email);
      setBusy(false);
      if (result.error) setError(result.error);
      else setNotice("If an account exists for this email, a reset link is on its way. Check your inbox.");
      return;
    }

    const result = await logIn(email, pin);
    setBusy(false);
    if (result.error) setError(result.error);
  };

  const copy = titles[mode];

  return (
    <div className="h-dvh w-full overflow-hidden flex md:items-center md:justify-center md:p-6">
      <div className="w-full h-full md:h-[min(700px,calc(100dvh-48px))] md:max-w-[1100px] flex flex-col md:flex-row md:rounded-[28px] overflow-hidden md:shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] md:border md:border-[var(--line)]">
        <div className="relative shrink-0 md:w-[46%] bg-[linear-gradient(160deg,#0c2660_0%,#061639_70%)] text-white px-6 pt-7 pb-14 md:p-12 flex flex-col">
          <img src="/logo-wordmark.png" alt="Premium Store" className="h-11 md:h-14 w-auto self-start select-none" draggable={false} />

          <h1 className="mt-6 md:mt-auto md:pt-8 font-[family-name:var(--font-display)] font-bold tracking-[-0.02em] text-[36px] leading-[1.05] md:text-[56px]">
            Premium Access,
            <br />
            <span className="text-[var(--gold)]">Delivered In Minutes.</span>
          </h1>

          <div className="hidden md:block mt-9 space-y-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3.5">
                <span className="size-9 rounded-xl bg-white/10 text-[var(--gold)] grid place-items-center shrink-0">{feature.icon}</span>
                <span>
                  <span className="block font-semibold text-[15px]">{feature.title}</span>
                  <span className="block text-[13.5px] text-white/60">{feature.text}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="hidden md:block mt-auto" />
        </div>

        <div className="relative flex-1 min-h-0 -mt-8 md:mt-0 bg-[var(--surface)] rounded-t-[28px] md:rounded-none flex flex-col">
          <form onSubmit={submit} noValidate className="flex-1 min-h-0 overflow-y-auto px-6 pt-7 pb-6 md:px-14 md:py-12 flex flex-col">
            <div className="md:mt-auto">
              <h2 className="font-[family-name:var(--font-display)] font-bold text-[26px] md:text-[32px] leading-tight">{copy.heading}</h2>
              <p className="mt-1 text-[14px] md:text-[15px] text-[var(--muted)]">{copy.text}</p>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[13.5px] font-semibold">Email</span>
                <input value={email} onChange={(event) => setEmail(cleanEmail(event.target.value))} placeholder="you@example.com" inputMode="email" autoComplete="email" className={inputClass} />
              </label>
              {mode === "login" && (
                <label className="block">
                  <span className="text-[13.5px] font-semibold">6-digit PIN</span>
                  <input
                    value={pin}
                    onChange={(event) => setPin(cleanDigits(event.target.value, limits.pinLength))}
                    placeholder="••••••"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    className={classNames(inputClass, "tracking-[0.3em]")}
                  />
                </label>
              )}
            </div>

            {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
            {notice && <p className="mt-3 text-[13px] text-emerald-700">{notice}</p>}
            {!error && !notice && mode === "login" && <p className="mt-3 text-[12.5px] text-[var(--muted)]">New here? Your account is created with this PIN.</p>}

            <div className="flex justify-between mt-3">
              <button type="button" onClick={() => switchMode(mode === "login" ? "forgot" : "login")} className="text-[13px] font-medium text-[var(--accent)] hover:underline">
                {mode === "login" ? "Forgot PIN?" : "Back to login"}
              </button>
            </div>

            <div className="mt-auto md:mt-7 pt-5 md:pt-0 md:mb-auto">
              <button
                disabled={busy}
                className="group w-full h-[52px] rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[16px] flex items-center justify-center gap-2 shadow-[0_12px_28px_-14px_var(--accent)] hover:brightness-110 transition disabled:opacity-60"
              >
                {busy ? "Please wait…" : copy.button}
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition" />
              </button>
              <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[12.5px] text-[var(--muted)]">
                <Lock size={12} /> Your chat is private and visible only to you
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
