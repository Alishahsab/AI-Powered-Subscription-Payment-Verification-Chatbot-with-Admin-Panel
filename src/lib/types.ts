export type AdminStatus = "active" | "away" | "away_closed" | "offline";

export type Plan = {
  id: string;
  name: string;
  months: number;
  price: number;
  active: boolean;
};

export type PaymentMethod = {
  id: string;
  name: string;
  active: boolean;
  steps: string;
  showIban?: boolean;
};

export type GuideStep = {
  id: string;
  text: string;
  image?: string;
};

export type BankAccount = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export type Timers = {
  orderMinutes: number;
  inactiveMinutes: number;
  retryMinutes: number;
  cancelCooldownMinutes: number;
  issueInactiveMinutes: number;
};

export type BotMessageKey =
  | "welcomeBack"
  | "menuPrompt"
  | "choosePlan"
  | "chooseMethod"
  | "termsIntro"
  | "orderCreated"
  | "openOrderExists"
  | "orderPendingReview"
  | "orderCancelled"
  | "ordersPausedAfterCancels"
  | "ordersPaused"
  | "orderExpired"
  | "paymentIssueReceived"
  | "supportIntro"
  | "describeIssue"
  | "issueReceived"
  | "issueResolvedByCustomer"
  | "issueResolvedByAdmin"
  | "issueAutoResolved"
  | "openRequestExists"
  | "supportAwayListed"
  | "supportAwayClosed";

export type BotMessages = Record<BotMessageKey, string>;

export type InboxTab = "pending" | "issues" | "completed" | "unused" | "blocked";

export type InboxTabSetting = { key: InboxTab; label: string };

export type BlockingSettings = {
  message: string;
  channelLabel: string;
  channelUrl: string;
  reasons: string[];
};

export type SupportSettings = {
  waitingMessage: string;
  stillFacingLabel: string;
  resolvedLabel: string;
  issueScreenshotRequired: boolean;
  problemScreenshotRequired: boolean;
};

export type Limits = {
  cancelsBeforeCooldown: number;
  repliesAfterRejection: number;
};

export type Settings = {
  storeName: string;
  welcome: string;
  status: AdminStatus;
  hours: { start: string; end: string; enforce: boolean };
  statusMessages: Record<AdminStatus, string>;
  terms: string[];
  howItWorks: string;
  usageSteps: GuideStep[];
  nextTimeSteps: GuideStep[];
  rejectionMessage: string;
  waitForAdminMessage: string;
  rejectReasons: string[];
  support: SupportSettings;
  messages: BotMessages;
  blocking: BlockingSettings;
  inboxTabs: InboxTabSetting[];
  bank: BankAccount;
  timers: Timers;
  limits: Limits;
  accent: string;
};

export type Customer = {
  id: string;
  number?: number;
  email: string;
  createdAt: number;
  lastSeenAt: number;
  blocked: boolean;
  blockReason?: string;
  paymentBlockedUntil?: number;
  cancelCount: number;
  cancelCooldownUntil?: number;
};

export type MessageSender = "bot" | "customer" | "admin";

export type MessageKind = "text" | "payment" | "steps" | "proof" | "image" | "instructions" | "code";

export type Message = {
  id: string;
  customerId: string;
  sender: MessageSender;
  kind: MessageKind;
  text: string;
  orderId?: string;
  image?: string;
  emailedTo?: string;
  createdAt: number;
  deliveredAt?: number;
  seenAt?: number;
};

export type Stage =
  | "menu"
  | "choose_plan"
  | "choose_method"
  | "terms"
  | "awaiting_payment"
  | "support"
  | "support_other"
  | "rejected"
  | "waiting_agent"
  | "agent_replied"
  | "code_delivered"
  | "live";

export type Conversation = {
  customerId: string;
  stage: Stage;
  planId?: string;
  methodId?: string;
  activeOrderId?: string;
  typing: boolean;
  unreadByAdmin: number;
  lastMessageAt: number;
};

export type OrderStatus = "awaiting_payment" | "pending_review" | "completed" | "rejected" | "issue_reported" | "expired" | "cancelled";

export type Order = {
  id: string;
  customerId: string;
  planId: string;
  planName: string;
  amount: number;
  methodName: string;
  bank?: BankAccount;
  paymentSteps?: string;
  status: OrderStatus;
  createdAt: number;
  expiresAt: number;
  submittedAt?: number;
  reviewedAt?: number;
  screenshot?: string;
  senderName?: string;
  rejectReason?: string;
  code?: string;
  codeUnused: boolean;
};

export type TicketKind = "support" | "payment";

export type Ticket = {
  id: string;
  customerId: string;
  kind: TicketKind;
  message: string;
  screenshot?: string;
  orderId?: string;
  status: "open" | "resolved";
  createdAt: number;
};

export type NotificationKind = "payment" | "payment_issue" | "support";

export type AdminNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  customerId: string;
  read: boolean;
  createdAt: number;
};

export type StoreConfig = {
  settings: Settings;
  plans: Plan[];
  methods: PaymentMethod[];
  faqs: Faq[];
};

export type AppState = {
  loaded: boolean;
  settings: Settings;
  plans: Plan[];
  methods: PaymentMethod[];
  faqs: Faq[];
  customers: Customer[];
  conversations: Record<string, Conversation>;
  messages: Message[];
  orders: Order[];
  tickets: Ticket[];
  notifications: AdminNotification[];
};
