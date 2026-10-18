"use client";

import { useState } from "react";
import { Check, Info, PackageX, X } from "lucide-react";
import StoredImage from "@/components/StoredImage";
import { formatDateTime, formatMoney, formatTime } from "@/lib/format";
import { setCodeUnused } from "@/lib/store/admin";
import type { Order } from "@/lib/types";
import Badge from "../ui/Badge";
import { orderStatusBadge } from "../ui/orderStatus";
import ApproveDialog from "./ApproveDialog";
import RejectDialog from "./RejectDialog";

type OrderReviewProps = {
  order: Order;
  customerEmail: string;
};

export default function OrderReview({ order, customerEmail }: OrderReviewProps) {
  const [zoomed, setZoomed] = useState(false);
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const badge = orderStatusBadge[order.status];

  return (
    <div className="rounded-2xl border border-zinc-200/80 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between bg-[#f8f9fb] border-b border-zinc-200/80">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Latest order</div>
          <div className="text-[13.5px] font-bold text-zinc-900">{order.id}</div>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <dl className="px-4 py-3 space-y-2 text-[13px]">
        <Row label="Plan" value={order.planName} />
        <Row label="Amount" value={formatMoney(order.amount)} strong />
        <Row label="Method" value={order.methodName} />
        {order.bank && <Row label="Paid to" value={`${order.bank.bankName} · ${order.bank.accountNumber}`} />}
        {order.senderName && <Row label="Sender name" value={order.senderName} />}
        {order.code && <Row label="Code" value={order.code} strong />}
        <Row label="Created" value={formatDateTime(order.createdAt)} />
        {order.submittedAt && <Row label="Proof sent" value={formatTime(order.submittedAt)} />}
      </dl>

      {order.screenshot && (
        <div className="px-4 pb-3">
          <button onClick={() => setZoomed(true)} className="block w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
            <StoredImage path={order.screenshot} alt="Payment screenshot" className="w-full h-64 object-contain" />
          </button>
        </div>
      )}

      {order.status === "rejected" && (
        <div className="mx-4 mb-3 text-[12.5px] text-red-700 bg-red-50 rounded-xl px-3 py-2.5">
          Rejected: {order.rejectReason}. The customer can reply once; approve it here if the payment turns out to be fine.
        </div>
      )}

      {(order.status === "pending_review" || order.status === "rejected") && (
        <div className="px-4 pb-4 space-y-2">
          <button onClick={() => setDialog("approve")} className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition">
            <Check size={15} /> {order.status === "rejected" ? "Approve anyway" : "Approve payment"}
          </button>
          {order.status === "pending_review" && (
            <button onClick={() => setDialog("reject")} className="w-full h-10 rounded-xl text-red-600 hover:bg-red-50 text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition">
              <X size={14} /> Reject
            </button>
          )}
        </div>
      )}

      {dialog === "approve" && <ApproveDialog order={order} customerEmail={customerEmail} onClose={() => setDialog(null)} />}
      {dialog === "reject" && <RejectDialog order={order} onClose={() => setDialog(null)} />}

      {order.status === "completed" && !order.code && (
        <div className="mx-4 mb-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12.5px] text-emerald-800 flex gap-2">
          <Info size={15} className="shrink-0 mt-0.5" />
          <span>Approved {formatDateTime(order.reviewedAt ?? order.createdAt)}. Type the premium code in the chat to send it.</span>
        </div>
      )}

      {order.status === "completed" && order.code && (
        <div className="px-4 pb-4">
          {order.codeUnused ? (
            <button onClick={() => setCodeUnused(order.id, false)} className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition">
              <Check size={15} /> Code used, move to Completed
            </button>
          ) : (
            <button onClick={() => setCodeUnused(order.id, true)} className="w-full h-10 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-[13px] font-semibold flex items-center justify-center gap-1.5 transition">
              <PackageX size={15} /> Code not used, move to Unused
            </button>
          )}
        </div>
      )}

      {zoomed && order.screenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-6 fade-in" onClick={() => setZoomed(false)}>
          <StoredImage path={order.screenshot} alt="Payment screenshot" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={strong ? "font-bold text-[#0C2660]" : "font-medium text-zinc-800 text-right truncate"}>{value}</dd>
    </div>
  );
}
