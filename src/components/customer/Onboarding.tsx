"use client";

import { useState } from "react";
import { ArrowRight, History, Lock, ShieldCheck, Zap } from "lucide-react";
import { registerCustomer, useStore } from "@/lib/store";
import { Monogram } from "@/components/shared";

const features = [
  { icon: <Zap size={17} />, title: "Code in minutes", desc: "Pay, upload proof, get your code right in the chat." },
  { icon: <ShieldCheck size={17} />, title: "Private & secure", desc: "Only you can see your chat and payment details." },
  { icon: <History size={17} />, title: "Every code saved", desc: "Find all your past codes in Order History." },
];

export default function Onboarding({ onDone }: { onDone: (id: string) => void }) {
  const s = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (name.trim().length < 2) return setErr("Please enter your name.");
    if (digits.length < 10 || digits.length > 13) return setErr("Please enter a valid mobile number, e.g. 0300 1234567.");
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setErr("Please enter a valid email or leave it empty.");
    onDone(registerCustomer(name.trim(), phone.trim(), email.trim() || undefined));
  };

  return (
    <div className="h-dvh w-full overflow-hidden flex md:items-center md:justify-center md:p-6">
      <div className="w-full h-full md:h-[min(700px,calc(100dvh-48px))] md:max-w-[1100px] flex flex-col md:flex-row md:rounded-[28px] overflow-hidden md:shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] md:border md:border-[var(--line)]">
        {/* brand panel */}
        <div className="relative shrink-0 md:w-[46%] bg-[var(--accent)] text-white overflow-hidden px-6 pt-7 pb-14 md:p-12 [@media(max-height:680px)]:pt-5 [@media(max-height:680px)]:pb-12 flex flex-col">
          <div className="relative flex items-center gap-3">
            <Monogram size={44} className="rounded-[11px] ring-1 ring-white/15" />
            <span className="font-[family-name:var(--font-display)] font-semibold text-[19px] tracking-tight">{s.settings.storeName}</span>
          </div>

          <div className="relative mt-6 md:mt-auto md:pt-8 [@media(max-height:680px)]:mt-4">
            <h1 className="font-[family-name:var(--font-display)] font-extrabold tracking-[-0.02em] text-[30px] leading-[1.08] md:text-[46px] [@media(max-height:720px)]:md:text-[38px] [@media(max-height:680px)]:text-[26px]">
              Premium access,
              <br />
              <span className="text-[var(--gold)]">delivered in minutes.</span>
            </h1>
            <p className="hidden md:block mt-4 text-[15.5px] leading-relaxed text-white/70 max-w-[380px]">
              Buy your subscription, get support and keep every code safe — all in one private chat.
            </p>
          </div>

          <div className="relative hidden md:block mt-9 space-y-4 [@media(max-height:720px)]:mt-6 [@media(max-height:720px)]:space-y-3">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <span className="size-9 rounded-xl bg-white/10 text-[var(--gold)] grid place-items-center shrink-0">{f.icon}</span>
                <span>
                  <span className="block font-semibold text-[15px]">{f.title}</span>
                  <span className="block text-[13.5px] text-white/60">{f.desc}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="hidden md:block mt-auto" />
        </div>

        {/* form */}
        <div className="relative flex-1 min-h-0 -mt-8 md:mt-0 bg-[var(--surface)] rounded-t-[28px] md:rounded-none flex flex-col">
          <form onSubmit={submit} className="flex-1 min-h-0 overflow-y-auto scroll-thin px-6 pt-7 pb-6 md:px-14 md:py-12 [@media(max-height:680px)]:pt-5 [@media(max-height:680px)]:pb-4 flex flex-col">
            <div className="md:mt-auto">
              <h2 className="font-[family-name:var(--font-display)] font-bold tracking-[-0.01em] text-[25px] md:text-[32px] leading-tight">Get started</h2>
              <p className="mt-1 text-[14px] md:text-[15px] text-[var(--muted)]">Enter your details to open your private chat.</p>
            </div>

            <div className="mt-6 space-y-3.5 md:space-y-4 [@media(max-height:680px)]:mt-4 [@media(max-height:680px)]:space-y-2.5">
              <Field label="Your name" value={name} onChange={setName} placeholder="e.g. Abdul Manan" autoFocus />
              <Field label="WhatsApp number" value={phone} onChange={setPhone} placeholder="0300 1234567" inputMode="tel" />
              <Field label="Email" optional value={email} onChange={setEmail} placeholder="you@example.com" inputMode="email" />
            </div>
            {err ? <p className="mt-3 text-[13px] text-red-600">{err}</p> : <p className="mt-3 text-[12.5px] text-[var(--muted)] [@media(max-height:680px)]:hidden">Your number lets you see your codes from any device.</p>}

            <div className="mt-auto md:mt-7 pt-5 md:pt-0 md:mb-auto">
              <button className="group w-full h-[52px] rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[16px] flex items-center justify-center gap-2 shadow-[0_12px_28px_-14px_var(--accent)] hover:brightness-110 active:scale-[0.99] transition">
                Continue <ArrowRight size={18} className="group-hover:translate-x-0.5 transition" />
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

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  autoFocus?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="text-[13.5px] font-semibold text-[var(--text)]">
        {props.label} {props.optional && <span className="text-[var(--muted)] font-normal">(optional)</span>}
      </span>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        autoFocus={props.autoFocus}
        inputMode={props.inputMode}
        className="mt-1.5 w-full h-12 rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 text-[15.5px] outline-none placeholder:text-[#9aa1ab] focus:bg-[var(--surface)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_12%,transparent)] transition"
      />
    </label>
  );
}
