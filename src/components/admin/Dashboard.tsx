"use client";

import { AlertTriangle, ArrowRight, Clock, KeyRound, LifeBuoy, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { cx, fmtDateTime, rs, timeAgo } from "@/lib/utils";
import { useNow } from "@/components/shared";
import { Avatar, Badge, Card, CardHead } from "./ui";
import type { Go } from "./AdminApp";

export default function Dashboard({ go }: { go: Go }) {
  const s = useStore();
  const now = useNow(30_000);
  const start = new Date(now).setHours(0, 0, 0, 0);
  const approvedToday = s.orders.filter((o) => o.status === "approved" && (o.reviewedAt ?? 0) >= start);
  const revenueToday = approvedToday.reduce((a, o) => a + o.amount, 0);
  const pending = s.orders.filter((o) => o.status === "pending_review");
  const open = s.tickets.filter((t) => t.status === "open");
  const month = new Date(now);
  month.setDate(1);
  month.setHours(0, 0, 0, 0);
  const revenueMonth = s.orders.filter((o) => o.status === "approved" && (o.reviewedAt ?? 0) >= month.getTime()).reduce((a, o) => a + o.amount, 0);
  const name = (id: string) => s.customers.find((c) => c.id === id)?.name ?? "Customer";
  const recent = s.orders.filter((o) => o.status !== "cancelled").sort((a, b) => b.createdAt - a.createdAt).slice(0, 7);

  const kpis = [
    { label: "Revenue today", value: rs(revenueToday), sub: `${rs(revenueMonth)} this month`, icon: <Wallet size={17} /> },
    { label: "Codes sent today", value: String(approvedToday.length), sub: `${s.orders.filter((o) => o.status === "approved").length} all time`, icon: <KeyRound size={17} /> },
    { label: "Pending review", value: String(pending.length), sub: pending.length ? `oldest ${timeAgo(Math.min(...pending.map((o) => o.submittedAt ?? o.createdAt)), now)}` : "All clear", icon: <Clock size={17} />, alert: pending.length > 0, onClick: () => go({ section: "inbox", tab: "pending" }) },
    { label: "Open app issues", value: String(open.length), sub: "Support is open 24/7", icon: <LifeBuoy size={17} />, onClick: () => go({ section: "inbox", tab: "issues" }) },
  ];

  const statusTone = { pending_review: "amber", approved: "green", rejected: "red", awaiting_payment: "blue", expired: "zinc", cancelled: "zinc" } as const;
  const statusLabel = { pending_review: "Pending review", approved: "Delivered", rejected: "Rejected", awaiting_payment: "Awaiting payment", expired: "Expired", cancelled: "Cancelled" };

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="max-w-[1200px] mx-auto p-4 lg:p-7 space-y-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Good {new Date(now).getHours() < 12 ? "morning" : new Date(now).getHours() < 17 ? "afternoon" : "evening"}</h1>
          <p className="text-[13.5px] text-zinc-500 mt-0.5">Here&apos;s what&apos;s happening in your store today.</p>
        </div>

        {pending.length > 0 && (
          <button onClick={() => go({ section: "inbox", tab: "pending" })} className="w-full text-left rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3 hover:bg-amber-100/70 transition">
            <AlertTriangle size={18} className="text-amber-600" />
            <span className="text-[13.5px] text-amber-900 flex-1">
              <b>{pending.length} payment{pending.length > 1 ? "s" : ""}</b> waiting for verification
            </span>
            <span className="text-[13px] font-medium text-amber-800 flex items-center gap-1">Review <ArrowRight size={14} /></span>
          </button>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <Card key={k.label} className={cx("p-4", k.onClick && "cursor-pointer hover:border-zinc-300 transition")}>
              <div onClick={k.onClick}>
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[12.5px] font-medium">{k.label}</span>
                  <span className={cx("size-8 rounded-lg grid place-items-center", k.alert ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600")}>{k.icon}</span>
                </div>
                <div className="text-[24px] font-semibold tracking-tight mt-2 tabular-nums">{k.value}</div>
                <div className="text-[12px] text-zinc-500 mt-0.5">{k.sub}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <Card>
            <CardHead title="Recent orders" desc="Latest activity across all customers" right={<button onClick={() => go({ section: "inbox", tab: "completed" })} className="text-[12.5px] text-zinc-500 hover:text-zinc-900">View all</button>} />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-zinc-500 border-y border-zinc-100 bg-zinc-50/60">
                    <th className="font-medium px-5 py-2">Customer</th>
                    <th className="font-medium px-3 py-2">Plan</th>
                    <th className="font-medium px-3 py-2">Amount</th>
                    <th className="font-medium px-3 py-2">Status</th>
                    <th className="font-medium px-5 py-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} onClick={() => go({ section: "inbox", customerId: o.customerId, tab: o.status === "pending_review" ? "pending" : "completed" })} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 cursor-pointer">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={name(o.customerId)} size={28} />
                          <div>
                            <div className="font-medium">{name(o.customerId)}</div>
                            <div className="text-[11.5px] text-zinc-400">{o.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">{o.planName}</td>
                      <td className="px-3 py-2.5 tabular-nums">{rs(o.amount)}</td>
                      <td className="px-3 py-2.5"><Badge tone={statusTone[o.status]}>{statusLabel[o.status]}</Badge></td>
                      <td className="px-5 py-2.5 text-right text-zinc-500 whitespace-nowrap">{timeAgo(o.createdAt, now)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHead title="Code inventory" desc="Available codes per plan" right={<button onClick={() => go({ section: "codes" })} className="text-[12.5px] text-zinc-500 hover:text-zinc-900">Manage</button>} />
              <div className="px-5 pb-4 space-y-3">
                {s.plans.map((p) => {
                  const avail = s.codes.filter((k) => k.planId === p.id && k.status === "available").length;
                  const low = avail < 5;
                  return (
                    <div key={p.id}>
                      <div className="flex justify-between text-[13px]">
                        <span className="font-medium">{p.name}</span>
                        <span className={cx("tabular-nums", low ? "text-red-600 font-semibold" : "text-zinc-600")}>{avail} left{low ? " · low" : ""}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div className={cx("h-full rounded-full", low ? "bg-red-500" : "bg-zinc-800")} style={{ width: `${Math.min(100, (avail / 15) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <CardHead title="Activity" />
              <div className="px-5 pb-4 space-y-3">
                {s.notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="flex gap-3 text-[12.5px]">
                    <span className={cx("mt-1.5 size-1.5 rounded-full shrink-0", n.type === "order" ? "bg-amber-500" : n.type === "ticket" ? "bg-red-500" : "bg-sky-500")} />
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-800">{n.title}</div>
                      <div className="text-zinc-500 truncate">{n.body}</div>
                    </div>
                    <span className="ml-auto text-zinc-400 shrink-0">{timeAgo(n.createdAt, now)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        <p className="text-[11.5px] text-zinc-400 text-center pb-2">Last updated {fmtDateTime(now)}</p>
      </div>
    </div>
  );
}
