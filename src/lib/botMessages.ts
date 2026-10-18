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
  ordersPausedAfterCancels: "Your order has been cancelled. Because several orders were cancelled in a row, new orders are paused for {time_left}. Customer Support is still open.",
  ordersPaused: "New orders are paused right now. You can create a new order in {time_left}.",
  orderExpired: "Order {order_id} has been cancelled because the payment time ran out. If you still want to buy, please start again from the main menu.",
  paymentIssueReceived: "Thanks for letting us know. Please don't send any payment right now, we're checking our account details. Please try again after {time_left}. Our team will reply here.",
  supportIntro: "How can we help? Pick a question below, or choose Other issues to contact our team.",
  describeIssue: "Please describe your issue and attach a screenshot.",
  issueReceived: "Thanks, your request {ticket_id} has been sent to our team. An agent will join you shortly and reply right here.",
  issueResolvedByCustomer: "Glad it's sorted. Anything else we can help with?",
  issueResolvedByAdmin: "Your request {ticket_id} has been marked as resolved. If you need anything else, choose Customer Support from the menu.",
};

type MessageField = { key: BotMessageKey; label: string; variables?: string };

export const botMessageGroups: { title: string; fields: MessageField[] }[] = [
  {
    title: "Menu",
    fields: [
      { key: "welcomeBack", label: "When a customer comes back" },
      { key: "menuPrompt", label: "Main menu" },
    ],
  },
  {
    title: "Buying",
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
    fields: [
      { key: "orderCancelled", label: "Order cancelled" },
      { key: "ordersPausedAfterCancels", label: "Order cancelled and new orders paused", variables: "{time_left}" },
      { key: "ordersPaused", label: "Customer tries to buy while paused", variables: "{time_left}" },
      { key: "orderExpired", label: "Payment time ran out", variables: "{order_id}" },
      { key: "paymentIssueReceived", label: "Payment problem reported", variables: "{time_left}" },
    ],
  },
  {
    title: "Support",
    fields: [
      { key: "supportIntro", label: "Customer opens Support" },
      { key: "describeIssue", label: "Customer chooses Other issues" },
      { key: "issueReceived", label: "Request sent to the team", variables: "{ticket_id}" },
      { key: "issueResolvedByCustomer", label: "Customer marks the request resolved" },
      { key: "issueResolvedByAdmin", label: "You mark the request resolved", variables: "{ticket_id}" },
    ],
  },
];
