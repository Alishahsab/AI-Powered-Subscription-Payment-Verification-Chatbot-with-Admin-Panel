import { defaultBotMessages } from "./botMessages";
import type { AppState, GuideStep, StoreConfig } from "./types";

export function toGuideSteps(prefix: string, lines: string[]): GuideStep[] {
  return lines.map((text, index) => ({ id: `${prefix}${index + 1}`, text }));
}

const walletSteps = (app: string) =>
  [
    `Open the ${app} app and tap Send Money.`,
    "Choose Bank Transfer and select {bank}.",
    "Enter account number {account} and check the title is {title}.",
    "Enter the exact amount and confirm the payment.",
    "Take a screenshot of the receipt and upload it here.",
  ].join("\n");

const faqList: [string, string][] = [
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

export function createDefaultConfig(): StoreConfig {
  return {
    settings: {
      storeName: "Premium Store",
      welcome: "Welcome to Premium Store. Choose an option below and we'll take it from there.",
      status: "active",
      hours: { start: "09:00", end: "22:00", enforce: false },
      statusMessages: {
        active: "Thank you. Your payment is being verified. Your code will arrive right here in a few minutes.",
        away: "Thank you, your payment is recorded. Our admin is away right now, so your payment will be checked and your code sent here as soon as they are back.",
        away_closed: "Our admin is away right now and isn't taking new orders. Please try again later.",
        offline: "We are offline right now. Back in {back_in}. Subscriptions are available daily between {hours}. Customer Support remains open 24/7.",
      },
      supportClosedMessages: {
        away: "Our admin is away right now and can't take new requests. Please try again after some time.",
        away_closed: "Our admin is away right now and can't take new requests. Please try again after some time.",
        offline: "We are offline right now and can't take new requests. Please try again later.",
      },
      supportMessages: {
        active: "Thanks, your request {ticket_id} has been sent to our team. Our admin will reply right here shortly.",
        away: "Your request {ticket_id} is listed. Our admin is away right now and will reply here as soon as they are back.",
        away_closed: "Your request {ticket_id} is listed. Our admin is away right now and will reply here as soon as they are back.",
        offline: "Your request {ticket_id} is listed. We are offline right now and will reply here as soon as we are back.",
      },
      terms: [
        "Create an order only when you are ready to pay.",
        "Payment must be completed within {timer} minutes of creating the order.",
        "Our payment account may change, so always use the details shown in your order.",
      ],
      howItWorks:
        "1. Pick your plan and payment method.\n2. Create the order. Our account details appear for {timer} minutes.\n3. Send the exact amount and upload the payment screenshot with the sender account name.\n4. We verify your payment and send your premium code right here in the chat and to your email.",
      usageSteps: toGuideSteps("u", [
        "Open the app and go to Profile, then Subscription.",
        "Tap Activate with Premium Code.",
        "Paste the code and tap Activate.",
        "Stay logged in with the same email you used to activate the code.",
      ]),
      nextTimeSteps: toGuideSteps("n", [
        "Always create a new order in this chat before you pay.",
        "Pay only to the account shown in your active order. Our account can change.",
        "Never send payment to an account you got from anywhere else.",
      ]),
      rejectionMessage:
        "We couldn't verify the payment for order {order_id}. Reason: {reason}.\nIf you think this is a mistake, describe your side below and attach a screenshot.",
      waitForAdminMessage: "Thanks, we've received your reply. Please wait for our team to respond here.",
      rejectReasons: ["Screenshot is unclear", "Amount does not match", "Payment not received", "Sender name does not match"],
      quickReplies: [
        "Payment received, verifying now. Please wait a few minutes.",
        "Please share a clearer screenshot of the payment.",
        "Our account details have changed. Please create a new order.",
        "Please make sure you're logged in with the same Gmail in the app.",
      ],
      support: {
        stillFacingLabel: "Still facing the issue",
        resolvedLabel: "Resolved",
        issueScreenshotRequired: true,
        problemScreenshotRequired: false,
      },
      messages: { ...defaultBotMessages },
      blocking: {
        message: "Your access has been restricted. Please contact us by email.",
        channelLabel: "Contact us by email",
        channelUrl: "",
        reasons: ["Fake payment screenshot", "Abusive messages", "Repeated cancelled orders", "Sharing codes with others"],
      },
      inboxTabs: [
        { key: "pending", label: "Pending" },
        { key: "issues", label: "App issues" },
        { key: "completed", label: "Completed" },
        { key: "unused", label: "Unused codes" },
        { key: "blocked", label: "Blocked" },
      ],
      bank: { bankName: "Meezan Bank", accountTitle: "Premium Store", accountNumber: "0123 4567 8901 2345" },
      timers: { orderMinutes: 15, inactiveMinutes: 20, retryMinutes: 30, cancelCooldownMinutes: 30, cancelWindowMinutes: 5, issueInactiveMinutes: 6 * 60 },
      limits: { cancelsBeforeCooldown: 2, repliesAfterRejection: 1 },
      accent: "#0C2660",
    },
    plans: [
      { id: "p1", name: "1 Month", months: 1, price: 299, active: true },
      { id: "p3", name: "3 Months", months: 3, price: 769, active: true },
      { id: "p6", name: "6 Months", months: 6, price: 1439, active: true },
      { id: "p12", name: "12 Months", months: 12, price: 2699, active: true },
    ],
    methods: [
      { id: "jazzcash", name: "JazzCash", active: true, steps: walletSteps("JazzCash") },
      { id: "easypaisa", name: "Easypaisa", active: true, steps: walletSteps("Easypaisa") },
      { id: "nayapay", name: "NayaPay", active: true, steps: "" },
      { id: "bank", name: "Other bank", active: true, steps: "" },
    ],
    faqs: faqList.map(([question, answer], index) => ({ id: `f${index + 1}`, question, answer })),
  };
}

export function createEmptyState(): AppState {
  return {
    loaded: false,
    ...createDefaultConfig(),
    customers: [],
    conversations: {},
    messages: [],
    orders: [],
    tickets: [],
    notifications: [],
  };
}
