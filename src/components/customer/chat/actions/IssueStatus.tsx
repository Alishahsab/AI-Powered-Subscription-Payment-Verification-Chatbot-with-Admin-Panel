"use client";

import { Clock } from "lucide-react";
import { confirmIssueResolved, continueIssue, findOpenTicket, OTHER_ISSUES_LABEL } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import BackToMenuButton from "./BackToMenuButton";
import { primaryButtonClass, secondaryButtonClass } from "./buttonStyles";

const OPEN_REQUEST_NOTICE = "You already have an open request. You can send a new one once it is resolved.";

type IssueStatusProps = {
  customerId: string;
  agentReplied: boolean;
};

export default function IssueStatus({ customerId, agentReplied }: IssueStatusProps) {
  const state = useAppState();
  const { support } = state.settings;
  const ticket = findOpenTicket(state, customerId);

  if (!ticket) return <BackToMenuButton customerId={customerId} />;

  if (agentReplied) {
    return (
      <div className="max-w-[560px] mx-auto space-y-2">
        <button onClick={() => confirmIssueResolved(customerId)} className={primaryButtonClass}>
          {support.resolvedLabel}
        </button>
        <button onClick={() => continueIssue(customerId)} className={secondaryButtonClass}>
          {support.stillFacingLabel}
        </button>
      </div>
    );
  }

  // Right after sending, confirm the request; after a second attempt, say one is already open.
  const lastCustomerMessage = state.messages.filter((message) => message.customerId === customerId && message.sender === "customer").at(-1);
  const triedAgain = lastCustomerMessage?.text === OTHER_ISSUES_LABEL && lastCustomerMessage.createdAt > ticket.createdAt;

  return (
    <div className="max-w-[560px] mx-auto">
      <Notice icon={<Clock size={17} />}>{triedAgain ? OPEN_REQUEST_NOTICE : support.waitingMessage}</Notice>
      <BackToMenuButton customerId={customerId} />
    </div>
  );
}

type NoticeProps = {
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
};

function Notice({ icon, trailing, children }: NoticeProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))] px-4 py-3.5 text-[13.5px] leading-snug">
      <span className="shrink-0 text-[var(--accent)]">{icon}</span>
      <span className="flex-1">{children}</span>
      {trailing && <span className="shrink-0 text-[13px] text-[var(--muted)]">{trailing}</span>}
    </div>
  );
}
