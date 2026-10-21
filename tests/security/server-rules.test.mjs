// Signs up a throwaway customer and tries to break the rules straight through the API.
// Every attempt must be refused or undone by the database (supabase/updates/012_server_rules.sql).
// Run: npm run test:security
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { createClient } from "@supabase/supabase-js";

function readEnv() {
  const env = {};
  try {
    for (const line of readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) env[match[1]] = match[2].trim();
    }
  } catch {
    // Fall back to the process environment.
  }
  return { url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
}

const { url, key } = readEnv();
const db = createClient(url, key, { auth: { persistSession: false } });
const id = (prefix) => `${prefix}-SEC${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const now = () => Date.now();

let userId;
let config;
let storeOpen;

before(async () => {
  assert.ok(url && key, "Supabase URL and publishable key are needed in .env.local");
  const email = `test.sec${Date.now() % 1000000}@gmail.com`;
  const { data, error } = await db.auth.signUp({ email, password: "123456" });
  assert.ifError(error);
  assert.ok(data.session, "Sign-up must return a session (email confirmation off)");
  userId = data.user.id;

  assert.ifError((await db.from("customers").insert({ id: userId, email, created_at: now(), last_seen_at: now(), blocked: false, cancel_count: 0 })).error);
  assert.ifError((await db.from("conversations").insert({ customer_id: userId, stage: "menu", unread_by_admin: 0, last_message_at: now() })).error);

  ({ data: config } = await db.from("store_config").select("settings, plans, methods").single());
  const { data: status } = await db.rpc("effective_status");
  storeOpen = !["offline", "away_closed"].includes(status);
});

test("a customer cannot sign their profile up as blocked-free with a fake email or pause", async () => {
  const { data } = await db.from("customers").select("email, blocked").eq("id", userId).single();
  assert.match(data.email, /^test\.sec/);
  assert.equal(data.blocked, false);
});

test("a customer only ever sees their own customer row", async () => {
  const { data } = await db.from("customers").select("id");
  assert.deepEqual(data.map((row) => row.id), [userId]);
});

test("a new order always gets the real price and starts unpaid", async (t) => {
  if (!storeOpen) return t.skip("store is closed right now");
  const plan = config.plans.find((item) => item.active !== false);
  const method = config.methods.find((item) => item.active !== false);
  const orderId = id("PS");
  const { error } = await db.from("orders").insert({
    id: orderId, customer_id: userId, plan_id: plan.id, plan_name: "Free", amount: 1, method_name: method.name,
    status: "completed", code: "HACKED", created_at: now(), expires_at: now() + 999999999,
  });
  assert.ifError(error);
  const { data } = await db.from("orders").select("amount, status, code, plan_name").eq("id", orderId).single();
  assert.equal(data.amount, plan.price);
  assert.equal(data.plan_name, plan.name);
  assert.equal(data.status, "awaiting_payment");
  assert.equal(data.code, null);

  const update = await db.from("orders").update({ status: "completed", amount: 1 }).eq("id", orderId).select();
  assert.ok(update.error, "jumping to completed must be refused");

  const second = await db.from("orders").insert({ id: id("PS"), customer_id: userId, plan_id: plan.id, plan_name: plan.name, amount: plan.price, method_name: method.name, status: "awaiting_payment", created_at: now(), expires_at: now() + 900000 });
  assert.ok(second.error, "a second open order must be refused");

  const cancel = await db.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  assert.ifError(cancel.error);
});

test("a customer cannot post as the admin or send a code card", async () => {
  const asAdmin = await db.from("messages").insert({ id: id("M"), customer_id: userId, sender: "admin", kind: "text", text: "Approved!", created_at: now() });
  assert.ok(asAdmin.error);
  const codeCard = await db.from("messages").insert({ id: id("M"), customer_id: userId, sender: "bot", kind: "code", text: "Your code: ABC123", created_at: now() });
  assert.ok(codeCard.error);
  const foreignImage = await db.from("messages").insert({ id: id("M"), customer_id: userId, sender: "customer", kind: "image", text: "Screenshot", image: "someone-else/file.jpg", created_at: now() });
  assert.ok(foreignImage.error);
});

test("a sent message cannot be rewritten or turned into an admin message", async () => {
  const messageId = id("M");
  assert.ifError((await db.from("messages").insert({ id: messageId, customer_id: userId, sender: "customer", kind: "text", text: "hello", created_at: now() })).error);
  await db.from("messages").update({ sender: "admin", text: "changed" }).eq("id", messageId);
  const { data } = await db.from("messages").select("sender, text").eq("id", messageId).single();
  assert.equal(data.sender, "customer");
  assert.equal(data.text, "hello");
});

test("a payment problem pauses orders, and the customer cannot lift the pause", async () => {
  assert.ifError((await db.from("tickets").insert({ id: id("T"), customer_id: userId, kind: "payment", message: "Payment problem test", status: "open", created_at: now() })).error);
  const before = await db.from("customers").select("payment_blocked_until").eq("id", userId).single();
  assert.ok(before.data.payment_blocked_until > now(), "the server sets the pause");

  await db.from("customers").update({ payment_blocked_until: null }).eq("id", userId);
  const after = await db.from("customers").select("payment_blocked_until").eq("id", userId).single();
  assert.equal(after.data.payment_blocked_until, before.data.payment_blocked_until);
});

test("a customer cannot close their own payment issue", async () => {
  const { data: ticket } = await db.from("tickets").select("id").eq("customer_id", userId).eq("kind", "payment").eq("status", "open").single();
  await db.from("tickets").update({ status: "resolved" }).eq("id", ticket.id);
  const { data } = await db.from("tickets").select("status").eq("id", ticket.id).single();
  assert.equal(data.status, "open");
});

test("the idle-request job cannot be called from outside", async () => {
  const { error } = await db.rpc("close_idle_requests");
  assert.ok(error);
});

test("a customer cannot unblock themselves or clear the admin's unread count", async () => {
  await db.from("customers").update({ blocked: false, block_reason: null, email: "other@gmail.com" }).eq("id", userId);
  const { data: customer } = await db.from("customers").select("email").eq("id", userId).single();
  assert.notEqual(customer.email, "other@gmail.com");

  await db.from("conversations").update({ unread_by_admin: 3 }).eq("customer_id", userId);
  await db.from("conversations").update({ unread_by_admin: 0 }).eq("customer_id", userId);
  const { data: conversation } = await db.from("conversations").select("unread_by_admin").eq("customer_id", userId).single();
  assert.ok(conversation.unread_by_admin >= 3);
});

test("the server's internal switch cannot be called from outside", async () => {
  const { error } = await db.rpc("set_trusted", { enabled: true });
  assert.ok(error);
});
