import { formatDuration, minutesUntilOpen, workingHoursLabel } from "../availability";
import { createId } from "../format";
import type { AdminNotification, AppState, BankAccount, Customer, Message, Order } from "../types";
import { updateState } from "./state";

const BOT_TYPING_DELAY = 650;

export function fillPlaceholders(text: string, state: AppState, bank: BankAccount = state.settings.bank) {
  const { timers } = state.settings;
  return text
    .replaceAll("{timer}", String(timers.orderMinutes))
    .replaceAll("{hours}", workingHoursLabel(state.settings))
    .replaceAll("{back_in}", formatDuration(minutesUntilOpen(state.settings)))
    .replaceAll("{bank}", bank.bankName)
    .replaceAll("{account}", bank.accountNumber)
    .replaceAll("{title}", bank.accountTitle);
}

export function stepLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}

export function orderBank(state: AppState, order?: Order) {
  return order?.bank ?? state.settings.bank;
}

export function orderSteps(state: AppState, customerId: string) {
  const order = getActiveOrder(state, customerId);
  const steps = order?.paymentSteps ?? findOrderMethod(state, customerId)?.steps ?? "";
  return stepLines(fillPlaceholders(steps, state, orderBank(state, order)));
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

export function findCustomerEmail(state: AppState, customerId: string) {
  return state.customers.find((customer) => customer.id === customerId)?.email ?? "Customer";
}

export function customerNumberLabel(customer?: Customer) {
  return customer?.number ? `#${customer.number}` : "New";
}

export function findLatestCode(state: AppState, customerId: string) {
  return state.orders.filter((order) => order.customerId === customerId && order.code).sort((a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0))[0];
}

export function extractCodes(text: string) {
  const words = text.match(/[A-Z0-9-]{6,}/gi) ?? [];
  return words.filter((word) => /\d/.test(word));
}

export function getActiveOrder(state: AppState, customerId: string) {
  const orderId = state.conversations[customerId]?.activeOrderId;
  return state.orders.find((order) => order.id === orderId);
}

export function findOrderMethod(state: AppState, customerId: string) {
  const order = getActiveOrder(state, customerId);
  const methodId = state.conversations[customerId]?.methodId;
  return state.methods.find((method) => method.id === methodId) ?? state.methods.find((method) => method.name === order?.methodName);
}

export function canStillPay(order: Order, now = Date.now()) {
  const waitingForPayment = order.status === "awaiting_payment" || order.status === "rejected";
  return waitingForPayment && order.expiresAt > now;
}
