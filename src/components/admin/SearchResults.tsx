"use client";

import { KeyRound, MessageSquare, Receipt, Search, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtDateTime, rs } from "@/lib/utils";
import { Badge, Card, Empty } from "./ui";
import type { Go } from "./AdminApp";

function Hl({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return <>{text}</>;
  const start = Math.max(0, i - 40);
  return (
    <>
      {start > 0 && "…"}
      {text.slice(start, i)}
      <mark className="bg-amber-200/70 text-zinc-900 rounded px-0.5">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length, i + q.length + 80)}
      {i + q.length + 80 < text.length && "…"}
    </>
  );
}

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  if (!count) return null;
  return (
    <Card>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 text-[13px] font-semibold">
        {icon} {title} <span className="text-zinc-400 font-normal">{count}</span>
      </div>
      <div className="divide-y divide-zinc-100">{children}</div>
    </Card>
  );
}

function Row({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full text-left px-5 py-3 hover:bg-zinc-50 text-[13px] flex items-center gap-3">
      {children}
    </button>
  );
}

export default function SearchResults({ query, go }: { query: string; go: Go }) {
  const s = useStore();
  const q = query.trim();
  const ql = q.toLowerCase();
  const name = (id?: string) => s.customers.find((c) => c.id === id)?.name ?? "Customer";

  const codes = q ? s.codes.filter((k) => k.value.includes(q)) : [];
  const orders = q ? s.orders.filter((o) => o.id.toLowerCase().includes(ql) || o.tid?.includes(q)) : [];
  const customers = q ? s.customers.filter((c) => c.name.toLowerCase().includes(ql) || c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) || c.email?.toLowerCase().includes(ql)) : [];
  const messages = q
    ? s.messages.filter((m) => (m.kind === "text" && m.text.toLowerCase().includes(ql)) || (m.kind === "code" && s.orders.find((o) => o.id === m.orderId)?.code?.includes(q)))
    : [];
  const total = codes.length + orders.length + customers.length + messages.length;

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="max-w-[900px] mx-auto p-4 lg:p-7 space-y-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Search results</h1>
          <p className="text-[13.5px] text-zinc-500 mt-0.5">{q ? `${total} result${total === 1 ? "" : "s"} for “${q}” across all chats` : "Type to search"}</p>
        </div>
        {q && !total && <Card><Empty icon={<Search size={20} />} title="No matches" desc="Try a code, phone number, order number, transaction ID or any word from a chat." /></Card>}

        <Section title="Codes" icon={<KeyRound size={15} />} count={codes.length}>
          {codes.map((k) => (
            <Row key={k.id} onClick={() => k.customerId ? go({ section: "inbox", customerId: k.customerId, tab: "completed" }) : go({ section: "codes" })}>
              <span className="font-mono font-semibold tracking-wider"><Hl text={k.value} q={q} /></span>
              {k.status === "assigned" ? <Badge>Sent</Badge> : <Badge tone="green">Available</Badge>}
              <span className="text-zinc-500 ml-auto">
                {k.status === "assigned" ? `${name(k.customerId)} · ${k.orderId} · ${fmtDateTime(k.assignedAt!)}` : s.plans.find((p) => p.id === k.planId)?.name}
              </span>
            </Row>
          ))}
        </Section>

        <Section title="Customers" icon={<User size={15} />} count={customers.length}>
          {customers.map((c) => (
            <Row key={c.id} onClick={() => go({ section: "inbox", customerId: c.id, tab: "general" })}>
              <span className="font-medium"><Hl text={c.name} q={q} /></span>
              <span className="text-zinc-500"><Hl text={c.phone} q={q} /></span>
              {c.email && <span className="text-zinc-400 ml-auto"><Hl text={c.email} q={q} /></span>}
            </Row>
          ))}
        </Section>

        <Section title="Orders" icon={<Receipt size={15} />} count={orders.length}>
          {orders.map((o) => (
            <Row key={o.id} onClick={() => go({ section: "inbox", customerId: o.customerId, tab: o.status === "pending_review" ? "pending" : "completed" })}>
              <span className="font-medium"><Hl text={o.id} q={q} /></span>
              <span className="text-zinc-500">{name(o.customerId)} · {o.planName} · {rs(o.amount)}</span>
              {o.tid && <span className="ml-auto text-zinc-400 font-mono">TID <Hl text={o.tid} q={q} /></span>}
            </Row>
          ))}
        </Section>

        <Section title="Messages" icon={<MessageSquare size={15} />} count={messages.length}>
          {messages.slice(0, 50).map((m) => (
            <Row key={m.id} onClick={() => go({ section: "inbox", customerId: m.customerId, tab: "general" })}>
              <div className="min-w-0">
                <div className="text-[12px] text-zinc-500">{name(m.customerId)} · {m.from === "user" ? "Customer" : m.from === "admin" ? "You" : "Auto-reply"} · {fmtDateTime(m.createdAt)}</div>
                <div className="text-zinc-800 truncate">
                  {m.kind === "code" ? <>Code sent: <Hl text={s.orders.find((o) => o.id === m.orderId)?.code ?? ""} q={q} /></> : <Hl text={m.text} q={q} />}
                </div>
              </div>
            </Row>
          ))}
        </Section>
      </div>
    </div>
  );
}
