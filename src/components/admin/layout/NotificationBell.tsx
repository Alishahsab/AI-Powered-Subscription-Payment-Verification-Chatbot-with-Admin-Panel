"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useBackButton } from "@/hooks/useBackButton";
import { useNow } from "@/hooks/useNow";
import { timeAgo } from "@/lib/format";
import { markAllNotificationsRead } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import type { NotificationKind } from "@/lib/types";
import type { InboxTab, Navigate } from "../navigation";

export const tabForNotification: Record<NotificationKind, InboxTab> = {
  payment: "pending",
  payment_issue: "pending",
  support: "issues",
  blocked: "blocked",
};

export default function NotificationBell({ onNavigate }: { onNavigate: Navigate }) {
  const state = useAppState();
  const now = useNow(30_000);
  const [open, setOpen] = useState(false);
  useBackButton(open, () => setOpen(false));
  const unreadCount = state.notifications.filter((notification) => !notification.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative size-9 grid place-items-center rounded-lg hover:bg-zinc-100" aria-label="Notifications">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">{unreadCount}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-[340px] z-40 bg-white rounded-xl border border-zinc-200 shadow-xl fade-in">
            <div className="flex items-center justify-between px-4 h-11 border-b border-zinc-100">
              <span className="font-semibold text-[13.5px]">Notifications</span>
              <button onClick={markAllNotificationsRead} className="text-[12px] text-zinc-500 hover:text-zinc-900">
                Mark all read
              </button>
            </div>

            <div className="max-h-[min(380px,60dvh)] overflow-y-auto">
              {state.notifications.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-zinc-400">No notifications yet</div>}
              {state.notifications.slice(0, 15).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    setOpen(false);
                    onNavigate({ section: "inbox", customerId: notification.customerId, tab: tabForNotification[notification.kind] });
                  }}
                  className="w-full text-left px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50 flex gap-3"
                >
                  <span className={`mt-1.5 size-2 rounded-full shrink-0 ${notification.read ? "bg-transparent" : "bg-red-500"}`} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-zinc-900">{notification.title}</span>
                    <span className="block text-[12.5px] text-zinc-500 truncate">{notification.body}</span>
                    <span className="block text-[11px] text-zinc-400 mt-0.5">{timeAgo(notification.createdAt, now)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
