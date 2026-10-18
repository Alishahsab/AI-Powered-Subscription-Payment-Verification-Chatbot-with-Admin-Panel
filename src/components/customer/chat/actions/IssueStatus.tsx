"use client";

import { CheckCircle2, Clock, LifeBuoy, MessageCircleQuestion } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { formatCountdown } from "@/lib/format";
import { chooseMenuOption, confirmIssueResolved, continueIssue, findOpenTicket, isIssueExpired } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import BackToMenuButton from "./BackToMenuButton";
import { primaryButtonClass, secondaryButtonClass } from "./buttonStyles";

type IssueStatusProps = {
  customerId: string;
  agentReplied: boolean;
};

export default function IssueStatus({ customerId, agentReplied }: IssueStatusProps) {
  const state = useAppState();
  const now = useNow(1000);
  const { support } = state.settings;
  const ticket = findOpenTicket(state, customerId);

  if (isIssueExpired(state, customerId, now)) {
    return (
      <div className="max-w-[560px] mx-auto space-y-2.5">
        <Notice icon={<Clock size={17} />}>{support.expiredMessage}</Notice>
        <button onClick={() => chooseMenuOption(customerId, "support")} className={primaryButtonClass}>
          <LifeBuoy size={17} /> Customer Support
        </button>
      </div>
    );
  }

  if (agentReplied) {
    return (
      <div className="max-w-[560px] mx-auto space-y-2">
        <button onClick={() => confirmIssueResolved(customerId)} className={primaryButtonClass}>
          <CheckCircle2 size={17} /> {support.resolvedLabel}
        </button>
        <button onClick={() => continueIssue(customerId)} className={secondaryButtonClass}>
          <MessageCircleQuestion size={16} /> {support.stillFacingLabel}
        </button>
      </div>
    );
  }

  const waitingSince = state.messages.filter((message) => message.customerId === customerId && message.sender === "customer").at(-1)?.createdAt ?? ticket?.createdAt ?? now;

  return (
    <div className="max-w-[560px] mx-auto">
      <Notice icon={<Clock size={17} />} trailing={<span className="font-bold tabular-nums">{formatCountdown(now - waitingSince)}</span>}>
        {support.waitingMessage}
      </Notice>
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
