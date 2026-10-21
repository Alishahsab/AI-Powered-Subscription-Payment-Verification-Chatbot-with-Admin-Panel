import type { BotMessageKey, BotMessages } from "./types";

export const defaultBotMessages: BotMessages = {
  welcomeBack: "Welcome back. How can we help you today?",
  menuPrompt: "What can we help you with?",
  choosePlan: "Choose your plan. All prices are in Pakistani Rupees.",
  chooseMethod: "How would you like to pay?",
  termsIntro: "Before you continue, please read our terms:",
  orderCreated: "Order {order_id} created for {plan}.",
  openOrderExists: "You already have an open order ({order_id}). Complete the payment below or cancel it to start a new one.",
  orderCancelled: "Your order has been cancelled. Anything else we can help with?",
  orderCancelledByAdmin: "Your order {order_id} has been cancelled by our team. You can create a new order from the main menu.",
  ordersPausedAfterCancels: "Your order has been cancelled. Because several orders were cancelled in a short time, new orders are paused for {time_left}. Customer Support is still open.",
  ordersPaused: "New orders are paused right now. You can create a new order in {time_left}.",
  orderExpired: "Order {order_id} has been cancelled because the payment time ran out. If you still want to buy, please start again from the main menu.",
  paymentIssueReceived: "Thanks for letting us know. Please don't send any payment right now, we're checking our account details. Please try again after {time_left}. Our team will reply here.",
  supportIntro: "How can we help? Pick a question below, or choose Other issues to contact our team.",
  describeIssue: "Please describe your issue and attach a screenshot.",
  issueResolvedByCustomer: "Glad it's sorted. Anything else we can help with?",
  issueResolvedByAdmin: "Your request {ticket_id} has been marked as resolved. If you need anything else, choose Customer Support from the menu.",
  issueClosedNoReply: "Our admin is not available right now, so your request {ticket_id} has been closed. You can send a new one from Customer Support.",
  paymentIssueResolved: "Your payment issue is resolved. You can place a new order now.",
  issueAutoResolved: "Your request {ticket_id} has been resolved because there was no reply for a while. If you still need help, choose Customer Support from the menu.",
};

type MessageField = { key: BotMessageKey; label: string; variables?: string };

export type MessageTab = "payments" | "support";

export const botMessageGroups: { title: string; tab: MessageTab; fields: MessageField[] }[] = [
  {
    title: "Buying",
    tab: "payments",
    fields: [
      { key: "choosePlan", label: "Choose a plan" },
      { key: "chooseMethod", label: "Choose a payment method" },
      { key: "termsIntro", label: "Before the terms" },
      { key: "orderCreated", label: "Order created", variables: "{order_id} {plan}" },
      { key: "openOrderExists", label: "Customer already has an open order", variables: "{order_id}" },
    ],
  },
  {
    title: "Cancelled and paused orders",
    tab: "payments",
    fields: [
      { key: "orderCancelled", label: "Order cancelled" },
      { key: "orderCancelledByAdmin", label: "Order cancelled by admin", variables: "{order_id}" },
      { key: "ordersPausedAfterCancels", label: "Order cancelled and new orders paused", variables: "{time_left}" },
      { key: "ordersPaused", label: "Customer tries to buy while paused", variables: "{time_left}" },
      { key: "orderExpired", label: "Payment time ran out", variables: "{order_id}" },
      { key: "paymentIssueReceived", label: "Payment problem reported", variables: "{time_left}" },
    ],
  },
  {
    title: "Support",
    tab: "support",
    fields: [
      { key: "supportIntro", label: "Customer opens Support" },
      { key: "describeIssue", label: "Customer chooses Other issues" },
      { key: "issueResolvedByCustomer", label: "Customer marks the request resolved" },
      { key: "issueResolvedByAdmin", label: "You mark the request resolved", variables: "{ticket_id}" },
      { key: "issueAutoResolved", label: "Request closed: the customer stopped replying after your answer", variables: "{ticket_id}" },
      { key: "issueClosedNoReply", label: "Request closed: you did not reply in time", variables: "{ticket_id}" },
      { key: "paymentIssueResolved", label: "You mark a payment issue resolved" },
    ],
  },
];
