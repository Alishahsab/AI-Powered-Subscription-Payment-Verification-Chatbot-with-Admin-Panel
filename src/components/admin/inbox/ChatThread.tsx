"use client";

import { useLayoutEffect, useRef } from "react";
import { ArrowLeft, PanelRight } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { customerNumberLabel } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Message } from "@/lib/types";
import Avatar from "../ui/Avatar";
import { isCustomerActive } from "./inboxItems";
import ReplyBox from "./ReplyBox";
import ThreadMessage from "./ThreadMessage";

const GROUP_GAP_MS = 5 * 60_000;

type ChatThreadProps = {
  customerId: string;
  onBack: () => void;
  onShowDetails: () => void;
};

function endsGroup(message: Message, next?: Message) {
  if (!next) return true;
  return next.sender !== message.sender || next.createdAt - message.createdAt > GROUP_GAP_MS;
}

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
    <div className="flex-1 min-w-0 flex flex-col bg-[#f5f6f8]">
      <div className="h-16 shrink-0 bg-white border-b border-zinc-200/80 flex items-center gap-3 px-3 lg:px-6">
        <button onClick={onBack} className="lg:hidden size-9 grid place-items-center rounded-lg hover:bg-zinc-100" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="relative">
          <Avatar name={customer.email} size={38} />
          {active && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-zinc-900 truncate">{customer.email}</div>
          <div className="text-[12px] text-zinc-500 truncate">
            {customerNumberLabel(customer)} · {active ? "Active now" : "Away from chat"}
          </div>
        </div>
        <button onClick={onShowDetails} className="xl:hidden h-9 px-3 flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-zinc-600 hover:bg-zinc-100" aria-label="Show details">
          <PanelRight size={16} /> Details
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-10 py-6">
        <div className="max-w-[760px] mx-auto">
          {messages.length === 0 && <div className="text-center text-[12.5px] text-zinc-400 py-10">No messages yet. Older chats are cleared automatically.</div>}
          {messages.map((message, index) => {
            const last = endsGroup(message, messages[index + 1]);
            return (
              <div key={message.id} className={last ? "mb-4" : "mb-1"}>
                <ThreadMessage message={message} showMeta={last} />
              </div>
            );
          })}
          {conversation.typing && <div className="text-[12px] text-zinc-400 text-right pr-1">Auto-reply typing…</div>}
        </div>
      </div>

      <ReplyBox customerId={customerId} customerEmail={customer.email} />
    </div>
  );
}
