"use client";

import { useNow } from "@/hooks/useNow";
import { formatMoney, timeAgo } from "@/lib/format";
import { findCustomerEmail } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Order } from "@/lib/types";
import type { Navigate, NavTarget } from "../navigation";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import { Card, CardHeader } from "../ui/Card";
import { orderStatusBadge } from "../ui/orderStatus";

function targetForOrder(order: Order): NavTarget {
  const customerId = order.customerId;
  if (order.status === "pending_review" || order.status === "rejected") return { section: "inbox", tab: "pending", customerId };
  if (order.status === "completed") return { section: "inbox", tab: order.codeUnused ? "unused" : "completed", customerId };
  return { section: "bot", customerId };
}

export default function RecentOrders({ onNavigate }: { onNavigate: Navigate }) {
  const state = useAppState();
  const now = useNow(30_000);
  const orders = state.orders
    .filter((order) => order.status !== "cancelled")
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Recent orders" description={`${orders.length} orders across all customers`} />
      <div className="overflow-auto max-h-[460px]">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="text-left text-zinc-500 border-y border-zinc-100 bg-zinc-50">
              <th className="font-medium px-5 py-2">Customer</th>
              <th className="font-medium px-3 py-2">Plan</th>
              <th className="font-medium px-3 py-2">Amount</th>
              <th className="font-medium px-3 py-2">Status</th>
              <th className="font-medium px-5 py-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const name = findCustomerEmail(state, order.customerId);
              const badge = orderStatusBadge[order.status];
              return (
                <tr key={order.id} onClick={() => onNavigate(targetForOrder(order))} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 cursor-pointer">
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={name} size={28} />
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-[11.5px] text-zinc-400">{order.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">{order.planName}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatMoney(order.amount)}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className="px-5 py-2.5 text-right text-zinc-500 whitespace-nowrap">{timeAgo(order.createdAt, now)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
