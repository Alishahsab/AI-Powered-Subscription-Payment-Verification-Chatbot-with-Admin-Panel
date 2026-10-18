"use client";

import { Inbox as InboxIcon } from "lucide-react";
import { classNames, timeAgo } from "@/lib/format";
import type { InboxTab } from "../navigation";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import type { ChatFilter, InboxItem } from "./inboxItems";

const tabs: { key: InboxTab; label: string; urgent: boolean }[] = [
  { key: "general", label: "Chats", urgent: true },
  { key: "active", label: "Active orders", urgent: false },
  { key: "pending", label: "Payment pending", urgent: true },
  { key: "completed", label: "Completed", urgent: false },
  { key: "unused", label: "Unused codes", urgent: false },
  { key: "cancelled", label: "Cancelled", urgent: false },
  { key: "issues", label: "App issues", urgent: true },
];

const emptyText: Record<InboxTab, string> = {
  general: "No conversations here yet.",
  active: "Orders waiting for the customer to pay show up here.",
  pending: "New payment submissions will appear here instantly.",
  completed: "Approved orders will show up here.",
  unused: "Move a completed order here when its code has not been used yet.",
  cancelled: "Cancelled, expired and rejected orders show up here.",
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

      <div className="mt-3 px-5 flex flex-wrap gap-1.5 pb-3 border-b border-zinc-200/80">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={classNames(
              "h-8 px-3 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 transition",
              tab === item.key ? "bg-[#0C2660] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
            )}
          >
            {item.label}
            {counts[item.key] > 0 && (
              <span
                className={classNames(
                  "text-[10.5px] font-bold rounded-full min-w-[18px] h-[18px] px-1 grid place-items-center",
                  tab === item.key ? "bg-white/20 text-white" : item.urgent ? "bg-red-500 text-white" : "bg-zinc-300 text-zinc-700"
                )}
              >
                {counts[item.key]}
              </span>
            )}
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
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-bold text-[#0C2660] bg-[#0C2660]/[0.07] rounded px-1.5 py-0.5 shrink-0">{item.tag}</span>
                      <span className={classNames("text-[13.5px] truncate", item.unread ? "font-bold text-zinc-900" : "font-semibold text-zinc-800")}>{item.title}</span>
                    </span>
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
