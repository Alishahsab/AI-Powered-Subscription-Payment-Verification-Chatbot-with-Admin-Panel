export type AdminStatus = "active" | "away" | "offline";

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
  accountTitle: string;
  accountNumber: string;
  active: boolean;
};

export type Faq = { id: string; q: string; a: string };

export type Settings = {
  storeName: string;
  welcome: string;
  status: AdminStatus;
  hours: { start: string; end: string; enforce: boolean };
  statusMessages: Record<AdminStatus, string>;
  terms: string[];
  howItWorks: string;
  accountTimerMin: number;
  retentionDays: number;
  accent: string;
  supportCategories: string[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: number;
  lastSeenAt: number;
  blocked: boolean;
};

export type Topic = "menu" | "order" | "faq" | "support" | "general";

export type MessageKind =
  | "text"
  | "account" // payment details for an order (rendered live from order state)
  | "proof" // customer submitted payment proof
  | "code" // delivered premium code
  | "notice"; // small centered system line

export type Message = {
  id: string;
  customerId: string;
  from: "bot" | "user" | "admin";
  kind: MessageKind;
  text: string;
  orderId?: string;
  topic: Topic;
  createdAt: number;
};

export type Stage =
  | "menu"
  | "choose_plan"
  | "choose_method"
  | "other_bank"
  | "terms"
  | "awaiting_payment"
  | "email_capture"
  | "faq"
  | "support_category"
  | "support_describe"
  | "live";

export type Conversation = {
  customerId: string;
  stage: Stage;
  draft: { planId?: string; methodId?: string; supportCategory?: string };
  activeOrderId?: string;
  mode: "bot" | "human";
  typing: boolean;
  unreadAdmin: number;
  unreadCustomer: number;
  lastMessageAt: number;
};

export type OrderStatus = "awaiting_payment" | "pending_review" | "approved" | "rejected" | "expired" | "cancelled";

export type Order = {
  id: string;
  customerId: string;
  planId: string;
  planName: string;
  months: number;
  methodId: string;
  methodName: string;
  amount: number;
  status: OrderStatus;
  createdAt: number;
  expiresAt: number;
  submittedAt?: number;
  reviewedAt?: number;
  screenshot?: string;
  tid?: string;
  email?: string;
  code?: string;
  rejectReason?: string;
  emailSent?: boolean;
};

export type Code = {
  id: string;
  value: string;
  planId: string;
  status: "available" | "assigned";
  orderId?: string;
  customerId?: string;
  addedAt: number;
  assignedAt?: number;
};

export type Ticket = {
  id: string;
  customerId: string;
  category: string;
  message: string;
  status: "open" | "resolved";
  createdAt: number;
};

export type Notification = {
  id: string;
  type: "order" | "ticket" | "chat" | "system";
  title: string;
  body: string;
  customerId?: string;
  read: boolean;
  createdAt: number;
};

export type State = {
  version: number;
  settings: Settings;
  plans: Plan[];
  methods: PaymentMethod[];
  faqs: Faq[];
  customers: Customer[];
  conversations: Record<string, Conversation>;
  messages: Message[];
  orders: Order[];
  codes: Code[];
  tickets: Ticket[];
  notifications: Notification[];
  seq: { order: number; ticket: number };
};
