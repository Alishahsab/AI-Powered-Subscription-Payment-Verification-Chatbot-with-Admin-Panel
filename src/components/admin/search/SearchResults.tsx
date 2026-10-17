"use client";

import { MessageSquare, Receipt, Search, User } from "lucide-react";
import { formatDateTime, formatMoney } from "@/lib/format";
import { findCustomerName } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Navigate } from "../navigation";
import { Card } from "../ui/Card";
import EmptyState from "../ui/EmptyState";

type SearchResultsProps = {
  query: string;
  onNavigate: Navigate;
};

export default function SearchResults({ query, onNavigate }: SearchResultsProps) {
  const state = useAppState();
  const text = query.trim();
  const lower = text.toLowerCase();

  const customers = text ? state.customers.filter((customer) => customer.name.toLowerCase().includes(lower) || customer.email.includes(lower)) : [];
  const orders = text ? state.orders.filter((order) => order.id.toLowerCase().includes(lower) || order.senderName?.toLowerCase().includes(lower)) : [];
  const messages = text ? state.messages.filter((message) => message.kind === "text" && message.text.toLowerCase().includes(lower)) : [];
  const total = customers.length + orders.length + messages.length;

  const roleLabel = { customer: "Customer", admin: "You", bot: "Auto-reply" };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[900px] mx-auto p-4 lg:p-7 space-y-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Search results</h1>
          <p className="text-[13.5px] text-zinc-500 mt-0.5">{text ? `${total} result${total === 1 ? "" : "s"} for "${text}"` : "Type to search"}</p>
        </div>

        {text && total === 0 && (
          <Card>
            <EmptyState icon={<Search size={20} />} title="No matches" description="Try a code, name, email, order number or any word from a chat." />
          </Card>
        )}

        <ResultGroup title="Messages" icon={<MessageSquare size={15} />} count={messages.length}>
          {messages.slice(0, 50).map((message) => (
            <ResultRow key={message.id} onClick={() => onNavigate({ section: "inbox", customerId: message.customerId, tab: "general" })}>
              <div className="min-w-0">
                <div className="text-[12px] text-zinc-500">
                  {findCustomerName(state, message.customerId)} · {roleLabel[message.sender]} · {formatDateTime(message.createdAt)}
                </div>
                <div className="text-zinc-800 truncate">
                  <Highlight text={message.text} query={text} />
                </div>
              </div>
            </ResultRow>
          ))}
        </ResultGroup>

        <ResultGroup title="Customers" icon={<User size={15} />} count={customers.length}>
          {customers.map((customer) => (
            <ResultRow key={customer.id} onClick={() => onNavigate({ section: "inbox", customerId: customer.id, tab: "general" })}>
              <span className="font-medium">
                <Highlight text={customer.name} query={text} />
              </span>
              <span className="text-zinc-500 ml-auto">
                <Highlight text={customer.email} query={text} />
              </span>
            </ResultRow>
          ))}
        </ResultGroup>

        <ResultGroup title="Orders" icon={<Receipt size={15} />} count={orders.length}>
          {orders.map((order) => (
            <ResultRow key={order.id} onClick={() => onNavigate({ section: "inbox", customerId: order.customerId, tab: order.status === "pending_review" ? "pending" : "completed" })}>
              <span className="font-medium">
                <Highlight text={order.id} query={text} />
              </span>
              <span className="text-zinc-500">
                {findCustomerName(state, order.customerId)} · {order.planName} · {formatMoney(order.amount)}
              </span>
            </ResultRow>
          ))}
        </ResultGroup>
      </div>
    </div>
  );
}

function ResultGroup({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <Card>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 text-[13px] font-semibold">
        {icon} {title} <span className="text-zinc-400 font-normal">{count}</span>
      </div>
      <div className="divide-y divide-zinc-100">{children}</div>
    </Card>
  );
}

function ResultRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full text-left px-5 py-3 hover:bg-zinc-50 text-[13px] flex items-center gap-3">
      {children}
    </button>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0 || !query) return <>{text}</>;

  const start = Math.max(0, index - 40);
  const end = index + query.length;

  return (
    <>
      {start > 0 && "…"}
      {text.slice(start, index)}
      <mark className="bg-amber-200/70 text-zinc-900 rounded px-0.5">{text.slice(index, end)}</mark>
      {text.slice(end, end + 80)}
      {end + 80 < text.length && "…"}
    </>
  );
}
