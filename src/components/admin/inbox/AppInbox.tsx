"use client";

import { useEffect, useRef, useState } from "react";
import { Inbox as InboxIcon } from "lucide-react";
import { classNames } from "@/lib/format";
import { useAppState } from "@/lib/store/state";
import type { InboxTab } from "@/lib/types";
import EmptyState from "../ui/EmptyState";
import AppInboxCard from "./AppInboxCard";
import AppSectionHeader from "./AppSectionHeader";
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
  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chipsRef.current?.querySelector("[data-selected=true]")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [tab]);

  const words = query.trim().toLowerCase();
  const shown = words ? items.filter((item) => matchesSearch(state, item, words)) : items;

  return (
    <div className="h-full flex flex-col">
      <AppSectionHeader title="Inbox" query={query} onQueryChange={setQuery}>
        <div ref={chipsRef} className="-mx-4 px-4 mt-3 pb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {tabs.map((item) => {
            const selected = tab === item.key;
            const count = counts[item.key];
            return (
              <button
                key={item.key}
                data-selected={selected}
                onClick={() => onTabChange(item.key)}
                className={classNames(
                  "shrink-0 h-8 px-3 rounded-full border text-[12px] font-semibold flex items-center gap-1.5 transition",
                  selected ? "bg-[#0C2660] border-[#0C2660] text-white" : "bg-white border-zinc-200 text-zinc-700"
                )}
              >
                {item.label}
                {count > 0 && (
                  <span
                    className={classNames(
                      "min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-extrabold grid place-items-center",
                      selected ? "bg-[#D4A551] text-[#0C2660]" : urgentTabs.includes(item.key) ? "bg-red-500 text-white" : "bg-[#eef1f7] text-[#0C2660]"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </AppSectionHeader>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-2.5">
        {shown.length === 0 ? (
          <EmptyState icon={<InboxIcon size={20} />} title="Nothing here" description={words ? "No match for your search." : emptyText[tab]} />
        ) : (
          shown.map((item) => <AppInboxCard key={item.key} tab={tab} item={item} now={now} onOpenChat={onOpenChat} />)
        )}
      </div>
    </div>
  );
}
