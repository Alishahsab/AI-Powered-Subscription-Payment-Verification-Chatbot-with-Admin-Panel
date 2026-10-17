import { getEffectiveStatus } from "../availability";
import { createId } from "../format";
import type { AppState } from "../types";
import { addMessage, canStillPay, fillPlaceholders, findCustomerName, getActiveOrder, notifyAdmin, replyAsBot } from "./helpers";
import { getState, updateState } from "./state";

const MINUTE = 60_000;

type AuthResult = { customerId: string } | { error: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function signUp(name: string, email: string, pin: string): AuthResult {
  const cleanEmail = normalizeEmail(email);
  const exists = getState().customers.some((customer) => customer.email === cleanEmail);
  if (exists) return { error: "An account with this email already exists. Please sign in." };

  const customerId = "c" + createId();
  updateState((state) => {
    const now = Date.now();
    state.customers.unshift({ id: customerId, name: name.trim(), email: cleanEmail, pin, createdAt: now, lastSeenAt: now, blocked: false });
    state.conversations[customerId] = { customerId, stage: "menu", typing: false, unreadByAdmin: 0, lastMessageAt: now };
  });
  return { customerId };
}

export function signIn(email: string, pin: string): AuthResult {
  const customer = getState().customers.find((item) => item.email === normalizeEmail(email));
  if (!customer) return { error: "No account found with this email. Please create an account." };
  if (customer.pin !== pin) return { error: "Incorrect PIN. Please try again." };
  return { customerId: customer.id };
}

export function openChat(customerId: string) {
  updateState((state) => {
    const customer = state.customers.find((item) => item.id === customerId);
    const conversation = state.conversations[customerId];
    if (!customer || !conversation) return;

    const hasMessages = state.messages.some((message) => message.customerId === customerId);
    if (!hasMessages) {
      addMessage(state, customerId, "bot", `Hi ${customer.name.split(" ")[0]}. ${state.settings.welcome}`);
      return;
    }

    const lastActive = customer.lastSeenAt;
    const wasAway = Date.now() - lastActive > state.settings.timers.inactiveMinutes * MINUTE;
    if (wasAway && conversation.stage !== "awaiting_payment") {
      conversation.stage = "menu";
      addMessage(state, customerId, "bot", `Welcome back, ${customer.name.split(" ")[0]}. How can we help you today?`);
    }
  });
  recordPresence(customerId);
}

export function recordPresence(customerId: string) {
  updateState((state) => {
    const now = Date.now();
    const customer = state.customers.find((item) => item.id === customerId);
    if (customer) customer.lastSeenAt = now;

    for (const message of state.messages) {
      if (message.customerId === customerId && message.sender !== "customer" && !message.deliveredAt) {
        message.deliveredAt = now;
      }
    }
  });
}

export function markMessagesSeen(customerId: string) {
  const hasUnseen = getState().messages.some((message) => message.customerId === customerId && message.sender === "admin" && !message.seenAt);
  if (!hasUnseen) return;

  updateState((state) => {
    const now = Date.now();
    for (const message of state.messages) {
      if (message.customerId === customerId && message.sender !== "customer" && !message.seenAt) {
        message.deliveredAt = message.deliveredAt ?? now;
        message.seenAt = now;
      }
    }
  });
}

export type MenuOption = "buy" | "support";

export const menuLabels: Record<MenuOption, string> = {
  buy: "Buy a Subscription",
  support: "Customer Support",
};

function startBuying(state: AppState, customerId: string) {
  const conversation = state.conversations[customerId];
  const customer = state.customers.find((item) => item.id === customerId);
  const now = Date.now();

  const openOrder = getActiveOrder(state, customerId);
  if (openOrder && canStillPay(openOrder)) {
    addMessage(state, customerId, "bot", `You already have an open order (${openOrder.id}). Complete the payment below or cancel it to start a new one.`);
    conversation.stage = "awaiting_payment";
    return;
  }

  if (customer?.paymentBlockedUntil && customer.paymentBlockedUntil > now) {
    const minutesLeft = Math.ceil((customer.paymentBlockedUntil - now) / MINUTE);
    addMessage(state, customerId, "bot", `We're still checking our payment account. Please try again after ${minutesLeft} minutes.`);
    conversation.stage = "menu";
    return;
  }

  if (getEffectiveStatus(state.settings) === "offline") {
    addMessage(state, customerId, "bot", fillPlaceholders(state.settings.statusMessages.offline, state));
    conversation.stage = "menu";
    return;
  }

  addMessage(state, customerId, "bot", "Choose your plan. All prices are in Pakistani Rupees.");
  conversation.stage = "choose_plan";
}

export function chooseMenuOption(customerId: string, option: MenuOption) {
  updateState((state) => {
    addMessage(state, customerId, "customer", menuLabels[option]);
  });

  replyAsBot(customerId, (state) => {
    if (option === "buy") {
      startBuying(state, customerId);
      return;
    }
    addMessage(state, customerId, "bot", "How can we help? Pick a question below, or choose Other issues to contact our team.");
    state.conversations[customerId].stage = "support";
  });
}

export function choosePlan(customerId: string, planId: string) {
  const plan = getState().plans.find((item) => item.id === planId);
  if (!plan) return;

  updateState((state) => {
    addMessage(state, customerId, "customer", `${plan.name}, Rs ${plan.price.toLocaleString()}`);
    state.conversations[customerId].planId = planId;
  });

  replyAsBot(customerId, (state) => {
    addMessage(state, customerId, "bot", "How would you like to pay?");
    state.conversations[customerId].stage = "choose_method";
  });
}

export function chooseMethod(customerId: string, methodId: string) {
  const method = getState().methods.find((item) => item.id === methodId);
  if (!method) return;

  updateState((state) => {
    addMessage(state, customerId, "customer", method.name);
    state.conversations[customerId].methodId = methodId;
  });

  replyAsBot(customerId, (state) => {
    const terms = state.settings.terms.map((term) => "• " + fillPlaceholders(term, state)).join("\n");
    addMessage(state, customerId, "bot", "Before you continue, please read our terms:\n" + terms);
    state.conversations[customerId].stage = "terms";
  });
}

export function showHowItWorks(customerId: string) {
  updateState((state) => {
    addMessage(state, customerId, "customer", "How does it work?");
  });

  replyAsBot(customerId, (state) => {
    addMessage(state, customerId, "bot", fillPlaceholders(state.settings.howItWorks, state));
  });
}

export function createOrder(customerId: string) {
  updateState((state) => {
    addMessage(state, customerId, "customer", "Create order");
  });

  replyAsBot(customerId, (state) => {
    const conversation = state.conversations[customerId];
    const plan = state.plans.find((item) => item.id === conversation.planId);
    const method = state.methods.find((item) => item.id === conversation.methodId);
    if (!plan || !method) return;

    const now = Date.now();
    const orderId = `PS-${state.nextOrderNumber++}`;

    state.orders.unshift({
      id: orderId,
      customerId,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      methodName: method.name,
      status: "awaiting_payment",
      createdAt: now,
      expiresAt: now + state.settings.timers.orderMinutes * MINUTE,
    });

    addMessage(state, customerId, "bot", `Order ${orderId} created for ${plan.name}.`, { kind: "payment", orderId });

    if (method.steps.trim()) {
      addMessage(state, customerId, "bot", fillPlaceholders(method.steps, state), { kind: "steps", orderId });
    }

    conversation.activeOrderId = orderId;
    conversation.stage = "awaiting_payment";
  });
}

export function cancelOrder(customerId: string) {
  updateState((state) => {
    addMessage(state, customerId, "customer", "I don't want to continue this order");
    const order = getActiveOrder(state, customerId);
    if (order && canStillPay(order)) order.status = "cancelled";
  });

  replyAsBot(customerId, (state) => {
    addMessage(state, customerId, "bot", "Your order has been cancelled. Anything else we can help with?");
    state.conversations[customerId].stage = "menu";
    state.conversations[customerId].activeOrderId = undefined;
  });
}

export function submitPaymentProof(customerId: string, screenshot: string, senderName: string): string | null {
  const order = getActiveOrder(getState(), customerId);
  if (!order) return "No open order found.";
  if (!canStillPay(order)) return "This order has expired. Please create a new one.";

  const name = senderName.trim();
  if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(name)) return "Please enter the sender account name using letters only.";

  updateState((state) => {
    const current = state.orders.find((item) => item.id === order.id);
    if (!current) return;

    current.status = "pending_review";
    current.screenshot = screenshot;
    current.senderName = name;
    current.submittedAt = Date.now();
    current.rejectReason = undefined;

    addMessage(state, customerId, "customer", "Payment proof submitted", { kind: "proof", orderId: order.id });
    state.conversations[customerId].unreadByAdmin += 1;
    notifyAdmin(state, {
      kind: "payment",
      title: "Payment submitted",
      body: `${findCustomerName(state, customerId)} · ${current.planName} · Rs ${current.amount.toLocaleString()}`,
      customerId,
    });
  });

  replyAsBot(customerId, (state) => {
    const status = getEffectiveStatus(state.settings);
    const message = status === "active" ? state.settings.statusMessages.active : state.settings.statusMessages.away;
    addMessage(state, customerId, "bot", fillPlaceholders(message, state));
    state.conversations[customerId].stage = "menu";
  });

  return null;
}

export function reportPaymentIssue(customerId: string, description: string, screenshot?: string) {
  updateState((state) => {
    const order = getActiveOrder(state, customerId);
    const customer = state.customers.find((item) => item.id === customerId);
    const ticketId = `T-${state.nextTicketNumber++}`;
    const retryMinutes = state.settings.timers.retryMinutes;
    const text = description.trim() || "The payment is not going through to your account.";

    if (order) order.status = "issue_reported";
    if (customer) customer.paymentBlockedUntil = Date.now() + retryMinutes * MINUTE;

    addMessage(state, customerId, "customer", `Payment issue: ${text}`);
    if (screenshot) addMessage(state, customerId, "customer", "Screenshot", { kind: "image", image: screenshot });

    state.tickets.unshift({ id: ticketId, customerId, kind: "payment", message: text, screenshot, orderId: order?.id, status: "open", createdAt: Date.now() });
    state.conversations[customerId].unreadByAdmin += 1;
    notifyAdmin(state, { kind: "payment_issue", title: "Payment issue reported", body: `${findCustomerName(state, customerId)} · ${text.slice(0, 70)}`, customerId });
  });

  replyAsBot(customerId, (state) => {
    const retryMinutes = state.settings.timers.retryMinutes;
    addMessage(state, customerId, "bot", `Thanks for letting us know. Please don't send any payment right now, we're checking our account details. Please try again after ${retryMinutes} minutes. Our team will reply here.`);
    state.conversations[customerId].stage = "live";
    state.conversations[customerId].activeOrderId = undefined;
  });
}

export function askFaq(customerId: string, faqId: string) {
  const faq = getState().faqs.find((item) => item.id === faqId);
  if (!faq) return;

  updateState((state) => {
    addMessage(state, customerId, "customer", faq.question);
  });

  replyAsBot(customerId, (state) => {
    addMessage(state, customerId, "bot", faq.answer);
  });
}

export function chooseOtherIssue(customerId: string) {
  updateState((state) => {
    addMessage(state, customerId, "customer", "Other issues");
  });

  replyAsBot(customerId, (state) => {
    addMessage(state, customerId, "bot", "Please describe your issue. You can also attach a screenshot.");
    state.conversations[customerId].stage = "support_other";
  });
}

export function submitSupportIssue(customerId: string, description: string, screenshot?: string) {
  let ticketId = "";

  updateState((state) => {
    ticketId = `T-${state.nextTicketNumber++}`;
    addMessage(state, customerId, "customer", description);
    if (screenshot) addMessage(state, customerId, "customer", "Screenshot", { kind: "image", image: screenshot });

    state.tickets.unshift({ id: ticketId, customerId, kind: "support", message: description, screenshot, status: "open", createdAt: Date.now() });
    state.conversations[customerId].unreadByAdmin += 1;
    notifyAdmin(state, { kind: "support", title: "New support issue", body: `${findCustomerName(state, customerId)} · ${description.slice(0, 70)}`, customerId });
  });

  replyAsBot(customerId, (state) => {
    addMessage(state, customerId, "bot", `Thanks, your issue ${ticketId} has been sent to our team. An agent will join you shortly and reply right here. You can close this page and check back later.`);
    state.conversations[customerId].stage = "live";
  });
}

export function sendCustomerMessage(customerId: string, text: string) {
  updateState((state) => {
    addMessage(state, customerId, "customer", text);
    state.conversations[customerId].unreadByAdmin += 1;
  });
}

export function backToMenu(customerId: string) {
  updateState((state) => {
    addMessage(state, customerId, "customer", "Main menu");
  });

  replyAsBot(customerId, (state) => {
    addMessage(state, customerId, "bot", "What can we help you with?");
    const conversation = state.conversations[customerId];
    conversation.stage = "menu";
    conversation.planId = undefined;
    conversation.methodId = undefined;
  });
}

export function expireUnpaidOrders() {
  const now = Date.now();
  const hasExpired = getState().orders.some((order) => (order.status === "awaiting_payment" || order.status === "rejected") && order.expiresAt <= now);
  if (!hasExpired) return;

  updateState((state) => {
    for (const order of state.orders) {
      const unpaid = order.status === "awaiting_payment" || order.status === "rejected";
      if (!unpaid || order.expiresAt > now) continue;

      order.status = "expired";
      const conversation = state.conversations[order.customerId];
      if (conversation?.activeOrderId !== order.id) continue;

      addMessage(state, order.customerId, "bot", `Order ${order.id} has been cancelled because the payment time ran out. If you still want to buy, please start again from the main menu.`);
      conversation.activeOrderId = undefined;
      conversation.stage = "menu";
    }
  });
}
