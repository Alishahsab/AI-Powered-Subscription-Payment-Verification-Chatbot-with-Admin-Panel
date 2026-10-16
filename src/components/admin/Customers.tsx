"use client";

import { useState } from "react";
import { MessageSquare, Search, Users } from "lucide-react";
import { toggleBlock, useStore } from "@/lib/store";
import { cx, rs, timeAgo } from "@/lib/utils";
import { useNow } from "@/components/shared";
import { Avatar, Badge, Btn, Card, Empty, inputCls } from "./ui";
import type { Go } from "./AdminApp";

export default function Customers({ go }: { go: Go }) {
  const s = useStore();
  const now = useNow(30_000);
  const [q, setQ] = useState("");
  const ql = q.toLowerCase().trim();
  const rows = s.customers
    .filter((c) => !ql || c.name.toLowerCase().includes(ql) || c.phone.replace(/\s/g, "").includes(ql.replace(/\s/g, "")) || c.email?.toLowerCase().includes(ql))
    .map((c) => {
      const orders = s.orders.filter((o) => o.customerId === c.id && o.status === "approved");
      return { c, count: orders.length, spent: orders.reduce((a, o) => a + o.amount, 0) };
    })
    .sort((a, b) => b.c.lastSeenAt - a.c.lastSeenAt);

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="max-w-[1200px] mx-auto p-4 lg:p-7 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Customers</h1>
            <p className="text-[13.5px] text-zinc-500 mt-0.5">{s.customers.length} customers · each one sees only their own chat and orders.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, number or email" className={cx(inputCls, "pl-8")} />
          </div>
        </div>
        <Card>
          {!rows.length ? (
            <Empty icon={<Users size={20} />} title="No customers found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-100 bg-zinc-50/60">
                    <th className="font-medium px-5 py-2.5">Customer</th>
                    <th className="font-medium px-3 py-2.5">WhatsApp</th>
                    <th className="font-medium px-3 py-2.5">Email</th>
                    <th className="font-medium px-3 py-2.5">Codes</th>
                    <th className="font-medium px-3 py-2.5">Spent</th>
                    <th className="font-medium px-3 py-2.5">Last active</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ c, count, spent }) => (
                    <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.name} size={30} />
                          <span className="font-medium">{c.name}</span>
                          {c.blocked && <Badge tone="red">Blocked</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-3 tabular-nums">{c.phone}</td>
                      <td className="px-3 py-3 text-zinc-600">{c.email ?? <span className="text-zinc-400">—</span>}</td>
                      <td className="px-3 py-3 tabular-nums">{count}</td>
                      <td className="px-3 py-3 tabular-nums">{rs(spent)}</td>
                      <td className="px-3 py-3 text-zinc-500 whitespace-nowrap">{timeAgo(c.lastSeenAt, now)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Btn size="sm" onClick={() => go({ section: "inbox", customerId: c.id, tab: "general" })}><MessageSquare size={13} /> Chat</Btn>
                          <Btn size="sm" variant={c.blocked ? "secondary" : "ghost"} onClick={() => toggleBlock(c.id)}>{c.blocked ? "Unblock" : "Block"}</Btn>
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
