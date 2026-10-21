// Customer flows that broke before. Needs the app running (npm run dev) and Microsoft Edge.
// Run: npm run test:e2e   (BASE_URL=https://... to test a deployed site)
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

let browser;

before(async () => {
  browser = await chromium.launch({ channel: "msedge" });
});

after(async () => {
  await browser?.close();
});

async function newCustomer() {
  const page = await (await browser.newContext({ viewport: { width: 420, height: 860 } })).newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(BASE_URL, { timeout: 60000 });
  await page.waitForSelector("text=Continue", { timeout: 60000 });
  await page.fill('input[placeholder="you@example.com"]', `test.e2e${Date.now() % 1000000}@gmail.com`);
  await page.click("form button:not([type=button])");
  await page.waitForSelector("text=Create your PIN", { timeout: 15000 });
  const pins = page.locator("input[inputmode=numeric]");
  await pins.nth(0).fill("123456");
  await pins.nth(1).fill("123456");
  await page.click("form button:has-text('Create account')");
  await page.waitForSelector("button:has-text('Buy a Subscription')", { timeout: 30000 });
  await wait(1500);
  return { page, errors };
}

async function click(page, label) {
  await page.click(`button:has-text('${label}') >> nth=-1`);
  await wait(1200);
}

async function createOrder(page) {
  await click(page, "Buy a Subscription");
  if (!(await page.isVisible("button:has-text('1 Month')"))) return false; // Store is closed for new orders.
  await click(page, "1 Month");
  await click(page, "JazzCash");
  await page.click("button:has-text('I agree, create order'), button:has-text('Create order')");
  await page.waitForSelector("button:has-text('Upload payment proof')", { timeout: 15000 });
  return true;
}

test("the chat shows the privacy note", async () => {
  const { page, errors } = await newCustomer();
  assert.ok(await page.isVisible("text=Private chat. Messages are deleted after 15 days."));
  assert.deepEqual(errors, []);
});

test("a payment problem shows no notice and does not block app issues", async (t) => {
  const { page, errors } = await newCustomer();
  if (!(await createOrder(page))) return t.skip("the store is not taking orders right now");
  await click(page, "Problem?");
  await page.fill("textarea", "Payment problem in the end-to-end test.");
  await click(page, "Send report");
  await wait(2500);
  assert.equal(await page.locator("text=Your request is submitted").count(), 0, "no notice under the chat");
  assert.equal(await page.locator("text=You already have an open request").count(), 0);

  await click(page, "Main menu");
  await click(page, "Customer Support");
  await click(page, "Other issues");
  if (await page.isVisible("text=can't take new requests")) return t.skip("the store is not taking requests right now");
  assert.ok(await page.isVisible("textarea"), "an app issue can still be sent");
  assert.deepEqual(errors, []);
});

test("a second app issue while one is open says one is already open", async (t) => {
  const { page, errors } = await newCustomer();
  await click(page, "Customer Support");
  await click(page, "Other issues");
  if (!(await page.isVisible("textarea"))) return t.skip("the store is not taking requests right now");
  await page.fill("textarea", "First app issue in the end-to-end test.");
  await (await page.$("input[type=file]")).setInputFiles({ name: "issue.png", mimeType: "image/png", buffer: tinyPng });
  await click(page, "Send to our team");
  await wait(2500);
  assert.equal(await page.locator("text=You already have an open request").count(), 0, "nothing extra right after sending");

  await click(page, "Main menu");
  await click(page, "Customer Support");
  await click(page, "Other issues");
  assert.equal(await page.locator("text=You already have an open request. You can send a new one once it is resolved.").count(), 1, "said once, under the chat");
  assert.ok(!(await page.isVisible("textarea")), "no message box while a request is open");
  assert.deepEqual(errors, []);
});

test("buying again while an order is pending shows the pending notice, not a message box", async (t) => {
  const { page, errors } = await newCustomer();
  if (!(await createOrder(page))) return t.skip("the store is not taking orders right now");
  await click(page, "Upload payment proof");
  await (await page.$("input[type=file]")).setInputFiles({ name: "receipt.png", mimeType: "image/png", buffer: tinyPng });
  await page.fill("input[placeholder*='Name on the account']", "Ali Raza");
  await click(page, "Submit for verification");
  await wait(3000);

  await click(page, "Buy a Subscription");
  assert.equal(await page.locator("text=Your order is still waiting for approval. You can place a new order once we approve or cancel it.").count(), 1, "shown once, as a notice");
  assert.equal(await page.locator("text=/still waiting for approval.*PS-/").count(), 0, "no order number in the notice");
  assert.ok(!(await page.isVisible("textarea")), "no message box");
  assert.ok(await page.isVisible("button:has-text('Main menu')"));
  assert.deepEqual(errors, []);
});

test("tapping create order twice makes only one order", async (t) => {
  const { page, errors } = await newCustomer();
  await click(page, "Buy a Subscription");
  if (!(await page.isVisible("button:has-text('1 Month')"))) return t.skip("the store is not taking orders right now");
  await click(page, "1 Month");
  await click(page, "JazzCash");
  await page.dblclick("button:has-text('I agree, create order')");
  await wait(3000);
  assert.equal(await page.locator("text=/^Order PS-/i").count(), 1, "one payment card");
  assert.equal(await page.locator("text=Create order").count(), 1, "one Create order message");
  assert.deepEqual(errors, []);
});

test("a picked screenshot opens full size and closes again", async (t) => {
  const { page, errors } = await newCustomer();
  await click(page, "Customer Support");
  await click(page, "Other issues");
  if (!(await page.isVisible("textarea"))) return t.skip("the store is not taking requests right now");
  await page.fill("textarea", "Screenshot viewer in the end-to-end test.");
  await (await page.$("input[type=file]")).setInputFiles({ name: "issue.png", mimeType: "image/png", buffer: tinyPng });
  await click(page, "Send to our team");
  await wait(3000);
  await page.click("button[aria-label='Open Attached screenshot']");
  assert.ok(await page.isVisible("[role=dialog][aria-label='Attached screenshot']"));
  await page.keyboard.press("Escape");
  assert.ok(!(await page.isVisible("[role=dialog][aria-label='Attached screenshot']")));
  assert.deepEqual(errors, []);
});
