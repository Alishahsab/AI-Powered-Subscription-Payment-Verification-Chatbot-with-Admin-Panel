"use client";

import { Lock, LogOut } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { formatDuration, getEffectiveStatus, minutesUntilOpen, statusDetails } from "@/lib/availability";
import { useAppState } from "@/lib/store/state";
import DisappearingLogo from "../DisappearingLogo";

type ChatHeaderProps = {
  typing: boolean;
  onSignOut?: () => void;
};

export default function ChatHeader({ typing, onSignOut }: ChatHeaderProps) {
  const state = useAppState();
  const now = useNow(60_000);
  const effectiveStatus = getEffectiveStatus(state.settings, now);
  const status = statusDetails[effectiveStatus];
  const hint = effectiveStatus === "offline" ? `Back in ${formatDuration(minutesUntilOpen(state.settings, now))}` : status.hint;

  return (
    <header className="flex items-center gap-3 h-16 md:h-[72px] px-4 md:px-6 border-b border-[var(--line)] bg-[var(--surface)]">
      <DisappearingLogo size={40} className="rounded-[10px]" />
      <div className="flex-1 min-w-0">
        <div className="font-[family-name:var(--font-display)] font-bold text-[17px] md:text-[18px] leading-tight">{state.settings.storeName}</div>
        <div className="flex items-center gap-1.5 text-[12.5px] md:text-[13px] text-[var(--muted)]">
          <span className={`size-2 rounded-full ${status.dot}`} />
          {typing ? "typing…" : `${status.label} · ${hint}`}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1.5 text-[12.5px] text-[var(--muted)]">
        <Lock size={13} /> Private chat
      </div>

      {onSignOut && (
        <button onClick={onSignOut} className="size-10 grid place-items-center rounded-full text-[var(--muted)] hover:bg-black/5" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      )}
    </header>
  );
}
