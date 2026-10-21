"use client";

import { useEffect } from "react";
import { closeEndedPaymentIssues, paymentIssueEndsAt } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";

// Waits for the next payment issue to reach the end of its wait and closes it right then.
export default function PaymentIssueTimer() {
  const state = useAppState();
  const nextEnd = Math.min(...state.tickets.filter((ticket) => ticket.kind === "payment" && ticket.status === "open").map((ticket) => paymentIssueEndsAt(state, ticket)));

  useEffect(() => {
    if (!Number.isFinite(nextEnd)) return;
    const timer = setTimeout(closeEndedPaymentIssues, Math.max(0, nextEnd - Date.now()));
    return () => clearTimeout(timer);
  }, [nextEnd]);

  return null;
}
