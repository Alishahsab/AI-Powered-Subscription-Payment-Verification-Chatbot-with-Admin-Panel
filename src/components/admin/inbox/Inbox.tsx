"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, X } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { classNames } from "@/lib/format";
import { markConversationRead } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import type { InboxTab } from "@/lib/types";
import EmptyState from "../ui/EmptyState";
import ChatList from "./ChatList";
import ChatThread from "./ChatThread";
import CustomerPanel from "./CustomerPanel";
import { buildInboxItems, countBotFilters, countInboxTabs, type BotFilter } from "./inboxItems";

const panelClass = "lg:rounded-2xl lg:border lg:border-zinc-200/70 lg:shadow-[0_1px_3px_rgba(16,24,40,0.06)]";

type InboxProps = {
  initialTab?: InboxTab;
  initialCustomerId?: string;
};

export default function Inbox({ initialTab, initialCustomerId }: InboxProps) {
  const state = useAppState();
  const now = useNow(15_000);
  const [tab, setTab] = useState<InboxTab>(initialTab ?? state.settings.inboxTabs[0]?.key ?? "pending");
  const [botFilter, setBotFilter] = useState<BotFilter>("active_chats");
  const [chosenCustomerId, setChosenCustomerId] = useState(initialCustomerId);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isWideScreen] = useState(() => window.innerWidth >= 1024);

  const items = useMemo(() => buildInboxItems(state, tab, botFilter, now), [state, tab, botFilter, now]);
  const counts = useMemo(() => countInboxTabs(state), [state]);
  const botCounts = useMemo(() => countBotFilters(state, now), [state, now]);
  const selectedCustomerId = chosenCustomerId ?? (isWideScreen ? items[0]?.customerId : undefined);

  useEffect(() => {
    if (selectedCustomerId) markConversationRead(selectedCustomerId);
  }, [selectedCustomerId, state.messages.length]);

  return (
    <div className="h-full flex lg:gap-3 lg:p-3 bg-[#e9ecf1]">
      <div className={classNames("w-full lg:w-[360px] shrink-0 bg-white flex flex-col overflow-hidden", panelClass, selectedCustomerId && "hidden lg:flex")}>
        <ChatList
          tab={tab}
          onTabChange={setTab}
          botFilter={botFilter}
          onBotFilterChange={setBotFilter}
          counts={counts}
          botCounts={botCounts}
          items={items}
          selectedCustomerId={selectedCustomerId}
          onSelect={setChosenCustomerId}
          now={now}
        />
      </div>

      {selectedCustomerId ? (
        <>
          <ChatThread customerId={selectedCustomerId} onBack={() => setChosenCustomerId(undefined)} onShowDetails={() => setDetailsOpen(true)} />

          <div className={classNames("hidden xl:block w-[340px] shrink-0 bg-white overflow-y-auto", panelClass)}>
            <CustomerPanel customerId={selectedCustomerId} />
          </div>

          {detailsOpen && (
            <div className="xl:hidden fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/30 fade-in" onClick={() => setDetailsOpen(false)} />
              <div className="absolute inset-y-0 right-0 w-full max-w-[380px] bg-white overflow-y-auto shadow-2xl">
                <div className="flex justify-end p-2">
                  <button onClick={() => setDetailsOpen(false)} className="size-9 grid place-items-center rounded-lg hover:bg-zinc-100" aria-label="Close details">
                    <X size={18} />
                  </button>
                </div>
                <CustomerPanel customerId={selectedCustomerId} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={classNames("hidden lg:grid flex-1 place-items-center bg-white", panelClass)}>
          <EmptyState icon={<MessageSquareText size={20} />} title="Select a conversation" description="Choose a chat or order from the list." />
        </div>
      )}
    </div>
  );
}
