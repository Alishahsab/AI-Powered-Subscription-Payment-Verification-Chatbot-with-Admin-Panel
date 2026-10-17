import type { AdminStatus, AppState } from "../types";
import { addMessage, findCustomerName } from "./helpers";
import { getState, resetState, updateState } from "./state";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export const rejectReasons = ["Screenshot is unclear", "Amount does not match", "Payment not received", "Sender name does not match"];

export function setAdminStatus(status: AdminStatus) {
  updateState((state) => {
    state.settings.status = status;
  });
}

export function sendAdminMessage(customerId: string, text: string, emailCopy: boolean) {
  updateState((state) => {
    const customer = state.customers.find((item) => item.id === customerId);
    addMessage(state, customerId, "admin", text, { emailedTo: emailCopy ? customer?.email : undefined });

    const conversation = state.conversations[customerId];
    conversation.unreadByAdmin = 0;
    if (conversation.stage !== "awaiting_payment") conversation.stage = "live";
  });
}

function extractCodes(text: string) {
  const words = text.match(/[A-Z0-9-]{6,}/gi) ?? [];
  return words.filter((word) => /\d/.test(word));
}

export function findCodeSentToSomeoneElse(customerId: string, text: string) {
  const codes = extractCodes(text);
  if (codes.length === 0) return null;

  const state = getState();
  for (const message of state.messages) {
    if (message.sender !== "admin" || message.customerId === customerId) continue;

    const repeated = codes.find((code) => extractCodes(message.text).includes(code));
    if (repeated) {
      return { code: repeated, customerName: findCustomerName(state, message.customerId), sentAt: message.createdAt };
    }
  }
  return null;
}

export function approveOrder(orderId: string) {
  updateState((state) => {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return;

    order.status = "completed";
    order.reviewedAt = Date.now();
    addMessage(state, order.customerId, "bot", `Your payment for order ${order.id} has been approved. Your premium code will be sent here shortly.`);

    const conversation = state.conversations[order.customerId];
    if (conversation.activeOrderId === orderId) conversation.activeOrderId = undefined;
    conversation.unreadByAdmin = 0;
    markNotificationsRead(state, order.customerId);
  });
}

export function rejectOrder(orderId: string, reason: string) {
  updateState((state) => {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return;

    order.status = "rejected";
    order.rejectReason = reason;
    order.reviewedAt = Date.now();
    order.expiresAt = Date.now() + state.settings.timers.orderMinutes * MINUTE;

    addMessage(state, order.customerId, "bot", `We couldn't verify the payment for order ${order.id}: ${reason.toLowerCase()}. Please upload a clear screenshot with the correct sender account name.`);

    const conversation = state.conversations[order.customerId];
    conversation.activeOrderId = order.id;
    conversation.stage = "awaiting_payment";
    conversation.unreadByAdmin = 0;
  });
}

export function setTicketResolved(ticketId: string, resolved: boolean) {
  updateState((state) => {
    const ticket = state.tickets.find((item) => item.id === ticketId);
    if (ticket) ticket.status = resolved ? "resolved" : "open";
  });
}

function markNotificationsRead(state: AppState, customerId: string) {
  for (const notification of state.notifications) {
    if (notification.customerId === customerId) notification.read = true;
  }
}

export function markConversationRead(customerId: string) {
  const state = getState();
  const hasUnread = state.conversations[customerId]?.unreadByAdmin || state.notifications.some((item) => item.customerId === customerId && !item.read);
  if (!hasUnread) return;

  updateState((draft) => {
    if (draft.conversations[customerId]) draft.conversations[customerId].unreadByAdmin = 0;
    markNotificationsRead(draft, customerId);
  });
}

export function markAllNotificationsRead() {
  updateState((state) => {
    for (const notification of state.notifications) notification.read = true;
  });
}

export function toggleCustomerBlocked(customerId: string) {
  updateState((state) => {
    const customer = state.customers.find((item) => item.id === customerId);
    if (customer) customer.blocked = !customer.blocked;
  });
}

export type EditableSettings = Pick<AppState, "settings" | "plans" | "methods" | "faqs">;

export function saveSettings(changes: EditableSettings) {
  updateState((state) => {
    state.settings = { ...changes.settings, status: state.settings.status };
    state.plans = changes.plans;
    state.methods = changes.methods;
    state.faqs = changes.faqs;
  });
}

export function deleteOldChats() {
  let removedMessages = 0;
  let removedScreenshots = 0;

  updateState((state) => {
    const cutoff = Date.now() - state.settings.retentionDays * DAY;
    const before = state.messages.length;
    state.messages = state.messages.filter((message) => message.createdAt >= cutoff);
    removedMessages = before - state.messages.length;

    for (const order of state.orders) {
      const reviewedLongAgo = (order.reviewedAt ?? order.createdAt) < cutoff;
      if (order.screenshot && order.status !== "pending_review" && reviewedLongAgo) {
        order.screenshot = undefined;
        removedScreenshots++;
      }
    }
  });

  return { removedMessages, removedScreenshots };
}

export function resetDemoData() {
  resetState();
}
