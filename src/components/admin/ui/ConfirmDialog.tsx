"use client";

import { classNames } from "@/lib/format";
import Modal from "./Modal";

type ConfirmDialogProps = {
  title?: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({ title = "Are you sure?", description, confirmLabel, tone = "primary", onConfirm, onClose }: ConfirmDialogProps) {
  const confirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal title={title} description={description} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={onClose} className="h-11 rounded-xl border border-zinc-200 text-[14px] font-semibold text-zinc-700 hover:bg-zinc-50 transition">
          No, go back
        </button>
        <button
          autoFocus
          onClick={confirm}
          className={classNames("h-11 rounded-xl text-white text-[14px] font-semibold transition", tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-[#0C2660] hover:bg-[#0a1f52]")}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
