import type { AppState, Conversation, Customer, Message, Order, Ticket } from "../types";
import { createSampleReceipt } from "./receipt";

export const STATE_VERSION = 10;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const walletSteps = (app: string, menu: string) =>
  [
    `1. Open the ${app} app and tap ${menu}.`,
    "2. Choose Bank Transfer and select {bank}.",
    "3. Enter account number {account} and check the title is {title}.",
    "4. Enter the exact amount and confirm the payment.",
    "5. Take a screenshot of the receipt and upload it here.",
  ].join("\n");

function createSettings(): AppState["settings"] {
  return {
    storeName: "Premium Store",
    welcome: "Welcome to Premium Store. Choose an option below and we'll take it from there.",
    status: "active",
    hours: { start: "09:00", end: "22:00", enforce: false },
    statusMessages: {
      active: "Thank you. Your payment is being verified. Your code will arrive right here in a few minutes.",
      away: "Thank you, your payment is recorded. Our admin is briefly away. Your code will be sent here and to your email as soon as it's verified.",
      offline: "We're not taking new orders right now. Subscriptions are available daily between {hours}. Customer Support remains open 24/7.",
    },
    terms: [
      "Create an order only when you are ready to pay.",
      "Payment must be completed within {timer} minutes of creating the order.",
      "Our payment account may change, so always use the details shown in your order.",
    ],
    howItWorks:
      "1. Pick your plan and payment method.\n2. Create the order. Our account details appear for {timer} minutes.\n3. Send the exact amount and upload the payment screenshot with the sender account name.\n4. We verify your payment and send your premium code right here in the chat and to your email.",
    bank: { bankName: "Meezan Bank", accountTitle: "Premium Store", accountNumber: "0123 4567 8901 2345" },
    timers: { orderMinutes: 15, inactiveMinutes: 20, retryMinutes: 30 },
    retentionDays: 15,
    accent: "#0C2660",
  };
}

function createFaqs(): AppState["faqs"] {
  const list: [string, string][] = [
    ["How long does it take to get my code?", "During working hours codes are usually sent within 5 to 15 minutes after your payment is verified."],
    ["Which payment methods do you accept?", "JazzCash, Easypaisa, NayaPay or any bank. All payments go to our bank account shown in your order."],
    ["Where do I enter my premium code?", "Open the app, go to Profile, then Subscription, then Redeem Code. Enter the code and tap Activate."],
    ["My code says \"already used\"", "This usually means the code was applied on another account. Sign in to the app with the email you used when you applied the code."],
    ["Subscription is not showing after activation", "Make sure you are logged in with the same Gmail you used when applying the code. Still stuck? Choose Other issues."],
    ["Can I use one subscription on multiple devices?", "A subscription is tied to one account. You can log in with that account on your own devices."],
    ["I lost my code", "Every code we send stays in this chat and in your email. Search your email for Premium Store."],
    ["What are your working hours?", "Subscriptions are sold daily from 9:00 AM to 10:00 PM. Customer Support is open 24/7."],
    ["Can I get a refund?", "Codes cannot be refunded once delivered. If there's a problem with your code, choose Other issues and we'll make it right."],
    ["My order expired before I paid", "Orders expire after the payment timer to keep account details secure. Simply create a new order when you're ready."],
  ];
  return list.map(([question, answer], index) => ({ id: `f${index + 1}`, question, answer }));
}

export function createDemoState(): AppState {
  const now = Date.now();
  const settings = createSettings();

  const plans = [
    { id: "p1", name: "1 Month", months: 1, price: 299, active: true },
    { id: "p3", name: "3 Months", months: 3, price: 769, active: true },
    { id: "p6", name: "6 Months", months: 6, price: 1439, active: true },
    { id: "p12", name: "12 Months", months: 12, price: 2699, active: true },
  ];

  const methods = [
    { id: "jazzcash", name: "JazzCash", active: true, steps: walletSteps("JazzCash", "Send Money") },
    { id: "easypaisa", name: "Easypaisa", active: true, steps: walletSteps("Easypaisa", "Send Money") },
    { id: "nayapay", name: "NayaPay", active: true, steps: "" },
    { id: "bank", name: "Other bank", active: true, steps: "" },
  ];

  const customers: Customer[] = [
    { id: "c1", name: "Hamza Tariq", email: "hamza.t@gmail.com", pin: "123456", createdAt: now - 40 * DAY, lastSeenAt: now - 6 * MINUTE, blocked: false },
    { id: "c2", name: "Ayesha Khan", email: "ayesha.k@gmail.com", pin: "123456", createdAt: now - 20 * DAY, lastSeenAt: now - 12 * MINUTE, blocked: false },
    { id: "c3", name: "Bilal Ahmed", email: "bilal.ahmed@yahoo.com", pin: "123456", createdAt: now - 65 * DAY, lastSeenAt: now - 2 * HOUR, blocked: false },
    { id: "c4", name: "Usman Raza", email: "usman.raza@gmail.com", pin: "123456", createdAt: now - 9 * DAY, lastSeenAt: now - 45 * MINUTE, blocked: false },
    { id: "c5", name: "Sana Iqbal", email: "sana.iqbal@outlook.com", pin: "123456", createdAt: now - 3 * DAY, lastSeenAt: now - 5 * HOUR, blocked: false },
    { id: "c6", name: "Faisal Mehmood", email: "faisal.m@gmail.com", pin: "123456", createdAt: now - 1 * DAY, lastSeenAt: now - 3 * MINUTE, blocked: false },
  ];

  const messages: Message[] = [];
  const orders: Order[] = [];
  const tickets: Ticket[] = [];
  let orderNumber = 1040;
  let messageNumber = 0;

  const addMessage = (customerId: string, sender: Message["sender"], text: string, createdAt: number, extra: Partial<Message> = {}) => {
    const seen = sender === "customer" ? {} : { deliveredAt: createdAt + 2000, seenAt: createdAt + 30_000 };
    messages.push({ id: `m${++messageNumber}`, customerId, sender, kind: "text", text, createdAt, ...seen, ...extra });
  };

  const addOrder = (customer: Customer, planIndex: number, method: string, createdAt: number, completed: boolean) => {
    const plan = plans[planIndex];
    const id = `PS-${++orderNumber}`;
    orders.push({
      id,
      customerId: customer.id,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      methodName: method,
      status: completed ? "completed" : "pending_review",
      createdAt,
      expiresAt: createdAt + settings.timers.orderMinutes * MINUTE,
      submittedAt: createdAt + 5 * MINUTE,
      reviewedAt: completed ? createdAt + 9 * MINUTE : undefined,
      screenshot: createSampleReceipt(plan.price, customer.name, method, createdAt + 4 * MINUTE),
      senderName: customer.name,
    });

    addMessage(customer.id, "customer", "Buy a Subscription", createdAt - MINUTE);
    addMessage(customer.id, "bot", `Order ${id} created for ${plan.name}.`, createdAt, { kind: "payment", orderId: id });
    addMessage(customer.id, "customer", "Payment proof submitted", createdAt + 5 * MINUTE, { kind: "proof", orderId: id });
    addMessage(customer.id, "bot", settings.statusMessages.active, createdAt + 5 * MINUTE + 2000);

    if (completed) {
      const code = String(100000 + Math.floor(Math.random() * 900000));
      addMessage(customer.id, "admin", `Your premium code for ${plan.name}: ${code}`, createdAt + 9 * MINUTE);
    }
  };

  addOrder(customers[2], 1, "JazzCash", now - 32 * DAY, true);
  addOrder(customers[0], 0, "Easypaisa", now - 2 * DAY, true);
  addOrder(customers[2], 2, "JazzCash", now - 3 * HOUR, true);
  addOrder(customers[4], 3, "NayaPay", now - 26 * HOUR, true);
  addOrder(customers[3], 0, "JazzCash", now - 5 * HOUR, true);
  addOrder(customers[1], 1, "Easypaisa", now - 18 * MINUTE, false);
  addOrder(customers[5], 0, "JazzCash", now - 9 * MINUTE, false);

  addMessage("c4", "customer", "Customer Support", now - 50 * MINUTE);
  addMessage("c4", "customer", "Code shows already used. I applied it yesterday but today the app says premium has ended.", now - 48 * MINUTE);
  addMessage("c4", "bot", "Thanks, your issue T-201 has been sent to our team. An agent will join you shortly and reply right here.", now - 48 * MINUTE + 2000);
  tickets.push({ id: "T-201", customerId: "c4", kind: "support", message: "Code shows already used. I applied it yesterday but today the app says premium has ended.", status: "open", createdAt: now - 48 * MINUTE });

  addMessage("c1", "customer", "Buy a Subscription", now - 7 * MINUTE);
  addMessage("c1", "customer", "3 Months, Rs 769", now - 6 * MINUTE);

  const conversations: Record<string, Conversation> = {};
  for (const customer of customers) {
    const lastMessageAt = messages.filter((message) => message.customerId === customer.id).reduce((latest, message) => Math.max(latest, message.createdAt), customer.createdAt);
    conversations[customer.id] = {
      customerId: customer.id,
      stage: "menu",
      typing: false,
      unreadByAdmin: ["c2", "c4", "c6"].includes(customer.id) ? 1 : 0,
      lastMessageAt,
    };
  }
  conversations.c4.stage = "live";

  return {
    version: STATE_VERSION,
    settings,
    plans,
    methods,
    faqs: createFaqs(),
    customers,
    conversations,
    messages,
    orders,
    tickets,
    notifications: [
      { id: "n1", kind: "payment", title: "Payment submitted", body: "Faisal Mehmood · 1 Month · Rs 299", customerId: "c6", read: false, createdAt: now - 4 * MINUTE },
      { id: "n2", kind: "payment", title: "Payment submitted", body: "Ayesha Khan · 3 Months · Rs 769", customerId: "c2", read: false, createdAt: now - 13 * MINUTE },
      { id: "n3", kind: "support", title: "New support issue", body: "Usman Raza · Code shows already used", customerId: "c4", read: false, createdAt: now - 48 * MINUTE },
    ],
    nextOrderNumber: orderNumber + 1,
    nextTicketNumber: 202,
  };
}
