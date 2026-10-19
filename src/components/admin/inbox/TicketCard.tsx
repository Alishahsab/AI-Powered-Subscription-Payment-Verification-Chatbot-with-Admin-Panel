"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquareReply } from "lucide-react";
import StoredImage from "@/components/StoredImage";
import { classNames, formatDateTime } from "@/lib/format";
import { setTicketResolved } from "@/lib/store/admin";
import type { Ticket } from "@/lib/types";
import ReplyDialog from "./ReplyDialog";

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const [zoomed, setZoomed] = useState(false);
  const [replying, setReplying] = useState(false);
  const isOpen = ticket.status === "open";

  return (
    <div className="rounded-2xl border border-zinc-200/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className={classNames("rounded-md px-2 py-1 text-[11.5px] font-bold uppercase tracking-wider", isOpen ? "bg-amber-300/70 text-amber-950" : "bg-zinc-100 text-zinc-500")}>
          {ticket.kind === "payment" ? "Payment issue" : "App issues"}
        </span>
        <span className="text-[12.5px] font-bold text-zinc-900">{ticket.id}</span>
      </div>

      <p className="text-[13px] text-zinc-700 mt-3 leading-relaxed">{ticket.message}</p>

      {ticket.screenshot && (
        <button onClick={() => setZoomed(true)} className="mt-3 block size-16 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 hover:ring-2 hover:ring-[#0C2660]/30 transition" title="Open screenshot">
          <StoredImage path={ticket.screenshot} alt="Issue screenshot" className="size-full object-cover object-top" />
        </button>
      )}

      <div className="text-[11.5px] text-zinc-400 mt-2">
        {formatDateTime(ticket.createdAt)}
        {ticket.orderId && ` · Order ${ticket.orderId}`}
      </div>

      {isOpen && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <button onClick={() => setReplying(true)} className="h-9 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center justify-center gap-1.5 transition">
            <MessageSquareReply size={14} /> Reply
          </button>
          <button onClick={() => setTicketResolved(ticket.id, true)} className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition">
            <CheckCircle2 size={14} /> Resolved
          </button>
        </div>
      )}

      {replying && <ReplyDialog customerId={ticket.customerId} onClose={() => setReplying(false)} />}

      {zoomed && ticket.screenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-6 fade-in" onClick={() => setZoomed(false)}>
          <StoredImage path={ticket.screenshot} alt="Issue screenshot" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
