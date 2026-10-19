"use client";

import { useState } from "react";
import { Ban, Check, Info, PackageX, X } from "lucide-react";
import StoredImage from "@/components/StoredImage";
import { formatDateTime, formatMoney } from "@/lib/format";
import { cancelOrderAsAdmin, setCodeUnused } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import type { Order } from "@/lib/types";
import Badge from "../ui/Badge";
import ConfirmDialog from "../ui/ConfirmDialog";
import { orderStatusBadge } from "../ui/orderStatus";
import ApproveDialog from "./ApproveDialog";
import RejectDialog from "./RejectDialog";

type OrderReviewProps = {
  order: Order;
  customerEmail: string;
};

export default function OrderReview({ order, customerEmail }: OrderReviewProps) {
  const [zoomed, setZoomed] = useState(false);
  const [dialog, setDialog] = useState<"approve" | "reject" | "cancel" | "unused" | null>(null);
  const state = useAppState();
  const badge = orderStatusBadge[order.status];
  const completedOrders = state.orders.filter((item) => item.customerId === order.customerId && item.status === "completed").length;
  const issuesReported = state.tickets.filter((ticket) => ticket.customerId === order.customerId).length;

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
        <Row label="Completed orders" value={String(completedOrders)} />
        <Row label="App issues reported" value={String(issuesReported)} />
        <Row label="Plan" value={order.planName} />
        <Row label="Sender name" value={order.senderName ?? "Not sent yet"} />
        <div className="flex items-start justify-between gap-3">
          <dt className="text-zinc-500 pt-1">Screenshot</dt>
          <dd>
            {order.screenshot ? (
              <button onClick={() => setZoomed(true)} className="block size-16 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 hover:ring-2 hover:ring-[#0C2660]/30 transition" title="Open screenshot">
                <StoredImage path={order.screenshot} alt="Payment screenshot" className="size-full object-cover object-top" />
              </button>
            ) : (
              <span className="font-medium text-zinc-400">None</span>
            )}
          </dd>
        </div>
        <Row label="Proof sent" value={order.submittedAt ? formatDateTime(order.submittedAt) : "Not sent yet"} />
      </dl>

      <dl className="px-4 pb-3 pt-2.5 space-y-2 text-[12.5px] border-t border-zinc-100">
        <Row label="Amount" value={formatMoney(order.amount)} strong />
        <Row label="Method" value={order.methodName} />
        {order.bank && <Row label="Paid to" value={`${order.bank.bankName} · ${order.bank.accountNumber}`} />}
        {order.code && <Row label="Code" value={order.code} strong />}
        <Row label="Order created" value={formatDateTime(order.createdAt)} />
      </dl>

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
          {order.status === "pending_review" && (
            <button onClick={() => setDialog("cancel")} className="w-full h-10 rounded-xl text-zinc-600 hover:bg-zinc-100 text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition">
              <Ban size={14} /> Cancel order
            </button>
          )}
        </div>
      )}

      {dialog === "approve" && <ApproveDialog order={order} customerEmail={customerEmail} onClose={() => setDialog(null)} />}
      {dialog === "reject" && <RejectDialog order={order} onClose={() => setDialog(null)} />}
      {dialog === "cancel" && (
        <ConfirmDialog
          description={`${order.id} will move to Cancelled and ${customerEmail} can create a new order.`}
          confirmLabel="Yes, cancel order"
          tone="danger"
          onConfirm={() => cancelOrderAsAdmin(order.id)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "unused" && (
        <ConfirmDialog
          description={order.codeUnused ? `Code ${order.code} will move back to Completed.` : `Code ${order.code} will move to Unused.`}
          confirmLabel={order.codeUnused ? "Yes, mark as used" : "Yes, mark as unused"}
          onConfirm={() => setCodeUnused(order.id, !order.codeUnused)}
          onClose={() => setDialog(null)}
        />
      )}

      {order.status === "completed" && !order.code && (
        <div className="mx-4 mb-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12.5px] text-emerald-800 flex gap-2">
          <Info size={15} className="shrink-0 mt-0.5" />
          <span>Approved {formatDateTime(order.reviewedAt ?? order.createdAt)}. Type the premium code in the chat to send it.</span>
        </div>
      )}

      {order.status === "completed" && order.code && (
        <div className="px-4 pb-4">
          {order.codeUnused ? (
            <button onClick={() => setDialog("unused")} className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition">
              <Check size={15} /> Code used, move to Completed
            </button>
          ) : (
            <button onClick={() => setDialog("unused")} className="w-full h-10 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-[13px] font-semibold flex items-center justify-center gap-1.5 transition">
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
