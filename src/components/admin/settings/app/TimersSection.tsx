"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { classNames } from "@/lib/format";
import type { Timers } from "@/lib/types";
import type { PageProps } from "./pages";
import { Choices, Group } from "./ui";

type Unit = "min" | "hr";

const timerRows: { key: keyof Timers; label: string; help: string }[] = [
  { key: "orderMinutes", label: "Time to pay", help: "Payment card timer" },
  { key: "inactiveMinutes", label: "Chat goes quiet", help: "A chat becomes inactive after" },
  { key: "cancelWindowMinutes", label: "Cancel window", help: "Cancellations counted within" },
  { key: "cancelCooldownMinutes", label: "Order pause", help: "New orders paused after cancels for" },
  { key: "issueInactiveMinutes", label: "Request closes", help: "A request closes with no reply after" },
];

function TimerRow({ label, help, minutes, onChange }: { label: string; help: string; minutes: number; onChange: (minutes: number) => void }) {
  const [unit, setUnit] = useState<Unit>(minutes >= 60 && minutes % 60 === 0 ? "hr" : "min");
  const per = unit === "hr" ? 60 : 1;
  const amount = Math.max(1, Math.round(minutes / per));
  const button = "size-8 rounded-lg bg-[#eef1f7] text-[#0C2660] grid place-items-center disabled:opacity-30";

  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5">
      <span className="flex-1 min-w-0">
        <span className="block truncate text-[13.5px] font-bold text-zinc-900">{label}</span>
        <span className="block truncate text-[11px] text-zinc-500">{help}</span>
      </span>
      <button onClick={() => onChange((amount - 1) * per)} disabled={amount <= 1} className={button} aria-label={`Less ${label}`}>
        <Minus size={15} strokeWidth={2.6} />
      </button>
      <span className="w-7 text-center text-[15px] font-extrabold tabular-nums text-[#0C2660]">{amount}</span>
      <button onClick={() => onChange((amount + 1) * per)} className={button} aria-label={`More ${label}`}>
        <Plus size={15} strokeWidth={2.6} />
      </button>
      <span className="flex shrink-0 rounded-lg bg-[#f3f5fa] p-0.5">
        {(["min", "hr"] as const).map((option) => (
          <button
            key={option}
            onClick={() => {
              setUnit(option);
              onChange(amount * (option === "hr" ? 60 : 1));
            }}
            className={classNames("rounded-md px-1.5 py-1 text-[10.5px] font-bold", unit === option ? "bg-white text-[#0C2660] shadow-sm" : "text-zinc-400")}
          >
            {option}
          </button>
        ))}
      </span>
    </div>
  );
}

export default function TimersSection({ draft, updateDraft }: PageProps) {
  const { timers, limits } = draft.settings;

  return (
    <>
      <Group title="Timers">
        {timerRows.map((row) => (
          <TimerRow key={row.key} label={row.label} help={row.help} minutes={timers[row.key]} onChange={(value) => updateDraft((next) => (next.settings.timers[row.key] = value))} />
        ))}
      </Group>
      <p className="px-2 pt-2 text-[12px] text-zinc-500">Changes apply to new orders and requests only.</p>

      <Group title="Limits">
        <div className="px-3.5 py-3">
          <p className="mb-2 text-[13px] font-bold text-zinc-900">Cancels before new orders pause</p>
          <Choices values={[1, 2, 3, 5]} value={limits.cancelsBeforeCooldown} onChange={(value) => updateDraft((next) => (next.settings.limits.cancelsBeforeCooldown = value))} />
        </div>
        <div className="px-3.5 py-3">
          <p className="mb-2 text-[13px] font-bold text-zinc-900">Block after more cancels in a day than</p>
          <Choices values={[2, 3, 5, 10]} value={limits.cancelsBeforeBlock} onChange={(value) => updateDraft((next) => (next.settings.limits.cancelsBeforeBlock = value))} />
        </div>
        <div className="px-3.5 py-3">
          <p className="mb-2 text-[13px] font-bold text-zinc-900">Replies after a rejected payment</p>
          <Choices values={[1, 2, 3]} value={limits.repliesAfterRejection} onChange={(value) => updateDraft((next) => (next.settings.limits.repliesAfterRejection = value))} />
        </div>
      </Group>
    </>
  );
}
