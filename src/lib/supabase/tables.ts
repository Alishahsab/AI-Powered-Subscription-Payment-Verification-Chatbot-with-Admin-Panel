import type { AdminNotification, AppState, Conversation, Customer, Message, Order, Ticket } from "../types";
import {
  conversationFromRow,
  conversationToRow,
  customerFromRow,
  customerToRow,
  messageFromRow,
  messageToRow,
  notificationFromRow,
  notificationToRow,
  orderFromRow,
  orderToRow,
  ticketFromRow,
  ticketToRow,
} from "./mappers";

type Row = Record<string, unknown>;

export type TableSync = {
  name: string;
  key: string;
  // The items as kept in the app state. Unchanged items keep their identity between states,
  // so comparing two states only needs to look at the items that are new objects.
  items: (state: AppState) => unknown[];
  idOf: (item: unknown) => string;
  toRow: (item: unknown) => Row;
  readRows: (state: AppState) => Row[];
  apply: (state: AppState, row: Row) => void;
  remove: (state: AppState, id: string) => void;
  replaceAll: (state: AppState, rows: Row[]) => void;
  // Replaces only the items newer than `since`; older items are kept as they are.
  replaceRecent?: (state: AppState, rows: Row[], since: number) => void;
  applyServerFields?: (state: AppState, row: Row) => void;
};

function upsertById<T extends { id: string }>(list: T[], item: T) {
  const index = list.findIndex((existing) => existing.id === item.id);
  if (index >= 0) list[index] = item;
  else list.push(item);
}

export const tables: TableSync[] = [
  {
    name: "customers",
    key: "id",
    items: (state) => state.customers,
    idOf: (item) => (item as Customer).id,
    toRow: (item) => customerToRow(item as Customer),
    readRows: (state) => state.customers.map(customerToRow),
    apply: (state, row) => upsertById(state.customers, customerFromRow(row)),
    remove: (state, id) => {
      state.customers = state.customers.filter((customer) => customer.id !== id);
    },
    replaceAll: (state, rows) => {
      state.customers = rows.map(customerFromRow).sort((a, b) => a.createdAt - b.createdAt);
    },
    applyServerFields: (state, row) => {
      const customer = state.customers.find((item) => item.id === row.id);
      if (customer && row.customer_number != null) customer.number = Number(row.customer_number);
    },
  },
  {
    name: "conversations",
    key: "customer_id",
    items: (state) => Object.values(state.conversations),
    idOf: (item) => (item as Conversation).customerId,
    toRow: (item) => conversationToRow(item as Conversation),
    readRows: (state) => Object.values(state.conversations).map(conversationToRow),
    apply: (state, row) => {
      const conversation = conversationFromRow(row);
      const typing = state.conversations[conversation.customerId]?.typing ?? false;
      state.conversations[conversation.customerId] = { ...conversation, typing };
    },
    remove: (state, id) => {
      delete state.conversations[id];
    },
    replaceAll: (state, rows) => {
      state.conversations = {};
      for (const row of rows) {
        const conversation = conversationFromRow(row);
        state.conversations[conversation.customerId] = conversation;
      }
    },
  },
  {
    name: "orders",
    key: "id",
    items: (state) => state.orders,
    idOf: (item) => (item as Order).id,
    toRow: (item) => orderToRow(item as Order),
    readRows: (state) => state.orders.map(orderToRow),
    apply: (state, row) => upsertById(state.orders, orderFromRow(row)),
    remove: (state, id) => {
      state.orders = state.orders.filter((order) => order.id !== id);
    },
    replaceAll: (state, rows) => {
      state.orders = rows.map(orderFromRow).sort((a, b) => b.createdAt - a.createdAt);
    },
  },
  {
    name: "messages",
    key: "id",
    items: (state) => state.messages,
    idOf: (item) => (item as Message).id,
    toRow: (item) => messageToRow(item as Message),
    readRows: (state) => state.messages.map(messageToRow),
    apply: (state, row) => {
      upsertById(state.messages, messageFromRow(row));
      state.messages.sort((a, b) => a.createdAt - b.createdAt);
    },
    remove: (state, id) => {
      state.messages = state.messages.filter((message) => message.id !== id);
    },
    replaceAll: (state, rows) => {
      state.messages = rows.map(messageFromRow).sort((a, b) => a.createdAt - b.createdAt);
    },
    // The refresh brings the last minutes of messages. Messages that did not change stay the same objects,
    // and when nothing changed the list is left alone, so the screen does not redraw for nothing.
    replaceRecent: (state, rows, since) => {
      const current = new Map(state.messages.map((message) => [message.id, message]));
      const fresh = rows.map((row) => {
        const message = messageFromRow(row);
        const existing = current.get(message.id);
        return existing && JSON.stringify(existing) === JSON.stringify(message) ? existing : message;
      });
      const freshIds = new Set(fresh.map((message) => message.id));
      const merged = [...state.messages.filter((message) => message.createdAt <= since && !freshIds.has(message.id)), ...fresh].sort((a, b) => a.createdAt - b.createdAt);
      if (merged.length === state.messages.length && merged.every((message, index) => message === state.messages[index])) return;
      state.messages = merged;
    },
  },
  {
    name: "tickets",
    key: "id",
    items: (state) => state.tickets,
    idOf: (item) => (item as Ticket).id,
    toRow: (item) => ticketToRow(item as Ticket),
    readRows: (state) => state.tickets.map(ticketToRow),
    apply: (state, row) => upsertById(state.tickets, ticketFromRow(row)),
    remove: (state, id) => {
      state.tickets = state.tickets.filter((ticket) => ticket.id !== id);
    },
    replaceAll: (state, rows) => {
      state.tickets = rows.map(ticketFromRow).sort((a, b) => b.createdAt - a.createdAt);
    },
  },
  {
    name: "notifications",
    key: "id",
    items: (state) => state.notifications,
    idOf: (item) => (item as AdminNotification).id,
    toRow: (item) => notificationToRow(item as AdminNotification),
    readRows: (state) => state.notifications.map(notificationToRow),
    apply: (state, row) => {
      upsertById(state.notifications, notificationFromRow(row));
      state.notifications.sort((a, b) => b.createdAt - a.createdAt);
    },
    remove: (state, id) => {
      state.notifications = state.notifications.filter((notification) => notification.id !== id);
    },
    replaceAll: (state, rows) => {
      state.notifications = rows.map(notificationFromRow).sort((a, b) => b.createdAt - a.createdAt);
    },
  },
];
