"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { classNames } from "@/lib/format";
import { deleteCustomer } from "@/lib/store/admin";

type DeleteCustomerButtonProps = {
  customerId: string;
  email: string;
  compact?: boolean;
};

export default function DeleteCustomerButton({ customerId, email, compact = false }: DeleteCustomerButtonProps) {
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    const confirmed = window.confirm(`Delete ${email}?\n\nTheir account, chat, orders and screenshots will be removed for good.`);
    if (!confirmed) return;

    setBusy(true);
    const error = await deleteCustomer(customerId);
    setBusy(false);
    if (error) window.alert(`Could not delete this customer: ${error}`);
  };

  return (
    <button
      onClick={remove}
      disabled={busy}
      aria-label={`Delete ${email}`}
      title="Delete customer"
      className={classNames(
        "rounded-xl text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 font-semibold transition disabled:opacity-50",
        compact ? "size-8" : "h-10 text-[13px] border border-red-200"
      )}
    >
      <Trash2 size={compact ? 15 : 14} /> {!compact && (busy ? "Deleting…" : "Delete")}
    </button>
  );
}
