"use client";

import { CheckCircle2, RotateCcw } from "lucide-react";
import StoredImage from "@/components/StoredImage";
import { classNames, formatDateTime } from "@/lib/format";
import { moveOrderToCategory, setTicketResolved, type OrderCategory } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import type { Order, Ticket } from "@/lib/types";
import Badge from "../ui/Badge";

const categories: { key: OrderCategory; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "unused", label: "Unused" },
];

function currentCategory(order: Order): OrderCategory | null {
  if (order.status === "pending_review") return "pending";
  if (order.status === "completed") return order.codeUnused ? "unused" : "completed";
  return null;
}

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const state = useAppState();
  const isOpen = ticket.status === "open";
  const order =
    state.orders.find((item) => item.id === ticket.orderId) ??
    state.orders.filter((item) => item.customerId === ticket.customerId).sort((a, b) => b.createdAt - a.createdAt)[0];
  const category = order ? currentCategory(order) : null;

  return (
    <div className="rounded-2xl border border-zinc-200/80 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">{ticket.kind === "payment" ? "Payment issue" : "Support issue"}</div>
          <div className="text-[13.5px] font-bold text-zinc-900">{ticket.id}</div>
        </div>
        {isOpen ? <Badge tone="red">Open</Badge> : <Badge>Resolved</Badge>}
      </div>

      <p className="text-[13px] text-zinc-700 mt-3 leading-relaxed">{ticket.message}</p>
      {ticket.screenshot && <StoredImage path={ticket.screenshot} alt="Issue screenshot" className="mt-3 w-full h-48 object-contain rounded-xl border border-zinc-200 bg-zinc-50" />}
      <div className="text-[11.5px] text-zinc-400 mt-2">{formatDateTime(ticket.createdAt)}</div>

      {order && (
        <div className="mt-3">
          <div className="text-[11.5px] font-medium text-zinc-500 mb-1.5">Move order {order.id} to</div>
          <div className="grid grid-cols-3 gap-1.5">
            {categories.map((item) => (
              <button
                key={item.key}
                onClick={() => moveOrderToCategory(order.id, item.key)}
                className={classNames(
                  "h-8 rounded-lg border text-[12px] font-semibold transition",
                  category === item.key ? "bg-[#0C2660] border-[#0C2660] text-white" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setTicketResolved(ticket.id, isOpen)}
        className={classNames(
          "mt-3 w-full h-9 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition",
          isOpen ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
        )}
      >
        {isOpen ? <CheckCircle2 size={14} /> : <RotateCcw size={14} />} {isOpen ? "Mark as resolved" : "Reopen"}
      </button>
    </div>
  );
}
