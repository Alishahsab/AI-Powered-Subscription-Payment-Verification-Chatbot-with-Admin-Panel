import type { AppState } from "../types";
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
  readRows: (state: AppState) => Row[];
  apply: (state: AppState, row: Row) => void;
  remove: (state: AppState, id: string) => void;
  replaceAll: (state: AppState, rows: Row[]) => void;
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
  },
  {
    name: "tickets",
    key: "id",
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
