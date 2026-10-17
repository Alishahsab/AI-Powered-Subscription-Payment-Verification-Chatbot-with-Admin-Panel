"use client";

import { Inbox as InboxIcon } from "lucide-react";
import { classNames, timeAgo } from "@/lib/format";
import type { InboxTab } from "../navigation";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import type { ChatFilter, InboxItem } from "./inboxItems";

const tabs: { key: InboxTab; label: string }[] = [
  { key: "general", label: "General Chat" },
  { key: "pending", label: "Pending Orders" },
  { key: "completed", label: "Completed" },
  { key: "issues", label: "App Issues" },
];

type ChatListProps = {
  tab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  filter: ChatFilter;
  onFilterChange: (filter: ChatFilter) => void;
  counts: Record<InboxTab, number>;
  items: InboxItem[];
  selectedCustomerId?: string;
  onSelect: (customerId: string) => void;
  now: number;
};

export default function ChatList({ tab, onTabChange, filter, onFilterChange, counts, items, selectedCustomerId, onSelect, now }: ChatListProps) {
  return (
    <>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-[17px] font-semibold tracking-tight">Inbox</h1>
      </div>

      <div className="px-3 grid grid-cols-2 gap-1 pb-3">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={classNames(
              "h-8 px-2.5 rounded-md text-[12.5px] font-medium flex items-center justify-between gap-1.5",
              tab === item.key ? "bg-[#0C2660] text-white" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
            )}
          >
            {item.label}
            {counts[item.key] > 0 && (
              <span className={classNames("text-[10.5px] rounded-full min-w-4 h-4 px-1 grid place-items-center", tab === item.key ? "bg-white/20" : "bg-red-500 text-white")}>{counts[item.key]}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="px-3 pb-3 flex gap-1 border-b border-zinc-100">
          {(["active", "inactive"] as ChatFilter[]).map((option) => (
            <button
              key={option}
              onClick={() => onFilterChange(option)}
              className={classNames(
                "flex-1 h-8 rounded-md text-[12.5px] font-medium flex items-center justify-center gap-1.5 border",
                filter === option ? "border-[#0C2660] text-[#0C2660] bg-[#0C2660]/5" : "border-zinc-200 text-zinc-500"
              )}
            >
              <span className={classNames("size-1.5 rounded-full", option === "active" ? "bg-emerald-500" : "bg-zinc-400")} />
              {option === "active" ? "Active" : "Non-active"}
            </button>
          ))}
        </div>
      )}

      <div className={classNames("flex-1 overflow-y-auto", tab !== "general" && "border-t border-zinc-100")}>
        {items.length === 0 ? (
          <EmptyState icon={<InboxIcon size={20} />} title="Nothing here" description={tab === "pending" ? "New payment submissions will appear here instantly." : "All caught up."} />
        ) : (
          items.map((item) => (
            <button
              key={item.key}
              onClick={() => onSelect(item.customerId)}
              className={classNames("w-full text-left px-4 py-3 flex gap-3 border-b border-zinc-100 transition", selectedCustomerId === item.customerId ? "bg-zinc-100/80" : "hover:bg-zinc-50")}
            >
              <Avatar name={item.title} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={classNames("text-[13.5px] truncate", item.unread ? "font-semibold text-zinc-900" : "font-medium text-zinc-800")}>{item.title}</span>
                  <span className="text-[11px] text-zinc-400 shrink-0">{timeAgo(item.time, now)}</span>
                </div>
                <div className="text-[12.5px] text-zinc-500 truncate mt-0.5">{item.subtitle}</div>
                {item.badge && (
                  <div className="mt-1.5">
                    <Badge tone={item.badge.tone}>{item.badge.label}</Badge>
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}
