"use client";

import { useEffect } from "react";
import { markMessagesDelivered, recordActivity } from "@/lib/store/customer";

const ACTIVITY_THROTTLE_MS = 60_000;
const DELIVERY_CHECK_MS = 15_000;
const activityEvents = ["pointerdown", "keydown", "touchstart", "wheel"] as const;

export function usePresence(customerId: string | undefined) {
  useEffect(() => {
    if (!customerId) return;

    let lastRecorded = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastRecorded < ACTIVITY_THROTTLE_MS) return;
      lastRecorded = now;
      recordActivity(customerId);
    };

    onActivity();
    activityEvents.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    const deliveryTimer = setInterval(() => markMessagesDelivered(customerId), DELIVERY_CHECK_MS);

    return () => {
      activityEvents.forEach((name) => window.removeEventListener(name, onActivity));
      clearInterval(deliveryTimer);
    };
  }, [customerId]);
}
