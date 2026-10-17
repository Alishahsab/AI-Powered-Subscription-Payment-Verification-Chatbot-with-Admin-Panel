"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { sendCustomerMessage } from "@/lib/store/customer";
import { limits } from "@/lib/validation";
import BackToMenuButton from "./BackToMenuButton";

export default function MessageComposer({ customerId }: { customerId: string }) {
  const [text, setText] = useState("");

  const send = () => {
    const message = text.trim();
    if (!message) return;
    sendCustomerMessage(customerId, message);
    setText("");
  };

  return (
    <div>
      <div className="flex items-end gap-2">
        <input
          autoFocus
          value={text}
          maxLength={limits.messageMax}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && send()}
          placeholder="Type a message"
          className="flex-1 h-12 rounded-full bg-[var(--surface)] border border-[var(--line)] px-5 text-[14.5px] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] placeholder:text-[#9aa1ab]"
        />
        <button onClick={send} disabled={!text.trim()} className="size-12 shrink-0 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] grid place-items-center disabled:opacity-40" aria-label="Send">
          <ArrowUp size={20} />
        </button>
      </div>
      <BackToMenuButton customerId={customerId} />
    </div>
  );
}
