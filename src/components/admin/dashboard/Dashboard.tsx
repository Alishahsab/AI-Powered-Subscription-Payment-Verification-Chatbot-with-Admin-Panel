"use client";

import { AlertTriangle, ArrowRight, Clock, LifeBuoy, MessageCircle, Wallet } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { classNames, formatMoney, timeAgo } from "@/lib/format";
import { useAppState } from "@/lib/store/state";
import type { Navigate } from "../navigation";
import { Card, CardHeader } from "../ui/Card";
import RecentOrders from "./RecentOrders";

export default function Dashboard({ onNavigate }: { onNavigate: Navigate }) {
  const state = useAppState();
  const now = useNow(30_000);

  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const completedToday = state.orders.filter((order) => order.status === "completed" && (order.reviewedAt ?? 0) >= startOfToday);
  const revenueToday = completedToday.reduce((sum, order) => sum + order.amount, 0);
  const pendingOrders = state.orders.filter((order) => order.status === "pending_review");
  const openIssues = state.tickets.filter((ticket) => ticket.status === "open");
  const inactiveAfter = state.settings.timers.inactiveMinutes * 60_000;
  const activeChats = state.customers.filter((customer) => now - customer.lastSeenAt < inactiveAfter);

  const stats = [
    { label: "Revenue today", value: formatMoney(revenueToday), note: `${completedToday.length} orders completed`, icon: <Wallet size={17} /> },
    { label: "Pending review", value: String(pendingOrders.length), note: "Waiting for your approval", icon: <Clock size={17} />, highlight: pendingOrders.length > 0, tab: "pending" as const },
    { label: "Open issues", value: String(openIssues.length), note: "Support and payment issues", icon: <LifeBuoy size={17} />, tab: "issues" as const },
    { label: "Active chats", value: String(activeChats.length), note: `Active in the last ${state.settings.timers.inactiveMinutes} min`, icon: <MessageCircle size={17} />, tab: "general" as const },
  ];

  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1200px] mx-auto p-4 lg:p-7 space-y-5">
        <div>
          <h1 className="text-[30px] lg:text-[34px] font-bold tracking-tight text-zinc-900">{greeting}</h1>
          <p className="text-[14.5px] text-zinc-500 mt-1">Here&apos;s What&apos;s Happening In Your Store Today.</p>
        </div>

        {pendingOrders.length > 0 && (
          <button
            onClick={() => onNavigate({ section: "inbox", tab: "pending" })}
            className="w-full text-left rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3 hover:bg-amber-100/70 transition"
          >
            <AlertTriangle size={18} className="text-amber-600" />
            <span className="text-[13.5px] text-amber-900 flex-1">
              <b>{pendingOrders.length} payment{pendingOrders.length > 1 ? "s" : ""}</b> waiting for verification
            </span>
            <span className="text-[13px] font-medium text-amber-800 flex items-center gap-1">
              Review <ArrowRight size={14} />
            </span>
          </button>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <button
              key={stat.label}
              disabled={!stat.tab}
              onClick={() => stat.tab && onNavigate({ section: "inbox", tab: stat.tab })}
              className="text-left bg-white rounded-xl border border-zinc-200/80 p-4 hover:border-zinc-300 transition disabled:hover:border-zinc-200/80"
            >
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[12.5px] font-medium">{stat.label}</span>
                <span className={classNames("size-8 rounded-lg grid place-items-center", stat.highlight ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600")}>{stat.icon}</span>
              </div>
              <div className="text-[24px] font-semibold tracking-tight mt-2 tabular-nums">{stat.value}</div>
              <div className="text-[12px] text-zinc-500 mt-0.5">{stat.note}</div>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
          <RecentOrders onNavigate={onNavigate} />

          <div className="space-y-5">
            <Card>
              <CardHeader title="Payment account" description="Shown to customers for every order" action={<button onClick={() => onNavigate({ section: "settings" })} className="text-[12.5px] text-zinc-500 hover:text-zinc-900">Change</button>} />
              <div className="px-5 pb-4 text-[13px] space-y-1">
                <div className="font-semibold text-zinc-900">{state.settings.bank.bankName}</div>
                <div className="text-zinc-600 tabular-nums">{state.settings.bank.accountNumber}</div>
                <div className="text-zinc-500">{state.settings.bank.accountTitle}</div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Activity" />
              <div className="px-5 pb-4 space-y-3">
                {state.notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex gap-3 text-[12.5px]">
                    <span className={classNames("mt-1.5 size-1.5 rounded-full shrink-0", notification.kind === "payment" ? "bg-amber-500" : "bg-red-500")} />
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-800">{notification.title}</div>
                      <div className="text-zinc-500 truncate">{notification.body}</div>
                    </div>
                    <span className="ml-auto text-zinc-400 shrink-0">{timeAgo(notification.createdAt, now)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
