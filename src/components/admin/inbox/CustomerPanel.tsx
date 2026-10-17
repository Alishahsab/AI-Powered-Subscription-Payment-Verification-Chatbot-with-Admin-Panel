"use client";

import { ShieldAlert } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { toggleCustomerBlocked } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import OrderReview from "./OrderReview";
import TicketCard from "./TicketCard";

export default function CustomerPanel({ customerId }: { customerId: string }) {
  const state = useAppState();
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return null;

  const orders = state.orders.filter((order) => order.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt);
  const focusOrder = orders.find((order) => order.status === "pending_review") ?? orders[0];
  const completed = orders.filter((order) => order.status === "completed");
  const totalSpent = completed.reduce((sum, order) => sum + order.amount, 0);
  const tickets = state.tickets.filter((ticket) => ticket.customerId === customerId);

  return (
    <div className="divide-y divide-zinc-100">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Avatar name={customer.name} size={44} />
          <div className="min-w-0">
            <div className="font-semibold text-[15px]">{customer.name}</div>
            <div className="text-[12.5px] text-zinc-500">Customer since {formatDate(customer.createdAt)}</div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-[90px_1fr] gap-y-1.5 text-[12.5px]">
          <dt className="text-zinc-500">Email</dt>
          <dd className="font-medium truncate">{customer.email}</dd>
          <dt className="text-zinc-500">Orders</dt>
          <dd className="font-medium">
            {completed.length} completed · {formatMoney(totalSpent)}
          </dd>
        </dl>

        <Button size="sm" variant={customer.blocked ? "secondary" : "danger"} className="mt-3" onClick={() => toggleCustomerBlocked(customer.id)}>
          <ShieldAlert size={13} /> {customer.blocked ? "Unblock customer" : "Block customer"}
        </Button>
      </div>

      {focusOrder && <OrderReview key={focusOrder.id + focusOrder.status} order={focusOrder} />}

      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
