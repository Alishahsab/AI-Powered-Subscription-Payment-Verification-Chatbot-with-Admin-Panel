import { useState } from "react";
import { Ban, Bot, ImageIcon, Mail, Trash2 } from "lucide-react";
import StoredImage from "@/components/StoredImage";
import { classNames, formatMoney, formatTime } from "@/lib/format";
import { canDeleteMessage, deleteAdminMessage } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import type { Message } from "@/lib/types";
import ConfirmDialog from "../ui/ConfirmDialog";
import MessageTicks from "./MessageTicks";

type ThreadMessageProps = {
  message: Message;
  showMeta: boolean;
};

export default function ThreadMessage({ message, showMeta }: ThreadMessageProps) {
  const state = useAppState();
  const order = message.orderId ? state.orders.find((item) => item.id === message.orderId) : undefined;

  if (message.kind === "payment" && order) {
    return (
      <SystemNote>
        Order <b className="font-semibold text-zinc-700">{order.id}</b> created · {order.planName} · {formatMoney(order.amount)} · {order.methodName}
      </SystemNote>
    );
  }

  if (message.kind === "steps") return <SystemNote>Payment steps shown to customer</SystemNote>;

  if (message.kind === "code") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%] flex flex-col items-end">
          <div className="rounded-2xl rounded-br-md bg-[#0C2660] text-white px-4 py-2.5">
            <div className="text-[11px] text-white/60">Code sent{order?.code ? ` · ${order.code}` : ""}</div>
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{message.text}</div>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 px-1 flex items-center gap-1">
            {formatTime(message.createdAt)}
            <MessageTicks message={message} />
          </div>
        </div>
      </div>
    );
  }
  if (message.kind === "instructions") return <SystemNote>Code activation instructions sent</SystemNote>;

  if (message.kind === "proof") {
    return <ImageMessage image={order?.screenshot} title="Payment proof" detail={`From ${order?.senderName ?? "N/A"} · ${formatTime(message.createdAt)}`} />;
  }

  if (message.kind === "deleted") {
    return (
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-br-md border border-dashed border-zinc-300 px-4 py-2 text-[13px] italic text-zinc-400 flex items-center gap-1.5">
          <Ban size={13} /> You deleted this message · <span className="not-italic">{formatTime(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  if (message.kind === "image") {
    const fromAdmin = message.sender === "admin";
    const action = canDeleteMessage(message) && <DeleteMessageButton message={message} />;
    const detail = (
      <span className="flex items-center gap-1">
        {formatTime(message.createdAt)}
        {fromAdmin && <MessageTicks message={message} />}
      </span>
    );
    return <ImageMessage image={message.image} title={fromAdmin ? "You sent an image" : "Screenshot"} detail={detail} alignRight={fromAdmin} action={action} />;
  }

  const fromCustomer = message.sender === "customer";
  const fromBot = message.sender === "bot";

  return (
    <div className={classNames("group flex", !fromCustomer && "justify-end")}>
      <div className={classNames("max-w-[72%] flex flex-col", fromCustomer ? "items-start" : "items-end")}>
        <div className="flex items-center gap-1 min-w-0">
          {canDeleteMessage(message) && <DeleteMessageButton message={message} />}
          <div
            className={classNames(
              "min-w-0 px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-line",
              fromCustomer && "bg-white text-zinc-900 rounded-2xl rounded-bl-md shadow-[0_1px_2px_rgba(16,24,40,0.06)]",
              fromBot && "bg-[#e9edf5] text-zinc-600 rounded-2xl rounded-br-md text-[13.5px]",
              message.sender === "admin" && "bg-[#0C2660] text-white rounded-2xl rounded-br-md"
            )}
          >
            {message.text}
          </div>
        </div>
        {showMeta && (
          <div className="text-[11px] text-zinc-400 mt-1 px-1 flex items-center gap-1">
            {fromBot && (
              <span className="flex items-center gap-1">
                <Bot size={12} /> Auto-reply ·
              </span>
            )}
            {formatTime(message.createdAt)}
            {message.emailedTo && (
              <span className="flex items-center gap-0.5" title={`Emailed to ${message.emailedTo}`}>
                · <Mail size={11} /> emailed
              </span>
            )}
            {message.sender === "admin" && <MessageTicks message={message} />}
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteMessageButton({ message }: { message: Message }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="size-8 shrink-0 grid place-items-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
        aria-label="Delete message"
        title="Delete message"
      >
        <Trash2 size={15} />
      </button>
      {confirming && (
        <ConfirmDialog
          description="The customer will see “This message has been deleted”."
          confirmLabel="Yes, delete"
          tone="danger"
          onConfirm={() => deleteAdminMessage(message.id)}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  );
}

function SystemNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="flex-1 h-px bg-zinc-200" />
      <span className="text-[11.5px] text-zinc-500 text-center">{children}</span>
      <span className="flex-1 h-px bg-zinc-200" />
    </div>
  );
}

type ImageMessageProps = {
  image?: string;
  title: string;
  detail: React.ReactNode;
  alignRight?: boolean;
  action?: React.ReactNode;
};

function ImageMessage({ image, title, detail, alignRight = false, action }: ImageMessageProps) {
  return (
    <div className={classNames("group flex items-center gap-1", alignRight && "justify-end")}>
      {action}
      <div className="w-[220px] rounded-2xl rounded-bl-md overflow-hidden bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
        {image ? (
          <StoredImage zoomable path={image} alt={title} className="w-full h-36 object-cover object-top" />
        ) : (
          <div className="h-16 grid place-items-center text-[12px] text-zinc-400">
            <span className="flex items-center gap-1">
              <ImageIcon size={13} /> Removed
            </span>
          </div>
        )}
        <div className="px-3.5 py-2.5 text-[12px]">
          <div className="font-semibold text-zinc-800">{title}</div>
          <div className="text-zinc-500">{detail}</div>
        </div>
      </div>
    </div>
  );
}
