"use client";

import { CheckCircle2 } from "lucide-react";
import StoredImage from "@/components/StoredImage";
import { formatDateTime } from "@/lib/format";
import { setTicketResolved } from "@/lib/store/admin";
import type { Ticket } from "@/lib/types";
import Badge from "../ui/Badge";

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const isOpen = ticket.status === "open";

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
      <div className="text-[11.5px] text-zinc-400 mt-2">
        {formatDateTime(ticket.createdAt)}
        {ticket.orderId && ` · Order ${ticket.orderId}`}
      </div>

      <button
        onClick={() => setTicketResolved(ticket.id, isOpen)}
        className="mt-3 w-full h-9 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center justify-center gap-1.5 transition"
      >
        <CheckCircle2 size={14} /> {isOpen ? "Mark resolved" : "Reopen"}
      </button>
    </div>
  );
}
