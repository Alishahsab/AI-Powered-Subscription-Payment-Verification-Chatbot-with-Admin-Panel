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

// Closed menu buttons still answer a tap with a pop-up, so they are tapped even though they look disabled.
async function tapClosed(page, label) {
  await page.click(`button:has-text('${label}') >> nth=-1`, { force: true });
  await wait(800);
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

test("the chat shows the privacy note and the day", async () => {
  const { page, errors } = await newCustomer();
  assert.ok(await page.isVisible("text=Private chat. Messages are deleted after 15 days."));
  assert.ok(await page.isVisible("text=Today"), "the day divider is shown");
  assert.deepEqual(errors, []);
});

test("a payment problem shows the steps and app issues stay open", async (t) => {
  const { page, errors } = await newCustomer();
  if (!(await createOrder(page))) return t.skip("the store is not taking orders right now");
  await click(page, "Problem?");
  assert.ok(await page.isVisible("text=Go to Customer Support and select Other issues."), "the steps are shown");
  assert.equal(await page.locator("textarea").count(), 0, "no report form");
  await click(page, "Got it");
  await click(page, "Cancel");
  if (await page.isVisible("button:has-text('Main menu')")) await click(page, "Main menu");
  await click(page, "Customer Support");
  await click(page, "Other issues");
  if (await page.isVisible("text=can't take new requests")) return t.skip("the store is not taking requests right now");
  assert.ok(await page.isVisible("textarea"), "an app issue can still be sent");
  assert.deepEqual(errors, []);
});

test("while an app issue is open both menu buttons are closed and explain why", async (t) => {
  const { page, errors } = await newCustomer();
  await click(page, "Customer Support");
  if (await page.isVisible("text=Admin not available")) return t.skip("the store is closed right now");
  await click(page, "Other issues");
  if (!(await page.isVisible("textarea"))) return t.skip("the store is not taking requests right now");
  await page.fill("textarea", "First app issue in the end-to-end test.");
  await (await page.$("input[type=file]")).setInputFiles({ name: "issue.png", mimeType: "image/png", buffer: tinyPng });
  await click(page, "Send to our team");
  await wait(2500);

  await click(page, "Main menu");
  assert.ok(await page.isVisible("text=Your request is with our team. The menu opens again once it is resolved."), "the menu says why it is closed");
  await tapClosed(page, "Customer Support");
  assert.ok(await page.isVisible("text=Request open"), "a tap explains in a pop-up");
  assert.equal(await page.locator("text=How can we help?").count(), 1, "support did not open again");
  await click(page, "Got it");
  await tapClosed(page, "Buy a Subscription");
  assert.ok(await page.isVisible("text=Request open"), "buying is closed too");
  await click(page, "Got it");
  assert.equal(await page.locator("button:has-text('Go to my request')").count(), 0, "no way around the closed menu");
  assert.ok(!(await page.isVisible("textarea")), "no message box while a request is open");
  assert.deepEqual(errors, []);
});

test("after a payment proof both menu buttons are closed until the admin decides", async (t) => {
  const { page, errors } = await newCustomer();
  if (!(await createOrder(page))) return t.skip("the store is not taking orders right now");
  await click(page, "Upload payment proof");
  await (await page.$("input[type=file]")).setInputFiles({ name: "receipt.png", mimeType: "image/png", buffer: tinyPng });
  await page.fill("input[placeholder*='Name on the account']", "Ali Raza");
  await click(page, "Submit for verification");
  await wait(3000);

  assert.ok(await page.isVisible("text=Your payment is being verified. The menu opens again once we approve it."), "the menu says why it is closed");
  await tapClosed(page, "Buy a Subscription");
  assert.ok(await page.isVisible("text=Payment being verified"), "a tap explains in a pop-up");
  await click(page, "Got it");
  await tapClosed(page, "Customer Support");
  assert.ok(await page.isVisible("text=Payment being verified"), "support is closed too");
  assert.equal(await page.locator("text=How can we help?").count(), 0, "support did not open");
  assert.ok(!(await page.isVisible("textarea")), "no message box");
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
  if (await page.isVisible("text=Admin not available")) return t.skip("the store is closed right now");
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
