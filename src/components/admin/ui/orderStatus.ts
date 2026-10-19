import type { OrderStatus } from "@/lib/types";

type Tone = "gray" | "green" | "amber" | "orange" | "red" | "blue";

export const orderStatusBadge: Record<OrderStatus, { label: string; tone: Tone }> = {
  awaiting_payment: { label: "Awaiting payment", tone: "blue" },
  pending_review: { label: "Pending order", tone: "orange" },
  completed: { label: "Completed", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  issue_reported: { label: "Payment issue", tone: "red" },
  expired: { label: "Expired", tone: "gray" },
  cancelled: { label: "Cancelled", tone: "gray" },
};
