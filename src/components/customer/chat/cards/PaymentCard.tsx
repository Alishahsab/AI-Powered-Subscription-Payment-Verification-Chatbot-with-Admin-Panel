"use client";

import { Clock, Lock } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { formatCountdown } from "@/lib/format";
import { canStillPay, orderBank } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Message, OrderStatus } from "@/lib/types";
import CopyButton from "../CopyButton";

const hiddenStatusText: Partial<Record<OrderStatus, string>> = {
  pending_review: "Payment under review",
  completed: "Payment approved",
  rejected: "Payment not verified",
  cancelled: "Order cancelled",
  issue_reported: "Payment issue reported",
  expired: "Order expired",
};

export default function PaymentCard({ message }: { message: Message }) {
  const state = useAppState();
  const now = useNow(1000);
  const order = state.orders.find((item) => item.id === message.orderId);
  if (!order) return null;

  const { timers } = state.settings;
  const bank = orderBank(state, order);
  const payable = canStillPay(order, now);
  const timeLeft = order.expiresAt - now;
  const progress = Math.max(0, Math.min(100, (timeLeft / (timers.orderMinutes * 60_000)) * 100));
  const runningOut = timeLeft < 5 * 60_000;

  return (
    <div className="w-[310px] md:w-[400px] max-w-full rounded-2xl rounded-bl-md overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-[0_8px_24px_-14px_rgba(15,23,42,0.25)]">
      <div className="px-4 pt-3.5 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold">Order {order.id}</div>
          <div className={`${valueClass} mt-0.5`}>{order.planName}</div>
          <div className="text-[12.5px] text-[var(--muted)]">via {order.methodName}</div>
        </div>
        <div className={`${valueClass} text-[var(--accent)]`}>Rs {order.amount.toLocaleString()}</div>
      </div>

      {payable ? (
        <div className="px-4 pb-4 space-y-3">
          <div className="rounded-xl bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-3.5 divide-y divide-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
            <Detail label="Account number" value={bank.accountNumber} copyable />
            {bank.iban && <Detail label="IBAN" value={bank.iban} copyable />}
            <Detail label="Bank" value={bank.bankName} />
            <Detail label="Account title" value={bank.accountTitle} />
          </div>

          <div className="pt-1">
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <Clock size={12} /> Details hide in
              </span>
              <span className={`font-bold tabular-nums ${runningOut ? "text-red-600" : ""}`}>{formatCountdown(timeLeft)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-black/[0.05] overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${runningOut ? "bg-red-500" : "bg-[var(--accent)]"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3.5 border-t border-[var(--line)] flex items-center gap-3">
          <div className="size-9 rounded-full grid place-items-center bg-black/[0.04] text-[var(--muted)] shrink-0">
            <Lock size={15} />
          </div>
          <div className="text-[13px] leading-snug">
            <div className="font-semibold">{hiddenStatusText[order.status] ?? "Order closed"}</div>
            <div className="text-[var(--muted)]">Payment details hidden for your security</div>
          </div>
        </div>
      )}
    </div>
  );
}

const valueClass = "font-bold text-[15px] md:text-[16px] leading-snug";

function Detail({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="py-2.5 min-w-0">
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
      <div className="flex items-center gap-2">
        <span className={`${valueClass} tabular-nums break-all`}>{value}</span>
        {copyable && <CopyButton value={value} />}
      </div>
    </div>
  );
}
