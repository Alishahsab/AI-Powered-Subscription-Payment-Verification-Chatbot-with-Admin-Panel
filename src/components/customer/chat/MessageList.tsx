"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Lock } from "lucide-react";
import BrandIcon from "@/components/BrandIcon";
import { useAppState } from "@/lib/store/state";
import type { Message, Stage } from "@/lib/types";
import MessageItem from "./MessageItem";

type MessageListProps = {
  messages: Message[];
  typing: boolean;
  stage: Stage;
};

const MINUTE = 60_000;

export default function MessageList({ messages, typing, stage }: MessageListProps) {
  const inactiveAfter = useAppState().settings.timers.inactiveMinutes * MINUTE;
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing, stage]);

  useEffect(() => {
    const element = scrollRef.current;
    const content = contentRef.current;
    if (!element || !content) return;

    let nearBottom = true;
    const trackPosition = () => {
      nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
    };
    const observer = new ResizeObserver(() => {
      if (nearBottom) element.scrollTo({ top: element.scrollHeight });
    });

    element.addEventListener("scroll", trackPosition, { passive: true });
    observer.observe(element);
    observer.observe(content);
    return () => {
      element.removeEventListener("scroll", trackPosition);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div ref={contentRef} className="max-w-[860px] mx-auto px-4 md:px-8 py-5 md:py-7 space-y-1.5">
        <PrivacyNote />

        {messages.map((message, index) => {
          const previous = messages[index - 1];
          // A new visit (after the customer was away) shows the privacy note again.
          const newVisit = previous && message.createdAt - previous.createdAt > inactiveAfter;
          return (
            <div key={message.id}>
              {newVisit && <PrivacyNote />}
              <MessageItem message={message} startsGroup={newVisit || previous?.sender !== message.sender} />
            </div>
          );
        })}

        {typing && <TypingIndicator />}
      </div>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="mx-auto my-4 w-fit max-w-full text-center text-[12px] leading-snug text-[var(--muted)] bg-[var(--surface)] border border-[var(--line)] rounded-2xl px-3.5 py-1.5">
      <Lock size={12} className="inline -mt-0.5 mr-1" />
      Private chat, visible only to you and Premium Store. Messages are deleted after 15 days.
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 pt-2.5 fade-in">
      <BrandIcon size={28} className="rounded-lg" />
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--surface)] border border-[var(--line)] flex gap-1">
        <span className="typing-dot size-1.5 rounded-full bg-[var(--muted)]" />
        <span className="typing-dot size-1.5 rounded-full bg-[var(--muted)]" />
        <span className="typing-dot size-1.5 rounded-full bg-[var(--muted)]" />
      </div>
    </div>
  );
}
