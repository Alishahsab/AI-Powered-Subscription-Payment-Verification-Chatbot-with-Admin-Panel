import { Clock, LifeBuoy, ShoppingBag } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { formatCountdown } from "@/lib/format";
import { chooseMenuOption, findOrderPause, menuLabels, type MenuOption } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";

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

  return (
    <div className="space-y-2.5">
      {pause && (
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
            onClick={() => chooseMenuOption(customerId, option.key)}
            className={
              option.primary
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
    </div>
  );
}
