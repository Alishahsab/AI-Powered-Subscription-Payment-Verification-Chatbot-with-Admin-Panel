import { getSupabase } from "../supabase/client";
import { sendEmailCopy } from "../supabase/email";
import { deleteScreenshots, uploadScreenshot } from "../supabase/screenshots";
import type { AdminStatus, AppState } from "../types";
import { addMessage, botText, codeHeading, extractCodes, findCustomerEmail } from "./helpers";
import { applyRemoteChange, getState, updateState } from "./state";


export async function isSignedInAdmin() {
  const client = getSupabase("admin");
  const { data } = await client.auth.getUser();
  if (!data.user) return false;

  const { data: adminRow } = await client.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return Boolean(adminRow);
}

export async function adminSignIn(email: string, password: string): Promise<string | null> {
  const client = getSupabase("admin");
  const { error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) return "Incorrect email or password.";

  if (!(await isSignedInAdmin())) {
    await client.auth.signOut();
    return "This account does not have admin access.";
  }
  return null;
}

export async function adminSignOut() {
  await getSupabase("admin").auth.signOut();
}

export function setAdminStatus(status: AdminStatus) {
  updateState((state) => {
    state.settings.status = status;
  });
}

export function sendAdminMessage(customerId: string, text: string, emailCopy: boolean) {
  const codes = extractCodes(text);
  const containsCode = codes.length > 0;

  updateState((state) => {
    const customer = state.customers.find((item) => item.id === customerId);
    addMessage(state, customerId, "admin", text, { emailedTo: emailCopy ? customer?.email : undefined });
    if (containsCode) {
      const order = findOrderAwaitingCode(state, customerId);
      if (order) order.code = codes[0];
      addMessage(state, customerId, "admin", codes[0], { kind: "code", orderId: order?.id });
    }

    updateStageAfterReply(state, customerId, containsCode);
  });

  if (emailCopy) sendEmailCopy(customerId, text, containsCode ? codeGuides(getState()) : "");
}

function codeGuides(state: AppState) {
  return `How to activate it:\n${state.settings.activationGuide}\n\nInstructions for next time:\n${state.settings.nextTimeGuide}`;
}

function updateStageAfterReply(state: AppState, customerId: string, containsCode: boolean) {
  const conversation = state.conversations[customerId];
  conversation.unreadByAdmin = 0;
  const hasOpenTicket = state.tickets.some((ticket) => ticket.customerId === customerId && ticket.status === "open");
  const keepsStage = conversation.stage === "awaiting_payment" || conversation.stage === "rejected";
  if (containsCode) conversation.stage = "menu";
  else if (hasOpenTicket) conversation.stage = "agent_replied";
  else if (!keepsStage) conversation.stage = "live";
}

export async function sendAdminImage(customerId: string, image: string): Promise<string | null> {
  let path: string;
  try {
    path = await uploadScreenshot(customerId, image);
  } catch {
    return "Could not upload the image. Please try again.";
  }

  updateState((state) => {
    addMessage(state, customerId, "admin", "Image", { kind: "image", image: path });
    updateStageAfterReply(state, customerId, false);
  });
  return null;
}

function findOrderAwaitingCode(state: AppState, customerId: string) {
  const completed = state.orders
    .filter((order) => order.customerId === customerId && order.status === "completed")
    .sort((a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0));
  return completed.find((order) => !order.code) ?? completed[0];
}

export function setCodeUnused(orderId: string, unused: boolean) {
  updateState((state) => {
    const order = state.orders.find((item) => item.id === orderId);
    if (order) order.codeUnused = unused;
  });
}


export async function deleteCustomer(customerId: string): Promise<string | null> {
  const client = getSupabase("admin");
  const { data: files } = await client.storage.from("screenshots").list(customerId, { limit: 1000 });
  if (files && files.length > 0) await deleteScreenshots(files.map((file) => `${customerId}/${file.name}`));

  const { error } = await client.rpc("delete_customer", { target: customerId });
  if (error) return error.message;

  applyRemoteChange((state) => {
    state.customers = state.customers.filter((customer) => customer.id !== customerId);
    delete state.conversations[customerId];
    state.messages = state.messages.filter((message) => message.customerId !== customerId);
    state.orders = state.orders.filter((order) => order.customerId !== customerId);
    state.tickets = state.tickets.filter((ticket) => ticket.customerId !== customerId);
    state.notifications = state.notifications.filter((notification) => notification.customerId !== customerId);
  });
  return null;
}

export function findCodeSentToSomeoneElse(customerId: string, text: string) {
  const state = getState();
  const wanted = text.trim().toLowerCase();
  const earlierOrder = state.orders.find((order) => order.customerId !== customerId && order.code?.toLowerCase() === wanted);
  if (earlierOrder) {
    return { code: earlierOrder.code ?? text, customerEmail: findCustomerEmail(state, earlierOrder.customerId), sentAt: earlierOrder.reviewedAt ?? earlierOrder.createdAt };
  }

  const codes = extractCodes(text);
  if (codes.length === 0) return null;

  for (const message of state.messages) {
    if (message.sender !== "admin" || message.customerId === customerId) continue;

    const repeated = codes.find((code) => extractCodes(message.text).includes(code));
    if (repeated) {
      return { code: repeated, customerEmail: findCustomerEmail(state, message.customerId), sentAt: message.createdAt };
    }
  }
  return null;
}

export function approveOrder(orderId: string, code: string, emailCopy: boolean) {
  const order = getState().orders.find((item) => item.id === orderId);
  if (!order) return;

  updateState((state) => {
    const current = state.orders.find((item) => item.id === orderId);
    if (!current) return;

    current.status = "completed";
    current.reviewedAt = Date.now();
    current.code = code;
    current.codeUnused = false;

    const customer = state.customers.find((item) => item.id === current.customerId);
    addMessage(state, current.customerId, "admin", code, { kind: "code", orderId, emailedTo: emailCopy ? customer?.email : undefined });

    const conversation = state.conversations[current.customerId];
    if (conversation.activeOrderId === orderId) conversation.activeOrderId = undefined;
    conversation.stage = "menu";
    conversation.unreadByAdmin = 0;
    markNotificationsRead(state, current.customerId);
  });

  if (emailCopy) {
    const state = getState();
    sendEmailCopy(order.customerId, `${codeHeading(state, order)}\n\n${code}`, codeGuides(state));
  }
}

export function rejectOrder(orderId: string, reason: string) {
  updateState((state) => {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return;

    order.status = "rejected";
    order.rejectReason = reason;
    order.reviewedAt = Date.now();

    const message = state.settings.rejectionMessage.replaceAll("{order_id}", order.id).replaceAll("{reason}", reason);
    addMessage(state, order.customerId, "bot", message);

    const conversation = state.conversations[order.customerId];
    if (conversation.activeOrderId === orderId) conversation.activeOrderId = undefined;
    conversation.stage = "rejected";
    conversation.unreadByAdmin = 0;
    markNotificationsRead(state, order.customerId);
  });
}

export function setTicketResolved(ticketId: string, resolved: boolean) {
  updateState((state) => {
    const ticket = state.tickets.find((item) => item.id === ticketId);
    if (!ticket) return;
    ticket.status = resolved ? "resolved" : "open";

    const conversation = state.conversations[ticket.customerId];
    const stillOpen = state.tickets.some((item) => item.customerId === ticket.customerId && item.status === "open");
    if (resolved && !stillOpen && conversation) {
      addMessage(state, ticket.customerId, "bot", botText(state, "issueResolvedByAdmin", { ticket_id: ticket.id }));
      conversation.stage = "menu";
    }
  });
}

function markNotificationsRead(state: AppState, customerId: string) {
  for (const notification of state.notifications) {
    if (notification.customerId === customerId) notification.read = true;
  }
}

export function markConversationRead(customerId: string) {
  const state = getState();
  const hasUnread = state.conversations[customerId]?.unreadByAdmin || state.notifications.some((item) => item.customerId === customerId && !item.read);
  if (!hasUnread) return;

  updateState((draft) => {
    if (draft.conversations[customerId]) draft.conversations[customerId].unreadByAdmin = 0;
    markNotificationsRead(draft, customerId);
  });
}

export function markAllNotificationsRead() {
  updateState((state) => {
    for (const notification of state.notifications) notification.read = true;
  });
}

export function blockCustomer(customerId: string, reason: string) {
  updateState((state) => {
    const customer = state.customers.find((item) => item.id === customerId);
    if (!customer) return;
    customer.blocked = true;
    customer.blockReason = reason;
  });
}

export function unblockCustomer(customerId: string) {
  updateState((state) => {
    const customer = state.customers.find((item) => item.id === customerId);
    if (!customer) return;
    customer.blocked = false;
    customer.blockReason = undefined;
  });
}

export type EditableSettings = Pick<AppState, "settings" | "plans" | "methods" | "faqs">;

export function saveSettings(changes: EditableSettings) {
  updateState((state) => {
    state.settings = { ...changes.settings, status: state.settings.status };
    state.plans = changes.plans;
    state.methods = changes.methods;
    state.faqs = changes.faqs;
  });
}
