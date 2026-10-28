"use client";

import { useState } from "react";
import StoredImage from "@/components/StoredImage";
import { chatListTime, classNames, formatMoney, timeAgo } from "@/lib/format";
import { cancelOrderAsAdmin, setCodeUnused, setTicketResolved, unblockCustomer } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import type { InboxTab } from "@/lib/types";
import ConfirmDialog from "../ui/ConfirmDialog";
import CustomerAvatar from "../ui/CustomerAvatar";
import ApproveDialog from "./ApproveDialog";
import RejectDialog from "./RejectDialog";
import ReplyDialog from "./ReplyDialog";
import type { InboxItem } from "./inboxItems";

const accents: Record<InboxTab, string> = {
  pending: "bg-[#7a6248]",
  issues: "bg-[#ffb02e]",
  completed: "bg-[#00a884]",
  unused: "bg-[#7f66ff]",
  blocked: "bg-[#ef4444]",
};

const badgeTones = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
  gray: "bg-zinc-100 text-zinc-600",
  violet: "bg-violet-50 text-violet-700",
};

const button = "h-[30px] px-3.5 rounded-full text-[12px] font-bold transition active:scale-[0.97]";
const buttons = {
  navy: `${button} bg-[#0C2660] text-white shadow-[0_6px_14px_-8px_#0C2660]`,
  soft: `${button} bg-[#eef1f7] text-[#0C2660]`,
  reject: `${button} bg-red-50 text-red-700`,
  cancel: `${button} bg-amber-50 text-amber-800`,
  violet: `${button} bg-violet-50 text-violet-700`,
  unblock: `${button} bg-red-600 text-white shadow-[0_6px_14px_-8px_#dc2626]`,
};

type Dialog = "approve" | "reject" | "cancel" | "unused" | "resolve" | "reply" | "unblock";

type AppInboxCardProps = {
  tab: InboxTab;
  item: InboxItem;
  now: number;
  onOpenChat: (customerId: string) => void;
};

export default function AppInboxCard({ tab, item, now, onOpenChat }: AppInboxCardProps) {
  const state = useAppState();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);

  const customer = state.customers.find((entry) => entry.id === item.customerId);
  const order = state.orders.find((entry) => entry.id === item.key);
  const ticket = tab === "issues" ? state.tickets.find((entry) => entry.id === item.key) : undefined;
  const codeMessage = order?.code ? state.messages.find((message) => message.orderId === order.id && message.kind === "code") : undefined;
  const codeSentAt = order?.code ? (codeMessage?.createdAt ?? order.reviewedAt) : undefined;

  const showsCode = (tab === "completed" || tab === "unused") && Boolean(order?.code);
  const screenshot = showsCode ? undefined : (order?.screenshot ?? ticket?.screenshot);
  const badgeTone = tab === "unused" ? "violet" : item.badge?.tone;
  const customerName = customer?.email ?? "this customer";

  let details = "";
  if (tab === "pending" && order) details = `${formatMoney(order.amount)} · ${order.methodName}`;
  if ((tab === "completed" || tab === "unused") && order) details = codeSentAt ? `Code sent ${chatListTime(codeSentAt, now)}` : `Approved ${chatListTime(order.reviewedAt ?? order.createdAt, now)}`;
  if (ticket) details = ticket.orderId ? `${ticket.id} · Order ${ticket.orderId}` : ticket.id;
  if (tab === "blocked" && customer) details = `Last active ${timeAgo(customer.lastSeenAt, now)}`;

  let note: { text: string; tone: string } | null = null;
  if (order?.status === "rejected") note = { text: `Rejected: ${order.rejectReason}`, tone: "bg-red-50 text-red-700" };
  if (tab === "completed" && order && !order.code) note = { text: "Approved. Type the premium code in the chat to send it.", tone: "bg-emerald-50 text-emerald-700" };
  if (ticket) note = { text: ticket.message, tone: "bg-zinc-50 text-zinc-700 line-clamp-2" };
  if (tab === "blocked") note = { text: `Reason: ${item.subtitle}`, tone: "bg-red-50 text-red-700" };

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-white px-3 py-[11px] shadow-[0_8px_24px_-20px_rgba(12,38,96,0.55)]">
      <span className={classNames("absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-r", accents[tab])} />

      <div className="flex items-start gap-2.5">
        <button onClick={() => onOpenChat(item.customerId)} className="shrink-0 rounded-full" aria-label="Open chat">
          <CustomerAvatar customerId={item.customerId} size={44} />
        </button>

        <button onClick={() => onOpenChat(item.customerId)} className="flex-1 min-w-0 text-left">
          <span className="flex items-center gap-1.5">
            <span className="shrink-0 rounded-[5px] bg-[#0C2660]/[0.07] px-1.5 py-px text-[10.5px] font-extrabold text-[#0C2660]">{item.tag}</span>
            <span className={classNames("truncate text-[13.5px] text-zinc-900", item.unread ? "font-extrabold" : "font-bold")}>{item.title}</span>
            <span className={classNames("ml-auto shrink-0 flex items-center gap-1 text-[10.5px]", item.unread ? "font-extrabold text-[#0C2660]" : "font-semibold text-zinc-400")}>
              {chatListTime(item.time, now)}
              {item.unread && <span className="size-[7px] rounded-full bg-[#0C2660]" />}
            </span>
          </span>
          {order?.senderName && <span className="mt-0.5 block truncate text-[12px] font-bold text-zinc-700">{order.senderName}</span>}
          <span className="mt-px block truncate text-[11.5px] text-zinc-500">
            {order && <b className="font-bold text-zinc-800">{order.planName}</b>}
            {order && details && " · "}
            {details}
          </span>
          {item.badge && <span className={classNames("mt-1 inline-block rounded-full px-[7px] py-0.5 text-[10px] font-extrabold", badgeTone && badgeTones[badgeTone])}>{item.badge.label}</span>}
        </button>

        {screenshot && (
          <div className="self-center size-10 shrink-0 overflow-hidden rounded-[10px] border border-zinc-200 bg-zinc-50">
            <StoredImage zoomable path={screenshot} alt="Screenshot" className="size-full object-cover object-top" />
          </div>
        )}
        {showsCode && (
          <span className="self-center shrink-0 rounded-lg border border-dashed border-[#D4A551] bg-amber-50 px-[7px] py-[3px] font-mono text-[11px] font-extrabold tracking-[1.5px] text-[#0C2660]">{order?.code}</span>
        )}
      </div>

      {note && <div className={classNames("ml-[54px] mt-2 rounded-[10px] px-2.5 py-1.5 text-[11.5px] leading-snug break-words", note.tone)}>{note.text}</div>}

      <div className="ml-[54px] mt-2.5 flex flex-wrap gap-1.5">
        {tab === "pending" && order && (
          <>
            <button onClick={() => setDialog("approve")} className={buttons.navy}>Approve</button>
            <button onClick={() => setDialog("reject")} className={buttons.reject}>Reject</button>
            <button onClick={() => setDialog("cancel")} className={buttons.cancel}>Cancel</button>
          </>
        )}
        {ticket && (
          <>
            <button onClick={() => setDialog("resolve")} className={buttons.navy}>Resolved</button>
            <button onClick={() => setDialog("reply")} className={buttons.soft}>Reply</button>
          </>
        )}
        {tab === "completed" && order && (order.code ? (
          <button onClick={() => setDialog("unused")} className={buttons.soft}>Mark as unused</button>
        ) : (
          <button onClick={() => onOpenChat(item.customerId)} className={buttons.soft}>Open chat to send code</button>
        ))}
        {tab === "unused" && order && <button onClick={() => setDialog("unused")} className={buttons.violet}>Mark as used</button>}
        {tab === "blocked" && <button onClick={() => setDialog("unblock")} className={buttons.unblock}>Unblock</button>}
      </div>

      {dialog === "approve" && order && <ApproveDialog order={order} customerEmail={customerName} onClose={close} />}
      {dialog === "reject" && order && <RejectDialog order={order} onClose={close} />}
      {dialog === "cancel" && order && (
        <ConfirmDialog
          description={`${order.id} will move to Cancelled and ${customerName} can create a new order.`}
          confirmLabel="Yes, cancel order"
          tone="danger"
          onConfirm={() => cancelOrderAsAdmin(order.id)}
          onClose={close}
        />
      )}
      {dialog === "unused" && order && (
        <ConfirmDialog
          description={order.codeUnused ? `Code ${order.code} will be marked as used.` : `Code ${order.code} will be marked as unused.`}
          confirmLabel={order.codeUnused ? "Yes, mark as used" : "Yes, mark as unused"}
          onConfirm={() => setCodeUnused(order.id, !order.codeUnused)}
          onClose={close}
        />
      )}
      {dialog === "resolve" && ticket && (
        <ConfirmDialog description={`${ticket.id} will be closed and the customer will be told it is resolved.`} confirmLabel="Yes, resolve" onConfirm={() => setTicketResolved(ticket.id, true)} onClose={close} />
      )}
      {dialog === "reply" && <ReplyDialog customerId={item.customerId} onClose={close} />}
      {dialog === "unblock" && customer && (
        <ConfirmDialog description={`${customer.email} will be able to use the chat again.`} confirmLabel="Yes, unblock" onConfirm={() => unblockCustomer(customer.id)} onClose={close} />
      )}
    </div>
  );
}
