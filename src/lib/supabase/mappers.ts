import { createDefaultConfig } from "../defaults";
import type { AdminNotification, Conversation, Customer, Message, Order, StoreConfig, Ticket } from "../types";

type Row = Record<string, unknown>;

const optional = <T>(value: unknown) => (value === null ? undefined : (value as T));
const nullable = (value: unknown) => (value === undefined ? null : value);
const optionalNumber = (value: unknown) => (value === null || value === undefined ? undefined : Number(value));

export function customerFromRow(row: Row): Customer {
  return {
    id: row.id as string,
    number: optionalNumber(row.customer_number),
    email: row.email as string,
    createdAt: Number(row.created_at),
    lastSeenAt: Number(row.last_seen_at),
    blocked: row.blocked as boolean,
    paymentBlockedUntil: optionalNumber(row.payment_blocked_until),
    cancelCount: Number(row.cancel_count ?? 0),
    cancelCooldownUntil: optionalNumber(row.cancel_cooldown_until),
  };
}

export function customerToRow(customer: Customer): Row {
  return {
    id: customer.id,
    email: customer.email,
    created_at: customer.createdAt,
    last_seen_at: customer.lastSeenAt,
    blocked: customer.blocked,
    payment_blocked_until: nullable(customer.paymentBlockedUntil),
    cancel_count: customer.cancelCount,
    cancel_cooldown_until: nullable(customer.cancelCooldownUntil),
  };
}

export function conversationFromRow(row: Row): Conversation {
  return {
    customerId: row.customer_id as string,
    stage: row.stage as Conversation["stage"],
    planId: optional<string>(row.plan_id),
    methodId: optional<string>(row.method_id),
    activeOrderId: optional<string>(row.active_order_id),
    typing: false,
    unreadByAdmin: Number(row.unread_by_admin),
    lastMessageAt: Number(row.last_message_at),
  };
}

export function conversationToRow(conversation: Conversation): Row {
  return {
    customer_id: conversation.customerId,
    stage: conversation.stage,
    plan_id: nullable(conversation.planId),
    method_id: nullable(conversation.methodId),
    active_order_id: nullable(conversation.activeOrderId),
    unread_by_admin: conversation.unreadByAdmin,
    last_message_at: conversation.lastMessageAt,
  };
}

export function orderFromRow(row: Row): Order {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    planId: row.plan_id as string,
    planName: row.plan_name as string,
    amount: Number(row.amount),
    methodName: row.method_name as string,
    bank: row.account_number
      ? { bankName: String(row.bank_name ?? ""), accountTitle: String(row.account_title ?? ""), accountNumber: String(row.account_number) }
      : undefined,
    paymentSteps: optional<string>(row.payment_steps),
    status: row.status as Order["status"],
    createdAt: Number(row.created_at),
    expiresAt: Number(row.expires_at),
    submittedAt: optionalNumber(row.submitted_at),
    reviewedAt: optionalNumber(row.reviewed_at),
    screenshot: optional<string>(row.screenshot),
    senderName: optional<string>(row.sender_name),
    rejectReason: optional<string>(row.reject_reason),
    code: optional<string>(row.code),
    codeUnused: Boolean(row.code_unused),
  };
}

export function orderToRow(order: Order): Row {
  return {
    id: order.id,
    customer_id: order.customerId,
    plan_id: order.planId,
    plan_name: order.planName,
    amount: order.amount,
    method_name: order.methodName,
    bank_name: nullable(order.bank?.bankName),
    account_title: nullable(order.bank?.accountTitle),
    account_number: nullable(order.bank?.accountNumber),
    payment_steps: nullable(order.paymentSteps),
    status: order.status,
    created_at: order.createdAt,
    expires_at: order.expiresAt,
    submitted_at: nullable(order.submittedAt),
    reviewed_at: nullable(order.reviewedAt),
    screenshot: nullable(order.screenshot),
    sender_name: nullable(order.senderName),
    reject_reason: nullable(order.rejectReason),
    code: nullable(order.code),
    code_unused: order.codeUnused,
  };
}

export function messageFromRow(row: Row): Message {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    sender: row.sender as Message["sender"],
    kind: row.kind as Message["kind"],
    text: row.text as string,
    orderId: optional<string>(row.order_id),
    image: optional<string>(row.image),
    emailedTo: optional<string>(row.emailed_to),
    createdAt: Number(row.created_at),
    deliveredAt: optionalNumber(row.delivered_at),
    seenAt: optionalNumber(row.seen_at),
  };
}

export function messageToRow(message: Message): Row {
  return {
    id: message.id,
    customer_id: message.customerId,
    sender: message.sender,
    kind: message.kind,
    text: message.text,
    order_id: nullable(message.orderId),
    image: nullable(message.image),
    emailed_to: nullable(message.emailedTo),
    created_at: message.createdAt,
    delivered_at: nullable(message.deliveredAt),
    seen_at: nullable(message.seenAt),
  };
}

export function ticketFromRow(row: Row): Ticket {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    kind: row.kind as Ticket["kind"],
    message: row.message as string,
    screenshot: optional<string>(row.screenshot),
    orderId: optional<string>(row.order_id),
    status: row.status as Ticket["status"],
    createdAt: Number(row.created_at),
  };
}

export function ticketToRow(ticket: Ticket): Row {
  return {
    id: ticket.id,
    customer_id: ticket.customerId,
    kind: ticket.kind,
    message: ticket.message,
    screenshot: nullable(ticket.screenshot),
    order_id: nullable(ticket.orderId),
    status: ticket.status,
    created_at: ticket.createdAt,
  };
}

export function notificationFromRow(row: Row): AdminNotification {
  return {
    id: row.id as string,
    kind: row.kind as AdminNotification["kind"],
    title: row.title as string,
    body: row.body as string,
    customerId: row.customer_id as string,
    read: row.read as boolean,
    createdAt: Number(row.created_at),
  };
}

export function notificationToRow(notification: AdminNotification): Row {
  return {
    id: notification.id,
    kind: notification.kind,
    title: notification.title,
    body: notification.body,
    customer_id: notification.customerId,
    read: notification.read,
    created_at: notification.createdAt,
  };
}

export function configFromRow(row: Row): StoreConfig {
  const defaults = createDefaultConfig();
  const saved = row.settings as Partial<StoreConfig["settings"]>;
  return {
    settings: {
      ...defaults.settings,
      ...saved,
      timers: { ...defaults.settings.timers, ...saved.timers },
      limits: { ...defaults.settings.limits, ...saved.limits },
    },
    plans: row.plans as StoreConfig["plans"],
    methods: row.methods as StoreConfig["methods"],
    faqs: row.faqs as StoreConfig["faqs"],
  };
}

export function configToRow(config: StoreConfig): Row {
  return { id: 1, ...config, updated_at: new Date().toISOString() };
}
