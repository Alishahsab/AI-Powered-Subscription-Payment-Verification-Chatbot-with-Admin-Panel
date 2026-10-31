"use client";

import { useState } from "react";
import { Inbox as InboxIcon } from "lucide-react";
import { useCategorySwipe } from "@/hooks/useCategorySwipe";
import { useShowMore } from "@/hooks/useShowMore";
import { useAppState } from "@/lib/store/state";
import type { InboxTab } from "@/lib/types";
import type { Navigate } from "../navigation";
import EmptyState from "../ui/EmptyState";
import AppInboxCard from "./AppInboxCard";
import AppSectionHeader from "./AppSectionHeader";
import CategoryChips from "./CategoryChips";
import RejectDialog from "./RejectDialog";
import { matchesSearch, type InboxItem } from "./inboxItems";

const dots: Record<InboxTab, string> = {
  pending: "bg-[#794983]",
  issues: "bg-[#ffb02e]",
  completed: "bg-[#00a884]",
  unused: "bg-[#7f66ff]",
  blocked: "bg-[#ef4444]",
};

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
  onNavigate?: Navigate;
  rejectOrderId?: string;
};

export default function AppInbox({ tab, onTabChange, counts, items, now, onOpenChat, onNavigate, rejectOrderId }: AppInboxProps) {
  const state = useAppState();
  const [query, setQuery] = useState("");
  const [rejecting, setRejecting] = useState(rejectOrderId);
  const rejectingOrder = state.orders.find((order) => order.id === rejecting && (order.status === "pending_review" || order.status === "rejected"));
  const tabs = state.settings.inboxTabs.map((item) => ({ ...item, dot: dots[item.key] }));
  const { select, slide, swipe } = useCategorySwipe(tabs.map((item) => item.key), tab, onTabChange, {
    before: () => onNavigate?.({ section: "dashboard" }),
    after: () => onNavigate?.({ section: "bot" }),
  });

  const words = query.trim().toLowerCase();
  const shown = words ? items.filter((item) => matchesSearch(state, item, words)) : items;
  const { visible, sentinel, hasMore } = useShowMore(shown, `${tab}-${words}`);

  return (
    <div className="h-full flex flex-col">
      <AppSectionHeader title="Inbox" query={query} onQueryChange={setQuery}>
        <CategoryChips chips={tabs.map((item) => ({ ...item, count: counts[item.key], urgent: urgentTabs.includes(item.key) }))} selected={tab} onSelect={select} />
      </AppSectionHeader>

      <div key={tab} {...swipe} className={`${slide} flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-2.5`}>
        {shown.length === 0 ? (
          <EmptyState icon={<InboxIcon size={20} />} title="Nothing here" description={words ? "No match for your search." : emptyText[tab]} />
        ) : (
          visible.map((item) => <AppInboxCard key={item.key} tab={tab} item={item} now={now} onOpenChat={onOpenChat} />)
        )}
        {hasMore && <div ref={sentinel} className="h-10" />}
      </div>

      {rejectingOrder && <RejectDialog order={rejectingOrder} onClose={() => setRejecting(undefined)} />}
    </div>
  );
}
