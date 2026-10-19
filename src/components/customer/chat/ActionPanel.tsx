"use client";

import { findOpenTicket } from "@/lib/store/customer";
import { canStillPay, findOrderMethod, getActiveOrder } from "@/lib/store/helpers";
import { getState } from "@/lib/store/state";
import type { Conversation } from "@/lib/types";
import type { OpenSheet } from "./ChatScreen";
import BackToMenuButton from "./actions/BackToMenuButton";
import CodeDeliveredActions from "./actions/CodeDeliveredActions";
import IssueComposer from "./actions/IssueComposer";
import IssueFollowUp from "./actions/IssueFollowUp";
import IssueStatus from "./actions/IssueStatus";
import MenuOptions from "./actions/MenuOptions";
import MessageComposer from "./actions/MessageComposer";
import MethodOptions from "./actions/MethodOptions";
import PaymentActions from "./actions/PaymentActions";
import PlanOptions from "./actions/PlanOptions";
import RejectionReply from "./actions/RejectionReply";
import SupportOptions from "./actions/SupportOptions";
import TermsActions from "./actions/TermsActions";

type ActionPanelProps = {
  customerId: string;
  conversation: Conversation;
  onOpenSheet: (sheet: OpenSheet) => void;
};

export default function ActionPanel({ customerId, conversation, onOpenSheet }: ActionPanelProps) {
  return (
    <div className="border-t border-[var(--line)] bg-[var(--surface)] px-4 md:px-8 pt-3 pb-4 md:pt-4 md:pb-5 rise-in max-h-[52%] overflow-y-auto">
      <div className="max-w-[860px] mx-auto">
        <StageActions customerId={customerId} conversation={conversation} onOpenSheet={onOpenSheet} />
      </div>
    </div>
  );
}

function StageActions({ customerId, conversation, onOpenSheet }: ActionPanelProps) {
  switch (conversation.stage) {
    case "menu":
      return <MenuOptions customerId={customerId} />;
    case "choose_plan":
      return <PlanOptions customerId={customerId} />;
    case "choose_method":
      return <MethodOptions customerId={customerId} />;
    case "terms":
      return <TermsActions customerId={customerId} />;
    case "awaiting_payment": {
      const order = getActiveOrder(getState(), customerId);
      if (!order || !canStillPay(order)) return <BackToMenuButton customerId={customerId} />;
      return <PaymentActions customerId={customerId} method={findOrderMethod(getState(), customerId)} onOpenSheet={onOpenSheet} />;
    }
    case "support":
      return <SupportOptions customerId={customerId} />;
    case "support_other":
      return <IssueComposer customerId={customerId} />;
    case "rejected":
      return <RejectionReply customerId={customerId} />;
    case "waiting_agent":
      return <IssueStatus customerId={customerId} agentReplied={false} />;
    case "agent_replied":
      return <IssueStatus customerId={customerId} agentReplied />;
    case "code_delivered":
      return <CodeDeliveredActions customerId={customerId} />;
    case "live":
      if (findOpenTicket(getState(), customerId)) return <IssueFollowUp customerId={customerId} />;
      return <MessageComposer customerId={customerId} />;
  }
}
