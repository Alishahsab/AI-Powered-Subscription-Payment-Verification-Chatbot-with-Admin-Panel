"use client";

import { useState } from "react";
import { cleanDigits } from "@/lib/validation";
import { inputClass } from "../ui/styles";

type Unit = "minutes" | "hours";

const minutesPer: Record<Unit, number> = { minutes: 1, hours: 60 };

type DurationFieldProps = {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
};

export default function DurationField({ label, minutes, onChange }: DurationFieldProps) {
  const [unit, setUnit] = useState<Unit>(minutes >= 60 && minutes % 60 === 0 ? "hours" : "minutes");
  const amount = Math.round(minutes / minutesPer[unit]);

  return (
    <div>
      <div className="text-[13px] font-medium text-zinc-700 mb-1.5">{label}</div>
      <div className="flex gap-2">
        <div className="w-24">
          <input
            value={String(amount)}
            inputMode="numeric"
            onChange={(event) => onChange(Math.max(1, Number(cleanDigits(event.target.value, 4)) || 1) * minutesPer[unit])}
            className={`${inputClass} text-center tabular-nums`}
          />
        </div>
        <select
          value={unit}
          onChange={(event) => {
            const next = event.target.value as Unit;
            setUnit(next);
            onChange(amount * minutesPer[next]);
          }}
          className={`${inputClass} w-32`}
        >
          <option value="minutes">minutes</option>
          <option value="hours">hours</option>
        </select>
      </div>
    </div>
  );
}
