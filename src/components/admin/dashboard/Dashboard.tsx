"use client";

import { AlertTriangle, ArrowRight, Clock, LifeBuoy, MessageCircle, ShoppingBag, Users } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { classNames } from "@/lib/format";
import { useAppState } from "@/lib/store/state";
import type { Navigate, NavTarget } from "../navigation";
import { countBotFilters } from "../inbox/inboxItems";
import CompletedOrdersChart from "./CompletedOrdersChart";

export default function Dashboard({ onNavigate }: { onNavigate: Navigate }) {
  const state = useAppState();
  const now = useNow(30_000);

  // Same counts as the Active orders and Active chats filters in Bot chat.
  const botCounts = countBotFilters(state, now);
  const activeOrders = botCounts.active_orders;
  const pendingOrders = state.orders.filter((order) => order.status === "pending_review" || order.status === "rejected");
  const openIssues = state.tickets.filter((ticket) => ticket.status === "open" && ticket.kind === "support");
  const activeChats = botCounts.active_chats;

  const stats: { label: string; value: string; note: string; icon: React.ReactNode; highlight?: boolean; target?: NavTarget }[] = [
    {
      label: "Pending orders",
      value: String(pendingOrders.length),
      note: "Waiting for your approval",
      icon: <Clock size={17} />,
      highlight: pendingOrders.length > 0,
      target: { section: "inbox", tab: "pending" },
    },
    { label: "App issues", value: String(openIssues.length), note: "Open support requests", icon: <LifeBuoy size={17} />, target: { section: "inbox", tab: "issues" } },
    {
      label: "Active chats",
      value: String(activeChats),
      note: `Active in the last ${state.settings.timers.inactiveMinutes} min`,
      icon: <MessageCircle size={17} />,
      target: { section: "bot", botFilter: "active_chats" },
    },
    {
      label: "Active orders",
      value: String(activeOrders),
      note: "Created, waiting for payment",
      icon: <ShoppingBag size={17} />,
      target: { section: "bot", botFilter: "active_orders" },
    },
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
            className="pending-banner w-full text-left rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3 hover:bg-amber-100/70 transition"
          >
            <AlertTriangle size={18} className="pending-banner-accent text-amber-600" />
            <span className="pending-banner-text text-[13.5px] text-amber-900 flex-1">
              <b>{pendingOrders.length} payment{pendingOrders.length > 1 ? "s" : ""}</b> waiting for verification
            </span>
            <span className="pending-banner-accent text-[13px] font-medium text-amber-800 flex items-center gap-1">
              Review <ArrowRight size={14} />
            </span>
          </button>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <button
              key={stat.label}
              disabled={!stat.target}
              onClick={() => stat.target && onNavigate(stat.target)}
              className="text-left bg-white rounded-xl border border-zinc-200/80 px-3.5 py-3 hover:border-zinc-300 transition disabled:hover:border-zinc-200/80"
            >
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[12px] font-medium">{stat.label}</span>
                <span className={classNames("size-7 rounded-lg grid place-items-center", stat.highlight ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600")}>{stat.icon}</span>
              </div>
              <div className="text-[20px] font-semibold tracking-tight mt-1 tabular-nums">{stat.value}</div>
              <div className="text-[11.5px] text-zinc-500">{stat.note}</div>
            </button>
          ))}
        </div>

        <CompletedOrdersChart now={now} />

        <button
          onClick={() => onNavigate({ section: "customers" })}
          className="w-full text-left bg-white rounded-xl border border-zinc-200/80 px-5 py-4 flex items-center gap-4 hover:border-zinc-300 transition"
        >
          <span className="size-11 rounded-xl bg-[#0C2660]/[0.07] text-[#0C2660] grid place-items-center shrink-0">
            <Users size={20} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold text-zinc-900">Customer list</span>
            <span className="block text-[12.5px] text-zinc-500">{state.customers.length} customers · tap to see all</span>
          </span>
          <ArrowRight size={18} className="text-zinc-400" />
        </button>

      </div>
    </div>
  );
}
