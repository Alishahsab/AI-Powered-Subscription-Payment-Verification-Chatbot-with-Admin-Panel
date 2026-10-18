"use client";

import { Clock, LogOut, Mail, ShieldCheck } from "lucide-react";
import BrandIcon from "@/components/BrandIcon";
import { useNow } from "@/hooks/useNow";
import { getEffectiveStatus, statusDetails, workingHoursLabel } from "@/lib/availability";
import { formatDate } from "@/lib/format";
import { customerNumberLabel, findLatestCode } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Customer } from "@/lib/types";

type SidebarProps = {
  customer: Customer;
  onSignOut: () => void;
};

export default function Sidebar({ customer, onSignOut }: SidebarProps) {
  const state = useAppState();
  const now = useNow(30_000);
  const status = getEffectiveStatus(state.settings, now);
  const statusInfo = statusDetails[status];

  const orders = state.orders.filter((order) => order.customerId === customer.id);
  const pendingOrder = orders.find((order) => order.status === "pending_review");
  const latestCompleted = orders.filter((order) => order.status === "completed").sort((a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0))[0];
  const activePlans = state.plans.filter((plan) => plan.active);
  const latestCode = findLatestCode(state, customer.id);

  return (
    <aside className="w-[320px] lg:w-[350px] shrink-0 border-r border-[var(--line)] bg-[var(--surface)] flex flex-col">
      <div className="px-6 pt-6 pb-5 border-b border-[var(--line)] flex items-center gap-3">
        <BrandIcon size={44} className="rounded-[11px]" />
        <div className="min-w-0">
          <div className="font-[family-name:var(--font-display)] font-bold text-[18px] leading-tight truncate">{state.settings.storeName}</div>
          <div className="flex items-center gap-1.5 text-[13px] text-[var(--muted)] mt-0.5">
            <span className={`size-2 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
            {status === "offline" && ` · ${workingHoursLabel(state.settings)}`}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="px-2">
          <div className="text-[13px] text-[var(--muted)]">Customer ID</div>
          <div className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight">{customerNumberLabel(customer)}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--muted)] min-w-0">
            <Mail size={13} className="shrink-0" /> <span className="truncate">{customer.email}</span>
          </div>
        </div>

        {latestCode?.code && (
          <div className="mt-6">
            <SectionTitle>Your current code</SectionTitle>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
              <div className="font-bold text-[16px] tracking-wide truncate" title={latestCode.code}>
                {latestCode.code}
              </div>
              <div className="text-[12.5px] text-[var(--muted)] mt-0.5">{latestCode.planName}</div>
            </div>
          </div>
        )}

        {(pendingOrder || latestCompleted) && (
          <div className="mt-6">
            <SectionTitle>Your subscription</SectionTitle>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 flex items-center gap-3">
              {pendingOrder ? (
                <>
                  <span className="size-10 rounded-full grid place-items-center bg-amber-500/10 text-amber-700 shrink-0">
                    <Clock size={18} />
                  </span>
                  <span className="text-[14px]">
                    <span className="block font-semibold">Payment under review</span>
                    <span className="block text-[var(--muted)] text-[13px]">
                      {pendingOrder.planName} · {pendingOrder.id}
                    </span>
                  </span>
                </>
              ) : (
                latestCompleted && (
                  <>
                    <span className="size-10 rounded-full grid place-items-center bg-emerald-500/10 text-emerald-700 shrink-0">
                      <ShieldCheck size={18} />
                    </span>
                    <span className="text-[14px]">
                      <span className="block font-semibold">{latestCompleted.planName} plan</span>
                      <span className="block text-[var(--muted)] text-[13px]">Approved {formatDate(latestCompleted.reviewedAt ?? latestCompleted.createdAt)}</span>
                    </span>
                  </>
                )
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          <SectionTitle>Plans</SectionTitle>
          <div className="rounded-2xl border border-[var(--line)] divide-y divide-[var(--line)] overflow-hidden">
            {activePlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between px-4 py-3 bg-[var(--surface)]">
                <span className="text-[14.5px] font-medium">{plan.name}</span>
                <span className="text-[14.5px] font-bold">Rs {plan.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[var(--line)] flex justify-end">
        <button onClick={onSignOut} className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)] hover:text-[var(--text)]">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold mb-2 px-2">{children}</div>;
}
