"use client";

import { ShieldAlert } from "lucide-react";
import { classNames, formatDate, formatMoney } from "@/lib/format";
import { toggleCustomerBlocked } from "@/lib/store/admin";
import { customerNumberLabel, findLatestCode } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import Avatar from "../ui/Avatar";
import DeleteCustomerButton from "../customers/DeleteCustomerButton";
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
  const latestCode = findLatestCode(state, customerId);

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-col items-center text-center pt-2">
        <Avatar name={customer.email} size={64} />
        <div className="mt-3 font-bold text-[18px] text-[#0C2660]">{customerNumberLabel(customer)}</div>
        <div className="text-[13.5px] font-medium text-zinc-800 break-all">{customer.email}</div>
        <div className="text-[12px] text-zinc-400 mt-0.5">Customer since {formatDate(customer.createdAt)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Completed orders" value={String(completed.length)} />
        <Stat label="Total spent" value={formatMoney(totalSpent)} />
      </div>

      <div className="rounded-xl bg-[#f5f6f8] px-3.5 py-3">
        <div className="text-[11.5px] text-zinc-500">Current code</div>
        <div className="font-bold text-[14.5px] text-zinc-900 break-all mt-0.5">{latestCode?.code ?? "No code sent yet"}</div>
        {latestCode && (
          <div className={classNames("text-[11.5px] mt-0.5 font-medium", latestCode.codeUnused ? "text-amber-700" : "text-zinc-500")}>
            {latestCode.planName} · {latestCode.codeUnused ? "Not used yet" : "Used"}
          </div>
        )}
      </div>

      {focusOrder && <OrderReview key={focusOrder.id + focusOrder.status} order={focusOrder} />}

      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => toggleCustomerBlocked(customer.id)}
          className={classNames(
            "h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition border",
            customer.blocked ? "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          )}
        >
          <ShieldAlert size={14} /> {customer.blocked ? "Unblock" : "Block"}
        </button>
        <DeleteCustomerButton customerId={customer.id} email={customer.email} />
      </div>
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
