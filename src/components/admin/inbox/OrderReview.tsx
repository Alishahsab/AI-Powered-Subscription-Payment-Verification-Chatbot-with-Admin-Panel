"use client";

import { useState } from "react";
import { Check, Info, X } from "lucide-react";
import { formatDateTime, formatMoney, formatTime } from "@/lib/format";
import { approveOrder, rejectOrder, rejectReasons } from "@/lib/store/admin";
import type { Order } from "@/lib/types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { orderStatusBadge } from "../ui/orderStatus";

export default function OrderReview({ order }: { order: Order }) {
  const [zoomed, setZoomed] = useState(false);
  const [choosingReason, setChoosingReason] = useState(false);
  const badge = orderStatusBadge[order.status];

  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-[12px] uppercase tracking-wider text-zinc-500 font-semibold">Order {order.id}</div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Detail label="Plan" value={order.planName} />
        <Detail label="Amount" value={formatMoney(order.amount)} />
        <Detail label="Method" value={order.methodName} />
        <Detail label="Sender name" value={order.senderName ?? "N/A"} />
      </div>

      {order.screenshot && (
        <button onClick={() => setZoomed(true)} className="mt-3 block w-full rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50">
          <img src={order.screenshot} alt="Payment screenshot" className="w-full max-h-72 object-contain" />
        </button>
      )}

      <div className="mt-2 text-[11.5px] text-zinc-400">
        Created {formatDateTime(order.createdAt)}
        {order.submittedAt && ` · proof at ${formatTime(order.submittedAt)}`}
      </div>

      {order.status === "pending_review" && (
        <div className="mt-4 space-y-2">
          <Button variant="success" className="w-full h-10" onClick={() => approveOrder(order.id)}>
            <Check size={15} /> Approve payment
          </Button>
          {choosingReason ? (
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-2 space-y-1 fade-in">
              {rejectReasons.map((reason) => (
                <button key={reason} onClick={() => rejectOrder(order.id, reason)} className="w-full text-left text-[12.5px] px-2.5 py-1.5 rounded-md hover:bg-red-100 text-red-700">
                  {reason}
                </button>
              ))}
            </div>
          ) : (
            <Button variant="danger" className="w-full" onClick={() => setChoosingReason(true)}>
              <X size={14} /> Reject
            </Button>
          )}
        </div>
      )}

      {order.status === "completed" && (
        <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-[12.5px] text-emerald-800 flex gap-2">
          <Info size={15} className="shrink-0 mt-0.5" />
          <span>Approved {formatDateTime(order.reviewedAt ?? order.createdAt)}. Type the premium code in the chat to send it.</span>
        </div>
      )}

      {order.status === "rejected" && <div className="mt-3 text-[12.5px] text-red-700 bg-red-50 rounded-lg px-3 py-2">Rejected: {order.rejectReason}. The customer can upload new proof.</div>}

      {zoomed && order.screenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-6 fade-in" onClick={() => setZoomed(false)}>
          <img src={order.screenshot} alt="Payment screenshot" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="text-[13px] font-semibold truncate">{value}</div>
    </div>
  );
}
