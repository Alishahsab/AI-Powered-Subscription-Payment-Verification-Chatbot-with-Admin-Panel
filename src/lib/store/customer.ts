import type { User } from "@supabase/supabase-js";
import { getEffectiveStatus } from "../availability";
import { getSupabase } from "../supabase/client";
import { uploadScreenshot } from "../supabase/screenshots";
import type { AppState, Stage } from "../types";
import { validateName } from "../validation";
import { addMessage, canStillPay, createOrderNumber, createTicketNumber, fillPlaceholders, findCustomerName, getActiveOrder, notifyAdmin, replyAsBot } from "./helpers";
import { getState, updateState } from "./state";

const MINUTE = 60_000;

type AuthResult = { error: string | null };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function signUp(name: string, email: string, pin: string): Promise<AuthResult> {
  const { data, error } = await getSupabase("customer").auth.signUp({
    email: normalizeEmail(email),
    password: pin,
    options: { data: { name: name.trim() } },
  });

  if (error) {
    const alreadyExists = error.message.toLowerCase().includes("already");
    return { error: alreadyExists ? "An account with this email already exists. Please sign in." : error.message };
  }
  if (!data.session) return { error: "Please confirm your email address, then sign in." };
  return { error: null };
}

export async function signIn(email: string, pin: string): Promise<AuthResult> {
  const { error } = await getSupabase("customer").auth.signInWithPassword({ email: normalizeEmail(email), password: pin });
  if (error) return { error: "Incorrect email or PIN. Please try again." };
  return { error: null };
}

export async function requestPinReset(email: string): Promise<AuthResult> {
  const { error } = await getSupabase("customer").auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: `${window.location.origin}/reset-pin`,
  });
  if (error) return { error: "We couldn't send the reset email right now. Please try again in a few minutes." };
  return { error: null };
}

export async function updatePin(pin: string): Promise<AuthResult> {
  const { error } = await getSupabase("customer").auth.updateUser({ password: pin });
  if (error) return { error: "This reset link has expired. Please request a new one." };
  return { error: null };
}

export async function signOut() {
  await getSupabase("customer").auth.signOut();
}

export function ensureCustomerProfile(user: User) {
  const state = getState();
  const hasProfile = state.customers.some((customer) => customer.id === user.id);
  const hasConversation = Boolean(state.conversations[user.id]);
  if (hasProfile && hasConversation) return;

  updateState((draft) => {
    const now = Date.now();
    if (!hasProfile) {
      const name = String(user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Customer");
      draft.customers.push({ id: user.id, name, email: user.email ?? "", createdAt: now, lastSeenAt: now, blocked: false });
    }
    if (!hasConversation) {
      draft.conversations[user.id] = { customerId: user.id, stage: "menu", typing: false, unreadByAdmin: 0, lastMessageAt: now };
    }
  });
}

export function openChat(customerId: string) {
  updateState((state) => {
    const customer = state.customers.find((item) => item.id === customerId);
    const conversation = state.conversations[customerId];
    if (!customer || !conversation) return;

    const firstName = customer.name.split(" ")[0];
    const hasMessages = state.messages.some((message) => message.customerId === customerId);
    if (!hasMessages) {
      addMessage(state, customerId, "bot", `Hi ${firstName}. ${state.settings.welcome}`);
      return;
    }

    const wasAway = Date.now() - customer.lastSeenAt > state.settings.timers.inactiveMinutes * MINUTE;
    if (wasAway && conversation.stage !== "awaiting_payment") {
      conversation.stage = "menu";
      addMessage(state, customerId, "bot", `Welcome back, ${firstName}. How can we help you today?`);
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
      if (message.customerId === customerId && message.sender === "admin" && !message.seenAt) {
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
    const orderId = createOrderNumber();

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

export async function submitPaymentProof(customerId: string, screenshot: string, senderName: string): Promise<string | null> {
  const order = getActiveOrder(getState(), customerId);
  if (!order) return "No open order found.";
  if (!canStillPay(order)) return "This order has expired. Please create a new one.";

  const name = senderName.trim();
  const nameProblem = validateName(name, "Sender account name");
  if (nameProblem) return nameProblem;

  let screenshotPath: string;
  try {
    screenshotPath = await uploadScreenshot(customerId, screenshot);
  } catch {
    return "Could not upload the screenshot. Please check your internet and try again.";
  }

  updateState((state) => {
    const current = state.orders.find((item) => item.id === order.id);
    if (!current) return;

    current.status = "pending_review";
    current.screenshot = screenshotPath;
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

async function uploadOptional(customerId: string, screenshot?: string) {
  if (!screenshot) return undefined;
  try {
    return await uploadScreenshot(customerId, screenshot);
  } catch {
    return undefined;
  }
}

export async function reportPaymentIssue(customerId: string, description: string, screenshot?: string) {
  const screenshotPath = await uploadOptional(customerId, screenshot);
  const text = description.trim() || "The payment is not going through to your account.";

  updateState((state) => {
    const order = getActiveOrder(state, customerId);
    const customer = state.customers.find((item) => item.id === customerId);
    const retryMinutes = state.settings.timers.retryMinutes;

    if (order) order.status = "issue_reported";
    if (customer) customer.paymentBlockedUntil = Date.now() + retryMinutes * MINUTE;

    addMessage(state, customerId, "customer", `Payment issue: ${text}`);
    if (screenshotPath) addMessage(state, customerId, "customer", "Screenshot", { kind: "image", image: screenshotPath });

    state.tickets.unshift({ id: createTicketNumber(), customerId, kind: "payment", message: text, screenshot: screenshotPath, orderId: order?.id, status: "open", createdAt: Date.now() });
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

export async function submitSupportIssue(customerId: string, description: string, screenshot?: string) {
  const screenshotPath = await uploadOptional(customerId, screenshot);
  const ticketId = createTicketNumber();

  updateState((state) => {
    addMessage(state, customerId, "customer", description);
    if (screenshotPath) addMessage(state, customerId, "customer", "Screenshot", { kind: "image", image: screenshotPath });

    state.tickets.unshift({ id: ticketId, customerId, kind: "support", message: description, screenshot: screenshotPath, status: "open", createdAt: Date.now() });
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

const previousStep: Partial<Record<Stage, { stage: Stage; prompt: string }>> = {
  choose_method: { stage: "choose_plan", prompt: "No problem. Choose your plan again." },
  terms: { stage: "choose_method", prompt: "No problem. How would you like to pay?" },
  support_other: { stage: "support", prompt: "No problem. Pick a question below, or choose Other issues." },
};

export function goBack(customerId: string) {
  const conversation = getState().conversations[customerId];
  const step = conversation ? previousStep[conversation.stage] : undefined;
  if (!step) {
    backToMenu(customerId);
    return;
  }

  updateState((state) => {
    addMessage(state, customerId, "customer", "Back");
  });

  replyAsBot(customerId, (state) => {
    addMessage(state, customerId, "bot", step.prompt);
    state.conversations[customerId].stage = step.stage;
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
  const isUnpaid = (status: string) => status === "awaiting_payment" || status === "rejected";
  const hasExpired = getState().orders.some((order) => isUnpaid(order.status) && order.expiresAt <= now);
  if (!hasExpired) return;

  updateState((state) => {
    for (const order of state.orders) {
      if (!isUnpaid(order.status) || order.expiresAt > now) continue;

      order.status = "expired";
      const conversation = state.conversations[order.customerId];
      if (conversation?.activeOrderId !== order.id) continue;

      addMessage(state, order.customerId, "bot", `Order ${order.id} has been cancelled because the payment time ran out. If you still want to buy, please start again from the main menu.`);
      conversation.activeOrderId = undefined;
      conversation.stage = "menu";
    }
  });
}
