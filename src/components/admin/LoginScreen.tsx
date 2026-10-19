"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { adminSignIn } from "@/lib/store/admin";
import { cleanEmail, limits, validateEmail } from "@/lib/validation";

const fieldClass =
  "mt-1.5 w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-[15px] outline-none focus:bg-white focus:border-[#0C2660] focus:ring-4 focus:ring-[#0C2660]/10 transition";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailProblem = validateEmail(email);
    if (emailProblem) {
      setError(emailProblem);
      return;
    }
    if (password.length < limits.passwordMin) {
      setError(`Password must be at least ${limits.passwordMin} characters.`);
      return;
    }

    setBusy(true);
    const problem = await adminSignIn(email, password);
    setBusy(false);
    if (problem) setError(problem);
  };

  return (
    <div className="admin-app min-h-dvh grid place-items-center px-4 py-8">
      <form onSubmit={submit} noValidate className="w-full max-w-[400px] bg-white rounded-2xl border border-zinc-200 shadow-sm p-7 md:p-8">
        <img src="/logo-wordmark-dark.png" alt="Premium Store" className="h-12 w-auto select-none" draggable={false} />
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-[21px] font-semibold tracking-tight">Admin sign in</h1>
        <p className="text-[13.5px] text-zinc-500 mt-1">Premium Store management panel</p>

        <label className="block mt-6">
          <span className="text-[13.5px] font-semibold text-zinc-800">Email</span>
          <input
            autoFocus
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => {
              setEmail(cleanEmail(event.target.value));
              setError("");
            }}
            placeholder="admin@example.com"
            className={fieldClass}
          />
        </label>

        <label className="block mt-4">
          <span className="text-[13.5px] font-semibold text-zinc-800">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter password"
              className={`${fieldClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-[calc(50%+3px)] -translate-y-1/2 size-9 grid place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>

        {error && <p className="text-[13px] text-red-600 mt-3">{error}</p>}

        <button disabled={busy} className="mt-6 w-full h-12 rounded-xl bg-[#0C2660] text-white text-[15.5px] font-semibold flex items-center justify-center gap-2 hover:brightness-125 transition disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
