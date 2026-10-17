"use client";

import { CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { setTicketResolved } from "@/lib/store/admin";
import type { Ticket } from "@/lib/types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const isOpen = ticket.status === "open";

  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-[12px] uppercase tracking-wider text-zinc-500 font-semibold">
          {ticket.kind === "payment" ? "Payment issue" : "Support issue"} · {ticket.id}
        </div>
        {isOpen ? <Badge tone="red">Open</Badge> : <Badge>Resolved</Badge>}
      </div>

      <p className="text-[13px] text-zinc-700 mt-2 leading-relaxed">{ticket.message}</p>
      {ticket.orderId && <div className="text-[12px] text-zinc-500 mt-1">Order {ticket.orderId}</div>}
      {ticket.screenshot && <img src={ticket.screenshot} alt="Issue screenshot" className="mt-2 w-full max-h-48 object-contain rounded-lg border border-zinc-200 bg-zinc-50" />}
      <div className="text-[11.5px] text-zinc-400 mt-1">{formatDateTime(ticket.createdAt)}</div>

      <Button size="sm" className="mt-3" onClick={() => setTicketResolved(ticket.id, isOpen)}>
        <CheckCircle2 size={13} /> {isOpen ? "Mark resolved" : "Reopen"}
      </Button>
    </div>
  );
}
