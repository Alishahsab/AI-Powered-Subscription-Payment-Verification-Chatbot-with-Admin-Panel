"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { adminSignIn, requestAdminPasswordCode, resetAdminPassword } from "@/lib/store/admin";
import { cleanEmail, limits, validateEmail } from "@/lib/validation";

const fieldClass =
  "mt-1.5 w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-[15px] outline-none focus:bg-white focus:border-[#0C2660] focus:ring-4 focus:ring-[#0C2660]/10 transition";

type Step = "login" | "forgot" | "code";

export default function LoginScreen() {
  const [step, setStep] = useState<Step>("login");
  const [notice, setNotice] = useState("");
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

  const backToLogin = (message = "") => {
    setStep("login");
    setPassword("");
    setError("");
    setNotice(message);
  };

  if (step !== "login") {
    return (
      <ForgotPassword
        step={step}
        email={email}
        onEmailChange={setEmail}
        onCodeSent={() => setStep("code")}
        onDone={() => backToLogin("Your password has been changed. Sign in with the new password.")}
        onCancel={() => backToLogin()}
      />
    );
  }

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

        <div className="mt-2 text-right">
          <button
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
              setStep("forgot");
            }}
            className="text-[13px] font-medium text-[#0C2660] hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {notice && <p className="text-[13px] text-emerald-700 mt-3">{notice}</p>}
        {error && <p className="text-[13px] text-red-600 mt-3">{error}</p>}

        <button disabled={busy} className="mt-6 w-full h-12 rounded-xl bg-[#0C2660] text-white text-[15.5px] font-semibold flex items-center justify-center gap-2 hover:brightness-125 transition disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

type ForgotPasswordProps = {
  step: "forgot" | "code";
  email: string;
  onEmailChange: (email: string) => void;
  onCodeSent: () => void;
  onDone: () => void;
  onCancel: () => void;
};

// Admin password reset: the code goes only to the admin email, then the new password replaces the old one.
function ForgotPassword({ step, email, onEmailChange, onCodeSent, onDone, onCancel }: ForgotPasswordProps) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailProblem = validateEmail(email);
    if (emailProblem) {
      setError(emailProblem);
      return;
    }
    setBusy(true);
    const problem = await requestAdminPasswordCode(email);
    setBusy(false);
    if (problem) setError(problem);
    else onCodeSent();
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6,10}$/.test(code)) {
      setError("Enter the code from the email.");
      return;
    }
    if (password.length < limits.passwordMin) {
      setError(`Password must be at least ${limits.passwordMin} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const problem = await resetAdminPassword(email, code, password);
    setBusy(false);
    if (problem) setError(problem);
    else onDone();
  };

  return (
    <div className="admin-app min-h-dvh grid place-items-center px-4 py-8">
      <form onSubmit={step === "forgot" ? sendCode : savePassword} noValidate className="w-full max-w-[400px] bg-white rounded-2xl border border-zinc-200 shadow-sm p-7 md:p-8">
        <img src="/logo-wordmark-dark.png" alt="Premium Store" className="h-12 w-auto select-none" draggable={false} />
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-[21px] font-semibold tracking-tight">Reset admin password</h1>
        <p className="text-[13.5px] text-zinc-500 mt-1">
          {step === "forgot" ? "Enter the admin email. We will send a code to it." : `We sent a code to ${email}. Enter it with your new password.`}
        </p>

        {step === "forgot" ? (
          <label className="block mt-6">
            <span className="text-[13.5px] font-semibold text-zinc-800">Admin email</span>
            <input
              autoFocus
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => {
                onEmailChange(cleanEmail(event.target.value));
                setError("");
              }}
              placeholder="admin@example.com"
              className={fieldClass}
            />
          </label>
        ) : (
          <>
            <label className="block mt-6">
              <span className="text-[13.5px] font-semibold text-zinc-800">Code</span>
              <input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 10));
                  setError("");
                }}
                placeholder="Code from the email"
                className={`${fieldClass} tracking-[0.3em]`}
              />
            </label>
            <label className="block mt-4">
              <span className="text-[13.5px] font-semibold text-zinc-800">New password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="New password"
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
            <label className="block mt-4">
              <span className="text-[13.5px] font-semibold text-zinc-800">Confirm new password</span>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                placeholder="Type it again"
                className={fieldClass}
              />
            </label>
          </>
        )}

        {error && <p className="text-[13px] text-red-600 mt-3">{error}</p>}

        <button disabled={busy} className="mt-6 w-full h-12 rounded-xl bg-[#0C2660] text-white text-[15.5px] font-semibold flex items-center justify-center gap-2 hover:brightness-125 transition disabled:opacity-60">
          {step === "forgot" ? (busy ? "Sending…" : "Send code") : busy ? "Saving…" : "Save new password"}
        </button>
        <button type="button" onClick={onCancel} className="mt-3 w-full text-[13.5px] font-medium text-zinc-500 hover:text-zinc-800">
          Back to sign in
        </button>
      </form>
    </div>
  );
}
