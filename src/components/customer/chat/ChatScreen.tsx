"use client";

import { useEffect, useState } from "react";
import { markMessagesSeen, openChat } from "@/lib/store/customer";
import { findOrderMethod } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { Customer } from "@/lib/types";
import ActionPanel from "./ActionPanel";
import BlockedNotice from "./BlockedNotice";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import PaymentStepsSheet from "./sheets/PaymentStepsSheet";
import ReportIssueSheet from "./sheets/ReportIssueSheet";
import UploadProofSheet from "./sheets/UploadProofSheet";

export type OpenSheet = "proof" | "issue" | "steps" | null;

type ChatScreenProps = {
  customer: Customer;
  onSignOut?: () => void;
};

export default function ChatScreen({ customer, onSignOut }: ChatScreenProps) {
  const state = useAppState();
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const conversation = state.conversations[customer.id];
  const messages = state.messages.filter((message) => message.customerId === customer.id);
  const orderMethod = findOrderMethod(state, customer.id);

  useEffect(() => {
    openChat(customer.id);
  }, [customer.id]);

  useEffect(() => {
    if (document.visibilityState === "visible") markMessagesSeen(customer.id);
  }, [customer.id, messages.length]);

  if (!conversation) return null;

  return (
    <section className="relative flex-1 min-w-0 flex flex-col">
      <ChatHeader typing={conversation.typing} onSignOut={onSignOut} />
      <MessageList messages={messages} typing={conversation.typing} stage={conversation.stage} />

      {customer.blocked ? (
        <BlockedNotice customer={customer} />
      ) : (
        !conversation.typing && <ActionPanel customerId={customer.id} conversation={conversation} onOpenSheet={setSheet} />
      )}

      {sheet === "proof" && <UploadProofSheet customerId={customer.id} onClose={() => setSheet(null)} />}
      {sheet === "issue" && <ReportIssueSheet customerId={customer.id} onClose={() => setSheet(null)} />}
      {sheet === "steps" && orderMethod && <PaymentStepsSheet customerId={customer.id} method={orderMethod} onClose={() => setSheet(null)} />}
    </section>
  );
}
