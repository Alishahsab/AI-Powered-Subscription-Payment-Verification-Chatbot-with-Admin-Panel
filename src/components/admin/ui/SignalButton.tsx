"use client";

import { useEffect, useState } from "react";
import { useSignal } from "@/hooks/useSignal";

const levels = [
  { name: "No internet", color: "#ef4444" },
  { name: "Very weak", color: "#ef4444" },
  { name: "Weak", color: "#f97316" },
  { name: "Okay", color: "#D4A551" },
  { name: "Good", color: "#22c55e" },
  { name: "Strong", color: "#22c55e" },
];

export default function SignalButton() {
  const { bars, ms } = useSignal();
  const [open, setOpen] = useState(false);
  const level = levels[bars];

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), 3000);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="relative size-11 rounded-full bg-white shadow-[0_8px_24px_-16px_rgba(12,38,96,0.4)] grid place-items-center"
        aria-label={`Connection: ${level.name}`}
      >
        <span className="flex items-end gap-[2.5px] h-[17px]">
          {[5, 8, 11, 14, 17].map((height, index) => (
            <span
              key={height}
              className="signal-bar w-[3.5px] rounded-[2px] bg-zinc-300 transition-colors duration-500"
              style={{ height, background: index < bars ? level.color : undefined }}
            />
          ))}
        </span>
        {bars === 0 && <span className="absolute right-1 bottom-1 size-[15px] rounded-full bg-red-500 ring-2 ring-white text-white text-[10px] font-bold grid place-items-center">!</span>}
      </button>

      {open && (
        <div className="fade-in absolute right-0 top-[52px] z-30 min-w-[170px] rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_16px_40px_-14px_rgba(12,38,96,0.45)]">
          <span className="flex items-center gap-2 text-[13.5px] font-semibold text-zinc-900 whitespace-nowrap">
            <span className="size-[7px] rounded-full" style={{ background: level.color }} />
            {level.name} connection
          </span>
          <span className="block mt-0.5 text-[11.5px] text-zinc-500 whitespace-nowrap">{ms === null ? "Can't reach the store" : `Store replied in ${ms} ms`}</span>
        </div>
      )}
    </div>
  );
}
