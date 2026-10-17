import { workingHoursLabel } from "../availability";
import { createId } from "../format";
import type { AdminNotification, AppState, Message, Order } from "../types";
import { updateState } from "./state";

const BOT_TYPING_DELAY = 650;

export function fillPlaceholders(text: string, state: AppState) {
  const { bank, timers } = state.settings;
  return text
    .replaceAll("{timer}", String(timers.orderMinutes))
    .replaceAll("{hours}", workingHoursLabel(state.settings))
    .replaceAll("{bank}", bank.bankName)
    .replaceAll("{account}", bank.accountNumber)
    .replaceAll("{title}", bank.accountTitle);
}

export function addMessage(state: AppState, customerId: string, sender: Message["sender"], text: string, extra: Partial<Message> = {}) {
  const message: Message = {
    id: createId(),
    customerId,
    sender,
    kind: "text",
    text,
    createdAt: Date.now(),
    ...extra,
  };

  state.messages.push(message);

  const conversation = state.conversations[customerId];
  if (conversation) conversation.lastMessageAt = message.createdAt;

  return message;
}

export function notifyAdmin(state: AppState, notification: Omit<AdminNotification, "id" | "read" | "createdAt">) {
  state.notifications.unshift({ ...notification, id: createId(), read: false, createdAt: Date.now() });
  state.notifications = state.notifications.slice(0, 60);
}

export function replyAsBot(customerId: string, reply: (state: AppState) => void) {
  updateState((state) => {
    state.conversations[customerId].typing = true;
  });

  setTimeout(() => {
    updateState((state) => {
      state.conversations[customerId].typing = false;
      reply(state);
    });
  }, BOT_TYPING_DELAY);
}

function shortCode() {
  const time = Date.now().toString(36).slice(-5);
  const random = Math.floor(Math.random() * 36).toString(36);
  return (time + random).toUpperCase();
}

export function createOrderNumber() {
  return `PS-${shortCode()}`;
}

export function createTicketNumber() {
  return `T-${shortCode()}`;
}

export function findCustomerName(state: AppState, customerId: string) {
  return state.customers.find((customer) => customer.id === customerId)?.name ?? "Customer";
}

export function getActiveOrder(state: AppState, customerId: string) {
  const orderId = state.conversations[customerId]?.activeOrderId;
  return state.orders.find((order) => order.id === orderId);
}

export function canStillPay(order: Order, now = Date.now()) {
  const waitingForPayment = order.status === "awaiting_payment" || order.status === "rejected";
  return waitingForPayment && order.expiresAt > now;
}
