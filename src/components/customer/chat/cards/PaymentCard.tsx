"use client";

import { Clock, CreditCard, Lock } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { formatCountdown } from "@/lib/format";
import { canStillPay } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Message, OrderStatus } from "@/lib/types";
import CopyButton from "../CopyButton";

const hiddenStatusText: Partial<Record<OrderStatus, string>> = {
  pending_review: "Payment under review",
  completed: "Payment approved",
  cancelled: "Order cancelled",
  issue_reported: "Payment issue reported",
  expired: "Order expired",
};

export default function PaymentCard({ message }: { message: Message }) {
  const state = useAppState();
  const now = useNow(1000);
  const order = state.orders.find((item) => item.id === message.orderId);
  if (!order) return null;

  const { bank, timers } = state.settings;
  const payable = canStillPay(order, now);
  const timeLeft = order.expiresAt - now;
  const progress = Math.max(0, Math.min(100, (timeLeft / (timers.orderMinutes * 60_000)) * 100));
  const runningOut = timeLeft < 5 * 60_000;

  return (
    <div className="w-[320px] md:w-[380px] max-w-full rounded-2xl rounded-bl-md overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-[0_6px_20px_-12px_rgba(15,23,42,0.25)]">
      <div className="px-4 pt-3.5 pb-3 border-b border-[var(--line)] flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold">Order {order.id}</div>
          <div className="font-semibold text-[15px] mt-0.5">{order.planName}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[var(--muted)]">Amount</div>
          <div className="font-bold text-[17px] text-[var(--accent)]">Rs {order.amount.toLocaleString()}</div>
        </div>
      </div>

      {payable ? (
        <div className="px-4 py-3.5 space-y-3">
          <div className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
            <CreditCard size={14} /> Send payment to our bank account
          </div>

          <div className="rounded-xl bg-[var(--surface-2)] p-3 space-y-2.5">
            <DetailRow label="Bank" value={bank.bankName} />
            <div className="h-px bg-[var(--line)]" />
            <DetailRow label="Account number" value={bank.accountNumber} copyable large />
            <div className="h-px bg-[var(--line)]" />
            <DetailRow label="Account title" value={bank.accountTitle} />
            <div className="flex justify-end">
              <CopyButton value={String(order.amount)} label="Copy amount" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <Clock size={12} /> Details hide in
              </span>
              <span className={`font-bold tabular-nums ${runningOut ? "text-red-600" : ""}`}>{formatCountdown(timeLeft)}</span>
            </div>
            <div className="h-1 rounded-full bg-black/[0.05] overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${runningOut ? "bg-red-500" : "bg-[var(--accent)]"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>

          {order.status === "rejected" && (
            <div className="text-[12.5px] text-red-700 bg-red-500/10 rounded-lg px-3 py-2">Previous proof rejected: {order.rejectReason}</div>
          )}
        </div>
      ) : (
        <div className="px-4 py-4 flex items-center gap-3">
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

type DetailRowProps = {
  label: string;
  value: string;
  copyable?: boolean;
  large?: boolean;
};

function DetailRow({ label, value, copyable, large }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <div className="text-[11px] text-[var(--muted)]">{label}</div>
        <div className={large ? "font-bold text-[16px] tracking-wide" : "font-semibold text-[14px]"}>{value}</div>
      </div>
      {copyable && <CopyButton value={value} />}
    </div>
  );
}
