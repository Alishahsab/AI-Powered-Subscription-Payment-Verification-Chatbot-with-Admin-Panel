"use client";

import { useNow } from "@/hooks/useNow";
import { formatMoney, timeAgo } from "@/lib/format";
import { findCustomerName } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Navigate } from "../navigation";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import { Card, CardHeader } from "../ui/Card";
import { orderStatusBadge } from "../ui/orderStatus";

export default function RecentOrders({ onNavigate }: { onNavigate: Navigate }) {
  const state = useAppState();
  const now = useNow(30_000);
  const orders = state.orders
    .filter((order) => order.status !== "cancelled")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 7);

  return (
    <Card>
      <CardHeader title="Recent orders" description="Latest activity across all customers" />
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
            {orders.map((order) => {
              const name = findCustomerName(state, order.customerId);
              const badge = orderStatusBadge[order.status];
              const tab = order.status === "pending_review" ? "pending" : "completed";

              return (
                <tr key={order.id} onClick={() => onNavigate({ section: "inbox", customerId: order.customerId, tab })} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 cursor-pointer">
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
