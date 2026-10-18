import type { InboxTab } from "@/lib/types";

export type { InboxTab };

export type Section = "dashboard" | "inbox" | "bot" | "customers" | "settings" | "search";

export type NavTarget = {
  section: Section;
  tab?: InboxTab;
  customerId?: string;
};

export type Navigate = (target: NavTarget) => void;
