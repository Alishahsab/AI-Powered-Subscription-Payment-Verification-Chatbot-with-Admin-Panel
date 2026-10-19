"use client";

import { useState } from "react";
import { AlertTriangle, Check, Mail } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { approveOrder, findCodeSentToSomeoneElse } from "@/lib/store/admin";
import type { Order } from "@/lib/types";
import { extractCode, limits, validateCode } from "@/lib/validation";
import Modal from "../ui/Modal";
import { textareaClass } from "../ui/styles";

type ApproveDialogProps = {
  order: Order;
  customerEmail: string;
  onClose: () => void;
};

export default function ApproveDialog({ order, customerEmail, onClose }: ApproveDialogProps) {
  const [message, setMessage] = useState("");
  const [emailCopy, setEmailCopy] = useState(false);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  const code = extractCode(message);
  const codeProblem = message.trim() ? validateCode(code) : null;
  const duplicate = code && !codeProblem ? findCodeSentToSomeoneElse(order.customerId, code) : null;
  const canApprove = Boolean(message.trim()) && !codeProblem && !(duplicate && !confirmedDuplicate);

  const approve = () => {
    if (!canApprove) return;
    approveOrder(order.id, message, code, emailCopy);
    onClose();
  };

  return (
    <Modal title="Approve payment" description={`${order.id} · ${order.planName} · ${customerEmail}`} onClose={onClose}>
      <label className="block">
        <span className="text-[13px] font-medium text-zinc-700">Code message</span>
        <textarea
          autoFocus
          rows={6}
          value={message}
          maxLength={limits.longTextMax}
          onChange={(event) => {
            setMessage(event.target.value);
            setConfirmedDuplicate(false);
          }}
          placeholder="Paste the message from your portal"
          className={`${textareaClass} mt-1.5 text-[14px]`}
        />
      </label>
      {message.trim() && (
        <p className={`mt-1.5 text-[12px] ${codeProblem ? "text-red-600" : "text-zinc-500"}`}>
          {codeProblem ? `No ${limits.codeLength}-character code found in this message.` : `Code found: ${code}`}
        </p>
      )}

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

      <label className="mt-4 inline-flex items-center gap-2 text-[13px] text-zinc-700 cursor-pointer select-none">
        <input type="checkbox" checked={emailCopy} onChange={(event) => setEmailCopy(event.target.checked)} className="size-4 accent-[#0C2660]" />
        <Mail size={14} /> Notify user by email
      </label>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button onClick={onClose} className="h-11 rounded-xl border border-zinc-200 text-[14px] font-semibold text-zinc-700 hover:bg-zinc-50 transition">
          Cancel
        </button>
        <button
          onClick={approve}
          disabled={!canApprove}
          className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          <Check size={16} /> Approve & send
        </button>
      </div>
    </Modal>
  );
}
