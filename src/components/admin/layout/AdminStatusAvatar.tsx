"use client";

import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useNow } from "@/hooks/useNow";
import { getEffectiveStatus } from "@/lib/availability";
import { classNames } from "@/lib/format";
import { avatarUrl } from "@/lib/supabase/adminProfile";
import { useAppState } from "@/lib/store/state";
import type { AdminStatus } from "@/lib/types";
import type { Navigate } from "../navigation";

const statuses: Record<AdminStatus, { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-emerald-500" },
  away: { label: "Away", dot: "bg-amber-400" },
  away_closed: { label: "Away · Closed", dot: "bg-orange-500" },
  offline: { label: "Offline", dot: "bg-zinc-400" },
};

export function useAdminStatus() {
  const state = useAppState();
  const now = useNow(60_000);
  return statuses[getEffectiveStatus(state.settings, now)];
}

// The admin's status shows as a dot on the profile picture; it is changed in Settings, so a stray tap
// in the top bar can no longer switch the store off.
export default function AdminStatusAvatar({ onNavigate, large = false }: { onNavigate: Navigate; large?: boolean }) {
  const status = useAdminStatus();
  const profile = useAdminProfile();
  const photo = avatarUrl(profile?.avatarPath ?? null);

  return (
    <button
      onClick={() => onNavigate({ section: "settings" })}
      className={classNames("relative shrink-0 rounded-full bg-[#0C2660] text-white grid place-items-center font-semibold", large ? "size-11 text-[13px]" : "size-9 text-[12px]")}
      aria-label={`Status: ${status.label}. Change it in Settings`}
      title={`Status: ${status.label}`}
    >
      {photo ? <img src={photo} alt="" className="size-full rounded-full object-cover" /> : "AD"}
      <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white ${status.dot}`} />
    </button>
  );
}
