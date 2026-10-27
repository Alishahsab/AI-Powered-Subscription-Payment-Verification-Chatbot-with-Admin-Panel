"use client";

import { useNow } from "@/hooks/useNow";
import { getEffectiveStatus } from "@/lib/availability";
import { useAppState } from "@/lib/store/state";
import type { AdminStatus } from "@/lib/types";
import type { Navigate } from "../navigation";

const statuses: Record<AdminStatus, { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-emerald-500" },
  away: { label: "Away", dot: "bg-amber-400" },
  away_closed: { label: "Away · Closed", dot: "bg-orange-500" },
  offline: { label: "Offline", dot: "bg-zinc-400" },
};

// The admin's status shows as a dot on the profile picture; it is changed in Settings, so a stray tap
// in the top bar can no longer switch the store off.
export default function AdminStatusAvatar({ onNavigate }: { onNavigate: Navigate }) {
  const state = useAppState();
  const now = useNow(60_000);
  const status = statuses[getEffectiveStatus(state.settings, now)];

  return (
    <button
      onClick={() => onNavigate({ section: "settings" })}
      className="relative size-9 rounded-full bg-[#0C2660] text-white grid place-items-center text-[12px] font-semibold"
      aria-label={`Status: ${status.label}. Change it in Settings`}
      title={`Status: ${status.label}`}
    >
      AD
      <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white ${status.dot}`} />
    </button>
  );
}
