"use client";

import { useState } from "react";
import { MessageSquare, Search, Users } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { formatMoney, timeAgo } from "@/lib/format";
import { customerNumberLabel, findLatestCode } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Navigate } from "../navigation";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { Card } from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import BlockCustomerButton from "./BlockCustomerButton";
import DeleteCustomerButton from "./DeleteCustomerButton";
import { inputClass } from "../ui/styles";

export default function Customers({ onNavigate }: { onNavigate: Navigate }) {
  const state = useAppState();
  const now = useNow(30_000);
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();

  const rows = state.customers
    .filter((customer) => !search || customer.email.includes(search) || customerNumberLabel(customer).includes(search))
    .map((customer) => {
      const completed = state.orders.filter((order) => order.customerId === customer.id && order.status === "completed");
      return {
        customer,
        orderCount: completed.length,
        spent: completed.reduce((sum, order) => sum + order.amount, 0),
        code: findLatestCode(state, customer.id),
      };
    })
    .sort((a, b) => b.customer.lastSeenAt - a.customer.lastSeenAt);

  return (
    <div className="h-full">
      <div className="h-full max-w-[1200px] mx-auto p-4 lg:p-7 flex flex-col gap-5">
        <div className="shrink-0 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Customers</h1>
            <p className="text-[13.5px] text-zinc-500 mt-0.5">{state.customers.length} customers. Each one sees only their own chat.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Email or customer ID" className={`${inputClass} pl-8`} />
          </div>
        </div>

        <Card className="overflow-hidden flex-1 min-h-0 flex flex-col">
          {rows.length === 0 ? (
            <EmptyState icon={<Users size={20} />} title="No customers found" />
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 z-10">
                  <tr className="text-left text-white bg-[linear-gradient(90deg,#0c2660_0%,#14327a_100%)]">
                    <th className="font-medium px-5 py-2.5">ID</th>
                    <th className="font-medium px-3 py-2.5">Email</th>
                    <th className="font-medium px-3 py-2.5">Current code</th>
                    <th className="font-medium px-3 py-2.5">Orders</th>
                    <th className="font-medium px-3 py-2.5">Spent</th>
                    <th className="font-medium px-3 py-2.5">Last active</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ customer, orderCount, spent, code }) => (
                    <tr key={customer.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0C2660] tabular-nums">{customerNumberLabel(customer)}</span>
                          {customer.blocked && <Badge tone="red">Blocked</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={customer.email} size={28} />
                          <span className="font-medium text-zinc-800">{customer.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {code?.code ? (
                          <span className="flex items-center gap-1.5">
                            <span className="font-semibold tabular-nums">{code.code}</span>
                            {code.codeUnused && <Badge tone="amber">Unused</Badge>}
                          </span>
                        ) : (
                          <span className="text-zinc-400">None</span>
                        )}
                      </td>
                      <td className="px-3 py-3 tabular-nums">{orderCount}</td>
                      <td className="px-3 py-3 tabular-nums">{formatMoney(spent)}</td>
                      <td className="px-3 py-3 text-zinc-500 whitespace-nowrap">{timeAgo(customer.lastSeenAt, now)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" onClick={() => onNavigate({ section: "inbox", customerId: customer.id, tab: "bot" })}>
                            <MessageSquare size={13} /> Chat
                          </Button>
                          <BlockCustomerButton customer={customer} compact />
                          <DeleteCustomerButton customerId={customer.id} email={customer.email} compact />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
