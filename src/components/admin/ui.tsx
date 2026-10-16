"use client";

import { useState } from "react";
import { cx } from "@/lib/utils";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)]", className)}>{children}</div>;
}

export function CardHead({ title, desc, right }: { title: string; desc?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
      <div>
        <div className="font-semibold text-[14.5px] text-zinc-900">{title}</div>
        {desc && <div className="text-[12.5px] text-zinc-500 mt-0.5">{desc}</div>}
      </div>
      {right}
    </div>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" | "success"; size?: "sm" | "md" };
export function Btn({ variant = "secondary", size = "md", className = "", ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-9 px-3.5 text-[13.5px]",
        variant === "primary" && "bg-[#0C2660] text-white hover:bg-[#0a1f52]",
        variant === "secondary" && "bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50",
        variant === "ghost" && "text-zinc-600 hover:bg-zinc-100",
        variant === "danger" && "bg-white border border-red-200 text-red-600 hover:bg-red-50",
        variant === "success" && "bg-emerald-600 text-white hover:bg-emerald-700",
        className
      )}
    />
  );
}

export function Badge({ tone = "zinc", children }: { tone?: "zinc" | "green" | "amber" | "red" | "blue"; children: React.ReactNode }) {
  const t = {
    zinc: "bg-zinc-100 text-zinc-600",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/15",
    red: "bg-red-50 text-red-700 ring-red-600/15",
    blue: "bg-sky-50 text-sky-700 ring-sky-600/15",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-md ring-1 ring-transparent", t)}>{children}</span>;
}

export const inputCls =
  "w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13.5px] outline-none focus:border-zinc-400 focus:ring-4 focus:ring-[#0C2660]/10 transition placeholder:text-zinc-400";

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="inline-flex items-center gap-2 text-[13px] text-zinc-700" aria-pressed={on}>
      <span className={cx("relative w-9 h-5 rounded-full transition", on ? "bg-emerald-500" : "bg-zinc-300")}>
        <span className={cx("absolute top-0.5 size-4 rounded-full bg-white shadow transition", on ? "left-[18px]" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}

/** Text input that commits on blur, so typing doesn't write on every keystroke. */
export function LazyInput({
  value, onCommit, multiline, rows = 3, className = "", ...rest
}: { value: string; onCommit: (v: string) => void; multiline?: boolean; rows?: number; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [v, setV] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setV(value);
  }
  const commit = () => v !== value && onCommit(v);
  if (multiline)
    return (
      <textarea
        value={v}
        rows={rows}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        className={cx(inputCls, "h-auto py-2 leading-relaxed resize-y", className)}
      />
    );
  const base = /(^|\s)w-/.test(className) ? inputCls.replace("w-full ", "") : inputCls;
  return <input {...rest} value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className={cx(base, className)} />;
}

export function Empty({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="size-11 rounded-xl bg-zinc-100 text-zinc-500 grid place-items-center">{icon}</div>
      <div className="mt-3 font-medium text-[14px] text-zinc-800">{title}</div>
      {desc && <div className="text-[12.5px] text-zinc-500 mt-1 max-w-xs">{desc}</div>}
    </div>
  );
}

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const hues = [210, 160, 30, 280, 340, 190, 100];
  const h = hues[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length];
  return (
    <div
      className="rounded-full grid place-items-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${h} 60% 94%)`, color: `hsl(${h} 45% 32%)` }}
    >
      {initials}
    </div>
  );
}
