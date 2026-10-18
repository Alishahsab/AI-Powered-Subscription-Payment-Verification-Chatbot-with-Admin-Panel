"use client";

import { useState } from "react";
import { Mail, Send, Zap } from "lucide-react";
import { classNames, formatDateTime } from "@/lib/format";
import { findCodeSentToSomeoneElse, sendAdminMessage } from "@/lib/store/admin";

const quickReplies = [
  "Payment received, verifying now. Please wait a few minutes.",
  "Please share a clearer screenshot of the payment.",
  "Our account details have changed. Please create a new order.",
  "Please make sure you're logged in with the same Gmail in the app.",
];

type ReplyBoxProps = {
  customerId: string;
  customerEmail: string;
};

export default function ReplyBox({ customerId, customerEmail }: ReplyBoxProps) {
  const [text, setText] = useState("");
  const [emailCopy, setEmailCopy] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [warning, setWarning] = useState("");

  const send = (message: string, skipDuplicateCheck = false) => {
    const content = message.trim();
    if (!content) return;

    const duplicate = findCodeSentToSomeoneElse(customerId, content);
    if (duplicate && !skipDuplicateCheck) {
      setWarning(`Code ${duplicate.code} was already sent to ${duplicate.customerEmail} on ${formatDateTime(duplicate.sentAt)}.`);
      return;
    }

    sendAdminMessage(customerId, content, emailCopy);
    setText("");
    setWarning("");
    setShowQuickReplies(false);
  };

  return (
    <div className="bg-white border-t border-zinc-200/80 px-4 lg:px-10 py-3.5">
      <div className="max-w-[760px] mx-auto">
        {showQuickReplies && (
          <div className="mb-2.5 flex flex-wrap gap-1.5 fade-in">
            {quickReplies.map((reply) => (
              <button key={reply} onClick={() => send(reply)} className="text-[12.5px] px-3 py-1.5 rounded-full border border-zinc-200 hover:border-[#0C2660]/40 hover:bg-[#0C2660]/[0.04] text-zinc-700 text-left transition">
                {reply}
              </button>
            ))}
          </div>
        )}

        {warning && (
          <div className="mb-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-[12.5px] text-red-700 flex items-center justify-between gap-3">
            <span>{warning}</span>
            <button onClick={() => send(text, true)} className="font-semibold whitespace-nowrap hover:underline">
              Send anyway
            </button>
          </div>
        )}

        <div className="flex items-end gap-1.5 rounded-2xl border border-zinc-200 bg-[#f8f9fb] p-1.5 focus-within:border-[#0C2660]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0C2660]/[0.06] transition">
          <button
            onClick={() => setShowQuickReplies(!showQuickReplies)}
            className={classNames("size-9 shrink-0 grid place-items-center rounded-xl transition", showQuickReplies ? "bg-[#0C2660] text-white" : "text-zinc-500 hover:bg-zinc-200/60")}
            aria-label="Quick replies"
            title="Quick replies"
          >
            <Zap size={16} />
          </button>
          <textarea
            value={text}
            maxLength={1000}
            onChange={(event) => {
              setText(event.target.value);
              setWarning("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(text);
              }
            }}
            rows={1}
            placeholder="Type a message or code…"
            className="flex-1 resize-none min-h-9 max-h-32 bg-transparent px-1.5 py-2 text-[14px] outline-none placeholder:text-zinc-400"
          />
          <button
            onClick={() => send(text)}
            disabled={!text.trim()}
            className="h-9 px-4 shrink-0 rounded-xl bg-[#0C2660] text-white text-[13.5px] font-semibold flex items-center gap-1.5 hover:bg-[#0a1f52] transition disabled:opacity-40"
          >
            <Send size={14} /> Send
          </button>
        </div>

        <label className="mt-2 inline-flex items-center gap-2 text-[12px] text-zinc-500 cursor-pointer select-none">
          <input type="checkbox" checked={emailCopy} onChange={(event) => setEmailCopy(event.target.checked)} className="size-3.5 accent-[#0C2660]" />
          <Mail size={12} /> Also send to {customerEmail}
        </label>
      </div>
    </div>
  );
}
