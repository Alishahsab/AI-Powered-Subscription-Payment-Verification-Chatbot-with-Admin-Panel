"use client";

import { useState } from "react";
import { ArrowLeft, Search, Users } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { timeAgo } from "@/lib/format";
import { customerNumberLabel } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Navigate } from "../navigation";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { Card } from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import WhatsAppLink from "../ui/WhatsAppLink";
import BlockCustomerButton from "./BlockCustomerButton";
import { inputClass } from "../ui/styles";

export default function Customers({ onNavigate }: { onNavigate: Navigate }) {
  const state = useAppState();
  const now = useNow(30_000);
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();

  const rows = state.customers
    .filter((customer) => !search || customer.email.includes(search) || customer.whatsapp?.includes(search) || customerNumberLabel(customer).includes(search))
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt);

  return (
    <div className="h-full">
      <div className="h-full max-w-[1200px] mx-auto p-4 lg:p-7 flex flex-col gap-5">
        <div className="shrink-0 flex flex-wrap items-end justify-between gap-3">
          <div>
            <button
              onClick={() => onNavigate({ section: "dashboard" })}
              className="mb-3 inline-flex items-center gap-1.5 h-9 pl-2.5 pr-3.5 rounded-xl bg-[#0C2660] text-white text-[13px] font-semibold shadow-[0_6px_16px_-8px_rgba(12,38,96,0.6)] hover:bg-[#0a1f52] active:scale-[0.98] transition"
            >
              <ArrowLeft size={16} /> Dashboard
            </button>
            <h1 className="text-[22px] font-semibold tracking-tight">Customer list</h1>
            <p className="text-[13.5px] text-zinc-500 mt-0.5">{state.customers.length} customers. Each one sees only their own chat.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="WhatsApp, email or ID" className={`${inputClass} pl-8`} />
          </div>
        </div>

        <Card className="overflow-hidden flex-1 min-h-0 flex flex-col">
          {rows.length === 0 ? (
            <EmptyState icon={<Users size={20} />} title="No customers found" />
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="hidden md:table w-full text-[13px]">
                <thead className="sticky top-0 z-10">
                  <tr className="text-left text-white bg-[linear-gradient(90deg,#0c2660_0%,#14327a_100%)]">
                    <th className="font-medium px-5 py-2.5 w-32">ID</th>
                    <th className="font-medium px-3 py-2.5 w-56">WhatsApp</th>
                    <th className="font-medium px-3 py-2.5 w-40">Last active</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((customer) => (
                    <tr key={customer.id} className="border-b border-zinc-200 last:border-0 hover:bg-zinc-50/70">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0C2660] tabular-nums">{customerNumberLabel(customer)}</span>
                          {customer.blocked && <Badge tone="red">Blocked</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {customer.whatsapp ? <WhatsAppLink number={customer.whatsapp} /> : <span className="text-zinc-400">Not added</span>}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">{timeAgo(customer.lastSeenAt, now)}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" onClick={() => onNavigate({ section: "bot", customerId: customer.id })}>
                            Chat
                          </Button>
                          <BlockCustomerButton customer={customer} compact />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="md:hidden divide-y divide-zinc-200">
                {rows.map((customer) => (
                  <li key={customer.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0C2660] tabular-nums">{customerNumberLabel(customer)}</span>
                        {customer.blocked && <Badge tone="red">Blocked</Badge>}
                      </div>
                      <div className="mt-1 text-[13.5px]">
                        {customer.whatsapp ? <WhatsAppLink number={customer.whatsapp} /> : <span className="text-zinc-400">No WhatsApp yet</span>}
                      </div>
                      <div className="mt-0.5 text-[12px] text-zinc-500">Active {timeAgo(customer.lastSeenAt, now)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Button size="sm" onClick={() => onNavigate({ section: "bot", customerId: customer.id })}>
                        Chat
                      </Button>
                      <BlockCustomerButton customer={customer} compact />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
