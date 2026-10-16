"use client";

import { Clock, LogOut, MessageSquare, ReceiptText, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Customer } from "@/lib/types";
import { cx, effectiveStatus, fmtDate, hoursLabel, statusMeta } from "@/lib/utils";
import { Monogram, useNow } from "@/components/shared";
import type { Screen } from "./CustomerApp";

export default function Sidebar({ customer, view, onOpen, onLogout }: { customer: Customer; view: Screen; onOpen: (s: Screen) => void; onLogout: () => void }) {
  const s = useStore();
  const now = useNow(30_000);
  const status = effectiveStatus(s.settings, now);
  const meta = statusMeta[status];
  const conv = s.conversations[customer.id];
  const orders = s.orders.filter((o) => o.customerId === customer.id);
  const approved = orders.filter((o) => o.status === "approved").sort((a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0));
  const latest = approved[0];
  const pending = orders.find((o) => o.status === "pending_review");
  const validUntil = latest ? new Date(latest.reviewedAt!).setMonth(new Date(latest.reviewedAt!).getMonth() + latest.months) : 0;

  const nav = [
    { k: "chat" as const, label: "Chat", desc: "Buy, FAQs, support & team", icon: <MessageSquare size={19} />, badge: view === "chat" ? 0 : conv?.unreadCustomer ?? 0 },
    { k: "history" as const, label: "Order History", desc: approved.length ? `${approved.length} code${approved.length > 1 ? "s" : ""} received` : "Your codes are saved here", icon: <ReceiptText size={19} />, badge: 0 },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 pt-6 pb-5 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <Monogram size={44} />
          <div className="min-w-0">
            <div className="font-[family-name:var(--font-display)] font-bold text-[18px] leading-tight truncate">{s.settings.storeName}</div>
            <div className="flex items-center gap-1.5 text-[13px] text-[var(--muted)] mt-0.5">
              <span className={`size-2 rounded-full ${meta.dot}`} />
              {meta.label}{status === "offline" ? ` · ${hoursLabel(s.settings)}` : ""}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-5">
        <div className="px-2 mb-4">
          <div className="text-[13px] text-[var(--muted)]">Welcome back</div>
          <div className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight">{customer.name}</div>
        </div>

        <nav className="space-y-1.5">
          {nav.map((n) => {
            const active = view === n.k;
            return (
              <button
                key={n.k}
                onClick={() => onOpen(n.k)}
                className={cx(
                  "w-full text-left flex items-center gap-3.5 rounded-2xl px-3.5 py-3 transition",
                  active ? "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_8px_20px_-10px_var(--accent)]" : "hover:bg-[var(--surface-2)]"
                )}
              >
                <span className={cx("size-10 rounded-xl grid place-items-center shrink-0", active ? "bg-white/15" : "bg-[var(--surface-2)]")}>{n.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-[15.5px]">{n.label}</span>
                  <span className={cx("block text-[12.5px] truncate", active ? "opacity-75" : "text-[var(--muted)]")}>{n.desc}</span>
                </span>
                {!!n.badge && <span className="min-w-6 h-6 px-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] text-[12px] font-bold grid place-items-center">{n.badge}</span>}
              </button>
            );
          })}
        </nav>

        {(latest || pending) && (
          <div className="mt-6">
            <div className="text-[12px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold mb-2 px-2">Your subscription</div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 flex items-center gap-3">
              {pending ? (
                <>
                  <span className="size-10 rounded-full grid place-items-center bg-amber-500/10 text-amber-700 shrink-0"><Clock size={18} /></span>
                  <span className="text-[14px]">
                    <span className="block font-semibold">Payment under review</span>
                    <span className="block text-[var(--muted)] text-[13px]">{pending.planName} · {pending.id}</span>
                  </span>
                </>
              ) : (
                latest && (
                  <>
                    <span className="size-10 rounded-full grid place-items-center bg-emerald-500/10 text-emerald-700 shrink-0"><ShieldCheck size={18} /></span>
                    <span className="text-[14px]">
                      <span className="block font-semibold">{latest.planName} plan</span>
                      <span className="block text-[var(--muted)] text-[13px]">{validUntil > now ? `Valid until ${fmtDate(validUntil)}` : `Ended ${fmtDate(validUntil)}`}</span>
                    </span>
                  </>
                )
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="text-[12px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold mb-2 px-2">Plans</div>
          <div className="rounded-2xl border border-[var(--line)] divide-y divide-[var(--line)] overflow-hidden">
            {s.plans
              .filter((p) => p.active)
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-[var(--surface)]">
                  <span className="text-[14.5px] font-medium">{p.name}</span>
                  <span className="text-[14.5px] font-bold">Rs {p.price.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[var(--line)] flex items-center justify-between gap-3">
        <div className="min-w-0 text-[12.5px] text-[var(--muted)] truncate">Signed in as {customer.phone}</div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)] hover:text-[var(--text)] shrink-0">
          <LogOut size={15} /> Switch
        </button>
      </div>
    </div>
  );
}
