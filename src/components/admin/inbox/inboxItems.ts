import { formatMoney, timeAgo } from "@/lib/format";
import { canStillPay, customerNumberLabel, findCustomerEmail } from "@/lib/store/helpers";
import type { AppState, InboxTab, Message, Order, OrderStatus, Ticket } from "@/lib/types";

export type BotFilter = "active_orders" | "cancelled" | "active_chats" | "inactive_chats";

export type InboxItem = {
  key: string;
  customerId: string;
  title: string;
  tag: string;
  subtitle: string;
  time: number;
  unread: boolean;
  badge?: { label: string; tone: "green" | "amber" | "red" | "blue" | "gray" };
};

const cancelledLabels: Partial<Record<OrderStatus, string>> = {
  cancelled: "Cancelled by customer",
  expired: "Expired before payment",
};

const isPending = (order: Order) => order.status === "pending_review" || order.status === "rejected";

function describeMessage(message: Message) {
  if (message.kind === "payment") return "Order created";
  if (message.kind === "proof") return "Payment proof submitted";
  if (message.kind === "steps") return "Payment steps shown";
  if (message.kind === "image") return "Screenshot";
  if (message.kind === "code") return "Code sent";
  if (message.kind === "deleted") return "Message deleted";
  return message.text;
}

function customerTag(state: AppState, customerId: string) {
  return customerNumberLabel(state.customers.find((customer) => customer.id === customerId));
}

export function isCustomerActive(state: AppState, customerId: string, now: number) {
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return false;
  return now - customer.lastSeenAt < state.settings.timers.inactiveMinutes * 60_000;
}

function isCancelled(order: Order) {
  return order.status === "cancelled" || order.status === "expired";
}

function orderItem(state: AppState, order: Order, time: number, subtitle: string, badge?: InboxItem["badge"], unread = false): InboxItem {
  return {
    key: order.id,
    customerId: order.customerId,
    title: findCustomerEmail(state, order.customerId),
    tag: customerTag(state, order.customerId),
    subtitle,
    time,
    unread,
    badge,
  };
}

function chatItems(state: AppState, active: boolean, now: number): InboxItem[] {
  return Object.values(state.conversations)
    .filter((conversation) => state.messages.some((message) => message.customerId === conversation.customerId))
    .filter((conversation) => isCustomerActive(state, conversation.customerId, now) === active)
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
    .map((conversation) => {
      const lastMessage = state.messages.filter((message) => message.customerId === conversation.customerId).at(-1);
      const prefix = lastMessage && lastMessage.sender !== "customer" ? "You: " : "";
      return {
        key: conversation.customerId,
        customerId: conversation.customerId,
        title: findCustomerEmail(state, conversation.customerId),
        tag: customerTag(state, conversation.customerId),
        subtitle: lastMessage ? prefix + describeMessage(lastMessage) : "",
        time: conversation.lastMessageAt,
        unread: conversation.unreadByAdmin > 0,
      };
    });
}

function activeItems(state: AppState, now: number): InboxItem[] {
  return state.orders
    .filter((order) => canStillPay(order, now))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((order) =>
      orderItem(state, order, order.createdAt, `${order.planName} · ${formatMoney(order.amount)} · ${order.methodName}`, {
        label: `${Math.max(0, Math.ceil((order.expiresAt - now) / 60_000))} min left to pay`,
        tone: "blue",
      })
    );
}

function pendingItems(state: AppState, now: number): InboxItem[] {
  return state.orders
    .filter(isPending)
    .sort((a, b) => (b.submittedAt ?? b.createdAt) - (a.submittedAt ?? a.createdAt))
    .map((order) => {
      const submitted = order.submittedAt ?? order.createdAt;
      const badge: InboxItem["badge"] =
        order.status === "rejected" ? { label: "Rejected, awaiting reply", tone: "red" } : { label: `waiting ${timeAgo(submitted, now).replace(" ago", "")}`, tone: "amber" };
      return orderItem(state, order, submitted, `${order.planName} · ${formatMoney(order.amount)} · ${order.methodName}`, badge, order.status === "pending_review");
    });
}

function completedItems(state: AppState, unused: boolean): InboxItem[] {
  return state.orders
    .filter((order) => order.status === "completed" && order.codeUnused === unused)
    .sort((a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0))
    .map((order) =>
      orderItem(
        state,
        order,
        order.reviewedAt ?? order.createdAt,
        order.code ? `${order.planName} · ${order.code}` : `${order.planName} · code not sent yet`,
        unused ? { label: "Code not used", tone: "amber" } : { label: "Completed", tone: "green" }
      )
    );
}

function cancelledItems(state: AppState): InboxItem[] {
  return state.orders
    .filter(isCancelled)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((order) => orderItem(state, order, order.createdAt, `${order.planName} · ${formatMoney(order.amount)}`, { label: cancelledLabels[order.status] ?? "Cancelled", tone: "gray" }));
}

const isOpenTicket = (kind: Ticket["kind"]) => (ticket: Ticket) => ticket.status === "open" && ticket.kind === kind;

function issueItems(state: AppState, kind: Ticket["kind"]): InboxItem[] {
  return state.tickets
    .filter(isOpenTicket(kind))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((ticket) => ({
      key: ticket.id,
      customerId: ticket.customerId,
      title: findCustomerEmail(state, ticket.customerId),
      tag: customerTag(state, ticket.customerId),
      subtitle: ticket.message,
      time: ticket.createdAt,
      unread: true,
      badge: { label: ticket.kind === "payment" ? `Payment issue · ${ticket.id}` : `Open · ${ticket.id}`, tone: "red" },
    }));
}

function blockedItems(state: AppState): InboxItem[] {
  return state.customers
    .filter((customer) => customer.blocked)
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .map((customer) => ({
      key: customer.id,
      customerId: customer.id,
      title: customer.email,
      tag: customerNumberLabel(customer),
      subtitle: customer.blockReason ?? "No reason given",
      time: customer.lastSeenAt,
      unread: false,
      badge: { label: "Blocked", tone: "red" },
    }));
}

function botChatItems(state: AppState, filter: BotFilter, now: number): InboxItem[] {
  if (filter === "active_orders") return activeItems(state, now);
  if (filter === "cancelled") return cancelledItems(state);
  return chatItems(state, filter === "active_chats", now);
}

export type InboxList = InboxTab | "bot";

export function buildInboxItems(state: AppState, list: InboxList, botFilter: BotFilter, now: number) {
  if (list === "pending") return pendingItems(state, now);
  if (list === "issues") return issueItems(state, "support");
  if (list === "payment_issues") return issueItems(state, "payment");
  if (list === "completed") return completedItems(state, false);
  if (list === "unused") return completedItems(state, true);
  if (list === "blocked") return blockedItems(state);
  return botChatItems(state, botFilter, now);
}

export function countInboxTabs(state: AppState): Record<InboxTab, number> {
  return {
    pending: state.orders.filter(isPending).length,
    issues: state.tickets.filter(isOpenTicket("support")).length,
    payment_issues: state.tickets.filter(isOpenTicket("payment")).length,
    completed: 0,
    unused: state.orders.filter((order) => order.status === "completed" && order.codeUnused).length,
    blocked: state.customers.filter((customer) => customer.blocked).length,
  };
}

export function countUnreadChats(state: AppState) {
  return Object.values(state.conversations).filter((conversation) => conversation.unreadByAdmin > 0).length;
}

export function countBotFilters(state: AppState, now: number): Record<BotFilter, number> {
  return {
    active_orders: activeItems(state, now).length,
    cancelled: cancelledItems(state).length,
    active_chats: chatItems(state, true, now).length,
    inactive_chats: chatItems(state, false, now).length,
  };
}
