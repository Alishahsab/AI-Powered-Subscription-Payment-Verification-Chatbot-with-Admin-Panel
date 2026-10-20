"use client";

import { useState } from "react";
import { classNames } from "@/lib/format";
import { rejectOrder } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import type { Order } from "@/lib/types";
import Modal from "../ui/Modal";
import { inputClass } from "../ui/styles";

const OTHER = "other";

type RejectDialogProps = {
  order: Order;
  onClose: () => void;
};

export default function RejectDialog({ order, onClose }: RejectDialogProps) {
  const state = useAppState();
  const reasons = state.settings.rejectReasons;
  const [choice, setChoice] = useState(reasons[0] ?? OTHER);
  const [customReason, setCustomReason] = useState("");

  const reason = choice === OTHER ? customReason.trim() : choice;

  const reject = () => {
    if (!reason) return;
    rejectOrder(order.id, reason);
    onClose();
  };

  const optionClass = (selected: boolean) =>
    classNames(
      "w-full text-left rounded-xl border px-3.5 py-2.5 text-[13.5px] font-medium transition flex items-center gap-2.5",
      selected ? "border-red-300 bg-red-50 text-red-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
    );

  return (
    <Modal title="Reject payment" description={`${order.id} · the customer will see this reason`} onClose={onClose}>
      <div className="space-y-1.5">
        {[...reasons, OTHER].map((item) => (
          <button key={item} onClick={() => setChoice(item)} className={optionClass(choice === item)}>
            <span className={classNames("size-4 shrink-0 rounded-full border-2", choice === item ? "border-red-600 bg-red-600 shadow-[inset_0_0_0_2px_white]" : "border-zinc-300")} />
            {item === OTHER ? "Write a reason" : item}
          </button>
        ))}
      </div>

      {choice === OTHER && (
        <input autoFocus value={customReason} maxLength={150} onChange={(event) => setCustomReason(event.target.value)} placeholder="Type the reason" className={`${inputClass} mt-2 h-10`} />
      )}

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button onClick={onClose} className="h-11 rounded-xl border border-zinc-200 text-[14px] font-semibold text-zinc-700 hover:bg-zinc-50 transition">
          Cancel
        </button>
        <button onClick={reject} disabled={!reason} className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[14px] font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40">
          Reject
        </button>
      </div>
    </Modal>
  );
}
