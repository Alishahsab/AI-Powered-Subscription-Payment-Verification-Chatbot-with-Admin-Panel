"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ImagePlus, MessageSquareText } from "lucide-react";
import { compressImage } from "@/lib/browser";
import { classNames, formatDateTime } from "@/lib/format";
import { findCodeAlreadySent, sendAdminImage, sendAdminMessage } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";

const MAX_INPUT_HEIGHT = 200;

type ReplyBoxProps = {
  customerId: string;
  customerEmail: string;
  // Replying from the App issues tab answers the open request, so the customer can say Resolved or Still facing.
  ticketReply?: boolean;
};

export default function ReplyBox({ customerId, customerEmail, ticketReply = false }: ReplyBoxProps) {
  const quickReplies = useAppState().settings.quickReplies.filter((reply) => reply.trim());
  const [text, setText] = useState("");
  const [emailCopy, setEmailCopy] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [warning, setWarning] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = textArea.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [text]);

  const sendImage = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    setImageError((await sendAdminImage(customerId, await compressImage(file), ticketReply)) ?? "");
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const send = (message: string) => {
    const content = message.trim();
    if (!content) return;

    const duplicate = findCodeAlreadySent(content);
    if (duplicate) {
      setWarning(`Code ${duplicate.code} was already sent to ${duplicate.customerEmail} on ${formatDateTime(duplicate.sentAt)}. A code can only be sent once.`);
      return;
    }

    sendAdminMessage(customerId, content, emailCopy, ticketReply);
    setText("");
    setWarning("");
    setShowQuickReplies(false);
  };

  return (
    <div className="bg-white border-t border-zinc-200/80 px-4 lg:px-6 py-3.5">
      <div>
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
          <div className="mb-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-[12.5px] text-red-700">{warning}</div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-[#f8f9fb] focus-within:border-[#0C2660]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0C2660]/[0.06] transition">
          <textarea
            ref={textArea}
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
            placeholder={uploading ? "Sending image…" : "Type a message or code…"}
            className="block w-full resize-none min-h-11 bg-transparent px-3.5 pt-3 pb-1 text-[14px] leading-5 outline-none placeholder:text-zinc-400 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />
          <div className="flex items-center gap-1 px-1.5 pb-1.5">
            <button
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className={classNames("size-9 grid place-items-center rounded-xl transition", showQuickReplies ? "bg-[#0C2660] text-white" : "text-zinc-500 hover:bg-zinc-200/60")}
              aria-label="Quick replies"
              title="Quick replies"
            >
              <MessageSquareText size={17} />
            </button>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => sendImage(event.target.files?.[0])} />
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="size-9 grid place-items-center rounded-xl text-zinc-500 hover:bg-zinc-200/60 transition disabled:opacity-40"
              aria-label="Send an image"
              title="Send an image"
            >
              <ImagePlus size={17} />
            </button>
            <button
              onClick={() => send(text)}
              disabled={!text.trim()}
              className="ml-auto h-9 px-5 rounded-xl bg-[#0C2660] text-white text-[13.5px] font-semibold hover:bg-[#0a1f52] transition disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>

        {imageError && <p className="mt-2 text-[12px] text-red-600">{imageError}</p>}

        <label className="mt-2 inline-flex items-center gap-2 text-[12px] text-zinc-500 cursor-pointer select-none">
          <input type="checkbox" checked={emailCopy} onChange={(event) => setEmailCopy(event.target.checked)} className="size-3.5 accent-[#0C2660]" />
          Also send to {customerEmail}
        </label>
      </div>
    </div>
  );
}
