"use client";

import { useState } from "react";
import { AlertTriangle, Check, Mail } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { approveOrder, findCodeSentToSomeoneElse } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import type { Order } from "@/lib/types";
import Modal from "../ui/Modal";
import { inputClass } from "../ui/styles";

type ApproveDialogProps = {
  order: Order;
  customerEmail: string;
  onClose: () => void;
};

export default function ApproveDialog({ order, customerEmail, onClose }: ApproveDialogProps) {
  const state = useAppState();
  const [code, setCode] = useState("");
  const [emailCopy, setEmailCopy] = useState(false);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  const trimmed = code.trim();
  const duplicate = trimmed ? findCodeSentToSomeoneElse(order.customerId, trimmed) : null;
  const preview = state.settings.codeMessage.replaceAll("{order_id}", order.id).replaceAll("{code}", trimmed || "…");

  const approve = () => {
    if (!trimmed || (duplicate && !confirmedDuplicate)) return;
    approveOrder(order.id, trimmed, emailCopy);
    onClose();
  };

  return (
    <Modal title="Approve payment" description={`${order.id} · ${order.planName} · ${customerEmail}`} onClose={onClose}>
      <label className="block">
        <span className="text-[13px] font-medium text-zinc-700">Premium code</span>
        <input
          autoFocus
          value={code}
          maxLength={120}
          onChange={(event) => {
            setCode(event.target.value);
            setConfirmedDuplicate(false);
          }}
          onKeyDown={(event) => event.key === "Enter" && approve()}
          placeholder="Paste the code"
          className={`${inputClass} mt-1.5 h-11 text-[15px] font-semibold tracking-wide`}
        />
      </label>

      {duplicate && (
        <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-700 cursor-pointer">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span className="flex-1">
            This code was already sent to {duplicate.customerEmail} on {formatDateTime(duplicate.sentAt)}.
            <span className="mt-1.5 flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={confirmedDuplicate} onChange={(event) => setConfirmedDuplicate(event.target.checked)} className="accent-red-600" />
              Send it anyway
            </span>
          </span>
        </label>
      )}

      <div className="mt-4">
        <div className="text-[12px] font-medium text-zinc-500 mb-1.5">Customer will receive</div>
        <div className="rounded-xl bg-[#0C2660] text-white px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-line">{preview}</div>
        <div className="mt-1.5 text-[12px] text-zinc-500">Followed by the activation instructions from Settings.</div>
      </div>

      <label className="mt-4 inline-flex items-center gap-2 text-[12.5px] text-zinc-600 cursor-pointer select-none">
        <input type="checkbox" checked={emailCopy} onChange={(event) => setEmailCopy(event.target.checked)} className="size-3.5 accent-[#0C2660]" />
        <Mail size={13} /> Also send to {customerEmail}
      </label>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button onClick={onClose} className="h-11 rounded-xl border border-zinc-200 text-[14px] font-semibold text-zinc-700 hover:bg-zinc-50 transition">
          Cancel
        </button>
        <button
          onClick={approve}
          disabled={!trimmed || Boolean(duplicate && !confirmedDuplicate)}
          className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          <Check size={16} /> Approve & send
        </button>
      </div>
    </Modal>
  );
}
