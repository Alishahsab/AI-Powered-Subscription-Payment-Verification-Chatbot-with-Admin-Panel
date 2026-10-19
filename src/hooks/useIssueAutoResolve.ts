"use client";

import { useEffect } from "react";
import { resolveIdleIssues } from "@/lib/store/customer";

const CHECK_EVERY_MS = 60_000;

export function useIssueAutoResolve(enabled: boolean, customerId?: string) {
  useEffect(() => {
    if (!enabled) return;
    resolveIdleIssues(customerId);
    const timer = setInterval(() => resolveIdleIssues(customerId), CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, [enabled, customerId]);
}
