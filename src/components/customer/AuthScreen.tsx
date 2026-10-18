"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, History, Lock, ShieldCheck, Zap } from "lucide-react";
import { classNames } from "@/lib/format";
import { isEmailRegistered, requestPinReset, signIn, signUp } from "@/lib/store/customer";
import { cleanDigits, cleanEmail, limits, validateEmail, validatePin } from "@/lib/validation";

type Step = "email" | "login" | "create" | "forgot";

const features = [
  { icon: <Zap size={17} />, title: "Code in minutes", text: "Pay, upload proof, get your code right in the chat." },
  { icon: <ShieldCheck size={17} />, title: "Private & secure", text: "Only you can see your chat and payment details." },
  { icon: <History size={17} />, title: "Every code saved", text: "Your codes stay safe in your chat." },
];

const titles: Record<Step, { heading: string; text: string; button: string }> = {
  email: { heading: "Welcome", text: "Enter your email to continue.", button: "Continue" },
  login: { heading: "Welcome back", text: "Enter your 6-digit PIN to open your chat.", button: "Log in" },
  create: { heading: "Create your PIN", text: "New here? Choose a 6-digit PIN for your account.", button: "Create account" },
  forgot: { heading: "Reset your PIN", text: "We'll email you a link to set a new PIN.", button: "Send reset link" },
};

const inputClass =
  "mt-1.5 w-full h-12 rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 text-[15.5px] outline-none placeholder:text-[#9aa1ab] focus:bg-[var(--surface)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_12%,transparent)] transition";

const linkClass = "text-[13px] font-medium text-[var(--accent)] hover:underline flex items-center gap-1";

export default function AuthScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const goTo = (next: Step) => {
    setStep(next);
    setPin("");
    setConfirmPin("");
    setError("");
    setNotice("");
  };

  const validate = () => {
    if (step === "email" || step === "forgot") return validateEmail(email);
    const pinProblem = validatePin(pin);
    if (pinProblem) return pinProblem;
    if (step === "create" && pin !== confirmPin) return "The two PINs do not match.";
    return null;
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

    if (step === "email") {
      const registered = await isEmailRegistered(email);
      setBusy(false);
      if (registered === null) setError("We couldn't check this email right now. Please try again.");
      else goTo(registered ? "login" : "create");
      return;
    }

    if (step === "forgot") {
      const result = await requestPinReset(email);
      setBusy(false);
      if (result.error) setError(result.error);
      else setNotice("A reset link is on its way. Open it from your inbox to set a new PIN.");
      return;
    }

    const result = step === "login" ? await signIn(email, pin) : await signUp(email, pin);
    setBusy(false);
    if (result.error) setError(result.error);
  };

  const copy = titles[step];
  const askingPin = step === "login" || step === "create";

  return (
    <div className="h-dvh w-full overflow-hidden flex md:items-center md:justify-center md:p-6">
      <div className="w-full h-full md:h-[min(700px,calc(100dvh-48px))] md:max-w-[1100px] flex flex-col md:flex-row md:rounded-[28px] overflow-hidden md:shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] md:border md:border-[var(--line)]">
        <div className="relative shrink-0 md:w-[46%] bg-[linear-gradient(160deg,#0c2660_0%,#061639_70%)] text-white px-6 pt-7 pb-14 md:p-12 flex flex-col">
          <img src="/logo-wordmark.png" alt="Premium Store" className="h-11 md:h-14 w-auto self-start select-none" draggable={false} />

          <h1 className="mt-6 md:mt-auto md:pt-8 font-[family-name:var(--font-display)] font-extrabold tracking-[-0.02em] text-[30px] leading-[1.08] md:text-[46px]">
            Premium access,
            <br />
            <span className="text-[var(--gold)]">delivered in minutes.</span>
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
              {step === "email" || step === "forgot" ? (
                <label className="block">
                  <span className="text-[13.5px] font-semibold">Email</span>
                  <input
                    autoFocus
                    value={email}
                    onChange={(event) => setEmail(cleanEmail(event.target.value))}
                    placeholder="you@example.com"
                    inputMode="email"
                    autoComplete="email"
                    className={inputClass}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 h-12">
                  <span className="text-[14.5px] font-medium truncate">{email}</span>
                  <button type="button" onClick={() => goTo("email")} className="text-[13px] font-semibold text-[var(--accent)] shrink-0 hover:underline">
                    Change
                  </button>
                </div>
              )}

              {askingPin && (
                <label className="block">
                  <span className="text-[13.5px] font-semibold">{step === "create" ? "Choose a 6-digit PIN" : "6-digit PIN"}</span>
                  <input
                    autoFocus
                    value={pin}
                    onChange={(event) => setPin(cleanDigits(event.target.value, limits.pinLength))}
                    placeholder="••••••"
                    type="password"
                    inputMode="numeric"
                    autoComplete={step === "login" ? "current-password" : "new-password"}
                    className={classNames(inputClass, "tracking-[0.3em]")}
                  />
                </label>
              )}

              {step === "create" && (
                <label className="block">
                  <span className="text-[13.5px] font-semibold">Confirm PIN</span>
                  <input
                    value={confirmPin}
                    onChange={(event) => setConfirmPin(cleanDigits(event.target.value, limits.pinLength))}
                    placeholder="••••••"
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    className={classNames(inputClass, "tracking-[0.3em]")}
                  />
                </label>
              )}
            </div>

            {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
            {notice && <p className="mt-3 text-[13px] text-emerald-700">{notice}</p>}

            <div className="flex justify-between mt-3">
              {step === "login" && (
                <button type="button" onClick={() => goTo("forgot")} className={linkClass}>
                  Forgot PIN?
                </button>
              )}
              {step === "forgot" && (
                <button type="button" onClick={() => goTo("login")} className={linkClass}>
                  <ArrowLeft size={14} /> Back to login
                </button>
              )}
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
