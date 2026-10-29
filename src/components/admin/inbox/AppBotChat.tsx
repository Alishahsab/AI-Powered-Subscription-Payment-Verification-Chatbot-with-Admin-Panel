"use client";

import { useState } from "react";
import { useCategorySwipe } from "@/hooks/useCategorySwipe";
import { useShowMore } from "@/hooks/useShowMore";
import { Inbox as InboxIcon } from "lucide-react";
import { chatListTime, classNames, formatMoney } from "@/lib/format";
import { useAppState } from "@/lib/store/state";
import CustomerAvatar from "../ui/CustomerAvatar";
import type { Navigate } from "../navigation";
import EmptyState from "../ui/EmptyState";
import AppSectionHeader from "./AppSectionHeader";
import CategoryChips from "./CategoryChips";
import { matchesSearch, titleFit, type BotFilter, type InboxItem } from "./inboxItems";

const filters: { key: BotFilter; label: string; dot: string }[] = [
  { key: "active_chats", label: "Active chats", dot: "bg-[#22c55e]" },
  { key: "active_orders", label: "Active orders", dot: "bg-[#0a84ff]" },
  { key: "cancelled", label: "Cancelled", dot: "bg-[#c38763]" },
  { key: "inactive_chats", label: "Inactive", dot: "bg-[#9ca3af]" },
];

const emptyText: Record<BotFilter, string> = {
  active_orders: "Orders waiting for the customer to pay show up here.",
  cancelled: "Cancelled and expired orders show up here.",
  active_chats: "Customers active right now show up here.",
  inactive_chats: "Customers who have gone quiet show up here.",
};

const badgeTones = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
  gray: "bg-zinc-100 text-zinc-600",
};

type AppBotChatProps = {
  filter: BotFilter;
  onFilterChange: (filter: BotFilter) => void;
  counts: Record<BotFilter, number>;
  items: InboxItem[];
  now: number;
  onOpenChat: (customerId: string) => void;
  onNavigate?: Navigate;
};

export default function AppBotChat({ filter, onFilterChange, counts, items, now, onOpenChat, onNavigate }: AppBotChatProps) {
  const state = useAppState();
  const [query, setQuery] = useState("");
  const { select, slide, swipe } = useCategorySwipe(filters.map((option) => option.key), filter, onFilterChange, {
    before: () => onNavigate?.({ section: "inbox", tab: state.settings.inboxTabs.at(-1)?.key }),
    after: () => onNavigate?.({ section: "settings" }),
  });

  const words = query.trim().toLowerCase();
  const shown = words ? items.filter((item) => matchesSearch(state, item, words)) : items;
  const { visible, sentinel, hasMore } = useShowMore(shown, `${filter}-${words}`);
  const isOrderList = filter === "active_orders" || filter === "cancelled";

  return (
    <div className="h-full flex flex-col">
      <AppSectionHeader title="Bot chat" query={query} onQueryChange={setQuery}>
        <CategoryChips chips={filters.map((option) => ({ ...option, count: counts[option.key] }))} selected={filter} onSelect={select} />
      </AppSectionHeader>

      <div key={filter} {...swipe} className={`${slide} flex-1 min-h-0 overflow-y-auto px-4 pb-4`}>
        {shown.length === 0 ? (
          <EmptyState icon={<InboxIcon size={20} />} title="Nothing here" description={words ? "No match for your search." : emptyText[filter]} />
        ) : (
          <div className="rounded-3xl bg-white py-1 shadow-[0_10px_30px_-24px_rgba(12,38,96,0.55)] divide-y divide-zinc-100">
            {visible.map((item) => {
              const order = isOrderList ? state.orders.find((entry) => entry.id === item.key) : undefined;
              const unreadCount = isOrderList ? 0 : (state.conversations[item.customerId]?.unreadByAdmin ?? 0);
              const timeLeft = order && filter === "active_orders" ? Math.max(0, (order.expiresAt - now) / (order.expiresAt - order.createdAt)) : 0;

              return (
                <button key={item.key} onClick={() => onOpenChat(item.customerId)} className="w-full flex items-center gap-[11px] px-3.5 py-2.5 text-left">
                  <CustomerAvatar customerId={item.customerId} size={44} />
                  <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                    <span className="flex items-center gap-1.5">
                      <span className="shrink-0 rounded-[5px] bg-[#0C2660]/[0.07] px-1.5 py-px text-[10.5px] font-bold text-[#0C2660]">{item.tag}</span>
                      <span className={classNames(titleFit(item.title), "text-[13.5px] font-bold text-zinc-900")}>{item.title}</span>
                      <span className={classNames("ml-auto shrink-0 text-[10.5px]", item.unread ? "font-bold text-[#0C2660]" : "font-semibold text-zinc-400")}>{chatListTime(item.time, now)}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={classNames("truncate text-[12px]", item.unread ? "font-semibold text-zinc-700" : "text-zinc-500")}>
                        {order ? (
                          <>
                            <b className="font-semibold text-zinc-800">{order.planName}</b> · {formatMoney(order.amount)}
                            {filter === "active_orders" && ` · ${order.methodName}`}
                          </>
                        ) : (
                          item.subtitle
                        )}
                      </span>
                      {unreadCount > 0 && (
                        <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0C2660] text-white text-[10px] font-bold grid place-items-center">{unreadCount}</span>
                      )}
                    </span>
                    {item.badge && (
                      <span>
                        <span className={classNames("inline-block rounded-full px-[7px] py-0.5 text-[10px] font-bold", badgeTones[item.badge.tone])}>{item.badge.label}</span>
                      </span>
                    )}
                    {filter === "active_orders" && (
                      <span className="mt-0.5 h-1 rounded bg-[#eef1f7] overflow-hidden">
                        <span className="block h-full rounded bg-[#0a84ff]" style={{ width: `${timeLeft * 100}%` }} />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {hasMore && <div ref={sentinel} className="h-10" />}
      </div>
    </div>
  );
}
