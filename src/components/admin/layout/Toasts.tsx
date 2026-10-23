"use client";

import { useEffect, useRef, useState } from "react";
import { playAlertSound } from "@/lib/browser";
import { useAppState } from "@/lib/store/state";
import type { AdminNotification } from "@/lib/types";
import type { Navigate } from "../navigation";
import { tabForNotification } from "./NotificationBell";

const TOAST_DURATION = 6000;

// Android Chrome does not allow `new Notification()` and throws, which used to crash the panel in the background.
// There the notification goes through the service worker if one is running, and is skipped otherwise.
function showSystemNotification({ title, body }: AdminNotification) {
  try {
    new Notification(title, { body });
  } catch {
    navigator.serviceWorker?.getRegistration().then((registration) => registration?.showNotification(title, { body })).catch(() => {});
  }
}

export default function Toasts({ onNavigate }: { onNavigate: Navigate }) {
  const state = useAppState();
  const [toasts, setToasts] = useState<AdminNotification[]>([]);
  const seenIds = useRef(new Set(state.notifications.map((notification) => notification.id)));

  useEffect(() => {
    const fresh = state.notifications.filter((notification) => !seenIds.current.has(notification.id) && !notification.read);
    state.notifications.forEach((notification) => seenIds.current.add(notification.id));
    if (fresh.length === 0) return;

    playAlertSound();
    setToasts((current) => [...fresh, ...current].slice(0, 3));

    for (const notification of fresh) {
      setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== notification.id)), TOAST_DURATION);
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) showSystemNotification(notification);
    }
  }, [state.notifications]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const open = (toast: AdminNotification) => {
    setToasts((current) => current.filter((item) => item.id !== toast.id));
    onNavigate({ section: "inbox", customerId: toast.customerId, tab: tabForNotification[toast.kind] });
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-[320px]">
      {toasts.map((toast) => (
        <button key={toast.id} onClick={() => open(toast)} className="toast-in w-full text-left bg-[#0C2660] text-white rounded-xl shadow-2xl px-4 py-3 flex gap-3">
          <span className="mt-1 size-2 rounded-full bg-[#C9A45C] shrink-0" />
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold">{toast.title}</span>
            <span className="block text-[12.5px] text-white/70 truncate">{toast.body}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
