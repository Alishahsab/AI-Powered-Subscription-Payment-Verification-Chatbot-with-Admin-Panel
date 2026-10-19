"use client";

import { classNames } from "@/lib/format";
import { setAdminStatus } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import type { AdminStatus } from "@/lib/types";

const options: { status: AdminStatus; label: string; dot: string }[] = [
  { status: "active", label: "Active", dot: "bg-emerald-500" },
  { status: "away", label: "Away", dot: "bg-amber-400" },
  { status: "away_closed", label: "Away · Closed", dot: "bg-orange-500" },
  { status: "offline", label: "Offline", dot: "bg-zinc-400" },
];

export default function StatusSwitch({ fullWidth = false }: { fullWidth?: boolean }) {
  const state = useAppState();
  const current = state.settings.status;

  return (
    <div className={classNames("flex items-center rounded-lg bg-zinc-100 p-0.5", fullWidth && "w-full")}>
      {options.map((option) => (
        <button
          key={option.status}
          onClick={() => setAdminStatus(option.status)}
          className={classNames(
            "h-8 px-3 rounded-md text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition",
            fullWidth && "flex-1",
            current === option.status ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
          )}
        >
          <span className={`size-1.5 rounded-full ${option.dot}`} />
          {option.label}
        </button>
      ))}
    </div>
  );
}
