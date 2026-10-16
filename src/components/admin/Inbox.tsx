"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Bot, Check, CheckCircle2, Copy, Hand, ImageIcon, Inbox as InboxIcon, KeyRound, Mail, MessageSquareText,
  PanelRight, Send, ShieldAlert, X, XCircle, Zap,
} from "lucide-react";
import {
  adminSend, approveOrder, markAdminRead, rejectOrder, rejectReasons, resolveTicket, setMode, toggleBlock, useStore,
} from "@/lib/store";
import type { Message, Order, State } from "@/lib/types";
import { copyText, cx, fmtDateTime, fmtTime, rs, timeAgo } from "@/lib/utils";
import { useNow } from "@/components/shared";
import { Avatar, Badge, Btn, Empty, inputCls } from "./ui";

export type InboxTab = "general" | "pending" | "completed" | "issues";

const tabs: { k: InboxTab; label: string }[] = [
  { k: "general", label: "General Chat" },
  { k: "pending", label: "Pending Orders" },
  { k: "completed", label: "Completed" },
  { k: "issues", label: "App Issues" },
];

type Item = { key: string; customerId: string; title: string; sub: string; at: number; unread: number; badge?: React.ReactNode };

function buildItems(s: State, tab: InboxTab, now: number): Item[] {
  const name = (id: string) => s.customers.find((c) => c.id === id)?.name ?? "Customer";
  if (tab === "pending")
    return s.orders
      .filter((o) => o.status === "pending_review")
      .sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0))
      .map((o) => ({
        key: o.id, customerId: o.customerId, title: name(o.customerId), sub: `${o.planName} · ${rs(o.amount)} · ${o.methodName}`, at: o.submittedAt ?? o.createdAt,
        unread: 1, badge: <Badge tone="amber">waiting {timeAgo(o.submittedAt ?? o.createdAt, now).replace(" ago", "")}</Badge>,
      }));
  if (tab === "completed")
    return s.orders
      .filter((o) => o.status === "approved")
      .sort((a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0))
      .map((o) => ({ key: o.id, customerId: o.customerId, title: name(o.customerId), sub: `${o.planName} · code ${o.code}`, at: o.reviewedAt ?? o.createdAt, unread: 0, badge: <Badge tone="green">Delivered</Badge> }));
  if (tab === "issues")
    return s.tickets
      .slice()
      .sort((a, b) => (a.status === b.status ? b.createdAt - a.createdAt : a.status === "open" ? -1 : 1))
      .map((t) => ({
        key: t.id, customerId: t.customerId, title: name(t.customerId), sub: `${t.category}: ${t.message}`, at: t.createdAt,
        unread: t.status === "open" ? 1 : 0, badge: t.status === "open" ? <Badge tone="red">Open · {t.id}</Badge> : <Badge>Resolved</Badge>,
      }));
  return Object.values(s.conversations)
    .filter((c) => c.mode === "human" || s.messages.some((m) => m.customerId === c.customerId && m.topic === "general"))
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
    .map((c) => {
      const last = [...s.messages].reverse().find((m) => m.customerId === c.customerId);
      return {
        key: c.customerId, customerId: c.customerId, title: name(c.customerId),
        sub: last ? (last.from === "user" ? "" : "You: ") + preview(last) : "", at: c.lastMessageAt, unread: c.unreadAdmin,
        badge: c.mode === "human" ? <Badge tone="blue">Live</Badge> : undefined,
      };
    });
}

function preview(m: Message) {
  if (m.kind === "account") return "Order created";
  if (m.kind === "proof") return "Payment proof submitted";
  if (m.kind === "code") return "Code delivered";
  return m.text;
}

export default function Inbox({ initialTab, initialCustomer }: { initialTab?: InboxTab; initialCustomer?: string }) {
  const s = useStore();
  const now = useNow(15_000);
  const [tab, setTab] = useState<InboxTab>(initialTab ?? "pending");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const items = useMemo(() => buildItems(s, tab, now), [s, tab, now]);
  const counts = useMemo(
    () => ({
      general: Object.values(s.conversations).filter((c) => c.unreadAdmin > 0 && (c.mode === "human" || s.messages.some((m) => m.customerId === c.customerId && m.topic === "general"))).length,
      pending: s.orders.filter((o) => o.status === "pending_review").length,
      completed: 0,
      issues: s.tickets.filter((t) => t.status === "open").length,
    }),
    [s]
  );

  const [isDesktop] = useState(() => window.innerWidth >= 1024);
  const [chosen, setSel] = useState<string | undefined>(initialCustomer);
  const sel = chosen ?? (isDesktop ? items[0]?.customerId : undefined);

  useEffect(() => {
    if (sel) markAdminRead(sel);
  }, [sel, s.messages.length]);

  return (
    <div className="h-full flex">
      {/* list */}
      <div className={cx("w-full lg:w-[340px] shrink-0 border-r border-zinc-200/80 bg-white flex flex-col", sel && "hidden lg:flex")}>
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-[17px] font-semibold tracking-tight">Inbox</h1>
        </div>
        <div className="px-3 grid grid-cols-2 gap-1 border-b border-zinc-100 pb-3">
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cx("h-8 px-2.5 rounded-md text-[12.5px] font-medium whitespace-nowrap flex items-center justify-between gap-1.5", tab === t.k ? "bg-[#0C2660] text-white" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100")}
            >
              {t.label}
              {!!counts[t.k] && <span className={cx("text-[10.5px] rounded-full min-w-4 h-4 px-1 grid place-items-center", tab === t.k ? "bg-white/20" : "bg-red-500 text-white")}>{counts[t.k]}</span>}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin">
          {!items.length ? (
            <Empty icon={<InboxIcon size={20} />} title="Nothing here" desc={tab === "pending" ? "New payment submissions will appear here instantly." : "All caught up."} />
          ) : (
            items.map((it) => (
              <button
                key={it.key}
                onClick={() => setSel(it.customerId)}
                className={cx("w-full text-left px-4 py-3 flex gap-3 border-b border-zinc-100 transition", sel === it.customerId ? "bg-zinc-100/80" : "hover:bg-zinc-50")}
              >
                <Avatar name={it.title} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cx("text-[13.5px] truncate", it.unread ? "font-semibold text-zinc-900" : "font-medium text-zinc-800")}>{it.title}</span>
                    <span className="text-[11px] text-zinc-400 shrink-0">{timeAgo(it.at, now)}</span>
                  </div>
                  <div className="text-[12.5px] text-zinc-500 truncate mt-0.5">{it.sub}</div>
                  {it.badge && <div className="mt-1.5">{it.badge}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* thread */}
      {sel ? (
        <>
          <Thread s={s} customerId={sel} onBack={() => setSel(undefined)} onDetails={() => setDetailsOpen(true)} />
          <div className="hidden xl:block w-[360px] shrink-0 border-l border-zinc-200/80 bg-white overflow-y-auto scroll-thin">
            <Details s={s} customerId={sel} />
          </div>
          {detailsOpen && (
            <div className="xl:hidden fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/30 fade" onClick={() => setDetailsOpen(false)} />
              <div className="absolute inset-y-0 right-0 w-full max-w-[380px] bg-white overflow-y-auto scroll-thin shadow-2xl">
                <div className="flex justify-end p-2"><button onClick={() => setDetailsOpen(false)} className="size-9 grid place-items-center rounded-lg hover:bg-zinc-100"><X size={18} /></button></div>
                <Details s={s} customerId={sel} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="hidden lg:grid flex-1 place-items-center">
          <Empty icon={<MessageSquareText size={20} />} title="Select a conversation" desc="Choose a chat or order from the list." />
        </div>
      )}
    </div>
  );
}

// ---------------- thread ----------------

const quickReplies = [
  "Payment received, verifying now. Please wait a few minutes.",
  "Please share a clearer screenshot of the payment.",
  "Please make sure you're logged in with the same Gmail in the app.",
  "Is everything clear? Let us know if you need help.",
];

function Thread({ s, customerId, onBack, onDetails }: { s: State; customerId: string; onBack: () => void; onDetails: () => void }) {
  const c = s.customers.find((x) => x.id === customerId);
  const conv = s.conversations[customerId];
  const msgs = s.messages.filter((m) => m.customerId === customerId);
  const [text, setText] = useState("");
  const [qr, setQr] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [msgs.length, customerId]);

  if (!c || !conv) return null;
  const send = (t = text) => {
    if (!t.trim()) return;
    adminSend(customerId, t.trim());
    setText("");
    setQr(false);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#f7f8fa]">
      <div className="h-14 shrink-0 bg-white border-b border-zinc-200/80 flex items-center gap-3 px-3 lg:px-5">
        <button onClick={onBack} className="lg:hidden size-9 grid place-items-center rounded-lg hover:bg-zinc-100"><ArrowLeft size={18} /></button>
        <Avatar name={c.name} size={32} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold truncate">{c.name}</div>
          <div className="text-[12px] text-zinc-500 truncate">{c.phone}{c.email ? ` · ${c.email}` : ""}</div>
        </div>
        <div className="flex items-center rounded-lg bg-zinc-100 p-0.5">
          <button onClick={() => setMode(customerId, "bot")} className={cx("h-7 px-2.5 rounded-md text-[12px] font-medium flex items-center gap-1.5", conv.mode === "bot" ? "bg-white shadow-sm" : "text-zinc-500")}>
            <Bot size={13} /> Auto
          </button>
          <button onClick={() => setMode(customerId, "human")} className={cx("h-7 px-2.5 rounded-md text-[12px] font-medium flex items-center gap-1.5", conv.mode === "human" ? "bg-white shadow-sm" : "text-zinc-500")}>
            <Hand size={13} /> Live
          </button>
        </div>
        <button onClick={onDetails} className="xl:hidden size-9 grid place-items-center rounded-lg hover:bg-zinc-100" title="Details"><PanelRight size={18} /></button>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto scroll-thin px-4 lg:px-8 py-5 space-y-2">
        {!msgs.length && <div className="text-center text-[12.5px] text-zinc-400 py-10">No messages (older chats are cleared automatically).</div>}
        {msgs.map((m) => (
          <AdminBubble key={m.id} m={m} s={s} />
        ))}
        {conv.typing && <div className="text-[12px] text-zinc-400 text-right pr-1">Auto-reply typing…</div>}
      </div>

      <div className="bg-white border-t border-zinc-200/80 p-3 lg:px-5">
        {conv.mode === "bot" && (
          <div className="text-[12px] text-zinc-500 mb-2 flex items-center gap-1.5">
            <Bot size={13} /> Auto-replies are on. Sending a message switches this chat to Live.
          </div>
        )}
        {qr && (
          <div className="mb-2 flex flex-wrap gap-1.5 fade">
            {quickReplies.map((q) => (
              <button key={q} onClick={() => send(q)} className="text-[12px] px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-left">{q}</button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button onClick={() => setQr((v) => !v)} className={cx("size-10 shrink-0 grid place-items-center rounded-lg border", qr ? "bg-[#0C2660] text-white border-[#0C2660]" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50")} title="Quick replies">
            <Zap size={16} />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={`Reply to ${c.name.split(" ")[0]}…`}
            className="flex-1 resize-none min-h-10 max-h-32 rounded-lg border border-zinc-200 px-3 py-2.5 text-[13.5px] outline-none focus:border-zinc-400"
          />
          <Btn variant="primary" className="h-10" onClick={() => send()} disabled={!text.trim()}>
            <Send size={15} /> Send
          </Btn>
        </div>
      </div>
    </div>
  );
}

function AdminBubble({ m, s }: { m: Message; s: State }) {
  const o = m.orderId ? s.orders.find((x) => x.id === m.orderId) : undefined;
  if (m.kind === "account" && o)
    return (
      <div className="flex justify-center">
        <div className="text-[11.5px] text-zinc-500 bg-white border border-zinc-200 rounded-full px-3 py-1">
          Order {o.id} created · {o.planName} · {rs(o.amount)} · {o.methodName} · {fmtTime(m.createdAt)}
        </div>
      </div>
    );
  if (m.kind === "code" && o)
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-[13px]">
          <div className="font-semibold text-emerald-800 flex items-center gap-1.5"><KeyRound size={14} /> Code sent · {o.planName}</div>
          <div className="font-mono text-[16px] tracking-[0.15em] text-emerald-900 mt-1">{o.code}</div>
          <div className="text-[11px] text-emerald-700/70 mt-0.5">{fmtDateTime(m.createdAt)}</div>
        </div>
      </div>
    );
  if (m.kind === "proof")
    return (
      <div className="flex">
        <div className="w-[200px] rounded-xl overflow-hidden bg-white border border-zinc-200">
          {o?.screenshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={o.screenshot} alt="" className="w-full h-32 object-cover object-top" />
          ) : (
            <div className="h-16 grid place-items-center text-[12px] text-zinc-400"><span className="flex items-center gap-1"><ImageIcon size={13} /> Removed</span></div>
          )}
          <div className="px-3 py-2 text-[12px]">
            <div className="font-medium">Payment proof</div>
            <div className="text-zinc-500">TID {o?.tid} · {fmtTime(m.createdAt)}</div>
          </div>
        </div>
      </div>
    );
  const mine = m.from !== "user";
  return (
    <div className={cx("flex", mine && "justify-end")}>
      <div className="max-w-[75%]">
        <div
          className={cx(
            "px-3.5 py-2 rounded-xl text-[13.5px] leading-relaxed whitespace-pre-line",
            m.from === "user" && "bg-white border border-zinc-200 text-zinc-800",
            m.from === "bot" && "bg-zinc-100 text-zinc-600",
            m.from === "admin" && "bg-[#0C2660] text-white"
          )}
        >
          {m.text}
        </div>
        <div className={cx("text-[10.5px] text-zinc-400 mt-0.5 px-1", mine && "text-right")}>
          {m.from === "bot" ? "Auto-reply · " : m.from === "admin" ? "You · " : ""}
          {fmtTime(m.createdAt)}
        </div>
      </div>
    </div>
  );
}

// ---------------- details ----------------

function Details({ s, customerId }: { s: State; customerId: string }) {
  const c = s.customers.find((x) => x.id === customerId);
  const orders = s.orders.filter((o) => o.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt);
  const focus = orders.find((o) => o.status === "pending_review") ?? orders[0];
  const tickets = s.tickets.filter((t) => t.customerId === customerId);
  if (!c) return null;
  const spent = orders.filter((o) => o.status === "approved").reduce((a, o) => a + o.amount, 0);

  return (
    <div className="divide-y divide-zinc-100">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size={44} />
          <div className="min-w-0">
            <div className="font-semibold text-[15px]">{c.name}</div>
            <div className="text-[12.5px] text-zinc-500">Customer since {fmtDateTime(c.createdAt).split(",")[0]}</div>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-[90px_1fr] gap-y-1.5 text-[12.5px]">
          <dt className="text-zinc-500">WhatsApp</dt><dd className="font-medium">{c.phone}</dd>
          <dt className="text-zinc-500">Email</dt><dd className="font-medium truncate">{c.email ?? "Not added"}</dd>
          <dt className="text-zinc-500">Orders</dt><dd className="font-medium">{orders.filter((o) => o.status === "approved").length} delivered · {rs(spent)}</dd>
        </dl>
        <div className="mt-3">
          <Btn size="sm" variant={c.blocked ? "secondary" : "danger"} onClick={() => toggleBlock(c.id)}>
            <ShieldAlert size={13} /> {c.blocked ? "Unblock customer" : "Block customer"}
          </Btn>
        </div>
      </div>

      {focus && <OrderPanel key={focus.id + focus.status} s={s} o={focus} />}

      {tickets.map((t) => (
        <div key={t.id} className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-[12px] uppercase tracking-wider text-zinc-500 font-semibold">App issue · {t.id}</div>
            {t.status === "open" ? <Badge tone="red">Open</Badge> : <Badge>Resolved</Badge>}
          </div>
          <div className="mt-2 text-[13.5px] font-medium">{t.category}</div>
          <p className="text-[13px] text-zinc-600 mt-1 leading-relaxed">{t.message}</p>
          <div className="text-[11.5px] text-zinc-400 mt-1">{fmtDateTime(t.createdAt)}</div>
          <Btn size="sm" className="mt-3" onClick={() => resolveTicket(t.id, t.status === "open")}>
            <CheckCircle2 size={13} /> {t.status === "open" ? "Mark resolved" : "Reopen"}
          </Btn>
        </div>
      ))}

      <div className="p-5">
        <div className="text-[12px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Codes delivered</div>
        {orders.filter((o) => o.code).length ? (
          <div className="space-y-1.5">
            {orders.filter((o) => o.code).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-[12.5px] rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2">
                <div>
                  <div className="font-mono font-semibold tracking-wider text-[13px]">{o.code}</div>
                  <div className="text-zinc-500">{o.planName} · {fmtDateTime(o.reviewedAt ?? o.createdAt)}</div>
                </div>
                <CopySmall v={o.code!} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[12.5px] text-zinc-400">No codes yet.</div>
        )}
      </div>
    </div>
  );
}

function CopySmall({ v }: { v: string }) {
  const [d, setD] = useState(false);
  return (
    <button onClick={async () => { await copyText(v); setD(true); setTimeout(() => setD(false), 1200); }} className="size-7 grid place-items-center rounded-md hover:bg-zinc-200/70 text-zinc-500">
      {d ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
    </button>
  );
}

function OrderPanel({ s, o }: { s: State; o: Order }) {
  const [zoom, setZoom] = useState(false);
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [err, setErr] = useState("");
  const stock = s.codes.filter((k) => k.planId === o.planId && k.status === "available").length;
  const tidDup = o.tid ? s.orders.some((x) => x.id !== o.id && x.tid === o.tid) : false;

  const tone = { pending_review: "amber", approved: "green", rejected: "red", awaiting_payment: "blue", expired: "zinc", cancelled: "zinc" } as const;
  const label = { pending_review: "Pending review", approved: "Approved", rejected: "Rejected", awaiting_payment: "Awaiting payment", expired: "Expired", cancelled: "Cancelled" };

  const approve = (code?: string) => {
    const e = approveOrder(o.id, code);
    setErr(e ?? "");
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-[12px] uppercase tracking-wider text-zinc-500 font-semibold">Order {o.id}</div>
        <Badge tone={tone[o.status]}>{label[o.status]}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat k="Plan" v={o.planName} />
        <Stat k="Amount" v={rs(o.amount)} />
        <Stat k="Method" v={o.methodName} />
        <Stat k="TID" v={o.tid ?? "N/A"} mono />
      </div>
      {o.tid && (
        <div className={cx("mt-2 text-[12px] flex items-center gap-1.5", tidDup ? "text-red-600" : "text-emerald-700")}>
          {tidDup ? <XCircle size={13} /> : <CheckCircle2 size={13} />} {tidDup ? "This TID was used on another order" : "Transaction ID is unique"}
        </div>
      )}

      {o.screenshot && (
        <button onClick={() => setZoom(true)} className="mt-3 block w-full rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.screenshot} alt="Payment screenshot" className="w-full max-h-72 object-contain" />
        </button>
      )}
      <div className="mt-2 text-[11.5px] text-zinc-400">
        Created {fmtDateTime(o.createdAt)}{o.submittedAt ? ` · proof ${fmtTime(o.submittedAt)}` : ""}{o.email ? ` · email ${o.email}` : ""}
      </div>

      {o.status === "pending_review" && (
        <div className="mt-4 space-y-2">
          <Btn variant="success" className="w-full h-10" onClick={() => approve()} disabled={!stock}>
            <Check size={15} /> Approve & send code
          </Btn>
          <div className="text-[11.5px] text-center text-zinc-500">
            {stock ? `${stock} code${stock > 1 ? "s" : ""} left for ${o.planName}. The next one is assigned automatically` : `No codes left for ${o.planName}`}
          </div>
          {showManual ? (
            <div className="flex gap-2 fade">
              <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Enter code" className={cx(inputCls, "font-mono")} autoFocus />
              <Btn variant="primary" onClick={() => manual.trim() && approve(manual)}>Send</Btn>
            </div>
          ) : (
            <button onClick={() => setShowManual(true)} className="w-full text-[12.5px] text-zinc-600 hover:text-zinc-900">Enter a code manually</button>
          )}
          {showReject ? (
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-2 space-y-1 fade">
              {rejectReasons.map((r) => (
                <button key={r} onClick={() => rejectOrder(o.id, r)} className="w-full text-left text-[12.5px] px-2.5 py-1.5 rounded-md hover:bg-red-100 text-red-700">{r}</button>
              ))}
            </div>
          ) : (
            <Btn variant="danger" className="w-full" onClick={() => setShowReject(true)}><X size={14} /> Reject</Btn>
          )}
          {err && <div className="text-[12.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}
        </div>
      )}
      {o.status === "approved" && (
        <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-[12.5px] text-emerald-800">
          <div className="flex items-center justify-between">
            <span>Code delivered {fmtDateTime(o.reviewedAt!)}</span>
          </div>
          <div className="font-mono text-[17px] font-semibold tracking-[0.15em] mt-1">{o.code}</div>
          {o.emailSent && <div className="mt-1 flex items-center gap-1.5 text-emerald-700"><Mail size={12} /> Also emailed to {o.email}</div>}
        </div>
      )}
      {o.status === "rejected" && <div className="mt-3 text-[12.5px] text-red-700 bg-red-50 rounded-lg px-3 py-2">Rejected: {o.rejectReason}. Customer can upload new proof.</div>}

      {zoom && o.screenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-6 fade" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.screenshot} alt="Payment screenshot" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function Stat({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2">
      <div className="text-[11px] text-zinc-500">{k}</div>
      <div className={cx("text-[13px] font-semibold truncate", mono && "font-mono")}>{v}</div>
    </div>
  );
}
