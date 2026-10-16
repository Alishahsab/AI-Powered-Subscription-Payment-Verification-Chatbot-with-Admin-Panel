"use client";

import { useState } from "react";
import { ArrowLeft, Check, Copy, ReceiptText } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Customer, OrderStatus } from "@/lib/types";
import { copyText, fmtDateTime } from "@/lib/utils";

const chip: Record<OrderStatus, { t: string; c: string }> = {
  approved: { t: "Delivered", c: "bg-emerald-500/10 text-emerald-700" },
  pending_review: { t: "Under review", c: "bg-amber-500/10 text-amber-700" },
  awaiting_payment: { t: "Awaiting payment", c: "bg-sky-500/10 text-sky-700" },
  rejected: { t: "Needs new proof", c: "bg-red-500/10 text-red-700" },
  expired: { t: "Expired", c: "bg-black/5 text-[var(--muted)]" },
  cancelled: { t: "Cancelled", c: "bg-black/5 text-[var(--muted)]" },
};

export default function OrderHistory({ customer, onBack, showBack = true }: { customer: Customer; onBack: () => void; showBack?: boolean }) {
  const s = useStore();
  const orders = s.orders.filter((o) => o.customerId === customer.id).sort((a, b) => b.createdAt - a.createdAt);
  const delivered = orders.filter((o) => o.status === "approved");
  const others = orders.filter((o) => o.status !== "approved");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className={`flex items-center gap-2 h-16 md:h-[72px] border-b border-[var(--line)] bg-[var(--surface)] ${showBack ? "px-3" : "px-8"}`}>
        {showBack && (
          <button onClick={onBack} className="size-10 grid place-items-center rounded-full hover:bg-black/5" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="font-[family-name:var(--font-display)] font-bold text-[18px] md:text-[21px]">Order History</div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-4 md:px-8 py-5 md:py-7 [&>*]:max-w-[860px] [&>*]:mx-auto">
        {!orders.length ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="size-14 rounded-2xl bg-[var(--surface)] border border-[var(--line)] grid place-items-center text-[var(--muted)]">
              <ReceiptText size={22} />
            </div>
            <div className="mt-4 font-semibold">No orders yet</div>
            <p className="text-[13px] text-[var(--muted)] mt-1">Every premium code you receive will be saved here with its date and time.</p>
          </div>
        ) : (
          <>
            <p className="text-[12.5px] text-[var(--muted)] px-1 mb-3">
              Every code we&apos;ve sent you, kept even after older chats are cleared.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {delivered.map((o) => (
                <div key={o.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-[15px]">{o.planName}</div>
                      <div className="text-[12px] text-[var(--muted)] mt-0.5">{fmtDateTime(o.reviewedAt ?? o.createdAt)}</div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${chip[o.status].c}`}>{chip[o.status].t}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--bg)] border border-[var(--line)] px-3.5 py-2.5">
                    <div>
                      <div className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Premium code</div>
                      <div className="font-[family-name:var(--font-manrope)] font-extrabold text-[20px] tracking-[0.18em] text-[var(--accent)] tabular-nums">{o.code}</div>
                    </div>
                    <CopyCode value={o.code!} />
                  </div>
                  <div className="mt-2.5 flex justify-between text-[12px] text-[var(--muted)]">
                    <span>Order {o.id}</span>
                    <span>{o.methodName} · Rs {o.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {!!others.length && (
              <>
                <div className="text-[12px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold mt-7 mb-2.5 px-1">Other orders</div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] divide-y divide-[var(--line)]">
                  {others.map((o) => (
                    <div key={o.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-[14px] font-semibold">{o.planName} <span className="text-[var(--muted)] font-normal">· {o.id}</span></div>
                        <div className="text-[12px] text-[var(--muted)]">{fmtDateTime(o.createdAt)}</div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${chip[o.status].c}`}>{chip[o.status].t}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CopyCode({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await copyText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 h-8 rounded-lg bg-black/[0.05] hover:bg-black/[0.08]"
    >
      {done ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}
