"use client";

import { useEffect } from "react";
import { recordPresence } from "@/lib/store/customer";

const HEARTBEAT_MS = 60_000;

export function usePresence(customerId: string | undefined) {
  useEffect(() => {
    if (!customerId) return;

    recordPresence(customerId);
    const timer = setInterval(() => recordPresence(customerId), HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [customerId]);
}
