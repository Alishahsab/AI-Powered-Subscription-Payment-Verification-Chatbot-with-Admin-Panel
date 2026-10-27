"use client";

import { formatDate } from "@/lib/format";
import { customerNumberLabel } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import CustomerAvatar from "../ui/CustomerAvatar";
import WhatsAppLink from "../ui/WhatsAppLink";
import BlockCustomerButton from "../customers/BlockCustomerButton";
import OrderReview from "./OrderReview";
import TicketCard from "./TicketCard";

export default function CustomerPanel({ customerId }: { customerId: string }) {
  const state = useAppState();
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return null;

  const orders = state.orders.filter((order) => order.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt);
  const completed = orders.filter((order) => order.status === "completed");
  const pending = orders.filter((order) => order.status === "pending_review" || order.status === "rejected");
  const customerTickets = state.tickets.filter((ticket) => ticket.customerId === customerId);
  const tickets = customerTickets.filter((ticket) => ticket.status === "open");
  const issuesResolved = customerTickets.filter((ticket) => ticket.status === "resolved").length;

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-col items-center text-center pt-2">
        <CustomerAvatar customerId={customer.id} size={104} />
        <div className="mt-3 font-bold text-[18px] text-[#0C2660]">{customerNumberLabel(customer)}</div>
        {customer.whatsapp && <WhatsAppLink number={customer.whatsapp} className="mt-0.5 text-[14px]" />}
        <div className="text-[13.5px] font-medium text-zinc-800 break-all">{customer.email}</div>
        <div className="text-[12px] text-zinc-400 mt-0.5">Customer since {formatDate(customer.createdAt)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Completed orders" value={String(completed.length)} />
        <Stat label="Issues resolved" value={String(issuesResolved)} />
      </div>

      {[...pending, ...completed].map((order) => (
        <OrderReview key={order.id + order.status} order={order} customerEmail={customer.email} />
      ))}

      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}

      {customer.blocked && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-700">
          <span className="font-semibold">Blocked:</span> {customer.blockReason ?? "No reason given"}
        </div>
      )}

      <BlockCustomerButton customer={customer} />
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
