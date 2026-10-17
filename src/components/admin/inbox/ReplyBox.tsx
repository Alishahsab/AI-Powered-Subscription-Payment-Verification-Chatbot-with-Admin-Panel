"use client";

import { useState } from "react";
import { Send, Zap } from "lucide-react";
import { classNames, formatDateTime } from "@/lib/format";
import { findCodeSentToSomeoneElse, sendAdminMessage } from "@/lib/store/admin";
import Button from "../ui/Button";
import Toggle from "../ui/Toggle";

const quickReplies = [
  "Payment received, verifying now. Please wait a few minutes.",
  "Please share a clearer screenshot of the payment.",
  "Our account details have changed. Please create a new order.",
  "Please make sure you're logged in with the same Gmail in the app.",
];

type ReplyBoxProps = {
  customerId: string;
  customerName: string;
  customerEmail: string;
};

export default function ReplyBox({ customerId, customerName, customerEmail }: ReplyBoxProps) {
  const [text, setText] = useState("");
  const [emailCopy, setEmailCopy] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [warning, setWarning] = useState("");

  const send = (message: string, skipDuplicateCheck = false) => {
    const content = message.trim();
    if (!content) return;

    const duplicate = findCodeSentToSomeoneElse(customerId, content);
    if (duplicate && !skipDuplicateCheck) {
      setWarning(`Code ${duplicate.code} was already sent to ${duplicate.customerName} on ${formatDateTime(duplicate.sentAt)}.`);
      return;
    }

    sendAdminMessage(customerId, content, emailCopy);
    setText("");
    setWarning("");
    setShowQuickReplies(false);
  };

  return (
    <div className="bg-white border-t border-zinc-200/80 p-3 lg:px-5">
      {showQuickReplies && (
        <div className="mb-2 flex flex-wrap gap-1.5 fade-in">
          {quickReplies.map((reply) => (
            <button key={reply} onClick={() => send(reply)} className="text-[12px] px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-left">
              {reply}
            </button>
          ))}
        </div>
      )}

      {warning && (
        <div className="mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700 flex items-center justify-between gap-3">
          <span>{warning}</span>
          <button onClick={() => send(text, true)} className="font-semibold whitespace-nowrap hover:underline">
            Send anyway
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => setShowQuickReplies(!showQuickReplies)}
          className={classNames("size-10 shrink-0 grid place-items-center rounded-lg border", showQuickReplies ? "bg-[#0C2660] text-white border-[#0C2660]" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50")}
          aria-label="Quick replies"
        >
          <Zap size={16} />
        </button>
        <textarea
          value={text}
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
          placeholder={`Reply to ${customerName.split(" ")[0]} or send the code…`}
          className="flex-1 resize-none min-h-10 max-h-32 rounded-lg border border-zinc-200 px-3 py-2.5 text-[13.5px] outline-none focus:border-zinc-400"
        />
        <Button variant="primary" className="h-10" onClick={() => send(text)} disabled={!text.trim()}>
          <Send size={15} /> Send
        </Button>
      </div>

      <div className="mt-2">
        <Toggle on={emailCopy} onChange={setEmailCopy} label={`Also email this message to ${customerEmail}`} />
      </div>
    </div>
  );
}
