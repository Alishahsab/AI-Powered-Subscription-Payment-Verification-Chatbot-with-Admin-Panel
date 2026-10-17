"use client";

import { ShieldAlert } from "lucide-react";
import { classNames, formatDate, formatMoney } from "@/lib/format";
import { toggleCustomerBlocked } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import Avatar from "../ui/Avatar";
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
    <div className="p-5 space-y-4">
      <div className="flex flex-col items-center text-center pt-2">
        <Avatar name={customer.name} size={64} />
        <div className="mt-3 font-bold text-[17px] text-zinc-900">{customer.name}</div>
        <div className="text-[13px] text-zinc-500 break-all">{customer.email}</div>
        <div className="text-[12px] text-zinc-400 mt-0.5">Customer since {formatDate(customer.createdAt)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Completed orders" value={String(completed.length)} />
        <Stat label="Total spent" value={formatMoney(totalSpent)} />
      </div>

      {focusOrder && <OrderReview key={focusOrder.id + focusOrder.status} order={focusOrder} />}

      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}

      <button
        onClick={() => toggleCustomerBlocked(customer.id)}
        className={classNames(
          "w-full h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition",
          customer.blocked ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200" : "text-red-600 hover:bg-red-50"
        )}
      >
        <ShieldAlert size={14} /> {customer.blocked ? "Unblock customer" : "Block customer"}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f5f6f8] px-3.5 py-3">
      <div className="text-[17px] font-bold text-zinc-900">{value}</div>
      <div className="text-[11.5px] text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}
