import { formatMoney, timeAgo } from "@/lib/format";
import { findCustomerName } from "@/lib/store/helpers";
import type { AppState, Message } from "@/lib/types";
import type { InboxTab } from "../navigation";

export type ChatFilter = "active" | "inactive";

export type InboxItem = {
  key: string;
  customerId: string;
  title: string;
  subtitle: string;
  time: number;
  unread: boolean;
  badge?: { label: string; tone: "green" | "amber" | "red" | "blue" | "gray" };
};

function describeMessage(message: Message) {
  if (message.kind === "payment") return "Order created";
  if (message.kind === "proof") return "Payment proof submitted";
  if (message.kind === "steps") return "Payment steps shown";
  if (message.kind === "image") return "Screenshot";
  return message.text;
}

export function isCustomerActive(state: AppState, customerId: string, now: number) {
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return false;
  return now - customer.lastSeenAt < state.settings.timers.inactiveMinutes * 60_000;
}

function generalChatItems(state: AppState, filter: ChatFilter, now: number): InboxItem[] {
  return Object.values(state.conversations)
    .filter((conversation) => state.messages.some((message) => message.customerId === conversation.customerId))
    .filter((conversation) => isCustomerActive(state, conversation.customerId, now) === (filter === "active"))
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
    .map((conversation) => {
      const lastMessage = state.messages.filter((message) => message.customerId === conversation.customerId).at(-1);
      const prefix = lastMessage && lastMessage.sender !== "customer" ? "You: " : "";
      return {
        key: conversation.customerId,
        customerId: conversation.customerId,
        title: findCustomerName(state, conversation.customerId),
        subtitle: lastMessage ? prefix + describeMessage(lastMessage) : "",
        time: conversation.lastMessageAt,
        unread: conversation.unreadByAdmin > 0,
      };
    });
}

function pendingItems(state: AppState, now: number): InboxItem[] {
  return state.orders
    .filter((order) => order.status === "pending_review")
    .sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0))
    .map((order) => ({
      key: order.id,
      customerId: order.customerId,
      title: findCustomerName(state, order.customerId),
      subtitle: `${order.planName} · ${formatMoney(order.amount)} · ${order.methodName}`,
      time: order.submittedAt ?? order.createdAt,
      unread: true,
      badge: { label: `waiting ${timeAgo(order.submittedAt ?? order.createdAt, now).replace(" ago", "")}`, tone: "amber" },
    }));
}

function completedItems(state: AppState): InboxItem[] {
  return state.orders
    .filter((order) => order.status === "completed")
    .sort((a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0))
    .map((order) => ({
      key: order.id,
      customerId: order.customerId,
      title: findCustomerName(state, order.customerId),
      subtitle: `${order.planName} · ${formatMoney(order.amount)}`,
      time: order.reviewedAt ?? order.createdAt,
      unread: false,
      badge: { label: "Completed", tone: "green" },
    }));
}

function issueItems(state: AppState): InboxItem[] {
  return [...state.tickets]
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "open" ? -1 : 1;
      return b.createdAt - a.createdAt;
    })
    .map((ticket) => ({
      key: ticket.id,
      customerId: ticket.customerId,
      title: findCustomerName(state, ticket.customerId),
      subtitle: ticket.message,
      time: ticket.createdAt,
      unread: ticket.status === "open",
      badge:
        ticket.status === "open"
          ? { label: ticket.kind === "payment" ? `Payment issue · ${ticket.id}` : `Open · ${ticket.id}`, tone: "red" }
          : { label: "Resolved", tone: "gray" },
    }));
}

export function buildInboxItems(state: AppState, tab: InboxTab, filter: ChatFilter, now: number) {
  if (tab === "pending") return pendingItems(state, now);
  if (tab === "completed") return completedItems(state);
  if (tab === "issues") return issueItems(state);
  return generalChatItems(state, filter, now);
}

export function countInboxTabs(state: AppState): Record<InboxTab, number> {
  return {
    general: Object.values(state.conversations).filter((conversation) => conversation.unreadByAdmin > 0).length,
    pending: state.orders.filter((order) => order.status === "pending_review").length,
    completed: 0,
    issues: state.tickets.filter((ticket) => ticket.status === "open").length,
  };
}
