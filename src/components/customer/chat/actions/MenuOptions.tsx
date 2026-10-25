import { useState } from "react";
import { createPortal } from "react-dom";
import { Clock, Lock, LifeBuoy, ShoppingBag } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { formatCountdown } from "@/lib/format";
import { chooseMenuOption, findMenuLock, findOrderPause, menuLabels, returnToLockedTask, type MenuLock, type MenuOption } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import { CHAT_ROOT_ID } from "../chatRoot";
import Sheet from "../sheets/Sheet";

const options: { key: MenuOption; icon: React.ReactNode; description: string; primary: boolean }[] = [
  { key: "buy", icon: <ShoppingBag size={22} />, description: "Plans, payment and your code", primary: true },
  { key: "support", icon: <LifeBuoy size={22} />, description: "Questions or a problem with your code", primary: false },
];

export default function MenuOptions({ customerId }: { customerId: string }) {
  const state = useAppState();
  const now = useNow(1000);
  const pause = findOrderPause(
    state.customers.find((customer) => customer.id === customerId),
    now
  );
  const lock = findMenuLock(state, customerId, now);
  const [showLock, setShowLock] = useState(false);

  return (
    <div className="space-y-2.5">
      {lock && lock.reason !== "closed" && <LockNotice customerId={customerId} lock={lock} />}
      {!lock && pause && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3">
          <span className="size-9 shrink-0 rounded-full bg-amber-500/15 text-amber-700 grid place-items-center">
            <Clock size={17} />
          </span>
          <div className="flex-1 min-w-0 text-[13px] leading-snug">
            <div className="font-semibold text-amber-900">New orders are paused</div>
            <div className="text-amber-800/80">{pause.reason === "cancels" ? "Several orders were cancelled in a row." : "We're checking our payment account."}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-amber-800/70">Order again in</div>
            <div className="font-bold text-[17px] tabular-nums text-amber-900">{formatCountdown(pause.until - now)}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 md:gap-3">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={() => (lock ? setShowLock(true) : chooseMenuOption(customerId, option.key))}
            aria-disabled={Boolean(lock)}
            className={
              lock
                ? `text-left rounded-2xl p-4 border-2 border-[var(--line)] opacity-50 cursor-not-allowed ${option.primary ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--surface)]"}`
                : option.primary
                  ? `text-left rounded-2xl p-4 bg-[var(--accent)] text-[var(--accent-ink)] transition hover:brightness-110 ${pause ? "opacity-60" : ""}`
                  : "text-left rounded-2xl p-4 bg-[var(--surface)] border-2 border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition"
            }
          >
            <div className={option.primary ? "text-[var(--gold)]" : "text-[var(--accent)]"}>{option.icon}</div>
            <div className="mt-2.5 font-semibold text-[15px] md:text-[16px] leading-tight">{menuLabels[option.key]}</div>
            <div className={`text-[12.5px] mt-1 ${option.primary ? "opacity-75" : "text-[var(--muted)]"}`}>{option.description}</div>
          </button>
        ))}
      </div>
      {showLock && lock && <LockSheet lock={lock} onClose={() => setShowLock(false)} />}
    </div>
  );
}

const returnLabels: Partial<Record<MenuLock["reason"], string>> = {
  rejected: "Reply about my payment",
  issue: "Go to my request",
};

function LockNotice({ customerId, lock }: { customerId: string; lock: MenuLock }) {
  const returnLabel = returnLabels[lock.reason];
  return (
    <div className="rounded-2xl border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))] px-4 py-3.5">
      <div className="flex items-center gap-3 text-[13.5px] leading-snug">
        <Clock size={17} className="shrink-0 text-[var(--accent)]" />
        <span className="flex-1">{lock.message}</span>
      </div>
      {returnLabel && (
        <button onClick={() => returnToLockedTask(customerId)} className="mt-3 w-full h-10 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] text-[14px] font-semibold">
          {returnLabel}
        </button>
      )}
    </div>
  );
}

// Tapping a closed button explains why, in a small pop-up. Nothing is added to the chat.
function LockSheet({ lock, onClose }: { lock: MenuLock; onClose: () => void }) {
  return createPortal(
    <Sheet title={lock.title} onClose={onClose}>
      <p className="flex gap-2.5 text-[14.5px] leading-relaxed whitespace-pre-line text-[var(--text)]">
        <Lock size={16} className="shrink-0 mt-1 text-[var(--muted)]" />
        {lock.message}
      </p>
      <button onClick={onClose} className="mt-5 w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px]">
        Got it
      </button>
    </Sheet>,
    document.getElementById(CHAT_ROOT_ID) ?? document.body
  );
}
