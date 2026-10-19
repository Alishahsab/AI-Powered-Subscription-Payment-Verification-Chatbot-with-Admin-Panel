import type { InboxTab } from "@/lib/types";
import type { BotFilter } from "./inbox/inboxItems";

export type { InboxTab };

export type Section = "dashboard" | "inbox" | "bot" | "customers" | "settings" | "search";

export type NavTarget = {
  section: Section;
  tab?: InboxTab;
  botFilter?: BotFilter;
  customerId?: string;
};

export type Navigate = (target: NavTarget) => void;
