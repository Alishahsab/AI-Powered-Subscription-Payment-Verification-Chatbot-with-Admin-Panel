"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowUp, Check, ChevronRight, Copy, CreditCard, HelpCircle, LifeBuoy, Lock, MessageSquare,
  ShoppingBag, Upload, X, Clock, Mail, Landmark, ImageIcon, LayoutGrid,
} from "lucide-react";
import {
  askFaq, backToMenu, cancelOrder, chooseMenu, chooseMethod, choosePlan, chooseSupport, createOrder, howItWorks,
  isPayable, markCustomerRead, openChat, requestOtherBank, saveEmail, sendCustomerMessage, submitProof, submitTicket,
  useStore, type MenuOption, activeOrder,
} from "@/lib/store";
import { receiptSvg } from "@/lib/seed";
import type { Customer, Message, Order, State } from "@/lib/types";
import { compressImage, copyText, countdown, effectiveStatus, fmtDateTime, fmtTime, statusMeta } from "@/lib/utils";
import { Monogram, useNow } from "@/components/shared";

export default function ChatView({ customer, onBack, showBack = true }: { customer: Customer; onBack: () => void; showBack?: boolean }) {
  const s = useStore();
  const conv = s.conversations[customer.id];
  const msgs = s.messages.filter((m) => m.customerId === customer.id);
  const status = effectiveStatus(s.settings);
  const meta = statusMeta[status];
  const scroller = useRef<HTMLDivElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    openChat(customer.id);
  }, [customer.id]);

  useEffect(() => {
    markCustomerRead(customer.id);
  }, [customer.id, msgs.length]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs.length, conv?.typing, conv?.stage]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* header */}
      <div className={`flex items-center gap-3 h-16 md:h-[72px] border-b border-[var(--line)] bg-[var(--surface)] z-10 ${showBack ? "px-3" : "px-6"}`}>
        {showBack && (
          <button onClick={onBack} className="size-10 grid place-items-center rounded-full hover:bg-black/5" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        )}
        <Monogram size={40} />
        <div className="flex-1 min-w-0">
          <div className="font-[family-name:var(--font-display)] font-bold text-[17px] md:text-[18px] leading-tight">{s.settings.storeName}</div>
          <div className="flex items-center gap-1.5 text-[12.5px] md:text-[13px] text-[var(--muted)]">
            <span className={`size-2 rounded-full ${meta.dot}`} />
            {conv?.typing ? "typing…" : conv?.mode === "human" ? "Chatting with our team" : `${meta.label} · ${meta.hint}`}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[12.5px] text-[var(--muted)]">
          <Lock size={13} /> Private chat
        </div>
      </div>

      {/* messages */}
      <div ref={scroller} className="flex-1 overflow-y-auto scroll-thin">
        <div className="max-w-[860px] mx-auto px-4 md:px-8 py-5 md:py-7 space-y-1.5">
          <div className="mx-auto mb-5 w-fit max-w-[90%] text-center text-[12px] text-[var(--muted)] bg-[var(--surface)] border border-[var(--line)] rounded-full px-3.5 py-1.5 flex items-center gap-1.5">
            <Lock size={12} /> Private chat · visible only to you and {s.settings.storeName}
          </div>
          {msgs.map((m, i) => (
            <Bubble key={m.id} m={m} prev={msgs[i - 1]} s={s} />
          ))}
          {conv?.typing && <Typing />}
        </div>
      </div>

      {/* dock */}
      {customer.blocked ? (
        <div className="p-5 border-t border-[var(--line)] text-center text-[13px] text-[var(--muted)]">
          Your access has been restricted. Please contact support on our official channel.
        </div>
      ) : (
        conv && !conv.typing && <Dock s={s} customer={customer} onUpload={() => setUploadOpen(true)} />
      )}

      {uploadOpen && <UploadSheet s={s} customer={customer} onClose={() => setUploadOpen(false)} />}
    </div>
  );
}

// ---------------- messages ----------------

function Bubble({ m, prev, s }: { m: Message; prev?: Message; s: State }) {
  const mine = m.from === "user";
  const startsGroup = !prev || prev.from !== m.from;
  const gap = startsGroup ? "pt-2.5" : "";

  if (m.kind === "account") return <div className={`rise ${gap}`}><Row mine={false} first={startsGroup} from={m.from}><AccountCard m={m} s={s} /></Row></div>;
  if (m.kind === "code") return <div className={`rise ${gap}`}><Row mine={false} first={startsGroup} from={m.from}><CodeCard m={m} s={s} /></Row></div>;
  if (m.kind === "proof") return <div className={`rise ${gap}`}><Row mine first={startsGroup} from={m.from}><ProofCard m={m} s={s} /></Row></div>;

  return (
    <div className={`rise ${gap}`}>
      <Row mine={mine} first={startsGroup} from={m.from}>
        <div
          className={`relative px-3.5 pt-2 pb-1.5 rounded-2xl text-[15.5px] md:text-[16px] leading-[1.55] whitespace-pre-line ${
            mine
              ? "bg-[var(--accent)] text-[var(--accent-ink)] rounded-br-md"
              : m.from === "admin"
              ? "bg-[var(--surface-2)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] rounded-bl-md"
              : "bg-[var(--surface)] border border-[var(--line)] rounded-bl-md"
          }`}
        >
          {m.text}
          <span className={`ml-2 inline-block translate-y-0.5 text-[10.5px] ${mine ? "text-[var(--accent-ink)]/60" : "text-[var(--muted)]"}`}>
            {fmtTime(m.createdAt)}
          </span>
        </div>
      </Row>
    </div>
  );
}

function Row({ mine, first, from, children }: { mine: boolean; first: boolean; from: Message["from"]; children: React.ReactNode }) {
  if (mine) return <div className="flex justify-end"><div className="max-w-[82%] md:max-w-[68%]">{children}</div></div>;
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 shrink-0">{first && <Monogram size={28} className="rounded-lg" />}</div>
      <div className="max-w-[82%] md:max-w-[68%] min-w-0">
        {first && from === "admin" && <div className="text-[11.5px] text-[var(--accent)] font-semibold mb-1 ml-1">{"Premium Store Team"}</div>}
        {children}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-end gap-2 pt-2.5 fade">
      <Monogram size={28} className="rounded-lg" />
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--surface)] border border-[var(--line)] flex gap-1">
        <span className="typing-dot size-1.5 rounded-full bg-[var(--muted)]" />
        <span className="typing-dot size-1.5 rounded-full bg-[var(--muted)]" />
        <span className="typing-dot size-1.5 rounded-full bg-[var(--muted)]" />
      </div>
    </div>
  );
}

function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await copyText(value.replace(/\s/g, ""));
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 h-7 rounded-lg bg-black/[0.05] hover:bg-black/[0.08] transition"
    >
      {done ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      {done ? "Copied" : label ?? "Copy"}
    </button>
  );
}

function AccountCard({ m, s }: { m: Message; s: State }) {
  const now = useNow(1000);
  const o = s.orders.find((x) => x.id === m.orderId);
  if (!o) return null;
  const method = s.methods.find((x) => x.id === o.methodId);
  const payable = isPayable(o, now);
  const total = s.settings.accountTimerMin * 60_000;
  const left = o.expiresAt - now;
  const pct = Math.max(0, Math.min(100, (left / total) * 100));

  return (
    <div className="w-[320px] md:w-[380px] max-w-full rounded-2xl rounded-bl-md overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-[0_6px_20px_-12px_rgba(15,23,42,0.25)]">
      <div className="px-4 pt-3.5 pb-3 border-b border-[var(--line)] flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold">Order {o.id}</div>
          <div className="font-semibold text-[15px] mt-0.5">{o.planName}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[var(--muted)]">Amount</div>
          <div className="font-bold text-[17px] text-[var(--accent)]">Rs {o.amount.toLocaleString()}</div>
        </div>
      </div>

      {payable && method ? (
        <div className="px-4 py-3.5 space-y-3">
          <div className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
            <CreditCard size={14} /> Send payment via <span className="text-[var(--text)] font-semibold">{method.name}</span>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] text-[var(--muted)]">Account number</div>
                <div className="font-bold text-[16px] tracking-wide">{method.accountNumber}</div>
              </div>
              <CopyBtn value={method.accountNumber} />
            </div>
            <div className="h-px bg-[var(--line)]" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[var(--muted)]">Account title</div>
                <div className="font-semibold text-[14px]">{method.accountTitle}</div>
              </div>
              <CopyBtn value={String(o.amount)} label="Amount" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--muted)]"><Clock size={12} /> Details hide in</span>
              <span className={`font-bold tabular-nums ${left < 5 * 60_000 ? "text-red-600" : "text-[var(--text)]"}`}>{countdown(left)}</span>
            </div>
            <div className="h-1 rounded-full bg-black/[0.05] overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${left < 5 * 60_000 ? "bg-red-400" : "bg-[var(--accent)]"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
          {o.status === "rejected" && (
            <div className="text-[12.5px] text-red-700 bg-red-500/10 rounded-lg px-3 py-2">Previous proof rejected: {o.rejectReason}</div>
          )}
        </div>
      ) : (
        <div className="px-4 py-4 flex items-center gap-3">
          <div className="size-9 rounded-full grid place-items-center bg-black/[0.04] text-[var(--muted)] shrink-0">
            <Lock size={15} />
          </div>
          <div className="text-[13px] leading-snug">
            <div className="font-semibold">
              {o.status === "pending_review" ? "Payment under review" : o.status === "approved" ? "Paid · code delivered" : o.status === "cancelled" ? "Order cancelled" : "Order expired"}
            </div>
            <div className="text-[var(--muted)]">Payment details hidden for your security</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProofCard({ m, s }: { m: Message; s: State }) {
  const o = s.orders.find((x) => x.id === m.orderId);
  return (
    <div className="w-[240px] md:w-[280px] rounded-2xl rounded-br-md overflow-hidden bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface))] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)]">
      {o?.screenshot ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={o.screenshot} alt="Payment screenshot" className="w-full h-36 object-cover object-top" />
      ) : (
        <div className="h-20 grid place-items-center text-[12px] text-[var(--muted)]">
          <span className="flex items-center gap-1.5"><ImageIcon size={14} /> Screenshot removed</span>
        </div>
      )}
      <div className="px-3 py-2.5 text-[12.5px]">
        <div className="font-semibold flex items-center gap-1.5"><Check size={13} className="text-[var(--accent)]" /> Payment proof submitted</div>
        <div className="text-[var(--muted)] mt-0.5">TID {o?.tid ?? "—"} · {fmtTime(m.createdAt)}</div>
      </div>
    </div>
  );
}

function CodeCard({ m, s }: { m: Message; s: State }) {
  const o = s.orders.find((x) => x.id === m.orderId);
  if (!o?.code) return null;
  return (
    <div className="w-[320px] md:w-[380px] max-w-full rounded-2xl rounded-bl-md overflow-hidden border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[var(--surface)] shadow-[0_6px_20px_-12px_rgba(15,23,42,0.25)]">
      <div className="px-4 pt-4 pb-3 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_16%,transparent),transparent)]">
        <div className="text-[12px] text-[var(--muted)]">Your premium code for</div>
        <div className="font-bold text-[16px]">{o.planName}</div>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-[var(--bg)]/70 border border-[var(--line)] px-3.5 py-3">
          <div className="font-[family-name:var(--font-display)] font-extrabold text-[24px] tracking-[0.2em] text-[var(--accent)] tabular-nums">{o.code}</div>
          <CopyBtn value={o.code} />
        </div>
      </div>
      <div className="px-4 py-3 text-[12.5px] text-[var(--muted)] space-y-1.5 border-t border-[var(--line)]">
        <div>Open the app → Profile → Subscription → Redeem code.</div>
        <div className="flex items-center gap-1.5 text-[var(--text)]/80"><Check size={13} className="text-emerald-600" /> Saved in Order History · {fmtDateTime(o.reviewedAt ?? m.createdAt)}</div>
        {o.emailSent && o.email && <div className="flex items-center gap-1.5"><Mail size={13} /> Also sent to {o.email}</div>}
      </div>
    </div>
  );
}

// ---------------- dock ----------------

function Dock({ s, customer, onUpload }: { s: State; customer: Customer; onUpload: () => void }) {
  const conv = s.conversations[customer.id];
  const cid = customer.id;
  const order = activeOrder(s, cid);
  const back = (
    <button onClick={() => backToMenu(cid)} className="text-[13px] text-[var(--muted)] hover:text-[var(--text)] px-2 py-1.5 flex items-center justify-center gap-1.5 mx-auto md:col-span-2 w-fit">
      <LayoutGrid size={14} /> Main menu
    </button>
  );

  const wrap = (children: React.ReactNode) => (
    <div className="border-t border-[var(--line)] bg-[var(--surface)] px-4 md:px-8 pt-3 pb-4 md:pt-4 md:pb-5 rise max-h-[52%] overflow-y-auto scroll-thin">
      <div className="max-w-[860px] mx-auto">{children}</div>
    </div>
  );

  switch (conv.stage) {
    case "menu": {
      const opts: { k: MenuOption; icon: React.ReactNode; d: string }[] = [
        { k: "buy", icon: <ShoppingBag size={19} />, d: "Plans & payment" },
        { k: "faq", icon: <HelpCircle size={19} />, d: "Quick answers" },
        { k: "support", icon: <LifeBuoy size={19} />, d: "App or code issue" },
        { k: "general", icon: <MessageSquare size={19} />, d: "Talk to our team" },
      ];
      const labels: Record<MenuOption, string> = { buy: "Buy a Subscription", faq: "FAQs", support: "Customer Support", general: "General Chat" };
      return wrap(
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {opts.map((o) => (
            <button
              key={o.k}
              onClick={() => chooseMenu(cid, o.k)}
              className={`text-left rounded-xl p-3 border transition active:scale-[0.98] ${
                o.k === "buy"
                  ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
                  : "bg-[var(--surface)] border-[var(--line)] hover:border-black/15"
              }`}
            >
              <div className={o.k === "buy" ? "text-[var(--accent)]" : "text-[var(--text)]/85"}>{o.icon}</div>
              <div className="mt-2 font-semibold text-[13.5px] leading-tight">{labels[o.k]}</div>
              <div className="text-[11.5px] text-[var(--muted)] mt-0.5">{o.d}</div>
            </button>
          ))}
        </div>
      );
    }
    case "choose_plan":
      return wrap(
        <div className="grid md:grid-cols-2 gap-2">
          {s.plans.filter((p) => p.active).map((p, i) => {
            const base = s.plans[0].price * p.months;
            const save = p.months > 1 ? Math.round((1 - p.price / base) * 100) : 0;
            return (
              <button key={p.id} onClick={() => choosePlan(cid, p.id)} className="w-full flex items-center justify-between rounded-xl px-4 py-3 bg-[var(--surface)] border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition text-left">
                <div>
                  <div className="font-semibold text-[14.5px] flex items-center gap-2">
                    {p.name}
                    {i === 2 && <span className="text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-ink)]">Popular</span>}
                  </div>
                  <div className="text-[12px] text-[var(--muted)]">Rs {Math.round(p.price / p.months)}/month{save > 0 ? ` · save ${save}%` : ""}</div>
                </div>
                <div className="font-bold text-[15px]">Rs {p.price.toLocaleString()}</div>
              </button>
            );
          })}
          {back}
        </div>
      );
    case "choose_method":
      return wrap(
        <div className="grid md:grid-cols-2 gap-2">
          {s.methods.filter((m) => m.active).map((m) => (
            <button key={m.id} onClick={() => chooseMethod(cid, m.id)} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 bg-[var(--surface)] border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition text-left">
              <div className="size-9 rounded-lg bg-[var(--surface-2)] grid place-items-center font-bold text-[13px]">{m.name[0]}</div>
              <span className="font-semibold text-[14.5px] flex-1">{m.name}</span>
              <ChevronRight size={16} className="text-[var(--muted)]" />
            </button>
          ))}
          <button onClick={() => chooseMethod(cid, "other")} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 bg-[var(--surface)] border border-[var(--line)] hover:border-black/15 transition text-left">
            <div className="size-9 rounded-lg bg-[var(--surface-2)] grid place-items-center"><Landmark size={16} /></div>
            <span className="font-semibold text-[14.5px] flex-1">Other bank</span>
            <ChevronRight size={16} className="text-[var(--muted)]" />
          </button>
          {back}
        </div>
      );
    case "other_bank":
      return wrap(<><Composer placeholder="Type your bank name, e.g. Meezan Bank" onSend={(t) => requestOtherBank(cid, t)} />{back}</>);
    case "terms":
      return wrap(
        <div className="space-y-2">
          <button onClick={() => createOrder(cid)} className="w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px]">
            I agree — create order
          </button>
          <button onClick={() => howItWorks(cid)} className="w-full h-11 rounded-xl bg-[var(--surface)] border border-[var(--line)] font-semibold text-[14px]">
            How does it work?
          </button>
          {back}
        </div>
      );
    case "awaiting_payment":
      if (!order || !isPayable(order)) return wrap(back);
      return wrap(
        <div className="space-y-2">
          <button onClick={onUpload} className="w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px] flex items-center justify-center gap-2">
            <Upload size={17} /> Upload payment proof
          </button>
          <button onClick={() => cancelOrder(cid)} className="w-full h-10 rounded-xl text-[13.5px] text-[var(--muted)] hover:text-red-700">
            Cancel order
          </button>
        </div>
      );
    case "email_capture":
      return wrap(<EmailForm cid={cid} />);
    case "faq":
      return wrap(
        <div className="grid md:grid-cols-2 gap-1.5 md:gap-2">
          {s.faqs.map((f) => (
            <button key={f.id} onClick={() => askFaq(cid, f.id)} className="w-full text-left text-[13.5px] rounded-xl px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--line)] hover:border-black/15 flex items-center justify-between gap-2">
              {f.q} <ChevronRight size={15} className="text-[var(--muted)] shrink-0" />
            </button>
          ))}
          {back}
        </div>
      );
    case "support_category":
      return wrap(
        <div className="grid md:grid-cols-2 gap-1.5 md:gap-2">
          {s.settings.supportCategories.map((c) => (
            <button key={c} onClick={() => chooseSupport(cid, c)} className="w-full text-left text-[14px] font-medium rounded-xl px-4 py-3 bg-[var(--surface)] border border-[var(--line)] hover:border-black/15 flex items-center justify-between">
              {c} <ChevronRight size={15} className="text-[var(--muted)]" />
            </button>
          ))}
          {back}
        </div>
      );
    case "support_describe":
      return wrap(<><Composer multiline placeholder="Describe the issue…" onSend={(t) => submitTicket(cid, t)} />{back}</>);
    case "live":
      return wrap(
        <>
          {conv.mode === "human" && (
            <div className="text-[11.5px] text-center text-[var(--muted)] mb-2">You&apos;re chatting with the {s.settings.storeName} team</div>
          )}
          <Composer placeholder="Type a message" onSend={(t) => sendCustomerMessage(cid, t)} />
          {back}
        </>
      );
  }
}

function Composer({ placeholder, onSend, multiline }: { placeholder: string; onSend: (t: string) => void; multiline?: boolean }) {
  const [t, setT] = useState("");
  const send = () => {
    if (!t.trim()) return;
    onSend(t.trim());
    setT("");
  };
  return (
    <div className="flex items-end gap-2">
      {multiline ? (
        <textarea
          autoFocus
          value={t}
          onChange={(e) => setT(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="flex-1 resize-none rounded-2xl bg-[var(--surface)] border border-[var(--line)] px-4 py-3 text-[14.5px] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] placeholder:text-[#9aa1ab]"
        />
      ) : (
        <input
          autoFocus
          value={t}
          onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={placeholder}
          className="flex-1 h-12 rounded-full bg-[var(--surface)] border border-[var(--line)] px-5 text-[14.5px] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] placeholder:text-[#9aa1ab]"
        />
      )}
      <button onClick={send} disabled={!t.trim()} className="size-12 shrink-0 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] grid place-items-center disabled:opacity-40 transition" aria-label="Send">
        <ArrowUp size={20} />
      </button>
    </div>
  );
}

function EmailForm({ cid }: { cid: string }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="space-y-2">
      <input
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        inputMode="email"
        className="w-full h-12 rounded-xl bg-[var(--surface)] border border-[var(--line)] px-4 text-[14.5px] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] placeholder:text-[#9aa1ab]"
      />
      {err && <div className="text-[12.5px] text-red-600">{err}</div>}
      <div className="flex gap-2">
        <button onClick={() => saveEmail(cid, null)} className="flex-1 h-11 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[14px] font-medium">Skip</button>
        <button
          onClick={() => (/^\S+@\S+\.\S+$/.test(email) ? saveEmail(cid, email.trim()) : setErr("Please enter a valid email."))}
          className="flex-[2] h-11 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[14px]"
        >
          Save email
        </button>
      </div>
    </div>
  );
}

// ---------------- upload sheet ----------------

function sampleReceipt(o: Order) {
  const tid = String(Math.floor(1e10 + Math.random() * 9e10));
  return { tid, img: receiptSvg(o.amount, tid, o.methodName, Date.now()) };
}

function UploadSheet({ s, customer, onClose }: { s: State; customer: Customer; onClose: () => void }) {
  const order = activeOrder(s, customer.id) as Order | undefined;
  const [img, setImg] = useState<string | null>(null);
  const [tid, setTid] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const now = useNow(1000);

  if (!order) return null;
  const pick = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErr("Please choose an image file.");
    setErr("");
    setImg(await compressImage(f));
  };
  const fillSample = () => {
    const r = sampleReceipt(order);
    setImg(r.img);
    setTid(r.tid);
  };
  const submit = () => {
    if (!img) return setErr("Please attach your payment screenshot.");
    setBusy(true);
    const e = submitProof(customer.id, img, tid);
    setBusy(false);
    if (e) return setErr(e);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end md:justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-black/40 fade" onClick={onClose} />
      <div className="sheet relative bg-[var(--surface)] rounded-t-[26px] md:rounded-3xl border-t md:border border-[var(--line)] px-5 md:px-7 pt-3 md:pt-6 pb-6 max-h-[92%] md:w-full md:max-w-[520px] overflow-y-auto scroll-thin shadow-2xl">
        <div className="mx-auto w-10 h-1 rounded-full bg-black/15 mb-4" />
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-[18px]">Upload payment proof</div>
            <div className="text-[13px] text-[var(--muted)] mt-0.5">
              Order {order.id} · Rs {order.amount.toLocaleString()} · {countdown(order.expiresAt - now)} left
            </div>
          </div>
          <button onClick={onClose} className="size-9 grid place-items-center rounded-full hover:bg-black/5 -mr-2"><X size={18} /></button>
        </div>

        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <button
          onClick={() => file.current?.click()}
          className="mt-5 w-full rounded-2xl border border-dashed border-black/15 bg-[var(--bg)]/50 hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] transition overflow-hidden"
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="Selected screenshot" className="w-full max-h-64 object-contain bg-black/30" />
          ) : (
            <div className="py-9 flex flex-col items-center gap-2 text-[var(--muted)]">
              <div className="size-11 rounded-full bg-black/[0.04] grid place-items-center text-[var(--text)]"><ImageIcon size={19} /></div>
              <div className="text-[14px] font-semibold text-[var(--text)]">Choose screenshot</div>
              <div className="text-[12px]">PNG or JPG from your gallery</div>
            </div>
          )}
        </button>
        {img && (
          <button onClick={() => file.current?.click()} className="mt-2 text-[12.5px] text-[var(--muted)] hover:text-[var(--text)]">Change screenshot</button>
        )}

        <label className="block mt-4">
          <span className="text-[13px] font-medium">Transaction ID (TID)</span>
          <input
            value={tid}
            onChange={(e) => setTid(e.target.value)}
            placeholder="e.g. 01234567890"
            inputMode="numeric"
            className="mt-1.5 w-full h-12 rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 text-[15px] tracking-wide outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] placeholder:text-[#9aa1ab]"
          />
          <span className="text-[11.5px] text-[var(--muted)] mt-1 block">Shown on your payment receipt. Each transaction ID can be used once.</span>
        </label>

        {err && <div className="mt-3 text-[13px] text-red-700 bg-red-500/10 rounded-lg px-3 py-2">{err}</div>}

        <button onClick={submit} disabled={busy} className="mt-5 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[15px] disabled:opacity-60">
          Submit for verification
        </button>
        <button onClick={fillSample} className="mt-3 w-full text-[12px] text-[var(--muted)] hover:text-[var(--text)]">
          Use a sample receipt (demo)
        </button>
      </div>
    </div>
  );
}
