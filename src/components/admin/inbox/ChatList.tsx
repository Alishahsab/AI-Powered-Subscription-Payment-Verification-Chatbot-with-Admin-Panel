"use client";

import { AlertTriangle, CheckCircle2, Hourglass, Inbox as InboxIcon, MessageCircle, PackageX, ShoppingBag, XCircle } from "lucide-react";
import { classNames, timeAgo } from "@/lib/format";
import type { InboxTab } from "../navigation";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import type { ChatFilter, InboxItem } from "./inboxItems";

const tabs: { key: InboxTab; label: string; urgent: boolean; icon: React.ReactNode; tint: string }[] = [
  { key: "general", label: "Chats", urgent: true, icon: <MessageCircle size={15} />, tint: "bg-sky-100 text-sky-700" },
  { key: "active", label: "Active orders", urgent: false, icon: <ShoppingBag size={15} />, tint: "bg-indigo-100 text-indigo-700" },
  { key: "pending", label: "Payment pending", urgent: true, icon: <Hourglass size={15} />, tint: "bg-amber-100 text-amber-700" },
  { key: "completed", label: "Completed", urgent: false, icon: <CheckCircle2 size={15} />, tint: "bg-emerald-100 text-emerald-700" },
  { key: "unused", label: "Unused codes", urgent: false, icon: <PackageX size={15} />, tint: "bg-orange-100 text-orange-700" },
  { key: "cancelled", label: "Cancelled", urgent: false, icon: <XCircle size={15} />, tint: "bg-zinc-200 text-zinc-600" },
  { key: "issues", label: "App issues", urgent: true, icon: <AlertTriangle size={15} />, tint: "bg-red-100 text-red-600" },
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

      <div className="mt-3 px-4 grid grid-cols-2 gap-2 pb-4 border-b border-zinc-200/80">
        {tabs.map((item, index) => {
          const selected = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={classNames(
                "h-11 pl-1.5 pr-2.5 rounded-xl border flex items-center gap-2 text-left transition",
                index === tabs.length - 1 && "col-span-2",
                selected ? "bg-[#0C2660] border-[#0C2660] text-white shadow-[0_8px_18px_-10px_#0C2660]" : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              <span className={classNames("size-8 rounded-lg grid place-items-center shrink-0", selected ? "bg-white/15 text-white" : item.tint)}>{item.icon}</span>
              <span className="flex-1 min-w-0 text-[12.5px] font-semibold truncate">{item.label}</span>
              {counts[item.key] > 0 && (
                <span
                  className={classNames(
                    "text-[10.5px] font-bold rounded-full min-w-[20px] h-5 px-1.5 grid place-items-center shrink-0",
                    selected ? "bg-white text-[#0C2660]" : item.urgent ? "bg-red-500 text-white" : "bg-zinc-200 text-zinc-700"
                  )}
                >
                  {counts[item.key]}
                </span>
              )}
            </button>
          );
        })}
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
