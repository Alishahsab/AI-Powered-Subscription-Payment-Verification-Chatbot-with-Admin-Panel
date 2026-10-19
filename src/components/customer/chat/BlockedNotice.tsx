import { ShieldOff } from "lucide-react";
import { useAppState } from "@/lib/store/state";
import type { Customer } from "@/lib/types";

export default function BlockedNotice({ customer }: { customer: Customer }) {
  const { blocking } = useAppState().settings;

  return (
    <div className="border-t border-[var(--line)] bg-[var(--surface)] px-4 md:px-8 py-5">
      <div className="max-w-[560px] mx-auto text-center">
        <div className="mx-auto size-11 rounded-2xl bg-red-500/10 text-red-600 grid place-items-center">
          <ShieldOff size={20} />
        </div>
        <p className="mt-3 text-[14.5px] font-semibold">{blocking.message}</p>
        {customer.blockReason && <p className="mt-1 text-[13.5px] text-[var(--muted)]">Reason: {customer.blockReason}</p>}
        {blocking.channelUrl && (
          <a
            href={blocking.channelUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-11 px-5 rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)] text-[14px] font-semibold items-center gap-2 hover:brightness-110 transition"
          >
            {blocking.channelLabel}
          </a>
        )}
      </div>
    </div>
  );
}
