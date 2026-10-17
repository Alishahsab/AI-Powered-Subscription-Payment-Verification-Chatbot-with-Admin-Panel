import { ImageIcon, Mail } from "lucide-react";
import StoredImage from "@/components/StoredImage";
import { classNames, formatMoney, formatTime } from "@/lib/format";
import { useAppState } from "@/lib/store/state";
import type { Message } from "@/lib/types";
import MessageTicks from "./MessageTicks";

export default function ThreadMessage({ message }: { message: Message }) {
  const state = useAppState();
  const order = message.orderId ? state.orders.find((item) => item.id === message.orderId) : undefined;

  if (message.kind === "payment" && order) {
    return (
      <div className="flex justify-center">
        <div className="text-[11.5px] text-zinc-500 bg-white border border-zinc-200 rounded-full px-3 py-1">
          Order {order.id} created · {order.planName} · {formatMoney(order.amount)} · {order.methodName} · {formatTime(message.createdAt)}
        </div>
      </div>
    );
  }

  if (message.kind === "steps") {
    return (
      <div className="flex justify-center">
        <div className="text-[11.5px] text-zinc-500 bg-white border border-zinc-200 rounded-full px-3 py-1">Wallet payment steps shown to customer</div>
      </div>
    );
  }

  if (message.kind === "proof") {
    return (
      <ImageMessage image={order?.screenshot} title="Payment proof" detail={`From ${order?.senderName ?? "N/A"} · ${formatTime(message.createdAt)}`} />
    );
  }

  if (message.kind === "image") {
    return <ImageMessage image={message.image} title="Screenshot" detail={formatTime(message.createdAt)} />;
  }

  const fromCustomer = message.sender === "customer";

  return (
    <div className={classNames("flex", !fromCustomer && "justify-end")}>
      <div className="max-w-[75%]">
        <div
          className={classNames(
            "px-3.5 py-2 rounded-xl text-[13.5px] leading-relaxed whitespace-pre-line",
            message.sender === "customer" && "bg-white border border-zinc-200 text-zinc-800",
            message.sender === "bot" && "bg-zinc-100 text-zinc-600",
            message.sender === "admin" && "bg-[#0C2660] text-white"
          )}
        >
          {message.text}
        </div>
        <div className={classNames("text-[10.5px] text-zinc-400 mt-0.5 px-1 flex items-center gap-1", !fromCustomer && "justify-end")}>
          {message.sender === "bot" && "Auto-reply · "}
          {message.sender === "admin" && "You · "}
          {formatTime(message.createdAt)}
          {message.emailedTo && (
            <span className="flex items-center gap-0.5" title={`Emailed to ${message.emailedTo}`}>
              · <Mail size={11} /> emailed
            </span>
          )}
          {message.sender === "admin" && <MessageTicks message={message} />}
        </div>
      </div>
    </div>
  );
}

function ImageMessage({ image, title, detail }: { image?: string; title: string; detail: string }) {
  return (
    <div className="flex">
      <div className="w-[200px] rounded-xl overflow-hidden bg-white border border-zinc-200">
        {image ? (
          <StoredImage path={image} alt={title} className="w-full h-32 object-cover object-top" />
        ) : (
          <div className="h-16 grid place-items-center text-[12px] text-zinc-400">
            <span className="flex items-center gap-1">
              <ImageIcon size={13} /> Removed
            </span>
          </div>
        )}
        <div className="px-3 py-2 text-[12px]">
          <div className="font-medium">{title}</div>
          <div className="text-zinc-500">{detail}</div>
        </div>
      </div>
    </div>
  );
}
