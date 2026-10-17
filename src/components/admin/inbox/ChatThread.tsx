"use client";

import { useLayoutEffect, useRef } from "react";
import { ArrowLeft, PanelRight } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { useAppState } from "@/lib/store/state";
import Avatar from "../ui/Avatar";
import { isCustomerActive } from "./inboxItems";
import ReplyBox from "./ReplyBox";
import ThreadMessage from "./ThreadMessage";

type ChatThreadProps = {
  customerId: string;
  onBack: () => void;
  onShowDetails: () => void;
};

export default function ChatThread({ customerId, onBack, onShowDetails }: ChatThreadProps) {
  const state = useAppState();
  const now = useNow(30_000);
  const scrollRef = useRef<HTMLDivElement>(null);
  const customer = state.customers.find((item) => item.id === customerId);
  const conversation = state.conversations[customerId];
  const messages = state.messages.filter((message) => message.customerId === customerId);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, customerId]);

  if (!customer || !conversation) return null;
  const active = isCustomerActive(state, customerId, now);

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#f7f8fa]">
      <div className="h-14 shrink-0 bg-white border-b border-zinc-200/80 flex items-center gap-3 px-3 lg:px-5">
        <button onClick={onBack} className="lg:hidden size-9 grid place-items-center rounded-lg hover:bg-zinc-100" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <Avatar name={customer.name} size={32} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold truncate">{customer.name}</div>
          <div className="text-[12px] text-zinc-500 truncate flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-zinc-300"}`} />
            {active ? "Active now" : "Non-active"} · {customer.email}
          </div>
        </div>
        <button onClick={onShowDetails} className="xl:hidden size-9 grid place-items-center rounded-lg hover:bg-zinc-100" aria-label="Show details">
          <PanelRight size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-8 py-5 space-y-2">
        {messages.length === 0 && <div className="text-center text-[12.5px] text-zinc-400 py-10">No messages yet. Older chats are cleared automatically.</div>}
        {messages.map((message) => (
          <ThreadMessage key={message.id} message={message} />
        ))}
        {conversation.typing && <div className="text-[12px] text-zinc-400 text-right pr-1">Auto-reply typing…</div>}
      </div>

      <ReplyBox customerId={customerId} customerName={customer.name} customerEmail={customer.email} />
    </div>
  );
}
