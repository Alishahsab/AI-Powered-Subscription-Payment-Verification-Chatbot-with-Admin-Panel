"use client";

import { Inbox as InboxIcon } from "lucide-react";
import { classNames, timeAgo } from "@/lib/format";
import type { InboxTab } from "../navigation";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import type { ChatFilter, InboxItem } from "./inboxItems";

const tabs: { key: InboxTab; label: string }[] = [
  { key: "general", label: "Chats" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "issues", label: "Issues" },
];

const emptyText: Record<InboxTab, string> = {
  general: "No conversations here yet.",
  pending: "New payment submissions will appear here instantly.",
  completed: "Approved orders will show up here.",
  issues: "No problems reported. All caught up.",
};

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
      <div className="px-5 pt-5">
        <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">Inbox</h1>
      </div>

      <div className="mt-3 px-5 flex gap-5 border-b border-zinc-200/80">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={classNames(
              "relative pb-2.5 text-[13.5px] font-semibold flex items-center gap-1.5 transition",
              tab === item.key ? "text-[#0C2660]" : "text-zinc-400 hover:text-zinc-700"
            )}
          >
            {item.label}
            {counts[item.key] > 0 && <span className="text-[10.5px] font-bold rounded-full min-w-[18px] h-[18px] px-1 grid place-items-center bg-red-500 text-white">{counts[item.key]}</span>}
            {tab === item.key && <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-[#0C2660]" />}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="px-5 pt-3 pb-1">
          <div className="inline-flex rounded-lg bg-zinc-100 p-0.5">
            {(["active", "inactive"] as ChatFilter[]).map((option) => (
              <button
                key={option}
                onClick={() => onFilterChange(option)}
                className={classNames(
                  "h-7 px-3 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 transition",
                  filter === option ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <span className={classNames("size-1.5 rounded-full", option === "active" ? "bg-emerald-500" : "bg-zinc-400")} />
                {option === "active" ? "Active" : "Non-active"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2.5 py-2">
        {items.length === 0 ? (
          <EmptyState icon={<InboxIcon size={20} />} title="Nothing here" description={emptyText[tab]} />
        ) : (
          items.map((item) => {
            const selected = selectedCustomerId === item.customerId;
            return (
              <button
                key={item.key}
                onClick={() => onSelect(item.customerId)}
                className={classNames("w-full text-left px-3 py-3 rounded-xl flex gap-3 transition mb-0.5", selected ? "bg-[#0C2660]/[0.06]" : "hover:bg-zinc-50")}
              >
                <Avatar name={item.title} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={classNames("text-[14px] truncate", item.unread ? "font-bold text-zinc-900" : "font-semibold text-zinc-800")}>{item.title}</span>
                    <span className={classNames("text-[11.5px] shrink-0", item.unread ? "text-[#0C2660] font-semibold" : "text-zinc-400")}>{timeAgo(item.time, now)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={classNames("flex-1 text-[12.5px] truncate", item.unread ? "text-zinc-700" : "text-zinc-500")}>{item.subtitle}</span>
                    {item.unread && <span className="size-2 rounded-full bg-[#0C2660] shrink-0" />}
                  </div>
                  {item.badge && (
                    <div className="mt-1.5">
                      <Badge tone={item.badge.tone}>{item.badge.label}</Badge>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
