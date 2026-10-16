"use client";

import { useSyncExternalStore } from "react";
import { createSeed, STATE_VERSION } from "./seed";
import type { Customer, Message, Notification, Order, State, Topic } from "./types";
import { effectiveStatus, hoursLabel, uid } from "./utils";

/*
 * Demo data layer. State lives in localStorage and syncs live across tabs,
 * so the customer chat and the admin panel can be shown side by side.
 * Every exported action maps 1:1 to a future API route / database call.
 */

const KEY = "ps_demo_state";
const listeners = new Set<() => void>();
let state: State | null = null;

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.version === STATE_VERSION) return s;
    }
  } catch {}
  const s = createSeed();
  save(s);
  return s;
}

function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    console.warn("Could not persist demo state", e);
  }
}

function get(): State {
  if (!state) state = load();
  return state;
}

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      state = JSON.parse(e.newValue);
      emit();
    } catch {}
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore() {
  return useSyncExternalStore(subscribe, get, get);
}

export function getState() {
  return get();
}

function mutate(fn: (d: State) => void) {
  const d = structuredClone(get());
  fn(d);
  state = d;
  save(d);
  emit();
}

// ---------- helpers ----------

export function fill(text: string, s: State) {
  return text.replaceAll("{timer}", String(s.settings.accountTimerMin)).replaceAll("{hours}", hoursLabel(s.settings));
}

function push(d: State, customerId: string, from: Message["from"], text: string, topic: Topic, extra: Partial<Message> = {}) {
  const m: Message = { id: uid(), customerId, from, kind: "text", text, topic, createdAt: Date.now(), ...extra };
  d.messages.push(m);
  const c = d.conversations[customerId];
  if (c) {
    c.lastMessageAt = m.createdAt;
    if (from !== "user") c.unreadCustomer += 1;
  }
  return m;
}

function notify(d: State, n: Omit<Notification, "id" | "read" | "createdAt">) {
  d.notifications.unshift({ ...n, id: uid(), read: false, createdAt: Date.now() });
  d.notifications = d.notifications.slice(0, 60);
}

function customerName(d: State, id: string) {
  return d.customers.find((c) => c.id === id)?.name ?? "Customer";
}

const BOT_DELAY = 650;

/** Customer message appears instantly, bot "types" briefly, then replies. */
function withBot(customerId: string, fn: (d: State) => void) {
  mutate((d) => {
    d.conversations[customerId].typing = true;
  });
  setTimeout(
    () =>
      mutate((d) => {
        d.conversations[customerId].typing = false;
        fn(d);
      }),
    BOT_DELAY
  );
}

export function activeOrder(s: State, customerId: string): Order | undefined {
  const id = s.conversations[customerId]?.activeOrderId;
  return s.orders.find((o) => o.id === id);
}

export function isPayable(o: Order, now = Date.now()) {
  return (o.status === "awaiting_payment" || o.status === "rejected") && o.expiresAt > now;
}

// ---------- customer actions ----------

const normPhone = (p: string) => p.replace(/\D/g, "").replace(/^92/, "0");

export function registerCustomer(name: string, phone: string, email?: string): string {
  let id = "";
  mutate((d) => {
    const existing = d.customers.find((c) => normPhone(c.phone) === normPhone(phone));
    if (existing) {
      id = existing.id;
      existing.lastSeenAt = Date.now();
      if (email) existing.email = email;
      if (name) existing.name = name;
    } else {
      id = "c" + uid();
      const c: Customer = { id, name, phone, email, createdAt: Date.now(), lastSeenAt: Date.now(), blocked: false };
      d.customers.unshift(c);
    }
    if (!d.conversations[id])
      d.conversations[id] = { customerId: id, stage: "menu", draft: {}, mode: "bot", typing: false, unreadAdmin: 0, unreadCustomer: 0, lastMessageAt: Date.now() };
  });
  return id;
}

export function openChat(customerId: string) {
  mutate((d) => {
    const c = d.conversations[customerId];
    const cust = d.customers.find((x) => x.id === customerId);
    if (cust) cust.lastSeenAt = Date.now();
    if (!c) return;
    c.unreadCustomer = 0;
    const has = d.messages.some((m) => m.customerId === customerId);
    if (!has) {
      push(d, customerId, "bot", `Hi ${cust?.name.split(" ")[0] ?? "there"}. ${d.settings.welcome}`, "menu");
      c.unreadCustomer = 0;
      c.stage = "menu";
    }
  });
}

export function markCustomerRead(customerId: string) {
  const c = get().conversations[customerId];
  if (c && c.unreadCustomer) mutate((d) => void (d.conversations[customerId].unreadCustomer = 0));
}

export type MenuOption = "buy" | "faq" | "support" | "general";
export const menuLabels: Record<MenuOption, string> = {
  buy: "Buy a Subscription",
  faq: "FAQs",
  support: "Customer Support",
  general: "General Chat",
};

export function chooseMenu(customerId: string, opt: MenuOption) {
  mutate((d) => {
    push(d, customerId, "user", menuLabels[opt], opt === "buy" ? "order" : opt === "general" ? "general" : opt);
  });
  withBot(customerId, (d) => {
    const c = d.conversations[customerId];
    const status = effectiveStatus(d.settings);
    c.draft = {};
    if (opt === "buy") {
      const open = activeOrder(d, customerId);
      if (open && isPayable(open)) {
        push(d, customerId, "bot", `You already have an open order (${open.id}). Complete the payment below or cancel it to start a new one.`, "order");
        c.stage = "awaiting_payment";
        return;
      }
      if (status === "offline") {
        push(d, customerId, "bot", fill(d.settings.statusMessages.offline, d), "order");
        c.stage = "menu";
        return;
      }
      push(d, customerId, "bot", "Choose your plan. All prices are in Pakistani Rupees.", "order");
      c.stage = "choose_plan";
    } else if (opt === "faq") {
      push(d, customerId, "bot", "Here are the questions we're asked most. Tap one to see the answer.", "faq");
      c.stage = "faq";
    } else if (opt === "support") {
      push(d, customerId, "bot", "Sorry you're having trouble. What best describes the issue?", "support");
      c.stage = "support_category";
    } else {
      const text =
        status === "active"
          ? "You're now connected with our team. Type your message below."
          : status === "away"
          ? "Our team is briefly away. Leave your message and we'll reply right here shortly."
          : `We're outside working hours (${hoursLabel(d.settings)}). Leave a message and we'll reply here when we're back.`;
      push(d, customerId, "bot", text, "general");
      c.stage = "live";
    }
  });
}

export function choosePlan(customerId: string, planId: string) {
  const p = get().plans.find((x) => x.id === planId)!;
  mutate((d) => {
    push(d, customerId, "user", `${p.name} — Rs ${p.price.toLocaleString()}`, "order");
    d.conversations[customerId].draft.planId = planId;
  });
  withBot(customerId, (d) => {
    push(d, customerId, "bot", "How would you like to pay?", "order");
    d.conversations[customerId].stage = "choose_method";
  });
}

export function chooseMethod(customerId: string, methodId: string) {
  const m = get().methods.find((x) => x.id === methodId);
  mutate((d) => {
    push(d, customerId, "user", m ? m.name : "Other bank", "order");
    if (m) d.conversations[customerId].draft.methodId = methodId;
  });
  withBot(customerId, (d) => {
    const c = d.conversations[customerId];
    if (!m) {
      push(d, customerId, "bot", "Please type your bank's name and our team will share the account details for it here.", "order");
      c.stage = "other_bank";
      return;
    }
    push(d, customerId, "bot", "Before you continue, please read our terms:\n" + d.settings.terms.map((t) => "• " + fill(t, d)).join("\n"), "order");
    c.stage = "terms";
  });
}

export function requestOtherBank(customerId: string, bank: string) {
  mutate((d) => {
    push(d, customerId, "user", bank, "general");
    const c = d.conversations[customerId];
    c.unreadAdmin += 1;
    const p = d.plans.find((x) => x.id === c.draft.planId);
    notify(d, { type: "chat", title: "Other bank requested", body: `${customerName(d, customerId)} · ${bank}${p ? " · " + p.name : ""}`, customerId });
  });
  withBot(customerId, (d) => {
    push(d, customerId, "bot", `Thanks. Our team will share ${bank} account details here shortly.`, "general");
    d.conversations[customerId].stage = "live";
  });
}

export function howItWorks(customerId: string) {
  mutate((d) => void push(d, customerId, "user", "How does it work?", "order"));
  withBot(customerId, (d) => {
    push(d, customerId, "bot", fill(d.settings.howItWorks, d), "order");
  });
}

export function createOrder(customerId: string) {
  mutate((d) => void push(d, customerId, "user", "Create order", "order"));
  withBot(customerId, (d) => {
    const c = d.conversations[customerId];
    const p = d.plans.find((x) => x.id === c.draft.planId)!;
    const m = d.methods.find((x) => x.id === c.draft.methodId)!;
    const now = Date.now();
    const id = `PS-${++d.seq.order}`;
    d.orders.unshift({
      id, customerId, planId: p.id, planName: p.name, months: p.months, methodId: m.id, methodName: m.name, amount: p.price,
      status: "awaiting_payment", createdAt: now, expiresAt: now + d.settings.accountTimerMin * 60_000,
      email: d.customers.find((x) => x.id === customerId)?.email,
    });
    push(d, customerId, "bot", `Order ${id} created for ${p.name}.`, "order", { kind: "account", orderId: id });
    c.activeOrderId = id;
    c.stage = "awaiting_payment";
  });
}

export function cancelOrder(customerId: string) {
  mutate((d) => {
    push(d, customerId, "user", "Cancel order", "order");
    const o = activeOrder(d, customerId);
    if (o && (o.status === "awaiting_payment" || o.status === "rejected")) o.status = "cancelled";
  });
  withBot(customerId, (d) => {
    push(d, customerId, "bot", "Your order has been cancelled. Anything else we can help with?", "order");
    d.conversations[customerId].stage = "menu";
    d.conversations[customerId].activeOrderId = undefined;
  });
}

/** Returns an error message, or null on success. */
export function submitProof(customerId: string, screenshot: string, tid: string): string | null {
  const s = get();
  const o = activeOrder(s, customerId);
  if (!o) return "No open order found.";
  if (!isPayable(o)) return "This order has expired. Please create a new one.";
  const clean = tid.trim();
  if (clean.length < 6) return "Please enter the full transaction ID.";
  const dup = s.orders.find((x) => x.id !== o.id && x.tid && x.tid === clean);
  if (dup) return "This transaction ID has already been used for another order.";

  mutate((d) => {
    const ord = d.orders.find((x) => x.id === o.id)!;
    ord.status = "pending_review";
    ord.screenshot = screenshot;
    ord.tid = clean;
    ord.submittedAt = Date.now();
    ord.rejectReason = undefined;
    push(d, customerId, "user", "Payment proof submitted", "order", { kind: "proof", orderId: o.id });
    d.conversations[customerId].unreadAdmin += 1;
    notify(d, { type: "order", title: "Payment submitted", body: `${customerName(d, customerId)} · ${ord.planName} · Rs ${ord.amount.toLocaleString()}`, customerId });
  });
  withBot(customerId, (d) => {
    const c = d.conversations[customerId];
    const status = effectiveStatus(d.settings);
    const cust = d.customers.find((x) => x.id === customerId);
    if (status === "active") {
      push(d, customerId, "bot", fill(d.settings.statusMessages.active, d), "order");
      c.stage = "menu";
    } else {
      push(d, customerId, "bot", fill(d.settings.statusMessages.away, d), "order");
      if (!cust?.email) {
        push(d, customerId, "bot", "Add your email address so we can send the code there too.", "order");
        c.stage = "email_capture";
      } else c.stage = "menu";
    }
  });
  return null;
}

export function saveEmail(customerId: string, email: string | null) {
  mutate((d) => {
    push(d, customerId, "user", email ?? "Skip", "order");
    if (email) {
      const cust = d.customers.find((x) => x.id === customerId);
      if (cust) cust.email = email;
      const o = activeOrder(d, customerId);
      if (o) o.email = email;
    }
  });
  withBot(customerId, (d) => {
    push(d, customerId, "bot", email ? `Saved. We'll also send your code to ${email}.` : "No problem — your code will arrive right here in the chat.", "order");
    d.conversations[customerId].stage = "menu";
  });
}

export function askFaq(customerId: string, faqId: string) {
  const f = get().faqs.find((x) => x.id === faqId)!;
  mutate((d) => void push(d, customerId, "user", f.q, "faq"));
  withBot(customerId, (d) => void push(d, customerId, "bot", f.a, "faq"));
}

export function chooseSupport(customerId: string, category: string) {
  mutate((d) => {
    push(d, customerId, "user", category, "support");
    d.conversations[customerId].draft.supportCategory = category;
  });
  withBot(customerId, (d) => {
    push(d, customerId, "bot", "Please describe the issue in a few words. If it's about a code, include the code and the email you use in the app.", "support");
    d.conversations[customerId].stage = "support_describe";
  });
}

export function submitTicket(customerId: string, text: string) {
  let tid = "";
  mutate((d) => {
    push(d, customerId, "user", text, "support");
    const c = d.conversations[customerId];
    tid = `T-${++d.seq.ticket}`;
    d.tickets.unshift({ id: tid, customerId, category: c.draft.supportCategory ?? "Other", message: text, status: "open", createdAt: Date.now() });
    c.unreadAdmin += 1;
    notify(d, { type: "ticket", title: "New app issue", body: `${customerName(d, customerId)} · ${c.draft.supportCategory}`, customerId });
  });
  withBot(customerId, (d) => {
    push(d, customerId, "bot", `Your ticket ${tid} has been submitted. Our team will reply right here — you can close this page, your chat will be saved.`, "support");
    d.conversations[customerId].stage = "menu";
  });
}

export function sendCustomerMessage(customerId: string, text: string) {
  mutate((d) => {
    push(d, customerId, "user", text, "general");
    d.conversations[customerId].unreadAdmin += 1;
    notify(d, { type: "chat", title: "New message", body: `${customerName(d, customerId)}: ${text.slice(0, 80)}`, customerId });
  });
}

export function backToMenu(customerId: string) {
  mutate((d) => void push(d, customerId, "user", "Main menu", "menu"));
  withBot(customerId, (d) => {
    push(d, customerId, "bot", "What can we help you with?", "menu");
    const c = d.conversations[customerId];
    c.stage = "menu";
    c.draft = {};
  });
}

// ---------- admin actions ----------

export function adminSend(customerId: string, text: string) {
  mutate((d) => {
    push(d, customerId, "admin", text, "general");
    const c = d.conversations[customerId];
    c.mode = "human";
    c.stage = "live";
    c.unreadAdmin = 0;
  });
}

export function setMode(customerId: string, mode: "bot" | "human") {
  mutate((d) => {
    const c = d.conversations[customerId];
    c.mode = mode;
    if (mode === "bot" && c.stage === "live") {
      push(d, customerId, "bot", "Our team has closed this conversation. Anything else we can help with?", "menu");
      c.stage = "menu";
    }
  });
}

export function markAdminRead(customerId: string) {
  const s = get();
  if (!s.conversations[customerId]?.unreadAdmin && !s.notifications.some((n) => n.customerId === customerId && !n.read)) return;
  mutate((d) => {
    if (d.conversations[customerId]) d.conversations[customerId].unreadAdmin = 0;
    d.notifications.forEach((n) => n.customerId === customerId && (n.read = true));
  });
}

export function markAllNotificationsRead() {
  mutate((d) => d.notifications.forEach((n) => (n.read = true)));
}

/** Returns an error message, or null on success. */
export function approveOrder(orderId: string, manualCode?: string): string | null {
  const s = get();
  const o = s.orders.find((x) => x.id === orderId);
  if (!o) return "Order not found.";
  let codeValue = "";
  let codeId: string | null = null;
  if (manualCode) {
    const v = manualCode.trim();
    const used = s.codes.find((k) => k.value === v && k.status === "assigned");
    if (used) {
      const who = s.customers.find((c) => c.id === used.customerId)?.name ?? "another customer";
      return `Code ${v} was already sent to ${who} (order ${used.orderId}). Duplicate codes are blocked.`;
    }
    codeValue = v;
    codeId = s.codes.find((k) => k.value === v)?.id ?? null;
  } else {
    const k = s.codes.find((x) => x.planId === o.planId && x.status === "available");
    if (!k) return `No ${o.planName} codes left in inventory. Upload codes or enter one manually.`;
    codeValue = k.value;
    codeId = k.id;
  }
  mutate((d) => {
    const now = Date.now();
    const ord = d.orders.find((x) => x.id === orderId)!;
    if (codeId) {
      const k = d.codes.find((x) => x.id === codeId)!;
      Object.assign(k, { status: "assigned", orderId, customerId: ord.customerId, assignedAt: now });
    } else {
      d.codes.unshift({ id: uid(), value: codeValue, planId: ord.planId, status: "assigned", orderId, customerId: ord.customerId, addedAt: now, assignedAt: now });
    }
    Object.assign(ord, { status: "approved", code: codeValue, reviewedAt: now, emailSent: !!ord.email, rejectReason: undefined });
    push(d, ord.customerId, "admin", `Your premium code for ${ord.planName}`, "order", { kind: "code", orderId });
    const c = d.conversations[ord.customerId];
    if (c.activeOrderId === orderId) {
      c.activeOrderId = undefined;
      if (c.stage === "awaiting_payment" || c.stage === "email_capture") c.stage = "menu";
    }
    c.unreadAdmin = 0;
    d.notifications.forEach((n) => n.customerId === ord.customerId && n.type === "order" && (n.read = true));
  });
  return null;
}

export const rejectReasons = [
  "Screenshot is unclear",
  "Amount does not match",
  "Payment not received",
  "Transaction ID does not match",
];

export function rejectOrder(orderId: string, reason: string) {
  mutate((d) => {
    const ord = d.orders.find((x) => x.id === orderId)!;
    ord.status = "rejected";
    ord.rejectReason = reason;
    ord.reviewedAt = Date.now();
    ord.expiresAt = Date.now() + d.settings.accountTimerMin * 60_000;
    push(d, ord.customerId, "bot", `We couldn't verify the payment for order ${ord.id}: ${reason.toLowerCase()}. Please upload a clear screenshot with the correct transaction ID, or contact support.`, "order");
    const c = d.conversations[ord.customerId];
    c.activeOrderId = ord.id;
    c.stage = "awaiting_payment";
    c.unreadAdmin = 0;
  });
}

export function resolveTicket(id: string, resolved = true) {
  mutate((d) => {
    const t = d.tickets.find((x) => x.id === id);
    if (t) t.status = resolved ? "resolved" : "open";
  });
}

export function toggleBlock(customerId: string) {
  mutate((d) => {
    const c = d.customers.find((x) => x.id === customerId);
    if (c) c.blocked = !c.blocked;
  });
}

export function updateState(fn: (d: State) => void) {
  mutate(fn);
}

export function addCodes(planId: string, values: string[]) {
  const s = get();
  const existing = new Set(s.codes.map((k) => k.value));
  const seen = new Set<string>();
  const fresh: string[] = [];
  const dup: string[] = [];
  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    if (existing.has(v) || seen.has(v)) dup.push(v);
    else {
      fresh.push(v);
      seen.add(v);
    }
  }
  if (fresh.length)
    mutate((d) => {
      const now = Date.now();
      d.codes.unshift(...fresh.map((value) => ({ id: uid(), value, planId, status: "available" as const, addedAt: now })));
    });
  return { added: fresh.length, duplicates: dup };
}

export function deleteCode(id: string) {
  mutate((d) => {
    d.codes = d.codes.filter((k) => !(k.id === id && k.status === "available"));
  });
}

export function runCleanup() {
  let messages = 0;
  let screenshots = 0;
  mutate((d) => {
    const cutoff = Date.now() - d.settings.retentionDays * 86_400_000;
    const before = d.messages.length;
    d.messages = d.messages.filter((m) => m.createdAt >= cutoff);
    messages = before - d.messages.length;
    for (const o of d.orders) {
      if (o.screenshot && o.status !== "pending_review" && (o.reviewedAt ?? o.createdAt) < cutoff) {
        o.screenshot = undefined;
        screenshots++;
      }
    }
  });
  return { messages, screenshots };
}

export function sweepExpired() {
  const now = Date.now();
  const s = get();
  if (!s.orders.some((o) => (o.status === "awaiting_payment" || o.status === "rejected") && o.expiresAt <= now)) return;
  mutate((d) => {
    for (const o of d.orders) {
      if ((o.status === "awaiting_payment" || o.status === "rejected") && o.expiresAt <= now) {
        o.status = "expired";
        const c = d.conversations[o.customerId];
        if (c?.activeOrderId === o.id) {
          push(d, o.customerId, "bot", `Order ${o.id} has expired and the payment details are no longer available. Create a new order whenever you're ready.`, "order");
          c.activeOrderId = undefined;
          if (c.stage === "awaiting_payment") c.stage = "menu";
        }
      }
    }
  });
}

export function resetDemo() {
  const s = createSeed();
  state = s;
  save(s);
  emit();
}
