import { canStillPay } from "@/lib/store/helpers";
import type { AppState } from "@/lib/types";
import { isCustomerActive } from "./inbox/inboxItems";

export const statusColors = {
  activeOrder: "#0a84ff",
  appIssue: "#ffb02e",
  unused: "#7f66ff",
  pending: "#794983",
  complete: "#00a884",
  cancelled: "#c38763",
  activeChat: "#22c55e",
  inactiveChat: "#9ca3af",
  blocked: "#ef4444",
};

export type CustomerStatus = {
  completion: "complete" | "unused" | null;
  order: "pending" | "activeOrder" | "cancelled" | null;
  appIssue: boolean;
  active: boolean;
  blocked: boolean;
};

export function customerStatus(state: AppState, customerId: string, now: number): CustomerStatus {
  const orders = state.orders.filter((order) => order.customerId === customerId);
  const latest = orders.reduce<(typeof orders)[number] | undefined>((newest, order) => (!newest || order.createdAt > newest.createdAt ? order : newest), undefined);

  let order: CustomerStatus["order"] = null;
  if (orders.some((item) => item.status === "pending_review" || item.status === "rejected")) order = "pending";
  else if (orders.some((item) => canStillPay(item, now))) order = "activeOrder";
  else if (latest?.status === "cancelled" || latest?.status === "expired") order = "cancelled";

  return {
    completion: orders.some((item) => item.codeUnused) ? "unused" : orders.some((item) => item.status === "completed") ? "complete" : null,
    order,
    appIssue: state.tickets.some((ticket) => ticket.customerId === customerId && ticket.kind === "support" && ticket.status === "open"),
    active: isCustomerActive(state, customerId, now),
    blocked: Boolean(state.customers.find((customer) => customer.id === customerId)?.blocked),
  };
}
