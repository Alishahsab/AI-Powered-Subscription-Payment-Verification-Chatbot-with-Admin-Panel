import type { Code, Conversation, Customer, Message, Order, State, Ticket, Notification } from "./types";

export const STATE_VERSION = 6;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function receiptSvg(amount: number, tid: string, method: string, when: number) {
  const d = new Date(when);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640" viewBox="0 0 360 640">
  <rect width="360" height="640" fill="#f4f5f7"/>
  <rect x="0" y="0" width="360" height="170" fill="#1d2b36"/>
  <circle cx="180" cy="78" r="30" fill="#2fb36e"/>
  <path d="M166 79 l10 10 l20 -22" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="180" y="138" text-anchor="middle" font-family="Arial" font-size="17" fill="#fff" font-weight="bold">Transaction Successful</text>
  <rect x="20" y="190" width="320" height="380" rx="14" fill="#fff"/>
  <text x="180" y="236" text-anchor="middle" font-family="Arial" font-size="13" fill="#6b7280">Amount Sent</text>
  <text x="180" y="272" text-anchor="middle" font-family="Arial" font-size="30" fill="#111827" font-weight="bold">Rs. ${amount.toLocaleString()}.00</text>
  <line x1="40" y1="300" x2="320" y2="300" stroke="#e5e7eb"/>
  ${[
    ["Sent via", method],
    ["To", "Premium Store"],
    ["Transaction ID", tid],
    ["Date", date],
    ["Time", time],
    ["Fee", "Rs. 0.00"],
  ]
    .map(
      ([k, v], i) =>
        `<text x="40" y="${336 + i * 38}" font-family="Arial" font-size="13" fill="#6b7280">${k}</text><text x="320" y="${
          336 + i * 38
        }" text-anchor="end" font-family="Arial" font-size="13" fill="#111827" font-weight="bold">${v}</text>`
    )
    .join("")}
  <text x="180" y="610" text-anchor="middle" font-family="Arial" font-size="11" fill="#9ca3af">Sample payment receipt</text>
</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function code6(used: Set<string>) {
  let v = "";
  do v = String(Math.floor(100000 + Math.random() * 900000));
  while (used.has(v));
  used.add(v);
  return v;
}

export function createSeed(): State {
  const now = Date.now();
  const plans = [
    { id: "p1", name: "1 Month", months: 1, price: 299, active: true },
    { id: "p3", name: "3 Months", months: 3, price: 769, active: true },
    { id: "p6", name: "6 Months", months: 6, price: 1439, active: true },
    { id: "p12", name: "12 Months", months: 12, price: 2699, active: true },
  ];
  const methods = [
    { id: "jazzcash", name: "JazzCash", accountTitle: "Premium Store", accountNumber: "0300 1234567", active: true },
    { id: "easypaisa", name: "Easypaisa", accountTitle: "Premium Store", accountNumber: "0345 7654321", active: true },
    { id: "nayapay", name: "NayaPay", accountTitle: "Premium Store", accountNumber: "0312 1122334", active: true },
  ];

  const customers: Customer[] = [
    { id: "c1", name: "Hamza Tariq", phone: "0301 4455667", email: "hamza.t@gmail.com", createdAt: now - 40 * DAY, lastSeenAt: now - 12 * MIN, blocked: false },
    { id: "c2", name: "Ayesha Khan", phone: "0333 9876543", createdAt: now - 20 * DAY, lastSeenAt: now - 25 * MIN, blocked: false },
    { id: "c3", name: "Bilal Ahmed", phone: "0321 5566778", email: "bilal.ahmed@yahoo.com", createdAt: now - 65 * DAY, lastSeenAt: now - 2 * HOUR, blocked: false },
    { id: "c4", name: "Usman Raza", phone: "0345 1239876", createdAt: now - 9 * DAY, lastSeenAt: now - 50 * MIN, blocked: false },
    { id: "c5", name: "Sana Iqbal", phone: "0300 7788990", email: "sana.iqbal@outlook.com", createdAt: now - 3 * DAY, lastSeenAt: now - 5 * HOUR, blocked: false },
    { id: "c6", name: "Faisal Mehmood", phone: "0315 2468101", createdAt: now - 1 * DAY, lastSeenAt: now - 7 * MIN, blocked: false },
  ];

  const used = new Set<string>();
  const codes: Code[] = [];
  for (const p of plans) {
    const n = p.id === "p12" ? 3 : p.id === "p6" ? 6 : 12;
    for (let i = 0; i < n; i++)
      codes.push({ id: `k-${p.id}-${i}`, value: code6(used), planId: p.id, status: "available", addedAt: now - 2 * DAY });
  }

  const orders: Order[] = [];
  const messages: Message[] = [];
  const conversations: Record<string, Conversation> = {};
  let orderSeq = 1040;
  let msgN = 0;
  const msg = (customerId: string, from: Message["from"], text: string, at: number, extra: Partial<Message> = {}) => {
    messages.push({ id: `m${++msgN}`, customerId, from, kind: "text", text, topic: "order", createdAt: at, ...extra });
  };

  const approved = (c: Customer, planId: string, methodIdx: number, at: number) => {
    const p = plans.find((x) => x.id === planId)!;
    const m = methods[methodIdx];
    const id = `PS-${++orderSeq}`;
    const tid = String(Math.floor(1e10 + Math.random() * 9e10));
    const value = code6(used);
    codes.push({ id: `k-${id}`, value, planId, status: "assigned", orderId: id, customerId: c.id, addedAt: at - DAY, assignedAt: at + 9 * MIN });
    orders.push({
      id, customerId: c.id, planId, planName: p.name, months: p.months, methodId: m.id, methodName: m.name, amount: p.price,
      status: "approved", createdAt: at, expiresAt: at + 30 * MIN, submittedAt: at + 6 * MIN, reviewedAt: at + 9 * MIN,
      screenshot: receiptSvg(p.price, tid, m.name, at + 5 * MIN), tid, email: c.email, code: value, emailSent: !!c.email,
    });
    msg(c.id, "user", "Buy a Subscription", at - MIN);
    msg(c.id, "bot", `Order ${id} created for ${p.name}.`, at, { kind: "account", orderId: id });
    msg(c.id, "user", "Payment proof submitted", at + 6 * MIN, { kind: "proof", orderId: id });
    msg(c.id, "admin", `Your premium code for ${p.name}`, at + 9 * MIN, { kind: "code", orderId: id });
    return id;
  };

  approved(customers[2], "p3", 0, now - 32 * DAY);
  approved(customers[0], "p1", 1, now - 31 * DAY);
  approved(customers[0], "p1", 0, now - 2 * DAY);
  approved(customers[2], "p6", 0, now - 3 * HOUR);
  approved(customers[4], "p12", 2, now - 26 * HOUR);
  approved(customers[3], "p1", 0, now - 5 * HOUR);

  // pending reviews
  const pending = (c: Customer, planId: string, methodIdx: number, at: number, email?: string) => {
    const p = plans.find((x) => x.id === planId)!;
    const m = methods[methodIdx];
    const id = `PS-${++orderSeq}`;
    const tid = String(Math.floor(1e10 + Math.random() * 9e10));
    orders.push({
      id, customerId: c.id, planId, planName: p.name, months: p.months, methodId: m.id, methodName: m.name, amount: p.price,
      status: "pending_review", createdAt: at, expiresAt: at + 30 * MIN, submittedAt: at + 4 * MIN,
      screenshot: receiptSvg(p.price, tid, m.name, at + 3 * MIN), tid, email,
    });
    msg(c.id, "user", "Buy a Subscription", at - MIN);
    msg(c.id, "bot", `Order ${id} created for ${p.name}.`, at, { kind: "account", orderId: id });
    msg(c.id, "user", "Payment proof submitted", at + 4 * MIN, { kind: "proof", orderId: id });
    msg(c.id, "bot", "Thank you. Your payment is being verified — your code will arrive right here in a few minutes.", at + 4 * MIN + 2000);
    return id;
  };
  pending(customers[1], "p3", 1, now - 18 * MIN);
  pending(customers[5], "p1", 0, now - 9 * MIN);

  // general chat + ticket
  msg(customers[3].id, "user", "Code shows already used", now - 45 * MIN, { topic: "support" });
  msg(customers[3].id, "user", "I applied the code yesterday but today the app says premium has ended. Please check.", now - 44 * MIN, { topic: "support" });
  msg(customers[3].id, "bot", "Your ticket T-201 has been submitted. Our team will reply right here.", now - 44 * MIN + 2000, { topic: "support" });
  msg(customers[0].id, "user", "Is the 12 month plan valid on two phones?", now - 14 * MIN, { topic: "general" });

  const tickets: Ticket[] = [
    { id: "T-201", customerId: "c4", category: "Code shows already used", message: "I applied the code yesterday but today the app says premium has ended. Please check.", status: "open", createdAt: now - 44 * MIN },
    { id: "T-200", customerId: "c3", category: "Subscription not showing", message: "Logged in with a different Gmail, subscription not showing.", status: "resolved", createdAt: now - 2 * DAY },
  ];

  for (const c of customers) {
    const last = messages.filter((m) => m.customerId === c.id).reduce((a, m) => Math.max(a, m.createdAt), c.createdAt);
    conversations[c.id] = {
      customerId: c.id, stage: "menu", draft: {}, mode: c.id === "c1" ? "human" : "bot", typing: false,
      unreadAdmin: c.id === "c1" || c.id === "c2" || c.id === "c6" || c.id === "c4" ? 1 : 0, unreadCustomer: 0, lastMessageAt: last,
    };
  }

  const notifications: Notification[] = [
    { id: "n1", type: "order", title: "Payment submitted", body: "Faisal Mehmood · 1 Month · Rs 299", customerId: "c6", read: false, createdAt: now - 5 * MIN },
    { id: "n2", type: "chat", title: "New message", body: "Hamza Tariq: Is the 12 month plan valid on two phones?", customerId: "c1", read: false, createdAt: now - 14 * MIN },
    { id: "n3", type: "order", title: "Payment submitted", body: "Ayesha Khan · 3 Months · Rs 769", customerId: "c2", read: false, createdAt: now - 14 * MIN },
    { id: "n4", type: "ticket", title: "New app issue", body: "Usman Raza · Code shows already used", customerId: "c4", read: true, createdAt: now - 44 * MIN },
  ];

  return {
    version: STATE_VERSION,
    settings: {
      storeName: "Premium Store",
      welcome: "Welcome to Premium Store. Choose an option below and we'll take it from there.",
      status: "active",
      hours: { start: "09:00", end: "22:00", enforce: false },
      statusMessages: {
        active: "Thank you. Your payment is being verified — your code will arrive right here in a few minutes.",
        away: "Thank you, your payment is recorded. Our admin is briefly away — your code will be sent here and to your email as soon as it's verified.",
        offline: "We're not taking new orders right now. Subscriptions are available daily between {hours}. Customer Support remains open 24/7.",
      },
      terms: [
        "Create an order only when you are ready to pay.",
        "Payment must be completed within {timer} minutes of creating the order.",
        "Our payment account may change — always use the details shown in your order.",
      ],
      howItWorks:
        "1. Pick your plan and payment method.\n2. Create the order — our account details appear for {timer} minutes.\n3. Send the exact amount and upload the payment screenshot with the transaction ID.\n4. We verify your payment and send your premium code right here in the chat. It's also saved in Order History.",
      accountTimerMin: 30,
      retentionDays: 15,
      accent: "#19335C",
      supportCategories: ["Code shows already used", "Subscription not showing", "App not working", "Something else"],
    },
    plans,
    methods,
    faqs: [
      { id: "f1", q: "How long does it take to get my code?", a: "During working hours codes are usually sent within 5–15 minutes after your payment is verified." },
      { id: "f2", q: "Which payment methods do you accept?", a: "JazzCash, Easypaisa and NayaPay. For other banks, choose \"Other bank\" and we'll share the details." },
      { id: "f3", q: "Where do I enter my premium code?", a: "Open the app, go to Profile → Subscription → Redeem Code, enter the code and tap Activate." },
      { id: "f4", q: "My code says \"already used\". What now?", a: "This usually means the code was applied on another account. Open Customer Support and select \"Code shows already used\" — we'll check which account it was applied to." },
      { id: "f5", q: "Subscription is not showing after activation", a: "Make sure you're logged in with the same Gmail you used when applying the code. Still stuck? Open a support ticket." },
      { id: "f6", q: "Can I use one subscription on multiple devices?", a: "A subscription is tied to one account. You can log in with that account on your own devices." },
      { id: "f7", q: "I lost my code. Can I get it again?", a: "Yes. Every code we send is saved in Order History on the home screen, with date and time." },
      { id: "f8", q: "What are your working hours?", a: "Subscriptions are sold daily from 9:00 AM to 10:00 PM. Support tickets can be submitted 24/7." },
      { id: "f9", q: "Can I get a refund?", a: "Codes cannot be refunded once delivered. If there's a problem with your code, contact support and we'll make it right." },
      { id: "f10", q: "My order expired before I paid", a: "Orders expire after the payment timer to keep account details secure. Simply create a new order when you're ready." },
      { id: "f11", q: "Is my data safe?", a: "Yes. Your chat is private to you, payment screenshots are visible only to our admin, and old chats are cleared automatically." },
    ],
    customers,
    conversations,
    messages,
    orders,
    codes,
    tickets,
    notifications,
    seq: { order: orderSeq, ticket: 201 },
  };
}
