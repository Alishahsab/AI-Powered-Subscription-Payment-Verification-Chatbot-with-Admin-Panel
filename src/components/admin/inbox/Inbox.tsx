"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, X } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { classNames } from "@/lib/format";
import { markConversationRead } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import type { InboxTab } from "../navigation";
import EmptyState from "../ui/EmptyState";
import ChatList from "./ChatList";
import ChatThread from "./ChatThread";
import CustomerPanel from "./CustomerPanel";
import { buildInboxItems, countInboxTabs, type ChatFilter } from "./inboxItems";

type InboxProps = {
  initialTab?: InboxTab;
  initialCustomerId?: string;
};

export default function Inbox({ initialTab, initialCustomerId }: InboxProps) {
  const state = useAppState();
  const now = useNow(15_000);
  const [tab, setTab] = useState<InboxTab>(initialTab ?? "pending");
  const [filter, setFilter] = useState<ChatFilter>("active");
  const [chosenCustomerId, setChosenCustomerId] = useState(initialCustomerId);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isWideScreen] = useState(() => window.innerWidth >= 1024);

  const items = useMemo(() => buildInboxItems(state, tab, filter, now), [state, tab, filter, now]);
  const counts = useMemo(() => countInboxTabs(state), [state]);
  const selectedCustomerId = chosenCustomerId ?? (isWideScreen ? items[0]?.customerId : undefined);

  useEffect(() => {
    if (selectedCustomerId) markConversationRead(selectedCustomerId);
  }, [selectedCustomerId, state.messages.length]);

  return (
    <div className="h-full flex">
      <div className={classNames("w-full lg:w-[340px] shrink-0 border-r border-zinc-200/80 bg-white flex flex-col", selectedCustomerId && "hidden lg:flex")}>
        <ChatList
          tab={tab}
          onTabChange={setTab}
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
          items={items}
          selectedCustomerId={selectedCustomerId}
          onSelect={setChosenCustomerId}
          now={now}
        />
      </div>

      {selectedCustomerId ? (
        <>
          <ChatThread customerId={selectedCustomerId} onBack={() => setChosenCustomerId(undefined)} onShowDetails={() => setDetailsOpen(true)} />

          <div className="hidden xl:block w-[360px] shrink-0 border-l border-zinc-200/80 bg-white overflow-y-auto">
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
        <div className="hidden lg:grid flex-1 place-items-center">
          <EmptyState icon={<MessageSquareText size={20} />} title="Select a conversation" description="Choose a chat or order from the list." />
        </div>
      )}
    </div>
  );
}
