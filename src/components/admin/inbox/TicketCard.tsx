"use client";

import { useState } from "react";
import StoredImage from "@/components/StoredImage";
import { classNames, formatDateTime } from "@/lib/format";
import { setTicketResolved } from "@/lib/store/admin";
import type { Ticket } from "@/lib/types";
import ConfirmDialog from "../ui/ConfirmDialog";
import ReplyDialog from "./ReplyDialog";

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const [zoomed, setZoomed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [confirmingResolve, setConfirmingResolve] = useState(false);
  const isOpen = ticket.status === "open";

  return (
    <div className="rounded-2xl border border-zinc-200/80 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between bg-[#f8f9fb] border-b border-zinc-200/80">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">{ticket.kind === "payment" ? "Payment issue" : "App issue"}</div>
          <div className="text-[13.5px] font-bold text-zinc-900">{ticket.id}</div>
        </div>
        <span className={classNames("rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider", isOpen ? "bg-amber-300/70 text-amber-950" : "bg-zinc-100 text-zinc-500")}>
          {ticket.kind === "payment" ? "Payment issue" : "App issues"}
        </span>
      </div>

      <dl className="px-4 py-3 space-y-2 text-[13px]">
        <div className="flex items-start justify-between gap-3">
          <dd className="min-w-0 text-zinc-800 leading-relaxed break-words">{ticket.message}</dd>
          {ticket.screenshot && (
            <button onClick={() => setZoomed(true)} className="shrink-0 block size-16 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 hover:ring-2 hover:ring-[#0C2660]/30 transition" title="Open screenshot">
              <StoredImage path={ticket.screenshot} alt="Issue screenshot" className="size-full object-cover object-top" />
            </button>
          )}
        </div>
        {ticket.orderId && <Row label="Order" value={ticket.orderId} />}
        <Row label="Submitted" value={formatDateTime(ticket.createdAt)} />
      </dl>

      {isOpen && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-1.5">
          <button onClick={() => setReplying(true)} className="h-9 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center justify-center gap-1.5 transition">
            Reply
          </button>
          <button onClick={() => setConfirmingResolve(true)} className="h-9 rounded-xl bg-[#0C2660] hover:bg-[#0a1f52] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition">
            Resolved
          </button>
        </div>
      )}

      {replying && <ReplyDialog customerId={ticket.customerId} onClose={() => setReplying(false)} />}
      {confirmingResolve && (
        <ConfirmDialog description={`${ticket.id} will be closed and the customer will be told it is resolved.`} confirmLabel="Yes, resolve" onConfirm={() => setTicketResolved(ticket.id, true)} onClose={() => setConfirmingResolve(false)} />
      )}

      {zoomed && ticket.screenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-6 fade-in" onClick={() => setZoomed(false)}>
          <StoredImage path={ticket.screenshot} alt="Issue screenshot" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-800 text-right truncate">{value}</dd>
    </div>
  );
}
