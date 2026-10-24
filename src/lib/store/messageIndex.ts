import type { AppState, Message } from "../types";

type CustomerMessages = { all: Message[]; lastSentByCustomer: number };

const NONE: CustomerMessages = { all: [], lastSentByCustomer: 0 };
const indexes = new WeakMap<Message[], Map<string, CustomerMessages>>();

// Messages grouped by customer, built once per messages list. The list only becomes a new array when
// a message changes, so lists and screens no longer scan every message for every customer.
function indexFor(messages: Message[]) {
  let index = indexes.get(messages);
  if (!index) {
    index = new Map();
    for (const message of messages) {
      let entry = index.get(message.customerId);
      if (!entry) {
        entry = { all: [], lastSentByCustomer: 0 };
        index.set(message.customerId, entry);
      }
      entry.all.push(message);
      if (message.sender === "customer" && message.createdAt > entry.lastSentByCustomer) entry.lastSentByCustomer = message.createdAt;
    }
    indexes.set(messages, index);
  }
  return index;
}

export function customerMessages(state: AppState, customerId: string) {
  return (indexFor(state.messages).get(customerId) ?? NONE).all;
}

export function lastCustomerMessageAt(state: AppState, customerId: string) {
  return (indexFor(state.messages).get(customerId) ?? NONE).lastSentByCustomer;
}
