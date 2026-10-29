"use client";

import { useState } from "react";
import { Inbox as InboxIcon } from "lucide-react";
import { useCategorySwipe } from "@/hooks/useCategorySwipe";
import { useAppState } from "@/lib/store/state";
import type { InboxTab } from "@/lib/types";
import EmptyState from "../ui/EmptyState";
import AppInboxCard from "./AppInboxCard";
import AppSectionHeader from "./AppSectionHeader";
import CategoryChips from "./CategoryChips";
import { matchesSearch, type InboxItem } from "./inboxItems";

const tabs: { key: InboxTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "issues", label: "Issues" },
  { key: "completed", label: "Completed" },
  { key: "unused", label: "Unused" },
  { key: "blocked", label: "Blocked" },
];

const urgentTabs: InboxTab[] = ["pending", "issues"];

const emptyText: Record<InboxTab, string> = {
  pending: "No payments are waiting for review.",
  issues: "No open app issues.",
  completed: "Completed orders will show here.",
  unused: "No unused codes right now.",
  blocked: "No blocked customers.",
};

type AppInboxProps = {
  tab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  counts: Record<InboxTab, number>;
  items: InboxItem[];
  now: number;
  onOpenChat: (customerId: string) => void;
};

export default function AppInbox({ tab, onTabChange, counts, items, now, onOpenChat }: AppInboxProps) {
  const state = useAppState();
  const [query, setQuery] = useState("");
  const { select, slide, swipe } = useCategorySwipe(tabs.map((item) => item.key), tab, onTabChange);

  const words = query.trim().toLowerCase();
  const shown = words ? items.filter((item) => matchesSearch(state, item, words)) : items;

  return (
    <div className="h-full flex flex-col">
      <AppSectionHeader title="Inbox" query={query} onQueryChange={setQuery}>
        <CategoryChips chips={tabs.map((item) => ({ ...item, count: counts[item.key], urgent: urgentTabs.includes(item.key) }))} selected={tab} onSelect={select} />
      </AppSectionHeader>

      <div key={tab} {...swipe} className={`${slide} flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-2.5`}>
        {shown.length === 0 ? (
          <EmptyState icon={<InboxIcon size={20} />} title="Nothing here" description={words ? "No match for your search." : emptyText[tab]} />
        ) : (
          shown.map((item) => <AppInboxCard key={item.key} tab={tab} item={item} now={now} onOpenChat={onOpenChat} />)
        )}
      </div>
    </div>
  );
}
