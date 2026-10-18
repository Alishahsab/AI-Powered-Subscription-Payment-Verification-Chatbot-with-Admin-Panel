export type Section = "dashboard" | "inbox" | "customers" | "settings" | "search";

export type InboxTab = "general" | "active" | "pending" | "completed" | "unused" | "cancelled" | "issues";

export type NavTarget = {
  section: Section;
  tab?: InboxTab;
  customerId?: string;
};

export type Navigate = (target: NavTarget) => void;
