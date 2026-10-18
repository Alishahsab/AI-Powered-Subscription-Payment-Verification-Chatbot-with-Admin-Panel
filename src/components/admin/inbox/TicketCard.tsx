"use client";

import StoredImage from "@/components/StoredImage";
import { classNames, formatDateTime } from "@/lib/format";
import { setTicketResolved } from "@/lib/store/admin";
import type { Ticket } from "@/lib/types";
import Badge from "../ui/Badge";

const statuses = [
  { resolved: false, label: "Pending" },
  { resolved: true, label: "Resolved" },
];

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const isResolved = ticket.status === "resolved";

  return (
    <div className="rounded-2xl border border-zinc-200/80 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">{ticket.kind === "payment" ? "Payment issue" : "Support issue"}</div>
          <div className="text-[13.5px] font-bold text-zinc-900">{ticket.id}</div>
        </div>
        {isResolved ? <Badge tone="green">Resolved</Badge> : <Badge tone="amber">Pending</Badge>}
      </div>

      <p className="text-[13px] text-zinc-700 mt-3 leading-relaxed">{ticket.message}</p>
      {ticket.screenshot && <StoredImage path={ticket.screenshot} alt="Issue screenshot" className="mt-3 w-full h-48 object-contain rounded-xl border border-zinc-200 bg-zinc-50" />}
      <div className="text-[11.5px] text-zinc-400 mt-2">
        {formatDateTime(ticket.createdAt)}
        {ticket.orderId && ` · Order ${ticket.orderId}`}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {statuses.map((status) => (
          <button
            key={status.label}
            onClick={() => status.resolved !== isResolved && setTicketResolved(ticket.id, status.resolved)}
            className={classNames(
              "h-9 rounded-xl border text-[13px] font-semibold transition",
              status.resolved === isResolved
                ? status.resolved
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-amber-500 border-amber-500 text-white"
                : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            )}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
}
