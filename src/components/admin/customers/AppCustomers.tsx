"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { classNames, timeAgo } from "@/lib/format";
import { customerNumberLabel } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import { whatsAppLink } from "@/lib/validation";
import AppSectionHeader from "../inbox/AppSectionHeader";
import { isCustomerActive } from "../inbox/inboxItems";
import type { Navigate } from "../navigation";
import CustomerAvatar from "../ui/CustomerAvatar";
import EmptyState from "../ui/EmptyState";
import WhatsAppIcon from "../ui/WhatsAppIcon";
import BlockCustomerButton from "./BlockCustomerButton";

type Filter = "all" | "active" | "blocked";

export default function AppCustomers({ onNavigate }: { onNavigate: Navigate }) {
  const state = useAppState();
  const now = useNow(30_000);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const words = query.trim().toLowerCase();

  const customers = [...state.customers].sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  const active = customers.filter((customer) => !customer.blocked && isCustomerActive(state, customer.id, now));
  const blocked = customers.filter((customer) => customer.blocked);
  const lists: Record<Filter, typeof customers> = { all: customers, active, blocked };

  const chips: { key: Filter; label: string; count: number; dot?: string }[] = [
    { key: "all", label: "All", count: customers.length },
    { key: "active", label: "Active now", count: active.length, dot: "bg-[#22c55e]" },
    { key: "blocked", label: "Blocked", count: blocked.length, dot: "bg-red-500" },
  ];

  const rows = lists[filter].filter(
    (customer) => !words || customer.email.toLowerCase().includes(words) || customer.whatsapp?.includes(words) || customerNumberLabel(customer).toLowerCase().includes(words)
  );

  return (
    <div className="h-full flex flex-col">
      <AppSectionHeader title="Customers" query={query} onQueryChange={setQuery} placeholder="WhatsApp, email or ID" onBack={() => onNavigate({ section: "dashboard" })}>
        <p className="mt-0.5 text-[12px] text-zinc-500">{customers.length} customers · each one sees only their own chat</p>
        <div className="-mx-4 px-4 mt-3 pb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {chips.map((chip) => {
            const selected = filter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                className={classNames(
                  "shrink-0 h-8 px-3 rounded-full border text-[12px] font-semibold flex items-center gap-1.5 transition",
                  selected ? "bg-[#0C2660] border-[#0C2660] text-white" : "bg-white border-zinc-200 text-zinc-700"
                )}
              >
                {chip.dot && <span className={`size-[7px] rounded-full ${chip.dot}`} />}
                {chip.label}
                <span className={classNames("min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-extrabold grid place-items-center", selected ? "bg-[#D4A551] text-[#0C2660]" : "bg-[#eef1f7] text-[#0C2660]")}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </AppSectionHeader>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {rows.length === 0 ? (
          <EmptyState icon={<Users size={20} />} title="No customers found" description={words ? "No match for your search." : undefined} />
        ) : (
          <ul className="rounded-3xl bg-white py-1 shadow-[0_10px_30px_-24px_rgba(12,38,96,0.55)] divide-y divide-zinc-100">
            {rows.map((customer) => (
              <li key={customer.id} className="flex items-center gap-2.5 px-3 py-2.5">
                <CustomerAvatar customerId={customer.id} size={44} />
                <div className="flex-1 min-w-0 flex flex-col">
                  {customer.whatsapp ? (
                    <a href={whatsAppLink(customer.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[14px] font-extrabold text-zinc-900 whitespace-nowrap">
                      <WhatsAppIcon size={13} />
                      {customer.whatsapp}
                    </a>
                  ) : (
                    <span className="text-[14px] font-bold text-zinc-400">No WhatsApp</span>
                  )}
                  <span className="truncate text-[11.5px] text-zinc-500">{customer.email}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <span className="rounded-[5px] bg-[#0C2660]/[0.07] px-1.5 py-px text-[10.5px] font-extrabold text-[#0C2660]">{customerNumberLabel(customer)}</span>
                    {timeAgo(customer.lastSeenAt, now)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => onNavigate({ section: "bot", customerId: customer.id })} className="h-[30px] px-3 rounded-full bg-[#eef1f7] text-[12px] font-bold text-[#0C2660]">
                    Chat
                  </button>
                  <BlockCustomerButton customer={customer} pill />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
