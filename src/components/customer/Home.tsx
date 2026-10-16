"use client";

import { ChevronRight, MessageSquare, ReceiptText, ShieldCheck, LogOut, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Customer } from "@/lib/types";
import { effectiveStatus, fmtDate, hoursLabel, statusMeta } from "@/lib/utils";
import { Monogram, useNow } from "@/components/shared";
import type { Screen } from "./CustomerApp";

export default function Home({ customer, onOpen, onLogout }: { customer: Customer; onOpen: (s: Screen) => void; onLogout: () => void }) {
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

  return (
    <div className="flex-1 overflow-y-auto scroll-thin">
      <div className="relative px-6 pt-8 pb-7">
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monogram size={40} />
            <div>
              <div className="font-[family-name:var(--font-display)] font-bold text-[17px] leading-tight">{s.settings.storeName}</div>
              <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--muted)] mt-0.5">
                <span className={`size-1.5 rounded-full ${meta.dot}`} />
                {meta.label} · {status === "offline" ? hoursLabel(s.settings) : meta.hint}
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="size-9 grid place-items-center rounded-full text-[var(--muted)] hover:bg-black/5" title="Switch account">
            <LogOut size={17} />
          </button>
        </div>

        <h1 className="relative mt-9 font-[family-name:var(--font-display)] text-[30px] font-extrabold tracking-[-0.02em] leading-[1.1]">
          Hi {customer.name.split(" ")[0]},
          <br />
          <span className="text-[var(--muted)] font-semibold">how can we help today?</span>
        </h1>
      </div>

      <div className="px-5 space-y-3">
        <Tile
          icon={<MessageSquare size={21} />}
          title="Chat"
          desc="Buy a subscription, FAQs, support or talk to our team"
          badge={conv?.unreadCustomer || 0}
          onClick={() => onOpen("chat")}
          primary
        />
        <Tile
          icon={<ReceiptText size={21} />}
          title="Order History"
          desc={approved.length ? `${approved.length} code${approved.length > 1 ? "s" : ""} received · view anytime` : "Your codes will be saved here"}
          onClick={() => onOpen("history")}
        />
      </div>

      {(latest || pending) && (
        <div className="px-5 mt-6">
          <div className="text-[12px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold mb-2.5 px-1">Your subscription</div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            {pending ? (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full grid place-items-center bg-amber-500/10 text-amber-700">
                  <Clock size={17} />
                </div>
                <div className="text-[14px]">
                  <div className="font-semibold">Payment under review</div>
                  <div className="text-[var(--muted)] text-[13px]">
                    {pending.planName} · order {pending.id}
                  </div>
                </div>
              </div>
            ) : (
              latest && (
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full grid place-items-center bg-emerald-500/10 text-emerald-700">
                    <ShieldCheck size={17} />
                  </div>
                  <div className="text-[14px]">
                    <div className="font-semibold">{latest.planName} plan</div>
                    <div className="text-[var(--muted)] text-[13px]">
                      {validUntil > now ? `Valid until ${fmtDate(validUntil)}` : `Ended ${fmtDate(validUntil)} — renew anytime`}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div className="px-5 mt-6 mb-8">
        <div className="text-[12px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold mb-2.5 px-1">Plans</div>
        <div className="grid grid-cols-2 gap-2.5">
          {s.plans
            .filter((p) => p.active)
            .map((p) => (
              <div key={p.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3.5">
                <div className="text-[13px] text-[var(--muted)]">{p.name}</div>
                <div className="text-[17px] font-bold mt-0.5">Rs {p.price.toLocaleString()}</div>
              </div>
            ))}
        </div>
        <p className="mt-6 text-center text-[12px] text-[var(--muted)]">
          Signed in as {customer.phone} · Your chat is private
        </p>
      </div>
    </div>
  );
}

function Tile(props: { icon: React.ReactNode; title: string; desc: string; badge?: number; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={props.onClick}
      className={`group w-full text-left rounded-2xl p-4 flex items-center gap-4 border transition active:scale-[0.99] ${
        props.primary
          ? "bg-[var(--surface)] border-[color-mix(in_srgb,var(--accent)_35%,transparent)] shadow-[0_8px_24px_-14px_var(--accent)]"
          : "bg-[var(--surface)] border-[var(--line)] hover:border-black/15"
      }`}
    >
      <div
        className={`size-12 rounded-xl grid place-items-center shrink-0 ${
          props.primary ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--surface-2)] text-[var(--text)]"
        }`}
      >
        {props.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[16px] flex items-center gap-2">
          {props.title}
          {!!props.badge && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] text-[11px] font-bold grid place-items-center">{props.badge}</span>
          )}
        </div>
        <div className="text-[13px] text-[var(--muted)] mt-0.5 leading-snug">{props.desc}</div>
      </div>
      <ChevronRight size={18} className="text-[var(--muted)] group-hover:translate-x-0.5 transition" />
    </button>
  );
}
