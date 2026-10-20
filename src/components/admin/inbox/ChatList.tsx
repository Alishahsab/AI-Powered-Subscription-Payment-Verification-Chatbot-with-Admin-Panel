"use client";

import { AlertTriangle, Ban, CheckCircle2, CreditCard, Hourglass, Inbox as InboxIcon, PackageX } from "lucide-react";
import { classNames, timeAgo } from "@/lib/format";
import { useAppState } from "@/lib/store/state";
import type { InboxTab } from "@/lib/types";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import type { BotFilter, InboxItem } from "./inboxItems";

const iconProps = { size: 15, strokeWidth: 2 };

const tabIcons: Record<InboxTab, React.ReactNode> = {
  pending: <Hourglass {...iconProps} />,
  issues: <AlertTriangle {...iconProps} />,
  payment_issues: <CreditCard {...iconProps} />,
  completed: <CheckCircle2 {...iconProps} />,
  unused: <PackageX {...iconProps} />,
  blocked: <Ban {...iconProps} />,
};

const urgentTabs: InboxTab[] = ["pending", "issues", "payment_issues"];

const botFilters: { key: BotFilter; label: string; dot: string }[] = [
  { key: "active_orders", label: "Active orders", dot: "bg-sky-500" },
  { key: "cancelled", label: "Cancelled", dot: "bg-zinc-400" },
  { key: "active_chats", label: "Active chats", dot: "bg-emerald-500" },
  { key: "inactive_chats", label: "Inactive chats", dot: "bg-zinc-300" },
];

const emptyText: Record<InboxTab | BotFilter, string> = {
  pending: "New payment submissions and rejected payments show up here.",
  issues: "No app issues reported. All caught up.",
  payment_issues: "Payment problems reported from the payment card show up here.",
  completed: "Approved orders will show up here.",
  unused: "Move a completed order here when its code has not been used yet.",
  blocked: "Customers you block show up here.",
  active_orders: "Orders waiting for the customer to pay show up here.",
  cancelled: "Cancelled and expired orders show up here.",
  active_chats: "Customers active right now show up here.",
  inactive_chats: "Customers who have gone quiet show up here.",
};

type ChatListProps = {
  view: "inbox" | "bot";
  tab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  botFilter: BotFilter;
  onBotFilterChange: (filter: BotFilter) => void;
  counts: Record<InboxTab, number>;
  botCounts: Record<BotFilter, number>;
  items: InboxItem[];
  selectedCustomerId?: string;
  onSelect: (customerId: string) => void;
  now: number;
};

export default function ChatList({ view, tab, onTabChange, botFilter, onBotFilterChange, counts, botCounts, items, selectedCustomerId, onSelect, now }: ChatListProps) {
  const state = useAppState();
  const isBot = view === "bot";

  return (
    <>
      <div className="px-5 pt-5">
        <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">{isBot ? "Bot chat" : "Inbox"}</h1>
      </div>

      {isBot ? (
        <div className="mt-3 px-4 pb-3.5 grid grid-cols-2 gap-1.5 border-b border-zinc-200/80">
          {botFilters.map((option) => (
            <button
              key={option.key}
              onClick={() => onBotFilterChange(option.key)}
              className={classNames(
                "h-9 px-2.5 rounded-lg border text-[12px] font-semibold flex items-center gap-1.5 transition",
                botFilter === option.key ? "bg-[#0C2660] border-[#0C2660] text-white" : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              <span className={classNames("size-2 rounded-full shrink-0", option.dot)} />
              <span className="flex-1 text-left truncate">{option.label}</span>
              <span className="tabular-nums opacity-70">{botCounts[option.key]}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 px-4 grid grid-cols-2 gap-1.5 pb-3.5 border-b border-zinc-200/80">
          {state.settings.inboxTabs.map((item) => {
            const selected = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={classNames(
                  "h-9 px-2.5 rounded-lg border flex items-center gap-2 text-left transition",
                  selected ? "bg-[#0C2660] border-[#0C2660] text-white" : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                <span className={classNames("shrink-0", selected ? "text-white" : "text-zinc-900")}>{tabIcons[item.key]}</span>
                <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{item.label}</span>
                {counts[item.key] > 0 && (
                  <span
                    className={classNames(
                      "text-[10.5px] font-bold rounded-full min-w-[20px] h-5 px-1.5 grid place-items-center shrink-0",
                      selected ? "bg-white text-[#0C2660]" : urgentTabs.includes(item.key) ? "bg-red-500 text-white" : "bg-zinc-200 text-zinc-700"
                    )}
                  >
                    {counts[item.key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-2.5 py-2">
        {items.length === 0 ? (
          <EmptyState icon={<InboxIcon size={20} />} title="Nothing here" description={emptyText[isBot ? botFilter : tab]} />
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
